//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { buildBaselineReport } from "@/evaluation/baseline-report"
import { recordUsage } from "@/workflows/correction-grading"
import {
  failedReading,
  sumUsage,
  type BaselineRun,
  type RecordedReading,
} from "@/evaluation/baseline-run"
import {
  currentScores,
  humanEvaluationTemplate,
  parseCsv,
  parseHumanEvaluation,
} from "@/evaluation/human-evaluations"
import { loadReferenceSet } from "@/evaluation/reference-set"

const set = loadReferenceSet()

describe("human evaluation CSV", () => {
  it("parses quoted cells with commas, quotes and line breaks", () => {
    expect(parseCsv('a,b\n"x, y","diz ""oi""\nfim"\n')).toEqual([
      ["a", "b"],
      ["x, y", 'diz "oi"\nfim'],
    ])
  })

  it("reads files saved with semicolons and a byte order mark", () => {
    expect(
      parseCsv('\uFEFFa;b;c\n1;"x; y";"612,5"\r\n2;sem, vírgula;\n')
    ).toEqual([
      ["a", "b", "c"],
      ["1", "x; y", "612,5"],
      ["2", "sem, vírgula", ""],
    ])
  })

  it("accepts a filled spreadsheet saved by Excel in Portuguese", () => {
    const source = [
      "versao_conjunto;caso;criterio;maximo;pontuacao;observacao",
      '1;acao-01;Aderência ao tema;150;30,5;"Resumo; sem cena"',
    ].join("\r\n")

    expect(parseHumanEvaluation(`\uFEFF${source}`, "ana", set)).toEqual({
      scores: [
        {
          evaluator: "ana",
          setVersion: "1",
          caseId: "acao-01",
          criterion: "Aderência ao tema",
          score: 30.5,
          note: "Resumo; sem cena",
        },
      ],
      problems: [],
    })
  })

  it("rejects a second score for the same case and criterion", () => {
    const source = [
      "versao_conjunto,caso,criterio,maximo,pontuacao,observacao",
      "1,acao-01,Ritmo,200,30,",
      "2,acao-01,Ritmo,200,40,",
    ].join("\n")

    expect(parseHumanEvaluation(source, "ana", set).problems).toEqual([
      "ana, line 3: acao-01 already has a score for Ritmo.",
    ])
  })

  it("writes one row per case and criterion", () => {
    const rows = parseCsv(humanEvaluationTemplate(set))

    expect(rows[0]).toEqual([
      "versao_conjunto",
      "caso",
      "criterio",
      "maximo",
      "pontuacao",
      "observacao",
    ])
    expect(rows).toHaveLength(set.cases.length * 5 + 1)
  })

  it("keeps filled scores, skips blank ones and reports invalid ones", () => {
    const source = [
      "versao_conjunto,caso,criterio,maximo,pontuacao,observacao",
      '1,acao-01,Aderência ao tema,150,30,"Resumo, sem cena"',
      "1,acao-01,Ritmo,200,,",
      "1,acao-01,Ritmo,200,250,",
      "1,nao-existe,Ritmo,200,10,",
    ].join("\n")
    const parsed = parseHumanEvaluation(source, "ana", set)

    expect(parsed.scores).toEqual([
      {
        evaluator: "ana",
        setVersion: "1",
        caseId: "acao-01",
        criterion: "Aderência ao tema",
        score: 30,
        note: "Resumo, sem cena",
      },
    ])
    expect(parsed.problems).toEqual([
      "ana, line 4: score 250 is outside 0 to 200.",
      "ana, line 5: unknown case or criterion.",
    ])
  })
})

function reading(caseId: string, run: number, score: number): RecordedReading {
  return {
    caseId,
    run,
    ok: true,
    score,
    content: [
      "- Aderência ao tema — 100/150",
      "- Causa e efeito físico — 100/200",
      "- Espaço e recursos — 100/200",
      "- O que os corpos protegem — 100/250",
      `- Coreografia legível — ${score - 400}/200`,
      "“A porta da cozinha abria para dentro”",
      "“Uma é mais forte. A outra conhece melhor a cozinha.”",
      "“Uma frase que não está na cena”",
      `Nota: ${score}`,
    ].join("\n"),
    error: null,
    durationMs: 20_000,
    usage: {
      inputTokens: 2500,
      cachedInputTokens: 0,
      outputTokens: 1700,
      reasoningTokens: 700,
    },
    finishedAt: "2026-11-05T12:00:00.000Z",
  }
}

const run: BaselineRun = {
  schema: 1,
  label: "teste",
  set: { version: set.version, fingerprint: set.fingerprint },
  config: {
    modelId: "gpt-5-mini",
    instructionsSha256: "a".repeat(64),
    store: false,
  },
  code: { commit: "b".repeat(40), dirty: false },
  runsPerCase: 2,
  startedAt: "2026-11-05T11:00:00.000Z",
  cases: ["luta-03", "luta-03-r1"].map((id) => ({
    id,
    rubricId: "rubric_fight",
    themeId: "theme_narrow_kitchen",
    textSha256: "",
    themeSha256: "",
    rubricSha256: "",
  })),
  readings: [
    reading("luta-03", 1, 510),
    reading("luta-03", 2, 530),
    reading("luta-03-r1", 1, 560),
    {
      ...reading("luta-03-r1", 2, 0),
      ok: false,
      score: null,
      content: null,
      error: "timeout",
      usage: null,
    },
  ],
}

