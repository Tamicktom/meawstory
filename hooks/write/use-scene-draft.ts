"use client"
//* Libraries imports
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

//* Local imports
import { countWords, sceneSizeError } from "@/lib/reading-policy"
import type { EditorProps } from "@/app/(app)/dashboard/exercises/[themeId]/write/_components/editor"

type DraftSnapshot = {
  content: string
  title: string
  checklist: string[]
}

type SaveInput = {
  snapshot: string
  draftOnly: boolean
}

const saveFailureMessage = "Não foi possível salvar. Seu texto continua aqui."

class SaveRejected extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

function normalizeTitle(title: string | undefined) {
  return title?.startsWith("Text for theme ") || title === "Cena"
    ? ""
    : (title ?? "")
}

function initialDraft(props: EditorProps): DraftSnapshot {
  return {
    content: props.initialContent ?? "",
    title: normalizeTitle(props.initialTitle),
    checklist: props.initialChecklist ?? [],
  }
}

function rememberTextId(textId: RefObject<string | undefined>, next: unknown) {
  if (typeof next !== "string" || !next || next === textId.current) return
  textId.current = next
  const url = new URL(window.location.href)
  url.searchParams.set("textId", next)
  window.history.replaceState(null, "", url)
}

async function saveScene(
  themeId: string,
  input: SaveInput,
  textId: RefObject<string | undefined>
) {
  const response = await fetch(`/api/write/${themeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(JSON.parse(input.snapshot) as DraftSnapshot),
      textId: textId.current,
      draftOnly: input.draftOnly,
    }),
  })
  if (response.status >= 500) throw new Error(saveFailureMessage)
  const data = (await response.json()) as {
    textId?: string
    message?: string
  }
  rememberTextId(textId, data.textId)
  if (!response.ok) {
    throw new SaveRejected(
      data.message ?? "Não foi possível salvar.",
      response.status
    )
  }
  return data
}

type AutosaveOptions = {
  snapshot: string
  dirty: boolean
  pending: boolean
  locked: boolean
  retry: number
  submitted: RefObject<boolean>
  saveAsync: (
    input: SaveInput
  ) => Promise<{ textId?: string; message?: string }>
  setSaved: (message: string) => void
  setError: (message: string) => void
}

function useAutosave(options: AutosaveOptions) {
  const {
    snapshot,
    dirty,
    pending,
    locked,
    retry,
    submitted,
    saveAsync,
    setSaved,
    setError,
  } = options
  useEffect(() => {
    if (!dirty || pending || locked || submitted.current) return
    setSaved("Alterações ainda não salvas")
    const timer = window.setTimeout(() => {
      if (submitted.current) return
      saveAsync({ snapshot, draftOnly: true }).catch((cause: unknown) => {
        setError(
          `${cause instanceof Error ? cause.message : "Não foi possível salvar."} Mantenha esta página aberta. Vamos tentar novamente; você também pode copiar o texto.`
        )
      })
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [snapshot, dirty, pending, locked, retry, submitted, saveAsync, setSaved, setError])
}

function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
}

function useSaveRetry(
  error: string,
  locked: boolean,
  pending: boolean,
  retry: number,
  onRetry: () => void
) {
  useEffect(() => {
    if (!error || locked || pending) return
    const timer = window.setTimeout(onRetry, 10000)
    return () => window.clearTimeout(timer)
  }, [error, locked, pending, retry, onRetry])
}

export function useSceneDraft(props: EditorProps) {
  const router = useRouter()
  const [initial] = useState(() => initialDraft(props))
  const [content, setContent] = useState(initial.content)
  const [title, setTitle] = useState(initial.title)
  const [checklist, setChecklist] = useState(initial.checklist)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [expired, setExpired] = useState(false)
  const [locked, setLocked] = useState(false)
  const [focus, setFocus] = useState(false)
  const [review, setReview] = useState(false)
  const [retry, setRetry] = useState(0)
  const textId = useRef(props.textId)
  const submitted = useRef(false)
  const [confirmed] = useState(() => ({ current: JSON.stringify(initial) }))
  const snapshot = JSON.stringify({ content, title, checklist })
  const dirty = snapshot !== confirmed.current
  const items = props.checklistItems ?? []
  const words = countWords(content)

  // Scoped mutations run one at a time in call order, so an older response
  // never replaces a newer draft and submission waits for the pending save.
  // Draft saves are never read back through a query, so there is nothing to invalidate.
  // react-doctor-disable-next-line react-doctor/query-mutation-missing-invalidation
  const save = useMutation({
    mutationFn: (input: SaveInput) => saveScene(props.themeId, input, textId),
    scope: { id: `scene-draft:${props.themeId}` },
    onSuccess: (_data, input) => {
      confirmed.current = input.snapshot
      setSaved("Salvo há instantes")
      setError("")
      setExpired(false)
    },
    onError: (cause) => {
      if (!(cause instanceof SaveRejected)) return
      setExpired(cause.status === 401)
      if (cause.status === 409) setLocked(true)
    },
  })
  const saveAsync = save.mutateAsync
  useAutosave({
    snapshot,
    dirty,
    pending,
    locked,
    retry,
    submitted,
    saveAsync,
    setSaved,
    setError,
  })

  const bumpRetry = useCallback(() => setRetry((value) => value + 1), [])
  useSaveRetry(error, locked, pending, retry, bumpRetry)
  useUnsavedChangesWarning(dirty)

  async function submit() {
    const invalid = sceneSizeError(content)
    if (invalid) {
      setError(invalid)
      return
    }
    setPending(true)
    try {
      const data = await saveAsync({ snapshot, draftOnly: false })
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
