import { describe, expect, it } from "bun:test"
import { toFieldErrors } from "@/components/auth/field-errors"

describe("toFieldErrors", () => {
  it("keeps string messages and validation error messages in order", () => {
    expect(
      toFieldErrors([
        "Required",
        { message: "Invalid email" },
        new Error("Invalid password"),
        "",
      ])
    ).toEqual([
      { message: "Required" },
      { message: "Invalid email" },
      { message: "Invalid password" },
      { message: "" },
    ])
  })

  it("ignores missing and non-string messages without throwing", () => {
    expect(
      toFieldErrors([
        null,
        undefined,
        1,
        false,
        {},
        { message: 42 },
        { message: null },
      ])
    ).toEqual([])
  })
})
