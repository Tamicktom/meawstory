# PR 9 — Correction workflow

`workflows/correction.ts` loads the text and rubric, inserts a `PENDING` correction, grades with the model, and saves `COMPLETED`. The prompt, the output schema, and `formatCorrectionScore` already have tests. The steps do not. A failed run never stores `FAILED`, so the write screen cannot tell a failure from a run that is still in progress. This PR locks the steps and stores `FAILED` once the correction row exists.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 7. The `PENDING` insert stores the current text body and rubric body, with empty correction content and score `0.00`. Depends on PR 6 for the service queries these steps call. PR 10 assumes a grading failure leaves the row `FAILED`, so the write screen can stop waiting. PR 12 assumes a completed run can be replaced by a saved `COMPLETED` correction.

## In scope

Each bullet has a test. The model call is a stand-in. `gradeText` calls `generateText` from `ai` with `openAI("gpt-5-mini")`, `correctionInstructions`, and `buildCorrectionPrompt`. The tests replace that call. They do not call the live model.

`correctText` is the exported workflow (`"use workflow"`). The steps are file-local (`"use step"`). Assert the outcomes. Export a step only if that is what lets the test reach it.

- `getText` loads an active text joined to an active theme (`textService.findActiveTextWithTheme`), and fails with `Text not found` otherwise. A soft-deleted text or theme is the failure case.
- `getRubric` loads the theme's active rubric (`rubricService.findActiveRubricForTheme`), and fails with `Rubric not found` otherwise.
- `createEmptyCorrection` inserts a `PENDING` row with empty `content`, score `0.00`, and the frozen bodies from PR 7. The id is the workflow step id from `getStepMetadata()`.
- A conflicting id inserts nothing (`correctionService.insertCorrection` uses `onConflictDoNothing`) and the workflow fails with `Correction not created`.
- The status then moves to `IN_PROGRESS`.
- Grading calls the model with `correctionInstructions` and `buildCorrectionPrompt`. An invalid score fails with `FatalError` before save. `formatCorrectionScore` in `workflows/correction-grading.ts` is what rejects a non-finite score or a score outside `0` through `1000`. Leave that function's rules as the existing unit test locks them.
- Before the final write, the step re-reads the text and the rubric. It fails when either row is gone, when `text.content` changed (`Text changed before the correction was saved`), or when `rubric.content` changed (`Rubric changed before the correction was saved`).
- A successful save stores status `COMPLETED` plus the frozen `text_content` and `rubric_content` taken from that re-read, which match the bodies grading used.
- When the update returns no row and the correction still exists, the step returns that existing id and score.
- When the correction is missing after the update, the step fails with `Correction was not saved`.
- A failed run stores status `FAILED` on the correction row. This write does not exist today. Once `createEmptyCorrection` has inserted a row, a later failure of that run sets the row to `FAILED`. The required case is a grading failure (`FatalError` before save). Failures before a row exists (`Text not found`, `Rubric not found`, `Correction not created`) still fail the run and do not invent a row.

## Out of scope

Leave the write route's validation and the feedback page to PR 8. Leave the editor's wait state, polling, and the visible error to PR 10. Leave prompt wording, the output schema, and score formatting rules to `tests/unit/correction-grading.test.ts`. This PR does not split `workflows/correction.ts` for size. The plan names the steps to test, not a file split.

## Files and areas

- `workflows/correction.ts`
- `services/text.ts`, `services/rubric.ts`, `services/correction.ts` (called, not rewritten unless a step's outcome is false)
- `workflows/correction-grading.ts` only if a test import needs a symbol that is already exported
- New tests in `tests/unit`, against the migrated database where the step reads or writes rows

## Constraints

Runtime is Bun. Read `database/schema.md` before changing correction writes. The insert must keep PR 7's freeze: `text_content` and `rubric_content` equal the current rows, or the database rejects the insert. Status values are the enum on `correction`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`.

Soft-deleted text, theme, or rubric is "not found" for `getText` and `getRubric`. `findCorrectionById` still returns a soft-deleted row; the final-save "row still exists" branch uses that read.

Unit tests use `describe` and `it`. Run them with `bun test`.

The workflow package is `workflow`. Use its test helper if driving `"use workflow"` / `"use step"` requires one. The stand-in replaces `generateText`. It does not reimplement the model.

## Verification

Migrate the local database. Run the new workflow tests on their own, then `bun test`.

Re-run `tests/unit/correction-grading.test.ts`.

When that fresh run holds, check the PR 9 boxes in `docs/pr-plan.md`.

## Done when

Each bullet has a test that uses a stand-in for the model call, and a grading failure leaves the row in `FAILED`.
