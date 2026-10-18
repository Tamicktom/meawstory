//* Libraries imports
import { inArray } from "drizzle-orm"

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
  type CorrectionStatus,
} from "@/database/schema"

type ThemeInput = {
  title?: string
  description?: string
  image?: string | null
  deletedAt?: Date
}

type TextInput = {
  userId: string
  themeId: string
  title?: string
  content?: string
  deletedAt?: Date
}

type CorrectionInput = {
  textId: string
  rubricId: string
  id?: string
  score?: string
  content?: string
  textContent?: string
  rubricContent?: string
  status?: CorrectionStatus
  createdAt?: Date
  deletedAt?: Date
}

function newId(): string {
  return `pr6-${crypto.randomUUID()}`
}

async function deleteByIds(
  table:
    | typeof account
    | typeof correction
    | typeof rubric
    | typeof session
    | typeof text
    | typeof theme
    | typeof user
    | typeof verification,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) {
    return
  }

  await db.delete(table).where(inArray(table.id, ids))
  ids.length = 0
}

type PostgresErrorDetails = {
  code?: string
  constraint?: string
  message: string
}

function postgresErrorDetails(
  error: unknown
): PostgresErrorDetails | undefined {
  const seen = new Set<unknown>()
  let current: unknown = error

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current)

    if (
      "code" in current &&
      typeof current.code === "string" &&
      /^[0-9A-Z]{5}$/.test(current.code)
    ) {
      const constraint =
        "constraint" in current && typeof current.constraint === "string"
          ? current.constraint
          : undefined
      const message =
        "message" in current && typeof current.message === "string"
          ? current.message
          : ""

      return {
        code: current.code,
        constraint,
        message,
      }
    }

    current = "cause" in current ? current.cause : undefined
  }

  return undefined
}

export async function expectPostgresError(
  run: () => Promise<unknown>,
  code: string,
  constraint?: string
): Promise<void> {
  let thrown: unknown

  try {
    await run()
  } catch (error) {
    thrown = error
  }

  if (thrown === undefined) {
    throw new Error(`Expected Postgres error ${code}, but the query succeeded.`)
  }

  const details = postgresErrorDetails(thrown)
  const actual = details?.code
  const actualConstraint = details?.constraint

  if (
    actual === code &&
    (constraint === undefined || actualConstraint === constraint)
  ) {
    return
  }

  const message =
    details?.message ??
    (thrown instanceof Error ? thrown.message : String(thrown))

  throw new Error(
    `Expected Postgres error ${code}${constraint ? ` on ${constraint}` : ""} but received ${actual ?? "none"}${actualConstraint ? ` on ${actualConstraint}` : ""}.\n${message}`
  )
}

type TrackedIds = {
  userIds: string[]
  sessionIds: string[]
  accountIds: string[]
  verificationIds: string[]
  rubricIds: string[]
  themeIds: string[]
  textIds: string[]
  correctionIds: string[]
}

type ActiveTextInput = {
  content?: string
  themeTitle?: string
  themeDescription?: string
  textDeletedAt?: Date
  themeDeletedAt?: Date
}

function emptyTrackedIds(): TrackedIds {
  return {
    userIds: [],
    sessionIds: [],
    accountIds: [],
    verificationIds: [],
    rubricIds: [],
    themeIds: [],
    textIds: [],
    correctionIds: [],
  }
}

function remember(ids: string[], id = newId()) {
  ids.push(id)
  return id
}

async function insertUser(ids: TrackedIds, email?: string) {
  const id = remember(ids.userIds)

  await db.insert(user).values({
    id,
    name: "Schema Test",
    email: email ?? `${id}@example.test`,
  })

  return id
}

async function insertSession(ids: TrackedIds, userId: string, token?: string) {
  const id = remember(ids.sessionIds)

  await db.insert(session).values({
    id,
    userId,
    token: token ?? id,
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  })

  return id
}

async function insertAccount(ids: TrackedIds, userId: string) {
  const id = remember(ids.accountIds)

  await db.insert(account).values({
    id,
    userId,
    accountId: id,
    providerId: "credential",
    password: "hashed-password",
  })

  return id
}

async function insertVerification(ids: TrackedIds, identifier: string) {
  const id = remember(ids.verificationIds)

  await db.insert(verification).values({
    id,
    identifier,
    value: id,
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  })

  return id
}

