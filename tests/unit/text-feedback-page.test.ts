//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"
import { isValidElement } from "react"

//* Components imports
import { FeedbackView } from "@/components/feedback/feedback-view"
import { StructuredReadingView } from "@/components/feedback/structured-reading"
import { ReadingGate } from "@/components/reading/reading-gate"

//* Local imports
import TextFeedbackPage from "@/app/(app)/dashboard/texts/[textId]/page"
import { db } from "@/database"
import { text } from "@/database/schema"
import { openSession } from "@/tests/helpers/open-session"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"
import { insertCompletedStructuredReading } from "@/tests/helpers/structured-reading"

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

async function signIn(emailVerified = false) {
  const session = await openSession({ emailVerified })
  sessions.push(session)
  headerBox.current = session.headers
  return session
}

function loadPage(
  textId: string,
  searchParams: { error?: string; versao?: string } = {}
) {
  return TextFeedbackPage({
    params: Promise.resolve({
      textId,
    }),
    searchParams: Promise.resolve(searchParams),
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

async function expectRedirectToSignIn(textId: string) {
  let thrown: unknown

  try {
    await loadPage(textId)
  } catch (error) {
    thrown = error
  }

  expect((thrown as { digest?: string }).digest).toContain("/sign-in")
}

function gateProps(element: unknown) {
  if (!isValidElement(element) || element.type !== ReadingGate) {
    throw new Error("Expected the page to render ReadingGate.")
  }

  return element.props as {
    textId: string
    themeTitle: string
    textContent: string
    email: string
    emailVerified: boolean
    verificationLinkFailed: boolean
  }
}

function structuredProps(element: unknown) {
  if (!isValidElement(element) || element.type !== StructuredReadingView) {
    throw new Error("Expected the page to render StructuredReadingView.")
  }

  return element.props as {
    version: number
    scene: string
    revisionIntent: string | null
    reviseHref?: string
    latestHref?: string
    versions?: { version: number }[]
  }
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
  it("redirects to sign in when there is no session", async () => {
    const graph = await rows.insertActiveText()

    await expectRedirectToSignIn(graph.textId)
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
      status: "COMPLETED",
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

    expect(props.themeTitle).toBe(`Text ${textId}`)
    expect(props.correction).toEqual({
      content: "Newer note",
      score: "20.00",
      textContent: "Newer text",
    })
  })

  async function insertSceneWithoutCorrection(userId: string) {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      title: "A letter that arrives late",
    })

    return rows.insertText({
      userId,
      themeId,
    })
  }

  it("keeps the scene and asks for the email when an unverified account has no correction", async () => {
    const session = await signIn(false)
    const textId = await insertSceneWithoutCorrection(session.userId)
    const props = gateProps(await loadPage(textId))

    expect(props.textId).toBe(textId)
    expect(props.themeTitle).toBe(`Text ${textId}`)
    expect(props.emailVerified).toBe(false)
    expect(props.verificationLinkFailed).toBe(false)
    expect(props.email).toContain("@example.com")
  })

  it("shows the frozen version and opens the next draft from its focus", async () => {
    const session = await signIn(true)
    const rubricId = await rows.insertRubric({ structured: true })
    const themeId = await rows.insertTheme(rubricId)
    const content = "Uma cena. ".repeat(20)
    const textId = await rows.insertText({
      userId: session.userId,
      themeId,
      content,
    })
    await insertCompletedStructuredReading(rows, {
      textId,
      rubricId,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    await db
      .update(text)
      .set({ content: `${content}\n\nEla atravessou.` })
      .where(eq(text.id, textId))
    await insertCompletedStructuredReading(rows, {
      textId,
      rubricId,
      revisionIntent: "Tornar o gesto visível.",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    })

    const latest = structuredProps(await loadPage(textId))
    expect(latest.version).toBe(2)
    expect(latest.scene).toContain("Ela atravessou.")
    expect(latest.revisionIntent).toBe("Tornar o gesto visível.")
    expect(latest.reviseHref).toBe(
      `/dashboard/exercises/${themeId}/write?textId=${textId}`
    )
    expect(latest.versions?.map((item) => item.version)).toEqual([1, 2])

    const earlier = structuredProps(await loadPage(textId, { versao: "1" }))
    expect(earlier.version).toBe(1)
    expect(earlier.scene).not.toContain("Ela atravessou.")
    expect(earlier.revisionIntent).toBeNull()
    expect(earlier.reviseHref).toBeUndefined()
    expect(earlier.latestHref).toBe(`/dashboard/texts/${textId}`)
  })

  it("renders not found for a version that does not exist", async () => {
    const session = await signIn(true)
    const rubricId = await rows.insertRubric({ structured: true })
    const themeId = await rows.insertTheme(rubricId)
    const textId = await rows.insertText({
      userId: session.userId,
      themeId,
      content: "Uma cena. ".repeat(20),
    })
    await insertCompletedStructuredReading(rows, { textId, rubricId })

    await expect(loadPage(textId, { versao: "4" })).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404"
    )
  })

  it("offers the reading when a verified account has no correction", async () => {
    const session = await signIn(true)
    const textId = await insertSceneWithoutCorrection(session.userId)
    const props = gateProps(await loadPage(textId))

    expect(props.emailVerified).toBe(true)
  })

  it("flags a verification link that came back with an error", async () => {
    const session = await signIn(false)
    const textId = await insertSceneWithoutCorrection(session.userId)
    const props = gateProps(await loadPage(textId, { error: "TOKEN_EXPIRED" }))

    expect(props.verificationLinkFailed).toBe(true)
  })
})
