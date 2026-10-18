//* Libraries imports
import { AsyncLocalStorage } from "node:async_hooks"
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as ai from "ai"
import { FatalError } from "workflow"

//* Local imports
import { db } from "@/database"
import { correction, rubric, text, theme } from "@/database/schema"
import { correctionService } from "@/services/correction"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"
import {
  correctText,
  createEmptyCorrection,
  getRubric,
  getText,
} from "@/workflows/correction"
import {
  buildCorrectionPrompt,
  correctionInstructions,
} from "@/workflows/correction-grading"

const rows = createIsolatedRows()
const retiredAt = new Date("2024-01-01T00:00:00.000Z")
const gradedNote = "Nota: 640"

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

type GenerateTextSpy = {
  mock: {
    calls: Array<
      [
        {
          instructions?: string
          prompt?: string
          model?: { modelId?: string }
        },
      ]
    >
  }
  mockImplementation: (implementation: () => Promise<unknown>) => unknown
  mockRestore: () => void
}

const stepContextStorage = (
  globalThis as Record<symbol, AsyncLocalStorage<StepContext> | undefined>
)[Symbol.for("WORKFLOW_STEP_CONTEXT_STORAGE")]

let generateTextSpy: GenerateTextSpy

beforeEach(() => {
  generateTextSpy = spyOn(ai, "generateText").mockImplementation(async () => {
    return gradedModelResult(640) as never
  }) as unknown as GenerateTextSpy
})

afterEach(async () => {
  generateTextSpy.mockRestore()
  await rows.cleanup()
})

function gradedModelResult(score: number) {
  return {
    output: {
      content: gradedNote,
      score,
    },
  }
}

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

function nextStepId() {
  return rows.trackCorrection(`pr9-${crypto.randomUUID()}`)
}

async function captureFatal(run: () => Promise<unknown>) {
  try {
    await run()
  } catch (error) {
    expect(FatalError.is(error)).toBe(true)

    if (!FatalError.is(error)) {
      throw error
    }

    return error
  }

  throw new Error("Expected the correction run to fail.")
}

async function insertOpenText() {
  const rubricId = await rows.insertRubric({
    title: "Scene rubric",
    content: "Score the scene.",
  })
  const themeId = await rows.insertTheme(rubricId, {
    title: "Rooftop",
    description: "Two adults on a roof.",
  })
  const userId = await rows.insertUser()
  const textId = await rows.insertText({
    userId,
    themeId,
    content: "She measured the gap.",
  })

  return {
    rubricId,
    themeId,
    userId,
    textId,
  }
}

function correctionPrompt() {
  return buildCorrectionPrompt({
    themeTitle: "Rooftop",
    themeDescription: "Two adults on a roof.",
    textContent: "She measured the gap.",
    rubricTitle: "Scene rubric",
    rubricContent: "Score the scene.",
  })
}

async function readCorrection(id: string) {
  const stored = await db
    .select({
      content: correction.content,
      score: correction.score,
      textContent: correction.textContent,
      rubricContent: correction.rubricContent,
      status: correction.status,
    })
    .from(correction)
    .where(eq(correction.id, id))

  return stored[0] ?? null
}

async function correctionCount(textId: string) {
  const stored = await db
    .select({ id: correction.id })
    .from(correction)
    .where(eq(correction.textId, textId))

  return stored.length
}

