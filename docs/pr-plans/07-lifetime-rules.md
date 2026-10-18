# PR 7 — Lifetime rules in `database/schema.md`

`database/schema.md` states the lifetime rules for retiring catalog rows, for new rows pointing at active targets, and for freezing the text and rubric on a correction insert. Application code enforces them in part. `database/migrations` has no trigger for them. The workflow's `PENDING` insert stores empty frozen bodies, which breaks the freeze rule. This PR puts each rule in the database, so the API and the workflow cannot bypass it, and it fixes that first insert.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 6, which pins the constraints and queries that already exist. PR 9's `PENDING` row assumes this insert stores the current text body and rubric body. The final save in the workflow already refuses to complete when either source changed after the freeze; leave that refusal in place. PR 9 tests it.

## In scope

Enforce each rule for every writer. A check inside one service is not enough. A database constraint or trigger is the single place that covers the API, the workflow, the seed, and any later writer. Add a migration under `database/migrations`. Reflect it in `database/schema.ts` when Drizzle can express it. Cross-table rules that Drizzle cannot express stay in the migration SQL. Keep `database/schema.ts` as one file.

`database/schema.md` still describes the same rules. Change enforcement, not the prose.

Active means `deleted_at` is null. Retiring a row sets `deleted_at`. That is not a hard `DELETE`. Hard `DELETE` restrict and cascade behavior stays as PR 6 tested it.

Rules to enforce:

- A rubric can be retired only when no active theme points at it.
- A theme can be retired only when no active text points at it.
- A new theme, or a theme that changes rubric, points at an active rubric.
- A new text, or a text that changes theme, points at an active theme.
- A new correction points at an active text and an active rubric.
- On insert, `text_content` equals the current `text.content`, and `rubric_content` equals the current `rubric.content` of the rubric used for that correction.

`createEmptyCorrection` in `workflows/correction.ts` is the writer that currently stores empty frozen bodies. The `PENDING` row must store the current text body and the current rubric body. Correction `content` stays empty and `score` stays `0.00` on that first insert. Filling the correction content and the real score is the final save, which PR 9 covers.

The caller `correctText` already loads the text and the rubric before that insert. Passing those bodies in, or reading them inside the step, both meet the outcome. The row is what the test checks.

The final `updateCorrection` step still fails when `text.content` or `rubric.content` changed after the freeze. Those errors already exist: `Text changed before the correction was saved` and `Rubric changed before the correction was saved`.

## Out of scope

Leave workflow step tests, `FAILED` status, the write route's empty-body and theme checks, and the write screen to PRs 8 through 10. Leave the score-range check and the hard-delete foreign keys to the tests from PR 6. Leave the wording of `database/schema.md` as it is.

## Files and areas

- `database/schema.md` (read it; the rules stay)
- `database/schema.ts`
- A new migration in `database/migrations`
- `workflows/correction.ts` (`createEmptyCorrection`)
- New tests in `tests/unit`, against the migrated database

## Behavioral requirements

Six tests, each failing when that illegal write succeeds:

- A correction insert whose `text_content` or `rubric_content` differs from the current rows is rejected.
- Retiring a rubric that an active theme still points at is rejected.
- Retiring a theme that an active text still points at is rejected.
- A new theme, or a theme whose `rubric_id` changes, is rejected when the rubric is missing or retired.
- A new text, or a text whose `theme_id` changes, is rejected when the theme is missing or retired.
- A new correction is rejected when its text or its rubric is missing or retired.

After `createEmptyCorrection`, the `PENDING` row's `text_content` equals the text's current body and its `rubric_content` equals the rubric's current body. `content` is empty and `score` is `0.00`.

A direct insert that skips the service hits the same rejection. That is the point of the database rule.

## Constraints

Runtime is Bun. Read `database/schema.md` before changing tables, queries, deletes, seeds, or correction behavior.

Soft delete applies only to `rubric`, `theme`, `text`, and `correction`. Later edits to `text.content`, `rubric.content`, or `theme.rubric_id` do not change corrections already stored. The insert-time equality is the rule this PR enforces. The "source changed before save" refusal stays in the workflow.

Generate migrations with the project script (`bun run db:generate`) when the Drizzle schema is the source of the change. Apply them with `bun run db:migrate`. A hand-written migration is appropriate when the rule is a trigger Drizzle does not model. Either way, `bun run db:migrate` on a fresh local database is how the tests run.

Unit tests use `describe` and `it`.

## Verification

`docker compose up -d`, then `bun run db:migrate`.

Run the six tests on their own, then `bun test`.

When that fresh run holds, check the PR 7 boxes in `docs/pr-plan.md`.

## Done when

Those six tests pass on a migrated database, and `database/schema.md` still describes the same rules.
