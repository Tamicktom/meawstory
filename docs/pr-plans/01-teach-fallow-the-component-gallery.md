# PR 1 — Teach Fallow the component gallery

Fallow's dead-code scan treats six gallery files as unused because nothing in the Next.js graph imports them. The Playwright component gallery loads those files at runtime: `playwright/gallery/main.tsx` pulls every story with `import.meta.glob("../../components/**/*.story.tsx")`, and `playwright/vite.config.ts` aliases `next/navigation` to `playwright/mocks/next-navigation.ts` by file URL. Deleting them removes the gallery. This PR makes that runtime graph visible to Fallow so later `fallow dead-code` runs stay comparable.

Index: `docs/pr-plan.md`, first PR in the sequence.

## Position

Nothing earlier. Later PRs assume `fallow dead-code` no longer reports these six files, and that `bun run test:ct` still mounts the four stories.

## In scope

Register `playwright/gallery/main.tsx` as an entry point. The repo has no Fallow config today. Fallow reads the first file it finds among `.fallowrc.json`, `.fallowrc.jsonc`, `fallow.toml`, and `.fallow.toml`. The `entry` field is a list of globs for manual entry points. The other path the plan allows is the Vite plugin Fallow detects from `playwright/vite.config.ts`. One registration is enough.

Once that entry is on the graph, these story files stay:

- `components/auth/sign-in-form.story.tsx`
- `components/auth/sign-up-form.story.tsx`
- `components/feedback/feedback-view.story.tsx`
- `components/ui/button/button.story.tsx`

The navigation mock is not imported by the gallery source. It is reached only through the Vite alias in `playwright/vite.config.ts`. Make that alias visible to Fallow so `playwright/mocks/next-navigation.ts` stays as well.

The gallery is the Vite server in `playwright.config.ts`: project `components`, base URL `http://localhost:3100/playwright/gallery/index.html`.

## Out of scope

Leave dependency findings, unused component exports, and clone groups to later PRs. Leave the story implementations and the four component specs unchanged except where a registration import is required for the entry to resolve.

## Files and areas

- `playwright/gallery/main.tsx`
- `playwright/vite.config.ts`
- `playwright/mocks/next-navigation.ts`
- The four `*.story.tsx` files listed above
- A new Fallow config only if that is how the entry is registered. If this PR creates one, PR 2 adds `ignoreDependencies` to that same file.

## Behavioral requirements

- `fallow dead-code` no longer reports these six paths: the gallery entry, the four stories, and `playwright/mocks/next-navigation.ts`.
- The component project still mounts all four stories. The existing specs are the proof: `tests/components/button.spec.ts`, `tests/components/sign-in-form.spec.ts`, `tests/components/sign-up-form.spec.ts`, and `tests/components/feedback-view.spec.ts`.

## Constraints

Fallow 2.26.1 for this repo is `dead-code`, `dupes`, and `health --hotspots --targets`. It has no separate architecture, security, or flags command. Scan line numbers drift; find files by path.

Playwright owns `tests/components`. `bunfig.toml` keeps that directory out of `bun test`. `bun run test:ct` is `playwright test --project=components`.

## Verification

Run `fallow dead-code` and confirm the six paths are absent.

Run `bun run test:ct` so the gallery still serves the four stories. Run the four specs above on their own as well as the component project.

When that fresh run holds, check the PR 1 boxes in `docs/pr-plan.md`.

## Done when

`fallow dead-code` no longer reports those six files, and the component gallery still serves the four stories.
