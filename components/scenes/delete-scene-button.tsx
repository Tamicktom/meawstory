"use client"

//* Libraries imports
import { useState } from "react"
import { useRouter } from "next/navigation"

//* Components imports
import { Button } from "@/components/ui/button"

//* Hooks imports
import { retireScene } from "@/hooks/scenes/scene-deletion"

type DeleteSceneButtonProps = {
  id: string
  textId: string
  redirectTo?: string
  className?: string
}

export function DeleteSceneButton(props: DeleteSceneButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function retire() {
    setPending(true)
    setError("")
    try {
      await retireScene(props.textId)
    } catch (caught) {
      setPending(false)
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível excluir a cena. Ela continua em Minhas cenas."
      )
      return
    }
    if (props.redirectTo) router.push(props.redirectTo)
    else router.refresh()
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Button
        id={props.id}
        type="button"
        variant="destructive"
        className={props.className ?? "min-h-11 w-full sm:w-fit"}
        disabled={pending}
        onClick={() => {
          void retire()
        }}
      >
        Excluir cena
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
