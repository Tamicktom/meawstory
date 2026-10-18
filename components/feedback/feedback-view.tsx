//* Libraries imports
import { parseMarkdown } from "@tanstack/markdown/parser"
import { Markdown } from "@tanstack/markdown/react"

export type FeedbackCorrection = {
  score: string
  content: string
  textContent: string
}

type FeedbackViewProps = {
  themeTitle: string
  correction: FeedbackCorrection | null
}

function formatFeedbackScore(score: string) {
  const value = Number(score)

  if (!Number.isFinite(value)) {
    return score
  }

  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(2)
}

function feedbackScoreLabel(score: string) {
  const formatted = formatFeedbackScore(score)

  if (!Number.isFinite(Number(score))) {
    return formatted
  }

  return `Nota ${formatted} de 1000`
}

function FeedbackView(props: FeedbackViewProps) {
  const correction = props.correction

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">{props.themeTitle}</h1>
      {correction ? (
        <div className="flex flex-col gap-4">
          <p className="font-heading text-lg font-medium">
            {feedbackScoreLabel(correction.score)}
          </p>
          <section className="flex flex-col gap-2">
            <h2 className="font-heading text-sm font-medium">Feedback</h2>
            <div className="prose dark:prose-invert">
              <Markdown>{parseMarkdown(correction.content)}</Markdown>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="font-heading text-sm font-medium">Texto</h2>
            <p className="whitespace-pre-wrap">{correction.textContent}</p>
          </section>
        </div>
      ) : (
        <p>A correção ainda está sendo preparada.</p>
      )}
    </div>
  )
}

export { FeedbackView }
