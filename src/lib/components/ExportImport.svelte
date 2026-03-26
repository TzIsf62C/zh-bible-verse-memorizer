<script>
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { t } from '$lib/i18n';
	import { parseImportPayload, mergeVerses, mergeCollections, buildExportPayload } from '$lib/utils/importExport';
	import Modal from './Modal.svelte';

	// Export state
	let exportAllChecked = true;
	let selectedCollectionIds = [];
	let includeReview = true;
	let includeCollections = true;
	let hasInitialized = false; // Flag to prevent re-initialization

	// Import state
	let importIncludeReview = true;
	let importIncludeCollections = true;
	let selectedFileName = '';
	let fileInput;

	// Modal state
	let showModal = false;
	let modalMessage = '';
	let modalType = 'alert';

	// Computed values
	$: uncollectedCount = $verses.filter(v => {
		const collectedIds = new Set();
		$collections.forEach(c => (c.verseIds || []).forEach(id => collectedIds.add(id)));
		return !collectedIds.has(v.id);
	}).length;

	// Initialize selected collections (all checked by default) - ONLY ONCE
	$: if ($collections.length > 0 && selectedCollectionIds.length === 0 && !hasInitialized) {
		console.log('[ExportImport] Initializing selected collections:', $collections.length, 'collections');
		selectedCollectionIds = [...$collections.map(c => c.id), '__uncollected__'];
		exportAllChecked = true;
		hasInitialized = true;
		console.log('[ExportImport] Initial selectedCollectionIds:', selectedCollectionIds);
	}

	// Debug: Log whenever selectedCollectionIds changes
	$: {
		console.log('[ExportImport] selectedCollectionIds changed:', {
			length: selectedCollectionIds.length,
			ids: selectedCollectionIds,
			exportAllChecked
		});
	}

	// Debug: Log whenever exportAllChecked changes
	$: {
		console.log('[ExportImport] exportAllChecked changed:', exportAllChecked);
	}

	// Update master checkbox when children change (but not during initialization)
	function updateMasterCheckbox() {
		const totalOptions = $collections.length + 1; // +1 for uncollected
		const wasChecked = exportAllChecked;
		exportAllChecked = selectedCollectionIds.length === totalOptions;
		console.log('[ExportImport] updateMasterCheckbox called:', {
			totalOptions,
			selectedCount: selectedCollectionIds.length,
			wasChecked,
			nowChecked: exportAllChecked
		});
	}

	function handleChildCheckboxChange(event, collectionId) {
		console.log('[ExportImport] Child checkbox changed:', {
			collectionId,
			checked: event.target.checked,
			selectedCollectionIds_before: [...selectedCollectionIds]
		});
		// The bind:group will handle the update
		setTimeout(() => {
			console.log('[ExportImport] After child checkbox change:', {
				selectedCollectionIds_after: [...selectedCollectionIds]
			});
			updateMasterCheckbox();
		}, 0);
	}

	function toggleAll(event) {
		const isNowChecked = event.target.checked;
		console.log('[ExportImport] toggleAll called:', {
			exportAllChecked_before: exportAllChecked,
			eventTargetChecked: isNowChecked,
			selectedCollectionIds_before: selectedCollectionIds.length
		});
		
		if (isNowChecked) {
			// Checkbox is now checked, select all
			selectedCollectionIds = [...$collections.map(c => c.id), '__uncollected__'];
			console.log('[ExportImport] Selected all collections:', selectedCollectionIds.length);
		} else {
			// Checkbox is now unchecked, deselect all
			selectedCollectionIds = [];
			console.log('[ExportImport] Deselected all collections');
		}
		
		exportAllChecked = isNowChecked;
		console.log('[ExportImport] toggleAll completed:', {
			exportAllChecked_after: exportAllChecked,
			selectedCollectionIds_after: selectedCollectionIds.length
		});
	}

	function handleExport() {
		const allVerses = $verses;
		const cols = $collections;

		// Determine verses to export based on selections
		let versesToExport;
		if (selectedCollectionIds.length === 0) {
			versesToExport = [];
		} else {
			const verseIdSet = new Set();
			const includeUncollected = selectedCollectionIds.includes('__uncollected__');
			const actualColIds = selectedCollectionIds.filter(id => id !== '__uncollected__');

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

		// Get collection IDs to include (excluding uncollected)
		const actualColIds = selectedCollectionIds.filter(id => id !== '__uncollected__');
		const collectionIdsToExport = actualColIds.length > 0 ? actualColIds : [];

		const payload = buildExportPayload(versesToExport, cols, {
			includeReview,
			includeCollections,
			collectionIds: collectionIdsToExport
		});

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
	}

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) {
			selectedFileName = file.name;
		} else {
			selectedFileName = '';
		}
	}

	function handleImport() {
		const file = fileInput?.files?.[0];
		if (!file) {
			modalMessage = t('select_file_to_import');
			modalType = 'alert';
			showModal = true;
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const { verses: importedVerses, collections: importedCollections } = parseImportPayload(
					e.target.result
				);

				const mergedVerses = mergeVerses($verses, importedVerses, {
					includeReview: importIncludeReview
				});
				verses.set(mergedVerses);

				if (importIncludeCollections && importedCollections?.length) {
					const mergedCollections = mergeCollections($collections, importedCollections, mergedVerses);
					collections.set(mergedCollections);
				}

				modalMessage = t('import_successful');
				modalType = 'alert';
				showModal = true;

				// Reset file input
				if (fileInput) {
					fileInput.value = '';
					selectedFileName = '';
				}
			} catch (error) {
				modalMessage = t('error_importing') + ': ' + error.message;
				modalType = 'alert';
				showModal = true;
			}
		};
		reader.readAsText(file);
	}

	function closeModal() {
		showModal = false;
	}
