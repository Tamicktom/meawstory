//* Components imports
import { SignUpForm } from "@/components/auth/sign-up-form"

export const Default = () => <SignUpForm />

export const WithDestination = () => (
  <SignUpForm destination="/dashboard/themes" />
)
