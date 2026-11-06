import { validateStructuredReading } from "@/lib/reading-contract"
//* Libraries imports
import { and, eq, gt, inArray } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction, type CorrectionStatus } from "@/database/schema"

import { READING_TIMEOUT_MS } from "@/lib/reading-policy"
import { expireReadings } from "@/services/reading"

type InsertCorrectionValues = typeof correction.$inferInsert

type CorrectionWriteResult = {
  id: string
  score: string
  status: CorrectionStatus
}

async function insertCorrection(values: InsertCorrectionValues) {
  if (values.structuredResult) {
    if (
      values.status !== "COMPLETED" ||
      !values.rubricCriteria ||
      !values.modelId ||
      !values.promptVersion ||
      !values.promptConfig
    )
      throw new Error(
        "Structured completion requires frozen rubric and configuration."
      )
    validateStructuredReading(
      values.structuredResult,
      values.rubricCriteria,
      values.score
    )
  }
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

async function updateCorrectionStatus(id: string, status: CorrectionStatus) {
  await db
    .update(correction)
    .set({ status })
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
    if (
      values.status !== "COMPLETED" ||
      !attempt?.rubricCriteria ||
      !attempt.modelId ||
      !attempt.promptVersion ||
      !attempt.promptConfig
    )
      throw new Error(
        "Structured completion requires frozen rubric and configuration."
      )
    validateStructuredReading(
      values.structuredResult,
      attempt.rubricCriteria,
      values.score ?? attempt.score
    )
  }
  const result = await db
    .update(correction)
    .set(values)
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

export const correctionService = {
  findAttemptSnapshot,
  insertCorrection,
  findCorrectionById,
  findLatestActiveCorrection,
  updateCorrectionStatus,
  updateCorrection,
}
