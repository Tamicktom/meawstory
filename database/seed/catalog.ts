import { briefingSchema, rubricCriteriaSchema } from "@/lib/reading-contract"
import { scoreBandRanges } from "@/database/seed/render-rubric"
import { BAND_IDS } from "@/lib/reading-contract"
//* Local imports
import { renderRubric } from "@/database/seed/render-rubric"
import { renderTheme } from "@/database/seed/render-theme"
import { rubricDefinitions } from "@/database/seed/rubrics"
import { themeDefinitions } from "@/database/seed/themes"

export const rubricSeeds = rubricDefinitions.map((definition) => ({
  id: definition.id,
  title: definition.title,
  content: renderRubric(definition),
  genre: definition.genre,
  criteria: rubricCriteriaSchema.parse(
    definition.criteria.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      kind: criterion.kind,
      publicDescription: criterion.publicDescription,
      maxScore: criterion.points,
      bands: scoreBandRanges(criterion.points).map(([min, max], index) => ({
        id: BAND_IDS[index],
        min,
        max,
        description: criterion.bands[BAND_IDS[index]],
      })),
    }))
  ),
}))

export const themeSeeds = themeDefinitions.map((definition) => ({
  id: definition.id,
  title: definition.title,
  description: renderTheme(definition),
  rubricId: definition.rubricId,
  genre: definition.genre,
  objective: definition.objective,
  minWords: definition.minWords,
  maxWords: definition.maxWords,
  briefing: briefingSchema.parse({
    situation: definition.situation,
    alreadyTrue: definition.alreadyTrue,
    mustInclude: definition.mustInclude,
    youDecide: definition.youDecide,
    doNotPenalize: definition.doNotPenalize,
  }),
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

    if (
      rubricSeeds.find((r) => r.id === item.rubricId)?.genre !== item.genre ||
      item.minWords < 1 ||
      item.maxWords < item.minWords
    )
      throw new Error(`Invalid metadata for ${item.id}.`)
    themeIds.add(item.id)
  }
}
