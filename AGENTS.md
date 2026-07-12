# AGENTS.md

Orientation for anyone (human or AI) working in this repo. For the full architecture guide,
see [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## How work is tracked

Two lightweight folders keep planning and long-lived context out of the code:

- **`.issues/`** — one markdown file per active task (a short plan + checklist). Create one
  before starting non-trivial work, tick items off with ✅ as you go, and **delete the file
  once the task is fully done**.
- **`.knowledge/`** — a small wiki of durable notes that *can't be learned from the code*
  (decisions, gotchas, the deploy model). Start at [`.knowledge/index.md`](.knowledge/index.md).
  Don't write down anything the code already tells you — that just goes stale.

## Directory map

```
src/
├─ routes/+page.svelte     the entire app — a single-page panel switcher (no routing)
├─ routes/+layout.svelte   theme (light / dark / system) setup
├─ service-worker.js       offline PWA caching  (see .knowledge/deployment.md)
├─ app.css                 global tokens + shared UI classes (.btn / .card / .panel …)
└─ lib/
   ├─ components/           all UI — Practice modes, Review modes, Collections, Settings …
   ├─ stores/              verses / collections / settings, auto-synced to localStorage
   ├─ utils/               spaced-repetition, bible metadata, keyboard layouts, import/export
   └─ i18n/                English / 简体 / 繁體 translations
static/                    PWA manifest, icons, offline fonts
legacy/                    original vanilla-JS app (deployed from `main`; porting reference)
tests/                     vitest units + localStorage migration runbook
tools/look/                screenshot CLI for visual checks — `npm run look`
.claude/skills/ui/         UI design-system skill (tokens, classes, patterns)
.github/copilot-instructions.md   full architecture & agent guide
.issues/  .knowledge/      active work / durable knowledge (see above)
```

## GitHub: `TzIsf62C/zh-bible-verse-memorizer` — on-stick auth
This repo is already wired to the **thimble-buffin** GitHub account (on-stick `store` credential helper +
`https://thimble-buffin@github.com/TzIsf62C/zh-bible-verse-memorizer.git` remote + local thimble-buffin identity), so plain
`git commit`/`push`/`pull` just work — authored as thimble-buffin, **not** the machine-global `jacob-8`.
For `gh`, call the on-stick wrapper `/run/media/jacob/USB/.secrets/gh` (plain `gh` = jacob-8).
Full mechanism: `/run/media/jacob/USB/.secrets/README.md`.
