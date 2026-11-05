//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { app } from "@/api"

describe("GET /api", () => {
  it('returns a JSON body of { message: "Hello World" }', async () => {
    const response = await app.handle(new Request("http://localhost/api"))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      message: "Hello World",
    })
  })
})
