import type { OwnedTextListItem } from "@/services/text"

export function sceneHref(scene: OwnedTextListItem) {
  return scene.situation === "draft" || scene.situation === "revising"
    ? `/dashboard/exercises/${scene.themeId}/write?textId=${scene.id}`
    : `/dashboard/texts/${scene.id}`
}

function priority(scene: OwnedTextListItem) {
  if (scene.unopened) return 0
  if (scene.closed) return 6
  if (scene.situation === "failed") return 1
  if (["waiting", "reading"].includes(scene.situation)) return 2
  if (["draft", "revising"].includes(scene.situation)) return 3
  if (scene.revisionFocus) return 4
  return 6
}

export function homeAction(scenes: OwnedTextListItem[]) {
  const scene = scenes.toSorted(
    (a, b) =>
      priority(a) - priority(b) ||
      b.lastActivityAt.getTime() - a.lastActivityAt.getTime() ||
      a.id.localeCompare(b.id)
  )[0]
  if (!scene || priority(scene) === 6)
    return {
      label: "Escolher um exercício",
      href: "/dashboard/themes",
      scene: null,
    }
  const labels = [
    "Abrir leitura nova",
    "Tentar leitura novamente",
    "Acompanhar leitura",
    "Continuar rascunho",
    "Revisar cena",
  ]
  const rank = priority(scene)
  return {
    label: labels[rank],
    scene,
    href:
      rank === 0
        ? `/dashboard/texts/${scene.id}`
        : rank === 4
          ? `/dashboard/exercises/${scene.themeId}/write?textId=${scene.id}`
          : sceneHref(scene),
  }
}
