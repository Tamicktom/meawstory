"use client"

import { ErrorView } from "@/components/system/error-view"

export default function ErrorPage({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return <ErrorView retry={retry} />
}
