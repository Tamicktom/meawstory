"use client"

//* Libraries imports
import type { SubmitEvent } from "react"
import { useMutation } from "@tanstack/react-query"

//* Hooks imports
import { useAppForm } from "@/components/auth/form-hook"

//* Local imports
import { authClient } from "@/lib/auth-client"
import {
  resetPasswordDefaultValues,
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/schemas/reset-password"

class InvalidResetLinkError extends Error {}

function useResetPasswordForm(token: string) {
  //* No cached query depends on the password, and the success screen only links to sign-in.
  // react-doctor-disable-next-line react-doctor/query-mutation-missing-invalidation
  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordValues) => {
      const parsed = resetPasswordSchema.parse(values)
      const { error } = await authClient
        .resetPassword({
          newPassword: parsed.password,
          token,
        })
        .catch(() => {
          throw new Error(
            "Não foi possível redefinir a senha agora. Tente de novo em instantes."
          )
        })

      if (error?.code === "INVALID_TOKEN") {
        throw new InvalidResetLinkError()
      }

      if (error) {
        throw new Error(
          "Não foi possível redefinir a senha agora. Tente de novo em instantes."
        )
      }
    },
  })
  const appForm = useAppForm({
    defaultValues: resetPasswordDefaultValues,
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await resetPasswordMutation.mutateAsync(value)
    },
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    resetPasswordMutation.reset()
    void appForm.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return {
    appForm,
    resetPasswordMutation,
    isLinkInvalid: resetPasswordMutation.error instanceof InvalidResetLinkError,
    isBusy: resetPasswordMutation.isPending,
    handleSubmit,
  }
}

export { useResetPasswordForm }
