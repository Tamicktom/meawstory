//* Libraries imports
import { parseMarkdown } from "@tanstack/markdown/parser"
import { Markdown } from "@tanstack/markdown/react"
import Link from "next/link"
import { formatScore } from "@/lib/format-score"

type FeedbackCorrection = {
  score: string
  content: string
  textContent: string
}

type FeedbackViewProps = {
  themeTitle: string
  correction: FeedbackCorrection | null
}

function FeedbackView(props: FeedbackViewProps) {
  const correction = props.correction

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-4 p-4 [overflow-wrap:anywhere]">
      <p className="text-sm text-muted-foreground">Leitura</p>
      <h1 className="font-heading text-lg font-medium">{props.themeTitle}</h1>
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
