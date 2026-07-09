# Migrate components to Svelte 5 runes

## Goal

Bring the component layer onto one consistent Svelte 5 authoring style. Today the codebase
mixes two idioms:

- **Legacy (Svelte 4-style):** `export let` props, `$:` reactive statements, and
  `createEventDispatcher()` + `on:event` for child→parent communication.
- **Runes (Svelte 5):** `$props()`, `$state()`, `$derived()`, `$effect()`, and **callback
  props** (`export let onwhatever` / `let { onwhatever } = $props()`) instead of dispatched
  events.

Newer components already lean on runes; older ones don't. The aim is: **new screen looks
*and reads* right by default.**

## Why deferred

This was intentionally left out of the UI-standardization sweep because:

- It's a **script-level** change with **zero visual output** — nothing to verify with the
  screenshot tool, which is the sweep's main safety net.
- Converting `createEventDispatcher` → callback props is **not local**: every parent that
  listens with `on:event` must switch to passing a callback prop, so each child change ripples
  into its call sites (chiefly [`src/routes/+page.svelte`](../src/routes/+page.svelte), which
  wires up almost every mode).
- The interactive typing/keyboard flows (practice + review modes) are hard to exercise from an
  automated harness, so a props/events refactor there carries real regression risk that unit
  tests alone won't catch.

So it wants its own focused pass with manual interaction testing, separate from the
visual-only work.

## Scope (current inventory)

- **25 components** use `createEventDispatcher`:
  Settings, Practice, ReviewSessions, IndividualReview, IconNav, PracticeClassic,
  ReferenceQuiz, CollectionDetail, BlindChallenge, ReverseByVerse, Stats, AchievementsModal,
  SpeedChallengeVerse, Modal, Keyboard, ShareOverlay, HeatMaps, MenuOverlay,
  SpeedChallengeCollection, SingleTextReview, Onboarding, Reverse, FirstAndLast, ExportImport,
  SingleTextPractice.
- **~21 files** under `src/lib` still declare `export let`.

(Re-run the greps below before starting — the counts drift as work lands.)

```
grep -rl "createEventDispatcher" src/lib/components
grep -rl "export let" src/lib
grep -rn "\$:" src/lib/components
```

## The conversions

| From (Svelte 4) | To (runes) |
|---|---|
| `export let foo = 1;` | `let { foo = 1 } = $props();` |
| `let count = 0;` (mutated in template) | `let count = $state(0);` |
| `$: doubled = count * 2;` | `let doubled = $derived(count * 2);` |
| `$: { sideEffect(count); }` | `$effect(() => { sideEffect(count); });` |
| `const dispatch = createEventDispatcher(); dispatch('reviewed', x)` | callback prop: `let { onReviewed } = $props(); onReviewed?.(x)` |
| parent: `<Child on:reviewed={handle} />` | parent: `<Child onReviewed={handle} />` |

Notes / gotchas:

- **`$derived` vs `$effect`:** prefer `$derived` for anything that just computes a value; only
  reach for `$effect` for genuine side effects (DOM measurement, timers, focus, scroll). Some
  existing `$:` blocks in the review modes mix computation *and* side effects — split them.
- **Store access** (`$settings`, `$versesStore`) stays the same in markup; in `$derived`/
  `$effect` bodies use the auto-subscribed `$store` form as today.
- **Event payloads:** `dispatch('x', detail)` becomes `onX?.(detail)` — the callback receives
  the payload directly, so consumers stop reaching into `e.detail`.
- **Keyboard.svelte** re-dispatches `key`; both it and its consumers (every typing mode) must
  move together, so keep Keyboard + its parents in the same batch.
- Watch the timing-sensitive reactive blocks in SingleTextReview / SingleTextPractice
  (verse-init ordering, `verseReadyToRender` gating) — these were fragile enough to warrant
  heavy debug logging. Convert carefully and keep the logs until verified.

## Suggested batching (small, reviewable, testable)

Group each child with its parents so no intermediate state has a broken event wire.

1. **Leaf/simple:** Modal, ShareOverlay, MenuOverlay, IconNav, Onboarding.
2. **Collections:** CollectionDetail, Settings, ExportImport, Stats, HeatMaps,
   AchievementsModal.
3. **Keyboard + non-typing modes:** Keyboard, PracticeClassic, FirstAndLast, Reverse,
   ReverseByVerse, ReferenceQuiz.
4. **Typing/challenge modes (highest risk):** BlindChallenge, SpeedChallengeVerse,
   SpeedChallengeCollection, SingleTextPractice, Practice.
5. **Review flow:** SingleTextReview, IndividualReview, ReviewSessions, LearningFlow.

`src/routes/+page.svelte` gets edited alongside every batch (it's the main call site).

## Verification

- `npm run build` and `npx svelte-check --threshold error` after each batch (0 errors).
- `npx vitest run` — 12 unit tests currently pass; keep them green.
- **Manual interaction pass** for batches 3–5: actually type through a practice and a review
  session for each input method (pinyin/zhuyin/cangjie), on-screen *and* physical keyboard,
  and confirm feedback/advance/completion still fire. This is the part the screenshot tool
  can't cover.
- `npm run look -- panel <id>` and `npm run look -- component <Name>` for a visual no-change
  sanity check (there should be no visual diff — it's a pure refactor).

## References

- UI design-system skill: [`.claude/skills/ui/SKILL.md`](../.claude/skills/ui/SKILL.md)
  (its closing note already flags this mixed-pattern inconsistency).
- Svelte 5 runes docs: https://svelte.dev/docs/svelte/what-are-runes

Delete this file once the migration is complete.
