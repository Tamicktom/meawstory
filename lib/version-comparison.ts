//* Libraries imports
import { z } from "zod"

//* Local imports
import { locateQuote } from "@/lib/reading-quotes"
import {
  BAND_IDS,
  type BandId,
  type RubricCriteria,
  type StructuredReading,
} from "@/lib/reading-contract"

const CRITERION_MOVEMENTS = ["improved", "regressed", "unchanged"] as const
export type CriterionMovement = (typeof CRITERION_MOVEMENTS)[number]

const BAND_RANK: Record<BandId, number> = {
  missing: 0,
  thin: 1,
  working: 2,
  strong: 3,
}

const comparedCriterionSchema = z.object({
  id: z.string().trim().min(1),
  previousScore: z.number().nonnegative(),
  score: z.number().nonnegative(),
  previousBand: z.enum(BAND_IDS),
  band: z.enum(BAND_IDS),
  movement: z.enum(CRITERION_MOVEMENTS),
})

const judgedFocusSchema = z.object({
  status: z.enum(["met", "unmet"]),
  answer: z.string().trim().min(1).max(400),
  evidence: z.string().trim().min(1),
})

const focusSchema = z.union([
  judgedFocusSchema,
  z.object({ status: z.literal("unchanged") }),
  z.object({ status: z.literal("unavailable") }),
])

export const versionComparisonSchema = z
  .object({
    version: z.literal(1),
    previousCorrectionId: z.string().trim().min(1),
    textUnchanged: z.boolean(),
    focus: focusSchema,
    criteria: z.array(comparedCriterionSchema),
  })
  .superRefine((comparison, ctx) => {
    const unchangedFocus = comparison.focus.status === "unchanged"
    if (comparison.textUnchanged !== unchangedFocus)
      ctx.addIssue({
        code: "custom",
        message: "Only an unchanged text skips the focus judgment.",
      })
    if (
      comparison.textUnchanged &&
      comparison.criteria.some((criterion) => criterion.movement !== "unchanged")
    )
      ctx.addIssue({
        code: "custom",
        message: "An unchanged text is not an improvement or a regression.",
      })
  })

export type ComparedCriterion = z.infer<typeof comparedCriterionSchema>
export type FocusJudgment = z.infer<typeof focusSchema>
export type VersionComparison = z.infer<typeof versionComparisonSchema>

function hundredths(value: number) {
  return Math.round(value * 100)
}

function movementFor(
  before: StructuredReading["criteria"][number],
  after: StructuredReading["criteria"][number],
  textUnchanged: boolean
): CriterionMovement {
  if (textUnchanged) return "unchanged"
  const delta = hundredths(after.score) - hundredths(before.score)
  const bandDropped = BAND_RANK[after.band] < BAND_RANK[before.band]
  if (delta > 0 && !bandDropped) return "improved"
  if (delta < 0 || bandDropped) return "regressed"
  return "unchanged"
}

//* Score and band changes come from the two frozen readings. An identical text
//* never counts as a gain or a loss, even when the two scores differ.
export function compareCriteria(
  previous: StructuredReading,
  next: StructuredReading,
  criteria: RubricCriteria,
  textUnchanged: boolean
): ComparedCriterion[] {
  return criteria.flatMap((criterion) => {
    const before = previous.criteria.find((entry) => entry.id === criterion.id)
    const after = next.criteria.find((entry) => entry.id === criterion.id)
    if (!before || !after) return []

    return [
      {
        id: criterion.id,
        previousScore: before.score,
        score: after.score,
        previousBand: before.band,
        band: after.band,
        movement: movementFor(before, after, textUnchanged),
      },
    ]
  })
}

export function assembleVersionComparison(input: {
  previousCorrectionId: string
  previous: StructuredReading
  next: StructuredReading
  criteria: RubricCriteria
  previousText: string
  nextText: string
  focus: FocusJudgment
}): VersionComparison {
  const textUnchanged = input.previousText === input.nextText
  const comparison = {
    version: 1 as const,
    previousCorrectionId: input.previousCorrectionId,
    textUnchanged,
    focus: textUnchanged ? ({ status: "unchanged" } as const) : input.focus,
    criteria: compareCriteria(
      input.previous,
      input.next,
      input.criteria,
      textUnchanged
    ),
  }

  return assertVersionComparison(comparison, input.nextText)
}

//* The stored quotation is the new version's own substring, same rule as a reading.
export function assertVersionComparison(
  value: VersionComparison,
  nextScene: string
): VersionComparison {
  const comparison = versionComparisonSchema.parse(value)
  if (comparison.focus.status !== "met" && comparison.focus.status !== "unmet")
    return comparison

  const evidence = locateQuote(comparison.focus.evidence, nextScene)
  if (evidence !== comparison.focus.evidence)
    throw new Error("Comparison evidence must be a literal stretch of the new version.")

  return comparison
}
