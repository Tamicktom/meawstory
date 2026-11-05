//* Libraries imports
import { describe, expect, test } from "bun:test"

//* Local imports
import { toAbsoluteUrl } from "@/utils/absolute-url"

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
