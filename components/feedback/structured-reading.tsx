"use client"

//* Libraries imports
import { useEffect, useRef, useState, type RefObject } from "react"
import Link from "next/link"

//* Components imports
import { CloseSceneButton } from "@/components/scenes/close-scene-button"
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button"

//* Local imports
import { BAND_LABEL, type StructuredReading } from "@/lib/reading-contract"
import { formatScore } from "@/lib/format-score"
import { evidenceSegments } from "@/lib/reading-evidence"
import type { VersionComparison } from "@/lib/version-comparison"
import type { ReadingFeedback } from "@/services/reading-feedback"
import { CriterionDisagreement, UsefulnessQuestion } from "./reading-opinion"
import { VersionComparisonView } from "./version-comparison"

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
  reviseHref?: string
  latestHref?: string
  revisionIntent?: string | null
  versions?: { version: number; href: string; current: boolean }[]
  comparison?: VersionComparison
  previousScene?: string
  textId?: string
  closed?: boolean
}

type ReadingTab = "reading" | "scene"
type QuoteSelection = { quote: number; request: number }
type SceneSegment = ReturnType<typeof evidenceSegments>[number]
type ReadingCriterion = StructuredReadingProps["criteria"][number]
type ReadingEntry = StructuredReading["criteria"][number]

export function StructuredReadingView(props: StructuredReadingProps) {
  const [tab, setTab] = useState<ReadingTab>("reading")
  const [selection, setSelection] = useState<QuoteSelection | null>(null)
  const sceneRef = useRef<HTMLElement>(null)
  const quotes = [
    props.result.highlight.evidence,
    ...props.result.criteria.flatMap((criterion) => criterion.evidence),
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
      <ReadingHeader
        title={props.title}
        exerciseTitle={props.exerciseTitle}
        createdAt={props.createdAt}
        version={props.version}
        versions={props.versions}
        textId={props.textId}
        closed={props.closed}
      />
      {props.comparison && props.previousScene ? (
        <VersionComparisonView
          comparison={props.comparison}
          criteria={props.criteria}
          previousScene={props.previousScene}
          nextScene={props.scene}
          revisionIntent={props.revisionIntent}
          reviseHref={props.closed ? undefined : props.reviseHref}
          closed={props.closed}
          textId={props.textId}
        />
      ) : null}
      <ReadingTabs tab={tab} onChange={setTab} />
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        <ReadingColumn
          visible={tab === "reading"}
          correctionId={props.correctionId}
          version={props.version}
          score={props.score}
          result={props.result}
          criteria={props.criteria}
          feedback={props.feedback}
          reviseHref={props.reviseHref}
          latestHref={props.latestHref}
          revisionIntent={props.revisionIntent}
          compared={Boolean(props.comparison)}
          closed={props.closed}
          onLocate={locate}
        />
        <SceneColumn
          sceneRef={sceneRef}
          visible={tab === "scene"}
          segments={segments}
          selection={selection}
          onBack={() => {
            setTab("reading")
            document.getElementById("reading-tab")?.focus()
          }}
        />
      </div>
      <Link href="/dashboard/texts" className="inline-block py-3 underline">
        Voltar para Minhas cenas
      </Link>
    </div>
  )
}

