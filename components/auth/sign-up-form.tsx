"use client"

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
import { useSignUpForm } from "@/hooks/use-sign-up-form"

type SignUpFieldsProps = {
  appForm: ReturnType<typeof useSignUpForm>["appForm"]
  disabled: boolean
}

function SignUpFields(props: SignUpFieldsProps) {
  const appForm = props.appForm

  return (
    <FieldGroup>
      <appForm.AppField
        name="name"
        children={(field) => (
          <field.TextField
            id="sign-up-name"
            label="Name"
            type="text"
            autoComplete="name"
            disabled={props.disabled}
          />
        )}
      />
      <appForm.AppField
        name="email"
        children={(field) => (
          <field.TextField
            id="sign-up-email"
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
            id="sign-up-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            disabled={props.disabled}
          />
        )}
      />
      <appForm.AppField
        name="confirmPassword"
        children={(field) => (
          <field.TextField
            id="sign-up-confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            disabled={props.disabled}
          />
        )}
      />
    </FieldGroup>
  )
}

export function SignUpForm() {
  const { appForm, signUpMutation, isBusy, handleSubmit } = useSignUpForm()

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
          <SignUpFields appForm={appForm} disabled={isBusy} />
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
