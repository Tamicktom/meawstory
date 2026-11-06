// Produces a portable, disposable study artifact. No API, database or model call.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import {
  readBaselineRun,
  type BaselineRun,
  type RecordedReading,
} from "@/evaluation/baseline-run"
import {
  loadReferenceSet,
  measuredSourcesMatch,
  sha256,
  type RecordedSourceHashes,
  type ReferenceCase,
} from "@/evaluation/reference-set"
import { GENRE_LABEL, validateStructuredReading } from "@/lib/reading-contract"

const directory = process.argv[2]
if (!directory)
  throw new Error("Usage: bun run eval:prototype <baseline directory>")
const run = readBaselineRun(directory)
if (!run) throw new Error("Missing readings.json")
const set = loadReferenceSet()
// One scene per genre. Dialogue #1 timed out; #2 is the first completed slot,
// explicitly recorded in the study protocol, without choosing by content or score.
const selected: Array<[string, number]> = [
  ["acao-02", 1],
  ["luta-02", 1],
  ["romance-04", 1],
  ["dialogo-02", 2],
  ["suspense-02", 1],
  ["virada-02", 1],
]
type CompletedReading = RecordedReading & {
  structured: NonNullable<RecordedReading["structured"]>
  score: number
}

const completed = (r: RecordedReading): r is CompletedReading =>
  r.ok && Boolean(r.structured) && r.score !== null

function completedReading(run: BaselineRun, id: string, number: number) {
  const reading = run.readings
    .filter(completed)
    .find((r) => r.caseId === id && r.run === number)
  if (!reading)
    throw new Error(`${id} #${number} has no completed structured reading`)
  return reading
}

function assertMeasuredSources(
  recorded: RecordedSourceHashes | undefined,
  item: ReferenceCase
) {
  if (!measuredSourcesMatch(item, recorded))
    throw new Error(`${item.id}: sources differ from the measurement`)
}

const data = selected.map(([id, number]) => {
  const item = set.cases.find((c) => c.id === id)!
  const reading = completedReading(run, id, number)
  assertMeasuredSources(run.cases.find((c) => c.id === id), item)
  validateStructuredReading(
    reading.structured,
    item.rubric.criteria,
    String(reading.score)
  )
  return {
    caseId: id,
    run: reading.run,
    title: item.theme.title,
    genre: GENRE_LABEL[item.rubric.definition.genre],
    brief: item.theme.description,
    text: item.text,
    criteria: item.rubric.criteria,
    reading: reading.structured,
    score: reading.score,
    date: new Date(reading.finishedAt).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
  }
})
const template = readFileSync(
  "evaluation/reading-revision-prototype.html",
  "utf8"
)
const html = template.replace("__PROTOTYPE_DATA__", () =>
  JSON.stringify(data).replaceAll("<", "\\u003c")
)
const provenance = JSON.stringify({
  baseline: directory,
  promptVersion: run.config.promptVersion,
  set: run.set,
  templateSha256: sha256(template),
})
  .replaceAll("<", "\\u003c")
  .replaceAll(">", "\\u003e")
const out = path.join(
  "evaluation/reference/forms/1d",
  "prototipo-leitura-revisao.html"
)
mkdirSync(path.dirname(out), { recursive: true })
writeFileSync(out, `${html}\n<!-- Study provenance: ${provenance} -->\n`)
console.log(`Open ${out} directly in a browser. No server required.`)
