import { correctionConfiguration } from "@/workflows/correction-config"
//* Libraries imports
import { AsyncLocalStorage } from "node:async_hooks"
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as ai from "ai"
import { FatalError } from "workflow"

//* Local imports
import { db } from "@/database"
import { correction, readingCall, rubric, text, theme } from "@/database/schema"
import { renderReadingMarkdown } from "@/lib/reading-markdown"
import { correctionService } from "@/services/correction"
import {
  actionCriteria,
  createIsolatedRows,
  expectPostgresError,
} from "@/tests/helpers/schema-fixtures"
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
const SCENE = "She measured the gap."
const QUOTE = "She measured the gap"
const SPLIT_640 = [96, 128, 128, 160, 128]

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
  mockImplementation: (
    implementation: (input?: { prompt?: string }) => Promise<unknown>
  ) => unknown
  mockRestore: () => void
}

const stepContextStorage = (
  globalThis as Record<symbol, AsyncLocalStorage<StepContext> | undefined>
)[Symbol.for("WORKFLOW_STEP_CONTEXT_STORAGE")]

let generateTextSpy: GenerateTextSpy

beforeEach(() => {
  generateTextSpy = spyOn(ai, "generateText").mockImplementation(async () => {
    return gradedModelResult() as never
  }) as unknown as GenerateTextSpy
})

afterEach(async () => {
  generateTextSpy.mockRestore()
  await rows.cleanup()
})

function modelReply(scores: number[] = SPLIT_640, evidence = QUOTE) {
  return {
    criteria: actionCriteria.map((criterion, index) => ({
      id: criterion.id,
      score: scores[index],
      strengths: `${criterion.name} works.`,
      gaps: `${criterion.name} is missing a beat.`,
      evidence: [evidence],
    })),
    highlight: { description: "The measuring.", evidence: QUOTE },
    opening: "The scene measures before it leaps.",
    revision: "Let the gap cost her something.",
  }
}

