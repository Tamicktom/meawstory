//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { eq, inArray } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction, operationAlert, readingCall } from "@/database/schema"
import { callCost, MODEL_PRICES, priceFor } from "@/lib/model-pricing"
import { alertsFor, checkReadingHealth } from "@/services/reading-alerts"
import {
  type HealthGroup,
  dailyHealth,
  readingCosts,
  readingHealth,
} from "@/services/reading-operations"
import { expireReadings } from "@/services/reading"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
const alertKinds = ["failure_rate", "slow_readings", "stalled_readings"]

afterEach(async () => {
  await rows.cleanup()
})

//* A private window in the past, so readings made by other tests or by hand never count.
function privateWindow() {
  const since = new Date(Date.UTC(1990 + Math.floor(Math.random() * 30), 0, 1))
  return { since, until: new Date(since.getTime() + 86_400_000) }
}

function at(base: Date, seconds: number) {
  return new Date(base.getTime() + seconds * 1000)
}

async function scene() {
  const rubricId = await rows.insertRubric({ structured: true })
  const themeId = await rows.insertTheme(rubricId)
  const userId = await rows.insertUser()
  const textId = await rows.insertText({ userId, themeId })
  return { rubricId, textId }
}

async function call(
  correctionId: string,
  outcome: "accepted" | "rejected" | "error",
  costUsd: string | null
) {
  await db.insert(readingCall).values({
    id: crypto.randomUUID(),
    correctionId,
    sequence: outcome === "accepted" ? 2 : 1,
    outcome,
    modelId: "gpt-5-mini",
    promptVersion: "sha256:test",
    inputTokens: 1000,
    outputTokens: 1000,
    costUsd,
    price: MODEL_PRICES[0],
    startedAt: new Date(),
    durationMs: 1000,
  })
}

describe("model pricing", () => {
  it("prices fresh input, cached input and output separately", () => {
    const price = priceFor("gpt-5-mini", new Date("2026-11-05T00:00:00Z"))!

    expect(
      callCost(
        {
          inputTokens: 2000,
          cachedInputTokens: 1000,
          outputTokens: 1000,
          reasoningTokens: 500,
        },
        price
      )
    ).toBeCloseTo((1000 * 0.25 + 1000 * 0.025 + 1000 * 2) / 1_000_000, 12)
  })

  it("has no price for an unknown model or before the first effective day, and no cost without usage", () => {
    expect(priceFor("other-model", new Date())).toBeNull()
    expect(priceFor("gpt-5-mini", new Date("2025-01-01T00:00:00Z"))).toBeNull()
    expect(
      callCost(
        {
          inputTokens: null,
          cachedInputTokens: null,
          outputTokens: null,
          reasoningTokens: null,
        },
        MODEL_PRICES[0]
      )
    ).toBeNull()
  })
})

describe("readingHealth", () => {
  it("measures queue time, time to reading, failure rate and failures by stage", async () => {
    const window = privateWindow()
    const { rubricId, textId } = await scene()
    const base = at(window.since, 3600)

    for (const [index, ready] of [20, 40, 60].entries()) {
      await rows.insertCorrection({
        textId,
        rubricId,
        status: "COMPLETED",
        createdAt: at(base, index * 100),
        startedAt: at(base, index * 100 + 2),
        finishedAt: at(base, index * 100 + ready),
      })
    }
    await rows.insertCorrection({
      textId,
      rubricId,
      status: "FAILED",
      failureStage: "validation",
      createdAt: at(base, 500),
      finishedAt: at(base, 530),
    })

    const health = await readingHealth(window)

    expect(health.total).toMatchObject({
      attempts: 4,
      completed: 3,
      failed: 1,
      failureRate: 0.25,
      queueP50Ms: 2000,
      timeToReadingP50Ms: 40000,
      timeToReadingMaxMs: 60000,
    })
    expect(health.failuresByStage).toEqual([{ stage: "validation", count: 1 }])
    expect(await dailyHealth(window)).toMatchObject([
      { attempts: 4, completed: 3, failed: 1, failureRate: 0.25 },
    ])
  })
})