function ReadingHeader(props: {
  title: string
  exerciseTitle: string
  createdAt: string
  version: number
  versions: StructuredReadingProps["versions"]
  textId?: string
  closed?: boolean
}) {
  return (
    <header className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-muted-foreground">
            Leitura · Versão {props.version}
          </p>
          <h1 className="font-heading text-2xl font-medium">{props.title}</h1>
        </div>
        {props.textId ? (
          <div className="flex min-w-0 flex-col gap-2">
            <CloseSceneButton
              id={props.closed ? "reopen-scene" : "close-scene"}
              textId={props.textId}
              closed={Boolean(props.closed)}
            />
            <DeleteSceneButton
              id="delete-scene"
              textId={props.textId}
              redirectTo="/dashboard/texts"
            />
          </div>
        ) : null}
      </div>
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
      {props.versions && props.versions.length > 1 ? (
        <nav aria-label="Versões da cena" className="flex flex-wrap gap-2">
          {props.versions.map((item) => (
            <Link
              key={item.version}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-md border px-3 py-2 underline"
            >
              Versão {item.version}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  )
}

function ReadingTabs(props: {
  tab: ReadingTab
  onChange: (tab: ReadingTab) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Leitura e cena"
      className="flex gap-2 md:hidden"
    >
      <button
        id="reading-tab"
        type="button"
        role="tab"
        aria-selected={props.tab === "reading"}
        aria-controls="reading-panel"
        tabIndex={props.tab === "reading" ? 0 : -1}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            props.onChange("scene")
            document.getElementById("scene-tab")?.focus()
          }
        }}
        onClick={() => props.onChange("reading")}
        className="min-h-11 flex-1 rounded-md border px-3 aria-selected:bg-muted"
      >
        Leitura
      </button>
      <button
        id="scene-tab"
        type="button"
        role="tab"
        aria-selected={props.tab === "scene"}
        aria-controls="scene-panel"
        tabIndex={props.tab === "scene" ? 0 : -1}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            props.onChange("reading")
            document.getElementById("reading-tab")?.focus()
          }
        }}
        onClick={() => props.onChange("scene")}
        className="min-h-11 flex-1 rounded-md border px-3 aria-selected:bg-muted"
      >
        Cena
      </button>
    </div>
  )
}

