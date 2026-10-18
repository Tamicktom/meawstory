//* Libraries imports
import { z } from "zod"

export const correctionOutputSchema = z.object({
  content: z.string().trim().min(1),
  score: z.number().min(0).max(1000),
})

export type CorrectionSource = {
  themeTitle: string
  themeDescription: string
  textContent: string
  rubricTitle: string
  rubricContent: string
}

export const correctionInstructions = [
  "Grade the student text against the rubric in the prompt.",
  "Follow that rubric. Do not add criteria.",
  "Write content as Portuguese markdown, in the shape the rubric asks for: a short opening, a score for each criterion with a short quotation, a line in the form Nota: N, and one concrete revision the student can try next.",
  "Do not rewrite the scene.",
  "score is the sum of the criterion scores. It is a number from 0 through 1000 inclusive and it matches the Nota line.",
].join("\n")

export function buildCorrectionPrompt(source: CorrectionSource): string {
  return [
    "## Tema",
    source.themeTitle,
    "",
    source.themeDescription,
    "",
    "## Texto",
    source.textContent,
    "",
    "## Rubrica",
    source.rubricTitle,
    "",
    source.rubricContent,
  ].join("\n")
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