describe("readingCosts", () => {
  it("charges discarded calls to the completed readings and keeps each reading's own cost", async () => {
    const window = privateWindow()
    const { rubricId, textId } = await scene()
    const created = at(window.since, 60)
    const first = await rows.insertCorrection({
      textId,
      rubricId,
      status: "COMPLETED",
      createdAt: created,
    })
    const second = await rows.insertCorrection({
      textId,
      rubricId,
      status: "COMPLETED",
      createdAt: created,
    })
    const failed = await rows.insertCorrection({
      textId,
      rubricId,
      status: "FAILED",
      createdAt: created,
    })

    await call(first, "accepted", "0.00200000")
    await call(second, "rejected", "0.00200000")
    await call(second, "accepted", "0.00200000")
    await call(failed, "rejected", "0.00200000")
    await call(failed, "error", null)

    const costs = await readingCosts(window)

    expect(costs.completedReadings).toBe(2)
    expect(costs.totalCostUsd).toBeCloseTo(0.008, 10)
    expect(costs.costPerCompletedUsd).toBeCloseTo(0.004, 10)
    expect(costs.failedAttemptsCostUsd).toBeCloseTo(0.002, 10)
    expect(costs.ownCost.p50Usd).toBeCloseTo(0.003, 10)
    expect(costs.ownCost.maxUsd).toBeCloseTo(0.004, 10)
    expect(
      costs.byOutcome.map((row) => [row.outcome, row.calls, row.unpricedCalls])
    ).toEqual([
      ["accepted", 2, 0],
      ["error", 1, 1],
      ["rejected", 2, 0],
    ])
    expect(costs.byGenre).toMatchObject([
      { key: "action", completedReadings: 2 },
    ])
    expect(costs.prices).toEqual([MODEL_PRICES[0]])
  })
})

describe("alerts", () => {
  const quiet: HealthGroup = {
    attempts: 0,
    completed: 0,
    failed: 0,
    active: 0,
    delayed: 0,
    failureRate: null,
    queueP50Ms: null,
    queueP95Ms: null,
    timeToReadingP50Ms: null,
    timeToReadingP95Ms: null,
    timeToReadingMaxMs: null,
    modelId: null,
    promptVersion: null,
  }
  const health = (total: Partial<HealthGroup>) => ({
    since: new Date(),
    until: new Date(),
    groups: [],
    failuresByStage: [{ stage: "grading", count: 2 }],
    total: { ...quiet, ...total },
  })

  it("alerts on a failure rate of 20% or more once enough attempts finished", () => {
    expect(
      alertsFor(health({ completed: 4, failed: 1, failureRate: 0.2 })).map(
        (a) => a.kind
      )
    ).toEqual(["failure_rate"])
    expect(
      alertsFor(health({ completed: 2, failed: 2, failureRate: 0.5 }))
    ).toEqual([])
  })

  it("alerts on slow and stalled readings", () => {
    expect(
      alertsFor(
        health({ completed: 6, timeToReadingP95Ms: 121_000, delayed: 3 })
      ).map((a) => a.kind)
    ).toEqual(["slow_readings", "stalled_readings"])
    expect(
      alertsFor(
        health({ completed: 6, timeToReadingP95Ms: 60_000, delayed: 2 })
      )
    ).toEqual([])
  })

  it("claims each alert once per cooldown", async () => {
    await db
      .delete(operationAlert)
      .where(inArray(operationAlert.kind, alertKinds))
    const { rubricId, textId } = await scene()
    for (let index = 0; index < 3; index += 1) {
      await rows.insertCorrection({
        textId,
        rubricId,
        status: "PENDING",
        createdAt: new Date(Date.now() - 5 * 60_000),
      })
    }

    try {
      expect((await checkReadingHealth()).map((a) => a.kind)).toContain(
        "stalled_readings"
      )
      const [stored] = await db
        .select()
        .from(operationAlert)
        .where(eq(operationAlert.kind, "stalled_readings"))
      expect(stored?.detail).toContain("leituras esperam")
      const sentAt = stored!.lastSentAt

      await checkReadingHealth()
      const [again] = await db
        .select()
        .from(operationAlert)
        .where(eq(operationAlert.kind, "stalled_readings"))
      expect(again?.lastSentAt).toEqual(sentAt)
    } finally {
      await db
        .delete(operationAlert)
        .where(inArray(operationAlert.kind, alertKinds))
    }
  })
})

describe("expireReadings", () => {
  it("fails stale attempts with the stage where they stalled", async () => {
    const { rubricId, textId } = await scene()
    const old = new Date(Date.now() - 11 * 60_000)
    const queued = await rows.insertCorrection({
      textId,
      rubricId,
      status: "PENDING",
      createdAt: old,
    })
    const reading = await rows.insertCorrection({
      textId,
      rubricId,
      status: "IN_PROGRESS",
      createdAt: old,
      startedAt: old,
    })

    await expireReadings()

    const stored = await db
      .select({
        id: correction.id,
        failureStage: correction.failureStage,
        finishedAt: correction.finishedAt,
      })
      .from(correction)
      .where(inArray(correction.id, [queued, reading]))
    const byId = new Map(stored.map((row) => [row.id, row]))

    expect(byId.get(queued)?.failureStage).toBe("queue_timeout")
    expect(byId.get(reading)?.failureStage).toBe("processing_timeout")
    expect(byId.get(reading)?.finishedAt).toBeInstanceOf(Date)
  })
})
