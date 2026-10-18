# PR 5 — Auth against the real API

The component specs for sign-in and sign-up stub Better Auth. Three behaviors never hit the auth API or the database: a wrong password, an email that already exists, and clearing the TanStack Query cache before navigation home. This PR locks those paths against the real API. The forms and their component tests are already stable from PR 4.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 4. Later product-loop tests assume a real session can be created and that a failed sign-in or sign-up stays on the form. Cache clearing is already called in the hooks; this PR makes a test fail if that call disappears.

## In scope

Cover each bullet with an end-to-end test (`tests/e2e`, Playwright project `e2e`) or an integration test that performs the real Better Auth request and writes to the migrated database. The component specs stay stubbed.

- Sign-in with a wrong password fails and stays on the form. The browser remains on the sign-in page. The success navigation to `/` does not happen.
- Sign-up with an email that already exists fails and stays on the form. The browser remains on the sign-up page.
- Sign-in and sign-up clear the TanStack Query cache before navigating home. Both hooks do this today: `queryClient.clear()` in `onSuccess` of `hooks/use-sign-in-form.ts` and `hooks/use-sign-up-form.ts`, then `router.push("/")`. The new test fails if `queryClient.clear` is removed from either hook. Asserting only that the URL became `/` is the existing happy path and does not cover this bullet.

Auth HTTP is Better Auth at `app/api/auth/[...all]/route.ts` (`lib/auth.ts` on the server, `lib/auth-client.ts` in the hooks). It is not the Elysia app.

Use the existing account factory and sign-in helper as the pattern for a fresh user: `tests/factories/sign-up-account.ts` and `tests/helpers/sign-in.ts`. The e2e project signs up a fresh account per run. The local seeded user (`user@user.user` from `database/seed/test-user.ts`) is for manual development, not a requirement of these tests.

## Out of scope

Leave the component-spec stubs in place. Leave form validation, copy, and the shared field extraction from PR 4 as they are. Leave password reset, email-verification UI, and session cookies beyond what these three bullets need. Dashboard sign-out is PR 11.

## Files and areas

- New tests under `tests/e2e/` (or an integration test `bun test` will run, if that test hits Better Auth and the database)
- `hooks/use-sign-in-form.ts` and `hooks/use-sign-up-form.ts` only if a bullet is currently false
- `utils/query-client.ts` is the client `clear()` runs on

The wrong-password and duplicate-email behaviors are the current hook plus Better Auth. Add product code only when a bullet fails.

## Behavioral requirements

- A wrong password on the sign-in form surfaces a failure and leaves the user on that form.
- Sign-up with an email that already has an account surfaces a failure and leaves the user on that form.
- After a successful sign-in, queries that were in the cache before submit are gone, and the browser is on `/`. The same for a successful sign-up. Removing `queryClient.clear` from either hook fails the test.
- `tests/components/sign-in-form.spec.ts` and `tests/components/sign-up-form.spec.ts` still pass.
- The existing happy-path e2e specs still pass: `tests/e2e/sign-in.spec.ts` (including the browser session after the sign-in helper) and `tests/e2e/sign-up.spec.ts`.

## Constraints

Runtime is Bun. Auth is Better Auth with email and password.

Playwright e2e: `bun run test:e2e`, app at `http://localhost:3000`. The config starts `bun run dev` when that server is down. Sign-up and sign-in write to the migrated database. Bring Postgres up with `docker compose up -d` and apply migrations with `bun run db:migrate` before a local run.

New Playwright tests use `test.describe` and `test`, with behavior-focused titles, matching the existing e2e files. New unit or integration tests under `bun test` use `describe` and `it`.

UI rules apply only if a form file changes: props on a `props` object, every button has an `id` and a `type`, padding rather than margin, import sections with comments. The submit buttons are `sign-in-submit` and `sign-up-submit`.

## Verification

Run each new test file on its own, then `bun run test:e2e` (and `bun test` if an integration test lives in `tests/unit`).

Run the two component specs with `bun run test:ct`.

When that fresh run holds, check the PR 5 boxes in `docs/pr-plan.md`.

## Done when

An end-to-end or integration test for each bullet fails if that behavior is removed. The existing component specs still pass.
