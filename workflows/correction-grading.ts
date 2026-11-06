//* Libraries imports
import {
  generateText,
  NoObjectGeneratedError,
  Output,
  type LanguageModelUsage,
} from "ai"
import type { OpenAIProvider } from "@ai-sdk/openai"

//* Local imports
import {
  assembleReading,
  type AssembledReading,
  type ReadingDraft,
  type RejectedReading,
  type RejectionCode,
} from "@/lib/reading-assembly"
import type { RubricCriteria } from "@/lib/reading-contract"
import type { CallUsage } from "@/lib/model-pricing"
import {
  CORRECTION_MODEL_ID,
  CORRECTION_PROMPT_CONFIG,
  correctionOutputSchema,
  type CorrectionModelOutput,
} from "@/workflows/correction-config"
export {
  CORRECTION_MODEL_ID,
  correctionInstructions,
} from "@/workflows/correction-config"

export type CorrectionSource = {
  themeTitle: string
  themeDescription: string
  textContent: string
  rubricTitle: string
  rubricContent: string
  criteria: RubricCriteria
}

//* Scene text cannot open or close the prompt's own delimiters (1C-4).
const DELIMITER = /<(\/?)\s*(tema|rubrica|criterios|cena|aviso-do-servidor)\b/gi

function neutralizeDelimiters(value: string): string {
  return value.replace(DELIMITER, "‹$1$2")
}

//* The rubric's closing section describes the old markdown output; the schema replaces it.
export function rubricForPrompt(content: string): string {
  const index = content.indexOf(CORRECTION_PROMPT_CONFIG.rubricOutputSection)

  return (index === -1 ? content : content.slice(0, index)).trimEnd()
}

function criteriaList(criteria: RubricCriteria): string {
  return criteria
    .map(
      (criterion) =>
        `- ${criterion.id}: ${criterion.name} (0 a ${criterion.maxScore}; faixas ${criterion.bands.map((band) => `${band.min}-${band.max}`).join(", ")})`
    )
    .join("\n")
}

export function buildCorrectionPrompt(
  source: CorrectionSource,
  rejection?: Pick<RejectedReading, "code" | "detail">
): string {
  const values: Record<string, string> = {
    themeTitle: source.themeTitle,
    themeDescription: source.themeDescription,
    rubricTitle: source.rubricTitle,
    rubricContent: rubricForPrompt(source.rubricContent),
    criteriaList: criteriaList(source.criteria),
    textContent: neutralizeDelimiters(source.textContent),
  }
  const lines = CORRECTION_PROMPT_CONFIG.template.map((line) =>
    line.startsWith("{") ? values[line.slice(1, -1)] : line
  )

  if (rejection) {
    lines.push(
      ...CORRECTION_PROMPT_CONFIG.retryNotice.map((line) =>
        line.replace("{reason}", `${rejection.code}, ${rejection.detail}`)
      )
    )
  }

  return lines.join("\n")
}

export function recordUsage(usage: LanguageModelUsage): CallUsage {
  return {
    inputTokens: usage.inputTokens ?? null,
    cachedInputTokens: usage.inputTokenDetails?.cacheReadTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    reasoningTokens: usage.outputTokenDetails?.reasoningTokens ?? null,
  }
}

export type ModelReply = {
  //* null when the model answered but the answer could not be read as the schema.
  output: CorrectionModelOutput | null
  usage: CallUsage | null
}

