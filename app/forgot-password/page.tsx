//* Libraries imports
import type { Metadata } from "next"

//* Components imports
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Peça um link para redefinir a senha da sua conta do Meawstory.",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <ForgotPasswordForm />
    </div>
  )
}
