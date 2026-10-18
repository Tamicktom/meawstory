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

const score = p.decimal("score", { precision: 6, scale: 2 });

export const correctionStatusEnum = ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] as const;
export type CorrectionStatus = (typeof correctionStatusEnum)[number];

export const correctionStatus = p.pgEnum("correction_status", correctionStatusEnum);

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

    status: correctionStatus("status").default("PENDING").notNull(),

    ...timestamps,
    ...softDelete,
  },
  (table) => [
    p.index("correction_textId_idx").on(table.textId),
    p.index("correction_rubricId_idx").on(table.rubricId),
    p.check(
      "correction_score_range",
      sql`${table.score} >= 0 AND ${table.score} <= 1000`
    ),
  ]
)

export const relations = defineRelations(
  { user, session, account, verification, text, correction, theme, rubric },
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
    correction: {
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
