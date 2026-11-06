"use client"

//* Local imports
import { client } from "@/lib/eden"

function errorMessage(value: unknown) {
  if (!value || typeof value !== "object" || !("message" in value)) return null
  const message = value.message
  return typeof message === "string" ? message : null
}

async function settle(
  request: Promise<{
    error: { value: unknown } | null
    status: number
  }>,
  fallback: string
) {
  const response = await request.catch(() => {
    throw new Error(fallback)
  })
  if (!response.error) return
  const message = errorMessage(response.error.value)
  throw new Error(response.status < 500 && message ? message : fallback)
}

export function closeScene(textId: string) {
  return settle(
    client.api.scenes({ textId }).close.post(),
    "Não foi possível encerrar a cena. Ela continua aberta."
  )
}

export function reopenScene(textId: string) {
  return settle(
    client.api.scenes({ textId }).reopen.post(),
    "Não foi possível reabrir a cena. Tente de novo."
  )
}
