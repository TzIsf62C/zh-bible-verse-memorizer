<script>
	import { collections } from '$lib/stores/collections';
	import { verses } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import CollectionDetail from './CollectionDetail.svelte';
	import Modal from './Modal.svelte';
	import {
		buildNeedsPracticeCollection,
		findCollectionById,
		NEEDS_PRACTICE_COLLECTION_ID
	} from '$lib/utils/computedCollections';

	let newCollectionTitle = '';
	let selectedCollectionId = null;

	// Modal state
	let showModal = false;
	let modalMessage = '';
	let modalType = 'info';
	let modalButtons = [];
	let pendingDeleteId = null;

	$: needsPracticeCollection = buildNeedsPracticeCollection(
		$verses,
		$settings,
		t('needs_practice_collection_title')
	);
	$: displayCollections = [needsPracticeCollection, ...$collections];
	$: selectedCollection = selectedCollectionId
		? findCollectionById($collections, needsPracticeCollection, selectedCollectionId)
		: null;

	function createCollection() {
		const title = newCollectionTitle.trim();
		if (!title) {
			modalMessage = t('enter_title');
			showModal = true;
			return;
		}

		collections.update(cols => [
			...cols,
			{
				id: Date.now().toString(),
				title,
				verseIds: []
			}
		]);

		newCollectionTitle = '';
	}

	function moveCollectionUp(id) {
		if (id === NEEDS_PRACTICE_COLLECTION_ID) return;
		collections.update(cols => {
			const index = cols.findIndex(c => c.id === id);
			if (index <= 0) return cols;

			const newCols = [...cols];
			[newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
			return newCols;
		});
	}

	function moveCollectionDown(id) {
		if (id === NEEDS_PRACTICE_COLLECTION_ID) return;
		collections.update(cols => {
			const index = cols.findIndex(c => c.id === id);
			if (index === -1 || index >= cols.length - 1) return cols;

			const newCols = [...cols];
			[newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
			return newCols;
		});
	}

	function renameCollection(collection) {
		if (collection.id === NEEDS_PRACTICE_COLLECTION_ID || collection.isComputed) return;
		const newTitle = prompt(t('new_collection_title'), collection.title);
		if (newTitle === null) return;

		collections.update(cols =>
			cols.map(c =>
				c.id === collection.id ? { ...c, title: newTitle.trim() } : c
			)
		);
	}

	function deleteCollection(id) {
		if (id === NEEDS_PRACTICE_COLLECTION_ID) return;
		pendingDeleteId = id;
		modalMessage = t('delete_collection_confirmation');
		modalType = 'confirm';
		modalButtons = [
			{ label: t('delete'), action: 'delete', variant: 'danger' },
			{ label: t('cancel'), action: 'cancel', variant: 'secondary' }
		];
		showModal = true;
	}

	function handleModalClick(event) {
		if (event.detail.action === 'delete' && pendingDeleteId) {
			collections.update(cols => cols.filter(c => c.id !== pendingDeleteId));
			if (selectedCollectionId === pendingDeleteId) {
				selectedCollectionId = null;
			}
			pendingDeleteId = null;
		}
		modalType = 'info';
		modalButtons = [];
	}

	function viewCollection(id) {
		selectedCollectionId = id;
	}

	function closeDetail() {
		selectedCollectionId = null;
	}
</script>

<div class="collections-container">
	<h2>{t('collections_title')}</h2>

	{#if !selectedCollection}
		<div class="create-collection">
			<label for="newCollectionTitle">{t('new_collection_title')}</label>
			<div class="create-collection-row">
				<input
					id="newCollectionTitle"
					type="text"
					bind:value={newCollectionTitle}
					on:keydown={(e) => e.key === 'Enter' && createCollection()}
					placeholder={t('new_collection_title')}
				/>
				<button on:click={createCollection}>
					{t('create_collection')}
				</button>
			</div>
		</div>
	{/if}

	{#if !selectedCollection}
		<div class="collections-list">
			{#if displayCollections.length === 0}
				<div class="empty-state">
					<p>{t('no_collections')}</p>
				</div>
			{:else}
				{#each displayCollections as collection, index (collection.id)}
					<div class="collection-item">
						<div class="collection-title">
							{collection.title}
							{#if collection.isComputed}
								<span class="computed-badge">{t('dynamic_collection_badge')}</span>
							{/if}
							<span class="verse-count">
								({collection.verseIds?.length || 0} {t('verses')})
							</span>
						</div>
						<div class="collection-actions">
							<button class="icon-btn" on:click={() => viewCollection(collection.id)}>
								{t('view')}
							</button>
							{#if !collection.isComputed}
								<button
									class="icon-btn"
									on:click={() => moveCollectionUp(collection.id)}
									disabled={index === 0}
									title={t('move_up')}
								>
									▲
								</button>
								<button
									class="icon-btn"
									on:click={() => moveCollectionDown(collection.id)}
									disabled={index === displayCollections.length - 1}
									title={t('move_down')}
								>
									▼
								</button>
								<button
									class="icon-btn"
									on:click={() => renameCollection(collection)}
									title={t('rename')}
								>
									✏️
								</button>
								<button
									class="icon-btn danger"
									on:click={() => deleteCollection(collection.id)}
									title={t('delete')}
								>
									❌
								</button>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{:else}
		<CollectionDetail collection={selectedCollection} on:close={closeDetail} />
	{/if}
</div>

<Modal 
	show={showModal} 
	message={modalMessage}
	type={modalType}
	buttons={modalButtons}
	on:click={handleModalClick}
	on:close={() => { showModal = false; modalType = 'info'; modalButtons = []; }}
/>

<style>
	.collections-container {
		max-width: 100%;
		margin: 0 auto;
		padding: 1.5rem;
		background: var(--app-background, #ffffff);
	}

	h2 {
		margin: 0 0 1.5rem 0;
		color: var(--text-color);
		text-align: center;
	}

	.create-collection {
		margin-bottom: 2rem;
	}

	.create-collection label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: var(--text-color);
	}

	.create-collection-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.create-collection-row input {
		flex: 1;
		min-width: 0;
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1em;
	}

	.create-collection-row button {
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

	.create-collection-row button:hover {
		opacity: 0.9;
	}

	.collections-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.collection-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: var(--panel-background);
		border: 1px solid var(--file-border);
		border-radius: 8px;
		transition: all 0.3s;
		min-width: 0;
		max-width: 100%;
	}

	.collection-item:hover {
		border-color: var(--accent-color);
	}

	.collection-title {
		flex: 1;
		font-weight: 500;
		color: var(--text-color);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
		overflow-wrap: break-word;
		word-wrap: break-word;
	}

	.computed-badge {
		font-size: 0.75em;
		font-weight: 600;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent-color) 16%, transparent);
		color: var(--accent-color);
	}

	.verse-count {
		font-weight: normal;
		font-size: 0.9em;
		color: var(--subtitle-color);
	}

	.collection-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		flex-shrink: 0;
		min-width: 0;
		max-width: 100%;
	}

	.icon-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9em;
		transition: all 0.3s;
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
		padding: 3rem;
		color: var(--subtitle-color);
	}

	@media (max-width: 768px) {
		.collections-container {
			padding: 1rem;
			width: 100%;
			max-width: 100%;
		}

		.create-collection {
			padding: 0;
			margin-bottom: 1rem;
		}

		.create-collection-row {
			flex-direction: column;
		}

		.create-collection-row input,
		.create-collection-row button {
			width: 100%;
		}

		.collections-list {
			padding: 0;
		}

		.collection-item {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
			padding: 0.75rem;
			width: 100%;
			max-width: 100%;
			box-sizing: border-box;
		}

		.collection-actions {
			gap: 0.5rem;
			width: 100%;
			max-width: 100%;
		}

		.icon-btn {
			min-width: 44px;
		}
	}
</style>
