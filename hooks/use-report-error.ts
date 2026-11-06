"use client"

//* Libraries imports
import { useEffect } from "react"

const ENDPOINT = "/api/ops/client-error"

function digestOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error))
    return undefined
  return String(error.digest)
}

function messageOf(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500)
}

function errorReport(error: unknown): string {
  return JSON.stringify({
    message: messageOf(error),
    digest: digestOf(error),
    path: window.location.pathname,
  })
}

function send(payload: string) {
  try {
    if (navigator.sendBeacon?.(ENDPOINT, payload)) return
    void fetch(ENDPOINT, { method: "POST", body: payload, keepalive: true })
  } catch {
    //* Reporting is best effort; the error page must still render.
  }
}

//* Sends an error shown by an error page to the server log (1C-5), once per error.
//* Only the message, the digest and the path leave the browser; never page content.
//* A one-way report on mount, not data fetching: nothing is read back into the page.
export function useReportError(error: unknown) {
  // react-doctor-disable-next-line react-doctor/no-fetch-in-effect
  useEffect(() => {
    if (error) send(errorReport(error))
  }, [error])
}
