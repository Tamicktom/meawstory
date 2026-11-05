"use client"

//* Libraries imports
import { type SubmitEvent } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

//* Hooks imports
import { useAppForm } from "@/components/auth/form-hook"

//* Local imports
import { authClient } from "@/lib/auth-client"
import { signInErrorMessage } from "@/lib/auth-error-message"
import {
  signInDefaultValues,
  signInSchema,
  type SignInValues,
} from "@/schemas/sign-in"
import { queryClient } from "@/utils/query-client"

function useSignInForm(destination: string) {
  const router = useRouter()
  const signInMutation = useMutation({
    mutationFn: async (values: SignInValues) => {
      const parsed = signInSchema.parse(values)
      const { data, error } = await authClient.signIn
        .email({
          email: parsed.email,
          password: parsed.password,
        })
        .catch(() => {
          throw new Error(
            "Não foi possível entrar agora. Tente de novo em instantes."
          )
        })

      if (error) {
        throw new Error(signInErrorMessage(error))
      }

      return data
    },
    onSuccess: () => {
      queryClient.clear() //* Clear the query client to avoid showing the previous user's data
      router.push(destination)
    },
  })
  const appForm = useAppForm({
    defaultValues: signInDefaultValues,
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      await signInMutation.mutateAsync(value)
    },
  })
  const isBusy = signInMutation.isPending || signInMutation.isSuccess

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    signInMutation.reset()
    void appForm.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return { appForm, signInMutation, isBusy, handleSubmit }
}

export { useSignInForm }
