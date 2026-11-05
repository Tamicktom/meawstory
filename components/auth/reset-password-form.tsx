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
import { buttonVariants } from "@/components/ui/button/button-variants"

//* Hooks imports
import { useResetPasswordForm } from "@/hooks/use-reset-password-form"

type ResetPasswordFormProps = {
  token: string
}

export function InvalidResetLink() {
  return (
    <Card lang="pt-BR" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Este link não vale mais</CardTitle>
        <CardDescription>
          O link de redefinição expira em 1 hora e só funciona uma vez. Peça um
          novo para continuar. Sua senha não foi alterada.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-col items-stretch">
        <Link
          id="reset-password-request-new"
          href="/forgot-password"
          className={buttonVariants({ className: "w-full" })}
        >
          Pedir um novo link
        </Link>
      </CardFooter>
    </Card>
  )
}

export function ResetPasswordForm(props: ResetPasswordFormProps) {
  const { appForm, resetPasswordMutation, isLinkInvalid, isBusy, handleSubmit } =
    useResetPasswordForm(props.token)

  if (isLinkInvalid) {
    return <InvalidResetLink />
  }

  if (resetPasswordMutation.isSuccess) {
    return (
      <Card lang="pt-BR" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Senha redefinida</CardTitle>
          <CardDescription>
            Entre com a nova senha para continuar escrevendo.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-stretch">
          <Link
            id="reset-password-sign-in"
            href="/sign-in"
            className={buttonVariants({ className: "w-full" })}
          >
            Entrar
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card lang="pt-BR" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Defina uma nova senha</CardTitle>
        <CardDescription>
          Depois disso, as sessões abertas da sua conta serão encerradas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="reset-password-form"
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          {resetPasswordMutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Senha não redefinida</AlertTitle>
              <AlertDescription>
                {resetPasswordMutation.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <appForm.AppField
              name="password"
              children={(field) => (
                <field.TextField
                  id="reset-password-password"
                  label="Nova senha"
                  type="password"
                  autoComplete="new-password"
                  disabled={isBusy}
                />
              )}
            />
            <appForm.AppField
              name="confirmPassword"
              children={(field) => (
                <field.TextField
                  id="reset-password-confirm-password"
                  label="Confirme a nova senha"
                  type="password"
                  autoComplete="new-password"
                  disabled={isBusy}
                />
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          id="reset-password-submit"
          type="submit"
          form="reset-password-form"
          className="w-full"
          disabled={isBusy}
        >
          {isBusy ? <Spinner data-icon="inline-start" /> : null}
          {isBusy ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </CardFooter>
    </Card>
  )
}
