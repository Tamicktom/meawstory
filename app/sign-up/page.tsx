//* Libraries imports
import type { Metadata } from "next"

//* Components imports
import { SignUpForm } from "@/components/auth/sign-up-form"

//* Local imports
import { guestDestination } from "@/lib/guest-destination"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Meawstory account.",
}

type SignUpPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

export default async function SignUpPage(props: SignUpPageProps) {
  const destination = await guestDestination(props.searchParams)

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignUpForm destination={destination} />
    </div>
  )
}
