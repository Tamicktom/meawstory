"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { countWords, sceneSizeError } from "@/lib/reading-policy"
import type { EditorProps } from "@/app/(app)/dashboard/exercises/[themeId]/write/_components/editor"

export function useSceneDraft(props: EditorProps) {
  const router = useRouter()
  const [content, setContent] = useState(props.initialContent ?? "")
  const [title, setTitle] = useState(
    props.initialTitle?.startsWith("Text for theme ") ||
      props.initialTitle === "Cena"
      ? ""
      : (props.initialTitle ?? "")
  )
  const [checklist, setChecklist] = useState(props.initialChecklist ?? [])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [expired, setExpired] = useState(false)
  const [locked, setLocked] = useState(false)
  const [focus, setFocus] = useState(false)
  const [review, setReview] = useState(false)
  const [retry, setRetry] = useState(0)
  const textId = useRef(props.textId)
  const queue = useRef<Promise<void> | null>(null)
  if (!queue.current) queue.current = Promise.resolve()
  const submitted = useRef(false)
  const confirmed = useRef<string | null>(null)
  if (confirmed.current === null)
    confirmed.current = JSON.stringify({ content, title, checklist })
  const snapshot = JSON.stringify({ content, title, checklist })
  const dirty = snapshot !== confirmed.current
  const items = props.checklistItems ?? []
  const words = countWords(content)

  // Serialize saves and submission so an older response never replaces a newer draft.
  async function persist(body: string, draftOnly: boolean) {
    const response = await fetch(`/api/write/${props.themeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...JSON.parse(body),
        textId: textId.current,
        draftOnly,
      }),
    })
    if (response.status >= 500)
      throw new Error("Não foi possível salvar. Seu texto continua aqui.")
    const data = await response.json()
    if (data.textId) {
      textId.current = data.textId
      const url = new URL(window.location.href)
      url.searchParams.set("textId", data.textId)
      window.history.replaceState(null, "", url)
    }
    if (!response.ok) {
      setExpired(response.status === 401)
      if (response.status === 409) setLocked(true)
      throw new Error(data.message ?? "Não foi possível salvar.")
    }
    confirmed.current = body
    setSaved("Salvo há instantes")
    setError("")
    setExpired(false)
    return data
  }

  useEffect(() => {
    if (!dirty || pending || locked || submitted.current) return
    setSaved("Alterações ainda não salvas")
    const timer = window.setTimeout(() => {
      queue.current = queue.current!.then(async () => {
        if (submitted.current) return
        try {
          await persist(snapshot, true)
        } catch (cause) {
          setError(
            `${cause instanceof Error ? cause.message : "Não foi possível salvar."} Mantenha esta página aberta. Vamos tentar novamente; você também pode copiar o texto.`
          )
        }
      })
    }, 1000)
    return () => window.clearTimeout(timer)
    // persist uses refs for the current scene identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, dirty, pending, locked, retry])

  useEffect(() => {
    if (!error || locked || pending) return
    const timer = window.setTimeout(() => setRetry((value) => value + 1), 10000)
    return () => window.clearTimeout(timer)
  }, [error, locked, pending, retry])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  async function submit() {
    const invalid = sceneSizeError(content)
    if (invalid) {
      setError(invalid)
      return
    }
    setPending(true)
    await queue.current
    try {
      const data = await persist(snapshot, false)
      submitted.current = true
      router.push(`/dashboard/texts/${data.textId}`)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar. Seu texto continua aqui."
      )
    } finally {
      setPending(false)
    }
  }

  return {
    content,
    setContent,
    title,
    setTitle,
    checklist,
    setChecklist,
    pending,
    error,
    saved,
    dirty,
    setSaved,
    setError,
    expired,
    locked,
    focus,
    setFocus,
    review,
    setReview,
    setRetry,
    textId,
    items,
    words,
    submit,
  }
}
