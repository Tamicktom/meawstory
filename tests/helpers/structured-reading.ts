//* Libraries imports
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { rubric, text } from "@/database/schema"
import type { StructuredReading } from "@/lib/reading-contract"
import { correctionService } from "@/services/correction"
import {
  actionCriteria,
  createIsolatedRows,
} from "@/tests/helpers/schema-fixtures"
import { correctionConfiguration } from "@/workflows/correction-config"

type IsolatedRows = ReturnType<typeof createIsolatedRows>

export const STRUCTURED_EVIDENCE = "Uma cena."

export function structuredReadingResult(): StructuredReading {
  return {
    version: 1,
    opening: "A cena acompanha o movimento.",
    highlight: {
      description: "O movimento fica visível.",
      evidence: STRUCTURED_EVIDENCE,
    },
    revision: "Mostre o custo da escolha num gesto.",
    criteria: actionCriteria.map((criterion) => ({
      id: criterion.id,
      score: criterion.maxScore,
      band: "strong",
      evidence: [STRUCTURED_EVIDENCE],
      strengths: "A ação está na página.",
      gaps: "O custo pode ficar mais claro.",
    })),
  }
}

export async function insertCompletedStructuredReading(
  rows: IsolatedRows,
  input: {
    textId: string
    rubricId: string
    revisionIntent?: string | null
    createdAt?: Date
  }
) {
  await db
    .update(rubric)
    .set({ genre: "action", criteria: actionCriteria })
    .where(eq(rubric.id, input.rubricId))
  const [scene] = await db.select().from(text).where(eq(text.id, input.textId))
  const [storedRubric] = await db
    .select()
    .from(rubric)
    .where(eq(rubric.id, input.rubricId))
  if (!scene?.content.includes(STRUCTURED_EVIDENCE))
    throw new Error("The scene must contain the structured evidence.")
  if (!storedRubric) throw new Error("The rubric was not stored.")
  const id = rows.trackCorrection()
  await correctionService.insertCorrection({
    id,
    textId: input.textId,
    rubricId: input.rubricId,
    textContent: scene.content,
    rubricContent: storedRubric.content,
    content: "Leitura estruturada",
    score: "1000.00",
    status: "COMPLETED",
    structuredResult: structuredReadingResult(),
    rubricCriteria: actionCriteria,
    revisionIntent: input.revisionIntent ?? null,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    ...correctionConfiguration(),
  })
  return id
}
