# PR 8 — Write API, correction status, and the feedback page

The write route accepts an empty body and a missing or retired theme. The correction-status route ignores which user owns the text. The feedback page around `FeedbackView` has no tests of its own; the ready and pending views are already covered. This PR closes those gaps and locks the route and page outcomes.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 6 (the service queries) and PR 7 (a correction insert must freeze the current bodies). The write screen (PR 10) and the end-to-end path (PR 12) call these routes. The signed-out shell that shows `Unauthorized` for every `app/(app)` route is PR 11. This PR keeps the page function's own not-found branch and does not change that layout.

## In scope

### `POST /api/write/:themeId`

Elysia route in `api/routes/write.ts`, mounted by `api/index.ts` under `/api`, served from `app/api/[[...slugs]]/route.ts`. Body is `{ content }`.

- Without a session the route returns 401 and `{ message: "Unauthorized" }`. This is already the route's behavior. The test fails if it changes.
- With a session it inserts a text for that user and theme, titled `Text for theme ${themeId}` (set in `textService.createText`), starts the `correctText` workflow (`start(correctText, [newText.id])` from `workflow/api`), and returns `{ textId }`. The route test asserts the workflow is started with that id. It uses a stand-in for the workflow runner so this PR does not execute the model.
- An empty body is rejected. `content: ""` does not insert a text and the response is not `{ textId }`. The schema today is `z.string()` with no minimum, so this check is new. It lives in the route or in `textService.createText`.
- A missing theme or a soft-deleted theme is rejected and inserts no text. `themeService.findThemeById` already returns `null` for both. `createText` does not check the theme today. The check lives in the route or in the service it calls.
- When the insert returns no row, the caller surfaces `Text was not created`. `textService.createText` already throws that error. The route must not swallow it.

The plan does not name a status code or error string for the empty body or the inactive theme. The test locks a non-success response and the absence of a text row. Reuse `{ message: "Unauthorized" }` only for the missing-session case.

### `GET /api/correction/check-correction-status/:textId`

Route in `api/routes/correction.ts`.

- Without a session the route returns 401. The current body is `{ message: "Unauthorized" }`. Keep that body.
- With a session it returns the latest active correction status for that text id: `{ status }`.
- When no active correction exists for a text the caller may see, the status is `PENDING`.
- A soft-deleted correction is ignored. `correctionService.findLatestActiveCorrection` already filters `deleted_at`. If that retired row is the only one, the status is `PENDING`.
- A text owned by another user is rejected. The response is not `{ status }` for that text. The check is missing today. It lives in the route or in the service it calls. `PENDING` is not the rejection: `PENDING` means the caller may see the text and no active correction exists.

The plan does not name the status code for the ownership rejection. The test locks a non-success response that does not reveal the other user's correction.

### `app/(app)/dashboard/texts/[textId]/page.tsx`

- The page function calls `notFound()` when there is no session. A signed-out browser request is answered first by `app/(app)/layout.tsx`, which renders the `Unauthorized` heading and skips children. That shell is PR 11. This PR tests the page's own branch and leaves the layout alone.
- A text owned by another user, a missing text, or a soft-deleted text renders not found. `textService.findOwnedText` already returns `null` for those, and the page already calls `notFound()`.
- An owned text passes the theme title and the latest active correction into `FeedbackView`.
- When that correction is missing, the view stays on the pending copy: `A correção ainda está sendo preparada.`
- A fractional score renders with two decimal places (`formatFeedbackScore` in `components/feedback/feedback-view.tsx`). A numeric score stays on the `Nota {score} de 1000` line. The existing component spec covers the integer case `Nota 720 de 1000`.
- A non-numeric score is shown as stored, without the `de 1000` wording. The ready-state markup today always appends `de 1000` after `formatFeedbackScore`. This PR changes that branch. `formatFeedbackScore` already returns a non-numeric string unchanged.

## Out of scope

Leave the workflow steps and `FAILED` to PR 9. Leave the editor, polling, and the visible submit error to PR 10. Leave the session gate's browser-visible `Unauthorized` shell, sign-out, and the theme list to PR 11. Leave the integer ready view and the pending view's existing stories as they are, aside from the non-numeric branch above. Re-run `tests/components/feedback-view.spec.ts` if the view file changes.

Whitespace-only content is not an extra rule. The empty-body bullet is `content: ""`.

## Files and areas

- `api/routes/write.ts`
- `api/routes/correction.ts`
- `services/text.ts` and `services/correction.ts` if the new checks live there
- `app/(app)/dashboard/texts/[textId]/page.tsx`
- `components/feedback/feedback-view.tsx` for the non-numeric score line
- Tests in `tests/unit`, `tests/components`, or `tests/e2e`, chosen by what they call

Route tests call the Elysia app with a real session and the migrated database. Score formatting can be a component test of `FeedbackView` (add cases next to the Ready and Pending stories). Page not-found and wiring tests exercise the page function or a signed-in browser, and they do not replace the layout gate.

## Constraints

Runtime is Bun. Auth is Better Auth. Session lookup in these routes uses `auth.api.getSession` with `headers()` from `next/headers`.

Read `database/schema.md` before changing queries or correction rows. Soft-deleted texts, themes, and corrections stay out of the active reads these routes use. A correction insert from the workflow still has to satisfy PR 7; this PR does not relax that.

Routes under `app/(app)` sit behind the layout session gate. This Next.js version differs from older docs. Read `node_modules/next/dist/docs/` before changing the page.

Unit tests use `describe` and `it`. Playwright files use `test.describe` and `test`.

UI rules if the view or page gains markup: props on a `props` object, every new button has an `id` and a `type`, padding rather than margin, import sections with comments. The page currently has no button.

## Verification

Migrate the local database first.

Run each new test file on its own, then the suite for its runner (`bun test`, `bun run test:ct`, or `bun run test:e2e`).

Re-run `tests/components/feedback-view.spec.ts` if `feedback-view.tsx` changes.

When that fresh run holds, check the PR 8 boxes in `docs/pr-plan.md`.

## Done when

Each bullet has a test, and the empty-body, inactive-theme, and ownership checks exist in the route or the service it calls.
