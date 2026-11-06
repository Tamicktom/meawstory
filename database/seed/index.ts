//* Local imports
import { db } from "@/database"
import {
  assertNarrativeCatalog,
  rubricSeeds,
  themeSeeds,
} from "@/database/seed/catalog"
import { rubric, theme } from "@/database/schema"

export { seedTestUser } from "@/database/seed/test-user"

export async function seedNarrativeCatalog(): Promise<{
  rubrics: number
  themes: number
}> {
  assertNarrativeCatalog()

  await db.transaction(async (tx) => {
    for (const item of rubricSeeds) {
      await tx
        .insert(rubric)
        .values(item)
        .onConflictDoUpdate({
          target: rubric.id,
          set: {
            ...item,
            updatedAt: new Date(),
          },
        })
    }

    for (const item of themeSeeds) {
      await tx
        .insert(theme)
        .values(item)
        .onConflictDoUpdate({
          target: theme.id,
          set: {
            ...item,
            updatedAt: new Date(),
          },
        })
    }
  })

  return {
    rubrics: rubricSeeds.length,
    themes: themeSeeds.length,
  }
}
