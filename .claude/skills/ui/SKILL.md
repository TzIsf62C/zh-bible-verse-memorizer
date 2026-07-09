---
name: ui
description: Visual design system for this app (tokens, shared classes, patterns) plus the tools/look screenshot CLI for visual verification. Read this when building or modifying any Svelte component or when you need to check what something looks like.
---

# UI Design System

The app is a PWA built with SvelteKit + Svelte 5. Component styles live in scoped `<style>` blocks using plain CSS — **no Tailwind, no utility frameworks**. Global tokens and shared classes live in `src/app.css`.

## Core Philosophy

- **Calm, content-first surfaces.** White panels on a light page, dark charcoal on dark. Soft shadows over heavy borders. Verses are the protagonists; chrome stays quiet.
- **Token-driven theming.** Every color comes from a CSS variable. Never hardcode a hex in component CSS — if a token is missing, add it to `src/app.css` first.
- **Shared classes before scoped styles.** Buttons, cards, panels, and inputs already have a house look. Reach for those classes; only write scoped CSS for layout and component-specific details.
- **Mobile-first PWA.** Respect `env(safe-area-inset-*)` on fixed elements; `touch-action: manipulation` on tappable controls (the global `button` rule already has it).

## Design Tokens (`src/app.css`)

Light values live on `:root`, dark overrides on `:root[data-theme='dark']` (set by `+layout.svelte` from the Settings store), with a `prefers-color-scheme` fallback for first paint.

| Token | Purpose |
| --- | --- |
| `--app-background` | Page background |
| `--panel-background` | Panels, cards, modals, nav surfaces |
| `--text-color` | Primary text |
| `--subtitle-color` | Hints, metadata, helper copy |
| `--accent-color` | Primary buttons, active nav, highlights |
| `--nav-button-bg` / `--nav-button-color` | Quiet button fill / its text |
| `--file-bg` / `--file-border` | Input background / border (also card borders) |
| `--success-color` / `--warning-color` / `--danger-color` | Status text, badges, destructive actions |
| `--correct-color` / `--error-color` | Verse-typing feedback characters only |
| `--panel-shadow` | Panel elevation |
| `--text-scale` | User text-size setting (multiplies body font) |

**Never** write `prefers-color-scheme` queries or theme conditionals inside a component — use tokens and theming happens for free.

## Shared classes (use these before writing new CSS)

### Layout containers

- **`.panel`** — primary screen container: panel background, `16px` radius, `1.5rem` padding, `--panel-shadow`. Wrap each screen's content in one.
- **`.card`** — list item / sub-container inside a panel: panel background, `1px` `--file-border` border, `8px` radius, `1rem` padding. Add scoped layout (flex etc.) on top; hover with `border-color: var(--accent-color)`.

### Buttons

A bare `<button>` **is** the primary action: accent-filled pill with hover/press/disabled states built in globally. Add one variant class to change the role:

| Class | Role |
| --- | --- |
| *(none)* | Primary CTA — accent pill |
| `.btn-secondary` | Quiet action — `--nav-button-bg` fill |
| `.btn-outline` | Input-like fill with border (modal "No"/cancel) |
| `.btn-danger` | Destructive — `--danger-color` fill |
| `.btn-ghost` | Transparent, for inline/toolbar actions |
| `.btn-icon` | Small square-ish (8px radius) icon/row-action button |
| `.back-btn` | Round 2.5rem ghost back/close button for detail headers |

Sizes: add `.btn-sm` or `.btn-lg` when the default doesn't fit. Don't re-specify colors, radius, cursor, or transitions in scoped CSS — they're global. Scoped rules should only add layout (width, flex, min-width).

```svelte
<button on:click={save}>{t('save')}</button>
<button class="btn-secondary" on:click={cancel}>{t('cancel')}</button>
<button class="btn-danger" on:click={deleteAll}>{t('delete')}</button>
<button class="btn-icon" title={t('move_up')}>▲</button>
```

### Inputs

`input` (text/number/search/email/password/date), `textarea`, and `select` are styled globally: `--file-bg` fill, `--file-border` border, `8px` radius. In components, only add sizing (`width: 100%`, font-size). The "invisible" verse-typing inputs opt out with `background: transparent; border: none`.

### Modals & overlays

- Use `Modal.svelte` for confirms/info/errors — it already maps `variant: 'primary' | 'secondary' | 'danger'` buttons onto the shared classes.
- Overlay pattern (see `MenuOverlay.svelte`): fixed backdrop `rgba(0,0,0,0.5)` with `fadeIn 0.2s`, centered panel with `16px` radius and `slideUp 0.3s`, backdrop click + Escape to close (except confirms), `padding: 1rem` on the backdrop so panels never touch screen edges.

### Icons

SVG path strings live in `src/lib/utils/icons.js` — define each icon **once** there, never copy paths into components:

