<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud

Bun and PostgreSQL 18 are already installed. Docker is not available; do not use `docker-compose.yml` to start the database.

- Dependencies: `bun install --frozen-lockfile`. The Bun binary is `/home/ubuntu/.bun/bin/bun`.
- Database: `sudo pg_ctlcluster 18 main start`, then wait until `pg_isready -h 127.0.0.1 -p 5432` succeeds. The local URL is `postgresql://postgres:postgres@localhost:5432/postgres`, matching `example.env`.
- Env file: copy `example.env` to `.env` and set `BETTER_AUTH_SECRET` before `bun run db:migrate` or the dev server. `.env` is gitignored.
- Dev server: `database/index.ts` imports `drizzle-orm/bun-sql`, so Next must run inside Bun. `bun run dev` follows Next's Node shebang and cannot load that driver. Use `bun --bun ./node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000`.
- Checks: `bun run typecheck` type-checks the project. `bun run lint` exits because `typescript-eslint` does not support the pinned TypeScript 7. Production `next build` collects page data in Node workers, which also cannot load the Bun SQL driver. Use the dev server for end-to-end checks.
