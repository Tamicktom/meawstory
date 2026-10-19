//* Libraries imports
import { and, eq, isNull } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { text, theme, type CorrectionStatus } from "@/database/schema"

type OwnedTextCorrection = {
  status: CorrectionStatus
  score: string | null
}

export type OwnedTextListItem = {
  id: string
  content: string
  createdAt: Date
  themeTitle: string
  correction: OwnedTextCorrection | null
}

type CreateTextInput = {
  userId: string
  themeId: string
  content: string
}

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
  const ownedTexts = await db.query.text.findMany({
    columns: {
      id: true,
      content: true,
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
      id: Bun.randomUUIDv7(),
      userId: input.userId,
      title: `Text for theme ${input.themeId}`,
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

export const textService = {
  findActiveTextWithTheme,
  findActiveTextContent,
  findOwnedText,
  listOwnedTexts,
  createText,
}
