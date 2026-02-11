<script>
	import { collections } from '$lib/stores/collections';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import CollectionDetail from './CollectionDetail.svelte';
	import Modal from './Modal.svelte';
	
	let newCollectionTitle = '';
	let selectedCollectionId = null;
	
	// Modal state
	let showModal = false;
	let modalMessage = '';
	let modalType = 'info';
	let modalButtons = [];
	let pendingDeleteId = null;
	
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
		collections.update(cols => {
			const index = cols.findIndex(c => c.id === id);
			if (index <= 0) return cols;
			
			const newCols = [...cols];
			[newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
			return newCols;
		});
	}
	
	function moveCollectionDown(id) {
		collections.update(cols => {
			const index = cols.findIndex(c => c.id === id);
			if (index === -1 || index >= cols.length - 1) return cols;
			
			const newCols = [...cols];
			[newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
			return newCols;
		});
	}
	
	function renameCollection(collection) {
		const newTitle = prompt(t('new_collection_title'), collection.title);
		if (newTitle === null) return;
		
		collections.update(cols =>
			cols.map(c =>
				c.id === collection.id ? { ...c, title: newTitle.trim() } : c
			)
		);
	}
	
	function deleteCollection(id) {
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
	
	$: selectedCollection = selectedCollectionId
		? $collections.find(c => c.id === selectedCollectionId)
		: null;
</script>

<div class="collections-container">
	<h2>{t('collections_title')}</h2>
	
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
	
	{#if !selectedCollection}
		<div class="collections-list">
			{#if $collections.length === 0}
				<div class="empty-state">
					<p>{t('no_collections')}</p>
				</div>
			{:else}
				{#each $collections as collection, index (collection.id)}
					<div class="collection-item">
						<div class="collection-title">
							{collection.title}
							<span class="verse-count">
								({collection.verseIds?.length || 0} {t('verses')})
							</span>
						</div>
						<div class="collection-actions">
							<button class="icon-btn" on:click={() => viewCollection(collection.id)}>
								{t('view')}
							</button>
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
								disabled={index === $collections.length - 1}
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
		max-width: 1000px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	h2 {
		margin: 0 0 1.5rem 0;
		color: var(--text-color);
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
	}
	
	.create-collection-row input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1rem;
	}
	
	.create-collection-row button {
		padding: 0.75rem 1.5rem;
		border: none;
		background: var(--accent-color);
		color: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s;
		white-space: nowrap;
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
	}
	
	.verse-count {
		font-weight: normal;
		font-size: 0.9rem;
		color: var(--subtitle-color);
	}
	
	.collection-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.icon-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
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
		.collection-item {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}
		
		.collection-actions {
			justify-content: stretch;
		}
		
		.icon-btn {
			flex: 1;
		}
	}
</style>
