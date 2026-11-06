"use client"

//* Libraries imports
import { useState } from "react"
import { useRouter } from "next/navigation"

//* Components imports
import { Button } from "@/components/ui/button"

//* Hooks imports
import { closeScene, reopenScene } from "@/hooks/scenes/scene-closure"

type CloseSceneButtonProps = {
  id: string
  textId: string
  closed: boolean
}

export function CloseSceneButton(props: CloseSceneButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [closed, setClosed] = useState(props.closed)
  const [seenClosed, setSeenClosed] = useState(props.closed)
  const [error, setError] = useState("")

  if (props.closed !== seenClosed) {
    setSeenClosed(props.closed)
    setClosed(props.closed)
  }

  async function toggle() {
    setPending(true)
    setError("")
    try {
      if (closed) await reopenScene(props.textId)
      else await closeScene(props.textId)
    } catch (caught) {
      setPending(false)
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível atualizar a situação da cena."
      )
      return
    }
    setClosed(!closed)
    setPending(false)
    router.refresh()
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Button
        id={props.id}
        type="button"
        variant={closed ? "default" : "outline"}
        className="min-h-11 w-full sm:w-fit"
        disabled={pending}
        onClick={() => {
          void toggle()
        }}
      >
        {closed ? "Reabrir cena" : "Dar a cena por encerrada"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