describe("getText", () => {
  it("loads an active text joined to an active theme", async () => {
    const graph = await rows.insertActiveText({
      content: "She measured the gap.",
      themeTitle: "Rooftop",
      themeDescription: "Two adults on a roof.",
    })

    expect(await getText(graph.textId)).toEqual({
      id: graph.textId,
      content: "She measured the gap.",
      themeId: graph.themeId,
      themeTitle: "Rooftop",
      themeDescription: "Two adults on a roof.",
    })
  })

  it("fails with Text not found when the text is soft-deleted", async () => {
    const graph = await rows.insertActiveText({
      textDeletedAt: retiredAt,
    })

    const error = await captureFatal(() => getText(graph.textId))

    expect(error.message).toBe("Text not found")
    expect(await correctionCount(graph.textId)).toBe(0)
  })

  it("fails with Text not found when the theme is soft-deleted", async () => {
    const graph = await rows.insertActiveText({
      textDeletedAt: retiredAt,
      themeDeletedAt: retiredAt,
    })

    const error = await captureFatal(() => getText(graph.textId))

    expect(error.message).toBe("Text not found")
    expect(await correctionCount(graph.textId)).toBe(0)
  })
})

describe("getRubric", () => {
  it("loads the theme's active rubric", async () => {
    const rubricId = await rows.insertRubric({
      title: "Scene rubric",
      content: "Score the scene.",
    })
    const themeId = await rows.insertTheme(rubricId)

    expect(await getRubric(themeId)).toEqual({
      id: rubricId,
      title: "Scene rubric",
      content: "Score the scene.",
    })
  })

  it("fails with Rubric not found when the theme is soft-deleted", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId)

    await db
      .update(theme)
      .set({ deletedAt: retiredAt })
      .where(eq(theme.id, themeId))

    const error = await captureFatal(() => getRubric(themeId))

    expect(error.message).toBe("Rubric not found")
  })

  it("fails with Rubric not found when the rubric is soft-deleted", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId)

    await db
      .update(theme)
      .set({ deletedAt: retiredAt })
      .where(eq(theme.id, themeId))
    await db
      .update(rubric)
      .set({ deletedAt: retiredAt })
      .where(eq(rubric.id, rubricId))

    const error = await captureFatal(() => getRubric(themeId))

    expect(error.message).toBe("Rubric not found")
  })
})

describe("createEmptyCorrection", () => {
  it("inserts a pending row with empty content, score 0.00, and the current bodies under the step id", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    const correctionId = await withStep(stepId, () =>
      createEmptyCorrection({
        textId: graph.textId,
        rubricId: graph.rubricId,
      })
    )

    expect(correctionId).toBe(stepId)
    expect(await readCorrection(stepId)).toEqual({
      content: "",
      score: "0.00",
      textContent: "She measured the gap.",
      rubricContent: "Score the scene.",
      status: "PENDING",
    })
  })
})

