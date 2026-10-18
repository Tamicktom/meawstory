"use client"

//* Libraries imports
import { type SubmitEvent } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

//* Hooks imports
import { useAppForm } from "@/components/auth/form-hook"

//* Local imports
import { authClient } from "@/lib/auth-client"
import {
  signInDefaultValues,
  signInSchema,
  type SignInValues,
} from "@/schemas/sign-in"
import { queryClient } from "@/utils/query-client"

function useSignInForm() {
  const router = useRouter()
  const signInMutation = useMutation({
    mutationFn: async (values: SignInValues) => {
      const parsed = signInSchema.parse(values)
      const { data, error } = await authClient.signIn.email({
        email: parsed.email,
        password: parsed.password,
      })

      if (error) {
        throw new Error(error.message ?? "Could not sign in.")
      }

      return data
    },
    onSuccess: () => {
      queryClient.clear() //* Clear the query client to avoid showing the previous user's data
      router.push("/")
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
