//* Libraries imports
import type { Metadata } from "next"

//* Components imports
import {
  InvalidResetLink,
  ResetPasswordForm,
} from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Defina uma nova senha para sua conta do Meawstory.",
  //* The token is in the URL. It must not reach another site through the Referer header.
  referrer: "no-referrer",
}

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[]
    error?: string | string[]
  }>
}

export default async function ResetPasswordPage(props: ResetPasswordPageProps) {
  const searchParams = await props.searchParams
  const token = typeof searchParams.token === "string" ? searchParams.token : ""

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      {token && !searchParams.error ? (
        <ResetPasswordForm token={token} />
      ) : (
        <InvalidResetLink />
      )}
    </div>
  )
}
