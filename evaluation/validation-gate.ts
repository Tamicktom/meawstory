import { bandDistance, bandForScore } from "@/evaluation/bands"
import type { BaselineRun, RecordedReading } from "@/evaluation/baseline-run"
import { currentScores, type HumanScore } from "@/evaluation/human-evaluations"
import {
  median,
  parseCriterionScores,
  summarize,
} from "@/evaluation/reading-metrics"
import {
  measuredSourcesMatch,
  type ReferenceSet,
} from "@/evaluation/reference-set"
import {
  validateStructuredReading,
  type StructuredReading,
} from "@/lib/reading-contract"

function successful(run: BaselineRun, id: string) {
  return run.readings.filter(
    (r): r is RecordedReading & { score: number } =>
      r.caseId === id && r.ok && r.score !== null && Number.isFinite(r.score)
  )
}

// Compare only identical scene, exercise and rubric snapshots. Set version alone is insufficient.
export function comparableCaseIds(before: BaselineRun, after: BaselineRun) {
  return before.cases.flatMap((a) => {
    const b = after.cases.find((entry) => entry.id === a.id)
    return b &&
      a.textSha256 === b.textSha256 &&
      a.themeSha256 === b.themeSha256 &&
      a.rubricSha256 === b.rubricSha256
      ? [a.id]
      : []
  })
}

export function variation(run: BaselineRun, ids: string[]) {
  const samples = ids.flatMap((id) => {
    const scores = successful(run, id).map((r) => r.score)
    const summary = summarize(scores)
    return summary && summary.n >= 2 ? [{ scores, summary }] : []
  })
  return {
    cases: samples.length,
    medianSd: median(samples.map((s) => s.summary.sd)),
    medianRange: median(samples.map((s) => s.summary.range)),
    stableBands: samples.filter(
      (s) =>
        new Set(s.scores.map((score) => bandForScore(score, 1000))).size === 1
    ).length,
  }
}

export function criterionVariation(
  run: BaselineRun,
  set: ReferenceSet,
  ids: string[]
) {
  let pairs = 0
  let split = 0
  let distant = 0
  const wanted = new Set(ids)
  for (const item of set.cases.filter((c) => wanted.has(c.id))) {
    const readings = successful(run, item.id)
    for (const criterion of item.rubric.criteria) {
      const scores = readings.flatMap((r) => {
        const score = r.structured
          ? r.structured.criteria.find((c) => c.id === criterion.id)?.score
          : parseCriterionScores(r.content ?? "", item.rubric.definition)[
              criterion.name
            ]
        return typeof score === "number" && Number.isFinite(score)
          ? [score]
          : []
      })
      if (scores.length < 2) continue
      pairs++
      const bands = scores.map((s) => bandForScore(s, criterion.maxScore))
      if (new Set(bands).size > 1) split++
      if (bands.some((a) => bands.some((b) => bandDistance(a, b) >= 2)))
        distant++
    }
  }
  return { pairs, split, distant }
}

export function humanAgreement(
  run: BaselineRun,
  set: ReferenceSet,
  scores: HumanScore[],
  ids: string[]
) {
  const { current } = currentScores(scores, set)
  const wanted = new Set(ids)
  const compared = set.cases
    .filter((c) => wanted.has(c.id))
    .flatMap((item) => {
      const own = current.filter((s) => s.caseId === item.id)
      const totals = [...new Set(own.map((s) => s.evaluator))].flatMap(
        (evaluator) => {
          const rows = own.filter((s) => s.evaluator === evaluator)
          return rows.length === item.rubric.criteria.length
            ? [rows.reduce((sum, r) => sum + r.score, 0)]
            : []
        }
      )
      const human = summarize(totals)
      const reading = summarize(successful(run, item.id).map((r) => r.score))
      return human && reading
        ? [
            {
              id: item.id,
              human: human.mean,
              reading: reading.mean,
              difference: reading.mean - human.mean,
              bandDistance: bandDistance(
                bandForScore(reading.mean, 1000),
                bandForScore(human.mean, 1000)
              ),
            },
          ]
        : []
    })
  return {
    cases: compared.length,
    meanAbsoluteError:
      summarize(compared.map((c) => Math.abs(c.difference)))?.mean ?? null,
    differentBands: compared.filter((c) => c.bandDistance > 0).length,
    distantBands: compared.filter((c) => c.bandDistance >= 2).length,
    compared,
  }
}

export function pairDifference(
  run: BaselineRun,
  original: string,
  changed: string
) {
  const a = summarize(successful(run, original).map((r) => r.score))
  const b = summarize(successful(run, changed).map((r) => r.score))
  if (!a || !b || a.n < 2 || b.n < 2) return null
  const difference = b.mean - a.mean
  const standardError = Math.sqrt(a.sd ** 2 / a.n + b.sd ** 2 / b.n)
  // 20 points is the rounded double of the 9.4-point median difference between 1A rounds.
  // This descriptive screen is not a significance test (five readings and multiple pairs).
  const tolerance = Math.max(20, 2 * standardError)
  return {
    original: a,
    changed: b,
    difference,
    standardError,
    tolerance,
    withinNoise: Math.abs(difference) <= tolerance,
    separatedGain: difference > tolerance,
    meanBandDistance: bandDistance(
      bandForScore(a.mean, 1000),
      bandForScore(b.mean, 1000)
    ),
  }
}

