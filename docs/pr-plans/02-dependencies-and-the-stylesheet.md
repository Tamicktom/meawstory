# PR 2 — Dependencies and the stylesheet

`app/globals.css` imports `shadcn/tailwind.css` and loads `@plugin "@tailwindcss/typography"`. Fallow follows JavaScript imports, so both packages show up as unused, and the stylesheet import shows up as unresolved (`./shadcn/tailwind.css` in the scan; the source writes `shadcn/tailwind.css`). Two other dependencies have no source references. This PR keeps the stylesheet working and clears those dependency findings.

Index: `docs/pr-plan.md`.

## Position

Depends on PR 1. If that PR added a Fallow config, edit that file. Later dead-code runs assume these dependency findings are gone and that `prose` still builds.

## In scope

Confirm `shadcn/tailwind.css` resolves at build time. The installed `shadcn` package (4.22.0) exports `./tailwind.css` to `./dist/tailwind.css`. When that export resolves, keep `@import "shadcn/tailwind.css"` in `app/globals.css` and record the resolved export in the Fallow config so the unresolved-import finding goes away. When a build shows the export missing, point the import at the stylesheet the package actually ships, and record that path the same way.

Keep `shadcn` installed. A repo search today finds no TypeScript import of the `shadcn` package. Uses are the CSS export and the CLI (`components.json`, package `bin`). After confirming that is still true, move `shadcn` to `devDependencies`. If a runtime JavaScript import exists, leave it in `dependencies`.

After the move, `shadcn` must not reappear as an unused dependency or an unused devDependency. Recording the stylesheet is what makes Fallow count the package as used. `ignoreDependencies` in this PR is for `@tailwindcss/typography` only.

Remove `@tanstack/react-form-nextjs` after confirming no script, stylesheet, or TypeScript file references it. The same check for `@tiptap/pm`. A search today finds both names only in `package.json`. The editor imports `@tiptap/react` and `@tiptap/starter-kit`; those stay.

Add `@tailwindcss/typography` to `ignoreDependencies`. Leave the package installed. Leave `@plugin "@tailwindcss/typography"` in `app/globals.css`.

`prose` is used by the write exercise page, the theme detail page, and `components/feedback/feedback-view.tsx`. Those styles still build.

## Out of scope

Leave unused component exports, auth-form clones, and product behavior to later PRs. Leave `@tiptap/react` and `@tiptap/starter-kit` installed.

## Files and areas

- `app/globals.css`
- `package.json` (and the lockfile the package manager updates)
- The Fallow config from PR 1, or a new one if PR 1 used only the Vite plugin. One config file. Search order: `.fallowrc.json`, `.fallowrc.jsonc`, `fallow.toml`, `.fallow.toml`.

## Behavioral requirements

- `fallow dead-code` no longer reports `shadcn`, `@tanstack/react-form-nextjs`, or `@tiptap/pm` as unused dependencies.
- It no longer reports `@tailwindcss/typography` as an unused devDependency.
- It no longer reports the unresolved `shadcn/tailwind.css` import.
- `shadcn` is still installed. The working `@import` still resolves.
- A production CSS build still includes typography styles for `prose`.

## Constraints

Runtime is Bun. `bun run build` is `next build`. Confirm the stylesheet with that build, not by rewriting the import to a `node_modules` path while the package export resolves.

Fallow commands for this CLI: `dead-code`, `dupes`, and `health --hotspots --targets`.

## Verification

Run `fallow dead-code` and `bun run build`.

When that fresh run holds, check the PR 2 boxes in `docs/pr-plan.md`.

## Done when

`fallow dead-code` drops the three unused dependencies, the typography dev-dependency finding, and the unresolved CSS import. `prose` styles still build.
