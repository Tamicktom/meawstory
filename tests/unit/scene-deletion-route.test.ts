//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"

//* Local imports
import { app } from "@/api"
import { db } from "@/database"
import { text } from "@/database/schema"
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

function sceneRequest(textId: string, action: "retire" | "restore") {
  return new Request(`http://localhost/api/scenes/${textId}/${action}`, {
    method: "POST",
  })
}

describe("POST /api/scenes/:textId/retire", () => {
  it("returns 401 when there is no session", async () => {
    const graph = await rows.insertActiveText()
    const response = await app.handle(sceneRequest(graph.textId, "retire"))

    expect(response.status).toBe(401)
    expect(
      (await db.select().from(text).where(eq(text.id, graph.textId)))[0]
        ?.deletedAt
    ).toBeNull()
  })

  it("returns 404 for another person's scene", async () => {
    await signIn()
    const graph = await rows.insertActiveText()
    const response = await app.handle(sceneRequest(graph.textId, "retire"))

    expect(response.status).toBe(404)
    expect(
      (await db.select().from(text).where(eq(text.id, graph.textId)))[0]
        ?.deletedAt
    ).toBeNull()
  })

  it("retires the signed-in person's scene", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))

    const response = await app.handle(sceneRequest(graph.textId, "retire"))
    const body = (await response.json()) as { deletedAt: string }

    expect(response.status).toBe(200)
    expect(body.deletedAt).toEqual(expect.any(String))
    expect(
      (await db.select().from(text).where(eq(text.id, graph.textId)))[0]
        ?.deletedAt
    ).not.toBeNull()
  })
})

describe("POST /api/scenes/:textId/restore", () => {
  it("returns 401 when there is no session", async () => {
    const graph = await rows.insertActiveText({
      textDeletedAt: new Date(),
    })
    const response = await app.handle(sceneRequest(graph.textId, "restore"))

    expect(response.status).toBe(401)
  })

  it("returns 404 when the scene was not retired", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))

    const response = await app.handle(sceneRequest(graph.textId, "restore"))

    expect(response.status).toBe(404)
  })

  it("restores a scene inside the server window", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({
        userId: session.userId,
        deletedAt: new Date(),
      })
      .where(eq(text.id, graph.textId))

    const response = await app.handle(sceneRequest(graph.textId, "restore"))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ restored: true })
    expect(
      (await db.select().from(text).where(eq(text.id, graph.textId)))[0]
        ?.deletedAt
    ).toBeNull()
  })

  it("returns 409 when the undo window has closed and keeps the scene retired", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    const deletedAt = new Date(Date.now() - 11_000)
    await db
      .update(text)
      .set({
        userId: session.userId,
        deletedAt,
      })
      .where(eq(text.id, graph.textId))

    const response = await app.handle(sceneRequest(graph.textId, "restore"))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      message: "O prazo para desfazer esta exclusão acabou.",
    })
    expect(
      (await db.select().from(text).where(eq(text.id, graph.textId)))[0]
        ?.deletedAt
    ).not.toBeNull()
  })
})
