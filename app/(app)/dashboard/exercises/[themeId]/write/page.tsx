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

  const draft = await findEditableDraft(
    params.themeId,
    (await props.searchParams)?.textId
  )
  const parsedDescription = parseMarkdown(thisTheme.description)

  return (
    <div className="flex w-full max-w-6xl min-w-0 flex-col gap-6 p-4">
      <header className="flex flex-col gap-2 [overflow-wrap:anywhere]">
        <p className="text-sm text-muted-foreground">Escrita</p>
        <h1 className="font-heading text-2xl font-medium">{thisTheme.title}</h1>
        <a
          href="#exercise-information"
          className="w-fit py-2 underline lg:hidden"
        >
          Consultar exercício
        </a>
      </header>
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside
          id="exercise-information"
          className="order-2 min-w-0 scroll-mt-4 [overflow-wrap:anywhere] lg:order-1"
          aria-label="Informações do exercício"
        >
          <h2 className="mb-3 font-heading text-lg font-medium">Exercício</h2>
          <div className="prose max-w-none min-w-0 dark:prose-invert">
            <Markdown>{parsedDescription}</Markdown>
          </div>
        </aside>
        <Editor
          themeId={params.themeId}
          minWords={thisTheme.minWords ?? undefined}
          maxWords={thisTheme.maxWords ?? undefined}
          textId={draft?.id}
          initialContent={draft?.content}
        />
      </div>
    </div>
  )
}

async function findEditableDraft(themeId: string, textId?: string) {
  if (!textId) return
  const session = await requireSession()
  const draft = await textService.findOwnedText(textId, session.user.id)
  if (!draft || draft.themeId !== themeId) notFound()
  if (await correctionService.findLatestActiveCorrection(textId))
    redirect(`/dashboard/texts/${textId}`)
  return draft
}
