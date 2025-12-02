# ZH Bible Verse Memorizer - AI Coding Agent Instructions

## Project Overview
Single-page Progressive Web App (PWA) for memorizing Chinese Bible verses using spaced repetition. Entirely client-side with localStorage persistence—no backend server. Built with vanilla JavaScript, no frameworks.

## Architecture

### Core Files
- `index.html` - Single-page structure with all panels (addVerse, learn, review, collections, settings, exportImport)
- `script.js` - All application logic in one `window.onload` function (4489 lines)
- `style.css` - Theme-aware styling with CSS variables for light/dark/system themes
- `sw.js` - Service worker for offline PWA support
- `manifest.json` - PWA manifest for installation

### Data Model (localStorage)
```javascript
verses = [{
  id, verseText, bookName, chapterNumber, verseNumber,
  verseInitials, bookInitials, bibleVersion,
  lastReviewed, dueDate, interval, repetitions
}]
collections = [{ id, title, verseIds: [] }]
```

**Key Settings**: `languagePreference`, `inputMethod`, `themePreference`, `defaultBibleVersion`, `vibrationEnabled`

### Spaced Repetition Algorithm
Function: `spacedRepetitionBinary(card, success, currentDate)` (line 1353)
- Success intervals: 1 day → 6 days → 2× previous (exponential)
- Failure resets to interval=1, repetitions=0
- Early review penalty: reduces interval by factor of `(daysWaited / previousInterval)`
- Review threshold: 90% accuracy required to advance interval

### Input Methods
Three modes for Chinese character entry (user selects during onboarding):
1. **Pinyin** - Latin alphabet initials (default)
2. **Zhuyin (注音)** - Bopomofo symbols, requires onscreen keyboard
3. **Cangjie (倉頡)** - Chinese input system, requires onscreen keyboard

Input method determines which keyboard shows for `verseInitials`, `bookInitials`, and `learnInput` fields. Non-Pinyin methods use custom onscreen keyboards with single-keystroke entry.

## Development Workflow

### Local Testing
```bash
./start-server.sh  # Starts Python HTTP server on port 8000
# Opens at http://localhost:8000
```

### PWA Requirements
- Must serve over HTTPS (or localhost)
- Service worker caches: `index.html`, `style.css`, `script.js`, `manifest.json`
- Update `CACHE_NAME` in `sw.js` when deploying changes (e.g., `zh-bible-memorizer-v0.9`)

### Icon Generation
- Source: `icons/icon.svg`
- Generate PNGs: Open `generate-icons.html` in browser (canvas-based) OR run `./generate-icons.sh` (requires ImageMagick)
- Sizes needed: 72, 96, 128, 144, 152, 192, 384, 512px

## Key Patterns

### Panel Navigation
Panels are shown/hidden via `showPanel(panel)` function. Only one panel visible at a time. Hide all keyboards when switching panels with `hideAllKeyboards()`.

### Onscreen Keyboards
Four keyboard types: `zhuyinKeyboard`, `cangjieKeyboard`, `pinyinKeyboard`, `numericKeyboard`

Show keyboard with `showKeyboardForInput(input, forceKeyboardType)`:
- Detects input method from `localStorage.getItem('inputMethod')`
- Makes `learnInput` readonly (keys append only)
- Hides backspace/enter for review mode
- Calls `hideElementsBetweenInputAndKeyboard()` to maximize screen space

### Learning Flow (3 Stages)
1. **Basic** - Full text visible, user types initials
2. **Intermediate** - Alternating characters visible (奇数索引 shown)
3. **Advanced** - No text, pure recall

Progress tracking: Each stage requires 90% accuracy to advance. Verses move to review after completing Advanced.

### Bible Book Order
`sortVersesByBibleOrder(verses)` uses `getBookOrder(bookName)` with hardcoded array `CHINESE_BIBLE_BOOKS` containing canonical order. Critical for displaying verses in biblical sequence.

### Internationalization (i18n)
Inline `TRANSLATIONS` object (line 395) with keys for `english`, `simplified`, `traditional`
- Apply via `applyLanguage()` which updates all `[data-i18n]` attributes
- Special case: App title uses `[data-i18n-special]` for bilingual display
- Translation helper: `t(key)` returns localized string

### Collections
- Verses can belong to multiple collections
- Review modes: Individual (verse-by-verse) or Single-Text (continuous passage)
- Export/Import supports selective collection export with optional review data
- Smart import merging: keeps version with most recent `lastReviewed` date

### Sample Data
Three files for onboarding: `PY-Samples.json`, `ZY-Samples.json`, `CJ-Samples.json`
- Format: `{ verses: [], collections: [{ title, verseRefs }] }`
- Loaded via `loadSampleVerses(inputMethod)` on first run
- Verse refs resolved to IDs during import

## Common Tasks

### Adding New Features
1. Update DOM structure in `index.html` with appropriate panel/modal
2. Add event listeners in `script.js` within `window.onload`
3. Update `TRANSLATIONS` object for i18n support
4. Add styling in `style.css` with theme-aware variables
5. Test in both light/dark themes and all three input methods

### Modifying Spaced Repetition
Edit `spacedRepetitionBinary()` function. Key fields: `interval`, `repetitions`, `dueDate`. Algorithm is binary (pass/fail), not EF-based like SM-2.

### Styling Conventions
- Use CSS variables (e.g., `var(--accent-color)`) for theme compatibility
- Mobile-first: base styles for mobile, `@media (min-width: 768px)` for desktop
- Keyboard styles: `.key` class with `.unused` for disabled keys
- Font: Noto Sans SC loaded from `./fonts/` for offline Chinese rendering

### Testing Checklist
- [ ] Test all three input methods (Pinyin, Zhuyin, Cangjie)
- [ ] Verify light/dark theme switching
- [ ] Confirm PWA installs on iOS Safari and Chrome
- [ ] Check offline mode after cache update
- [ ] Test export/import with review data merge logic
- [ ] Validate spaced repetition intervals in review panel

## Critical Gotchas
- **No frameworks**: All DOM manipulation is vanilla JS (`querySelector`, `addEventListener`, etc.)
- **Single file scope**: All functions/variables in `script.js` exist within one `window.onload` closure
- **localStorage limits**: ~5-10MB per domain; export data regularly
- **Service worker caching**: Clear cache or update `CACHE_NAME` when deploying
- **Input readonly**: `learnInput` is readonly during review—keyboard clicks append programmatically
- **Vibration API**: Android-only feature wrapped in feature detection (`navigator.vibrate`)
