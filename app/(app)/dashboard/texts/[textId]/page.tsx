import { ReadingState } from "@/components/reading/reading-state"
//* Libraries imports
import { notFound } from "next/navigation"

//* Components imports
import { FeedbackView } from "@/components/feedback/feedback-view"
import { ReadingGate } from "@/components/reading/reading-gate"

//* Services imports
import { correctionService } from "@/services/correction"
import { textService } from "@/services/text"

//* Local imports
import { requireSession } from "@/lib/session"

type TextFeedbackPageProps = {
  params: Promise<{
    textId: string
  }>
  searchParams: Promise<{
    error?: string | string[]
  }>
}

export default async function TextFeedbackPage(props: TextFeedbackPageProps) {
  const [params, searchParams, session] = await Promise.all([
    props.params,
    props.searchParams,
    requireSession(),
  ])

  const ownedText = await textService.findOwnedText(
    params.textId,
    session.user.id
  )

  if (!ownedText) {
    notFound()
  }

  const latestCorrection = await correctionService.findLatestActiveCorrection(
    ownedText.id
  )

  if (!latestCorrection) {
    return (
      <ReadingGate
        themeId={ownedText.themeId}
        textId={ownedText.id}
        themeTitle={ownedText.theme.title}
        textContent={ownedText.content}
        email={session.user.email}
        emailVerified={session.user.emailVerified}
        verificationLinkFailed={Boolean(searchParams.error)}
      />
    )
  }

  if (latestCorrection.status !== "COMPLETED") {
    return (
      <ReadingState
        textId={ownedText.id}
        themeTitle={ownedText.theme.title}
        textContent={latestCorrection.textContent}
        status={latestCorrection.status}
        createdAt={latestCorrection.createdAt.toISOString()}
      />
    )
  }
  return (
    <FeedbackView
      themeTitle={ownedText.theme.title}
      correction={{
        content: latestCorrection.content,
        score: latestCorrection.score,
        textContent: latestCorrection.textContent,
      }}
    />
  )
}
