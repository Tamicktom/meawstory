# PR 3 — Unused primitives and file-local exports

Fallow's refactor targets are `components/ui/field.tsx` (unused value exports) and `components/ui/sidebar.tsx` (unused value exports and two large functions). Other primitives export pieces nothing imports, and a handful of symbols are exported only because the same file reads them. This PR removes that dead surface so later tests target components the product still renders.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 1 and PR 2, so the dead-code list is comparable. Later PRs assume the symbols below are gone from `fallow dead-code`, the dashboard shell still renders, and `tests/unit/correction-grading.test.ts` still passes.

## In scope

Search the repo, including the declaring file, before each deletion. Delete the component when that search shows zero references. Removing only the `export` keyword would leave a private function nothing calls.

### `components/ui/field.tsx`

Delete these functions and drop them from the export list. A search finds them only as definitions and export names:

- `FieldDescription`
- `FieldLegend`
- `FieldSeparator`
- `FieldSet`
- `FieldContent`
- `FieldTitle`

Keep `Field`, `FieldLabel`, `FieldError`, and `FieldGroup`. The auth forms import those.

### `components/ui/sidebar.tsx`

Delete these functions and drop them from the export list when a search shows zero call sites:

- `SidebarFooter`
- `SidebarGroupAction`
- `SidebarGroupLabel`
- `SidebarInput`
- `SidebarInset`
- `SidebarMenuAction`
- `SidebarMenuBadge`
- `SidebarMenuSkeleton`
- `SidebarMenuSub`
- `SidebarMenuSubButton`
- `SidebarMenuSubItem`
- `SidebarRail`
- `SidebarSeparator`

`useSidebar` is on the scan's unused-export list, and the file still calls it from `Sidebar`, `SidebarTrigger`, and `SidebarMenuButton` (and from `SidebarRail`, which this PR deletes). Those three callers stay, because the shell uses them. Remove `useSidebar` from the public export and keep the function.

Keep the exports the shell imports:

- `app/(app)/layout.tsx` imports `SidebarProvider` and `SidebarTrigger`
- `components/app/sidebar.tsx` imports `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`, `SidebarHeader`, `SidebarMenu`, `SidebarMenuButton`, and `SidebarMenuItem`

The mobile sidebar inside this file imports `Sheet`, `SheetContent`, `SheetDescription`, `SheetHeader`, and `SheetTitle` from `components/ui/sheet.tsx`. Those stay.

### Other primitives

Delete the function and the export when a search shows zero references:

- `AlertAction` in `components/ui/alert.tsx`. Keep `Alert`, `AlertTitle`, and `AlertDescription` (auth forms).
- `CardAction` in `components/ui/card.tsx`. Keep the card pieces the auth forms and the theme list import.
- `SheetTrigger`, `SheetClose`, and `SheetFooter` in `components/ui/sheet.tsx`. Keep `SheetPortal` and `SheetOverlay`; `SheetContent` renders them.

### Exports the file still reads

Keep the declaration. Remove `export` or `export type` only.

- `FeedbackCorrection` in `components/feedback/feedback-view.tsx` (the props type uses it)
- `NARRATIVE_SCORE_MAX`, `CriterionKind`, `CriterionBands`, and `CriterionDefinition` in `database/seed/render-rubric.ts` (the renderer reads them)

`CorrectionOutput` in `workflows/correction-grading.ts` is on that same list, and nothing in the file or the repo reads the alias. The plan's rule is to keep a declaration the file still uses. This alias has no reader, so delete it. The completion check is that `fallow dead-code` no longer lists the name.

### Large functions

After the deletions above, split `Sidebar` and `SidebarProvider` only when `fallow` still lists those functions. The scan cited them near the top of `components/ui/sidebar.tsx` (about 101 and 95 lines). Find them by name. The split preserves behavior and the exports the shell imports.

## Out of scope

Leave `components/ui/button/index.tsx` whole. It is a hotspot because many modules import it; caller tests and `tests/components/button.spec.ts` are its coverage.

Leave auth-form duplication, schema tests, and product pages to later PRs. Leave the remaining primitives' prop style and visual design as they are. A conditional split of `Sidebar` or `SidebarProvider` is a size split, not a restyle.

## Files and areas

- `components/ui/field.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/alert.tsx`
- `components/ui/card.tsx`
- `components/ui/sheet.tsx`
- `components/feedback/feedback-view.tsx`
- `database/seed/render-rubric.ts`
- `workflows/correction-grading.ts`

## Behavioral requirements

- `fallow dead-code` no longer lists the symbols in this PR.
- The signed-in shell still renders: sidebar, sidebar trigger, and page content from `app/(app)/layout.tsx` and `components/app/sidebar.tsx`.
- The feedback story still renders (`components/feedback/feedback-view.story.tsx`, covered by `tests/components/feedback-view.spec.ts`).
- `tests/unit/correction-grading.test.ts` passes. That file covers the correction output schema, prompt sections, and score formatting (`0`–`1000`, two decimals). Re-run it because `workflows/correction-grading.ts` changes.
- Auth form component specs still pass, because `field.tsx`, `alert.tsx`, and `card.tsx` change: `tests/components/sign-in-form.spec.ts` and `tests/components/sign-up-form.spec.ts`.

## Constraints

Runtime is Bun. This PR does not change tables, queries, or correction behavior beyond unexporting or deleting `CorrectionOutput`. `database/schema.md` stays as it is.

New code, if the conditional split adds any, uses import sections marked with comments. Existing primitive files keep their current import style. Buttons that remain keep their `id` and `type`. Prefer padding over margin if a class has to move.

`bun test` runs `tests/unit`. Playwright component specs run with `bun run test:ct`.

## Verification

Run `fallow dead-code`.

Run `bun test tests/unit/correction-grading.test.ts`, then `bun test`.

Run the feedback, sign-in, and sign-up component specs on their own, then `bun run test:ct`.

When that fresh run holds, check the PR 3 boxes in `docs/pr-plan.md`.

## Done when

`fallow dead-code` no longer lists these symbols, the app shell and the feedback story still render, and `tests/unit/correction-grading.test.ts` passes.
