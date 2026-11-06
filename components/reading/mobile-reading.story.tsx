import { FeedbackView } from "@/components/feedback/feedback-view"
import { ReadingState } from "./reading-state"
import { ReadingGate } from "./reading-gate"

const longWord = "palavra".repeat(90)
const themeTitle = `Uma cena ${longWord}`
const textContent = `Primeiro parágrafo.\n\n${longWord}\n\nFim da cena enviada.`

export function Completed() {
  return (
    <FeedbackView
      themeTitle={themeTitle}
      textId="text-1"
      correction={{
        score: "640.5",
        textContent,
        content: `## Leitura\n\n${longWord}\n\n\`\`\`\n${longWord}\n\`\`\`\n\n| Critério | Comentário |\n| --- | --- |\n| Cena | ${longWord} |\n\nFim da leitura.`,
      }}
    />
  )
}
export function Pending() {
  return (
    <ReadingState
      textId="text-1"
      themeTitle={themeTitle}
      textContent={textContent}
      status="PENDING"
      createdAt={new Date().toISOString()}
    />
  )
}
export function Failed() {
  return (
    <ReadingState
      textId="text-1"
      themeTitle={themeTitle}
      textContent={textContent}
      status="FAILED"
      createdAt={new Date().toISOString()}
    />
  )
}
export function Draft() {
  return (
    <ReadingGate
      themeId="theme-1"
      textId="text-1"
      themeTitle={themeTitle}
      textContent={textContent}
      email="pessoa@example.com"
      emailVerified
      verificationLinkFailed={false}
    />
  )
}
