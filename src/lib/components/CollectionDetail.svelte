<script>
	import { createEventDispatcher } from 'svelte';
	import { collections } from '$lib/stores/collections';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import Modal from './Modal.svelte';
	import { onMount, afterUpdate } from 'svelte';
	import { createVerseReferenceFormatter, sortVersesByBibleOrder } from '$lib/utils/bibleBooks';
	
	export let collection;
	
	const dispatch = createEventDispatcher();
	let detailElement;
	let headerElement;
	let addVerseElement;
	
	onMount(() => {
		logWidths();
	});
	
	afterUpdate(() => {
		logWidths();
	});
	
	function logWidths() {
		if (detailElement) {
			const rect = detailElement.getBoundingClientRect();
			console.log('=== COLLECTION DETAIL ===');
			console.log('Detail element:', detailElement);
			console.log('Width:', rect.width);
			console.log('Offset width:', detailElement.offsetWidth);
			console.log('Scroll width:', detailElement.scrollWidth);
			console.log('Client width:', detailElement.clientWidth);
			console.log('Is overflowing:', detailElement.scrollWidth > detailElement.clientWidth);
		}
		if (headerElement) {
			const headerRect = headerElement.getBoundingClientRect();
			console.log('=== DETAIL HEADER ===');
			console.log('Header width:', headerRect.width);
			console.log('Header offset width:', headerElement.offsetWidth);
			console.log('Header scroll width:', headerElement.scrollWidth);
			console.log('Header is overflowing:', headerElement.scrollWidth > headerElement.clientWidth);
		}
		if (addVerseElement) {
			const addRect = addVerseElement.getBoundingClientRect();
			console.log('=== ADD VERSE SECTION ===');
			console.log('Add verse width:', addRect.width);
			console.log('Add verse scroll width:', addVerseElement.scrollWidth);
			console.log('Add verse is overflowing:', addVerseElement.scrollWidth > addVerseElement.clientWidth);
		}
	}
	
	let selectedVerseIds = [];
	let showModal = false;
	let modalMessage = '';
	$: isReadOnlyCollection = Boolean(collection?.isComputed || collection?.readOnly);
	
	$: collectionVerses = collection.verseIds
		?.map(id => $verses.find(v => v.id === id))
		.filter(v => v != null) || [];
	
	$: availableVerses = isReadOnlyCollection ? [] : $verses.filter(
		v => !collection.verseIds?.includes(v.id)
	);
	
	function addVerseToCollection() {
		if (!selectedVerseIds.length) {
			modalMessage = t('select_verse');
			showModal = true;
			return;
		}
		
		collections.update(cols =>
			cols.map(c =>
				c.id === collection.id
					? { ...c, verseIds: [...(c.verseIds || []), ...selectedVerseIds] }
					: c
			)
		);
		
		selectedVerseIds = [];
	}
	
	function removeVerseFromCollection(verseId) {
		collections.update(cols =>
			cols.map(c =>
				c.id === collection.id
					? { ...c, verseIds: (c.verseIds || []).filter(id => id !== verseId) }
					: c
			)
		);
	}
	
	function moveVerseUp(verseId) {
		collections.update(cols =>
			cols.map(c => {
				if (c.id !== collection.id) return c;
				
				const verseIds = [...(c.verseIds || [])];
				const index = verseIds.indexOf(verseId);
				if (index <= 0) return c;
				
				[verseIds[index - 1], verseIds[index]] = [verseIds[index], verseIds[index - 1]];
				return { ...c, verseIds };
			})
		);
	}
	
	function moveVerseDown(verseId) {
		collections.update(cols =>
			cols.map(c => {
				if (c.id !== collection.id) return c;
				
				const verseIds = [...(c.verseIds || [])];
				const index = verseIds.indexOf(verseId);
				if (index === -1 || index >= verseIds.length - 1) return c;
				
				[verseIds[index], verseIds[index + 1]] = [verseIds[index + 1], verseIds[index]];
				return { ...c, verseIds };
			})
		);
	}
	
	function close() {
		dispatch('close');
	}
	
	// Create formatter that checks all verses for duplicates
	$: formatVerseReference = createVerseReferenceFormatter($verses);
	$: sortedAvailableVerses = sortVersesByBibleOrder(availableVerses);
	$: groupedAvailableVerses = sortedAvailableVerses.reduce((books, verse) => {
		let bookGroup = books.find((book) => book.bookName === verse.bookName);
		if (!bookGroup) {
			bookGroup = {
				bookName: verse.bookName,
				chapters: []
			};
			books.push(bookGroup);
		}

		let chapterGroup = bookGroup.chapters.find(
			(chapter) => String(chapter.chapterNumber) === String(verse.chapterNumber)
		);
		if (!chapterGroup) {
			chapterGroup = {
				chapterNumber: verse.chapterNumber,
				verses: []
			};
			bookGroup.chapters.push(chapterGroup);
		}

		chapterGroup.verses.push(verse);
		return books;
	}, []);

	function toggleVerseSelection(verseId, checked) {
		if (checked) {
			if (!selectedVerseIds.includes(verseId)) {
				selectedVerseIds = [...selectedVerseIds, verseId];
			}
			return;
		}

		selectedVerseIds = selectedVerseIds.filter((id) => id !== verseId);
	}
