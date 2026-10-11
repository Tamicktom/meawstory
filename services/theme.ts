//* Libraries imports
import { and, eq, isNull } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { theme } from "@/database/schema"

const activeThemeListLimit = 32

async function listActiveThemes() {
  return db.query.theme.findMany({
    columns: {
      id: true,
      title: true,
      description: true,
      image: true,
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
    .select()
    .from(theme)
    .where(and(eq(theme.id, id), isNull(theme.deletedAt)))
    .limit(1)

  return result[0] ?? null
}

export const themeService = {
  listActiveThemes,
  findThemeById
}