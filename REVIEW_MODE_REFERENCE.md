# Review Mode Reference Documentation

Extracted from legacy/script.js for implementing Review mode in the new SvelteKit app.

## Overview

The Review system has TWO distinct modes:
1. **Individual Review** - Reviews verses one-by-one in Advanced stage
2. **Single-Text Review** - Reviews verses as a continuous passage with progressive reveal

## Data Structures

### Review Session State
```javascript
// Individual Review Mode
window.reviewVerses = [];          // Array of verses to review
window.reviewCollectionMode = null; // 'individual' or null
window.reviewSuccessCount = 0;      // Count of successfully reviewed verses
window.reviewPracticeMode = false;  // Whether in practice mode

// Single-Text Review Mode
singleTextSession = {
  verses: [],                       // Verses to review
  startTime: new Date(),            // Session start time
  endTime: null,                    // Session end time
  currentIndex: 0,                  // Current verse index
  reviewedIds: [],                  // IDs of successfully reviewed verses
  allSameBookChapter: boolean,      // Whether all verses from same book/chapter
  input: '',                        // Current input string
  answerKeys: [],                   // Array of verseInitials (answer keys)
  displayLines: [],                 // Display information for each verse
  helpText: ''                      // Live feedback text
}

// Display line structure
displayLines = [{
  ref: 'Book 1:1',                  // Text reference
  refHtml: '<span>...</span>',      // HTML for reference display
  text: 'verse text',               // Original verse text
  fullText: 'Book 1:1 verse text',  // Full text with reference
  finalHtml: ''                     // Final colored HTML after completion
}]
```

## Entry Points

### 1. Review Due Verses Button
Located in Review panel - reviews all verses that are due for review.

```javascript
reviewDueBtn.addEventListener('click', () => {
  const verses = JSON.parse(localStorage.getItem('verses') || '[]');
  const now = new Date();
  const dueVerses = verses.filter(v => {
    if (!v || !v.lastReviewed) return false;
    if (!v.dueDate) return true;
    return new Date(v.dueDate) <= now;
  });

  if (dueVerses.length === 0) {
    alert('No learned verses to review');
    return;
  }

  // Single verse - start directly
  if (dueVerses.length === 1) {
    // Start individual review immediately
    reviewCollectionMode = 'individual';
    reviewVerses = dueVerses;
    currentVerse = dueVerses[0];
    setLearningStage('advanced');
    showPanel(learnPanel);
    startLearnMode(currentVerse);
    hideReviewModeControls();
    return;
  }

  // Multiple verses - show review mode modal
  showReviewModeModal(dueVerses);
});
```

### 2. Review Selected Verses Button
Located in Review panel - reviews manually selected verses.

```javascript
startReviewBtn.addEventListener('click', () => {
  const selectedVerses = Array.from(document.querySelectorAll('.verse-checkbox:checked'))
    .map(checkbox => JSON.parse(checkbox.dataset.verse));
  
  if (selectedVerses.length === 0) {
    alert('Please select at least one verse');
    return;
  }

  if (selectedVerses.length === 1) {
    // Start individual review immediately
    reviewCollectionMode = 'individual';
    reviewVerses = selectedVerses;
    currentVerse = selectedVerses[0];
    setLearningStage('advanced');
    showPanel(learnPanel);
    startLearnMode(currentVerse);
    hideReviewModeControls();
    return;
  }

  // Multiple verses - show review mode modal AND order modal
  showReviewModeModal(selectedVerses);
});
```

### 3. Review Collection Button
Located in Collections panel - reviews all learned verses in a collection.

```javascript
reviewCollectionBtn.addEventListener('click', () => {
  const selectedCollectionId = reviewCollectionsList.value;
  if (!selectedCollectionId) {
    alert('Please select a collection');
    return;
  }

  const collections = getCollections();
  const col = collections.find(c => c.id === selectedCollectionId);
  const verses = JSON.parse(localStorage.getItem('verses') || '[]');
  
  // Filter to only learned verses in collection
  const learnedVerses = col.verseIds
    .map(id => verses.find(v => v.id === id))
    .filter(v => v && v.lastReviewed);

  if (learnedVerses.length === 0) {
    alert('No learned verses in this collection');
    return;
  }

  if (learnedVerses.length === 1) {
    // Start review immediately
    reviewCollectionMode = 'individual';
    reviewVerses = learnedVerses;
    currentVerse = learnedVerses[0];
    setLearningStage('advanced');
    showPanel(learnPanel);
    startLearnMode(currentVerse);
    hideReviewModeControls();
    return;
  }

  // Multiple verses - show review mode modal
  showReviewModeModal(learnedVerses);
}, true);
```

## Review Mode Modal

When multiple verses are selected, show modal to choose review type:

