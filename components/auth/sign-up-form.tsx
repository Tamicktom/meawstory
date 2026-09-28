"use client"

//* Libraries imports
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

//* Components imports
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

//* Local imports
import { authClient } from "@/lib/auth-client";

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
  });

type SignUpValues = z.infer<typeof signUpSchema>;

type SignUpField = keyof SignUpValues;

type FieldErrors = Partial<Record<SignUpField, string>>;

const emptyValues: SignUpValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function fieldErrorsFromIssues(issues: z.core.$ZodIssue[]): FieldErrors {
  const nextErrors: FieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field !== "string" || field in nextErrors) {
      continue;
    }

    nextErrors[field as SignUpField] = issue.message;
  }

  return nextErrors;
}

export function SignUpForm() {
  const router = useRouter();
  const [values, setValues] = useState<SignUpValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: SignUpField, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signUpSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromIssues(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const { error } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setFormError(error.message ?? "Could not create your account.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
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
          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not create account</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Field data-invalid={Boolean(fieldErrors.name) || undefined} data-disabled={isSubmitting || undefined}>
              <FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
              <Input
                id="sign-up-name"
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.name) || undefined}
                onChange={(event) => updateField("name", event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.name ? [{ message: fieldErrors.name }] : undefined} />
            </Field>
            <Field data-invalid={Boolean(fieldErrors.email) || undefined} data-disabled={isSubmitting || undefined}>
              <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
              <Input
                id="sign-up-email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.email) || undefined}
                onChange={(event) => updateField("email", event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.email ? [{ message: fieldErrors.email }] : undefined} />
            </Field>
            <Field data-invalid={Boolean(fieldErrors.password) || undefined} data-disabled={isSubmitting || undefined}>
              <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
              <Input
                id="sign-up-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.password) || undefined}
                onChange={(event) => updateField("password", event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.password ? [{ message: fieldErrors.password }] : undefined} />
            </Field>
            <Field data-invalid={Boolean(fieldErrors.confirmPassword) || undefined} data-disabled={isSubmitting || undefined}>
              <FieldLabel htmlFor="sign-up-confirm-password">Confirm password</FieldLabel>
              <Input
                id="sign-up-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.confirmPassword) || undefined}
                onChange={(event) => updateField("confirmPassword", event.currentTarget.value)}
              />
              <FieldError
                errors={
                  fieldErrors.confirmPassword
                    ? [{ message: fieldErrors.confirmPassword }]
                    : undefined
                }
              />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          id="sign-up-submit"
          type="submit"
          form="sign-up-form"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </CardFooter>
    </Card>
  );
}
