import { textService } from "@/services/text"
import { correctionService } from "@/services/correction"
import { canReviseReading } from "@/services/reading"
import { citedExcerpts } from "@/lib/reading-evidence"
import { requireSession } from "@/lib/session"
//* Libraries imports
import { notFound, redirect } from "next/navigation"
import { parseMarkdown } from "@tanstack/markdown/parser"
import { Markdown } from "@tanstack/markdown/react"

//* Services imports
import { themeService } from "@/services/theme"

//* Component imports
import { Editor } from "./_components/editor"

type WritePageProps = {
  searchParams?: Promise<{ textId?: string }>
  params: Promise<{
    themeId: string
  }>
}

export default async function WritePage(props: WritePageProps) {
  const params = await props.params

  const thisTheme = await themeService.findThemeById(params.themeId)

  if (!thisTheme) {
    notFound()
  }

  const editable = await findEditableDraft(
    params.themeId,
    (await props.searchParams)?.textId
  )
  const parsedDescription = editable.revision
    ? null
    : parseMarkdown(thisTheme.description)

  return (
    <div className="flex w-full max-w-6xl min-w-0 flex-col gap-6 p-4">
      <header className="flex flex-col gap-2 [overflow-wrap:anywhere]">
        <p className="text-sm text-muted-foreground">
          {editable.revision ? "Revisão" : "Escrita"}
        </p>
        <h1 className="font-heading text-2xl font-medium">{thisTheme.title}</h1>
        <a
          href="#exercise-information"
          className="w-fit py-2 underline lg:hidden"
        >
          {editable.revision ? "Consultar o foco" : "Consultar exercício"}
        </a>
      </header>
      <div className="min-w-0">
        <Editor
          themeId={params.themeId}
          minWords={thisTheme.minWords ?? undefined}
          maxWords={thisTheme.maxWords ?? undefined}
          {...draftEditorProps(editable.draft)}
          revision={editable.revision}
          checklistItems={thisTheme.briefing?.mustInclude}
          briefing={
            parsedDescription ? (
              <Markdown>{parsedDescription}</Markdown>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}

async function findEditableDraft(themeId: string, textId?: string) {
  const session = await requireSession()
  if (!textId) {
    const draft = await textService.findDraftForTheme(session.user.id, themeId)
    return { draft: draft ?? undefined, revision: undefined }
  }
  const draft = await textService.findOwnedText(textId, session.user.id)
  if (!draft || draft.themeId !== themeId) notFound()
  const latest = await correctionService.findLatestActiveCorrection(textId)
  if (latest && !canReviseReading(latest))
    redirect(`/dashboard/texts/${textId}`)
  if (!latest || !latest.structuredResult || !latest.rubricCriteria)
    return { draft, revision: undefined }
  const version =
    Number(await correctionService.completedVersion(textId, latest.id)) + 1
  return {
    draft,
    revision: {
      version,
      focus: latest.structuredResult.revision,
      quotes: citedExcerpts(latest.structuredResult, latest.rubricCriteria),
      readingHref: `/dashboard/texts/${textId}`,
    },
  }
}

function draftEditorProps(
  draft: Awaited<ReturnType<typeof findEditableDraft>>["draft"]
) {
  return {
    textId: draft?.id,
    initialContent: draft?.content,
    initialTitle: draft?.title,
    initialChecklist: draft?.checklist,
    initialIntent: draft?.revisionIntent ?? "",
  }
}
