//* Libraries imports
import { sleep } from "workflow";
import { eq } from "drizzle-orm";

//* Services imports
import { openAI } from "@/services/ai";

//* Local imports
import { db } from "@/database";
import { text, rubric, theme } from "@/database/schema";

export async function correctText(textId: string) {
  "use workflow";

  const textToCorrect = await getText(textId);
  const rubric = await getRubric(textToCorrect.themeId);

  console.log("Text to correct:", textToCorrect);
  console.log("Rubric:", rubric);

  return { status: "OK" };
}

async function getText(textId: string) {
  "use step";

  const result = await db
    .select({
      id: text.id,
      title: text.title,
      content: text.content,
      themeId: text.themeId,
      userId: text.userId,
    })
    .from(text)
    .where(eq(text.id, textId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Text not found");
  }

  return result[0];
}

async function getRubric(themeId: string) {
  "use step";

  // from theme, we can get the rubric
  const result = await db
    .select({
      id: rubric.id,
      title: rubric.title,
      content: rubric.content,
    })
    .from(theme)
    .where(eq(theme.id, themeId))
    .innerJoin(rubric, eq(theme.rubricId, rubric.id))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Rubric not found");
  }

  return result[0];
}