</script>

<div class="export-import-container">
	<h2>{t('export_import_title')}</h2>

	<!-- Export Section -->
	<div class="export-section">
		<h3>{t('export_data')}</h3>
		
		<div class="export-tree">
			<label class="tree-item master-checkbox">
				<input 
					type="checkbox" 
					checked={exportAllChecked}
					on:change={toggleAll}
				/>
				<strong>{t('all_verses')}</strong>
			</label>
			
			<div class="tree-children">
				{#each $collections as collection}
					<label class="tree-item">
						<input 
							type="checkbox" 
							value={collection.id}
							bind:group={selectedCollectionIds}
							on:change={(e) => handleChildCheckboxChange(e, collection.id)}
						/>
						<span>{collection.title} ({(collection.verseIds || []).length} {t('verses')})</span>
					</label>
				{/each}
				
				<label class="tree-item">
					<input 
						type="checkbox" 
						value="__uncollected__"
						bind:group={selectedCollectionIds}
						on:change={(e) => handleChildCheckboxChange(e, '__uncollected__')}
					/>
					<span>{t('not_in_collection')} ({uncollectedCount} {t('verses')})</span>
				</label>
			</div>
		</div>

		<div class="options">
			<label class="checkbox-option">
				<input type="checkbox" bind:checked={includeReview} />
				<span>{t('include_review_data')}</span>
			</label>
			
			<label class="checkbox-option">
				<input type="checkbox" bind:checked={includeCollections} />
				<span>{t('include_collection_data')}</span>
			</label>
		</div>

		<button class="primary-btn" on:click={handleExport}>
			{t('download_data')}
		</button>
	</div>

	<!-- Import Section -->
	<div class="import-section">
		<h3>{t('import_data')}</h3>
		
		<label for="importFile" class="file-input-label">
			<span>{t('choose_file')}</span>
		</label>
		<input 
			type="file" 
			id="importFile"
			accept=".json,application/json"
			bind:this={fileInput}
			on:change={handleFileSelect}
		/>
		
		<div class="file-name-display">
			{selectedFileName || t('no_file_selected')}
		</div>

		<div class="options">
			<label class="checkbox-option">
				<input type="checkbox" bind:checked={importIncludeReview} />
				<span>{t('import_review_data')}</span>
			</label>
			
			<label class="checkbox-option">
				<input type="checkbox" bind:checked={importIncludeCollections} />
				<span>{t('import_collection_data')}</span>
			</label>
		</div>

		<button class="primary-btn" on:click={handleImport}>
			{t('import_data')}
		</button>
	</div>
</div>

<Modal 
	show={showModal} 
	message={modalMessage}
	type={modalType}
	on:confirm={closeModal}
	on:cancel={closeModal}
/>

<style>
	.export-import-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	h2 {
		margin: 0 0 1.5rem 0;
		color: var(--text-color);
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1em;
		color: var(--text-color);
		font-weight: 600;
	}

	.export-section,
	.import-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		border: 1px solid var(--file-border);
	}

	/* Tree Structure */
	.export-tree {
		margin-bottom: 1rem;
	}

	.tree-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.tree-item:hover {
		background: var(--file-bg);
	}

	.master-checkbox {
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.tree-children {
		margin-left: 1.5rem;
		border-left: 2px solid var(--file-border);
		padding-left: 0.5rem;
	}

	.tree-item input[type="checkbox"] {
		cursor: pointer;
		flex-shrink: 0;
	}

	.tree-item span,
	.tree-item strong {
		color: var(--text-color);
	}

	/* Options */
	.options {
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.checkbox-option:hover {
		background: var(--file-bg);
	}

	.checkbox-option input[type="checkbox"] {
		cursor: pointer;
		flex-shrink: 0;
	}

	.checkbox-option span {
		color: var(--text-color);
	}

	/* File Input */
	#importFile {
		display: none;
	}

	.file-input-label {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border: 1px solid var(--accent-color);
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: opacity 0.3s;
	}

	.file-input-label:hover {
		opacity: 0.8;
	}

	.file-name-display {
		margin-top: 0.5rem;
		padding: 0.5rem;
		color: var(--subtitle-color);
		font-size: 0.9em;
		font-style: italic;
	}

	/* Buttons */
	.primary-btn {
		padding: 0.75rem 1.5rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: opacity 0.3s;
	}

	.primary-btn:hover {
		opacity: 0.9;
	}

	.primary-btn:active {
		opacity: 0.7;
	}

	/* Mobile responsiveness */
	@media (max-width: 767px) {
		.export-import-container {
			padding: 0.5rem;
		}

		.export-section,
		.import-section {
			padding: 1rem;
		}

		.tree-children {
			margin-left: 1rem;
		}
	}
</style>
