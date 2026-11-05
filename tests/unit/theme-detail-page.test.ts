//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import ThemePage from "@/app/(app)/dashboard/themes/[id]/page"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

afterEach(async () => {
  await rows.cleanup()
})

function loadPage(id: string) {
  return ThemePage({
    params: Promise.resolve({
      id,
    }),
  })
}

async function expectNotFound(id: string) {
  let thrown: unknown

  try {
    await loadPage(id)
  } catch (error) {
    thrown = error
  }

  expect(thrown).toBeInstanceOf(Error)
  expect((thrown as Error).message).toBe("NEXT_HTTP_ERROR_FALLBACK;404")
}

describe("ThemePage", () => {
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

  it("renders the theme description as markdown", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      description: "## Situação\n\nA praça está vazia ao meio-dia.",
    })
    const markup = renderToStaticMarkup(await loadPage(themeId))

    expect(markup).toContain("<h2")
    expect(markup).toContain("Situação")
    expect(markup).toContain("A praça está vazia ao meio-dia.")
  })

  it("links Escrever exercício to the write screen", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId)
    const markup = renderToStaticMarkup(await loadPage(themeId))

    expect(markup).toContain("Escrever exercício")
    expect(markup).toContain(`href="/dashboard/exercises/${themeId}/write"`)
  })
})
