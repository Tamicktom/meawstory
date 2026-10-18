# PR plan

One sequence for the Fallow 2.26.1 scan and the feature-coverage map, both from 2026-10-18. Work the pull requests from top to bottom. A later PR assumes every earlier **Done when** already holds.

Check a box only after that item's outcome is true on a fresh run. Line numbers from the scan will drift; find the symbol by name.

Fallow commands for this CLI: `dead-code`, `dupes`, and `health --hotspots --targets`. It has no separate architecture, security, or flags command. Cycles and boundary counts come from `dead-code`.

## Sequence

| PR | Title | Lands first because |
| --- | --- | --- |
| 1 | Teach Fallow the component gallery | Later dead-code runs stay comparable |
| 2 | Dependencies and the stylesheet | `app/globals.css` imports `shadcn/tailwind.css`, so the package stays installed |
| 3 | Unused primitives and file-local exports | `components/ui` stays intact; later scans ignore its unused exports |
| 4 | Shared auth forms and spec steps | New auth tests should hit the extracted markup |
| 5 | Auth against the real API | The forms and their component tests are already stable |
| 6 | Schema, services, and seed | API and workflow tests need these queries to be pinned down |
| 7 | Lifetime rules in `database/schema.md` | The workflow's first correction insert has to match the freeze rule before step tests lock it in |
| 8 | Write API, correction status, feedback page | The write screen and the end-to-end path call these routes |
| 9 | Correction workflow | The write screen stops waiting only after a failed run stores `FAILED` |
| 10 | Write exercise screen | The end-to-end path submits through this page |
| 11 | Dashboard shell | The end-to-end path starts from the theme list, behind the session gate |
| 12 | Product loop end to end | Pages, routes, and the workflow stub exist |
| 13 | Home page and dark mode | Independent of the loop; the remaining hotspots |

## Snapshot

| Signal | Count |
| --- | ---: |
| Dead-code issues | 42 |
| Unused files | 6 |
| Unused value exports | 26 |
| Unused type exports | 5 |
| Unused dependencies | 3 |
| Unused dev dependencies | 1 |
| Unresolved imports | 1 |
| Circular dependencies | 0 |
| Boundary violations | 0 |
| Functions over the complexity gate (cyclomatic 20 / cognitive 15) | 0 |
| Clone groups | 10 (322 duplicated lines, about 5.0%) |
| Refactor targets | 2 (`field.tsx`, `sidebar.tsx`) |
| Churn hotspots (6 months, at least 3 commits) | 15 |

Health vital signs: 97 files, 178 exports, dead-file share 6.2%, dead-export share 17.4%, average cyclomatic complexity 1.5, maintainability average 91.6.

## Already covered

Leave these alone unless a PR below edits the same file. Re-run the listed test after that edit.

| Behavior | Test |
| --- | --- |
| Sign-up form validation, pending state, errors, trimmed name, navigation home | `tests/components/sign-up-form.spec.ts`, happy path in `tests/e2e/sign-up.spec.ts` |
| Sign-in form validation, pending state, errors, credentials payload, navigation home | `tests/components/sign-in-form.spec.ts`, happy path in `tests/e2e/sign-in.spec.ts` |
| Browser session after the sign-in helper | `tests/e2e/sign-in.spec.ts` |
| Feedback view when a correction is ready (integer score, markdown, frozen text) and when it is pending | `tests/components/feedback-view.spec.ts` |
| Correction output schema, prompt sections, score formatting (`0`–`1000`, two decimals) | `tests/unit/correction-grading.test.ts` |
| Narrative catalog shape: rubric weights and kinds, theme sections, score bands | `tests/unit/narrative-catalog.test.ts` |
| Button default story | `tests/components/button.spec.ts` |

`tests/unit/smoke.test.ts` only asserts `true`. It covers no feature.

Already clean on the scan: no circular dependencies, no boundary violations, no unused enum members, class members, duplicate exports, unlisted dependencies, type-only dependencies, or test-only dependencies.

`components/ui/button/index.tsx` is a hotspot because many modules import it (score 13.7, fan-in 7). Keep the component whole. Caller tests and the existing story are its coverage.

