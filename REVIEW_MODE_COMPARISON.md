# Review Mode vs Advanced Learning Mode - Code Comparison

## Summary of Issues
Individual Review mode is non-functional because it:
1. **Uses simple string rendering instead of character-by-character mapping**
2. **Lacks the charToInputIndex/inputIndexToCharIndex mapping system**
3. **Missing physical keyboard handler**
4. **Doesn't have error feedback during typing**
5. **Uses basic HTML concatenation instead of reactive rendering**

---

## 1. DATA INITIALIZATION

### Advanced Learning Mode (WORKING) ✅
```javascript
function initializeVerse(verse) {
    // Combines verse text with reference
    learnFullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
    
    // Combines ALL initials including reference
    learnFullInitials = `${verse.verseInitials}${verse.bookInitials}${String(verse.chapterNumber)}${String(verse.verseNumber)}`;

    // BUILD CHARACTER MAPPING - This is critical!
    const chars = [...learnFullText];
    charToInputIndex = new Array(chars.length).fill(null);
    inputIndexToCharIndex = [];
    let inputIdx = 0;
    
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        // Only Chinese characters and digits require input
        if (/[\u4e00-\u9fa5]/.test(ch) || /[0-9]/.test(ch)) {
            charToInputIndex[i] = inputIdx;
            inputIndexToCharIndex[inputIdx] = i;
            inputIdx++;
        } else {
            charToInputIndex[i] = null; // Punctuation/whitespace
        }
    }
}
```

### Individual Review Mode (BROKEN) ❌
```javascript
// NO initialization function!
// Just reactive statements:
$: currentVerse = verses[currentIndex];
$: expectedInput = currentVerse?.verseInitials || '';

// MISSING: No charToInputIndex mapping
// MISSING: No full text with reference
// MISSING: No inputIndexToCharIndex mapping
// Only uses verseInitials, doesn't include reference initials
```

**Problem**: Review mode only expects `verseInitials` but doesn't include the reference (book initials + chapter + verse numbers), so it will never match correctly when the user types the full sequence.

---

## 2. CHARACTER RENDERING

### Advanced Learning Mode (WORKING) ✅
```javascript
function renderCharacter(char, charIndex) {
    const map = charToInputIndex[charIndex];

    if (map !== null) {
        // Input-requiring character (Chinese or digit)
        const expected = learnFullInitials[map];
        let className = 'verse-character';
        let hidden = false;

        // In advanced: everything is hidden initially
        if (currentStage === 'advanced') {
            hidden = true;
        }

        // Reveal as user types with correct/incorrect styling
        if (hidden) {
            if (userInput.length > map) {
                const inputMethod = $settings.inputMethod || 'pinyin';
                const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
                const expectedChar = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
                const isCorrect = typedChar === expectedChar;
                return { 
                    char, 
                    className: className + (isCorrect ? ' correct' : ' incorrect'), 
                    hidden: false 
                };
            } else {
                return { char, className: className + ' hidden', hidden: true };
            }
        }

        return { char, className, hidden: false };
    } else {
        // Punctuation - complex visibility logic
        // Shows punctuation when surrounding characters are typed
        // ... (detailed logic for punctuation visibility)
    }
}

// Used in template with reactive rendering
{#each chars as char, i}
    {@const rendered = renderCharacter(char, i)}
    {#if rendered.hidden}
        <!-- Hidden -->
    {:else}
        <span class={rendered.className}>{rendered.char}</span>
    {/if}
{/each}
```

### Individual Review Mode (BROKEN) ❌
```javascript
function renderVerseText() {
    if (!currentVerse) return '';
    
    const text = currentVerse.verseText;  // WRONG: Only verse text, no reference
    const initials = currentVerse.verseInitials;  // WRONG: Only verse initials
    let html = '';
    let initialIndex = 0;

    for (const char of text) {
        const isHanChar = /\p{Script=Han}/u.test(char) || /[0-9]/.test(char);
        
        if (isHanChar && initialIndex < initials.length) {
            const expected = initials[initialIndex];
            const typed = userInput[initialIndex];
            let className = 'verse-character';

            if (initialIndex < userInput.length) {
                if (typed && typed.toLowerCase() === expected.toLowerCase()) {
                    className += ' correct';
                } else {
                    className += ' incorrect';
                }
            } else {
                className += ' hidden';
            }

            html += `<span class="${className}">${char}</span>`;
            initialIndex++;
        } else {
            // WRONG: Simplistic punctuation logic
            const className = initialIndex <= userInput.length ? 'verse-character correct' : 'verse-character hidden';
            html += `<span class="${className}">${char}</span>`;
        }
    }

    return html;  // Returns HTML string instead of reactive components
}

// Used as {@html renderVerseText()} - not reactive to userInput changes
```

