//* Libraries imports
import { Elysia } from "elysia"
import z from "zod"

//* Local imports
import { serverEnv } from "@/env/server"
import { logEvent } from "@/lib/telemetry"
import { expireReadings } from "@/services/reading"
import { checkReadingHealth } from "@/services/reading-alerts"

const DAY_MS = 24 * 60 * 60_000

//* Operational routes (1C-5). They return no reading data.
const opsRoutes = new Elysia({ prefix: "/ops" })
  //* Daily safety net from the Vercel cron: reconciles timeouts even with nobody online,
  //* then checks the last 24 hours. Vercel sends CRON_SECRET as a bearer token.
  .get("/reading-health", async ({ headers, set }) => {
    const secret = serverEnv.CRON_SECRET
    if (!secret || headers.authorization !== `Bearer ${secret}`) {
      set.status = 401
      return { message: "Unauthorized" }
    }

    //* In order: the health check must see the attempts that just expired.
    const expired = await expireReadings()
    // react-doctor-disable-next-line react-doctor/server-sequential-independent-await
    const alerts = await checkReadingHealth(DAY_MS)

    return { expired, alerts: alerts.map((alert) => alert.kind) }
  })
  //* Error pages report what broke in the browser. Only short, non-content fields are logged.
  .post(
    "/client-error",
    ({ body, set }) => {
      logEvent("error", "app.client_error", body)
      set.status = 204
    },
    {
      parse: "text",
      body: z
        .string()
        .max(2000)
        .transform((value, ctx) => {
          try {
            return JSON.parse(value) as unknown
          } catch {
            ctx.addIssue({ code: "custom", message: "Invalid JSON" })
            return z.NEVER
          }
        })
        .pipe(
          z.object({
            message: z.string().max(500),
            digest: z.string().max(100).optional(),
            path: z.string().max(300),
          })
        ),
    }
  )

export { opsRoutes }
