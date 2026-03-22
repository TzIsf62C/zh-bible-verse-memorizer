# ZH Bible Verse Memorizer - AI Coding Agent Instructions

## Project Overview
Single-page Progressive Web App (PWA) for memorizing Chinese Bible verses using spaced repetition. Entirely client-side with localStorage persistence—no backend server. Built with **SvelteKit** (not vanilla JS).

## Architecture

### SvelteKit Structure
```
src/
├── app.html              # HTML template with PWA meta tags
├── app.css               # Global theme-aware styles (CSS variables)
├── lib/
│   ├── components/       # Svelte components (.svelte files)
│   │   ├── Modal.svelte            # Reusable modal (alerts/confirms)
│   │   ├── AddVerseForm.svelte     # Add/edit verse with keyboard
│   │   ├── Collections.svelte      # Collection list management
│   │   ├── CollectionDetail.svelte # Single collection view
│   │   ├── ReviewSessions.svelte   # Review mode selector
│   │   ├── IndividualReview.svelte # Verse-by-verse review
│   │   ├── SingleTextReview.svelte # Continuous passage review
│   │   ├── LearningFlow.svelte     # 3-stage learning mode
│   │   ├── Settings.svelte         # App settings panel
│   │   └── Keyboard.svelte         # Onscreen keyboard component
│   ├── stores/           # Svelte writable stores (localStorage sync)
│   │   ├── verses.js     # Verse data store
│   │   ├── collections.js # Collection data store
│   │   ├── settings.js   # Settings store
│   │   └── localStorage.js # LocalStorage persistence utilities
│   ├── utils/            # Pure JavaScript utilities
│   │   ├── spacedRepetition.js  # SR algorithm
│   │   ├── bibleBooks.js        # Book ordering & sorting
│   │   ├── keyboardLayouts.js   # Pinyin/Zhuyin/Cangjie layouts
│   │   ├── inputMaps.js         # Character-to-initial mappings
│   │   └── importExport.js      # JSON import/export logic
│   ├── i18n/             # Internationalization
│   │   └── index.js      # Translations (English/简体/繁體)
│   └── index.js          # Main library entry
└── routes/
    └── +page.svelte      # Main application page

static/                   # Static assets (PWA files)
├── manifest.json         # PWA manifest
├── sw.js                 # Service worker
├── icons/                # App icons (72-512px)
└── fonts/                # Noto Sans SC (offline Chinese)
```

### Data Model (Svelte Stores + localStorage)
**Stores** (`$verses`, `$collections`, `$settings`) auto-sync to localStorage:

```javascript
// verses store
verses = [{
  id, verseText, bookName, chapterNumber, verseNumber,
  verseInitials, bookInitials, bibleVersion,
  lastReviewed, dueDate, interval, repetitions
}]

// collections store
collections = [{ 
  id, title, verseIds: [] 
}]

// settings store
{
  languagePreference: 'simplified' | 'traditional' | 'english',
  inputMethod: 'pinyin' | 'zhuyin' | 'cangjie',
  themePreference: 'light' | 'dark' | 'system',
  defaultBibleVersion: string,
  vibrationEnabled: boolean,
  bookNameCharset: 'simplified' | 'traditional'
}
```

### Spaced Repetition Algorithm
Located in `src/lib/utils/spacedRepetition.js`:
- Function: `spacedRepetitionBinary(card, success, currentDate)`
- Success intervals: 1 day → 6 days → 2× previous (exponential)
- Failure resets to interval=1, repetitions=0
- Early review penalty: reduces interval by factor of `(daysWaited / previousInterval)`
- Review threshold: 90% accuracy required to advance interval

### Input Methods
Three modes for Chinese character entry (user selects during onboarding):
1. **Pinyin** - Latin alphabet initials (default)
2. **Zhuyin (注音)** - Bopomofo symbols, requires onscreen keyboard
3. **Cangjie (倉頡)** - Chinese input system, requires onscreen keyboard

Input method stored in `$settings.inputMethod`. The `Keyboard.svelte` component renders appropriate layout based on this setting. Non-Pinyin methods use onscreen keyboards with single-keystroke entry.

## Development Workflow

### Local Development
```bash
npm run dev        # Start dev server (usually http://localhost:5173)
npm run build      # Production build to .svelte-kit/output
npm run preview    # Preview production build locally
```

