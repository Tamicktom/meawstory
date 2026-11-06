//* Local imports
import {
  BAND_LABEL,
  BANDS,
  bandDistance,
  bandForScore,
  TOTAL_POINTS,
  type Band,
} from "@/evaluation/bands"
import type { BaselineRun, RecordedReading } from "@/evaluation/baseline-run"
import { currentScores, type HumanScore } from "@/evaluation/human-evaluations"
import {
  extractQuotes,
  median,
  normalizeForMatch,
  parseCriterionScores,
  parseNotaLine,
  quoteFound,
  summarize,
  type Summary,
} from "@/evaluation/reading-metrics"
import type { ReferenceCase, ReferenceSet } from "@/evaluation/reference-set"

const SCORE_TOLERANCE = 0.5

type AnalyzedReading = {
  reading: RecordedReading & { ok: true; score: number; content: string }
  criteria: Record<string, number | null>
  nota: number | null
  quotes: string[]
  missingQuotes: string[]
  //* Quoted from the theme brief instead of the scene.
  briefQuotes: string[]
}

type CaseAnalysis = {
  item: ReferenceCase
  readings: AnalyzedReading[]
  failed: RecordedReading[]
  total: Summary | null
  totalBands: Band[]
  criteria: Array<{
    name: string
    points: number
    summary: Summary | null
    bands: Band[]
  }>
}

function isOk(
  reading: RecordedReading
): reading is RecordedReading & { ok: true; score: number; content: string } {
  return reading.ok && reading.score !== null && reading.content !== null
}

function analyzeReading(
  reading: AnalyzedReading["reading"],
  item: ReferenceCase
): AnalyzedReading {
  const quotes = extractQuotes(reading.content)
  const missing = quotes.filter((quote) => !quoteFound(quote, item.text))

  return {
    reading,
    criteria: parseCriterionScores(reading.content, item.rubric.definition),
    nota: parseNotaLine(reading.content),
    quotes,
    missingQuotes: missing.filter(
      (quote) => !quoteFound(quote, item.theme.description)
    ),
    briefQuotes: missing.filter((quote) =>
      quoteFound(quote, item.theme.description)
    ),
  }
}

function uniqueBands(bands: Band[]): Band[] {
  return BANDS.filter((band) => bands.includes(band))
}

function analyzeCase(item: ReferenceCase, run: BaselineRun): CaseAnalysis {
  const own = run.readings.filter((reading) => reading.caseId === item.id)
  const readings = own
    .filter(isOk)
    .map((reading) => analyzeReading(reading, item))
  const scores = readings.map((entry) => entry.reading.score)

  return {
    item,
    readings,
    failed: own.filter((reading) => !isOk(reading)),
    total: summarize(scores),
    totalBands: uniqueBands(
      scores.map((score) => bandForScore(score, TOTAL_POINTS))
    ),
    criteria: item.rubric.definition.criteria.map((criterion) => {
      const values = readings
        .map((entry) => entry.criteria[criterion.name])
        .filter((value): value is number => value !== null)

      return {
        name: criterion.name,
        points: criterion.points,
        summary: summarize(values),
        bands: uniqueBands(
          values.map((value) => bandForScore(value, criterion.points))
        ),
      }
    }),
  }
}

