//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { Children, isValidElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"

//* Components imports
import { Editor } from "@/app/(app)/dashboard/exercises/[themeId]/write/_components/editor"

//* Local imports
import WritePage from "@/app/(app)/dashboard/exercises/[themeId]/write/page"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

afterEach(async () => {
  await rows.cleanup()
})

function loadPage(themeId: string) {
  return WritePage({
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
    const [prose, editor] = childElements(page) as [
      ReactElement<{ className?: string; children?: ReactNode }>,
      ReactElement<{ themeId?: string }>,
    ]

    expect(childElements(page)).toHaveLength(2)
    expect(prose.props.className).toContain("prose")
    expect(editor.type).toBe(Editor)
    expect(editor.props.themeId).toBe(themeId)

    const markup = renderToStaticMarkup(prose)

    expect(markup).toContain("<h2")
    expect(markup).toContain("Situação")
    expect(markup).toContain("A praça está vazia ao meio-dia.")
  })
})