### Building & Deploying
```bash
npm run build      # Creates optimized static site
# Output: .svelte-kit/output (ready to deploy)
```

### PWA Requirements
- Must serve over HTTPS (or localhost)
- Service worker (`static/sw.js`) caches static assets
- Update `CACHE_NAME` in `sw.js` when deploying changes (e.g., `zh-bible-memorizer-v1.0`)
- PWA manifest: `static/manifest.json`

### Icon Generation
- Source: `static/icons/icon.svg`
- Generate PNGs: Open `generate-icons.html` in browser (canvas-based) OR run `./generate-icons.sh` (requires ImageMagick)
- Sizes needed: 72, 96, 128, 144, 152, 192, 384, 512px

## Key Patterns

### Component Communication
- **Svelte Stores**: Use `$verses`, `$collections`, `$settings` to access/update global state
- **Event Dispatching**: Components use `createEventDispatcher()` to emit events (e.g., `dispatch('complete')`)
- **Props**: Pass data down via `export let propName`

Example:
```svelte
<script>
  import { verses } from '$lib/stores/verses';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export let verseId;
  
  function handleComplete() {
    dispatch('complete', { verseId });
  }
</script>
```

### Modal Component Pattern
**All alerts/confirms use the `Modal.svelte` component** (no browser alerts):

```svelte
<script>
  import Modal from './Modal.svelte';
  
  let showModal = false;
  let modalMessage = '';
  let modalType = 'alert'; // 'alert' | 'confirm' | 'prompt'
  let confirmAction = null;
  
  function showAlert(msg) {
    modalMessage = msg;
    modalType = 'alert';
    showModal = true;
  }
  
  function showConfirm(msg, onConfirm) {
    modalMessage = msg;
    modalType = 'confirm';
    confirmAction = onConfirm;
    showModal = true;
  }
  
  function handleModalConfirm() {
    showModal = false;
    if (confirmAction) {
      confirmAction();
      confirmAction = null;
    }
  }
</script>

<Modal 
  show={showModal} 
  message={modalMessage}
  type={modalType}
  on:confirm={handleModalConfirm}
  on:cancel={() => showModal = false}
/>
```

### Keyboard Component
The `Keyboard.svelte` component handles all onscreen input:
- Props: `layout` (pinyin/zhuyin/cangjie), `activeKeys` (highlighting)
- Events: `keypress` (emits clicked key/character)
- Automatically adjusts based on `$settings.inputMethod`

### Learning Flow (3 Stages)
Managed by `LearningFlow.svelte`:
1. **Basic** - Full text visible, user types initials
2. **Intermediate** - Alternating characters visible (奇数索引 shown)
3. **Advanced** - No text, pure recall

Progress tracking: Each stage requires 90% accuracy to advance. Verses move to review after completing Advanced.

### Bible Book Order
Located in `src/lib/utils/bibleBooks.js`:
- `sortVersesByBibleOrder(verses)` uses `getBookOrder(bookName)` with hardcoded array `CHINESE_BIBLE_BOOKS` containing canonical order
- Critical for displaying verses in biblical sequence
- Supports both simplified and traditional Chinese book names

### Internationalization (i18n)
Located in `src/lib/i18n/index.js`:
- `TRANSLATIONS` object with keys for `english`, `simplified`, `traditional`
- Import with: `import { t } from '$lib/i18n';`
- Usage: `t('translation_key')` returns localized string based on `$settings.languagePreference`
- Reactive: Language changes apply immediately across all components

### Collections
Managed by `Collections.svelte` and `CollectionDetail.svelte`:
- Verses can belong to multiple collections
- Review modes: Individual (verse-by-verse) or Single-Text (continuous passage)
- Export/Import supports selective collection export with optional review data
- Smart import merging: keeps version with most recent `lastReviewed` date

### Sample Data
Sample JSON files for onboarding: `PY-Samples-zhs.json`, `PY-Samples-zht.json`, `ZY-Samples.json`, `CJ-Samples.json`
- Format: `{ verses: [], collections: [{ title, verseRefs }] }`  
- Loaded on first run based on selected input method
- Verse refs resolved to IDs during import

## Common Tasks

