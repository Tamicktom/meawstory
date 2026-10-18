# PR 6 — Schema, services, and seed

No test inserts, updates, or deletes rows today. API and workflow tests in later PRs need the current schema rules, service queries, and seed behavior pinned down. This PR adds those tests. The schema file stays one piece: it is a hotspot because many modules import `database/schema.ts`.

Index: `docs/pr-plan.md`.

## Position

Depends on the earlier PRs only for a comparable tree. The behaviors below are already implemented. Later PRs assume a test fails when one of them changes. Lifetime rules that the database does not enforce yet are PR 7. This PR tests the constraints and queries that already exist.

## In scope

Put the tests where `bun test` runs them: `tests/unit`. They run against the migrated local database (Docker Postgres from `docker-compose.yml`, then `bun run db:migrate`). Isolate rows with ids that belong to the test, or roll the work back, so one test does not depend on another test's leftovers.

Read `database/schema.md` before writing queries or deletes. Change production code only when a listed behavior is false, or when the conditional Fallow split at the end still applies.

### Constraints already in the schema

Each bullet has a test that fails when the behavior changes.

- `correction.score` is rejected outside `0.00` through `1000.00`. The column is `numeric(6, 2)` with the `correction_score_range` check.
- Deleting a rubric leaves themes and corrections in place. `theme.rubric_id` and `correction.rubric_id` are `ON DELETE RESTRICT`. The delete fails and the child rows remain.
- Deleting a theme leaves texts in place. `text.theme_id` is `ON DELETE RESTRICT`.
- Deleting a user deletes that user's sessions, accounts, and texts. `session.user_id`, `account.user_id`, and `text.user_id` cascade. Corrections on those texts go with the texts, because `correction.text_id` cascades. `verification` has no foreign key to `user` and stays.
- Deleting a text deletes its corrections.
- `user.email` and `session.token` are unique.

These are hard `DELETE` and check constraints. Soft-delete lifetime rules (retiring a rubric or theme, active-target checks, frozen bodies on insert) are PR 7.

### Services

Each row has a test that fails when the behavior changes. The functions live on the exported service objects.

| Service | Behavior to assert |
| --- | --- |
| `themeService.listActiveThemes` | Active themes only (`deleted_at` null), title order, limit 32. Columns: id, title, description, image. |
| `themeService.findThemeById` | Active theme by id, otherwise `null`. A soft-deleted theme is `null`. |
| `textService.findActiveTextWithTheme` | Drops a soft-deleted text or a soft-deleted theme. Returns id, content, theme id, theme title, theme description. |
| `textService.findActiveTextContent` | Current body of an active text, otherwise `null`. |
| `textService.findOwnedText` | Active text for that user, with the theme title. Another user's text, a missing id, or a soft-deleted text is `null`. |
| `textService.createText` | Inserts the text with title `Text for theme ${themeId}` and throws `Text was not created` when the insert returns nothing. |
| `rubricService.findActiveRubricForTheme` | Joins an active theme to its active rubric. A soft-deleted theme or rubric yields `null`. |
| `rubricService.findActiveRubricContent` | Current body of an active rubric, otherwise `null`. |
| `correctionService.insertCorrection` | Inserts, or returns no row when the id already exists (`onConflictDoNothing`). |
| `correctionService.findCorrectionById` | Row by id, including a soft-deleted row. |
| `correctionService.findLatestActiveCorrection` | Newest active correction for a text (`deleted_at` null, `created_at` descending). |
| `correctionService.updateCorrectionStatus` | Writes `status`. |
| `correctionService.updateCorrection` | Writes content, score, frozen text, frozen rubric, and status. |

Source files: `services/theme.ts`, `services/text.ts`, `services/rubric.ts`, `services/correction.ts`.

### Seed

The in-memory catalog shape already has `tests/unit/narrative-catalog.test.ts`. This PR persists these behaviors:

- `seedNarrativeCatalog` in `database/seed/index.ts` upserts rubrics and themes and refreshes `updatedAt` when the id already exists.
- `seedTestUser` in `database/seed/test-user.ts` creates `user@user.user` with a verified email and a credential account when the email is new. The password is the one in that file (also documented as the local test user in `AGENTS.md`).
- When that email already exists, the seed resets the password and marks the email verified.

### Large units

Split `renderRubric` in `database/seed/render-rubric.ts` only when Fallow still lists it after the seed tests. The scan cited about 87 lines. Find it by name.

Split the anonymous test in `tests/unit/narrative-catalog.test.ts` only when Fallow still lists it after these tests. The scan cited the test near the start of that file, about 85 lines. Find it by the `describe` / `it` (or current test) title. The catalog assertions stay.

## Out of scope

Leave `database/schema.ts` as one file. Leave new lifetime triggers and the `PENDING` frozen-body insert to PR 7. Leave route and page tests to PRs 8 through 13. Leave the narrative catalog's rubric weights, theme sections, and score bands to the existing unit test; re-run it, do not rewrite the catalog content.

## Files and areas

- New tests in `tests/unit`
- `database/schema.ts` only if a listed constraint is missing
- `services/theme.ts`, `services/text.ts`, `services/rubric.ts`, `services/correction.ts` only if a listed query is false
- `database/seed/index.ts`, `database/seed/test-user.ts`, `database/seed/render-rubric.ts` for the seed bullets and the conditional split

## Constraints

Runtime is Bun. `bun test` ignores `tests/e2e` and `tests/components` (`bunfig.toml`).

Read `database/schema.md` before changing tables, queries, deletes, seeds, or correction behavior. Soft delete applies to `rubric`, `theme`, `text`, and `correction`: `deleted_at` null means active. Hard `DELETE` is what the restrict and cascade bullets above test. Retiring a row (setting `deleted_at`) is PR 7.

Unit tests use `describe` and `it`. Names state the behavior.

`database/index.ts` connects with `DATABASE_URL`. Local defaults are in `example.env` (host port 5432, user `postgres`, password `postgres`, database `postgres`).

## Verification

Start the database if it is down: `docker compose up -d`, wait until it is healthy, then `bun run db:migrate`.

Run the new test file on its own, then `bun test`.

Re-run `tests/unit/narrative-catalog.test.ts` if the seed or catalog modules change.

When that fresh run holds, check the PR 6 boxes in `docs/pr-plan.md`.

## Done when

`bun test` covers the constraints, the service table, and the three seed behaviors against the migrated database.
