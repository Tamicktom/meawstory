//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import * as nextHeaders from "next/headers"
import * as workflowApi from "workflow/api"

//* Local imports
import { app } from "@/api"
import { openSession } from "@/tests/helpers/open-session"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"
import { correctionService } from "@/services/correction"
import { correctText } from "@/workflows/correction"

const rows = createIsolatedRows()
const headerBox = {
  current: new Headers(),
}
const started: unknown[][] = []
const sessions: Array<{ close: () => Promise<void> }> = []

let restoreSpies = () => {}

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

  restoreSpies = () => {
    headersSpy.mockRestore()
    startSpy.mockRestore()
  }
})

afterEach(async () => {
  restoreSpies()

  for (const session of sessions) {
    await session.close()
  }

  sessions.length = 0
  await rows.cleanup()
})

async function signIn(emailVerified: boolean) {
  const session = await openSession({ emailVerified })
  sessions.push(session)
  headerBox.current = session.headers
  return session
}

async function insertScene(userId: string) {
  const rubricId = await rows.insertRubric()
  const themeId = await rows.insertTheme(rubricId)

  const textId = await rows.insertText({
    userId,
    themeId,
    content: "cena ".repeat(100),
  })

  return { textId, rubricId }
}

function startRequest(textId: string) {
  return new Request(`http://localhost/api/correction/start/${textId}`, {
    method: "POST",
  })
}

describe("POST /api/correction/start/:textId", () => {
  it("returns 401 when there is no session", async () => {
    const graph = await rows.insertActiveText()
    const response = await app.handle(startRequest(graph.textId))

    expect(response.status).toBe(401)
    expect(started).toEqual([])
  })

  it("returns 404 for another person's scene", async () => {
    await signIn(true)
    const graph = await rows.insertActiveText()
    const response = await app.handle(startRequest(graph.textId))

    expect(response.status).toBe(404)
    expect(started).toEqual([])
  })

  it("returns 403 and starts nothing when the email is not verified", async () => {
    const session = await signIn(false)
    const { textId } = await insertScene(session.userId)
    const response = await app.handle(startRequest(textId))

    expect(response.status).toBe(403)
    expect(started).toEqual([])
  })

  it("starts the reading of a saved scene once the email is verified", async () => {
    const session = await signIn(true)
    const { textId } = await insertScene(session.userId)
    const response = await app.handle(startRequest(textId))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ textId })
    expect(started).toEqual([[correctText, [textId, expect.any(String)]]])
  })

  it("returns 409 and starts nothing when the scene already has a reading", async () => {
    const session = await signIn(true)
    const { textId, rubricId } = await insertScene(session.userId)

    await rows.insertCorrection({ textId, rubricId })

    const response = await app.handle(startRequest(textId))

    expect(response.status).toBe(409)
    expect(started).toEqual([])
  })
  it("leaves a recoverable failure if workflow dispatch fails", async () => {
    const session = await signIn(true)
    const { textId } = await insertScene(session.userId)
    const failure = spyOn(workflowApi, "start").mockImplementation(async () => {
      throw new Error("dispatch unavailable")
    })
    try {
      const response = await app.handle(startRequest(textId))
      expect(response.status).toBe(200)
      expect(
        (await correctionService.findLatestActiveCorrection(textId))?.status
      ).toBe("FAILED")
    } finally {
      failure.mockRestore()
    }
  })
})
