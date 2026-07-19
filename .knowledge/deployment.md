# Deployment & the legacy ↔ refactor split

This repo holds **two apps that ship to one GitHub Pages site**:

| App | Lives in | Branch | Published URL |
|---|---|---|---|
| Original vanilla-JS PWA (production) | repo root on `main`, mirrored in [`legacy/`](../legacy) | `main` | site root — `https://<user>.github.io/<repo>/` |
| SvelteKit rewrite (this codebase) | repo root on `Refactor` | `Refactor` | `…/<repo>/preview/Refactor/` |

Both publish to the **`gh-pages`** branch. The [`refactor-preview.yml`](../.github/workflows/refactor-preview.yml)
workflow builds the SvelteKit app and deploys **only the `preview/` subtree**, so it never
clobbers the legacy app at the root. The legacy/production deploy is driven from the `main`
branch (its workflow is not present on this branch).

## Non-obvious gotchas
- **Pages source setting is the usual cause of 404s.** It must be **Settings → Pages → "Deploy from a branch" → `gh-pages` / `(root)`**. If it's set to "GitHub Actions" instead, the whole site 404s.
- **Base path comes from `BASE_PATH`.** `svelte.config.js` uses an empty base in dev and `process.env.BASE_PATH` in builds; the preview build sets it to `/<repo>/preview/Refactor`. A wrong/missing value makes every asset 404 even though the HTML loads.
- **`.nojekyll` is required.** SvelteKit emits `_app/…` assets; without `.nojekyll`, GitHub's Jekyll strips underscore-prefixed paths. The workflow writes it.
- **The two service workers don't collide** because each is scoped by its own path (root vs. `/preview/Refactor/`).

## Why `legacy/` still matters
It isn't dead weight. It's the porting reference for the rewrite, and the `npm run migration:*`
scripts (see [`scripts/migration/`](../scripts/migration) and
[`tests/migration/localstorage-migration-runbook.md`](../tests/migration/localstorage-migration-runbook.md))
stage legacy vs. refactor `localStorage` on the same origin to prove users can move between
the two apps without losing data.
