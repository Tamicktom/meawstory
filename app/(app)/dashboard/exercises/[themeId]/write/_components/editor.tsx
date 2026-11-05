"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { countWords, sceneSizeError } from "@/lib/reading-policy"

type EditorProps = { themeId: string; textId?: string; initialContent?: string }
const Editor = (props: EditorProps) => {
  const router = useRouter()
  const [content, setContent] = useState(props.initialContent ?? "")
  const [textId, setTextId] = useState(props.textId)
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
        body: JSON.stringify({ content, textId }),
      })
      const data = await response.json()
      if (data.textId) setTextId(data.textId)
      if (!response.ok) {
        setError(
          (response.status < 500 ? data.message : null) ??
            "Não foi possível enviar. Seu texto continua aqui. Tente de novo."
        )
        return
      }
      if (!data.textId) throw new Error("Missing saved scene")
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
    <div className="col-span-2 flex w-full flex-col gap-4 p-4">
      <label htmlFor="scene-content" className="font-medium">
        Sua cena
      </label>
      <textarea
        id="scene-content"
        placeholder="Comece no meio da cena."
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={pending}
        className="min-h-96 w-full rounded-md border p-4"
      />
      <p>{countWords(content)} palavras · Limites: 100 a 2.000 palavras</p>
      {error ? <p role="alert">{error}</p> : null}
      <Button id="submit-text" disabled={pending} onClick={submit}>
        {pending ? "Enviando…" : "Enviar para leitura"}
      </Button>
    </div>
  )
}
export { Editor }