## Fixes inside the PRs

| Gap | PR |
| --- | --- |
| `shadcn` looks unused and is the stylesheet the app loads | 2 |
| Write accepts an empty body and a missing or retired theme | 8 |
| Correction status ignores which user owns the text | 8 |
| A failed submit only logs `Erro ao enviar texto` | 10 |
| The workflow never stores `FAILED`, so the write screen waits forever | 9, then 10 |
| The `PENDING` correction inserts empty frozen bodies, which breaks the freeze rule | 7 |
| The app has no sign-out control | 11 |

## PR 1 — Teach Fallow the component gallery

Scope: [01-teach-fallow-the-component-gallery.md](pr-plans/01-teach-fallow-the-component-gallery.md)

These six files load outside static imports. Deleting them removes the Playwright component gallery.

`playwright/gallery/main.tsx` loads every story with `import.meta.glob("../../components/**/*.story.tsx")`. `playwright/vite.config.ts` aliases `next/navigation` to `playwright/mocks/next-navigation.ts` by file URL.

- [x] Register `playwright/gallery/main.tsx` as an entry point (Fallow config or the detected Vite plugin).
- [x] Keep these story files once that entry is visible:
  - [x] `components/auth/sign-in-form.story.tsx`
  - [x] `components/auth/sign-up-form.story.tsx`
  - [x] `components/feedback/feedback-view.story.tsx`
  - [x] `components/ui/button/button.story.tsx`
- [x] Keep `playwright/mocks/next-navigation.ts` once the Vite alias is visible.

**Done when:** `fallow dead-code` no longer reports those six files, and the component gallery still serves the four stories.

## PR 2 — Dependencies and the stylesheet

Scope: [02-dependencies-and-the-stylesheet.md](pr-plans/02-dependencies-and-the-stylesheet.md)

`app/globals.css` imports `shadcn/tailwind.css` and loads `@plugin "@tailwindcss/typography"`. Fallow only follows JavaScript imports, so both packages show up as unused. The unresolved import it reports (`./shadcn/tailwind.css` on line 1) is that package export, which the source writes as `shadcn/tailwind.css` on line 3.

- [x] Confirm `shadcn/tailwind.css` resolves from the installed `shadcn` package at build time.
- [x] Keep `shadcn` installed. Move it to `devDependencies` when the CSS export and the CLI are its only uses.
- [x] When the build already resolves the export, record it so Fallow stops reporting the unresolved import. Keep the working `@import`.
- [ ] When the package export is missing, point the import at the real stylesheet.
- [x] Remove `@tanstack/react-form-nextjs` after confirming no script, stylesheet, or TypeScript file references it.
- [x] Remove `@tiptap/pm` after the same check.
- [x] Add `@tailwindcss/typography` to `ignoreDependencies` in the Fallow config. Leave the package installed.

**Done when:** `fallow dead-code` drops the three unused dependencies, the typography dev-dependency finding, and the unresolved CSS import. `prose` styles still build.

## PR 3 — Unused primitives and file-local exports

Scope: [03-unused-primitives-and-file-local-exports.md](pr-plans/03-unused-primitives-and-file-local-exports.md)

Fallow's refactor targets are this work: `components/ui/field.tsx` (6 of 10 value exports unused, priority 23.5) and `components/ui/sidebar.tsx` (14 of 24 value exports unused, plus fan-out 7, priority 28.8). Those files are shadcn primitives. Keep every export. Turn `unused-exports` off for `components/ui/**` in `.fallowrc.json`.