```javascript
function showReviewModeModal(verses) {
  // Modal has two buttons:
  // 1. Review Individually - verse-by-verse advanced mode
  // 2. Review as Single Text - continuous passage

  individuallyBtn.onclick = () => {
    closeModal();
    // Show review order modal (if > 1 verse)
    showReviewOrderModal(verses);
  };

  singleTextBtn.onclick = () => {
    closeModal();
    // Always use Biblical order for single-text
    const sortedList = sortVersesByBibleOrder(verses);
    startSingleTextReviewSession(sortedList);
  };
}
```

## Review Order Modal

For Individual Review with multiple verses, choose order:

```javascript
function showReviewOrderModal(verses) {
  // Modal has three buttons:
  // 1. Biblical Order - sort by book order
  // 2. By Due Date - sort by when due (earliest first)
  // 3. Random Order - shuffle

  biblicalBtn.onclick = () => {
    closeModal();
    startIndividualReview(sortVersesByBibleOrder(verses));
  };

  dueDateBtn.onclick = () => {
    closeModal();
    startIndividualReview(sortByDueDate(verses));
  };

  randomBtn.onclick = () => {
    closeModal();
    startIndividualReview(shuffleArray(verses));
  };
}
```

## Individual Review Mode

Reviews verses one-by-one in Advanced stage:

```javascript
function startIndividualReview(sortedVerses) {
  reviewCollectionMode = 'individual';
  reviewVerses = sortedVerses;
  reviewSuccessCount = 0;
  
  // Populate verse selector dropdown
  verseSelector.innerHTML = '';
  reviewVerses.forEach((v, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
    verseSelector.appendChild(opt);
  });
  verseSelector.selectedIndex = 0;
  verseSelector.style.display = 'block';
  verseSelector.disabled = true; // Disabled during review
  
  // Hide verse selector label
  verseSelectorLabel.style.display = 'none';
  
  // Start first verse
  currentVerse = reviewVerses[0];
  setLearningStage('advanced');
  showPanel(learnPanel);
  startLearnMode(currentVerse);
  hideReviewModeControls(); // Hide mode buttons during review
}
```

### Navigation Between Verses

When user completes a verse in Individual Review:

```javascript
// In checkAnswer() when accuracy >= 90%
if (reviewCollectionMode === 'individual' && reviewVerses.length > 0) {
  reviewSuccessCount++;
  
  // Find next unreviewed verse
  const currentIndex = reviewVerses.findIndex(v => v.id === currentVerse.id);
  let nextIndex = currentIndex + 1;
  
  // If at end, show completion message
  if (nextIndex >= reviewVerses.length) {
    const msg = `Congratulations! You have successfully reviewed ${reviewSuccessCount} verses!`;
    showModal(msg, () => {
      // Return to Review panel
      reviewBtn.click();
    });
    return;
  }
  
  // Load next verse
  currentVerse = reviewVerses[nextIndex];
  verseSelector.selectedIndex = nextIndex;
  startLearnMode(currentVerse);
}
```

## Single-Text Review Mode

Reviews verses as continuous passage with progressive character reveal:

```javascript
function startSingleTextReviewSession(verses) {
  singleTextSession = {
    verses: verses,
    startTime: new Date(),
    endTime: null,
    currentIndex: 0,
    reviewedIds: [],
    allSameBookChapter: verses.every(v => 
      v.bookName === verses[0].bookName && 
      v.chapterNumber === verses[0].chapterNumber
    ),
    input: '',
    answerKeys: verses.map(v => v.verseInitials),
    displayLines: buildSingleTextDisplayLines(verses),
    helpText: ''
  };
  
  showPanel(learnPanel);
  verseSelector.style.display = 'none';
  hideReviewModeControls();
  
  renderSingleTextReview();
  learnInput.value = '';
  learnInput.disabled = false;
  learnInput.focus();
  learnInput.addEventListener('input', singleTextInputHandler);
}

function buildSingleTextDisplayLines(verses) {
  const allSame = verses.every(v => 
    v.bookName === verses[0].bookName && 
    v.chapterNumber === verses[0].chapterNumber
  );
  
  return verses.map((v, i) => {
    let ref = '';
    let refHtml = '';
    
    // First verse or different book/chapter - show full reference
    if (i === 0 || !allSame) {
      ref = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
      refHtml = `<span class='reference-inline'>${ref}</span>`;
    } else {
      // Same book/chapter - show only verse number
      ref = `${v.verseNumber}`;
      refHtml = `<span class='reference-inline'>${ref}</span>`;
    }
    
    return {
      ref,
      refHtml,
      text: v.verseText,
      fullText: `${ref} ${v.verseText}`,
      finalHtml: ''
    };
  });
}
```

