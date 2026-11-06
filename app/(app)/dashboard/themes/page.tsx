//* Libraries imports
import Link from "next/link"

//* Services imports
import { themeService, type CatalogExercise } from "@/services/theme"
import { requireSession } from "@/lib/session"
import { GENRE_LABEL } from "@/lib/reading-contract"
import { EXERCISE_SITUATIONS } from "@/lib/exercise-status"
import { buttonVariants } from "@/components/ui/button/button-variants"

//* Components imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CatalogSearch = {
  genero?: string | string[]
  situacao?: string | string[]
}
type ThemesPageProps = { searchParams?: Promise<CatalogSearch> }

export function themeExcerpt(description: string): string {
  const situation = description.match(/## Situação\s+([\s\S]*?)(?:\n## |$)/)
  const excerpt = situation?.[1]?.trim()

  if (!excerpt || excerpt.startsWith("## ")) {
    return description.trim()
  }

  return excerpt
}

function ThemeCard({ theme }: { theme: CatalogExercise }) {
  const href =
    theme.sceneId && theme.situation === "draft"
      ? `/dashboard/exercises/${theme.id}/write?textId=${theme.sceneId}`
      : theme.sceneId
        ? `/dashboard/texts/${theme.sceneId}`
        : `/dashboard/themes/${theme.id}`
  const action =
    theme.situation === "unwritten"
      ? "Abrir exercício"
      : theme.situation === "closed"
        ? "Ver cena encerrada"
        : theme.situation === "draft"
          ? "Continuar rascunho"
          : "Continuar cena"
  return (
    <Link
      href={href}
      className="block h-full rounded-lg [overflow-wrap:anywhere] outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:bg-accent">
        {theme.image ? (
          <img
            src={theme.image}
            alt=""
            className="aspect-video w-full object-cover"
          />
        ) : null}
        <CardHeader>
          {theme.genre ? (
            <p className="text-sm text-muted-foreground">
              {GENRE_LABEL[theme.genre]}
            </p>
          ) : null}
          <CardTitle>{theme.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            {theme.objective ??
              theme.briefing?.situation ??
              themeExcerpt(theme.description)}
          </p>
          {theme.minWords != null && theme.maxWords != null ? (
            <p className="text-sm">
              Extensão sugerida: {theme.minWords}–{theme.maxWords} palavras
            </p>
          ) : null}
          <p className="text-sm">{EXERCISE_SITUATIONS[theme.situation]}</p>
          <span className="mt-1 font-medium underline underline-offset-4">
            {action}
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

function CatalogFilters({
  genre,
  situation,
}: {
  genre: string
  situation: string
}) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="catalog-genre">Gênero</label>
        <select
          id="catalog-genre"
          name="genero"
          defaultValue={genre}
          className="min-h-11 rounded-md border bg-background px-3"
        >
          <option value="">Todos</option>
          {Object.entries(GENRE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="catalog-situation">Situação</label>
        <select
          id="catalog-situation"
          name="situacao"
          defaultValue={situation}
          className="min-h-11 rounded-md border bg-background px-3"
        >
          <option value="">Todas</option>
          {Object.entries(EXERCISE_SITUATIONS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className={buttonVariants({ className: "min-h-11 w-fit" })}
      >
        Filtrar
      </button>
      {genre || situation ? (
        <Link href="/dashboard/themes" className="w-fit py-2 underline">
          Limpar filtros
        </Link>
      ) : null}
    </form>
  )
}

function oneParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ""
}

export default async function ThemesPage(props?: ThemesPageProps) {
  const [session, search] = await Promise.all([
    requireSession(),
    props?.searchParams ?? Promise.resolve<CatalogSearch>({}),
  ])
  const themes = await themeService.listCatalog(session.user.id)
  const genre = oneParam(search.genero)
  const situation = oneParam(search.situacao)
  const visible = themes.filter(
    (theme) =>
      (!genre || theme.genre === genre) &&
      (!situation || theme.situation === situation)
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Exercícios</h1>
      {themes.length > 0 ? (
        <CatalogFilters genre={genre} situation={situation} />
      ) : null}
      {themes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ainda não há exercícios disponíveis. Volte em breve.
        </p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p>Nenhum exercício corresponde a esses filtros.</p>
          <Link href="/dashboard/themes" className="w-fit py-2 underline">
            Remover filtros
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((theme) => (
            <li key={theme.id} className="min-w-0">
              <ThemeCard theme={theme} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
