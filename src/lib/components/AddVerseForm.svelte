<script>
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
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
	let selectedCollectionId = '';

	let showKeyboard = null; // null, 'verse', 'book'
	let activeInput = null;

	let editingId = null;
	let versesList = [];
	let expandedAll = false;
	let expandedBooks = [];
	let expandedChapters = [];
	let expandedVerseId = null;
	let groupedVerses = [];

	let selectOptions = [];
	let bookOptions = [];
	let bibleBooks = [];
	let filteredBookOptions = [];
	let currentInputMethod = 'pinyin';
	let bookInitialsAuto = true;

	// Keyboard state
	let keyboardInput = '';

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
		filteredBookOptions = bookOptions;
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

	function handleVerseInitialsClick(event) {
		activeInput = event?.currentTarget || null;
		keyboardInput = verseInitials;
		console.log('[AddVerse] Verse initials field clicked/focused, input method:', currentInputMethod);

		showKeyboard = showKeyboard === 'verse' ? null : 'verse';
		console.log('[AddVerse] Onscreen keyboard display:', showKeyboard);
	}

	function handleBookInitialsClick(event) {
		activeInput = event?.currentTarget || null;
		keyboardInput = bookInitials;
		console.log('[AddVerse] Book initials field clicked/focused, input method:', currentInputMethod);

		showKeyboard = showKeyboard === 'book' ? null : 'book';
		console.log('[AddVerse] Onscreen keyboard display:', showKeyboard);
	}

	function handleKeyboardKey(event) {
		if (!activeInput) return;

		const key = event.detail;

		if (activeInput.id === 'verseInitials') {
			verseInitials += key;
			keyboardInput = verseInitials;
		} else if (activeInput.id === 'bookInitials') {
			bookInitialsAuto = false;
			bookInitials += key;
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
		if (activeInput.id === 'verseInitials') {
			verseInitials = verseInitials.slice(0, -1);
			keyboardInput = verseInitials;
		} else if (activeInput.id === 'bookInitials') {
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
			if (activeInput.id === 'verseInitials') {
				verseInitials += mappedValue;
				keyboardInput = verseInitials;
			} else if (activeInput.id === 'bookInitials') {
				bookInitialsAuto = false;
				bookInitials += mappedValue;
				keyboardInput = bookInitials;
			}
		}
	}

	function updateBookInitialsFromBookName(force = false) {
		const match = findBookByName(bookName);
		if (!match) return;
		if (!bookInitials || bookInitialsAuto || force) {
			bookInitials = getBookInitialsForMethod(match, currentInputMethod);
			bookInitialsAuto = true;
			console.log('[AddVerse] Auto-filled book initials', {
				bookName,
				bookInitials,
				inputMethod: currentInputMethod
			});
		}
	}

	function updateBookSuggestions(inputValue = '') {
		const query = (inputValue || '').trim().toLowerCase();
		console.log('[AddVerse] Book name input changed:', inputValue);
		
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
		console.log('[AddVerse] Filtered book options:', filteredBookOptions);
	}
	
	function selectBookSuggestion(selectedHanzi) {
		bookName = selectedHanzi;
		// Auto-fill book initials based on input method
		const book = bibleBooks.find((b) => b.hanzi === selectedHanzi);
		if (book) {
			bookInitials = getBookInitialsForMethod(book, currentInputMethod);
			bookInitialsAuto = true;
			console.log('[AddVerse] Selected book:', selectedHanzi, 'Initials:', bookInitials);
		}
		filteredBookOptions = []; // Hide suggestions after selection
		activeInput = null;
		showKeyboard = null;
	}

	function saveVerse() {
		// Validation
		console.log('[AddVerse] Attempting to save verse', {
			bookName,
			chapterNumber,
			verseNumber,
			inputMethod: currentInputMethod
		});
		if (!verseText.trim() || !bookName.trim() || !chapterNumber || !verseNumber) {
			alert(t('fill_all_fields'));
			return;
		}

		if (!verseInitials.trim() || !bookInitials.trim()) {
			alert(t('fill_all_fields'));
			return;
		}

		if (isNaN(parseInt(chapterNumber)) || isNaN(parseInt(verseNumber))) {
			alert(t('chapter_verse_numbers'));
			return;
		}

		const newVerse = {
			id: editingId || Date.now().toString(),
			verseText: verseText.trim(),
			bookName: bookName.trim(),
			chapterNumber: parseInt(chapterNumber),
			verseNumber: parseInt(verseNumber),
			verseInitials: verseInitials.trim(),
			bookInitials: bookInitials.trim(),
			bibleVersion: bibleVersion || 'Unknown',
			lastReviewed: editingId
				? $verses.find((v) => v.id === editingId)?.lastReviewed || null
				: null,
			dueDate: editingId
				? $verses.find((v) => v.id === editingId)?.dueDate || null
				: null,
			interval: editingId ? $verses.find((v) => v.id === editingId)?.interval || 1 : 1,
			repetitions: editingId ? $verses.find((v) => v.id === editingId)?.repetitions || 0 : 0
		};

		if (editingId) {
			verses.update((list) => list.map((v) => (v.id === editingId ? newVerse : v)));
			alert(t('verse_updated'));
		} else {
			verses.update((list) => [...list, newVerse]);
			alert(t('verse_saved'));
		}

		// Add to collection if selected
		if (selectedCollectionId) {
			collections.update(cols =>
				cols.map(c =>
					c.id === selectedCollectionId
						? { ...c, verseIds: [...(c.verseIds || []), newVerse.id] }
						: c
				)
			);
		}

		clearForm();
	}

	function deleteVerse(id) {
		if (!confirm(t('delete_confirmation'))) return;

		verses.update((list) => list.filter((v) => v.id !== id));
		expandedVerseId = null;
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
		bibleVersion = verse.bibleVersion;
		
		// Find collection containing this verse
		const verseCollection = $collections.find(c => c.verseIds?.includes(id));
		selectedCollectionId = verseCollection?.id || '';
		
		editingId = id;

		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function clearForm() {
		verseText = '';
		bookName = '';
		chapterNumber = '';
		verseNumber = '';
		verseInitials = '';
		bookInitials = '';
		bibleVersion = '';
		selectedCollectionId = '';
		editingId = null;
		showKeyboard = null;
		keyboardInput = '';
		bookInitialsAuto = true;
	}

	function expandAll() {
		expandedAll = true;
	}

	function collapseAll() {
		expandedAll = false;
		expandedBooks = [];
		expandedChapters = [];
		expandedVerseId = null;
	}

	function toggleBook(bookKey) {
		expandedAll = false;
		console.log('[AddVerse] Toggle book called', {
			bookKey,
			currentExpandedBooks: expandedBooks,
			isCurrentlyExpanded: expandedBooks.includes(bookKey)
		});
		if (expandedBooks.includes(bookKey)) {
			expandedBooks = expandedBooks.filter((book) => book !== bookKey);
			console.log('[AddVerse] Book collapsed, new expandedBooks:', expandedBooks);
			return;
		}
		expandedBooks = [...expandedBooks, bookKey];
		console.log('[AddVerse] Book expanded, new expandedBooks:', expandedBooks);
	}

	function getChapterKey(bookKey, chapterNumber) {
		return `${bookKey}-${chapterNumber}`;
	}

	function toggleChapter(bookKey, chapterNumber) {
		expandedAll = false;
		const chapterKey = getChapterKey(bookKey, chapterNumber);
		console.log('[AddVerse] Toggle chapter called', {
			bookKey,
			chapterNumber,
			chapterKey,
			currentExpandedChapters: expandedChapters,
			isCurrentlyExpanded: expandedChapters.includes(chapterKey)
		});
		if (expandedChapters.includes(chapterKey)) {
			expandedChapters = expandedChapters.filter((key) => key !== chapterKey);
			console.log('[AddVerse] Chapter collapsed, new expandedChapters:', expandedChapters);
			return;
		}
		expandedChapters = [...expandedChapters, chapterKey];
		console.log('[AddVerse] Chapter expanded, new expandedChapters:', expandedChapters);
	}

	function toggleVerse(verseId) {
		console.log('[AddVerse] Toggle verse called', {
			verseId,
			currentExpandedVerseId: expandedVerseId
		});
		expandedVerseId = expandedVerseId === verseId ? null : verseId;
		console.log('[AddVerse] New expandedVerseId:', expandedVerseId);
	}

	function isBookExpanded(bookKey) {
		const result = expandedAll || expandedBooks.includes(bookKey);
		console.log('[AddVerse] isBookExpanded check', { bookKey, expandedAll, expandedBooks, result });
		return result;
	}

	function isChapterExpanded(bookKey, chapterNumber) {
		const result = expandedAll || expandedChapters.includes(getChapterKey(bookKey, chapterNumber));
		console.log('[AddVerse] isChapterExpanded check', { bookKey, chapterNumber, expandedAll, expandedChapters, result });
		return result;
	}

	function buildGroupedVerses(list) {
		const grouped = [];
		list.forEach((verse) => {
			let bookGroup = grouped.find((entry) => entry.bookName === verse.bookName);
			if (!bookGroup) {
				bookGroup = { bookName: verse.bookName, chapters: [] };
				grouped.push(bookGroup);
			}

			let chapterGroup = bookGroup.chapters.find(
				(entry) => entry.chapterNumber === verse.chapterNumber
			);
			if (!chapterGroup) {
				chapterGroup = { chapterNumber: verse.chapterNumber, verses: [] };
				bookGroup.chapters.push(chapterGroup);
			}
			chapterGroup.verses.push(verse);
		});
		return grouped;
	}

	$: groupedVerses = buildGroupedVerses(versesList);
</script>

<svelte:document on:keydown={handlePhysicalKey} />

<span class="visually-hidden" aria-hidden="true">{$settings.languagePreference}</span>

<div class="add-verse-container">
	<!-- Form Section -->
	<div class="form-section">
		<h3>{editingId ? t('update_verse') : t('save_verse')}</h3>

		<div class="form-grid">
			<div class="field">
				<label for="verseText">{t('chinese_verse_text')}</label>
				<textarea id="verseText" bind:value={verseText} rows="4" placeholder="粘貼中文經文..."></textarea>
			</div>

			<div class="field" style="position: relative;">
				<label for="bookName">{t('chinese_book_name')}</label>
				<input
					type="text"
					id="bookName"
					bind:value={bookName}
					placeholder={t('chinese_book_name')}
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
					<div class="autocomplete-suggestions">
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

			<div class="form-row">
				<div class="field">
					<label for="chapterNumber">{t('chapter')}</label>
					<input
						type="number"
						id="chapterNumber"
						bind:value={chapterNumber}
						placeholder="1"
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
						placeholder="1"
						min="1"
						readonly
						on:click={(e) => {
							activeInput = e.target;
							showKeyboard = 'numeric';
						}}
					/>
				</div>
				<div class="field">
					<label for="bibleVersion">{t('default_bible_version')}</label>
					<input
						type="text"
						id="bibleVersion"
						bind:value={bibleVersion}
						placeholder="e.g., ESV"
						list="versions"
						on:focus={() => {
							activeInput = null;
							showKeyboard = null;
						}}
					/>
					<datalist id="versions">
						{#each selectOptions as version}
							<option value={version}></option>
						{/each}
					</datalist>
				</div>
				<div class="field">
					<label for="collectionSelector">{t('add_to_collection_optional')}</label>
					<select
						id="collectionSelector"
						bind:value={selectedCollectionId}
						on:focus={() => {
							activeInput = null;
							showKeyboard = null;
						}}
					>
						<option value="">{t('none')}</option>
						{#each $collections as collection (collection.id)}
							<option value={collection.id}>{collection.title}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Initials input based on input method -->
			{#if currentInputMethod === 'pinyin'}
				<div class="field">
					<label for="verseInitials">{t('pinyin_initials_verse')}</label>
					<p class="helper-text">{t('pinyin_helper')}</p>
					<input
						id="verseInitials"
						type="text"
						bind:value={verseInitials}
						placeholder="e.g., jhhbzb"
						on:focus={handleVerseInitialsClick}
					/>
				</div>
				<div class="field">
					<label for="bookInitials">{t('pinyin_initials_book')}</label>
					<input
						id="bookInitials"
						type="text"
						bind:value={bookInitials}
						placeholder="e.g., yfs"
						on:focus={handleBookInitialsClick}
						on:input={() => (bookInitialsAuto = false)}
					/>
				</div>
			{:else if currentInputMethod === 'zhuyin'}
				<div class="field">
					<label for="verseInitialsZhuyin">{t('zhuyin_initials_verse')}</label>
					<p class="helper-text">{t('zhuyin_helper')}</p>
					<input
						id="verseInitialsZhuyin"
						type="text"
						bind:value={verseInitials}
						placeholder="點擊以使用鍵盤"
						readonly
						on:click={handleVerseInitialsClick}
					/>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
				<div class="field">
					<label for="bookInitialsZhuyin">{t('zhuyin_initials_book')}</label>
					<input
						id="bookInitialsZhuyin"
						type="text"
						bind:value={bookInitials}
						placeholder="點擊以使用鍵盤"
						readonly
						on:click={handleBookInitialsClick}
					/>
					{#if showKeyboard === 'book'}
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
						placeholder="點擊以使用鍵盤"
						readonly
						on:click={handleVerseInitialsClick}
					/>
					{#if showKeyboard === 'verse'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
				<div class="field">
					<label for="bookInitialsCangjie">{t('cangjie_initials_book')}</label>
					<input
						id="bookInitialsCangjie"
						type="text"
						bind:value={bookInitials}
						placeholder="點擊以使用鍵盤"
						readonly
						on:click={handleBookInitialsClick}
					/>
					{#if showKeyboard === 'book'}
						<Keyboard layout={keyboardLayout} on:key={handleKeyboardKey} showEnter={true} />
					{/if}
				</div>
			{/if}

			<!-- Numeric Keyboard for Chapter/Verse Numbers -->
			{#if showKeyboard === 'numeric'}
				<Keyboard layout={keyboardLayouts.numeric} on:key={handleKeyboardKey} />
			{/if}

			<div class="button-group">
				<button class="primary" on:click={saveVerse}>{t('save_verse')}</button>
				<button class="secondary" on:click={clearForm}>{t('clear_form')}</button>
			</div>
		</div>
	</div>

	<!-- My Verses Section -->
	<div class="verses-section">
		<h3>{t('my_verses')}</h3>

		<div class="verses-controls">
			<button on:click={expandAll} class="secondary-small">{t('expand_all')}</button>
			<button on:click={collapseAll} class="secondary-small">{t('collapse_all')}</button>
			<span class="verse-count">{versesList.length} {t('verses')}</span>
		</div>

		<div class="verses-list">
			{#each groupedVerses as book}
				<div class="verse-item">
					<button
						class="verse-header"
						on:click={() => toggleBook(book.bookName)}
						type="button"
					>
						<span class="book-ref">{book.bookName}</span>
						<span class="toggle-icon">{isBookExpanded(book.bookName) ? '▼' : '▶'}</span>
					</button>

					{#if isBookExpanded(book.bookName)}
						<div class="verse-content">
							{#each book.chapters as chapter}
								<button
									class="verse-header chapter-header"
									on:click={() => toggleChapter(book.bookName, chapter.chapterNumber)}
									type="button"
								>
									<span class="book-ref">
										{t('chapter_heading')} {chapter.chapterNumber}
									</span>
									<span class="toggle-icon">
										{isChapterExpanded(book.bookName, chapter.chapterNumber) ? '▼' : '▶'}
									</span>
								</button>

								{#if isChapterExpanded(book.bookName, chapter.chapterNumber)}
									{#each chapter.verses as verse}
										<div class="verse-item verse-item-nested">
											<button
												class="verse-header"
												on:click={() => toggleVerse(verse.id)}
												type="button"
											>
												<span class="book-ref">
													{verse.chapterNumber}:{verse.verseNumber}
												</span>
												<span class="toggle-icon">
													{expandedAll || expandedVerseId === verse.id ? '▼' : '▶'}
												</span>
											</button>

											{#if expandedAll || expandedVerseId === verse.id}
												<div class="verse-content">
													<div class="verse-text">{verse.verseText}</div>
													<div class="verse-meta">
														<div class="meta-item">
															<span class="label">Version:</span>
															<span class="value">{verse.bibleVersion}</span>
														</div>
														<div class="meta-item">
															<span class="label">Initials:</span>
															<span class="value">{verse.verseInitials}</span>
														</div>
														{#if verse.lastReviewed}
															<div class="meta-item">
																<span class="label">Last Reviewed:</span>
																<span class="value">
																	{new Date(verse.lastReviewed).toLocaleDateString()}
																</span>
															</div>
														{/if}
													</div>
													<div class="verse-actions">
														<button
															class="secondary-small"
															on:click={() => editVerse(verse.id)}
														>
															{t('edit')}
														</button>
														<button
															class="danger-small"
															on:click={() => deleteVerse(verse.id)}
														>
															{t('delete')}
														</button>
													</div>
												</div>
											{/if}
										</div>
									{/each}
								{/if}
							{/each}
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

<style>
	.add-verse-container {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		padding: 1rem;
		padding-bottom: 400px; /* Add space for keyboard at bottom */
	}

	@media (min-width: 768px) {
		.add-verse-container {
			grid-template-columns: 1fr 1fr;
		}
	}

	.form-section,
	.verses-section {
		background: var(--panel-background);
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: var(--panel-shadow);
	}

	h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: var(--text-color);
	}

	.form-grid {
		display: grid;
		gap: 1rem;
	}

	.field {
		display: grid;
		gap: 0.5rem;
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

	.helper-text {
		margin: 0;
		padding: 0;
		font-size: 0.85rem;
		color: var(--subtitle-color);
		font-style: italic;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
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
	}

	button.primary {
		background: var(--accent-color);
		color: white;
	}

	button.primary:hover {
		opacity: 0.9;
	}

	button.secondary,
	button.secondary-small {
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
	}

	button.secondary-small {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
	}

	button.danger-small {
		background: #d32f2f;
		color: white;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
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
		margin-bottom: 1rem;
		line-height: 1.6;
		color: var(--text-color);
	}

	.verse-meta {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: var(--file-bg);
	.verse-item-nested {
		margin: 0.5rem 0 0.75rem;
		border-color: transparent;
		background: transparent;
	}
		border-radius: 4px;
	}

	.meta-item {
		display: flex;
		gap: 0.5rem;
		font-size: 0.9rem;
	.chapter-header {
		background: var(--file-bg);
		border-top: 1px solid var(--file-border);
		font-size: 0.95rem;
	}
	}

	.meta-item .label {
		color: var(--subtitle-color);
		font-weight: 500;
	}

	.meta-item .value {
		color: var(--text-color);
	}

	.verse-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--subtitle-color);
	}
</style>
