# PR 13 — Home page and dark mode

The home page and the `d` hotkey are independent of the writing loop. Sign-in and sign-up e2e tests stop at the heading, so the hello message, the dark-mode hint, and the hotkey rules have no tests. The behavior is already in the files below. This PR locks it. Change production code only when a bullet is false.

Index: `docs/pr-plan.md`.

## Position

Last in the sequence, and independent of the product loop. It assumes the earlier PRs' done conditions hold only so the suite stays green. Nothing later depends on it.

## In scope

### Home and `GET /api`

`api/index.ts` mounts the Elysia app at `/api`. `GET /` on that app returns `{ message: "Hello World" }`. `app/api/[[...slugs]]/route.ts` forwards `GET` to `app.fetch`. `app/page.tsx` loads that payload with the Eden client and renders it.

- `GET /api` returns `{ message: "Hello World" }`.
- The home page renders that message under the `Project ready!` heading.
- The page tells the visitor to press `d` to toggle dark mode. The current line is the kbd hint under that heading.

### Dark mode hotkey

`components/providers/theme-provider.tsx`, mounted from `app/layout.tsx`. `defaultTheme` is `system` and `enableSystem` is set. `ThemeHotkey` listens for `d`.

- The default theme follows the system preference.
- Pressing `d` switches between light and dark (`resolvedTheme` dark becomes light, and the reverse).
- The hotkey does nothing while the target is an input, textarea, select, or contenteditable element.
- The hotkey does nothing when Ctrl, Meta, or Alt is held, or when the key event is a repeat.

## Out of scope

Leave the dashboard shell, write flow, and auth forms to the earlier PRs. Leave `api/index.ts`, `app/page.tsx`, and `app/layout.tsx` as single files. The plan names them as hotspots and does not ask for a split. Leave the home page markup as it is, aside from a fix that makes a failing bullet true. The demo `Button` on the home page is outside these bullets. If a fix edits that button, give it an `id` and a `type`.

## Files and areas

- `api/index.ts`
- `app/api/[[...slugs]]/route.ts` (the fetch forwarder; change it only if `GET /api` is not reaching the Elysia app)
- `app/page.tsx`
- `app/layout.tsx` (mounts `ThemeProvider`; the hotkey tests need that mount)
- `components/providers/theme-provider.tsx`
- Tests: a request test for `GET /api` (`tests/unit` or `tests/e2e`), and browser tests for the home page and the hotkey (`tests/e2e`, or a component test that mounts `ThemeProvider`)

## Behavioral requirements

Each bullet in the scope has a test that fails if the behavior is removed.

- The JSON body from `GET /api` is `{ message: "Hello World" }`.
- A visitor on `/` sees the heading `Project ready!`, the hello message from that response, and the instruction to press `d`.
- With the system preference set to light, the initial theme is light. With it set to dark, the initial theme is dark.
- `d` toggles the theme. The same key in an input, textarea, select, or contenteditable element does not. `d` with Ctrl, Meta, or Alt does not. A repeated key event does not.

`tests/e2e/sign-in.spec.ts` and `tests/e2e/sign-up.spec.ts` still pass. They stop at the home heading after a successful auth redirect.

## Constraints

Runtime is Bun. `GET /api` is the Elysia app, not a separate Next route handler beyond `app/api/[[...slugs]]/route.ts`.

This Next.js version differs from older docs. Read `node_modules/next/dist/docs/` before changing `app/page.tsx` or `app/layout.tsx`.

Unit tests use `describe` and `it`. Playwright tests use `test.describe` and `test`.

UI rules apply only if production components change: props on a `props` object, every button has an `id` and a `type`, padding rather than margin, import sections with comments. `ThemeProvider` today takes a destructured `children` argument. Leave that signature unless a bullet cannot pass without editing the component. A required edit follows the props-object rule for new parameters.

## Verification

Run each new test file on its own, then the suite for its runner (`bun test` and/or `bun run test:e2e` / `bun run test:ct`).

Run the existing sign-in and sign-up e2e specs.

When that fresh run holds, check the PR 13 boxes in `docs/pr-plan.md`.

## Done when

Each bullet has a test. The existing sign-in and sign-up e2e tests still pass.
