//* Libraries imports
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

//* Local imports
import type { ReferenceSet } from "@/evaluation/reference-set"

//* One CSV per evaluator in evaluation/reference/human/<evaluator>.csv.
const HUMAN_COLUMNS = [
  "versao_conjunto",
  "caso",
  "criterio",
  "maximo",
  "pontuacao",
  "observacao",
] as const

export type HumanScore = {
  evaluator: string
  setVersion: string
  caseId: string
  criterion: string
  score: number
  note: string
}

//* Excel in Portuguese saves with ";"; other tools use ",". The header line decides.
function csvDelimiter(source: string): "," | ";" {
  const header = source.split(/\r?\n/, 1)[0] ?? ""

  return header.includes(";") && !header.includes(",") ? ";" : ","
}

export function parseCsv(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, "")
  const delimiter = csvDelimiter(text)
  //* One cell, quoted or plain, then what ends it: the delimiter, a line break or the end of the text.
  const cell = new RegExp(
    `(?:"((?:[^"]|"")*)"|([^${delimiter}\\r\\n]*))(${delimiter}|\\r?\\n|$)`,
    "g"
  )
  const rows: string[][] = []
  let row: string[] = []

  for (const [, quoted, plain, end] of text.matchAll(cell)) {
    row.push(quoted === undefined ? plain : quoted.replaceAll('""', '"'))

    if (end === delimiter) continue

    rows.push(row)
    row = []

    if (end === "") break
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""))
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

export function humanEvaluationTemplate(
  set: ReferenceSet,
  cases: ReferenceSet["cases"] = set.cases
): string {
  const rows = cases.flatMap((item) =>
    item.rubric.definition.criteria.map((criterion) => [
      set.version,
      item.id,
      criterion.name,
      String(criterion.points),
      "",
      "",
    ])
  )

  return `${[[...HUMAN_COLUMNS], ...rows]
    .map((cells) => cells.map(csvCell).join(","))
    .join("\n")}\n`
}

export type ParsedHumanFile = { scores: HumanScore[]; problems: string[] }

//* Blank scores are skipped, so an evaluator can hand in a partial file.
export function parseHumanEvaluation(
  source: string,
  evaluator: string,
  set: ReferenceSet
): ParsedHumanFile {
  const [header, ...rows] = parseCsv(source)
  const problems: string[] = []
  const scores: HumanScore[] = []

  if (
    !header ||
    header.map((cell) => cell.trim()).join(",") !== HUMAN_COLUMNS.join(",")
  ) {
    return {
      scores,
      problems: [
        `${evaluator}: the header must be ${HUMAN_COLUMNS.join(",")}.`,
      ],
    }
  }

  const cases = new Map(set.cases.map((item) => [item.id, item]))
  //* One spreadsheet per person: a second score for the same case and criterion is an error.
  const seen = new Set<string>()

  rows.forEach((cells, index) => {
    const [setVersion, caseId, criterionName, , rawScore, note = ""] =
      cells.map((cell) => cell.trim())
    const line = index + 2

    if (!rawScore) return

    const item = cases.get(caseId)
    const criterion = item?.rubric.definition.criteria.find(
      (entry) => entry.name === criterionName
    )
    const score = Number(rawScore.replace(",", "."))
    const key = `${caseId}|${criterionName}`

    if (seen.has(key)) {
      problems.push(
        `${evaluator}, line ${line}: ${caseId} already has a score for ${criterionName}.`
      )
    } else if (!item || !criterion) {
      problems.push(`${evaluator}, line ${line}: unknown case or criterion.`)
    } else if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > criterion.points
    ) {
      problems.push(
        `${evaluator}, line ${line}: score ${rawScore} is outside 0 to ${criterion.points}.`
      )
    } else {
      seen.add(key)
      scores.push({
        evaluator,
        setVersion,
        caseId,
        criterion: criterionName,
        score,
        note,
      })
    }
  })

  return { scores, problems }
}

export function loadHumanEvaluations(
  set: ReferenceSet,
  directory: string
): ParsedHumanFile {
  if (!existsSync(directory)) return { scores: [], problems: [] }

  const files = readdirSync(directory).filter((file) => file.endsWith(".csv"))
  const parsed = files.map((file) =>
    parseHumanEvaluation(
      readFileSync(path.join(directory, file), "utf8"),
      file.slice(0, -".csv".length),
      set
    )
  )

  return {
    scores: parsed.flatMap((item) => item.scores),
    problems: parsed.flatMap((item) => item.problems),
  }
}

//* A score still counts while the case text is the one that was scored:
//* made in the version where the text last changed, or in a later one.
export function currentScores(
  scores: HumanScore[],
  set: ReferenceSet
): { current: HumanScore[]; stale: number } {
  const textVersions = new Map(
    set.cases.map((item) => [item.id, Number(item.textVersion ?? "1")])
  )
  const current = scores.filter((score) => {
    const textVersion = textVersions.get(score.caseId)
    const version = Number(score.setVersion)

    return (
      textVersion !== undefined &&
      version >= textVersion &&
      version <= Number(set.version)
    )
  })

  return { current, stale: scores.length - current.length }
}
