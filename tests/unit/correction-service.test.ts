//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction } from "@/database/schema"
import { correctionService } from "@/services/correction"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

afterEach(async () => {
  await rows.cleanup()
})

async function expectExistingCorrectionIdInsertsNothing() {
  const graph = await rows.insertActiveText()
  const id = rows.trackCorrection()
  const values = {
    id,
    textId: graph.textId,
    rubricId: graph.rubricId,
    textContent: "Frozen text",
    rubricContent: "Frozen rubric",
    status: "PENDING" as const,
  }

  expect(
    await correctionService.insertCorrection({
      ...values,
      content: "First note",
      score: "1.00",
    })
  ).toEqual({
    id,
    score: "1.00",
    status: "PENDING",
  })

  expect(
    await correctionService.insertCorrection({
      ...values,
      content: "Second note",
      score: "2.00",
    })
  ).toBeNull()

  const stored = await db
    .select({
      content: correction.content,
      score: correction.score,
    })
    .from(correction)
    .where(eq(correction.id, id))

  expect(stored).toEqual([{ content: "First note", score: "1.00" }])
}

describe("correctionService.insertCorrection", () => {
  it("inserts the correction", async () => {
    const graph = await rows.insertActiveText()
    const id = rows.trackCorrection()

    const inserted = await correctionService.insertCorrection({
      id,
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "Opening note",
      score: "42.00",
      textContent: "Frozen text",
      rubricContent: "Frozen rubric",
      status: "PENDING",
    })

    expect(inserted).toEqual({
      id,
      score: "42.00",
      status: "PENDING",
    })
  })

  it("returns no row when the id already exists", async () => {
    await expectExistingCorrectionIdInsertsNothing()
  })
})

describe("correctionService.findCorrectionById", () => {
  it("returns the row by id, including a soft-deleted row", async () => {
    const graph = await rows.insertActiveText()
    const activeId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "10.00",
      status: "COMPLETED",
    })
    const deletedId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "20.00",
      status: "FAILED",
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(await correctionService.findCorrectionById(activeId)).toEqual({
      id: activeId,
      score: "10.00",
      status: "COMPLETED",
    })
    expect(await correctionService.findCorrectionById(deletedId)).toEqual({
      id: deletedId,
      score: "20.00",
      status: "FAILED",
    })
  })

  it("returns null when the id is missing", async () => {
    expect(
      await correctionService.findCorrectionById(`pr6-${crypto.randomUUID()}`)
    ).toBeNull()
  })
})

describe("correctionService.findLatestActiveCorrection", () => {
  it("returns the newest active correction for the text", async () => {
    const graph = await rows.insertActiveText()

    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "Older note",
      score: "10.00",
      textContent: "Older text",
      status: "COMPLETED",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "Newer note",
      score: "20.00",
      textContent: "Newer text",
      status: "IN_PROGRESS",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "Deleted note",
      score: "30.00",
      textContent: "Deleted text",
      status: "FAILED",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      deletedAt: new Date("2026-01-02T00:00:00.000Z"),
    })

    expect(
      await correctionService.findLatestActiveCorrection(graph.textId)
    ).toEqual({
      content: "Newer note",
      score: "20.00",
      textContent: "Newer text",
      status: "IN_PROGRESS",
    })
  })

  it("returns null when every correction for the text is soft-deleted", async () => {
    const graph = await rows.insertActiveText()

    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      deletedAt: new Date("2024-01-01T00:00:00.000Z"),
    })

    expect(
      await correctionService.findLatestActiveCorrection(graph.textId)
    ).toBeNull()
  })
})

describe("correctionService.updateCorrectionStatus", () => {
  it("writes the status", async () => {
    const graph = await rows.insertActiveText()
    const id = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      status: "PENDING",
    })

    await correctionService.updateCorrectionStatus(id, "IN_PROGRESS")

    const stored = await db
      .select({ status: correction.status })
      .from(correction)
      .where(eq(correction.id, id))

    expect(stored).toEqual([{ status: "IN_PROGRESS" }])
  })
})

describe("correctionService.updateCorrection", () => {
  it("writes the content, score, frozen text, frozen rubric, and status", async () => {
    const graph = await rows.insertActiveText()
    const nextRubricId = await rows.insertRubric({
      title: "Later rubric",
      content: "Later rubric body",
    })
    const id = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "Pending note",
      score: "0.00",
      textContent: "",
      rubricContent: "",
      status: "PENDING",
    })

    const updated = await correctionService.updateCorrection(id, {
      content: "Finished note",
      score: "640.50",
      textContent: "Frozen text body",
      rubricId: nextRubricId,
      rubricContent: "Frozen rubric body",
      status: "COMPLETED",
    })

    expect(updated).toEqual({
      id,
      score: "640.50",
      status: "COMPLETED",
    })

    const stored = await db
      .select({
        content: correction.content,
        score: correction.score,
        textContent: correction.textContent,
        rubricId: correction.rubricId,
        rubricContent: correction.rubricContent,
        status: correction.status,
      })
      .from(correction)
      .where(eq(correction.id, id))

    expect(stored).toEqual([
      {
        content: "Finished note",
        score: "640.50",
        textContent: "Frozen text body",
        rubricId: nextRubricId,
        rubricContent: "Frozen rubric body",
        status: "COMPLETED",
      },
    ])
  })
})
