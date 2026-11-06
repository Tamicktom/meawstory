import type { ModelPrice } from "@/lib/model-pricing"
import type {
  Briefing,
  RubricCriteria,
  StructuredReading,
  ReadingSourceSnapshot,
  PromptConfig,
  Genre,
} from "@/lib/reading-contract"
//* Libraries imports
import { defineRelations, sql } from "drizzle-orm"
import * as p from "drizzle-orm/pg-core"

const timestamps = {
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
}

const softDelete = {
  deletedAt: p.timestamp("deleted_at"),
}

const score = p.decimal("score", { precision: 6, scale: 2 })

export const correctionStatusEnum = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
] as const
export type CorrectionStatus = (typeof correctionStatusEnum)[number]

//* Where a reading attempt stopped, for monitoring (1C-5). Never shown in the writing UI.
export const readingFailureStages = [
  "dispatch",
  "queue_timeout",
  "processing_timeout",
  "admission",
  "grading",
  "validation",
  "saving",
] as const
export type ReadingFailureStage = (typeof readingFailureStages)[number]

export const readingCallOutcomes = ["accepted", "rejected", "error"] as const
export type ReadingCallOutcome = (typeof readingCallOutcomes)[number]

export const correctionStatus = p.pgEnum(
  "correction_status",
  correctionStatusEnum
)

export const user = p.pgTable("user", {
  id: p.text("id").primaryKey(),
  name: p.text("name").notNull(),
  email: p.text("email").notNull().unique(),
  emailVerified: p.boolean("email_verified").default(false).notNull(),
  image: p.text("image"),
  ...timestamps,
})

