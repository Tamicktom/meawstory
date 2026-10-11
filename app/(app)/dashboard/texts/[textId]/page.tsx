//* Libraries imports
import { headers } from "next/headers"
import { notFound } from "next/navigation"

//* Components imports
import { FeedbackView } from "@/components/feedback/feedback-view"

//* Local imports
import { db } from "@/database"
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

  const ownedText = await db.query.text.findFirst({
    columns: {
      id: true,
    },
    where: {
      id: params.textId,
      userId: session.user.id,
      deletedAt: {
        isNull: true,
      },
    },
    with: {
      theme: {
        columns: {
          title: true,
        },
      },
    },
  })

  if (!ownedText) {
    notFound()
  }

  const latestCorrection = await db.query.correction.findFirst({
    columns: {
      content: true,
      score: true,
      textContent: true,
    },
    where: {
      textId: ownedText.id,
      deletedAt: {
        isNull: true,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

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
