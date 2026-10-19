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

describe("textService.listOwnedTexts", () => {
  it("returns that user's active texts newest first with the latest completed score", async () => {
    const older = await rows.insertActiveText({
      content: "The older draft stays on the desk.",
      themeTitle: "Older theme",
    })
    const newerId = await rows.insertText({
      userId: older.userId,
      themeId: older.themeId,
      content: "The newer draft names the missing key.",
    })
    const retiredId = await rows.insertText({
      userId: older.userId,
      themeId: older.themeId,
      content: "This draft was retired.",
      deletedAt: new Date("2024-03-01T00:00:00.000Z"),
    })
    const other = await rows.insertActiveText({
      content: "Another writer keeps this draft.",
      themeTitle: "Someone else's theme",
    })

    await db
      .update(text)
      .set({ createdAt: new Date("2020-01-01T00:00:00.000Z") })
      .where(eq(text.id, older.textId))
    await db
      .update(text)
      .set({ createdAt: new Date("2024-06-01T00:00:00.000Z") })
      .where(eq(text.id, newerId))

    await rows.insertCorrection({
      textId: newerId,
      rubricId: older.rubricId,
      score: "10.00",
      status: "COMPLETED",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId: newerId,
      rubricId: older.rubricId,
      score: "640.00",
      status: "COMPLETED",
      createdAt: new Date("2024-06-02T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId: newerId,
      rubricId: older.rubricId,
      score: "900.00",
      status: "COMPLETED",
      createdAt: new Date("2024-06-03T00:00:00.000Z"),
      deletedAt: new Date("2024-06-04T00:00:00.000Z"),
    })

    const listed = await textService.listOwnedTexts(older.userId)

    expect(listed.map((item) => item.id)).toEqual([newerId, older.textId])
    expect(listed[0]).toEqual({
      id: newerId,
      content: "The newer draft names the missing key.",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
      themeTitle: "Older theme",
      correction: {
        status: "COMPLETED",
        score: "640.00",
      },
    })
    expect(listed[1]?.correction).toBeNull()
    expect(listed.some((item) => item.id === retiredId)).toBe(false)
    expect(listed.some((item) => item.id === other.textId)).toBe(false)
  })

  it("omits the score when the latest active correction is not completed", async () => {
    const graph = await rows.insertActiveText({
      content: "A draft still waiting on the grade.",
    })

    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "640.00",
      status: "COMPLETED",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "0.00",
      status: "PENDING",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
    })

    const listed = await textService.listOwnedTexts(graph.userId)

    expect(listed).toHaveLength(1)
    expect(listed[0]?.id).toBe(graph.textId)
    expect(listed[0]?.correction).toEqual({
      status: "PENDING",
      score: null,
    })
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
