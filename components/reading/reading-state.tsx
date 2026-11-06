"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button"
import { Button } from "@/components/ui/button"
import { ReadingDataNotice } from "@/components/legal/reading-data-notice"
import { READING_DELAY_MS } from "@/lib/reading-policy"
import {
  StaleReadingStateError,
  useStartReading,
} from "@/hooks/correction/use-start-reading"

type Props = {
  textId: string
  themeTitle: string
  textContent: string
  status: "PENDING" | "IN_PROGRESS" | "FAILED"
  createdAt: string
}
export function ReadingState(props: Props) {
  const router = useRouter()
  const retry = useStartReading()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (props.status === "FAILED") return
    const timer = setInterval(() => {
      setNow(Date.now())
      router.refresh()
    }, 3000)
    return () => clearInterval(timer)
  }, [props.status, router])
  const delayed = now - Date.parse(props.createdAt) >= READING_DELAY_MS
  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-4 p-4 [overflow-wrap:anywhere]">
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
      {props.status === "FAILED" ? (
        <>
          <p role="status">
            Não conseguimos ler sua cena. O texto está salvo e esta tentativa
            não conta nas suas leituras.
          </p>
          <ReadingDataNotice />
          <Button
            className="min-h-11 w-full sm:w-fit"
            disabled={retry.isPending}
            onClick={() =>
              retry.mutate(props.textId, {
                onSuccess: () => router.refresh(),
                onError: (error) => {
                  if (error instanceof StaleReadingStateError) router.refresh()
                },
              })
            }
          >
            Tentar de novo
          </Button>
          {retry.isError && !(retry.error instanceof StaleReadingStateError) ? (
            <p role="alert">{retry.error.message}</p>
          ) : null}
        </>
      ) : (
        <p role="status">
          {delayed
            ? "Está levando mais tempo que o normal. Pode voltar depois: ela vai aparecer em Minhas cenas."
            : props.status === "PENDING"
              ? "Sua cena está aguardando a leitura. Pode sair desta página: ela vai ficar em Minhas cenas."
              : "Sua cena está sendo lida. Pode sair desta página: ela vai ficar em Minhas cenas."}
        </p>
      )}
      <Link href="/dashboard/texts" className="w-fit py-3 underline">
        Minhas cenas
      </Link>
      <h2>Sua cena</h2>
      <p className="leading-relaxed whitespace-pre-wrap">{props.textContent}</p>
    </div>
  )
}
