//* Structured operational logs (1C-5): one JSON object per line, so the hosting log search
//* (Vercel) can filter by event, stage, model or prompt version. Scene text and reading
//* content never go into a log line.

type Level = "info" | "warn" | "error"

export type TelemetryFields = Record<
  string,
  string | number | boolean | null | undefined
>

const MAX_FIELD = 500

function clip(value: TelemetryFields[string]) {
  return typeof value === "string" && value.length > MAX_FIELD
    ? `${value.slice(0, MAX_FIELD)}…`
    : value
}

export function logEvent(
  level: Level,
  event: string,
  fields: TelemetryFields = {}
) {
  //* bun test sets NODE_ENV=test; the suite would otherwise print every reading event.
  // fallow-ignore-next-line test-only-branch
  if (process.env.NODE_ENV === "test") return

  const line = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, clip(value)])
    ),
  })

  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.info(line)
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
