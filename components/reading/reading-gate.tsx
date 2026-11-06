"use client"
//* Libraries imports
import Link from "next/link"
import { useRouter } from "next/navigation"

//* Components imports
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ReadingDataNotice } from "@/components/legal/reading-data-notice"

//* Hooks imports
import {
  StaleReadingStateError,
  useStartReading,
} from "@/hooks/correction/use-start-reading"
import { useResendVerification } from "@/hooks/use-resend-verification"

type ReadingGateProps = {
  themeId?: string
  textId: string
  themeTitle: string
  textContent: string
  email: string
  emailVerified: boolean
  verificationLinkFailed: boolean
}

type UnverifiedNoticeProps = {
  textId: string
  email: string
  verificationLinkFailed: boolean
}

function UnverifiedNotice(props: UnverifiedNoticeProps) {
  const resend = useResendVerification({
    email: props.email,
    callbackURL: `/dashboard/texts/${props.textId}`,
  })

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="font-medium">
        Confirme seu e-mail para receber a leitura. Sua cena está salva.
      </p>
      {props.verificationLinkFailed ? (
        <p className="text-sm text-muted-foreground">
          O link de confirmação expirou ou não é mais válido. Peça um novo.
        </p>
      ) : null}
      <Button
        className="min-h-11 w-full sm:w-fit"
        id="resend-verification"
        type="button"
        variant="outline"
        disabled={resend.isPending}
        onClick={() => {
          resend.mutate()
        }}
      >
        {resend.isPending ? <Spinner data-icon="inline-start" /> : null}
        Reenviar e-mail
      </Button>
      {resend.isSuccess ? (
        <p role="status" className="text-sm text-muted-foreground">
          Pedimos o envio para {props.email}. Pode levar alguns minutos. Se não
          chegar, confira o spam.
        </p>
      ) : null}
      {resend.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {resend.error.message}
        </p>
      ) : null}
    </div>
  )
}

type StartReadingProps = {
  textId: string
}

function StartReading(props: StartReadingProps) {
  const router = useRouter()
  const startReading = useStartReading()
  function handleStart() {
    startReading.mutate(props.textId, {
      onSuccess: () => {
        router.refresh()
      },
      onError: (error) => {
        if (error instanceof StaleReadingStateError) {
          router.refresh()
        }
      },
    })
  }

  const showError =
    startReading.isError &&
    !(startReading.error instanceof StaleReadingStateError)

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="font-medium">
        Sua cena está salva e pronta para a leitura.
      </p>
      <ReadingDataNotice />
      <Button
        className="min-h-11 w-full sm:w-fit"
        id="start-reading"
        type="button"
        disabled={startReading.isPending}
        onClick={handleStart}
      >
        {startReading.isPending ? <Spinner data-icon="inline-start" /> : null}
        Receber a leitura
      </Button>
      {showError ? (
        <p role="alert" className="text-sm text-destructive">
          {startReading.error?.message ??
            "Não conseguimos iniciar a leitura. Sua cena continua salva. Tente de novo em instantes."}
        </p>
      ) : null}
    </div>
  )
}

function ReadingGate(props: ReadingGateProps) {
  return (
    <div
      lang="pt-BR"
      className="flex w-full max-w-3xl min-w-0 flex-col gap-4 p-4 [overflow-wrap:anywhere]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="min-w-0 font-heading text-lg font-medium">
          {props.themeTitle}
        </h1>
        <DeleteSceneButton
          id="delete-scene"
          textId={props.textId}
          redirectTo="/dashboard/texts"
        />
      </div>
      {props.emailVerified ? (
        <StartReading textId={props.textId} />
      ) : (
        <UnverifiedNotice
          textId={props.textId}
          email={props.email}
          verificationLinkFailed={props.verificationLinkFailed}
        />
      )}
      {props.themeId ? (
        <Link
          className="w-fit py-3 underline"
          href={`/dashboard/exercises/${props.themeId}/write?textId=${props.textId}`}
        >
          Continuar escrevendo
        </Link>
      ) : null}
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-medium">Sua cena</h2>
        <p className="leading-relaxed whitespace-pre-wrap">
          {props.textContent}
        </p>
      </section>
    </div>
  )
}

export { ReadingGate }
