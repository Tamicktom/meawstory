//* Libraries imports
import { Elysia } from "elysia"

//* Routes imports
import { writeRoutes } from "./routes/write"
import { correctionRoutes } from "./routes/correction"
import { opsRoutes } from "./routes/ops"
import { errorMessage, logEvent } from "@/lib/telemetry"

const app = new Elysia({ prefix: "/api" })
  //* Unexpected API errors reach the logs with their route (1C-5). Validation and 404 are expected.
  .onError({ as: "global" }, ({ code, error, request, path }) => {
    if (code === "VALIDATION" || code === "NOT_FOUND" || code === "PARSE")
      return
    logEvent("error", "api.error", {
      method: request.method,
      path,
      code: String(code),
      reason: errorMessage(error),
    })
  })
  .use(writeRoutes)
  .use(opsRoutes)
  .use(correctionRoutes)
  .get("/", () => {
    return { message: "Hello World" }
  })

export { app }
export type App = typeof app
