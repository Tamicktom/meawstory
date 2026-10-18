<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Meawstory

Meawstory is a Next.js app where a signed-in user writes a text for a theme and receives an AI correction against that theme's rubric.

Read `database/schema.md` before changing tables, queries, deletes, seeds, or correction behavior. That file is the business rules: soft delete, cascades, and what a correction freezes. `database/schema.ts` is the Drizzle definition. SQL migrations live in `database/migrations`.

Runtime is Bun. Auth is Better Auth with email and password (`lib/auth.ts`). The HTTP API is Elysia at `app/api/[[...slugs]]`. Routes under `app/(app)` require a session.

## Local database

Development Postgres is the `postgres` service in `docker-compose.yml`: Postgres 18, container `meawstory-postgres`, port 5432, user `postgres`, password `postgres`, database `postgres`. `DATABASE_URL` in `example.env` points at that container.

Bring the database up, then migrate, then seed:

1. `docker compose up -d`, and wait until the healthcheck passes.
2. `bun run db:migrate` applies pending migrations.
3. `bun run db:seed` upserts the narrative catalog and the test user.

`bun run db:migrate:fresh` resets the local Docker database: it drops every non-system schema, then reapplies migrations. Seed again afterward so the catalog and the test user exist.

## Test user

`database/seed/test-user.ts` defines the local account. `bun run db:seed` creates it, or refreshes it when the email already exists: the password is reset and the email is marked verified.

- Name: `Test User`
- Email: `user@user.user`
- Password: `123123Qq!`

Use this account to sign in during local development and browser checks. End-to-end tests sign up a fresh account on each run through `tests/factories/sign-up-account.ts` and `tests/helpers/sign-in.ts`.

## Tests

`bun test` runs the unit suite in `tests/unit`. Playwright owns `tests/e2e` and `tests/components`; `bunfig.toml` keeps those directories out of `bun test`.

`bun run test` runs the unit suite, then Playwright.

Playwright projects are declared in `playwright.config.ts`:

- `e2e` (`bun run test:e2e`): `tests/e2e`, app at `http://localhost:3000`. The config starts `bun run dev` when that server is down. Sign-up and sign-in write to the migrated database.
- `components` (`bun run test:ct`): `tests/components`, served by the Vite gallery at `http://localhost:3100`.
