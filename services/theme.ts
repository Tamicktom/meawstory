//* Libraries imports
import { and, eq, isNull } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { publicCriteria, renderPublicBriefing } from "@/lib/public-briefing"
import { theme, rubric } from "@/database/schema"

const activeThemeListLimit = 32

async function listActiveThemes() {
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
    limit: activeThemeListLimit,
  })
}

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
  findThemeById,
}
