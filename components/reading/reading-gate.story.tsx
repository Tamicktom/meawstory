//* Libraries imports
import { useEffect } from "react"

//* Components imports
import { ReadingGate } from "@/components/reading/reading-gate"

//* Local imports
import { queryClient } from "@/utils/query-client"

const scene = {
  textId: "text-1",
  themeTitle: "A chave na mesa",
  textContent: "A chave ficou na mesa entre as duas.",
  email: "ada@example.com",
}

export const Unverified = () => (
  <ReadingGate {...scene} emailVerified={false} verificationLinkFailed={false} />
)

export const ExpiredLink = () => (
  <ReadingGate {...scene} emailVerified={false} verificationLinkFailed />
)

export const Verified = () => {
  useEffect(() => {
    queryClient.clear()
  }, [])

  return (
    <ReadingGate {...scene} emailVerified verificationLinkFailed={false} />
  )
}
