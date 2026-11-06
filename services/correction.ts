import { validateStructuredReading } from "@/lib/reading-contract"
//* Libraries imports
import { and, count, eq, gt, inArray, isNull, lte, sql } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import {
  correction,
  readingCall,
  type CorrectionStatus,
  type ReadingFailureStage,
} from "@/database/schema"
import { callCost, priceFor } from "@/lib/model-pricing"
import type { GradingCall } from "@/workflows/correction-grading"

import { READING_TIMEOUT_MS } from "@/lib/reading-policy"
import { expireReadings } from "@/services/reading"

type InsertCorrectionValues = typeof correction.$inferInsert

type CorrectionWriteResult = {
  id: string
  score: string
  status: CorrectionStatus
}

type CompletionValues = Partial<
  Pick<InsertCorrectionValues, "status" | "score" | "structuredResult">
>
type CompletionSnapshot = Pick<
  InsertCorrectionValues,
  "score" | "rubricCriteria" | "modelId" | "promptVersion" | "promptConfig"
>

function validateStructuredCompletion(
  values: CompletionValues,
  snapshot: CompletionSnapshot | undefined
) {
  if (!values.structuredResult) return
  if (
    values.status !== "COMPLETED" ||
    !snapshot?.rubricCriteria ||
    !snapshot.modelId ||
    !snapshot.promptVersion ||
    !snapshot.promptConfig
  )
    throw new Error(
      "Structured completion requires frozen rubric and configuration."
    )
  validateStructuredReading(
    values.structuredResult,
    snapshot.rubricCriteria,
    values.score ?? snapshot.score
  )
}

async function insertCorrection(values: InsertCorrectionValues) {
  validateStructuredCompletion(values, values)
  const inserted = await db
    .insert(correction)
    .values(values)
    .onConflictDoNothing()
    .returning({
      id: correction.id,
      score: correction.score,
      status: correction.status,
    })

  return inserted[0] ?? null
}

async function findCorrectionById(id: string) {
  const result = await db
    .select({
      id: correction.id,
      score: correction.score,
      status: correction.status,
    })
    .from(correction)
    .where(eq(correction.id, id))
    .limit(1)

  return result[0] ?? null
}

async function findAttemptSnapshot(id: string) {
  await expireReadings()
  return db.query.correction.findFirst({ where: { id } })
}

async function findLatestActiveCorrection(textId: string) {
  await expireReadings()
  const latestCorrection = await db.query.correction.findFirst({
    columns: {
      id: true,
      createdAt: true,
      content: true,
      score: true,
      textContent: true,
      structuredResult: true,
      rubricCriteria: true,
      source: true,
      status: true,
    },
    where: {
      textId,
      deletedAt: {
        isNull: true,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return latestCorrection ?? null
}

type ReadingFailure = { stage: ReadingFailureStage; reason: string }

//* IN_PROGRESS records when the workflow picked the attempt up; FAILED records where it stopped.
async function updateCorrectionStatus(
  id: string,
  status: CorrectionStatus,
  failure?: ReadingFailure
) {
  await db
    .update(correction)
    .set({
      status,
      ...(status === "IN_PROGRESS"
        ? { startedAt: sql`coalesce(${correction.startedAt}, now())` }
        : {}),
      ...(status === "FAILED"
        ? {
            finishedAt: sql`now()`,
            failureStage: failure?.stage ?? null,
            failureReason: failure?.reason.slice(0, 1000) ?? null,
          }
        : {}),
    })
    .where(
      and(
        eq(correction.id, id),
        inArray(correction.status, ["PENDING", "IN_PROGRESS"])
      )
    )
}

async function updateCorrection(
  id: string,
  values: Partial<Omit<InsertCorrectionValues, "id">>
): Promise<CorrectionWriteResult | null> {
  if (values.structuredResult) {
    const attempt = await findAttemptSnapshot(id)
    validateStructuredCompletion(values, attempt)
  }
  const result = await db
    .update(correction)
    //* The database clock, like created_at and started_at, so durations never mix clocks.
    .set(
      values.status === "COMPLETED"
        ? { ...values, finishedAt: sql`now()` }
        : values
    )
    .where(
      and(
        eq(correction.id, id),
        inArray(correction.status, ["PENDING", "IN_PROGRESS"]),
        gt(correction.createdAt, new Date(Date.now() - READING_TIMEOUT_MS))
      )
    )
    .returning({
      id: correction.id,
      score: correction.score,
      status: correction.status,
    })

  return result[0] ?? null
}

type CallConfiguration = { modelId: string; promptVersion: string }

function usageColumns(call: GradingCall) {
  const usage = call.usage
  return {
    inputTokens: usage?.inputTokens ?? null,
    cachedInputTokens: usage?.cachedInputTokens ?? null,
    outputTokens: usage?.outputTokens ?? null,
    reasoningTokens: usage?.reasoningTokens ?? null,
  }
}

function pricedCost(call: GradingCall, modelId: string) {
  const price = priceFor(modelId, call.startedAt)
  const cost = price && call.usage ? callCost(call.usage, price) : null
  return { price, costUsd: cost === null ? null : cost.toFixed(8) }
}

//* Keeps every model call with its tokens and cost, priced at the list price of its day (1C-6).
async function recordCall(
  correctionId: string,
  call: GradingCall,
  configuration: CallConfiguration
) {
  await db.insert(readingCall).values({
    id: crypto.randomUUID(),
    correctionId,
    sequence: call.sequence,
    outcome: call.outcome,
    rejection: call.rejection,
    detail: call.detail?.slice(0, 1000) ?? null,
    discardedQuotes: call.discardedQuotes,
    modelId: configuration.modelId,
    promptVersion: configuration.promptVersion,
    ...usageColumns(call),
    ...pricedCost(call, configuration.modelId),
    startedAt: call.startedAt,
    durationMs: call.durationMs,
  })
}

async function completedVersion(textId: string, correctionId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(correction)
    .where(
      and(
        eq(correction.textId, textId),
        eq(correction.status, "COMPLETED"),
        isNull(correction.deletedAt),
        lte(
          correction.createdAt,
          sql`(select created_at from correction where id = ${correctionId})`
        )
      )
    )
  return row.value
}

export const correctionService = {
  completedVersion,
  recordCall,
  findAttemptSnapshot,
  insertCorrection,
  findCorrectionById,
  findLatestActiveCorrection,
  updateCorrectionStatus,
  updateCorrection,
}
