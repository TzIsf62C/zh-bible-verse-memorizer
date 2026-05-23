<script>
	import { createEventDispatcher } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { practice } from '$lib/stores/practice';
	import { achievementState } from '$lib/stores/achievements';
	import { progressTrackingState } from '$lib/stores/progressHistory.js';
	import { streakData } from '$lib/stores/streak.js';
	import { t } from '$lib/i18n';
	import {
		parseImportPayload,
		mergeVerses,
		mergeCollections,
		buildExportPayload,
		applyConflictResolutions,
		mergePracticeData,
		mergeAchievementsData,
		mergeProgressHistoryData,
		mergeStreakData
	} from '$lib/utils/importExport';
	import Modal from './Modal.svelte';

	const dispatch = createEventDispatcher();

	// Export state
	let exportAllChecked = true;
	let selectedCollectionIds = [];
	let includeUserData = true;
	let includeCollections = true;
	let hasInitialized = false; // Flag to prevent re-initialization

	// Import state
	let importIncludeUserData = true;
	let importIncludeCollections = true;
	let selectedFileName = '';
	let fileInput;

	// Modal state
	let showModal = false;
	let modalMessage = '';
	let modalType = 'alert';

	// Conflict resolution state
	let showConflictModal = false;
	let conflicts = [];
	let currentConflictIndex = 0;
	let conflictResolutions = [];
	let pendingImportData = null; // Store import data while resolving conflicts

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

	function getDefaultExportFilename() {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}-verse-data.json`;
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
			includeReview: includeUserData,
			includeCollections,
			collectionIds: collectionIdsToExport,
			practiceData: includeUserData ? $practice : null,
			achievementsData: includeUserData ? $achievementState : null,
			progressHistoryData: includeUserData ? $progressTrackingState : null,
			streakData: includeUserData ? $streakData : null
		});

		const dataStr = JSON.stringify(payload, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = getDefaultExportFilename();
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
				const {
					verses: importedVerses,
					collections: importedCollections,
					practiceData: importedPracticeData,
					achievementsData: importedAchievementsData,
					progressHistoryData: importedProgressHistoryData,
					streakData: importedStreakData
				} = parseImportPayload(
					e.target.result
				);

				const mergeResult = mergeVerses($verses, importedVerses, {
					includeReview: importIncludeUserData
				});

				// Check if there are conflicts
				if (mergeResult.conflicts && mergeResult.conflicts.length > 0) {
					console.log('[ExportImport] Found', mergeResult.conflicts.length, 'conflicts');
					// Store data for later use
					pendingImportData = {
						mergedVerses: mergeResult.merged,
						importedCollections,
						importedPracticeData,
						importedAchievementsData,
						importedProgressHistoryData,
						importedStreakData
					};
					conflicts = mergeResult.conflicts;
					conflictResolutions = new Array(conflicts.length).fill(null);
					currentConflictIndex = 0;
					showConflictModal = true;
				} else {
					// No conflicts - proceed with import
					finishImport(
						mergeResult.merged,
						importedCollections,
						importedPracticeData,
						importedAchievementsData,
						importedProgressHistoryData,
						importedStreakData
					);
				}
			} catch (error) {
				modalMessage = t('error_importing') + ': ' + error.message;
				modalType = 'alert';
				showModal = true;
			}
		};
		reader.readAsText(file);
	}

	function finishImport(
		mergedVerses,
		importedCollections,
		importedPracticeData,
		importedAchievementsData,
		importedProgressHistoryData,
		importedStreakData
	) {
		verses.set(mergedVerses);

		if (importIncludeCollections && importedCollections?.length) {
			const mergedCollections = mergeCollections($collections, importedCollections, mergedVerses);
			collections.set(mergedCollections);
		}

		// Import practice data (speed challenge times) if available.
		if (importIncludeUserData && importedPracticeData) {
			const mergedPractice = mergePracticeData($practice, importedPracticeData);
			practice.set(mergedPractice);
		}

		if (importIncludeUserData && importedAchievementsData) {
			const mergedAchievements = mergeAchievementsData($achievementState, importedAchievementsData);
			achievementState.set(mergedAchievements);
		}

		if (importIncludeUserData && importedProgressHistoryData) {
			const mergedProgressTracking = mergeProgressHistoryData($progressTrackingState, importedProgressHistoryData);
			progressTrackingState.set(mergedProgressTracking);
		}

		if (importIncludeUserData && importedStreakData) {
			const mergedStreak = mergeStreakData($streakData, importedStreakData);
			streakData.set(mergedStreak);
		}

		modalMessage = t('import_successful');
		modalType = 'alert';
		showModal = true;

		// Reset file input
		if (fileInput) {
			fileInput.value = '';
			selectedFileName = '';
		}

		dispatch('imported');
	}

	function resolveConflict(choice) {
		console.log('[ExportImport] Conflict', currentConflictIndex, 'resolved as:', choice);
		conflictResolutions[currentConflictIndex] = choice;
		
		if (currentConflictIndex < conflicts.length - 1) {
			// Move to next conflict
			currentConflictIndex++;
		} else {
			// All conflicts resolved - apply resolutions
			console.log('[ExportImport] All conflicts resolved:', conflictResolutions);
			const finalVerses = applyConflictResolutions(
				pendingImportData.mergedVerses,
				conflicts,
				conflictResolutions
			);
			showConflictModal = false;
			finishImport(
				finalVerses,
				pendingImportData.importedCollections,
				pendingImportData.importedPracticeData,
				pendingImportData.importedAchievementsData,
				pendingImportData.importedProgressHistoryData,
				pendingImportData.importedStreakData
			);
			
			// Reset conflict state
			conflicts = [];
			currentConflictIndex = 0;
			conflictResolutions = [];
			pendingImportData = null;
		}
	}

	function cancelImport() {
		showConflictModal = false;
		conflicts = [];
		currentConflictIndex = 0;
		conflictResolutions = [];
		pendingImportData = null;
		
		// Reset file input
		if (fileInput) {
			fileInput.value = '';
			selectedFileName = '';
		}
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
				<input type="checkbox" bind:checked={includeCollections} />
				<span>{t('include_collection_data')}</span>
			</label>
			
			<label class="checkbox-option">
				<input type="checkbox" bind:checked={includeUserData} />
				<span>{t('include_user_data')}</span>
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
				<input type="checkbox" bind:checked={importIncludeCollections} />
				<span>{t('import_collection_data')}</span>
			</label>
			
			<label class="checkbox-option">
				<input type="checkbox" bind:checked={importIncludeUserData} />
				<span>{t('import_user_data')}</span>
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

<!-- Conflict Resolution Modal -->
{#if showConflictModal && conflicts.length > 0}
	<div class="conflict-modal-overlay">
		<div class="conflict-modal">
			<h3>{t('verse_conflict_title')}</h3>
			<p class="conflict-subtitle">
				{t('conflict_progress').replace('{current}', currentConflictIndex + 1).replace('{total}', conflicts.length)}
			</p>
			
			{#if conflicts[currentConflictIndex]}
				{@const conflict = conflicts[currentConflictIndex]}
				<div class="conflict-reference">
					<strong>{conflict.existing.bookName} {conflict.existing.chapterNumber}:{conflict.existing.verseNumber}</strong>
				</div>
				
				<div class="conflict-comparison">
					<div class="conflict-option">
						<h4>{t('existing_verse')}</h4>
						<div class="verse-preview">
							<p class="verse-text">{conflict.existing.verseText}</p>
							<p class="verse-meta">
								{#if conflict.existing.bibleVersion}
									<span class="version-badge">{conflict.existing.bibleVersion}</span>
								{/if}
								{#if conflict.existing.lastReviewed}
									<span class="review-badge">{t('last_reviewed')}: {new Date(conflict.existing.lastReviewed).toLocaleDateString()}</span>
								{/if}
							</p>
						</div>
						<button class="conflict-btn keep-existing" on:click={() => resolveConflict('existing')}>
							{t('keep_existing')}
						</button>
					</div>
					
					<div class="conflict-option">
						<h4>{t('imported_verse')}</h4>
						<div class="verse-preview">
							<p class="verse-text">{conflict.imported.verseText}</p>
							<p class="verse-meta">
								{#if conflict.imported.bibleVersion}
									<span class="version-badge">{conflict.imported.bibleVersion}</span>
								{/if}
								{#if conflict.imported.lastReviewed}
									<span class="review-badge">{t('last_reviewed')}: {new Date(conflict.imported.lastReviewed).toLocaleDateString()}</span>
								{/if}
							</p>
						</div>
						<button class="conflict-btn use-imported" on:click={() => resolveConflict('imported')}>
							{t('use_imported')}
						</button>
					</div>
				</div>
				
				<div class="conflict-actions">
					<button class="conflict-btn keep-both" on:click={() => resolveConflict('both')}>
						{t('keep_both')}
					</button>
					<button class="conflict-btn cancel-import" on:click={cancelImport}>
						{t('cancel_import')}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.export-import-container {
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
			padding: 1rem;
		}

		.export-section,
		.import-section {
			padding: 1rem;
		}

		.tree-children {
			margin-left: 1rem;
		}
	}

	/* Conflict Resolution Modal */
	.conflict-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.conflict-modal {
		background: var(--panel-background);
		border-radius: 8px;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.conflict-modal h3 {
		margin: 0 0 0.5rem 0;
		color: var(--text-color);
	}

	.conflict-subtitle {
		color: var(--subtitle-color);
		font-size: 0.9em;
		margin: 0 0 1.5rem 0;
	}

	.conflict-reference {
		text-align: center;
		margin-bottom: 1.5rem;
		padding: 0.75rem;
		background: var(--file-bg);
		border-radius: 4px;
	}

	.conflict-reference strong {
		color: var(--text-color);
		font-size: 1.1em;
	}

	.conflict-comparison {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.conflict-option {
		border: 2px solid var(--file-border);
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.conflict-option h4 {
		margin: 0 0 1rem 0;
		color: var(--text-color);
		font-size: 1em;
		font-weight: 600;
	}

	.verse-preview {
		flex: 1;
		margin-bottom: 1rem;
	}

	.verse-text {
		color: var(--text-color);
		line-height: 1.6;
		margin: 0 0 1rem 0;
		font-size: 1em;
	}

	.verse-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
	}

	.version-badge,
	.review-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: var(--file-bg);
		border-radius: 4px;
		font-size: 0.85em;
		color: var(--subtitle-color);
	}

	.version-badge {
		font-weight: 600;
		color: var(--accent-color);
	}

	.conflict-btn {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.95em;
		font-weight: 500;
		transition: opacity 0.3s;
	}

	.conflict-btn:hover {
		opacity: 0.9;
	}

	.keep-existing {
		background: #2196F3;
		color: white;
	}

	.use-imported {
		background: #4CAF50;
		color: white;
	}

	.conflict-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		padding-top: 1rem;
		border-top: 1px solid var(--file-border);
	}

	.keep-both {
		background: #FF9800;
		color: white;
	}

	.cancel-import {
		background: #f44336;
		color: white;
	}

	@media (max-width: 767px) {
		.conflict-modal {
			padding: 1rem;
		}

		.conflict-comparison {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.conflict-actions {
			flex-direction: column;
		}
	}
</style>