export const session = p.pgTable(
  "session",
  {
    id: p.text("id").primaryKey(),
    expiresAt: p.timestamp("expires_at").notNull(),
    token: p.text("token").notNull().unique(),
    ...timestamps,
    ipAddress: p.text("ip_address"),
    userAgent: p.text("user_agent"),
    userId: p
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [p.index("session_userId_idx").on(table.userId)]
)

export const account = p.pgTable(
  "account",
  {
    id: p.text("id").primaryKey(),
    accountId: p.text("account_id").notNull(),
    providerId: p.text("provider_id").notNull(),
    userId: p
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: p.text("access_token"),
    refreshToken: p.text("refresh_token"),
    idToken: p.text("id_token"),
    accessTokenExpiresAt: p.timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: p.timestamp("refresh_token_expires_at"),
    scope: p.text("scope"),
    password: p.text("password"),
    ...timestamps,
  },
  (table) => [p.index("account_userId_idx").on(table.userId)]
)

export const verification = p.pgTable(
  "verification",
  {
    id: p.text("id").primaryKey(),
    identifier: p.text("identifier").notNull(),
    value: p.text("value").notNull(),
    expiresAt: p.timestamp("expires_at").notNull(),
    ...timestamps,
  },
  (table) => [p.index("verification_identifier_idx").on(table.identifier)]
)

export const rubric = p.pgTable("rubric", {
  id: p.text("id").primaryKey(),

  title: p.text("title").notNull(),
  genre: p.text("genre").$type<Genre>(),
  criteria: p.jsonb("criteria").$type<RubricCriteria>(),
  //* Rubric content explaining the rubric rules.
  content: p.text("content").notNull(),

  ...timestamps,
  ...softDelete,
})

export const theme = p.pgTable(
  "theme",
  {
    id: p.text("id").primaryKey(),

    title: p.text("title").notNull(),
    description: p.text("description").notNull(),
    genre: p.text("genre").$type<Genre>(),
    objective: p.text("objective"),
    minWords: p.integer("min_words"),
    maxWords: p.integer("max_words"),
    briefing: p.jsonb("briefing").$type<Briefing>(),
    image: p.text("image"), //* Image URL

    rubricId: p
      .text("rubric_id")
      .notNull()
      .references(() => rubric.id, { onDelete: "restrict" }),

    ...timestamps,
    ...softDelete,
  },
  (table) => [p.index("theme_rubricId_idx").on(table.rubricId)]
)

export const text = p.pgTable(
  "text",
  {
    id: p.text("id").primaryKey(),

    title: p.text("title").notNull(),
    content: p.text("content").notNull(), //* Text content
    checklist: p.jsonb("checklist").$type<string[]>().notNull().default([]),

    // one text belongs to one theme
    themeId: p
      .text("theme_id")
      .notNull()
      .references(() => theme.id, { onDelete: "restrict" }),
    // one text belongs to one user
    userId: p
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    ...timestamps,
    ...softDelete,
  },
  (table) => [
    p.index("text_themeId_idx").on(table.themeId),
    p.index("text_userId_idx").on(table.userId),
  ]
)

export const correction = p.pgTable(
  "correction",
  {
    id: p.text("id").primaryKey(),

    content: p.text("content").notNull(), //* Correction content
    score: score.notNull(), //* 0.00 through 1000.00

    //* Text body at grading time. Later edits to text.content do not change this.
    textContent: p.text("text_content").notNull(),

    //* Rubric applied at grading time. Later edits to the rubric do not change this.
    rubricId: p
      .text("rubric_id")
      .notNull()
      .references(() => rubric.id, { onDelete: "restrict" }),
    rubricContent: p.text("rubric_content").notNull(),

    // one correction belongs to one text
    textId: p
      .text("text_id")
      .notNull()
      .references(() => text.id, { onDelete: "cascade" }),

    rubricCriteria: p.jsonb("rubric_criteria").$type<RubricCriteria>(),
    source: p.jsonb("source").$type<ReadingSourceSnapshot>(),
    structuredResult: p.jsonb("structured_result").$type<StructuredReading>(),
    modelId: p.text("model_id"),
    promptVersion: p.text("prompt_version"),
    promptConfig: p.jsonb("prompt_config").$type<PromptConfig>(),

    status: correctionStatus("status").default("PENDING").notNull(),

    //* Monitoring (1C-5): when the workflow picked the attempt up and when it ended.
    startedAt: p.timestamp("started_at"),
    finishedAt: p.timestamp("finished_at"),
    failureStage: p.text("failure_stage").$type<ReadingFailureStage>(),
    //* Internal reason, for diagnosis. Never selected for the writing UI.
    failureReason: p.text("failure_reason"),

    ...timestamps,
    ...softDelete,
  },
  (table) => [
    p.index("correction_textId_idx").on(table.textId),
    p.index("correction_createdAt_idx").on(table.createdAt),
    p.index("correction_rubricId_idx").on(table.rubricId),
    p.check(
      "correction_failure_stage",
      sql`${table.failureStage} IS NULL OR ${table.failureStage} IN ('dispatch', 'queue_timeout', 'processing_timeout', 'admission', 'grading', 'validation', 'saving')`
    ),
    p.check(
      "correction_score_range",
      sql`${table.score} >= 0 AND ${table.score} <= 1000`
    ),
  ]
)

//* One model call made for a reading attempt, accepted or not (1C-6). The comparison of 1H-1
//* records its calls here too, under its own kind.
export const readingCall = p.pgTable(
  "reading_call",
  {
    id: p.text("id").primaryKey(),
    correctionId: p
      .text("correction_id")
      .notNull()
      .references(() => correction.id, { onDelete: "cascade" }),
    kind: p.text("kind").$type<"reading">().default("reading").notNull(),
    //* 1 for the first request of a grading run, 2 for its validation retry.
    sequence: p.integer("sequence").notNull(),
    outcome: p.text("outcome").$type<ReadingCallOutcome>().notNull(),
    rejection: p.text("rejection"),
    detail: p.text("detail"),
    discardedQuotes: p.integer("discarded_quotes").default(0).notNull(),
    modelId: p.text("model_id").notNull(),
    promptVersion: p.text("prompt_version").notNull(),
    inputTokens: p.integer("input_tokens"),
    cachedInputTokens: p.integer("cached_input_tokens"),
    outputTokens: p.integer("output_tokens"),
    reasoningTokens: p.integer("reasoning_tokens"),
    //* The price used for costUsd, frozen with the call.
    price: p.jsonb("price").$type<ModelPrice>(),
    costUsd: p.decimal("cost_usd", { precision: 12, scale: 8 }),
    startedAt: p.timestamp("started_at").notNull(),
    durationMs: p.integer("duration_ms").notNull(),
    createdAt: p.timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    p.index("reading_call_correctionId_idx").on(table.correctionId),
    p.index("reading_call_startedAt_idx").on(table.startedAt),
    p.check(
      "reading_call_outcome",
      sql`${table.outcome} IN ('accepted', 'rejected', 'error')`
    ),
    p.check("reading_call_kind", sql`${table.kind} IN ('reading')`),
  ]
)

//* Last time each operational alert was sent, so an ongoing problem alerts once per cooldown.
export const operationAlert = p.pgTable("operation_alert", {
  kind: p.text("kind").primaryKey(),
  lastSentAt: p.timestamp("last_sent_at").notNull(),
  detail: p.text("detail").notNull(),
})

export const relations = defineRelations(
  {
    user,
    session,
    account,
    verification,
    text,
    correction,
    theme,
    rubric,
    readingCall,
  },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      texts: r.many.text(),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
        optional: false,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
        optional: false,
      }),
    },
    text: {
      corrections: r.many.correction(),
      theme: r.one.theme({
        from: r.text.themeId,
        to: r.theme.id,
        optional: false,
      }),
      user: r.one.user({
        from: r.text.userId,
        to: r.user.id,
        optional: false,
      }),
    },
    readingCall: {
      correction: r.one.correction({
        from: r.readingCall.correctionId,
        to: r.correction.id,
        optional: false,
      }),
    },
    correction: {
      calls: r.many.readingCall(),
      text: r.one.text({
        from: r.correction.textId,
        to: r.text.id,
        optional: false,
      }),
      rubric: r.one.rubric({
        from: r.correction.rubricId,
        to: r.rubric.id,
        optional: false,
      }),
    },
    theme: {
      texts: r.many.text(),
      rubric: r.one.rubric({
        from: r.theme.rubricId,
        to: r.rubric.id,
        optional: false,
      }),
    },
    rubric: {
      themes: r.many.theme(),
      corrections: r.many.correction(),
    },
  })
)

export const readingFeedback = p.pgTable(
  "reading_feedback",
  {
    correctionId: p
      .text("correction_id")
      .primaryKey()
      .references(() => correction.id, { onDelete: "cascade" }),
    usefulness: p.text("usefulness").$type<"yes" | "partly" | "no">().notNull(),
    updatedAt: p.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    p.check(
      "reading_feedback_choice",
      sql`${table.usefulness} IN ('yes', 'partly', 'no')`
    ),
  ]
)

export const readingDisagreement = p.pgTable(
  "reading_disagreement",
  {
    correctionId: p
      .text("correction_id")
      .notNull()
      .references(() => correction.id, { onDelete: "cascade" }),
    criterionId: p.text("criterion_id").notNull(),
    reason: p.text("reason").notNull().default(""),
    updatedAt: p.timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    p.primaryKey({ columns: [table.correctionId, table.criterionId] }),
    p.check(
      "reading_disagreement_reason_length",
      sql`length(${table.reason}) <= 2000`
    ),
  ]
)
