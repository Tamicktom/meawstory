//* Components imports
import { SignInForm } from "@/components/auth/sign-in-form"

export const Default = () => <SignInForm />

export const WithDestination = () => (
  <SignInForm destination="/dashboard/themes" />
)
