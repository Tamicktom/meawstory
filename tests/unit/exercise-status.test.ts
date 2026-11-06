import { describe, expect, it } from "bun:test"
import { exerciseStatus } from "@/lib/exercise-status"
import type { CorrectionStatus } from "@/database/schema"

const scene = (
  id: string,
  closedAt: Date | null = null,
  statuses: CorrectionStatus[] = [],
  updatedAt = new Date()
) => ({
  id,
  closedAt,
  updatedAt,
  corrections: statuses.map((status) => ({ status })),
})

describe("exerciseStatus", () => {
  it("distinguishes unwritten, draft and closed", () => {
    expect(exerciseStatus([])).toEqual({
      situation: "unwritten",
      sceneId: null,
    })
    expect(exerciseStatus([scene("draft")])).toEqual({
      situation: "draft",
      sceneId: "draft",
    })
    expect(
      exerciseStatus([scene("closed", new Date(), ["COMPLETED"])])
    ).toEqual({ situation: "closed", sceneId: "closed" })
  })
  it.each(["PENDING", "IN_PROGRESS", "FAILED", "COMPLETED"] as const)(
    "keeps submitted, unclosed scenes in review: %s",
    (status) => {
      expect(exerciseStatus([scene("review", null, [status])]).situation).toBe(
        "revising"
      )
    }
  )
  it("prioritizes an open scene over a more recently closed scene", () => {
    expect(
      exerciseStatus([
        scene("closed", new Date(), ["COMPLETED"], new Date("2026-11-06")),
        scene("draft", null, [], new Date("2026-11-01")),
      ]).sceneId
    ).toBe("draft")
  })
  it("selects the most recently updated scene within the same group", () => {
    const older = scene("older", null, [], new Date("2026-11-01"))
    const newer = scene("newer", null, ["COMPLETED"], new Date("2026-11-06"))
    expect(exerciseStatus([older, newer])).toEqual({
      situation: "revising",
      sceneId: "newer",
    })
    expect(
      exerciseStatus([
        { ...older, closedAt: new Date() },
        { ...newer, closedAt: new Date() },
      ]).sceneId
    ).toBe("newer")
  })
})
