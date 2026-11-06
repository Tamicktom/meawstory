"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BAND_LABEL, type StructuredReading } from "@/lib/reading-contract"
import { formatScore } from "@/lib/format-score"
import { evidenceSegments } from "@/lib/reading-evidence"
import type { ReadingFeedback } from "@/services/reading-feedback"
import { CriterionDisagreement, UsefulnessQuestion } from "./reading-opinion"

export type StructuredReadingProps = {
  correctionId: string
  title: string
  exerciseTitle: string
  createdAt: string
  version: number
  score: string
  scene: string
  result: StructuredReading
  criteria: {
    id: string
    name: string
    maxScore: number
    publicDescription: string
  }[]
  feedback: ReadingFeedback
}

export function StructuredReadingView(props: StructuredReadingProps) {
  const { result } = props
  const [tab, setTab] = useState<"reading" | "scene">("reading")
  const [selection, setSelection] = useState<{
    quote: number
    request: number
  } | null>(null)
  const sceneRef = useRef<HTMLElement>(null)
  const quotes = [
    result.highlight.evidence,
    ...result.criteria.flatMap((criterion) => criterion.evidence),
  ]
  const segments = evidenceSegments(props.scene, quotes)
  useEffect(() => {
    if (!selection) return
    const target = sceneRef.current?.querySelector<HTMLElement>(
      `[data-quote~="${selection.quote}"]`
    )
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: "center", behavior: "instant" })
  }, [selection])
  function locate(quote: number) {
    setTab("scene")
    setSelection((previous) => ({
      quote,
      request: (previous?.request ?? 0) + 1,
    }))
  }
  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-5 p-4 [overflow-wrap:anywhere] md:p-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Leitura · Versão {props.version}
        </p>
        <h1 className="font-heading text-2xl font-medium">{props.title}</h1>
        <p className="text-sm text-muted-foreground">
          Exercício: {props.exerciseTitle} ·{" "}
          <time dateTime={props.createdAt}>
            {new Date(props.createdAt).toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </time>
        </p>
        <p className="text-sm text-muted-foreground">
          Esta leitura de IA serve para treino e não define o valor da sua
          escrita.
        </p>
      </header>
      <div
        role="tablist"
        aria-label="Leitura e cena"
        className="flex gap-2 md:hidden"
      >
        <button
          id="reading-tab"
          role="tab"
          aria-selected={tab === "reading"}
          aria-controls="reading-panel"
          tabIndex={tab === "reading" ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              setTab("scene")
              document.getElementById("scene-tab")?.focus()
            }
          }}
          onClick={() => setTab("reading")}
          className="min-h-11 flex-1 rounded-md border px-3 aria-selected:bg-muted"
        >
          Leitura
        </button>
        <button
          id="scene-tab"
          role="tab"
          aria-selected={tab === "scene"}
          aria-controls="scene-panel"
          tabIndex={tab === "scene" ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              setTab("reading")
              document.getElementById("reading-tab")?.focus()
            }
          }}
          onClick={() => setTab("scene")}
          className="min-h-11 flex-1 rounded-md border px-3 aria-selected:bg-muted"
        >
          Cena
        </button>
      </div>
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        <section
          id="reading-panel"
          aria-label="Leitura da cena"
          className={`min-w-0 space-y-5 ${tab === "reading" ? "" : "hidden md:block"}`}
        >
          <section className="space-y-2">
            <h2 className="font-heading text-lg font-medium">Leitura geral</h2>
            <p className="whitespace-pre-wrap">{result.opening}</p>
          </section>
          <section className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h2 className="font-heading text-lg font-medium">
              Foco da próxima versão
            </h2>
            <p className="whitespace-pre-wrap">{result.revision}</p>
            <button
              type="button"
              disabled
              aria-describedby="revision-unavailable"
              className="min-h-11 rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-50"
            >
              Revisar com esse foco
            </button>
            <p
              id="revision-unavailable"
              className="text-xs text-muted-foreground"
            >
              A criação de uma nova versão estará disponível na próxima etapa.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-heading text-lg font-medium">Ponto forte</h2>
            <p>{result.highlight.description}</p>
            <button
              type="button"
              onClick={() => locate(0)}
              className="min-h-11 border-l-2 pl-3 text-left italic underline decoration-dotted"
            >
              “{result.highlight.evidence}”{" "}
              <span className="text-xs not-italic">Ver na cena</span>
            </button>
          </section>
          <section className="space-y-3" aria-label="Critérios da leitura">
            <h2 className="font-heading text-lg font-medium">Critérios</h2>
            {props.criteria.map((criterion) => {
              const entry = result.criteria.find(
                (item) => item.id === criterion.id
              )
              if (!entry) return null
              const offset =
                1 +
                result.criteria
                  .slice(0, result.criteria.indexOf(entry))
                  .reduce((sum, item) => sum + item.evidence.length, 0)
              return (
                <article
                  key={criterion.id}
                  className="space-y-3 rounded-lg border p-4"
                  aria-label={criterion.name}
                >
                  <div>
                    <h3 className="font-heading font-medium">
                      <button
                        type="button"
                        onClick={() => locate(offset)}
                        className="min-h-11 text-left underline decoration-dotted"
                        aria-label={`Ver trechos de ${criterion.name}`}
                      >
                        {criterion.name}
                      </button>
                    </h3>
                    <p className="font-medium">{BAND_LABEL[entry.band]}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.score.toLocaleString("pt-BR")} de{" "}
                      {criterion.maxScore} pontos
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {criterion.publicDescription}
                  </p>
                  <p>
                    <strong>O que funciona: </strong>
                    {entry.strengths}
                  </p>
                  <p>
                    <strong>O que falta: </strong>
                    {entry.gaps}
                  </p>
                  <div className="space-y-2">
                    {entry.evidence
                      .filter(
                        (quote, index, evidence) =>
                          evidence.indexOf(quote) === index
                      )
                      .map((quote, index) => (
                        <button
                          key={quote}
                          type="button"
                          onClick={() => locate(offset + index)}
                          className="block min-h-11 w-full border-l-2 pl-3 text-left italic underline decoration-dotted"
                        >
                          “{quote}”{" "}
                          <span className="text-xs not-italic">
                            Ver trecho {index + 1} na cena
                          </span>
                        </button>
                      ))}
                  </div>
                  <CriterionDisagreement
                    correctionId={props.correctionId}
                    criterionId={criterion.id}
                    initialReason={
                      props.feedback.disagreements.find(
                        (item) => item.criterionId === criterion.id
                      )?.reason
                    }
                  />
                </article>
              )
            })}
          </section>
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer text-sm">
              Ver pontuação total
            </summary>
            <p className="pt-3 text-sm text-muted-foreground">
              {formatScore(props.score)}
            </p>
          </details>
          <UsefulnessQuestion
            correctionId={props.correctionId}
            initial={props.feedback.usefulness}
          />
        </section>
        <section
          ref={sceneRef}
          id="scene-panel"
          aria-label="Sua cena"
          className={`min-w-0 space-y-3 ${tab === "scene" ? "" : "hidden md:block"}`}
        >
          <h2 className="font-heading text-lg font-medium">Sua cena</h2>
          <p className="text-xs text-muted-foreground">
            Os trechos citados estão destacados. Selecione uma citação na
            leitura para encontrá-la aqui.
          </p>
          <div className="rounded-lg border p-4 leading-relaxed whitespace-pre-wrap">
            {segments.map((segment) =>
              segment.quotes.length ? (
                <mark
                  key={segment.start}
                  tabIndex={-1}
                  data-quote={segment.quotes.join(" ")}
                  className={`scroll-mt-6 rounded-sm text-foreground outline-offset-4 focus:outline-2 ${selection && segment.quotes.includes(selection.quote) ? "bg-amber-300 dark:bg-amber-800" : "bg-amber-100 dark:bg-amber-950"}`}
                >
                  {segment.text}
                </mark>
              ) : (
                <span key={segment.start}>{segment.text}</span>
              )
            )}
          </div>
          <button
            type="button"
            className="min-h-11 underline md:hidden"
            onClick={() => {
              setTab("reading")
              document.getElementById("reading-tab")?.focus()
            }}
          >
            Voltar à leitura
          </button>
        </section>
      </div>
      <Link href="/dashboard/texts" className="inline-block py-3 underline">
        Voltar para Minhas cenas
      </Link>
    </div>
  )
}
