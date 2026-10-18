//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { themeExcerpt } from "@/app/(app)/dashboard/themes/page"

describe("themeExcerpt", () => {
  it("returns the Situação section", () => {
    const description = [
      "Escreva uma única cena.",
      "",
      "## Situação",
      "",
      "A praça está vazia ao meio-dia.",
      "",
      "## O que já é verdade",
      "",
      "- Alguém espera.",
    ].join("\n")

    expect(themeExcerpt(description)).toBe("A praça está vazia ao meio-dia.")
  })

  it("returns the full description trimmed when the Situação heading is missing", () => {
    expect(themeExcerpt("  Só um parágrafo sobre a cena.  ")).toBe(
      "Só um parágrafo sobre a cena."
    )
  })

  it("returns the full description trimmed when the Situação section is empty", () => {
    const description = [
      "## Situação",
      "",
      "## O que já é verdade",
      "",
      "- Alguém espera.",
    ].join("\n")

    expect(themeExcerpt(description)).toBe(description.trim())
  })
})
