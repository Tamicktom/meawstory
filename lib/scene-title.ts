export function sceneTitle(title: string | undefined, exerciseTitle: string) {
  const value = title?.trim()
  return !value || value === "Cena" || value.startsWith("Text for theme ")
    ? exerciseTitle
    : value
}
