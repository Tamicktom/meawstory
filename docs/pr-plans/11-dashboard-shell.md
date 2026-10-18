# PR 11 — Dashboard shell

Every dashboard route sits behind `app/(app)/layout.tsx`. A signed-out visitor should see `Unauthorized` and nothing else. A signed-in visitor should see the sidebar and the page, and should be able to sign out. The theme list and theme detail are how the product loop starts. Most of this UI already exists. The app has no sign-out control. This PR locks the shell with tests and adds that control.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 6 for `themeService.listActiveThemes` and `findThemeById`. The list query's SQL is tested there; this PR covers what the pages render. PR 12 starts from the theme list, behind this session gate, and uses sign-out only as part of the shell being real. The write page and the feedback page keep their own not-found branches from PRs 8 and 10.

## In scope

### Session gate

`app/(app)/layout.tsx` wraps every route under `app/(app)`. The e2e suite currently signs in and lands on `/`.

- A visitor without a session sees the heading `Unauthorized` and does not see the sidebar or the page. The layout already returns that heading and skips children.
- A signed-in visitor sees the sidebar, the sidebar trigger (`SidebarTrigger`), and the page.
- Add a sign-out control that ends the Better Auth session. It lives in the signed-in shell (`app/(app)/layout.tsx` or `components/app/sidebar.tsx`). It is a button with an `id`, `type="button"`, and accessible name `Sign out`. The shell's other labels are English (`Dashboard`, `Themes`, `Unauthorized`).
- After sign-out, `/dashboard` shows `Unauthorized`.

The client is `lib/auth-client.ts`. The server session check is `auth.api.getSession` in the layout.

### Dashboard

`app/(app)/dashboard/page.tsx` already contains the copy and the link. This PR tests them.

- The page explains that the user picks a theme, writes a text, and receives a correction against that theme's rubric. The current paragraph is that explanation. Keep it.
- `Browse themes` goes to `/dashboard/themes` (`id="dashboard-browse-themes"`).

### Theme catalog

`app/(app)/dashboard/themes/page.tsx`. `themeExcerpt` is a pure function in that file. It is not exported. The unit test imports it, so export it without changing the match.

- Active themes are listed by title, at most 32. The service already orders by title and limits to 32. The page renders that result and does not add a second limit. A soft-deleted theme is left out.
- Each card links to `/dashboard/themes/:id`.
- The card excerpt is the `## Situação` section. When that heading is missing, or the section is empty, the excerpt is the full description trimmed.
- A theme with an image renders it. A theme without an image does not.
- An empty catalog shows `No themes yet.`
- `themeExcerpt` has a unit test.

### Theme detail

`app/(app)/dashboard/themes/[id]/page.tsx`.

- An unknown id, or a soft-deleted theme, renders not found (`findThemeById` returns `null`, then `notFound()`).
- An active theme renders its description as markdown.
- `Escrever exercício` goes to `/dashboard/exercises/:id/write`.

The page also shows the heading `Theme Page` and the theme id. Leave that markup. This PR does not redesign the detail layout.

### Sidebar

`components/app/sidebar.tsx`. `isActivePath` is a pure function in that file and is not exported. Export it for the unit test without changing the match.

- The brand link and the Dashboard item go to `/dashboard`.
- Themes goes to `/dashboard/themes`.
- Dashboard is active only on that exact path.
- Themes stays active on `/dashboard/themes` and on nested paths such as a theme detail page.
- `isActivePath` has a unit test.

## Out of scope

Leave the write editor and correction polling to PR 10. Leave the feedback score formatting to PR 8. Leave the home page and the `d` hotkey to PR 13. Leave `components/ui/sidebar.tsx` primitives to PR 3. The list query's filter, order, and limit are PR 6; this PR asserts the rendered list.

## Files and areas

- `app/(app)/layout.tsx`
- `components/app/sidebar.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/dashboard/themes/page.tsx`
- `app/(app)/dashboard/themes/[id]/page.tsx`
- `lib/auth-client.ts` for the sign-out call
- Tests in `tests/e2e` for the shell, and `tests/unit` for `themeExcerpt` and `isActivePath`

Signed-in browser tests use `tests/factories/sign-up-account.ts` and `tests/helpers/sign-in.ts`. Theme-list tests need the seeded catalog (`bun run db:seed`) or rows the test inserts.

## Constraints

Runtime is Bun. Auth is Better Auth. Routes under `app/(app)` require a session; this layout is that gate.

This Next.js version differs from older docs. Read `node_modules/next/dist/docs/` before changing layouts or pages.

UI: new components take a `props` object. The sign-out button has an `id` and `type="button"`. Prefer padding over margin. Import sections use comments.

`themeExcerpt` and `isActivePath` unit tests use `describe` and `it`. Browser tests use `test.describe` and `test`.

Read `database/schema.md` only if a test inserts themes. Soft-deleted themes stay out of `listActiveThemes` and `findThemeById`.

## Verification

Run the new unit tests on their own, then `bun test`.

Run the new e2e spec on its own, then `bun run test:e2e`. The existing sign-in spec still passes (`tests/e2e/sign-in.spec.ts`), including the helper that lands on `/`.

When that fresh run holds, check the PR 11 boxes in `docs/pr-plan.md`.

## Done when

Each bullet has a test. Sign-out is a control in the signed-in shell, and using it makes the session gate render `Unauthorized`.
