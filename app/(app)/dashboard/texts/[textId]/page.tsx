//* Libraries imports
import { headers } from "next/headers"
import { notFound } from "next/navigation"

//* Components imports
import { FeedbackView } from "@/components/feedback/feedback-view"

//* Services imports
import { correctionService } from "@/services/correction"
import { textService } from "@/services/text"

//* Local imports
import { auth } from "@/lib/auth"

type TextFeedbackPageProps = {
  params: Promise<{
    textId: string
  }>
}

export default async function TextFeedbackPage(props: TextFeedbackPageProps) {
  const params = await props.params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    notFound()
  }

  const ownedText = await textService.findOwnedText(params.textId, session.user.id)

  if (!ownedText) {
    notFound()
  }

  const latestCorrection = await correctionService.findLatestActiveCorrection(ownedText.id)

  return (
    <FeedbackView
      themeTitle={ownedText.theme.title}
      correction={
        latestCorrection
          ? {
            content: latestCorrection.content,
            score: latestCorrection.score,
            textContent: latestCorrection.textContent,
          }
          : null
      }
    />
  )
}