//* One model call. The workflow and `bun run eval:baseline` both go through it.
export async function requestCorrection(
  provider: OpenAIProvider,
  source: CorrectionSource,
  rejection?: Pick<RejectedReading, "code" | "detail">
): Promise<ModelReply> {
  try {
    const result = await generateText({
      model: provider(CORRECTION_MODEL_ID),
      instructions: CORRECTION_PROMPT_CONFIG.instructions,
      prompt: buildCorrectionPrompt(source, rejection),
      output: Output.object({
        schema: correctionOutputSchema,
        name: CORRECTION_PROMPT_CONFIG.outputName,
        description: CORRECTION_PROMPT_CONFIG.outputDescription,
      }),
      //* Our public privacy text relies on this: see docs/v2/fase-0-base/0A-3.
      providerOptions: CORRECTION_PROMPT_CONFIG.providerOptions,
    })

    return { output: result.output, usage: recordUsage(result.usage) }
  } catch (error) {
    //* The model was paid for, so the call is still a measured attempt.
    if (NoObjectGeneratedError.isInstance(error))
      return {
        output: null,
        usage: error.usage ? recordUsage(error.usage) : null,
      }
    throw error
  }
}

export type CallOutcome = "accepted" | "rejected" | "error"

export type GradingCall = {
  sequence: number
  outcome: CallOutcome
  rejection: RejectionCode | null
  detail: string | null
  discardedQuotes: number
  usage: CallUsage | null
  startedAt: Date
  durationMs: number
}

export type CallModel = (
  source: CorrectionSource,
  rejection?: Pick<RejectedReading, "code" | "detail">
) => Promise<ModelReply>

export class ReadingRejectedError extends Error {
  constructor(public rejection: RejectedReading) {
    super(
      `Reading rejected by validation: ${rejection.code} (${rejection.detail})`
    )
  }
}

type OnCall = (call: GradingCall) => Promise<void> | void

function judge(
  reply: ModelReply,
  source: CorrectionSource
): AssembledReading | RejectedReading {
  return reply.output
    ? assembleReading(
        reply.output as ReadingDraft,
        source.criteria,
        source.textContent
      )
    : {
        ok: false,
        code: "unparseable",
        detail: "the response did not match the schema",
      }
}

function callRecord(
  sequence: number,
  startedAt: Date,
  result: AssembledReading | RejectedReading,
  usage: CallUsage | null
): GradingCall {
  const durationMs = Date.now() - startedAt.getTime()

  return result.ok
    ? {
        sequence,
        outcome: "accepted",
        rejection: null,
        detail: null,
        discardedQuotes: result.discardedQuotes,
        usage,
        startedAt,
        durationMs,
      }
    : {
        sequence,
        outcome: "rejected",
        rejection: result.code,
        detail: result.detail,
        discardedQuotes: 0,
        usage,
        startedAt,
        durationMs,
      }
}

//* One request and its verdict. A provider error is recorded, then rethrown for the step to retry.
async function attempt(
  callModel: CallModel,
  source: CorrectionSource,
  sequence: number,
  rejection: RejectedReading | undefined,
  onCall: OnCall
) {
  const startedAt = new Date()
  let reply: ModelReply

  try {
    reply = await callModel(source, rejection)
  } catch (error) {
    await onCall({
      sequence,
      outcome: "error",
      rejection: null,
      detail: error instanceof Error ? error.message : String(error),
      discardedQuotes: 0,
      usage: null,
      startedAt,
      durationMs: Date.now() - startedAt.getTime(),
    })
    throw error
  }

  const result = judge(reply, source)
  await onCall(callRecord(sequence, startedAt, result, reply.usage))
  return result
}

//* Asks for a reading and validates it on the server, retrying once with the reason (1C-2, 1C-3).
//* Every call, including rejected and failed ones, is reported through onCall so its cost is kept.
export async function gradeReading(
  callModel: CallModel,
  source: CorrectionSource,
  onCall: OnCall
): Promise<AssembledReading> {
  let rejection: RejectedReading | undefined

  for (
    let sequence = 1;
    sequence <= CORRECTION_PROMPT_CONFIG.validationAttempts;
    sequence += 1
  ) {
    const result = await attempt(callModel, source, sequence, rejection, onCall)
    if (result.ok) return result
    rejection = result
  }

  throw new ReadingRejectedError(rejection!)
}
