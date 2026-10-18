# PR 10 — Write exercise screen

The write page shows the theme beside a TipTap editor and posts the plain text to the write API. While a text id is set it polls correction status. A failed submit only logs `Erro ao enviar texto`, and status `FAILED` never clears the wait, so the page can wait forever. This PR locks the screen's behavior and makes both failures visible. The route and the workflow that stores `FAILED` already exist from PRs 8 and 9.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 8 (`POST /api/write/:themeId` and `GET /api/correction/check-correction-status/:textId`) and PR 9 (a failed run stores `FAILED`). PR 12 submits through this page. The signed-out shell is PR 11; theme-not-found here is the page's own `notFound()`, for a request that reaches the page.

## In scope

Files: `app/(app)/dashboard/exercises/[themeId]/write/page.tsx`, `app/(app)/dashboard/exercises/[themeId]/write/_components/editor.tsx`, `hooks/write/use-write-text.ts`, `hooks/correction/use-check-correction-status.ts`, and `hooks/utils/use-interval.ts`.

A component test or an end-to-end test covers each bullet.

- An unknown or soft-deleted theme renders not found. `themeService.findThemeById` returns `null` for both, and the page calls `notFound()`.
- An active theme shows its markdown beside the editor. The page parses `theme.description` and renders it in the `prose` column.
- The editor starts with the TipTap starter content already in the file: `INITIAL_CONTENT` is `<p>Hello World! 🌎️</p>`, via `@tiptap/starter-kit`.
- `Enviar texto` posts the editor's plain text (`editor.getText()`) to `POST /api/write/:themeId`. The button is `id="submit-text"` `type="button"`.
- The button stays disabled while the request is in flight (`useWriteText` pending) and while the page is waiting for the correction.
- A successful response stores the new text id and shows `A correção está sendo preparada.`
- While that id is set, the page refetches correction status every 3 seconds. The delay constant is `INTERVAL_CHECK_CORRECTION_STATUS` (3000). `useCheckCorrectionStatus` reads `GET /api/correction/check-correction-status/:textId`.
- Status `COMPLETED` clears the wait and opens `/dashboard/texts/:textId` for the id the write API returned.
- A response without `textId` leaves the page as it was: no waiting copy, no navigation, button not left disabled.
- A failed request shows an error and enables the button again. Today `useWriteText` only `console.log`s `Erro ao enviar texto` in `onError`. The page shows an error the user can see. That existing log string is the visible copy, so the screen does not gain a second message.
- Status `FAILED` clears the wait (the preparing line goes away) and shows an error. The button enables again because the wait is cleared and the request is not pending. The screen does not handle `FAILED` today.
- Polling stays off when there is no text id. `useInterval` receives `null` in that case and does not start an interval. A delay of `null` or less than or equal to `0` is the hook's off switch.

Split `Editor` only when Fallow still lists it after these tests pass. The scan cited about 72 lines in `editor.tsx`. Find it by name. The split preserves the behavior above.

## Out of scope

Leave route validation, ownership, and the feedback page's score formatting to PR 8. Leave the workflow's model call and the `FAILED` write to PR 9. Leave the theme catalog, session gate, and sign-out to PR 11. Leave `@tiptap/react` and `@tiptap/starter-kit` installed (PR 2 removes `@tiptap/pm` only).

## Files and areas

- `app/(app)/dashboard/exercises/[themeId]/write/page.tsx`
- `app/(app)/dashboard/exercises/[themeId]/write/_components/editor.tsx`
- `hooks/write/use-write-text.ts`
- `hooks/correction/use-check-correction-status.ts`
- `hooks/utils/use-interval.ts`
- Tests in `tests/components` or `tests/e2e`

The theme-not-found bullet is a page test. The editor bullets can mount `Editor` in the component gallery or drive the page in the e2e project. Either runner is acceptable per bullet. The visible error on request failure and on `FAILED` is included.

## Constraints

Runtime is Bun. The page is under `app/(app)`, so a signed-out browser hits the layout gate from PR 11 before this page. Tests of theme-not-found and of submit use a session when they go through the browser.

The write client is Eden (`lib/eden.ts`) against the Elysia API. This Next.js version differs from older docs. Read `node_modules/next/dist/docs/` before changing the page.

UI: the editor takes `props.themeId` and keeps that shape. Every button has an `id` and a `type`. Prefer padding over margin. Import sections use comments. New Playwright tests use `test.describe` and `test` with behavior-focused titles. A unit test of `useInterval`, if added, uses `describe` and `it` under `tests/unit`.

## Verification

Run each new spec on its own, then `bun run test:ct` or `bun run test:e2e` for the project that holds it. Run `bun test` as well when a unit test was added.

When that fresh run holds, check the PR 10 boxes in `docs/pr-plan.md`.

## Done when

A component test or an end-to-end test covers each bullet, including the visible error on request failure and on `FAILED`.
