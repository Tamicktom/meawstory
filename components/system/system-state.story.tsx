import { useState } from "react"
import ErrorPage from "@/app/(app)/dashboard/error"
import { LoadingView } from "./loading-view"

export function UnexpectedError() {
  const [retried, setRetried] = useState(false)
  return retried ? (
    <p role="status">Página recuperada</p>
  ) : (
    <ErrorPage
      error={new Error("Internal failure id: secret-123")}
      retry={() => setRetried(true)}
    />
  )
}

export function Loading() {
  return <LoadingView title="Carregando sua cena e leitura" />
}
