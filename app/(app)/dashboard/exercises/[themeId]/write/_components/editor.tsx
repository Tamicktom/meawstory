"use client"
import { type ReactNode } from "react"
import { useSceneDraft } from "@/hooks/write/use-scene-draft"
import { Button } from "@/components/ui/button"
import { ReadingDataNotice } from "@/components/legal/reading-data-notice"
import { sceneSizeError } from "@/lib/reading-policy"

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
}
export function Editor(props: EditorProps) {
  const {
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
  } = useSceneDraft(props)

  const marked = new Set(checklist)
  return (
    <div data-writing-focus={focus} className="min-w-0">
      {focus ? (
        <style>
          {
            '[data-slot="sidebar"], [data-slot="sidebar-gap"], main > div:has([data-slot="sidebar-trigger"]) { display: none !important; }'
          }
        </style>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setFocus(!focus)}>
          {focus ? "Sair do modo foco" : "Modo foco"}
        </Button>
      </div>
      <div
        className={
          focus
            ? ""
            : "grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        }
      >
        <aside
          hidden={focus}
          id="exercise-information"
          className="order-2 min-w-0 lg:order-1"
        >
          <details open>
            <summary className="cursor-pointer py-3 font-medium">
              Informações do exercício
            </summary>
            <div className="prose max-w-none break-words dark:prose-invert">
              {props.briefing}
            </div>
          </details>
        </aside>
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <label htmlFor="scene-title">Título da cena (opcional)</label>
          <input
            id="scene-title"
            maxLength={200}
            value={title}
            disabled={pending || locked}
            onChange={(event) => setTitle(event.target.value)}
            className="min-h-11 w-full rounded-md border p-3"
          />
          <label htmlFor="scene-content" className="font-medium">
            Sua cena
          </label>
          <textarea
            id="scene-content"
            placeholder="Comece no meio da cena."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={pending || locked}
            aria-describedby="scene-limits"
            className="min-h-96 w-full resize-y rounded-md border bg-background p-4 text-base leading-relaxed"
          />
          <p id="scene-limits">
            {words.toLocaleString("pt-BR")} palavras · Limites: 100 a 2.000
            palavras
            {props.minWords && props.maxWords
              ? ` · Sugestão do exercício: ${props.minWords} a ${props.maxWords} palavras`
              : ""}
          </p>
          <p role="status">{dirty ? "Alterações ainda não salvas" : saved}</p>
          {items.length ? (
            <fieldset
              disabled={pending || locked}
              className="flex flex-col gap-3"
            >
              <legend>Checklist da cena</legend>
              {items.map((item) => (
                <label key={item} className="flex gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={marked.has(item)}
                    onChange={(event) =>
                      setChecklist(
                        event.target.checked
                          ? [...checklist, item]
                          : checklist.filter((value) => value !== item)
                      )
                    }
                  />
                  {item}
                </label>
              ))}
            </fieldset>
          ) : null}
          {error ? (
            <div role="alert">
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => setRetry((value) => value + 1)}
              >
                Tentar salvar novamente
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(content)
                    setSaved("Texto copiado")
                  } catch {
                    setSaved("Selecione o texto da cena e copie manualmente.")
                  }
                }}
              >
                Copiar texto
              </Button>
              {expired ? (
                <a
                  href="/sign-in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block underline"
                >
                  Entrar novamente em outra aba para salvar
                </a>
              ) : null}
              {locked && textId.current ? (
                <a
                  className="block underline"
                  href={`/dashboard/texts/${textId.current}`}
                >
                  Abrir leitura — o texto enviado está preservado
                </a>
              ) : null}
            </div>
          ) : null}
          <ReadingDataNotice />
          {!review ? (
            <Button
              id="submit-text"
              disabled={pending || locked}
              onClick={() => {
                const invalid = sceneSizeError(content)
                if (invalid) setError(invalid)
                else setReview(true)
              }}
            >
              Enviar para leitura
            </Button>
          ) : (
            <section
              aria-label="Conferir envio"
              className="flex flex-col gap-3 rounded-md border p-4"
            >
              <h2 className="font-medium">Confira antes de enviar</h2>
              <p>
                {words} palavras
                {props.minWords && props.maxWords
                  ? ` · Faixa pedida: ${props.minWords} a ${props.maxWords}`
                  : ""}
              </p>
              {props.minWords &&
              props.maxWords &&
              (words < props.minWords || words > props.maxWords) ? (
                <p>
                  A cena está fora da extensão sugerida. Você pode ajustar o
                  texto ou enviar assim mesmo.
                </p>
              ) : null}
              <p>Itens ainda não marcados:</p>
              <ul>
                {items
                  .filter((item) => !marked.has(item))
                  .map((item) => (
                    <li key={item}>{item}</li>
                  ))}
              </ul>
              {!items.some((item) => !marked.has(item)) ? (
                <p>Nenhum item pendente.</p>
              ) : null}
              <p>Ao confirmar, esta versão fica congelada para a leitura.</p>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => setReview(false)}
              >
                Voltar a escrever
              </Button>
              <Button disabled={pending || locked} onClick={submit}>
                {pending ? "Enviando…" : "Confirmar envio"}
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
