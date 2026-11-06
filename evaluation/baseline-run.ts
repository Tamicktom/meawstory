//* Libraries imports
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import type { LanguageModelUsage } from "ai"

//* What one measurement of the reading writes to readings.json. The report is computed from it.
export type ReadingUsage = {
  inputTokens: number | null
  cachedInputTokens: number | null
  outputTokens: number | null
  reasoningTokens: number | null
}

export type RecordedReading = {
  caseId: string
  run: number
  ok: boolean
  score: number | null
  content: string | null
  error: string | null
  durationMs: number
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

export function recordUsage(usage: LanguageModelUsage): ReadingUsage {
  return {
    inputTokens: usage.inputTokens ?? null,
    cachedInputTokens: usage.inputTokenDetails.cacheReadTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    reasoningTokens: usage.outputTokenDetails.reasoningTokens ?? null,
  }
}

//* A failed attempt is kept: the failure rate is part of the measurement.
export function failedReading(
  caseId: string,
  run: number,
  error: unknown,
  durationMs: number
): RecordedReading {
  return {
    caseId,
    run,
    ok: false,
    score: null,
    content: null,
    error: error instanceof Error ? error.message : String(error),
    durationMs,
    usage: null,
    finishedAt: new Date().toISOString(),
  }
}
