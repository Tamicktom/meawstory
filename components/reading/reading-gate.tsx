"use client"
//* Libraries imports
import { useState } from "react"
import { useRouter } from "next/navigation"

//* Components imports
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

//* Hooks imports
import { useCheckCorrectionStatus } from "@/hooks/correction/use-check-correction-status"
import {
  StaleReadingStateError,
  useStartReading,
} from "@/hooks/correction/use-start-reading"
import { useResendVerification } from "@/hooks/use-resend-verification"
import { useInterval } from "@/hooks/utils/use-interval"

const statusCheckInterval = 3_000

type ReadingGateProps = {
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
  const [pollingTextId, setPollingTextId] = useState<string | null>(null)
  const [readingFailed, setReadingFailed] = useState(false)
  const startReading = useStartReading()
  const correctionStatus = useCheckCorrectionStatus({
    textId: pollingTextId,
    onCompleted: () => {
      setPollingTextId(null)
      router.refresh()
    },
    onFailed: () => {
      setPollingTextId(null)
      setReadingFailed(true)
    },
  })

  useInterval(
    () => {
      void correctionStatus.refetch()
    },
    pollingTextId ? statusCheckInterval : null
  )

  function handleStart() {
    setReadingFailed(false)
    startReading.mutate(props.textId, {
      onSuccess: () => {
        setPollingTextId(props.textId)
      },
      onError: (error) => {
        if (error instanceof StaleReadingStateError) {
          router.refresh()
        }
      },
    })
  }

  if (pollingTextId) {
    return (
      <p role="status" className="flex items-center gap-2 font-medium">
        <Spinner />
        <span>Sua cena está sendo lida.</span>
      </p>
    )
  }

  const showError =
    readingFailed ||
    (startReading.isError &&
      !(startReading.error instanceof StaleReadingStateError))

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="font-medium">Sua cena está salva e pronta para a leitura.</p>
      <Button
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
          Não conseguimos iniciar a leitura. Sua cena continua salva. Tente de
          novo em instantes.
        </p>
      ) : null}
    </div>
  )
}

function ReadingGate(props: ReadingGateProps) {
  return (
    <div lang="pt-BR" className="flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">{props.themeTitle}</h1>
      {props.emailVerified ? (
        <StartReading textId={props.textId} />
      ) : (
        <UnverifiedNotice
          textId={props.textId}
          email={props.email}
          verificationLinkFailed={props.verificationLinkFailed}
        />
      )}
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-medium">Sua cena</h2>
        <p className="whitespace-pre-wrap">{props.textContent}</p>
      </section>
    </div>
  )
}

export { ReadingGate }
