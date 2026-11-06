import { bandDistance, bandForScore } from "@/evaluation/bands"
import type { BaselineRun, RecordedReading } from "@/evaluation/baseline-run"
import { currentScores, type HumanScore } from "@/evaluation/human-evaluations"
import {
  median,
  parseCriterionScores,
  summarize,
} from "@/evaluation/reading-metrics"
import { sha256, type ReferenceSet } from "@/evaluation/reference-set"
import { validateStructuredReading } from "@/lib/reading-contract"

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
  for (const item of set.cases.filter((c) => ids.includes(c.id))) {
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
  const compared = set.cases
    .filter((c) => ids.includes(c.id))
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

export function structuredIntegrity(run: BaselineRun, set: ReferenceSet) {
  const problems: string[] = []
  let accepted = 0
  let quotes = 0
  let focus = 0
  const slots = new Set<string>()
  if (new Set(run.cases.map((c) => c.id)).size !== run.cases.length)
    problems.push("plano com casos duplicados")
  if (run.runsPerCase < 1 || !Number.isInteger(run.runsPerCase))
    problems.push("número de repetições inválido")
  for (const recorded of run.cases) {
    const item = set.cases.find((c) => c.id === recorded.id)
    if (
      !item ||
      sha256(item.text) !== recorded.textSha256 ||
      sha256(item.theme.description) !== recorded.themeSha256 ||
      sha256(item.rubric.content) !== recorded.rubricSha256
    )
      problems.push(
        `${recorded.id}: fontes atuais diferentes das fontes medidas`
      )
  }
  for (const r of run.readings) {
    const key = `${r.caseId} #${r.run}`
    if (slots.has(key)) problems.push(`${key}: repetição duplicada`)
    slots.add(key)
    if (
      !run.cases.some((c) => c.id === r.caseId) ||
      r.run < 1 ||
      r.run > run.runsPerCase ||
      !Number.isInteger(r.run)
    )
      problems.push(`${key}: fora do plano da medição`)
    if (!r.ok) continue
    accepted++
    const item = set.cases.find((c) => c.id === r.caseId)
    if (
      !item ||
      !r.structured ||
      r.score === null ||
      !Number.isFinite(r.score)
    ) {
      problems.push(`${key}: sem estrutura, nota ou cena`)
      continue
    }
    try {
      validateStructuredReading(
        r.structured,
        item.rubric.criteria,
        String(r.score)
      )
    } catch {
      problems.push(`${key}: contrato, cobertura, soma ou faixa inválida`)
    }
    if (r.structured.revision.trim()) focus++
    const evidence = [
      r.structured.highlight.evidence,
      ...r.structured.criteria.flatMap((c) => c.evidence),
    ]
    quotes += evidence.length
    if (
      evidence.some(
        (q) => q.trim().split(/\s+/).length < 3 || !item.text.includes(q)
      )
    )
      problems.push(`${key}: citação armazenada não literal ou curta`)
  }
  const expected = run.cases.length * run.runsPerCase
  for (const c of run.cases)
    for (let number = 1; number <= run.runsPerCase; number++)
      if (!slots.has(`${c.id} #${number}`))
        problems.push(`${c.id} #${number}: leitura ausente`)
  return {
    expected,
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
