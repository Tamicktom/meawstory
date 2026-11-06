//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction, text } from "@/database/schema"
import { correctionService } from "@/services/correction"
import { reserveReading, saveScene } from "@/services/reading"
import {
  createIsolatedRows,
  expectPostgresError,
} from "@/tests/helpers/schema-fixtures"
import {
  insertCompletedStructuredReading,
  structuredReadingResult,
} from "@/tests/helpers/structured-reading"
import { buildCorrectionPrompt } from "@/workflows/correction-grading"

const rows = createIsolatedRows()
const original = "Uma cena. ".repeat(60).trim() + "\n\nOutro parágrafo."
const revised = original + "\n\nEla atravessou o pátio."
const intention = "Quis mostrar o custo no gesto da travessia."

afterEach(() => rows.cleanup())

async function completedScene() {
  const graph = await rows.insertActiveText({ content: original })
  const readingId = await insertCompletedStructuredReading(rows, {
    textId: graph.textId,
    rubricId: graph.rubricId,
  })
  return { ...graph, readingId }
}

describe("scene versions", () => {
  it("saves the next draft without changing the completed reading", async () => {
    const scene = await completedScene()
    const before = await correctionService.findAttemptSnapshot(scene.readingId)

    await saveScene(scene.userId, scene.themeId, revised, scene.textId, {
      revisionIntent: intention,
    })

    const [draft] = await db
      .select()
      .from(text)
      .where(eq(text.id, scene.textId))
    expect(draft.content).toBe(revised)
    expect(draft.revisionIntent).toBe(intention)
    expect(
      await correctionService.findAttemptSnapshot(scene.readingId)
    ).toEqual(before)
  })

  it("reserves the revised scene as a new version and leaves the previous one frozen", async () => {
    const scene = await completedScene()
    await saveScene(scene.userId, scene.themeId, revised, scene.textId, {
      revisionIntent: `  ${intention}  `,
    })

    const nextId = rows.trackCorrection(
      await reserveReading(scene.userId, scene.textId, revised)
    )
    const readings = await db
      .select()
      .from(correction)
      .where(eq(correction.textId, scene.textId))
    const previous = readings.find((item) => item.id === scene.readingId)
    const next = readings.find((item) => item.id === nextId)
    const [draft] = await db
      .select()
      .from(text)
      .where(eq(text.id, scene.textId))

    expect(previous?.textContent).toBe(original)
    expect(previous?.structuredResult).toEqual(structuredReadingResult())
    expect(previous?.revisionIntent).toBeNull()
    expect(next?.textContent).toBe(revised)
    expect(next?.status).toBe("PENDING")
    expect(next?.revisionIntent).toBe(intention)
    expect(draft.revisionIntent).toBeNull()
    expect(draft.content).toBe(revised)
  })

  it("locks the new version while it is being read", async () => {
    const scene = await completedScene()
    await saveScene(scene.userId, scene.themeId, revised, scene.textId)
    rows.trackCorrection(await reserveReading(scene.userId, scene.textId))

    await expect(
      saveScene(
        scene.userId,
        scene.themeId,
        revised + " Mudança.",
        scene.textId
      )
    ).rejects.toThrow("já tem uma leitura")
    const [draft] = await db
      .select()
      .from(text)
      .where(eq(text.id, scene.textId))
    expect(draft.content).toBe(revised)
  })

  it("does not count a failed attempt as a version and retries its frozen intention", async () => {
    const scene = await completedScene()
    await saveScene(scene.userId, scene.themeId, revised, scene.textId, {
      revisionIntent: intention,
    })
    const failedId = rows.trackCorrection(
      await reserveReading(scene.userId, scene.textId)
    )
    await correctionService.updateCorrectionStatus(failedId, "FAILED", {
      stage: "validation",
      reason: "teste",
    })

    expect(
      await correctionService.listCompletedVersions(scene.textId)
    ).toHaveLength(1)
    const retryId = rows.trackCorrection(
      await reserveReading(scene.userId, scene.textId)
    )
    await correctionService.updateCorrection(retryId, {
      status: "COMPLETED",
      score: "10.00",
    })
    const versions = await correctionService.listCompletedVersions(scene.textId)
    const retry = versions.find((item) => item.id === retryId)

    expect(versions.map((item) => item.version)).toEqual([1, 2])
    expect(retry?.revisionIntent).toBe(intention)
    expect(retry?.textContent).toBe(revised)
    expect(versions[0]?.textContent).toBe(original)
    expect(versions[0]?.revisionIntent).toBeNull()
  })

  it("omits a blank intention and ignores one on the first version", async () => {
    const first = await rows.insertActiveText({ content: original })
    await saveScene(first.userId, first.themeId, original, first.textId, {
      revisionIntent: intention,
    })
    const firstReading = rows.trackCorrection(
      await reserveReading(first.userId, first.textId)
    )
    expect(
      (await correctionService.findAttemptSnapshot(firstReading))
        ?.revisionIntent
    ).toBeNull()

    const scene = await completedScene()
    await saveScene(scene.userId, scene.themeId, revised, scene.textId, {
      revisionIntent: "   ",
    })
    const nextId = rows.trackCorrection(
      await reserveReading(scene.userId, scene.textId)
    )
    expect(
      (await correctionService.findAttemptSnapshot(nextId))?.revisionIntent
    ).toBeNull()
  })

  it("rejects an intention longer than 2000 characters", async () => {
    const scene = await completedScene()
    await expect(
      saveScene(scene.userId, scene.themeId, revised, scene.textId, {
        revisionIntent: "a".repeat(2001),
      })
    ).rejects.toThrow("2.000")
  })

  it("keeps the intention out of the reading prompt and freezes it on the attempt", async () => {
    const scene = await completedScene()
    await saveScene(scene.userId, scene.themeId, revised, scene.textId, {
      revisionIntent: intention,
    })
    const nextId = rows.trackCorrection(
      await reserveReading(scene.userId, scene.textId)
    )
    const stored = await correctionService.findAttemptSnapshot(nextId)
    if (!stored?.source || !stored.rubricCriteria)
      throw new Error("The reserved reading has no frozen source.")
    const prompt = buildCorrectionPrompt({
      themeTitle: stored.source.themeTitle,
      themeDescription: stored.source.themeDescription,
      rubricTitle: stored.source.rubricTitle,
      rubricContent: stored.rubricContent,
      textContent: stored.textContent,
      criteria: stored.rubricCriteria,
    })

    expect(stored.revisionIntent).toBe(intention)
    expect(prompt).not.toContain(intention)
    await expectPostgresError(
      () =>
        db
          .update(correction)
          .set({ revisionIntent: "Outra intenção." })
          .where(eq(correction.id, nextId)),
      "23514",
      "correction_immutable_snapshot"
    )
  })
})
