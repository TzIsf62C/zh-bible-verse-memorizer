window.onload = function () {
  // DOM Elements
  const addVerseBtn = document.getElementById('addVerseBtn');
  const learnBtn = document.getElementById('learnBtn');
  const reviewBtn = document.getElementById('reviewBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const collectionsBtn = document.getElementById('collectionsBtn');
  const collectionsPanel = document.getElementById('collectionsPanel');
  const addVersePanel = document.getElementById('addVersePanel');
  const learnPanel = document.getElementById('learnPanel');
  const reviewPanel = document.getElementById('reviewPanel');
  const exportImportPanel = document.getElementById('exportImportPanel');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const saveVerseBtn = document.getElementById('saveVerseBtn');
  let originalVerseValues = null; // Track original values when editing
  let activeNavButton = null; // Track which navigation button is currently active
  const clearFormBtn = document.getElementById('clearFormBtn');
  const saveStatus = document.getElementById('saveStatus');
  const verseSelector = document.getElementById('verseSelector');
  const learnHelperText = document.getElementById('learnHelperText');
  const learnVerseDisplay = document.getElementById('learnVerseDisplay');
  const learnInput = document.getElementById('learnInput');
  const learnFeedback = document.getElementById('learnFeedback');
  const learnNextBtn = document.getElementById('learnNextBtn');
  const learnRetryBtn = document.getElementById('learnRetryBtn');
  const startReviewBtn = document.getElementById('startReviewBtn');
  const reviewDueBtn = document.getElementById('reviewDueBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFile = document.getElementById('importFile');
  const importFileName = document.getElementById('importFileName');
  const exportCollectionsSelect = document.getElementById('exportCollectionsSelect');
  const exportIncludeReview = document.getElementById('exportIncludeReview');
  const importIncludeReview = document.getElementById('importIncludeReview');
  const exportIncludeCollections = document.getElementById('exportIncludeCollections');
  const importIncludeCollections = document.getElementById('importIncludeCollections');
  const progressDisplay = document.getElementById('progressDisplay');
  const basicMode = document.getElementById('basicMode');
  const intermediateMode = document.getElementById('intermediateMode');
  const advancedMode = document.getElementById('advancedMode');
  const learnModeLabel = document.getElementById('learnModeLabel'); // Label to hide during review
  const difficultyControls = document.getElementById('difficultyControls'); // Buttons to show during practice mode
  
  // Helper function to hide both label and difficulty buttons during review
  function hideReviewModeControls() {
    if (learnModeLabel) learnModeLabel.style.display = 'none';
    if (difficultyControls) difficultyControls.style.display = 'none';
  }
  
  // Collections DOM
  const newCollectionTitle = document.getElementById('newCollectionTitle');
  const createCollectionBtn = document.getElementById('createCollectionBtn');
  const collectionsList = document.getElementById('collectionsList');
  const collectionDetail = document.getElementById('collectionDetail');
  const collectionDetailTitle = document.getElementById('collectionDetailTitle');
  const addVerseToCollection = document.getElementById('addVerseToCollection');
  const addToCollectionBtn = document.getElementById('addToCollectionBtn');
  const collectionVerses = document.getElementById('collectionVerses');
  const reviewCollectionsList = document.getElementById('reviewCollectionsList');
  const reviewCollectionBtn = document.getElementById('reviewCollectionBtn');
  const addToCollectionSelect = document.getElementById('addToCollectionSelect');
  const addVerseList = document.getElementById('addVerseList');
  const reviewVerseList = document.getElementById('reviewVerseList');
  const bulkActions = document.getElementById('bulkActions');
  const bulkAddToCollectionBtn = document.getElementById('bulkAddToCollectionBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const bulkAddModal = document.getElementById('bulkAddModal');
  const bulkAddCollectionSelect = document.getElementById('bulkAddCollectionSelect');
  const bulkCreateNew = document.getElementById('bulkCreateNew');
  const bulkNewCollectionName = document.getElementById('bulkNewCollectionName');
  const bulkAddConfirmBtn = document.getElementById('bulkAddConfirmBtn');
  const bulkAddCancelBtn = document.getElementById('bulkAddCancelBtn');
  // Change Interval Modal
  const changeIntervalBtn = document.getElementById('changeIntervalBtn');
  const changeIntervalModal = document.getElementById('changeIntervalModal');
  const intervalUpBtn = document.getElementById('intervalUpBtn');
  const intervalDownBtn = document.getElementById('intervalDownBtn');
  const intervalValue = document.getElementById('intervalValue');
  const intervalDaysDisplay = document.getElementById('intervalDaysDisplay');
  const intervalConfirmBtn = document.getElementById('intervalConfirmBtn');
  const intervalCancelBtn = document.getElementById('intervalCancelBtn');
  let currentInterval = 1;
  // Backup Reminder Modal
  const backupReminderModal = document.getElementById('backupReminderModal');
  const backupReminderGotItBtn = document.getElementById('backupReminderGotItBtn');
  const backupReminderExportBtn = document.getElementById('backupReminderExportBtn');
  const backupReminderToggle = document.getElementById('backupReminderToggle');

  // Tutorial Modals
  const tutorialIntroModal = document.getElementById('tutorialIntroModal');
  const tutorialBasicModal = document.getElementById('tutorialBasicModal');
  const tutorialIntermediateModal = document.getElementById('tutorialIntermediateModal');
  const tutorialAdvancedModal = document.getElementById('tutorialAdvancedModal');
  const tutorialIntroStart = document.getElementById('tutorialIntroStart');
  const tutorialIntroSkip = document.getElementById('tutorialIntroSkip');
  const tutorialBasicContinue = document.getElementById('tutorialBasicContinue');
  const tutorialIntermediateContinue = document.getElementById('tutorialIntermediateContinue');
  const tutorialAdvancedBegin = document.getElementById('tutorialAdvancedBegin');

  // Physical keyboard mappings for onscreen keyboards
  const zhuyinKeyMap = {
    '1': 'ㄅ', '2': 'ㄉ', '3': 'ˇ', '4': 'ˋ', '5': 'ㄓ', '6': 'ˊ', '7': '˙', '8': 'ㄚ', '9': 'ㄞ', '0': 'ㄢ', '-': 'ㄦ',
    'q': 'ㄆ', 'w': 'ㄊ', 'e': 'ㄍ', 'r': 'ㄐ', 't': 'ㄔ', 'y': 'ㄗ', 'u': 'ㄧ', 'i': 'ㄛ', 'o': 'ㄟ', 'p': 'ㄣ',
    'a': 'ㄇ', 's': 'ㄋ', 'd': 'ㄎ', 'f': 'ㄑ', 'g': 'ㄕ', 'h': 'ㄘ', 'j': 'ㄨ', 'k': 'ㄜ', 'l': 'ㄠ', ';': 'ㄤ',
    'z': 'ㄈ', 'x': 'ㄌ', 'c': 'ㄏ', 'v': 'ㄒ', 'b': 'ㄖ', 'n': 'ㄙ', 'm': 'ㄩ', ',': 'ㄝ', '.': 'ㄡ', '/': 'ㄥ'
  };

  const cangjieKeyMap = {
    'q': '手', 'w': '田', 'e': '水', 'r': '口', 't': '廿', 'y': '卜', 'u': '山', 'i': '戈', 'o': '人', 'p': '心',
    'a': '日', 's': '尸', 'd': '木', 'f': '火', 'g': '土', 'h': '竹', 'j': '十', 'k': '大', 'l': '中',
    'z': '重', 'x': '難', 'c': '金', 'v': '女', 'b': '月', 'n': '弓', 'm': '一'
  };
  // Onscreen Keyboards
  const zhuyinKeyboard = document.getElementById('zhuyinKeyboard');
  const cangjieKeyboard = document.getElementById('cangjieKeyboard');
  const pinyinKeyboard = document.getElementById('pinyinKeyboard');
  const numericKeyboard = document.getElementById('numericKeyboard');
  const verseInitials = document.getElementById('verseInitials');
  const bookInitials = document.getElementById('bookInitials');
  const bibleVersion = document.getElementById('bibleVersion');
  const defaultBibleVersion = document.getElementById('defaultBibleVersion');
  let activeInput = null;
  let hiddenElements = []; // Track hidden elements to restore later
  
  // Onscreen Keyboard Functions
  function hideAllKeyboards() {
    zhuyinKeyboard.style.display = 'none';
    cangjieKeyboard.style.display = 'none';
    pinyinKeyboard.style.display = 'none';
    numericKeyboard.style.display = 'none';
    
    // Restore all hidden elements
    hiddenElements.forEach(el => {
      el.style.display = el.dataset.originalDisplay || '';
      delete el.dataset.originalDisplay;
    });
    hiddenElements = [];
    
    if (activeInput) {
      activeInput.readOnly = false;
    }
    activeInput = null;
  }

  function showZhuyinKeyboard() {
    hideAllKeyboards();
    zhuyinKeyboard.style.display = 'block';
  }

  function showCangjieKeyboard() {
    hideAllKeyboards();
    cangjieKeyboard.style.display = 'block';
  }

  function showPinyinKeyboard() {
    hideAllKeyboards();
    pinyinKeyboard.style.display = 'block';
  }

  function showNumericKeyboard() {
    hideAllKeyboards();
    numericKeyboard.style.display = 'block';
  }

  function hideElementsBetweenInputAndKeyboard(input, keyboard) {
    // Clear any previously hidden elements
    hiddenElements.forEach(el => {
      el.style.display = el.dataset.originalDisplay || '';
      delete el.dataset.originalDisplay;
    });
    hiddenElements = [];
    
    // Get all siblings after the input's parent container
    let currentElement = input;
    
    // Navigate up to find the containing panel or major section
    while (currentElement && !currentElement.classList.contains('panel')) {
      currentElement = currentElement.parentElement;
    }
    
    if (!currentElement) return;
    
    // Hide all direct children of the panel that come after the input
    let foundInput = false;
    const children = Array.from(currentElement.children);
    
    for (let child of children) {
      // Check if this element or its descendants contain the input
      if (child.contains(input) || child === input) {
        foundInput = true;
        continue;
      }
      
      // Hide elements that come after the input
      if (foundInput && child !== keyboard && !child.classList.contains('onscreen-keyboard')) {
        child.dataset.originalDisplay = child.style.display || '';
        child.style.display = 'none';
        hiddenElements.push(child);
      }
    }
  }

  function showKeyboardForInput(input, forceKeyboardType) {
    const method = forceKeyboardType || localStorage.getItem('inputMethod') || 'pinyin';
    if (input.id === 'bookNameInput' || input.id === 'newCollectionTitle' || input.id === 'verseText' || input.id === 'bibleVersion' || input.id === 'defaultBibleVersion') {
      hideAllKeyboards();
      input.readOnly = false;
      return;
    }
    
    // Helper function to scroll content when learnInput is focused
    function scrollToLearnContent() {
      if (input.id === 'learnInput') {
        setTimeout(() => {
          const progressDisplay = document.getElementById('progressDisplay');
          if (progressDisplay) {
            // Scroll progressDisplay to the center/bottom of viewport so it's visible above keyboard
            progressDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300); // Delay to allow keyboard animation
      }
    }
    if (method === 'numeric' || input.type === 'number' || input.id === 'chapterNumber' || input.id === 'verseNumber') {
      showNumericKeyboard();
      activeInput = input;
      input.readOnly = (input.id === 'learnInput');
      
      // Ensure cursor is at the end for non-readonly inputs (but not for number type which doesn't support selection)
      if (!input.readOnly && input.type !== 'number') {
        setTimeout(() => {
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }, 0);
      }
      
      // Hide backspace and enter buttons for learnInput
      const backspaceButtons = document.querySelectorAll('.onscreen-keyboard .backspace');
      const enterButtons = document.querySelectorAll('.onscreen-keyboard .enter');
      backspaceButtons.forEach(btn => {
        if (input.id === 'learnInput') {
          btn.style.display = 'none';
        } else {
          btn.style.display = '';
        }
      });
      enterButtons.forEach(btn => {
        if (input.id === 'learnInput') {
          btn.style.display = 'none';
        } else {
          btn.style.display = '';
        }
      });
      
      hideElementsBetweenInputAndKeyboard(input, numericKeyboard);
      scrollToLearnContent();
      return;
    }
    if (method === 'pinyin') {
      // Show pinyin keyboard for verseInitials, bookInitials, and learnInput
      if (input.id === 'verseInitials' || input.id === 'bookInitials' || input.id === 'learnInput') {
        showPinyinKeyboard();
        activeInput = input;
        input.readOnly = (input.id === 'learnInput');
        
        // Hide backspace and enter buttons for learnInput
        const backspaceButtons = document.querySelectorAll('.onscreen-keyboard .backspace');
        const enterButtons = document.querySelectorAll('.onscreen-keyboard .enter');
        backspaceButtons.forEach(btn => {
          if (input.id === 'learnInput') {
            btn.style.display = 'none';
          } else {
            btn.style.display = '';
          }
        });
        enterButtons.forEach(btn => {
          if (input.id === 'learnInput') {
            btn.style.display = 'none';
          } else {
            btn.style.display = '';
          }
        });
        
        hideElementsBetweenInputAndKeyboard(input, pinyinKeyboard);
        scrollToLearnContent();
        return;
      }
      hideAllKeyboards();
      input.readOnly = false;
      return;
    }
    // Zhuyin or Cangjie
    let keyboard;
    if (method === 'zhuyin') {
      showZhuyinKeyboard();
      keyboard = zhuyinKeyboard;
    } else if (method === 'cangjie') {
      showCangjieKeyboard();
      keyboard = cangjieKeyboard;
    }
    
    activeInput = input;
    // Only make learnInput read-only for all keyboards
    // For verseInitials and bookInitials, the inputmode="none" in HTML prevents native keyboard
    input.readOnly = (input.id === 'learnInput');
    
    // Hide backspace and enter buttons if this is learn input
    const backspaceButtons = document.querySelectorAll('.onscreen-keyboard .backspace');
    const enterButtons = document.querySelectorAll('.onscreen-keyboard .enter');
    backspaceButtons.forEach(btn => {
      if (input.id === 'learnInput') {
        btn.style.display = 'none';
      } else {
        btn.style.display = '';
      }
    });
    enterButtons.forEach(btn => {
      if (input.id === 'learnInput') {
        btn.style.display = 'none';
      } else {
        btn.style.display = '';
      }
    });
    
    if (keyboard) {
      hideElementsBetweenInputAndKeyboard(input, keyboard);
      scrollToLearnContent();
    }
  }

  // Keyboard Event Listeners
  function handleKeyboardClick(e, keyboard) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.classList.contains('key') && !e.target.classList.contains('unused')) {
      const value = e.target.textContent.trim();
      if (activeInput) {
        if (value === 'Backspace' || value === '⌫') {
          // Don't allow backspace in learn/review mode
          if (activeInput.id === 'learnInput') {
            return;
          }
          // Delete character before cursor or from end
          const start = activeInput.selectionStart || 0;
          const end = activeInput.selectionEnd || 0;
          if (start !== end) {
            // Delete selection
            activeInput.value = activeInput.value.slice(0, start) + activeInput.value.slice(end);
            setTimeout(() => {
              activeInput.focus();
              activeInput.setSelectionRange(start, start);
            }, 0);
          } else if (start > 0) {
            // Delete character before cursor
            activeInput.value = activeInput.value.slice(0, start - 1) + activeInput.value.slice(start);
            setTimeout(() => {
              activeInput.focus();
              activeInput.setSelectionRange(start - 1, start - 1);
            }, 0);
          }
          // Trigger input event
          activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (value === 'Space') {
          if (activeInput.id === 'learnInput') {
            // Append for learnInput
            activeInput.value = activeInput.value + ' ';
            activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
          } else {
            // Insert at cursor for other inputs
            const start = activeInput.selectionStart;
            activeInput.value = activeInput.value.slice(0, start) + ' ' + activeInput.value.slice(start);
            activeInput.setSelectionRange(start + 1, start + 1);
          }
          // Trigger input event
          activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (value === 'Enter' || value === '✔') {
          activeInput.blur();
          hideAllKeyboards();
        } else {
          if (activeInput.id === 'learnInput') {
            // Always append at the end for learnInput (left-to-right input)
            activeInput.value = activeInput.value + value;
            activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
          } else {
            // Insert at cursor position for other inputs (including chapter/verse numbers)
            const start = activeInput.selectionStart || 0;
            const end = activeInput.selectionEnd || 0;
            const currentValue = activeInput.value;
            activeInput.value = currentValue.slice(0, start) + value + currentValue.slice(end);
            const newPosition = start + value.length;
            // Force focus and cursor position update
            setTimeout(() => {
              activeInput.focus();
              activeInput.setSelectionRange(newPosition, newPosition);
            }, 0);
          }
          // Trigger input event
          activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  zhuyinKeyboard.addEventListener('click', (e) => handleKeyboardClick(e, zhuyinKeyboard));
  cangjieKeyboard.addEventListener('click', (e) => handleKeyboardClick(e, cangjieKeyboard));
  pinyinKeyboard.addEventListener('click', (e) => handleKeyboardClick(e, pinyinKeyboard));
  numericKeyboard.addEventListener('click', (e) => handleKeyboardClick(e, numericKeyboard));

  // Physical keyboard support
  document.addEventListener('keydown', (e) => {
    // Only handle physical keyboard when an onscreen keyboard is visible and activeInput exists
    if (!activeInput) return;
    
    const zhuyinVisible = zhuyinKeyboard && zhuyinKeyboard.style.display === 'block';
    const cangjieVisible = cangjieKeyboard && cangjieKeyboard.style.display === 'block';
    const pinyinVisible = pinyinKeyboard && pinyinKeyboard.style.display === 'block';
    const numericVisible = numericKeyboard && numericKeyboard.style.display === 'block';
    
    if (!zhuyinVisible && !cangjieVisible && !pinyinVisible && !numericVisible) {
      return; // No onscreen keyboard visible, let browser handle it
    }
    
    let mappedValue = null;
    const key = e.key;
    const keyLower = key.toLowerCase();
    
    // Handle backspace/delete
    if (key === 'Backspace' || key === 'Delete') {
      e.preventDefault();
      // Don't allow backspace in learn/review mode
      if (activeInput.id === 'learnInput') {
        return;
      }
      // Simulate backspace click
      const backspaceBtn = document.querySelector(`#${zhuyinVisible ? 'zhuyinKeyboard' : cangjieVisible ? 'cangjieKeyboard' : pinyinVisible ? 'pinyinKeyboard' : 'numericKeyboard'} .key.backspace`);
      if (backspaceBtn) backspaceBtn.click();
      return;
    }
    
    // Handle enter/return
    if (key === 'Enter') {
      e.preventDefault();
      const enterBtn = document.querySelector(`#${zhuyinVisible ? 'zhuyinKeyboard' : cangjieVisible ? 'cangjieKeyboard' : pinyinVisible ? 'pinyinKeyboard' : 'numericKeyboard'} .key.enter`);
      if (enterBtn) enterBtn.click();
      return;
    }
    
    // Map keys based on which keyboard is visible
    if (zhuyinVisible) {
      // Zhuyin keyboard mapping
      if (zhuyinKeyMap[keyLower] || zhuyinKeyMap[key]) {
        mappedValue = zhuyinKeyMap[keyLower] || zhuyinKeyMap[key];
      }
    } else if (cangjieVisible) {
      // Cangjie keyboard mapping
      if (cangjieKeyMap[keyLower]) {
        mappedValue = cangjieKeyMap[keyLower];
      }
    } else if (pinyinVisible) {
      // Pinyin keyboard - direct a-z mapping
      if (/^[a-z]$/.test(keyLower)) {
        mappedValue = keyLower;
      }
    } else if (numericVisible) {
      // Numeric keyboard - direct 0-9 mapping
      if (/^[0-9]$/.test(key)) {
        mappedValue = key;
      }
    }
    
    // If we have a mapped value, prevent default and insert it
    if (mappedValue) {
      e.preventDefault();
      
      if (activeInput.id === 'learnInput') {
        // Always append at the end for learnInput
        activeInput.value = activeInput.value + mappedValue;
        activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
      } else {
        // Insert at cursor position for other inputs
        const start = activeInput.selectionStart || 0;
        const end = activeInput.selectionEnd || 0;
        const currentValue = activeInput.value;
        activeInput.value = currentValue.slice(0, start) + mappedValue + currentValue.slice(end);
        const newPosition = start + mappedValue.length;
        activeInput.setSelectionRange(newPosition, newPosition);
      }
      
      // Trigger input event
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // --- ENHANCED BOOK DATA FOR PINYIN SEARCH ---
    // THEME MANAGEMENT
    function getSystemTheme() {
      try {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      } catch (e) { return 'dark'; }
    }

    function applyTheme(theme) {
      const t = theme === 'system' ? getSystemTheme() : theme;
      if (t === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        // dark mode: explicitly set to override system preference
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }

    function initTheme() {
      const saved = localStorage.getItem('themePreference');
      const choice = saved || 'system';
      applyTheme(choice);
      // set radio state
      const radios = document.querySelectorAll('input[name="themeOption"]');
      radios.forEach(r => { r.checked = (r.value === choice); });
      // listen to system changes if using system
      try {
        if (!saved || saved === 'system') {
          const mq = window.matchMedia('(prefers-color-scheme: light)');
          mq.addEventListener('change', () => applyTheme('system'));
        }
      } catch (e) { /* ignore */ }
    }

    initTheme();

    // TEXT SIZE MANAGEMENT SYSTEM
    function getDeviceTextSize() {
      // Try to detect if device has enlarged text setting
      // Method 1: Check computed font size on body vs expected default
      try {
        const bodyComputedSize = parseFloat(window.getComputedStyle(document.body).fontSize);
        const expectedDefault = 16; // Our CSS default
        const ratio = bodyComputedSize / expectedDefault;
        
        console.log('Device Text Size Detection:');
        console.log('  Body computed font-size:', bodyComputedSize + 'px');
        console.log('  Expected default:', expectedDefault + 'px');
        console.log('  Ratio:', ratio.toFixed(3));
        
        // If device text is significantly larger (>10% difference), return appropriate scale
        if (ratio >= 1.4) {
          console.log('  → Detected: Extra Large (1.5)');
          return 1.5;
        }
        if (ratio >= 1.15) {
          console.log('  → Detected: Large (1.2)');
          return 1.2;
        }
        console.log('  → Detected: Normal (1.0)');
        return 1.0;
      } catch (e) {
        console.error('Device text size detection failed:', e);
        return 1.0; // Default if detection fails
      }
    }

    function applyTextSize(scale) {
      const scaleValue = parseFloat(scale);
      document.documentElement.style.setProperty('--text-scale', scaleValue);
    }

    function initTextSize() {
      const saved = localStorage.getItem('textSizePreference');
      const choice = saved || '1.0'; // Default to normal size
      
      applyTextSize(choice);
      
      // Set radio state
      const radios = document.querySelectorAll('input[name="textSizeOption"]');
      radios.forEach(r => { r.checked = (r.value === choice); });
    }

    // Initialize text size early so it's applied before onboarding modals display
    initTextSize();

    // LANGUAGE MANAGEMENT SYSTEM
    const TRANSLATIONS = {
      english: {
        app_title: "ZH Bible Verse Memorizer",
        app_title_chinese: "圣经经文背诵",
        language_label: "Language",
        lang_english: "English",
        lang_simplified: "Simplified",
        lang_traditional: "Traditional",
        // Navigation
        settings: "Settings",
        add_verse: "Add Verse",
        learn: "Learn",
        collections: "Collections",
        review: "Review",
        export_import: "Export & Import",
        // Theme
        theme: "Theme",
        theme_system: "System",
        theme_light: "Light",
        theme_dark: "Dark",
        input_method: "Input Method",
        input_pinyin: "Pinyin",
        input_zhuyin: "Zhuyin (注音)",
        input_cangjie: "Cangjie (倉頡)",
        text_size: "Text Size",
        text_size_normal: "Normal (100%)",
        text_size_large: "Large (120%)",
        text_size_extra_large: "Extra Large (150%)",
        view_tutorial: "View Tutorial",
        view_tutorial_description: "View the interactive tutorial explaining the three-stage learning method.",
        book_name_charset: "Character Set for Book Names",
        charset_simplified: "Simplified",
        charset_traditional: "Traditional",
        default_bible_version: "Default Bible Version",
        save_settings: "Save Settings",
        // Add Verse Panel
        add_verse_title: "Add Verse",
        chinese_verse_text: "Chinese Verse Text",
        chinese_book_name: "Chinese Book Name",
        chapter: "Chapter",
        verse: "Verse",
        pinyin_initials_verse: "Pinyin Initials for Verse",
        pinyin_helper: "Type the first letter of each character's pinyin",
        pinyin_initials_book: "Pinyin Initials for Book Name",
        zhuyin_initials_verse: "Zhuyin initials for Verse",
        zhuyin_helper: "Type the first symbol of each character's Zhuyin",
        zhuyin_initials_book: "Zhuyin initials for Book Name",
        cangjie_initials_verse: "Cangjie radicals for Verse",
        cangjie_helper: "Type the first radical of each character's Cangjie",
        cangjie_initials_book: "Cangjie radicals for Book Name",
        bible_version_optional: "Bible version (optional)",
        add_to_collection_optional: "Add to collection (optional)",
        none: "(none)",
        save_verse: "Save Verse",
        update_verse: "Update Verse",
        clear_form: "Clear Form",
        edit: "Edit",
        delete: "Delete",
        add_selected_to_collection: "Add selected to collection",
        delete_selected: "Delete selected",
        // Learn Panel
        learn_mode: "Learn Mode",
        basic: "Basic",
        intermediate: "Intermediate",
        advanced: "Advanced",
        select_verse: "Select Verse",
        sound_off: "Muted",
        sound_on: "On",
        toggle_sound: "Toggle sound",
        vibration_feedback: "Vibration Feedback",
        enable_vibration: "Enable vibration on error",
        vibration_note: "Note: Vibration is only available on Android devices.",
        retry: "Retry",
        next: "Next",
        skip: "Skip",
        finish: "Finish",
        // Review Panel
        review_mode: "Review Mode",
        review_due_verses: "Review Due Verses",
        select_collection: "Select a collection",
        review_collection_learned: "Review Collection (learned only)",
        or_select_individual: "Or select individual verses",
        review_verses: "Review verses",
        change_interval: "Change Review Interval",
        change_interval_title: "Change Review Interval",
        interval_label: "Interval:",
        review_in_days: "Review in {count} Day(s)",
        choose_review_mode: "Choose Review Mode",
        review_individually: "Review verses individually",
        review_single_text: "Review as a single text",
        choose_review_order: "Choose Review Order",
        order_biblical: "Biblical Order",
        order_due_date: "By Due Date",
        order_random: "Random Order",
        // Collections Panel
        collections_title: "Collections",
        new_collection_title: "New Collection Title",
        create_collection: "Create Collection",
        view: "View",
        rename: "Rename",
        add: "Add",
        remove: "Remove",
        // Export/Import Panel
        export_import_title: "Export & Import",
        select_export: "Select what to export",
        all_verses: "All verses",
        not_in_collection: "Not in a collection",
        include_review_data: "Include review data (last reviewed, due dates)",
        include_collection_data: "Include collection data (titles, verse order)",
        import_review_data: "Import review data (last reviewed, due dates)",
        import_collection_data: "Import collection data (titles, verse order)",
        download_data: "Download Data",
        import_data: "Import Data",
        choose_file: "Choose File",
        no_file_selected: "No file selected",
        // Bulk Actions
        confirm: "Confirm",
        cancel: "Cancel",
        choose_collection: "Choose collection",
        new_collection_name: "New collection name",
        // Common
        last_reviewed: "Last reviewed",
        not_reviewed_yet: "Not reviewed yet",
        days_ago: "days ago",
        due_in_days: "Due in {count} days",
        due_in_day: "Due in 1 day",
        due_in_hours: "Due in {count} hours",
        due_in_hour: "Due in 1 hour",
        due_in_minutes: "Due in {count} minutes",
        due_today: "Due today",
        days_overdue: "{count} days overdue",
        day: "day",
        days: "days",
        hour: "hour",
        hours: "hours",
        learned: "learned",
        verses: "verses",
        result: "Result",
        accuracy: "Accuracy",
        incorrect_input: "Incorrect input for \"{char}\" (position {pos}). Expected \"{expected}\".",
        due_count: "{count} due",
        learned_count: "{count} learned",
        // Messages
        no_verses_to_learn: "No new verses to learn.",
        no_learned_verses: "No learned verses to review",
        no_learned_verses_collection: "No learned verses in this collection",
        no_collections: "No collections available",
        select_at_least_one: "Please select at least one verse",
        select_verse_to_review: "Please select at least one verse to review",
        select_collection_to_review: "Please select a collection to review",
        delete_confirmation: "Are you sure you want to delete this verse?",
        delete_collection_confirmation: "Delete this collection?",
        delete_selected_confirmation: "Delete selected verses?",
        delete_count_confirmation: "Delete {count} selected verses?",
        enter_title: "Please enter a title",
        enter_collection_name: "Enter a new collection name",
        select_collection_msg: "Select a collection to add to",
        select_or_create_collection: "Please choose or create a collection",
        collection_not_found: "Collection not found",
        verses_added_to_collection: "Added selected verses to collection",
        completed_all_verses: "Congratulations! You have completed all new verses.",
        select_file_to_import: "Please select a file to import",
        import_successful: "Import successful",
        select_verse_to_change_interval: "Please select at least one verse to change the review interval",
        error_importing: "Error importing file",
        congratulations_mastered: "Congratulations you have mastered this verse!",
        great_job_continue: "Great job! Let's continue with the next verse.",
        great_job_intermediate: "Great job! You can recite it with hints, now let's master it.",
        great_job_basic: "Great job! Now that you're familiar with this verse, try to Memorize it.",
        nice_try: "Nice Try! Aim for greater than 90%",
        congratulations_reviewed: "Congratulations, you have reviewed",
        congratulations_reviewed_count: "Congratulations! You have successfully reviewed {count} verses!",
        fill_all_fields: "Please fill in all fields completely.",
        chapter_verse_numbers: "Chapter and Verse must be numbers.",
        verse_saved: "Verse saved!",
        verse_updated: "Verse updated!",
        reset_review_data_title: "Reset Review Data?",
        reset_review_data_message: "This verse has existing review history. Would you like to reset the review data?",
        yes: "Yes",
        no: "No",
        check_for_updates: "Check for Updates",
        update_description: "Check if a new version of the app is available.",
        check_update_btn: "Check for Updates",
        checking_updates: "Checking...",
        update_available: "Update available! Click to install.",
        update_now: "Update Now",
        no_updates: "You're up to date!",
        update_error: "Unable to check for updates.",
        clear_all_data: "Clear All Data",
        clear_data_warning: "This will permanently delete all verses, collections, and review data from this device.",
        clear_all_data_btn: "Clear All Data",
        clear_data_confirm: "Are you sure you want to clear all data?\n\nThis will permanently delete:\n• All verses\n• All collections\n• All review progress\n• All settings\n\nThis action cannot be undone.",
        backup_reminders: "Backup Reminders",
        enable_backup_reminders: "Enable periodic backup reminders",
        backup_reminder_frequency: "Reminds you to export your data weekly (first month) then monthly",
        backup_reminder_title: "⚠️ Backup Reminder",
        backup_reminder_message: "Your verses and progress are stored locally on this device. If you clear your browser data or uninstall the app, all data will be lost. Please export your data regularly as a backup!",
        backup_reminder_how: "How to backup:",
        backup_reminder_steps: "Go to Export & Import → Download Data → Save the file to a safe location (cloud storage recommended)",
        backup_reminder_got_it: "Got it!",
        backup_reminder_export_now: "Export Now",
        // PWA Installation
        install_app_title: "Install App",
        skip: "Skip",
        continue: "Continue",
        install_ios_safari: "To install this app on your iPhone/iPad:<br><br>1. Tap the <strong>Share</strong> button <span style='font-size: 20px;'>⎋</span> at the bottom of the screen<br>2. Scroll down and tap <strong>Add to Home Screen</strong> <span style='font-size: 20px;'>➕</span><br>3. Tap <strong>Add</strong> in the top right corner<br><br>The app will then work offline and feel like a native app!",
        install_android_chrome: "To install this app on your Android device:<br><br>1. Tap the <strong>menu</strong> button <span style='font-size: 20px;'>⋮</span> in the top right<br>2. Tap <strong>Add to Home screen</strong> or <strong>Install app</strong><br>3. Tap <strong>Add</strong> or <strong>Install</strong><br><br>The app will then work offline and feel like a native app!",
        install_desktop: "To install this app on your computer:<br><br>1. Look for the <strong>install</strong> icon <span style='font-size: 20px;'>⊕</span> in your browser's address bar<br>2. Click it and select <strong>Install</strong><br><br>The app will open in its own window and work offline!",
        install_browser_generic: "To install this app:<br><br>Use your browser's menu to select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.<br><br>Once installed, the app will work offline and feel like a native app!",
        // Learning Mode Tutorial
        tutorial_intro_title: "Learning Method",
        tutorial_intro_desc: "This app uses a three-stage memorization method to help you learn Bible verses:",
        tutorial_intro_basic: "Full text visible",
        tutorial_intro_intermediate: "Every other character hidden",
        tutorial_intro_advanced: "Pure recall with no hints",
        tutorial_start: "Start Tutorial",
        tutorial_basic_title: "Basic Stage",
        tutorial_basic_desc: "The verse text is fully displayed. Type the first key for each character according to your input method.",
        tutorial_basic_note: "Characters will change color as you type.",
        tutorial_intermediate_title: "Intermediate Stage",
        tutorial_intermediate_desc: "Every other character is hidden. Type a key for each character, even the hidden ones. They will appear as you type.",
        tutorial_advanced_title: "Advanced Stage",
        tutorial_advanced_desc: "No text is shown. The characters will appear as you type.",
        tutorial_advanced_complete: "Completing a verse:",
        tutorial_advanced_spaced: "When you achieve 90% or higher accuracy on the Advanced stage, the verse will be marked as learned. The spaced repetition system will then remind you to review your learned verses at optimal intervals.",
        add_verse_tutorial_title: "How to Add Verses",
        add_verse_tutorial_desc1: "Verses are added manually so you can use any Bible translation you prefer. Simply copy and paste the Chinese text into the verse field.",
        add_verse_tutorial_desc2: "For the initials fields, type one key per character using your chosen input method. This creates the answer key you'll be graded against when learning and reviewing verses.",
        add_verse_tutorial_example: "Example: Ephesians 2:8",
        add_verse_tutorial_note: "Each Chinese character gets one key, punctuation is skipped.",
        got_it: "Got it!",
        begin: "Begin"
      },
      simplified: {
        app_title: "ZH Bible Verse Memorizer",
        app_title_chinese: "圣经经文背诵",
        language_label: "Language / 语言",
        lang_english: "English / 英文",
        lang_simplified: "Simplified / 简体",
        lang_traditional: "Traditional / 繁體",
        // Navigation
        settings: "设置",
        add_verse: "添加经文",
        learn: "学习",
        collections: "集合",
        review: "复习",
        export_import: "导出导入",
        // Theme
        theme: "主题",
        theme_system: "系统",
        theme_light: "亮色",
        theme_dark: "暗色",
        input_method: "输入法",
        input_pinyin: "拼音",
        input_zhuyin: "注音",
        input_cangjie: "仓颉",
        text_size: "文字大小",
        text_size_normal: "正常 (100%)",
        text_size_large: "大 (120%)",
        text_size_extra_large: "特大 (150%)",
        view_tutorial: "查看教程",
        view_tutorial_description: "查看交互式教程，了解三阶段学习方法。",
        book_name_charset: "书卷名称字符集",
        charset_simplified: "简体",
        charset_traditional: "繁体",
        default_bible_version: "默认圣经版本",
        save_settings: "Save Settings / 保存设置",
        // Add Verse Panel
        add_verse_title: "添加经文",
        chinese_verse_text: "中文经文",
        chinese_book_name: "中文书名",
        chapter: "章号",
        verse: "节号",
        pinyin_initials_verse: "经文拼音首字母",
        pinyin_helper: "输入每个汉字拼音的首字母",
        pinyin_initials_book: "书名拼音首字母",
        zhuyin_initials_verse: "经文注音首码",
        zhuyin_helper: "输入每个汉字的注音首码",
        zhuyin_initials_book: "书名注音首码",
        cangjie_initials_verse: "经文仓颉字根",
        cangjie_helper: "输入每个汉字的仓颉首字根",
        cangjie_initials_book: "书名仓颉字根",
        bible_version_optional: "圣经版本（可选）",
        add_to_collection_optional: "可选：加入集合",
        none: "无",
        save_verse: "保存经文",
        update_verse: "更新经文",
        clear_form: "清空表单",
        edit: "编辑",
        delete: "删除",
        add_selected_to_collection: "将所选添加到集合",
        delete_selected: "删除所选",
        // Learn Panel
        learn_mode: "学习模式",
        basic: "基础",
        intermediate: "中级",
        advanced: "高级",
        select_verse: "选择经文",
        sound_off: "静音",
        sound_on: "有声音",
        toggle_sound: "切换声音",
        vibration_feedback: "振动反馈",
        enable_vibration: "错误时启用振动",
        vibration_note: "注意：振动功能仅在安卓设备上可用。",
        retry: "重试",
        next: "继续",
        skip: "跳过",
        finish: "完成",
        // Review Panel
        review_mode: "复习模式",
        review_due_verses: "复习到期经文",
        select_collection: "选择一个集合",
        review_collection_learned: "复习集合（仅已学习）",
        or_select_individual: "或选择单个经文",
        review_verses: "开始复习经文",
        change_interval: "更改复习间隔",
        change_interval_title: "更改复习间隔",
        interval_label: "间隔：",
        review_in_days: "{count} 天后复习",
        choose_review_mode: "选择复习方式",
        review_individually: "逐节复习",
        review_single_text: "单段复习",
        choose_review_order: "选择复习顺序",
        order_biblical: "圣经顺序",
        order_due_date: "按到期日期",
        order_random: "随机顺序",
        // Collections Panel
        collections_title: "经文集合",
        new_collection_title: "新集合标题",
        create_collection: "新建集合",
        view: "查看",
        rename: "重命名",
        add: "添加",
        remove: "移除",
        // Export/Import Panel
        export_import_title: "导出导入",
        select_export: "选择要导出的内容",
        all_verses: "所有经文",
        not_in_collection: "未分组",
        include_review_data: "包含复习数据",
        include_collection_data: "包含集合数据",
        import_review_data: "导入复习数据",
        import_collection_data: "导入集合数据",
        download_data: "下载数据",
        import_data: "导入数据",
        choose_file: "选择文件",
        no_file_selected: "未选择文件",
        // Bulk Actions
        confirm: "确定",
        cancel: "取消",
        choose_collection: "选择集合",
        new_collection_name: "新集合名称",
        // Common
        last_reviewed: "上次复习",
        not_reviewed_yet: "尚未复习",
        days_ago: "天前",
        due_in_days: "{count} 天后到期",
        due_in_day: "1 天后到期",
        due_in_hours: "{count} 小时后到期",
        due_in_hour: "1 小时后到期",
        due_in_minutes: "{count} 分钟后到期",
        due_today: "今天到期",
        days_overdue: "{count} 天逾期",
        day: "天",
        days: "天",
        hour: "小时",
        hours: "小时",
        learned: "已学习",
        verses: "节",
        result: "结果",
        accuracy: "正确率",
        incorrect_input: "在\"{char}\"处输入错误（第{pos}个），应该是\"{expected}\"。",
        due_count: "{count} 个待复习",
        learned_count: "{count} 已学习",
        // Messages
        no_verses_to_learn: "您已学习完所有未学习的经文。",
        no_learned_verses: "暂无已学习的经文",
        no_learned_verses_collection: "此集合中没有已学习的经文",
        no_collections: "暂无集合",
        select_at_least_one: "请选择至少一节经文",
        select_verse_to_review: "请选择至少一节经文复习",
        select_collection_to_review: "请选择一个集合进行复习",
        delete_confirmation: "您确定要删除这节经文吗？",
        delete_collection_confirmation: "删除此集合吗？",
        delete_selected_confirmation: "删除所选经文？",
        delete_count_confirmation: "删除所选 {count} 节经文？",
        enter_title: "请输入标题",
        enter_collection_name: "请输入集合名称",
        select_collection_msg: "请选择一个集合",
        select_or_create_collection: "请选择或创建集合",
        collection_not_found: "未找到集合",
        verses_added_to_collection: "已将所选经文添加到集合",
        completed_all_verses: "恭喜！您已完成所有新经文。",
        select_file_to_import: "请选择要导入的文件",
        import_successful: "导入成功",
        select_verse_to_change_interval: "请至少选择一节经文以更改复习间隔",
        error_importing: "导入文件时出错",
        congratulations_mastered: "恭喜，您已掌握此经文！",
        great_job_continue: "做得好！让我们继续复习下一节。",
        great_job_intermediate: "做得好！现在您可以在带提示的情况下朗诵，接下来让我们熟练掌握它。",
        great_job_basic: "做得好！既然您对这节经文已有熟悉，可以尝试背诵它。",
        nice_try: "差一点就成功了！目标是超过90%",
        congratulations_reviewed: "恭喜！你已成功複習了",
        congratulations_reviewed_count: "恭喜！你已成功複習了 {count} 節經文！",
        fill_all_fields: "请输入完整的经文各项内容。",
        chapter_verse_numbers: "章节和节号必须是数字。",
        verse_saved: "经文已保存！",
        verse_updated: "经文已更新！",
        reset_review_data_title: "重置复习数据？",
        reset_review_data_message: "此经文已有复习记录。您想重置复习数据吗？",
        yes: "是",
        no: "否",
        check_for_updates: "检查更新",
        update_description: "检查是否有新版本可用。",
        check_update_btn: "检查更新",
        checking_updates: "正在检查...",
        update_available: "有可用更新！点击安装。",
        update_now: "立即更新",
        no_updates: "已是最新版本！",
        update_error: "无法检查更新。",
        clear_all_data: "清除所有数据",
        clear_data_warning: "这将永久删除此设备上的所有经文、集合和复习数据。",
        clear_all_data_btn: "清除所有数据",
        clear_data_confirm: "您确定要清除所有数据吗？\n\n这将永久删除：\n• 所有经文\n• 所有集合\n• 所有复习进度\n• 所有设置\n\n此操作无法撤消。",
        backup_reminders: "备份提醒",
        enable_backup_reminders: "启用定期备份提醒",
        backup_reminder_frequency: "第一个月每周提醒一次，之后每月提醒一次",
        backup_reminder_title: "⚠️ 备份提醒",
        backup_reminder_message: "您的经文和学习进度存储在此设备上。如果您清除浏览器数据或卸载应用，所有数据都将丢失。请定期导出数据作为备份！",
        backup_reminder_how: "如何备份：",
        backup_reminder_steps: "前往'导出导入' → '下载数据' → 将文件保存到安全位置（建议使用云存储）",
        backup_reminder_got_it: "知道了！",
        backup_reminder_export_now: "立即导出",
        // PWA Installation
        install_app_title: "安装应用",
        skip: "跳过",
        continue: "继续",
        install_ios_safari: "在 iPhone/iPad 上安装此应用：<br><br>1. 点击屏幕底部的<strong>分享</strong>按钮 <span style='font-size: 20px;'>⎋</span><br>2. 向下滚动并点击<strong>添加到主屏幕</strong> <span style='font-size: 20px;'>➕</span><br>3. 点击右上角的<strong>添加</strong><br><br>应用程序将离线工作，感觉就像原生应用！",
        install_android_chrome: "在安卓设备上安装此应用：<br><br>1. 点击右上角的<strong>菜单</strong>按钮 <span style='font-size: 20px;'>⋮</span><br>2. 点击<strong>添加到主屏幕</strong>或<strong>安装应用</strong><br>3. 点击<strong>添加</strong>或<strong>安装</strong><br><br>应用程序将离线工作，感觉就像原生应用！",
        install_desktop: "在电脑上安装此应用：<br><br>1. 在浏览器地址栏中查找<strong>安装</strong>图标 <span style='font-size: 20px;'>⊕</span><br>2. 点击它并选择<strong>安装</strong><br><br>应用程序将在自己的窗口中打开并离线工作！",
        install_browser_generic: "安装此应用：<br><br>使用浏览器菜单选择<strong>添加到主屏幕</strong>或<strong>安装应用</strong>。<br><br>安装后，应用程序将离线工作，感觉就像原生应用！",
        // Learning Mode Tutorial
        tutorial_intro_title: "学习方法",
        tutorial_intro_desc: "此应用使用三阶段记忆法帮助您学习圣经经文：",
        tutorial_intro_basic: "完整文本可见",
        tutorial_intro_intermediate: "每隔一个字符隐藏",
        tutorial_intro_advanced: "纯粹回忆，无提示",
        tutorial_start: "开始教程",
        tutorial_basic_title: "基础阶段",
        tutorial_basic_desc: "经文完全显示。根据您的输入法，为每个字符输入第一个键。",
        tutorial_basic_note: "输入时字符会改变颜色。",
        tutorial_intermediate_title: "中级阶段",
        tutorial_intermediate_desc: "每隔一个字符会被隐藏。为每个字符输入一个键，即使是隐藏的字符。它们会在您输入时出现。",
        tutorial_advanced_title: "高级阶段",
        tutorial_advanced_desc: "不显示任何文本。只有当您输入时，字才会出现。",
        tutorial_advanced_complete: "完成一个经文：",
        tutorial_advanced_spaced: "当您在高级阶段达到90%或更高的准确率时，该经文将被标记为已学习。间隔重复系统将在最佳时间间隔提醒您复习已学习的经文。",
        add_verse_tutorial_title: "如何添加经文",
        add_verse_tutorial_desc1: "经文是手动添加的，所以您可以使用任何您喜欢的圣经译本。只需将中文文本复制并粘贴到经文字段中。",
        add_verse_tutorial_desc2: "对于首字母字段，使用您选择的输入法为每个字符输入一个键。这将创建您在学习和复习经文时将被评分的答案键。",
        add_verse_tutorial_example: "示例：以弗所书 2:8",
        add_verse_tutorial_note: "每个中文字符对应一个键，标点符号会被跳过。",
        got_it: "明白了！",
        begin: "开始"
      },
      traditional: {
        app_title: "ZH Bible Verse Memorizer",
        app_title_chinese: "聖經經文背誦",
        language_label: "Language / 語言",
        lang_english: "English / 英文",
        lang_simplified: "Simplified / 簡體",
        lang_traditional: "Traditional / 繁體",
        // Navigation
        settings: "設置",
        add_verse: "添加經文",
        learn: "學習",
        collections: "集合",
        review: "複習",
        export_import: "導出導入",
        // Theme
        theme: "主題",
        theme_system: "系統",
        theme_light: "亮色",
        theme_dark: "暗色",
        input_method: "輸入法",
        input_pinyin: "拼音",
        input_zhuyin: "注音",
        input_cangjie: "倉頡",
        text_size: "文字大小",
        text_size_normal: "正常 (100%)",
        text_size_large: "大 (120%)",
        text_size_extra_large: "特大 (150%)",
        view_tutorial: "查看教程",
        view_tutorial_description: "查看互動式教程，瞭解三階段學習方法。",
        book_name_charset: "書卷名稱字符集",
        charset_simplified: "簡體",
        charset_traditional: "繁體",
        default_bible_version: "默認聖經版本",
        save_settings: "Save Settings / 保存設置",
        // Add Verse Panel
        add_verse_title: "添加經文",
        chinese_verse_text: "中文經文",
        chinese_book_name: "中文書名",
        chapter: "章號",
        verse: "節號",
        pinyin_initials_verse: "經文拼音首字母",
        pinyin_helper: "輸入每個漢字拼音的首字母",
        pinyin_initials_book: "書名拼音首字母",
        zhuyin_initials_verse: "經文注音首碼",
        zhuyin_helper: "輸入每個漢字的注音首碼",
        zhuyin_initials_book: "書名注音首碼",
        cangjie_initials_verse: "經文倉頡字根",
        cangjie_helper: "輸入每個漢字的倉頡首字根",
        cangjie_initials_book: "書名倉頡字根",
        bible_version_optional: "聖經版本（可選）",
        add_to_collection_optional: "可選：加入集合",
        none: "無",
        save_verse: "保存經文",
        update_verse: "更新經文",
        clear_form: "清空表單",
        edit: "編輯",
        delete: "刪除",
        add_selected_to_collection: "將所選添加到集合",
        delete_selected: "刪除所選",
        // Learn Panel
        learn_mode: "學習模式",
        basic: "基礎",
        intermediate: "中級",
        advanced: "高級",
        select_verse: "選擇經文",
        sound_off: "靜音",
        sound_on: "有聲音",
        toggle_sound: "切換聲音",
        vibration_feedback: "振動回饋",
        enable_vibration: "錯誤時啟用振動",
        vibration_note: "注意：振動功能僅在安卓裝置上可用。",
        retry: "重試",
        next: "繼續",
        skip: "跳過",
        finish: "完成",
        // Review Panel
        review_mode: "複習模式",
        review_due_verses: "複習到期經文",
        select_collection: "選擇一個集合",
        review_collection_learned: "複習集合（僅已學習）",
        or_select_individual: "或選擇單個經文",
        review_verses: "開始複習經文",
        change_interval: "更改複習間隔",
        change_interval_title: "更改複習間隔",
        interval_label: "間隔：",
        review_in_days: "{count} 天後複習",
        choose_review_mode: "選擇複習方式",
        review_individually: "逐節複習",
        review_single_text: "單段複習",
        choose_review_order: "選擇複習順序",
        order_biblical: "聖經順序",
        order_due_date: "按到期日期",
        order_random: "隨機順序",
        // Collections Panel
        collections_title: "經文集合",
        new_collection_title: "新集合標題",
        create_collection: "新建集合",
        view: "查看",
        rename: "重命名",
        add: "添加",
        remove: "移除",
        // Export/Import Panel
        export_import_title: "導出導入",
        select_export: "選擇要導出的內容",
        all_verses: "所有經文",
        not_in_collection: "未分組",
        include_review_data: "包含複習數據",
        include_collection_data: "包含集合數據",
        import_review_data: "導入複習數據",
        import_collection_data: "導入集合數據",
        download_data: "下載數據",
        import_data: "導入數據",
        choose_file: "選擇文件",
        no_file_selected: "未選擇文件",
        // Bulk Actions
        confirm: "確定",
        cancel: "取消",
        choose_collection: "選擇集合",
        new_collection_name: "新集合名稱",
        // Common
        last_reviewed: "上次複習",
        not_reviewed_yet: "尚未複習",
        days_ago: "天前",
        due_in_days: "{count} 天後到期",
        due_in_day: "1 天後到期",
        due_in_hours: "{count} 小時後到期",
        due_in_hour: "1 小時後到期",
        due_in_minutes: "{count} 分鐘後到期",
        due_today: "今天到期",
        days_overdue: "{count} 天逾期",
        day: "天",
        days: "天",
        hour: "小時",
        hours: "小時",
        learned: "已學習",
        verses: "節",
        result: "結果",
        accuracy: "正確率",
        incorrect_input: "在\"{char}\"處輸入錯誤（第{pos}個），應該是\"{expected}\"。",
        due_count: "{count} 個待複習",
        learned_count: "{count} 已學習",
        // Messages
        no_verses_to_learn: "您已學習完所有未學習的經文。",
        no_learned_verses: "暫無已學習的經文",
        no_learned_verses_collection: "此集合中沒有已學習的經文",
        no_collections: "暫無集合",
        select_at_least_one: "請選擇至少一節經文",
        select_verse_to_review: "請選擇至少一節經文複習",
        select_collection_to_review: "請選擇一個集合進行複習",
        delete_confirmation: "您確定要刪除這節經文嗎？",
        delete_collection_confirmation: "刪除此集合嗎？",
        delete_selected_confirmation: "刪除所選經文？",
        delete_count_confirmation: "刪除所選 {count} 節經文？",
        enter_title: "請輸入標題",
        enter_collection_name: "請輸入集合名稱",
        select_collection_msg: "請選擇一個集合",
        select_or_create_collection: "請選擇或創建集合",
        collection_not_found: "未找到集合",
        verses_added_to_collection: "已將所選經文添加到集合",
        completed_all_verses: "恭喜！您已完成所有新經文。",
        select_file_to_import: "請選擇要導入的文件",
        import_successful: "導入成功",
        select_verse_to_change_interval: "請至少選擇一節經文以更改複習間隔",
        error_importing: "導入文件時出錯",
        congratulations_mastered: "恭喜，您已掌握此經文！",
        great_job_continue: "做得好！讓我們繼續複習下一節。",
        great_job_intermediate: "做得好！現在您可以在帶提示的情況下朗誦，接下來讓我們熟練掌握它。",
        great_job_basic: "做得好！既然您對這節經文已有熟悉，可以嘗試背誦它。",
        nice_try: "差一點就成功了！目標是超過90%",
        congratulations_reviewed: "恭喜！你已成功複習了",
        congratulations_reviewed_count: "恭喜！你已成功複習了 {count} 節經文！",
        fill_all_fields: "請輸入完整的經文各項內容。",
        chapter_verse_numbers: "章節和節號必須是數字。",
        verse_saved: "經文已保存！",
        verse_updated: "經文已更新！",
        reset_review_data_title: "重置複習數據？",
        reset_review_data_message: "此經文已有複習記錄。您想重置複習數據嗎？",
        yes: "是",
        no: "否",
        check_for_updates: "檢查更新",
        update_description: "檢查是否有新版本可用。",
        check_update_btn: "檢查更新",
        checking_updates: "正在檢查...",
        update_available: "有可用更新！點擊安裝。",
        update_now: "立即更新",
        no_updates: "已是最新版本！",
        update_error: "無法檢查更新。",
        clear_all_data: "清除所有數據",
        clear_data_warning: "這將永久刪除此設備上的所有經文、集合和複習數據。",
        clear_all_data_btn: "清除所有數據",
        clear_data_confirm: "您確定要清除所有數據嗎？\n\n這將永久刪除：\n• 所有經文\n• 所有集合\n• 所有複習進度\n• 所有設置\n\n此操作無法撤消。",
        backup_reminders: "備份提醒",
        enable_backup_reminders: "啟用定期備份提醒",
        backup_reminder_frequency: "第一個月每週提醒一次，之後每月提醒一次",
        backup_reminder_title: "⚠️ 備份提醒",
        backup_reminder_message: "您的經文和學習進度存儲在此設備上。如果您清除瀏覽器數據或卸載應用，所有數據都將丟失。請定期導出數據作為備份！",
        backup_reminder_how: "如何備份：",
        backup_reminder_steps: "前往'導出導入' → '下載數據' → 將文件保存到安全位置（建議使用雲存儲）",
        backup_reminder_got_it: "知道了！",
        backup_reminder_export_now: "立即導出",
        // PWA Installation
        install_app_title: "安裝應用",
        skip: "跳過",
        continue: "繼續",
        install_ios_safari: "在 iPhone/iPad 上安裝此應用：<br><br>1. 點擊屏幕底部的<strong>分享</strong>按鈕 <span style='font-size: 20px;'>⎋</span><br>2. 向下滾動並點擊<strong>加入主畫面</strong> <span style='font-size: 20px;'>➕</span><br>3. 點擊右上角的<strong>加入</strong><br><br>應用程式將離線工作，感覺就像原生應用！",
        install_android_chrome: "在安卓設備上安裝此應用：<br><br>1. 點擊右上角的<strong>選單</strong>按鈕 <span style='font-size: 20px;'>⋮</span><br>2. 點擊<strong>加到主畫面</strong>或<strong>安裝應用程式</strong><br>3. 點擊<strong>加入</strong>或<strong>安裝</strong><br><br>應用程式將離線工作，感覺就像原生應用！",
        install_desktop: "在電腦上安裝此應用：<br><br>1. 在瀏覽器地址欄中查找<strong>安裝</strong>圖標 <span style='font-size: 20px;'>⊕</span><br>2. 點擊它並選擇<strong>安裝</strong><br><br>應用程式將在自己的窗口中打開並離線工作！",
        install_browser_generic: "安裝此應用：<br><br>使用瀏覽器選單選擇<strong>加到主畫面</strong>或<strong>安裝應用程式</strong>。<br><br>安裝後，應用程式將離線工作，感覺就像原生應用！",
        // Learning Mode Tutorial
        tutorial_intro_title: "學習方法",
        tutorial_intro_desc: "此應用使用三階段記憶法幫助您學習聖經經文：",
        tutorial_intro_basic: "完整文字可見",
        tutorial_intro_intermediate: "每隔一個字元隱藏",
        tutorial_intro_advanced: "純粹回憶，無提示",
        tutorial_start: "開始教程",
        tutorial_basic_title: "基礎階段",
        tutorial_basic_desc: "經文完全顯示。根據您的輸入法，為每個字元輸入第一個鍵。",
        tutorial_basic_note: "輸入時字元會改變顏色。",
        tutorial_intermediate_title: "中級階段",
        tutorial_intermediate_desc: "每隔一個字元會被隱藏。為每個字元輸入一個鍵，即使是隱藏的字元。它們會在您輸入時出現。",
        tutorial_advanced_title: "高級階段",
        tutorial_advanced_desc: "不顯示任何文字，只有當您輸入時，字才會出現。",
        tutorial_advanced_complete: "完成一個經文：",
        tutorial_advanced_spaced: "當您在高級階段達到90%或更高的準確率時，該經文將被標記為已學習。間隔重複系統將在最佳時間間隔提醒您複習已學習的經文。",
        add_verse_tutorial_title: "如何添加經文",
        add_verse_tutorial_desc1: "經文是手動添加的，所以您可以使用任何您喜歡的聖經譯本。只需將中文文本複製並貼上到經文欄位中。",
        add_verse_tutorial_desc2: "對於首字母欄位，使用您選擇的輸入法為每個字元輸入一個鍵。這將創建您在學習和複習經文時將被評分的答案鍵。",
        add_verse_tutorial_example: "示例：以弗所書 2:8",
        add_verse_tutorial_note: "每個中文字元對應一個鍵，標點符號會被跳過。",
        got_it: "明白了！",
        begin: "開始"
      }
    };

    function t(key, lang) {
      const savedLang = lang || localStorage.getItem('languagePreference') || 'english';
      return TRANSLATIONS[savedLang][key] || key;
    }

    function applyLanguage(lang) {
      const savedLang = lang || localStorage.getItem('languagePreference') || 'english';
      
      // Apply title - always English + Chinese, but Chinese changes based on traditional setting
      const h1 = document.querySelector('h1');
      if (h1) {
        const chineseTitle = savedLang === 'traditional' ? 
          TRANSLATIONS.traditional.app_title_chinese : 
          TRANSLATIONS.simplified.app_title_chinese;
        h1.innerHTML = `${TRANSLATIONS[savedLang].app_title}<br>${chineseTitle}`;
      }

      // Apply language setting labels (special handling)
      document.querySelectorAll('[data-i18n-special]').forEach(el => {
        const key = el.getAttribute('data-i18n-special');
        if (savedLang === 'english') {
          el.textContent = TRANSLATIONS.english[key];
        } else {
          el.textContent = TRANSLATIONS[savedLang][key];
        }
      });

      // Apply all other translations (single language)
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Special handling for Review button to preserve badge
        if (el.id === 'reviewBtn') {
          const badge = el.querySelector('#reviewBadge');
          el.textContent = t(key, savedLang);
          if (badge) {
            el.appendChild(badge); // Re-append the badge after setting text
          }
        } else {
          el.textContent = t(key, savedLang);
        }
      });
      
      // Update Add Verse tutorial example based on input method
      updateAddVerseTutorialExample();
    }
    
    function updateAddVerseTutorialExample() {
      const inputMethod = localStorage.getItem('inputMethod') || 'pinyin';
      const labelElement = document.getElementById('addVerseTutorialInputLabel');
      const initialsElement = document.getElementById('addVerseTutorialExampleInitials');
      
      if (!labelElement || !initialsElement) return;
      
      // Ephesians 2:8 verse: 你們得救是本乎恩，也因着信；這並不是出於自己，而是神所賜的；
      // Answer keys from sample files
      
      if (inputMethod === 'pinyin') {
        labelElement.setAttribute('data-i18n', 'pinyin_initials_verse');
        labelElement.textContent = t('pinyin_initials_verse');
        initialsElement.textContent = 'nmdjsbheyyzxzbbscyzjessscd';
      } else if (inputMethod === 'zhuyin') {
        labelElement.setAttribute('data-i18n', 'zhuyin_initials_verse');
        labelElement.textContent = t('zhuyin_initials_verse');
        initialsElement.textContent = 'ㄋㄇㄉㄐㄕㄅㄏㄣㄧㄧㄓㄒㄓㄅㄅㄕㄔㄩㄗㄐㄦㄕㄕㄙㄙㄉ';
      } else if (inputMethod === 'cangjie') {
        labelElement.setAttribute('data-i18n', 'cangjie_initials_verse');
        labelElement.textContent = t('cangjie_initials_verse');
        initialsElement.textContent = '人人竹戈日木竹田心田廿人卜廿一日山卜竹尸一日戈竹月竹';
      }
    }

    function initLanguage() {
      const saved = localStorage.getItem('languagePreference');
      let choice;
      
      if (saved) {
        // Use saved preference
        choice = saved;
      } else {
        // Detect system language on first visit
        const systemLang = navigator.language || navigator.userLanguage;
        
        if (systemLang.startsWith('zh-Hans') || systemLang.startsWith('zh-CN') || systemLang === 'zh-SG') {
          // Simplified Chinese regions
          choice = 'simplified';
        } else if (systemLang.startsWith('zh-Hant') || systemLang.startsWith('zh-TW') || systemLang.startsWith('zh-HK') || systemLang.startsWith('zh-MO')) {
          // Traditional Chinese regions
          choice = 'traditional';
        } else if (systemLang.startsWith('zh')) {
          // Generic Chinese, default to simplified
          choice = 'simplified';
        } else {
          // Default to English for all other languages
          choice = 'english';
        }
      }
      
      applyLanguage(choice);
      const radios = document.querySelectorAll('input[name="languageOption"]');
      radios.forEach(r => { r.checked = (r.value === choice); });
    }

    function updateInputMethodLabels() {
      const inputMethod = localStorage.getItem('inputMethod') || 'pinyin';
      const lang = localStorage.getItem('languagePreference') || 'english';
      
      // Update the three labels based on input method
      const verseInitialsLabel = document.querySelector('label[for="verseInitials"]');
      const verseHelperText = document.querySelector('#verseInitials + .helper-text');
      const bookInitialsLabel = document.querySelector('label[for="bookInitials"]');
      
      if (verseInitialsLabel) {
        verseInitialsLabel.textContent = t(`${inputMethod}_initials_verse`, lang);
      }
      if (verseHelperText) {
        verseHelperText.textContent = t(`${inputMethod}_helper`, lang);
      }
      if (bookInitialsLabel) {
        bookInitialsLabel.textContent = t(`${inputMethod}_initials_book`, lang);
      }
      
      // Update the learn input placeholder with the helper text
      updateLearnInputPlaceholder();
    }
    
    function updateLearnInputPlaceholder() {
      const inputMethod = localStorage.getItem('inputMethod') || 'pinyin';
      const lang = localStorage.getItem('languagePreference') || 'english';
      
      // Set helper text above verse display instead of input placeholder
      if (learnHelperText) {
        learnHelperText.textContent = t(`${inputMethod}_helper`, lang);
      }
    }

    function initInputMethod() {
      const saved = localStorage.getItem('inputMethod');
      const choice = saved || 'pinyin';
      const radios = document.querySelectorAll('input[name="inputMethodOption"]');
      radios.forEach(r => { r.checked = (r.value === choice); });
      updateInputMethodLabels();
    }

    initLanguage();
    initInputMethod();

    // Settings panel handlers
    if (settingsBtn && settingsPanel) {
      settingsBtn.addEventListener('click', () => {
        setActiveNavButton(settingsBtn);
        showPanel(settingsPanel);
        // Load default Bible version from localStorage
        const defaultBibleVersionInput = document.getElementById('defaultBibleVersion');
        if (defaultBibleVersionInput) {
          defaultBibleVersionInput.value = localStorage.getItem('defaultBibleVersion') || '';
        }
        
        // Load language radios
        const languageRadios = document.querySelectorAll('input[name="languageOption"]');
        const savedLanguage = localStorage.getItem('languagePreference') || 'english';
        languageRadios.forEach(r => { r.checked = (r.value === savedLanguage); });
        
        // Load input method radios
        const inputMethodRadios = document.querySelectorAll('input[name="inputMethodOption"]');
        const savedInputMethod = localStorage.getItem('inputMethod') || 'pinyin';
        inputMethodRadios.forEach(r => { r.checked = (r.value === savedInputMethod); });
        
        // Load book name charset radios
        const bookNameCharsetRadios = document.querySelectorAll('input[name="bookNameCharsetOption"]');
        const savedCharset = localStorage.getItem('bookNameCharset') || 'simplified';
        bookNameCharsetRadios.forEach(r => { r.checked = (r.value === savedCharset); });
        
        // Load vibration toggle
        const vibrationToggle = document.getElementById('vibrationToggle');
        if (vibrationToggle) {
          const savedVibration = localStorage.getItem('vibrationEnabled') === 'true';
          vibrationToggle.checked = savedVibration;
        }
        
        // Load backup reminder toggle
        if (backupReminderToggle) {
          const savedBackupReminder = localStorage.getItem('backupReminderEnabled');
          // Default to enabled if not set
          backupReminderToggle.checked = savedBackupReminder === null ? true : savedBackupReminder === 'true';
        }
      });
    }
    
    // Auto-save theme changes
    const themeRadios = document.querySelectorAll('input[name="themeOption"]');
    themeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const themeVal = e.target.value;
        localStorage.setItem('themePreference', themeVal);
        applyTheme(themeVal);
      });
    });
    
    // Auto-save language changes
    const languageRadios = document.querySelectorAll('input[name="languageOption"]');
    languageRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const langVal = e.target.value;
        const previousLang = localStorage.getItem('languagePreference');
        localStorage.setItem('languagePreference', langVal);
        applyLanguage(langVal);
        
        // If language changed, refresh displays (book charset is separate setting)
        if (previousLang !== langVal) {
          loadVersesForEdit();
          loadVersesForReview();
          loadCollectionsForReview();
          populateCollectionSelector();
        }
      });
    });
    
    // Auto-save input method changes
    const inputMethodRadios = document.querySelectorAll('input[name="inputMethodOption"]');
    inputMethodRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const inputMethodVal = e.target.value;
        const previousInputMethod = localStorage.getItem('inputMethod');
        localStorage.setItem('inputMethod', inputMethodVal);
        
        // Update input method labels if input method changed
        if (previousInputMethod !== inputMethodVal) {
          updateInputMethodLabels();
        }
      });
    });
    
    // Auto-save book name charset changes
    const bookNameCharsetRadios = document.querySelectorAll('input[name="bookNameCharsetOption"]');
    bookNameCharsetRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const charsetVal = e.target.value;
        localStorage.setItem('bookNameCharset', charsetVal);
        
        // Rebuild bible books with new charset
        rebuildBibleBooks();
        
        // Refresh displays that use book names
        loadVersesForEdit();
        loadVersesForReview();
        loadCollectionsForReview();
        populateCollectionSelector();
      });
    });
    
    // Auto-save vibration setting
    const vibrationToggle = document.getElementById('vibrationToggle');
    if (vibrationToggle) {
      vibrationToggle.addEventListener('change', (e) => {
        localStorage.setItem('vibrationEnabled', e.target.checked.toString());
        isVibrationEnabled = e.target.checked;
      });
    }
    
    // Auto-save backup reminder setting
    if (backupReminderToggle) {
      backupReminderToggle.addEventListener('change', (e) => {
        localStorage.setItem('backupReminderEnabled', e.target.checked.toString());
      });
    }
    
    // Auto-save text size changes
    const textSizeRadios = document.querySelectorAll('input[name="textSizeOption"]');
    textSizeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const textSizeVal = e.target.value;
        localStorage.setItem('textSizePreference', textSizeVal);
        applyTextSize(textSizeVal);
      });
    });

    // View Tutorial button
    const viewTutorialBtn = document.getElementById('viewTutorialBtn');
    if (viewTutorialBtn) {
      viewTutorialBtn.addEventListener('click', () => {
        showTutorialIntroModal();
      });
    }
    
    // Auto-save default Bible version (on blur/change)
    const defaultBibleVersionInput = document.getElementById('defaultBibleVersion');
    if (defaultBibleVersionInput) {
      defaultBibleVersionInput.addEventListener('blur', (e) => {
        localStorage.setItem('defaultBibleVersion', e.target.value.trim());
      });
      defaultBibleVersionInput.addEventListener('change', (e) => {
        localStorage.setItem('defaultBibleVersion', e.target.value.trim());
      });
    }

    // Check for Updates functionality
    const checkUpdateBtn = document.getElementById('checkUpdateBtn');
    const updateStatus = document.getElementById('updateStatus');
    let waitingWorker = null;

    function showUpdateStatus(message, type = 'info') {
      if (!updateStatus) return;
      updateStatus.textContent = message;
      updateStatus.style.display = 'block';
      updateStatus.style.color = type === 'error' ? '#dc3545' : 
                                  type === 'success' ? '#28a745' : 
                                  'var(--text-secondary)';
    }

    function hideUpdateStatus() {
      if (updateStatus) updateStatus.style.display = 'none';
    }

    async function checkForUpdates(silent = false) {
      console.log('checkForUpdates called, silent:', silent);
      console.log('navigator.serviceWorker:', navigator.serviceWorker);
      console.log('serviceWorker in navigator:', 'serviceWorker' in navigator);
      console.log('window.location:', window.location.href);
      console.log('isSecureContext:', window.isSecureContext);
      
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported in this browser/context');
        if (!silent) {
          const isHttp = window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
          const message = isHttp ? 
            'Service Workers require HTTPS. Please use HTTPS or install as PWA.' : 
            t('update_error');
          showUpdateStatus(message, 'error');
        }
        if (!silent && checkUpdateBtn) {
          checkUpdateBtn.textContent = t('check_update_btn');
          checkUpdateBtn.disabled = false;
        }
        return;
      }

      try {
        if (!silent && checkUpdateBtn) {
          checkUpdateBtn.disabled = true;
          checkUpdateBtn.textContent = t('checking_updates');
        }

        // Wait a moment for service worker to register if page just loaded
        let registration = await navigator.serviceWorker.getRegistration();
        console.log('Service Worker registration (first check):', registration);
        
        if (!registration) {
          console.log('No registration found, waiting and retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          registration = await navigator.serviceWorker.getRegistration();
          console.log('Service Worker registration (after retry):', registration);
        }
        
        if (!registration) {
          console.log('No service worker registration found after retry');
          if (!silent) showUpdateStatus('Service Worker not registered. Try reloading the page.', 'error');
          if (!silent && checkUpdateBtn) {
            checkUpdateBtn.textContent = t('check_update_btn');
            checkUpdateBtn.disabled = false;
          }
          return;
        }

        console.log('Checking for updates...');
        // Check for updates
        await registration.update();
        console.log('Update check complete');

        // Small delay to let the update process settle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if there's a waiting worker
        if (registration.waiting) {
          console.log('Update available (waiting worker found)');
          waitingWorker = registration.waiting;
          if (!silent && checkUpdateBtn) {
            checkUpdateBtn.textContent = t('update_now');
            checkUpdateBtn.disabled = false;
            showUpdateStatus(t('update_available'), 'success');
          }
        } else if (registration.installing) {
          console.log('Update installing...');
          // Wait for installing to become waiting
          registration.installing.addEventListener('statechange', (e) => {
            console.log('Installing worker state changed:', e.target.state);
            if (e.target.state === 'installed') {
              waitingWorker = registration.waiting;
              if (!silent && checkUpdateBtn) {
                checkUpdateBtn.textContent = t('update_now');
                checkUpdateBtn.disabled = false;
                showUpdateStatus(t('update_available'), 'success');
              }
            }
          });
          // Don't reset button yet - wait for state change
          return;
        } else {
          console.log('No updates available - app is up to date');
          if (!silent) {
            showUpdateStatus(t('no_updates'), 'success');
            if (checkUpdateBtn) {
              checkUpdateBtn.textContent = t('check_update_btn');
              checkUpdateBtn.disabled = false;
            }
          }
        }

        // Listen for updatefound events (for future updates)
        if (!registration._updateListenerAdded) {
          registration._updateListenerAdded = true;
          registration.addEventListener('updatefound', () => {
            console.log('Update found event triggered');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('New worker state:', newWorker.state);
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  waitingWorker = newWorker;
                  if (checkUpdateBtn) {
                    checkUpdateBtn.textContent = t('update_now');
                    checkUpdateBtn.disabled = false;
                    showUpdateStatus(t('update_available'), 'success');
                  }
                }
              });
            }
          });
        }

      } catch (error) {
        console.error('Error checking for updates:', error);
        if (!silent) showUpdateStatus(t('update_error'), 'error');
        if (!silent && checkUpdateBtn) {
          checkUpdateBtn.textContent = t('check_update_btn');
          checkUpdateBtn.disabled = false;
        }
      }
    }

    function applyUpdate() {
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        waitingWorker.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            window.location.reload();
          }
        });
      }
    }

    if (checkUpdateBtn) {
      checkUpdateBtn.addEventListener('click', () => {
        if (waitingWorker) {
          applyUpdate();
        } else {
          hideUpdateStatus();
          checkForUpdates(false);
        }
      });
    }

    // Check for updates silently once a week when settings panel is opened
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        const lastUpdateCheck = localStorage.getItem('lastUpdateCheck');
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        if (!lastUpdateCheck || (now - parseInt(lastUpdateCheck)) > oneWeek) {
          localStorage.setItem('lastUpdateCheck', now.toString());
          setTimeout(() => checkForUpdates(true), 1000); // Delay 1s to not interfere with panel loading
        }
      });
    }

    // Listen for controller change (new service worker activated)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control, reload
        window.location.reload();
      });
    }

    // Clear All Data button handler
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        const currentLang = localStorage.getItem('languagePreference') || 'english';
        const confirmMessage = t('clear_data_confirm', currentLang);
        
        if (confirm(confirmMessage)) {
          // Clear all localStorage data
          localStorage.clear();
          
          // Reload the page to reset the app
          window.location.reload();
        }
      });
    }

  // --- BIBLE BOOKS DATA WITH SIMPLIFIED AND TRADITIONAL ---
  const BIBLE_BOOKS_DATA = [
    { simplified: "创世记", traditional: "創世記", pinyin: "chuangshiji", initials: "CSJ", zhuyinInitials: "ㄔㄕㄐ", cangjieInitials: "人心卜" },
    { simplified: "出埃及记", traditional: "出埃及記", pinyin: "chuaiaijiji", initials: "CAJJ", zhuyinInitials: "ㄔㄞㄐㄐ", cangjieInitials: "山土弓卜" },
    { simplified: "利未记", traditional: "利未記", pinyin: "liweiji", initials: "LWJ", zhuyinInitials: "ㄌㄨㄐ", cangjieInitials: "竹十卜" },
    { simplified: "民数记", traditional: "民數記", pinyin: "minshuji", initials: "MSJ", zhuyinInitials: "ㄇㄕㄐ", cangjieInitials: "口中卜" },
    { simplified: "申命记", traditional: "申命記", pinyin: "shenmingji", initials: "SMJ", zhuyinInitials: "ㄕㄇㄐ", cangjieInitials: "中人卜" },
    { simplified: "约书亚记", traditional: "約書亞記", pinyin: "yueshuji", initials: "YSYJ", zhuyinInitials: "ㄩㄕㄧㄐ", cangjieInitials: "女中一卜" },
    { simplified: "士师记", traditional: "士師記", pinyin: "shishiji", initials: "SSJ", zhuyinInitials: "ㄕㄕㄐ", cangjieInitials: "十竹卜" },
    { simplified: "路得记", traditional: "路得記", pinyin: "ludeji", initials: "LDJ", zhuyinInitials: "ㄌㄉㄐ", cangjieInitials: "口竹卜" },
    { simplified: "撒母耳记上", traditional: "撒母耳記上", pinyin: "samuerjishang", initials: "SMEJS", zhuyinInitials: "ㄙㄇㄦㄐㄕ", cangjieInitials: "手田尸卜卜" },
    { simplified: "撒母耳记下", traditional: "撒母耳記下", pinyin: "samuerjixia", initials: "SMEJX", zhuyinInitials: "ㄙㄇㄦㄐㄒ", cangjieInitials: "手田尸卜一" },
    { simplified: "列王纪上", traditional: "列王紀上", pinyin: "liewangjishang", initials: "LWJS", zhuyinInitials: "ㄌㄨㄐㄕ", cangjieInitials: "一一女卜" },
    { simplified: "列王纪下", traditional: "列王紀下", pinyin: "liewangjixia", initials: "LWJX", zhuyinInitials: "ㄌㄨㄐㄒ", cangjieInitials: "一一女一" },
    { simplified: "历代志上", traditional: "歷代志上", pinyin: "lidaizhishang", initials: "LDZS", zhuyinInitials: "ㄌㄉㄓㄕ", cangjieInitials: "一人土卜" },
    { simplified: "历代志下", traditional: "歷代志下", pinyin: "lidaizhixia", initials: "LDZX", zhuyinInitials: "ㄌㄉㄓㄒ", cangjieInitials: "一人土一" },
    { simplified: "以斯拉记", traditional: "以斯拉記", pinyin: "yisilaji", initials: "YSLJ", zhuyinInitials: "ㄧㄙㄌㄐ", cangjieInitials: "女廿手卜" },
    { simplified: "尼希米记", traditional: "尼希米記", pinyin: "niximiji", initials: "NXMJ", zhuyinInitials: "ㄋㄒㄇㄐ", cangjieInitials: "尸大火卜" },
    { simplified: "以斯帖记", traditional: "以斯帖記", pinyin: "yisitiejie", initials: "YSTJ", zhuyinInitials: "ㄧㄙㄊㄐ", cangjieInitials: "女廿中卜" },
    { simplified: "约伯记", traditional: "約伯記", pinyin: "yueboji", initials: "YBJ", zhuyinInitials: "ㄩㄅㄐ", cangjieInitials: "女人卜" },
    { simplified: "诗篇", traditional: "詩篇", pinyin: "shipian", initials: "SP", zhuyinInitials: "ㄕㄆ", cangjieInitials: "卜竹" },
    { simplified: "箴言", traditional: "箴言", pinyin: "zhenyan", initials: "ZY", zhuyinInitials: "ㄓㄧ", cangjieInitials: "竹卜" },
    { simplified: "传道书", traditional: "傳道書", pinyin: "chuandaoshu", initials: "CDS", zhuyinInitials: "ㄔㄉㄕ", cangjieInitials: "人卜中" },
    { simplified: "雅歌", traditional: "雅歌", pinyin: "yage", initials: "YG", zhuyinInitials: "ㄧㄍ", cangjieInitials: "一一" },
    { simplified: "以赛亚书", traditional: "以賽亞書", pinyin: "yisaiyashu", initials: "YSYS", zhuyinInitials: "ㄧㄙㄧㄕ", cangjieInitials: "女十一中" },
    { simplified: "耶利米书", traditional: "耶利米書", pinyin: "yelimishu", initials: "YLMS", zhuyinInitials: "ㄧㄌㄇㄕ", cangjieInitials: "尸竹火中" },
    { simplified: "耶利米哀歌", traditional: "耶利米哀歌", pinyin: "yelimiaige", initials: "YLMAG", zhuyinInitials: "ㄧㄌㄇㄞㄍ", cangjieInitials: "尸竹火卜一" },
    { simplified: "以西结书", traditional: "以西結書", pinyin: "yixiejieshu", initials: "YXJS", zhuyinInitials: "ㄧㄒㄐㄕ", cangjieInitials: "女一女中" },
    { simplified: "但以理书", traditional: "但以理書", pinyin: "danyilishu", initials: "DYLS", zhuyinInitials: "ㄉㄧㄌㄕ", cangjieInitials: "人女一中" },
    { simplified: "何西阿书", traditional: "何西阿書", pinyin: "hexiaoshu", initials: "HXAS", zhuyinInitials: "ㄏㄒㄚㄕ", cangjieInitials: "人一弓中" },
    { simplified: "约珥书", traditional: "約珥書", pinyin: "yuerhushu", initials: "YES", zhuyinInitials: "ㄩㄦㄕ", cangjieInitials: "女一中" },
    { simplified: "阿摩司书", traditional: "阿摩司書", pinyin: "amosishu", initials: "AMSS", zhuyinInitials: "ㄚㄇㄙㄕ", cangjieInitials: "弓戈尸中" },
    { simplified: "俄巴底亚书", traditional: "俄巴底亞書", pinyin: "ebadiyashu", initials: "EBDYS", zhuyinInitials: "ㄜㄅㄉㄧㄕ", cangjieInitials: "人日戈一中" },
    { simplified: "约拿书", traditional: "約拿書", pinyin: "yuonashu", initials: "YNS", zhuyinInitials: "ㄩㄋㄕ", cangjieInitials: "女人中" },
    { simplified: "弥迦书", traditional: "彌迦書", pinyin: "mijiashu", initials: "MJS", zhuyinInitials: "ㄇㄐㄕ", cangjieInitials: "弓卜中" },
    { simplified: "那鸿书", traditional: "那鴻書", pinyin: "nahongshu", initials: "NHS", zhuyinInitials: "ㄋㄏㄕ", cangjieInitials: "尸水中" },
    { simplified: "哈巴谷书", traditional: "哈巴谷書", pinyin: "habagushu", initials: "HBGS", zhuyinInitials: "ㄏㄅㄍㄕ", cangjieInitials: "口日金中" },
    { simplified: "西番雅书", traditional: "西番雅書", pinyin: "xifanyashu", initials: "XFYS", zhuyinInitials: "ㄒㄈㄧㄕ", cangjieInitials: "一竹一中" },
    { simplified: "哈该书", traditional: "哈該書", pinyin: "hagaishu", initials: "HGS", zhuyinInitials: "ㄏㄍㄕ", cangjieInitials: "口卜中" },
    { simplified: "撒迦利亚书", traditional: "撒迦利亞書", pinyin: "sajialiyashu", initials: "SJLYS", zhuyinInitials: "ㄙㄐㄌㄧㄕ", cangjieInitials: "手卜竹一中" },
    { simplified: "玛拉基书", traditional: "瑪拉基書", pinyin: "malajishu", initials: "MLJS", zhuyinInitials: "ㄇㄌㄐㄕ", cangjieInitials: "一手廿中" },
    { simplified: "马太福音", traditional: "馬太福音", pinyin: "mataifuyin", initials: "MTFY", zhuyinInitials: "ㄇㄊㄈㄧ", cangjieInitials: "尸大戈卜" },
    { simplified: "马可福音", traditional: "馬可福音", pinyin: "makefuyin", initials: "MKFY", zhuyinInitials: "ㄇㄎㄈㄧ", cangjieInitials: "尸一戈卜" },
    { simplified: "路加福音", traditional: "路加福音", pinyin: "lujiafuyin", initials: "LJFY", zhuyinInitials: "ㄌㄐㄈㄧ", cangjieInitials: "口大戈卜" },
    { simplified: "约翰福音", traditional: "約翰福音", pinyin: "yuohanfuyin", initials: "YHFY", zhuyinInitials: "ㄩㄏㄈㄧ", cangjieInitials: "女十戈卜" },
    { simplified: "使徒行传", traditional: "使徒行傳", pinyin: "shiduhangzhuan", initials: "STXZ", zhuyinInitials: "ㄕㄊㄒㄔ", cangjieInitials: "人竹竹人" },
    { simplified: "罗马书", traditional: "羅馬書", pinyin: "luomashu", initials: "LMS", zhuyinInitials: "ㄌㄇㄕ", cangjieInitials: "田尸中" },
    { simplified: "哥林多前书", traditional: "哥林多前書", pinyin: "gelinduoqianshu", initials: "GLDQS", zhuyinInitials: "ㄍㄌㄉㄑㄕ", cangjieInitials: "一木弓廿中" },
    { simplified: "哥林多后书", traditional: "哥林多後書", pinyin: "gelinduohoushu", initials: "GLDHS", zhuyinInitials: "ㄍㄌㄉㄏㄕ", cangjieInitials: "一木弓竹中" },
    { simplified: "加拉太书", traditional: "加拉太書", pinyin: "jialataishu", initials: "JLTS", zhuyinInitials: "ㄐㄌㄊㄕ", cangjieInitials: "大手大中" },
    { simplified: "以弗所书", traditional: "以弗所書", pinyin: "yifuosuoshu", initials: "YFSS", zhuyinInitials: "ㄧㄈㄙㄕ", cangjieInitials: "女中竹中" },
    { simplified: "腓立比书", traditional: "腓立比書", pinyin: "feilibishu", initials: "FLBS", zhuyinInitials: "ㄈㄌㄅㄕ", cangjieInitials: "月卜心中" },
    { simplified: "歌罗西书", traditional: "歌羅西書", pinyin: "geluoxishu", initials: "GLXS", zhuyinInitials: "ㄍㄌㄒㄕ", cangjieInitials: "一田一中" },
    { simplified: "帖撒罗尼迦前书", traditional: "帖撒羅尼迦前書", pinyin: "tiesaluonijiaqianshu", initials: "TSLNJQS", zhuyinInitials: "ㄊㄙㄌㄋㄐㄑㄕ", cangjieInitials: "中手田尸卜廿中" },
    { simplified: "帖撒罗尼迦后书", traditional: "帖撒羅尼迦後書", pinyin: "tiesaluonijiahoushu", initials: "TSLNJHS", zhuyinInitials: "ㄊㄙㄌㄋㄐㄏㄕ", cangjieInitials: "中手田尸卜竹中" },
    { simplified: "提摩太前书", traditional: "提摩太前書", pinyin: "timotaiqianshu", initials: "TMTQS", zhuyinInitials: "ㄊㄇㄊㄑㄕ", cangjieInitials: "手戈大廿中" },
    { simplified: "提摩太后书", traditional: "提摩太後書", pinyin: "timotaihoushu", initials: "TMTHS", zhuyinInitials: "ㄊㄇㄊㄏㄕ", cangjieInitials: "手戈大竹中" },
    { simplified: "提多书", traditional: "提多書", pinyin: "tiduoshu", initials: "TDS", zhuyinInitials: "ㄊㄉㄕ", cangjieInitials: "手弓中" },
    { simplified: "腓利门书", traditional: "腓利門書", pinyin: "feilimenshu", initials: "FLMS", zhuyinInitials: "ㄈㄌㄇㄕ", cangjieInitials: "月竹日中" },
    { simplified: "希伯来书", traditional: "希伯來書", pinyin: "xibolaishu", initials: "XBLS", zhuyinInitials: "ㄒㄅㄌㄕ", cangjieInitials: "大人木中" },
    { simplified: "雅各书", traditional: "雅各書", pinyin: "yageshu", initials: "YGS", zhuyinInitials: "ㄧㄍㄕ", cangjieInitials: "一竹中" },
    { simplified: "彼得前书", traditional: "彼得前書", pinyin: "bideqianshu", initials: "BDQS", zhuyinInitials: "ㄅㄉㄑㄕ", cangjieInitials: "竹竹廿中" },
    { simplified: "彼得后书", traditional: "彼得後書", pinyin: "bidehoushu", initials: "BDHS", zhuyinInitials: "ㄅㄉㄏㄕ", cangjieInitials: "竹竹竹中" },
    { simplified: "约翰壹书", traditional: "約翰壹書", pinyin: "yuohanyishu", initials: "YHYS", zhuyinInitials: "ㄩㄏㄧㄕ", cangjieInitials: "女十土中" },
    { simplified: "约翰贰书", traditional: "約翰貳書", pinyin: "yuohanershu", initials: "YHES", zhuyinInitials: "ㄩㄏㄦㄕ", cangjieInitials: "女十戈中" },
    { simplified: "约翰参书", traditional: "約翰參書", pinyin: "yuohansanshu", initials: "YHSS", zhuyinInitials: "ㄩㄏㄘㄕ", cangjieInitials: "女十戈中" },
    { simplified: "犹大书", traditional: "猶大書", pinyin: "youdashu", initials: "YDS", zhuyinInitials: "ㄧㄉㄕ", cangjieInitials: "手大中" },
    { simplified: "启示录", traditional: "啟示錄", pinyin: "qishilu", initials: "QSL", zhuyinInitials: "ㄑㄕㄌ", cangjieInitials: "竹一女" }
  ];
  
  // CHINESE_BIBLE_BOOKS: books display based on bookNameCharset setting
  let CHINESE_BIBLE_BOOKS = BIBLE_BOOKS_DATA.map(b => {
    const charset = localStorage.getItem('bookNameCharset') || 'simplified';
    return {
      hanzi: charset === 'traditional' ? b.traditional : b.simplified,
      pinyin: b.pinyin,
      initials: b.initials,
      zhuyinInitials: b.zhuyinInitials,
      cangjieInitials: b.cangjieInitials
    };
  });

  // Function to rebuild CHINESE_BIBLE_BOOKS when charset setting changes
  function rebuildBibleBooks() {
    const charset = localStorage.getItem('bookNameCharset') || 'simplified';
    CHINESE_BIBLE_BOOKS = BIBLE_BOOKS_DATA.map(b => {
      return {
        hanzi: charset === 'traditional' ? b.traditional : b.simplified,
        pinyin: b.pinyin,
        initials: b.initials,
        zhuyinInitials: b.zhuyinInitials,
        cangjieInitials: b.cangjieInitials
      };
    });
  }

  const bookNameInput = document.getElementById('bookNameInput');
  const bookSuggestions = document.getElementById('bookSuggestions');

  // Helper function to get the order of a book in the Bible
  function getBookOrder(bookName) {
    const index = CHINESE_BIBLE_BOOKS.findIndex(b => b.hanzi === bookName);
    return index !== -1 ? index : 999; // Return 999 for unknown books to sort them last
  }

  // Helper function to sort verses by Bible book order, chapter, and verse
  function sortVersesByBibleOrder(verses) {
    return verses.sort((a, b) => {
      // First compare by book order
      const bookOrderA = getBookOrder(a.bookName);
      const bookOrderB = getBookOrder(b.bookName);
      if (bookOrderA !== bookOrderB) return bookOrderA - bookOrderB;
      
      // Then by chapter number
      const chapterA = parseInt(a.chapterNumber) || 0;
      const chapterB = parseInt(b.chapterNumber) || 0;
      if (chapterA !== chapterB) return chapterA - chapterB;
      
      // Finally by verse number
      const verseA = parseInt(a.verseNumber) || 0;
      const verseB = parseInt(b.verseNumber) || 0;
      return verseA - verseB;
    });
  }

  // Helper function to sort verses by due date (earliest first)
  function sortByDueDate(verses) {
    return verses.sort((a, b) => {
      const dateA = new Date(a.dueDate || 0);
      const dateB = new Date(b.dueDate || 0);
      return dateA - dateB;
    });
  }

  // Helper function to shuffle an array randomly
  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

 // --- NEW: Pinyin Autocomplete Logic ---
    
  // Function to render the suggestions based on input value
  function updateSuggestions() {
    const query = bookNameInput.value.trim().toLowerCase();
    bookSuggestions.innerHTML = ''; // Clear previous suggestions

    let booksToDisplay = [];
    const MAX_FILTERED_RESULTS = 20; // Maximum results when actively typing

    // Condition 1: If the query is empty, show the entire list for browsing.
    if (query.length === 0) {
        // Show ALL books (no limit applied)
        booksToDisplay = CHINESE_BIBLE_BOOKS; 
    } else {
        // Condition 2: If there is a query, filter the list and limit the results.
        booksToDisplay = CHINESE_BIBLE_BOOKS.filter(book => 
            // Match against Hanzi or Pinyin (case-insensitive)
            book.hanzi.includes(query) || book.pinyin.includes(query.replace(/\s/g, ''))
        ).slice(0, MAX_FILTERED_RESULTS); // Apply the limit here
    }
    
    // The list to be rendered is either the full list or the top 20 matches
    const finalBooks = booksToDisplay; 

    if (finalBooks.length > 0) {
        finalBooks.forEach(book => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = book.hanzi;
            item.dataset.bookName = book.hanzi;
            // NEW: Store the initials in a data attribute
            item.dataset.bookInitials = book.initials; 

            // Click handler to select the suggestion
            item.addEventListener('click', () => {
                // 1. Fill the Book Name input
                bookNameInput.value = item.dataset.bookName;
                
                // 2. NEW: Automatically fill the Book Initials input
                const bookInitialsInput = document.getElementById('bookInitials'); // Assumes this is the correct ID
                if (bookInitialsInput) {
                  const method = localStorage.getItem('inputMethod') || 'pinyin';
                  let initials;
                  if (method === 'pinyin') {
                    initials = book.initials;
                  } else if (method === 'zhuyin') {
                    initials = book.zhuyinInitials;
                  } else if (method === 'cangjie') {
                    initials = book.cangjieInitials;
                  }
                  bookInitialsInput.value = initials;
                }

                bookSuggestions.style.display = 'none'; // Hide suggestions after selection
            });
            
            bookSuggestions.appendChild(item);
        });
        bookSuggestions.style.display = 'block';
    } else {
        bookSuggestions.style.display = 'none';
    }
  }

    // Add event listener to the input field
    if (bookNameInput) {
        bookNameInput.addEventListener('input', updateSuggestions);
        
        // Hide suggestions when focus is lost (after a small delay)
        bookNameInput.addEventListener('blur', () => {
            setTimeout(() => {
                bookSuggestions.style.display = 'none';
            }, 200);
        });
        
        // Show suggestions again on focus (THIS IS THE KEY CHANGE)
        bookNameInput.addEventListener('focus', () => {
            // Call updateSuggestions to show the full list (as per the new logic)
            updateSuggestions();
        });
    }
  
  // Learning state
  let editIndex = null;
  let currentVerse = null;
  let userInput = '';
  let learningStage = 'basic'; // 'basic', 'intermediate', 'advanced'
  let learnFullText = '';
  let learnFullInitials = '';
  let reviewVerses = [];
  // Review-mode state: 'individual' | 'singleText' | null
  let reviewCollectionMode = null;
  // For single-text collection review we'll accumulate completed lines here
  let singleTextPrev = [];
  // index of current verse when iterating through reviewVerses in single-text mode
  let singleTextReviewIndex = 0;
  // count of verses successfully reviewed (accuracy > 90%) during current review session
  let reviewSuccessCount = 0;
  // Practice mode flag - when true, user can practice with different difficulties during review
  let reviewPracticeMode = false;
  // Sound / buzzer state
  let audioCtx = null;
  let isMuted = true; // default: muted (no sound)
  let prevUserInputLength = 0;
  // Vibration state
  let isVibrationEnabled = false; // default: vibration off
  
  // Load vibration setting from localStorage on page load
  (function initVibration() {
    const saved = localStorage.getItem('vibrationEnabled');
    if (saved === 'true') {
      isVibrationEnabled = true;
    }
  })();
  // Modal / completion state
  let pendingCompletion = { success: false, accuracy: 0 };
  // Track last displayed error so help text updates when a new error occurs
  let lastErrorIndex = null;
  let lastErrorChar = null;
  // Intermediate stage variant: 'odd' or 'even'. Controls which input-required chars are visible.
  let intermediateVariant = 'odd';

  // Spaced Repetition Algorithm
  // Card data structure: { interval, repetitions, dueDate }
  function spacedRepetitionBinary(card, success, currentDate) {
    if (!success) {
      // Failure: reset repetitions and interval
      card.repetitions = 0;
      card.interval = 1;
    } else {
      // Success: increment repetitions
      card.repetitions += 1;

      // Calculate base interval based on repetitions
      let baseInterval;
      if (card.repetitions === 1) {
        baseInterval = 1;  // after 1st success, review next day
      } else if (card.repetitions === 2) {
        baseInterval = 6;  // after 2nd success, lengthen interval more
      } else {
        // Subsequent successes multiply interval by a constant factor, e.g., 2
        baseInterval = Math.round(card.interval * 2);
      }

      // Apply early review penalty if reviewed before due date
      if (card.dueDate) {
        const dueDate = new Date(card.dueDate);
        const daysSinceDue = (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceDue < 0) {
          // Early review: reduce interval advancement proportionally
          // Formula: actual interval = baseInterval * (days waited / expected interval)
          const previousInterval = card.interval || 1;
          const daysWaited = Math.max(0, previousInterval + daysSinceDue); // days since last review
          const earlyReviewFactor = Math.max(0.5, daysWaited / previousInterval); // minimum 50% credit
          card.interval = Math.round(baseInterval * earlyReviewFactor);
        } else {
          // On-time or overdue review: full interval advancement
          card.interval = baseInterval;
        }
      } else {
        // No previous due date: use full interval (first review after learning)
        card.interval = baseInterval;
      }
    }

    card.dueDate = new Date(currentDate.getTime() + card.interval * 24 * 60 * 60 * 1000);

    return card;
  }

  // Helper: floor-based days/hours/minutes until due
  function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const msPerMinute = 1000 * 60;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const days = Math.floor(diffTime / msPerDay);
    const hours = Math.floor(diffTime / msPerHour);
    const minutes = Math.floor(diffTime / msPerMinute);
    return { days, hours, minutes, milliseconds: diffTime };
  }

  // Helper function to count due verses in a collection
  function countDueVerses(verseIds, verses) {
    const now = new Date();
    return verseIds.filter(vid => {
      const v = verses.find(x => x.id === vid);
      if (!v || !v.lastReviewed) return false;
      if (!v.dueDate) return true; // Consider verses without dueDate as due
      return new Date(v.dueDate) <= now;
    }).length;
  }

  // Function to update review button badge with due count
  function updateReviewBadge() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const learnedVerses = verses.filter(v => v && v.lastReviewed);
    const now = new Date();
    
    const dueCount = learnedVerses.filter(v => {
      if (!v.dueDate) {
        return true; // Consider verses without dueDate as due
      }
      const due = new Date(v.dueDate) <= now;
      return due;
    }).length;
    
    const badge = document.getElementById('reviewBadge');
    const reviewBtn = document.getElementById('reviewBtn');
    
    if (badge && reviewBtn) {
      // Show Review button if there are any learned verses
      if (learnedVerses.length > 0) {
        reviewBtn.style.display = '';
      } else {
        reviewBtn.style.display = 'none';
      }
      
      // Show badge with count if there are due verses
      if (dueCount > 0) {
        badge.textContent = dueCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }


  function loadVersesForEdit() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const sortedVerses = sortVersesByBibleOrder([...verses]);
    const listDiv = addVerseList; // id 'addVerseList'
    listDiv.innerHTML = '';

    sortedVerses.forEach((v, i) => {
      const verseItem = document.createElement('div');
      verseItem.className = 'verse-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'add-verse-checkbox';
      checkbox.dataset.verseId = v.id;

      const verseContent = document.createElement('div');
      verseContent.className = 'verse-content';

      const reference = document.createElement('div');
      reference.className = 'reference';
      reference.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;

      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = v.verseText;

      // collection membership tags
      const cols = getCollections();
      const memberships = cols.filter(c => Array.isArray(c.verseIds) && c.verseIds.includes(v.id));
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'collection-tags';
      memberships.forEach(mc => {
        const span = document.createElement('span');
        span.className = 'collection-tag';
        span.textContent = mc.title;
        tagsDiv.appendChild(span);
      });

      if (v.lastReviewed) {
        const lastReviewed = document.createElement('div');
        lastReviewed.className = 'last-reviewed';
        const days = Math.floor((new Date() - new Date(v.lastReviewed)) / (1000 * 60 * 60 * 24));
        lastReviewed.textContent = `${t('last_reviewed')}: ${days} ${t('days_ago')}`;
        verseContent.appendChild(lastReviewed);
      }

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = t('edit');
      editBtn.addEventListener('click', () => {
        const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        editIndex = allVerses.findIndex(verse => verse.id === v.id);
        document.getElementById('verseText').value = v.verseText;
        document.getElementById('bookNameInput').value = v.bookName;
        document.getElementById('chapterNumber').value = v.chapterNumber;
        document.getElementById('verseNumber').value = v.verseNumber;
        document.getElementById('verseInitials').value = v.verseInitials;
        document.getElementById('bookInitials').value = v.bookInitials;
        document.getElementById('bibleVersion').value = v.bibleVersion || '';
        // Store original values for change detection
        originalVerseValues = {
          verseText: v.verseText,
          bookName: v.bookName,
          chapterNumber: v.chapterNumber,
          verseNumber: v.verseNumber,
          verseInitials: v.verseInitials,
          bookInitials: v.bookInitials,
          bibleVersion: v.bibleVersion || ''
        };
        // If this verse belongs to a collection, pre-select that collection in the add panel select
        const cols = getCollections();
        let found = null;
        cols.forEach(c => { if (c.verseIds && c.verseIds.includes(v.id)) found = c.id; });
        try { if (addToCollectionSelect) addToCollectionSelect.value = found || ''; } catch (e) {}
        showPanel(addVersePanel);
        saveVerseBtn.textContent = t('update_verse');
        // Dim the Update Verse button initially
        saveVerseBtn.classList.add('dimmed');
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '❌';
      deleteBtn.title = t('delete');
      deleteBtn.addEventListener('click', () => {
        if (confirm(t('delete_confirmation'))) {
          const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
          const verseIndex = allVerses.findIndex(verse => verse.id === v.id);
          if (verseIndex !== -1) {
            allVerses.splice(verseIndex, 1);
            localStorage.setItem('verses', JSON.stringify(allVerses));
            loadVersesForEdit();
            updateReviewBadge();
          }
        }
      });

  verseContent.appendChild(reference);
  verseContent.appendChild(text);
  // append bible version (if any)
  if (v.bibleVersion) {
    const version = document.createElement('div');
    version.className = 'bible-version';
    version.textContent = v.bibleVersion;
    version.style.fontSize = '0.9em';
    version.style.color = '#888';
    version.style.fontStyle = 'italic';
    version.style.marginTop = '4px';
    verseContent.appendChild(version);
  }
  // append tags (if any)
  if (tagsDiv && tagsDiv.children.length > 0) verseContent.appendChild(tagsDiv);
      buttonContainer.appendChild(editBtn);
      buttonContainer.appendChild(deleteBtn);
      verseItem.appendChild(checkbox);
      verseItem.appendChild(verseContent);
      verseItem.appendChild(buttonContainer);
      listDiv.appendChild(verseItem);
    });

    // wire checkbox visibility for bulk actions
    const boxes = Array.from(document.querySelectorAll('.add-verse-checkbox'));
    boxes.forEach(b => b.addEventListener('change', () => {
      const any = Array.from(document.querySelectorAll('.add-verse-checkbox:checked')).length > 0;
      if (bulkActions) bulkActions.style.display = any ? 'block' : 'none';
    }));
  }

  function loadCollectionsForReview() {
    const collections = getCollections();
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    
    if (!reviewCollectionsList) return;
    reviewCollectionsList.innerHTML = '';
    
    if (collections.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'verse-item';
      empty.textContent = t('no_collections');
      reviewCollectionsList.appendChild(empty);
      return;
    }
    
    collections.forEach(col => {
      const learnedVerses = (col.verseIds || []).map(id => verses.find(v => v.id === id)).filter(v => v && v.lastReviewed);
      
      const collectionItem = document.createElement('div');
      collectionItem.className = 'review-collection-item';
      
      const header = document.createElement('div');
      header.className = 'review-collection-header';
      
      const expandIcon = document.createElement('span');
      expandIcon.className = 'collection-expand-icon';
      expandIcon.textContent = '▶';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'collection-checkbox';
      checkbox.dataset.collectionId = col.id;
      // Update Review Collection button opacity when selection changes
      checkbox.addEventListener('change', () => {
        updateReviewCollectionButtonOpacity();
      });
      
      const title = document.createElement('span');
      title.className = 'collection-title';
      
      // Calculate number of verses due for review
      const dueCount = countDueVerses(col.verseIds || [], verses);
      title.textContent = `${col.title} (${t('due_count').replace('{count}', dueCount)})`;
      
      const count = document.createElement('span');
      count.className = 'collection-verse-count';
      count.textContent = `(${t('learned_count').replace('{count}', learnedVerses.length)})`;
      
      header.appendChild(expandIcon);
      header.appendChild(checkbox);
      header.appendChild(title);
      header.appendChild(count);
      
      const versesList = document.createElement('div');
      versesList.className = 'collection-verses-list';
      
      learnedVerses.forEach(verse => {
        const verseItem = document.createElement('div');
        verseItem.className = 'collection-verse-item';
        
        const reference = document.createElement('div');
        reference.className = 'verse-ref';
        reference.textContent = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
        
        const lastReviewed = document.createElement('div');
        lastReviewed.className = 'last-reviewed';
        if (verse.lastReviewed) {
          const date = new Date(verse.lastReviewed);
          let reviewText = `${t('last_reviewed')}: ${date.toLocaleDateString()}`;
          
          // Add due date information
          const dueInfo = getDaysUntilDue(verse.dueDate);
          if (dueInfo !== null) {
            if (dueInfo.milliseconds < 0) {
              // Overdue
              if (dueInfo.days <= -2) {
                // More than 24 hours overdue (2+ days)
                const overdueDays = Math.abs(dueInfo.days);
                reviewText += ` <span class="overdue">(${t('days_overdue').replace('{count}', overdueDays)})</span>`;
              } else {
                // Less than 24 hours overdue (0-24 hours) - show as "Due Today"
                reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
              }
            } else if (dueInfo.days >= 1) {
              // Due in 1 or more days (>= 24 hours)
              if (dueInfo.days === 1) {
                reviewText += ` <span class="due-future">(${t('due_in_day')})</span>`;
              } else {
                reviewText += ` <span class="due-future">(${t('due_in_days').replace('{count}', dueInfo.days)})</span>`;
              }
            } else if (dueInfo.hours >= 2) {
              // Due in 2-23 hours
              reviewText += ` <span class="due-soon">(${t('due_in_hours').replace('{count}', dueInfo.hours)})</span>`;
            } else if (dueInfo.hours === 1) {
              // Due in 1 hour (1h to <2h)
              reviewText += ` <span class="due-soon">(${t('due_in_hour')})</span>`;
            } else if (dueInfo.minutes >= 1) {
              // Due in 1-59 minutes
              reviewText += ` <span class="due-soon">(${t('due_in_minutes').replace('{count}', dueInfo.minutes)})</span>`;
            } else {
              // Due now (0 minutes)
              reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
            }
          }
          lastReviewed.innerHTML = reviewText;
        } else {
          lastReviewed.textContent = t('not_reviewed_yet');
        }
        
        verseItem.appendChild(reference);
        verseItem.appendChild(lastReviewed);
        versesList.appendChild(verseItem);
      });
      
      // Toggle expand/collapse on header click (except checkbox)
      header.addEventListener('click', (e) => {
        if (e.target === checkbox) return;
        const isExpanded = versesList.classList.toggle('expanded');
        expandIcon.classList.toggle('expanded', isExpanded);
      });
      
      collectionItem.appendChild(header);
      collectionItem.appendChild(versesList);
      reviewCollectionsList.appendChild(collectionItem);
    });

    // Update the opacity hint on initial render
    updateReviewCollectionButtonOpacity();
  }

  function loadVersesForReview() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const reviewList = reviewVerseList; // id 'reviewVerseList'
    reviewList.innerHTML = '';

    // Only show verses that have been learned (i.e. have lastReviewed)
    let learned = verses.filter(v => v && v.lastReviewed);
    if (!learned || learned.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'verse-item';
      empty.textContent = t('no_learned_verses');
      reviewList.appendChild(empty);
      // Hide Review Due button if no learned verses
      if (reviewDueBtn) reviewDueBtn.style.display = 'none';
      return;
    }

    // Check for due verses and show/hide Review Due button
    const now = new Date();
    const dueVerses = learned.filter(v => {
      if (!v.dueDate) return true; // Consider verses without dueDate as due
      return new Date(v.dueDate) <= now;
    });
    
    if (reviewDueBtn) {
      reviewDueBtn.style.display = dueVerses.length > 0 ? 'block' : 'none';
    }

    // Sort by due date for display in the review list
    learned.sort((a, b) => {
      const now = new Date();
      const aDue = a.dueDate ? new Date(a.dueDate) : now;
      const bDue = b.dueDate ? new Date(b.dueDate) : now;
      
      // Both overdue or both not overdue - sort by due date
      if ((aDue <= now && bDue <= now) || (aDue > now && bDue > now)) {
        return aDue - bDue;
      }
      
      // One is overdue, one is not - overdue comes first
      return aDue <= now ? -1 : 1;
    });

    learned.forEach((verse) => {
      const verseItem = document.createElement('div');
      verseItem.className = 'verse-item';
      
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'verse-checkbox';
  checkbox.dataset.verse = JSON.stringify(verse);
    // Update button opacity states when selection changes
    checkbox.addEventListener('change', () => {
      updateChangeIntervalButtonVisibility();
    });
      
      const content = document.createElement('div');
      content.className = 'verse-content';
      
      const reference = document.createElement('div');
      reference.className = 'reference';
      reference.textContent = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
      
      const lastReviewed = document.createElement('div');
      lastReviewed.className = 'last-reviewed';
      if (verse.lastReviewed) {
        const days = Math.floor((new Date() - new Date(verse.lastReviewed)) / (1000 * 60 * 60 * 24));
        let reviewText = `${t('last_reviewed')}: ${days} ${t('days_ago')}`;
        
        // Add due date information
        const dueInfo = getDaysUntilDue(verse.dueDate);
        if (dueInfo !== null) {
          if (dueInfo.milliseconds < 0) {
            // Overdue
            if (dueInfo.days <= -2) {
              // More than 24 hours overdue (2+ days)
              const overdueDays = Math.abs(dueInfo.days);
              reviewText += ` <span class="overdue">(${t('days_overdue').replace('{count}', overdueDays)})</span>`;
            } else {
              // Less than 24 hours overdue (0-24 hours) - show as "Due Today"
              reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
            }
          } else if (dueInfo.days >= 1) {
            // Due in 1 or more days (>= 24 hours)
            if (dueInfo.days === 1) {
              reviewText += ` <span class="due-future">(${t('due_in_day')})</span>`;
            } else {
              reviewText += ` <span class="due-future">(${t('due_in_days').replace('{count}', dueInfo.days)})</span>`;
            }
          } else if (dueInfo.hours >= 2) {
            // Due in 2-23 hours
            reviewText += ` <span class="due-soon">(${t('due_in_hours').replace('{count}', dueInfo.hours)})</span>`;
          } else if (dueInfo.hours === 1) {
            // Due in 1 hour (1h to <2h)
            reviewText += ` <span class="due-soon">(${t('due_in_hour')})</span>`;
          } else if (dueInfo.minutes >= 1) {
            // Due in 1-59 minutes
            reviewText += ` <span class="due-soon">(${t('due_in_minutes').replace('{count}', dueInfo.minutes)})</span>`;
          } else {
            // Due now (0 minutes)
            reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
          }
        }
        lastReviewed.innerHTML = reviewText;
      } else {
        lastReviewed.textContent = t('not_reviewed_yet');
      }
      
      content.appendChild(reference);
      content.appendChild(lastReviewed);
      verseItem.appendChild(checkbox);
      verseItem.appendChild(content);
      reviewList.appendChild(verseItem);
    });

    // Update button states on initial render
    updateChangeIntervalButtonVisibility();
    
    // Show/hide change interval button based on checkbox selection
    updateChangeIntervalButtonVisibility();
  }
  
  // Show/hide change interval button when checkboxes change
  function updateChangeIntervalButtonVisibility() {
    if (reviewVerseList) {
      const checkboxes = reviewVerseList.querySelectorAll('.verse-checkbox');
      const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
      if (changeIntervalBtn) {
        // Always visible; apply hint opacity when none selected
        if (anyChecked) {
          changeIntervalBtn.classList.remove('btn-disabled-hint');
        } else {
          changeIntervalBtn.classList.add('btn-disabled-hint');
        }
      }
      if (startReviewBtn) {
        if (anyChecked) {
          startReviewBtn.classList.remove('btn-disabled-hint');
        } else {
          startReviewBtn.classList.add('btn-disabled-hint');
        }
      }
    }
  }

  // Update Review Collection button opacity depending on collection checkbox selection
  function updateReviewCollectionButtonOpacity() {
    if (reviewCollectionsList && reviewCollectionBtn) {
      const anyChecked = !!reviewCollectionsList.querySelector('.collection-checkbox:checked');
      if (anyChecked) {
        reviewCollectionBtn.classList.remove('btn-disabled-hint');
      } else {
        reviewCollectionBtn.classList.add('btn-disabled-hint');
      }
    }
  }

  // Collections storage helpers
  function getCollections() {
    return JSON.parse(localStorage.getItem('collections') || '[]');
  }

  function saveCollections(cols) {
    localStorage.setItem('collections', JSON.stringify(cols));
  }

  function renderCollectionsList() {
    const cols = getCollections();
    collectionsList.innerHTML = '';
    cols.forEach((c) => {
      const item = document.createElement('div');
      item.className = 'collection-item';
      const title = document.createElement('div');
      title.textContent = c.title;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const viewBtn = document.createElement('button');
      viewBtn.textContent = t('view');
      viewBtn.addEventListener('click', () => viewCollection(c.id));
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = t('rename');
      editBtn.addEventListener('click', () => {
        const newTitle = prompt(t('new_collection_title'), c.title);
        if (newTitle === null) return;
        const colsAll = getCollections();
        const out = colsAll.map(x => x.id === c.id ? Object.assign({}, x, { title: (newTitle || '').trim() }) : x);
        saveCollections(out);
        renderCollectionsList();
        populateCollectionSelector();
        loadCollectionsForReview();
      });
      const delBtn = document.createElement('button');
      delBtn.textContent = '❌';
      delBtn.title = t('delete');
      delBtn.addEventListener('click', () => {
        if (!confirm(t('delete_confirmation'))) return;
        const updated = cols.filter(x => x.id !== c.id);
        saveCollections(updated);
        renderCollectionsList();
        populateCollectionSelector();
        loadCollectionsForReview();
      });
      actions.appendChild(viewBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      item.appendChild(title);
      item.appendChild(actions);
      collectionsList.appendChild(item);
    });
  }

  function populateCollectionSelector() {
    const cols = getCollections();
    // add-verse panel selector
    if (addToCollectionSelect) {
      addToCollectionSelect.innerHTML = '';
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = t('none');
      addToCollectionSelect.appendChild(empty);
      cols.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.title; addToCollectionSelect.appendChild(opt); });
    }
    // bulk-add modal selector
    if (bulkAddCollectionSelect) {
      bulkAddCollectionSelect.innerHTML = '';
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = t('choose_collection');
      bulkAddCollectionSelect.appendChild(empty);
      cols.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.title; bulkAddCollectionSelect.appendChild(opt); });
      const createOpt = document.createElement('option'); createOpt.value = 'create_new'; createOpt.textContent = t('create_collection');
      bulkAddCollectionSelect.appendChild(createOpt);
    }
  }

  function viewCollection(id) {
    const cols = getCollections();
    const col = cols.find(c => c.id === id);
    if (!col) return;
    collectionDetail.style.display = 'block';
    collectionDetailTitle.textContent = col.title;
    // populate addVerseToCollection select with all verses sorted by Biblical order
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const sortedVerses = sortVersesByBibleOrder(verses);
    addVerseToCollection.innerHTML = '';
    sortedVerses.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
      addVerseToCollection.appendChild(opt);
    });
    // render verses in collection in order
    renderCollectionVerses(col);
  }

  function renderCollectionVerses(col) {
    collectionVerses.innerHTML = '';
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    col.verseIds = col.verseIds || [];
    col.verseIds.forEach((vid, idx) => {
      const v = verses.find(x => x.id === vid);
      const item = document.createElement('div');
      item.className = 'collection-verses-item';
      const left = document.createElement('div');
      left.textContent = v ? `${v.bookName} ${v.chapterNumber}:${v.verseNumber}` : '(missing)';
      const controls = document.createElement('div');
      controls.className = 'collection-controls';
      const up = document.createElement('button'); up.textContent = '↑';
      const down = document.createElement('button'); down.textContent = '↓';
      const remove = document.createElement('button'); remove.textContent = '❌'; remove.title = t('remove');
      up.addEventListener('click', () => { if (idx>0) { [col.verseIds[idx-1], col.verseIds[idx]] = [col.verseIds[idx], col.verseIds[idx-1]]; saveAndRerender(col); } });
      down.addEventListener('click', () => { if (idx < col.verseIds.length-1) { [col.verseIds[idx+1], col.verseIds[idx]] = [col.verseIds[idx], col.verseIds[idx+1]]; saveAndRerender(col); } });
      remove.addEventListener('click', () => { col.verseIds.splice(idx,1); saveAndRerender(col); });
      controls.appendChild(up); controls.appendChild(down); controls.appendChild(remove);
      item.appendChild(left); item.appendChild(controls);
      collectionVerses.appendChild(item);
    });

    function saveAndRerender(updatedCol) {
      const cols = getCollections();
      const out = cols.map(c => c.id === updatedCol.id ? updatedCol : c);
      saveCollections(out);
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
      renderCollectionVerses(updatedCol);
    }
  }

  startReviewBtn.addEventListener('click', () => {
    const selectedVerses = Array.from(document.querySelectorAll('.verse-checkbox:checked'))
      .map(checkbox => JSON.parse(checkbox.dataset.verse));
    
    if (selectedVerses.length === 0) {
      alert(t('select_verse_to_review'));
      return;
    }

    // Show review order modal to let user choose sorting
    const reviewOrderModal = document.getElementById('reviewOrderModal');
    if (reviewOrderModal) {
      reviewOrderModal.classList.add('open');
      reviewOrderModal.setAttribute('aria-hidden', 'false');

      const biblicalBtn = document.getElementById('reviewOrderBiblicalBtn');
      const dueDateBtn = document.getElementById('reviewOrderDueDateBtn');
      const randomBtn = document.getElementById('reviewOrderRandomBtn');

      // Remove previous listeners
      biblicalBtn.onclick = null;
      dueDateBtn.onclick = null;
      randomBtn.onclick = null;

      // Function to start review with chosen order
      function startReviewWithOrder(sortedVerses) {
        reviewOrderModal.classList.remove('open');
        reviewOrderModal.setAttribute('aria-hidden', 'true');

        reviewCollectionMode = 'individual';
        reviewVerses = sortedVerses;
        reviewSuccessCount = 0;
        reviewPracticeMode = false; // Reset practice mode for new review session

        if (verseSelector) {
          verseSelector.innerHTML = '';
          reviewVerses.forEach((v, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
            verseSelector.appendChild(opt);
          });
          try { 
            verseSelector.selectedIndex = 0; 
            verseSelector.style.display = 'block'; 
            verseSelector.style.opacity = '1';
            verseSelector.disabled = true;
          } catch (e) {}
        }

        const verseSelectorLabel = document.getElementById('verseSelectorLabel');
        if (verseSelectorLabel) verseSelectorLabel.style.display = 'none';

        currentVerse = reviewVerses[0];
        singleTextPrev = [];
        singleTextReviewIndex = 0;
        setLearningStage('advanced');
        setActiveNavButton(null);
        showPanel(learnPanel);
        startLearnMode(currentVerse);
        hideReviewModeControls();
      }

      biblicalBtn.onclick = () => startReviewWithOrder(sortVersesByBibleOrder(selectedVerses));
      dueDateBtn.onclick = () => startReviewWithOrder(sortByDueDate(selectedVerses));
      randomBtn.onclick = () => startReviewWithOrder(shuffleArray(selectedVerses));
    }
  });

  // --- INDEPENDENT SINGLE-TEXT REVIEW SYSTEM ---
  let singleTextSession = null;
  function startSingleTextReviewSession(verses) {
    // Record session start time
    singleTextSession = {
      verses: verses,
      startTime: new Date(),
      endTime: null,
      currentIndex: 0,
      reviewedIds: [],
      allSameBookChapter: verses.every(v => v.bookName === verses[0].bookName && v.chapterNumber === verses[0].chapterNumber),
      input: '',
      answerKeys: [],
      displayLines: [],
      helpText: '',
      displayLines: verses.map(v => ({
        refHtml: `${v.bookInitials}${String(v.chapterNumber)}:${String(v.verseNumber)}`,
        text: v.verseText,
        finalHtml: '', // ADD THIS NEW PROPERTY
    })),
    };
    // Build answer keys and display lines
    singleTextSession.answerKeys = verses.map(v => v.verseInitials);
    singleTextSession.displayLines = buildSingleTextDisplayLines(verses, singleTextSession.allSameBookChapter);
    singleTextSession.currentIndex = 0;
    singleTextSession.reviewedIds = [];
    singleTextSession.input = '';
    singleTextSession.helpText = '';
    setActiveNavButton(null);
    showPanel(learnPanel);
    if (verseSelector) verseSelector.style.display = 'none';
    renderSingleTextReview();
    // NEW: Hide the "Learn Mode" title and mode buttons for single-text review
  hideReviewModeControls();
    learnInput.value = '';
    learnInput.disabled = false;
    learnInput.focus();
    learnInput.removeEventListener('input', singleTextInputHandler);
    learnInput.addEventListener('input', singleTextInputHandler);
  }

  function buildSingleTextDisplayLines(verses, allSameBookChapter) {
    // Returns array of {ref, refHtml, text, fullText}
    return verses.map((v, i) => {
      let ref = '';
      let refHtml = '';
      if (i === 0 || !allSameBookChapter) {
        ref = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
        refHtml = `<span class='reference-inline'>${ref}</span>`;
      } else {
        ref = `${v.verseNumber}`;
        refHtml = `<span class='reference-inline'>${ref}</span>`;
      }
      return {
        ref,
        refHtml,
        text: v.verseText,
        fullText: `${ref} ${v.verseText}`
      };
    });
  }

  function renderSingleTextReview() {
    if (!singleTextSession) return;
    const idx = singleTextSession.currentIndex;
    const lines = singleTextSession.displayLines;
    let html = '';
    
    // Show completed lines
    for (let i = 0; i < idx; ++i) {
        const lineText = lines[i].finalHtml || lines[i].text; // USE finalHtml HERE
        html += `<div class='completed-verse'>${lines[i].refHtml} ${lineText}</div>`;
    }
    
    // Show current line with reference in white, verse text as input-required
    if (idx < lines.length) {
        html += `<div class='current-verse-chars'>${lines[idx].refHtml} <span id='singleTextInputDisplay'></span></div>`;
    }
    learnVerseDisplay.innerHTML = html;
    // Show help text (accuracy, etc)
    learnFeedback.textContent = singleTextSession.helpText;
}

