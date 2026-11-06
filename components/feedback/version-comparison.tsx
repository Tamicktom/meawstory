"use client"

import { useState } from "react"
import Link from "next/link"

//* Components imports
import { CloseSceneButton } from "@/components/scenes/close-scene-button"

//* Local imports
import { diffTexts, type DiffSegment } from "@/lib/text-diff"
import { BAND_LABEL } from "@/lib/reading-contract"
import type {
  ComparedCriterion,
  CriterionMovement,
  VersionComparison,
} from "@/lib/version-comparison"

const MOVEMENT_LABEL: Record<CriterionMovement, string> = {
  improved: "Subiu",
  regressed: "Desceu",
  unchanged: "Manteve",
}

export type VersionComparisonProps = {
  comparison: VersionComparison
  criteria: { id: string; name: string; maxScore: number }[]
  previousScene: string
  nextScene: string
  revisionIntent?: string | null
  reviseHref?: string
  closed?: boolean
  textId?: string
}

export function VersionComparisonView(props: VersionComparisonProps) {
  const [tab, setTab] = useState<"previous" | "current">("current")
  const diff = diffTexts(props.previousScene, props.nextScene)
  const names = new Map(
    props.criteria.map((criterion) => [criterion.id, criterion])
  )
  const regressions = props.comparison.textUnchanged
    ? []
    : props.comparison.criteria.filter(
        (criterion) => criterion.movement === "regressed"
      )
  const previousTotal = props.comparison.criteria.reduce(
    (sum, criterion) => sum + criterion.previousScore,
    0
  )
  const nextTotal = props.comparison.criteria.reduce(
    (sum, criterion) => sum + criterion.score,
    0
  )

  return (
    <section
      aria-label="Comparação com a versão anterior"
      className="flex flex-col gap-5 rounded-lg border p-4"
    >
      <h2 className="font-heading text-lg font-medium">
        Comparação com a versão anterior
      </h2>
      {props.revisionIntent ? (
        <section
          aria-label="Contexto da revisão"
          className="flex flex-col gap-2"
        >
          <h3 className="font-heading font-medium">O que você tentou mudar</h3>
          <p className="whitespace-pre-wrap">{props.revisionIntent}</p>
        </section>
      ) : null}
      <FocusResult comparison={props.comparison} />
      {regressions.length > 0 ? (
        <section
          aria-label="O que piorou"
          className="flex flex-col gap-3 rounded-lg border border-red-700/40 bg-red-50 p-4 dark:bg-red-950/40"
        >
          <h3 className="font-heading font-medium">O que piorou</h3>
          <p>
            Estes critérios desceram, mesmo que outro critério ou a pontuação
            total tenha subido.
          </p>
          <ul className="flex flex-col gap-3">
            {regressions.map((criterion) => (
              <li key={criterion.id}>
                <CriterionChange
                  criterion={criterion}
                  name={names.get(criterion.id)?.name ?? criterion.id}
                  maxScore={names.get(criterion.id)?.maxScore}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {props.comparison.criteria.length > 0 ? (
        <section
          aria-label="Mudança por critério"
          className="flex flex-col gap-3"
        >
          <h3 className="font-heading font-medium">Critérios</h3>
          {props.comparison.criteria.map((criterion) => (
            <article
              key={criterion.id}
              aria-label={names.get(criterion.id)?.name ?? criterion.id}
              className="rounded-lg border p-4"
            >
              <CriterionChange
                criterion={criterion}
                name={names.get(criterion.id)?.name ?? criterion.id}
                maxScore={names.get(criterion.id)?.maxScore}
                textUnchanged={props.comparison.textUnchanged}
              />
            </article>
          ))}
          <p className="text-sm text-muted-foreground">
            A pontuação total foi de {points(previousTotal)} para{" "}
            {points(nextTotal)}.
          </p>
        </section>
      ) : null}
      <section aria-label="Diferença no texto" className="flex flex-col gap-3">
        <h3 className="font-heading font-medium">O que mudou no texto</h3>
        <div
          role="tablist"
          aria-label="Versões do texto"
          className="flex gap-2 md:hidden"
        >
          <button
            id="comparison-previous-tab"
            type="button"
            role="tab"
            aria-selected={tab === "previous"}
            aria-controls="comparison-previous-panel"
            tabIndex={tab === "previous" ? 0 : -1}
            onClick={() => setTab("previous")}
            className="min-h-11 flex-1 rounded-md border px-3 aria-selected:bg-muted"
          >
            Versão anterior
          </button>
          <button
            id="comparison-current-tab"
            type="button"
            role="tab"
            aria-selected={tab === "current"}
            aria-controls="comparison-current-panel"
            tabIndex={tab === "current" ? 0 : -1}
            onClick={() => setTab("current")}
            className="min-h-11 flex-1 rounded-md border px-3 aria-selected:bg-muted"
          >
            Esta versão
          </button>
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <TextColumn
            id="comparison-previous-panel"
            label="Versão anterior"
            segments={diff}
            side="previous"
            hiddenOnMobile={tab !== "previous"}
          />
          <TextColumn
            id="comparison-current-panel"
            label="Esta versão"
            segments={diff}
            side="current"
            hiddenOnMobile={tab !== "current"}
          />
        </div>
      </section>
      {props.closed ? (
        <p>Reabra a cena para revisar.</p>
      ) : props.reviseHref ? (
        <Link
          id="revise-again"
          href={props.reviseHref}
          className="inline-flex min-h-11 w-fit items-center rounded-md bg-primary px-4 text-primary-foreground"
        >
          Revisar novamente
        </Link>
      ) : null}
      {props.textId ? (
        <CloseSceneButton
          id={
            props.closed ? "reopen-scene-comparison" : "close-scene-comparison"
          }
          textId={props.textId}
          closed={Boolean(props.closed)}
        />
      ) : null}
    </section>
  )
}

function FocusResult(props: { comparison: VersionComparison }) {
  const focus = props.comparison.focus
  if (focus.status === "unchanged")
    return (
      <p>
        O texto desta versão é igual ao da anterior. A diferença de pontuação
        não conta como melhora.
      </p>
    )
  if (focus.status === "unavailable")
    return (
      <p>
        Não foi possível confirmar se o foco foi atendido. As mudanças de faixa
        abaixo vêm das duas leituras.
      </p>
    )

  return (
    <section aria-label="Foco da revisão" className="flex flex-col gap-2">
      <h3 className="font-heading font-medium">
        {focus.status === "met"
          ? "O foco foi atendido"
          : "O foco não foi atendido"}
      </h3>
      <p>{focus.answer}</p>
      <blockquote className="border-l-2 py-1 pl-3 italic">
        “{focus.evidence}”
      </blockquote>
    </section>
  )
}

function CriterionChange(props: {
  criterion: ComparedCriterion
  name: string
  maxScore?: number
  textUnchanged?: boolean
}) {
  const scoresDiffer =
    props.criterion.previousScore !== props.criterion.score ||
    props.criterion.previousBand !== props.criterion.band

  return (
    <div className="flex flex-col gap-1">
      <h4 className="font-medium">{props.name}</h4>
      <p>
        {BAND_LABEL[props.criterion.previousBand]} (
        {points(props.criterion.previousScore)}
        {props.maxScore ? ` de ${points(props.maxScore)}` : ""}) →{" "}
        {BAND_LABEL[props.criterion.band]} ({points(props.criterion.score)}
        {props.maxScore ? ` de ${points(props.maxScore)}` : ""})
      </p>
      <p>{MOVEMENT_LABEL[props.criterion.movement]}</p>
      {props.textUnchanged && scoresDiffer ? (
        <p>O texto não mudou, então esta diferença não conta como melhora.</p>
      ) : null}
    </div>
  )
}

function TextColumn(props: {
  id: string
  label: string
  segments: DiffSegment[]
  side: "previous" | "current"
  hiddenOnMobile: boolean
}) {
  const visible = props.segments.filter((segment) =>
    props.side === "previous"
      ? segment.kind !== "added"
      : segment.kind !== "removed"
  )

  return (
    <section
      id={props.id}
      aria-label={props.label}
      className={`min-w-0 flex-col gap-2 ${props.hiddenOnMobile ? "hidden md:flex" : "flex"}`}
    >
      <h4 className="hidden font-medium md:block">{props.label}</h4>
      <p className="rounded-lg border p-4 leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap">
        {visible.map((segment, index) => (
          <span
            key={`${segment.kind}-${index}`}
            className={
              segment.kind === "removed"
                ? "bg-red-100 line-through dark:bg-red-950"
                : segment.kind === "added"
                  ? "bg-emerald-100 dark:bg-emerald-950"
                  : undefined
            }
          >
            {segment.text}
          </span>
        ))}
      </p>
    </section>
  )
}

function points(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
}
