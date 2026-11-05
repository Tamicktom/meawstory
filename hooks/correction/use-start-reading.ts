"use client"
//* Libraries imports
import { useMutation } from "@tanstack/react-query"

//* API imports
import { client } from "@/lib/eden"

//* The page was out of date: the email is no longer confirmed, or a reading already exists.
class StaleReadingStateError extends Error {}

function errorMessage(value: unknown) {
  if (!value || typeof value !== "object" || !("message" in value)) return null
  return String(value.message)
}

async function startReading(textId: string) {
  const response = await client.api.correction
    .start({ textId })
    .post()
    .catch(() => {
      throw new Error(
        "Não conseguimos iniciar a leitura. Sua cena continua salva. Tente de novo."
      )
    })

  const message = errorMessage(response.error?.value)

  if (
    response.status === 403 ||
    (response.status === 409 &&
      message?.startsWith("A leitura já foi iniciada"))
  ) {
    throw new StaleReadingStateError()
  }

  if (response.error) {
    throw new Error(
      (response.status < 500 ? message : null) ??
        "Não conseguimos iniciar a leitura. Sua cena continua salva. Tente de novo."
    )
  }
}

function useStartReading() {
  //* correction-status has no staleTime and its data is never rendered, so polling always reads fresh.
  //* Invalidate it here if that query ever gets a staleTime.
  // react-doctor-disable-next-line react-doctor/query-mutation-missing-invalidation
  return useMutation({ mutationFn: startReading })
}

export { StaleReadingStateError, useStartReading }
