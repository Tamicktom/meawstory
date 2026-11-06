//* Libraries imports
import { generateText, Output } from "ai"
import type { OpenAIProvider } from "@ai-sdk/openai"
import {
  CORRECTION_MODEL_ID,
  CORRECTION_PROMPT_CONFIG,
  correctionOutputSchema,
} from "@/workflows/correction-config"
export {
  CORRECTION_MODEL_ID,
  correctionInstructions,
  correctionOutputSchema,
} from "@/workflows/correction-config"

export type CorrectionSource = {
  themeTitle: string
  themeDescription: string
  textContent: string
  rubricTitle: string
  rubricContent: string
}

export function buildCorrectionPrompt(source: CorrectionSource): string {
  return CORRECTION_PROMPT_CONFIG.template
    .map((line) => {
      const key = line.slice(1, -1) as keyof CorrectionSource
      return line.startsWith("{") ? source[key] : line
    })
    .join("\n")
}

export function formatCorrectionScore(score: number): string {
  if (!Number.isFinite(score)) {
    throw new Error("Correction score must be a finite number.")
  }

  const rounded = Number(score.toFixed(2))

  if (rounded < 0 || rounded > 1000) {
    throw new Error("Correction score is outside 0 through 1000.")
  }

  return rounded.toFixed(2)
}

export async function requestCorrection(
  provider: OpenAIProvider,
  source: CorrectionSource
) {
  const result = await generateText({
    model: provider(CORRECTION_MODEL_ID),
    instructions: CORRECTION_PROMPT_CONFIG.instructions,
    prompt: buildCorrectionPrompt(source),
    output: Output.object({
      schema: correctionOutputSchema,
      name: CORRECTION_PROMPT_CONFIG.outputName,
      description: CORRECTION_PROMPT_CONFIG.outputDescription,
    }),
    //* Our public privacy text relies on this: see docs/v2/fase-0-base/0A-3.
    providerOptions: CORRECTION_PROMPT_CONFIG.providerOptions,
  })

  return { output: result.output, usage: result.usage }
}
