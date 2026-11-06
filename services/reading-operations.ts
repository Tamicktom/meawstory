//* Operational measures of the reading (1C-5) and its cost (1C-6), computed from the database.
//* An attempt belongs to the window in which it was created.

//* Libraries imports
import { sql } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import type { ModelPrice } from "@/lib/model-pricing"
import { READING_DELAY_MS } from "@/lib/reading-policy"

export type Window = { since: Date; until: Date }

type Row = Record<string, unknown>

//* Timestamps are stored as UTC without a zone, as Drizzle writes them. A raw Date parameter
//* would be sent in the server's local time and shift every window, so raw SQL gets ISO UTC.
function utc(date: Date): string {
  return date.toISOString()
}

async function rows<T extends Row>(
  query: ReturnType<typeof sql>
): Promise<T[]> {
  const result = await db.execute(query)
  return result.rows as T[]
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export type HealthGroup = {
  modelId: string | null
  promptVersion: string | null
  attempts: number
  completed: number
  failed: number
  active: number
  //* Still waiting past the delay notice of 0C-6.
  delayed: number
  failureRate: number | null
  queueP50Ms: number | null
  queueP95Ms: number | null
  timeToReadingP50Ms: number | null
  timeToReadingP95Ms: number | null
  timeToReadingMaxMs: number | null
}

export type ReadingHealth = Window & {
  groups: HealthGroup[]
  total: HealthGroup
  failuresByStage: Array<{ stage: string; count: number }>
}

function healthQuery(window: Window, grouped: boolean) {
  const keys = grouped
    ? sql`model_id, prompt_version`
    : sql`NULL::text AS model_id, NULL::text AS prompt_version`
  const groupBy = grouped ? sql`GROUP BY model_id, prompt_version` : sql``

  return sql`
    SELECT ${keys},
      count(*)::int AS attempts,
      count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
      count(*) FILTER (WHERE status = 'FAILED')::int AS failed,
      count(*) FILTER (WHERE status IN ('PENDING', 'IN_PROGRESS'))::int AS active,
      count(*) FILTER (WHERE status IN ('PENDING', 'IN_PROGRESS')
        AND created_at < ${utc(new Date(Date.now() - READING_DELAY_MS))})::int AS delayed,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM started_at - created_at) * 1000)
        FILTER (WHERE started_at IS NOT NULL) AS queue_p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY extract(epoch FROM started_at - created_at) * 1000)
        FILTER (WHERE started_at IS NOT NULL) AS queue_p95,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM finished_at - created_at) * 1000)
        FILTER (WHERE status = 'COMPLETED' AND finished_at IS NOT NULL) AS ready_p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY extract(epoch FROM finished_at - created_at) * 1000)
        FILTER (WHERE status = 'COMPLETED' AND finished_at IS NOT NULL) AS ready_p95,
      max(extract(epoch FROM finished_at - created_at) * 1000)
        FILTER (WHERE status = 'COMPLETED' AND finished_at IS NOT NULL) AS ready_max
    FROM correction
    WHERE created_at >= ${utc(window.since)} AND created_at < ${utc(window.until)}
    ${groupBy}
    ORDER BY attempts DESC`
}

function toGroup(row: Row): HealthGroup {
  const completed = num(row.completed) ?? 0
  const failed = num(row.failed) ?? 0

  return {
    modelId: (row.model_id as string | null) ?? null,
    promptVersion: (row.prompt_version as string | null) ?? null,
    attempts: num(row.attempts) ?? 0,
    completed,
    failed,
    active: num(row.active) ?? 0,
    delayed: num(row.delayed) ?? 0,
    //* Only finished attempts have an outcome; active ones are left out of the rate.
    failureRate: completed + failed > 0 ? failed / (completed + failed) : null,
    queueP50Ms: num(row.queue_p50),
    queueP95Ms: num(row.queue_p95),
    timeToReadingP50Ms: num(row.ready_p50),
    timeToReadingP95Ms: num(row.ready_p95),
    timeToReadingMaxMs: num(row.ready_max),
  }
}

export async function readingHealth(window: Window): Promise<ReadingHealth> {
  const [grouped, total, stages] = await Promise.all([
    rows(healthQuery(window, true)),
    rows(healthQuery(window, false)),
    rows<{ stage: string | null; count: number }>(sql`
      SELECT coalesce(failure_stage, 'unknown') AS stage, count(*)::int AS count
      FROM correction
      WHERE status = 'FAILED' AND created_at >= ${utc(window.since)} AND created_at < ${utc(window.until)}
      GROUP BY 1 ORDER BY 2 DESC`),
  ])

  return {
    ...window,
    groups: grouped.map(toGroup),
    total: toGroup(total[0] ?? {}),
    failuresByStage: stages.map((row) => ({
      stage: row.stage ?? "unknown",
      count: Number(row.count),
    })),
  }
}

export type DailyHealth = {
  day: string
  attempts: number
  completed: number
  failed: number
  failureRate: number | null
  timeToReadingP50Ms: number | null
  timeToReadingP95Ms: number | null
}

//* The same measures day by day, to follow them over time.
export async function dailyHealth(window: Window): Promise<DailyHealth[]> {
  const result = await rows(sql`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
      count(*)::int AS attempts,
      count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
      count(*) FILTER (WHERE status = 'FAILED')::int AS failed,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM finished_at - created_at) * 1000)
        FILTER (WHERE status = 'COMPLETED' AND finished_at IS NOT NULL) AS ready_p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY extract(epoch FROM finished_at - created_at) * 1000)
        FILTER (WHERE status = 'COMPLETED' AND finished_at IS NOT NULL) AS ready_p95
    FROM correction
    WHERE created_at >= ${utc(window.since)} AND created_at < ${utc(window.until)}
    GROUP BY 1 ORDER BY 1`)

  return result.map((row) => {
    const completed = num(row.completed) ?? 0
    const failed = num(row.failed) ?? 0

    return {
      day: String(row.day),
      attempts: num(row.attempts) ?? 0,
      completed,
      failed,
      failureRate:
        completed + failed > 0 ? failed / (completed + failed) : null,
      timeToReadingP50Ms: num(row.ready_p50),
      timeToReadingP95Ms: num(row.ready_p95),
    }
  })
}

export type CostByOutcome = {
  outcome: string
  calls: number
  unpricedCalls: number
  costUsd: number
  inputTokens: number
  outputTokens: number
}

export type CostGroup = {
  key: string
  completedReadings: number
  costUsd: number
  costPerCompletedUsd: number | null
}

export type ReadingCosts = Window & {
  completedReadings: number
  totalCostUsd: number
  //* Everything spent in the window, discarded calls included, over the completed readings.
  costPerCompletedUsd: number | null
  //* What each completed reading cost by itself, its own rejected and failed calls included.
  ownCost: {
    meanUsd: number | null
    p50Usd: number | null
    p90Usd: number | null
    maxUsd: number | null
  }
  byOutcome: CostByOutcome[]
  //* Spent on attempts that never became a reading.
  failedAttemptsCostUsd: number
  byModel: CostGroup[]
  byPromptVersion: CostGroup[]
  byGenre: CostGroup[]
  //* The scenes that cost the most, by id: retries of one scene add up here.
  topScenes: CostGroup[]
  prices: ModelPrice[]
  //* The separate comparison stage (1H-1). It is not part of the cost per reading.
  comparisonCostUsd: number
  comparisonCalls: number
  comparisonUnpricedCalls: number
}

function costGroups(
  window: Window,
  key: ReturnType<typeof sql>,
  limit?: number
) {
  return rows(sql`
    WITH attempt AS (
      SELECT c.id, c.status, ${key} AS key, coalesce(sum(rc.cost_usd), 0) AS cost
      FROM correction c
      JOIN rubric r ON r.id = c.rubric_id
      LEFT JOIN reading_call rc ON rc.correction_id = c.id AND rc.kind = 'reading'
      WHERE c.created_at >= ${utc(window.since)} AND c.created_at < ${utc(window.until)}
      GROUP BY c.id, c.status, ${key}
    )
    SELECT coalesce(key, 'unknown') AS key,
      count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
      sum(cost) AS cost
    FROM attempt GROUP BY 1 ORDER BY cost DESC
    ${limit ? sql`LIMIT ${limit}` : sql``}`).then((result) =>
    result.map((row) => {
      const completed = num(row.completed) ?? 0
      const cost = num(row.cost) ?? 0

      return {
        key: String(row.key),
        completedReadings: completed,
        costUsd: cost,
        costPerCompletedUsd: completed > 0 ? cost / completed : null,
      }
    })
  )
}

export async function readingCosts(window: Window): Promise<ReadingCosts> {
  const [
    byOutcome,
    own,
    failed,
    byModel,
    byPromptVersion,
    byGenre,
    topScenes,
    prices,
    comparison,
  ] = await Promise.all([
    rows(sql`
        SELECT rc.outcome, count(*)::int AS calls,
          count(*) FILTER (WHERE rc.cost_usd IS NULL)::int AS unpriced,
          coalesce(sum(rc.cost_usd), 0) AS cost,
          coalesce(sum(rc.input_tokens), 0) AS input_tokens,
          coalesce(sum(rc.output_tokens), 0) AS output_tokens
        FROM reading_call rc JOIN correction c ON c.id = rc.correction_id
        WHERE rc.kind = 'reading' AND c.created_at >= ${utc(window.since)} AND c.created_at < ${utc(window.until)}
        GROUP BY 1 ORDER BY 1`),
    rows(sql`
        WITH own AS (
          SELECT c.id, coalesce(sum(rc.cost_usd), 0) AS cost
          FROM correction c LEFT JOIN reading_call rc ON rc.correction_id = c.id AND rc.kind = 'reading'
          WHERE c.status = 'COMPLETED' AND c.created_at >= ${utc(window.since)} AND c.created_at < ${utc(window.until)}
          GROUP BY c.id
        )
        SELECT count(*)::int AS n, avg(cost) AS mean,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY cost) AS p50,
          percentile_cont(0.9) WITHIN GROUP (ORDER BY cost) AS p90,
          max(cost) AS max
        FROM own`),
    rows(sql`
        SELECT coalesce(sum(rc.cost_usd), 0) AS cost
        FROM reading_call rc JOIN correction c ON c.id = rc.correction_id
        WHERE rc.kind = 'reading' AND c.status = 'FAILED' AND c.created_at >= ${utc(window.since)} AND c.created_at < ${utc(window.until)}`),
    costGroups(window, sql`c.model_id`),
    costGroups(window, sql`c.prompt_version`),
    costGroups(window, sql`r.genre`),
    costGroups(window, sql`c.text_id`, 10),
    rows<{ price: ModelPrice }>(sql`
        SELECT DISTINCT rc.price FROM reading_call rc JOIN correction c ON c.id = rc.correction_id
        WHERE rc.kind = 'reading' AND rc.price IS NOT NULL AND c.created_at >= ${utc(window.since)} AND c.created_at < ${utc(window.until)}`),
    rows(sql`
        SELECT count(*)::int AS calls,
          count(*) FILTER (WHERE rc.cost_usd IS NULL)::int AS unpriced,
          coalesce(sum(rc.cost_usd), 0) AS cost
        FROM reading_call rc JOIN correction c ON c.id = rc.correction_id
        WHERE rc.kind = 'comparison' AND c.created_at >= ${utc(window.since)} AND c.created_at < ${utc(window.until)}`),
  ])

  const outcomes = byOutcome.map((row) => ({
    outcome: String(row.outcome),
    calls: num(row.calls) ?? 0,
    unpricedCalls: num(row.unpriced) ?? 0,
    costUsd: num(row.cost) ?? 0,
    inputTokens: num(row.input_tokens) ?? 0,
    outputTokens: num(row.output_tokens) ?? 0,
  }))
  const totalCostUsd = outcomes.reduce((sum, row) => sum + row.costUsd, 0)
  const completedReadings = num(own[0]?.n) ?? 0

  return {
    ...window,
    completedReadings,
    totalCostUsd,
    costPerCompletedUsd:
      completedReadings > 0 ? totalCostUsd / completedReadings : null,
    ownCost: {
      meanUsd: num(own[0]?.mean),
      p50Usd: num(own[0]?.p50),
      p90Usd: num(own[0]?.p90),
      maxUsd: num(own[0]?.max),
    },
    byOutcome: outcomes,
    failedAttemptsCostUsd: num(failed[0]?.cost) ?? 0,
    byModel,
    byPromptVersion,
    byGenre,
    topScenes,
    prices: prices.map((row) => row.price),
    comparisonCostUsd: num(comparison[0]?.cost) ?? 0,
    comparisonCalls: num(comparison[0]?.calls) ?? 0,
    comparisonUnpricedCalls: num(comparison[0]?.unpriced) ?? 0,
  }
}
