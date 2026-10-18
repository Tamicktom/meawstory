//* Libraries imports
import { AsyncLocalStorage } from "node:async_hooks"
import { afterEach, describe, expect, it } from "bun:test"
import { eq, inArray } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { correction, rubric, text, theme } from "@/database/schema"
import { createEmptyCorrection } from "@/workflows/correction"
import {
  createIsolatedRows,
  expectPostgresError,
} from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
const retiredAt = new Date("2024-01-01T00:00:00.000Z")

type StepContext = {
  stepMetadata: {
    stepId: string
    stepName: string
    stepStartedAt: Date
    attempt: number
  }
  workflowMetadata: {
    workflowName: string
    workflowRunId: string
    workflowStartedAt: Date
    url: string
    features: { encryption: boolean }
  }
  preCompletionOps: Promise<void>[]
}

const stepContextStorage = (
  globalThis as Record<symbol, AsyncLocalStorage<StepContext> | undefined>
)[Symbol.for("WORKFLOW_STEP_CONTEXT_STORAGE")]

afterEach(async () => {
  await rows.cleanup()
})

function withStep<T>(stepId: string, run: () => Promise<T>): Promise<T> {
  if (!stepContextStorage) {
    throw new Error("Workflow step context is not available.")
  }

  return stepContextStorage.run(
    {
      stepMetadata: {
        stepId,
        stepName: "createEmptyCorrection",
        stepStartedAt: new Date(),
        attempt: 1,
      },
      workflowMetadata: {
        workflowName: "correctText",
        workflowRunId: stepId,
        workflowStartedAt: new Date(),
        url: "http://localhost/workflow",
        features: { encryption: false },
      },
      preCompletionOps: [],
    },
    run
  )
}

async function insertOpenText(content: string, rubricContent: string) {
  const rubricId = await rows.insertRubric({ content: rubricContent })
  const themeId = await rows.insertTheme(rubricId)
  const userId = await rows.insertUser()
  const textId = await rows.insertText({ userId, themeId, content })

  return { rubricId, themeId, userId, textId }
}

describe("correction insert", () => {
  it("rejects text_content or rubric_content that differs from the current rows", async () => {
    const graph = await insertOpenText(
      "Current text body",
      "Current rubric body"
    )

    await expectPostgresError(
      () =>
        db.insert(correction).values({
          id: rows.trackCorrection(),
          textId: graph.textId,
          rubricId: graph.rubricId,
          content: "",
          score: "0.00",
          textContent: "A different text body",
          rubricContent: "Current rubric body",
          status: "PENDING",
        }),
      "23514",
      "correction_frozen_bodies"
    )
    await expectPostgresError(
      () =>
        db.insert(correction).values({
          id: rows.trackCorrection(),
          textId: graph.textId,
          rubricId: graph.rubricId,
          content: "",
          score: "0.00",
          textContent: "Current text body",
          rubricContent: "A different rubric body",
          status: "PENDING",
        }),
      "23514",
      "correction_frozen_bodies"
    )

    const stored = await db
      .select({ id: correction.id })
      .from(correction)
      .where(eq(correction.textId, graph.textId))

    expect(stored).toEqual([])
  })
})

describe("retiring a rubric", () => {
  it("rejects the retirement when an active theme still points at it", async () => {
    const rubricId = await rows.insertRubric()
    await rows.insertTheme(rubricId)

    await expectPostgresError(
      () =>
        db
          .update(rubric)
          .set({ deletedAt: retiredAt })
          .where(eq(rubric.id, rubricId)),
      "23514",
      "rubric_retire_active_theme"
    )

    const stored = await db
      .select({ deletedAt: rubric.deletedAt })
      .from(rubric)
      .where(eq(rubric.id, rubricId))

    expect(stored).toEqual([{ deletedAt: null }])
  })
})

describe("retiring a theme", () => {
  it("rejects the retirement when an active text still points at it", async () => {
    const graph = await insertOpenText("Still active", "Still active rubric")

    await expectPostgresError(
      () =>
        db
          .update(theme)
          .set({ deletedAt: retiredAt })
          .where(eq(theme.id, graph.themeId)),
      "23514",
      "theme_retire_active_text"
    )

    const stored = await db
      .select({ deletedAt: theme.deletedAt })
      .from(theme)
      .where(eq(theme.id, graph.themeId))

    expect(stored).toEqual([{ deletedAt: null }])
  })
})

describe("theme rubric", () => {
  it("rejects a new theme or a rubric change when the rubric is missing or retired", async () => {
    const activeRubricId = await rows.insertRubric()
    const retiredRubricId = await rows.insertRubric({ deletedAt: retiredAt })
    const themeId = await rows.insertTheme(activeRubricId)
    const missingRubricId = `missing-${crypto.randomUUID()}`

    await expectPostgresError(
      () => rows.insertTheme(retiredRubricId),
      "23514",
      "theme_active_rubric"
    )
    await expectPostgresError(
      () => rows.insertTheme(missingRubricId),
      "23514",
      "theme_active_rubric"
    )
    await expectPostgresError(
      () =>
        db
          .update(theme)
          .set({ rubricId: retiredRubricId })
          .where(eq(theme.id, themeId)),
      "23514",
      "theme_active_rubric"
    )
    await expectPostgresError(
      () =>
        db
          .update(theme)
          .set({ rubricId: missingRubricId })
          .where(eq(theme.id, themeId)),
      "23514",
      "theme_active_rubric"
    )

    const stored = await db
      .select({ rubricId: theme.rubricId })
      .from(theme)
      .where(eq(theme.id, themeId))

    expect(stored).toEqual([{ rubricId: activeRubricId }])
  })
})

