import { afterEach, beforeEach, expect, spyOn, test } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"
import { app } from "@/api"
import { db } from "@/database"
import { correction, text } from "@/database/schema"
import { rubricSeeds } from "@/database/seed/catalog"
import { correctionService } from "@/services/correction"
import {
  loadReadingFeedback,
  saveReadingFeedback,
} from "@/services/reading-feedback"
import {
  readingQuality,
  readingQualityCandidates,
} from "@/services/reading-quality"
import { correctionConfiguration } from "@/workflows/correction-config"
import { createIsolatedRows } from "@/tests/helpers/schema-fixtures"
import { openSession } from "@/tests/helpers/open-session"
import TextFeedbackPage from "@/app/(app)/dashboard/texts/[textId]/page"
import { StructuredReadingView } from "@/components/feedback/structured-reading"
import { isValidElement } from "react"

const rows = createIsolatedRows()
let requestHeaders = new Headers()
let restore = () => {}
const sessions: Awaited<ReturnType<typeof openSession>>[] = []
beforeEach(() => {
  requestHeaders = new Headers()
  const spy = spyOn(nextHeaders, "headers").mockImplementation(
    async () => requestHeaders as never
  )
  restore = () => spy.mockRestore()
})
afterEach(async () => {
  restore()
  await rows.cleanup()
  for (const s of sessions.splice(0)) await s.close()
})
async function signIn() {
  const s = await openSession()
  sessions.push(s)
  requestHeaders = s.headers
  return s
}
async function reading(userId?: string) {
  const rubricId = await rows.insertRubric({
    structured: true,
    content: "Rubric body",
  })
  const themeId = await rows.insertTheme(rubricId)
  const ownerId = userId ?? (await rows.insertUser())
  const textId = await rows.insertText({
    userId: ownerId,
    themeId,
    content: "Uma cena no telhado.",
  })
  const id = rows.trackCorrection()
  const result = {
    version: 1 as const,
    opening: "Leitura geral.",
    highlight: {
      description: "Ponto forte.",
      evidence: "Uma cena no telhado.",
    },
    revision: "Um único foco.",
    criteria: rubricSeeds[0].criteria.map((c) => ({
      id: c.id,
      score: c.maxScore,
      band: "strong" as const,
      evidence: ["Uma cena no telhado."],
      strengths: "Funciona.",
      gaps: "Falta.",
    })),
  }
  await correctionService.insertCorrection({
    id,
    textId,
    rubricId,
    content: "MARKDOWN NÃO USADO",
    textContent: "Uma cena no telhado.",
    rubricContent: "Rubric body",
    score: "1000",
    status: "COMPLETED",
    structuredResult: result,
    rubricCriteria: rubricSeeds[0].criteria,
    ...correctionConfiguration(),
  })
  return { id, textId, ownerId, result }
}
function put(id: string, body: object) {
  return app.handle(
    new Request(`http://localhost/api/reading-feedback/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

test("feedback updates one choice and one disagreement without changing frozen reading; active quality excludes retired scenes", async () => {
  const g = await reading()
  const [before] = await db
    .select()
    .from(correction)
    .where(eq(correction.id, g.id))
  expect(
    await saveReadingFeedback(g.ownerId, g.id, { usefulness: "yes" })
  ).toBe(true)
  expect(
    await saveReadingFeedback(g.ownerId, g.id, { usefulness: "partly" })
  ).toBe(true)
  expect(
    await saveReadingFeedback(g.ownerId, g.id, {
      criterionId: "fidelity",
      reason: "",
    })
  ).toBe(true)
  expect(
    await saveReadingFeedback(g.ownerId, g.id, {
      criterionId: "fidelity",
      reason: "Minha discordância",
    })
  ).toBe(true)
  expect(await loadReadingFeedback(g.id)).toEqual({
    usefulness: "partly",
    disagreements: [{ criterionId: "fidelity", reason: "Minha discordância" }],
  })
  const [after] = await db
    .select()
    .from(correction)
    .where(eq(correction.id, g.id))
  expect(after).toEqual(before)
  const window = {
    since: new Date(before.createdAt.getTime() - 1),
    until: new Date(before.createdAt.getTime() + 1),
  }
  expect((await readingQuality(window))[0]).toMatchObject({
    readings: 1,
    responses: 1,
    partly: 1,
    yes: 0,
    no: 0,
    disputedReadings: 1,
    disagreements: 1,
  })
  expect(await readingQualityCandidates(window)).toHaveLength(1)
  await db
    .update(text)
    .set({ deletedAt: new Date() })
    .where(eq(text.id, g.textId))
  expect(await saveReadingFeedback(g.ownerId, g.id, { usefulness: "no" })).toBe(
    false
  )
  expect(await readingQuality(window)).toHaveLength(0)
  expect(await readingQualityCandidates(window)).toHaveLength(0)
})

test("API checks sessions, ownership, frozen criteria and payload limits", async () => {
  const g = await reading()
  expect((await put(g.id, { usefulness: "yes" })).status).toBe(401)
  await signIn()
  expect((await put(g.id, { usefulness: "yes" })).status).toBe(404)
  const own = await reading(sessions[0].userId)
  expect((await put(own.id, { usefulness: "maybe" })).status).toBe(422)
  expect(
    (await put(own.id, { criterionId: "fidelity", reason: "x".repeat(2001) }))
      .status
  ).toBe(422)
  expect((await put(own.id, { criterionId: "invented" })).status).toBe(404)
  expect((await put(own.id, { criterionId: "fidelity" })).status).toBe(200)
  expect((await put(own.id, { usefulness: "no" })).status).toBe(200)
  expect(await loadReadingFeedback(g.id)).toEqual({
    usefulness: null,
    disagreements: [],
  })
})

test("legacy, incomplete and deleted readings accept no feedback", async () => {
  const g = await rows.insertActiveText()
  for (const status of ["COMPLETED", "PENDING", "FAILED"] as const) {
    const id = await rows.insertCorrection({
      textId: g.textId,
      rubricId: g.rubricId,
      status,
    })
    expect(await saveReadingFeedback(g.userId, id, { usefulness: "yes" })).toBe(
      false
    )
  }
  const structured = await reading()
  await db
    .update(correction)
    .set({ deletedAt: new Date() })
    .where(eq(correction.id, structured.id))
  expect(
    await saveReadingFeedback(structured.ownerId, structured.id, {
      criterionId: "fidelity",
      reason: "",
    })
  ).toBe(false)
})

test("page passes frozen structured data and saved feedback without private band descriptions", async () => {
  const s = await signIn()
  const g = await reading(s.userId)
  await saveReadingFeedback(s.userId, g.id, { usefulness: "yes" })
  const page = await TextFeedbackPage({
    params: Promise.resolve({ textId: g.textId }),
    searchParams: Promise.resolve({}),
  })
  expect(isValidElement(page) && page.type === StructuredReadingView).toBe(true)
  expect(page.props).toMatchObject({
    correctionId: g.id,
    result: g.result,
    scene: "Uma cena no telhado.",
    version: 1,
    feedback: { usefulness: "yes" },
  })
  expect(JSON.stringify(page.props)).not.toContain('"bands"')
  expect(JSON.stringify(page.props)).not.toContain("MARKDOWN NÃO USADO")
})