### Rendering Single-Text Display

```javascript
function renderSingleTextReview() {
  if (!singleTextSession) return;
  
  const idx = singleTextSession.currentIndex;
  const lines = singleTextSession.displayLines;
  let html = '';
  
  // Show completed verses with their final colored HTML
  for (let i = 0; i < idx; i++) {
    const lineText = lines[i].finalHtml || lines[i].text;
    html += `<div class='completed-verse'>${lines[i].refHtml} ${lineText}</div>`;
  }
  
  // Show current verse with reference in white, text as input display
  if (idx < lines.length) {
    html += `<div class='current-verse-chars'>${lines[idx].refHtml} <span id='singleTextInputDisplay'></span></div>`;
  }
  
  learnVerseDisplay.innerHTML = html;
  learnFeedback.textContent = singleTextSession.helpText;
}
```

### Character-by-Character Input Handler

```javascript
function singleTextInputHandler(e) {
  if (!singleTextSession) return;
  
  const idx = singleTextSession.currentIndex;
  const key = singleTextSession.answerKeys[idx];
  const currentVerseData = singleTextSession.verses[idx];
  const currentVerseText = currentVerseData.verseText;
  
  let input = learnInput.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // 1. BUZZER on errors
  const prevInput = singleTextSession.input || '';
  const prevLen = prevInput.length;
  singleTextSession.input = input;
  
  if (input.length > prevLen) {
    for (let j = prevLen; j < input.length; j++) {
      const expected = key[j] ? key[j].toLowerCase() : null;
      const typed = input[j];
      if (expected && typed !== expected) {
        playBuzzer();
        vibrateOnError();
        break;
      }
    }
  }
  
  // 2. CHARACTER-BY-CHARACTER DISPLAY
  let displayHTML = '';
  let inputIndex = 0;
  
  for (const char of currentVerseText) {
    const isHanChar = (/\p{Script=Han}/u).test(char);
    let className = 'verse-character';
    
    if (isHanChar && inputIndex < key.length) {
      const expectedInitial = key[inputIndex];
      const typedInitial = input[inputIndex];
      
      if (inputIndex < input.length) {
        if (typedInitial && typedInitial === expectedInitial) {
          className += ' correct';
        } else {
          className += ' incorrect';
        }
      } else {
        className += ' hidden';
      }
      
      displayHTML += `<span class="${className}">${char}</span>`;
      inputIndex++;
    } else {
      // Punctuation - reveal when previous character typed
      if (inputIndex <= input.length) {
        className += ' correct';
        displayHTML += `<span class="${className}">${char}</span>`;
      } else {
        className += ' hidden';
        displayHTML += `<span class="${className}">${char}</span>`;
      }
    }
  }
  
  const inputDisplay = document.getElementById('singleTextInputDisplay');
  if (inputDisplay) inputDisplay.innerHTML = displayHTML;
  
  // 3. LIVE ERROR FEEDBACK
  let latestErrorIndex = -1;
  let latestErrorChar = '';
  for (let i = 0; i < input.length; i++) {
    const expected = key[i] ? key[i].toLowerCase() : '';
    const typed = input[i] ? input[i].toLowerCase() : '';
    if (typed !== expected) {
      latestErrorIndex = i;
      latestErrorChar = expected;
    }
  }
  
  if (latestErrorIndex === -1) {
    singleTextSession.helpText = '';
    learnFeedback.textContent = '';
    learnFeedback.className = '';
  } else {
    // Map input index to character in verse
    let charCount = 0;
    let errorCharacter = '?';
    for (const ch of currentVerseText) {
      if ((/\p{Script=Han}/u).test(ch) || /[0-9]/.test(ch)) {
        if (charCount === latestErrorIndex) {
          errorCharacter = ch;
          break;
        }
        charCount++;
      }
    }
    
    singleTextSession.helpText = `Incorrect input for "${errorCharacter}" (position ${latestErrorIndex + 1}). Expected "${latestErrorChar}".`;
    learnFeedback.textContent = singleTextSession.helpText;
    learnFeedback.className = 'error';
  }
  
  // 4. COMPLETION CHECK
  if (input.length === key.length) {
    let correct = 0;
    for (let i = 0; i < key.length; i++) {
      if (input[i] && input[i].toLowerCase() === key[i].toLowerCase()) {
        correct++;
      }
    }
    
    const accuracy = key.length > 0 ? (correct / key.length) * 100 : 0;
    singleTextSession.helpText = `Accuracy: ${accuracy.toFixed(1)}%`;
    
    learnFeedback.className = accuracy >= 90 ? 'success' : 'error';
    
    // Save final colored HTML
    singleTextSession.displayLines[idx].finalHtml = displayHTML;
    
    // Update spaced repetition data
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const v = singleTextSession.verses[idx];
    const verseIndex = verses.findIndex(x => x.id === v.id);
    
    if (verseIndex !== -1) {
      const now = new Date();
      const success = accuracy >= 90;
      
      const card = {
        interval: verses[verseIndex].interval || 0,
        repetitions: verses[verseIndex].repetitions || 0,
        dueDate: verses[verseIndex].dueDate
      };
      
      const updatedCard = spacedRepetitionBinary(card, success, now);
      
      verses[verseIndex].interval = updatedCard.interval;
      verses[verseIndex].repetitions = updatedCard.repetitions;
      verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
      
      if (success) {
        verses[verseIndex].lastReviewed = now.toISOString();
        singleTextSession.reviewedIds.push(v.id);
      }
      
      localStorage.setItem('verses', JSON.stringify(verses));
    }
    
    renderSingleTextReview();
    learnInput.disabled = true;
    
    // Advance to next verse
    setTimeout(() => {
      singleTextSession.currentIndex++;
      singleTextSession.input = '';
      learnInput.value = '';
      
      if (singleTextSession.currentIndex < singleTextSession.verses.length) {
        renderSingleTextReview();
        learnInput.disabled = false;
        learnInput.focus();
      } else {
        // Session complete
        singleTextSession.endTime = new Date();
        const reviewedCount = singleTextSession.reviewedIds.length;
        
        const msg = reviewedCount > 0
          ? `Congratulations! You have successfully reviewed ${reviewedCount} verses!`
          : 'Review session complete.';
        
        showModal(msg, () => {
          reviewBtn.click(); // Return to Review panel
        });
      }
    }, 1500);
  }
}
```

