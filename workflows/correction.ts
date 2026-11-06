import { isDeepStrictEqual } from "node:util"
import { correctionConfiguration } from "@/workflows/correction-config"
//* Libraries imports
import { FatalError, getStepMetadata } from "workflow"

//* Services imports
import { openAI } from "@/services/ai"
import { correctionService } from "@/services/correction"
import { rubricService } from "@/services/rubric"
import { textService } from "@/services/text"
import { checkReadingHealth } from "@/services/reading-alerts"
import type { CorrectionStatus, ReadingFailureStage } from "@/database/schema"
import type { StructuredReading } from "@/lib/reading-contract"
import { renderReadingMarkdown } from "@/lib/reading-markdown"
import { logEvent } from "@/lib/telemetry"

//* Local imports
import {
  gradeReading,
  ReadingRejectedError,
  requestCorrection,
  type CallModel,
  type GradingCall,
} from "@/workflows/correction-grading"
import { readSavedCorrection } from "@/workflows/correction-stand-in"

type GradingSource = {
  themeTitle: string
  themeDescription: string
  textContent: string
  rubricTitle: string
  rubricContent: string
}

const VALIDATION_FAILURE = "Reading rejected by validation"

type GradedCorrection = {
  textId: string
  textContent: string
  rubricId: string
  rubricContent: string
  content: string
  score: string
  structuredResult: StructuredReading
  status: CorrectionStatus
}

export async function correctText(textId: string, reservedId?: string) {
  "use workflow"

  let correctionId = reservedId
  let stage: ReadingFailureStage = "admission"
  try {
    const textToCorrect = await getText(textId)
    const themeRubric = await getRubric(textToCorrect.themeId)
    const createdId =
      correctionId ??
      (await createEmptyCorrection({
        textId: textToCorrect.id,
        rubricId: themeRubric.id,
      }))
    if (!createdId) throw new FatalError("Correction not created")
    correctionId = createdId
    await assertActiveAttempt(
      correctionId,
      textToCorrect.content,
      themeRubric.id,
      themeRubric.content
    )
    await updateCorrectionStatus(correctionId, "IN_PROGRESS")

    stage = "grading"
    const graded = await gradeText(correctionId, {
      themeTitle: textToCorrect.themeTitle,
      themeDescription: textToCorrect.themeDescription,
      textContent: textToCorrect.content,
      rubricTitle: themeRubric.title,
      rubricContent: themeRubric.content,
    })

    stage = "saving"
    const saved = await updateCorrection(correctionId, {
      textId: textToCorrect.id,
      textContent: textToCorrect.content,
      rubricId: themeRubric.id,
      rubricContent: themeRubric.content,
      content: graded.content,
      score: graded.score,
      structuredResult: graded.structuredResult,
      status: "COMPLETED",
    })
    await reportCompleted(saved.correctionId)
    return saved
  } catch (error) {
    if (correctionId) {
      const reason = error instanceof Error ? error.message : String(error)
      await markFailed(correctionId, {
        stage: reason.startsWith(VALIDATION_FAILURE) ? "validation" : stage,
        reason,
      })
    }
    throw error
  }
}

async function assertActiveAttempt(
  id: string,
  textContent: string,
  rubricId: string,
  rubricContent: string
) {
  "use step"
  const attempt = await correctionService.findAttemptSnapshot(id)
  if (
    !attempt ||
    !["PENDING", "IN_PROGRESS"].includes(attempt.status) ||
    attempt.textContent !== textContent ||
    attempt.rubricId !== rubricId ||
    attempt.rubricContent !== rubricContent
  ) {
    throw new FatalError("Reading is no longer active")
  }
}

type CreateEmptyCorrectionValues = {
  textId: string
  rubricId: string
}

export async function createEmptyCorrection(
  values: CreateEmptyCorrectionValues
): Promise<string | null> {
  "use step"

  const { stepId } = getStepMetadata()
  const [currentText, currentRubric] = await Promise.all([
    textService.findActiveTextContent(values.textId),
    rubricService.findActiveRubricContent(values.rubricId),
  ])

  if (!currentText || !currentRubric) {
    return null
  }

  const inserted = await correctionService.insertCorrection({
    id: stepId,
    ...correctionConfiguration(),
    content: "",
    score: "0.00",
    textContent: currentText.content,
    rubricId: values.rubricId,
    rubricContent: currentRubric.content,
    textId: values.textId,
    status: "PENDING",
  })

  return inserted?.id ?? null
}

async function updateCorrectionStatus(id: string, status: CorrectionStatus) {
  "use step"

  await correctionService.updateCorrectionStatus(id, status)
  if (status === "IN_PROGRESS")
    logEvent("info", "reading.started", { correctionId: id })
}

//* Records where the attempt stopped, logs it with its configuration and checks the failure rate.
async function markFailed(
  id: string,
  failure: { stage: ReadingFailureStage; reason: string }
) {
  "use step"

  await correctionService.updateCorrectionStatus(id, "FAILED", failure)
  const attempt = await correctionService.findAttemptSnapshot(id)
  logEvent("error", "reading.failed", {
    correctionId: id,
    stage: attempt?.failureStage ?? failure.stage,
    reason: failure.reason,
    modelId: attempt?.modelId,
    promptVersion: attempt?.promptVersion,
  })
  await checkReadingHealth()
}