type ReferenceItem = ReferenceSet["cases"][number]

function sourceProblems(
  run: BaselineRun,
  itemsById: Map<string, ReferenceItem>
): string[] {
  const problems: string[] = []
  for (const recorded of run.cases) {
    if (!measuredSourcesMatch(itemsById.get(recorded.id), recorded))
      problems.push(
        `${recorded.id}: fontes atuais diferentes das fontes medidas`
      )
  }
  return problems
}

function planProblems(
  run: BaselineRun,
  itemsById: Map<string, ReferenceItem>
): string[] {
  const problems: string[] = []
  if (new Set(run.cases.map((c) => c.id)).size !== run.cases.length)
    problems.push("plano com casos duplicados")
  if (run.runsPerCase < 1 || !Number.isInteger(run.runsPerCase))
    problems.push("número de repetições inválido")
  return [...problems, ...sourceProblems(run, itemsById)]
}

function contractCheck(
  key: string,
  structured: StructuredReading,
  score: number,
  item: ReferenceItem
) {
  const problems: string[] = []
  try {
    validateStructuredReading(structured, item.rubric.criteria, String(score))
  } catch {
    problems.push(`${key}: contrato, cobertura, soma ou faixa inválida`)
  }
  const evidence = [
    structured.highlight.evidence,
    ...structured.criteria.flatMap((c) => c.evidence),
  ]
  if (
    evidence.some(
      (q) => q.trim().split(/\s+/).length < 3 || !item.text.includes(q)
    )
  )
    problems.push(`${key}: citação armazenada não literal ou curta`)
  return { problems, quotes: evidence.length }
}

type ReadingAudit = {
  problems: string[]
  accepted: boolean
  focused: boolean
  quotes: number
}

const inPlan = (r: RecordedReading, run: BaselineRun) =>
  run.cases.some((c) => c.id === r.caseId) &&
  Number.isInteger(r.run) &&
  r.run >= 1 &&
  r.run <= run.runsPerCase

function slotProblems(
  key: string,
  r: RecordedReading,
  run: BaselineRun,
  slots: Set<string>
): string[] {
  const problems: string[] = []
  if (slots.has(key)) problems.push(`${key}: repetição duplicada`)
  slots.add(key)
  if (!inPlan(r, run)) problems.push(`${key}: fora do plano da medição`)
  return problems
}

const finiteScore = (score: number | null): score is number =>
  score !== null && Number.isFinite(score)

function auditTarget(
  r: RecordedReading,
  itemsById: Map<string, ReferenceItem>
) {
  const item = itemsById.get(r.caseId)
  const structured = r.structured
  const score = r.score
  if (!item || !structured || !finiteScore(score)) return null
  return { item, structured, score }
}

function auditReading(
  r: RecordedReading,
  run: BaselineRun,
  itemsById: Map<string, ReferenceItem>,
  slots: Set<string>
): ReadingAudit {
  const key = `${r.caseId} #${r.run}`
  const problems = slotProblems(key, r, run, slots)
  if (!r.ok) return { problems, accepted: false, focused: false, quotes: 0 }
  const target = auditTarget(r, itemsById)
  if (!target) {
    problems.push(`${key}: sem estrutura, nota ou cena`)
    return { problems, accepted: true, focused: false, quotes: 0 }
  }
  const check = contractCheck(key, target.structured, target.score, target.item)
  return {
    problems: [...problems, ...check.problems],
    accepted: true,
    focused: Boolean(target.structured.revision.trim()),
    quotes: check.quotes,
  }
}

function missingSlotProblems(run: BaselineRun, slots: Set<string>): string[] {
  const problems: string[] = []
  for (const c of run.cases)
    for (let number = 1; number <= run.runsPerCase; number++)
      if (!slots.has(`${c.id} #${number}`))
        problems.push(`${c.id} #${number}: leitura ausente`)
  return problems
}

export function structuredIntegrity(run: BaselineRun, set: ReferenceSet) {
  const itemsById = new Map(set.cases.map((c) => [c.id, c]))
  const problems = planProblems(run, itemsById)
  const slots = new Set<string>()
  let accepted = 0
  let quotes = 0
  let focus = 0
  for (const r of run.readings) {
    const audit = auditReading(r, run, itemsById, slots)
    problems.push(...audit.problems)
    if (audit.accepted) accepted++
    if (audit.focused) focus++
    quotes += audit.quotes
  }
  problems.push(...missingSlotProblems(run, slots))
  return {
    expected: run.cases.length * run.runsPerCase,
    accepted,
    failed: run.readings.filter((r) => !r.ok).length,
    quotes,
    focus,
    problems,
  }
}

// Screening only: a sentence can be incomplete despite satisfying the JSON contract.
// These candidates need inspection, not automatic rejection of a production reading.
export function unfinishedTextCandidates(run: BaselineRun) {
  return run.readings.flatMap((r) => {
    const s = r.structured
    if (!r.ok || !s) return []
    const fields = [
      ["opening", s.opening],
      ["highlight.description", s.highlight.description],
      ["revision", s.revision],
      ...s.criteria.flatMap((c) => [
        [`${c.id}.strengths`, c.strengths],
        [`${c.id}.gaps`, c.gaps],
      ]),
    ]
    return fields.flatMap(([field, text]) =>
      /[(:]$/.test(text.trim())
        ? [{ caseId: r.caseId, run: r.run, field, text }]
        : []
    )
  })
}
