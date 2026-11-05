import { textService } from "@/services/text"
import { correctionService } from "@/services/correction"
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

  const textId = (await props.searchParams)?.textId
  let draft
  if (textId) {
    const session = await requireSession()
    draft = await textService.findOwnedText(textId, session.user.id)
    if (!draft || draft.themeId !== params.themeId) notFound()
    if (await correctionService.findLatestActiveCorrection(textId))
      redirect(`/dashboard/texts/${textId}`)
  }
  const parsedDescription = parseMarkdown(thisTheme.description)

  return (
    <div className="grid w-full grid-cols-3 flex-row items-start justify-center gap-2">
      <div className="col-span-1 prose dark:prose-invert">
        <Markdown>{parsedDescription}</Markdown>
      </div>

      <Editor
        themeId={params.themeId}
        textId={draft?.id}
        initialContent={draft?.content}
      />
    </div>
  )
}
