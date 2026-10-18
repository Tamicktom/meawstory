//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"
import * as workflowApi from "workflow/api"

//* Local imports
import { app } from "@/api"
import { db } from "@/database"
import { text } from "@/database/schema"
import { openSession } from "@/tests/helpers/open-session"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"
import { correctText } from "@/workflows/correction"

const rows = createIsolatedRows()
const headerBox = {
  current: new Headers(),
}
const started: unknown[][] = []
const sessions: Array<{ close: () => Promise<void> }> = []

let restoreHeaders = () => {}
let restoreStart = () => {}

beforeEach(() => {
  headerBox.current = new Headers()
  started.length = 0

  const headersSpy = spyOn(nextHeaders, "headers").mockImplementation(
    async () => headerBox.current as never
  )
  const startSpy = spyOn(workflowApi, "start").mockImplementation(
    async (...args: unknown[]) => {
      started.push(args)
      return {} as never
    }
  )

  restoreHeaders = () => {
    headersSpy.mockRestore()
  }
  restoreStart = () => {
    startSpy.mockRestore()
  }
})

afterEach(async () => {
  restoreHeaders()
  restoreStart()

  for (const session of sessions) {
    await session.close()
  }

  sessions.length = 0
  await rows.cleanup()
})

async function signIn() {
  const session = await openSession()
  sessions.push(session)
  headerBox.current = session.headers
  return session
}

function writeRequest(themeId: string, content: string) {
  return new Request(`http://localhost/api/write/${themeId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  })
}

async function textsForUser(userId: string) {
  return db
    .select({
      id: text.id,
    })
    .from(text)
    .where(eq(text.userId, userId))
}

describe("POST /api/write/:themeId", () => {
  it("returns 401 and Unauthorized when there is no session", async () => {
    const graph = await rows.insertActiveText()
    const response = await app.handle(
      writeRequest(graph.themeId, "A sentence with a scene.")
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      message: "Unauthorized",
    })
    expect(started).toEqual([])
  })

  it("inserts a text for that user and theme, starts the correction workflow, and returns the text id", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    const content = "She measured the gap and stayed."
    const response = await app.handle(writeRequest(graph.themeId, content))
    const payload = (await response.json()) as {
      textId?: string
    }

    expect(response.status).toBe(200)
    expect(typeof payload.textId).toBe("string")

    const textId = payload.textId ?? ""
    rows.trackText(textId)

    const stored = await db
      .select({
        id: text.id,
        title: text.title,
        content: text.content,
        userId: text.userId,
        themeId: text.themeId,
      })
      .from(text)
      .where(eq(text.id, textId))

    expect(stored).toEqual([
      {
        id: textId,
        title: `Text for theme ${graph.themeId}`,
        content,
        userId: session.userId,
        themeId: graph.themeId,
      },
    ])
    expect(started).toEqual([[correctText, [textId]]])
  })

  it("rejects an empty body and inserts no text", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    const response = await app.handle(writeRequest(graph.themeId, ""))
    const payload = await response.text()

    expect(response.ok).toBe(false)
    expect(payload).not.toContain("textId")
    expect(await textsForUser(session.userId)).toEqual([])
    expect(started).toEqual([])
  })

  it("rejects a missing theme and inserts no text", async () => {
    const session = await signIn()
    const themeId = `missing-${crypto.randomUUID()}`
    const response = await app.handle(
      writeRequest(themeId, "A sentence with a scene.")
    )
    const payload = await response.text()

    expect(response.ok).toBe(false)
    expect(payload).not.toContain("textId")
    expect(payload).not.toContain("Failed query")
    expect(await textsForUser(session.userId)).toEqual([])
    expect(started).toEqual([])
  })

  it("rejects a soft-deleted theme and inserts no text", async () => {
    const session = await signIn()
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })
    const response = await app.handle(
      writeRequest(themeId, "A sentence with a scene.")
    )
    const payload = await response.text()

    expect(response.ok).toBe(false)
    expect(payload).not.toContain("textId")
    expect(payload).not.toContain("Failed query")
    expect(await textsForUser(session.userId)).toEqual([])
    expect(started).toEqual([])
  })

  it("surfaces Text was not created when the insert returns no row", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
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
      const response = await app.handle(
        writeRequest(graph.themeId, "A sentence with a scene.")
      )
      const payload = await response.text()

      expect(response.ok).toBe(false)
      expect(payload).toContain("Text was not created")
      expect(payload).not.toContain("textId")
    } finally {
      insert.mockRestore()
    }

    expect(await textsForUser(session.userId)).toEqual([])
    expect(started).toEqual([])
  })
})
