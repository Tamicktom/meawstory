//* Libraries imports
import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import DashboardPage from "@/app/(app)/dashboard/page"

describe("DashboardPage", () => {
  it("explains that the user picks a theme, writes a text, and receives a correction", () => {
    const markup = renderToStaticMarkup(DashboardPage())

    expect(markup).toContain("Start by choosing a theme.")
    expect(markup).toContain("Write a text for it and receive a correction")
    expect(markup).toContain("rubric.")
  })

  it("links Browse themes to the theme catalog", () => {
    const markup = renderToStaticMarkup(DashboardPage())

    expect(markup).toContain('id="dashboard-browse-themes"')
    expect(markup).toContain('href="/dashboard/themes"')
    expect(markup).toContain("Browse themes")
  })
})
