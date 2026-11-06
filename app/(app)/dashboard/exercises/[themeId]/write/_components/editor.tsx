"use client"

//* Libraries imports
import { type ReactNode } from "react"
import Link from "next/link"

//* Components imports
import { Button } from "@/components/ui/button"
import { ReadingDataNotice } from "@/components/legal/reading-data-notice"

//* Hooks imports
import { useSceneDraft } from "@/hooks/write/use-scene-draft"

//* Local imports
import { sceneSizeError } from "@/lib/reading-policy"
import { ReviewPanel } from "./review-panel"
import { RevisionFocus, type RevisionQuote } from "./revision-focus"
import { SaveError } from "./save-error"
import { SceneChecklist } from "./scene-checklist"

export type EditorProps = {
  themeId: string
  textId?: string
  initialContent?: string
  initialTitle?: string
  initialChecklist?: string[]
  checklistItems?: string[]
  briefing?: ReactNode
  minWords?: number
  maxWords?: number
  initialIntent?: string
  revision?: {
    version: number
    focus: string
    quotes: RevisionQuote[]
    readingHref: string
  }
}
type SceneDraft = ReturnType<typeof useSceneDraft>

export function Editor(props: EditorProps) {
  const draft = useSceneDraft(props)
  const checked = new Set(draft.checklist)
  const missing = draft.items.filter((item) => !checked.has(item))
  const busy = draft.pending || draft.locked
  const hidePanel = draft.focus && !props.revision

  function toggleItem(item: string, checked: boolean) {
    draft.setChecklist(
      checked
        ? [...draft.checklist, item]
        : draft.checklist.filter((value) => value !== item)
    )
  }

  function askReview() {
    const invalid = sceneSizeError(draft.content)
    if (invalid) draft.setError(invalid)
    else draft.setReview(true)
  }

  return (
    <div data-writing-focus={draft.focus} className="min-w-0">
      <FocusModeStyle active={draft.focus} />
      <FocusToggle
        focus={draft.focus}
        onToggle={() => draft.setFocus(!draft.focus)}
      />
      <div className={editorColumns(hidePanel)}>
        <ExerciseAside
          hidden={hidePanel}
          revision={props.revision}
          briefing={props.briefing}
        />
        <SceneColumn
          draft={draft}
          revision={props.revision}
          minWords={props.minWords}
          maxWords={props.maxWords}
          missing={missing}
          busy={busy}
          onToggle={toggleItem}
          onAskReview={askReview}
        />
      </div>
    </div>
  )
}

function editorColumns(hidePanel: boolean) {
  if (hidePanel) return ""
  return "grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
}

function FocusModeStyle(props: { active: boolean }) {
  if (!props.active) return null
  return (
    <style>
      {
        '[data-slot="sidebar"], [data-slot="sidebar-gap"], [data-app-navigation], main > div:has([data-slot="sidebar-trigger"]) { display: none !important; }'
      }
    </style>
  )
}

function FocusToggle(props: { focus: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-wrap gap-3 pb-4">
      <Button
        id="toggle-focus-mode"
        type="button"
        variant="outline"
        onClick={props.onToggle}
      >
        {props.focus ? "Sair do modo foco" : "Modo foco"}
      </Button>
    </div>
  )
}

function ExerciseAside(props: {
  hidden: boolean
  revision?: EditorProps["revision"]
  briefing?: ReactNode
}) {
  return (
    <aside
      hidden={props.hidden}
      id="exercise-information"
      aria-label={asideLabel(props.revision)}
      className="order-2 min-w-0 lg:order-1"
    >
      {props.revision ? (
        <RevisionFocus
          focus={props.revision.focus}
          quotes={props.revision.quotes}
        />
      ) : (
        <details open>
          <summary className="cursor-pointer py-3 font-medium">
            Informações do exercício
          </summary>
          <div className="prose max-w-none break-words dark:prose-invert">
            {props.briefing}
          </div>
        </details>
      )}
    </aside>
  )
}

function asideLabel(revision: EditorProps["revision"]) {
  if (revision) return "Foco da revisão"
  return "Informações do exercício"
}

function SceneColumn(props: {
  draft: SceneDraft
  revision?: EditorProps["revision"]
  minWords?: number
  maxWords?: number
  missing: string[]
  busy: boolean
  onToggle: (item: string, checked: boolean) => void
  onAskReview: () => void
}) {
  return (
    <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
      {props.revision ? (
        <RevisionBanner
          version={props.revision.version}
          readingHref={props.revision.readingHref}
        />
      ) : null}
      <SceneTitleInput
        title={props.draft.title}
        disabled={props.busy}
        onChange={props.draft.setTitle}
      />
      <SceneContentInput
        content={props.draft.content}
        disabled={props.busy}
        onChange={props.draft.setContent}
      />
      <p id="scene-limits">
        {props.draft.words.toLocaleString("pt-BR")} palavras · Limites: 100 a
        2.000 palavras
        {limitNote(props.minWords, props.maxWords)}
      </p>
      <SaveStatus dirty={props.draft.dirty} saved={props.draft.saved} />
      <SceneChecklist
        items={props.draft.items}
        checked={props.draft.checklist}
        disabled={props.busy}
        onToggle={props.onToggle}
      />
      {props.revision ? (
        <RevisionIntentField
          value={props.draft.revisionIntent}
          disabled={props.busy}
          onChange={props.draft.setRevisionIntent}
        />
      ) : null}
      <EditorActions
        draft={props.draft}
        minWords={props.minWords}
        maxWords={props.maxWords}
        missing={props.missing}
        busy={props.busy}
        revisionIntent={revisionIntentValue(props.revision, props.draft)}
        onAskReview={props.onAskReview}
      />
    </div>
  )
}

