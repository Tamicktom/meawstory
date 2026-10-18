# PR 4 — Shared auth forms and spec steps

Fallow found clone groups between `components/auth/sign-in-form.tsx` and `components/auth/sign-up-form.tsx`, and more cloned lines across `tests/components/sign-in-form.spec.ts` and `tests/components/sign-up-form.spec.ts`. The two forms are also churn hotspots. This PR shares the repeated field markup through TanStack Form's pre-bound field component, and extracts the repeated spec steps so later auth tests hit one shared field block. Each form keeps its own hook, copy, and field names.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 3 so the field primitives tests target still exist (`Field`, `FieldLabel`, `FieldError`, `FieldGroup`). PR 5 assumes this extraction is in place and these two component specs still pass. Real API coverage is PR 5; this PR keeps the component tests on their current stubs.

## In scope

Share the field UI with TanStack Form composition's pre-bound field component. `@tanstack/react-form` `1.33.5` already exports `createFormHook` and `createFormHookContexts`. The guide is [Form Composition](https://tanstack.com/form/latest/docs/framework/react/guides/form-composition), section "Pre-bound Field Components". The installed source is `node_modules/@tanstack/react-form/src/createFormHook.tsx`.

The duplicated unit is one string field: `form.Field`, `Field`, `FieldLabel`, `Input`, `FieldError`, and `toFieldErrors` from `components/auth/field-errors.ts`. Sign-in repeats it for `email` and `password`. Sign-up repeats it for `name`, `email`, `password`, and `confirmPassword`. Find those stacks by that structure.

Create the contexts once, under `components/auth`. Register one field component on a single `createFormHook` call (`fieldComponents` set, `formComponents` empty). The component takes a props object (`props.id`, `props.label`, `props.type`, `props.autoComplete`, `props.disabled`) and calls `useFieldContext<string>()` from those same contexts. It renders the current stack: `toFieldErrors`, `data-invalid`, `data-disabled`, `aria-invalid`, `onBlur`, and `onChange`. `props.disabled` is that form's `isBusy` flag. The field imports (`Field`, `FieldLabel`, `FieldError`, `Input`) live on this component.

`useSignInForm` and `useSignUpForm` call that hook's `useAppForm` where they call `useForm` today. Keep each hook's `defaultValues`, `validators.onSubmit` schema, `onSubmit`, mutation, and `handleSubmit`. Each form still owns its copy and its field names. Render each field with `form.AppField` plus the registered component. `AppField` is what provides the field context, so the component does not take a field API prop.

`withForm` and `withFieldGroup` stay unused. Those APIs split one form, or reuse a group whose keys are one value object. These two forms are separate: password `autoComplete` is `current-password` on sign-in and `new-password` on sign-up, and only sign-up has `name` and `confirmPassword`. A field group also leaves validators typed as `unknown`. Skip `extendForm`. The context value is the field API instance (TanStack Store), so this binding does not subscribe the tree to every keystroke by itself.

The submit buttons stay in each form. Busy state is `isPending || isSuccess` on that form's mutation, the button sits in `CardFooter` with a `form` attribute, and the ids stay `sign-in-submit` and `sign-up-submit`. A `form.Subscribe` submit button would track `isSubmitting` only, and would miss the post-success busy state.

In `tests/components/sign-in-form.spec.ts`, extract the shared 401 sign-in setup used by the failed sign-in cases (server error, and server response with no message).

In `tests/components/sign-up-form.spec.ts`, extract the shared password `aria-invalid` assertions (password shorter than 8 characters, and longer than 128). In the same spec, extract one helper for the shared failed sign-up mount and submit. That one helper covers the overlapping groups: server error, missing message, and the setup that submits again to clear the error.

Extract the invalid-email assertion shared by both specs.

Extract the post-submit navigation assertion shared by both specs. Parameterize the busy-button name: `Signing in...` on sign-in, `Creating account...` on sign-up.

Split `SignInForm` and `SignUpForm` only when Fallow still lists those functions after the extract. The scan cited them at about 112 and 165 lines. Find them by name.

Split the anonymous test arrows in the two specs only when the helpers above leave them listed. The scan cited sign-up cases for rendering, empty submit, and the busy state, and sign-in cases for rendering, empty submit, and the busy state. Find them by the `test(...)` titles, not by line number.

## Out of scope

Leave Better Auth stubs in these component specs. Wrong-password, duplicate-email, and `queryClient.clear` coverage is PR 5. Leave validation schemas (`schemas/sign-in.ts`, `schemas/sign-up.ts`, `schemas/password.ts`) and the form hooks' request behavior as they are. The existing behaviors stay: validation, pending state, errors, trimmed name on sign-up, credentials payload on sign-in, and navigation home.

## Files and areas

- `components/auth/sign-in-form.tsx`
- `components/auth/sign-up-form.tsx`
- New shared modules under `components/auth/` (form-hook contexts and the one field component)
- `hooks/use-sign-in-form.ts` and `hooks/use-sign-up-form.ts` for the `useAppForm` swap only
- `tests/components/sign-in-form.spec.ts`
- `tests/components/sign-up-form.spec.ts`
- A shared spec helper imported by both specs, next to those files

Preserve the submit buttons: `id="sign-in-submit"` `type="submit"`, and `id="sign-up-submit"` `type="submit"`.

## Behavioral requirements

- `fallow dupes` no longer groups the form clones or the spec clones this PR extracted.
- Both component specs pass with the same visible outcomes as before the extract.
- Sign-in still shows field errors, the invalid-email error, the short and long password errors, the busy label `Signing in...`, the server error, the fallback when the response has no message, and navigation home after success.
- Sign-up still shows field errors, the invalid-email error, the short and long password `aria-invalid` state, the mismatched-password error, the whitespace-name error, the busy label `Creating account...`, the server error, the fallback, clearing that error on a later submit, the trimmed name on the payload, and navigation home after success.

## Constraints

Runtime is Bun. Auth is Better Auth; these specs stub it and stay on that stub.

Playwright component tests use `test.describe` and `test` from the project helper `playwright/component.ts`. Titles stay behavior sentences. `bun run test:ct` runs them. `bun test` does not.

New React components: import sections with comments (`Libraries`, `Components`, `Hooks`, and so on). Props stay on a `props` object. Every button has an `id` and a `type`. Prefer padding over margin.

This Next.js app differs from older Next docs. Read `node_modules/next/dist/docs/` before changing App Router files. This PR should not need route changes.

## Verification

Run `fallow dupes`.

Run each spec file on its own with the component project, then `bun run test:ct`.

The happy-path end-to-end specs stay green if a form file they depend on changed: `tests/e2e/sign-in.spec.ts` and `tests/e2e/sign-up.spec.ts`. Run those with `bun run test:e2e` when the forms change.

When that fresh run holds, check the PR 4 boxes in `docs/pr-plan.md`.

## Done when

`fallow dupes` no longer groups those form and spec clones, and `sign-in-form.spec.ts` plus `sign-up-form.spec.ts` pass.
