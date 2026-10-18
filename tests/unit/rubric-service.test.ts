//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { rubric } from "@/database/schema"
import { rubricService } from "@/services/rubric"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

afterEach(async () => {
  await rows.cleanup()
})

describe("rubricService.findActiveRubricForTheme", () => {
  it("returns the active rubric joined to an active theme", async () => {
    const rubricId = await rows.insertRubric({
      title: "Scene rubric",
      content: "First rubric body",
    })
    const themeId = await rows.insertTheme(rubricId)

    await db
      .update(rubric)
      .set({ content: "Revised rubric body" })
      .where(eq(rubric.id, rubricId))

    expect(await rubricService.findActiveRubricForTheme(themeId)).toEqual({
      id: rubricId,
      title: "Scene rubric",
      content: "Revised rubric body",
    })
  })

  it("returns null when the theme is soft-deleted", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(await rubricService.findActiveRubricForTheme(themeId)).toBeNull()
  })

  it("returns null when the rubric is soft-deleted", async () => {
    const rubricId = await rows.insertRubric({
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })
    const themeId = await rows.insertTheme(rubricId)

    expect(await rubricService.findActiveRubricForTheme(themeId)).toBeNull()
  })
})

describe("rubricService.findActiveRubricContent", () => {
  it("returns the current body of an active rubric", async () => {
    const rubricId = await rows.insertRubric({ content: "First body" })

    await db
      .update(rubric)
      .set({ content: "Revised body" })
      .where(eq(rubric.id, rubricId))

    expect(await rubricService.findActiveRubricContent(rubricId)).toEqual({
      content: "Revised body",
    })
  })

  it("returns null when the rubric is soft-deleted or missing", async () => {
    const rubricId = await rows.insertRubric({
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(await rubricService.findActiveRubricContent(rubricId)).toBeNull()
    expect(
      await rubricService.findActiveRubricContent(`pr6-${crypto.randomUUID()}`)
    ).toBeNull()
  })
})
