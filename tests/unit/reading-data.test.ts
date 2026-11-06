import { afterEach, expect, test } from "bun:test"
import { eq } from "drizzle-orm"
import { db } from "@/database"
import { correction, rubric, theme } from "@/database/schema"
import { rubricSeeds, themeSeeds } from "@/database/seed/catalog"
import {
  briefingSchema,
  rubricCriteriaSchema,
  type StructuredReading,
} from "@/lib/reading-contract"
import { themeService } from "@/services/theme"
import { correctionService } from "@/services/correction"
import { reserveReading } from "@/services/reading"
import { correctionConfiguration } from "@/workflows/correction-config"
import {
  createIsolatedRows,
  expectPostgresError,
} from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
afterEach(() => rows.cleanup())
const catalogRubric = rubricSeeds[0]
const catalogTheme = themeSeeds[0]

async function scene() {
  const g = await rows.insertActiveText({
    content: "Uma cena no telhado. ".repeat(35).trim(),
  })
  await db
    .update(rubric)
    .set({
      content: catalogRubric.content,
      genre: catalogRubric.genre,
      criteria: catalogRubric.criteria,
    })
    .where(eq(rubric.id, g.rubricId))
  await db
    .update(theme)
    .set({
      genre: catalogTheme.genre,
      objective: catalogTheme.objective,
      minWords: catalogTheme.minWords,
      maxWords: catalogTheme.maxWords,
      briefing: catalogTheme.briefing,
    })
    .where(eq(theme.id, g.themeId))
  return g
}

function result(): StructuredReading {
  return {
    version: 1,
    opening: "A cena acompanha a travessia.",
    highlight: {
      description: "O movimento fica visível.",
      evidence: "Uma cena no telhado.",
    },
    revision: "Experimente tornar o custo da escolha mais visível.",
    criteria: catalogRubric.criteria.map((c) => ({
      id: c.id,
      score: c.maxScore,
      band: "strong",
      evidence: ["Uma cena no telhado."],
      strengths: "A ação está na página.",
      gaps: "O custo pode ficar mais claro.",
    })),
  }
}

test("all twelve exercises have structured briefings, objectives, genres and the three current word ranges", () => {
  expect(themeSeeds).toHaveLength(12)
  expect(new Set(themeSeeds.map((t) => `${t.minWords}-${t.maxWords}`))).toEqual(
    new Set(["400-800", "400-900", "500-1000"])
  )
  for (const t of themeSeeds) {
    expect(briefingSchema.safeParse(t.briefing).success).toBe(true)
    expect(t.objective.length).toBeGreaterThan(20)
    expect(rubricSeeds.find((r) => r.id === t.rubricId)?.genre).toBe(t.genre)
  }
  for (const r of rubricSeeds)
    expect(rubricCriteriaSchema.safeParse(r.criteria).success).toBe(true)
})

test("public briefing reads structured items and exposes only public rubric fields", async () => {
  const g = await scene()
  const criteria = structuredClone(catalogRubric.criteria)
  criteria[0].bands[0].description = "PRIVATE BAND INSTRUCTION"
  await db
    .update(rubric)
    .set({ content: "PRIVATE MODEL INSTRUCTIONS", criteria })
    .where(eq(rubric.id, g.rubricId))
  await db
    .update(theme)
    .set({ description: "OLD MARKDOWN THAT MUST NOT BE PARSED" })
    .where(eq(theme.id, g.themeId))
  const found = await themeService.findThemeById(g.themeId)
  expect(found?.briefing?.mustInclude).toEqual(
    catalogTheme.briefing.mustInclude
  )
  expect(found?.description).toContain(catalogTheme.objective)
  expect(found?.description).toContain(catalogTheme.briefing.doNotPenalize[0])
  expect(found?.description).toContain(criteria[0].publicDescription)
  expect(found?.criteria[0]).toEqual({
    id: criteria[0].id,
    name: criteria[0].name,
    publicDescription: criteria[0].publicDescription,
    maxScore: criteria[0].maxScore,
  })
  expect(JSON.stringify(found)).not.toContain("PRIVATE")
  expect(found?.description).not.toContain("OLD MARKDOWN")
  const listed = await themeService.listActiveThemes()
  expect(listed.find((t) => t.id === g.themeId)?.briefing?.situation).toBe(
    catalogTheme.briefing.situation
  )
})

test("database rejects malformed criteria, word ranges, missing briefing items and genre mismatch", async () => {
  const g = await scene()
  const bad = structuredClone(catalogRubric.criteria)
  bad[0].maxScore++
  await expectPostgresError(
    () =>
      db.update(rubric).set({ criteria: bad }).where(eq(rubric.id, g.rubricId)),
    "23514",
    "rubric_structured_data"
  )
  await expectPostgresError(
    () =>
      db.update(theme).set({ maxWords: 399 }).where(eq(theme.id, g.themeId)),
    "23514",
    "theme_structured_data"
  )
  await expectPostgresError(
    () =>
      db
        .update(theme)
        .set({ briefing: { ...catalogTheme.briefing, mustInclude: [] } })
        .where(eq(theme.id, g.themeId)),
    "23514",
    "theme_structured_data"
  )
  await expectPostgresError(
    () =>
      db.update(theme).set({ genre: "romance" }).where(eq(theme.id, g.themeId)),
    "23514",
    "theme_rubric_genre"
  )
  await expectPostgresError(
    () =>
      db
        .update(rubric)
        .set({ genre: "romance" })
        .where(eq(rubric.id, g.rubricId)),
    "23514",
    "rubric_theme_genre"
  )
})