function ReadingColumn(props: {
  visible: boolean
  correctionId: string
  version: number
  score: string
  result: StructuredReading
  criteria: ReadingCriterion[]
  feedback: ReadingFeedback
  reviseHref?: string
  latestHref?: string
  revisionIntent?: string | null
  compared: boolean
  closed?: boolean
  onLocate: (quote: number) => void
}) {
  return (
    <section
      id="reading-panel"
      aria-label="Leitura da cena"
      className={`min-w-0 space-y-5 ${props.visible ? "" : "hidden md:block"}`}
    >
      {props.version > 1 && props.revisionIntent && !props.compared ? (
        <section
          aria-label="Contexto da revisão"
          className="flex flex-col gap-2"
        >
          <h2 className="font-heading text-lg font-medium">
            O que você tentou mudar
          </h2>
          <p className="whitespace-pre-wrap">{props.revisionIntent}</p>
        </section>
      ) : null}
      <section className="space-y-2">
        <h2 className="font-heading text-lg font-medium">Leitura geral</h2>
        <p className="whitespace-pre-wrap">{props.result.opening}</p>
      </section>
      <section className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <h2 className="font-heading text-lg font-medium">
          Foco da próxima versão
        </h2>
        <p className="whitespace-pre-wrap">{props.result.revision}</p>
        <RevisionLink
          reviseHref={props.closed ? undefined : props.reviseHref}
          latestHref={props.latestHref}
          closed={props.closed}
        />
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-lg font-medium">Ponto forte</h2>
        <p>{props.result.highlight.description}</p>
        <button
          id="reading-highlight-quote"
          type="button"
          onClick={() => props.onLocate(0)}
          className="min-h-11 border-l-2 pl-3 text-left italic underline decoration-dotted"
        >
          “{props.result.highlight.evidence}”{" "}
          <span className="text-xs not-italic">Ver na cena</span>
        </button>
      </section>
      <section className="space-y-3" aria-label="Critérios da leitura">
        <h2 className="font-heading text-lg font-medium">Critérios</h2>
        {props.criteria.map((criterion) => {
          const entry = props.result.criteria.find(
            (item) => item.id === criterion.id
          )
          if (!entry) return null
          return (
            <CriterionReading
              key={criterion.id}
              correctionId={props.correctionId}
              criterion={criterion}
              entry={entry}
              offset={quoteOffset(props.result.criteria, entry)}
              disagreement={
                props.feedback.disagreements.find(
                  (item) => item.criterionId === criterion.id
                )?.reason
              }
              onLocate={props.onLocate}
            />
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
  )
}

function RevisionLink(props: {
  reviseHref?: string
  latestHref?: string
  closed?: boolean
}) {
  if (props.closed) return <p>Reabra a cena para revisar.</p>
  if (props.reviseHref)
    return (
      <Link
        id="revise-with-focus"
        href={props.reviseHref}
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-primary-foreground"
      >
        Revisar com esse foco
      </Link>
    )
  if (!props.latestHref) return null

  return (
    <p>
      A nova versão parte da leitura mais recente.{" "}
      <Link
        id="open-latest-version"
        href={props.latestHref}
        className="underline"
      >
        Abrir a versão mais recente
      </Link>
    </p>
  )
}

function CriterionReading(props: {
  correctionId: string
  criterion: ReadingCriterion
  entry: ReadingEntry
  offset: number
  disagreement?: string
  onLocate: (quote: number) => void
}) {
  const quotes = props.entry.evidence.filter(
    (quote, index, evidence) => evidence.indexOf(quote) === index
  )

  return (
    <article
      className="space-y-3 rounded-lg border p-4"
      aria-label={props.criterion.name}
    >
      <div>
        <h3 className="font-heading font-medium">
          <button
            id={`reading-criterion-${props.criterion.id}`}
            type="button"
            onClick={() => props.onLocate(props.offset)}
            className="min-h-11 text-left underline decoration-dotted"
            aria-label={`Ver trechos de ${props.criterion.name}`}
          >
            {props.criterion.name}
          </button>
        </h3>
        <p className="font-medium">{BAND_LABEL[props.entry.band]}</p>
        <p className="text-xs text-muted-foreground">
          {props.entry.score.toLocaleString("pt-BR")} de{" "}
          {props.criterion.maxScore} pontos
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {props.criterion.publicDescription}
      </p>
      <p>
        <strong>O que funciona: </strong>
        {props.entry.strengths}
      </p>
      <p>
        <strong>O que falta: </strong>
        {props.entry.gaps}
      </p>
      <div className="space-y-2">
        {quotes.map((quote, index) => (
          <button
            id={`reading-quote-${props.criterion.id}-${index}`}
            key={quote}
            type="button"
            onClick={() => props.onLocate(props.offset + index)}
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
        criterionId={props.criterion.id}
        initialReason={props.disagreement}
      />
    </article>
  )
}

function SceneColumn(props: {
  sceneRef: RefObject<HTMLElement | null>
  visible: boolean
  segments: SceneSegment[]
  selection: QuoteSelection | null
  onBack: () => void
}) {
  return (
    <section
      ref={props.sceneRef}
      id="scene-panel"
      aria-label="Sua cena"
      className={`min-w-0 space-y-3 ${props.visible ? "" : "hidden md:block"}`}
    >
      <h2 className="font-heading text-lg font-medium">Sua cena</h2>
      <p className="text-xs text-muted-foreground">
        Os trechos citados estão destacados. Selecione uma citação na leitura
        para encontrá-la aqui.
      </p>
      <div className="rounded-lg border p-4 leading-relaxed whitespace-pre-wrap">
        {props.segments.map((segment) => (
          <SceneMark
            key={segment.start}
            segment={segment}
            selected={
              props.selection?.quote !== undefined &&
              segment.quotes.includes(props.selection.quote)
            }
          />
        ))}
      </div>
      <button
        id="reading-back-to-reading"
        type="button"
        className="min-h-11 underline md:hidden"
        onClick={props.onBack}
      >
        Voltar à leitura
      </button>
    </section>
  )
}

function SceneMark(props: { segment: SceneSegment; selected: boolean }) {
  if (!props.segment.quotes.length) return <span>{props.segment.text}</span>

  return (
    <mark
      tabIndex={-1}
      data-quote={props.segment.quotes.join(" ")}
      className={`scroll-mt-6 rounded-sm text-foreground outline-offset-4 focus:outline-2 ${props.selected ? "bg-amber-300 dark:bg-amber-800" : "bg-amber-100 dark:bg-amber-950"}`}
    >
      {props.segment.text}
    </mark>
  )
}

function quoteOffset(
  criteria: StructuredReading["criteria"],
  entry: ReadingEntry
) {
  return (
    1 +
    criteria
      .slice(0, criteria.indexOf(entry))
      .reduce((sum, item) => sum + item.evidence.length, 0)
  )
}