describe("correctText", () => {
  it("fails with Correction not created when the step id already exists", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    await rows.insertCorrection({
      id: stepId,
      textId: graph.textId,
      rubricId: graph.rubricId,
      content: "Already stored",
      score: "10.00",
      status: "COMPLETED",
    })

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toBe("Correction not created")
    expect(await correctionCount(graph.textId)).toBe(1)
    expect(await readCorrection(stepId)).toEqual({
      content: "Already stored",
      score: "10.00",
      textContent: "She measured the gap.",
      rubricContent: "Score the scene.",
      status: "COMPLETED",
    })
  })

  it("moves the correction to IN_PROGRESS before grading", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()
    let statusDuringGrading: string | undefined

    generateTextSpy.mockImplementation(async () => {
      statusDuringGrading = (await readCorrection(stepId))?.status
      return gradedModelResult(640)
    })

    await withStep(stepId, () => correctText(graph.textId))

    expect(statusDuringGrading).toBe("IN_PROGRESS")
  })

  it("calls the model with the correction instructions and prompt", async () => {
    const graph = await insertOpenText()

    await withStep(nextStepId(), () => correctText(graph.textId))

    expect(generateTextSpy.mock.calls).toHaveLength(1)
    expect(generateTextSpy.mock.calls[0]?.[0]).toMatchObject({
      instructions: correctionInstructions,
      prompt: correctionPrompt(),
      model: {
        modelId: "gpt-5-mini",
      },
    })
  })

  it("fails with FatalError before save when the score is invalid", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () =>
      gradedModelResult(Number.POSITIVE_INFINITY)
    )

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toBe("Correction score must be a finite number.")
    expect(await readCorrection(stepId)).toMatchObject({
      content: "",
      score: "0.00",
    })
  })

  it("fails with Text not found when the text is gone before save", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () => {
      await db
        .update(text)
        .set({ deletedAt: retiredAt })
        .where(eq(text.id, graph.textId))

      return gradedModelResult(640)
    })

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toBe("Text not found")
    expect(await readCorrection(stepId)).toMatchObject({
      status: "FAILED",
      content: "",
    })
  })

  it("fails with Rubric not found when the rubric is gone before save", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () => {
      const replacementRubricId = await rows.insertRubric({
        title: "Replacement rubric",
        content: "Replacement body",
      })

      await db
        .update(theme)
        .set({ rubricId: replacementRubricId })
        .where(eq(theme.id, graph.themeId))
      await db
        .update(rubric)
        .set({ deletedAt: retiredAt })
        .where(eq(rubric.id, graph.rubricId))

      return gradedModelResult(640)
    })

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toBe("Rubric not found")
    expect(await readCorrection(stepId)).toMatchObject({
      status: "FAILED",
      content: "",
    })
  })

  it("fails when the text changed before the correction was saved", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () => {
      await db
        .update(text)
        .set({ content: "A different ending." })
        .where(eq(text.id, graph.textId))

      return gradedModelResult(640)
    })

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toBe("Text changed before the correction was saved")
    expect(await readCorrection(stepId)).toMatchObject({
      status: "FAILED",
      content: "",
    })
  })

  it("fails when the rubric changed before the correction was saved", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () => {
      await db
        .update(rubric)
        .set({ content: "A different rubric." })
        .where(eq(rubric.id, graph.rubricId))

      return gradedModelResult(640)
    })

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toBe("Rubric changed before the correction was saved")
    expect(await readCorrection(stepId)).toMatchObject({
      status: "FAILED",
      content: "",
    })
  })

  it("stores a completed correction with the frozen text and rubric bodies", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    const saved = await withStep(stepId, () => correctText(graph.textId))

    expect(saved).toEqual({
      correctionId: stepId,
      score: "640.00",
    })
    expect(await readCorrection(stepId)).toEqual({
      content: gradedNote,
      score: "640.00",
      textContent: "She measured the gap.",
      rubricContent: "Score the scene.",
      status: "COMPLETED",
    })
  })

  it("returns the existing id and score when the update writes no row", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()
    const updateSpy = spyOn(
      correctionService,
      "updateCorrection"
    ).mockImplementation(async () => null)

    try {
      const saved = await withStep(stepId, () => correctText(graph.textId))

      expect(saved).toEqual({
        correctionId: stepId,
        score: "0.00",
      })
      expect(await readCorrection(stepId)).toMatchObject({
        content: "",
        score: "0.00",
        status: "IN_PROGRESS",
      })
    } finally {
      updateSpy.mockRestore()
    }
  })

  it("fails with Correction was not saved when the correction is missing after the update", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()
    const updateSpy = spyOn(
      correctionService,
      "updateCorrection"
    ).mockImplementation(async (id: string) => {
      await db.delete(correction).where(eq(correction.id, id))
      return null
    })

    try {
      const error = await captureFatal(() =>
        withStep(stepId, () => correctText(graph.textId))
      )

      expect(error.message).toBe("Correction was not saved")
      expect(await readCorrection(stepId)).toBeNull()
    } finally {
      updateSpy.mockRestore()
    }
  })

  it("stores FAILED when grading fails after the correction row exists", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () =>
      gradedModelResult(Number.POSITIVE_INFINITY)
    )

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toBe("Correction score must be a finite number.")
    expect(await readCorrection(stepId)).toMatchObject({
      status: "FAILED",
      content: "",
      score: "0.00",
    })
  })
})
