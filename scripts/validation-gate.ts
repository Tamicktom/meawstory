// Recomputes the quantitative evidence of 1D-1 without calling a model.
import { writeFileSync } from "node:fs"
import path from "node:path"
import { readBaselineRun, type BaselineRun } from "@/evaluation/baseline-run"
import {
  comparableCaseIds,
  criterionVariation,
  humanAgreement,
  pairDifference,
  structuredIntegrity,
  unfinishedTextCandidates,
  variation,
} from "@/evaluation/validation-gate"
import {
  loadReferenceSet,
  type ReferenceSet,
} from "@/evaluation/reference-set"
import { loadHumanEvaluations } from "@/evaluation/human-evaluations"

const [beforeDir, afterDir] = process.argv.slice(2)
if (!beforeDir || !afterDir)
  throw new Error(
    "Usage: bun run eval:gate <baseline anterior> <baseline estruturada>"
  )
const before = readBaselineRun(beforeDir)
const after = readBaselineRun(afterDir)
if (!before || !after) throw new Error("Missing readings.json")
const set = loadReferenceSet()
const ids = comparableCaseIds(before, after)
if (!ids.length) throw new Error("No identical cases to compare")
const integrity = structuredIntegrity(after, set)
const unfinished = unfinishedTextCandidates(after)
const human = loadHumanEvaluations(set, "evaluation/reference/human")
if (human.problems.length) throw new Error(human.problems.join("\n"))
const fmt = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
const table = (headers: string[], rows: string[][]) =>
  [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n")
const versions = [before, after].map((run) => ({
  run,
  stats: variation(run, ids),
  criteria: criterionVariation(run, set, ids),
  agreement: humanAgreement(run, set, human.scores, ids),
}))
type ReferenceItem = ReferenceSet["cases"][number]
type PairResult = NonNullable<ReturnType<typeof pairDifference>>

const controlOf = (cases: ReferenceItem[], id: string) =>
  cases.find((c) => c.controlOf === id)?.id

const originalOf = (item: ReferenceItem, cases: ReferenceItem[]) =>
  item.revision?.of ?? item.injectedInto ?? controlOf(cases, item.id)

function injectionQuotesOutsideBase(
  after: BaselineRun,
  item: ReferenceItem,
  base: ReferenceItem | undefined
) {
  if (item.revision || !base) return null
  return after.readings
    .filter((r) => r.caseId === item.id && r.ok && r.structured)
    .flatMap((r) => [
      r.structured!.highlight.evidence,
      ...r.structured!.criteria.flatMap((c) => c.evidence),
    ])
    .filter((q) => !base.text.includes(q)).length
}

const revisionKind = (item: ReferenceItem, real: boolean) =>
  item.revision ? (real ? "mudança real" : "cosmética") : "instrução"

const pairCells = (pair: PairResult | null) =>
  pair
    ? [
        fmt(pair.difference),
        fmt(pair.standardError),
        fmt(pair.tolerance),
        String(pair.meanBandDistance),
      ]
    : ["—", "—", "—", "—"]

const gainLabel = (pair: PairResult) =>
  pair.separatedGain ? "ganho separado" : "ganho não separado"

const noiseLabel = (pair: PairResult) =>
  pair.withinNoise ? "dentro do ruído" : "fora do ruído"

function triageLabel(pair: PairResult | null, real: boolean) {
  if (!pair) return "inconclusivo"
  return real ? gainLabel(pair) : noiseLabel(pair)
}

function revisionRow(after: BaselineRun, set: ReferenceSet, item: ReferenceItem) {
  const original = originalOf(item, set.cases)
  if (!original) return []
  const real = item.revision?.change === "real"
  const pair = pairDifference(after, original, item.id)
  const base = set.cases.find((c) => c.id === original)
  const injectionQuotes = injectionQuotesOutsideBase(after, item, base)
  return [
    [
      item.id,
      original,
      revisionKind(item, real),
      ...pairCells(pair),
      injectionQuotes === null ? "—" : String(injectionQuotes),
      triageLabel(pair, real),
    ],
  ]
}
const rows = set.cases.flatMap((item) => revisionRow(after, set, item))
const report = [
  "# Evidência quantitativa do portão 1D-1",
  "",
  `Comparação de ${ids.length} casos com hashes idênticos de cena, tema e rubrica. ${after.cases.length - ids.length} casos novos não entram na comparação antes/depois.`,
  "",
  "O relatório não aprova o portão sozinho. Tolerâncias, análise qualitativa, limitações e decisão estão em `docs/v2/validacao-1d/resultado.md`.",
  "",
  table(
    [
      "Medição",
      "Casos com ≥2 leituras",
      "DP mediano",
      "Amplitude mediana",
      "Faixa total estável",
    ],
    versions.map(({ run, stats }) => [
      run.label,
      String(stats.cases),
      fmt(stats.medianSd),
      fmt(stats.medianRange),
      `${stats.stableBands}/${stats.cases}`,
    ])
  ),
  "",
  table(
    [
      "Medição",
      "Caso × critério",
      "Mais de uma faixa",
      "Distância ≥2 faixas",
      "Casos com referência humana",
      "Erro absoluto médio",
      "Faixa diferente do humano",
      "Distância humana ≥2 faixas",
    ],
    versions.map(({ run, criteria, agreement }) => [
      run.label,
      String(criteria.pairs),
      String(criteria.split),
      String(criteria.distant),
      String(agreement.cases),
      fmt(agreement.meanAbsoluteError),
      String(agreement.differentBands),
      String(agreement.distantBands),
    ])
  ),
  "",
  table(
    ["Integridade da configuração nova", "Resultado"],
    [
      ["Slots esperados", String(integrity.expected)],
      ["Concluídas", String(integrity.accepted)],
      ["Falhas recuperáveis", String(integrity.failed)],
      ["Foco preenchido", `${integrity.focus}/${integrity.accepted}`],
      [
        "Citações armazenadas conferidas literalmente",
        String(integrity.quotes),
      ],
      ["Violações ou lacunas", String(integrity.problems.length)],
    ]
  ),
  "",
  ...integrity.problems.map((p) => `- ${p}`),
  "",
  "## Triagem de comentários interrompidos",
  "",
  "Campos que terminam em parêntese aberto ou dois-pontos. É uma triagem lexical de candidatos, não uma medição completa de qualidade nem uma rejeição automática. Confirmar os exemplos na inspeção qualitativa.",
  "",
  unfinished.length
    ? table(
        ["Caso", "Rodada", "Campo", "Final do texto"],
        unfinished.map((c) => [
          c.caseId,
          String(c.run),
          c.field,
          c.text.slice(-130).replaceAll("|", "\\|"),
        ])
      )
    : "Nenhum candidato por esta triagem.",
  "",
  "## Calibração por caso",
  "",
  "Uma leitora humana; as três sondas novas não receberam notas humanas. Diferenças positivas não demonstram qualidade: conferir os defeitos conhecidos e a leitura qualitativa.",
  "",
  table(
    ["Caso", "Humano", "Antes − humano", "Depois − humano"],
    versions[1].agreement.compared.map((c) => [
      c.id,
      fmt(c.human),
      fmt(
        versions[0].agreement.compared.find((a) => a.id === c.id)?.difference ??
          null
      ),
      fmt(c.difference),
    ])
  ),
  "",
  "## Revisões e instruções",
  "",
  "Diferença = média da variante − média do original. EP = √(DP original²/n + DP variante²/n). Triagem descritiva: tolerância = máximo entre 20 pontos e 2 × EP. Não equivale a um teste estatístico confirmatório. Nenhuma nota anterior é passada à avaliação.",
  "",
  table(
    [
      "Variante",
      "Original",
      "Tipo",
      "Diferença",
      "EP",
      "Tolerância",
      "Distância entre faixas médias",
      "Citações exclusivas da sonda",
      "Triagem",
    ],
    rows
  ),
  "",
  "Nas sondas de instrução, uma citação exclusiva é um trecho presente na versão injetada que não aparece no controle. Inspecionar qualquer ocorrência: pode ser uma instrução citada como evidência. Zero ocorrências não prova resistência fora destes casos.",
  "",
  "## Reproduzir",
  "",
  "```sh",
  `bun run eval:gate ${beforeDir} ${afterDir}`,
  "```",
  "",
].join("\n")
const out = path.join(afterDir, "gate.md")
writeFileSync(out, report)
const charts = [
  {
    title: "DP mediano da nota · menor é melhor",
    values: versions.map((v) => v.stats.medianSd),
    suffixes: ["", ""],
  },
  {
    title: "Cenas com faixa total estável · maior é melhor",
    values: versions.map((v) => v.stats.stableBands),
    suffixes: versions.map((v) => `/${v.stats.cases}`),
  },
  {
    title: "Caso × critério com faixas diferentes · menor é melhor",
    values: versions.map((v) => v.criteria.split),
    suffixes: versions.map((v) => `/${v.criteria.pairs}`),
  },
  {
    title: "Erro absoluto médio frente à leitora · menor é melhor",
    values: versions.map((v) => v.agreement.meanAbsoluteError),
    suffixes: ["", ""],
  },
]
const comparison = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comparação da leitura · 1D-1</title>
<style>body{margin:0;color:var(--foreground,#242522);font:14px/1.5 var(--font-sans,system-ui)}main{padding:0}h2{font-size:20px;margin:0 0 8px}p{color:var(--muted-foreground,#5a625b);margin:8px 0}section{margin:20px 0}.row{display:grid;grid-template-columns:85px minmax(0,1fr) 65px;gap:8px;align-items:center;margin:6px 0}.track{height:16px;background:var(--secondary,#eee);border-radius:3px}.bar{height:16px;border-radius:3px}.before{background:var(--chart-1,#527998)}.after{background:var(--chart-2,#b56d32)}strong{text-align:right;font-variant-numeric:tabular-nums}</style>
<main><h2>${ids.length} cenas iguais · antes e depois</h2><p>Comparação exploratória; a decisão está em resultado.md. As barras partem de zero; cada medida tem sua escala.</p>
${charts.map((c) => `<section><b>${c.title}</b>${c.values.map((value, index) => `<div class="row"><span>${index ? "Estruturada" : "Antes"}</span><div class="track"><div class="bar ${index ? "after" : "before"}" style="width:${value === null ? 0 : (100 * value) / (Math.max(1, ...c.values.filter((v): v is number => v !== null)) * 1.15)}%"></div></div><strong>${fmt(value)}${c.suffixes[index]}</strong></div>`).join("")}</section>`).join("")}
<p>${after.readings.length} tentativas novas, ${integrity.accepted} concluídas; comparação restrita aos ${ids.length} casos com fontes idênticas; ${versions[1].agreement.cases} com referência humana. Fonte: readings.json e gate.md desta medição. Tom, foco, completude e resistência a instruções são avaliados separadamente. Estes números não aprovam o portão.</p></main></html>`
writeFileSync(path.join(afterDir, "comparison.html"), comparison)
console.log(`Wrote ${out} and comparison.html`)
