import { z } from "zod"

const genreSchema = z.enum([
  "action",
  "fight",
  "romance",
  "dialogue",
  "suspense",
  "turning_point",
])
export type Genre = z.infer<typeof genreSchema>
export const GENRE_LABEL = {
  action: "Ação",
  fight: "Luta",
  romance: "Romance",
  dialogue: "Diálogo",
  suspense: "Suspense",
  turning_point: "Virada",
} as const
export const BAND_IDS = ["missing", "thin", "working", "strong"] as const
const nonempty = z.string().trim().min(1)
const bandSchema = z.object({
  id: z.enum(BAND_IDS),
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  description: nonempty,
})
const criterionSchema = z
  .object({
    id: nonempty,
    name: nonempty,
    kind: z.enum(["objective", "subjective"]),
    publicDescription: nonempty,
    maxScore: z.number().int().positive(),
    bands: z.array(bandSchema).length(4),
  })
  .superRefine((criterion, ctx) => {
    let next = 0
    criterion.bands.forEach((band, index) => {
      if (
        band.id !== BAND_IDS[index] ||
        band.min !== next ||
        band.max < band.min
      )
        ctx.addIssue({
          code: "custom",
          message: "Bands must be ordered and contiguous.",
        })
      next = band.max + 1
    })
    if (next !== criterion.maxScore + 1)
      ctx.addIssue({
        code: "custom",
        message: "Bands must cover the criterion maximum.",
      })
  })
export const rubricCriteriaSchema = z
  .array(criterionSchema)
  .length(5)
  .superRefine((criteria, ctx) => {
    if (
      criteria.reduce((sum, c) => sum + c.maxScore, 0) !== 1000 ||
      new Set(criteria.map((c) => c.id)).size !== 5
    )
      ctx.addIssue({
        code: "custom",
        message: "Five distinct criteria must total 1000 points.",
      })
  })
export const briefingSchema = z.object({
  situation: nonempty,
  alreadyTrue: z.array(nonempty).min(1),
  mustInclude: z.array(nonempty).min(1),
  youDecide: nonempty,
  doNotPenalize: z.array(nonempty).min(1),
})
const structuredReadingSchema = z.object({
  version: z.literal(1),
  opening: nonempty,
  highlight: z.object({ description: nonempty, evidence: nonempty }),
  criteria: z
    .array(
      z.object({
        id: nonempty,
        score: z.number().nonnegative().multipleOf(0.01),
        band: z.enum(BAND_IDS),
        evidence: z.array(nonempty),
        strengths: nonempty,
        gaps: nonempty,
      })
    )
    .length(5),
  revision: nonempty,
})
export type RubricCriteria = z.infer<typeof rubricCriteriaSchema>
export type Briefing = z.infer<typeof briefingSchema>
export type StructuredReading = z.infer<typeof structuredReadingSchema>
export type ReadingSourceSnapshot = {
  themeTitle: string
  themeDescription: string
  rubricTitle: string
}
export type PromptConfig = {
  instructions: string
  template: readonly string[]
  outputSchema: unknown
  outputName: string
  outputDescription: string
  providerOptions: { openai: { store: false } }
}

export function validateStructuredReading(
  result: StructuredReading,
  criteria: RubricCriteria,
  total: string
) {
  structuredReadingSchema.parse(result)
  rubricCriteriaSchema.parse(criteria)
  const ids = new Set(result.criteria.map((c) => c.id))
  if (ids.size !== 5) throw new Error("Duplicate result criterion.")
  for (const entry of result.criteria) {
    const criterion = criteria.find((c) => c.id === entry.id)
    const band = criterion?.bands.find((b) => b.id === entry.band)
    if (
      !criterion ||
      !band ||
      entry.score > criterion.maxScore ||
      entry.score < 0 ||
      (band.id !== "missing" && entry.score <= band.min - 1) ||
      entry.score > band.max
    )
      throw new Error("Result does not match frozen criterion and band.")
  }
  const sum = result.criteria.reduce(
    (value, c) => value + Math.round(c.score * 100),
    0
  )
  if (sum !== Math.round(Number(total) * 100))
    throw new Error("Result total does not match score.")
}
