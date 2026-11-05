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
import { useForgotPasswordForm } from "@/hooks/use-forgot-password-form"

function BackToSignIn() {
  return (
    <Link
      id="forgot-password-sign-in"
      href="/sign-in"
      className="text-center text-sm text-muted-foreground underline"
    >
      Voltar para o login
    </Link>
  )
}

export function ForgotPasswordForm() {
  const { appForm, forgotPasswordMutation, isBusy, handleSubmit } =
    useForgotPasswordForm()

  if (forgotPasswordMutation.isSuccess) {
    return (
      <Card lang="pt-BR" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confira seu e-mail</CardTitle>
          <CardDescription>
            Se houver uma conta com esse e-mail, enviamos um link para redefinir
            a senha. Ele vale por 1 hora. Se não chegar em alguns minutos,
            confira o spam.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch">
          <BackToSignIn />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card lang="pt-BR" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Esqueceu sua senha?</CardTitle>
        <CardDescription>
          Informe o e-mail da conta para receber um link de redefinição.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="forgot-password-form"
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          {forgotPasswordMutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Pedido não enviado</AlertTitle>
              <AlertDescription>
                {forgotPasswordMutation.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <appForm.AppField
              name="email"
              children={(field) => (
                <field.TextField
                  id="forgot-password-email"
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  disabled={isBusy}
                />
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        <Button
          id="forgot-password-submit"
          type="submit"
          form="forgot-password-form"
          className="w-full"
          disabled={isBusy}
        >
          {isBusy ? <Spinner data-icon="inline-start" /> : null}
          {isBusy ? "Enviando..." : "Enviar link"}
        </Button>
        <BackToSignIn />
      </CardFooter>
    </Card>
  )
}
