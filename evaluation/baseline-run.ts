//* Libraries imports
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import type { StructuredReading } from "@/lib/reading-contract"

//* What one measurement of the reading writes to readings.json. The report is computed from it.
export type ReadingUsage = {
  inputTokens: number | null
  cachedInputTokens: number | null
  outputTokens: number | null
  reasoningTokens: number | null
}

//* One model call inside a reading: the first request, or the retry after a server rejection.
export type RecordedCall = {
  sequence: number
  outcome: "accepted" | "rejected" | "error"
  rejection: string | null
  detail: string | null
  discardedQuotes: number
  usage: ReadingUsage | null
  durationMs: number
}

export type RecordedReading = {
  caseId: string
  run: number
  ok: boolean
  score: number | null
  content: string | null
  //* Present since 1C-1: the reading as stored, with server-computed bands and total.
  structured?: StructuredReading | null
  //* Present since 1C-1: every call, so rejected attempts are measured and costed.
  calls?: RecordedCall[]
  error: string | null
  durationMs: number
  //* The sum over all calls of the reading.
  usage: ReadingUsage | null
  finishedAt: string
}

export type RecordedCase = {
  id: string
  rubricId: string
  themeId: string
  textSha256: string
  themeSha256: string
  rubricSha256: string
}

export type BaselineRun = {
  schema: 1
  label: string
  set: { version: string; fingerprint: string }
  config: {
    promptVersion?: string
    promptConfig?: import("@/lib/reading-contract").PromptConfig
    modelId: string
    instructionsSha256: string
    store: false
  }
  code: { commit: string; dirty: boolean }
  runsPerCase: number
  startedAt: string
  cases: RecordedCase[]
  readings: RecordedReading[]
}

const READINGS_FILE = "readings.json"
export const REPORT_FILE = "report.md"

export function readBaselineRun(directory: string): BaselineRun | null {
  const file = path.join(directory, READINGS_FILE)

  if (!existsSync(file)) return null

  const parsed = JSON.parse(readFileSync(file, "utf8")) as BaselineRun

  if (parsed.schema !== 1) {
    throw new Error(`${file} uses an unknown schema.`)
  }

  return parsed
}

export function writeBaselineRun(directory: string, run: BaselineRun): void {
  mkdirSync(directory, { recursive: true })
  const readings = [...run.readings].sort(
    (a, b) => a.caseId.localeCompare(b.caseId) || a.run - b.run
  )

  writeFileSync(
    path.join(directory, READINGS_FILE),
    `${JSON.stringify({ ...run, readings }, null, 2)}\n`
  )
}

export function sumUsage(calls: RecordedCall[]): ReadingUsage | null {
  const known = calls.flatMap((call) => (call.usage ? [call.usage] : []))
  if (known.length === 0) return null
  const add = (pick: (usage: ReadingUsage) => number | null) =>
    known.some((usage) => pick(usage) !== null)
      ? known.reduce((total, usage) => total + (pick(usage) ?? 0), 0)
      : null

  return {
    inputTokens: add((usage) => usage.inputTokens),
    cachedInputTokens: add((usage) => usage.cachedInputTokens),
    outputTokens: add((usage) => usage.outputTokens),
    reasoningTokens: add((usage) => usage.reasoningTokens),
  }
}

//* A failed attempt is kept: the failure rate is part of the measurement.
export function failedReading(
  caseId: string,
  run: number,
  error: unknown,
  durationMs: number,
  calls: RecordedCall[] = []
): RecordedReading {
  return {
    caseId,
    run,
    ok: false,
    score: null,
    content: null,
    structured: null,
    calls,
    error: error instanceof Error ? error.message : String(error),
    durationMs,
    usage: sumUsage(calls),
    finishedAt: new Date().toISOString(),
  }
}
