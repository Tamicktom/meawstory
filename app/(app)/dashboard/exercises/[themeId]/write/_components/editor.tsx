"use client"
//* Libraries imports
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import StarterKit from "@tiptap/starter-kit"
import { useEditor, EditorContent } from "@tiptap/react"

//* Components imports
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

//* Hooks imports
import { CORRECTION_REDIRECT_DELAY_MS } from "@/hooks/write/correction-redirect-delay"
import { useWriteText } from "@/hooks/write/use-write-text"

type EditorProps = {
  themeId: string
}

const Editor = (props: EditorProps) => {
  const router = useRouter()
  const writeText = useWriteText()
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false)
  const redirectTimeoutId = useRef<number | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Hello World! 🌎️</p>",
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  })

  useEffect(() => {
    return () => {
      if (redirectTimeoutId.current !== null) {
        window.clearTimeout(redirectTimeoutId.current)
      }
    }
  }, [])

  const handleSubmit = () => {
    const content = editor?.getText() || ""

    writeText.mutate(
      {
        themeId: props.themeId,
        content,
      },
      {
        onSuccess: (response) => {
          const textId =
            response.data && "textId" in response.data
              ? response.data.textId
              : undefined

          if (!textId) {
            return
          }

          if (redirectTimeoutId.current !== null) {
            window.clearTimeout(redirectTimeoutId.current)
          }

          setIsWaitingForCorrection(true)
          redirectTimeoutId.current = window.setTimeout(() => {
            router.push(`/dashboard/texts/${textId}`)
          }, CORRECTION_REDIRECT_DELAY_MS)
        },
      }
    )
  }

  const isPreparingCorrection = writeText.isPending || isWaitingForCorrection

  return (
    <div className="col-span-2 flex h-full w-full max-w-5xl flex-col items-start justify-start gap-2">
      <Button
        id="submit-text"
        type="button"
        disabled={isPreparingCorrection}
        onClick={handleSubmit}
      >
        Enviar texto
      </Button>
      {isPreparingCorrection ? (
        <p className="flex items-center gap-2 p-1 text-sm text-muted-foreground">
          <Spinner />
          <span>A correção está sendo preparada.</span>
        </p>
      ) : null}
      <EditorContent className="h-full w-full" editor={editor} />
    </div>
  )
}

export { Editor }
