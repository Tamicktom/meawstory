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
        .values({
          id: item.id,
          title: item.title,
          content: item.content,
        })
        .onConflictDoUpdate({
          target: rubric.id,
          set: {
            title: item.title,
            content: item.content,
            updatedAt: new Date(),
          },
        })
    }

    for (const item of themeSeeds) {
      await tx
        .insert(theme)
        .values({
          id: item.id,
          title: item.title,
          description: item.description,
          rubricId: item.rubricId,
        })
        .onConflictDoUpdate({
          target: theme.id,
          set: {
            title: item.title,
            description: item.description,
            rubricId: item.rubricId,
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
