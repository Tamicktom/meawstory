//* Libraries imports
import { and, eq, isNull } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { text, theme } from "@/database/schema"

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
  createText
}