describe("buildBaselineReport", () => {
  const report = buildBaselineReport({
    run,
    set,
    human: [],
    directory: "evaluation/x",
  })

  it("summarizes each measured case", () => {
    expect(report).toContain(
      "| luta-03 | luta | Funciona | 2 | 520 | 14,1 | 510–530 | Funciona |"
    )
    expect(report).toContain(
      "| luta-03-r1 | luta | Funciona | 1 (+1 falha) | 560 |"
    )
  })

  it("compares a revision with its original", () => {
    expect(report).toContain(
      "| luta-03-r1 ← luta-03 | sem mudança real | 520 ± 14,1 | 560 ± 0 | +40 |"
    )
  })

  it("counts failures and quotes that are not in the scene", () => {
    expect(report).toContain(
      "| Chamada ao modelo falhou ou saída inválida | 1 | 4 tentativas |"
    )
    expect(report).toContain(
      "| Citação do enunciado do tema, não da cena | 3 | 9 citações |"
    )
    expect(report).toContain(
      "| Citação que não aparece na cena nem no enunciado | 3 | 9 citações |"
    )
    expect(report).toContain(
      "| Soma dos critérios diferente de `score` | 0 | 3 leituras com os cinco critérios |"
    )
  })

  it("says when there is no human evaluation yet", () => {
    expect(report).toContain(
      "Ainda não há avaliações humanas da versão atual do conjunto"
    )
  })
})

describe("recorded readings", () => {
  it("keeps the token counts the provider reports, and null for the rest", () => {
    expect(
      recordUsage({
        inputTokens: 2500,
        inputTokenDetails: {
          noCacheTokens: 2500,
          cacheReadTokens: undefined,
          cacheWriteTokens: undefined,
        },
        outputTokens: 1700,
        outputTokenDetails: { textTokens: 1000, reasoningTokens: 700 },
        totalTokens: 4200,
      })
    ).toEqual({
      inputTokens: 2500,
      cachedInputTokens: null,
      outputTokens: 1700,
      reasoningTokens: 700,
    })
  })

  it("adds the usage of every call of a reading, keeping null when no call reported a count", () => {
    const usage = {
      inputTokens: 100,
      cachedInputTokens: null,
      outputTokens: 50,
      reasoningTokens: 10,
    }
    const call = {
      sequence: 1,
      outcome: "rejected" as const,
      rejection: null,
      detail: null,
      discardedQuotes: 0,
      durationMs: 1,
      usage,
    }

    expect(
      sumUsage([
        call,
        { ...call, outcome: "accepted", usage },
        { ...call, usage: null },
      ])
    ).toEqual({
      inputTokens: 200,
      cachedInputTokens: null,
      outputTokens: 100,
      reasoningTokens: 20,
    })
    expect(sumUsage([])).toBeNull()
  })

  it("keeps a failed attempt with its message", () => {
    expect(
      failedReading("acao-01", 2, new Error("timeout"), 900)
    ).toMatchObject({
      caseId: "acao-01",
      run: 2,
      ok: false,
      score: null,
      error: "timeout",
      durationMs: 900,
    })
    expect(failedReading("acao-01", 3, "boom", 1).error).toBe("boom")
  })
})

describe("model panel comparison", () => {
  const criteria = [
    "Aderência ao tema",
    "Causa e efeito físico",
    "Espaço e recursos",
    "O que os corpos protegem",
    "Coreografia legível",
  ]
  const panel = ["modelo-a", "modelo-b"].flatMap((evaluator, index) =>
    criteria.map((criterion) => ({
      evaluator,
      setVersion: set.version,
      caseId: "luta-03",
      criterion,
      score: 80 + index * 20,
      note: "",
    }))
  )
  const report = buildBaselineReport({
    run,
    set,
    human: [],
    panel,
    directory: "evaluation/x",
  })

  it("reports the panel apart from the human evaluation and labels it as AI", () => {
    expect(report).toContain("Ainda não há avaliações humanas")
    expect(report).toContain(
      "**Painel de modelos: avaliação feita por IA, não por pessoas.**"
    )
    expect(report).toContain(
      "| luta-03 | 2 | 450 | 400–500 | Em esboço | 520 | Funciona | +70 |"
    )
    expect(report).toContain(
      "| Casos em que a faixa total da leitura difere | 1 de 1 |"
    )
  })
})

describe("current human scores", () => {
  const score = (caseId: string, setVersion: string) => ({
    evaluator: "ana",
    setVersion,
    caseId,
    criterion: "Ritmo",
    score: 10,
    note: "",
  })

  it("keeps scores of unchanged texts from earlier versions and drops the rest", () => {
    const { current, stale } = currentScores(
      [
        score("acao-01", "1"),
        score("acao-06", "1"),
        score("acao-06", "2"),
        score("acao-01", "9"),
        score("nao-existe", "2"),
      ],
      set
    )

    expect(current.map((item) => `${item.caseId}@${item.setVersion}`)).toEqual([
      "acao-01@1",
      "acao-06@2",
    ])
    expect(stale).toBe(3)
  })

  it("lists the bands each genre reaches and the cases still without human scores", () => {
    const criteria = set.cases.find((item) => item.id === "luta-01")!.rubric
      .definition.criteria
    const human = criteria.map((criterion) => ({
      evaluator: "ana",
      setVersion: set.version,
      caseId: "luta-01",
      criterion: criterion.name,
      score: 20,
      note: "",
    }))
    const report = buildBaselineReport({
      run,
      set,
      human,
      directory: "evaluation/x",
    })

    expect(report).toContain("| luta | Ausente | Em esboço, Funciona, Forte |")
    expect(report).toMatch(
      /Casos ainda sem avaliação humana completa: acao-01, /
    )
  })
})
