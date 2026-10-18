# PR 3 — Unused primitives and file-local exports

Fallow's refactor targets are `components/ui/field.tsx` (unused value exports) and `components/ui/sidebar.tsx` (unused value exports and two large functions). Those files, and the other files under `components/ui`, are shadcn primitives. The product does not import every piece, and the unused pieces stay in the primitive so a later screen can import them. A handful of symbols outside that folder are exported only because the same file reads them.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 1 and PR 2, so the dead-code list is comparable. Later PRs assume `fallow dead-code` no longer lists unused exports under `components/ui`, the file-local symbols below are gone from that scan, the dashboard shell still renders, and `tests/unit/correction-grading.test.ts` still passes.

## In scope

### `components/ui`

Leave every primitive in `components/ui` as it is, including exports the product does not import yet. In `.fallowrc.json`, add an `overrides` entry whose `files` glob is `components/ui/**` and whose rule `unused-exports` is `off`. That is the only rule this override changes. Complexity, duplication, and unused files in that folder stay on the scan.

The override covers the unused value exports the scan listed in this folder:

- `components/ui/field.tsx`: `FieldDescription`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle`
- `components/ui/sidebar.tsx`: `SidebarFooter`, `SidebarGroupAction`, `SidebarGroupLabel`, `SidebarInput`, `SidebarInset`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarRail`, `SidebarSeparator`, `useSidebar`
- `AlertAction` in `components/ui/alert.tsx`
- `CardAction` in `components/ui/card.tsx`
- `SheetTrigger`, `SheetClose`, and `SheetFooter` in `components/ui/sheet.tsx`

The shell still imports `SidebarProvider` and `SidebarTrigger` from `app/(app)/layout.tsx`, and `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`, `SidebarHeader`, `SidebarMenu`, `SidebarMenuButton`, and `SidebarMenuItem` from `components/app/sidebar.tsx`. Auth forms still import `Field`, `FieldLabel`, `FieldError`, `FieldGroup`, `Alert`, `AlertTitle`, `AlertDescription`, and the card pieces they already use.

### Exports the file still reads

Keep the declaration. Remove `export` or `export type` only.

- `FeedbackCorrection` in `components/feedback/feedback-view.tsx` (the props type uses it)
- `NARRATIVE_SCORE_MAX`, `CriterionKind`, `CriterionBands`, and `CriterionDefinition` in `database/seed/render-rubric.ts` (the renderer reads them)

`CorrectionOutput` in `workflows/correction-grading.ts` is on that same list, and nothing in the file or the repo reads the alias. The plan's rule is to keep a declaration the file still uses. This alias has no reader, so delete it. The completion check is that `fallow dead-code` no longer lists the name.

### Large functions

After the override above, split `Sidebar` and `SidebarProvider` only when `fallow` still lists those functions. The scan cited them near the top of `components/ui/sidebar.tsx` (about 101 and 95 lines). Find them by name. The split preserves behavior and the exports the shell imports. The unused-export override does not hide a complexity finding.

## Out of scope

Leave the unused exports in `components/ui` in place. Leave `components/ui/button/index.tsx` whole. That button file is a hotspot because many modules import it; caller tests and `tests/components/button.spec.ts` are its coverage.

Leave auth-form duplication, schema tests, and product pages to later PRs. Leave the primitives' prop style and visual design as they are. A conditional split of `Sidebar` or `SidebarProvider` is a size split, not a restyle.

## Files and areas

- `.fallowrc.json`
- `components/feedback/feedback-view.tsx`
- `database/seed/render-rubric.ts`
- `workflows/correction-grading.ts`

## Behavioral requirements

- `fallow dead-code` no longer lists unused exports under `components/ui`.
- `fallow dead-code` no longer lists the file-local symbols in this PR.
- The signed-in shell still renders: sidebar, sidebar trigger, and page content from `app/(app)/layout.tsx` and `components/app/sidebar.tsx`.
- The feedback story still renders (`components/feedback/feedback-view.story.tsx`, covered by `tests/components/feedback-view.spec.ts`).
- `tests/unit/correction-grading.test.ts` passes. That file covers the correction output schema, prompt sections, and score formatting (`0`–`1000`, two decimals). Re-run it because `workflows/correction-grading.ts` changes.
- Auth form component specs still pass. The primitives they import stay exported: `tests/components/sign-in-form.spec.ts` and `tests/components/sign-up-form.spec.ts`.

## Constraints

Runtime is Bun. This PR does not change tables, queries, or correction behavior beyond unexporting or deleting `CorrectionOutput`. `database/schema.md` stays as it is.

New code, if the conditional split adds any, uses import sections marked with comments. Primitive files stay as they are. Buttons keep their `id` and `type`. Prefer padding over margin if a class has to move.

`bun test` runs `tests/unit`. Playwright component specs run with `bun run test:ct`.

## Verification

Run `fallow dead-code`.

Run `bun test tests/unit/correction-grading.test.ts`, then `bun test`.

Run the feedback, sign-in, and sign-up component specs on their own, then `bun run test:ct`.

When that fresh run holds, check the PR 3 boxes in `docs/pr-plan.md`.

## Done when

`fallow dead-code` no longer lists unused exports under `components/ui` or the file-local symbols in this PR, the app shell and the feedback story still render, and `tests/unit/correction-grading.test.ts` passes.
