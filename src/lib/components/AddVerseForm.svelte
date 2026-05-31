<script>
	import { onMount, onDestroy } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import Modal from './Modal.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';
	import {
		getBibleBooks,
		getBibleBookOptions,
		findBookByName,
		getBookInitialsForMethod,
		sortVersesByBibleOrder
	} from '$lib/utils/bibleBooks';

	let verseText = '';
	let bookName = '';
	let chapterNumber = '';
	let verseNumber = '';
	let verseInitials = '';
	let bookInitials = '';
	let bibleVersion = '';
	let selectedCollectionIds = [];
	let showCollectionDropdown = false;

	let showKeyboard = null; // null, 'verse', 'book', 'numeric'
	let activeInput = null;
	let keyboardBlurTimeout = null; // Track timeout to clear it when needed
	
	let showModal = false;
	let modalMessage = '';
	let modalType = 'alert';
	let modalButtons = [];
	let confirmAction = null;
	let cancelAction = null;

	let editingId = null;
	let versesList = [];
	let myVersesSortOrder = 'biblical'; // 'biblical' | 'collection'
	let expandedAll = false;
	let expandedBooks = [];
	let expandedChapters = [];
	let groupedVerses = [];
	let groupedCollectionVerses = [];

	let selectOptions = [];
	let bookOptions = [];
	let bibleBooks = [];
	let filteredBookOptions = [];
	let filteredVersionOptions = [];
	let currentInputMethod = 'pinyin';
	let bookInitialsAuto = true;
	let collectionDisplayText = '';
	let bookDropdownElement = null;
	let versionDropdownElement = null;
	let collectionDropdownElement = null;

	// Keyboard state
	let keyboardInput = '';
	let verseInitialsInputEl = null;
	let bookInitialsInputEl = null;
	let verseCursorPos = 0;
	let bookCursorPos = 0;
	let verseCaretVisible = false;
	let verseCaretOffset = 0;
	let bookCaretVisible = false;
	let bookCaretOffset = 0;

	// Track original values for edit mode change detection
	let originalFormState = null;

	// Update from store
	$: {
		const biblicalVerses = sortVersesByBibleOrder(
			$verses,
			$settings.bookNameCharset || 'simplified'
		);
		versesList = myVersesSortOrder === 'collection'
			? sortVersesByCollectionOrder(biblicalVerses)
			: biblicalVerses;
		selectOptions = [
			...new Set($verses.map((v) => v.bibleVersion).filter(Boolean))
		];
		bibleBooks = getBibleBooks($settings.bookNameCharset || 'simplified');
		bookOptions = getBibleBookOptions($settings.bookNameCharset || 'simplified');
	}

	$: currentInputMethod = $settings.inputMethod || 'pinyin';

	$: if (!editingId && !bibleVersion && $settings.defaultBibleVersion) {
		bibleVersion = $settings.defaultBibleVersion;
	}

	$: if (bookName) {
		updateBookInitialsFromBookName();
	}

	$: if (currentInputMethod && bookName && bookInitialsAuto) {
		updateBookInitialsFromBookName(true);
	}

	// Get current keyboard layout
	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	// Reactive collection display text - must reference dependencies directly
	$: {
		if (selectedCollectionIds.length === 0) {
			collectionDisplayText = t('none');
		} else {
			const names = selectedCollectionIds
				.map(id => $collections.find(c => c.id === id)?.title)
				.filter(Boolean);
			collectionDisplayText = names.join(', ');
		}
	}

	// Form state tracking for button enable/disable
	$: hasAnyInput = verseText.trim() || bookName.trim() || chapterNumber || verseNumber || 
	                 verseInitials.trim() || bookInitials.trim() || bibleVersion.trim() ||
	                 selectedCollectionIds.length > 0;
	
	$: allMandatoryFieldsFilled = verseText.trim() && bookName.trim() && chapterNumber && 
	                               verseNumber && verseInitials.trim() && bookInitials.trim();
	
	$: hasFormChanged = editingId && originalFormState ? (
		verseText !== originalFormState.verseText ||
		bookName !== originalFormState.bookName ||
		chapterNumber !== originalFormState.chapterNumber ||
		verseNumber !== originalFormState.verseNumber ||
		verseInitials !== originalFormState.verseInitials ||
		bookInitials !== originalFormState.bookInitials ||
		bibleVersion !== originalFormState.bibleVersion ||
		JSON.stringify(selectedCollectionIds.sort()) !== JSON.stringify(originalFormState.selectedCollectionIds.sort())
	) : false;
	
	$: isSaveEnabled = editingId ? hasFormChanged && allMandatoryFieldsFilled : allMandatoryFieldsFilled;
	$: isClearEnabled = hasAnyInput;

	// Viewport scrolling for focused input fields
	$: {
		if (activeInput && showKeyboard && !(activeInput.id && activeInput.id.includes('verseInitials'))) {
			setTimeout(() => {
				if (!activeInput) return;
				
				const inputRect = activeInput.getBoundingClientRect();
				
				// Find keyboard element - it's rendered after the input field
				let keyboardElement = null;
				if (showKeyboard === 'numeric') {
					keyboardElement = document.querySelector('.keyboard');
				} else {
					keyboardElement = activeInput.parentElement.querySelector('.keyboard');
				}
				
				if (keyboardElement) {
					const keyboardRect = keyboardElement.getBoundingClientRect();
					const visibleViewportHeight = keyboardRect.top; // Space above keyboard
					
					// Center the input in the visible viewport (above the keyboard)
					const targetPosition = visibleViewportHeight / 2 - (inputRect.height / 2);
					const scrollAdjustment = inputRect.top - targetPosition;
					const scrollTarget = window.scrollY + scrollAdjustment;
					
					window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
				}
			}, 300);
		}
	}

	function handleVerseInitialsClick(event) {
		activeInput = event?.currentTarget || null;
		if (activeInput && typeof event?.clientX === 'number') {
			verseCursorPos = getCursorPositionFromClick(activeInput, event.clientX, verseInitials);
		} else {
			verseCursorPos = activeInput?.selectionStart ?? verseInitials.length;
		}
		keyboardInput = verseInitials;
		showKeyboard = 'verse';
		setCursorPosition(verseInitialsInputEl, verseCursorPos, false);
		updateVerseCaret();
		scrollFieldAboveKeyboard(activeInput);
	}

	function handleBookInitialsClick(event) {
		activeInput = event?.currentTarget || null;
		if (activeInput && typeof event?.clientX === 'number') {
			bookCursorPos = getCursorPositionFromClick(activeInput, event.clientX, bookInitials);
		} else {
			bookCursorPos = activeInput?.selectionStart ?? bookInitials.length;
		}
		keyboardInput = bookInitials;
		showKeyboard = 'book';
		setCursorPosition(bookInitialsInputEl, bookCursorPos, false);
		updateBookCaret();
		scrollFieldAboveKeyboard(activeInput);
	}

	function scrollFieldAboveKeyboard(inputEl) {
		if (!inputEl) return;
		setTimeout(() => {
			const keyboardEl = inputEl.closest('.field')?.querySelector('.keyboard') || document.querySelector('.keyboard');
			if (!keyboardEl) return;

			const inputRect = inputEl.getBoundingClientRect();
			const keyboardRect = keyboardEl.getBoundingClientRect();
			const desiredTop = keyboardRect.top - inputRect.height - 12;
			const adjustment = inputRect.top - desiredTop;
			if (Math.abs(adjustment) > 2) {
				window.scrollTo({ top: window.scrollY + adjustment, behavior: 'smooth' });
			}
		}, 340);
	}

	function setCursorPosition(inputEl, cursorPos, keepEndVisible = false) {
		if (!inputEl) return;
		setTimeout(() => {
			inputEl.focus();
			inputEl.setSelectionRange(cursorPos, cursorPos);
			if (keepEndVisible) {
				scrollCursorIntoView(inputEl, cursorPos);
			}
			if (inputEl === verseInitialsInputEl) {
				updateVerseCaret();
			}
			if (inputEl === bookInitialsInputEl) {
				updateBookCaret();
			}
		}, 0);
	}

	function getTextMeasureContext(inputEl) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		const styles = window.getComputedStyle(inputEl);
		ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
		return ctx;
	}

	function measureTextWidth(inputEl, value) {
		const ctx = getTextMeasureContext(inputEl);
		if (!ctx) return 0;
		return ctx.measureText(value).width;
	}

	function getCursorPositionFromClick(inputEl, clickClientX, value) {
		if (!inputEl) return value.length;
		const styles = window.getComputedStyle(inputEl);
		const paddingLeft = parseFloat(styles.paddingLeft || '0') || 0;
		const inputRect = inputEl.getBoundingClientRect();
		const clickX = clickClientX - inputRect.left + inputEl.scrollLeft - paddingLeft;
		if (clickX <= 0) return 0;

		let bestIndex = value.length;
		let bestDistance = Number.POSITIVE_INFINITY;
		for (let index = 0; index <= value.length; index += 1) {
			const width = measureTextWidth(inputEl, value.slice(0, index));
			const distance = Math.abs(width - clickX);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestIndex = index;
			}
		}

		return bestIndex;
	}

	function scrollCursorIntoView(inputEl, cursorPos) {
		if (!inputEl) return;
		const safePos = Math.max(0, Math.min(cursorPos, inputEl.value.length));
		const cursorX = measureTextWidth(inputEl, inputEl.value.slice(0, safePos));
		const left = inputEl.scrollLeft;
		const right = left + inputEl.clientWidth;
		const edgePadding = 20;

		if (cursorX < left + edgePadding) {
			inputEl.scrollLeft = Math.max(0, cursorX - edgePadding);
		} else if (cursorX > right - edgePadding) {
			inputEl.scrollLeft = Math.max(0, cursorX - inputEl.clientWidth + edgePadding);
		}
	}

	function updateVerseCaret() {
		if (!verseInitialsInputEl || showKeyboard !== 'verse') {
			verseCaretVisible = false;
			return;
		}

		const safePos = Math.max(0, Math.min(verseCursorPos, verseInitials.length));
		const beforeCursor = verseInitials.slice(0, safePos);
		const styles = window.getComputedStyle(verseInitialsInputEl);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			verseCaretVisible = false;
			return;
		}

		ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
		verseCaretOffset = ctx.measureText(beforeCursor).width - verseInitialsInputEl.scrollLeft;
		verseCaretVisible = activeInput?.id?.includes('verseInitials') ?? false;
	}

	function updateBookCaret() {
		if (!bookInitialsInputEl || showKeyboard !== 'book') {
			bookCaretVisible = false;
			return;
		}

		const safePos = Math.max(0, Math.min(bookCursorPos, bookInitials.length));
		const beforeCursor = bookInitials.slice(0, safePos);
		const styles = window.getComputedStyle(bookInitialsInputEl);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			bookCaretVisible = false;
			return;
		}

		ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
		bookCaretOffset = ctx.measureText(beforeCursor).width - bookInitialsInputEl.scrollLeft;
		bookCaretVisible = activeInput?.id?.includes('bookInitials') ?? false;
	}

	$: if (showKeyboard === 'verse' && verseInitialsInputEl) {
		verseInitials;
		verseCursorPos;
		setTimeout(() => updateVerseCaret(), 0);
	} else {
		verseCaretVisible = false;
	}

	$: if (showKeyboard === 'book' && bookInitialsInputEl) {
		bookInitials;
		bookCursorPos;
		setTimeout(() => updateBookCaret(), 0);
	} else {
		bookCaretVisible = false;
	}

	function insertAt(value, insertValue, cursorPos) {
		const safePos = Math.max(0, Math.min(cursorPos, value.length));
		return {
			nextValue: value.slice(0, safePos) + insertValue + value.slice(safePos),
			nextCursor: safePos + insertValue.length
		};
	}

	function backspaceAt(value, cursorPos) {
		if (value.length === 0 || cursorPos <= 0) {
			return { nextValue: value, nextCursor: Math.max(0, cursorPos) };
		}
		const safePos = Math.max(0, Math.min(cursorPos, value.length));
		return {
			nextValue: value.slice(0, safePos - 1) + value.slice(safePos),
			nextCursor: safePos - 1
		};
	}

	function handleKeyboardKey(event) {
		if (!activeInput) return;

		const key = event.detail;

		// Handle special keys
		if (key === 'Backspace') {
			handleBackspace();
			return;
		}

		if (key === 'Enter') {
			showKeyboard = null;
			activeInput?.blur();
			return;
		}

		// Map key to appropriate symbol based on input method
		let mappedValue = key;
		if (currentInputMethod === 'zhuyin') {
			mappedValue = zhuyinKeyMap[key] || key;
		} else if (currentInputMethod === 'cangjie') {
			mappedValue = cangjieKeyMap[key] || key;
		}

		if (activeInput.id.includes('verseInitials')) {
			const { nextValue, nextCursor } = insertAt(verseInitials, mappedValue, verseCursorPos);
			verseInitials = nextValue;
			verseCursorPos = nextCursor;
			keyboardInput = verseInitials;
			setCursorPosition(verseInitialsInputEl, verseCursorPos, true);
		} else if (activeInput.id.includes('bookInitials')) {
			bookInitialsAuto = false;
			const { nextValue, nextCursor } = insertAt(bookInitials, mappedValue, bookCursorPos);
			bookInitials = nextValue;
			bookCursorPos = nextCursor;
			keyboardInput = bookInitials;
			setCursorPosition(bookInitialsInputEl, bookCursorPos, true);
		} else if (activeInput.id === 'chapterNumber') {
			// Only accept numeric keys
			if (/^[0-9]$/.test(key)) {
				chapterNumber += key;
			}
		} else if (activeInput.id === 'verseNumber') {
			// Only accept numeric keys
			if (/^[0-9]$/.test(key)) {
				verseNumber += key;
			}
		}
	}

	function handleBackspace() {
		if (activeInput.id.includes('verseInitials')) {
			const { nextValue, nextCursor } = backspaceAt(verseInitials, verseCursorPos);
			verseInitials = nextValue;
			verseCursorPos = nextCursor;
			keyboardInput = verseInitials;
			setCursorPosition(verseInitialsInputEl, verseCursorPos, true);
		} else if (activeInput.id.includes('bookInitials')) {
			bookInitialsAuto = false;
			const { nextValue, nextCursor } = backspaceAt(bookInitials, bookCursorPos);
			bookInitials = nextValue;
			bookCursorPos = nextCursor;
			keyboardInput = bookInitials;
			setCursorPosition(bookInitialsInputEl, bookCursorPos, true);
		} else if (activeInput.id === 'chapterNumber') {
			chapterNumber = chapterNumber.slice(0, -1);
		} else if (activeInput.id === 'verseNumber') {
			verseNumber = verseNumber.slice(0, -1);
		}
	}

	function handlePhysicalKey(event) {
		if (!activeInput) return;
		if (currentInputMethod === 'pinyin' && !activeInput.readOnly) return;
		if (!event?.key) return;
		if (
			event.target &&
			['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) &&
			event.target !== activeInput
		) {
			return;
		}

		const key = event.key.toLowerCase();
		const inputMethod = currentInputMethod;

		if (key === 'backspace' || key === 'delete') {
			event.preventDefault();
			handleBackspace();
			return;
		}

		if (key === 'enter') {
			event.preventDefault();
			showKeyboard = null;
			activeInput?.blur();
			return;
		}

		if (activeInput.id === 'chapterNumber' || activeInput.id === 'verseNumber') {
			if (/^[0-9]$/.test(key)) {
				event.preventDefault();
				if (activeInput.id === 'chapterNumber') {
					chapterNumber += key;
				} else {
					verseNumber += key;
				}
			}
			return;
		}

		// Map physical key to input symbol based on input method
		let mappedValue = null;

		if (inputMethod === 'zhuyin') {
			mappedValue = zhuyinKeyMap[key];
		} else if (inputMethod === 'cangjie') {
			mappedValue = cangjieKeyMap[key];
		} else if (inputMethod === 'pinyin') {
			if (/^[a-z]$/.test(key)) {
				mappedValue = key;
			}
		}

		if (mappedValue) {
			event.preventDefault();
			if (activeInput.id.includes('verseInitials')) {
				const { nextValue, nextCursor } = insertAt(verseInitials, mappedValue, verseCursorPos);
				verseInitials = nextValue;
				verseCursorPos = nextCursor;
				keyboardInput = verseInitials;
				setCursorPosition(verseInitialsInputEl, verseCursorPos, true);
			} else if (activeInput.id.includes('bookInitials')) {
				bookInitialsAuto = false;
				const { nextValue, nextCursor } = insertAt(bookInitials, mappedValue, bookCursorPos);
				bookInitials = nextValue;
				bookCursorPos = nextCursor;
				keyboardInput = bookInitials;
				setCursorPosition(bookInitialsInputEl, bookCursorPos, true);
			}
		}
	}

	function handleNumberFieldKeydown(event) {
		const key = event.key;
		
		// Handle Enter key - blur the field and hide keyboard
		if (key === 'Enter') {
			event.preventDefault();
			showKeyboard = null;
			event.target.blur();
			return;
		}
		
		// Prevent invalid characters in number fields: minus sign, 'e', 'E', and period
		// HTML5 number inputs allow these for scientific notation, but we only want positive integers
		if (key === '-' || key === 'e' || key === 'E' || key === '.') {
			event.preventDefault();
			return;
		}
	}

	function updateBookSuggestions(inputValue = '') {
		const query = (inputValue || '').trim().toLowerCase();
		
		const MAX_FILTERED_RESULTS = 20;
		let booksToDisplay = [];
		
		// Condition 1: If query is empty, show ALL books for browsing
		if (query.length === 0) {
			booksToDisplay = bibleBooks;
		} else {
			// Condition 2: Filter by Hanzi OR Pinyin and limit results
			booksToDisplay = bibleBooks
				.filter((book) => 
					book.hanzi.includes(inputValue) || // Direct match for Chinese characters
					(book.pinyin && book.pinyin.toLowerCase().includes(query)) // Case-insensitive for pinyin
				)
				.slice(0, MAX_FILTERED_RESULTS);
		}
		
		filteredBookOptions = booksToDisplay.map((book) => book.hanzi);
	}
	
	function selectBookSuggestion(selectedHanzi) {
		bookName = selectedHanzi;
		// Auto-fill book initials based on input method
		const book = bibleBooks.find((b) => b.hanzi === selectedHanzi);
		if (book) {
			bookInitials = getBookInitialsForMethod(book, currentInputMethod);
			bookInitialsAuto = true;
		}
		filteredBookOptions = []; // Hide suggestions after selection
		activeInput = null;
		showKeyboard = null;
	}

	function updateBookInitialsFromBookName(force = false) {
		// Auto-update book initials when book name or input method changes
		if ((bookInitialsAuto || force) && bookName) {
			const book = bibleBooks.find((b) => b.hanzi === bookName);
			if (book) {
				bookInitials = getBookInitialsForMethod(book, currentInputMethod);
			}
		}
	}

	function updateVersionSuggestions(inputValue = '') {
		const query = (inputValue || '').trim().toLowerCase();
		if (query.length === 0) {
			filteredVersionOptions = [];
		} else {
			filteredVersionOptions = selectOptions.filter(version => 
				version.toLowerCase().includes(query)
			);
		}
	}

	function selectVersionSuggestion(selectedVersion) {
		bibleVersion = selectedVersion;
		filteredVersionOptions = [];
	}

	function toggleCollectionDropdown() {
		showCollectionDropdown = !showCollectionDropdown;
		if (showCollectionDropdown) {
			activeInput = null;
			showKeyboard = null;
		}
	}

	function toggleCollectionSelection(collectionId) {
		if (selectedCollectionIds.includes(collectionId)) {
			selectedCollectionIds = selectedCollectionIds.filter(id => id !== collectionId);
		} else {
			selectedCollectionIds = [...selectedCollectionIds, collectionId];
		}
	}

	function getSelectedCollectionsText() {
		if (selectedCollectionIds.length === 0) {
			return t('none');
		}
		const names = selectedCollectionIds
			.map(id => $collections.find(c => c.id === id)?.title)
			.filter(Boolean);
		const result = names.join(', ');
		return result;
	}

	// Count Hanzi characters in text, excluding punctuation and spaces
	function countHanziCharacters(text) {
		if (!text) return 0;
		// Match CJK Unified Ideographs (U+4E00 to U+9FFF) and CJK Extension A (U+3400 to U+4DBF)
		const hanziRegex = /[\u3400-\u4DBF\u4E00-\u9FFF]/g;
		const matches = text.match(hanziRegex);
		return matches ? matches.length : 0;
	}

	// Validate that verseInitials length matches Hanzi character count
	function validateVerseInitials() {
		const hanziCount = countHanziCharacters(verseText);
		const initialsCount = verseInitials.trim().length;
		
		if (hanziCount === initialsCount) {
			return { valid: true };
		}
		
		return {
			valid: false,
			hanziCount,
			initialsCount
		};
	}

	function saveVerse() {
		// Validation
		if (!verseText.trim() || !bookName.trim() || !chapterNumber || !verseNumber) {
			modalMessage = t('fill_all_fields');
			showModal = true;
			return;
		}

		if (!verseInitials.trim() || !bookInitials.trim()) {
			modalMessage = t('fill_all_fields');
			showModal = true;
			return;
		}

		if (isNaN(parseInt(chapterNumber)) || isNaN(parseInt(verseNumber))) {
			modalMessage = t('chapter_verse_numbers');
			showModal = true;
			return;
		}

		// Validate verse initials count matches Hanzi count
		const validation = validateVerseInitials();
		if (!validation.valid) {
			// Construct appropriate message based on input method
			const translationKey = `validation_mismatch_${currentInputMethod}`;
			modalMessage = t(translationKey)
				.replace('{hanziCount}', validation.hanziCount)
				.replace('{initialsCount}', validation.initialsCount);
			modalType = 'info';
			// Custom buttons: OK = cancel save, Ignore = proceed with save
			modalButtons = [
				{ label: t('ok'), action: 'cancel', variant: 'primary' },
				{ label: t('ignore'), action: 'ignore', variant: 'secondary' }
			];
			showModal = true;
			return;
		}

		// Validation passed, proceed with save
		proceedWithSave();
	}

	function proceedWithSave() {

		// If editing, check if verse has review history
		if (editingId) {
			const existingVerse = $verses.find((v) => v.id === editingId);
			if (existingVerse?.lastReviewed) {
				// Show modal asking about resetting review data
				modalMessage = t('reset_review_data_message');
				modalType = 'confirm';
				confirmAction = () => {
					// User chose YES - update verse and reset review data
					updateVerseData(true);
				};
				cancelAction = () => {
					// User chose NO - update verse but keep review data
					updateVerseData(false);
				};
				showModal = true;
				return;
			} else {
				// No review history, update immediately
				updateVerseData(false);
				return;
			}
		}

		// New verse - just save and clear form
		const newVerse = {
			id: Date.now().toString(),
			verseText: verseText.trim(),
			bookName: bookName.trim(),
			chapterNumber: parseInt(chapterNumber),
			verseNumber: parseInt(verseNumber),
			verseInitials: verseInitials.trim(),
			bookInitials: bookInitials.trim(),
			bibleVersion: bibleVersion || 'Unknown',
			lastReviewed: null,
			dueDate: null,
			interval: 1,
			repetitions: 0
		};

		verses.update((list) => [...list, newVerse]);

		// Add to selected collections
		if (selectedCollectionIds.length > 0) {
			collections.update(cols =>
				cols.map(c =>
					selectedCollectionIds.includes(c.id)
						? { ...c, verseIds: [...(c.verseIds || []), newVerse.id] }
						: c
				)
			);
		}

		clearForm();
	}

	function updateVerseData(resetReviewData) {
		const existingVerse = $verses.find((v) => v.id === editingId);
		
		// Check if verse content has changed (text or reference)
		const contentChanged = 
			existingVerse.verseText !== verseText.trim() ||
			existingVerse.bookName !== bookName.trim() ||
			existingVerse.chapterNumber !== parseInt(chapterNumber) ||
			existingVerse.verseNumber !== parseInt(verseNumber);
		
		const updatedVerse = {
			id: editingId,
			verseText: verseText.trim(),
			bookName: bookName.trim(),
			chapterNumber: parseInt(chapterNumber),
			verseNumber: parseInt(verseNumber),
			verseInitials: verseInitials.trim(),
			bookInitials: bookInitials.trim(),
			bibleVersion: bibleVersion || 'Unknown',
			lastReviewed: resetReviewData ? null : (existingVerse?.lastReviewed || null),
			dueDate: resetReviewData ? null : (existingVerse?.dueDate || null),
			interval: resetReviewData ? 1 : (existingVerse?.interval || 1),
			repetitions: resetReviewData ? 0 : (existingVerse?.repetitions || 0),
			// Reset heatArray if content changed, otherwise preserve it
			heatArray: contentChanged ? undefined : existingVerse?.heatArray
		};

		verses.update((list) => list.map((v) => (v.id === editingId ? updatedVerse : v)));

		// Update collection memberships
		collections.update(cols =>
			cols.map(c => {
				const verseIds = c.verseIds || [];
				const isCurrentlyIn = verseIds.includes(editingId);
				const shouldBeIn = selectedCollectionIds.includes(c.id);

				if (!isCurrentlyIn && shouldBeIn) {
					// Add to collection
					return { ...c, verseIds: [...verseIds, editingId] };
				} else if (isCurrentlyIn && !shouldBeIn) {
					// Remove from collection
					return { ...c, verseIds: verseIds.filter(id => id !== editingId) };
				}
				return c;
			})
		);

		clearForm();
	}

	function deleteVerse(id) {
		modalMessage = t('delete_confirmation');
		modalType = 'confirm';
		confirmAction = () => {
			verses.update((list) => list.filter((v) => v.id !== id));
			expandedVerseId = null;
		};
		showModal = true;
	}

	function editVerse(id) {
		const verse = versesList.find((v) => v.id === id);
		if (!verse) return;

		verseText = verse.verseText;
		bookName = verse.bookName;
		chapterNumber = verse.chapterNumber.toString();
		verseNumber = verse.verseNumber.toString();
		verseInitials = verse.verseInitials;
		bookInitials = verse.bookInitials;
		bookInitialsAuto = false;
		bibleVersion = verse.bibleVersion;
		
		// Pre-select collections that contain this verse
		selectedCollectionIds = $collections
			.filter(c => c.verseIds?.includes(id))
			.map(c => c.id);
		
		editingId = id;

		// Store original state for change detection
		originalFormState = {
			verseText,
			bookName,
			chapterNumber,
			verseNumber,
			verseInitials,
			bookInitials,
			bibleVersion,
			selectedCollectionIds: [...selectedCollectionIds]
		};

		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleModalButtonClick(event) {
		const action = event.detail.action;
		showModal = false;
		
		if (action === 'ignore') {
			// User chose to ignore validation and save anyway
			proceedWithSave();
		}
		// If action is 'cancel' or anything else, just close the modal
		
		// Reset modal state
		modalButtons = [];
		modalType = 'alert';
	}

	function handleModalConfirm() {
		showModal = false;
		if (confirmAction) {
			confirmAction();
			confirmAction = null;
		}
		modalType = 'alert';
		modalButtons = [];
	}

	function closeModal() {
		showModal = false;
		if (cancelAction) {
			cancelAction();
			cancelAction = null;
		}
		modalType = 'alert';
		modalButtons = [];
		confirmAction = null;
	}

	function clearForm() {
		verseText = '';
		bookName = '';
		chapterNumber = '';
		verseNumber = '';
		verseInitials = '';
		bookInitials = '';
		bibleVersion = '';
		selectedCollectionIds = [];
		showCollectionDropdown = false;
		editingId = null;
		originalFormState = null;
		showKeyboard = null;
		keyboardInput = '';
		verseCursorPos = 0;
		bookCursorPos = 0;
		bookCaretVisible = false;
		bookCaretOffset = 0;
		bookInitialsAuto = true;
	}

	function toggleAll() {
		if (expandedAll || expandedBooks.length > 0 || expandedChapters.length > 0) {
			// Some headings are expanded, so collapse all
			expandedAll = false;
			expandedBooks = [];
			expandedChapters = [];
		} else {
			// All collapsed, so expand all
			expandedAll = true;
		}
	}

	function expandAll() {
		expandedAll = true;
	}

	function collapseAll() {
		expandedAll = false;
		expandedBooks = [];
		expandedChapters = [];
	}

	function toggleBook(bookKey) {
		expandedAll = false;
		if (expandedBooks.includes(bookKey)) {
			expandedBooks = expandedBooks.filter((book) => book !== bookKey);
		} else {
			expandedBooks = [...expandedBooks, bookKey];
		}
	}

	function getChapterKey(bookKey, chapterNumber) {
		return `${bookKey}-${chapterNumber}`;
	}

	function toggleChapter(bookKey, chapterNumber) {
		expandedAll = false;
		const chapterKey = getChapterKey(bookKey, chapterNumber);
		if (expandedChapters.includes(chapterKey)) {
			expandedChapters = expandedChapters.filter((key) => key !== chapterKey);
		} else {
			expandedChapters = [...expandedChapters, chapterKey];
		}
	}

	// Removed toggleVerse - verses display directly when chapter is expanded
	// Removed isBookExpanded and isChapterExpanded - checks are now inline in template for better reactivity

	function getVerseCollections(verseId) {
		return $collections.filter(col => col.verseIds.includes(verseId));
	}

	function buildGroupedVerses(list) {
		const grouped = [];
		list.forEach((verse) => {
			// Normalize book name and chapter number for consistent grouping
			const normalizedBookName = (verse.bookName || '').trim();
			const chapterNum = typeof verse.chapterNumber === 'number' 
				? verse.chapterNumber 
				: parseInt(verse.chapterNumber, 10);

			let bookGroup = grouped.find((entry) => entry.bookName === normalizedBookName);
			if (!bookGroup) {
				bookGroup = { bookName: normalizedBookName, chapters: [] };
				grouped.push(bookGroup);
			}

			let chapterGroup = bookGroup.chapters.find(
				(entry) => entry.chapterNumber === chapterNum
			);
			if (!chapterGroup) {
				chapterGroup = { chapterNumber: chapterNum, verses: [] };
				bookGroup.chapters.push(chapterGroup);
			}
			chapterGroup.verses.push(verse);
		});
		return grouped;
	}

	function sortVersesByCollectionOrder(inputVerses) {
		const verseById = new Map(inputVerses.map((verse) => [verse.id, verse]));
		const ordered = [];
		const seen = new Set();

		for (const collection of $collections) {
			for (const verseId of collection.verseIds || []) {
				if (seen.has(verseId)) continue;
				const verse = verseById.get(verseId);
				if (verse) {
					seen.add(verseId);
					ordered.push(verse);
				}
			}
		}

		for (const verse of inputVerses) {
			if (!seen.has(verse.id)) {
				ordered.push(verse);
			}
		}

		return ordered;
	}

	function buildCollectionGroups(list) {
		const verseById = new Map(list.map((verse) => [verse.id, verse]));
		const groups = [];
		const seen = new Set();

		for (const collection of $collections) {
			const versesInCollection = (collection.verseIds || [])
				.map((verseId) => verseById.get(verseId))
				.filter(Boolean);

			if (versesInCollection.length > 0) {
				groups.push({
					id: collection.id,
					title: collection.title,
					verses: versesInCollection
				});
				versesInCollection.forEach((verse) => seen.add(verse.id));
			}
		}

		const uncollectedVerses = list.filter((verse) => !seen.has(verse.id));
		if (uncollectedVerses.length > 0) {
			groups.push({
				id: '__uncollected__',
				title: t('not_in_collection'),
				verses: uncollectedVerses
			});
		}

		return groups;
	}

	$: groupedVerses = buildGroupedVerses(versesList);
	$: groupedCollectionVerses = buildCollectionGroups(versesList);

	// Close collection dropdown on resize or click outside
	function handleResize() {
		if (showCollectionDropdown) {
			showCollectionDropdown = false;
		}
	}

	function handleClickOutside(event) {
		if (showKeyboard && activeInput) {
			const target = event.target;
			const isElementTarget = target instanceof Element;
			const clickedActiveInput = target === activeInput;
			const clickedKeyboard = isElementTarget && !!target.closest('.keyboard');
			const clickedNumericField = isElementTarget && showKeyboard === 'numeric' &&
				(target.id === 'chapterNumber' || target.id === 'verseNumber');

			if (!clickedActiveInput && !clickedKeyboard && !clickedNumericField) {
				activeInput.blur?.();
				activeInput = null;
				showKeyboard = null;
				verseCaretVisible = false;
				bookCaretVisible = false;
			}
		}

		if (!showCollectionDropdown) return;
		
		// Don't close if clicking inside the dropdown
		if (collectionDropdownElement && collectionDropdownElement.contains(event.target)) {
			return;
		}
		
		// Don't close if clicking the collection input field (let click handler toggle it)
		const collectionInput = document.getElementById('collectionSelector');
		if (collectionInput && collectionInput.contains(event.target)) {
			return;
		}
		
		showCollectionDropdown = false;
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
			window.addEventListener('click', handleClickOutside, true);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('click', handleClickOutside, true);
		}
	});
