<script>
	import { createEventDispatcher } from 'svelte';
	import { collections } from '$lib/stores/collections';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import Modal from './Modal.svelte';
	
	export let collection;
	
	const dispatch = createEventDispatcher();
	
	let selectedVerseId = '';
	let showModal = false;
	let modalMessage = '';
	
	$: collectionVerses = collection.verseIds
		?.map(id => $verses.find(v => v.id === id))
		.filter(v => v != null) || [];
	
	$: availableVerses = $verses.filter(
		v => !collection.verseIds?.includes(v.id)
	);
	
	function addVerseToCollection() {
		if (!selectedVerseId) {
			modalMessage = t('select_verse');
			showModal = true;
			return;
		}
		
		collections.update(cols =>
			cols.map(c =>
				c.id === collection.id
					? { ...c, verseIds: [...(c.verseIds || []), selectedVerseId] }
					: c
			)
		);
		
		selectedVerseId = '';
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
	
	// Import createVerseReferenceFormatter
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	
	// Create formatter that checks all verses for duplicates
	$: formatVerseReference = createVerseReferenceFormatter($verses);
</script>

<div class="collection-detail">
	<div class="detail-header">
		<button class="back-btn" on:click={close}>
			← {t('back')}
		</button>
		<h3>{collection.title}</h3>
	</div>
	
	<div class="add-verse-section">
		<label for="verseSelector">{t('add_verse_to_collection')}</label>
		<div class="add-verse-row">
			<select id="verseSelector" bind:value={selectedVerseId}>
				<option value="">{t('select_verse')}</option>
				{#each availableVerses as verse (verse.id)}
					<option value={verse.id}>
						{formatVerseReference(verse)} - {verse.verseText.substring(0, 30)}...
					</option>
				{/each}
			</select>
			<button on:click={addVerseToCollection} disabled={!selectedVerseId}>
				{t('add')}
			</button>
		</div>
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
	}
	
	.detail-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.back-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--file-border);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		transition: all 0.3s;
	}
	
	.back-btn:hover {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}
	
	h3 {
		margin: 0;
		color: var(--text-color);
		flex: 1;
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
	}
	
	.add-verse-section label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: var(--text-color);
	}
	
	.add-verse-row {
		display: flex;
		gap: 0.5rem;
	}
	
	.add-verse-row select {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1em;
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
	}
	
	.verse-item:hover {
		border-color: var(--accent-color);
	}
	
	.verse-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.verse-reference {
		font-weight: 500;
		color: var(--accent-color);
		font-size: 0.9em;
	}
	
	.verse-text {
		color: var(--text-color);
		line-height: 1.6;
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
		.verse-item {
			flex-direction: column;
			gap: 1rem;
		}
		
		.verse-actions {
			width: 100%;
		}
		
		.icon-btn {
			flex: 1;
		}
	}
</style>
