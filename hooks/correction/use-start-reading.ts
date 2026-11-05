"use client"
//* Libraries imports
import { useMutation } from "@tanstack/react-query"

//* API imports
import { client } from "@/lib/eden"

//* The page was out of date: the email is no longer confirmed, or a reading already exists.
class StaleReadingStateError extends Error {}

async function startReading(textId: string) {
  const response = await client.api.correction.start({ textId }).post()

  if (response.status === 403 || response.status === 409) {
    throw new StaleReadingStateError()
  }

  if (response.error) {
    throw new Error("Could not start the reading.")
  }
}

function useStartReading() {
  return useMutation({ mutationFn: startReading })
}

export { StaleReadingStateError, useStartReading }
