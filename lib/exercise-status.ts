import type { CorrectionStatus } from "@/database/schema"

export const EXERCISE_SITUATIONS = {
  unwritten: "Não escrito",
  draft: "Rascunho",
  revising: "Em revisão",
  closed: "Encerrado",
} as const

export type ExerciseSituation = keyof typeof EXERCISE_SITUATIONS

type CatalogScene = {
  id: string
  closedAt: Date | null
  updatedAt: Date
  corrections: { status: CorrectionStatus }[]
}

// An open scene takes precedence; within each group, continue the most recent.
export function exerciseStatus(scenes: CatalogScene[]): {
  situation: ExerciseSituation
  sceneId: string | null
} {
  const scene = scenes.toSorted((a, b) => {
    const closed = Number(a.closedAt != null) - Number(b.closedAt != null)
    return (
      closed ||
      b.updatedAt.getTime() - a.updatedAt.getTime() ||
      a.id.localeCompare(b.id)
    )
  })[0]
  if (!scene) return { situation: "unwritten", sceneId: null }
  return {
    situation: scene.closedAt
      ? "closed"
      : scene.corrections.length
        ? "revising"
        : "draft",
    sceneId: scene.id,
  }
}
