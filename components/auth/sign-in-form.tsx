"use client"

//* Libraries imports
import { type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"

//* Components imports
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

//* Local imports
import { toFieldErrors } from "@/components/auth/field-errors"
import { authClient } from "@/lib/auth-client"

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
})

type SignInValues = z.infer<typeof signInSchema>

const defaultValues: SignInValues = {
  email: "",
  password: "",
}

export function SignInForm() {
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
    defaultValues,
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      await signInMutation.mutateAsync(value)
    },
  })
  const isBusy = signInMutation.isPending || signInMutation.isSuccess

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    signInMutation.reset()
    void form.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>
          Use your email and password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="sign-in-form"
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          {signInMutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not sign in</AlertTitle>
              <AlertDescription>
                {signInMutation.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <form.Field
              name="email"
              children={(field) => {
                const errors = toFieldErrors(field.state.meta.errors)
                const isInvalid = errors.length > 0

                return (
                  <Field
                    data-invalid={isInvalid || undefined}
                    data-disabled={isBusy || undefined}
                  >
                    <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
                    <Input
                      id="sign-in-email"
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      value={field.state.value}
                      disabled={isBusy}
                      aria-invalid={isInvalid || undefined}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.currentTarget.value)
                      }
                    />
                    <FieldError errors={errors} />
                  </Field>
                )
              }}
            />
            <form.Field
              name="password"
              children={(field) => {
                const errors = toFieldErrors(field.state.meta.errors)
                const isInvalid = errors.length > 0

                return (
                  <Field
                    data-invalid={isInvalid || undefined}
                    data-disabled={isBusy || undefined}
                  >
                    <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
                    <Input
                      id="sign-in-password"
                      name={field.name}
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      disabled={isBusy}
                      aria-invalid={isInvalid || undefined}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.currentTarget.value)
                      }
                    />
                    <FieldError errors={errors} />
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        <Button
          id="sign-in-submit"
          type="submit"
          form="sign-in-form"
          className="w-full"
          disabled={isBusy}
        >
          {isBusy ? <Spinner data-icon="inline-start" /> : null}
          {isBusy ? "Signing in..." : "Sign in"}
        </Button>
        <a
          id="sign-in-create-account"
          href="/sign-up"
          className="text-center text-sm text-muted-foreground underline"
        >
          Create an account
        </a>
      </CardFooter>
    </Card>
  )
}
