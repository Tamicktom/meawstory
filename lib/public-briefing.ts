import type { Briefing, Genre, RubricCriteria } from "@/lib/reading-contract"
import { GENRE_LABEL } from "@/lib/reading-contract"

export function publicCriteria(criteria: RubricCriteria | null) {
  return (
    criteria?.map(({ id, name, publicDescription, maxScore }) => ({
      id,
      name,
      publicDescription,
      maxScore,
    })) ?? []
  )
}

export function renderPublicBriefing(
  theme: {
    genre: Genre | null
    objective: string | null
    minWords: number | null
    maxWords: number | null
    briefing: Briefing | null
  },
  criteria: ReturnType<typeof publicCriteria>
) {
  if (!theme.briefing) return null
  const b = theme.briefing
  const bullets = (items: string[]) =>
    items.map((item) => `- ${item}`).join("\n")
  return [
    "Escreva uma única cena a partir deste contexto. O que não estiver dito aqui é decisão sua.",
    "## Gênero",
    theme.genre ? GENRE_LABEL[theme.genre] : "",
    "## O que você vai treinar",
    theme.objective ?? "",
    "## Situação",
    b.situation,
    "## O que já é verdade",
    bullets(b.alreadyTrue),
    "## O que a cena precisa conter",
    bullets(b.mustInclude),
    "## O que você decide",
    b.youDecide,
    "## Extensão",
    `Entre ${theme.minWords} e ${theme.maxWords} palavras.`,
    "## O que não será penalizado",
    bullets(b.doNotPenalize),
    "## O que será observado",
    bullets(
      criteria.map(
        (c) => `**${c.name} (${c.maxScore} pontos):** ${c.publicDescription}`
      )
    ),
  ].join("\n\n")
}
