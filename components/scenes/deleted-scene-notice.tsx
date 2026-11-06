"use client"

//* Libraries imports
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

//* Components imports
import { Button } from "@/components/ui/button"

//* Hooks imports
import { restoreScene } from "@/hooks/scenes/scene-deletion"

//* Local imports
import { sceneUndoRemainingMs } from "@/lib/scene-deletion"

type DeletedSceneNoticeProps = {
  textId: string
  title: string
  deletedAt: string
  readingInProgress: boolean
}

export function DeletedSceneNotice(props: DeletedSceneNoticeProps) {
  const router = useRouter()
  const [remaining] = useState(() =>
    sceneUndoRemainingMs(new Date(props.deletedAt))
  )
  const [open, setOpen] = useState(remaining > 0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || remaining <= 0) return
    const timer = window.setTimeout(() => setOpen(false), remaining)
    return () => window.clearTimeout(timer)
  }, [open, remaining])

  if (!open) return null

  async function undo() {
    setPending(true)
    setError("")
    try {
      await restoreScene(props.textId)
    } catch (caught) {
      setPending(false)
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível desfazer a exclusão. Tente de novo."
      )
      return
    }
    router.refresh()
  }

  return (
    <div role="status" className="flex flex-col items-start gap-2 rounded-lg bg-muted p-4">
      <p>Cena excluída.</p>
      {props.readingInProgress ? (
        <p>A leitura em andamento não será concluída.</p>
      ) : null}
      <p className="text-sm text-muted-foreground">{props.title}</p>
      <Button
        id={`undo-delete-scene-${props.textId}`}
        type="button"
        variant="outline"
        className="min-h-11 w-full sm:w-fit"
        disabled={pending}
        onClick={() => {
          void undo()
        }}
      >
        Desfazer
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
