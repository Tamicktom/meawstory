//* Libraries imports
import Link from "next/link"

//* Components imports
import { CloseSceneButton } from "@/components/scenes/close-scene-button"
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
import { GENRE_LABEL } from "@/lib/reading-contract"
import {
  SCENE_FILTERS,
  sceneMatchesFilter,
  sceneMatchesGenre,
  versionCountLabel,
} from "@/lib/scene-status"

type SceneSearch = {
  genero?: string | string[]
  situacao?: string | string[]
}

type TextsPageProps = {
  searchParams?: Promise<SceneSearch>
}

type TextHistoryCardProps = {
  text: OwnedTextListItem
}

const textActivityFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "America/Sao_Paulo",
})

function formatActivity(date: Date) {
  return textActivityFormatter.format(date)
}

function oneParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw?.trim() ?? ""
}

function TextHistoryCard(props: TextHistoryCardProps) {
  const title = props.text.title ?? props.text.themeTitle
  return (
    <Card className="h-full [overflow-wrap:anywhere]">
      <Link
        href={`/dashboard/texts/${props.text.id}`}
        className="block rounded-lg transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader>
          {props.text.unopened ? (
            <p className="text-sm font-medium">Nova</p>
          ) : null}
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p>Exercício: {props.text.themeTitle}</p>
          {props.text.genre ? (
            <p>Gênero: {GENRE_LABEL[props.text.genre]}</p>
          ) : null}
          <p>{versionCountLabel(props.text.versionCount)}</p>
          <p>
            Última alteração{" "}
            <time dateTime={props.text.lastActivityAt.toISOString()}>
              {formatActivity(props.text.lastActivityAt)}
            </time>
          </p>
          <p>{props.text.label}</p>
        </CardContent>
      </Link>
      <CardFooter className="flex flex-col items-stretch gap-2">
        {props.text.closed ? (
          <CloseSceneButton
            id={`reopen-scene-${props.text.id}`}
            textId={props.text.id}
            closed
          />
        ) : null}
        <DeleteSceneButton
          id={`delete-scene-${props.text.id}`}
          textId={props.text.id}
        />
      </CardFooter>
    </Card>
  )
}

function SceneFilters(props: { genre: string; situation: string }) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label htmlFor="scenes-genre" className="flex flex-col gap-1 text-sm">
        Gênero
        <select
          id="scenes-genre"
          name="genero"
          defaultValue={props.genre}
          className="min-h-11 rounded-md border bg-background px-3"
        >
          <option value="">Todos</option>
          {Object.entries(GENRE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="scenes-situation" className="flex flex-col gap-1 text-sm">
        Situação
        <select
          id="scenes-situation"
          name="situacao"
          defaultValue={props.situation}
          className="min-h-11 rounded-md border bg-background px-3"
        >
          <option value="">Todas</option>
          {SCENE_FILTERS.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label}
            </option>
          ))}
        </select>
      </label>
      <button
        id="scenes-apply-filters"
        type="submit"
        className={buttonVariants({ className: "min-h-11 w-fit" })}
      >
        Filtrar
      </button>
      {props.genre || props.situation ? (
        <Link
          id="scenes-clear-filters"
          href="/dashboard/texts"
          className="inline-flex min-h-11 items-center py-2 underline"
        >
          Limpar filtros
        </Link>
      ) : null}
    </form>
  )
}

export default async function TextsPage(props?: TextsPageProps) {
  const [session, searchParams] = await Promise.all([
    requireSession(),
    props?.searchParams ?? Promise.resolve<SceneSearch>({}),
  ])
  const genre = oneParam(searchParams.genero)
  const situation = oneParam(searchParams.situacao)
  const [texts, retired] = await Promise.all([
    textService.listOwnedTexts(session.user.id),
    textService.listUndoableScenes(session.user.id),
  ])
  const visible = texts.filter(
    (text) =>
      sceneMatchesGenre(text.genre, genre) &&
      sceneMatchesFilter(
        {
          situation: text.situation,
          band: text.band,
          label: text.label,
          versionCount: text.versionCount,
          unopened: text.unopened,
        },
        situation
      )
  )
  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Minhas cenas</h1>
      {texts.length > 0 ? (
        <SceneFilters genre={genre} situation={situation} />
      ) : null}
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
      {texts.length > 0 && visible.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p>Nenhuma cena corresponde a esses filtros.</p>
          <Link
            id="scenes-clear-filters-empty"
            href="/dashboard/texts"
            className="w-fit py-2 underline"
          >
            Limpar filtros
          </Link>
        </div>
      ) : null}
      {visible.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((text) => (
            <li key={text.id} className="min-w-0">
              <TextHistoryCard text={text} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