function revisionIntentValue(
  revision: EditorProps["revision"],
  draft: SceneDraft
) {
  if (!revision) return undefined
  return draft.revisionIntent
}

function RevisionBanner(props: { version: number; readingHref: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Versão {props.version} · rascunho
      </p>
      <p>A versão anterior permanece como foi lida.</p>
      <Link
        id="back-to-reading"
        href={props.readingHref}
        className="w-fit py-2 underline"
      >
        Voltar à leitura
      </Link>
    </div>
  )
}

function SceneTitleInput(props: {
  title: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <>
      <label htmlFor="scene-title">Título da cena (opcional)</label>
      <input
        id="scene-title"
        maxLength={200}
        value={props.title}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
        className="min-h-11 w-full rounded-md border p-3"
      />
    </>
  )
}

function SceneContentInput(props: {
  content: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <>
      <label htmlFor="scene-content" className="font-medium">
        Sua cena
      </label>
      <textarea
        id="scene-content"
        placeholder="Comece no meio da cena."
        value={props.content}
        onChange={(event) => props.onChange(event.target.value)}
        disabled={props.disabled}
        aria-describedby="scene-limits"
        className="min-h-96 w-full resize-y rounded-md border bg-background p-4 text-base leading-relaxed"
      />
    </>
  )
}

function limitNote(minWords?: number, maxWords?: number) {
  if (!minWords || !maxWords) return ""
  return ` · Sugestão do exercício: ${minWords} a ${maxWords} palavras`
}

function SaveStatus(props: { dirty: boolean; saved: string }) {
  return (
    <p role="status">
      {props.dirty ? "Alterações ainda não salvas" : props.saved}
    </p>
  )
}

function RevisionIntentField(props: {
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="revision-intent">
        O que você tentou mudar? (opcional)
      </label>
      <textarea
        id="revision-intent"
        value={props.value}
        maxLength={2000}
        disabled={props.disabled}
        aria-describedby="revision-intent-note"
        onChange={(event) => props.onChange(event.target.value)}
        className="min-h-24 w-full rounded-md border p-3"
      />
      <p id="revision-intent-note" className="text-sm text-muted-foreground">
        Este campo é só o contexto desta revisão. Ele não muda a pontuação.
      </p>
    </div>
  )
}

function EditorActions(props: {
  draft: SceneDraft
  minWords?: number
  maxWords?: number
  missing: string[]
  busy: boolean
  revisionIntent?: string
  onAskReview: () => void
}) {
  return (
    <>
      {props.draft.error ? (
        <SaveError
          error={props.draft.error}
          content={props.draft.content}
          expired={props.draft.expired}
          locked={props.draft.locked}
          textId={props.draft.textId.current}
          onRetry={props.draft.bumpRetry}
          onNotice={props.draft.setSaved}
        />
      ) : null}
      <ReadingDataNotice />
      <ReviewChoice
        review={props.draft.review}
        busy={props.busy}
        words={props.draft.words}
        minWords={props.minWords}
        maxWords={props.maxWords}
        missing={props.missing}
        pending={props.draft.pending}
        locked={props.draft.locked}
        revisionIntent={props.revisionIntent}
        onAskReview={props.onAskReview}
        onBack={() => props.draft.setReview(false)}
        onConfirm={props.draft.submit}
      />
    </>
  )
}

function ReviewChoice(props: {
  review: boolean
  busy: boolean
  words: number
  minWords?: number
  maxWords?: number
  missing: string[]
  pending: boolean
  locked: boolean
  revisionIntent?: string
  onAskReview: () => void
  onBack: () => void
  onConfirm: () => void
}) {
  if (!props.review) {
    return (
      <Button
        id="submit-text"
        type="button"
        disabled={props.busy}
        onClick={props.onAskReview}
      >
        Enviar para leitura
      </Button>
    )
  }
  return (
    <ReviewPanel
      words={props.words}
      minWords={props.minWords}
      maxWords={props.maxWords}
      missing={props.missing}
      pending={props.pending}
      locked={props.locked}
      revisionIntent={props.revisionIntent}
      onBack={props.onBack}
      onConfirm={props.onConfirm}
    />
  )
}
