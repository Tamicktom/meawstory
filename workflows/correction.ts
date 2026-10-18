//* Libraries imports
import { generateText, Output } from "ai"
import { FatalError, getStepMetadata } from "workflow"

//* Services imports
import { openAI } from "@/services/ai"
import { correctionService } from "@/services/correction"
import { rubricService } from "@/services/rubric"
import { textService } from "@/services/text"
import type { CorrectionStatus } from "@/database/schema"

//* Local imports
import {
  buildCorrectionPrompt,
  correctionInstructions,
  correctionOutputSchema,
  formatCorrectionScore,
  type CorrectionSource,
} from "@/workflows/correction-grading"
import { readSavedCorrection } from "@/workflows/correction-stand-in"

type GradedCorrection = {
  textId: string
  textContent: string
  rubricId: string
  rubricContent: string
  content: string
  score: string
  status: CorrectionStatus
}

export async function correctText(textId: string) {
  "use workflow"

  const textToCorrect = await getText(textId)
  const themeRubric = await getRubric(textToCorrect.themeId)

  const correctionId = await createEmptyCorrection({
    textId: textToCorrect.id,
    rubricId: themeRubric.id,
  })

  if (!correctionId) {
    throw new FatalError("Correction not created")
  }

  try {
    await updateCorrectionStatus(correctionId, "IN_PROGRESS")

    const graded = await gradeText({
      themeTitle: textToCorrect.themeTitle,
      themeDescription: textToCorrect.themeDescription,
      textContent: textToCorrect.content,
      rubricTitle: themeRubric.title,
      rubricContent: themeRubric.content,
    })

    return await updateCorrection(correctionId, {
      textId: textToCorrect.id,
      textContent: textToCorrect.content,
      rubricId: themeRubric.id,
      rubricContent: themeRubric.content,
      content: graded.content,
      score: graded.score,
      status: "COMPLETED",
    })
  } catch (error) {
    await updateCorrectionStatus(correctionId, "FAILED")
    throw error
  }
}

type CreateEmptyCorrectionValues = {
  textId: string
  rubricId: string
}

export async function createEmptyCorrection(
  values: CreateEmptyCorrectionValues
): Promise<string | null> {
  "use step"

  const { stepId } = getStepMetadata()
  const currentText = await textService.findActiveTextContent(values.textId)
  const currentRubric = await rubricService.findActiveRubricContent(
    values.rubricId
  )

  if (!currentText || !currentRubric) {
    return null
  }

  const inserted = await correctionService.insertCorrection({
    id: stepId,
    content: "",
    score: "0.00",
    textContent: currentText.content,
    rubricId: values.rubricId,
    rubricContent: currentRubric.content,
    textId: values.textId,
    status: "PENDING",
  })

  return inserted?.id ?? null
}

async function updateCorrectionStatus(id: string, status: CorrectionStatus) {
  "use step"

  await correctionService.updateCorrectionStatus(id, status)
}

export async function getText(textId: string) {
  "use step"

  const result = await textService.findActiveTextWithTheme(textId)

  if (!result) {
    throw new FatalError("Text not found")
  }

  return result
}

export async function getRubric(themeId: string) {
  "use step"

  const result = await rubricService.findActiveRubricForTheme(themeId)

  if (!result) {
    throw new FatalError("Rubric not found")
  }

  return result
}

async function gradeText(source: CorrectionSource) {
  "use step"

  const saved = readSavedCorrection()

  if (saved) {
    return gradedResult(saved.content, saved.score)
  }

  const result = await generateText({
    model: openAI("gpt-5-mini"),
    instructions: correctionInstructions,
    prompt: buildCorrectionPrompt(source),
    output: Output.object({
      schema: correctionOutputSchema,
      name: "correction",
      description: "Rubric-based correction of one student text.",
    }),
  })

  return gradedResult(result.output.content, result.output.score)
}

function gradedResult(content: string, score: number) {
  let formattedScore: string

  try {
    formattedScore = formatCorrectionScore(score)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Correction score is invalid."

    throw new FatalError(message)
  }

  return {
    content,
    score: formattedScore,
  }
}

async function updateCorrection(
  correctionId: string,
  graded: GradedCorrection
) {
  "use step"

  const currentText = await textService.findActiveTextContent(graded.textId)

  if (!currentText) {
    throw new FatalError("Text not found")
  }

  if (currentText.content !== graded.textContent) {
    throw new FatalError("Text changed before the correction was saved")
  }

  const currentRubric = await rubricService.findActiveRubricContent(
    graded.rubricId
  )

  if (!currentRubric) {
    throw new FatalError("Rubric not found")
  }

  if (currentRubric.content !== graded.rubricContent) {
    throw new FatalError("Rubric changed before the correction was saved")
  }

  const updated = await correctionService.updateCorrection(correctionId, {
    content: graded.content,
    score: graded.score,
    textContent: currentText.content,
    rubricId: graded.rubricId,
    rubricContent: currentRubric.content,
    textId: graded.textId,
    status: graded.status,
  })

  if (updated) {
    return {
      correctionId: updated.id,
      score: updated.score,
    }
  }

  const existing = await correctionService.findCorrectionById(correctionId)

  if (!existing) {
    throw new FatalError("Correction was not saved")
  }

  return {
    correctionId: existing.id,
    score: existing.score,
  }
}
