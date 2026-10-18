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
})
