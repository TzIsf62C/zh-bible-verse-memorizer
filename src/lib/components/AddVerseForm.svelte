<script>
	import { verses } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';

	let verseText = '';
	let bookName = '';
	let chapterNumber = '';
	let verseNumber = '';
	let verseInitials = '';
	let bookInitials = '';
	let bibleVersion = '';

	let showKeyboard = null; // null, 'verse', 'book'
	let activeInput = null;

	let editingId = null;
	let versesList = [];
	let expandedIndex = null;

	let selectOptions = [];

	// Keyboard state
	let keyboardInput = '';

	// Update from store
	$: {
		versesList = $verses;
		selectOptions = [
			...new Set($verses.map((v) => v.bibleVersion).filter(Boolean))
		];
	}

	// Get current keyboard layout
	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	function handleVerseInitialsClick() {
		showKeyboard = showKeyboard === 'verse' ? null : 'verse';
		if (showKeyboard === 'verse') {
			activeInput = document.getElementById('verseInitials');
			keyboardInput = verseInitials;
		}
	}

	function handleBookInitialsClick() {
		showKeyboard = showKeyboard === 'book' ? null : 'book';
		if (showKeyboard === 'book') {
			activeInput = document.getElementById('bookInitials');
			keyboardInput = bookInitials;
		}
	}

	function handleKeyboardKey(event) {
		if (!activeInput) return;

		const key = event.detail;

		if (activeInput.id === 'verseInitials') {
			verseInitials += key;
			keyboardInput = verseInitials;
		} else if (activeInput.id === 'bookInitials') {
			bookInitials += key;
			keyboardInput = bookInitials;
		}
	}

	function handleBackspace() {
		if (activeInput.id === 'verseInitials') {
			verseInitials = verseInitials.slice(0, -1);
			keyboardInput = verseInitials;
		} else if (activeInput.id === 'bookInitials') {
			bookInitials = bookInitials.slice(0, -1);
			keyboardInput = bookInitials;
		}
	}

	function handlePhysicalKey(event) {
		if (!activeInput) return;

		const key = event.key.toLowerCase();
		const inputMethod = $settings.inputMethod;

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
				bookInitials += mappedValue;
				keyboardInput = bookInitials;
			}
		}
	}

	function saveVerse() {
		// Validation
		if (!verseText.trim() || !bookName.trim() || !chapterNumber || !verseNumber) {
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

		clearForm();
	}

	function deleteVerse(id) {
		if (!confirm(t('delete_confirmation'))) return;

		verses.update((list) => list.filter((v) => v.id !== id));
		expandedIndex = null;
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
		editingId = null;
		showKeyboard = null;
		keyboardInput = '';
	}

	function expandAll() {
		expandedIndex = 'all';
	}

	function collapseAll() {
		expandedIndex = null;
	}

	function toggleExpanded(idx) {
		expandedIndex = expandedIndex === idx ? null : idx;
	}
</script>

<svelte:document on:keydown={handlePhysicalKey} />

<div class="add-verse-container">
	<!-- Form Section -->
	<div class="form-section">
		<h3>{editingId ? t('update_verse') : t('save_verse')}</h3>

		<div class="form-grid">
			<div class="field">
				<label for="verseText">{t('chinese_verse_text')}</label>
				<textarea id="verseText" bind:value={verseText} rows="4" placeholder="粘貼中文經文..."></textarea>
			</div>

			<div class="field">
				<label for="bookName">{t('chinese_book_name')}</label>
				<input type="text" id="bookName" bind:value={bookName} placeholder={t('chinese_book_name')} />
			</div>

			<div class="form-row">
				<div class="field">
					<label for="chapterNumber">{t('chapter')}</label>
					<input type="number" id="chapterNumber" bind:value={chapterNumber} placeholder="1" min="1" />
				</div>
				<div class="field">
					<label for="verseNumber">{t('verse')}</label>
					<input type="number" id="verseNumber" bind:value={verseNumber} placeholder="1" min="1" />
				</div>
				<div class="field">
					<label for="bibleVersion">{t('default_bible_version')}</label>
					<input type="text" id="bibleVersion" bind:value={bibleVersion} placeholder="e.g., ESV" list="versions" />
					<datalist id="versions">
						{#each selectOptions as version}
							<option value={version}></option>
						{/each}
					</datalist>
				</div>
			</div>

			<!-- Initials input based on input method -->
			{#if $settings.inputMethod === 'pinyin'}
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
					/>
				</div>
			{:else if $settings.inputMethod === 'zhuyin'}
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
						<Keyboard {keyboardLayout} on:key={handleKeyboardKey} />
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
						<Keyboard {keyboardLayout} on:key={handleKeyboardKey} />
					{/if}
				</div>
			{:else if $settings.inputMethod === 'cangjie'}
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
						<Keyboard {keyboardLayout} on:key={handleKeyboardKey} />
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
						<Keyboard {keyboardLayout} on:key={handleKeyboardKey} />
					{/if}
				</div>
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
			{#each versesList as verse, idx}
				<div class="verse-item">
					<button
						class="verse-header"
						on:click={() => toggleExpanded(idx)}
						type="button"
					>
						<span class="book-ref">
							{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
						</span>
						<span class="toggle-icon">{expandedIndex === idx ? '▼' : '▶'}</span>
					</button>

					{#if expandedIndex === idx}
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
		border-radius: 4px;
	}

	.meta-item {
		display: flex;
		gap: 0.5rem;
		font-size: 0.9rem;
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
