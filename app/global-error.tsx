"use client"

import { ErrorView } from "@/components/system/error-view"
import "./globals.css"

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ErrorView error={error} retry={retry} />
      </body>
    </html>
  )
}
