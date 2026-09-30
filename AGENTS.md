<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud

Bun and PostgreSQL 18 are already installed. Docker is not available; do not use `docker-compose.yml` to start the database.

- Dependencies: `bun install --frozen-lockfile`, then `bunx playwright install --with-deps chromium`. The environment install already does both. The Bun binary is `/home/ubuntu/.bun/bin/bun`.
- Database: `sudo pg_ctlcluster 18 main start`, then wait until `pg_isready -h 127.0.0.1 -p 5432` succeeds. The local URL is `postgresql://postgres:postgres@localhost:5432/postgres`, matching `example.env`.
- Env file: copy `example.env` to `.env` and set `BETTER_AUTH_SECRET` before `bun run db:migrate` or the dev server. `.env` is gitignored.
- Dev server: the database client is `pg` through `drizzle-orm/node-postgres`, so Next must run on Node. Keep `/opt/meawstory/bin` first on `PATH` (it strips `NODE_OPTIONS=--bun`). Start with `bun run dev --hostname 0.0.0.0 --port 3000`. Do not pass `--bun`; Turbopack then fails to resolve `pg` and sign-up returns 500.
- Checks: `bun run test` runs the unit tests and Playwright. `bun run typecheck` type-checks the project. `bun run lint` exits because `typescript-eslint` does not support the pinned TypeScript 7.
