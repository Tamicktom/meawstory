//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { isActivePath } from "@/components/app/sidebar-active-path"

describe("isActivePath", () => {
  describe("dashboard", () => {
    it("is active only on the exact path", () => {
      expect(isActivePath("/dashboard", "/dashboard")).toBe(true)
      expect(isActivePath("/dashboard/themes", "/dashboard")).toBe(false)
      expect(
        isActivePath("/dashboard/themes/theme_roof_gap", "/dashboard")
      ).toBe(false)
    })
  })

  describe("themes", () => {
    it("stays active on the themes path and on nested paths", () => {
      expect(isActivePath("/dashboard/themes", "/dashboard/themes")).toBe(true)
      expect(
        isActivePath("/dashboard/themes/theme_roof_gap", "/dashboard/themes")
      ).toBe(true)
      expect(isActivePath("/dashboard", "/dashboard/themes")).toBe(false)
    })
  })

  describe("texts", () => {
    it("stays active on the texts path and on a nested text", () => {
      expect(isActivePath("/dashboard/texts", "/dashboard/texts")).toBe(true)
      expect(
        isActivePath("/dashboard/texts/text_late_letter", "/dashboard/texts")
      ).toBe(true)
      expect(isActivePath("/dashboard", "/dashboard/texts")).toBe(false)
      expect(isActivePath("/dashboard/themes", "/dashboard/texts")).toBe(false)
    })
  })
})