function populateBookDatalist() {
    const bookNameDatalist = document.getElementById('bookNamesList');
    if (!bookNameDatalist) return;

    // Clear existing options
    bookNameDatalist.innerHTML = '';

    // Add all book names as options
    CHINESE_BIBLE_BOOKS.forEach(book => {
        const option = document.createElement('option');
        // For a datalist, setting the value is enough. The text will display as the suggestion.
        option.value = book;
        bookNameDatalist.appendChild(option);
    });
}

  function singleTextInputHandler(e) {
    if (!singleTextSession) return;
    const idx = singleTextSession.currentIndex;
    const key = singleTextSession.answerKeys[idx];
    const currentVerseData = singleTextSession.verses[idx];
    const currentVerseText = currentVerseData.verseText;
    
    let input = learnInput.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // --- 1. BUZZER LOGIC (No change needed here) ---
    const prevInput = singleTextSession.input || '';
    const prevLen = prevInput.length;
    singleTextSession.input = input;

    if (input.length > prevLen) {
      for (let j = prevLen; j < input.length; j++) {
        const expected = key[j] ? key[j].toLowerCase() : null;
        const typed = input[j];
        if (expected && typed !== expected) {
          if (typeof isMuted !== 'undefined' && typeof playBuzzer === 'function' && !isMuted) {
            playBuzzer();
          }
          vibrateOnError();
          break;
        }
      }
    }

    // --- 2. CHARACTER-BY-CHARACTER DISPLAY & TIMING LOGIC ---
    let displayHTML = '';
    let inputIndex = 0; // Tracks position in the 'key' (pinyin initials) string

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
            // FIX 1: Changed 'error' to 'incorrect' to match CSS.
            className += ' incorrect'; 
          }
        } else {
          className += ' hidden'; 
        }

        displayHTML += `<span class="${className}">${char}</span>`;
        inputIndex++; 
        
      } else {
        // Punctuation, whitespace, or characters that do not require input.
        
        // FIX 2: Punctuation is revealed only when the total input length
        // is greater than or equal to the total required initials *before* this character.
        // This ensures punctuation appears precisely when the last character before it is typed.
        if (inputIndex <= input.length) { 
            className += ' correct'; 
            displayHTML += `<span class="${className}">${char}</span>`;
        } else {
            // Not yet revealed.
            className += ' hidden'; 
            displayHTML += `<span class="${className}">${char}</span>`;
        }
      }
    }
    
    const inputDisplay = document.getElementById('singleTextInputDisplay');
    if (inputDisplay) inputDisplay.innerHTML = displayHTML;
    // --- NEW: Provide live help/error text during single-text review ---
    // Compute the most recent typing error (if any) and update help text
    try {
      if (singleTextSession) {
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
          if (learnFeedback) {
            learnFeedback.textContent = '';
            learnFeedback.className = '';
          }
        } else {
          // Map the input index back to the corresponding character in the verse text
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

          singleTextSession.helpText = t('incorrect_input')
            .replace('{char}', errorCharacter)
            .replace('{pos}', latestErrorIndex + 1)
            .replace('{expected}', latestErrorChar);
          if (learnFeedback) {
            learnFeedback.textContent = singleTextSession.helpText;
            learnFeedback.className = 'error';
          }
        }
      }
    } catch (e) { /* ignore errors updating live help text */ }
    // --- END CHARACTER-BY-CHARACTER DISPLAY & TIMING LOGIC ---

    // --- 3. SCORING AND COMPLETION LOGIC (Unchanged) ---
    if (input.length === key.length) {
      let correct = 0;
      for (let i = 0; i < key.length; ++i) {
        if (input[i] && input[i].toLowerCase() === key[i].toLowerCase()) correct++;
      }
      const accuracy = key.length > 0 ? (correct / key.length) * 100 : 0;
      singleTextSession.helpText = `${t('accuracy')}: ${accuracy.toFixed(1)}%`;
      renderSingleTextReview();

      // Color the accuracy help text: green for >=90%, red otherwise
      try {
        if (learnFeedback) {
          learnFeedback.className = accuracy >= 90 ? 'success' : 'error';
        }
      } catch (e) { /* ignore */ }
      // **NEW: Save the final colored HTML before advancing.**
        singleTextSession.displayLines[idx].finalHtml = displayHTML;

      // Update spaced repetition data regardless of success/failure
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      const v = singleTextSession.verses[idx];
      const verseIndex = verses.findIndex(x => x.id === v.id);
      if (verseIndex !== -1) {
        const now = new Date();
        
        // Initialize or update spaced repetition data
        if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
        if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
        
        // Apply spaced repetition algorithm (success or failure)
        const success = accuracy >= 90;
        const card = {
          interval: verses[verseIndex].interval,
          repetitions: verses[verseIndex].repetitions,
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
        // Update badge after storing verse completion
        updateReviewBadge();
      }
      
      learnInput.disabled = true;

      setTimeout(() => {
        singleTextSession.currentIndex++;
        singleTextSession.input = '';
        learnInput.value = '';
        
        if (singleTextSession.currentIndex < singleTextSession.verses.length) {
          renderSingleTextReview();
          learnInput.disabled = false;
          learnInput.focus();
        } else {
          singleTextSession.endTime = new Date();
          const reviewedCount = singleTextSession.reviewedIds.length;
          // **NEW: Final display update and persistent message**
            renderSingleTextReview(); // Re-render one last time
            learnInput.disabled = true; // Disable input since session is complete
            // CRITICAL FIX: Remove the event listener when session completes
            learnInput.removeEventListener('input', singleTextInputHandler);
            updateReviewBadge(); // Update badge after single-text review
            alert(t('congratulations_reviewed_count').replace('{count}', reviewedCount));
            learnInput.style.display = 'none';
        }
      }, 500);
    }

}
  // --- END INDEPENDENT SINGLE-TEXT REVIEW SYSTEM ---

  // Replace the reviewCollectionBtn click handler to use a modal for mode selection
  if (typeof reviewCollectionBtn !== 'undefined' && reviewCollectionBtn) {
    reviewCollectionBtn.addEventListener('click', function(e) {
      // Require at least one collection selected
      const anyChecked = !!document.querySelector('.collection-checkbox:checked');
      if (!anyChecked) {
        alert(t('select_collection_to_review'));
        return;
      }
      // Get selected collection from checkbox
      const selectedCheckbox = document.querySelector('.collection-checkbox:checked');
      if (!selectedCheckbox) {
        alert(t('select_collection_to_review'));
        return;
      }
      
      const cid = selectedCheckbox.dataset.collectionId;
      const cols = getCollections();
      const col = cols.find(c => c.id === cid);
      if (!col) return;
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      const list = (col.verseIds || []).map(id => verses.find(v => v.id === id)).filter(Boolean).filter(v => v.lastReviewed);
      if (list.length === 0) {
        alert(t('no_learned_verses_collection'));
        return;
      }

      // Show the review mode selection modal
      const reviewModeModal = document.getElementById('reviewModeModal');
      if (reviewModeModal) {
        reviewModeModal.classList.add('open');
        reviewModeModal.setAttribute('aria-hidden', 'false');

        // Wire up modal buttons (one-time safe)
        const individuallyBtn = document.getElementById('reviewIndividuallyBtn');
        const singleTextBtn = document.getElementById('reviewSingleTextBtn');

        // Remove previous listeners to avoid duplicates
        individuallyBtn.onclick = null;
        singleTextBtn.onclick = null;

        individuallyBtn.onclick = function() {
          reviewModeModal.classList.remove('open');
          reviewModeModal.setAttribute('aria-hidden', 'true');
          
          // Show review order modal
          const reviewOrderModal = document.getElementById('reviewOrderModal');
          if (reviewOrderModal) {
            reviewOrderModal.classList.add('open');
            reviewOrderModal.setAttribute('aria-hidden', 'false');

            const biblicalBtn = document.getElementById('reviewOrderBiblicalBtn');
            const dueDateBtn = document.getElementById('reviewOrderDueDateBtn');
            const randomBtn = document.getElementById('reviewOrderRandomBtn');

            biblicalBtn.onclick = null;
            dueDateBtn.onclick = null;
            randomBtn.onclick = null;

            function startCollectionReview(sortedList) {
              reviewOrderModal.classList.remove('open');
              reviewOrderModal.setAttribute('aria-hidden', 'true');

              reviewCollectionMode = 'individual';
              reviewVerses = sortedList;
              reviewSuccessCount = 0;
              reviewPracticeMode = false; // Reset practice mode for new review session
              
              if (verseSelector) {
                verseSelector.innerHTML = '';
                reviewVerses.forEach((v, idx) => {
                  const opt = document.createElement('option');
                  opt.value = idx;
                  opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
                  verseSelector.appendChild(opt);
                });
                try { 
                  verseSelector.selectedIndex = 0; 
                  verseSelector.style.display = 'block'; 
                  verseSelector.style.opacity = '1';
                  verseSelector.disabled = true;
                } catch (e) {}
              }
              
              const verseSelectorLabel = document.getElementById('verseSelectorLabel');
              if (verseSelectorLabel) verseSelectorLabel.style.display = 'none';
              
              currentVerse = reviewVerses[0];
              singleTextPrev = [];
              singleTextReviewIndex = 0;
              setLearningStage('advanced');
              setActiveNavButton(null);
              showPanel(learnPanel);
              startLearnMode(currentVerse);
              hideReviewModeControls();
            }

            biblicalBtn.onclick = () => startCollectionReview(sortVersesByBibleOrder(list));
            dueDateBtn.onclick = () => startCollectionReview(sortByDueDate(list));
            randomBtn.onclick = () => startCollectionReview(shuffleArray(list));
          }
        };

        singleTextBtn.onclick = function() {
          reviewModeModal.classList.remove('open');
          reviewModeModal.setAttribute('aria-hidden', 'true');
          // Always sort by Biblical order for single-text review
          const sortedList = sortVersesByBibleOrder(list);
          startSingleTextReviewSession(sortedList);
        };
      }
    }, true);
  }

  function clearForm() {
    document.getElementById('verseText').value = '';
    document.getElementById('bookNameInput').value = '';
    document.getElementById('chapterNumber').value = '';
    document.getElementById('verseNumber').value = '';
    document.getElementById('verseInitials').value = '';
    document.getElementById('bookInitials').value = '';
    // Auto-populate Bible version with default value
    document.getElementById('bibleVersion').value = localStorage.getItem('defaultBibleVersion') || '';
    editIndex = null;
    originalVerseValues = null;
    saveVerseBtn.textContent = t('save_verse');
    saveVerseBtn.classList.remove('dimmed');
    saveStatus.textContent = '';
  }

  clearFormBtn.addEventListener('click', clearForm);

  // Detect changes to verse fields when editing
  function checkForVerseChanges() {
    if (!originalVerseValues) return; // Not in edit mode
    
    const currentValues = {
      verseText: document.getElementById('verseText').value,
      bookName: document.getElementById('bookNameInput').value,
      chapterNumber: document.getElementById('chapterNumber').value,
      verseNumber: document.getElementById('verseNumber').value,
      verseInitials: document.getElementById('verseInitials').value,
      bookInitials: document.getElementById('bookInitials').value,
      bibleVersion: document.getElementById('bibleVersion').value
    };
    
    // Check if any field has changed
    const hasChanges = Object.keys(originalVerseValues).some(
      key => originalVerseValues[key] !== currentValues[key]
    );
    
    // Enable/disable button based on changes
    if (hasChanges) {
      saveVerseBtn.classList.remove('dimmed');
    } else {
      saveVerseBtn.classList.add('dimmed');
    }
  }

  // Check if there are unsaved changes in the add verse form
  function hasUnsavedChanges() {
    const verseText = document.getElementById('verseText').value.trim();
    const bookName = document.getElementById('bookNameInput').value.trim();
    const chapterNumber = document.getElementById('chapterNumber').value.trim();
    const verseNumber = document.getElementById('verseNumber').value.trim();
    const verseInitials = document.getElementById('verseInitials').value.trim();
    const bookInitials = document.getElementById('bookInitials').value.trim();
    const bibleVersion = document.getElementById('bibleVersion').value.trim();
    const defaultBibleVersion = localStorage.getItem('defaultBibleVersion') || '';
    
    // If editing, check if any field differs from original
    if (originalVerseValues) {
      return verseText !== originalVerseValues.verseText ||
             bookName !== originalVerseValues.bookName ||
             chapterNumber !== originalVerseValues.chapterNumber ||
             verseNumber !== originalVerseValues.verseNumber ||
             verseInitials !== originalVerseValues.verseInitials ||
             bookInitials !== originalVerseValues.bookInitials ||
             bibleVersion !== originalVerseValues.bibleVersion;
    }
    
    // If adding new verse, check if any field has content (except bibleVersion if it's just the default)
    return verseText !== '' ||
           bookName !== '' ||
           chapterNumber !== '' ||
           verseNumber !== '' ||
           verseInitials !== '' ||
           bookInitials !== '' ||
           (bibleVersion !== '' && bibleVersion !== defaultBibleVersion);
  }

  // Set active navigation button and disable it, enable all others
  function setActiveNavButton(button) {
    // Re-enable the previously active button
    if (activeNavButton && activeNavButton !== button) {
      activeNavButton.classList.remove('active-nav');
    }
    
    // Set the new active button
    activeNavButton = button;
    if (button) {
      button.classList.add('active-nav');
    }
  }

  // Add change listeners to all verse input fields
  document.getElementById('verseText').addEventListener('input', checkForVerseChanges);
  document.getElementById('bookNameInput').addEventListener('input', checkForVerseChanges);
  document.getElementById('chapterNumber').addEventListener('input', checkForVerseChanges);
  document.getElementById('verseNumber').addEventListener('input', checkForVerseChanges);
  document.getElementById('verseInitials').addEventListener('input', checkForVerseChanges);
  document.getElementById('bookInitials').addEventListener('input', checkForVerseChanges);
  document.getElementById('bibleVersion').addEventListener('input', checkForVerseChanges);

  saveVerseBtn.addEventListener('click', () => {
    const verseText = document.getElementById('verseText').value.trim();
    const bookName = document.getElementById('bookNameInput').value.trim();
    const chapterNumber = document.getElementById('chapterNumber').value.trim();
    const verseNumber = document.getElementById('verseNumber').value.trim();
    const verseInitials = document.getElementById('verseInitials').value.trim();
    const bookInitials = document.getElementById('bookInitials').value.trim();
    const bibleVersion = document.getElementById('bibleVersion').value.trim();

    if (!verseText || !bookName || !chapterNumber || !verseNumber || !verseInitials || !bookInitials) {
      saveStatus.textContent = t('fill_all_fields');
      saveStatus.style.color = 'red';
      return;
    }
    if (isNaN(chapterNumber) || isNaN(verseNumber)) {
      saveStatus.textContent = t('chapter_verse_numbers');
      saveStatus.style.color = 'red';
      return;
    }

    let verses = JSON.parse(localStorage.getItem('verses') || '[]');
    
    // Check if we're editing and if the verse has review data
    if (editIndex !== null && verses[editIndex]) {
      const existingVerse = verses[editIndex];
      const hasReviewData = existingVerse.lastReviewed || existingVerse.dueDate || existingVerse.interval || existingVerse.repetitions;
      
      if (hasReviewData) {
        // Show modal to ask user if they want to reset review data
        const resetModal = document.getElementById('resetReviewDataModal');
        const yesBtn = document.getElementById('resetReviewYesBtn');
        const noBtn = document.getElementById('resetReviewNoBtn');
        
        if (resetModal) {
          resetModal.setAttribute('aria-hidden', 'false');
          resetModal.classList.add('open');
          
          // Remove old event listeners
          const newYesBtn = yesBtn.cloneNode(true);
          const newNoBtn = noBtn.cloneNode(true);
          yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
          noBtn.parentNode.replaceChild(newNoBtn, noBtn);
          
          // Yes - reset review data
          newYesBtn.onclick = () => {
            resetModal.setAttribute('aria-hidden', 'true');
            resetModal.classList.remove('open');
            saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, true);
          };
          
          // No - preserve review data
          newNoBtn.onclick = () => {
            resetModal.setAttribute('aria-hidden', 'true');
            resetModal.classList.remove('open');
            saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, false);
          };
        }
        return; // Exit here, modal handlers will complete the save
      }
    }
    
    // No review data to worry about, proceed with normal save
    saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, true);
  });

  // Helper function to save verse with or without preserving review data
  function saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, resetReviewData) {
    const verseData = {
      verseText,
      bookName,
      chapterNumber,
      verseNumber,
      verseInitials,
      bookInitials,
      bibleVersion: bibleVersion || '',
      lastReviewed: null,
      id: Date.now().toString(),
    };
    
    if (editIndex !== null) {
      // preserve id if present
      verseData.id = verses[editIndex].id || verseData.id;
      
      // If NOT resetting review data, preserve the existing review fields
      if (!resetReviewData && verses[editIndex]) {
        if (verses[editIndex].lastReviewed) verseData.lastReviewed = verses[editIndex].lastReviewed;
        if (verses[editIndex].dueDate) verseData.dueDate = verses[editIndex].dueDate;
        if (verses[editIndex].interval) verseData.interval = verses[editIndex].interval;
        if (verses[editIndex].repetitions) verseData.repetitions = verses[editIndex].repetitions;
      }
      
      verses[editIndex] = verseData;
      saveStatus.textContent = t('verse_updated');
      // Clear form and return to add verse state after updating
      setTimeout(() => {
        clearForm();
      }, 1000); // Give user time to see the success message
    } else {
      verses.push(verseData);
      saveStatus.textContent = t('verse_saved');
    }
    saveStatus.style.color = '#2d72d9';
    localStorage.setItem('verses', JSON.stringify(verses));

    // If user selected a collection in the Add panel, add this verse to that collection
    try {
      const chosen = addToCollectionSelect ? addToCollectionSelect.value : '';
      if (chosen) {
        const cols = getCollections();
        const col = cols.find(c => c.id === chosen);
        if (col) {
          col.verseIds = col.verseIds || [];
          if (!col.verseIds.includes(verseData.id)) col.verseIds.push(verseData.id);
          saveCollections(cols);
          renderCollectionsList();
          populateCollectionSelector();
          loadCollectionsForReview();
        }
      }
    } catch (e) { /* ignore */ }

    loadVersesForEdit();
    // Clear the add/edit form automatically after saving
    clearForm();
    // refresh collections UI
    renderCollectionsList();
    // Update review badge
    updateReviewBadge();
  }

  function loadUnlearnedVerses() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const unlearned = verses.filter(v => !v.lastReviewed);

    if (unlearned.length === 0) {
      alert(t('no_verses_to_learn'));
      return false;
    }
    // Sort by Bible book order
    const sortedUnlearned = sortVersesByBibleOrder([...unlearned]);
    verseSelector.style.display = '';
    verseSelector.innerHTML = '';
    sortedUnlearned.forEach((v, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
      verseSelector.appendChild(option);
    });

    startLearnMode(sortedUnlearned[0]);
    return true;
  }

  // Populate the verse selector with unlearned verses but do NOT start learn mode.
  function populateUnlearnedSelector() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    let list = verses.filter(v => !v.lastReviewed);
    // If no unlearned verses, fall back to all verses
    if (list.length === 0) list = verses;
    // Sort by Bible book order
    list = sortVersesByBibleOrder(list);

    verseSelector.innerHTML = '';
    list.forEach((v, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
      verseSelector.appendChild(option);
    });

    // Select top verse and ensure selector visible
    try { verseSelector.selectedIndex = 0; verseSelector.style.opacity = '1'; } catch (e) {}
    return list;
  }

  function getUnlearnedList() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    let list = verses.filter(v => !v.lastReviewed);
    if (list.length === 0) list = verses;
    // Sort by Bible book order
    return sortVersesByBibleOrder(list);
  }

  function startLearnMode(verse) {
    
  // --- REVISED RESET LOGIC (Enforce Basic Mode, Clear State, and VISIBILITY) ---
    
    // 1. CRITICAL FIX: Reset the learning stage to 'basic' by calling the setter function
    // NOTE: Only reset to 'basic' when we are NOT starting from a review session.
    // For review flows (individual or single-text) the caller sets the desired stage
    // (usually 'advanced') before calling startLearnMode, so avoid overriding it here.
    if (!(reviewVerses && reviewVerses.length > 0) && reviewCollectionMode === null) {
      setLearningStage('basic');
    }
    
    // 2. Control visibility of label and buttons separately
    const inReview = (reviewVerses && reviewVerses.length > 0) || reviewCollectionMode !== null;
    
    // Label: hide during review, show during normal learning
    if (learnModeLabel) {
      learnModeLabel.style.display = inReview ? 'none' : '';
    }
    
    // Difficulty buttons: hide during review UNLESS in practice mode
    if (difficultyControls) {
      const showButtons = !inReview || reviewPracticeMode;
      difficultyControls.style.display = showButtons ? '' : 'none';
      console.log('startLearnMode visibility:', { inReview, reviewPracticeMode, showButtons });
    }
    
    // 3. Clear user input and reset completion flag
    userInput = ''; 
    window.learnComplete = false;
    // Existing resets that are still necessary:
    currentVerse = verse;
    learnInput.value = ''; // Clear the input field element
    // Update helper text above verse display
    updateLearnInputPlaceholder();
    prevUserInputLength = 0;
    learnInput.disabled = false;
    learnFeedback.textContent = '';
    learnNextBtn.style.display = 'none';
    learnRetryBtn.style.display = 'none';

    // Combine verse text and reference
    learnFullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
    // Combine all expected inputs in sequence: verse initials + book initials + chapter digits + verse digits
    // NOTE: we deliberately omit the colon from the expected-input string so the user does NOT type it.
    learnFullInitials = `${verse.verseInitials}${verse.bookInitials}${String(verse.chapterNumber)}${String(verse.verseNumber)}`;

    // Build mappings between character positions in learnFullText and input indexes (for chinese chars and digits).
    // charToInputIndex[i] -> index in learnFullInitials that corresponds to learnFullText[i], or null for punctuation.
    const chars = [...learnFullText];
    const charToInputIndex = new Array(chars.length).fill(null);
    const inputIndexToCharIndex = [];
    let inputIdx = 0;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (/[\u4e00-\u9fa5]/.test(ch) || /[0-9]/.test(ch)) {
        charToInputIndex[i] = inputIdx;
        inputIndexToCharIndex[inputIdx] = i;
        inputIdx++;
      } else {
        charToInputIndex[i] = null;
      }
    }
    // expose mappings for render and feedback functions
    window.charToInputIndex = charToInputIndex;
    window.inputIndexToCharIndex = inputIndexToCharIndex;

    // If we're reviewing a collection as individual verses, ensure the selector reflects the current verse
    try {
      if (reviewCollectionMode === 'individual' && reviewVerses && reviewVerses.length > 0 && verseSelector) {
        const idx = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName &&
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (idx !== -1) {
          verseSelector.selectedIndex = idx;
          verseSelector.style.display = 'block';
          verseSelector.style.opacity = '1';
        }
      }
    } catch (e) { /* ignore DOM errors */ }

    renderVerseDisplay();
    
    // Delay focus to ensure all state is cleared and display is rendered
    // This prevents keyboard from appearing and immediately dismissing on mobile
    setTimeout(() => {
      learnInput.focus();
    }, 100);
  }

  function renderVerseDisplay() {
    let displayHTML = '';
    const chars = [...learnFullText];
    const refIndex = learnFullText.indexOf('\n');

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      // In single-text collection review we render the reference inline separately
      // and should not duplicate the reference characters that appear after the newline
      if (reviewCollectionMode === 'singleText' && refIndex >= 0 && i >= refIndex) {
        // skip reference characters here (they are handled by the inline reference)
        continue;
      }
      const map = window.charToInputIndex && window.charToInputIndex[i] !== undefined ? window.charToInputIndex[i] : null;

      if (map !== null) {
        // Input-requiring character (Chinese or digit)
        const expected = learnFullInitials[map];
        let className = 'verse-character';

        // Determine visibility for intermediate variant or advanced hidden state.
        let hiddenByStage = false;
        if (learningStage === 'intermediate') {
          const isOdd = ((map + 1) % 2) === 1; // 1-based odd check
          const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
          if (!visibleByVariant) hiddenByStage = true;
        } else if (learningStage === 'advanced') {
          hiddenByStage = true;
        }

        // If hidden by stage, reveal only when the user has typed that input index; show correct/incorrect coloring.
        if (hiddenByStage) {
          if (userInput.length > map) {
            // user has typed this index — reveal with correct/incorrect styling
            const method = localStorage.getItem('inputMethod') || 'pinyin';
            const typedChar = method === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
            const expectedChar = method === 'pinyin' ? expected.toLowerCase() : expected;
            className += typedChar === expectedChar ? ' correct' : ' incorrect';
            displayHTML += `<span class="${className}">${char}</span>`;
          } else {
            // keep hidden
            className += ' hidden';
            displayHTML += `<span class="${className}">${char}</span>`;
          }
          continue;
        }

        // Not hidden: if user has typed for this index, mark correct/incorrect normally
        if (userInput.length > map) {
          const method = localStorage.getItem('inputMethod') || 'pinyin';
          const typedChar = method === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
          const expectedChar = method === 'pinyin' ? expected.toLowerCase() : expected;
          className += typedChar === expectedChar ? ' correct' : ' incorrect';
        }

        displayHTML += `<span class="${className}">${char}</span>`;
      } else { // Punctuation, whitespace, or characters that do not require input.
        // --- START NEW LOGIC FOR PUNCTUATION DISPLAY (Requests 1 & 2) ---

        // Request 2: Find the nearest input-required character map index.
        // This ensures groups of punctuation marks (e.g., ?!) are revealed together.
        let mapOfNearestPrevInput = null;
        for (let k = i - 1; k >= 0; k--) {
            const map = window.charToInputIndex ? window.charToInputIndex[k] : null;
            if (map !== null) {
                mapOfNearestPrevInput = map;
                break;
            }
        }
        let mapOfNearestNextInput = null;
        for (let k = i + 1; k < chars.length; k++) {
            const map = window.charToInputIndex ? window.charToInputIndex[k] : null;
            if (map !== null) {
                mapOfNearestNextInput = map;
                break;
            }
        }
        const prevMap = mapOfNearestPrevInput; // Use nearest map for logic
        const nextMap = mapOfNearestNextInput; // Use nearest map for basic mode adjacent check
        
        let shown = false;
        let className = 'verse-character punctuation';

        // Detect if this punctuation is an initial punctuation (no input-required chars to its left)
        let isInitialPunct = (prevMap === null); // Simplified check

        // Show all initial punctuation (if any)
        if (isInitialPunct) {
            shown = true;
        }

        // --- STAGE LOGIC (Modified Advanced Mode) ---
        if (learningStage === 'intermediate' && prevMap !== null) {
            // Intermediate: show if it's the right variant (odd/even) OR if user has typed the preceding character
            const isOdd = ((prevMap + 1) % 2) === 1;
            const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
            if (visibleByVariant || userInput.length > prevMap) shown = true;
        } else if (learningStage === 'advanced') { 
            // Request 1: In advanced: show if previous input-required character has been typed (regardless of correctness)
            if (prevMap !== null && userInput.length > prevMap) {
                shown = true;
            }
            // If not shown in advanced mode, add hidden class
            if (!shown) className += ' hidden';
        } else { // In basic: show if any adjacent char input is entered
            [prevMap, nextMap].forEach(adj => { 
                if (adj !== null && adj !== undefined && userInput.length > adj) {
                    shown = true; 
                } 
            });
        }
        
        // --- COLOR LOGIC (Modified to fulfill Request 1) ---
        // Initial punctuation (no preceding input-required chars) should display as correct (white) immediately
        // to signal users don't need to type it.
        // Other punctuation is displayed as 'correct' (white) if it is shown
        // AND the nearest preceding input-required character has been typed, regardless of correctness.
        if (isInitialPunct) {
            className = 'verse-character correct';
        } else if (shown && prevMap !== null && userInput.length > prevMap) {
            className = 'verse-character correct';
        }
        
        displayHTML += `<span class="${className}">${char}</span>`;
      }
    }

    // If we're doing a single-text collection review, prepend previously completed lines
    // and show the current verse reference inline above the characters.
    if (reviewCollectionMode === 'singleText') {
      let prefixHTML = '';
      if (singleTextPrev && singleTextPrev.length > 0) {
        prefixHTML += singleTextPrev.map(line => `<div class="completed-verse">${line}</div>`).join('\n');
        prefixHTML += '<br/>';
      }
      // Show current reference in white (not part of what user needs to type)
      try {
        // Determine if we should show abbreviated reference
        let refDisplay = '';
        if (currentVerse) {
          const prevVerse = singleTextPrev.length > 0 ? reviewVerses[singleTextReviewIndex - 1] : null;
          if (prevVerse && 
              prevVerse.bookName === currentVerse.bookName && 
              prevVerse.chapterNumber === currentVerse.chapterNumber) {
            // Same book and chapter - show only verse number
            refDisplay = `${currentVerse.verseNumber} `;
          } else {
            // Different book/chapter - show full reference
            refDisplay = `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber} `;
          }
        }
        // Always show reference in white (user doesn't need to type it)
        prefixHTML += `<div class="inline-reference" style="color: white;">${refDisplay}</div>`;
      } catch (e) { /* ignore */ }
      learnVerseDisplay.innerHTML = prefixHTML + `<div class="current-verse-chars">${displayHTML}</div>`;
    } else {
      learnVerseDisplay.innerHTML = displayHTML;
    }
  }

  learnInput.addEventListener('keydown', (event) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
    }
  });

  // Mute toggle button
  const muteToggle = document.getElementById('muteToggle');
  if (muteToggle) {
    // initialize label - use the span inside the button
    const muteSpan = muteToggle.querySelector('span');
    if (muteSpan) muteSpan.textContent = t('sound_off');
    muteToggle.setAttribute('aria-pressed', 'true');
    muteToggle.addEventListener('click', () => {
      isMuted = !isMuted;
      if (!audioCtx) {
        // lazy create AudioContext on first user gesture
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          audioCtx = null;
        }
      }
      const muteSpan = muteToggle.querySelector('span');
      if (!isMuted) {
        if (muteSpan) muteSpan.textContent = t('sound_on');
        muteToggle.querySelector('span').previousSibling.textContent = '🔊 ';
        muteToggle.setAttribute('aria-pressed', 'false');
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      } else {
        if (muteSpan) muteSpan.textContent = t('sound_off');
        muteToggle.querySelector('span').previousSibling.textContent = '🔇 ';
        muteToggle.setAttribute('aria-pressed', 'true');
      }
    });
  }

  // Play a short buzzer sound using Web Audio API
  function playBuzzer() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return; // audio not supported
      }
    }
    try {
      const now = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(280, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now);
      o.stop(now + 0.15);
    } catch (e) {
      // ignore audio errors
    }
  }

  // Vibrate on error (Android only)
  function vibrateOnError() {
    if (isVibrationEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(100); // vibrate for 100ms
      } catch (e) {
        // ignore vibration errors
      }
    }
  }

  // Accuracy modal elements
  const accuracyModal = document.getElementById('accuracyModal');
  const modalMessage = document.getElementById('modalMessage');
  const modalAccuracy = document.getElementById('modalAccuracy');
  const modalRetryBtn = document.getElementById('modalRetryBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');

  function showAccuracyModal(success, accuracy) {
    if (!accuracyModal) {
      console.error('accuracyModal element not found!');
      return;
    }
    
    // Hide keyboards when showing modal
    hideAllKeyboards();
    
    // set texts
    if (success) {
      // Choose message and button label. Prioritize review-mode decisions
      // so non-last review successes show "Next" and last-review shows a
      // congratulatory summary + "Finish".
      let isLast = false;
      if (reviewVerses && reviewVerses.length > 0) {
        const idx = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        isLast = idx === (reviewVerses.length - 1);

        if (isLast) {
          const totalReviewed = (reviewSuccessCount || 0) + (success ? 1 : 0);
          modalMessage.textContent = `${t('congratulations_reviewed')} ${totalReviewed} ${t('verses')}`;
        } else {
          modalMessage.textContent = t('great_job_continue');
        }
      } else if (learningStage === 'intermediate') {
        modalMessage.textContent = t('great_job_intermediate');
      } else if (learningStage === 'advanced') {
        modalMessage.textContent = t('congratulations_mastered');
      } else {
        modalMessage.textContent = t('great_job_basic');
      }

      // Decide button label now (so it appears correctly when the modal opens)
      if (modalNextBtn) {
        if (reviewVerses && reviewVerses.length > 0) {
          modalNextBtn.textContent = isLast ? t('finish') : t('next');
        } else if (learningStage === 'advanced') {
          modalNextBtn.textContent = t('finish');
        } else {
          modalNextBtn.textContent = t('next');
        }
        modalNextBtn.style.display = 'inline-block';
      }

      // Hide retry on success only for review sessions. In learn mode
      // users should always have the option to retry even after success.
      if (modalRetryBtn) {
        if (reviewVerses && reviewVerses.length > 0) {
          modalRetryBtn.style.display = 'none';
        } else {
          modalRetryBtn.style.display = 'inline-block';
        }
      }
    } else {
      modalMessage.textContent = t('nice_try');
      // In review mode, show both Retry and Skip buttons for failed attempts
      if (reviewVerses && reviewVerses.length > 0) {
        modalNextBtn.style.display = 'inline-block';
        // Change button text to "Skip" when user fails
        if (modalNextBtn) modalNextBtn.textContent = t('skip') || 'Skip';
      } else {
        modalNextBtn.style.display = 'none';
      }
      if (modalRetryBtn) modalRetryBtn.style.display = 'inline-block';
    }
    modalAccuracy.textContent = `${t('accuracy')}: ${accuracy.toFixed(1)}%`;

    // show modal and prevent outside click close
    accuracyModal.classList.add('open');
    accuracyModal.removeAttribute('aria-hidden');
    
    // Set focus to the appropriate button AFTER showing modal
    setTimeout(() => {
      if (success && modalNextBtn) {
        modalNextBtn.focus();
      } else if (modalRetryBtn) {
        modalRetryBtn.focus();
      }
    }, 100);
    
    // ensure input is disabled until modal action
    learnInput.disabled = true;
  }

  function closeAccuracyModal() {
    if (!accuracyModal) return;
    accuracyModal.classList.remove('open');
    accuracyModal.setAttribute('aria-hidden', 'true');
  }

  // Wire modal buttons
  if (modalRetryBtn) {
    modalRetryBtn.addEventListener('click', () => {
      console.log('Retry button clicked:', {
        success: pendingCompletion.success,
        learningStage,
        reviewVerses: reviewVerses?.length,
        reviewPracticeMode
      });
      
      // Apply spaced repetition for failure before allowing retry
      // Only apply once - on the first retry (when not already in practice mode)
      if (!pendingCompletion.success && learningStage === 'advanced' && !reviewPracticeMode) {
        console.log('Applying spaced repetition for failure');
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const verseIndex = verses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (verseIndex !== -1) {
          const now = new Date();
          
          // Initialize or update spaced repetition data
          if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
          if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
          
          // Apply spaced repetition algorithm with failure
          const card = {
            interval: verses[verseIndex].interval,
            repetitions: verses[verseIndex].repetitions,
            dueDate: verses[verseIndex].dueDate
          };
          const updatedCard = spacedRepetitionBinary(card, false, now);
          
          verses[verseIndex].interval = updatedCard.interval;
          verses[verseIndex].repetitions = updatedCard.repetitions;
          verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
          
          localStorage.setItem('verses', JSON.stringify(verses));
        }
      }
      
      closeAccuracyModal();
      
      // CRITICAL FIX: Do NOT call learnRetryBtn.click() as it calls startLearnMode which resets to basic.
      // Instead, replicate the retry behavior while preserving the current learning stage.
      
      // Toggle intermediate variant between 'odd' and 'even' on retry so the user sees the opposite pattern
      if (learningStage === 'intermediate') {
        intermediateVariant = (intermediateVariant === 'odd') ? 'even' : 'odd';
      }
      
      // Reset input, coloring and help text
      userInput = '';
      learnInput.value = '';
      learnInput.disabled = false;
      lastErrorIndex = null;
      lastErrorChar = null;
      learnFeedback.textContent = '';
      learnFeedback.className = '';
      learnRetryBtn.style.display = 'none';
      learnNextBtn.style.display = 'none';
      
      // Ensure verse selector is visible during retry
      if (verseSelector) {
        verseSelector.style.display = 'block';
        verseSelector.style.opacity = '1';
      }
      
      // Re-render without changing the learning stage
      renderVerseDisplay();
      learnInput.focus();
    });
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', () => {
      // Always exit practice mode when clicking Next (whether success or skip)
      if (reviewPracticeMode) {
        console.log('Exiting practice mode via Next button');
        reviewPracticeMode = false;
      }
      
      // Update lastReviewed and spaced repetition based on success/skip
      // In practice mode, if user clicks Next without completing Advanced successfully,
      // treat it as a failure for spaced repetition purposes
      const shouldUpdateSpacedRepetition = learningStage === 'advanced';
      
      if (shouldUpdateSpacedRepetition) {
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const verseIndex = verses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (verseIndex !== -1) {
          const now = new Date();
          verses[verseIndex].lastReviewed = now.toISOString();
          
          // Initialize or update spaced repetition data
          if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
          if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
          
          // Apply spaced repetition algorithm (use actual success status)
          const card = {
            interval: verses[verseIndex].interval,
            repetitions: verses[verseIndex].repetitions,
            dueDate: verses[verseIndex].dueDate
          };
          const isSuccess = pendingCompletion && pendingCompletion.success;
          const updatedCard = spacedRepetitionBinary(card, isSuccess, now);
          
          verses[verseIndex].interval = updatedCard.interval;
          verses[verseIndex].repetitions = updatedCard.repetitions;
          verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
          
          localStorage.setItem('verses', JSON.stringify(verses));
          // Update badge after storing verse completion
          updateReviewBadge();
        }

        closeAccuracyModal();
        
        // Check if this is part of a review session
        if (reviewVerses && reviewVerses.length > 0) {
            // For individual-verse review flows (modal-driven), record this
            // successful review now so the modal summary reflects the total
            // number of successful verses including the current one.
            if (reviewCollectionMode !== 'singleText' && pendingCompletion.success) {
              reviewSuccessCount = (reviewSuccessCount || 0) + 1;
            }
          // Find current verse index in review list
          const currentIndex = reviewVerses.findIndex(v => 
            v.bookName === currentVerse.bookName && 
            v.chapterNumber === currentVerse.chapterNumber &&
            v.verseNumber === currentVerse.verseNumber
          );

          // If we're in single-text collection review, append the completed verse to the inline display
          if (reviewCollectionMode === 'singleText') {
            // Count successful reviews
            if (pendingCompletion.success) reviewSuccessCount = (reviewSuccessCount || 0) + 1;

            // Append the completed verse (full reference + text) to the accumulated display
            try {
              const fullRef = `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber}`;
              singleTextPrev = singleTextPrev || [];
              singleTextPrev.push(`<span class="reference-inline">${fullRef}</span> ${currentVerse.verseText}`);
            } catch (e) { /* ignore */ }

            if (currentIndex < reviewVerses.length - 1) {
              // Move to next verse in the collection (keep selector hidden)
              const nextV = reviewVerses[currentIndex + 1];
              currentVerse = nextV;
              userInput = '';
              prevUserInputLength = 0;
              learnInput.value = '';
              learnFeedback.textContent = '';
              learnFeedback.className = '';
              // startLearnMode will render the accumulated prefix via renderVerseDisplay
              startLearnMode(currentVerse);
            } else {
              // Finished the collection review. Show summary with count of successful reviews
              const totalReviewed = reviewSuccessCount || 0;
              reviewVerses = [];
              currentVerse = null;
              showPanel(reviewPanel);
              loadVersesForReview(); // Refresh with updated lastReviewed times
              updateReviewBadge();
              if (verseSelector) verseSelector.style.display = 'block'; // restore selector
              alert(`${t('congratulations_reviewed')} ${totalReviewed} ${t('verses')}`);
            }
            return;
          }

          // Individual-verse review (default) — move to the next selected verse
          if (currentIndex < reviewVerses.length - 1) {
            // More verses to review - show next one
            currentVerse = reviewVerses[currentIndex + 1];
            userInput = '';
            prevUserInputLength = 0;
            learnInput.value = '';
            learnFeedback.textContent = '';
            learnFeedback.className = '';
            startLearnMode(currentVerse);
          } else {
            // Review session complete - return to review panel
            reviewVerses = [];
            currentVerse = null;
            showPanel(reviewPanel);
            loadVersesForReview(); // Refresh with updated lastReviewed times
            updateReviewBadge();
            if (verseSelector) {
              verseSelector.style.display = 'block'; // Show verse selector again
              verseSelector.disabled = false; // Re-enable selector when review is complete
            }
            // Show the verse selector label again
            const verseSelectorLabel = document.getElementById('verseSelectorLabel');
            if (verseSelectorLabel) verseSelectorLabel.style.display = '';
          }
          return;
        }

        // Not in review
        closeAccuracyModal();
        userInput = '';
        prevUserInputLength = 0;
        learnInput.value = '';
        learnFeedback.textContent = '';
        learnFeedback.className = '';
        const list = populateUnlearnedSelector();

        // If there are no more unlearned verses, route to Add Verse panel
        if (!list || list.length === 0) {
          try {
            setActiveNavButton(addVerseBtn);
            showPanel(addVersePanel);
            loadVersesForEdit();
            populateCollectionSelector();
          } catch (e) { /* ignore */ }
          return;
        }

        // Otherwise, continue normal learning flow
        setLearningStage('basic');
        showPanel(learnPanel);
        if (verseSelector) verseSelector.style.display = 'block';
        currentVerse = list[0];
        startLearnMode(currentVerse);
        // Explicitly show keyboard after startLearnMode since showPanel hides it
        setTimeout(() => {
          showKeyboardForInput(learnInput);
        }, 150);
        return;
      }

      // Default: proceed to next (reuse existing next behavior)
      closeAccuracyModal();
      learnNextBtn.click();
    });
  }

  learnInput.addEventListener('input', () => {
    // FIX: When in single-text collection review mode, bypass the general learn logic 
    // as the singleTextInputHandler manages the input for this mode.
    if (singleTextSession) {
        return;
    }

    const method = localStorage.getItem('inputMethod') || 'pinyin';
    let inputStr;
    if (method === 'pinyin') {
      inputStr = learnInput.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      // For Zhuyin and Cangjie, keep all characters including Chinese/symbols
      inputStr = learnInput.value.replace(/\s/g, ''); // Only remove spaces
    }
    const prevLen = prevUserInputLength;
    userInput = inputStr;
    
    // Debug logging for completion detection
    console.log('Input event:', {
      method,
      userInputLength: userInput.length,
      learnFullInitialsLength: learnFullInitials.length,
      userInput,
      learnFullInitials,
      match: userInput.length === learnFullInitials.length
    });
    
    // Play buzzer for any newly-typed incorrect characters when unmuted
    if (userInput.length > prevLen) {
      for (let j = prevLen; j < userInput.length; j++) {
        const expected = learnFullInitials[j];
        const typed = userInput[j];
        const expectedNorm = method === 'pinyin' ? (expected ? expected.toLowerCase() : null) : expected;
        const typedNorm = method === 'pinyin' ? typed : typed;
        if (expectedNorm && typedNorm !== expectedNorm) {
          if (!isMuted) playBuzzer();
          vibrateOnError();
          break; // play once per input event
        }
      }
    }

    prevUserInputLength = userInput.length;

    // Auto-switch keyboard when next character is a digit
    if (activeInput === learnInput && userInput.length < learnFullInitials.length) {
      const nextExpected = learnFullInitials[userInput.length];
      const isNextDigit = /[0-9]/.test(nextExpected);
      const numericVisible = numericKeyboard && numericKeyboard.style.display === 'block';
      const zhuyinVisible = zhuyinKeyboard && zhuyinKeyboard.style.display === 'block';
      const cangjieVisible = cangjieKeyboard && cangjieKeyboard.style.display === 'block';
      const pinyinVisible = pinyinKeyboard && pinyinKeyboard.style.display === 'block';
      
      if (isNextDigit && !numericVisible) {
        // Next character is a digit but numeric keyboard not showing - switch to it
        hideAllKeyboards();
        showKeyboardForInput(learnInput, 'numeric');
      } else if (!isNextDigit && numericVisible) {
        // Numeric keyboard is showing but next character is not a digit - switch back
        hideAllKeyboards();
        showKeyboardForInput(learnInput);
      }
    }

    renderVerseDisplay();
    updateFeedback();
  });

  function updateFeedback() {
    let errorIndex = -1;
    let errorChar = '';
    let correctCount = 0;
    const totalInputsRequired = learnFullInitials.length;
    const chars = [...learnFullText];
    const method = localStorage.getItem('inputMethod') || 'pinyin';
    // Count correct inputs and find the most recent (latest) error index and mapping
    let mappedCharIndex = -1;
    let latestErrorIndex = -1;
    let latestErrorChar = '';
    for (let i = 0; i < userInput.length; i++) {
      const expected = learnFullInitials[i];
      const typed = userInput[i];
      const expectedNorm = method === 'pinyin' ? expected.toLowerCase() : expected;
      const typedNorm = method === 'pinyin' ? typed.toLowerCase() : typed;
      const mapping = (window.inputIndexToCharIndex && window.inputIndexToCharIndex[i] !== undefined) ? window.inputIndexToCharIndex[i] : -1;
      if (typedNorm === expectedNorm) {
        correctCount++;
      } else {
        // record as latest error (we overwrite so final value is the most recent error position)
        latestErrorIndex = i;
        latestErrorChar = expected;
        mappedCharIndex = mapping;
      }
    }

    // Update progress bar
    if (progressDisplay) {
      const progress = (correctCount / totalInputsRequired) * 100;
      progressDisplay.innerHTML = `<div class="bar" style="width: ${progress}%"></div>`;
    }

    // Fade out the verse selector text gradually to discourage cheating
    try {
      if (verseSelector) {
        const typedRatio = totalInputsRequired > 0 ? (userInput.length / totalInputsRequired) : 0;
        if (learningStage === 'intermediate' || learningStage === 'advanced') {
          // No fade below 25%, fully invisible at 50% or above
          let opacity = 1;
          if (typedRatio <= 0.25) opacity = 1;
          else if (typedRatio >= 0.5) opacity = 0;
          else {
            // linear from 1 -> 0 as typedRatio goes 0.25 -> 0.5
            opacity = 1 - (typedRatio - 0.25) / 0.25;
          }
          verseSelector.style.opacity = opacity.toString();
          // If we're in single-text collection review, also fade the inline reference the same way
          try {
            if (reviewCollectionMode === 'singleText') {
              const inlineRef = document.querySelector('.inline-reference');
              if (inlineRef) inlineRef.style.opacity = opacity.toString();
            }
          } catch (e) { /* ignore */ }
        } else {
          // ensure fully visible in basic mode
          verseSelector.style.opacity = '1';
        }
      }
    } catch (e) {
      // ignore DOM errors
    }

    // Show the most recent error (latestErrorIndex). Update help text when the latest error changes.
    if (latestErrorIndex === -1) {
      // no error currently — clear displayed help text and reset tracking so next error will show
      learnFeedback.textContent = '';
      learnFeedback.className = '';
      lastErrorIndex = null;
      lastErrorChar = null;
    } else {
      const errorCharacter = mappedCharIndex !== -1 ? chars[mappedCharIndex] : '?';
      if (lastErrorIndex !== latestErrorIndex || lastErrorChar !== latestErrorChar) {
        learnFeedback.textContent = t('incorrect_input')
          .replace('{char}', errorCharacter)
          .replace('{pos}', latestErrorIndex + 1)
          .replace('{expected}', latestErrorChar);
        learnFeedback.className = 'error';
        lastErrorIndex = latestErrorIndex;
        lastErrorChar = latestErrorChar;
      }
    }

    // Check if verse is complete
    if (userInput.length === totalInputsRequired) {
      console.log('Completion detected!', {
        userInputLength: userInput.length,
        totalInputsRequired,
        reviewCollectionMode,
        reviewVersesLength: reviewVerses ? reviewVerses.length : 0
      });
      
      // For single-text review mode we only calculate accuracy on the verse text (not reference)
      let verseOnlyAccuracy = 0;
      let totalAccuracy = 0;
      if (reviewCollectionMode === 'singleText') {
        const verseLength = learnFullText.indexOf('\n');
        if (verseLength >= 0) {
          let verseCorrect = 0;
          for (let i = 0; i < verseLength; i++) {
            const map = window.charToInputIndex && window.charToInputIndex[i];
            if (map !== null && map !== undefined) {
              if (userInput[map] && userInput[map].toLowerCase() === learnFullInitials[map].toLowerCase()) {
                verseCorrect++;
              }
            }
          }
          const verseInputs = verseLength;
          verseOnlyAccuracy = verseInputs > 0 ? (verseCorrect / verseInputs) * 100 : 0;
          totalAccuracy = verseOnlyAccuracy; // for single-text we care only about verse portion
        }
      } else {
        totalAccuracy = (correctCount / totalInputsRequired) * 100;
      }

      // Always show accuracy in feedback
      if (learnFeedback.textContent) {
        learnFeedback.textContent += `\n${t('accuracy')}: ${totalAccuracy.toFixed(1)}%`;
      } else {
        learnFeedback.textContent = `${t('accuracy')}: ${totalAccuracy.toFixed(1)}%`;
      }

      // Require 90% accuracy for all stages
      const requiredAccuracy = 90;
      const success = totalAccuracy >= requiredAccuracy;

      // Store pending completion
      pendingCompletion = { success, accuracy: totalAccuracy };

      // Color the accuracy help text: green for >=90%, red otherwise
      try {
        if (learnFeedback) {
          learnFeedback.className = success ? 'success' : 'error';
        }
      } catch (e) { /* ignore */ }

      if (reviewCollectionMode === 'singleText') {
        // For single-text review: update spaced repetition data regardless of success/failure
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const verseIndex = verses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (verseIndex !== -1) {
          const now = new Date();
          
          // Initialize or update spaced repetition data
          if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
          if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
          
          // Apply spaced repetition algorithm (with success or failure)
          const card = {
            interval: verses[verseIndex].interval,
            repetitions: verses[verseIndex].repetitions,
            dueDate: verses[verseIndex].dueDate
          };
          const updatedCard = spacedRepetitionBinary(card, success, now);
          
          verses[verseIndex].interval = updatedCard.interval;
          verses[verseIndex].repetitions = updatedCard.repetitions;
          verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
          
          if (success) {
            verses[verseIndex].lastReviewed = now.toISOString();
            reviewSuccessCount++; // count successful reviews
          }
          
          localStorage.setItem('verses', JSON.stringify(verses));
        }

        // Find current verse index and prepare for next
        const currentIndex = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );

        if (currentIndex < reviewVerses.length - 1) {
          // Append current verse text and move to next verse
          const fullRef = `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber}`;
          singleTextPrev.push(`<span class="reference-inline">${fullRef}</span> ${currentVerse.verseText}`);
          singleTextReviewIndex = currentIndex + 1;
          currentVerse = reviewVerses[currentIndex + 1];
          userInput = '';
          prevUserInputLength = 0;
          learnInput.value = '';
          learnInput.disabled = false;
          startLearnMode(currentVerse);
        } else {
          // Collection review complete - show summary and return to review panel
          const totalReviewed = reviewSuccessCount;
          reviewVerses = [];
          currentVerse = null;
          showPanel(reviewPanel);
          loadVersesForReview(); // Refresh with updated lastReviewed times
          updateReviewBadge();
          if (verseSelector) {
            verseSelector.style.display = 'block';
            verseSelector.disabled = false; // Re-enable selector
          }
          // Show the verse selector label again
          const verseSelectorLabel = document.getElementById('verseSelectorLabel');
          if (verseSelectorLabel) verseSelectorLabel.style.display = '';
          alert(`${t('congratulations_reviewed')} ${totalReviewed} ${t('verses')}`);
        }
      } else {
        // For individual verse review: check if we should show modal or just feedback
        
        // Enable practice mode if in review and accuracy is below 90% on advanced
        const inReview = (reviewVerses && reviewVerses.length > 0) || reviewCollectionMode !== null;
        if (inReview && !success && learningStage === 'advanced' && !reviewPracticeMode) {
          console.log('Enabling practice mode: accuracy below 90% in review', {
            accuracy: totalAccuracy,
            reviewPracticeMode: false
          });
          reviewPracticeMode = true;
        }
        
        // In practice mode, only show modal for Advanced stage
        // For Basic/Intermediate, auto-advance after showing feedback briefly
        if (reviewPracticeMode && learningStage !== 'advanced') {
          console.log('Practice mode: Basic/Intermediate completion, auto-advancing', {
            success,
            accuracy: totalAccuracy,
            learningStage
          });
          
          learnInput.disabled = true;
          
          // Auto-advance after 1.5 seconds
          setTimeout(() => {
            if (success) {
              // Move to next difficulty
              const nextStage = learningStage === 'basic' ? 'intermediate' : 'advanced';
              setLearningStage(nextStage);
            } else {
              // Failed: stay on same stage but toggle variant for intermediate
              if (learningStage === 'intermediate') {
                intermediateVariant = (intermediateVariant === 'odd') ? 'even' : 'odd';
                console.log('Toggled intermediate variant to:', intermediateVariant);
              }
            }
            
            // Clear and restart
            userInput = '';
            learnInput.value = '';
            learnInput.disabled = false;
            lastErrorIndex = null;
            lastErrorChar = null;
            learnFeedback.textContent = '';
            learnFeedback.className = '';
            
            renderVerseDisplay();
            learnInput.focus();
          }, 1500);
        } else {
          // Show modal for: non-practice mode OR practice mode in Advanced stage
          showAccuracyModal(success, totalAccuracy);
          learnInput.disabled = true;
        }
      }
    } else {
      learnRetryBtn.style.display = 'none';
      learnNextBtn.style.display = 'none';
    }
  }

  learnRetryBtn.addEventListener('click', () => {
    console.log('learnRetryBtn clicked:', {
      reviewPracticeMode,
      reviewVerses: reviewVerses?.length,
      learningStage
    });
    
    // CRITICAL FIX: Do NOT call startLearnMode() as it resets the learning stage to basic.
    // Instead, replicate the retry behavior while preserving the current learning stage.
    
    // Toggle intermediate variant between 'odd' and 'even' on retry so the user sees the opposite pattern
    if (learningStage === 'intermediate') {
      intermediateVariant = (intermediateVariant === 'odd') ? 'even' : 'odd';
    }
    // Reset input, coloring and help text
    userInput = '';
    learnInput.value = '';
    learnInput.disabled = false;
    lastErrorIndex = null;
    lastErrorChar = null;
    learnFeedback.textContent = '';
    learnFeedback.className = '';
    learnRetryBtn.style.display = 'none';
    learnNextBtn.style.display = 'none';
    
    // Ensure verse selector is visible during retry (both in review and learning modes)
    if (verseSelector) {
      verseSelector.style.display = 'block';
      verseSelector.style.opacity = '1';
    }
    
    // Re-render without changing the learning stage
    renderVerseDisplay();
    learnInput.focus();
  });

  // Learning stage controls

  function setLearningStage(stage) {
    learningStage = stage;
    [basicMode, intermediateMode, advancedMode].forEach(btn => {
      btn.classList.remove('active');
    });
    
    switch (stage) {
      case 'basic':
        basicMode.classList.add('active');
        break;
      case 'intermediate':
        intermediateMode.classList.add('active');
        break;
      case 'advanced':
        advancedMode.classList.add('active');
        break;
    }

    if (currentVerse) {
      // Clear input field and reset state when switching modes to prevent cheating
      userInput = '';
      learnInput.value = '';
      learnInput.disabled = false;
      lastErrorIndex = null;
      lastErrorChar = null;
      learnFeedback.textContent = '';
      learnFeedback.className = '';
      learnRetryBtn.style.display = 'none';
      learnNextBtn.style.display = 'none';
      
      // Ensure verse selector is visible when changing stages (avoid lingering faded state)
      try { if (verseSelector) verseSelector.style.opacity = '1'; } catch (e) {}
      renderVerseDisplay();
      learnInput.focus();
    }
  }

  basicMode.addEventListener('click', () => setLearningStage('basic'));
  intermediateMode.addEventListener('click', () => {
    // Toggle variant if already on intermediate stage (clicking again)
    if (learningStage === 'intermediate') {
      intermediateVariant = (intermediateVariant === 'odd') ? 'even' : 'odd';
      // Clear input and re-render to show toggled pattern
      userInput = '';
      learnInput.value = '';
      renderVerseDisplay();
      learnInput.focus();
    } else {
      setLearningStage('intermediate');
    }
  });
  advancedMode.addEventListener('click', () => setLearningStage('advanced'));

  learnNextBtn.addEventListener('click', () => {
    // Check if we're in practice mode during a review session
    if (reviewPracticeMode) {
      console.log('Practice mode: Next clicked, exiting practice and advancing to next verse');
      reviewPracticeMode = false;
      
      // Trigger the modal Next button behavior to advance to next review verse
      if (modalNextBtn) {
        modalNextBtn.click();
      }
      return;
    }
    
    let nextStage;
    switch (learningStage) {
      case 'basic':
        nextStage = 'intermediate';
        break;
      case 'intermediate':
        nextStage = 'advanced';
        break;
      default:
        // For advanced stage, move to next verse
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const unlearned = verses.filter(v => !v.lastReviewed);
        const currentIndex = unlearned.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        
        if (currentIndex < unlearned.length - 1) {
          currentVerse = unlearned[currentIndex + 1];
          nextStage = 'basic';
        } else {
          alert(t('completed_all_verses'));
          return;
        }
    }

    setLearningStage(nextStage);
    // Reset input, coloring and help text when advancing stage
    userInput = '';
    learnInput.value = '';
    learnInput.disabled = false;
    lastErrorIndex = null;
    lastErrorChar = null;
    learnFeedback.textContent = '';
    learnFeedback.className = '';
    learnNextBtn.style.display = 'none';
    renderVerseDisplay();
    learnInput.focus();
  });


