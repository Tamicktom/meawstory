"use client"
//* Libraries imports
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

//* Local imports
import { authClient } from "@/lib/auth-client"

type ResendVerificationProps = {
  email: string
  callbackURL: string
}

function resendErrorMessage(status: number) {
  if (status === 429) {
    return "Foram muitos pedidos. Aguarde um minuto e tente de novo."
  }

  return "Não foi possível pedir o envio agora. Tente de novo em instantes."
}

function useResendVerification(props: ResendVerificationProps) {
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.sendVerificationEmail({
        email: props.email,
        callbackURL: props.callbackURL,
      })

      if (error?.code === "EMAIL_ALREADY_VERIFIED") {
        router.refresh()
        return
      }

      if (error) {
        throw new Error(resendErrorMessage(error.status))
      }
    },
  })
}

export { useResendVerification }
