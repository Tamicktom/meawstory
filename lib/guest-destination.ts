import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { safeDestination } from "@/lib/auth-destination"

export async function guestDestination(
  searchParams: Promise<{ next?: string | string[] }>
) {
  const [params, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ])
  const destination = safeDestination(params.next)

  if (session) {
    redirect(destination)
  }

  return destination
}
