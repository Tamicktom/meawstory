"use client"

//* Libraries imports
import { type SubmitEvent } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"

//* Local imports
import { authClient } from "@/lib/auth-client"
import {
  signInDefaultValues,
  signInSchema,
  type SignInValues,
} from "@/schemas/sign-in"

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
      router.push("/")
    },
  })
  const form = useForm({
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
    void form.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return { form, signInMutation, isBusy, handleSubmit }
}

export { useSignInForm }