verseSelector.addEventListener('change', () => {
    // Prevent verse changes during review mode
    if (reviewCollectionMode === 'individual' && reviewVerses && reviewVerses.length > 0) {
        // Reset to current verse index to prevent the selector from visually changing
        const currentIndex = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (currentIndex !== -1) {
          verseSelector.selectedIndex = currentIndex;
        }
        return; // Exit early - don't allow verse changes during review
    }
    
    // Ensure the selected value is parsed as an integer index
    const selectedIdx = parseInt(verseSelector.value, 10);
    
    // Blur the selector to prevent keyboard issues on mobile
    verseSelector.blur();

    // Default behavior: the selector contains indices for the unlearned verses array.
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    let unlearned = verses.filter(v => !v.lastReviewed);
    if (unlearned.length === 0) unlearned = verses;
    // Sort by Bible book order
    unlearned = sortVersesByBibleOrder(unlearned);
    
    // **CORRECTED FIX:** Use the index to select the verse from the filtered 'unlearned' array.
    // We ensure we don't go out of bounds.
    if (selectedIdx >= 0 && selectedIdx < unlearned.length) {
        window.currentVerse = unlearned[selectedIdx];
    } else {
        // Fallback or error handling if the index is invalid
        console.error("Verse index not found in unlearned list:", selectedIdx);
        // You might want to select the first verse as a fallback
        window.currentVerse = unlearned[0]; 
    }
    
    // Safety check before starting mode (though less likely to fail now)
    if (!window.currentVerse) {
        console.error("Failed to load verse after index lookup.");
        return; 
    }
    
    // Reset state
    learnInput.value = '';
    userInput = '';
    prevUserInputLength = 0;

    startLearnMode(window.currentVerse);
});