</script>

<div class="collection-detail">
	<div class="detail-header" bind:this={headerElement}>
		<button class="back-btn" on:click={close} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
				<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<h3>{collection.title}</h3>
		<div class="spacer" aria-hidden="true"></div>
	</div>
	
	<div class="add-verse-section" bind:this={addVerseElement}>
		{#if isReadOnlyCollection}
			<p class="help-text">{t('dynamic_collection_read_only_note')}</p>
		{:else}
			<label for="verseSelector">{t('add_verse_to_collection')}</label>
			<div class="add-verse-row">
				<div id="verseSelector" class="verse-picker" role="group" aria-label={t('select_verse')}>
					{#if groupedAvailableVerses.length === 0}
						<div class="picker-empty">{t('no_verses')}</div>
					{:else}
						{#each groupedAvailableVerses as bookGroup (bookGroup.bookName)}
							<details class="book-group">
								<summary class="group-toggle">
									<span class="toggle-icon" aria-hidden="true">▶</span>
									<span class="group-label">{bookGroup.bookName}</span>
									<span class="group-count">({bookGroup.chapters.reduce((total, chapter) => total + chapter.verses.length, 0)})</span>
								</summary>

								<div class="chapter-groups">
									{#each bookGroup.chapters as chapterGroup (chapterGroup.chapterNumber)}
										<details class="chapter-group">
											<summary class="group-toggle chapter-toggle">
												<span class="toggle-icon" aria-hidden="true">▶</span>
												<span class="group-label">{t('chapter')} {chapterGroup.chapterNumber}</span>
												<span class="group-count">({chapterGroup.verses.length})</span>
											</summary>

											<div class="chapter-verses">
												{#each chapterGroup.verses as verse (verse.id)}
													<label class="verse-option" for={`verse-opt-${verse.id}`}>
														<input
															id={`verse-opt-${verse.id}`}
															type="checkbox"
															checked={selectedVerseIds.includes(verse.id)}
															on:change={(event) => toggleVerseSelection(verse.id, event.currentTarget.checked)}
														/>
														<span>{formatVerseReference(verse)}</span>
													</label>
												{/each}
											</div>
										</details>
									{/each}
								</div>
							</details>
						{/each}
					{/if}
				</div>
				<button on:click={addVerseToCollection} disabled={selectedVerseIds.length === 0}>
					{t('add')}
				</button>
			</div>
		{/if}
	</div>
	
	<div class="verses-list">
		<h4>
			{t('verses_in_collection')}
			<span class="count">({collectionVerses.length})</span>
		</h4>
		
		{#if collectionVerses.length === 0}
			<div class="empty-state">
				<p>{t('no_verses_in_collection')}</p>
			</div>
		{:else}
			{#each collectionVerses as verse, index (verse.id)}
				<div class="verse-item">
					<div class="verse-content">
						<div class="verse-reference">
							{formatVerseReference(verse)}
						</div>
						<div class="verse-text">
							{verse.verseText}
						</div>
					</div>
					<div class="verse-actions">
						{#if !isReadOnlyCollection}
							<button
								class="icon-btn"
								on:click={() => moveVerseUp(verse.id)}
								disabled={index === 0}
								title={t('move_up')}
							>
								▲
							</button>
							<button
								class="icon-btn"
								on:click={() => moveVerseDown(verse.id)}
								disabled={index === collectionVerses.length - 1}
								title={t('move_down')}
							>
								▼
							</button>
							<button
								class="icon-btn danger"
								on:click={() => removeVerseFromCollection(verse.id)}
								title={t('remove')}
							>
								❌
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<Modal 
	show={showModal} 
	message={modalMessage}
	on:confirm={() => showModal = false}
/>

<style>
	.collection-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
		max-width: 100%;
		overflow-x: hidden;
	}
	
	.detail-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 0;
		max-width: 100%;
	}
	
	.back-btn {
		width: 40px;
		height: 40px;
		padding: 0;
		border: none;
		background: none;
		color: var(--text-color);
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
	}
	
	.back-btn:hover {
		background: var(--nav-button-bg);
	}

	.detail-header .spacer {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}
	
	h3 {
		margin: 0;
		color: var(--text-color);
		flex: 1;
		min-width: 0;
		text-align: center;
		overflow-wrap: break-word;
		word-wrap: break-word;
	}
	
	h4 {
		margin: 0 0 1rem 0;
		color: var(--text-color);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.count {
		font-weight: normal;
		font-size: 0.9em;
		color: var(--subtitle-color);
	}
	
	.add-verse-section {
		padding: 1rem;
		background: var(--panel-background);
		border: 1px solid var(--file-border);
		border-radius: 8px;
		min-width: 0;
		max-width: 100%;
	}
	
	.add-verse-section label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: var(--text-color);
	}

	.help-text {
		margin: 0;
		font-size: 0.9em;
		color: var(--subtitle-color);
		line-height: 1.5;
	}
	
	.add-verse-row {
		display: flex;
		gap: 0.5rem;
		min-width: 0;
		max-width: 100%;
	}
	
	.verse-picker {
		flex: 1;
		min-width: 0;
		max-height: 22rem;
		overflow-y: auto;
		padding: 0.5rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1em;
	}

	.picker-empty {
		padding: 0.75rem;
		color: var(--subtitle-color);
	}

	.book-group,
	.chapter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.book-group + .book-group {
		margin-top: 0.35rem;
	}

	.group-toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		padding: 0.45rem 0.5rem;
		border: none;
		background: transparent;
		color: var(--text-color);
		cursor: pointer;
		text-align: left;
		border-radius: 4px;
	}

	.group-toggle::-webkit-details-marker {
		display: none;
	}

	.group-toggle::marker {
		content: '';
	}

	.group-toggle:hover {
		background: var(--nav-button-bg);
	}

	details[open] > .group-toggle .toggle-icon {
		transform: rotate(90deg);
	}

	.chapter-toggle {
		padding-left: 1.25rem;
	}

	.toggle-icon {
		width: 1em;
		text-align: center;
		color: var(--subtitle-color);
	}

	.group-label {
		font-weight: 600;
	}

	.group-count {
		margin-left: auto;
		font-size: 0.9em;
		color: var(--subtitle-color);
	}

	.chapter-groups {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.chapter-verses {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.15rem 0.4rem 0.4rem 2rem;
	}

	.verse-option {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		padding: 0.2rem 0;
		cursor: pointer;
		line-height: 1.4;
	}

	.verse-option input {
		margin-top: 0.2rem;
	}
	
	.add-verse-row button {
		padding: 0.75rem 1.5rem;
		border: none;
		background: var(--accent-color);
		color: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: all 0.3s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	
	.add-verse-row button:hover:not(:disabled) {
		opacity: 0.9;
	}
	
	.add-verse-row button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.verses-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		max-width: 100%;
	}
	
	.verse-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		background: var(--panel-background);
		border: 1px solid var(--file-border);
		border-radius: 8px;
		transition: all 0.3s;
		min-width: 0;
		max-width: 100%;
	}
	
	.verse-item:hover {
		border-color: var(--accent-color);
	}
	
	.verse-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
		overflow-wrap: break-word;
	}
	
	.verse-reference {
		font-weight: 500;
		color: var(--accent-color);
		font-size: 0.9em;
	}
	
	.verse-text {
		color: var(--text-color);
		line-height: 1.6;
		word-wrap: break-word;
		overflow-wrap: break-word;
		font-size: 1.2em;
	}
	
	.verse-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	
	.icon-btn {
		padding: 0.5rem;
		border: 1px solid var(--file-border);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9em;
		transition: all 0.3s;
		min-width: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.icon-btn:hover:not(:disabled) {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}
	
	.icon-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	.icon-btn.danger:hover:not(:disabled) {
		background: #dc3545;
		border-color: #dc3545;
		color: white;
	}
	
	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--subtitle-color);
	}
	
	@media (max-width: 768px) {
		.collection-detail {
			padding: 0;
			gap: 1rem;
			width: 100% !important;
			max-width: 100% !important;
			box-sizing: border-box;
		}
		
		.detail-header {
			padding: 0.75rem 1rem;
			background: var(--panel-background);
			margin: 0;
			width: 100%;
			box-sizing: border-box;
		}
		
		.add-verse-section {
			padding: 1rem;
			border-radius: 0;
			margin: 0;
			width: 100%;
			box-sizing: border-box;
		}
		
		.verses-list {
			padding: 0 1rem;
			width: 100%;
			box-sizing: border-box;
		}
		
		.verse-item {
			flex-direction: column;
			gap: 1rem;
			padding: 0.75rem;
			border-radius: 4px;
		}
		
		.verse-actions {
			width: 100%;
		}
		
		.icon-btn {
			flex: 1;
		}
		
		.detail-header {
			flex-wrap: wrap;
		}
		
		.add-verse-row {
			flex-direction: column;
		}
		
		.add-verse-row button {
			width: 100%;
		}
	}
</style>
