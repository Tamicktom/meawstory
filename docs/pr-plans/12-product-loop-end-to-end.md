# PR 12 — Product loop end to end

Earlier PRs cover the theme list, the theme page, the write screen, the write API, the correction status route, the workflow, and the feedback page as separate tests. This PR is one browser test that walks that path. The model step is replaced with a saved correction so the run stays deterministic.

Index: `docs/pr-plan.md`.

## Position

Depends on PRs 8 through 11. The pages, the write and status routes, and a workflow that can reach `COMPLETED` already exist. Sign-in for the browser is the helper from the existing e2e specs (PR 5 keeps that path real). This is the last PR that the product loop needs. PR 13 is independent.

## In scope

One Playwright test in `tests/e2e`, project `e2e`, included when someone runs `bun run test:e2e`.

The test does not call the live model. The correction that becomes `COMPLETED` is one the test stored: known content, score, and frozen text, for the text the user just submitted. Insert that row from the test, or stub `correctText` so the workflow writes that row instead of calling `generateText`. The browser still uses the real pages and the real links.

Walk:

- A signed-in user opens the theme list (`/dashboard/themes`), opens a theme (`/dashboard/themes/:id`), and starts the exercise (`Escrever exercício` to `/dashboard/exercises/:id/write`).
- They submit a text (`Enviar texto`) and land on `/dashboard/texts/:textId` once the correction is `COMPLETED`.
- The feedback page shows that theme's title and the saved correction content.

The theme comes from the seeded narrative catalog (`bun run db:seed`) or from a theme the test inserts. The session comes from `tests/factories/sign-up-account.ts` and `tests/helpers/sign-in.ts`. A fresh account per run matches the other e2e specs.

The test fails if the link from the theme card to the feedback page breaks. Deep-linking straight to `/dashboard/texts/:textId` is not this path. The card, the detail link, the submit, and the redirect are all in the walk.

## Out of scope

Leave new route behavior, new page copy, and the `FAILED` wait state to PRs 8 through 11. Leave the home page and the dark-mode hotkey to PR 13. Leave prompt and score-formatting unit tests as they are. This test does not grade with the provider.

## Files and areas

- A new spec in `tests/e2e`
- A test double or fixture for the model step, next to that spec or in `tests/helpers`, only as far as storing the `COMPLETED` correction
- No change to `workflows/correction-grading.ts` prompt text

Production `correctText` still calls the model for a real user. The replacement is the test's stand-in.

## Behavioral requirements

- From a signed-in session, the theme card is a link the test can follow to the theme, then to the write page.
- Submitting the editor's text reaches `/dashboard/texts/:textId` after the correction status is `COMPLETED`.
- That page shows the theme title and the correction content the test stored.
- Breaking the theme-card link, the `Escrever exercício` link, or the redirect to the feedback page fails this test.

## Constraints

Runtime is Bun. Auth is Better Auth. The write API is Elysia at `app/api/[[...slugs]]`. Routes under `app/(app)` require the session this test creates.

Read `database/schema.md` before inserting the saved correction. The row has to satisfy the freeze rule from PR 7: `text_content` equals the current `text.content`, and `rubric_content` equals the current `rubric.content`, or the database rejects the insert. Status `COMPLETED` is the enum value the feedback page treats as ready. Score stays inside `0.00` through `1000.00`.

Playwright: `test.describe` and `test`, behavior-focused titles. `bun run test:e2e`. The app is `http://localhost:3000`. Migrate and seed the local database before a local run (`docker compose up -d`, `bun run db:migrate`, `bun run db:seed`).

## Verification

Run the new spec on its own, then `bun run test:e2e`.

The existing sign-in and sign-up e2e specs still pass.

When that fresh run holds, check the PR 12 boxes in `docs/pr-plan.md`.

## Done when

`bun run test:e2e` includes this path, and the test fails if the link from the theme card to the feedback page breaks.
