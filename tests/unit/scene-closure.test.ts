//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction, text } from "@/database/schema"
import { correctionService } from "@/services/correction"
import { reserveReading, saveScene } from "@/services/reading"
import { textService } from "@/services/text"
import {
  createIsolatedRows,
  expectPostgresError,
} from "@/tests/helpers/schema-fixtures"
import { insertCompletedStructuredReading } from "@/tests/helpers/structured-reading"

const rows = createIsolatedRows()

afterEach(() => rows.cleanup())

async function ownedScene() {
  return rows.insertActiveText({ content: "Cena congelada." })
}

async function complete(
  graph: Awaited<ReturnType<typeof ownedScene>>,
  score = "640.00"
) {
  return rows.insertCorrection({
    textId: graph.textId,
    rubricId: graph.rubricId,
    score,
    status: "COMPLETED",
    textContent: "Cena congelada.",
  })
}

async function storedCorrection(id: string) {
  const [row] = await db
    .select({
      content: correction.content,
      score: correction.score,
      textContent: correction.textContent,
      status: correction.status,
      openedAt: correction.openedAt,
      updatedAt: correction.updatedAt,
    })
    .from(correction)
    .where(eq(correction.id, id))
  return row
}

describe("textService.closeOwnedScene", () => {
  it("closes a finished scene at a low score without changing its versions", async () => {
    const graph = await ownedScene()
    const first = await complete(graph, "10.00")
    const second = await complete(graph, "10.00")
    const before = [
      await storedCorrection(first),
      await storedCorrection(second),
    ]

    const closed = await textService.closeOwnedScene(graph.textId, graph.userId)

    expect(closed.status).toBe("closed")
    const [scene] = await db
      .select({ closedAt: text.closedAt, content: text.content })
      .from(text)
      .where(eq(text.id, graph.textId))
    expect(scene?.closedAt).toBeInstanceOf(Date)
    expect(scene?.content).toBe("Cena congelada.")
    expect([
      await storedCorrection(first),
      await storedCorrection(second),
    ]).toEqual(before)
    const listed = await textService.listOwnedTexts(graph.userId)
    expect(listed[0]).toMatchObject({
      situation: "closed",
      label: "Encerrada · Ausente",
      versionCount: 2,
    })
  })

  it("refuses to close a draft, a reading in progress, or someone else's scene", async () => {
    const draft = await ownedScene()
    const pending = await ownedScene()
    await rows.insertCorrection({
      textId: pending.textId,
      rubricId: pending.rubricId,
      status: "PENDING",
    })
    const other = await ownedScene()
    await complete(other)

    expect(
      (await textService.closeOwnedScene(draft.textId, draft.userId)).status
    ).toBe("unavailable")
    expect(
      (await textService.closeOwnedScene(pending.textId, pending.userId)).status
    ).toBe("unavailable")
    expect(
      (await textService.closeOwnedScene(other.textId, draft.userId)).status
    ).toBe("missing")
  })

  it("reopens a closed scene and leaves the versions in place", async () => {
    const graph = await ownedScene()
    const correctionId = await complete(graph)
    await textService.closeOwnedScene(graph.textId, graph.userId)
    const before = await storedCorrection(correctionId)

    const reopened = await textService.reopenOwnedScene(
      graph.textId,
      graph.userId
    )

    expect(reopened.status).toBe("reopened")
    expect(
      (await textService.reopenOwnedScene(graph.textId, graph.userId)).status
    ).toBe("open")
    const [scene] = await db
      .select({ closedAt: text.closedAt })
      .from(text)
      .where(eq(text.id, graph.textId))
    expect(scene?.closedAt).toBeNull()
    expect(await storedCorrection(correctionId)).toEqual(before)
  })

  it("allows the next revision after the scene is reopened", async () => {
    const content = "Uma cena. ".repeat(20)
    const graph = await rows.insertActiveText({ content })
    await insertCompletedStructuredReading(rows, {
      textId: graph.textId,
      rubricId: graph.rubricId,
    })
    await textService.closeOwnedScene(graph.textId, graph.userId)
    const revised = `${content}\n\nEla atravessou.`

    await expect(
      saveScene(graph.userId, graph.themeId, revised, graph.textId)
    ).rejects.toThrow("está encerrada")
    await textService.reopenOwnedScene(graph.textId, graph.userId)

    await expect(
      saveScene(graph.userId, graph.themeId, revised, graph.textId)
    ).resolves.toEqual({ id: graph.textId })
  })

  it("blocks edits and new readings while the scene stays closed", async () => {
    const graph = await ownedScene()
    await complete(graph)
    await textService.closeOwnedScene(graph.textId, graph.userId)

    await expect(
      saveScene(graph.userId, graph.themeId, "Mudou.", graph.textId)
    ).rejects.toThrow("está encerrada")
    await expect(reserveReading(graph.userId, graph.textId)).rejects.toThrow(
      "está encerrada"
    )
    const [scene] = await db
      .select({ content: text.content })
      .from(text)
      .where(eq(text.id, graph.textId))
    expect(scene?.content).toBe("Cena congelada.")
  })
})

describe("correctionService.markReadingOpened", () => {
  it("records the first opening without changing the frozen reading", async () => {
    const graph = await ownedScene()
    const correctionId = await complete(graph)
    const before = await storedCorrection(correctionId)

    await correctionService.markReadingOpened(correctionId, graph.userId)
    const opened = await storedCorrection(correctionId)
    await correctionService.markReadingOpened(correctionId, graph.userId)
    const again = await storedCorrection(correctionId)

    expect(before?.openedAt).toBeNull()
    expect(opened?.openedAt).toBeInstanceOf(Date)
    expect(again?.openedAt?.toISOString()).toBe(opened?.openedAt?.toISOString())
    expect(opened).toMatchObject({
      content: before?.content,
      score: "640.00",
      textContent: "Cena congelada.",
      status: "COMPLETED",
      updatedAt: before?.updatedAt,
    })
  })

  it("does not open a reading for another person or a reading that is not completed", async () => {
    const graph = await ownedScene()
    const other = await ownedScene()
    const completed = await complete(graph)
    const failed = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      status: "FAILED",
      createdAt: new Date(),
    })

    await correctionService.markReadingOpened(completed, other.userId)
    await correctionService.markReadingOpened(failed, graph.userId)

    expect((await storedCorrection(completed))?.openedAt).toBeNull()
    expect((await storedCorrection(failed))?.openedAt).toBeNull()
    await expectPostgresError(
      () =>
        db
          .update(correction)
          .set({ openedAt: new Date("2030-01-01T00:00:00.000Z") })
          .where(eq(correction.id, failed)),
      "23514",
      "correction_opened_when_completed"
    )
  })

  it("rejects a second change to the open time and a change to the score", async () => {
    const graph = await ownedScene()
    const correctionId = await complete(graph)
    await correctionService.markReadingOpened(correctionId, graph.userId)

    await expectPostgresError(
      () =>
        db
          .update(correction)
          .set({ openedAt: new Date("2030-01-01T00:00:00.000Z") })
          .where(eq(correction.id, correctionId)),
      "23514",
      "correction_immutable_opened_at"
    )
    await expectPostgresError(
      () =>
        db
          .update(correction)
          .set({ score: "1.00" })
          .where(eq(correction.id, correctionId)),
      "23514",
      "correction_immutable_result"
    )
  })
})
