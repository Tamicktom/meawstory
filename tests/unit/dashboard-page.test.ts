//* Libraries imports
import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import { DashboardHome } from "@/app/(app)/dashboard/home"

describe("DashboardPage", () => {
  it("shows the catalog as the next action without history", () => {
    const markup = renderToStaticMarkup(
      DashboardHome({ scenes: [], onboardingComplete: true })
    )
    expect(markup).toContain("Escolher um exercício")
    expect(markup).not.toContain("Cenas recentes")
    expect(markup).not.toContain("O que você quer treinar agora?")
  })

  it("links Explorar exercícios to the theme catalog", () => {
    const markup = renderToStaticMarkup(
      DashboardHome({ scenes: [], onboardingComplete: true })
    )

    expect(markup).toContain('id="dashboard-browse-themes"')
    expect(markup).toContain('href="/dashboard/themes"')
    expect(markup).toContain("Explorar exercícios")
  })

  it("links Minhas cenas to the text history", () => {
    const markup = renderToStaticMarkup(
      DashboardHome({ scenes: [], onboardingComplete: true })
    )

    expect(markup).toContain('id="dashboard-your-texts"')
    expect(markup).toContain('href="/dashboard/texts"')
    expect(markup).toContain("Minhas cenas")
  })
})
