"use client"
//* Libraries imports
import Link from "next/link"

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
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

//* Hooks imports
import { useSignInForm } from "@/hooks/use-sign-in-form"

type SignInFieldsProps = {
  appForm: ReturnType<typeof useSignInForm>["appForm"]
  disabled: boolean
}

function SignInFields(props: SignInFieldsProps) {
  const appForm = props.appForm

  return (
    <FieldGroup>
      <appForm.AppField
        name="email"
        children={(field) => (
          <field.TextField
            id="sign-in-email"
            label="Email"
            type="email"
            autoComplete="email"
            disabled={props.disabled}
          />
        )}
      />
      <appForm.AppField
        name="password"
        children={(field) => (
          <field.TextField
            id="sign-in-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            disabled={props.disabled}
          />
        )}
      />
    </FieldGroup>
  )
}

export function SignInForm() {
  const { appForm, signInMutation, isBusy, handleSubmit } = useSignInForm()

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
          <SignInFields appForm={appForm} disabled={isBusy} />
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
        <Link
          id="sign-in-create-account"
          href="/sign-up"
          className="text-center text-sm text-muted-foreground underline"
        >
          Create an account
        </Link>
      </CardFooter>
    </Card>
  )
}