async function reportCompleted(id: string) {
  "use step"

  const attempt = await correctionService.findAttemptSnapshot(id)
  logEvent("info", "reading.completed", {
    correctionId: id,
    modelId: attempt?.modelId,
    promptVersion: attempt?.promptVersion,
    queueMs:
      attempt?.startedAt && attempt.createdAt
        ? attempt.startedAt.getTime() - attempt.createdAt.getTime()
        : null,
    timeToReadingMs:
      attempt?.finishedAt && attempt.createdAt
        ? attempt.finishedAt.getTime() - attempt.createdAt.getTime()
        : null,
  })
  await checkReadingHealth()
}

export async function getText(textId: string) {
  "use step"

  const result = await textService.findActiveTextWithTheme(textId)

  if (!result) {
    throw new FatalError("Text not found")
  }

  return result
}

export async function getRubric(themeId: string) {
  "use step"

  const result = await rubricService.findActiveRubricForTheme(themeId)

  if (!result) {
    throw new FatalError("Rubric not found")
  }

  return result
}

type AttemptSnapshot = Awaited<
  ReturnType<typeof correctionService.findAttemptSnapshot>
>

//* The attempt must still carry this deployment's configuration and the source it was reserved with.
function frozenCriteria(attempt: AttemptSnapshot, source: GradingSource) {
  const config = correctionConfiguration()
  if (
    !attempt ||
    attempt.modelId !== config.modelId ||
    attempt.promptVersion !== config.promptVersion ||
    !isDeepStrictEqual(attempt.promptConfig, config.promptConfig)
  )
    throw new FatalError("Reading configuration changed before grading")

  if (
    !isDeepStrictEqual(attempt.source, {
      themeTitle: source.themeTitle,
      themeDescription: source.themeDescription,
      rubricTitle: source.rubricTitle,
    })
  )
    throw new FatalError("Reading source changed before grading")

  //* The structured reading needs the frozen criteria: they define coverage, maxima and bands.
  if (!attempt.rubricCriteria)
    throw new FatalError("Reading has no frozen rubric criteria")

  return { attempt, criteria: attempt.rubricCriteria }
}

//* Outside production, the end-to-end stand-in replaces OpenAI and still goes through validation.
function modelCaller(): CallModel {
  const saved = readSavedCorrection()
  return saved
    ? async () => ({ output: saved, usage: null })
    : (gradingSource, rejection) =>
        requestCorrection(openAI, gradingSource, rejection)
}

function callRecorder(correctionId: string) {
  const config = correctionConfiguration()

  return async (call: GradingCall) => {
    await correctionService.recordCall(correctionId, call, config)
    logEvent(call.outcome === "accepted" ? "info" : "warn", "reading.call", {
      correctionId,
      sequence: call.sequence,
      outcome: call.outcome,
      rejection: call.rejection,
      detail: call.detail,
      discardedQuotes: call.discardedQuotes,
      durationMs: call.durationMs,
      modelId: config.modelId,
      promptVersion: config.promptVersion,
    })
  }
}

async function gradeText(correctionId: string, source: GradingSource) {
  "use step"

  const { attempt, criteria } = frozenCriteria(
    await correctionService.findAttemptSnapshot(correctionId),
    source
  )

  try {
    const graded = await gradeReading(
      modelCaller(),
      { ...source, textContent: attempt.textContent, criteria },
      callRecorder(correctionId)
    )

    return {
      content: renderReadingMarkdown(graded.reading, criteria),
      score: graded.score,
      structuredResult: graded.reading,
    }
  } catch (error) {
    //* A second rejection is final; retrying the step would only pay for more of the same.
    if (error instanceof ReadingRejectedError)
      throw new FatalError(
        `${VALIDATION_FAILURE}: ${error.rejection.code} (${error.rejection.detail})`
      )
    throw error
  }
}

async function updateCorrection(
  correctionId: string,
  graded: GradedCorrection
) {
  "use step"

  const currentText = await textService.findActiveTextContent(graded.textId)

  if (!currentText) {
    throw new FatalError("Text not found")
  }

  if (currentText.content !== graded.textContent) {
    throw new FatalError("Text changed before the correction was saved")
  }

  const currentRubric = await rubricService.findActiveRubricContent(
    graded.rubricId
  )

  if (!currentRubric) {
    throw new FatalError("Rubric not found")
  }

  if (currentRubric.content !== graded.rubricContent) {
    throw new FatalError("Rubric changed before the correction was saved")
  }

  const updated = await correctionService.updateCorrection(correctionId, {
    content: graded.content,
    score: graded.score,
    structuredResult: graded.structuredResult,
    textContent: currentText.content,
    rubricId: graded.rubricId,
    rubricContent: currentRubric.content,
    textId: graded.textId,
    status: graded.status,
  })

  if (updated) {
    return {
      correctionId: updated.id,
      score: updated.score,
    }
  }

  const existing = await correctionService.findCorrectionById(correctionId)

  if (!existing) {
    throw new FatalError("Correction was not saved")
  }

  return {
    correctionId: existing.id,
    score: existing.score,
  }
}
