//* Libraries imports
import { afterEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import {
  account,
  correction,
  rubric,
  session,
  text,
  theme,
  user,
  verification,
} from "@/database/schema"
import {
  createIsolatedRows,
  expectPostgresError,
} from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()

afterEach(async () => {
  await rows.cleanup()
})

async function storedIds(
  table:
    | typeof account
    | typeof correction
    | typeof rubric
    | typeof session
    | typeof text
    | typeof theme
    | typeof user
    | typeof verification,
  id: string
) {
  const stored = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, id))

  return stored.map((row) => row.id)
}

describe("correction.score", () => {
  it("stores a score from 0.00 through 1000.00", async () => {
    const graph = await rows.insertActiveText()
    const lowId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "0.00",
    })
    const highId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "1000.00",
    })

    const stored = await db
      .select({ id: correction.id, score: correction.score })
      .from(correction)
      .where(eq(correction.textId, graph.textId))

    expect(stored).toEqual(
      expect.arrayContaining([
        { id: lowId, score: "0.00" },
        { id: highId, score: "1000.00" },
      ])
    )
  })

  it("rejects a score outside 0.00 through 1000.00", async () => {
    const graph = await rows.insertActiveText()

    for (const score of ["-0.01", "1000.01"]) {
      await expectPostgresError(
        () =>
          rows.insertCorrection({
            textId: graph.textId,
            rubricId: graph.rubricId,
            score,
          }),
        "23514"
      )
    }

    const stored = await db
      .select({ id: correction.id })
      .from(correction)
      .where(eq(correction.textId, graph.textId))

    expect(stored).toEqual([])
  })
})

describe("deleting a rubric", () => {
  it("leaves the theme in place", async () => {
    const rubricId = await rows.insertRubric()
    const themeId = await rows.insertTheme(rubricId)

    await expectPostgresError(
      () => db.delete(rubric).where(eq(rubric.id, rubricId)),
      "23001",
      "theme_rubric_id_rubric_id_fkey"
    )

    expect(await storedIds(rubric, rubricId)).toEqual([rubricId])
    expect(await storedIds(theme, themeId)).toEqual([themeId])
  })

  it("leaves the correction in place", async () => {
    const graph = await rows.insertActiveText()
    const rubricId = await rows.insertRubric()
    const correctionId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId,
    })

    await expectPostgresError(
      () => db.delete(rubric).where(eq(rubric.id, rubricId)),
      "23001",
      "correction_rubric_id_rubric_id_fkey"
    )

    expect(await storedIds(rubric, rubricId)).toEqual([rubricId])
    expect(await storedIds(correction, correctionId)).toEqual([correctionId])
  })
})

describe("deleting a theme", () => {
  it("leaves the text in place", async () => {
    const graph = await rows.insertActiveText()

    await expectPostgresError(
      () => db.delete(theme).where(eq(theme.id, graph.themeId)),
      "23001",
      "text_theme_id_theme_id_fkey"
    )

    expect(await storedIds(theme, graph.themeId)).toEqual([graph.themeId])
    expect(await storedIds(text, graph.textId)).toEqual([graph.textId])
  })
})

describe("deleting a user", () => {
  it("deletes that user's sessions, accounts, texts, and corrections, and leaves verification", async () => {
    const graph = await rows.insertActiveText()
    const sessionId = await rows.insertSession(graph.userId)
    const accountId = await rows.insertAccount(graph.userId)
    const correctionId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
    })
    const verificationId = await rows.insertVerification(
      `${graph.userId}@example.test`
    )

    await db.delete(user).where(eq(user.id, graph.userId))

    expect(await storedIds(session, sessionId)).toEqual([])
    expect(await storedIds(account, accountId)).toEqual([])
    expect(await storedIds(text, graph.textId)).toEqual([])
    expect(await storedIds(correction, correctionId)).toEqual([])
    expect(await storedIds(theme, graph.themeId)).toEqual([graph.themeId])
    expect(await storedIds(rubric, graph.rubricId)).toEqual([graph.rubricId])

    const storedVerification = await db
      .select({ id: verification.id })
      .from(verification)
      .where(eq(verification.id, verificationId))

    expect(storedVerification.map((row) => row.id)).toEqual([verificationId])
  })
})

describe("deleting a text", () => {
  it("deletes its corrections", async () => {
    const graph = await rows.insertActiveText()
    const correctionId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
    })

    await db.delete(text).where(eq(text.id, graph.textId))

    expect(await storedIds(text, graph.textId)).toEqual([])
    expect(await storedIds(correction, correctionId)).toEqual([])
    expect(await storedIds(theme, graph.themeId)).toEqual([graph.themeId])
  })
})

describe("user.email", () => {
  it("rejects a second user with the same email", async () => {
    const email = `pr6-${crypto.randomUUID()}@example.test`
    const userId = await rows.insertUser(email)

    await expectPostgresError(() => rows.insertUser(email), "23505")

    const stored = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))

    expect(stored.map((row) => row.id)).toEqual([userId])
  })
})

describe("session.token", () => {
  it("rejects a second session with the same token", async () => {
    const userId = await rows.insertUser()
    const token = `pr6-token-${crypto.randomUUID()}`
    const sessionId = await rows.insertSession(userId, token)

    await expectPostgresError(() => rows.insertSession(userId, token), "23505")

    const stored = await db
      .select({ id: session.id })
      .from(session)
      .where(eq(session.token, token))

    expect(stored.map((row) => row.id)).toEqual([sessionId])
  })
})
