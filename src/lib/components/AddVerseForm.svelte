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

	let showKeyboard = null; // null, 'verse', 'book'
	let activeInput = null;
	
	let showModal = false;
	let modalMessage = '';
	let modalType = 'alert';
	let confirmAction = null;
	let cancelAction = null;

	let editingId = null;
	let versesList = [];
	let expandedAll = false;
	let expandedBooks = [];
	let expandedChapters = [];
	let groupedVerses = [];

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

	// Track original values for edit mode change detection
	let originalFormState = null;

	// Update from store
	$: {
		versesList = sortVersesByBibleOrder(
			$verses,
			$settings.bookNameCharset || 'simplified'
		);
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
		if (activeInput && showKeyboard) {
			console.log('=== ADD VERSE VIEWPORT SCROLL ===');
			console.log('Active input:', activeInput.id);
			console.log('Keyboard shown:', showKeyboard);
			
			setTimeout(() => {
				if (!activeInput) return;
				
				const inputRect = activeInput.getBoundingClientRect();
				const viewportHeight = window.innerHeight;
				
				console.log('Input rect top:', inputRect.top);
				console.log('Input rect bottom:', inputRect.bottom);
				console.log('Viewport height:', viewportHeight);
				
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
					
					console.log('Keyboard top:', keyboardRect.top);
					console.log('Visible viewport height (above keyboard):', visibleViewportHeight);
					
					// Center the input in the visible viewport (above the keyboard)
					const targetPosition = visibleViewportHeight / 2 - (inputRect.height / 2);
					const scrollAdjustment = inputRect.top - targetPosition;
					const scrollTarget = window.scrollY + scrollAdjustment;
					
					console.log('Target position in viewport:', targetPosition);
					console.log('Scroll adjustment needed:', scrollAdjustment);
					console.log('Scroll target:', scrollTarget);
					
					window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
					
					setTimeout(() => {
						const newInputRect = activeInput.getBoundingClientRect();
						console.log('=== AFTER SCROLL ===');
						console.log('Input top from viewport:', newInputRect.top);
						console.log('Input centered at:', newInputRect.top + (newInputRect.height / 2));
						console.log('Target center was:', targetPosition + (inputRect.height / 2));
					}, 500);
				} else {
					console.log('WARNING: Keyboard element not found');
				}
			}, 300);
		}
	}

	function handleVerseInitialsClick(event) {
		activeInput = event?.currentTarget || null;
		keyboardInput = verseInitials;
		showKeyboard = showKeyboard === 'verse' ? null : 'verse';
	}

	function handleBookInitialsClick(event) {
		activeInput = event?.currentTarget || null;
		keyboardInput = bookInitials;
		showKeyboard = showKeyboard === 'book' ? null : 'book';
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
			verseInitials += mappedValue;
			keyboardInput = verseInitials;
		} else if (activeInput.id.includes('bookInitials')) {
			bookInitialsAuto = false;
			bookInitials += mappedValue;
			keyboardInput = bookInitials;
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
			verseInitials = verseInitials.slice(0, -1);
			keyboardInput = verseInitials;
		} else if (activeInput.id.includes('bookInitials')) {
			bookInitialsAuto = false;
			bookInitials = bookInitials.slice(0, -1);
			keyboardInput = bookInitials;
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
				verseInitials += mappedValue;
				keyboardInput = verseInitials;
			} else if (activeInput.id.includes('bookInitials')) {
				bookInitialsAuto = false;
				bookInitials += mappedValue;
				keyboardInput = bookInitials;
			}
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
			repetitions: resetReviewData ? 0 : (existingVerse?.repetitions || 0)
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

	function handleModalConfirm() {
		showModal = false;
		if (confirmAction) {
			confirmAction();
			confirmAction = null;
		}
		modalType = 'alert';
	}

	function closeModal() {
		showModal = false;
		if (cancelAction) {
			cancelAction();
			cancelAction = null;
		}
		modalType = 'alert';
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
		bookInitialsAuto = true;
	}

	function toggleAll() {
		const listDiv = document.querySelector('.verses-list');
		if (!listDiv) return;
		
		if (expandedBooks.length > 0 || expandedChapters.length > 0) {
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

	$: groupedVerses = buildGroupedVerses(versesList);

	// Close collection dropdown on resize or click outside
	function handleResize() {
		if (showCollectionDropdown) {
			showCollectionDropdown = false;
		}
	}

	function handleClickOutside(event) {
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
		<h3>{editingId ? t('update_verse') : t('save_verse')}</h3>

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
						min="1"
						readonly
						on:click={(e) => {
							activeInput = e.target;
							showKeyboard = 'numeric';
						}}
					/>
				</div>
				<div class="field">
					<label for="verseNumber">{t('verse')}</label>
					<input
						type="number"
						id="verseNumber"
						bind:value={verseNumber}
						min="1"
						readonly
						on:click={(e) => {
							activeInput = e.target;
							showKeyboard = 'numeric';
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
					<input
						id="verseInitials"
						type="text"
						bind:value={verseInitials}
						readonly
						on:click={handleVerseInitialsClick}
					/>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'zhuyin'}
				<div class="field">
					<label for="verseInitialsZhuyin">{t('zhuyin_initials_verse')}</label>
					<p class="helper-text">{t('zhuyin_helper')}</p>
					<input
						id="verseInitialsZhuyin"
						type="text"
						bind:value={verseInitials}
						readonly
						on:click={handleVerseInitialsClick}
					/>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'cangjie'}
				<div class="field">
					<label for="verseInitialsCangjie">{t('cangjie_initials_verse')}</label>
					<p class="helper-text">{t('cangjie_helper')}</p>
					<input
						id="verseInitialsCangjie"
						type="text"
						bind:value={verseInitials}
						readonly
						on:click={handleVerseInitialsClick}
					/>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{/if}

			<!-- Row 5: Book initials -->
			{#if currentInputMethod === 'pinyin'}
				<div class="field">
					<label for="bookInitials">{t('pinyin_initials_book')}</label>
					<input
						id="bookInitials"
						type="text"
						bind:value={bookInitials}
						readonly
						on:click={handleBookInitialsClick}
					/>
					{#if showKeyboard === 'book'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'zhuyin'}
				<div class="field">
					<label for="bookInitialsZhuyin">{t('zhuyin_initials_book')}</label>
					<input
						id="bookInitialsZhuyin"
						type="text"
						bind:value={bookInitials}
						readonly
						on:click={handleBookInitialsClick}
					/>
					{#if showKeyboard === 'book'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{:else if currentInputMethod === 'cangjie'}
				<div class="field">
					<label for="bookInitialsCangjie">{t('cangjie_initials_book')}</label>
					<input
						id="bookInitialsCangjie"
						type="text"
						bind:value={bookInitials}
						readonly
						on:click={handleBookInitialsClick}
					/>
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
					{editingId ? t('update_verse') : t('save_verse')}
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
		<h3>{t('my_verses')}</h3>

		{#if versesList.length > 0}
			<div class="verses-controls">
				<button on:click={toggleAll} class="secondary">
					{(expandedBooks.length > 0 || expandedChapters.length > 0) ? t('collapse_all') : t('expand_all')}
				</button>
				<span class="verse-count">{versesList.length} {t('verses')}</span>
			</div>
		{/if}

		<div class="verses-list">
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
								<!-- Single chapter - show verses directly without chapter header -->
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
								<!-- Multiple chapters - show chapter headers -->
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
	on:confirm={handleModalConfirm}
	on:cancel={closeModal}
/>

<style>
	.add-verse-container {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		padding: 1rem;
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
			border-radius: 0;
		}
	}

	h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: var(--text-color);
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
		font-size: 0.9rem;
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
		font-size: 1rem;
		box-sizing: border-box;
		width: 100%;
		max-width: 100%;
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
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
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
	}

	.verse-count {
		margin-left: auto;
		color: var(--subtitle-color);
		font-size: 0.9rem;
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
		font-size: 1rem;
		color: inherit;
		transition: background 0.3s;
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
	}

	.verse-content {
		padding: 1rem;
		border-top: 1px solid var(--file-border);
	}

	.verse-text {
		margin-bottom: 0;
		line-height: 1.6;
		color: var(--text-color);
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
