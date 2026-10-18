//* Libraries imports
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database";
import { correction, type CorrectionStatus } from "@/database/schema";

type InsertCorrectionValues = {
  id: string
  content: string
  score: string
  textContent: string
  rubricId: string
  rubricContent: string
  textId: string
  status: CorrectionStatus
}

async function insertCorrection(values: InsertCorrectionValues) {
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

async function findLatestActiveCorrection(textId: string) {
  const latestCorrection = await db.query.correction.findFirst({
    columns: {
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
    .where(eq(correction.id, id))
}

async function updateCorrection(id: string, values: Partial<Omit<InsertCorrectionValues, "id">>) {
  const result = await db
    .update(correction)
    .set(values)
    .where(eq(correction.id, id))
    .returning({
      id: correction.id,
      score: correction.score,
      status: correction.status,
    })

  return result[0] ?? null
}

export const correctionService = {
  insertCorrection,
  findCorrectionById,
  findLatestActiveCorrection,
  updateCorrectionStatus,
  updateCorrection,
}