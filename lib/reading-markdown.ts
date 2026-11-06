//* Renders a structured reading as markdown for `correction.content`.
//* The structure is the source: this only writes it out for the current reading screen,
//* until 1F-1 renders the structure itself. Nothing parses this text back.

//* Local imports
import {
  BAND_LABEL,
  type RubricCriteria,
  type StructuredReading,
} from "@/lib/reading-contract"

const scoreFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })

function quoted(value: string): string {
  return `> “${value.replace(/\s*\n\s*/g, " ")}”`
}

export function renderReadingMarkdown(
  reading: StructuredReading,
  criteria: RubricCriteria
): string {
  const names = new Map(criteria.map((criterion) => [criterion.id, criterion]))
  const sections = reading.criteria.map((entry) => {
    const criterion = names.get(entry.id)
    const name = criterion?.name ?? entry.id
    const points = criterion
      ? ` · ${scoreFormat.format(entry.score)} de ${criterion.maxScore}`
      : ""

    return [
      `### ${name}: ${BAND_LABEL[entry.band]}${points}`,
      "",
      `**O que funciona:** ${entry.strengths}`,
      "",
      `**O que falta:** ${entry.gaps}`,
      "",
      ...entry.evidence.flatMap((quote) => [quoted(quote), ""]),
    ].join("\n")
  })

  return [
    reading.opening,
    "",
    "## Ponto forte",
    "",
    reading.highlight.description,
    "",
    quoted(reading.highlight.evidence),
    "",
    "## Critérios",
    "",
    ...sections,
    "## Foco da revisão",
    "",
    reading.revision,
    "",
  ].join("\n")
}
