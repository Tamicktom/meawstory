//* Libraries imports
import type { Metadata } from "next"

//* Components imports
import { SignInForm } from "@/components/auth/sign-in-form"

//* Local imports
import { guestDestination } from "@/lib/guest-destination"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Meawstory account.",
}

type SignInPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

export default async function SignInPage(props: SignInPageProps) {
  const destination = await guestDestination(props.searchParams)

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignInForm destination={destination} />
    </div>
  )
}