async function insertRubric(
  ids: TrackedIds,
  input?: { title?: string; content?: string; deletedAt?: Date }
) {
  const id = remember(ids.rubricIds)

  await db.insert(rubric).values({
    id,
    title: input?.title ?? `Rubric ${id}`,
    content: input?.content ?? `Rubric body ${id}`,
    ...(input?.deletedAt ? { deletedAt: input.deletedAt } : {}),
  })

  return id
}

async function insertTheme(
  ids: TrackedIds,
  rubricId: string,
  input?: ThemeInput
) {
  const id = remember(ids.themeIds)

  await db.insert(theme).values({
    id,
    rubricId,
    title: input?.title ?? `Theme ${id}`,
    description: input?.description ?? `Theme description ${id}`,
    image: input?.image ?? null,
    ...(input?.deletedAt ? { deletedAt: input.deletedAt } : {}),
  })

  return id
}

async function insertText(ids: TrackedIds, input: TextInput) {
  const id = remember(ids.textIds)

  await db.insert(text).values({
    id,
    userId: input.userId,
    themeId: input.themeId,
    title: input.title ?? `Text ${id}`,
    content: input.content ?? `Text body ${id}`,
    ...(input.deletedAt ? { deletedAt: input.deletedAt } : {}),
  })

  return id
}

async function insertCorrection(ids: TrackedIds, input: CorrectionInput) {
  const id = input.id ?? newId()

  if (!ids.correctionIds.includes(id)) {
    ids.correctionIds.push(id)
  }

  await db.insert(correction).values({
    id,
    textId: input.textId,
    rubricId: input.rubricId,
    score: input.score ?? "10.00",
    content: input.content ?? "Correction body",
    textContent: input.textContent ?? "Text body",
    rubricContent: input.rubricContent ?? "Rubric body",
    status: input.status ?? "PENDING",
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    ...(input.deletedAt ? { deletedAt: input.deletedAt } : {}),
  })

  return id
}

async function insertActiveText(ids: TrackedIds, input?: ActiveTextInput) {
  const rubricId = await insertRubric(ids)
  const themeId = await insertTheme(ids, rubricId, {
    title: input?.themeTitle,
    description: input?.themeDescription,
    deletedAt: input?.themeDeletedAt,
  })
  const userId = await insertUser(ids)
  const textId = await insertText(ids, {
    userId,
    themeId,
    content: input?.content,
    deletedAt: input?.textDeletedAt,
  })

  return { rubricId, themeId, userId, textId }
}

async function cleanupTrackedIds(ids: TrackedIds) {
  await deleteByIds(correction, ids.correctionIds)
  await deleteByIds(text, ids.textIds)
  await deleteByIds(session, ids.sessionIds)
  await deleteByIds(account, ids.accountIds)
  await deleteByIds(verification, ids.verificationIds)
  await deleteByIds(theme, ids.themeIds)
  await deleteByIds(rubric, ids.rubricIds)
  await deleteByIds(user, ids.userIds)
}

export function createIsolatedRows() {
  const ids = emptyTrackedIds()

  return {
    trackText(id = newId()) {
      return remember(ids.textIds, id)
    },
    trackCorrection(id = newId()) {
      return remember(ids.correctionIds, id)
    },
    insertUser(email?: string) {
      return insertUser(ids, email)
    },
    insertSession(userId: string, token?: string) {
      return insertSession(ids, userId, token)
    },
    insertAccount(userId: string) {
      return insertAccount(ids, userId)
    },
    insertVerification(identifier: string) {
      return insertVerification(ids, identifier)
    },
    insertRubric(input?: {
      title?: string
      content?: string
      deletedAt?: Date
    }) {
      return insertRubric(ids, input)
    },
    insertTheme(rubricId: string, input?: ThemeInput) {
      return insertTheme(ids, rubricId, input)
    },
    insertText(input: TextInput) {
      return insertText(ids, input)
    },
    insertCorrection(input: CorrectionInput) {
      return insertCorrection(ids, input)
    },
    insertActiveText(input?: ActiveTextInput) {
      return insertActiveText(ids, input)
    },
    cleanup() {
      return cleanupTrackedIds(ids)
    },
  }
}
