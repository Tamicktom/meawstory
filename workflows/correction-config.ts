import { createHash } from "node:crypto"
import { z } from "zod"

//* The reference-set baseline (evaluation/) calls the same function, so it measures this exact setup.
export const CORRECTION_MODEL_ID = "gpt-5-mini"

export const correctionOutputSchema = z.object({
  content: z.string().trim().min(1),
  score: z.number().min(0).max(1000),
})

export const correctionInstructions = [
  "Grade the student text against the rubric in the prompt.",
  "Follow that rubric. Do not add criteria.",
  "Write content as Portuguese markdown, in the shape the rubric asks for: a short opening, a score for each criterion with a short quotation, a line in the form Nota: N, and one concrete revision the student can try next.",
  "Do not rewrite the scene.",
  "score is the sum of the criterion scores. It is a number from 0 through 1000 inclusive and it matches the Nota line.",
].join("\n")

export const CORRECTION_PROMPT_CONFIG = {
  instructions: correctionInstructions,
  template: [
    "## Tema",
    "{themeTitle}",
    "",
    "{themeDescription}",
    "",
    "## Texto",
    "{textContent}",
    "",
    "## Rubrica",
    "{rubricTitle}",
    "",
    "{rubricContent}",
  ],
  outputSchema: z.toJSONSchema(correctionOutputSchema),
  outputName: "correction",
  outputDescription: "Rubric-based correction of one student text.",
  providerOptions: { openai: { store: false as const } },
}

export const CORRECTION_PROMPT_VERSION = `sha256:${createHash("sha256").update(JSON.stringify(CORRECTION_PROMPT_CONFIG)).digest("hex")}`
export function correctionConfiguration() {
  return {
    modelId: CORRECTION_MODEL_ID,
    promptVersion: CORRECTION_PROMPT_VERSION,
    promptConfig: CORRECTION_PROMPT_CONFIG,
  }
}
