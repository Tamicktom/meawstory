import Link from "next/link"
import { GENRE_LABEL } from "@/lib/reading-contract"
import { homeAction, sceneHref } from "@/lib/home-action"
import type { OwnedTextListItem } from "@/services/text"
import { buttonVariants } from "@/components/ui/button/button-variants"
import { completeOnboarding } from "./onboarding"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "America/Sao_Paulo",
})

export function DashboardHome({
  scenes,
  onboardingComplete,
}: {
  scenes: OwnedTextListItem[]
  onboardingComplete: boolean
}) {
  const action = homeAction(scenes)
  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-8 p-4 [overflow-wrap:anywhere]">
      <h1 className="font-heading text-lg font-medium">Início</h1>
      {!onboardingComplete ? (
        <section
          className="flex flex-col gap-4"
          aria-labelledby="training-goal"
        >
          <h2 id="training-goal" className="font-heading text-xl">
            O que você quer treinar agora?
          </h2>
          <form action={completeOnboarding} className="flex flex-wrap gap-3">
            {Object.entries(GENRE_LABEL).map(([genre, label]) => (
              <button
                type="submit"
                key={genre}
                name="genre"
                value={genre}
                className={buttonVariants({
                  variant: "outline",
                  className: "min-h-11",
                })}
              >
                {label}
              </button>
            ))}
            <button
              type="submit"
              name="genre"
              value="skip"
              className="min-h-11 px-3 underline"
            >
              Pular por enquanto
            </button>
          </form>
        </section>
      ) : null}
      <section aria-labelledby="next-action" className="flex flex-col gap-3">
        <h2 id="next-action" className="font-heading text-xl">
          Sua próxima ação
        </h2>
        {action.scene ? (
          <>
            <p className="font-medium">{action.scene.title}</p>
            <p className="text-sm text-muted-foreground">
              {action.scene.label}
            </p>
            {["draft", "revising"].includes(action.scene.situation) ? (
              <p className="text-sm">
                {
                  action.scene.content.trim().split(/\s+/).filter(Boolean)
                    .length
                }{" "}
                palavras ·{" "}
                <time dateTime={action.scene.lastActivityAt.toISOString()}>
                  {dateFormatter.format(action.scene.lastActivityAt)}
                </time>
              </p>
            ) : null}
            {action.scene.revisionFocus ? (
              <p>Foco da revisão: {action.scene.revisionFocus}</p>
            ) : null}
          </>
        ) : (
          <p>Escolha um exercício e comece sua próxima cena.</p>
        )}
        <Link
          id="dashboard-next-action"
          href={action.href}
          className={buttonVariants({
            className: "min-h-11 w-fit max-w-full whitespace-normal",
          })}
        >
          {action.label}
        </Link>
      </section>
      {scenes.length > 0 ? (
        <section
          aria-labelledby="recent-scenes"
          className="flex flex-col gap-3"
        >
          <h2 id="recent-scenes" className="font-heading text-xl">
            Cenas recentes
          </h2>
          <ul className="divide-y">
            {scenes.slice(0, 4).map((scene) => (
              <li key={scene.id}>
                <Link
                  href={sceneHref(scene)}
                  className="flex min-h-11 flex-col gap-1 py-3 underline"
                >
                  <span>{scene.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {scene.themeTitle} · {scene.label} ·{" "}
                    {dateFormatter.format(scene.lastActivityAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <nav
        aria-label="Atalhos do início"
        className="flex flex-wrap gap-4 text-sm"
      >
        <Link
          id="dashboard-browse-themes"
          href="/dashboard/themes"
          className="py-2 underline"
        >
          Explorar exercícios
        </Link>
        <Link
          id="dashboard-your-texts"
          href="/dashboard/texts"
          className="py-2 underline"
        >
          Minhas cenas
        </Link>
      </nav>
    </div>
  )
}
