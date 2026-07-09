# Chinese Bible Verse Memorizer

A single-page PWA for memorizing Chinese Bible verses with spaced repetition. Entirely
client-side — SvelteKit + localStorage, no backend. Works offline once installed.

Three input methods (Pinyin / Zhuyin / Cangjie), three learning stages, individual and
continuous-passage review, collections, and English / 简体 / 繁體 UI.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static build (adapter-static)
npm run preview    # serve the production build
npm test           # vitest units
npm run look        # screenshot components for visual checks (tools/look)
```

The whole app is one page (`src/routes/+page.svelte`) that switches between panels — there's
no routing. Global state lives in `src/lib/stores/` (`verses`, `collections`, `settings`) and
auto-syncs to localStorage.

## Working with an agent

Read [`AGENTS.md`](AGENTS.md) first — it maps the repo and explains the `.issues/` (active
work) and `.knowledge/` (durable notes) folders. The full architecture guide is
[`.github/copilot-instructions.md`](.github/copilot-instructions.md), and the UI design system
lives in [`.claude/skills/ui/`](.claude/skills/ui/SKILL.md).

Quick orientation:

- **`src/lib/components/`** — all UI (practice, review, collections, settings, keyboard)
- **`src/lib/utils/`** — spaced repetition, bible metadata, keyboard layouts, import/export
- **`src/lib/i18n/`** — translations
- **`legacy/`** — the original vanilla-JS app, kept as a porting reference (see
  [`.knowledge/deployment.md`](.knowledge/deployment.md) for how it coexists on GitHub Pages)

Verify changes with `npm test` and `npm run look` before calling a task done.
