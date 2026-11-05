//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { authHref, safeDestination } from "@/lib/auth-destination"

describe("safeDestination", () => {
  it("keeps an internal protected path with its query and hash", () => {
    expect(safeDestination("/dashboard")).toBe("/dashboard")
    expect(safeDestination("/dashboard/themes")).toBe("/dashboard/themes")
    expect(safeDestination("/dashboard/texts/abc?error=x#y")).toBe(
      "/dashboard/texts/abc?error=x#y"
    )
  })

  it.each([
    [undefined],
    [null],
    [["/dashboard/themes"]],
    [""],
    ["dashboard"],
    ["https://evil.example"],
    ["//evil.example"],
    ["/\\evil.example"],
    ["/\t/evil.example"],
    ["/"],
    ["/sign-in"],
    ["/api/auth/sign-out"],
    ["/dashboard/../api/auth/sign-out"],
    ["/dashboard/%2e%2e/api"],
    ["/dashboardevil"],
  ])("falls back to the dashboard for %p", (value) => {
    expect(safeDestination(value)).toBe("/dashboard")
  })
})

describe("authHref", () => {
  it("leaves the default destination out of the URL", () => {
    expect(authHref("/sign-in", "/dashboard")).toBe("/sign-in")
    expect(authHref("/sign-up", undefined)).toBe("/sign-up")
    expect(authHref("/sign-in", "https://evil.example")).toBe("/sign-in")
  })

  it("encodes a destination, query included", () => {
    expect(authHref("/sign-up", "/dashboard/themes?page=2")).toBe(
      "/sign-up?next=%2Fdashboard%2Fthemes%3Fpage%3D2"
    )
  })
})
