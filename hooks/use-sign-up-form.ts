"use client"

//* Libraries imports
import type { SubmitEvent } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"

//* Local imports
import { authClient } from "@/lib/auth-client"
import {
  signUpDefaultValues,
  signUpSchema,
  type SignUpValues,
} from "@/schemas/sign-up"

function useSignUpForm() {
  const router = useRouter()
  const signUpMutation = useMutation({
    mutationFn: async (values: SignUpValues) => {
      const parsed = signUpSchema.parse(values)
      const { data, error } = await authClient.signUp.email({
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
      })

      if (error) {
        throw new Error(error.message ?? "Could not create your account.")
      }

      return data
    },
    onSuccess: () => {
      router.push("/")
    },
  })
  const form = useForm({
    defaultValues: signUpDefaultValues,
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      await signUpMutation.mutateAsync(value)
    },
  })
  const isBusy = signUpMutation.isPending || signUpMutation.isSuccess

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    signUpMutation.reset()
    void form.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return { form, signUpMutation, isBusy, handleSubmit }
}

export { useSignUpForm }
