import { describe, expect, it } from "bun:test"
import { assertDevDatabaseUrl } from "@/database/reset-dev-database"

describe("assertDevDatabaseUrl", () => {
  it.each([undefined, ""])("rejects a missing URL (%s)", (url) => {
    expect(() => assertDevDatabaseUrl(url)).toThrow("DATABASE_URL is required")
  })

  it("rejects malformed URLs", () => {
    expect(() => assertDevDatabaseUrl("not a url")).toThrow(
      "DATABASE_URL is not a valid URL"
    )
  })

  it("rejects non-PostgreSQL protocols", () => {
    expect(() => assertDevDatabaseUrl("https://localhost/postgres")).toThrow(
      "only supports PostgreSQL"
    )
  })

  it.each(["postgresql://localhost", "postgres://localhost/"])(
    "rejects a missing database (%s)",
    (url) => {
      expect(() => assertDevDatabaseUrl(url)).toThrow(
        "must include a database name"
      )
    }
  )

  it.each(["postgresql:", "postgres:"])(
    "accepts the %s protocol and encoded database names",
    (protocol) => {
      const value = `${protocol}//postgres:postgres@localhost:5432/test%20database`
      expect(assertDevDatabaseUrl(value).href).toBe(value)
    }
  )
})
