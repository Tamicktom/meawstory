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

type CompletedVersion = Awaited<
  ReturnType<typeof correctionService.listCompletedVersions>
>[number]

async function completedReading(
  ownedText: OwnedScene,
  requested: number | null
) {
  if (Number.isNaN(requested)) notFound()
  const versions = await correctionService.listCompletedVersions(ownedText.id)
  const latestVersion = versions.at(-1)
  const selected = selectedVersion(versions, requested)
  if (!selected || !latestVersion) notFound()
  if (!hasStructuredReading(selected)) {
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
  const title = exerciseTitle(selected, ownedText)
  const feedback = await loadReadingFeedback(selected.id)
  const path = `/dashboard/texts/${ownedText.id}`
  const links = readingLinks(ownedText, selected, latestVersion.id, path)
  return (
    <StructuredReadingView
      correctionId={selected.id}
      title={sceneTitle(ownedText.title, title)}
      exerciseTitle={title}
      createdAt={selected.createdAt.toISOString()}
      version={selected.version}
      score={selected.score}
      scene={selected.textContent}
      result={selected.structuredResult}
      criteria={selected.rubricCriteria.map((criterion) => ({
        id: criterion.id,
        name: criterion.name,
        maxScore: criterion.maxScore,
        publicDescription: criterion.publicDescription,
      }))}
      feedback={feedback}
      revisionIntent={links.revisionIntent}
      reviseHref={links.reviseHref}
      latestHref={links.latestHref}
      versions={versionLinks(versions, selected.id, latestVersion.id, path)}
    />
  )
}

function selectedVersion(
  versions: CompletedVersion[],
  requested: number | null
) {
  if (requested == null) return versions.at(-1)
  return versions.find((item) => item.version === requested)
}

function hasStructuredReading(
  selected: CompletedVersion
): selected is CompletedVersion & {
  structuredResult: NonNullable<CompletedVersion["structuredResult"]>
  rubricCriteria: NonNullable<CompletedVersion["rubricCriteria"]>
} {
  return Boolean(selected.structuredResult && selected.rubricCriteria)
}

function exerciseTitle(selected: CompletedVersion, ownedText: OwnedScene) {
  return selected.source?.themeTitle ?? ownedText.theme.title
}

function readingLinks(
  ownedText: OwnedScene,
  selected: CompletedVersion,
  latestId: string,
  path: string
) {
  const latest = selected.id === latestId
  return {
    revisionIntent: selected.version > 1 ? selected.revisionIntent : null,
    reviseHref: latest
      ? `/dashboard/exercises/${ownedText.themeId}/write?textId=${ownedText.id}`
      : undefined,
    latestHref: latest ? undefined : path,
  }
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