</script>

<svelte:document on:keydown={handlePhysicalKey} />

<span class="visually-hidden" aria-hidden="true">{$settings.languagePreference}</span>

<div class="add-verse-container">
	<!-- Form Section -->
	<div class="form-section">
		<h2>{editingId ? t('update_verse') : t('add_verse')}</h2>

		<div class="form-grid">
			<!-- Row 1: Chinese book name -->
			<div class="field" style="position: relative;">
				<label for="bookName">{t('chinese_book_name')}</label>
				<input
					type="text"
					id="bookName"
					bind:value={bookName}
					autocomplete="off"
					on:input={() => {
						bookInitialsAuto = true;
						updateBookSuggestions(bookName);
						updateBookInitialsFromBookName(true);
					}}
					on:focus={() => {
						activeInput = null;
						showKeyboard = null;
						updateBookSuggestions(bookName);
					}}
					on:blur={() => {
						setTimeout(() => {
							filteredBookOptions = [];
						}, 200);
					}}
				/>
				{#if filteredBookOptions.length > 0}
					<div class="autocomplete-suggestions" bind:this={bookDropdownElement}>
						{#each filteredBookOptions as option}
							<div 
								class="suggestion-item" 
								on:click={() => selectBookSuggestion(option)}
								on:keydown={(e) => e.key === 'Enter' && selectBookSuggestion(option)}
								role="button"
								tabindex="0"
							>
								{option}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Row 2: Chapter, Verse -->
			<div class="form-row">
				<div class="field">
					<label for="chapterNumber">{t('chapter')}</label>
					<input
						type="number"
						id="chapterNumber"
						bind:value={chapterNumber}
						readonly
						inputmode="none"
						min="1"
						on:keydown={handleNumberFieldKeydown}
						on:focus={(e) => {
							// Clear any pending blur timeout
							if (keyboardBlurTimeout) {
								clearTimeout(keyboardBlurTimeout);
								keyboardBlurTimeout = null;
							}
							activeInput = e.target;
							showKeyboard = 'numeric';
						}}
						on:blur={() => {
							if (showKeyboard === 'numeric') {
								// Store timeout ID so we can clear it if another numeric field is focused
								keyboardBlurTimeout = setTimeout(() => {
									showKeyboard = null;
									keyboardBlurTimeout = null;
								}, 200);
							}
						}}
					/>
				</div>
				<div class="field">
					<label for="verseNumber">{t('verse')}</label>
					<input
						type="number"
						id="verseNumber"
						bind:value={verseNumber}
						readonly
						inputmode="none"
						min="1"
						on:keydown={handleNumberFieldKeydown}
						on:focus={(e) => {
							// Clear any pending blur timeout
							if (keyboardBlurTimeout) {
								clearTimeout(keyboardBlurTimeout);
								keyboardBlurTimeout = null;
							}
							activeInput = e.target;
							showKeyboard = 'numeric';
						}}
						on:blur={() => {
							if (showKeyboard === 'numeric') {
								// Store timeout ID so we can clear it if another numeric field is focused
								keyboardBlurTimeout = setTimeout(() => {
									showKeyboard = null;
									keyboardBlurTimeout = null;
								}, 200);
							}
						}}
					/>
				</div>
			</div>

			<!-- Row 3: Chinese Verse Text -->
			<div class="field">
				<label for="verseText">{t('chinese_verse_text')}</label>
				<textarea id="verseText" bind:value={verseText} rows="4"></textarea>
			</div>

			<!-- Row 4: Verse initials -->
			{#if currentInputMethod === 'pinyin'}
				<div class="field">
					<label for="verseInitials">{t('pinyin_initials_verse')}</label>
					<p class="helper-text">{t('pinyin_helper')}</p>
					<div class="initials-input-shell" class:caret-active={verseCaretVisible}>
						<input
							id="verseInitials"
							type="text"
							class="initials-input"
							bind:value={verseInitials}
							bind:this={verseInitialsInputEl}
							readonly
							on:mouseup={(e) => {
								verseCursorPos = e.currentTarget.selectionStart ?? verseInitials.length;
								updateVerseCaret();
							}}
							on:keyup={(e) => {
								verseCursorPos = e.currentTarget.selectionStart ?? verseInitials.length;
								updateVerseCaret();
							}}
							on:scroll={updateVerseCaret}
							on:click={handleVerseInitialsClick}
						/>
						{#if verseCaretVisible}
							<span class="simulated-caret" aria-hidden="true" style={`left: calc(0.75rem + ${Math.max(0, verseCaretOffset)}px);`}></span>
						{/if}
					</div>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'zhuyin'}
				<div class="field">
					<label for="verseInitialsZhuyin">{t('zhuyin_initials_verse')}</label>
					<p class="helper-text">{t('zhuyin_helper')}</p>
					<div class="initials-input-shell" class:caret-active={verseCaretVisible}>
						<input
							id="verseInitialsZhuyin"
							type="text"
							class="initials-input"
							bind:value={verseInitials}
							bind:this={verseInitialsInputEl}
							readonly
							on:mouseup={(e) => {
								verseCursorPos = e.currentTarget.selectionStart ?? verseInitials.length;
								updateVerseCaret();
							}}
							on:keyup={(e) => {
								verseCursorPos = e.currentTarget.selectionStart ?? verseInitials.length;
								updateVerseCaret();
							}}
							on:scroll={updateVerseCaret}
							on:click={handleVerseInitialsClick}
						/>
						{#if verseCaretVisible}
							<span class="simulated-caret" aria-hidden="true" style={`left: calc(0.75rem + ${Math.max(0, verseCaretOffset)}px);`}></span>
						{/if}
					</div>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'cangjie'}
				<div class="field">
					<label for="verseInitialsCangjie">{t('cangjie_initials_verse')}</label>
					<p class="helper-text">{t('cangjie_helper')}</p>
					<div class="initials-input-shell" class:caret-active={verseCaretVisible}>
						<input
							id="verseInitialsCangjie"
							type="text"
							class="initials-input"
							bind:value={verseInitials}
							bind:this={verseInitialsInputEl}
							readonly
							on:mouseup={(e) => {
								verseCursorPos = e.currentTarget.selectionStart ?? verseInitials.length;
								updateVerseCaret();
							}}
							on:keyup={(e) => {
								verseCursorPos = e.currentTarget.selectionStart ?? verseInitials.length;
								updateVerseCaret();
							}}
							on:scroll={updateVerseCaret}
							on:click={handleVerseInitialsClick}
						/>
						{#if verseCaretVisible}
							<span class="simulated-caret" aria-hidden="true" style={`left: calc(0.75rem + ${Math.max(0, verseCaretOffset)}px);`}></span>
						{/if}
					</div>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{/if}

			<!-- Row 5: Book initials -->
			{#if currentInputMethod === 'pinyin'}
				<div class="field">
					<label for="bookInitials">{t('pinyin_initials_book')}</label>
					<div class="initials-input-shell" class:caret-active={bookCaretVisible}>
						<input
							id="bookInitials"
							type="text"
							class="initials-input"
							bind:value={bookInitials}
							bind:this={bookInitialsInputEl}
							readonly
							on:mouseup={(e) => {
								bookCursorPos = e.currentTarget.selectionStart ?? bookInitials.length;
								updateBookCaret();
							}}
							on:keyup={(e) => {
								bookCursorPos = e.currentTarget.selectionStart ?? bookInitials.length;
								updateBookCaret();
							}}
							on:scroll={updateBookCaret}
							on:click={handleBookInitialsClick}
						/>
						{#if bookCaretVisible}
							<span class="simulated-caret" aria-hidden="true" style={`left: calc(0.75rem + ${Math.max(0, bookCaretOffset)}px);`}></span>
						{/if}
					</div>
					{#if showKeyboard === 'book'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'zhuyin'}
				<div class="field">
					<label for="bookInitialsZhuyin">{t('zhuyin_initials_book')}</label>
					<div class="initials-input-shell" class:caret-active={bookCaretVisible}>
						<input
							id="bookInitialsZhuyin"
							type="text"
							class="initials-input"
							bind:value={bookInitials}
							bind:this={bookInitialsInputEl}
							readonly
							on:mouseup={(e) => {
								bookCursorPos = e.currentTarget.selectionStart ?? bookInitials.length;
								updateBookCaret();
							}}
							on:keyup={(e) => {
								bookCursorPos = e.currentTarget.selectionStart ?? bookInitials.length;
								updateBookCaret();
							}}
							on:scroll={updateBookCaret}
							on:click={handleBookInitialsClick}
						/>
						{#if bookCaretVisible}
							<span class="simulated-caret" aria-hidden="true" style={`left: calc(0.75rem + ${Math.max(0, bookCaretOffset)}px);`}></span>
						{/if}
					</div>
					{#if showKeyboard === 'book'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'cangjie'}
				<div class="field">
					<label for="bookInitialsCangjie">{t('cangjie_initials_book')}</label>
					<div class="initials-input-shell" class:caret-active={bookCaretVisible}>
						<input
							id="bookInitialsCangjie"
							type="text"
							class="initials-input"
							bind:value={bookInitials}
							bind:this={bookInitialsInputEl}
							readonly
							on:mouseup={(e) => {
								bookCursorPos = e.currentTarget.selectionStart ?? bookInitials.length;
								updateBookCaret();
							}}
							on:keyup={(e) => {
								bookCursorPos = e.currentTarget.selectionStart ?? bookInitials.length;
								updateBookCaret();
							}}
							on:scroll={updateBookCaret}
							on:click={handleBookInitialsClick}
						/>
						{#if bookCaretVisible}
							<span class="simulated-caret" aria-hidden="true" style={`left: calc(0.75rem + ${Math.max(0, bookCaretOffset)}px);`}></span>
						{/if}
					</div>
					{#if showKeyboard === 'book'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{/if}

			<!-- Row 6: Bible version -->
			<div class="field" style="position: relative;">
				<label for="bibleVersion">{t('bible_version_optional')}</label>
				<input
					type="text"
					id="bibleVersion"
					bind:value={bibleVersion}
					placeholder="e.g., ESV"
					autocomplete="off"
					on:input={() => updateVersionSuggestions(bibleVersion)}
					on:focus={() => {
						activeInput = null;
						showKeyboard = null;
						updateVersionSuggestions(bibleVersion);
					}}
					on:blur={() => {
						setTimeout(() => {
							filteredVersionOptions = [];
						}, 200);
					}}
				/>
				{#if filteredVersionOptions.length > 0}
					<div class="autocomplete-suggestions" bind:this={versionDropdownElement}>
						{#each filteredVersionOptions as option}
							<div 
								class="suggestion-item" 
								on:click={() => selectVersionSuggestion(option)}
								on:keydown={(e) => e.key === 'Enter' && selectVersionSuggestion(option)}
								tabindex="0"
								role="button"
							>
								{option}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Row 7: Add to collection -->
			<div class="field" style="position: relative;">
				<label for="collectionSelector">{t('add_to_collection_optional')}</label>
				<input
					type="text"
					id="collectionSelector"
					bind:value={collectionDisplayText}
					readonly
					autocomplete="off"
					on:click={toggleCollectionDropdown}
					on:focus={() => {
						activeInput = null;
						showKeyboard = null;
					}}
					placeholder={t('none')}
				/>
				{#if showCollectionDropdown}
					<div
						class="autocomplete-suggestions collection-dropdown"
						bind:this={collectionDropdownElement}
					>
						{#if $collections.length === 0}
							<div class="suggestion-item disabled">
								{t('no_collections')}
							</div>
						{:else}
							{#each $collections as collection (collection.id)}
								<div 
									class="suggestion-item collection-item" 
									on:click={() => toggleCollectionSelection(collection.id)}
									on:keydown={(e) => e.key === 'Enter' && toggleCollectionSelection(collection.id)}
									tabindex="0"
									role="button"
								>
									<input 
										type="checkbox" 
										checked={selectedCollectionIds.includes(collection.id)}
										on:click|stopPropagation
										on:change={() => toggleCollectionSelection(collection.id)}
										tabindex="-1"
									/>
									<span>{collection.title}</span>
								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>

			<!-- Numeric Keyboard for Chapter/Verse Numbers -->
			{#if showKeyboard === 'numeric'}
				<Keyboard layout={keyboardLayouts.numeric} on:key={handleKeyboardKey} isNumeric={true} />
			{/if}

			<!-- Row 8: Save verse, Clear form -->
			<div class="button-group">
				<button 
					class="primary" 
					on:click={saveVerse}
					disabled={!isSaveEnabled}
				>
					{editingId ? t('update_verse') : t('add_verse')}
				</button>
				<button 
					class="secondary" 
					on:click={clearForm}
					disabled={!isClearEnabled}
				>
					{t('clear_form')}
				</button>
			</div>
		</div>
	</div>

	<!-- My Verses Section -->
	<div class="verses-section">
		<h2>{t('my_verses')}</h2>

		{#if versesList.length > 0}
			<div class="verses-controls">
				<div class="sort-control-inline">
					<label class="my-verses-sort-label" for="my-verses-sort">{t('sort')}:</label>
					<select id="my-verses-sort" class="my-verses-sort-select" bind:value={myVersesSortOrder}>
						<option value="biblical">{t('order_biblical')}</option>
						<option value="collection">{t('order_collection')}</option>
					</select>
				</div>
				{#if myVersesSortOrder === 'biblical'}
					<button on:click={toggleAll} class="secondary">
						{(expandedAll || expandedBooks.length > 0 || expandedChapters.length > 0) ? t('collapse_all') : t('expand_all')}
					</button>
				{/if}
				<span class="verse-count">{versesList.length} {t('verses')}</span>
			</div>
		{/if}

		<div class="verses-list">
			{#if myVersesSortOrder === 'collection'}
				{#each groupedCollectionVerses as group (group.id)}
					<details class="verse-item">
						<summary class="verse-header">
							<span class="book-ref">{group.title}</span>
							<span class="verse-count">{group.verses.length} {t('verses')}</span>
							<span class="toggle-icon">▶</span>
						</summary>

						<div class="verse-content">
							<div class="verses-in-chapter">
								{#each group.verses as verse (verse.id)}
									<div class="verse-item-detail">
										<div class="verse-reference-row">
											<div class="verse-reference">
												{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
											</div>
											{#if verse.bibleVersion}
												<div class="verse-version">{verse.bibleVersion}</div>
											{/if}
										</div>
										<div class="verse-text">{verse.verseText}</div>
										<div class="verse-meta-row">
											<div class="verse-tags">
												{#if verse.lastReviewed}
													<span class="tag learned-tag">{t('learned_tag')}</span>
												{/if}
												{#each getVerseCollections(verse.id) as collection}
													<span class="tag collection-tag">{collection.title}</span>
												{/each}
											</div>
											<div class="verse-actions">
												<button
													class="icon-button edit-button"
													on:click={() => editVerse(verse.id)}
													title={t('edit')}
												>
													✏️
												</button>
												<button
													class="icon-button delete-button"
													on:click={() => deleteVerse(verse.id)}
													title={t('delete')}
												>
													❌
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</details>
				{/each}
			{:else}
				{#each groupedVerses as book}
					<div class="verse-item">
						<button
							class="verse-header"
							on:click={() => toggleBook(book.bookName)}
							type="button"
						>
							<span class="book-ref">{book.bookName}</span>
							<span class="toggle-icon">{(expandedAll || expandedBooks.includes(book.bookName)) ? '▼' : '▶'}</span>
						</button>

						{#if (expandedAll || expandedBooks.includes(book.bookName))}
							<div class="verse-content">
								{#if book.chapters.length === 1}
									<div class="verses-in-chapter">
										{#each book.chapters[0].verses as verse}
											<div class="verse-item-detail">
												<div class="verse-reference-row">
													<div class="verse-reference">
														{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
													</div>
													{#if verse.bibleVersion}
														<div class="verse-version">{verse.bibleVersion}</div>
													{/if}
												</div>
												<div class="verse-text">{verse.verseText}</div>
												<div class="verse-meta-row">
													<div class="verse-tags">
														{#if verse.lastReviewed}
															<span class="tag learned-tag">{t('learned_tag')}</span>
														{/if}
														{#each getVerseCollections(verse.id) as collection}
															<span class="tag collection-tag">{collection.title}</span>
														{/each}
													</div>
													<div class="verse-actions">
														<button
															class="icon-button edit-button"
															on:click={() => editVerse(verse.id)}
															title={t('edit')}
														>
															✏️
														</button>
														<button
															class="icon-button delete-button"
															on:click={() => deleteVerse(verse.id)}
															title={t('delete')}
														>
															❌
														</button>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									{#each book.chapters as chapter}
										<button
											class="verse-header chapter-header"
											on:click={() => toggleChapter(book.bookName, chapter.chapterNumber)}
											type="button"
										>
											<span class="book-ref">
												{t('chapter_heading')} {chapter.chapterNumber}{t('chapter_suffix')}
											</span>
											<span class="toggle-icon">
												{(expandedAll || expandedChapters.includes(`${book.bookName}-${chapter.chapterNumber}`)) ? '▼' : '▶'}
											</span>
										</button>

										{#if (expandedAll || expandedChapters.includes(`${book.bookName}-${chapter.chapterNumber}`))}
											<div class="verses-in-chapter">
												{#each chapter.verses as verse}
													<div class="verse-item-detail">
														<div class="verse-reference-row">
															<div class="verse-reference">
																{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
															</div>
															{#if verse.bibleVersion}
																<div class="verse-version">{verse.bibleVersion}</div>
															{/if}
														</div>
														<div class="verse-text">{verse.verseText}</div>
														<div class="verse-meta-row">
															<div class="verse-tags">
																{#if verse.lastReviewed}
																	<span class="tag learned-tag">{t('learned_tag')}</span>
																{/if}
																{#each getVerseCollections(verse.id) as collection}
																	<span class="tag collection-tag">{collection.title}</span>
																{/each}
															</div>
															<div class="verse-actions">
																<button
																	class="icon-button edit-button"
																	on:click={() => editVerse(verse.id)}
																	title={t('edit')}
																>
																	✏️
																</button>
																<button
																	class="icon-button delete-button"
																	on:click={() => deleteVerse(verse.id)}
																	title={t('delete')}
																>
																	❌
																</button>
															</div>
														</div>
													</div>
												{/each}
											</div>
										{/if}
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			{/if}

			{#if versesList.length === 0}
				<div class="empty-state">{t('no_verses_to_learn')}</div>
			{/if}
		</div>
	</div>
</div>

<Modal 
	show={showModal} 
	message={modalMessage}
	type={modalType}
	buttons={modalButtons}
	on:click={handleModalButtonClick}
	on:confirm={handleModalConfirm}
	on:cancel={closeModal}
/>

<style>
	.add-verse-container {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		padding-bottom: 400px; /* Add space for keyboard at bottom */
		box-sizing: border-box;
		max-width: 100vw;
		overflow-x: hidden;
		overflow-y: visible;
	}

	@media (max-width: 767px) {
		.add-verse-container {
			padding-left: 0;
			padding-right: 0;
			gap: 1rem;
		}
	}

	@media (min-width: 768px) {
		.add-verse-container {
			grid-template-columns: 1fr 1fr;
		}
	}

	.add-verse-container {
		overflow: visible;
	}

	.form-section,
	.verses-section {
		background: var(--panel-background);
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: var(--panel-shadow);
		box-sizing: border-box;
		max-width: 100%;
		overflow: visible;
	}

	@media (max-width: 767px) {
		.form-section,
		.verses-section {
			padding: 1rem;
		}
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: var(--text-color);
		text-align: center;
	}

	.form-grid {
		display: grid;
		gap: 1rem;
		box-sizing: border-box;
		max-width: 100%;
		overflow: visible;
	}

	.field {
		display: grid;
		gap: 0.5rem;
		box-sizing: border-box;
		max-width: 100%;
		overflow: visible;
	}

	.field label {
		font-weight: 500;
		font-size: 0.9em;
		color: var(--subtitle-color);
	}

	.field input,
	.field textarea {
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1em;
		box-sizing: border-box;
		width: 100%;
		max-width: 100%;
	}

	.initials-input {
		overflow-x: auto;
		white-space: nowrap;
		text-overflow: clip;
		cursor: text;
		caret-color: transparent;
	}

	.initials-input-shell {
		position: relative;
	}

	.simulated-caret {
		position: absolute;
		top: 0.6rem;
		bottom: 0.6rem;
		width: 2px;
		background: var(--text-color);
		pointer-events: none;
		animation: caret-blink 1s step-end infinite;
	}

	@keyframes caret-blink {
		0%, 45% {
			opacity: 1;
		}
		46%, 100% {
			opacity: 0;
		}
	}

	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--accent-color);
	}
	
	/* Autocomplete suggestions */
	.autocomplete-suggestions {
		position: absolute;
		z-index: 10;
		width: 100%;
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid var(--file-border);
		background-color: var(--panel-background);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
		top: 100%;
		left: 0;
	}
	
	.suggestion-item {
		padding: 8px 10px;
		cursor: pointer;
		color: var(--text-color);
		border-bottom: 1px solid var(--file-border);
		background-color: var(--panel-background);
	}
	
	.suggestion-item:hover,
	.suggestion-item:focus {
		background-color: var(--accent-color);
		color: var(--correct-color);
		outline: none;
	}
	
	.autocomplete-suggestions .suggestion-item:last-child {
		border-bottom: none;
	}

	/* Collection dropdown specific styles */
	.collection-dropdown {
		max-height: 300px;
		z-index: 1000;
	}

	.collection-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 10px;
	}

	.collection-item input[type="checkbox"] {
		margin: 0;
		cursor: pointer;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.collection-item span {
		flex: 1;
		cursor: pointer;
	}

	.collection-item:hover,
	.collection-item:focus {
		background-color: var(--accent-color);
		color: var(--correct-color);
	}

	.suggestion-item.disabled {
		cursor: not-allowed;
		opacity: 0.6;
		font-style: italic;
	}

	.suggestion-item.disabled:hover {
		background-color: var(--panel-background);
		color: var(--text-color);
	}

	.helper-text {
		margin: 0;
		padding: 0;
		font-size: 0.85rem;
		color: var(--subtitle-color);
		font-style: italic;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		box-sizing: border-box;
		max-width: 100%;
	}

	.button-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 1rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: all 0.3s;
		box-sizing: border-box;
	}

	button.primary {
		background: var(--accent-color);
		color: white;
	}

	button.primary:hover {
		opacity: 0.9;
	}

	button:disabled {
		background: var(--subtitle-color);
		color: var(--text-color);
		opacity: 0.5;
		cursor: not-allowed;
	}

	button:disabled:hover {
		opacity: 0.5;
	}

	button.secondary {
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
	}

	.verses-controls {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.sort-control-inline {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.my-verses-sort-label {
		font-size: 0.95em;
		font-weight: 600;
		color: var(--subtitle-color);
		white-space: nowrap;
	}

	.my-verses-sort-select {
		padding: 0.5rem 0.7rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 6px;
		font-size: 0.95em;
	}

	.verse-count {
		margin-left: auto;
		color: var(--subtitle-color);
		font-size: 0.9em;
	}

	.verses-list {
		display: grid;
		gap: 0.5rem;
	}

	.verse-item {
		border: 1px solid var(--file-border);
		border-radius: 4px;
		overflow: hidden;
	}

	.verse-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--file-bg);
		cursor: pointer;
		user-select: none;
		border: none;
		width: 100%;
		font-size: 1em;
		color: inherit;
		transition: background 0.3s;
		list-style: none;
	}

	.verse-header::-webkit-details-marker {
		display: none;
	}

	.verse-header:hover {
		background: var(--nav-button-bg);
	}

	.book-ref {
		font-weight: 600;
		color: var(--text-color);
	}

	.toggle-icon {
		color: var(--subtitle-color);
		transition: transform 0.2s ease;
	}

	details[open] > .verse-header .toggle-icon {
		transform: rotate(90deg);
	}

	.verse-content {
		padding: 1rem;
		border-top: 1px solid var(--file-border);
	}

	.verse-text {
		margin-bottom: 0;
		line-height: 1.6;
		color: var(--text-color);
		font-size: 1.2em;
	}

	.verses-in-chapter {
		margin-left: 1.5rem;
		margin-top: 0.5rem;
	}

	.verse-item-detail {
		padding: 1rem;
		margin-bottom: 0.75rem;
		background: var(--file-bg);
		border-radius: 4px;
		border: 1px solid var(--file-border);
	}

	.verse-reference-row {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.verse-reference {
		font-weight: 600;
		color: var(--text-color);
		font-size: 0.95rem;
		margin-bottom: 0;
	}

	.verse-version {
		font-size: 0.9em;
		color: var(--subtitle-color);
		font-style: italic;
	}

	.verse-meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.verse-tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.tag {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.learned-tag {
		background: var(--accent-color);
		color: #fff;
		border: 1px solid var(--accent-color);
	}

	.collection-tag {
		background: var(--file-bg);
		color: var(--text-color);
		border: 1px solid var(--file-border);
	}

	.chapter-header {
		margin-left: 1rem;
		background: var(--panel-background);
		border-left: 3px solid var(--accent-color);
		font-size: 0.95rem;
	}

	.verse-actions {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}

	.icon-button {
		background: transparent;
		border: none;
		font-size: 1.3rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		transition: transform 0.2s, opacity 0.2s;
		opacity: 0.7;
	}

	.icon-button:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	.icon-button:active {
		transform: scale(0.95);
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--subtitle-color);
	}

	/* Mobile optimizations */
	@media (max-width: 767px) {
		.verse-content {
			padding: 0.5rem;
		}

		.verses-in-chapter {
			margin-left: 0.5rem;
		}

		.verse-item-detail {
			padding: 0.75rem;
			margin-bottom: 0.5rem;
		}

		.chapter-header {
			margin-left: 0.5rem;
		}
	}
</style>
