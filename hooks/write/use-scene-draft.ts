"use client"
//* Libraries imports
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
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
  revisionIntent: string
}

type SaveInput = {
  snapshot: string
  draftOnly: boolean
}

type SaveResult = {
  textId?: string
  message?: string
}

type SaveAsync = (input: SaveInput) => Promise<SaveResult>

type UiState = {
  pending: boolean
  error: string
  saved: string
  expired: boolean
  locked: boolean
  focus: boolean
  review: boolean
  retry: number
}

type UiAction =
  | { type: "pending"; value: boolean }
  | { type: "error"; value: string }
  | { type: "saved"; value: string }
  | { type: "expired"; value: boolean }
  | { type: "locked"; value: boolean }
  | { type: "focus"; value: boolean }
  | { type: "review"; value: boolean }
  | { type: "retry" }

const initialUi: UiState = {
  pending: false,
  error: "",
  saved: "",
  expired: false,
  locked: false,
  focus: false,
  review: false,
  retry: 0,
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "pending":
      return { ...state, pending: action.value }
    case "error":
      return { ...state, error: action.value }
    case "saved":
      return { ...state, saved: action.value }
    case "expired":
      return { ...state, expired: action.value }
    case "locked":
      return { ...state, locked: action.value }
    case "focus":
      return { ...state, focus: action.value }
    case "review":
      return { ...state, review: action.value }
    case "retry":
      return { ...state, retry: state.retry + 1 }
  }
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
    revisionIntent: props.initialIntent ?? "",
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
): Promise<SaveResult> {
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
  const data = (await response.json()) as SaveResult
  rememberTextId(textId, data.textId)
  if (!response.ok) {
    throw new SaveRejected(
      data.message ?? "Não foi possível salvar.",
      response.status
    )
  }
  return data
}

type SaveState = {
  confirmed: RefObject<string>
  dispatch: Dispatch<UiAction>
}

function applySaveSuccess(state: SaveState, input: SaveInput) {
  state.confirmed.current = input.snapshot
  state.dispatch({ type: "saved", value: "Salvo há instantes" })
  state.dispatch({ type: "error", value: "" })
  state.dispatch({ type: "expired", value: false })
}

function applySaveError(state: SaveState, cause: unknown) {
  if (!(cause instanceof SaveRejected)) return
  state.dispatch({ type: "expired", value: cause.status === 401 })
  if (cause.status === 409) state.dispatch({ type: "locked", value: true })
}

// Scoped mutations run one at a time in call order, so an older response
// never replaces a newer draft and submission waits for the pending save.
function useSaveScene(
  themeId: string,
  textId: RefObject<string | undefined>,
  state: SaveState
) {
  // Draft saves are never read back through a query, so there is nothing to invalidate.
  // react-doctor-disable-next-line react-doctor/query-mutation-missing-invalidation
  return useMutation({
    mutationFn: (input: SaveInput) => saveScene(themeId, input, textId),
    scope: { id: `scene-draft:${themeId}` },
    onSuccess: (_data, input) => applySaveSuccess(state, input),
    onError: (cause) => applySaveError(state, cause),
  })
}

type AutosaveOptions = {
  snapshot: string
  dirty: boolean
  ui: UiState
  submitted: RefObject<boolean>
  saveAsync: SaveAsync
  dispatch: Dispatch<UiAction>
}

function useAutosave(options: AutosaveOptions) {
  const { snapshot, dirty, ui, submitted, saveAsync, dispatch } = options
  useEffect(() => {
    if (!dirty || ui.pending || ui.locked || submitted.current) return
    dispatch({ type: "saved", value: "Alterações ainda não salvas" })
    const timer = window.setTimeout(() => {
      if (submitted.current) return
      saveAsync({ snapshot, draftOnly: true }).catch((cause: unknown) => {
        dispatch({
          type: "error",
          value: `${cause instanceof Error ? cause.message : "Não foi possível salvar."} Mantenha esta página aberta. Vamos tentar novamente; você também pode copiar o texto.`,
        })
      })
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [
    snapshot,
    dirty,
    ui.pending,
    ui.locked,
    ui.retry,
    submitted,
    saveAsync,
    dispatch,
  ])
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
  ui: UiState,
  submitted: RefObject<boolean>,
  dispatch: Dispatch<UiAction>
) {
  useEffect(() => {
    if (!ui.error || ui.locked || ui.pending) return
    const timer = window.setTimeout(() => {
      if (!submitted.current) dispatch({ type: "retry" })
    }, 10000)
    return () => window.clearTimeout(timer)
  }, [ui.error, ui.locked, ui.pending, ui.retry, submitted, dispatch])
}

type SubmitOptions = {
  content: string
  snapshot: string
  submitted: RefObject<boolean>
  saveAsync: SaveAsync
  dispatch: Dispatch<UiAction>
  navigate: (url: string) => void
}

async function submitScene(options: SubmitOptions) {
  const invalid = sceneSizeError(options.content)
  if (invalid) {
    options.dispatch({ type: "error", value: invalid })
    return
  }
  options.dispatch({ type: "pending", value: true })
  try {
    const data = await options.saveAsync({
      snapshot: options.snapshot,
      draftOnly: false,
    })
    options.submitted.current = true
    options.navigate(`/dashboard/texts/${data.textId}`)
  } catch (cause) {
    options.dispatch({
      type: "error",
      value:
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar. Seu texto continua aqui.",
    })
  } finally {
    options.dispatch({ type: "pending", value: false })
  }
}

export function useSceneDraft(props: EditorProps) {
  const router = useRouter()
  const [content, setContent] = useState(() => initialDraft(props).content)
  const [title, setTitle] = useState(() => initialDraft(props).title)
  const [checklist, setChecklist] = useState(
    () => initialDraft(props).checklist
  )
  const [revisionIntent, setRevisionIntent] = useState(
    () => initialDraft(props).revisionIntent
  )
  const [ui, dispatch] = useReducer(uiReducer, initialUi)
  const textId = useRef(props.textId)
  const submitted = useRef(false)
  const [confirmed] = useState(() => ({
    current: JSON.stringify(initialDraft(props)),
  }))
  const snapshot = JSON.stringify({ content, title, checklist, revisionIntent })
  const dirty = snapshot !== confirmed.current
  const items = props.checklistItems ?? []
  const words = countWords(content)

  const save = useSaveScene(props.themeId, textId, { confirmed, dispatch })
  const saveAsync = save.mutateAsync
  useAutosave({ snapshot, dirty, ui, submitted, saveAsync, dispatch })
  useSaveRetry(ui, submitted, dispatch)
  useUnsavedChangesWarning(dirty)

  function submit() {
    return submitScene({
      content,
      snapshot,
      submitted,
      saveAsync,
      dispatch,
      navigate: (url) => router.push(url),
    })
  }

  return {
    content,
    setContent,
    title,
    setTitle,
    checklist,
    setChecklist,
    revisionIntent,
    setRevisionIntent,
    pending: ui.pending,
    error: ui.error,
    saved: ui.saved,
    dirty,
    setSaved: (value: string) => dispatch({ type: "saved", value }),
    setError: (value: string) => dispatch({ type: "error", value }),
    expired: ui.expired,
    locked: ui.locked,
    focus: ui.focus,
    setFocus: (value: boolean) => dispatch({ type: "focus", value }),
    review: ui.review,
    setReview: (value: boolean) => dispatch({ type: "review", value }),
    bumpRetry: () => dispatch({ type: "retry" }),
    textId,
    items,
    words,
    submit,
  }
}
