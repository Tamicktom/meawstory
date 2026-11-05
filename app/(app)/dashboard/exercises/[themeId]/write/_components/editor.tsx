"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { countWords, sceneSizeError } from "@/lib/reading-policy"

type EditorProps = { themeId: string; textId?: string; initialContent?: string }
const Editor = (props: EditorProps) => {
  const router = useRouter()
  const [content, setContent] = useState(props.initialContent ?? "")
  const textId = useRef(props.textId)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  async function submit() {
    const invalid = sceneSizeError(content)
    if (invalid) {
      setError(invalid)
      return
    }
    setPending(true)
    setError("")
    try {
      const response = await fetch(`/api/write/${props.themeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, textId: textId.current }),
      })
      if (!response.ok) {
        if (response.status >= 500) throw new Error("Scene submission failed")
        // A rejected reading may already have saved the scene. Keep its ID for retries.
        const data = await response.json()
        if (data.textId) textId.current = data.textId
        setError(
          data.message ??
            "Não foi possível enviar. Seu texto continua aqui. Tente de novo."
        )
        return
      }
      const data = await response.json()
      if (!data.textId) throw new Error("Missing saved scene")
      textId.current = data.textId
      router.push(`/dashboard/texts/${data.textId}`)
    } catch {
      setError(
        "Não foi possível enviar. Seu texto continua aqui. Tente de novo."
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="order-1 flex w-full min-w-0 flex-col gap-4 [overflow-wrap:anywhere] lg:order-2">
      <label htmlFor="scene-content" className="font-medium">
        Sua cena
      </label>
      <textarea
        id="scene-content"
        placeholder="Comece no meio da cena."
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={pending}
        aria-describedby={error ? "scene-limits scene-error" : "scene-limits"}
        aria-invalid={Boolean(error)}
        className="min-h-96 w-full resize-y rounded-md border bg-background p-4 text-base leading-relaxed"
      />
      <p id="scene-limits">
        {countWords(content).toLocaleString("pt-BR")} palavras · Limites: 100 a
        2.000 palavras
      </p>
      {error ? (
        <p id="scene-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        id="submit-text"
        className="min-h-11 w-full sm:w-fit"
        disabled={pending}
        onClick={submit}
      >
        {pending ? "Enviando…" : "Enviar para leitura"}
      </Button>
    </div>
  )
}
export { Editor }
