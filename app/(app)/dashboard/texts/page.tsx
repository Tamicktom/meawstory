//* Libraries imports
import { headers } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"

//* Components imports
import { buttonVariants } from "@/components/ui/button/button-variants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

//* Services imports
import { textService, type OwnedTextListItem } from "@/services/text"

//* Local imports
import { auth } from "@/lib/auth"

type TextHistoryCardProps = {
  text: OwnedTextListItem
}

function formatTextCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(createdAt)
}

function formatCompletedScore(score: string) {
  const value = Number(score)

  if (!Number.isFinite(value)) {
    return score
  }

  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2)

  return `${formatted} / 1000`
}

function textCorrectionLabel(text: OwnedTextListItem) {
  const correction = text.correction

  if (!correction) {
    return "Waiting for correction"
  }

  if (correction.status === "FAILED") {
    return "Correction failed"
  }

  if (correction.status === "COMPLETED" && correction.score) {
    return formatCompletedScore(correction.score)
  }

  return "Correction in progress"
}

function TextHistoryCard(props: TextHistoryCardProps) {
  return (
    <Link
      href={`/dashboard/texts/${props.text.id}`}
      className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:bg-accent">
        <CardHeader>
          <CardTitle>{props.text.themeTitle}</CardTitle>
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
      </Card>
    </Link>
  )
}

export default async function TextsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    notFound()
  }

  const texts = await textService.listOwnedTexts(session.user.id)

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Texts</h1>
      {texts.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">No texts yet.</p>
          <Link
            id="texts-browse-themes"
            href="/dashboard/themes"
            className={buttonVariants({ className: "w-fit" })}
          >
            Browse themes
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {texts.map((text) => (
            <li key={text.id} className="min-w-0">
              <TextHistoryCard text={text} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
