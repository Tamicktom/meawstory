"use client"

import { ErrorView } from "@/components/system/error-view"
import "./globals.css"

export default function GlobalError({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ErrorView retry={retry} />
      </body>
    </html>
  )
}
