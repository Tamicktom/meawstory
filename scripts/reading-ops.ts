//* Prints how the reading is operating and what it costs (1C-5, 1C-6), from the database.
//* bun run ops:report [--since 7d] [--until 2026-11-06]
//* --since takes hours (24h), days (7d) or a date. The default is the last 7 days.

//* Libraries imports
import { parseArgs } from "node:util"

//* Local imports
import {
  dailyHealth,
  readingCosts,
  readingHealth,
  type CostGroup,
  type HealthGroup,
} from "@/services/reading-operations"

const { values } = parseArgs({
  options: {
    since: { type: "string", default: "7d" },
    until: { type: "string" },
  },
})

function parseMoment(value: string, now: Date): Date {
  const relative = value.match(/^(\d+)([hd])$/)
  if (relative) {
    const hours = Number(relative[1]) * (relative[2] === "d" ? 24 : 1)
    return new Date(now.getTime() - hours * 3_600_000)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    throw new Error(`Cannot read the moment "${value}".`)
  return date
}

const until = values.until ? parseMoment(values.until, new Date()) : new Date()
const since = parseMoment(values.since ?? "7d", until)
const window = { since, until }

const seconds = (ms: number | null) =>
  ms === null ? "—" : `${(ms / 1000).toFixed(1)} s`
const percent = (rate: number | null) =>
  rate === null ? "—" : `${(rate * 100).toFixed(1)}%`
const usd = (value: number | null) =>
  value === null ? "—" : `US$ ${value.toFixed(5)}`

function table(header: string[], rows: string[][]) {
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n")
}

function healthRow(label: string, group: HealthGroup) {
  return [
    label,
    String(group.attempts),
    String(group.completed),
    String(group.failed),
    String(group.active),
    String(group.delayed),
    percent(group.failureRate),
    seconds(group.queueP50Ms),
    seconds(group.timeToReadingP50Ms),
    seconds(group.timeToReadingP95Ms),
    seconds(group.timeToReadingMaxMs),
  ]
}

function costRows(groups: CostGroup[]) {
  return groups.map((group) => [
    group.key,
    String(group.completedReadings),
    usd(group.costUsd),
    usd(group.costPerCompletedUsd),
  ])
}

const [health, days, costs] = await Promise.all([
  readingHealth(window),
  dailyHealth(window),
  readingCosts(window),
])

console.log(
  [
    `# Operação da leitura`,
    "",
    `Período: ${since.toISOString()} a ${until.toISOString()}. Cada tentativa conta no período em que foi criada.`,
    "",
    "## Tempo e falhas",
    "",
    table(
      [
        "Configuração",
        "Tentativas",
        "Concluídas",
        "Falhas",
        "Ativas",
        "Atrasadas",
        "Taxa de falha",
        "Fila p50",
        "Até a leitura p50",
        "p95",
        "Máx.",
      ],
      [
        healthRow("Todas", health.total),
        ...health.groups.map((group) =>
          healthRow(
            `${group.modelId ?? "?"} ${group.promptVersion?.slice(0, 15) ?? "sem versão"}`,
            group
          )
        ),
      ]
    ),
    "",
    "Falhas por etapa: " +
      (health.failuresByStage
        .map((entry) => `${entry.stage} ${entry.count}`)
        .join(", ") || "nenhuma"),
    "",
    "## Por dia",
    "",
    table(
      [
        "Dia",
        "Tentativas",
        "Concluídas",
        "Falhas",
        "Taxa de falha",
        "Até a leitura p50",
        "p95",
      ],
      days.map((day) => [
        day.day,
        String(day.attempts),
        String(day.completed),
        String(day.failed),
        percent(day.failureRate),
        seconds(day.timeToReadingP50Ms),
        seconds(day.timeToReadingP95Ms),
      ])
    ),
    "",
    "## Custo",
    "",
    `Leituras concluídas: ${costs.completedReadings}. Custo total: ${usd(costs.totalCostUsd)}. Custo por leitura concluída, com as tentativas descartadas: ${usd(costs.costPerCompletedUsd)}. Gasto em tentativas que falharam: ${usd(costs.failedAttemptsCostUsd)}.`,
    "",
    `Custo próprio de cada leitura concluída: média ${usd(costs.ownCost.meanUsd)}, p50 ${usd(costs.ownCost.p50Usd)}, p90 ${usd(costs.ownCost.p90Usd)}, máximo ${usd(costs.ownCost.maxUsd)}.`,
    "",
    table(
      [
        "Chamadas",
        "Quantidade",
        "Sem preço",
        "Custo",
        "Tokens de entrada",
        "Tokens de saída",
      ],
      costs.byOutcome.map((row) => [
        row.outcome,
        String(row.calls),
        String(row.unpricedCalls),
        usd(row.costUsd),
        String(row.inputTokens),
        String(row.outputTokens),
      ])
    ),
    "",
    "### Por modelo",
    "",
    table(
      ["Modelo", "Concluídas", "Custo", "Por concluída"],
      costRows(costs.byModel)
    ),
    "",
    "### Por versão do prompt",
    "",
    table(
      ["Versão", "Concluídas", "Custo", "Por concluída"],
      costRows(costs.byPromptVersion)
    ),
    "",
    "### Por gênero",
    "",
    table(
      ["Gênero", "Concluídas", "Custo", "Por concluída"],
      costRows(costs.byGenre)
    ),
    "",
    "### Cenas mais caras",
    "",
    table(
      ["Cena", "Concluídas", "Custo", "Por concluída"],
      costRows(costs.topScenes)
    ),
    "",
    "Preços usados: " +
      (costs.prices
        .map(
          (price) =>
            `${price.modelId} desde ${price.effectiveFrom}: US$ ${price.inputPerMillion} entrada, ${price.cachedInputPerMillion} cache, ${price.outputPerMillion} saída por milhão (${price.source}, conferido em ${price.checkedAt})`
        )
        .join("; ") || "nenhum"),
  ].join("\n")
)

process.exit(0)
