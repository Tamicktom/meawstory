//* Libraries imports
import Link from "next/link"

//* Components imports
import { DeletedSceneNotice } from "@/components/scenes/deleted-scene-notice"
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button"
import { buttonVariants } from "@/components/ui/button/button-variants"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

//* Services imports
import { textService, type OwnedTextListItem } from "@/services/text"

//* Local imports
import { requireSession } from "@/lib/session"
import { formatScore } from "@/lib/format-score"

type TextHistoryCardProps = {
  text: OwnedTextListItem
}

const textCreatedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "America/Sao_Paulo",
})

function formatTextCreatedAt(createdAt: Date) {
  return textCreatedAtFormatter.format(createdAt)
}

function textCorrectionLabel(text: OwnedTextListItem) {
  const correction = text.correction

  if (!correction) {
    return "Rascunho salvo"
  }

  if (correction.status === "FAILED") {
    return "Leitura com falha"
  }

  if (correction.status === "COMPLETED" && correction.score) {
    return formatScore(correction.score)
  }

  return correction.status === "PENDING"
    ? "Leitura aguardando"
    : "Leitura em andamento"
}

function TextHistoryCard(props: TextHistoryCardProps) {
  const title = props.text.title ?? props.text.themeTitle
  return (
    <Card className="h-full [overflow-wrap:anywhere]">
      <Link
        href={`/dashboard/texts/${props.text.id}`}
        className="block rounded-lg outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="line-clamp-4 whitespace-pre-wrap text-muted-foreground">
            {props.text.content}
          </p>
          <p className="text-muted-foreground">
            <time dateTime={props.text.createdAt.toISOString()}>
              {formatTextCreatedAt(props.text.createdAt)}
            </time>
          </p>
          <p>{textCorrectionLabel(props.text)}</p>
        </CardContent>
      </Link>
      <CardFooter>
        <DeleteSceneButton
          id={`delete-scene-${props.text.id}`}
          textId={props.text.id}
        />
      </CardFooter>
    </Card>
  )
}

export default async function TextsPage() {
  const session = await requireSession()
  const [texts, retired] = await Promise.all([
    textService.listOwnedTexts(session.user.id),
    textService.listUndoableScenes(session.user.id),
  ])

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Minhas cenas</h1>
      {retired.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {retired.map((scene) => (
            <li key={scene.id}>
              <DeletedSceneNotice
                textId={scene.id}
                title={scene.title}
                deletedAt={scene.deletedAt.toISOString()}
                readingInProgress={scene.readingInProgress}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {texts.length === 0 && retired.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Você ainda não tem cenas.
          </p>
          <Link
            id="texts-browse-themes"
            href="/dashboard/themes"
            className={buttonVariants({ className: "w-fit" })}
          >
            Explorar exercícios
          </Link>
        </div>
      ) : null}
      {texts.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {texts.map((text) => (
            <li key={text.id} className="min-w-0">
              <TextHistoryCard text={text} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
