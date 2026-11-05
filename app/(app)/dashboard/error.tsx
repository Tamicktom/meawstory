"use client"

import { ErrorView } from "@/components/system/error-view"

export default function DashboardError({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return <ErrorView retry={retry} savedScenes />
}
