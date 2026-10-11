//* Libraries imports
import { generateText, Output } from "ai"
import { FatalError, getStepMetadata } from "workflow"

//* Services imports
import { openAI } from "@/services/ai"
import { correctionService } from "@/services/correction"
import {
  rubricService
} from "@/services/rubric"
import {
  textService
} from "@/services/text"

//* Local imports
import {
  buildCorrectionPrompt,
  correctionInstructions,
  correctionOutputSchema,
  formatCorrectionScore,
  type CorrectionSource,
} from "@/workflows/correction-grading"

type GradedCorrection = {
  textId: string
  textContent: string
  rubricId: string
  rubricContent: string
  content: string
  score: string
}

export async function correctText(textId: string) {
  "use workflow"

  const textToCorrect = await getText(textId)
  const themeRubric = await getRubric(textToCorrect.themeId)
  const graded = await gradeText({
    themeTitle: textToCorrect.themeTitle,
    themeDescription: textToCorrect.themeDescription,
    textContent: textToCorrect.content,
    rubricTitle: themeRubric.title,
    rubricContent: themeRubric.content,
  })

  return saveCorrection({
    textId: textToCorrect.id,
    textContent: textToCorrect.content,
    rubricId: themeRubric.id,
    rubricContent: themeRubric.content,
    content: graded.content,
    score: graded.score,
  })
}

async function getText(textId: string) {
  "use step"

  const result = await textService.findActiveTextWithTheme(textId)

  if (!result) {
    throw new FatalError("Text not found")
  }

  return result
}

async function getRubric(themeId: string) {
  "use step"

  const result = await rubricService.findActiveRubricForTheme(themeId)

  if (!result) {
    throw new FatalError("Rubric not found")
  }

  return result
}

async function gradeText(source: CorrectionSource) {
  "use step"

  const result = await generateText({
    model: openAI("gpt-5-mini"),
    instructions: correctionInstructions,
    prompt: buildCorrectionPrompt(source),
    output: Output.object({
      schema: correctionOutputSchema,
      name: "correction",
      description: "Rubric-based correction of one student text.",
    }),
  });

  const output = result.output
  let score: string

  try {
    score = formatCorrectionScore(output.score)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Correction score is invalid."

    throw new FatalError(message)
  }

  return {
    content: output.content,
    score,
  }
}

async function saveCorrection(graded: GradedCorrection) {
  "use step"

  const { stepId } = getStepMetadata()
  const currentText = await textService.findActiveTextContent(graded.textId)

  if (!currentText) {
    throw new FatalError("Text not found")
  }

  if (currentText.content !== graded.textContent) {
    throw new FatalError("Text changed before the correction was saved")
  }

  const currentRubric = await rubricService.findActiveRubricContent(graded.rubricId)

  if (!currentRubric) {
    throw new FatalError("Rubric not found")
  }

  if (currentRubric.content !== graded.rubricContent) {
    throw new FatalError("Rubric changed before the correction was saved")
  }

  const inserted = await correctionService.insertCorrection({
    id: stepId,
    content: graded.content,
    score: graded.score,
    textContent: currentText.content,
    rubricId: graded.rubricId,
    rubricContent: currentRubric.content,
    textId: graded.textId,
  })

  if (inserted) {
    return {
      correctionId: inserted.id,
      score: inserted.score,
    }
  }

  const existing = await correctionService.findCorrectionById(stepId)

  if (!existing) {
    throw new FatalError("Correction was not saved")
  }

  return {
    correctionId: existing.id,
    score: existing.score,
  }
}
