//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { mainNavigation } from "@/components/app/main-navigation"

describe("mainNavigation", () => {
  it("lists Início, Exercícios, Minhas cenas, and Conta", () => {
    expect(mainNavigation.map((item) => item.title)).toEqual([
      "Início",
      "Exercícios",
      "Minhas cenas",
      "Conta",
    ])
    expect(mainNavigation.map((item) => item.href)).toEqual([
      "/dashboard",
      "/dashboard/themes",
      "/dashboard/texts",
      "/dashboard/account",
    ])
    expect(mainNavigation.map((item) => item.id)).toEqual([
      "dashboard",
      "themes",
      "texts",
      "account",
    ])
  })
})
