import {
  correctionConfiguration,
  CORRECTION_PROMPT_VERSION,
} from "@/workflows/correction-config"
//* Reads every reference scene several times with the current reading setup.
//* bun run eval:baseline [--runs 5] [--cases acao-01,luta-03] [--concurrency 4] [--label atual] [--out dir]
//* Interrupted runs resume: readings already in readings.json are kept.

//* Libraries imports
import { execSync } from "node:child_process"
import path from "node:path"
import { parseArgs } from "node:util"
import { createOpenAI } from "@ai-sdk/openai"

//* Local imports
import {
  failedReading,
  readBaselineRun,
  recordUsage,
  writeBaselineRun,
  type BaselineRun,
  type RecordedReading,
} from "@/evaluation/baseline-run"
import {
  loadReferenceSet,
  sha256,
  validateReferenceSet,
  type ReferenceCase,
} from "@/evaluation/reference-set"
import {
  CORRECTION_MODEL_ID,
  correctionInstructions,
  requestCorrection,
} from "@/workflows/correction-grading"

const { values } = parseArgs({
  options: {
    runs: { type: "string", default: "5" },
    cases: { type: "string" },
    concurrency: { type: "string", default: "4" },
    label: { type: "string", default: "atual" },
    out: { type: "string" },
  },
})

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error("OPENAI_API_KEY is missing. Add it to .env.")
  process.exit(1)
}

const runsPerCase = Number(values.runs)
const concurrency = Number(values.concurrency)
const label = values.label ?? "atual"
const set = loadReferenceSet()
const problems = validateReferenceSet(set)

if (problems.length > 0) {
  console.error(problems.join("\n"))
  process.exit(1)
}

const selectedIds = values.cases?.split(",").map((id) => id.trim())
const cases = selectedIds
  ? set.cases.filter((item) => selectedIds.includes(item.id))
  : set.cases
//* Local date, so the folder matches the day the run was made.
const today = new Date().toLocaleDateString("sv-SE")
const outDirectory =
  values.out ??
  path.join(
    process.cwd(),
    "evaluation/reference/baselines",
    `${today}-${label}`
  )

function git(command: string): string {
  return execSync(`git ${command}`, { encoding: "utf8" }).trim()
}

function freshRun(): BaselineRun {
  return {
    schema: 1,
    label,
    set: { version: set.version, fingerprint: set.fingerprint },
    config: {
      ...correctionConfiguration(),
      instructionsSha256: sha256(correctionInstructions),
      store: false,
    },
    code: {
      commit: git("rev-parse HEAD"),
      dirty: git("status --porcelain") !== "",
    },
    runsPerCase,
    startedAt: new Date().toISOString(),
    cases: cases.map((item) => ({
      id: item.id,
      rubricId: item.rubric.id,
      themeId: item.theme.id,
      textSha256: sha256(item.text),
      themeSha256: sha256(item.theme.description),
      rubricSha256: sha256(item.rubric.content),
    })),
    readings: [],
  }
}

const previous = readBaselineRun(outDirectory)

if (
  previous &&
  (previous.set.fingerprint !== set.fingerprint ||
    previous.config.instructionsSha256 !== sha256(correctionInstructions) ||
    previous.config.modelId !== CORRECTION_MODEL_ID ||
    (previous.config.promptVersion !== undefined &&
      previous.config.promptVersion !== CORRECTION_PROMPT_VERSION))
) {
  console.error(
    `${outDirectory} holds a run of another set or setup. Choose another --out.`
  )
  process.exit(1)
}

const run = previous ?? freshRun()
const provider = createOpenAI({ apiKey })
const done = new Set(run.readings.map((item) => `${item.caseId}#${item.run}`))
const queue = cases
  .flatMap((item) =>
    Array.from({ length: runsPerCase }, (_, index) => ({
      item,
      number: index + 1,
    }))
  )
  .filter(({ item, number }) => !done.has(`${item.id}#${number}`))

async function readOnce(
  item: ReferenceCase,
  number: number
): Promise<RecordedReading> {
  const started = Date.now()

  try {
    const { output, usage } = await requestCorrection(provider, {
      themeTitle: item.theme.title,
      themeDescription: item.theme.description,
      textContent: item.text,
      rubricTitle: item.rubric.title,
      rubricContent: item.rubric.content,
    })

    return {
      caseId: item.id,
      run: number,
      ok: true,
      score: output.score,
      content: output.content,
      error: null,
      durationMs: Date.now() - started,
      usage: recordUsage(usage),
      finishedAt: new Date().toISOString(),
    }
  } catch (error) {
    return failedReading(item.id, number, error, Date.now() - started)
  }
}

console.log(
  `${queue.length} readings to run (${cases.length} cases × ${runsPerCase}) into ${outDirectory}.`
)

let finished = 0

async function worker() {
  for (let next = queue.shift(); next; next = queue.shift()) {
    const reading = await readOnce(next.item, next.number)

    run.readings.push(reading)
    writeBaselineRun(outDirectory, run)
    finished += 1
    console.log(
      `[${finished}] ${reading.caseId} #${reading.run}: ${reading.ok ? reading.score : `failed (${reading.error})`}`
    )
  }
}

writeBaselineRun(outDirectory, run)
await Promise.all(Array.from({ length: concurrency }, () => worker()))
console.log(`Done. Build the report with: bun run eval:report ${outDirectory}`)