test("reservation freezes criteria and full application configuration, including failed attempts", async () => {
  const g = await scene()
  const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
  const before = await correctionService.findAttemptSnapshot(id)
  expect(before?.rubricCriteria).toEqual(catalogRubric.criteria)
  expect(before).toMatchObject(correctionConfiguration())
  expect(before?.source).toMatchObject({
    themeTitle: expect.any(String),
    themeDescription: expect.any(String),
    rubricTitle: expect.any(String),
  })
  await correctionService.updateCorrectionStatus(id, "FAILED")
  expect(await correctionService.findAttemptSnapshot(id)).toMatchObject({
    ...correctionConfiguration(),
    status: "FAILED",
    rubricCriteria: catalogRubric.criteria,
  })
  const criteria = structuredClone(catalogRubric.criteria)
  criteria[0].publicDescription = "Um novo critério público."
  await db.update(rubric).set({ criteria }).where(eq(rubric.id, g.rubricId))
  await expect(reserveReading(g.userId, g.textId)).rejects.toThrow(
    "O exercício mudou"
  )
})

test("a changed theme briefing cannot silently change a retry", async () => {
  const g = await scene()
  const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
  await correctionService.updateCorrectionStatus(id, "FAILED")
  await db
    .update(theme)
    .set({ description: "Outro enunciado" })
    .where(eq(theme.id, g.themeId))
  await expect(reserveReading(g.userId, g.textId)).rejects.toThrow(
    "O exercício mudou"
  )
})

test("structured completion matches criteria by ID and preserves results across catalog edits", async () => {
  const g = await scene()
  const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
  const reading = result()
  reading.criteria.reverse()
  await correctionService.updateCorrection(id, {
    status: "COMPLETED",
    score: "1000.00",
    content: "Leitura",
    structuredResult: reading,
  })
  const before = await correctionService.findAttemptSnapshot(id)
  await db
    .update(rubric)
    .set({ content: "Different rubric", criteria: rubricSeeds[1].criteria })
    .where(eq(rubric.id, g.rubricId))
  await db
    .update(theme)
    .set({ objective: "Outro objetivo" })
    .where(eq(theme.id, g.themeId))
  expect(await correctionService.findAttemptSnapshot(id)).toEqual(before)
  expect(before?.structuredResult).toEqual(reading)
  await expectPostgresError(
    () =>
      db
        .update(correction)
        .set({ structuredResult: { ...reading, revision: "Alterada" } })
        .where(eq(correction.id, id)),
    "23514",
    "correction_immutable_result"
  )
  await expectPostgresError(
    () =>
      db
        .update(correction)
        .set({ modelId: "other-model" })
        .where(eq(correction.id, id)),
    "23514",
    "correction_immutable_snapshot"
  )
  await db
    .update(correction)
    .set({ deletedAt: new Date() })
    .where(eq(correction.id, id))
})

for (const defect of [
  "id",
  "unknown id",
  "score",
  "band",
  "total",
  "precision",
] as const) {
  test(`structured result rejects invalid ${defect} in service and database`, async () => {
    const g = await scene()
    const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
    const reading = result()
    if (defect === "id") reading.criteria[0].id = reading.criteria[1].id
    if (defect === "unknown id") reading.criteria[0].id = "missing-criterion"
    if (defect === "score") reading.criteria[0].score = 151
    if (defect === "band") reading.criteria[0].band = "missing"
    if (defect === "precision") reading.criteria[0].score = 149.999
    const score = defect === "total" ? "999.00" : "1000.00"
    await expect(
      correctionService.updateCorrection(id, {
        status: "COMPLETED",
        score,
        structuredResult: reading,
      })
    ).rejects.toThrow()
    await expectPostgresError(
      () =>
        db
          .update(correction)
          .set({ status: "COMPLETED", score, structuredResult: reading })
          .where(eq(correction.id, id)),
      "23514",
      "correction_structured_result"
    )
    expect((await correctionService.findAttemptSnapshot(id))?.status).toBe(
      "PENDING"
    )
  })
}

test("legacy markdown stays readable and never acquires invented criterion results", async () => {
  const g = await rows.insertActiveText()
  const id = await rows.insertCorrection({
    textId: g.textId,
    rubricId: g.rubricId,
    content: "Original markdown",
    status: "COMPLETED",
  })
  const reading = await correctionService.findAttemptSnapshot(id)
  expect(reading?.structuredResult).toBeNull()
  expect(reading?.rubricCriteria).toBeNull()
  expect(reading?.modelId).toBeNull()
  expect(
    (await correctionService.findLatestActiveCorrection(g.textId))?.content
  ).toBe("Original markdown")
})

test("fractional scores between printed integer bands retain the same percentile band", async () => {
  const g = await scene()
  const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
  const reading = result()
  reading.criteria[0].score = 30.01
  reading.criteria[0].band = "thin"
  await correctionService.updateCorrection(id, {
    status: "COMPLETED",
    score: "880.01",
    structuredResult: reading,
  })
  expect(
    (await correctionService.findAttemptSnapshot(id))?.structuredResult
      ?.criteria[0]
  ).toMatchObject({ score: 30.01, band: "thin" })
})
