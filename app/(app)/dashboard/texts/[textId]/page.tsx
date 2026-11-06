import { StructuredReadingView } from "@/components/feedback/structured-reading"
import { loadReadingFeedback } from "@/services/reading-feedback"
import { sceneTitle } from "@/lib/scene-title"
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
        themeTitle={sceneTitle(ownedText.title, ownedText.theme.title)}
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
        themeTitle={sceneTitle(ownedText.title, ownedText.theme.title)}
        textContent={latestCorrection.textContent}
        status={latestCorrection.status}
        createdAt={latestCorrection.createdAt.toISOString()}
      />
    )
  }
  if (latestCorrection.structuredResult && latestCorrection.rubricCriteria) {
    const [version, feedback] = await Promise.all([
      correctionService.completedVersion(ownedText.id, latestCorrection.id),
      loadReadingFeedback(latestCorrection.id),
    ])
    return (
      <StructuredReadingView
        correctionId={latestCorrection.id}
        title={sceneTitle(
          ownedText.title,
          latestCorrection.source?.themeTitle ?? ownedText.theme.title
        )}
        exerciseTitle={
          latestCorrection.source?.themeTitle ?? ownedText.theme.title
        }
        createdAt={latestCorrection.createdAt.toISOString()}
        version={version}
        score={latestCorrection.score}
        scene={latestCorrection.textContent}
        result={latestCorrection.structuredResult}
        criteria={latestCorrection.rubricCriteria.map(
          ({ id, name, maxScore, publicDescription }) => ({
            id,
            name,
            maxScore,
            publicDescription,
          })
        )}
        feedback={feedback}
      />
    )
  }
  return (
    <FeedbackView
      themeTitle={sceneTitle(ownedText.title, ownedText.theme.title)}
      correction={{
        content: latestCorrection.content,
        score: latestCorrection.score,
        textContent: latestCorrection.textContent,
      }}
    />
  )
}
