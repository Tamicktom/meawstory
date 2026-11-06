//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"

//* Local imports
import { app } from "@/api"
import { db } from "@/database"
import { correction, text } from "@/database/schema"
import { openSession } from "@/tests/helpers/open-session"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
const headerBox = { current: new Headers() }
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
  for (const session of sessions) await session.close()
  sessions.length = 0
  await rows.cleanup()
})

async function signIn() {
  const session = await openSession()
  sessions.push(session)
  headerBox.current = session.headers
  return session
}

function sceneRequest(textId: string, action: "close" | "reopen") {
  return new Request(`http://localhost/api/scenes/${textId}/${action}`, {
    method: "POST",
  })
}

describe("POST /api/scenes/:textId/close", () => {
  it("returns 401 when there is no session", async () => {
    const graph = await rows.insertActiveText()
    const response = await app.handle(sceneRequest(graph.textId, "close"))

    expect(response.status).toBe(401)
  })

  it("returns 409 while the current reading is not completed", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))

    const response = await app.handle(sceneRequest(graph.textId, "close"))

    expect(response.status).toBe(409)
  })

  it("closes the signed-in person's finished scene at any score", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    const correctionId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "10.00",
      status: "COMPLETED",
    })

    const response = await app.handle(sceneRequest(graph.textId, "close"))
    const body = (await response.json()) as { closedAt: string }
    const [stored] = await db
      .select({ score: correction.score, status: correction.status })
      .from(correction)
      .where(eq(correction.id, correctionId))

    expect(response.status).toBe(200)
    expect(body.closedAt).toEqual(expect.any(String))
    expect(stored).toEqual({ score: "10.00", status: "COMPLETED" })
  })
})

describe("POST /api/scenes/:textId/reopen", () => {
  it("returns 401 when there is no session", async () => {
    const graph = await rows.insertActiveText()
    const response = await app.handle(sceneRequest(graph.textId, "reopen"))

    expect(response.status).toBe(401)
  })

  it("returns 409 when the scene is already open", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))

    const response = await app.handle(sceneRequest(graph.textId, "reopen"))

    expect(response.status).toBe(409)
  })

  it("reopens a scene the signed-in person closed", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({ userId: session.userId, closedAt: new Date() })
      .where(eq(text.id, graph.textId))

    const response = await app.handle(sceneRequest(graph.textId, "reopen"))
    const [stored] = await db
      .select({ closedAt: text.closedAt })
      .from(text)
      .where(eq(text.id, graph.textId))

    expect(response.status).toBe(200)
    expect(stored?.closedAt).toBeNull()
  })
})