- [x] `overrides` in `.fallowrc.json` sets `unused-exports` to `off` for `components/ui/**`.
- [x] `fallow dead-code` no longer lists unused exports under `components/ui`, including `FieldDescription`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle`, the unused `Sidebar*` pieces, `useSidebar`, `AlertAction`, `CardAction`, `SheetTrigger`, `SheetClose`, and `SheetFooter`.

### Exports used only in their own file

Keep the declaration when the file still uses it. Remove `export` / `export type` only.

- [ ] `FeedbackCorrection` in `components/feedback/feedback-view.tsx`
- [ ] `NARRATIVE_SCORE_MAX` in `database/seed/render-rubric.ts`
- [ ] `CriterionKind` in `database/seed/render-rubric.ts`
- [ ] `CriterionBands` in `database/seed/render-rubric.ts`
- [ ] `CriterionDefinition` in `database/seed/render-rubric.ts`
- [ ] `CorrectionOutput` in `workflows/correction-grading.ts`

### Large functions left in `components/ui/sidebar.tsx`

- [ ] Split `Sidebar` (scan: line 152, 101 lines) when Fallow still lists it after the deletions above.
- [ ] Split `SidebarProvider` (scan: line 56, 95 lines) on the same condition.

**Done when:** `fallow dead-code` no longer lists unused exports under `components/ui` or the file-local symbols in this PR, the app shell and the feedback story still render, and `tests/unit/correction-grading.test.ts` passes.

## PR 4 — Shared auth forms and spec steps

Scope: [04-shared-auth-forms-and-spec-steps.md](pr-plans/04-shared-auth-forms-and-spec-steps.md)

Fallow found 4 clone groups (108 duplicated lines) between `components/auth/sign-in-form.tsx` and `components/auth/sign-up-form.tsx`, plus about 75 duplicated lines across the two component specs. Suggested extraction target: `components/auth`.

Hotspots covered here: sign-in form (score 44.2) and sign-up form (score 38.2).

- [x] Share the repeated field stack through one TanStack Form pre-bound field component (`createFormHook` + `form.AppField`). Scan hint: sign-in around lines 57–121, sign-up around lines 54–179. The scope doc names the props and which composition APIs stay unused.
- [x] Keep each form's hook, copy, and field names in that form. The hooks call `useAppForm` in place of `useForm`.
- [x] In `tests/components/sign-in-form.spec.ts`, extract the shared 401 sign-in setup (scan: lines 213–227 and 267–279).
- [x] In `tests/components/sign-up-form.spec.ts`, extract the shared password `aria-invalid` assertions (scan: lines 110–120 and 155–165).
- [x] In the same sign-up spec, extract the shared failed sign-up mount and submit (scan: lines 276–290, 307–319, and 334–348). One helper covers the overlapping 13-line and 15-line groups.
- [x] Extract the invalid-email assertion shared by both specs (sign-in around lines 112–121, sign-up around lines 127–136).
- [x] Extract the post-submit navigation assertion shared by both specs (sign-in around lines 318–328, sign-up around lines 389–399). Parameterize the busy-button name (`Signing in...` vs `Creating account...`).
- [x] Split `SignInForm` and `SignUpForm` only when Fallow still lists them after the extract (scan: 112 and 165 lines).
- [x] Split the anonymous test arrows in the two specs only when the helpers above leave them listed (sign-up scan lines 60, 83, 231; sign-in scan lines 54, 78, 175).

**Done when:** `fallow dupes` no longer groups those form and spec clones, and `sign-in-form.spec.ts` plus `sign-up-form.spec.ts` pass.

## PR 5 — Auth against the real API

Scope: [05-auth-against-the-real-api.md](pr-plans/05-auth-against-the-real-api.md)

The component tests stub Better Auth. These paths never hit the auth API or the database.

- [x] Sign-in with a wrong password fails and stays on the form.
- [x] Sign-up with an email that already exists fails and stays on the form.
- [x] Sign-in and sign-up clear the TanStack Query cache before navigating home (`queryClient.clear` in the form hooks).

**Done when:** an end-to-end or integration test for each bullet fails if that behavior is removed. The existing component specs still pass.

## PR 6 — Schema, services, and seed

Scope: [06-schema-services-and-seed.md](pr-plans/06-schema-services-and-seed.md)

No test inserts, updates, or deletes rows today. Pin the rules the current schema already enforces, then the service queries, then the seed.

`database/schema.ts` is a hotspot (score 27.4, fan-in 8) because many modules import it. Add tests around the queries below. Leave the schema file in one piece.

### Constraints already in the schema

- [x] `correction.score` is rejected outside `0.00` through `1000.00`.
- [x] Deleting a rubric leaves themes and corrections in place (`ON DELETE RESTRICT`).
- [x] Deleting a theme leaves texts in place (`ON DELETE RESTRICT`).
- [x] Deleting a user deletes that user's sessions, accounts, and texts.
- [x] Deleting a text deletes its corrections.
- [x] `user.email` and `session.token` are unique.

### Services

| Service | Behavior to assert |
| --- | --- |
| `themeService.listActiveThemes` | Active themes only, title order, limit 32 |
| `themeService.findThemeById` | Active theme by id, otherwise `null` |
| `textService.findActiveTextWithTheme` | Drops a soft-deleted text or a soft-deleted theme |
| `textService.findActiveTextContent` | Current body of an active text |
| `textService.findOwnedText` | Active text for that user, with the theme title |
| `textService.createText` | Inserts the text and throws `Text was not created` when the insert returns nothing |
| `rubricService.findActiveRubricForTheme` | Joins an active theme to its active rubric |
| `rubricService.findActiveRubricContent` | Current body of an active rubric |
| `correctionService.insertCorrection` | Insert, or no row when the id already exists |
| `correctionService.findCorrectionById` | Row by id, including a soft-deleted row |
| `correctionService.findLatestActiveCorrection` | Newest active correction for a text |
| `correctionService.updateCorrectionStatus` | Status write |
| `correctionService.updateCorrection` | Content, score, frozen text, frozen rubric, and status |

- [x] Each row in the table has a test that fails when the behavior changes.

### Seed

The in-memory catalog shape already has a unit test. Persist these:

- [x] `seedNarrativeCatalog` upserts rubrics and themes and refreshes `updatedAt` when the id already exists.
- [x] `seedTestUser` creates `user@user.user` with a verified email and a credential account when the email is new.
- [x] When that email already exists, the seed resets the password and marks the email verified.

### Large units in this area

- [x] Split `renderRubric` in `database/seed/render-rubric.ts` (scan: line 71, 87 lines) when Fallow still lists it after the seed tests.
- [x] Split the anonymous test at `tests/unit/narrative-catalog.test.ts` line 38 (scan: 85 lines) when Fallow still lists it.

**Done when:** `bun test` covers the constraints, the service table, and the three seed behaviors against the migrated database.

## PR 7 — Lifetime rules in `database/schema.md`

Scope: [07-lifetime-rules.md](pr-plans/07-lifetime-rules.md)

`database/schema.md` states these rules. Application code enforces them in part, and `database/migrations` has no trigger for them. Enforce each rule for every writer (the API and the workflow both insert). A database constraint or trigger is the single place that covers both.

- [x] A rubric can be retired only when no active theme points at it.
- [x] A theme can be retired only when no active text points at it.
- [x] A new theme, or a theme that changes rubric, points at an active rubric.
- [x] A new text, or a text that changes theme, points at an active theme.
- [x] A new correction points at an active text and an active rubric.
- [x] On insert, `text_content` equals the current `text.content`, and `rubric_content` equals the current `rubric.content`.

The workflow's `PENDING` row currently stores empty frozen bodies, then copies the real bodies on the final save. Change that first insert so it stores the current text body and the current rubric body. The final save still refuses to complete when either source changed after the freeze.

- [x] `createEmptyCorrection` writes the current text body and rubric body into the `PENDING` row.
- [x] A test rejects a correction insert whose frozen bodies differ from the current rows.
- [x] A test rejects each of the other five illegal writes above.

**Done when:** those six tests pass on a migrated database, and `database/schema.md` still describes the same rules.

## PR 8 — Write API, correction status, and the feedback page

Scope: [08-write-api-correction-status-feedback-page.md](pr-plans/08-write-api-correction-status-feedback-page.md)

Hotspots: `api/routes/write.ts` (score 27.9) and `app/(app)/dashboard/texts/[textId]/page.tsx` (score 24.8). The ready and pending feedback views are already covered. This PR covers the page around them, plus the two routes.

### `POST /api/write/:themeId` and `textService.createText`

- [x] Without a session the route returns 401 and `{ message: "Unauthorized" }`.
- [x] With a session it inserts a text for that user and theme, titled `Text for theme ${themeId}`, starts the `correctText` workflow, and returns `{ textId }`.
- [x] An empty body is rejected.
- [x] A missing theme or a soft-deleted theme is rejected and inserts no text.
- [x] When the insert returns no row, the caller surfaces `Text was not created`.

### `api/routes/correction.ts` and `correctionService.findLatestActiveCorrection`

- [x] Without a session the route returns 401.
- [x] With a session it returns the latest active correction status for that text id.
- [x] When no active correction exists, the status is `PENDING`.
- [x] A soft-deleted correction is ignored.
- [x] A text owned by another user is rejected.

### `app/(app)/dashboard/texts/[textId]/page.tsx`

- [x] Without a session the page renders not found.
- [x] A text owned by another user, a missing text, or a soft-deleted text renders not found.
- [x] An owned text passes the theme title and the latest active correction into `FeedbackView`.
- [x] When that correction is missing, the view stays on the pending copy.
- [x] A fractional score renders with two decimal places (`formatFeedbackScore`).
- [x] A non-numeric score is shown as stored, without the `de 1000` wording.

**Done when:** each bullet has a test, and the empty-body, inactive-theme, and ownership checks exist in the route or the service it calls.

## PR 9 — Correction workflow

Scope: [09-correction-workflow.md](pr-plans/09-correction-workflow.md)

`workflows/correction.ts` is a hotspot (score 58.7). The prompt, the output schema, and `formatCorrectionScore` already have tests. This PR covers the steps.

- [x] `getText` loads an active text joined to an active theme, and fails with `Text not found` otherwise.
- [x] `getRubric` loads the theme's active rubric, and fails with `Rubric not found` otherwise.
- [x] `createEmptyCorrection` inserts a `PENDING` row with empty content, score `0.00`, and the frozen bodies from PR 7, using the workflow step id.
- [x] A conflicting id inserts nothing and the workflow fails with `Correction not created`.
- [x] The status then moves to `IN_PROGRESS`.
- [x] Grading calls the model with `correctionInstructions` and `buildCorrectionPrompt`. An invalid score fails with `FatalError` before save.
- [x] Before the final write, the step re-reads the text and the rubric. It fails when either row is gone, when `text.content` changed, or when `rubric.content` changed.
- [x] A successful save stores status `COMPLETED` plus the frozen `text_content` and `rubric_content`.
- [x] When the update returns no row and the correction still exists, the step returns that existing id and score.
- [x] When the correction is missing after the update, the step fails with `Correction was not saved`.
- [x] A failed run stores status `FAILED` on the correction row.

**Done when:** each bullet has a test that uses a stand-in for the model call, and a grading failure leaves the row in `FAILED`.

## PR 10 — Write exercise screen

Scope: [10-write-exercise-screen.md](pr-plans/10-write-exercise-screen.md)

Hotspots: `app/(app)/dashboard/exercises/[themeId]/write/_components/editor.tsx` (score 100) and `app/(app)/dashboard/exercises/[themeId]/write/page.tsx` (score 29.6). Files: the page, `editor.tsx`, `hooks/write/use-write-text.ts`, `hooks/correction/use-check-correction-status.ts`, and `hooks/utils/use-interval.ts`.

- [x] An unknown or soft-deleted theme renders not found.
- [x] An active theme shows its markdown beside the editor.
- [x] The editor starts with the TipTap starter content.
- [x] `Enviar texto` posts the editor's plain text to `POST /api/write/:themeId`.
- [x] The button stays disabled while the request is in flight and while the page is waiting for the correction.
- [x] A successful response stores the new text id and shows `A correção está sendo preparada.`
- [x] While that id is set, the page refetches correction status every 3 seconds.
- [x] Status `COMPLETED` clears the wait and opens `/dashboard/texts/:textId`.
- [x] A response without `textId` leaves the page as it was.
- [x] A failed request shows an error and enables the button again.
- [x] Status `FAILED` clears the wait and shows an error.
- [x] Polling stays off when there is no text id (`useInterval` with `null`).
- [x] Split `Editor` (scan: line 24, 72 lines) when Fallow still lists it after these tests pass.

**Done when:** a component test or an end-to-end test covers each bullet, including the visible error on request failure and on `FAILED`.

## PR 11 — Dashboard shell

Scope: [11-dashboard-shell.md](pr-plans/11-dashboard-shell.md)

Hotspots: `app/(app)/dashboard/themes/page.tsx` (score 52.1), `app/(app)/dashboard/themes/[id]/page.tsx` (score 14.2), and `app/(app)/dashboard/page.tsx` (score 14.2).

### Session gate

`app/(app)/layout.tsx` wraps every dashboard route. The e2e suite currently signs in and lands on `/`.

- [ ] A visitor without a session sees `Unauthorized` and does not see the sidebar or the page.
- [ ] A signed-in visitor sees the sidebar, the sidebar trigger, and the page.
- [ ] Add a sign-out control that ends the session.
- [ ] After sign-out, `/dashboard` shows `Unauthorized`.

### Dashboard

- [ ] The page explains that the user picks a theme, writes a text, and receives a correction against that theme's rubric.
- [ ] `Browse themes` goes to `/dashboard/themes`.

### Theme catalog

`themeExcerpt` on `app/(app)/dashboard/themes/page.tsx` is a pure function. The list query is covered in PR 6; this PR covers what the page renders.

- [ ] Active themes are listed by title, at most 32.
- [ ] A soft-deleted theme is left out.
- [ ] Each card links to `/dashboard/themes/:id`.
- [ ] The card excerpt is the `## Situação` section. When that heading is missing, the excerpt is the full description.
- [ ] A theme with an image renders it. A theme without an image does not.
- [ ] An empty catalog shows `No themes yet.`
- [ ] `themeExcerpt` has a unit test.

