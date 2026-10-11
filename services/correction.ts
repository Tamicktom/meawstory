//* Libraries imports
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction } from "@/database/schema"

type InsertCorrectionValues = {
  id: string
  content: string
  score: string
  textContent: string
  rubricId: string
  rubricContent: string
  textId: string
}

async function insertCorrection(values: InsertCorrectionValues) {
  const inserted = await db
    .insert(correction)
    .values(values)
    .onConflictDoNothing()
    .returning({
      id: correction.id,
      score: correction.score,
    })

  return inserted[0] ?? null
}

async function findCorrectionById(id: string) {
  const result = await db
    .select({
      id: correction.id,
      score: correction.score,
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

export const correctionService = {
  insertCorrection,
  findCorrectionById,
  findLatestActiveCorrection
}