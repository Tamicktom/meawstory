//* Libraries imports
import { parseMarkdown } from "@tanstack/markdown/parser"
import { Markdown } from "@tanstack/markdown/react"
import Link from "next/link"

//* Components imports
import { CloseSceneButton } from "@/components/scenes/close-scene-button"
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button"

//* Local imports
import { formatScore } from "@/lib/format-score"

type FeedbackCorrection = {
  score: string
  content: string
  textContent: string
}

type FeedbackViewProps = {
  themeTitle: string
  textId?: string
  closed?: boolean
  correction: FeedbackCorrection | null
}

function FeedbackView(props: FeedbackViewProps) {
  const correction = props.correction

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-4 p-4 [overflow-wrap:anywhere]">
      <p className="text-sm text-muted-foreground">Leitura</p>
      {correction ? (
        <p className="text-sm text-muted-foreground">
          Leitura no formato original. Esta avaliação histórica não possui dados
          estruturados por critério.
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Esta leitura de IA serve para treino e não define o valor da sua
        escrita.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="min-w-0 font-heading text-lg font-medium">
          {props.themeTitle}
        </h1>
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
      {correction ? (
        <div className="flex flex-col gap-4">
          <p className="font-heading text-lg font-medium">
            {formatScore(correction.score)}
          </p>
          <section className="flex flex-col gap-2">
            <h2 className="font-heading text-sm font-medium">
              Leitura da cena
            </h2>
            <div className="prose max-w-none min-w-0 dark:prose-invert">
              <Markdown>{parseMarkdown(correction.content)}</Markdown>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="font-heading text-sm font-medium">Sua cena</h2>
            <p className="leading-relaxed whitespace-pre-wrap">
              {correction.textContent}
            </p>
          </section>
        </div>
      ) : (
        <p role="status">A leitura ainda está sendo preparada.</p>
      )}
      <Link href="/dashboard/texts" className="w-fit py-3 underline">
        Voltar para Minhas cenas
      </Link>
    </div>
  )
}

export { FeedbackView }
