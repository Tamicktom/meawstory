//* Libraries imports
import { generateText, Output } from "ai"
import { and, eq, isNull } from "drizzle-orm"
import { FatalError, getStepMetadata } from "workflow"

//* Services imports
import { openAI } from "@/services/ai"

//* Local imports
import { db } from "@/database"
import { correction, rubric, text, theme } from "@/database/schema"
import {
  buildCorrectionPrompt,
  correctionInstructions,
  correctionOutputSchema,
  type CorrectionSource,
} from "@/workflows/correction-grading"

type GradedCorrection = {
  textId: string
  textContent: string
  rubricId: string
  rubricContent: string
  content: string
  score: number;
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

  const result = await db
    .select({
      id: text.id,
      content: text.content,
      themeId: text.themeId,
      themeTitle: theme.title,
      themeDescription: theme.description,
    })
    .from(text)
    .innerJoin(theme, eq(text.themeId, theme.id))
    .where(
      and(eq(text.id, textId), isNull(text.deletedAt), isNull(theme.deletedAt))
    )
    .limit(1)

  if (result.length === 0) {
    throw new FatalError("Text not found")
  }

  return result[0]
}

async function getRubric(themeId: string) {
  "use step"

  const result = await db
    .select({
      id: rubric.id,
      title: rubric.title,
      content: rubric.content,
    })
    .from(theme)
    .innerJoin(rubric, eq(theme.rubricId, rubric.id))
    .where(
      and(
        eq(theme.id, themeId),
        isNull(theme.deletedAt),
        isNull(rubric.deletedAt)
      )
    )
    .limit(1)

  if (result.length === 0) {
    throw new FatalError("Rubric not found")
  }

  return result[0]
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

  const output = result.output;
  let score: number = output.score;

  return {
    content: output.content,
    score,
  }
}

async function saveCorrection(graded: GradedCorrection) {
  "use step"

  const { stepId } = getStepMetadata()

  const inserted = await db
    .insert(correction)
    .values({
      id: stepId,
      content: graded.content,
      score: graded.score.toString(),
      textContent: graded.textContent,
      rubricId: graded.rubricId,
      rubricContent: graded.rubricContent,
      textId: graded.textId,
    })
    .onConflictDoNothing()
    .returning({
      id: correction.id,
      score: correction.score,
    })

  if (inserted.length > 0) {
    return {
      correctionId: inserted[0].id,
      score: inserted[0].score,
    }
  }

  throw new FatalError("Correction was not saved")
}
