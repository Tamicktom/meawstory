//* Libraries imports
import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { text } from "@/database/schema"
import { textService } from "@/services/text"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

afterEach(async () => {
  await rows.cleanup()
})

async function expectEmptyInsertThrows() {
  const insert = spyOn(db, "insert")
  insert.mockImplementation(() => {
    return {
      values() {
        return {
          returning() {
            return Promise.resolve([])
          },
        }
      },
    } as never
  })

  try {
    await expect(
      textService.createText({
        userId: `pr6-${crypto.randomUUID()}`,
        themeId: `pr6-${crypto.randomUUID()}`,
        content: "A body that is never stored.",
      })
    ).rejects.toThrow("Text was not created")
  } finally {
    insert.mockRestore()
  }
}

describe("textService.findActiveTextWithTheme", () => {
  it("returns the text and its active theme", async () => {
    const graph = await rows.insertActiveText({
      content: "First draft",
      themeTitle: "Original title",
      themeDescription: "Original description",
    })

    await db
      .update(text)
      .set({ content: "Revised draft" })
      .where(eq(text.id, graph.textId))

    const found = await textService.findActiveTextWithTheme(graph.textId)

    expect(found).toEqual({
      id: graph.textId,
      content: "Revised draft",
      themeId: graph.themeId,
      themeTitle: "Original title",
      themeDescription: "Original description",
    })
  })

  it("returns null when the text is soft-deleted", async () => {
    const graph = await rows.insertActiveText({
      textDeletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(await textService.findActiveTextWithTheme(graph.textId)).toBeNull()
  })

  it("returns null when the theme is retired after its text", async () => {
    const graph = await rows.insertActiveText({
      textDeletedAt: new Date("2024-01-01T00:00:00.000Z"),
      themeDeletedAt: new Date("2024-01-02T00:00:00.000Z"),
    })

    expect(await textService.findActiveTextWithTheme(graph.textId)).toBeNull()
  })
})

describe("textService.findActiveTextContent", () => {
  it("returns the current body of an active text", async () => {
    const graph = await rows.insertActiveText({ content: "First draft" })

    await db
      .update(text)
      .set({ content: "Revised draft" })
      .where(eq(text.id, graph.textId))

    expect(await textService.findActiveTextContent(graph.textId)).toEqual({
      content: "Revised draft",
    })
  })

  it("returns null when the text is soft-deleted or missing", async () => {
    const graph = await rows.insertActiveText({
      textDeletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(await textService.findActiveTextContent(graph.textId)).toBeNull()
    expect(
      await textService.findActiveTextContent(`pr6-${crypto.randomUUID()}`)
    ).toBeNull()
  })
})

describe("textService.findOwnedText", () => {
  it("returns an active text for that user with the theme title", async () => {
    const graph = await rows.insertActiveText({
      themeTitle: "Owned theme",
    })

    expect(await textService.findOwnedText(graph.textId, graph.userId)).toEqual(
      {
        id: graph.textId,
        theme: {
          title: "Owned theme",
        },
      }
    )
  })

  it("returns null for another user's text, a missing id, or a soft-deleted text", async () => {
    const graph = await rows.insertActiveText()
    const otherUserId = await rows.insertUser()
    const deleted = await rows.insertActiveText({
      textDeletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(
      await textService.findOwnedText(graph.textId, otherUserId)
    ).toBeNull()
    expect(
      await textService.findOwnedText(
        `pr6-${crypto.randomUUID()}`,
        graph.userId
      )
    ).toBeNull()
    expect(
      await textService.findOwnedText(deleted.textId, deleted.userId)
    ).toBeNull()
  })
})

describe("textService.createText", () => {
  it("inserts the text titled for its theme", async () => {
    const graph = await rows.insertActiveText()
    const content = "She measured the gap and stayed."

    const created = await textService.createText({
      userId: graph.userId,
      themeId: graph.themeId,
      content,
    })

    rows.trackText(created.id)

    const stored = await db
      .select({
        id: text.id,
        title: text.title,
        content: text.content,
        userId: text.userId,
        themeId: text.themeId,
      })
      .from(text)
      .where(eq(text.id, created.id))

    expect(stored).toEqual([
      {
        id: created.id,
        title: `Text for theme ${graph.themeId}`,
        content,
        userId: graph.userId,
        themeId: graph.themeId,
      },
    ])
  })

  it("throws Text was not created when the insert returns nothing", async () => {
    await expectEmptyInsertThrows()
  })
})
