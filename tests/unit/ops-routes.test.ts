//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { app } from "@/api"

function post(body: string) {
  return app.handle(
    new Request("http://localhost/api/ops/client-error", {
      method: "POST",
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body,
    })
  )
}

describe("POST /api/ops/client-error", () => {
  it("accepts a short report like the one sendBeacon sends", async () => {
    const response = await post(
      JSON.stringify({ message: "boom", digest: "123", path: "/dashboard" })
    )

    expect(response.status).toBe(204)
  })

  it("rejects malformed or oversized reports", async () => {
    expect((await post("not json")).status).toBe(422)
    expect(
      (await post(JSON.stringify({ message: "x".repeat(600), path: "/" })))
        .status
    ).toBe(422)
  })
})

describe("GET /api/ops/reading-health", () => {
  it("refuses a request without the cron secret", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/ops/reading-health")
    )

    expect(response.status).toBe(401)
  })
})
