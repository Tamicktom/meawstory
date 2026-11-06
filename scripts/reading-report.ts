//* Rebuilds report.md from a baseline's readings.json, without calling the model.
//* bun run eval:report evaluation/reference/baselines/2026-11-05-atual

//* Libraries imports
import { writeFileSync } from "node:fs"
import path from "node:path"

//* Local imports
import { buildBaselineReport } from "@/evaluation/baseline-report"
import { readBaselineRun, REPORT_FILE } from "@/evaluation/baseline-run"
import { loadHumanEvaluations } from "@/evaluation/human-evaluations"
import { loadReferenceSet, REFERENCE_ROOT } from "@/evaluation/reference-set"

const directory = process.argv[2]

if (!directory) {
  console.error("Usage: bun run eval:report <baseline directory>")
  process.exit(1)
}

const run = readBaselineRun(directory)

if (!run) {
  console.error(`${directory} has no readings.json.`)
  process.exit(1)
}

const set = loadReferenceSet()
const human = loadHumanEvaluations(set, path.join(REFERENCE_ROOT, "human"))
//* Same spreadsheet format, filled by AI models. Reported apart from the human evaluations.
const panel = loadHumanEvaluations(
  set,
  path.join(REFERENCE_ROOT, "model-panel")
)
const problems = [...human.problems, ...panel.problems]

if (problems.length > 0) {
  console.error(problems.join("\n"))
  process.exit(1)
}

const relative = path.relative(process.cwd(), path.resolve(directory))
const report = buildBaselineReport({
  run,
  set,
  human: human.scores,
  panel: panel.scores,
  directory: relative,
})

writeFileSync(path.join(directory, REPORT_FILE), report)
console.log(`Wrote ${path.join(relative, REPORT_FILE)}.`)