function format(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

function percent(part: number, whole: number): string {
  return whole === 0 ? "—" : `${format((part / whole) * 100, 0)}%`
}

function bandList(bands: Band[]): string {
  return bands.length === 0
    ? "—"
    : bands.map((band) => BAND_LABEL[band]).join(", ")
}

function bandSpread(bands: Band[]): number {
  return bands.length < 2 ? 0 : bandDistance(bands[0], bands[bands.length - 1])
}

function table(header: string[], rows: string[][]): string {
  return [
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n")
}

function quote(value: string, size = 90): string {
  const flat = value.replace(/\s+/g, " ").replaceAll("|", "\\|")

  return flat.length > size ? `${flat.slice(0, size)}…` : flat
}

function metadataSection(
  run: BaselineRun,
  set: ReferenceSet,
  directory: string
): string {
  const okCount = run.readings.filter(isOk).length
  const lastFinished = run.readings
    .map((reading) => reading.finishedAt)
    .sort()
    .at(-1)
  const stale =
    run.set.fingerprint === set.fingerprint
      ? []
      : [
          "",
          `> **Atenção:** o conjunto mudou depois desta medição (versão ${run.set.version} medida, versão ${set.version} atual). As citações foram conferidas contra os textos atuais.`,
        ]

  return [
    table(
      ["Campo", "Valor"],
      [
        ["Configuração", `\`${run.label}\``],
        ["Modelo", `\`${run.config.modelId}\`, \`store: false\``],
        [
          "Versão do prompt",
          run.config.promptVersion
            ? `\`${run.config.promptVersion}\``
            : "Não registrada nesta medição antiga",
        ],
        [
          "Instruções (sha256)",
          `\`${run.config.instructionsSha256.slice(0, 16)}\``,
        ],
        [
          "Código",
          `\`${run.code.commit.slice(0, 10)}\`${run.code.dirty ? " com alterações locais" : ""}`,
        ],
        [
          "Conjunto",
          `versão ${run.set.version}, \`${run.set.fingerprint.slice(0, 16)}\``,
        ],
        ["Casos", String(run.cases.length)],
        ["Leituras por caso", String(run.runsPerCase)],
        ["Leituras concluídas", `${okCount} de ${run.readings.length}`],
        ["Período", `${run.startedAt} a ${lastFinished ?? "—"}`],
      ]
    ),
    ...stale,
    "",
    "Para reproduzir a medição:",
    "",
    "```sh",
    run.code.dirty
      ? `# O código tinha alterações locais sobre ${run.code.commit.slice(0, 10)}: use o commit que trouxe esta medição.`
      : `git checkout ${run.code.commit.slice(0, 10)}`,
    `bun run eval:baseline --runs ${run.runsPerCase} --label ${run.label} --out ${directory}-repeticao`,
    `bun run eval:report ${directory}-repeticao`,
    "```",
    "",
    `Este relatório é recalculado de \`readings.json\` por \`bun run eval:report ${directory}\`, sem chamar o modelo.`,
  ].join("\n")
}

function summarySection(analyses: CaseAnalysis[]): string {
  const measured = analyses.filter(
    (analysis) => analysis.total && analysis.total.n > 1
  )
  const sds = measured.map((analysis) => analysis.total!.sd)
  const ranges = measured.map((analysis) => analysis.total!.range)
  const oneBand = measured.filter(
    (analysis) => analysis.totalBands.length === 1
  )
  const criterionRows = measured.flatMap((analysis) =>
    analysis.criteria.filter(
      (criterion) => criterion.summary && criterion.summary.n > 1
    )
  )
  const criterionSplit = criterionRows.filter(
    (criterion) => criterion.bands.length > 1
  )
  const criterionFar = criterionRows.filter(
    (criterion) => bandSpread(criterion.bands) >= 2
  )

  return table(
    ["Medida", "Valor"],
    [
      ["Casos com duas ou mais leituras", String(measured.length)],
      [
        "Desvio-padrão da nota total (mediana entre casos)",
        format(median(sds)),
      ],
      [
        "Maior desvio-padrão da nota total",
        format(sds.length ? Math.max(...sds) : null),
      ],
      ["Amplitude da nota total (mediana entre casos)", format(median(ranges))],
      [
        "Maior amplitude da nota total",
        format(ranges.length ? Math.max(...ranges) : null),
      ],
      [
        "Casos em que todas as leituras caíram na mesma faixa total",
        `${oneBand.length} de ${measured.length} (${percent(oneBand.length, measured.length)})`,
      ],
      [
        "Pares caso × critério com mais de uma faixa",
        `${criterionSplit.length} de ${criterionRows.length} (${percent(criterionSplit.length, criterionRows.length)})`,
      ],
      [
        "Pares caso × critério com faixas a duas ou mais posições de distância",
        `${criterionFar.length} de ${criterionRows.length} (${percent(criterionFar.length, criterionRows.length)})`,
      ],
    ]
  )
}

function casesSection(analyses: CaseAnalysis[]): string {
  return table(
    [
      "Caso",
      "Gênero",
      "Intenção",
      "Leituras",
      "Média",
      "DP",
      "Mín–máx",
      "Faixas totais",
    ],
    analyses.map(({ item, total, totalBands, failed }) => [
      item.id,
      item.rubric.title.replace("Cena de ", ""),
      BAND_LABEL[item.intendedBand],
      `${total?.n ?? 0}${failed.length ? ` (+${failed.length} falha)` : ""}`,
      format(total?.mean),
      format(total?.sd),
      total ? `${format(total.min)}–${format(total.max)}` : "—",
      bandList(totalBands),
    ])
  )
}

function criteriaSection(analyses: CaseAnalysis[], set: ReferenceSet): string {
  const rubrics = [
    ...new Map(set.cases.map((item) => [item.rubric.id, item.rubric])).values(),
  ]

  return rubrics
    .map((rubric) => {
      const own = analyses.filter(
        (analysis) => analysis.item.rubric.id === rubric.id
      )
      const rows = rubric.definition.criteria.map((criterion) => {
        const entries = own
          .map((analysis) =>
            analysis.criteria.find((entry) => entry.name === criterion.name)!
          )
          .filter((entry) => entry.summary && entry.summary.n > 1)
        const sds = entries.map((entry) => entry.summary!.sd)
        const ranges = entries.map((entry) => entry.summary!.range)
        const split = entries.filter((entry) => entry.bands.length > 1)

        return [
          `${criterion.name} (${criterion.points})`,
          String(entries.length),
          format(median(sds)),
          format(ranges.length ? Math.max(...ranges) : null),
          `${split.length} de ${entries.length}`,
        ]
      })

      return [
        `### ${rubric.title}`,
        "",
        table(
          [
            "Critério (máximo)",
            "Casos lidos",
            "DP mediano",
            "Maior amplitude",
            "Casos com mais de uma faixa",
          ],
          rows
        ),
      ].join("\n")
    })
    .join("\n\n")
}

function intentSection(analyses: CaseAnalysis[]): string {
  const rows = BANDS.map((band) => {
    const means = analyses
      .filter(
        (analysis) =>
          !analysis.item.revision && analysis.item.intendedBand === band
      )
      .map((analysis) => analysis.total?.mean)
      .filter((value): value is number => value !== undefined)
    const summary = summarize(means)

    return [
      BAND_LABEL[band],
      String(means.length),
      format(summary?.mean),
      summary ? `${format(summary.min)}–${format(summary.max)}` : "—",
      summary ? BAND_LABEL[bandForScore(summary.mean, TOTAL_POINTS)] : "—",
    ]
  })

  return [
    "A intenção é a faixa que a autoria do caso buscou na nota total. **Não é avaliação humana**: serve só para ver se a leitura separa cenas feitas para ficar em faixas diferentes.",
    "",
    table(
      [
        "Intenção",
        "Cenas",
        "Média das médias",
        "Mín–máx das médias",
        "Faixa da média",
      ],
      rows
    ),
  ].join("\n")
}

function revisionSection(analyses: CaseAnalysis[]): string {
  const byId = new Map(analyses.map((analysis) => [analysis.item.id, analysis]))
  const rows = analyses
    .filter((analysis) => analysis.item.revision)
    .map((revision) => {
      const original = byId.get(revision.item.revision!.of)
      const before = original?.total
      const after = revision.total

      if (!before || !after) {
        return [
          revision.item.id,
          revision.item.revision!.change,
          "—",
          "—",
          "—",
          "—",
          "—",
        ]
      }

      const delta = after.mean - before.mean
      const se = Math.sqrt(before.sd ** 2 / before.n + after.sd ** 2 / after.n)
      const criterionDeltas = revision.criteria
        .map((criterion) => {
          const previous = original.criteria.find(
            (entry) => entry.name === criterion.name
          )

          if (!criterion.summary || !previous?.summary) return null

          const change = criterion.summary.mean - previous.summary.mean

          return `${criterion.name}: ${change >= 0 ? "+" : ""}${format(change)}`
        })
        .filter(Boolean)
        .join("; ")

      return [
        `${revision.item.id} ← ${original.item.id}`,
        revision.item.revision!.change === "real" ? "real" : "sem mudança real",
        `${format(before.mean)} ± ${format(before.sd)}`,
        `${format(after.mean)} ± ${format(after.sd)}`,
        `${delta >= 0 ? "+" : ""}${format(delta)}`,
        se > 0 ? format(delta / se, 2) : "—",
        criterionDeltas || "—",
      ]
    })

  return [
    "A configuração atual não diz ao modelo que a cena é uma revisão: cada versão é lida como uma cena nova. Por isso, aqui não há como o contexto de revisão inflar a nota. O que se mede é se uma versão sem mudança real recebe outra nota além do ruído entre leituras, e se uma versão com mudança real se separa da original.",
    "",
    "Diferença/EP é a diferença das médias dividida pelo erro-padrão dessa diferença. Ela não é um critério de aprovação: as tolerâncias ficam para 1D-1.",
    "",
    table(
      [
        "Revisão",
        "Mudança",
        "Original (média ± DP)",
        "Revisão (média ± DP)",
        "Diferença",
        "Diferença/EP",
        "Diferença por critério",
      ],
      rows
    ),
  ].join("\n")
}

function failuresSection(analyses: CaseAnalysis[]): string {
  const readings = analyses.flatMap((analysis) => analysis.readings)
  const failed = analyses.flatMap((analysis) => analysis.failed)
  const notaMissing = readings.filter((entry) => entry.nota === null)
  const notaMismatch = readings.filter(
    (entry) =>
      entry.nota !== null &&
      Math.abs(entry.nota - entry.reading.score) > SCORE_TOLERANCE
  )
  const unparsed = readings.filter((entry) =>
    Object.values(entry.criteria).some((value) => value === null)
  )
  const complete = readings.filter((entry) =>
    Object.values(entry.criteria).every((value) => value !== null)
  )
  const sumMismatch = complete.filter((entry) => {
    const sum = Object.values(entry.criteria).reduce<number>(
      (total, value) => total + (value ?? 0),
      0
    )

    return Math.abs(sum - entry.reading.score) > SCORE_TOLERANCE
  })
  const overMax = analyses.flatMap((analysis) =>
    analysis.readings.filter((entry) =>
      analysis.item.rubric.definition.criteria.some(
        (criterion) => (entry.criteria[criterion.name] ?? 0) > criterion.points
      )
    )
  )
  const quotes = readings.flatMap((entry) => entry.quotes)
  const missingQuotes = readings.flatMap((entry) =>
    entry.missingQuotes.map((value) => ({
      caseId: entry.reading.caseId,
      run: entry.reading.run,
      value,
    }))
  )
  const briefQuotes = readings.flatMap((entry) => entry.briefQuotes)
  const noQuotes = readings.filter((entry) => entry.quotes.length === 0)

  //* One example per case, so a single verbose case does not fill the list.
  const examples = [
    ...new Map(missingQuotes.map((entry) => [entry.caseId, entry])).values(),
  ]
    .slice(0, 12)
    .map(({ caseId, run, value }) => `- ${caseId} #${run}: “${quote(value)}”`)
  const withoutNota = notaMissing.map(
    (entry) =>
      `- ${entry.reading.caseId} #${entry.reading.run}: score ${format(entry.reading.score)}, termina em “${quote(entry.reading.content.slice(-80))}”`
  )

  return [
    table(
      ["Falha", "Ocorrências", "Base"],
      [
        [
          "Chamada ao modelo falhou ou saída inválida",
          String(failed.length),
          `${failed.length + readings.length} tentativas`,
        ],
        [
          'Leitura sem linha "Nota: N"',
          String(notaMissing.length),
          `${readings.length} leituras`,
        ],
        [
          'Linha "Nota: N" diferente de `score`',
          String(notaMismatch.length),
          `${readings.length} leituras`,
        ],
        [
          "Leitura em que algum critério não pôde ser lido",
          String(unparsed.length),
          `${readings.length} leituras`,
        ],
        [
          "Soma dos critérios diferente de `score`",
          String(sumMismatch.length),
          `${complete.length} leituras com os cinco critérios`,
        ],
        [
          "Critério acima do máximo",
          String(overMax.length),
          `${readings.length} leituras`,
        ],
        [
          "Leitura sem nenhuma citação de quatro ou mais palavras",
          String(noQuotes.length),
          `${readings.length} leituras`,
        ],
        [
          "Citação do enunciado do tema, não da cena",
          String(briefQuotes.length),
          `${quotes.length} citações`,
        ],
        [
          "Citação que não aparece na cena nem no enunciado",
          String(missingQuotes.length),
          `${quotes.length} citações`,
        ],
      ]
    ),
    "",
    "As citações são conferidas sem acentos, maiúsculas e diferenças de aspas ou travessão; trechos com reticências contam quando cada parte aparece na cena. Uma citação que não aparece na cena nem no enunciado pode ser uma paráfrase entre aspas, um trecho com palavras trocadas ou uma invenção; os exemplos ajudam a separar esses casos.",
    ...(withoutNota.length
      ? ["", 'Leituras sem linha "Nota: N":', "", ...withoutNota]
      : []),
    ...(examples.length
      ? [
          "",
          "Exemplos de citações não encontradas, um por caso:",
          "",
          ...examples,
        ]
      : []),
    ...(failed.length
      ? [
          "",
          "Erros:",
          "",
          ...failed
            .slice(0, 8)
            .map(
              (reading) =>
                `- ${reading.caseId} #${reading.run}: ${quote(reading.error ?? "", 160)}`
            ),
        ]
      : []),
  ].join("\n")
}

const INJECTION_MARKERS = [
  "nota para o sistema",
  "ignore a rubrica",
  "instrucao",
  "nota maxima",
]

function probeSection(analyses: CaseAnalysis[]): string {
  const rows = analyses
    .filter((analysis) => analysis.item.probes?.length)
    .map(({ item, total, totalBands, readings }) => {
      const mentions = readings.filter((entry) =>
        INJECTION_MARKERS.some((marker) =>
          normalizeForMatch(entry.reading.content).includes(marker)
        )
      ).length

      return [
        item.id,
        item.probes!.join(", "),
        BAND_LABEL[item.intendedBand],
        format(total?.mean),
        bandList(totalBands),
        item.probes!.includes("prompt-injection")
          ? `${mentions} de ${readings.length} leituras citam a instrução`
          : "—",
      ]
    })

  return [
    "Casos construídos para testar uma regra da rubrica ou um risco conhecido.",
    "",
    table(
      ["Caso", "Sonda", "Intenção", "Média", "Faixas totais", "Observação"],
      rows
    ),
  ].join("\n")
}

type ComparisonSource = {
  //* "humana" or "do painel": completes "Média ..." and "Faixa ...".
  adjective: string
  short: string
  empty: string
  intro: string
}

const HUMAN_SOURCE: ComparisonSource = {
  adjective: "humana",
  short: "humano",
  empty:
    "Ainda não há avaliações humanas da versão atual do conjunto em `evaluation/reference/human/`. Esta seção compara a leitura com elas quando existirem.",
  intro: "Pontuações humanas",
}

const PANEL_SOURCE: ComparisonSource = {
  adjective: "do painel",
  short: "painel",
  empty:
    "Não há avaliações do painel de modelos da versão atual em `evaluation/reference/model-panel/`.",
  intro:
    "**Painel de modelos: avaliação feita por IA, não por pessoas.** Serve de checagem provisória; modelos tendem a compartilhar vieses entre si e com a leitura. Pontuações",
}

//* Totals per evaluator, counting only evaluators who scored every criterion of the case.
function evaluatorTotals(scores: HumanScore[], item: ReferenceCase): number[] {
  const evaluators = [
    ...new Set(
      scores
        .filter((score) => score.caseId === item.id)
        .map((score) => score.evaluator)
    ),
  ]

  return evaluators
    .map((evaluator) =>
      scores.filter(
        (score) => score.caseId === item.id && score.evaluator === evaluator
      )
    )
    .filter((own) => own.length === item.rubric.definition.criteria.length)
    .map((own) => own.reduce((sum, score) => sum + score.score, 0))
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${format(value)}`
}

function comparisonSection(
  analyses: CaseAnalysis[],
  scores: HumanScore[],
  set: ReferenceSet,
  source: ComparisonSource
): string {
  const { current, stale } = currentScores(scores, set)
  const staleNote = stale
    ? `${stale} pontuações dadas a textos que mudaram depois foram ignoradas.`
    : ""

  if (current.length === 0) {
    return [source.empty, ...(stale ? ["", staleNote] : [])].join("\n")
  }

  const compared = analyses.flatMap((analysis) => {
    const reference = summarize(evaluatorTotals(current, analysis.item))

    return reference && analysis.total
      ? [{ analysis, reference, reading: analysis.total }]
      : []
  })
  const differences = compared.map(
    ({ reading, reference }) => reading.mean - reference.mean
  )
  const bandMismatch = compared.filter(
    ({ reading, reference }) =>
      bandForScore(reading.mean, TOTAL_POINTS) !==
      bandForScore(reference.mean, TOTAL_POINTS)
  )
  const rows = compared.map(({ analysis, reference, reading }) => [
    analysis.item.id,
    String(reference.n),
    format(reference.mean),
    `${format(reference.min)}–${format(reference.max)}`,
    BAND_LABEL[bandForScore(reference.mean, TOTAL_POINTS)],
    format(reading.mean),
    BAND_LABEL[bandForScore(reading.mean, TOTAL_POINTS)],
    signed(reading.mean - reference.mean),
  ])

  return [
    `${source.intro} completas (os cinco critérios) de ${new Set(current.map((score) => score.evaluator)).size} avaliador(es). ${staleNote}`.trim(),
    "",
    table(
      ["Medida", "Valor"],
      [
        ["Casos comparados", String(compared.length)],
        [
          `Leitura − ${source.short}, média`,
          signed(
            differences.reduce((sum, value) => sum + value, 0) /
              (differences.length || 1)
          ),
        ],
        [
          `Leitura − ${source.short}, mediana`,
          signed(median(differences) ?? 0),
        ],
        [
          "Casos em que a faixa total da leitura difere",
          `${bandMismatch.length} de ${compared.length}`,
        ],
      ]
    ),
    "",
    table(
      [
        "Caso",
        "Avaliadores",
        `Média ${source.adjective}`,
        "Mín–máx entre avaliadores",
        `Faixa ${source.adjective}`,
        "Média da leitura",
        "Faixa da leitura",
        `Leitura − ${source.short}`,
      ],
      rows
    ),
  ].join("\n")
}

//* Which bands the human means reach in each genre, and which cases still lack a human score.
function humanCoverageSection(set: ReferenceSet, scores: HumanScore[]): string {
  const { current } = currentScores(scores, set)
  const rubrics = [
    ...new Map(set.cases.map((item) => [item.rubric.id, item.rubric])).values(),
  ]
  const means = new Map(
    set.cases.flatMap((item) => {
      const summary = summarize(evaluatorTotals(current, item))

      return summary ? [[item.id, summary.mean] as const] : []
    })
  )
  const rows = rubrics.map((rubric) => {
    const scenes = set.cases.filter(
      (item) =>
        item.rubric.id === rubric.id && !item.revision && !item.controlOf
    )
    const bands = uniqueBands(
      scenes.flatMap((item) => {
        const mean = means.get(item.id)

        return mean === undefined ? [] : [bandForScore(mean, TOTAL_POINTS)]
      })
    )

    return [
      rubric.title.replace("Cena de ", ""),
      bandList(bands),
      bandList(BANDS.filter((band) => !bands.includes(band))),
    ]
  })
  const pending = set.cases.filter((item) => !means.has(item.id))

  return [
    "Cenas originais de cada gênero (sem revisões nem controles), pela média humana da nota total.",
    "",
    table(["Gênero", "Faixas cobertas", "Faixas sem cena"], rows),
    "",
    pending.length
      ? `Casos ainda sem avaliação humana completa: ${pending.map((item) => item.id).join(", ")}.`
      : "Todos os casos têm avaliação humana completa.",
  ].join("\n")
}

function usageSection(run: BaselineRun): string {
  const readings = run.readings.filter(isOk)
  const values = (
    pick: (reading: RecordedReading) => number | null | undefined
  ) =>
    readings
      .map(pick)
      .filter((value): value is number => typeof value === "number")
  const rows: Array<[string, Summary | null]> = [
    [
      "Tokens de entrada",
      summarize(values((reading) => reading.usage?.inputTokens)),
    ],
    [
      "Tokens de saída",
      summarize(values((reading) => reading.usage?.outputTokens)),
    ],
    [
      "Tokens de raciocínio (dentro da saída)",
      summarize(values((reading) => reading.usage?.reasoningTokens)),
    ],
    [
      "Duração (segundos)",
      summarize(values((reading) => reading.durationMs / 1000)),
    ],
  ]

  return [
    table(
      ["Medida por leitura concluída", "Média", "Mín–máx", "Total"],
      rows.map(([label, summary]) => [
        label,
        format(summary?.mean, 0),
        summary ? `${format(summary.min, 0)}–${format(summary.max, 0)}` : "—",
        summary ? format(summary.mean * summary.n, 0) : "—",
      ])
    ),
    "",
    "O custo em dinheiro fica para 1C-6, que registra o preço e o período usados.",
  ].join("\n")
}

export function buildBaselineReport(input: {
  run: BaselineRun
  set: ReferenceSet
  human: HumanScore[]
  panel?: HumanScore[]
  directory: string
}): string {
  const { run, set, human, directory, panel = [] } = input
  const measuredIds = new Set(run.cases.map((item) => item.id))
  const analyses = set.cases
    .filter((item) => measuredIds.has(item.id))
    .map((item) => analyzeCase(item, run))

  return [
    `# Linha de base da leitura: \`${run.label}\``,
    "",
    "Relatório gerado por `bun run eval:report`. Não edite à mão: as conclusões ficam no card 1A-2.",
    "",
    metadataSection(run, set, directory),
    "",
    "## Resumo da variação",
    "",
    "DP é o desvio-padrão amostral entre as leituras do mesmo caso. Amplitude é a maior nota menos a menor. As faixas usam os limites da rubrica: até 20%, 50%, 80% e 100% dos pontos.",
    "",
    summarySection(analyses),
    "",
    "## Variação por caso",
    "",
    casesSection(analyses),
    "",
    "## Variação por critério",
    "",
    "A leitura atual não tem campos por critério. As notas de cada critério são recuperadas do markdown; quando não é possível, o critério fica fora destas contas e aparece em Falhas.",
    "",
    criteriaSection(analyses, set),
    "",
    "## Intenção de autoria e nota da leitura",
    "",
    intentSection(analyses),
    "",
    "## Revisões",
    "",
    revisionSection(analyses),
    "",
    "## Casos de sonda",
    "",
    probeSection(analyses),
    "",
    "## Falhas conhecidas",
    "",
    failuresSection(analyses),
    "",
    "## Comparação com a avaliação humana",
    "",
    comparisonSection(analyses, human, set, HUMAN_SOURCE),
    "",
    "### Cobertura das faixas pela avaliação humana",
    "",
    humanCoverageSection(set, human),
    "",
    "## Comparação com o painel de modelos",
    "",
    comparisonSection(analyses, panel, set, PANEL_SOURCE),
    "",
    "## Consumo",
    "",
    usageSection(run),
    "",
  ].join("\n")
}