function gradedModelResult(scores?: number[], evidence?: string) {
  return {
    output: modelReply(scores, evidence),
    usage: {
      inputTokens: 2000,
      outputTokens: 1000,
      inputTokenDetails: { cacheReadTokens: 0 },
      outputTokenDetails: { reasoningTokens: 400 },
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
    structured: true,
  })
  const themeId = await rows.insertTheme(rubricId, {
    title: "Rooftop",
    description: "Two adults on a roof.",
  })
  const userId = await rows.insertUser()
  const textId = await rows.insertText({
    userId,
    themeId,
    content: SCENE,
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
    criteria: actionCriteria,
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
      return gradedModelResult()
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

  it("asks OpenAI not to store the response", async () => {
    const graph = await insertOpenText()

    await withStep(nextStepId(), () => correctText(graph.textId))

    expect(generateTextSpy.mock.calls[0]?.[0]).toMatchObject({
      providerOptions: { openai: { store: false } },
    })
  })

  it("rejects a criterion above its maximum, retries once, then fails at validation", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () =>
      gradedModelResult([151, 128, 128, 160, 128])
    )

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(graph.textId))
    )

    expect(error.message).toStartWith(
      "Reading rejected by validation: score_out_of_range"
    )
    expect(generateTextSpy.mock.calls).toHaveLength(2)
    expect(generateTextSpy.mock.calls[1]?.[0].prompt).toContain(
      "<aviso-do-servidor>"
    )
    expect(await readCorrection(stepId)).toMatchObject({
      content: "",
      score: "0.00",
      status: "FAILED",
    })
    const stored = await correctionService.findAttemptSnapshot(stepId)
    expect(stored).toMatchObject({ failureStage: "validation" })
    expect(stored?.finishedAt).toBeInstanceOf(Date)
    const calls = await db
      .select()
      .from(readingCall)
      .where(eq(readingCall.correctionId, stepId))
    expect(
      calls.map((call) => [call.sequence, call.outcome, call.rejection]).sort()
    ).toEqual([
      [1, "rejected", "score_out_of_range"],
      [2, "rejected", "score_out_of_range"],
    ])
  })

  it("accepts the retry when the first reply quotes text that is not in the scene", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()
    let call = 0

    generateTextSpy.mockImplementation(async () => {
      call += 1
      return call === 1
        ? gradedModelResult(SPLIT_640, "she jumped across the gap")
        : gradedModelResult()
    })

    const saved = await withStep(stepId, () => correctText(graph.textId))

    expect(saved.score).toBe("640.00")
    const calls = await db
      .select()
      .from(readingCall)
      .where(eq(readingCall.correctionId, stepId))
    expect(
      calls
        .map((entry) => [
          entry.sequence,
          entry.outcome,
          entry.rejection,
          entry.discardedQuotes,
        ])
        .sort()
    ).toEqual([
      [1, "rejected", "missing_evidence", 0],
      [2, "accepted", null, 0],
    ])
  })

  it("fails with Text not found when the text is gone before save", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () => {
      await db
        .update(text)
        .set({ deletedAt: retiredAt })
        .where(eq(text.id, graph.textId))

      return gradedModelResult()
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

      return gradedModelResult()
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

      return gradedModelResult()
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

      return gradedModelResult()
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

  it("stores a completed structured reading with the frozen bodies, server total and bands", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    const saved = await withStep(stepId, () => correctText(graph.textId))

    expect(saved).toEqual({
      correctionId: stepId,
      score: "640.00",
    })
    const stored = await correctionService.findAttemptSnapshot(stepId)
    expect(
      stored?.structuredResult?.criteria.map((entry) => entry.band)
    ).toEqual(["working", "working", "working", "working", "working"])
    expect(await readCorrection(stepId)).toEqual({
      content: renderReadingMarkdown(stored!.structuredResult!, actionCriteria),
      score: "640.00",
      textContent: SCENE,
      rubricContent: "Score the scene.",
      status: "COMPLETED",
    })
    expect(stored?.startedAt).toBeInstanceOf(Date)
    expect(stored?.finishedAt).toBeInstanceOf(Date)
    expect(stored?.failureStage).toBeNull()
  })

  it("records the accepted call with its tokens and its cost at the list price", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    await withStep(stepId, () => correctText(graph.textId))

    const [call] = await db
      .select()
      .from(readingCall)
      .where(eq(readingCall.correctionId, stepId))
    expect(call).toMatchObject({
      outcome: "accepted",
      sequence: 1,
      modelId: "gpt-5-mini",
      inputTokens: 2000,
      outputTokens: 1000,
      reasoningTokens: 400,
      //* 2000 × 0.25 + 1000 × 2 per million tokens.
      costUsd: "0.00250000",
    })
    expect(call?.price).toMatchObject({
      modelId: "gpt-5-mini",
      outputPerMillion: 2,
    })
  })

  it("fails before calling the model when the attempt has no frozen criteria", async () => {
    const rubricId = await rows.insertRubric({ content: "Score the scene." })
    const themeId = await rows.insertTheme(rubricId)
    const userId = await rows.insertUser()
    const textId = await rows.insertText({ userId, themeId, content: SCENE })
    const stepId = nextStepId()

    const error = await captureFatal(() =>
      withStep(stepId, () => correctText(textId))
    )

    expect(error.message).toBe("Reading has no frozen rubric criteria")
    expect(generateTextSpy.mock.calls).toHaveLength(0)
    expect(await correctionService.findAttemptSnapshot(stepId)).toMatchObject({
      status: "FAILED",
      failureStage: "grading",
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

  it("stores FAILED at the grading stage when the model call keeps failing", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () => {
      throw new Error("Provider unavailable")
    })

    let message = ""
    try {
      await withStep(stepId, () => correctText(graph.textId))
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }

    expect(message).toBe("Provider unavailable")
    expect(await correctionService.findAttemptSnapshot(stepId)).toMatchObject({
      status: "FAILED",
      content: "",
      score: "0.00",
      failureStage: "grading",
      failureReason: "Provider unavailable",
    })
    const calls = await db
      .select()
      .from(readingCall)
      .where(eq(readingCall.correctionId, stepId))
    expect(calls.map((call) => call.outcome)).toEqual(["error"])
  })

  it("marks a text changed before save as a failure at the saving stage", async () => {
    const graph = await insertOpenText()
    const stepId = nextStepId()

    generateTextSpy.mockImplementation(async () => {
      await db
        .update(text)
        .set({ content: "A different ending." })
        .where(eq(text.id, graph.textId))
      return gradedModelResult()
    })

    await captureFatal(() => withStep(stepId, () => correctText(graph.textId)))

    expect(await correctionService.findAttemptSnapshot(stepId)).toMatchObject({
      status: "FAILED",
      failureStage: "saving",
    })
  })

  it("grades the next version without the previous score and then compares the two readings", async () => {
    const graph = await insertOpenText()
    const firstId = nextStepId()
    await withStep(firstId, () => correctText(graph.textId))
    const nextScene = `${SCENE} She paid for the leap.`
    await db.update(text).set({ content: nextScene }).where(eq(text.id, graph.textId))
    const prompts: string[] = []
    generateTextSpy.mockImplementation(async (input) => {
      const prompt = input?.prompt ?? ""
      prompts.push(prompt)
      if (prompt.includes("<versao-nova>"))
        return {
          output: {
            met: true,
            answer: "The leap now costs her.",
            evidence: QUOTE,
          },
          usage: {
            inputTokens: 500,
            outputTokens: 200,
            inputTokenDetails: { cacheReadTokens: 0 },
            outputTokenDetails: { reasoningTokens: 0 },
          },
        }
      return gradedModelResult([20, 190, 128, 180, 128])
    })
    const secondId = nextStepId()

    await withStep(secondId, () => correctText(graph.textId))

    const grading = prompts.filter((prompt) => !prompt.includes("<versao-nova>"))
    const comparison = prompts.filter((prompt) => prompt.includes("<versao-nova>"))
    expect(grading).toHaveLength(1)
    expect(comparison).toHaveLength(1)
    for (const prompt of prompts) expect(prompt).not.toContain("640")
    expect(grading[0]).not.toContain("<versao-anterior>")
    expect(grading[0]).toContain(nextScene)
    expect(comparison[0]).toContain("Let the gap cost her something.")
    expect(comparison[0]).not.toContain("revision intent")
    const stored = await correctionService.findAttemptSnapshot(secondId)
    expect(stored?.score).toBe("646.00")
    expect(stored?.comparison).toMatchObject({
      version: 1,
      textUnchanged: false,
      previousCorrectionId: firstId,
      focus: { status: "met", evidence: QUOTE },
    })
    expect(
      stored?.comparison?.criteria.find((item) => item.id === "fidelity")?.movement
    ).toBe("regressed")
    expect(
      stored?.comparison?.criteria.find((item) => item.id === "shape")?.movement
    ).toBe("improved")
    const calls = await db
      .select()
      .from(readingCall)
      .where(eq(readingCall.correctionId, secondId))
    expect(calls.filter((call) => call.kind === "reading")).toHaveLength(1)
    expect(calls.filter((call) => call.kind === "comparison")).toHaveLength(1)
    expect((await correctionService.findAttemptSnapshot(firstId))?.comparison).toBeNull()
    await expectPostgresError(
      () =>
        db
          .update(correction)
          .set({ comparison: null })
          .where(eq(correction.id, secondId)),
      "23514",
      "correction_immutable_comparison"
    )
    await expectPostgresError(
      () =>
        db.update(correction).set({ score: "1.00" }).where(eq(correction.id, secondId)),
      "23514",
      "correction_immutable_result"
    )
  })

  it("does not call the comparison model or count a gain when the text is unchanged", async () => {
    const graph = await insertOpenText()
    await withStep(nextStepId(), () => correctText(graph.textId))
    const prompts: string[] = []
    generateTextSpy.mockImplementation(async (input) => {
      prompts.push(input?.prompt ?? "")
      return gradedModelResult([140, 180, 180, 220, 180])
    })
    const secondId = nextStepId()

    await withStep(secondId, () => correctText(graph.textId))

    expect(prompts.some((prompt) => prompt.includes("<versao-nova>"))).toBe(false)
    const stored = await correctionService.findAttemptSnapshot(secondId)
    expect(stored?.score).toBe("900.00")
    expect(stored?.comparison?.textUnchanged).toBe(true)
    expect(stored?.comparison?.focus).toEqual({ status: "unchanged" })
    expect(
      stored?.comparison?.criteria.every((item) => item.movement === "unchanged")
    ).toBe(true)
    const calls = await db
      .select()
      .from(readingCall)
      .where(eq(readingCall.correctionId, secondId))
    expect(calls.every((call) => call.kind === "reading")).toBe(true)
  })

  it("compares a new reading with the previous completed version and skips a failed attempt", async () => {
    const graph = await insertOpenText()
    const firstId = nextStepId()
    await withStep(firstId, () => correctText(graph.textId))
    const nextScene = `${SCENE} She paid for the leap.`
    await db.update(text).set({ content: nextScene }).where(eq(text.id, graph.textId))
    let gradingAttempts = 0
    generateTextSpy.mockImplementation(async (input) => {
      const prompt = input?.prompt ?? ""
      if (prompt.includes("<versao-nova>"))
        return {
          output: {
            met: false,
            answer: "The cost is still missing.",
            evidence: QUOTE,
          },
          usage: {
            inputTokens: 100,
            outputTokens: 50,
            inputTokenDetails: { cacheReadTokens: 0 },
            outputTokenDetails: { reasoningTokens: 0 },
          },
        }
      gradingAttempts += 1
      if (gradingAttempts === 1) throw new Error("Provider unavailable")
      return gradedModelResult([20, 190, 128, 180, 128])
    })

    await expect(
      withStep(nextStepId(), () => correctText(graph.textId))
    ).rejects.toThrow("Provider unavailable")
    const secondId = nextStepId()
    await withStep(secondId, () => correctText(graph.textId))

    const stored = await correctionService.findAttemptSnapshot(secondId)
    expect(stored?.status).toBe("COMPLETED")
    expect(stored?.comparison?.previousCorrectionId).toBe(firstId)
    expect(stored?.comparison?.focus).toMatchObject({ status: "unmet" })
  })

  it("keeps the reading when the comparison model fails", async () => {
    const graph = await insertOpenText()
    await withStep(nextStepId(), () => correctText(graph.textId))
    await db
      .update(text)
      .set({ content: `${SCENE} She paid for the leap.` })
      .where(eq(text.id, graph.textId))
    generateTextSpy.mockImplementation(async (input) => {
      const prompt = input?.prompt ?? ""
      if (prompt.includes("<versao-nova>")) throw new Error("Comparison unavailable")
      return gradedModelResult([20, 190, 128, 180, 128])
    })
    const secondId = nextStepId()

    await withStep(secondId, () => correctText(graph.textId))

    const stored = await correctionService.findAttemptSnapshot(secondId)
    expect(stored?.status).toBe("COMPLETED")
    expect(stored?.score).toBe("646.00")
    expect(stored?.comparison?.focus).toEqual({ status: "unavailable" })
    expect(
      stored?.comparison?.criteria.find((item) => item.id === "fidelity")?.movement
    ).toBe("regressed")
  })
})

for (const field of ["modelId", "promptVersion"] as const) {
  it(`fails before calling the model if reserved ${field} differs from this deployment`, async () => {
    const graph = await insertOpenText()
    const id = nextStepId()
    await correctionService.insertCorrection({
      id,
      textId: graph.textId,
      textContent: SCENE,
      rubricId: graph.rubricId,
      rubricContent: "Score the scene.",
      content: "",
      score: "0.00",
      status: "PENDING",
      ...correctionConfiguration(),
      [field]: "old-configuration",
    })
    const error = await captureFatal(() => correctText(graph.textId, id))
    expect(error.message).toBe("Reading configuration changed before grading")
    expect(generateTextSpy.mock.calls).toHaveLength(0)
    expect(await correctionService.findAttemptSnapshot(id)).toMatchObject({
      status: "FAILED",
      [field]: "old-configuration",
    })
  })
}
