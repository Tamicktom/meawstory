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

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

type SignInValues = z.infer<typeof signInSchema>;

type SignInField = keyof SignInValues;

type FieldErrors = Partial<Record<SignInField, string>>;

const emptyValues: SignInValues = {
  email: "",
  password: "",
};

function fieldErrorsFromIssues(issues: z.core.$ZodIssue[]): FieldErrors {
  const nextErrors: FieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field !== "string" || field in nextErrors) {
      continue;
    }

    nextErrors[field as SignInField] = issue.message;
  }

  return nextErrors;
}

export function SignInForm() {
  const router = useRouter();
  const [values, setValues] = useState<SignInValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: SignInField, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signInSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromIssues(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const { error } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setFormError(error.message ?? "Could not sign in.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
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
          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not sign in</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Field
              data-invalid={Boolean(fieldErrors.email) || undefined}
              data-disabled={isSubmitting || undefined}
            >
              <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
              <Input
                id="sign-in-email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.email) || undefined}
                onChange={(event) => updateField("email", event.currentTarget.value)}
              />
              <FieldError
                errors={fieldErrors.email ? [{ message: fieldErrors.email }] : undefined}
              />
            </Field>
            <Field
              data-invalid={Boolean(fieldErrors.password) || undefined}
              data-disabled={isSubmitting || undefined}
            >
              <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
              <Input
                id="sign-in-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={values.password}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.password) || undefined}
                onChange={(event) =>
                  updateField("password", event.currentTarget.value)
                }
              />
              <FieldError
                errors={
                  fieldErrors.password ? [{ message: fieldErrors.password }] : undefined
                }
              />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        <Button
          id="sign-in-submit"
          type="submit"
          form="sign-in-form"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {isSubmitting ? "Signing in..." : "Sign in"}
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
  );
}
