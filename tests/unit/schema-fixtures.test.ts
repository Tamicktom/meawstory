import { describe, expect, it } from "bun:test"
import { expectPostgresError } from "@/tests/helpers/schema-fixtures"

function rejectsWith(error: unknown) {
  return async () => {
    throw error
  }
}

describe("PostgreSQL error assertions", () => {
  it("finds SQLSTATE and constraints through wrapped causes", async () => {
    await expectPostgresError(
      rejectsWith(
        new Error("query failed", {
          cause: {
            code: "23514",
            constraint: "score_range",
            message: "invalid score",
          },
        })
      ),
      "23514",
      "score_range"
    )
    await expectPostgresError(rejectsWith({ code: "23505" }), "23505")
  })

  it("reports mismatched SQLSTATE and constraint", async () => {
    const failure = rejectsWith({
      code: "23514",
      constraint: "actual",
      message: "detail",
    })
    await expect(expectPostgresError(failure, "23505")).rejects.toThrow(
      "received 23514 on actual"
    )
    await expect(
      expectPostgresError(failure, "23514", "expected")
    ).rejects.toThrow("on expected")
  })

  it("stops at cyclic causes and ignores non-Postgres codes", async () => {
    const cycle: { code: string; cause?: unknown } = { code: "ECONNREFUSED" }
    cycle.cause = cycle
    await expect(
      expectPostgresError(rejectsWith(cycle), "23505")
    ).rejects.toThrow("received none")
    await expect(
      expectPostgresError(
        rejectsWith({ code: 23505, cause: { code: "23505" } }),
        "23505"
      )
    ).resolves.toBeUndefined()
  })

  it("reports successful queries and non-object failures", async () => {
    await expect(expectPostgresError(async () => {}, "23505")).rejects.toThrow(
      "query succeeded"
    )
    for (const error of [
      null,
      "failure",
      new Error("failure"),
      { code: "23505", message: 42, constraint: false },
    ]) {
      await expect(
        expectPostgresError(rejectsWith(error), "23514")
      ).rejects.toThrow("Expected Postgres error 23514")
    }
  })
})