### Theme detail

- [ ] An unknown id, or a soft-deleted theme, renders not found.
- [ ] An active theme renders its description as markdown.
- [ ] `Escrever exercício` goes to `/dashboard/exercises/:id/write`.

### Sidebar

`components/app/sidebar.tsx`. `isActivePath` is a pure function.

- [ ] The brand link and the Dashboard item go to `/dashboard`.
- [ ] Themes goes to `/dashboard/themes`.
- [ ] Dashboard is active only on that exact path.
- [ ] Themes stays active on `/dashboard/themes` and on nested paths such as a theme detail page.
- [ ] `isActivePath` has a unit test.

**Done when:** each bullet has a test. Sign-out is a control in the signed-in shell, and using it makes the session gate render `Unauthorized`.

## PR 12 — Product loop end to end

Scope: [12-product-loop-end-to-end.md](pr-plans/12-product-loop-end-to-end.md)

One browser test walks the path the earlier PRs covered in pieces. Replace the model step with a saved correction so the test stays deterministic.

- [ ] A signed-in user opens the theme list, opens a theme, and starts the exercise.
- [ ] They submit a text and land on `/dashboard/texts/:textId` once the correction is `COMPLETED`.
- [ ] The feedback page shows that theme's title and the saved correction.

**Done when:** `bun run test:e2e` includes this path, and the test fails if the link from the theme card to the feedback page breaks.

## PR 13 — Home page and dark mode

Scope: [13-home-page-and-dark-mode.md](pr-plans/13-home-page-and-dark-mode.md)

Hotspots: `app/page.tsx` (score 15.6), `api/index.ts` (score 26.8), and `app/layout.tsx` (score 8.6). Sign-in and sign-up e2e tests stop at the heading.

### Home and `GET /api`

- [ ] `GET /api` returns `{ message: "Hello World" }`.
- [ ] The home page renders that message under the `Project ready!` heading.
- [ ] The page tells the visitor to press `d` to toggle dark mode.

### Dark mode hotkey

`components/providers/theme-provider.tsx`.

- [ ] The default theme follows the system preference.
- [ ] Pressing `d` switches between light and dark.
- [ ] The hotkey does nothing while the target is an input, textarea, select, or contenteditable element.
- [ ] The hotkey does nothing when Ctrl, Meta, or Alt is held, or when the key event is a repeat.

**Done when:** each bullet has a test. The existing sign-in and sign-up e2e tests still pass.