### Adding New Components
1. Create `.svelte` file in `src/lib/components/`
2. Import necessary stores: `import { verses } from '$lib/stores/verses';`
3. Use `createEventDispatcher()` for parent communication
4. Import i18n: `import { t } from '$lib/i18n';`
5. Add component styles in `<style>` block (scoped automatically)
6. Use Modal component for all alerts/confirms (never browser `alert()`/`confirm()`)

### Modifying Stores
Edit files in `src/lib/stores/`:
- Changes to stores automatically sync to localStorage
- Use `update()` method: `verses.update(list => [...list, newVerse])`
- Access current value with `$` prefix: `$verses`, `$settings`

### Modifying Spaced Repetition
Edit `src/lib/utils/spacedRepetition.js`:
- Function: `spacedRepetitionBinary()`
- Key fields: `interval`, `repetitions`, `dueDate`
- Algorithm is binary (pass/fail), not EF-based like SM-2

### Styling Conventions
- **Global styles**: `src/app.css` with CSS variables for themes
- **Component styles**: Use `<style>` blocks (scoped to component)
- **Theme variables**: `var(--accent-color)`, `var(--app-background)`, etc.
- **Mobile-first**: Base styles for mobile, `@media (min-width: 768px)` for desktop
- **Font**: Noto Sans SC loaded from `static/fonts/` for offline Chinese rendering
- **Font sizing**: Always use `em` units for `font-size` (not `rem` or `px`) to ensure the global text-scale feature works throughout the app
  - The text size setting applies `--text-scale` CSS variable to body element: `font-size: calc(16px * var(--text-scale))`
  - Using `em` units allows font sizes to inherit and scale from the body font-size
  - Using `rem` units will break text scaling (rem is always relative to root, which stays at 16px)
  - Example: `font-size: 1.5em` for verse display text, `font-size: 0.9em` for labels
- **Avoid excessive div embedding**: Keep HTML structure flat and semantic; use CSS Grid/Flexbox instead of wrapper divs when possible
- **Mobile padding/margins**: Reduce padding and margins on mobile screens (max-width: 767px) to maximize usable space
  - Example: `padding: 1rem` on desktop becomes `padding: 0.5rem` on mobile
  - Remove unnecessary horizontal margins on mobile to prevent overflow
  - Use `@media (max-width: 767px)` for mobile-specific adjustments

### Testing Checklist
- [ ] Test all three input methods (Pinyin, Zhuyin, Cangjie)
- [ ] Verify light/dark/system theme switching
- [ ] Confirm PWA installs on iOS Safari and Chrome
- [ ] Check offline mode after service worker cache update
- [ ] Test export/import with review data merge logic
- [ ] Validate spaced repetition intervals in review panel
- [ ] Verify all modals work (no browser alerts/confirms)
- [ ] Test on mobile viewport (responsive design)

## Version Control & Backup Practices

### DO NOT Create Backup Files
- **This project uses Git** - all file history is tracked in version control
- **Never create `.backup`, `.backup2`, etc. files** - they clutter the project and are redundant
- Trust Git's ability to revert changes: `git checkout <file>` or `git reset`
- View file history with: `git log -p <file>` or `git diff`

### When Making Significant Changes
1. **Use Git branches** for experimental work:
   ```bash
   git checkout -b feature/my-changes
   ```
2. **Make atomic commits** with clear messages:
   ```bash
   git commit -m "Refactor: Simplify AddVerseForm keyboard handling"
   ```
3. **Only ask user** if they want a backup before major destructive refactors (rare)

### If User Explicitly Requests Backup
- Create ONE backup with descriptive name: `filename.svelte.pre-refactor`
- Document what the backup contains
- Suggest deleting it after changes are confirmed working

## Critical Gotchas
- **localStorage limits**: ~5-10MB per domain; export data regularly
- **Service worker caching**: Update `CACHE_NAME` in `sw.js` when deploying new versions
- **Modal usage**: NEVER use browser `alert()` or `confirm()`—always use `Modal.svelte` component
- **Store reactivity**: Use `$` prefix to access stores reactively in templates
- **Event bubbling**: Component events don't bubble—use `createEventDispatcher()`
- **Vibration API**: Android-only feature wrapped in feature detection (`navigator.vibrate`)
