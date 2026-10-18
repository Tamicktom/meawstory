//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"
import { isValidElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

//* Components imports
import { FeedbackView } from "@/components/feedback/feedback-view"

//* Local imports
import TextFeedbackPage from "@/app/(app)/dashboard/texts/[textId]/page"
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

function loadPage(textId: string) {
  return TextFeedbackPage({
    params: Promise.resolve({
      textId,
    }),
  })
}

async function expectNotFound(textId: string) {
  let thrown: unknown

  try {
    await loadPage(textId)
  } catch (error) {
    thrown = error
  }

  expect(thrown).toBeInstanceOf(Error)
  expect((thrown as Error).message).toBe("NEXT_HTTP_ERROR_FALLBACK;404")
}

function feedbackProps(element: unknown) {
  if (!isValidElement(element) || element.type !== FeedbackView) {
    throw new Error("Expected the page to render FeedbackView.")
  }

  return element.props as {
    themeTitle: string
    correction: {
      content: string
      score: string
      textContent: string
    } | null
  }
}

describe("TextFeedbackPage", () => {
  it("renders not found when there is no session", async () => {
    const graph = await rows.insertActiveText()

    await expectNotFound(graph.textId)
  })

  it("renders not found when another user owns the text", async () => {
    await signIn()
    const graph = await rows.insertActiveText()

    await expectNotFound(graph.textId)
  })

  it("renders not found when the text is missing", async () => {
    await signIn()

    await expectNotFound(`missing-${crypto.randomUUID()}`)
  })

  it("renders not found when the text is soft-deleted", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    const textId = await rows.insertText({
      userId: session.userId,
      themeId: graph.themeId,
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    await expectNotFound(textId)
  })

  it("passes the theme title and the latest active correction into FeedbackView", async () => {
    const session = await signIn()
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      title: "A letter that arrives late",
    })
    const textId = await rows.insertText({
      userId: session.userId,
      themeId,
      content: "Older text",
    })

    await rows.insertCorrection({
      textId,
      rubricId,
      content: "Older note",
      score: "10.00",
      textContent: "Older text",
      status: "COMPLETED",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    })

    await db
      .update(text)
      .set({
        content: "Newer text",
      })
      .where(eq(text.id, textId))
    await rows.insertCorrection({
      textId,
      rubricId,
      content: "Newer note",
      score: "20.00",
      textContent: "Newer text",
      status: "IN_PROGRESS",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
    })

    await db
      .update(text)
      .set({
        content: "Deleted text",
      })
      .where(eq(text.id, textId))
    await rows.insertCorrection({
      textId,
      rubricId,
      content: "Deleted note",
      score: "30.00",
      textContent: "Deleted text",
      status: "FAILED",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      deletedAt: new Date("2026-01-02T00:00:00.000Z"),
    })

    const props = feedbackProps(await loadPage(textId))

    expect(props.themeTitle).toBe("A letter that arrives late")
    expect(props.correction).toEqual({
      content: "Newer note",
      score: "20.00",
      textContent: "Newer text",
    })
  })

  it("stays on the pending copy when the correction is missing", async () => {
    const session = await signIn()
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      title: "A letter that arrives late",
    })
    const textId = await rows.insertText({
      userId: session.userId,
      themeId,
    })
    const markup = renderToStaticMarkup(await loadPage(textId))

    expect(markup).toContain("A letter that arrives late")
    expect(markup).toContain("A correção ainda está sendo preparada.")
    expect(markup).not.toContain("de 1000")
  })
})
