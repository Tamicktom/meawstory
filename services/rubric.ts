//* Libraries imports
import { and, eq, isNull } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { rubric, theme } from "@/database/schema"

async function findActiveRubricForTheme(themeId: string) {
  const result = await db
    .select({
      id: rubric.id,
      title: rubric.title,
      content: rubric.content,
    })
    .from(theme)
    .innerJoin(rubric, eq(theme.rubricId, rubric.id))
    .where(
      and(
        eq(theme.id, themeId),
        isNull(theme.deletedAt),
        isNull(rubric.deletedAt)
      )
    )
    .limit(1)

  return result[0] ?? null
}

async function findActiveRubricContent(rubricId: string) {
  const result = await db
    .select({
      content: rubric.content,
    })
    .from(rubric)
    .where(and(eq(rubric.id, rubricId), isNull(rubric.deletedAt)))
    .limit(1)

  return result[0] ?? null
}

export const rubricService = {
  findActiveRubricForTheme,
  findActiveRubricContent
}