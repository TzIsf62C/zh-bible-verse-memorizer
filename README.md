# ZH Bible Verse Memorizer PWA

**Version 0.9.3** | **License: MIT**

A Progressive Web App for memorizing Chinese Bible verses with spaced repetition. This App is inspired by the Bible Memory App (https://biblememory.com/). I would recommend that app if you are memorizing Bible verses in English.

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation Instructions](#-installation-instructions)
- [User Guide](#-user-guide)
- [Spaced Repetition System](#-spaced-repetition-system)
- [Data & Privacy](#-data--privacy)
- [Developer Notes](#-developer-notes)
- [Updates in Version 0.9.3](#-updates-in-version-093)

---

## 🚀 Features

### Learning System
- **Three-Stage Memorization Method**:
  - **Basic**: Full verse text visible with keystroke hints
  - **Intermediate**: Alternating characters hidden (revealed as you type)
  - **Advanced**: Pure recall with no visual hints
  - Progress to next stage requires ≥90% accuracy

### Input Methods
- **Pinyin**: First letter of each character's pinyin (Latin alphabet)
- **Zhuyin (注音)**: Bopomofo phonetic symbols
- **Cangjie (倉頡)**: Traditional Chinese input radicals
- Onscreen keyboards for touch devices
- Physical keyboard support with automatic character mapping for desktop users

### Review & Practice
- **Spaced Repetition**: Adaptive interval scheduling based on performance
- **Review Due Verses**: Quick-access button for overdue items
- **Collections**: Organize verses into themed groups
- **Review Modes**:
  - Individual verse-by-verse review
  - Single-text continuous passage review
- **Pracitic Mode**:
  - Scoring below 90% on a verse while in verse-by-verse review automatically triggers practice mode
  - Practice mode allows the user to step down the difficulty to refresh their memory
  - Skip button allows user to bypass practice mode without scoring 90+% and move on to the next verse.
  - Practice mode ends when a user skips or scores higher than 90% on advanced mode.
- **Manual Interval Adjustment**: Bulk update review schedules for selected verses

### Data Management
- **Export/Import**: JSON-based backup with optional review metadata
- **Backup Reminders**: Weekly for first month, then monthly (toggleable in Settings)
- **Collections Support**: Export/import with verse references and review history

### Offline & Installation
- **Progressive Web App**: Install to home screen on iOS, Android, or desktop
- **Offline-First**: Works without internet after initial load
- **Bundled Fonts**: Noto Sans SC included for reliable Chinese rendering

### User Interface
- **Theme Support**: Light, Dark, or System-matched
- **Three Languages**: English, Simplified Chinese, Traditional Chinese
- **Mobile-Optimized**: Space-efficient layout with dynamic keyboard management
- **Vibration Feedback**: Error alerts on Android devices (optional)

---

## 📱 Installation Instructions

### iOS (Safari)
1. Open the app in Safari
2. Tap the **Share** button (⎋) at the bottom
3. Scroll down and tap **Add to Home Screen** (➕)
4. Tap **Add** in the top right

### Android (Chrome)
1. Open the app in Chrome
2. Tap the **menu** button (⋮) in the top right
3. Tap **Add to Home screen** or **Install app**
4. Tap **Add** or **Install**

### Desktop
1. Look for the **install** icon (⊕) in your browser's address bar
2. Click it and select **Install**

After installation, the app opens in its own window and works offline.

---

## 📖 User Guide

### First-Time Setup
1. **Language Selection**: Choose interface language (English / Simplified / Traditional)
2. **Installation Check**: Install to home screen if not already in standalone mode
3. **Input Method**: Select Pinyin, Zhuyin, or Cangjie
4. **Backup Reminder**: Review data safety recommendations
5. **Tutorial**: Learn the three-stage memorization system (or skip to start immediately)

### Adding Verses
1. Go to **Add Verse** panel
2. Enter:
   - Chinese verse text
   - Book name (Chinese)
   - Chapter and verse numbers
   - First key for each character (based on your input method)
   - Book name keys
   - Bible version (optional)
3. Optionally add to a collection
4. Tap **Save Verse**

**Tip**: Input method keys must match character order exactly. For Pinyin: "耶和華" → "yhh"

### Learning Mode
1. Go to **Learn** panel
2. Select a verse from the dropdown
3. Choose difficulty: **Basic** → **Intermediate** → **Advanced**
4. Type the first key for each character
5. Progress to next stage at 90% accuracy
6. Verses become reviewable after completing Advanced

### Review Mode
- **Review Due Verses**: Red button appears when verses are overdue
- **Collections**: Select a collection and choose review mode (individual or single-text)
- **Individual Verses**: Check boxes next to verses, then tap **Review verses**
- **Change Interval**: Select verses and adjust next review date (1–35+ days)

### Collections
- **Create**: Enter title and tap **Create Collection**
- **Add Verses**: Use the Add Verse panel or bulk-add from the Collections panel
- **View/Edit**: Expand collections to see verses and due dates
- **Rename/Delete**: Use action buttons on each collection

### Export & Import
- **Download Data**: Export all verses, selected collections, or ungrouped verses
- **Include Options**: Toggle review data (progress) and collection data (groups)
- **Import Data**: Upload JSON file; review data merges intelligently (keeps most recent)

**⚠️ Important**: Export regularly! Data is stored locally—clearing browser data or uninstalling deletes everything.

### Settings
- **Language**: Switch interface language
- **Theme**: Light / Dark / System
- **Input Method**: Change entry method (resets keyboard)
- **Default Bible Version**: Pre-fill version field
- **Vibration Feedback**: Enable error vibrations (Android only)
- **Backup Reminders**: Toggle periodic export reminders
- **Clear All Data**: Permanently delete all verses and collections

---

## 🧠 Spaced Repetition System

### Interval Progression
- **Success**: 1 day → 6 days → 12 days → 24 days → 48 days → continues doubling
- **Failure**: Resets to interval=1, repetitions=0
- **Early Review Penalty**: If reviewed before due date, next interval is reduced proportionally:  
  `new_interval = old_interval × (days_waited / previous_interval)`

### Advancement Rules
- **Learning Stage**: 90% accuracy required to advance (Basic → Intermediate → Advanced)
- **Review Stage**: <90% accuracy resets interval to 1 day

### Due Date Logic
- **Due Today**: 0–24 hours until due or 0–24 hours overdue
- **Overdue**: 24+ hours past due date (shown in red)
- **Due Soon**: 1–23 hours until due (shown in orange)

---

## 🔒 Data & Privacy

### Storage
- All data stored in browser's `localStorage` (5–10 MB limit per domain)
- No backend server or cloud sync
- No user accounts or tracking

### Data Safety
- **Backup Regularly**: Use Export & Import to save JSON files to cloud storage
- **Device-Specific**: Data does not sync between devices
- **Clearing Data**: Uninstalling the app or clearing site data deletes all progress
- **Installed PWA**: Even standalone apps lose data if you clear browser storage

### What Gets Exported
- **Verses**: Text, references, keystrokes, bible version
- **Review Data** (optional): Last reviewed date, due date, interval, repetition count
- **Collections** (optional): Titles and verse membership

---

## 👨‍💻 Developer Notes

### Architecture
- **Single-Page Vanilla JS**: No frameworks—entire app in `window.onload` closure
- **Offline-First**: Service worker caches all assets for instant offline access
- **Mobile-First CSS**: Base styles for mobile, `@media (min-width: 768px)` for desktop

### Key Files
- **`index.html`**: Single-page structure with all panels and modals
- **`script.js`**: Complete application logic (5400+ lines in one closure)
- **`style.css`**: Theme-aware styling with CSS variables
- **`sw.js`**: Service worker for PWA caching
- **`manifest.json`**: PWA manifest for installation
- **`fonts/`**: Bundled Noto Sans SC for offline Chinese rendering
- **`icons/`**: PWA icons (72px–512px)

### Data Model (localStorage)
```javascript
verses = [{
  id, verseText, bookName, chapterNumber, verseNumber,
  verseInitials, bookInitials, bibleVersion,
  lastReviewed, dueDate, interval, repetitions
}]

collections = [{
  id, title, verseIds: []
}]
```

### Spaced Repetition Implementation
- **Function**: `spacedRepetitionBinary(card, success, currentDate)` (line ~1353)
- **Binary System**: Pass/fail only (not EF-based like SM-2)
- **Early Review**: Reduces next interval based on fraction of scheduled time waited
- **Storage**: Dates stored as ISO strings; converted to Date objects at runtime

### Input Methods & Keyboards
- **Physical Keyboard Mapping**:
  - Zhuyin: QWERTY keys map to Bopomofo symbols
  - Cangjie: QWERTY keys map to radicals (手田水口廿卜山戈人心…)
  - Pinyin: Direct a-z mapping
- **Onscreen Keyboards**: Custom HTML keyboards for touch devices
- **Hidden Input Pattern**: `learnInput` positioned off-screen (`left: -9999px`) but remains focusable
  - Unifies physical and onscreen keyboard handling
  - Prevents layout shifts while keeping input field functional
  - Uses helper text above verse display instead of placeholder

### Onboarding Flow
1. Language Selection
2. Install Check (if not in standalone mode)
3. Input Method Selection
4. Backup Reminder
5. Tutorial Intro (overview of 3 stages)
6. Tutorial Basic (animated example)
7. Tutorial Intermediate (animated example)
8. Tutorial Advanced (animated example)
9. Begin (Learn panel with sample verses)

### Sample Data
- **Files**: `PY-Samples.json`, `ZY-Samples.json`, `CJ-Samples.json`
- **Format**: `{ verses: [], collections: [{ title, verseRefs }] }`
- **Loading**: Verse refs resolved to IDs during import
- **Trigger**: Loaded once on first run based on selected input method

### Icon Generation
- **Source**: `icons/icon.svg`
- **Methods**:
  - Browser: Open `generate-icons.html` (canvas-based)
  - CLI: Run `./generate-icons.sh` (requires ImageMagick)
- **Sizes**: 72, 96, 128, 144, 152, 192, 384, 512px

### Local Development
```bash
# Start server (option 1)
./start-server.sh

# Start server (option 2)
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

### Deployment Checklist
1. Update code in `index.html`, `script.js`, `style.css`
2. **Bump `CACHE_NAME`** in `sw.js` (e.g., `v0.9.1` → `v0.9.2`)
3. Verify `manifest.json` version and icons
4. Test in browsers: Safari (iOS), Chrome (Android), desktop
5. Hard reload (Cmd+Shift+R / Ctrl+Shift+R) to clear cache

### Key Technical Patterns

**Panel Navigation**
- `showPanel(panel)` shows one panel at a time
- `hideAllKeyboards()` called on panel switch

**Keyboard Management**
- `showKeyboardForInput(input, forceKeyboardType)` detects input method and shows appropriate keyboard
- Makes input readonly in learn/review mode (keys append programmatically)
- `hideElementsBetweenInputAndKeyboard()` maximizes screen space
- `scrollIntoView({ block: 'center' })` keeps content visible above keyboard

**Biblical Order Sorting**
- `sortVersesByBibleOrder(verses)` uses hardcoded `CHINESE_BIBLE_BOOKS` array
- Critical for displaying verses in canonical sequence

**Collections**
- Verses can belong to multiple collections
- Review modes: Individual (verse-by-verse) or Single-Text (continuous)
- Export supports selective collection export with optional review data merge

**Translation System**
- Inline `TRANSLATIONS` object with keys for `english`, `simplified`, `traditional`
- `applyLanguage()` updates all `[data-i18n]` attributes
- `t(key)` helper returns localized string

### Critical Implementation Details

**Why Single File?**
- Maximum portability (copy 5 files, runs anywhere)
- Simplified offline caching (no build step or module bundler)
- Entire state machine in one closure (no global pollution)

**Why Hidden Input?**
- Unifies physical keyboard and onscreen keyboard event handling
- Prevents mobile keyboard from covering content
- Allows programmatic focus management without visible input field

**Why localStorage?**
- Simple, synchronous API
- Works offline immediately
- No server required
- Trade-off: Manual backups needed

**Mobile Optimizations**
- Hidden learn input field saves ~50–60px vertical space
- Inline mute button with verse selector saves ~40px
- Dynamic keyboard visibility based on active input
- Touch-optimized key sizes (Cangjie: 44×44px minimum)

### Reset / Re-Onboard
To reset onboarding state:
1. Open browser DevTools → Application/Storage → Local Storage
2. Delete keys: `hasCompletedOnboarding`, `hasVisitedBefore`, `inputMethod`
3. Delete `verses` and `collections` to reload samples
4. Refresh page

Or use **Clear All Data** button in Settings.

### Known Limitations
- localStorage size limit (~5–10 MB)
- No cross-device sync
- Depends on browser Chinese font rendering quality
- Vibration API only works on Android
- Review data merge on import keeps most recent `lastReviewed` date

### Contributing Guidelines
- Maintain single-file closure architecture
- Add translation keys to all three languages (`english`, `simplified`, `traditional`)
- Test all three input methods (Pinyin, Zhuyin, Cangjie)
- Verify light/dark theme compatibility
- Test on iOS Safari, Android Chrome, and desktop
- Update `CACHE_NAME` in `sw.js` after changes
- Use CSS variables for colors (theme support)
- Preserve offline functionality

---

## 📋 Updates in Version 0.9.3

### New Settings
- **Character Set for Book Names**: Choose between Simplified or Traditional Chinese characters for Bible book names
  - Affects display in verse lists, review screens, and throughout the app
  - Independent from interface language setting
  - Allows English interface Pinyin users to choose their prefered character set

- **Text Size Adjustment**: Larger font size for better readability
  - Three size options: Normal (100%), Large (120%), Extra Large (150%)
  - Applies to verse text, book names, and UI elements
  - Onscreen keyboards are the only text not affected
  - Settings persist across sessions

- **View Tutorial**: Re-access the learning tutorial anytime from Settings
  - Review the three-stage memorization system
  - View the interactive examples
  - Helpful for new users who prefer larger text sizes or refreshing memory after time away

### UX Improvements
- **Enhanced Checkbox Selection**: Improved tap/click targets for faster verse and collection selection
  - Add Verse List: Click anywhere on verse item (except buttons) to toggle checkbox
  - Review Verse List: Click anywhere on verse item to toggle checkbox
  - Review Collections: Click anywhere on collection header to toggle checkbox
  - Collection verses: Click on any verse within expanded collection to toggle parent collection checkbox
  - Expand/collapse icon moved to far right for easier access without accidentally hitting checkbox
  - Only the triangle icon (▶) now controls collection expansion/collapse
  - Larger, more accessible hit areas for mobile-friendly interaction

---

## 📄 Previous Versions

For detailed changelogs of versions 0.9.2, 0.9.1.1, 0.9.1, and earlier, please refer to the project's git history.

---

## 📄 License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
