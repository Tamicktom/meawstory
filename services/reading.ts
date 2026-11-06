import { isDeepStrictEqual } from "node:util"
import { correctionConfiguration } from "@/workflows/correction-config"
import { and, eq, gt, inArray, isNull, lt, sql, desc } from "drizzle-orm"
import { db } from "@/database"
import { correction, text, theme, rubric } from "@/database/schema"
import { logEvent } from "@/lib/telemetry"
import {
  readingLimitReset,
  READING_TIMEOUT_MS,
  sceneSizeError,
} from "@/lib/reading-policy"

export class ReadingError extends Error {
  constructor(
    public status: 400 | 404 | 409 | 429,
    message: string,
    public retryAt?: string
  ) {
    super(message)
  }
}
const active = inArray(correction.status, ["PENDING", "IN_PROGRESS"])
//* A PENDING attempt never left the queue; an IN_PROGRESS one stalled while being read (1C-5).
export async function expireReadings() {
  const expired = await db
    .update(correction)
    .set({
      status: "FAILED",
      finishedAt: sql`now()`,
      failureStage: sql`CASE WHEN ${correction.status} = 'PENDING' THEN 'queue_timeout' ELSE 'processing_timeout' END`,
      failureReason: `No result within ${READING_TIMEOUT_MS / 60000} minutes`,
    })
    .where(
      and(
        active,
        lt(correction.createdAt, new Date(Date.now() - READING_TIMEOUT_MS))
      )
    )
    .returning({
      id: correction.id,
      failureStage: correction.failureStage,
      modelId: correction.modelId,
      promptVersion: correction.promptVersion,
    })

  for (const attempt of expired) {
    logEvent("error", "reading.failed", {
      correctionId: attempt.id,
      stage: attempt.failureStage,
      modelId: attempt.modelId,
      promptVersion: attempt.promptVersion,
      reason: "timeout",
    })
  }

  return expired.length
}

// All admission paths share the same lock, including edits to existing drafts.
export async function saveScene(
  userId: string,
  themeId: string,
  content: string,
  textId?: string,
  metadata?: { title?: string; checklist?: string[] }
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`
    )
    if (textId) {
      const [scene] = await tx
        .select()
        .from(text)
        .where(
          and(
            eq(text.id, textId),
            eq(text.userId, userId),
            eq(text.themeId, themeId),
            isNull(text.deletedAt)
          )
        )
      if (!scene) throw new ReadingError(404, "Cena não encontrada.")
      const [attempt] = await tx
        .select()
        .from(correction)
        .where(eq(correction.textId, textId))
        .limit(1)
      if (attempt)
        throw new ReadingError(
          409,
          "Esta cena já tem uma leitura. Abra a cena em Minhas cenas."
        )
      await tx
        .update(text)
        .set({
          content,
          ...draftMetadataUpdate(metadata),
        })
        .where(eq(text.id, textId))
      return { id: textId }
    }
    const id = crypto.randomUUID()
    await tx.insert(text).values({
      id,
      userId,
      themeId,
      content,
      title: metadata?.title?.trim() ?? "",
      checklist: metadata?.checklist ?? [],
    })
    return { id }
  })
}

function draftMetadataUpdate(metadata?: {
  title?: string
  checklist?: string[]
}) {
  return {
    ...(metadata?.title !== undefined ? { title: metadata.title.trim() } : {}),
    ...(metadata?.checklist ? { checklist: metadata.checklist } : {}),
  }
}

function assertExpectedContent(content: string, expectedContent?: string) {
  if (expectedContent !== undefined && content !== expectedContent)
    throw new ReadingError(
      409,
      "A cena mudou em outra aba. Confira o texto antes de enviar."
    )
}

// A retry must still match both frozen bodies before another attempt is reserved.
function assertRetrySnapshot(
  scene: {
    scene: { content: string }
    rubric: Pick<
      typeof rubric.$inferSelect,
      "id" | "title" | "content" | "criteria"
    >
    theme: { title: string; description: string }
  },
  previous:
    | Pick<
        typeof correction.$inferSelect,
        | "rubricId"
        | "rubricContent"
        | "textContent"
        | "rubricCriteria"
        | "source"
      >
    | undefined
) {
  if (!previous) return
  if (
    previous.rubricId !== scene.rubric.id ||
    previous.rubricContent !== scene.rubric.content ||
    previous.textContent !== scene.scene.content ||
    (previous.rubricCriteria !== null &&
      !isDeepStrictEqual(previous.rubricCriteria, scene.rubric.criteria)) ||
    (previous.source !== null &&
      !isDeepStrictEqual(previous.source, {
        themeTitle: scene.theme.title,
        themeDescription: scene.theme.description,
        rubricTitle: scene.rubric.title,
      }))
  ) {
    throw new ReadingError(
      409,
      "O exercício mudou desde a tentativa anterior. Sua cena está salva; não foi iniciada outra leitura."
    )
  }
}

export async function reserveReading(
  userId: string,
  textId: string,
  expectedContent?: string
) {
  await expireReadings()
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`
    )
    const [scene] = await tx
      .select({ scene: text, theme, rubric })
      .from(text)
      .innerJoin(theme, eq(theme.id, text.themeId))
      .innerJoin(rubric, eq(rubric.id, theme.rubricId))
      .where(
        and(
          eq(text.id, textId),
          eq(text.userId, userId),
          isNull(text.deletedAt),
          isNull(theme.deletedAt),
          isNull(rubric.deletedAt)
        )
      )
    if (!scene) throw new ReadingError(404, "Cena ou exercício indisponível.")
    assertExpectedContent(scene.scene.content, expectedContent)
    const [previous] = await tx
      .select()
      .from(correction)
      .where(and(eq(correction.textId, textId), isNull(correction.deletedAt)))
      .orderBy(desc(correction.createdAt))
      .limit(1)
    if (previous && previous.status !== "FAILED")
      throw new ReadingError(
        409,
        "A leitura já foi iniciada. Abra a cena em Minhas cenas."
      )
    const content = previous?.textContent ?? scene.scene.content
    const sizeError = sceneSizeError(content)
    if (sizeError) throw new ReadingError(400, sizeError)
    assertRetrySnapshot(scene, previous)
    const attempts = await tx
      .select({ createdAt: correction.createdAt })
      .from(correction)
      .innerJoin(text, eq(text.id, correction.textId))
      .where(
        and(
          eq(text.userId, userId),
          sql`${correction.status} <> 'FAILED'`,
          gt(correction.createdAt, new Date(Date.now() - 86400000))
        )
      )
    const reset = readingLimitReset(
      attempts.map((a) => a.createdAt),
      Date.now()
    )
    if (reset)
      throw new ReadingError(
        429,
        `Você atingiu o limite de leituras. Tente de novo em ${Math.max(1, Math.ceil((+reset - Date.now()) / 60000))} minutos. Sua cena continua salva.`,
        reset.toISOString()
      )
    const id = crypto.randomUUID()
    await tx.insert(correction).values({
      id,
      textId,
      textContent: content,
      rubricId: scene.rubric.id,
      rubricContent: scene.rubric.content,
      rubricCriteria: scene.rubric.criteria,
      source: {
        themeTitle: scene.theme.title,
        themeDescription: scene.theme.description,
        rubricTitle: scene.rubric.title,
      },
      ...correctionConfiguration(),
      content: "",
      score: "0.00",
      status: "PENDING",
    })
    return id
  })
}
