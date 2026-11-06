//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import * as nextHeaders from "next/headers"
import { openSession } from "@/tests/helpers/open-session"
import { renderToStaticMarkup } from "react-dom/server"

//* Components imports
import { Editor } from "@/app/(app)/dashboard/exercises/[themeId]/write/_components/editor"

//* Local imports
import WritePage from "@/app/(app)/dashboard/exercises/[themeId]/write/page"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
const headerBox = { current: new Headers() }
const sessions: Awaited<ReturnType<typeof openSession>>[] = []
let restoreHeaders = () => {}

beforeEach(() => {
  headerBox.current = new Headers()
  const spy = spyOn(nextHeaders, "headers").mockImplementation(
    async () => headerBox.current as never
  )
  restoreHeaders = () => spy.mockRestore()
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

function loadPage(themeId: string, textId?: string) {
  return WritePage({
    searchParams: textId ? Promise.resolve({ textId }) : undefined,
    params: Promise.resolve({
      themeId,
    }),
  })
}

async function expectNotFound(themeId: string) {
  let thrown: unknown

  try {
    await loadPage(themeId)
  } catch (error) {
    thrown = error
  }

  expect(thrown).toBeInstanceOf(Error)
  expect((thrown as Error).message).toBe("NEXT_HTTP_ERROR_FALLBACK;404")
}

function childElements(node: ReactNode) {
  if (!isValidElement(node)) {
    throw new Error("Expected the write page to render an element.")
  }

  return Children.toArray(
    (node.props as { children?: ReactNode }).children
  ).filter(isValidElement)
}

describe("WritePage", () => {
  it("renders not found when the theme is missing", async () => {
    await expectNotFound(`missing-${crypto.randomUUID()}`)
  })

  it("renders not found when the theme is soft-deleted", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    await expectNotFound(themeId)
  })

  it("shows the theme markdown beside the editor", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      description: "## Situação\n\nA praça está vazia ao meio-dia.",
    })
    const page = await loadPage(themeId)
    const [, grid] = childElements(page)
    const [information, editor] = childElements(grid) as [
      ReactElement<{ className?: string; children?: ReactNode }>,
      ReactElement<{ themeId?: string }>,
    ]

    expect(childElements(page)).toHaveLength(2)
    expect(editor.type).toBe(Editor)
    expect(editor.props.themeId).toBe(themeId)

    const markup = renderToStaticMarkup(information)

    expect(markup).toContain("<h2")
    expect(markup).toContain("Situação")
    expect(markup).toContain("A praça está vazia ao meio-dia.")
  })
})

describe("WritePage draft access", () => {
  it("requires a session to resume a draft", async () => {
    const graph = await rows.insertActiveText()
    await expect(loadPage(graph.themeId, graph.textId)).rejects.toMatchObject({
      digest: expect.stringContaining("/sign-in"),
    })
  })

  it("resumes the signed-in author's draft without changing its content", async () => {
    const session = await signIn()
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId)
    const textId = await rows.insertText({
      userId: session.userId,
      themeId,
      content: "Cena salva.\n\nOutro parágrafo.",
    })
    const page = await loadPage(themeId, textId)
    const [, grid] = childElements(page)
    const [, editor] = childElements(grid) as ReactElement<{
      textId: string
      initialContent: string
    }>[]
    expect(editor.type).toBe(Editor)
    expect(editor.props.textId).toBe(textId)
    expect(editor.props.initialContent).toBe("Cena salva.\n\nOutro parágrafo.")
  })

  it("hides drafts that belong to another author", async () => {
    await signIn()
    const graph = await rows.insertActiveText()
    await expect(loadPage(graph.themeId, graph.textId)).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404"
    )
  })

  it("hides a draft when it belongs to another exercise", async () => {
    const session = await signIn()
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId)
    const anotherThemeId = await rows.insertTheme(rubricId)
    const textId = await rows.insertText({ userId: session.userId, themeId })
    await expect(loadPage(anotherThemeId, textId)).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404"
    )
  })

  for (const status of [
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "FAILED",
  ] as const) {
    it(`opens the saved scene instead of the editor when its reading is ${status}`, async () => {
      const session = await signIn()
      const rubricId = await rows.insertRubric()
      const themeId = await rows.insertTheme(rubricId)
      const textId = await rows.insertText({ userId: session.userId, themeId })
      await rows.insertCorrection({ textId, rubricId, status })
      await expect(loadPage(themeId, textId)).rejects.toMatchObject({
        digest: expect.stringContaining(`/dashboard/texts/${textId}`),
      })
    })
  }
})
