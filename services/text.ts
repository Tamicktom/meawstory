//* Libraries imports
import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import {
  correction,
  text,
  theme,
  type CorrectionStatus,
} from "@/database/schema"

import { SCENE_UNDO_MS, SCENE_UNDO_SERVER_MS } from "@/lib/scene-deletion"
import { sceneTitle } from "@/lib/scene-title"
import { expireReadings } from "@/services/reading"

type OwnedTextCorrection = {
  status: CorrectionStatus
  score: string | null
}

export type OwnedTextListItem = {
  id: string
  content: string
  createdAt: Date
  title?: string
  themeTitle: string
  correction: OwnedTextCorrection | null
}

type CreateTextInput = {
  userId: string
  themeId: string
  content: string
}

type UndoableScene = {
  id: string
  title: string
  deletedAt: Date
  readingInProgress: boolean
}

type SceneRetirement =
  | { status: "retired"; deletedAt: Date }
  | { status: "missing" }

type SceneRestoration =
  | { status: "restored" }
  | { status: "missing" }
  | { status: "expired" }

async function findActiveTextWithTheme(textId: string) {
  const result = await db
    .select({
      id: text.id,
      content: text.content,
      themeId: text.themeId,
      themeTitle: theme.title,
      themeDescription: theme.description,
    })
    .from(text)
    .innerJoin(theme, eq(text.themeId, theme.id))
    .where(
      and(eq(text.id, textId), isNull(text.deletedAt), isNull(theme.deletedAt))
    )
    .limit(1)

  return result[0] ?? null
}

async function findActiveTextContent(textId: string) {
  const result = await db
    .select({
      content: text.content,
    })
    .from(text)
    .where(and(eq(text.id, textId), isNull(text.deletedAt)))
    .limit(1)

  return result[0] ?? null
}

async function findOwnedText(textId: string, userId: string) {
  const ownedText = await db.query.text.findFirst({
    columns: {
      id: true,
      themeId: true,
      content: true,
      title: true,
      checklist: true,
      revisionIntent: true,
    },
    where: {
      id: textId,
      userId,
      deletedAt: {
        isNull: true,
      },
    },
    with: {
      theme: {
        columns: {
          title: true,
        },
      },
    },
  })

  return ownedText ?? null
}

async function listOwnedTexts(userId: string): Promise<OwnedTextListItem[]> {
  await expireReadings()
  const ownedTexts = await db.query.text.findMany({
    columns: {
      id: true,
      content: true,
      title: true,
      checklist: true,
      createdAt: true,
    },
    where: {
      userId,
      deletedAt: {
        isNull: true,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    with: {
      theme: {
        columns: {
          title: true,
        },
      },
      corrections: {
        columns: {
          score: true,
          status: true,
        },
        where: {
          deletedAt: {
            isNull: true,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        limit: 1,
      },
    },
  })

  return ownedTexts.map((ownedText) => {
    const latestCorrection = ownedText.corrections[0]

    return {
      id: ownedText.id,
      content: ownedText.content,
      createdAt: ownedText.createdAt,
      title: sceneTitle(ownedText.title, ownedText.theme.title),
      themeTitle: ownedText.theme.title,
      correction: latestCorrection
        ? {
            status: latestCorrection.status,
            score:
              latestCorrection.status === "COMPLETED"
                ? latestCorrection.score
                : null,
          }
        : null,
    }
  })
}

async function createText(input: CreateTextInput) {
  const inserted = await db
    .insert(text)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      title: "",
      content: input.content,
      themeId: input.themeId,
    })
    .returning({
      id: text.id,
    })

  const created = inserted[0]

  if (!created) {
    throw new Error("Text was not created")
  }

  return created
}

async function lockAuthor(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`
  )
}

//* Soft-delete only. Corrections stay so undo restores the readings and limits still count.
async function retireOwnedScene(
  textId: string,
  userId: string
): Promise<SceneRetirement> {
  return db.transaction(async (tx) => {
    await lockAuthor(tx, userId)
    const deletedAt = new Date()
    const [retired] = await tx
      .update(text)
      .set({ deletedAt })
      .where(
        and(eq(text.id, textId), eq(text.userId, userId), isNull(text.deletedAt))
      )
      .returning({ id: text.id, deletedAt: text.deletedAt })
    if (!retired?.deletedAt) return { status: "missing" }
    return { status: "retired", deletedAt: retired.deletedAt }
  })
}

async function restoreOwnedScene(
  textId: string,
  userId: string,
  now = new Date()
): Promise<SceneRestoration> {
  return db.transaction(async (tx) => {
    await lockAuthor(tx, userId)
    const [scene] = await tx
      .select({ deletedAt: text.deletedAt })
      .from(text)
      .where(and(eq(text.id, textId), eq(text.userId, userId)))
      .limit(1)
    if (!scene?.deletedAt) return { status: "missing" }
    const earliest = new Date(now.getTime() - SCENE_UNDO_SERVER_MS)
    if (scene.deletedAt.getTime() <= earliest.getTime())
      return { status: "expired" }
    const [restored] = await tx
      .update(text)
      .set({ deletedAt: null })
      .where(
        and(
          eq(text.id, textId),
          eq(text.userId, userId),
          gt(text.deletedAt, earliest)
        )
      )
      .returning({ id: text.id })
    if (!restored) return { status: "expired" }
    return { status: "restored" }
  })
}

async function listUndoableScenes(
  userId: string,
  now = new Date()
): Promise<UndoableScene[]> {
  await expireReadings()
  const earliest = new Date(now.getTime() - SCENE_UNDO_MS)
  const retired = await db
    .select({
      id: text.id,
      title: text.title,
      themeTitle: theme.title,
      deletedAt: text.deletedAt,
    })
    .from(text)
    .innerJoin(theme, eq(text.themeId, theme.id))
    .where(and(eq(text.userId, userId), gt(text.deletedAt, earliest)))
    .orderBy(desc(text.deletedAt))

  const ids = retired.map((scene) => scene.id)
  const latestByScene = new Map<string, CorrectionStatus>()
  if (ids.length > 0) {
    const latest = await db
      .selectDistinctOn([correction.textId], {
        textId: correction.textId,
        status: correction.status,
      })
      .from(correction)
      .where(and(inArray(correction.textId, ids), isNull(correction.deletedAt)))
      .orderBy(correction.textId, desc(correction.createdAt))
    for (const attempt of latest) latestByScene.set(attempt.textId, attempt.status)
  }

  return retired.flatMap((scene) => {
    if (!scene.deletedAt) return []
    const status = latestByScene.get(scene.id)
    return [
      {
        id: scene.id,
        title: sceneTitle(scene.title, scene.themeTitle),
        deletedAt: scene.deletedAt,
        readingInProgress: status === "PENDING" || status === "IN_PROGRESS",
      },
    ]
  })
}

async function findDraftForTheme(userId: string, themeId: string) {
  const scenes = await listOwnedTexts(userId)
  for (const scene of scenes) {
    if (!scene.correction) {
      const draft = await findOwnedText(scene.id, userId)
      if (draft?.themeId === themeId) return draft
    }
  }
  return null
}

export const textService = {
  findDraftForTheme,
  findActiveTextWithTheme,
  findActiveTextContent,
  findOwnedText,
  listOwnedTexts,
  listUndoableScenes,
  retireOwnedScene,
  restoreOwnedScene,
  createText,
}
