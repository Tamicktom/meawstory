//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import * as nextHeaders from "next/headers"

//* Local imports
import { app } from "@/api"
import { openSession } from "@/tests/helpers/open-session"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
const headerBox = {
  current: new Headers(),
}
const sessions: Array<{ close: () => Promise<void> }> = []

let restoreHeaders = () => {}

beforeEach(() => {
  headerBox.current = new Headers()

  const headersSpy = spyOn(nextHeaders, "headers").mockImplementation(
    async () => headerBox.current as never
  )

  restoreHeaders = () => {
    headersSpy.mockRestore()
  }
})

afterEach(async () => {
  restoreHeaders()

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

function statusRequest(textId: string) {
  return new Request(
    `http://localhost/api/correction/check-correction-status/${textId}`
  )
}

describe("GET /api/correction/check-correction-status/:textId", () => {
  it("returns 401 and Unauthorized when there is no session", async () => {
    const graph = await rows.insertActiveText()
    const response = await app.handle(statusRequest(graph.textId))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      message: "Unauthorized",
    })
  })

  it("returns the latest active correction status for that text", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      content: "Owned draft",
    })
    const textId = await rows.insertText({
      userId: session.userId,
      themeId: graph.themeId,
      content: "Owned draft",
    })

    await rows.insertCorrection({
      textId,
      rubricId: graph.rubricId,
      content: "Older note",
      score: "10.00",
      status: "PENDING",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId,
      rubricId: graph.rubricId,
      content: "Newer note",
      score: "20.00",
      status: "COMPLETED",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId,
      rubricId: graph.rubricId,
      content: "Retired note",
      score: "30.00",
      status: "FAILED",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      deletedAt: new Date("2026-01-02T00:00:00.000Z"),
    })

    const response = await app.handle(statusRequest(textId))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: "COMPLETED",
    })
  })

  it("returns PENDING when the text has no active correction", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    const textId = await rows.insertText({
      userId: session.userId,
      themeId: graph.themeId,
    })
    const response = await app.handle(statusRequest(textId))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: "PENDING",
    })
  })

  it("returns PENDING when the only correction is soft-deleted", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    const textId = await rows.insertText({
      userId: session.userId,
      themeId: graph.themeId,
    })

    await rows.insertCorrection({
      textId,
      rubricId: graph.rubricId,
      content: "Retired note",
      status: "COMPLETED",
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    const response = await app.handle(statusRequest(textId))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: "PENDING",
    })
  })

  it("rejects a text owned by another user", async () => {
    await signIn()
    const graph = await rows.insertActiveText()

    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "Private note",
      status: "COMPLETED",
    })

    const response = await app.handle(statusRequest(graph.textId))
    const payload = (await response.json()) as {
      status?: string
      message?: string
    }

    expect(response.ok).toBe(false)
    expect(payload.status).toBeUndefined()
    expect(JSON.stringify(payload)).not.toContain("Private note")
    expect(JSON.stringify(payload)).not.toContain("COMPLETED")
  })
})
