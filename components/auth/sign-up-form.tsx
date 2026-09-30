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

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignUpValues = z.infer<typeof signUpSchema>

const defaultValues: SignUpValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

export function SignUpForm() {
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
    defaultValues,
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      await signUpMutation.mutateAsync(value)
    },
  })
  const isBusy = signUpMutation.isPending || signUpMutation.isSuccess

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    signUpMutation.reset()
    void form.handleSubmit().catch(() => {
      // The mutation error is rendered from mutation state.
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Enter your details to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="sign-up-form"
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          {signUpMutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not create account</AlertTitle>
              <AlertDescription>
                {signUpMutation.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const errors = toFieldErrors(field.state.meta.errors)
                const isInvalid = errors.length > 0

                return (
                  <Field
                    data-invalid={isInvalid || undefined}
                    data-disabled={isBusy || undefined}
                  >
                    <FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
                    <Input
                      id="sign-up-name"
                      name={field.name}
                      type="text"
                      autoComplete="name"
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
              name="email"
              children={(field) => {
                const errors = toFieldErrors(field.state.meta.errors)
                const isInvalid = errors.length > 0

                return (
                  <Field
                    data-invalid={isInvalid || undefined}
                    data-disabled={isBusy || undefined}
                  >
                    <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                    <Input
                      id="sign-up-email"
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
                    <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
                    <Input
                      id="sign-up-password"
                      name={field.name}
                      type="password"
                      autoComplete="new-password"
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
              name="confirmPassword"
              children={(field) => {
                const errors = toFieldErrors(field.state.meta.errors)
                const isInvalid = errors.length > 0

                return (
                  <Field
                    data-invalid={isInvalid || undefined}
                    data-disabled={isBusy || undefined}
                  >
                    <FieldLabel htmlFor="sign-up-confirm-password">
                      Confirm password
                    </FieldLabel>
                    <Input
                      id="sign-up-confirm-password"
                      name={field.name}
                      type="password"
                      autoComplete="new-password"
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
      <CardFooter>
        <Button
          id="sign-up-submit"
          type="submit"
          form="sign-up-form"
          className="w-full"
          disabled={isBusy}
        >
          {isBusy ? <Spinner data-icon="inline-start" /> : null}
          {isBusy ? "Creating account..." : "Create account"}
        </Button>
      </CardFooter>
    </Card>
  )
}
