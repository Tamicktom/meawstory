//* Local imports
import { renderRubric } from "@/database/seed/render-rubric"
import { renderTheme } from "@/database/seed/render-theme"
import { rubricDefinitions } from "@/database/seed/rubrics"
import { themeDefinitions } from "@/database/seed/themes"

export const rubricSeeds = rubricDefinitions.map((definition) => ({
  id: definition.id,
  title: definition.title,
  content: renderRubric(definition),
}))

export const themeSeeds = themeDefinitions.map((definition) => ({
  id: definition.id,
  title: definition.title,
  description: renderTheme(definition),
  rubricId: definition.rubricId,
}))

export function assertNarrativeCatalog(): void {
  const rubricIds = new Set<string>()

  for (const item of rubricSeeds) {
    if (item.id.trim().length === 0 || item.title.trim().length === 0) {
      throw new Error("Every rubric needs an id and a title.")
    }

    if (rubricIds.has(item.id)) {
      throw new Error(`Duplicate rubric id "${item.id}".`)
    }

    rubricIds.add(item.id)
  }

  const themeIds = new Set<string>()

  for (const item of themeSeeds) {
    if (item.id.trim().length === 0 || item.title.trim().length === 0) {
      throw new Error("Every theme needs an id and a title.")
    }

    if (themeIds.has(item.id)) {
      throw new Error(`Duplicate theme id "${item.id}".`)
    }

    if (!rubricIds.has(item.rubricId)) {
      throw new Error(
        `Theme "${item.id}" points at unknown rubric "${item.rubricId}".`
      )
    }

    themeIds.add(item.id)
  }
}
