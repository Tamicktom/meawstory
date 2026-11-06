//* Local imports
import type { RubricDefinition } from "@/database/seed/render-rubric"

//* The current reading is free markdown. These helpers recover what they can from it.

export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[“”«»"]/g, '"')
    .replace(/[‘’`´]/g, "'")
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function parseNumber(value: string): number {
  return Number(value.replace(",", "."))
}

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`

//* Finds "145/150", "145 de 150", "(0-150): 145" or "Nota: 145" on the criterion line or the two lines after it.
//* It stops at a blank line, so the total "Nota: N" after the last criterion is not taken for it.
function scoreNear(
  lines: string[],
  start: number,
  points: number
): number | null {
  const outOf = new RegExp(`${NUMBER}\\s*(?:/|de|em)\\s*${points}(?!\\d)`)
  const rangeFirst = new RegExp(
    `\\(\\s*0\\s*[-–]\\s*${points}\\s*\\)\\s*\\**\\s*[:—–-]?\\s*\\**\\s*${NUMBER}`
  )
  const labelled = new RegExp(
    `(?:nota|pontua[cç][aã]o|pontos)\\s*:?\\s*\\**\\s*${NUMBER}`,
    "i"
  )

  for (const [offset, line] of lines.slice(start, start + 3).entries()) {
    if (offset > 0 && line.trim() === "") return null

    const explicit = line.match(outOf) ?? line.match(rangeFirst)

    if (explicit) return parseNumber(explicit[1])

    const label = line.match(labelled)

    //* A labelled number above the maximum on a later line is the total, not this criterion.
    if (label && (offset === 0 || parseNumber(label[1]) <= points)) {
      return parseNumber(label[1])
    }
  }

  return null
}

export function parseCriterionScores(
  content: string,
  rubric: RubricDefinition
): Record<string, number | null> {
  const lines = content.split("\n")
  const normalized = lines.map(normalizeForMatch)
  const scores: Record<string, number | null> = {}

  for (const criterion of rubric.criteria) {
    const name = normalizeForMatch(criterion.name)
    //* Headings and list items that open with the name come first: the name can also appear in prose.
    const opening = normalized.flatMap((line, index) =>
      line.replace(/^[#*\-\d.)\s]+/, "").startsWith(name) ? [index] : []
    )
    const anywhere = normalized.flatMap((line, index) =>
      line.includes(name) && !opening.includes(index) ? [index] : []
    )
    const found = [...opening, ...anywhere]
      .map((index) => scoreNear(lines, index, criterion.points))
      .find((score) => score !== null)

    scores[criterion.name] = found ?? null
  }

  return scores
}

//* The last "Nota: N" line is the total the rubric asks for.
export function parseNotaLine(content: string): number | null {
  const matches = [
    ...content.matchAll(
      new RegExp(`nota(?:\\s+final)?\\s*:\\s*\\**\\s*${NUMBER}`, "gi")
    ),
  ]
  const last = matches.at(-1)

  return last ? parseNumber(last[1]) : null
}

const QUOTE_MIN_WORDS = 4

export function extractQuotes(content: string): string[] {
  const quotes = [...content.matchAll(/[“"]([^”"\n]+)[”"]/g)].map((match) =>
    match[1].trim()
  )

  return quotes.filter(
    (quote) => quote.split(/\s+/).filter(Boolean).length >= QUOTE_MIN_WORDS
  )
}

//* A quote with an ellipsis counts as found when every piece appears in the scene.
export function quoteFound(quote: string, scene: string): boolean {
  const haystack = normalizeForMatch(scene)
  const pieces = quote
    .split(/…|\.\.\.|\[\.\.\.\]|\(\.\.\.\)/)
    .map((piece) =>
      normalizeForMatch(piece).replace(/^[\s.,;:!?-]+|[\s.,;:!?-]+$/g, "")
    )
    .filter((piece) => piece.length > 0)

  return pieces.length > 0 && pieces.every((piece) => haystack.includes(piece))
}

export type Summary = {
  n: number
  mean: number
  sd: number
  min: number
  max: number
  range: number
}

export function summarize(values: number[]): Summary | null {
  if (values.length === 0) return null

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.length > 1
      ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
        (values.length - 1)
      : 0
  const min = Math.min(...values)
  const max = Math.max(...values)

  return {
    n: values.length,
    mean,
    sd: Math.sqrt(variance),
    min,
    max,
    range: max - min,
  }
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}
