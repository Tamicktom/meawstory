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
    versao?: string | string[]
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
  return completedReading(ownedText, requestedVersion(searchParams.versao))
}

type OwnedScene = NonNullable<
  Awaited<ReturnType<typeof textService.findOwnedText>>
>

async function completedReading(
  ownedText: OwnedScene,
  requested: number | null
) {
  if (Number.isNaN(requested)) notFound()
  const versions = await correctionService.listCompletedVersions(ownedText.id)
  const latestVersion = versions.at(-1)
  const selected =
    requested == null
      ? latestVersion
      : versions.find((item) => item.version === requested)
  if (!selected || !latestVersion) notFound()
  if (!selected.structuredResult || !selected.rubricCriteria) {
    return (
      <FeedbackView
        themeTitle={sceneTitle(ownedText.title, ownedText.theme.title)}
        correction={{
          content: selected.content,
          score: selected.score,
          textContent: selected.textContent,
        }}
      />
    )
  }
  const exerciseTitle = selected.source?.themeTitle ?? ownedText.theme.title
  const feedback = await loadReadingFeedback(selected.id)
  const path = `/dashboard/texts/${ownedText.id}`
  const latest = selected.id === latestVersion.id
  return (
    <StructuredReadingView
      correctionId={selected.id}
      title={sceneTitle(ownedText.title, exerciseTitle)}
      exerciseTitle={exerciseTitle}
      createdAt={selected.createdAt.toISOString()}
      version={selected.version}
      score={selected.score}
      scene={selected.textContent}
      result={selected.structuredResult}
      criteria={selected.rubricCriteria.map(
        ({ id, name, maxScore, publicDescription }) => ({
          id,
          name,
          maxScore,
          publicDescription,
        })
      )}
      feedback={feedback}
      revisionIntent={selected.version > 1 ? selected.revisionIntent : null}
      reviseHref={
        latest
          ? `/dashboard/exercises/${ownedText.themeId}/write?textId=${ownedText.id}`
          : undefined
      }
      latestHref={latest ? undefined : path}
      versions={versionLinks(versions, selected.id, latestVersion.id, path)}
    />
  )
}

function versionLinks(
  versions: { id: string; version: number }[],
  selectedId: string,
  latestId: string,
  path: string
) {
  if (versions.length < 2) return undefined
  return versions.map((item) => ({
    version: item.version,
    current: item.id === selectedId,
    href: item.id === latestId ? path : `${path}?versao=${item.version}`,
  }))
}

function requestedVersion(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw == null || raw === "") return null
  if (!/^[1-9]\d*$/.test(raw)) return Number.NaN
  return Number(raw)
}