**Problems**:
1. Only uses `verseText`, doesn't include reference like `\n${bookName} ${chapter}:${verse}`
2. Only checks `verseInitials`, doesn't include `bookInitials + chapter + verse numbers`
3. Returns HTML string via `{@html}` which doesn't update reactively
4. Simplistic punctuation logic that doesn't match Learning Mode
5. No character-to-input mapping system

---

## 3. INPUT HANDLING

### Advanced Learning Mode (WORKING) ✅
```javascript
// Onscreen keyboard handler
function handleKeyInput(event) {
    const key = event.detail;

    if (key === '⌫' || key === 'Backspace') {
        // Backspace disabled during learning
        return;
    }

    if (key === '↵' || key === 'Enter') {
        if (userInput.length === learnFullInitials.length) {
            submitAnswer();
        }
        return;
    }

    userInput += key;
    
    // Update error feedback in real-time
    updateErrorFeedback();

    // Auto-submit when complete
    if (userInput.length === learnFullInitials.length) {
        submitAnswer();
    }
}

// Physical keyboard handler with input method mapping
function handlePhysicalKeyboard(e) {
    if (!getCurrentVerse()) return;
    if (showNextButton || showRetryButton) return;

    if (e.key === 'Enter' && userInput.length === learnFullInitials.length) {
        e.preventDefault();
        submitAnswer();
        return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();  // Disabled
        return;
    }

    const inputMethod = $settings.inputMethod || 'pinyin';
    const key = e.key.toLowerCase();
    let mappedValue = '';

    if (inputMethod === 'zhuyin') {
        mappedValue = zhuyinKeyMap[key] || '';
    } else if (inputMethod === 'cangjie') {
        mappedValue = cangjieKeyMap[key] || '';
    } else if (/^[a-z0-9]$/i.test(key)) {
        mappedValue = key;
    }

    if (mappedValue) {
        e.preventDefault();
        userInput += mappedValue;
        updateErrorFeedback();
        
        if (userInput.length === learnFullInitials.length) {
            submitAnswer();
        }
    }
}

// Bound to document
<svelte:document on:keydown={handlePhysicalKeyboard} />
```

### Individual Review Mode (BROKEN) ❌
```javascript
function handleKeyInput(event) {
    const key = event.detail;

    if (key === '⌫') {
        userInput = userInput.slice(0, -1);  // Allows backspace
        return;
    }

    if (key === '↵') {
        checkAnswer();
        return;
    }

    userInput += key;

    // Auto-submit when reaching expected length
    if (userInput.length === expectedInput.length) {
        setTimeout(checkAnswer, 100);
    }
}

// MISSING: No physical keyboard handler at all!
// MISSING: No error feedback during typing
// MISSING: No input method mapping (zhuyin/cangjie)
```

**Problems**:
1. No physical keyboard support - onscreen keyboard only
2. No input method mapping (assumes pinyin only)
3. No real-time error feedback
4. Allows backspace (should be disabled like Learning Mode)
5. Checks against `expectedInput` which is only `verseInitials` (missing reference)

---

## 4. ERROR FEEDBACK

### Advanced Learning Mode (WORKING) ✅
```javascript
function updateErrorFeedback() {
    const inputMethod = $settings.inputMethod || 'pinyin';
    let latestErrorIndex = -1;
    let latestErrorChar = '';
    let mappedCharIndex = -1;

    // Find the most recent (latest) error
    for (let i = 0; i < userInput.length; i++) {
        const expected = learnFullInitials[i];
        const typed = userInput[i];
        const expectedNorm = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
        const typedNorm = inputMethod === 'pinyin' ? typed.toLowerCase() : typed;
        
        if (typedNorm !== expectedNorm) {
            latestErrorIndex = i;
            latestErrorChar = expected;
            mappedCharIndex = inputIndexToCharIndex[i] !== undefined ? inputIndexToCharIndex[i] : -1;
        }
    }

    // Update help text only when error changes
    if (latestErrorIndex === -1) {
        feedbackMessage = '';
        feedbackType = '';
    } else {
        const chars = [...learnFullText];
        const errorCharacter = mappedCharIndex !== -1 ? chars[mappedCharIndex] : '?';
        
        if (lastErrorIndex !== latestErrorIndex || lastErrorChar !== latestErrorChar) {
            feedbackMessage = t('incorrect_input')
                .replace('{char}', errorCharacter)
                .replace('{pos}', latestErrorIndex + 1)
                .replace('{expected}', latestErrorChar);
            feedbackType = 'error';
            lastErrorIndex = latestErrorIndex;
            lastErrorChar = latestErrorChar;
            
            // Trigger viewport scroll to reveal error feedback
            scrollTrigger++;
        }
    }
}
```

### Individual Review Mode (BROKEN) ❌
```javascript
// MISSING: No real-time error feedback during typing!
// Only shows result AFTER submission in checkAnswer()

function checkAnswer() {
    if (showResult) return;

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < expectedInput.length; i++) {
        if (userInput[i] && userInput[i].toLowerCase() === expectedInput[i].toLowerCase()) {
            correct++;
        }
    }

    accuracy = expectedInput.length > 0 ? Math.round((correct / expectedInput.length) * 100) : 0;
    showResult = true;  // Shows result modal/display
}
```

