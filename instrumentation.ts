//* Libraries imports
import type { Instrumentation } from "next"

//* Local imports
import { errorMessage, logEvent } from "@/lib/telemetry"

//* Server errors caught by Next.js (rendering, route handlers, server actions) reach the logs (1C-5).
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  logEvent("error", "app.server_error", {
    method: request.method,
    //* The path without its query string, which could carry personal data.
    path: request.path.split("?")[0],
    routePath: context.routePath,
    routeType: context.routeType,
    digest:
      typeof error === "object" && error !== null && "digest" in error
        ? String(error.digest)
        : undefined,
    reason: errorMessage(error),
  })
}
