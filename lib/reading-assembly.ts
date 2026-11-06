//* Turns what the model returned into the stored reading, or explains why it cannot be stored.
//* The server, not the model, decides the bands and the total (1C-2) and which quotes count (1C-3).

//* Local imports
import {
  bandForCriterionScore,
  MAX_CRITERION_EVIDENCE,
  validateStructuredReading,
  type RubricCriteria,
  type StructuredReading,
} from "@/lib/reading-contract"
import { locateQuote } from "@/lib/reading-quotes"

//* The shape the model is asked for. Every field may be wrong; nothing here is trusted.
export type ReadingDraft = {
  criteria: Array<{
    id: string
    score: number
    strengths: string
    gaps: string
    evidence: string[]
  }>
  highlight: { description: string; evidence: string }
  opening: string
  revision: string
}

export type RejectionCode =
  | "unparseable"
  | "criteria_mismatch"
  | "score_out_of_range"
  | "missing_text"
  | "missing_focus"
  | "missing_evidence"

export type AssembledReading = {
  ok: true
  reading: StructuredReading
  //* The sum of the criterion scores, as the database stores it: "640.00".
  score: string
  //* Quotes the model gave that are not in the scene and were left out.
  discardedQuotes: number
}

export type RejectedReading = {
  ok: false
  code: RejectionCode
  //* Internal: for logs and the retry, never for the writing UI.
  detail: string
}

function blank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === ""
}

function reject(code: RejectionCode, detail: string): RejectedReading {
  return { ok: false, code, detail }
}

function toHundredths(score: number): number {
  return Math.round(score * 100)
}

function formatHundredths(hundredths: number): string {
  return (hundredths / 100).toFixed(2)
}

function textRejection(draft: ReadingDraft): RejectedReading | null {
  if (blank(draft.revision)) return reject("missing_focus", "revision is empty")
  if (blank(draft.opening)) return reject("missing_text", "opening is empty")
  if (blank(draft.highlight?.description))
    return reject("missing_text", "highlight description is empty")
  return null
}

function coverageRejection(
  entries: ReadingDraft["criteria"],
  criteria: RubricCriteria
): RejectedReading | null {
  const expected = criteria.map((criterion) => criterion.id)
  const received = entries.map((entry) => entry.id)
  const expectedIds = new Set(expected)
  const receivedIds = new Set(received)
  const missing = expected.filter((id) => !receivedIds.has(id))
  const unknown = received.filter((id) => !expectedIds.has(id))
  const repeated = receivedIds.size !== received.length

  if (missing.length === 0 && unknown.length === 0 && !repeated) return null

  return reject(
    "criteria_mismatch",
    `expected ${expected.join(", ")}; missing ${missing.join(", ") || "none"}; unknown ${unknown.join(", ") || "none"}; repeated ${repeated ? "yes" : "no"}`
  )
}

function scoreInRange(score: unknown, maxScore: number): score is number {
  if (typeof score !== "number" || !Number.isFinite(score)) return false
  const hundredths = toHundredths(score)
  return hundredths >= 0 && hundredths <= maxScore * 100
}

//* Keeps up to two distinct quotes found in the scene and counts the ones that are not.
function keepQuotes(offered: unknown, scene: string) {
  const quotes = Array.isArray(offered) ? offered : []
  const kept = new Set<string>()
  let discarded = 0

  for (const quote of quotes) {
    const located = typeof quote === "string" ? locateQuote(quote, scene) : null

    if (!located) discarded += 1
    else if (kept.size < MAX_CRITERION_EVIDENCE) kept.add(located)
  }

  return { found: [...kept], discarded }
}

type CriterionOutcome =
  | {
      ok: true
      result: StructuredReading["criteria"][number]
      discarded: number
    }
  | RejectedReading

function assembleCriterion(
  entry: ReadingDraft["criteria"][number],
  criterion: RubricCriteria[number],
  scene: string
): CriterionOutcome {
  if (!scoreInRange(entry.score, criterion.maxScore))
    return reject(
      "score_out_of_range",
      `${criterion.id} scored ${entry.score}; it goes from 0 to ${criterion.maxScore}`
    )

  if (blank(entry.strengths) || blank(entry.gaps))
    return reject("missing_text", `${criterion.id} has no strengths or gaps`)

  const { found, discarded } = keepQuotes(entry.evidence, scene)

  if (found.length === 0)
    return reject(
      "missing_evidence",
      `${criterion.id} has no quotation that is a literal stretch of the scene`
    )

  const score = toHundredths(entry.score) / 100

  return {
    ok: true,
    discarded,
    result: {
      id: criterion.id,
      score,
      band: bandForCriterionScore(score, criterion),
      evidence: found,
      strengths: entry.strengths.trim(),
      gaps: entry.gaps.trim(),
    },
  }
}

export function assembleReading(
  draft: ReadingDraft,
  criteria: RubricCriteria,
  scene: string
): AssembledReading | RejectedReading {
  const entries = Array.isArray(draft.criteria) ? draft.criteria : []
  const early = textRejection(draft) ?? coverageRejection(entries, criteria)
  if (early) return early

  const highlightQuote = locateQuote(draft.highlight.evidence ?? "", scene)
  if (!highlightQuote)
    return reject(
      "missing_evidence",
      "the highlight quotation is not a literal stretch of the scene"
    )

  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))
  const results: StructuredReading["criteria"] = []
  let discardedQuotes = 0

  //* The stored order is the rubric's, whatever order the model used.
  for (const criterion of criteria) {
    const outcome = assembleCriterion(
      entriesById.get(criterion.id)!,
      criterion,
      scene
    )
    if (!outcome.ok) return outcome
    results.push(outcome.result)
    discardedQuotes += outcome.discarded
  }

  const reading: StructuredReading = {
    version: 1,
    opening: draft.opening.trim(),
    highlight: {
      description: draft.highlight.description.trim(),
      evidence: highlightQuote,
    },
    criteria: results,
    revision: draft.revision.trim(),
  }
  const total = results.reduce(
    (sum, entry) => sum + toHundredths(entry.score),
    0
  )
  const score = formatHundredths(total)

  //* The same contract the service and the database enforce, checked before anything is written.
  validateStructuredReading(reading, criteria, score)

  return { ok: true, reading, score, discardedQuotes }
}
