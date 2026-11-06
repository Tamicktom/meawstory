//* Libraries imports
import { and, eq, isNull } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { publicCriteria, renderPublicBriefing } from "@/lib/public-briefing"
import { exerciseStatus } from "@/lib/exercise-status"
import { theme, rubric } from "@/database/schema"

const activeThemeListLimit = 32

async function listThemes(limit?: number) {
  return db.query.theme.findMany({
    columns: {
      id: true,
      title: true,
      description: true,
      image: true,
      genre: true,
      objective: true,
      minWords: true,
      maxWords: true,
      briefing: true,
    },
    where: {
      deletedAt: {
        isNull: true,
      },
    },
    orderBy: {
      title: "asc",
    },
    limit,
  })
}

async function listActiveThemes() {
  return listThemes(activeThemeListLimit)
}

async function listCatalog(userId: string) {
  const [themes, scenes] = await Promise.all([
    listThemes(),
    db.query.text.findMany({
      columns: { id: true, themeId: true, closedAt: true, updatedAt: true },
      where: { userId, deletedAt: { isNull: true } },
      with: {
        corrections: {
          columns: { status: true },
          where: { deletedAt: { isNull: true } },
          limit: 1,
        },
      },
    }),
  ])
  const byTheme = new Map<string, typeof scenes>()
  for (const scene of scenes) {
    const group = byTheme.get(scene.themeId) ?? []
    group.push(scene)
    byTheme.set(scene.themeId, group)
  }
  return themes.map((theme) => ({
    ...theme,
    ...exerciseStatus(byTheme.get(theme.id) ?? []),
  }))
}

export type CatalogExercise = Awaited<ReturnType<typeof listCatalog>>[number]

async function findThemeById(id: string) {
  const result = await db
    .select({ theme, criteria: rubric.criteria })
    .from(theme)
    .innerJoin(rubric, eq(theme.rubricId, rubric.id))
    .where(and(eq(theme.id, id), isNull(theme.deletedAt)))
    .limit(1)

  const row = result[0]
  if (!row) return null
  const criteria = publicCriteria(row.criteria)
  return {
    ...row.theme,
    criteria,
    description:
      renderPublicBriefing(row.theme, criteria) ?? row.theme.description,
  }
}

export const themeService = {
  listActiveThemes,
  listCatalog,
  findThemeById,
}
