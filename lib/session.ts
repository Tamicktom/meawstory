//* Libraries imports
import { headers } from "next/headers"
import { redirect } from "next/navigation"

//* Local imports
import { auth } from "@/lib/auth"
import { authHref, requestedPathHeader } from "@/lib/auth-destination"

async function requireSession() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session) {
    redirect(authHref("/sign-in", requestHeaders.get(requestedPathHeader)))
  }

  return session
}

export { requireSession }
