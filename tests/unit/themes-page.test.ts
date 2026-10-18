//* Libraries imports
import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import ThemesPage from "@/app/(app)/dashboard/themes/page"
import { themeService } from "@/services/theme"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

type ListedTheme = {
  id: string
  title: string
  description: string
  image: string | null
}

let restoreList = () => {}

afterEach(async () => {
  restoreList()
  restoreList = () => {}
  await rows.cleanup()
})

function stubCatalog(themes: ListedTheme[]) {
  const spy = spyOn(themeService, "listActiveThemes").mockResolvedValue(themes)
  restoreList = () => {
    spy.mockRestore()
  }
}

function linkBlock(markup: string, themeId: string) {
  const href = `/dashboard/themes/${themeId}`
  const block = markup
    .split("<a ")
    .find((part) => part.includes(`href="${href}"`))

  if (!block) {
    throw new Error(`Expected a card link for ${themeId}.`)
  }

  return block
}

describe("ThemesPage", () => {
  it("lists active themes by title and stops at 32", async () => {
    const catalog = await themeService.listActiveThemes()
    const markup = renderToStaticMarkup(await ThemesPage())
    const ids = [
      ...markup.matchAll(/href="\/dashboard\/themes\/([^"]+)"/g),
    ].map((match) => match[1])

    expect(catalog.length).toBeLessThanOrEqual(32)
    expect(ids).toEqual(catalog.map((theme) => theme.id))

    let cursor = 0

    for (const theme of catalog) {
      const index = markup.indexOf(theme.title, cursor)

      expect(index).toBeGreaterThanOrEqual(0)
      cursor = index + theme.title.length
    }
  })

  it("leaves a soft-deleted theme out of the list", async () => {
    const rubricId = await rows.insertRubric()
    const title = `000-deleted-${crypto.randomUUID()}`

    await rows.insertTheme(rubricId, {
      title,
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    const markup = renderToStaticMarkup(await ThemesPage())

    expect(markup).not.toContain(title)
  })

  it("links each card to the theme detail page", async () => {
    stubCatalog([
      {
        id: "theme-alpha",
        title: "Alpha theme",
        description: "Primeira cena.",
        image: null,
      },
      {
        id: "theme-beta",
        title: "Beta theme",
        description: "Segunda cena.",
        image: null,
      },
    ])

    const markup = renderToStaticMarkup(await ThemesPage())

    expect(markup.indexOf("Alpha theme")).toBeLessThan(
      markup.indexOf("Beta theme")
    )
    expect(markup).toContain('href="/dashboard/themes/theme-alpha"')
    expect(markup).toContain('href="/dashboard/themes/theme-beta"')
  })

  it("uses the Situação section as the card excerpt", async () => {
    stubCatalog([
      {
        id: "theme-situation",
        title: "Theme with a situation",
        description: [
          "## Situação",
          "",
          "Uma rua molhada.",
          "",
          "## O que já é verdade",
          "",
          "- O farol fechou.",
        ].join("\n"),
        image: null,
      },
      {
        id: "theme-plain",
        title: "Theme without a heading",
        description: "  Descrição inteira da cena.  ",
        image: null,
      },
      {
        id: "theme-empty-section",
        title: "Theme with an empty section",
        description: ["## Situação", "", "## O que já é verdade", "", "- Algo."].join(
          "\n"
        ),
        image: null,
      },
    ])

    const markup = renderToStaticMarkup(await ThemesPage())
    const situation = linkBlock(markup, "theme-situation")
    const plain = linkBlock(markup, "theme-plain")
    const emptySection = linkBlock(markup, "theme-empty-section")

    expect(situation).toContain("Uma rua molhada.")
    expect(situation).not.toContain("O farol fechou.")
    expect(plain).toContain("Descrição inteira da cena.")
    expect(emptySection).toContain("## Situação")
    expect(emptySection).toContain("Algo.")
  })

  it("renders an image only when the theme has one", async () => {
    stubCatalog([
      {
        id: "theme-cover",
        title: "Theme with a cover",
        description: "Cena com imagem.",
        image: "https://example.test/cover.png",
      },
      {
        id: "theme-text",
        title: "Theme without a cover",
        description: "Cena sem imagem.",
        image: null,
      },
    ])

    const markup = renderToStaticMarkup(await ThemesPage())

    expect(linkBlock(markup, "theme-cover")).toContain(
      'src="https://example.test/cover.png"'
    )
    expect(linkBlock(markup, "theme-text")).not.toContain("<img")
  })

  it("shows an empty catalog message when there are no themes", async () => {
    stubCatalog([])

    const markup = renderToStaticMarkup(await ThemesPage())

    expect(markup).toContain("No themes yet.")
    expect(markup).not.toContain('href="/dashboard/themes/')
  })
})
