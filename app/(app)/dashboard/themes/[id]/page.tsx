//* Libraries imports
import { notFound } from "next/navigation"
import Link from "next/link"
import { parseMarkdown } from "@tanstack/markdown/parser"
import { Markdown } from "@tanstack/markdown/react"

//* Services imports
import { themeService } from "@/services/theme"

//* Style imports
import { buttonVariants } from "@/components/ui/button/button-variants"

type WritePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function WritePage(props: WritePageProps) {
  const params = await props.params

  const thisTheme = await themeService.findThemeById(params.id)

  if (!thisTheme) {
    notFound()
  }

  const parsedDescription = parseMarkdown(thisTheme.description)

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-6 p-4 [overflow-wrap:anywhere]">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Exercício</p>
        <h1 className="font-heading text-2xl font-medium">{thisTheme.title}</h1>
      </header>

      <div className="prose max-w-none min-w-0 dark:prose-invert">
        <Markdown>{parsedDescription}</Markdown>
      </div>

      <Link
        href={`/dashboard/exercises/${params.id}/write`}
        className={buttonVariants({
          size: "lg",
          className: "min-h-11 w-full sm:w-fit",
        })}
      >
        Começar a escrever
      </Link>
    </div>
  )
}
