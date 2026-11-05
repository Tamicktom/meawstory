//* Libraries imports
import { describe, expect, it, test } from "bun:test"

//* Local imports
import { publicBaseUrl, toAbsoluteUrl } from "@/utils/absolute-url"

describe("toAbsoluteUrl", () => {
  test("adds https to the bare host Vercel provides", () => {
    expect(toAbsoluteUrl("meawstory-abc.vercel.app")).toBe(
      "https://meawstory-abc.vercel.app"
    )
  })

  test("keeps a url that already has a protocol", () => {
    expect(toAbsoluteUrl("http://localhost:3000")).toBe("http://localhost:3000")
    expect(toAbsoluteUrl("https://meawstory.com")).toBe("https://meawstory.com")
  })
})

describe("publicBaseUrl", () => {
  it("uses the public site for a production deployment", () => {
    expect(
      publicBaseUrl(
        "production",
        "meawstory-q9sip3ukt-tamicktoms-projects.vercel.app"
      )
    ).toBe("https://meawstory.com")
  })

  it("keeps the local url outside Vercel", () => {
    expect(publicBaseUrl(undefined, "http://localhost:3000")).toBe(
      "http://localhost:3000"
    )
  })

  it("keeps the preview deployment host", () => {
    expect(
      publicBaseUrl("preview", "meawstory-git-main-team.vercel.app")
    ).toBe("https://meawstory-git-main-team.vercel.app")
  })
})
