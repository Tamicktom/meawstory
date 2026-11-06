import { describe, expect, it } from "bun:test"
import type { BaselineRun, RecordedReading } from "@/evaluation/baseline-run"
import {
  comparableCaseIds,
  criterionVariation,
  humanAgreement,
  pairDifference,
  structuredIntegrity,
  unfinishedTextCandidates,
  variation,
} from "@/evaluation/validation-gate"
import { loadReferenceSet, sha256 } from "@/evaluation/reference-set"
import { assembleReading } from "@/lib/reading-assembly"

const set = loadReferenceSet()
const item = set.cases[0]
const assembled = assembleReading(
  {
    opening: "Uma leitura geral.",
    highlight: { description: "Um conflito claro.", evidence: item.text },
    criteria: item.rubric.criteria.map((c) => ({
      id: c.id,
      score: 0,
      evidence: [item.text],
      strengths: "Há conflito.",
      gaps: "Falta ação.",
    })),
    revision: "Mostre uma escolha em movimento.",
  },
  item.rubric.criteria,
  item.text
)
if (!assembled.ok) throw new Error("Invalid fixture")
const structured = assembled.reading
function reading(id: string, run: number, score: number): RecordedReading {
  return {
    caseId: id,
    run,
    score,
    ok: true,
    content: "leitura",
    structured,
    calls: [],
    error: null,
    durationMs: 1,
    usage: null,
    finishedAt: "2026-11-06T12:00:00Z",
  }
}
function measurement(readings: RecordedReading[]): BaselineRun {
  return {
    schema: 1,
    label: "fixture",
    set: { version: set.version, fingerprint: set.fingerprint },
    config: { modelId: "fixture", instructionsSha256: "fixture", store: false },
    code: { commit: "fixture", dirty: false },
    runsPerCase: 2,
    startedAt: "2026-11-06T12:00:00Z",
    cases: [
      {
        id: item.id,
        rubricId: item.rubric.id,
        themeId: item.theme.id,
        textSha256: sha256(item.text),
        themeSha256: sha256(item.theme.description),
        rubricSha256: sha256(item.rubric.content),
      },
    ],
    readings,
  }
}

describe("validation gate evidence", () => {
  it("screens unfinished commentary without mistaking quotations for commentary", () => {
    const run = measurement([reading(item.id, 1, 0)])
    expect(unfinishedTextCandidates(run)).toEqual([])
    run.readings[0] = structuredClone(run.readings[0])
    run.readings[0].structured!.criteria[0].gaps = "A explicação acaba aqui ("
    expect(unfinishedTextCandidates(run)).toEqual([
      {
        caseId: item.id,
        run: 1,
        field: "fidelity.gaps",
        text: "A explicação acaba aqui (",
      },
    ])
  })
  it("compares criterion bands using structured fields and historical markdown", () => {
    const a = reading(item.id, 1, 0)
    const b = structuredClone(a)
    b.run = 2
    b.structured!.criteria[0].score = item.rubric.criteria[0].maxScore
    expect(criterionVariation(measurement([a, b]), set, [item.id])).toEqual({
      pairs: 5,
      split: 1,
      distant: 1,
    })
    const legacy = measurement(
      [a, b].map((r) => ({
        ...r,
        structured: undefined,
        content: item.rubric.criteria
          .map(
            (c, index) =>
              `- ${c.name} — ${index === 0 && r.run === 2 ? c.maxScore : 0}/${c.maxScore}`
          )
          .join("\n"),
      }))
    )
    expect(criterionVariation(legacy, set, [item.id])).toEqual({
      pairs: 5,
      split: 1,
      distant: 1,
    })
  })
  it("averages complete human evaluations without mixing partial evaluators into totals", () => {
    const scores = item.rubric.criteria.map((c) => ({
      evaluator: "complete",
      setVersion: set.version,
      caseId: item.id,
      criterion: c.name,
      score: 10,
      note: "",
    }))
    scores.push({ ...scores[0], evaluator: "partial", score: 150 })
    expect(
      humanAgreement(measurement([reading(item.id, 1, 100)]), set, scores, [
        item.id,
      ])
    ).toMatchObject({
      cases: 1,
      meanAbsoluteError: 50,
      differentBands: 0,
      compared: [{ human: 50, reading: 100, difference: 50 }],
    })
  })
  it("excludes changed sources rather than conflating set versions", () => {
    const before = measurement([])
    const after = structuredClone(before)
    after.set.version = "999"
    expect(comparableCaseIds(before, after)).toEqual([item.id])
    after.cases[0].themeSha256 = "changed"
    expect(comparableCaseIds(before, after)).toEqual([])
  })
  it("does not treat a failed reading as a zero score or a stable repeated case", () => {
    const failed = { ...reading(item.id, 2, 0), ok: false, score: null }
    expect(
      variation(measurement([reading(item.id, 1, 850), failed]), [item.id])
        .cases
    ).toBe(0)
  })
  it("uses a noise floor when identical repeats have zero variance", () => {
    const run = measurement([
      reading("a", 1, 800),
      reading("a", 2, 800),
      reading("b", 1, 810),
      reading("b", 2, 810),
    ])
    expect(pairDifference(run, "a", "b")).toMatchObject({
      tolerance: 20,
      withinNoise: true,
      separatedGain: false,
    })
    run.readings[2].score = run.readings[3].score = 850
    expect(pairDifference(run, "a", "b")).toMatchObject({
      withinNoise: false,
      separatedGain: true,
    })
    expect(pairDifference(run, "missing", "b")).toBeNull()
  })
  it("checks exact stored quotations, scores and missing repetitions independently", () => {
    const run = measurement([reading(item.id, 1, 0), reading(item.id, 2, 0)])
    expect(structuredIntegrity(run, set)).toMatchObject({
      accepted: 2,
      focus: 2,
      quotes: 12,
      problems: [],
    })
    run.readings[0] = structuredClone(run.readings[0])
    run.readings[0].structured!.highlight.evidence =
      "Uma citação inventada que não aparece na cena"
    run.readings[0].score = 999
    run.readings.pop()
    expect(structuredIntegrity(run, set).problems).toEqual([
      `${item.id} #1: contrato, cobertura, soma ou faixa inválida`,
      `${item.id} #1: citação armazenada não literal ou curta`,
      `${item.id} #2: leitura ausente`,
    ])
  })
  it("rejects duplicate slots and changed reference text", () => {
    const run = measurement([reading(item.id, 1, 0), reading(item.id, 1, 0)])
    run.cases[0].textSha256 = "changed"
    expect(structuredIntegrity(run, set).problems).toContain(
      `${item.id} #1: repetição duplicada`
    )
    expect(structuredIntegrity(run, set).problems).toContain(
      `${item.id}: fontes atuais diferentes das fontes medidas`
    )
  })
})
