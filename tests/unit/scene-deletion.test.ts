//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction, text } from "@/database/schema"
import { textService } from "@/services/text"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

afterEach(async () => {
  await rows.cleanup()
})

async function sceneRow(textId: string) {
  const [scene] = await db.select().from(text).where(eq(text.id, textId))
  return scene
}

async function correctionRows(textId: string) {
  return db
    .select()
    .from(correction)
    .where(eq(correction.textId, textId))
    .orderBy(correction.createdAt)
}

describe("textService scene retirement", () => {
  it("retires the scene without changing its readings and restores both", async () => {
    const graph = await rows.insertActiveText({
      content: "A chave ficou na mesa.",
      themeTitle: "A chave na mesa",
    })
    const correctionId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "A leitura original.",
      score: "640.00",
      textContent: "A chave ficou na mesa.",
      status: "COMPLETED",
    })
    const before = await correctionRows(graph.textId)

    const retired = await textService.retireOwnedScene(
      graph.textId,
      graph.userId
    )
    expect(retired.status).toBe("retired")
    const hidden = await sceneRow(graph.textId)
    expect(hidden?.deletedAt).not.toBeNull()
    expect(hidden?.content).toBe("A chave ficou na mesa.")
    expect(await correctionRows(graph.textId)).toEqual(before)
    expect(await textService.listOwnedTexts(graph.userId)).toEqual([])
    expect(
      (await textService.listUndoableScenes(graph.userId)).map((scene) => scene.id)
    ).toEqual([graph.textId])

    expect(
      await textService.restoreOwnedScene(graph.textId, graph.userId)
    ).toEqual({ status: "restored" })
    const restored = await sceneRow(graph.textId)
    expect(restored?.deletedAt).toBeNull()
    expect(restored?.content).toBe("A chave ficou na mesa.")
    expect(await correctionRows(graph.textId)).toEqual(before)
    const listed = await textService.listOwnedTexts(graph.userId)
    expect(listed.map((scene) => scene.id)).toEqual([graph.textId])
    expect(listed[0]?.correction).toEqual({
      status: "COMPLETED",
      score: "640.00",
    })
    expect(await textService.listUndoableScenes(graph.userId)).toEqual([])
    expect(correctionId).toBe(before[0]?.id)
  })

  it("leaves an in-progress reading running until the scene stays deleted", async () => {
    const graph = await rows.insertActiveText()
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      status: "IN_PROGRESS",
      content: "",
      score: "0.00",
    })
    const before = await correctionRows(graph.textId)

    await textService.retireOwnedScene(graph.textId, graph.userId)
    expect(await correctionRows(graph.textId)).toEqual(before)
    const [notice] = await textService.listUndoableScenes(graph.userId)
    expect(notice?.readingInProgress).toBe(true)

    await textService.restoreOwnedScene(graph.textId, graph.userId)
    const after = await correctionRows(graph.textId)
    expect(after).toEqual(before)
    expect(after[0]?.status).toBe("IN_PROGRESS")
  })

  it("keeps the retirement after the undo window and still accepts the last click", async () => {
    const graph = await rows.insertActiveText()
    const now = new Date("2026-11-06T15:00:00.000Z")
    await db
      .update(text)
      .set({ deletedAt: new Date(now.getTime() - 9_000) })
      .where(eq(text.id, graph.textId))

    expect(await textService.listUndoableScenes(graph.userId, now)).toEqual([])
    expect(
      await textService.restoreOwnedScene(graph.textId, graph.userId, now)
    ).toEqual({ status: "restored" })

    await db
      .update(text)
      .set({ deletedAt: new Date(now.getTime() - 11_000) })
      .where(eq(text.id, graph.textId))
    expect(
      await textService.restoreOwnedScene(graph.textId, graph.userId, now)
    ).toEqual({ status: "expired" })
    expect((await sceneRow(graph.textId))?.deletedAt).not.toBeNull()
    expect(await correctionRows(graph.textId)).toEqual([])
  })

  it("does not retire another person's scene or extend the window with a second request", async () => {
    const graph = await rows.insertActiveText()
    const otherUserId = await rows.insertUser()

    expect(
      await textService.retireOwnedScene(graph.textId, otherUserId)
    ).toEqual({ status: "missing" })
    expect((await sceneRow(graph.textId))?.deletedAt).toBeNull()

    const retired = await textService.retireOwnedScene(
      graph.textId,
      graph.userId
    )
    expect(retired.status).toBe("retired")
    expect(
      await textService.retireOwnedScene(graph.textId, graph.userId)
    ).toEqual({ status: "missing" })
    if (retired.status !== "retired") throw new Error("Scene was not retired")
    expect((await sceneRow(graph.textId))?.deletedAt).toEqual(retired.deletedAt)
  })

  it("drops a retired draft from the exercise continuation until it is restored", async () => {
    const graph = await rows.insertActiveText({
      content: "Rascunho ainda sem leitura.",
    })

    expect(
      await textService.findDraftForTheme(graph.userId, graph.themeId)
    ).toMatchObject({ id: graph.textId })

    await textService.retireOwnedScene(graph.textId, graph.userId)
    expect(
      await textService.findDraftForTheme(graph.userId, graph.themeId)
    ).toBeNull()

    await textService.restoreOwnedScene(graph.textId, graph.userId)
    expect(
      await textService.findDraftForTheme(graph.userId, graph.themeId)
    ).toMatchObject({
      id: graph.textId,
      content: "Rascunho ainda sem leitura.",
    })
  })
})