// Navigation Functions 
function hideAllPanels() { 
    // This list must include all panel variables defined at the top of window.onload
    const allPanels = [addVersePanel, learnPanel, reviewPanel, collectionsPanel, exportImportPanel, settingsPanel]; 
    allPanels.forEach(panel => {
        if (panel) panel.style.display = 'none';
    });
    // Don't auto-hide collection detail since it's shown/hidden by viewCollection() 
    if (collectionsPanel && collectionsPanel.style.display === 'none' && collectionDetail) { 
        collectionDetail.style.display = 'none';
    } 
}

function showPanel(panelToShow) {
  // Check for unsaved changes when leaving addVersePanel
  if (addVersePanel && addVersePanel.style.display === 'block' && panelToShow !== addVersePanel) {
    if (hasUnsavedChanges()) {
      const lang = localStorage.getItem('languagePreference') || 'english';
      let message;
      if (lang === 'simplified') {
        message = '您有未保存的更改。确定要离开此页面吗？';
      } else if (lang === 'traditional') {
        message = '您有未保存的更改。確定要離開此頁面嗎？';
      } else {
        message = 'You have unsaved changes. Are you sure you want to leave this page?';
      }
      
      if (!confirm(message)) {
        return false; // User chose to stay, don't change panels
      }
    }
  }
  
  // Hide keyboards when switching panels
  hideAllKeyboards();
  
  // NEW: Restore header and controls if we are going to learnPanel (but NOT during active review sessions)
  if (panelToShow === learnPanel) {
    // Only restore controls if we're not in an active review session
    const inReview = (reviewVerses && reviewVerses.length > 0) || (singleTextSession !== null && typeof singleTextSession !== 'undefined');
    
    // Always show label when not in review
    if (learnModeLabel) {
      learnModeLabel.style.display = inReview ? 'none' : '';
    }
    
    // Show difficulty buttons only when not in review
    if (difficultyControls) {
      difficultyControls.style.display = inReview ? 'none' : '';
    }
  }
    // CRITICAL FIX: Check if we are exiting the learn panel and if a single-text session is active.
    if (panelToShow !== learnPanel) {
        // We are navigating away from the 'Learn' panel.
        if (typeof singleTextSession !== 'undefined' && singleTextSession !== null) {
            // 1. Reset/Clear the session state
            singleTextSession = null;

            // 2. Remove the event listener to prevent keyboard issues
            if (learnInput) {
                learnInput.removeEventListener('input', singleTextInputHandler);
            }

            // 3. Reset the Learn Panel UI (as it was left in a "completed" state)
            if (learnInput) {
                learnInput.value = '';
                learnInput.disabled = false;
                learnInput.style.display = ''; // Restore display
                // Keep input field hidden - it's invisible by design
            }
            if (learnFeedback) {
                learnFeedback.textContent = ''; // Clear the congratulatory message
            }
            if (verseSelector) {
                // Restore the verse selector, which is hidden during single-text review
                verseSelector.style.display = 'block';
            }
        }
    }

    hideAllPanels();
    if (panelToShow) panelToShow.style.display = 'block';
}

  // Navigation Event Listeners
  addVerseBtn.addEventListener('click', () => {
    // Check if user has seen the Add Verse tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenAddVerseTutorial');
    
    if (!hasSeenTutorial) {
      // Update example based on input method before showing
      updateAddVerseTutorialExample();
      // Show tutorial modal first
      const tutorialModal = document.getElementById('addVerseTutorialModal');
      tutorialModal.setAttribute('aria-hidden', 'false');
      tutorialModal.style.display = 'flex';
      return;
    }
    
    if (showPanel(addVersePanel) !== false) {
      setActiveNavButton(addVerseBtn);
      loadVersesForEdit();
      populateCollectionSelector();
    }
  });

  // Initialize review badge on page load
  updateReviewBadge();

  learnBtn.addEventListener('click', () => {
    // Hide all panels, then show the learnPanel
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    learnPanel.style.display = 'block';
    setActiveNavButton(learnBtn);

    // --- REVISED RESET LOGIC (Full Refresh) ---
    // 1. Reset ALL review state variables to ensure default mode is active
    window.reviewVerses = [];
    window.reviewCollectionMode = null;
    singleTextSession = null;  // Clear single-text review session
    singleTextPrev = [];
    singleTextReviewIndex = 0;
    reviewSuccessCount = 0;
    reviewPracticeMode = false; // Reset practice mode
    
    // 2. CRITICAL FIX: Ensure the mode buttons/controls are VISIBLE
    // The empty string resets the style to the element's default (e.g., 'block' or 'flex').
    if (learnModeLabel) learnModeLabel.style.display = '';
    if (difficultyControls) difficultyControls.style.display = '';
    
    // 3. Reset the Learn Panel UI elements
    if (learnInput) {
        learnInput.value = '';
        learnInput.disabled = false;
        learnInput.style.display = ''; // Restore display
        // Remove any stale event listeners
        learnInput.removeEventListener('input', singleTextInputHandler);
        // Keep input field hidden - it's invisible by design
    }
    if (learnFeedback) {
        learnFeedback.textContent = '';
        learnFeedback.className = '';
    }
    if (verseSelector) {
      verseSelector.style.display = 'block';
      verseSelector.style.opacity = '1';
      verseSelector.disabled = false; // Ensure selector is enabled in learn mode
    }
    // Ensure verse selector label is visible in learn mode
    const verseSelectorLabel = document.getElementById('verseSelectorLabel');
    if (verseSelectorLabel) verseSelectorLabel.style.display = '';    // 4. Load the default set of unlearned verses and start basic mode
    loadUnlearnedVerses(); 
    
    // 5. CRITICAL FIX: Ensure the learning mode is set to 'basic' 
    // This overrides any mode set by loadUnlearnedVerses/startLearnMode if needed.
    setLearningStage('basic');
  });

  reviewBtn.addEventListener('click', () => {
    if (showPanel(reviewPanel) !== false) {
      setActiveNavButton(reviewBtn);
      loadVersesForReview();
      loadCollectionsForReview();
      updateReviewBadge();
    }
  });

  // Review Due Verses button handler
  if (reviewDueBtn) {
    reviewDueBtn.addEventListener('click', () => {
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      const now = new Date();
      const dueVerses = verses.filter(v => {
        if (!v || !v.lastReviewed) return false;
        if (!v.dueDate) return true; // Consider verses without dueDate as due
        return new Date(v.dueDate) <= now;
      });

      if (dueVerses.length === 0) {
        alert(t('no_learned_verses'));
        return;
      }

      // If only one verse, start review directly in advanced mode
      if (dueVerses.length === 1) {
        reviewCollectionMode = 'individual';
        reviewVerses = dueVerses;
        reviewSuccessCount = 0;
        currentVerse = dueVerses[0];
        singleTextPrev = [];
        singleTextReviewIndex = 0;
        setLearningStage('advanced');
        setActiveNavButton(null);
        showPanel(learnPanel);
        startLearnMode(currentVerse);
        hideReviewModeControls();
        if (verseSelector) {
          verseSelector.innerHTML = '';
          const opt = document.createElement('option');
          opt.value = 0;
          opt.textContent = `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber}`;
          verseSelector.appendChild(opt);
          verseSelector.style.display = 'block';
          verseSelector.style.opacity = '1';
          verseSelector.disabled = true;
        }
        const verseSelectorLabel = document.getElementById('verseSelectorLabel');
        if (verseSelectorLabel) verseSelectorLabel.style.display = 'none';
        return;
      }

      // Multiple verses - show review mode modal
      const reviewModeModal = document.getElementById('reviewModeModal');
      if (reviewModeModal) {
        reviewModeModal.classList.add('open');
        reviewModeModal.setAttribute('aria-hidden', 'false');

        const individuallyBtn = document.getElementById('reviewIndividuallyBtn');
        const singleTextBtn = document.getElementById('reviewSingleTextBtn');

        // Remove previous listeners
        individuallyBtn.onclick = null;
        singleTextBtn.onclick = null;

        individuallyBtn.onclick = function() {
          reviewModeModal.classList.remove('open');
          reviewModeModal.setAttribute('aria-hidden', 'true');
          
          // Show review order modal
          const reviewOrderModal = document.getElementById('reviewOrderModal');
          if (reviewOrderModal) {
            reviewOrderModal.classList.add('open');
            reviewOrderModal.setAttribute('aria-hidden', 'false');

            const biblicalBtn = document.getElementById('reviewOrderBiblicalBtn');
            const dueDateBtn = document.getElementById('reviewOrderDueDateBtn');
            const randomBtn = document.getElementById('reviewOrderRandomBtn');

            biblicalBtn.onclick = null;
            dueDateBtn.onclick = null;
            randomBtn.onclick = null;

            function startDueReview(sortedList) {
              reviewOrderModal.classList.remove('open');
              reviewOrderModal.setAttribute('aria-hidden', 'true');

              reviewCollectionMode = 'individual';
              reviewVerses = sortedList;
              reviewSuccessCount = 0;
              
              if (verseSelector) {
                verseSelector.innerHTML = '';
                reviewVerses.forEach((v, idx) => {
                  const opt = document.createElement('option');
                  opt.value = idx;
                  opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
                  verseSelector.appendChild(opt);
                });
                verseSelector.selectedIndex = 0;
                verseSelector.style.display = 'block';
                verseSelector.style.opacity = '1';
                verseSelector.disabled = true;
              }
              
              const verseSelectorLabel = document.getElementById('verseSelectorLabel');
              if (verseSelectorLabel) verseSelectorLabel.style.display = 'none';
              
              currentVerse = reviewVerses[0];
              singleTextPrev = [];
              singleTextReviewIndex = 0;
              setLearningStage('advanced');
              setActiveNavButton(null);
              showPanel(learnPanel);
              startLearnMode(currentVerse);
              hideReviewModeControls();
            }

            biblicalBtn.onclick = () => startDueReview(sortVersesByBibleOrder(dueVerses));
            dueDateBtn.onclick = () => startDueReview(sortByDueDate(dueVerses));
            randomBtn.onclick = () => startDueReview(shuffleArray(dueVerses));
          }
        };

        singleTextBtn.onclick = function() {
          reviewModeModal.classList.remove('open');
          reviewModeModal.setAttribute('aria-hidden', 'true');
          // Always sort by Biblical order for single-text review
          const sortedList = sortVersesByBibleOrder(dueVerses);
          startSingleTextReviewSession(sortedList);
        };
      }
    });
  }

  // Event delegation for review verse checkboxes
  if (reviewVerseList) {
    reviewVerseList.addEventListener('change', (e) => {
      if (e.target.classList.contains('verse-checkbox')) {
        updateChangeIntervalButtonVisibility();
      }
    });
  }

  // Change Interval Modal functionality
  function updateIntervalDisplay() {
    intervalValue.textContent = currentInterval;
    const days = calculateDaysFromInterval(currentInterval);
    const lang = localStorage.getItem('languagePreference') || 'english';
    intervalDaysDisplay.textContent = t('review_in_days', lang).replace('{count}', days);
  }

  function calculateDaysFromInterval(interval) {
    // Using same spaced repetition algorithm as the app
    // interval 1 = 1 day, interval 2 = 3 days, interval 3 = 7 days, etc.
    if (interval === 1) return 1;
    if (interval === 2) return 3;
    if (interval === 3) return 7;
    if (interval === 4) return 16;
    if (interval === 5) return 35;
    return Math.round(35 * Math.pow(2, interval - 5));
  }

  if (changeIntervalBtn) {
    changeIntervalBtn.addEventListener('click', () => {
      const selectedVerses = Array.from(document.querySelectorAll('.verse-checkbox:checked'))
        .map(checkbox => JSON.parse(checkbox.dataset.verse));
      if (selectedVerses.length === 0) {
        alert(t('select_verse_to_change_interval'));
        return;
      }
      currentInterval = 1;
      updateIntervalDisplay();
      changeIntervalModal.style.display = 'block';
      changeIntervalModal.classList.add('open');
      changeIntervalModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (intervalUpBtn) {
    intervalUpBtn.addEventListener('click', () => {
      if (currentInterval < 20) { // Reasonable max
        currentInterval++;
        updateIntervalDisplay();
      }
    });
  }

  if (intervalDownBtn) {
    intervalDownBtn.addEventListener('click', () => {
      if (currentInterval > 1) {
        currentInterval--;
        updateIntervalDisplay();
      }
    });
  }

  if (intervalConfirmBtn) {
    intervalConfirmBtn.addEventListener('click', () => {
      // Get selected verses
      const checkboxes = reviewVerseList.querySelectorAll('.verse-checkbox:checked');
      if (checkboxes.length === 0) {
        changeIntervalModal.style.display = 'none';
        changeIntervalModal.classList.remove('open');
        changeIntervalModal.setAttribute('aria-hidden', 'true');
        return;
      }

      // Update intervals for selected verses
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      let updateCount = 0;

      checkboxes.forEach(checkbox => {
        try {
          const verseData = JSON.parse(checkbox.dataset.verse);
          const verseIndex = verses.findIndex(v => 
            v.bookName === verseData.bookName &&
            v.chapterNumber === verseData.chapterNumber &&
            v.verseNumber === verseData.verseNumber
          );

          if (verseIndex !== -1) {
            verses[verseIndex].interval = currentInterval;
            verses[verseIndex].repetitions = currentInterval;
            
            // Calculate new due date
            const days = calculateDaysFromInterval(currentInterval);
            const newDueDate = new Date();
            newDueDate.setDate(newDueDate.getDate() + days);
            verses[verseIndex].dueDate = newDueDate.toISOString();
            
            updateCount++;
          }
        } catch (e) {
          console.error('Error updating verse interval:', e);
        }
      });

      // Save updated verses
      localStorage.setItem('verses', JSON.stringify(verses));

      // Close modal and refresh
      changeIntervalModal.style.display = 'none';
      changeIntervalModal.classList.remove('open');
      changeIntervalModal.setAttribute('aria-hidden', 'true');

      // Uncheck all boxes and refresh list
      checkboxes.forEach(cb => cb.checked = false);
      loadVersesForReview();
      updateReviewBadge();
      updateChangeIntervalButtonVisibility();
    });
  }

  if (intervalCancelBtn) {
    intervalCancelBtn.addEventListener('click', () => {
      changeIntervalModal.style.display = 'none';
      changeIntervalModal.classList.remove('open');
      changeIntervalModal.setAttribute('aria-hidden', 'true');
    });
  }

  exportBtn.addEventListener('click', () => {
    if (showPanel(exportImportPanel) !== false) {
      setActiveNavButton(exportBtn);
      // Populate export collections tree with available collections
      try {
      if (exportCollectionsList) {
        exportCollectionsList.innerHTML = '';
        const cols = getCollections();
        const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        
        // Add each collection as a checkbox
        cols.forEach(c => {
          const item = document.createElement('div');
          item.className = 'tree-item';
          const label = document.createElement('label');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'export-collection-checkbox';
          checkbox.dataset.collectionId = c.id;
          checkbox.checked = true;
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(` ${c.title} (${(c.verseIds || []).length} verses)`));
          item.appendChild(label);
          exportCollectionsList.appendChild(item);
        });
        
        // Add "Not in a collection" option
        const collectedIds = new Set();
        cols.forEach(c => (c.verseIds || []).forEach(id => collectedIds.add(id)));
        const uncollectedCount = allVerses.filter(v => !collectedIds.has(v.id)).length;
        
        const uncollectedItem = document.createElement('div');
        uncollectedItem.className = 'tree-item';
        const uncollectedLabel = document.createElement('label');
        const uncollectedCheckbox = document.createElement('input');
        uncollectedCheckbox.type = 'checkbox';
        uncollectedCheckbox.className = 'export-collection-checkbox';
        uncollectedCheckbox.dataset.collectionId = '__uncollected__';
        uncollectedCheckbox.checked = true;
        uncollectedLabel.appendChild(uncollectedCheckbox);
        uncollectedLabel.appendChild(document.createTextNode(` ${t('not_in_collection')} (${uncollectedCount} ${t('verses')})`));
        uncollectedItem.appendChild(uncollectedLabel);
        exportCollectionsList.appendChild(uncollectedItem);
        
        // Wire master checkbox
        if (exportAllVerses) {
          exportAllVerses.checked = true;
          exportAllVerses.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.export-collection-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
          });
        }
        
        // Wire child checkboxes to update master if needed
        const childCheckboxes = document.querySelectorAll('.export-collection-checkbox');
        childCheckboxes.forEach(cb => {
          cb.addEventListener('change', () => {
            if (exportAllVerses) {
              const allChecked = Array.from(childCheckboxes).every(c => c.checked);
              exportAllVerses.checked = allChecked;
            }
          });
        });
      }
    } catch(e) { /* ignore */ }
    }
  });

  // Export/Import Functions
  downloadBtn.addEventListener('click', () => {
    const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
    const cols = getCollections();

    // Determine selected collection IDs from checkboxes
    const selectedCheckboxes = Array.from(document.querySelectorAll('.export-collection-checkbox:checked') || []);
    const selectedColIds = selectedCheckboxes.map(cb => cb.dataset.collectionId).filter(Boolean);
    const includeUncollected = selectedColIds.includes('__uncollected__');
    const actualColIds = selectedColIds.filter(id => id !== '__uncollected__');

    // Build verse set based on selections
    let versesToExport;
    if (selectedCheckboxes.length === 0) {
      // Nothing selected - export nothing (or could default to all)
      versesToExport = [];
    } else {
      const verseIdSet = new Set();
      
      // Add verses from selected collections
      if (actualColIds.length > 0) {
        cols.filter(c => actualColIds.includes(c.id)).forEach(c => {
          (c.verseIds || []).forEach(id => verseIdSet.add(id));
        });
      }
      
      // Add uncollected verses if checked
      if (includeUncollected) {
        const collectedIds = new Set();
        cols.forEach(c => (c.verseIds || []).forEach(id => collectedIds.add(id)));
        allVerses.filter(v => !collectedIds.has(v.id)).forEach(v => verseIdSet.add(v.id));
      }
      
      versesToExport = allVerses.filter(v => verseIdSet.has(v.id));
    }

    // Optionally strip review fields
    const includeReview = exportIncludeReview ? !!exportIncludeReview.checked : true;
    const cleaned = versesToExport.map(v => {
      const o = { ...v };
      if (!includeReview) {
        delete o.lastReviewed;
        delete o.interval;
        delete o.repetitions;
        delete o.dueDate;
      }
      return o;
    });
    // Optionally include collection data (titles and verse order as refs)
    const includeCollections = exportIncludeCollections ? !!exportIncludeCollections.checked : false;
    let payload = cleaned;
    if (includeCollections) {
      // Determine which collections to include: only selected actual collections (not uncollected)
      let includeCols;
      if (actualColIds.length === 0) includeCols = cols;
      else includeCols = cols.filter(c => actualColIds.includes(c.id));

      const idToVerse = new Map(allVerses.map(v => [v.id, v]));
      const collectionsExport = includeCols.map(c => {
        const verseRefs = (c.verseIds || [])
          .map(id => idToVerse.get(id))
          .filter(Boolean)
          .map(v => ({ bookName: v.bookName, chapterNumber: v.chapterNumber, verseNumber: v.verseNumber }));
        return { title: c.title, verseRefs };
      });
      payload = {
        type: 'cbm-export',
        version: 2,
        generatedAt: new Date().toISOString(),
        verses: cleaned,
        collections: collectionsExport
      };
    }

    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bible-verses.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Update file name display when file is selected
  importFile.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      importFileName.textContent = e.target.files[0].name;
    } else {
      importFileName.textContent = t('no_file_selected');
    }
  });

  importDataBtn.addEventListener('click', () => {
    const file = importFile.files[0];
    if (!file) {
      alert(t('select_file_to_import'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const importedVerses = Array.isArray(parsed) ? parsed : (parsed.verses || []);
        const importedCollections = Array.isArray(parsed) ? [] : (parsed.collections || []);
        const currentVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        const shouldImportReview = importIncludeReview ? !!importIncludeReview.checked : true;
        
        // Merge verses, avoiding duplicates
        const mergedVerses = [...currentVerses];
        importedVerses.forEach(importedVerse => {
          const iv = { ...importedVerse };
          if (!shouldImportReview) {
            delete iv.lastReviewed;
            delete iv.interval;
            delete iv.repetitions;
            delete iv.dueDate;
          }
          
          // Find if this verse already exists
          const existingVerseIndex = currentVerses.findIndex(v => 
            v.bookName === importedVerse.bookName &&
            v.chapterNumber === importedVerse.chapterNumber &&
            v.verseNumber === importedVerse.verseNumber
          );
          
          if (existingVerseIndex !== -1) {
            // Verse exists - check which has more recent review data
            const existingVerse = currentVerses[existingVerseIndex];
            const existingReviewDate = existingVerse.lastReviewed ? new Date(existingVerse.lastReviewed) : null;
            const importedReviewDate = iv.lastReviewed ? new Date(iv.lastReviewed) : null;
            
            // Replace with imported verse if it has more recent review data
            if (importedReviewDate && (!existingReviewDate || importedReviewDate > existingReviewDate)) {
              mergedVerses[existingVerseIndex] = iv;
            }
            // Otherwise keep existing verse (already in mergedVerses)
          } else {
            // New verse - add it
            mergedVerses.push(iv);
          }
        });

        // Save verses first so collection mapping can find ids
        localStorage.setItem('verses', JSON.stringify(mergedVerses));

        // Optionally import collection data by title and verse refs
        const shouldImportCollections = importIncludeCollections ? !!importIncludeCollections.checked : true;
        if (shouldImportCollections && importedCollections && importedCollections.length > 0) {
          const cols = getCollections();
          // Build lookup from verse ref -> id
          const allNow = JSON.parse(localStorage.getItem('verses') || '[]');
          function findIdByRef(ref) {
            const v = allNow.find(x => x.bookName === ref.bookName && String(x.chapterNumber) === String(ref.chapterNumber) && String(x.verseNumber) === String(ref.verseNumber));
            return v ? v.id : null;
          }

          importedCollections.forEach(ic => {
            const ids = (ic.verseRefs || []).map(findIdByRef).filter(Boolean);
            if (ids.length === 0) return; // nothing resolvable
            // find existing by title
            const existing = cols.find(c => c.title === ic.title);
            if (!existing) {
              cols.push({ id: Date.now().toString() + Math.random().toString(36).slice(2,8), title: ic.title, verseIds: ids });
            } else {
              // Merge while preserving imported order at front and keeping unique ids
              const set = new Set();
              const merged = [];
              ids.forEach(id => { if (!set.has(id)) { set.add(id); merged.push(id); } });
              (existing.verseIds || []).forEach(id => { if (!set.has(id)) { set.add(id); merged.push(id); } });
              existing.verseIds = merged;
            }
          });
          saveCollections(cols);
        }

        alert(t('import_successful'));
        loadVersesForEdit();
        updateReviewBadge();
      } catch (error) {
        alert(t('error_importing') + ': ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // Collections event wiring
  if (collectionsBtn) {
    collectionsBtn.addEventListener('click', () => {
      if (showPanel(collectionsPanel) !== false) {
        setActiveNavButton(collectionsBtn);
        renderCollectionsList();
        populateCollectionSelector();
        collectionDetail.style.display = 'none';
      }
    });
  }

  if (createCollectionBtn) {
    createCollectionBtn.addEventListener('click', () => {
      const title = (newCollectionTitle.value || '').trim();
      if (!title) { alert(t('enter_title')); return; }
      const cols = getCollections();
      cols.push({ id: Date.now().toString(), title, verseIds: [] });
      saveCollections(cols);
      newCollectionTitle.value = '';
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
    });
  }

  if (addToCollectionBtn) {
    addToCollectionBtn.addEventListener('click', () => {
      const title = collectionDetailTitle.textContent;
      const cols = getCollections();
      const col = cols.find(c => c.title === title);
      if (!col) { alert(t('select_collection_msg')); return; }
      const vid = addVerseToCollection.value;
      if (!vid) return;
      col.verseIds = col.verseIds || [];
      if (!col.verseIds.includes(vid)) col.verseIds.push(vid);
      saveCollections(cols);
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
      renderCollectionVerses(col);
    });
  }

  // (reviewCollectionBtn is handled earlier using the modal-based selector)

  // Bulk actions (Add selected / Delete selected) from the Add Verse panel
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      const checked = Array.from(document.querySelectorAll('.add-verse-checkbox:checked'));
      if (checked.length === 0) { alert(t('select_at_least_one')); return; }
      if (!confirm(t('delete_count_confirmation').replace('{count}', checked.length))) return;
      const ids = checked.map(cb => cb.dataset.verseId);
      let verses = JSON.parse(localStorage.getItem('verses') || '[]');
      verses = verses.filter(v => !ids.includes(v.id));
      localStorage.setItem('verses', JSON.stringify(verses));
      loadVersesForEdit();
      updateReviewBadge();
      renderCollectionsList();
      populateCollectionSelector();
      if (bulkActions) bulkActions.style.display = 'none';
    });
  }

  if (bulkAddToCollectionBtn) {
    bulkAddToCollectionBtn.addEventListener('click', () => {
      // open modal and populate collections
      populateCollectionSelector();
      if (bulkAddModal) bulkAddModal.style.display = 'block';
      if (bulkAddModal) bulkAddModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (bulkAddCollectionSelect) {
    bulkAddCollectionSelect.addEventListener('change', () => {
      if (!bulkCreateNew) return;
      if (bulkAddCollectionSelect.value === 'create_new') bulkCreateNew.style.display = 'block';
      else bulkCreateNew.style.display = 'none';
    });
  }

  if (bulkAddCancelBtn) {
    bulkAddCancelBtn.addEventListener('click', () => {
      if (bulkAddModal) { bulkAddModal.style.display = 'none'; bulkAddModal.setAttribute('aria-hidden', 'true'); }
      if (bulkNewCollectionName) bulkNewCollectionName.value = '';
    });
  }

  if (bulkAddConfirmBtn) {
    bulkAddConfirmBtn.addEventListener('click', () => {
      const checked = Array.from(document.querySelectorAll('.add-verse-checkbox:checked'));
      if (checked.length === 0) { alert(t('select_at_least_one')); return; }
      let chosen = bulkAddCollectionSelect ? bulkAddCollectionSelect.value : '';
      let cols = getCollections();
      if (!chosen) { alert(t('select_or_create_collection')); return; }
      if (chosen === 'create_new') {
        const name = (bulkNewCollectionName && bulkNewCollectionName.value || '').trim();
        if (!name) { alert(t('enter_collection_name')); return; }
        const newCol = { id: Date.now().toString(), title: name, verseIds: [] };
        cols.push(newCol);
        chosen = newCol.id;
      }
      const col = cols.find(c => c.id === chosen);
      if (!col) { alert(t('collection_not_found')); return; }
      col.verseIds = col.verseIds || [];
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      checked.forEach(cb => {
        const vid = cb.dataset.verseId;
        if (!col.verseIds.includes(vid)) col.verseIds.push(vid);
      });
      saveCollections(cols);
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
      if (bulkAddModal) { bulkAddModal.style.display = 'none'; bulkAddModal.setAttribute('aria-hidden', 'true'); }
      if (bulkNewCollectionName) bulkNewCollectionName.value = '';
      if (bulkActions) bulkActions.style.display = 'none';
      loadVersesForEdit();
      alert(t('verses_added_to_collection'));
    });
  }

  // Setup input scroll behavior for mobile keyboards
  // Track scroll position to prevent iOS aggressive centering
  let savedScrollY = 0;
  
  window.addEventListener('scroll', () => {
    savedScrollY = window.scrollY;
  });
  
  function setupInputScrollBehavior() {
    const inputs = document.querySelectorAll('#addVersePanel input, #addVersePanel textarea');
    
    inputs.forEach(input => {
      input.addEventListener('focus', (e) => {
        // Prevent iOS default centering by maintaining current scroll position
        const targetScrollY = savedScrollY;
        
        // Small delay to override iOS behavior
        setTimeout(() => {
          window.scrollTo(0, targetScrollY);
        }, 0);
        
        // Additional check after keyboard animation
        setTimeout(() => {
          const element = e.target;
          const rect = element.getBoundingClientRect();
          
          // Only scroll if the input is not visible above keyboard
          // Assume keyboard takes up bottom ~40% of viewport
          const keyboardTop = window.innerHeight * 0.6;
          
          if (rect.bottom > keyboardTop) {
            // Scroll just enough to show the input above keyboard with padding
            const overflow = rect.bottom - keyboardTop + 20;
            window.scrollTo(0, window.scrollY + overflow);
          } else if (rect.top < 0) {
            // If input is above viewport, scroll it into view at top
            window.scrollTo(0, window.scrollY + rect.top - 20);
          }
        }, 300);
      });
    });
  }

  setupInputScrollBehavior();

  // Onboarding Flow for First-Time Users
  const onboardingLanguageModal = document.getElementById('onboardingLanguageModal');
  const onboardingInstallModal = document.getElementById('onboardingInstallModal');
  const onboardingInstallTitle = document.getElementById('onboardingInstallTitle');
  const onboardingInstallInstructions = document.getElementById('onboardingInstallInstructions');
  const onboardingInstallSkip = document.getElementById('onboardingInstallSkip');
  const onboardingInputMethodModal = document.getElementById('onboardingInputMethodModal');
  const onboardingInputMethodTitle = document.getElementById('onboardingInputMethodTitle');

  const inputMethodTitles = {
    english: 'Choose Input Method',
    simplified: '选择输入法',
    traditional: '選擇輸入法'
  };

  function showOnboardingLanguageModal() {
    onboardingLanguageModal.style.display = 'block';
    onboardingLanguageModal.classList.add('open');
    onboardingLanguageModal.setAttribute('aria-hidden', 'false');
  }

  function hideOnboardingLanguageModal() {
    onboardingLanguageModal.style.display = 'none';
    onboardingLanguageModal.classList.remove('open');
    onboardingLanguageModal.setAttribute('aria-hidden', 'true');
  }

  // Check if app is running in standalone mode (already installed)
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  // Detect platform for installation instructions
  function detectPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // iOS Safari
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'ios_safari';
    }
    
    // Android Chrome
    if (/android/i.test(userAgent)) {
      return 'android_chrome';
    }
    
    // Desktop (Windows, Mac, Linux)
    if (!/mobile/i.test(userAgent)) {
      return 'desktop';
    }
    
    // Fallback for other browsers/devices
    return 'browser_generic';
  }

  function showOnboardingInstallModal(language) {
    const platform = detectPlatform();
    
    // Update title and button text
    onboardingInstallTitle.textContent = t('install_app_title', language);
    onboardingInstallSkip.textContent = t('skip', language);
    
    // Set instructions based on detected platform
    onboardingInstallInstructions.innerHTML = t(`install_${platform}`, language);
    
    // Show modal
    onboardingInstallModal.style.display = 'block';
    onboardingInstallModal.classList.add('open');
    onboardingInstallModal.setAttribute('aria-hidden', 'false');
  }

  function hideOnboardingInstallModal() {
    onboardingInstallModal.style.display = 'none';
    onboardingInstallModal.classList.remove('open');
    onboardingInstallModal.setAttribute('aria-hidden', 'true');
  }

  function showOnboardingInputMethodModal(language) {
    // Set the title based on language
    onboardingInputMethodTitle.textContent = inputMethodTitles[language];
    
    // Apply translations to the buttons
    applyLanguage(language);
    
    onboardingInputMethodModal.style.display = 'block';
    onboardingInputMethodModal.classList.add('open');
    onboardingInputMethodModal.setAttribute('aria-hidden', 'false');
  }

  function hideOnboardingInputMethodModal() {
    onboardingInputMethodModal.style.display = 'none';
    onboardingInputMethodModal.classList.remove('open');
    onboardingInputMethodModal.setAttribute('aria-hidden', 'true');
  }

  async function loadSampleVerses(inputMethod) {
    const language = localStorage.getItem('languagePreference') || 'english';
    
    // Map input method and language to sample file
    let fileName;
    if (inputMethod === 'pinyin') {
      // For pinyin, use language-specific samples
      if (language === 'traditional') {
        fileName = 'PY-Samples-zht.json';
      } else {
        // Use simplified for both 'simplified' and 'english' language settings
        fileName = 'PY-Samples-zhs.json';
      }
    } else if (inputMethod === 'zhuyin') {
      fileName = 'ZY-Samples.json';
    } else if (inputMethod === 'cangjie') {
      fileName = 'CJ-Samples.json';
    }

    if (!fileName) return;

    try {
      const response = await fetch(fileName);
      const data = await response.json();

      if (data.verses && data.verses.length > 0) {
        // Import verses
        const currentVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        const mergedVerses = [...currentVerses, ...data.verses];
        localStorage.setItem('verses', JSON.stringify(mergedVerses));
      }

      if (data.collections && data.collections.length > 0) {
        // Import collections
        const currentCollections = getCollections();
        
        // Build lookup from verse ref -> id
        const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        function findIdByRef(ref) {
          const v = allVerses.find(x => 
            x.bookName === ref.bookName && 
            String(x.chapterNumber) === String(ref.chapterNumber) && 
            String(x.verseNumber) === String(ref.verseNumber)
          );
          return v ? v.id : null;
        }

        data.collections.forEach(ic => {
          const ids = (ic.verseRefs || []).map(findIdByRef).filter(Boolean);
          if (ids.length > 0) {
            currentCollections.push({
              id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
              title: ic.title,
              verseIds: ids
            });
          }
        });
        
        saveCollections(currentCollections);
      }
    } catch (error) {
      console.error('Error loading sample verses:', error);
    }
  }

  // Language selection handlers
  document.getElementById('onboardingLangEnglish').addEventListener('click', () => {
    localStorage.setItem('languagePreference', 'english');
    hideOnboardingLanguageModal();
    
    // Check if app is already installed (standalone mode)
    if (isStandalone()) {
      // Skip install modal, go directly to input method
      showOnboardingInputMethodModal('english');
    } else {
      // Show install instructions
      showOnboardingInstallModal('english');
    }
  });

  document.getElementById('onboardingLangSimplified').addEventListener('click', () => {
    localStorage.setItem('languagePreference', 'simplified');
    hideOnboardingLanguageModal();
    
    // Check if app is already installed (standalone mode)
    if (isStandalone()) {
      // Skip install modal, go directly to input method
      showOnboardingInputMethodModal('simplified');
    } else {
      // Show install instructions
      showOnboardingInstallModal('simplified');
    }
  });

  document.getElementById('onboardingLangTraditional').addEventListener('click', () => {
    localStorage.setItem('languagePreference', 'traditional');
    hideOnboardingLanguageModal();
    
    // Check if app is already installed (standalone mode)
    if (isStandalone()) {
      // Skip install modal, go directly to input method
      showOnboardingInputMethodModal('traditional');
    } else {
      // Show install instructions
      showOnboardingInstallModal('traditional');
    }
  });

  // Install modal button handlers
  onboardingInstallSkip.addEventListener('click', () => {
    const language = localStorage.getItem('languagePreference') || 'english';
    hideOnboardingInstallModal();
    showOnboardingInputMethodModal(language);
  });

  // Input method selection handlers
  document.getElementById('onboardingInputPinyin').addEventListener('click', async () => {
    localStorage.setItem('inputMethod', 'pinyin');
    
    // Set book name charset based on language: if simplified/traditional use that, otherwise Pinyin defaults to simplified
    const language = localStorage.getItem('languagePreference') || 'english';
    const charset = language === 'traditional' ? 'traditional' : 'simplified';
    localStorage.setItem('bookNameCharset', charset);
    rebuildBibleBooks();
    
    hideOnboardingInputMethodModal();
    await loadSampleVerses('pinyin');
    updateInputMethodLabels();
    applyLanguage();
    localStorage.setItem('hasVisitedBefore', 'true');
    
    // Show backup reminder on first visit
    const now = new Date().getTime();
    localStorage.setItem('firstBackupReminder', now.toString());
    localStorage.setItem('lastBackupReminder', now.toString());
    showBackupReminderModal(true); // true = onboarding mode, hides Export Now button
    
    // After user dismisses backup reminder, show tutorial intro
    const onModalClose = () => {
      showTutorialIntroModal();
    };
    
    // Update event listeners to call onModalClose
    backupReminderGotItBtn.removeEventListener('click', hideBackupReminderModal);
    backupReminderGotItBtn.addEventListener('click', () => {
      hideBackupReminderModal();
      onModalClose();
    }, { once: true });
    
    backupReminderExportBtn.removeEventListener('click', hideBackupReminderModal);
    backupReminderExportBtn.addEventListener('click', () => {
      hideBackupReminderModal();
      showPanel(exportImportPanel);
    }, { once: true });
  });

  document.getElementById('onboardingInputZhuyin').addEventListener('click', async () => {
    localStorage.setItem('inputMethod', 'zhuyin');
    
    // Set book name charset based on language: if simplified use that, otherwise Zhuyin defaults to traditional
    const language = localStorage.getItem('languagePreference') || 'english';
    const charset = language === 'simplified' ? 'simplified' : 'traditional';
    localStorage.setItem('bookNameCharset', charset);
    rebuildBibleBooks();
    
    hideOnboardingInputMethodModal();
    await loadSampleVerses('zhuyin');
    updateInputMethodLabels();
    applyLanguage();
    localStorage.setItem('hasVisitedBefore', 'true');
    
    // Show backup reminder on first visit
    const now = new Date().getTime();
    localStorage.setItem('firstBackupReminder', now.toString());
    localStorage.setItem('lastBackupReminder', now.toString());
    showBackupReminderModal(true); // true = onboarding mode, hides Export Now button
    
    // After user dismisses backup reminder, show tutorial intro
    const onModalClose = () => {
      showTutorialIntroModal();
    };
    
    // Update event listeners to call onModalClose
    backupReminderGotItBtn.removeEventListener('click', hideBackupReminderModal);
    backupReminderGotItBtn.addEventListener('click', () => {
      hideBackupReminderModal();
      onModalClose();
    }, { once: true });
    
    backupReminderExportBtn.removeEventListener('click', hideBackupReminderModal);
    backupReminderExportBtn.addEventListener('click', () => {
      hideBackupReminderModal();
      showPanel(exportImportPanel);
    }, { once: true });
  });

  document.getElementById('onboardingInputCangjie').addEventListener('click', async () => {
    localStorage.setItem('inputMethod', 'cangjie');
    
    // Set book name charset based on language: if simplified use that, otherwise Cangjie defaults to traditional
    const language = localStorage.getItem('languagePreference') || 'english';
    const charset = language === 'simplified' ? 'simplified' : 'traditional';
    localStorage.setItem('bookNameCharset', charset);
    rebuildBibleBooks();
    
    hideOnboardingInputMethodModal();
    await loadSampleVerses('cangjie');
    updateInputMethodLabels();
    applyLanguage();
    localStorage.setItem('hasVisitedBefore', 'true');
    
    // Show backup reminder on first visit
    const now = new Date().getTime();
    localStorage.setItem('firstBackupReminder', now.toString());
    localStorage.setItem('lastBackupReminder', now.toString());
    showBackupReminderModal(true); // true = onboarding mode, hides Export Now button
    
    // After user dismisses backup reminder, show tutorial intro
    const onModalClose = () => {
      showTutorialIntroModal();
    };
    
    // Update event listeners to call onModalClose
    backupReminderGotItBtn.removeEventListener('click', hideBackupReminderModal);
    backupReminderGotItBtn.addEventListener('click', () => {
      hideBackupReminderModal();
      onModalClose();
    }, { once: true });
    
    backupReminderExportBtn.removeEventListener('click', hideBackupReminderModal);
    backupReminderExportBtn.addEventListener('click', () => {
      hideBackupReminderModal();
      showPanel(exportImportPanel);
    }, { once: true });
  });

  // Check if first time user and show onboarding (must be at end after all initialization)
  function checkFirstTimeUser() {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore) {
      // First time user - show onboarding flow
      showOnboardingLanguageModal();
    } else {
      // Check if we should show backup reminder
      checkBackupReminder();
    }
  }
  
  // Backup Reminder Functions
  function showBackupReminderModal(isOnboarding = false) {
    if (!backupReminderModal) return;
    backupReminderModal.style.display = 'flex';
    backupReminderModal.classList.add('open');
    backupReminderModal.setAttribute('aria-hidden', 'false');
    
    // Show/hide "Export Now" button based on context
    if (backupReminderExportBtn) {
      backupReminderExportBtn.style.display = isOnboarding ? 'none' : 'inline-block';
    }
  }
  
  function hideBackupReminderModal() {
    if (!backupReminderModal) return;
    backupReminderModal.style.display = 'none';
    backupReminderModal.classList.remove('open');
    backupReminderModal.setAttribute('aria-hidden', 'true');
    
    // Reset "Export Now" button to hidden (default state)
    if (backupReminderExportBtn) {
      backupReminderExportBtn.style.display = 'none';
    }
  }
  
  function checkBackupReminder() {
    const isEnabled = localStorage.getItem('backupReminderEnabled');
    // Default to enabled if not set
    if (isEnabled === 'false') return;
    
    const lastReminder = localStorage.getItem('lastBackupReminder');
    const now = new Date().getTime();
    
    if (!lastReminder) {
      // Never shown before - show it now
      showBackupReminderModal();
      localStorage.setItem('lastBackupReminder', now.toString());
      return;
    }
    
    const daysSinceLastReminder = (now - parseInt(lastReminder)) / (1000 * 60 * 60 * 24);
    const firstReminderDate = parseInt(localStorage.getItem('firstBackupReminder') || lastReminder);
    const daysSinceFirstReminder = (now - firstReminderDate) / (1000 * 60 * 60 * 24);
    
    // Show weekly for first 30 days, then monthly
    const reminderInterval = daysSinceFirstReminder < 30 ? 7 : 30;
    
    if (daysSinceLastReminder >= reminderInterval) {
      showBackupReminderModal();
      localStorage.setItem('lastBackupReminder', now.toString());
    }
  }
  
  // Tutorial Modal Functions
  let tutorialAnimationInterval = null;
  
  function showTutorialIntroModal() {
    console.log('=== TUTORIAL MODAL DEBUG ===');
    console.log('Current Settings:');
    console.log('  Language:', localStorage.getItem('languagePreference') || 'english');
    console.log('  Input Method:', localStorage.getItem('inputMethod') || 'pinyin');
    console.log('  Character Set (Books):', localStorage.getItem('bookNameCharset') || 'simplified');
    console.log('==========================');
    
    // Stop any running tutorial animations
    if (tutorialAnimationInterval) {
      console.log('Stopping existing tutorial animation...');
      clearInterval(tutorialAnimationInterval);
      tutorialAnimationInterval = null;
    }
    
    tutorialIntroModal.style.display = 'block';
    tutorialIntroModal.classList.add('open');
    tutorialIntroModal.setAttribute('aria-hidden', 'false');
  }
  
  function hideTutorialIntroModal() {
    tutorialIntroModal.style.display = 'none';
    tutorialIntroModal.classList.remove('open');
    tutorialIntroModal.setAttribute('aria-hidden', 'true');
  }
  
  // Get keystroke mappings for the selected input method
  function getTutorialKeystrokes() {
    const inputMethod = localStorage.getItem('inputMethod') || 'pinyin';
    const keyMappings = {
      'pinyin': ['y', 'h', 'h', 'y', 'e', 'h'],
      'zhuyin': ['ㄧ', 'ㄏ', 'ㄏ', 'ㄧ', 'ㄣ', 'ㄏ'],
      'cangjie': ['尸', '竹', '廿', '大', '田', '十']
    };
    const keys = keyMappings[inputMethod] || keyMappings['pinyin'];
    
    console.log('Tutorial Keystrokes:');
    console.log('  Input Method:', inputMethod);
    console.log('  Keys:', keys);
    
    return keys;
  }
  
  function startTutorialAnimation(stage) {
    console.log(`--- Starting ${stage} Animation ---`);
    
    // Stop any existing animation
    if (tutorialAnimationInterval) {
      clearInterval(tutorialAnimationInterval);
    }
    
    const chars = document.querySelectorAll(`#tutorial${stage}Chars .tutorial-char`);
    const keysContainer = document.getElementById(`tutorial${stage}Keys`);
    const keystrokes = getTutorialKeystrokes();
    
    console.log(`${stage} Animation Setup:`);
    console.log('  Chinese Characters:', Array.from(chars).map(c => c.textContent));
    console.log('  Keys Container:', keysContainer ? 'Found' : 'NOT FOUND');
    console.log('  Number of chars:', chars.length);
    console.log('  Number of keystrokes:', keystrokes.length);
    
    let currentIndex = 0;
    
    function animateStep() {
      console.log(`  Resetting animation for ${stage} stage...`);
      
      // Reset all characters
      chars.forEach((char, idx) => {
        if (stage === 'Basic') {
          char.classList.remove('tutorial-typed');
          char.classList.remove('tutorial-hidden');
          console.log(`    Char ${idx} (${char.textContent}): visible, not typed`);
        } else if (stage === 'Intermediate') {
          char.classList.remove('tutorial-typed');
          if (idx % 2 === 1) {
            char.classList.add('tutorial-hidden');
            console.log(`    Char ${idx} (${char.textContent}): HIDDEN`);
          } else {
            char.classList.remove('tutorial-hidden');
            console.log(`    Char ${idx} (${char.textContent}): visible, not typed`);
          }
        } else if (stage === 'Advanced') {
          char.classList.remove('tutorial-typed');
          char.classList.add('tutorial-hidden');
          console.log(`    Char ${idx} (${char.textContent}): HIDDEN`);
        }
      });
      
      // Clear and setup keystrokes (all present but hidden) in table cells
      const keyCells = keysContainer.querySelectorAll('td');
      keyCells.forEach((cell, idx) => {
        cell.innerHTML = '';
        if (idx < keystrokes.length) {
          const keySpan = document.createElement('span');
          keySpan.textContent = keystrokes[idx];
          cell.appendChild(keySpan);
          console.log(`    Key ${idx}: ${keystrokes[idx]} (added as hidden)`);
        }
      });
      const keySpans = keysContainer.querySelectorAll('span');
      
      currentIndex = 0;
      
      // Animate typing - store in global variable so it can be stopped
      tutorialAnimationInterval = setInterval(() => {
        if (currentIndex >= chars.length) {
          console.log(`  Animation complete for ${stage}, restarting in 1s...`);
          clearInterval(tutorialAnimationInterval);
          // Wait 1 second before restarting the animation loop
          tutorialAnimationInterval = setTimeout(() => {
            animateStep();
          }, 1000);
          return;
        }
        
        console.log(`  Step ${currentIndex}: Show key[${keystrokes[currentIndex]}], reveal char[${chars[currentIndex].textContent}]`);
        
        // Show keystroke
        keySpans[currentIndex].classList.add('visible');
        
        // Reveal character and mark as typed
        chars[currentIndex].classList.remove('tutorial-hidden');
        chars[currentIndex].classList.add('tutorial-typed');
        
        currentIndex++;
      }, 500);
    }
    
    animateStep();
  }
  
  function showTutorialBasicModal() {
    tutorialBasicModal.style.display = 'block';
    tutorialBasicModal.classList.add('open');
    tutorialBasicModal.setAttribute('aria-hidden', 'false');
    startTutorialAnimation('Basic');
  }
  
  function hideTutorialBasicModal() {
    tutorialBasicModal.style.display = 'none';
    tutorialBasicModal.classList.remove('open');
    tutorialBasicModal.setAttribute('aria-hidden', 'true');
    if (tutorialAnimationInterval) {
      clearInterval(tutorialAnimationInterval);
      tutorialAnimationInterval = null;
    }
  }
  
  function showTutorialIntermediateModal() {
    tutorialIntermediateModal.style.display = 'block';
    tutorialIntermediateModal.classList.add('open');
    tutorialIntermediateModal.setAttribute('aria-hidden', 'false');
    startTutorialAnimation('Intermediate');
  }
  
  function hideTutorialIntermediateModal() {
    tutorialIntermediateModal.style.display = 'none';
    tutorialIntermediateModal.classList.remove('open');
    tutorialIntermediateModal.setAttribute('aria-hidden', 'true');
    if (tutorialAnimationInterval) {
      clearInterval(tutorialAnimationInterval);
      tutorialAnimationInterval = null;
    }
  }
  
  function showTutorialAdvancedModal() {
    tutorialAdvancedModal.style.display = 'block';
    tutorialAdvancedModal.classList.add('open');
    tutorialAdvancedModal.setAttribute('aria-hidden', 'false');
    startTutorialAnimation('Advanced');
  }
  
  function hideTutorialAdvancedModal() {
    tutorialAdvancedModal.style.display = 'none';
    tutorialAdvancedModal.classList.remove('open');
    tutorialAdvancedModal.setAttribute('aria-hidden', 'true');
    if (tutorialAnimationInterval) {
      clearInterval(tutorialAnimationInterval);
      tutorialAnimationInterval = null;
    }
  }
  
  // Tutorial Event Listeners
  if (tutorialIntroStart) {
    tutorialIntroStart.addEventListener('click', () => {
      hideTutorialIntroModal();
      showTutorialBasicModal();
    });
  }
  
  if (tutorialIntroSkip) {
    tutorialIntroSkip.addEventListener('click', () => {
      hideTutorialIntroModal();
      localStorage.setItem('hasCompletedOnboarding', 'true');
      showPanel(learnPanel);
      const unlearnedList = populateUnlearnedSelector();
      if (unlearnedList && unlearnedList.length > 0) {
        startLearnMode(unlearnedList[0]);
        setLearningStage('basic');
      }
    });
  }
  
  if (tutorialBasicContinue) {
    tutorialBasicContinue.addEventListener('click', () => {
      hideTutorialBasicModal();
      showTutorialIntermediateModal();
    });
  }
  
  if (tutorialIntermediateContinue) {
    tutorialIntermediateContinue.addEventListener('click', () => {
      hideTutorialIntermediateModal();
      showTutorialAdvancedModal();
    });
  }
  
  if (tutorialAdvancedBegin) {
    tutorialAdvancedBegin.addEventListener('click', () => {
      hideTutorialAdvancedModal();
      localStorage.setItem('hasCompletedOnboarding', 'true');
      showPanel(learnPanel);
      setActiveNavButton(learnBtn);
      const unlearnedList = populateUnlearnedSelector();
      if (unlearnedList && unlearnedList.length > 0) {
        startLearnMode(unlearnedList[0]);
        setLearningStage('basic');
      }
    });
  }
  
  // Add Verse Tutorial Modal Event Listener
  const addVerseTutorialGotIt = document.getElementById('addVerseTutorialGotIt');
  if (addVerseTutorialGotIt) {
    addVerseTutorialGotIt.addEventListener('click', () => {
      // Hide modal
      const tutorialModal = document.getElementById('addVerseTutorialModal');
      tutorialModal.setAttribute('aria-hidden', 'true');
      tutorialModal.style.display = 'none';
      
      // Mark as seen
      localStorage.setItem('hasSeenAddVerseTutorial', 'true');
      
      // Proceed to Add Verse panel
      setActiveNavButton(addVerseBtn);
      showPanel(addVersePanel);
      loadVersesForEdit();
      populateCollectionSelector();
      clearForm();
      const bibleVersionInput = document.getElementById('bibleVersion');
      if (bibleVersionInput && !bibleVersionInput.value) {
        bibleVersionInput.value = localStorage.getItem('defaultBibleVersion') || '';
      }
    });
  }
  
  // Backup Reminder Modal Event Listeners
  if (backupReminderGotItBtn) {
    backupReminderGotItBtn.addEventListener('click', () => {
      hideBackupReminderModal();
    });
  }
  
  if (backupReminderExportBtn) {
    backupReminderExportBtn.addEventListener('click', () => {
      hideBackupReminderModal();
      showPanel(exportImportPanel);
    });
  }
  
  checkFirstTimeUser();

  // Input Focus Listeners
  learnInput.addEventListener('focus', () => {
    showKeyboardForInput(learnInput);
  });
  
  verseText.addEventListener('focus', () => showKeyboardForInput(verseText));
  
  verseInitials.addEventListener('focus', () => showKeyboardForInput(verseInitials));
  
  bookInitials.addEventListener('focus', () => showKeyboardForInput(bookInitials));
  
  bibleVersion.addEventListener('focus', () => showKeyboardForInput(bibleVersion));
  defaultBibleVersion.addEventListener('focus', () => showKeyboardForInput(defaultBibleVersion));
  
  chapterNumber.addEventListener('focus', () => showKeyboardForInput(chapterNumber));
  
  verseNumber.addEventListener('focus', () => showKeyboardForInput(verseNumber));
  
  bookNameInput.addEventListener('focus', () => showKeyboardForInput(bookNameInput));
  newCollectionTitle.addEventListener('focus', () => showKeyboardForInput(newCollectionTitle));

  // Orientation change handler - recenter focused element
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      // If there's an active input, recenter it
      if (activeInput && document.contains(activeInput)) {
        activeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // If learnInput is the active input, also scroll progressDisplay into view
      if (activeInput && activeInput.id === 'learnInput') {
        setTimeout(() => {
          const progressDisplay = document.getElementById('progressDisplay');
          if (progressDisplay) {
            progressDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      // For Add Verse panel inputs, scroll the label into view for context
      if (activeInput && (activeInput.id === 'verseInitials' || activeInput.id === 'bookInitials' || 
          activeInput.id === 'chapterNumber' || activeInput.id === 'verseNumber')) {
        setTimeout(() => {
          const label = activeInput.parentElement.querySelector('label');
          if (label) {
            label.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }, 200); // Delay to allow orientation change to complete
  });

  // (initialization at top of file already performed)
};