**Problems**:
1. No real-time feedback as user types
2. Only shows accuracy after full submission
3. Doesn't help user identify which character is wrong
4. No viewport scrolling to reveal feedback

---

## 5. SUBMISSION & VALIDATION

### Advanced Learning Mode (WORKING) ✅
```javascript
function submitAnswer() {
    const expected = getExpectedInitials();  // Full initials with reference

    // Calculate accuracy
    let correctChars = 0;
    const inputMethod = $settings.inputMethod || 'pinyin';
    for (let i = 0; i < expected.length; i++) {
        const typedChar = inputMethod === 'pinyin' ? (userInput[i] || '').toLowerCase() : (userInput[i] || '');
        const expectedChar = inputMethod === 'pinyin' ? expected[i].toLowerCase() : expected[i];
        if (typedChar === expectedChar) {
            correctChars++;
        }
    }

    accuracy = Math.round((correctChars / expected.length) * 100);

    if (accuracy >= 90) {
        if (currentStage === 'advanced') {
            // Mark verse as learned
            updateVerseProgress(getCurrentVerse());
            modalMessage = `${t('congratulations_mastered')} (${accuracy}%)`;
            showModal = true;
            // Advance to next verse
        }
    } else {
        // Show retry
        showRetryButton = true;
        feedbackMessage = `${t('nice_try')} (${accuracy}%)`;
        feedbackType = 'error';
    }
}
```

### Individual Review Mode (BROKEN) ❌
```javascript
function checkAnswer() {
    // Calculate accuracy against WRONG expected input (only verseInitials)
    let correct = 0;
    for (let i = 0; i < expectedInput.length; i++) {
        if (userInput[i] && userInput[i].toLowerCase() === expectedInput[i].toLowerCase()) {
            correct++;
        }
    }

    accuracy = expectedInput.length > 0 ? Math.round((correct / expectedInput.length) * 100) : 0;

    // Update with spaced repetition
    // ... (this part is OK)
    
    showResult = true;  // Shows result display
}
```

**Problems**:
1. Validates against `expectedInput` (only `verseInitials`) instead of full sequence with reference
2. User types: `verseInitials + bookInitials + chapter + verse`
3. But it only checks: `verseInitials`
4. Result: Always fails because input is longer than expected

---

## KEY DIFFERENCES SUMMARY

| Feature | Advanced Learning (WORKS) | Individual Review (BROKEN) |
|---------|--------------------------|---------------------------|
| **Data Model** | `learnFullText` with reference | Only `verseText` |
| **Expected Input** | `verseInitials + bookInitials + chapter + verse` | Only `verseInitials` |
| **Character Mapping** | `charToInputIndex` array mapping | None - iterates text directly |
| **Rendering** | Reactive with `renderCharacter()` | Static HTML with `{@html}` |
| **Physical Keyboard** | Supported with input method mapping | Not supported |
| **Error Feedback** | Real-time during typing | Only after submission |
| **Punctuation Logic** | Complex visibility based on surrounding chars | Simple show/hide |
| **Input Method Support** | Pinyin, Zhuyin, Cangjie | Pinyin only |
| **Backspace** | Disabled | Enabled |
| **Auto-submit** | On complete input | On complete input (but wrong length) |

---

## REQUIRED FIXES FOR REVIEW MODE

1. **Add full initialization like Learning Mode**:
   - Include reference in display text
   - Include reference initials in expected input
   - Build `charToInputIndex` and `inputIndexToCharIndex` mappings

2. **Replace `renderVerseText()` with character-by-character reactive rendering**:
   - Use `renderCharacter()` logic from Learning Mode
   - Replace `{@html}` with Svelte `{#each}` blocks
   - Make rendering reactive to `userInput` changes

3. **Add physical keyboard handler**:
   - Copy `handlePhysicalKeyboard()` from Learning Mode
   - Add input method mapping support
   - Disable backspace

4. **Add real-time error feedback**:
   - Copy `updateErrorFeedback()` function
   - Call it after each keystroke
   - Add feedback display in template

5. **Fix validation**:
   - Check against full expected input (with reference)
   - Use same accuracy calculation as Learning Mode

6. **Add viewport scrolling**:
   - Add viewport anchor element
   - Add scroll trigger mechanism
   - Position keyboard properly

---

## CONCLUSION

Individual Review Mode is essentially trying to do what Advanced Learning Mode does, but:
- Uses wrong data (missing reference)
- Uses wrong rendering (static HTML)
- Uses wrong input handling (no physical keyboard)
- Missing error feedback
- Has incorrect validation logic

**Solution**: Refactor Individual Review to use the same core logic as Advanced Learning Mode, just without the stage progression.
