//* Libraries imports
import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test"
import { eq, like } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { theme } from "@/database/schema"
import { themeService } from "@/services/theme"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
const earlyTitlePrefix = "\u0001"

afterEach(async () => {
  await rows.cleanup()
})

beforeAll(async () => {
  await db.delete(theme).where(like(theme.title, `${earlyTitlePrefix}%`))
})

afterAll(async () => {
  await db.delete(theme).where(like(theme.title, `${earlyTitlePrefix}%`))
})

describe("themeService.listActiveThemes", () => {
  it("returns active themes in title order, limited to 32", async () => {
    const rubricId = await rows.insertRubric()
    const activeThemes = []

    for (let index = 1; index <= 33; index += 1) {
      const title = `${earlyTitlePrefix}${String(index).padStart(3, "0")}`
      const image = index === 1 ? "https://example.test/one.png" : null
      const description = `Description ${title}`
      const id = await rows.insertTheme(rubricId, {
        title,
        description,
        image,
      })

      activeThemes.push({ id, title, description, image })
    }

    await rows.insertTheme(rubricId, {
      title: `${earlyTitlePrefix}000`,
      description: "Deleted theme",
      image: "https://example.test/deleted.png",
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    const listed = await themeService.listActiveThemes()

    expect(listed).toHaveLength(32)
    expect(listed.map((item) => item.title)).toEqual(
      activeThemes.slice(0, 32).map((item) => item.title)
    )
    expect(listed[0]).toEqual({
      id: activeThemes[0]?.id,
      title: activeThemes[0]?.title,
      description: activeThemes[0]?.description,
      image: "https://example.test/one.png",
    })
    expect(listed.some((item) => item.title === `${earlyTitlePrefix}000`)).toBe(
      false
    )
    expect(listed.some((item) => item.title === `${earlyTitlePrefix}033`)).toBe(
      false
    )
  })
})

describe("themeService.findThemeById", () => {
  it("returns the active theme with that id", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      title: "Active theme",
      description: "Still circulating",
      image: "https://example.test/theme.png",
    })

    const found = await themeService.findThemeById(themeId)

    expect(found).toMatchObject({
      id: themeId,
      title: "Active theme",
      description: "Still circulating",
      image: "https://example.test/theme.png",
      deletedAt: null,
    })
  })

  it("returns null when the theme is missing", async () => {
    expect(
      await themeService.findThemeById(`pr6-${crypto.randomUUID()}`)
    ).toBeNull()
  })

  it("returns null when the theme is soft-deleted", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId, {
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(await themeService.findThemeById(themeId)).toBeNull()

    const stored = await db
      .select({ id: theme.id })
      .from(theme)
      .where(eq(theme.id, themeId))

    expect(stored).toHaveLength(1)
  })
})
