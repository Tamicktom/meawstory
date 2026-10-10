//* Libraries imports
import { defineRelations } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
  updatedAt: p.timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
};

const softDelete = {
  deletedAt: p.timestamp("deleted_at"),
}

export const user = p.pgTable("user", {
  id: p.text("id").primaryKey(),
  name: p.text("name").notNull(),
  email: p.text("email").notNull().unique(),
  emailVerified: p.boolean("email_verified").default(false).notNull(),
  image: p.text("image"),
  ...timestamps,
});

export const session = p.pgTable(
  "session",
  {
    id: p.text("id").primaryKey(),
    expiresAt: p.timestamp("expires_at").notNull(),
    token: p.text("token").notNull().unique(),
    ...timestamps,
    ipAddress: p.text("ip_address"),
    userAgent: p.text("user_agent"),
    userId: p.text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [p.index("session_userId_idx").on(table.userId)],
);

export const account = p.pgTable(
  "account",
  {
    id: p.text("id").primaryKey(),
    accountId: p.text("account_id").notNull(),
    providerId: p.text("provider_id").notNull(),
    userId: p.text("user_id")
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
  (table) => [p.index("account_userId_idx").on(table.userId)],
);

export const verification = p.pgTable(
  "verification",
  {
    id: p.text("id").primaryKey(),
    identifier: p.text("identifier").notNull(),
    value: p.text("value").notNull(),
    expiresAt: p.timestamp("expires_at").notNull(),
    ...timestamps,
  },
  (table) => [p.index("verification_identifier_idx").on(table.identifier)],
);

export const rubric = p.pgTable("rubric", {
  id: p.text("id").primaryKey(),

  content: p.text("content").notNull(), //* Rubric content

  ...timestamps,
  ...softDelete,
});

export const theme = p.pgTable("theme", {
  id: p.text("id").primaryKey(),

  title: p.text("title").notNull(),
  description: p.text("description").notNull(),
  image: p.text("image"), //* Image URL

  rubricId: p.text("rubric_id")
    .notNull()
    .references(() => rubric.id, { onDelete: "cascade" }),

  ...timestamps,
  ...softDelete,
});

export const text = p.pgTable("text", {
  id: p.text("id").primaryKey(),

  content: p.text("content").notNull(), //* Text content

  // one text belongs to one theme
  themeId: p.text("theme_id")
    .notNull()
    .references(() => theme.id, { onDelete: "cascade" }),
  // one text belongs to one user
  userId: p.text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  ...timestamps,
  ...softDelete,
});

export const correction = p.pgTable("correction", {
  id: p.text("id").primaryKey(),

  content: p.text("content").notNull(), //* Correction content

  // one correction belongs to one text
  textId: p.text("text_id")
    .notNull()
    .references(() => text.id, { onDelete: "cascade" }),
  // one correction use one rubric
  rubricId: p.text("rubric_id")
    .notNull()
    .references(() => rubric.id, { onDelete: "cascade" }),

  ...timestamps,
  ...softDelete,
});

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
    },
    rubric: {
      corrections: r.many.correction(),
    },
  }),
);