```svelte
import { icons } from '$lib/utils/icons.js';

<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  {@html icons.book}
</svg>
```

Keep `stroke="currentColor"` so icons inherit text color. Size via width/height on the svg.

## Scales

**Radius** — pick from: `4px` (tags/chips) · `8px` (inputs, cards, icon buttons) · `12px` (nav items, menu tiles) · `16px` (panels, modals) · `999px` (pill buttons) · `50%` (round icon buttons). Don't invent new values.

**Spacing** — multiples of `0.25rem`: `0.5rem` between related controls, `0.75rem` list-item gaps, `1rem` section gaps, `1.5rem` panel padding, `2rem` modal padding / section dividers.

**Type** — body is `calc(16px * var(--text-scale))`; the user can scale text in Settings, so use `em`-relative sizes in components, never fixed `px` on body text. Headings: `h2` = screen title, `h3` = subsection.

**Motion** — global button transitions are built in. For other hovers use `background 0.2s ease`. Modal entrances: `fadeIn 0.2s` + `slideUp 0.3s`.

## Mobile & PWA notes

- `main.app-shell` (in `app.css`) is the page container — top padding clears the fixed `IconNav` + safe area. Don't recreate it.
- The on-screen `Keyboard.svelte` is fixed at the bottom; don't compete for that space (AddVerseForm pads its container bottom for this).
- Breakpoints in use: `400px` (compact phone), `480px`, `767/768px` (tablet boundary), `960px` (desktop, matches app-shell). Prefer these.

## Consistency checklist

Before considering a component done:

- [ ] All colors from `var(--…)` — zero hex literals in scoped CSS.
- [ ] Buttons/inputs/cards use the shared classes; scoped CSS only adds layout.
- [ ] Radius from the scale above.
- [ ] Text sizes `em`-relative so the text-size setting works.
- [ ] Works in both themes (verify with the look tool below).
- [ ] Fixed elements respect safe-area insets.

---

# Visual verification — `tools/look`

Screenshot CLI so you can *see* your changes without clicking through the app. Boots the dev server and drives headless Chrome (`puppeteer-core`). Requires a Chrome/Chromium binary — set `CHROME_PATH` if autodetection fails.

## Panel mode — screenshot a real app screen with fixture data

```bash
npm run look -- panel learn                 # light + dark PNGs
npm run look -- panel stats                 # menu-reached panels work too
npm run look -- panel settings --theme dark
npm run look -- panel add --full-page       # capture full scrollable page
npm run look -- list                        # list panels + component stories
```

Panels: `add learn practice review collections data stats heat-maps settings`.

Fixtures seed localStorage before load: `--fixture rich` (default — 93 verses, collections, heat/stats history) or `--fixture empty` (fresh install, onboarding already completed). Fixture JSON lives in `tools/look/fixtures/` — each top-level key becomes a localStorage entry.

## Component mode — screenshot one component in isolation

Create `<Name>.stories.js` next to the component, exporting named story objects with `props` (see `Modal.stories.js`):

```js
export const Confirm = {
  props: { show: true, type: 'confirm', title: 'Delete?', message: 'Are you sure?' }
};
```

```bash
npm run look -- component Modal                  # every story, light + dark
npm run look -- component Modal --story Confirm
npm run look -- component Modal --viewport 500x420
```

Screenshots land in `tools/look/shots/` (gitignored). Default viewport is `400x700` (phone). **Always check both themes** — the tool renders light and dark by default.

---

# Remaining cleanup (long tail)

The foundation + high-traffic surfaces are migrated (Modal, IconNav, MenuOverlay, ShareOverlay, Settings, Collections, CollectionDetail, AddVerseForm). When touching any file below, migrate its one-off styles onto the shared system as you go:

1. **Practice/review mode components** (`PracticeClassic`, `FirstAndLast`, `Reverse`, `ReverseByVerse`, `BlindChallenge`, `SpeedChallenge*`, `SingleText*`, `ReferenceQuiz`, `IndividualReview`, `ReviewSessions`, `LearningFlow`, `Practice`): each still defines its own `.exit-button` / `.submit-button` / `.retry-button` / `.primary-button` / `.modal-btn` variants and hardcoded status greens/reds/oranges (`#4caf50`, `#f44336`, `#ff9800`, material palette shades). Map onto shared button classes and `--success/--warning/--danger` tokens.
2. **Stats / HeatMaps / AchievementsModal / ExportImport / Onboarding**: mostly consistent but still carry hardcoded status colors and some off-scale radii (`6px`, `10px`, `20px`).
3. **`renameCollection`** in `Collections.svelte` still uses `prompt()` — convert to a `Modal` like other flows.
4. **Toasts** (`AchievementToast`, `StreakToast`): unify their card look with `.card`/tokens.
5. **Mixed Svelte patterns**: some components use `export let` + `createEventDispatcher`, newer ones use `$props()`/`$state` runes. Prefer runes for new code.
