"use client"

//* Libraries imports
import type { SubmitEvent } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

//* Hooks imports
import { useAppForm } from "@/components/auth/form-hook"

//* Local imports
import { authClient } from "@/lib/auth-client"
import {
  signUpDefaultValues,
  signUpSchema,
  type SignUpValues,
} from "@/schemas/sign-up"
import { queryClient } from "@/utils/query-client"

function useSignUpForm(destination: string) {
  const router = useRouter()
  const signUpMutation = useMutation({
    mutationFn: async (values: SignUpValues) => {
      const parsed = signUpSchema.parse(values)
      const { data, error } = await authClient.signUp
        .email({
          name: parsed.name,
          email: parsed.email,
          password: parsed.password,
          //* Where the link in the verification email returns to.
          callbackURL: destination,
        })
        .catch(() => {
          throw new Error(
            "Não foi possível criar sua conta agora. Tente de novo em instantes."
          )
        })

      if (error) {
        throw new Error(
          error.status === 429
            ? "Foram muitas tentativas. Aguarde um minuto e tente de novo."
            : error.code === "USER_ALREADY_EXISTS" ||
                error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
              ? "Já existe uma conta com esse e-mail. Entre na sua conta ou recupere a senha."
              : "Não foi possível criar sua conta agora. Tente de novo em instantes."
        )
      }

      return data
    },
    onSuccess: () => {
      queryClient.clear() //* Clear the query client to avoid showing the previous user's data
      router.push(destination)
    },
  })
  const appForm = useAppForm({
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
    void appForm.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return { appForm, signUpMutation, isBusy, handleSubmit }
}

export { useSignUpForm }
