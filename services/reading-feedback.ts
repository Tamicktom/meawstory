import { and, eq, isNull, sql } from "drizzle-orm"
import { db } from "@/database"
import {
  correction,
  text,
  readingFeedback,
  readingDisagreement,
} from "@/database/schema"

export type Usefulness = "yes" | "partly" | "no"
export type ReadingFeedback = {
  usefulness: Usefulness | null
  disagreements: { criterionId: string; reason: string }[]
}
export async function loadReadingFeedback(
  correctionId: string
): Promise<ReadingFeedback> {
  const [choices, disagreements] = await Promise.all([
    db
      .select()
      .from(readingFeedback)
      .where(eq(readingFeedback.correctionId, correctionId)),
    db
      .select({
        criterionId: readingDisagreement.criterionId,
        reason: readingDisagreement.reason,
      })
      .from(readingDisagreement)
      .where(eq(readingDisagreement.correctionId, correctionId)),
  ])
  return { usefulness: choices[0]?.usefulness ?? null, disagreements }
}

// Lock the scene and reading together, so retirement cannot race feedback admission.
export async function saveReadingFeedback(
  userId: string,
  correctionId: string,
  input: { usefulness: Usefulness } | { criterionId: string; reason: string }
) {
  return db.transaction(async (tx) => {
    const [reading] = await tx
      .select({
        result: correction.structuredResult,
        criteria: correction.rubricCriteria,
      })
      .from(correction)
      .innerJoin(text, eq(correction.textId, text.id))
      .where(
        and(
          eq(correction.id, correctionId),
          eq(text.userId, userId),
          isNull(text.deletedAt),
          isNull(correction.deletedAt),
          eq(correction.status, "COMPLETED")
        )
      )
      .for("update")
    if (!reading?.result || !reading.criteria) return false
    if ("usefulness" in input) {
      await tx
        .insert(readingFeedback)
        .values({ correctionId, usefulness: input.usefulness })
        .onConflictDoUpdate({
          target: readingFeedback.correctionId,
          set: { usefulness: input.usefulness, updatedAt: sql`now()` },
        })
    } else {
      if (
        !reading.criteria.some((c) => c.id === input.criterionId) ||
        !reading.result.criteria.some((c) => c.id === input.criterionId)
      )
        return false
      await tx
        .insert(readingDisagreement)
        .values({ correctionId, ...input })
        .onConflictDoUpdate({
          target: [
            readingDisagreement.correctionId,
            readingDisagreement.criterionId,
          ],
          set: { reason: input.reason, updatedAt: sql`now()` },
        })
    }
    return true
  })
}
