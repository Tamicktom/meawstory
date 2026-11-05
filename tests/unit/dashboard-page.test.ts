//* Libraries imports
import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import DashboardPage from "@/app/(app)/dashboard/page"

describe("DashboardPage", () => {
  it("explains that the user picks a theme, writes a text, and receives a correction", () => {
    const markup = renderToStaticMarkup(DashboardPage())

    expect(markup).toContain(
      "Escolha um exercício, escreva uma cena e receba uma leitura com base"
    )
    expect(markup).toContain("no que será observado nesse exercício.")
    expect(markup).toContain("será observado")
  })

  it("links Explorar exercícios to the theme catalog", () => {
    const markup = renderToStaticMarkup(DashboardPage())

    expect(markup).toContain('id="dashboard-browse-themes"')
    expect(markup).toContain('href="/dashboard/themes"')
    expect(markup).toContain("Explorar exercícios")
  })

  it("links Minhas cenas to the text history", () => {
    const markup = renderToStaticMarkup(DashboardPage())

    expect(markup).toContain('id="dashboard-your-texts"')
    expect(markup).toContain('href="/dashboard/texts"')
    expect(markup).toContain("Minhas cenas")
  })
})
