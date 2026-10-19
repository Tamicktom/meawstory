//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import TextsPage from "@/app/(app)/dashboard/texts/page"
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

async function loadPage() {
  return renderToStaticMarkup(await TextsPage())
}

async function expectNotFound() {
  let thrown: unknown

  try {
    await TextsPage()
  } catch (error) {
    thrown = error
  }

  expect(thrown).toBeInstanceOf(Error)
  expect((thrown as Error).message).toBe("NEXT_HTTP_ERROR_FALLBACK;404")
}

describe("TextsPage", () => {
  it("renders not found when there is no session", async () => {
    await rows.insertActiveText()

    await expectNotFound()
  })

  it("shows an empty history with a link to the themes", async () => {
    await signIn()

    const markup = await loadPage()

    expect(markup).toContain("Texts")
    expect(markup).toContain("No texts yet.")
    expect(markup).toContain('id="texts-browse-themes"')
    expect(markup).toContain('href="/dashboard/themes"')
  })

  it("lists the signed-in user's texts newest first and leaves out other writers", async () => {
    const session = await signIn()
    const older = await rows.insertActiveText({
      content: "The older draft stays on the desk.",
      themeTitle: "Older theme",
    })
    const newerThemeId = await rows.insertTheme(older.rubricId, {
      title: "Newer theme",
    })
    const newerId = await rows.insertText({
      userId: session.userId,
      themeId: newerThemeId,
      content: "The newer draft names the missing key.",
    })
    await rows.insertText({
      userId: older.userId,
      themeId: older.themeId,
      content: "This draft belongs to someone else.",
    })

    await db
      .update(text)
      .set({
        userId: session.userId,
        createdAt: new Date("2020-01-01T00:00:00.000Z"),
      })
      .where(eq(text.id, older.textId))
    await db
      .update(text)
      .set({ createdAt: new Date("2024-06-01T00:00:00.000Z") })
      .where(eq(text.id, newerId))

    await rows.insertCorrection({
      textId: newerId,
      rubricId: older.rubricId,
      score: "640.00",
      status: "COMPLETED",
    })

    const markup = await loadPage()
    const newerIndex = markup.indexOf("Newer theme")
    const olderIndex = markup.indexOf("Older theme")

    expect(newerIndex).toBeGreaterThan(-1)
    expect(olderIndex).toBeGreaterThan(newerIndex)
    expect(markup).toContain("The newer draft names the missing key.")
    expect(markup).toContain("The older draft stays on the desk.")
    expect(markup).toContain('dateTime="2024-06-01T00:00:00.000Z"')
    expect(markup).toContain("Jun 1, 2024")
    expect(markup).toContain("640 / 1000")
    expect(markup).toContain("Waiting for correction")
    expect(markup).not.toContain("This draft belongs to someone else.")
    expect(markup).not.toContain("No texts yet.")
  })

  it("hides the placeholder score while a correction is still running", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      themeTitle: "A letter that arrives late",
    })

    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "0.00",
      status: "IN_PROGRESS",
    })

    const markup = await loadPage()

    expect(markup).toContain("Correction in progress")
    expect(markup).not.toContain("/ 1000")
  })

  it("says the correction failed when the latest attempt failed", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      themeTitle: "A letter that arrives late",
    })

    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "0.00",
      status: "FAILED",
    })

    const markup = await loadPage()

    expect(markup).toContain("Correction failed")
    expect(markup).not.toContain("/ 1000")
  })
})
