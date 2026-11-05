import { afterEach, expect, test } from "bun:test"
import { eq } from "drizzle-orm"
import { db } from "@/database"
import { correction, text, rubric, theme } from "@/database/schema"
import { reserveReading, saveScene, expireReadings } from "@/services/reading"
import { correctionService } from "@/services/correction"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"
const rows = createIsolatedRows()
const content = "Uma cena. ".repeat(60).trim() + "\n\nOutro parágrafo."
afterEach(() => rows.cleanup())
async function scene() {
  const graph = await rows.insertActiveText({ content })
  return graph
}
test("concurrent starts reserve exactly one attempt and retries preserve the scene", async () => {
  const g = await scene()
  const attempts = await Promise.allSettled([
    reserveReading(g.userId, g.textId),
    reserveReading(g.userId, g.textId),
  ])
  expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1)
  const first = attempts.find((a) => a.status === "fulfilled")!
  if (first.status !== "fulfilled") throw Error("missing attempt")
  rows.trackCorrection(first.value)
  await expect(
    saveScene(g.userId, g.themeId, "changed", g.textId)
  ).rejects.toThrow("já tem uma leitura")
  await correctionService.updateCorrectionStatus(first.value, "FAILED")
  const retry = rows.trackCorrection(await reserveReading(g.userId, g.textId))
  const [stored] = await db
    .select()
    .from(correction)
    .where(eq(correction.id, retry))
  expect(stored.textId).toBe(g.textId)
  expect(stored.textContent).toBe(content)
})
test("draft edits reuse the scene and preserve paragraphs", async () => {
  const g = await scene()
  expect(
    await saveScene(g.userId, g.themeId, content + "\n\nFim.", g.textId)
  ).toEqual({ id: g.textId })
  const [stored] = await db.select().from(text).where(eq(text.id, g.textId))
  expect(stored.content).toBe(content + "\n\nFim.")
})
test("burst capacity is shared across scenes, failures release it, and deleted scenes still count", async () => {
  const g = await scene()
  for (let i = 0; i < 3; i++) {
    const id = await rows.insertText({
      userId: g.userId,
      themeId: g.themeId,
      content,
    })
    rows.trackCorrection(await reserveReading(g.userId, id))
    await db.update(text).set({ deletedAt: new Date() }).where(eq(text.id, id))
  }
  await expect(reserveReading(g.userId, g.textId)).rejects.toThrow(
    "limite de leituras"
  )
})
test("expired attempts release limits and late workers cannot overwrite failure", async () => {
  const g = await scene()
  const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
  await db
    .update(correction)
    .set({ createdAt: new Date(Date.now() - 601000) })
    .where(eq(correction.id, id))
  await expireReadings()
  await correctionService.updateCorrectionStatus(id, "IN_PROGRESS")
  expect(
    await correctionService.updateCorrection(id, {
      status: "COMPLETED",
      score: "900",
    })
  ).toBeNull()
  expect((await correctionService.findCorrectionById(id))?.status).toBe(
    "FAILED"
  )
  rows.trackCorrection(await reserveReading(g.userId, g.textId))
})
test("failed attempts release burst capacity", async () => {
  const g = await scene()
  for (let i = 0; i < 4; i++) {
    const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
    await correctionService.updateCorrectionStatus(id, "FAILED")
  }
  rows.trackCorrection(await reserveReading(g.userId, g.textId))
})
test("daily capacity includes soft-deleted attempts and rejects before reserving", async () => {
  const g = await scene()
  for (let i = 0; i < 10; i++) {
    await rows.insertCorrection({
      textId: g.textId,
      rubricId: g.rubricId,
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 3600000 - i * 1000),
      deletedAt: new Date(),
    })
  }
  await expect(reserveReading(g.userId, g.textId)).rejects.toThrow(
    "limite de leituras"
  )
})

test("reservation rejects missing scenes and other authors without creating attempts", async () => {
  const g = await scene()
  await expect(reserveReading(g.userId, "missing-scene")).rejects.toThrow(
    "Cena ou exercício indisponível"
  )
  const otherUserId = await rows.insertUser()
  await expect(reserveReading(otherUserId, g.textId)).rejects.toThrow(
    "Cena ou exercício indisponível"
  )
  expect(
    await correctionService.findLatestActiveCorrection(g.textId)
  ).toBeNull()
})

for (const words of [99, 2001]) {
  test(`reservation rejects ${words} words without creating an attempt`, async () => {
    const g = await rows.insertActiveText({ content: "cena ".repeat(words) })
    await expect(reserveReading(g.userId, g.textId)).rejects.toThrow(
      "precisa ter entre 100 e 2.000"
    )
    expect(
      await correctionService.findLatestActiveCorrection(g.textId)
    ).toBeNull()
  })
}

for (const status of ["PENDING", "IN_PROGRESS", "COMPLETED"] as const) {
  test(`reservation rejects an existing ${status} reading`, async () => {
    const g = await scene()
    await rows.insertCorrection({
      textId: g.textId,
      rubricId: g.rubricId,
      status,
    })
    await expect(reserveReading(g.userId, g.textId)).rejects.toThrow(
      "A leitura já foi iniciada"
    )
  })
}

for (const change of ["scene", "rubric body", "rubric id"] as const) {
  test(`retry rejects a changed ${change} and preserves the failed snapshot`, async () => {
    const g = await scene()
    const id = rows.trackCorrection(await reserveReading(g.userId, g.textId))
    await correctionService.updateCorrectionStatus(id, "FAILED")
    const before = await correctionService.findAttemptSnapshot(id)
    if (change === "scene") {
      await db
        .update(text)
        .set({ content: content + " Outra frase." })
        .where(eq(text.id, g.textId))
    } else if (change === "rubric body") {
      await db
        .update(rubric)
        .set({ content: "New rubric body" })
        .where(eq(rubric.id, g.rubricId))
    } else {
      const rubricId = await rows.insertRubric()
      await db.update(theme).set({ rubricId }).where(eq(theme.id, g.themeId))
    }
    await expect(reserveReading(g.userId, g.textId)).rejects.toThrow(
      "O exercício mudou"
    )
    expect(await correctionService.findAttemptSnapshot(id)).toEqual(before)
    expect(
      await db.select().from(correction).where(eq(correction.textId, g.textId))
    ).toHaveLength(1)
  })
}
