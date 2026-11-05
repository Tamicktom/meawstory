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

//* Local imports
import { authHref, defaultDestination } from "@/lib/auth-destination"

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
            label="E-mail"
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
            label="Senha"
            type="password"
            autoComplete="current-password"
            disabled={props.disabled}
          />
        )}
      />
    </FieldGroup>
  )
}

type SignInFormProps = {
  destination?: string
}

export function SignInForm({
  destination = defaultDestination,
}: SignInFormProps) {
  const { appForm, signInMutation, isBusy, handleSubmit } =
    useSignInForm(destination)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Entre na sua conta</CardTitle>
        <CardDescription>
          Use seu e-mail e sua senha para continuar.
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
              <AlertTitle>Não foi possível entrar</AlertTitle>
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
          {isBusy ? "Entrando…" : "Entrar"}
        </Button>
        <Link
          id="sign-in-create-account"
          href={authHref("/sign-up", destination)}
          className="text-center text-sm text-muted-foreground underline"
        >
          Criar uma conta
        </Link>
        <Link
          id="sign-in-forgot-password"
          href="/forgot-password"
          className="text-center text-sm text-muted-foreground underline"
        >
          Esqueci minha senha
        </Link>
      </CardFooter>
    </Card>
  )
}
