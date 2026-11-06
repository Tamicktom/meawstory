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
export function Editor(props: EditorProps) {
  const draft = useSceneDraft(props)
  const checked = new Set(draft.checklist)
  const missing = draft.items.filter((item) => !checked.has(item))

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

  const hidePanel = draft.focus && !props.revision

  return (
    <div data-writing-focus={draft.focus} className="min-w-0">
      {draft.focus ? (
        <style>
          {
            '[data-slot="sidebar"], [data-slot="sidebar-gap"], main > div:has([data-slot="sidebar-trigger"]) { display: none !important; }'
          }
        </style>
      ) : null}
      <div className="flex flex-wrap gap-3 pb-4">
        <Button
          id="toggle-focus-mode"
          type="button"
          variant="outline"
          onClick={() => draft.setFocus(!draft.focus)}
        >
          {draft.focus ? "Sair do modo foco" : "Modo foco"}
        </Button>
      </div>
      <div
        className={
          hidePanel
            ? ""
            : "grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        }
      >
        <aside
          hidden={hidePanel}
          id="exercise-information"
          aria-label={
            props.revision ? "Foco da revisão" : "Informações do exercício"
          }
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
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          {props.revision ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Versão {props.revision.version} · rascunho
              </p>
              <p>A versão anterior permanece como foi lida.</p>
              <Link
                id="back-to-reading"
                href={props.revision.readingHref}
                className="w-fit py-2 underline"
              >
                Voltar à leitura
              </Link>
            </div>
          ) : null}
          <label htmlFor="scene-title">Título da cena (opcional)</label>
          <input
            id="scene-title"
            maxLength={200}
            value={draft.title}
            disabled={draft.pending || draft.locked}
            onChange={(event) => draft.setTitle(event.target.value)}
            className="min-h-11 w-full rounded-md border p-3"
          />
          <label htmlFor="scene-content" className="font-medium">
            Sua cena
          </label>
          <textarea
            id="scene-content"
            placeholder="Comece no meio da cena."
            value={draft.content}
            onChange={(event) => draft.setContent(event.target.value)}
            disabled={draft.pending || draft.locked}
            aria-describedby="scene-limits"
            className="min-h-96 w-full resize-y rounded-md border bg-background p-4 text-base leading-relaxed"
          />
          <p id="scene-limits">
            {draft.words.toLocaleString("pt-BR")} palavras · Limites: 100 a
            2.000 palavras
            {props.minWords && props.maxWords
              ? ` · Sugestão do exercício: ${props.minWords} a ${props.maxWords} palavras`
              : ""}
          </p>
          <p role="status">
            {draft.dirty ? "Alterações ainda não salvas" : draft.saved}
          </p>
          <SceneChecklist
            items={draft.items}
            checked={draft.checklist}
            disabled={draft.pending || draft.locked}
            onToggle={toggleItem}
          />
          {props.revision ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="revision-intent">
                O que você tentou mudar? (opcional)
              </label>
              <textarea
                id="revision-intent"
                value={draft.revisionIntent}
                maxLength={2000}
                disabled={draft.pending || draft.locked}
                aria-describedby="revision-intent-note"
                onChange={(event) =>
                  draft.setRevisionIntent(event.target.value)
                }
                className="min-h-24 w-full rounded-md border p-3"
              />
              <p
                id="revision-intent-note"
                className="text-sm text-muted-foreground"
              >
                Este campo é só o contexto desta revisão. Ele não muda a
                pontuação.
              </p>
            </div>
          ) : null}
          {draft.error ? (
            <SaveError
              error={draft.error}
              content={draft.content}
              expired={draft.expired}
              locked={draft.locked}
              textId={draft.textId.current}
              onRetry={draft.bumpRetry}
              onNotice={draft.setSaved}
            />
          ) : null}
          <ReadingDataNotice />
          {!draft.review ? (
            <Button
              id="submit-text"
              type="button"
              disabled={draft.pending || draft.locked}
              onClick={askReview}
            >
              Enviar para leitura
            </Button>
          ) : (
            <ReviewPanel
              words={draft.words}
              minWords={props.minWords}
              maxWords={props.maxWords}
              missing={missing}
              pending={draft.pending}
              locked={draft.locked}
              revisionIntent={props.revision ? draft.revisionIntent : undefined}
              onBack={() => draft.setReview(false)}
              onConfirm={draft.submit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
