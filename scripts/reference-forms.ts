//* Writes what a human evaluator needs into evaluation/reference/forms (gitignored):
//* leitura.md with each rubric, theme and scene, and avaliacao.csv to fill in.
//* bun run eval:forms [--since 2]   (--since: only cases whose text was added or changed in that version or later)

//* Libraries imports
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"

//* Local imports
import { humanEvaluationTemplate } from "@/evaluation/human-evaluations"
import {
  loadReferenceSet,
  REFERENCE_ROOT,
  validateReferenceSet,
} from "@/evaluation/reference-set"

const { values } = parseArgs({ options: { since: { type: "string" } } })
const set = loadReferenceSet()
const since = Number(values.since ?? "1")
const selected = set.cases.filter(
  (item) => Number(item.textVersion ?? "1") >= since
)
const problems = validateReferenceSet(set)

if (problems.length > 0) {
  console.error(problems.join("\n"))
  process.exit(1)
}

//* The packet leaves out the intended band and the kind of revision, so evaluators read blind.
const rubrics = [
  ...new Map(selected.map((item) => [item.rubric.id, item.rubric])).values(),
]
const sections = rubrics.flatMap((rubric) => {
  const cases = selected.filter((item) => item.rubric.id === rubric.id)
  const themes = [
    ...new Map(cases.map((item) => [item.theme.id, item.theme])).values(),
  ]

  return [
    `# ${rubric.title}`,
    "",
    "## Rubrica",
    "",
    rubric.content.replace(/^# .*\n/, "").replace(/^#/gm, "###"),
    ...themes.flatMap((theme) => [
      `## Tema: ${theme.title}`,
      "",
      theme.description.replace(/^#/gm, "###"),
      ...cases
        .filter((item) => item.theme.id === theme.id)
        .flatMap((item) => [`### Caso ${item.id}`, "", item.text.trim(), ""]),
    ]),
  ]
})

const directory = path.join(REFERENCE_ROOT, "forms")

mkdirSync(directory, { recursive: true })
writeFileSync(
  path.join(directory, "leitura.md"),
  [
    `Conjunto de referência, versão ${set.version}. Pontue cada critério de cada caso em avaliacao.csv, de 0 até o máximo indicado.`,
    "",
    ...sections,
  ].join("\n")
)
writeFileSync(
  path.join(directory, "avaliacao.csv"),
  humanEvaluationTemplate(set, selected)
)
console.log(
  `${selected.length} cases. Wrote ${path.relative(process.cwd(), directory)}/leitura.md and avaliacao.csv.`
)