describe("text theme", () => {
  it("rejects a new text or a theme change when the theme is missing or retired", async () => {
    const rubricId = await rows.insertRubric()
    const activeThemeId = await rows.insertTheme(rubricId)
    const retiredThemeId = await rows.insertTheme(rubricId, {
      deletedAt: retiredAt,
    })
    const userId = await rows.insertUser()
    const textId = await rows.insertText({
      userId,
      themeId: activeThemeId,
      content: "Written for the active theme",
    })
    const missingThemeId = `missing-${crypto.randomUUID()}`

    await expectPostgresError(
      () =>
        rows.insertText({
          userId,
          themeId: retiredThemeId,
          content: "Written for a retired theme",
        }),
      "23514",
      "text_active_theme"
    )
    await expectPostgresError(
      () =>
        rows.insertText({
          userId,
          themeId: missingThemeId,
          content: "Written for a missing theme",
        }),
      "23514",
      "text_active_theme"
    )
    await expectPostgresError(
      () =>
        db
          .update(text)
          .set({ themeId: retiredThemeId })
          .where(eq(text.id, textId)),
      "23514",
      "text_active_theme"
    )
    await expectPostgresError(
      () =>
        db
          .update(text)
          .set({ themeId: missingThemeId })
          .where(eq(text.id, textId)),
      "23514",
      "text_active_theme"
    )

    const stored = await db
      .select({ themeId: text.themeId })
      .from(text)
      .where(eq(text.id, textId))

    expect(stored).toEqual([{ themeId: activeThemeId }])
  })
})

describe("correction targets", () => {
  it("rejects a new correction when its text or its rubric is missing or retired", async () => {
    const graph = await insertOpenText(
      "Current text body",
      "Current rubric body"
    )
    const retiredRubricId = await rows.insertRubric({
      content: "Retired rubric body",
      deletedAt: retiredAt,
    })
    const retiredTextId = await rows.insertText({
      userId: graph.userId,
      themeId: graph.themeId,
      content: "Retired text body",
      deletedAt: retiredAt,
    })
    const missingTextId = `missing-${crypto.randomUUID()}`
    const missingRubricId = `missing-${crypto.randomUUID()}`

    await expectPostgresError(
      () =>
        db.insert(correction).values({
          id: rows.trackCorrection(),
          textId: retiredTextId,
          rubricId: graph.rubricId,
          content: "",
          score: "0.00",
          textContent: "Retired text body",
          rubricContent: "Current rubric body",
          status: "PENDING",
        }),
      "23514",
      "correction_active_text"
    )
    await expectPostgresError(
      () =>
        db.insert(correction).values({
          id: rows.trackCorrection(),
          textId: missingTextId,
          rubricId: graph.rubricId,
          content: "",
          score: "0.00",
          textContent: "Current text body",
          rubricContent: "Current rubric body",
          status: "PENDING",
        }),
      "23514",
      "correction_active_text"
    )
    await expectPostgresError(
      () =>
        db.insert(correction).values({
          id: rows.trackCorrection(),
          textId: graph.textId,
          rubricId: retiredRubricId,
          content: "",
          score: "0.00",
          textContent: "Current text body",
          rubricContent: "Retired rubric body",
          status: "PENDING",
        }),
      "23514",
      "correction_active_rubric"
    )
    await expectPostgresError(
      () =>
        db.insert(correction).values({
          id: rows.trackCorrection(),
          textId: graph.textId,
          rubricId: missingRubricId,
          content: "",
          score: "0.00",
          textContent: "Current text body",
          rubricContent: "Current rubric body",
          status: "PENDING",
        }),
      "23514",
      "correction_active_rubric"
    )

    const stored = await db
      .select({ id: correction.id })
      .from(correction)
      .where(inArray(correction.textId, [graph.textId, retiredTextId]))

    expect(stored).toEqual([])
  })
})

describe("createEmptyCorrection", () => {
  it("stores the current text body and rubric body on the pending row", async () => {
    const graph = await insertOpenText("Text in force", "Rubric in force")
    const stepId = `pr7-${crypto.randomUUID()}`

    rows.trackCorrection(stepId)

    const correctionId = await withStep(stepId, () =>
      createEmptyCorrection({
        textId: graph.textId,
        rubricId: graph.rubricId,
      })
    )

    expect(correctionId).toBe(stepId)

    const stored = await db
      .select({
        content: correction.content,
        score: correction.score,
        textContent: correction.textContent,
        rubricContent: correction.rubricContent,
        status: correction.status,
      })
      .from(correction)
      .where(eq(correction.id, stepId))

    expect(stored).toEqual([
      {
        content: "",
        score: "0.00",
        textContent: "Text in force",
        rubricContent: "Rubric in force",
        status: "PENDING",
      },
    ])
  })
})