## Helper Functions

### Hide Review Mode Controls
```javascript
function hideReviewModeControls() {
  // Hide the "Learn Mode" label and difficulty buttons during review
  if (learnModeLabel) learnModeLabel.style.display = 'none';
  if (difficultyControls) difficultyControls.style.display = 'none';
}
```

### Sort Functions
```javascript
function sortByDueDate(verses) {
  return [...verses].sort((a, b) => {
    const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
    const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
    return dateA - dateB;
  });
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

## UI Requirements

### Review Panel Elements
- **Review Due Verses button** - Reviews all due verses
- **Collections dropdown** - Select collection to review
- **Review Collection button** - Reviews learned verses in collection
- **Verse checkboxes** - Select individual verses to review
- **Review Selected button** - Reviews checked verses
- **Change Interval button** - Change review intervals for selected verses

### Modals Required
1. **Review Mode Modal** - Choose Individual vs Single-Text
2. **Review Order Modal** - Choose Biblical/Due Date/Random order

### CSS Classes for Single-Text
```css
.verse-character {
  font-size: inherit;
  transition: color 0.1s, background 0.1s;
}

.verse-character.correct {
  color: var(--text-color);
  background: transparent;
}

.verse-character.incorrect {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.verse-character.hidden {
  color: transparent;
  user-select: none;
}

.completed-verse {
  margin-bottom: 0.5rem;
  line-height: 1.8;
}

.current-verse-chars {
  line-height: 1.8;
}

.reference-inline {
  color: #888;
  font-size: 0.9em;
  margin-right: 0.5em;
}
```

## Key Behaviors

1. **Review always uses Advanced stage** - No Basic/Intermediate options
2. **Mode controls hidden during review** - Clean interface
3. **Verse selector disabled during review** - Prevents manual navigation
4. **Single-text always uses Biblical order** - Ensures coherent passage
5. **Individual review can choose order** - Biblical/Due Date/Random
6. **Both modes update spaced repetition data** - Success/failure recorded
7. **Completion shows congratulations modal** - Returns to Review panel
8. **Single verse review starts immediately** - No modals needed

## Translation Keys Needed

```javascript
// Already in translations
review_mode: "Review Mode"
review_due_verses: "Review Due Verses"
review_collection_learned: "Review Collection (learned only)"
review_verses: "Review verses"
choose_review_mode: "Choose Review Mode"
review_individually: "Review verses individually"
review_single_text: "Review as a single text"
choose_review_order: "Choose Review Order"
order_biblical: "Biblical Order"
order_due_date: "By Due Date"
order_random: "Random Order"
no_learned_verses: "No learned verses to review"
no_learned_verses_collection: "No learned verses in this collection"
select_verse_to_review: "Please select at least one verse to review"
select_collection_to_review: "Please select a collection to review"
congratulations_reviewed_count: "Congratulations! You have successfully reviewed {count} verses!"
accuracy: "Accuracy"
incorrect_input: "Incorrect input for \"{char}\" (position {pos}). Expected \"{expected}\"."
```
