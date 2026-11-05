"use client"

//* Libraries imports
import type { SubmitEvent } from "react"
import { useMutation } from "@tanstack/react-query"

//* Hooks imports
import { useAppForm } from "@/components/auth/form-hook"

//* Local imports
import { authClient } from "@/lib/auth-client"
import {
  forgotPasswordDefaultValues,
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/schemas/forgot-password"

function forgotPasswordErrorMessage(status: number) {
  if (status === 429) {
    return "Foram muitas tentativas. Aguarde um minuto e tente de novo."
  }

  return "Não foi possível enviar o pedido agora. Tente de novo em instantes."
}

function useForgotPasswordForm() {
  //* This only requests an email: no cached query depends on it.
  // react-doctor-disable-next-line react-doctor/query-mutation-missing-invalidation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (values: ForgotPasswordValues) => {
      const parsed = forgotPasswordSchema.parse(values)
      const { error } = await authClient
        .requestPasswordReset({
          email: parsed.email,
          redirectTo: "/reset-password",
        })
        .catch(() => {
          throw new Error(forgotPasswordErrorMessage(0))
        })

      if (error) {
        throw new Error(forgotPasswordErrorMessage(error.status))
      }
    },
  })
  const appForm = useAppForm({
    defaultValues: forgotPasswordDefaultValues,
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await forgotPasswordMutation.mutateAsync(value)
    },
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    forgotPasswordMutation.reset()
    void appForm.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return {
    appForm,
    forgotPasswordMutation,
    isBusy: forgotPasswordMutation.isPending,
    handleSubmit,
  }
}

export { useForgotPasswordForm }
