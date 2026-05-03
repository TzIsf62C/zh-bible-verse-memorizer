<script>
	import { createEventDispatcher } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import { calculateHeatScore, getHeatColor } from '$lib/utils/heatTracking';
	import { sortVersesByBibleOrder } from '$lib/utils/bibleBooks';

	const dispatch = createEventDispatcher();

	let currentView = 'list'; // 'list' or 'detail'
	let selectedVerse = null;
	let sortMode = 'biblical'; // 'biblical' or 'score'
	let sortDirection = 'asc'; // 'asc' or 'desc'
	let editMode = false; // Heat map edit mode
	let editingCharIndex = null; // Index of character being edited
	let tooltipPosition = { x: 0, y: 0 }; // Tooltip position

	// Get verses with heat arrays for Heat Maps view
	$: versesWithHeat = $verses.filter(v => v.heatArray && v.heatArray.length > 0);
	
	// Sort and score verses for list view
	$: sortedVerses = getSortedVerses(versesWithHeat, sortMode, sortDirection);

	function getSortedVerses(verses, mode, direction) {
		// First calculate heat scores for all verses
		const versesWithScores = verses.map(v => ({
			...v,
			heatScore: calculateHeatScore(v.heatArray || [])
		}));

		let sorted = [];
		if (mode === 'biblical') {
			sorted = sortVersesByBibleOrder(versesWithScores);
		} else {
			// Sort by score
			sorted = [...versesWithScores].sort((a, b) => {
				return direction === 'asc' 
					? a.heatScore - b.heatScore
					: b.heatScore - a.heatScore;
			});
		}
		return sorted;
	}

	function showVerseDetail(verse) {
		selectedVerse = verse;
		currentView = 'detail';
	}

	function backToList() {
		currentView = 'list';
		selectedVerse = null;
		editMode = false;
		closeTooltip();
	}

	function toggleSortMode() {
		if (sortMode === 'biblical') {
			sortMode = 'score';
			sortDirection = 'asc'; // Start with lowest scores
		} else {
			sortMode = 'biblical';
			sortDirection = 'asc';
		}
	}

	function toggleSortDirection() {
		sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
	}

	function practiceVerse(verseId) {
		dispatch('practice', { verseId });
	}

	function toggleEditMode() {
		editMode = !editMode;
		if (!editMode) {
			closeTooltip();
		}
	}

	function handleCharClick(event, index) {
		if (!editMode) return;
		event.stopPropagation();
		
		const charData = getHeatMapChars(selectedVerse)[index];
		if (!charData || charData.isPunctuation) return;
		
		const rect = event.target.getBoundingClientRect();
		const tooltipWidth = 132;
		const tooltipHeight = 116;
		const horizontalPadding = 8;
		const verticalPadding = 8;
		const centeredX = rect.left + rect.width / 2 - tooltipWidth / 2;
		tooltipPosition = {
			x: Math.min(
				window.innerWidth - tooltipWidth - horizontalPadding,
				Math.max(horizontalPadding, centeredX)
			),
			y: Math.max(verticalPadding, rect.top - tooltipHeight - verticalPadding)
		};
		editingCharIndex = charData.heatIndex;
	}

	function closeTooltip() {
		editingCharIndex = null;
	}

	function adjustHeat(index, delta) {
		if (!selectedVerse || !selectedVerse.heatArray) return;
		
		const newValue = Math.max(0, Math.min(99, selectedVerse.heatArray[index] + delta));
		
		// Update the verse in the store
		verses.update(allVerses => {
			return allVerses.map(v => {
				if (v.id === selectedVerse.id) {
					const updatedVerse = { ...v };
					updatedVerse.heatArray = [...v.heatArray];
					updatedVerse.heatArray[index] = newValue;
					return updatedVerse;
				}
				return v;
			});
		});
		
		// Update local selectedVerse
		selectedVerse = { ...selectedVerse };
		selectedVerse.heatArray[index] = newValue;
	}

	function exitHeatMaps() {
		dispatch('exit');
	}

	// Render heat map characters for a verse
	function getHeatMapChars(verse) {
		if (!verse || !verse.heatArray) return [];

		// Build full text with reference
		const fullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
		const chars = [...fullText];
		const heatArray = verse.heatArray;
		
		let heatIndex = 0;
		return chars.map((char, i) => {
			// Check if this is a trackable character
			const isTrackable = /[\u4e00-\u9fa5]/.test(char) || /[0-9]/.test(char);
			
			if (isTrackable) {
				const score = heatArray[heatIndex] || 99;
				const color = getHeatColor(score);
				const currentHeatIndex = heatIndex;
				heatIndex++;
				return {
					char,
					color,
					score,
					isPunctuation: false,
					heatIndex: currentHeatIndex
				};
			} else {
				// Punctuation - no background
				return {
					char,
					color: 'transparent',
					score: null,
					isPunctuation: true,
					heatIndex: null
				};
			}
		});
	}
</script>

{#if currentView === 'list'}
	<!-- Verse List -->
	<div class="heat-maps-container">
		<div class="heat-maps-header list-header">
			<h2 class="heat-maps-title">{t('heat_maps')}</h2>
		</div>

		{#if versesWithHeat.length === 0}
			<div class="empty-state">
				<p>{t('no_reviewed_verses')}</p>
			</div>
		{:else}
			<div class="sort-controls">
				<button type="button" class="sort-button" on:click={toggleSortMode}>
					{sortMode === 'biblical' ? t('sort_biblical') : t('sort_by_score')}
				</button>
				{#if sortMode === 'score'}
					<button type="button" class="sort-button" on:click={toggleSortDirection}>
						{sortDirection === 'asc' ? '↑' : '↓'}
					</button>
				{/if}
			</div>

			<div class="verse-list">
				{#each sortedVerses as verse (verse.id)}
					<button 
						type="button" 
						class="verse-list-item" 
						on:click={() => showVerseDetail(verse)}
					>
						<div class="verse-ref">
							{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
						</div>
						<div class="verse-score">
							{verse.heatScore.toFixed(2)}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

{:else if currentView === 'detail' && selectedVerse}
	<!-- Heat Map Detail -->
	<div class="heat-maps-container">
		<div class="heat-maps-header">
			<button type="button" class="back-btn" on:click={backToList} aria-label={t('back')}>
				<svg
					class="back-icon"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d="M19 12H5M12 19l-7-7 7-7"/>
				</svg>
			</button>
			<h2 class="heat-maps-title">{t('heat_map')}</h2>
			<button type="button" class="exit-btn" on:click={exitHeatMaps} aria-label={t('close')}>×</button>
		</div>

		<div class="heat-map">
			<div class="heat-map-text">
				{#each getHeatMapChars(selectedVerse) as charData, i}
					{#if charData.char === '\n'}
						<br />
					{:else if !charData.isPunctuation}
						<button
							type="button"
							class="heat-char editable"
							class:selected-char={editMode && charData.heatIndex === editingCharIndex}
							style="background-color: {charData.color}"
							title={charData.score !== null ? `Score: ${charData.score}` : ''}
							on:click={(e) => handleCharClick(e, i)}
						>
							{charData.char}
						</button>
					{:else}
						<span 
							class="heat-char"
							class:punctuation={charData.isPunctuation}
							style="background-color: {charData.color}"
							title={charData.score !== null ? `Score: ${charData.score}` : ''}
						>
							{charData.char}
						</span>
					{/if}
				{/each}
			</div>

			<!-- Edit tooltip -->
			{#if editMode && editingCharIndex !== null}
				<div 
					class="edit-tooltip" 
					style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
					on:click|stopPropagation
					on:keydown={(e) => e.key === 'Escape' && closeTooltip()}
					role="dialog"
					aria-label="Edit heat score"
					tabindex="-1"
				>
					<div class="tooltip-row">
						<button type="button" class="tooltip-btn" on:click={() => adjustHeat(editingCharIndex, 3)} aria-label="Increase by 3">
							+3
						</button>
						<button type="button" class="tooltip-btn" on:click={() => adjustHeat(editingCharIndex, 1)} aria-label="Increase by 1">
							+1
						</button>
					</div>
					<div class="tooltip-value">{selectedVerse.heatArray[editingCharIndex]}</div>
					<div class="tooltip-row">
						<button type="button" class="tooltip-btn" on:click={() => adjustHeat(editingCharIndex, -10)} aria-label="Decrease by 10">
							-10
						</button>
						<button type="button" class="tooltip-btn" on:click={() => adjustHeat(editingCharIndex, -1)} aria-label="Decrease by 1">
							-1
						</button>
					</div>
				</div>
			{/if}

			<div class="practice-buttons">
				<button 
					type="button" 
					class="practice-button" 
					on:click={() => practiceVerse(selectedVerse.id)}
				>
					{t('practice_now')}
				</button>
				
				<button 
					type="button" 
					class="edit-button {editMode ? 'active' : ''}" 
					on:click={toggleEditMode}
				>
					{editMode ? t('done') : t('edit')}
				</button>
			</div>
		</div>
	</div>
{/if}

<svelte:window on:click={closeTooltip} />

<style>
	.heat-maps-container {
		width: 100%;
		padding: 1rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.heat-maps-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}
	
	.heat-maps-title {
		font-size: 1.5em;
		font-weight: bold;
		color: var(--nav-button-color);
		margin: 0;
		flex: 1;
		text-align: center;
	}
	
	.back-btn {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--nav-button-color);
		cursor: pointer;
		border-radius: 50%;
		transition: background 0.2s ease;
	}
	
	.back-btn:hover {
		background: var(--nav-button-bg);
	}
	
	.back-btn svg {
		width: 24px;
		height: 24px;
	}

	.back-icon {
		display: block;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		fill: none;
		stroke: var(--nav-button-color);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.list-header {
		justify-content: center;
	}

	.list-header .heat-maps-title {
		flex: none;
	}
	
	.exit-btn {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--nav-button-color);
		font-size: 2em;
		line-height: 1;
		cursor: pointer;
		border-radius: 50%;
		transition: background 0.2s ease;
	}
	
	.exit-btn:hover {
		background: var(--nav-button-bg);
	}
	
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--nav-button-color);
		opacity: 0.6;
	}
	
	.sort-controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		justify-content: flex-start;
	}
	
	.sort-button {
		padding: 0.5rem 1rem;
		background: var(--panel-background);
		border: 1px solid var(--nav-button-bg);
		border-radius: 8px;
		color: var(--nav-button-color);
		cursor: pointer;
		font-size: 0.9em;
		transition: all 0.2s ease;
	}
	
	.sort-button:hover {
		background: var(--nav-button-bg);
	}
	
	.verse-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.verse-list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--panel-background);
		border: 1px solid var(--nav-button-bg);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}
	
	.verse-list-item:hover {
		background: var(--nav-button-bg);
		transform: translateX(4px);
	}
	
	.verse-ref {
		font-weight: bold;
		color: var(--nav-button-color);
	}
	
	.verse-score {
		font-size: 1.1em;
		font-weight: bold;
		color: var(--accent-color);
	}
	
	.heat-map {
		position: relative;
	}
	
	.heat-map-text {
		font-size: 1.5em;
		line-height: 2;
		padding: 1rem;
		background: var(--panel-background);
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}
	
	.heat-char {
		padding: 2px 4px;
		border-radius: 3px;
		border: 2px solid transparent;
		transition: all 0.2s ease;
		color: #1b1b1f;
	}
	
	.heat-char.editable {
		cursor: pointer;
		font: inherit;
		line-height: inherit;
		min-width: auto;
		height: auto;
	}
	
	.heat-char.editable:hover {
		opacity: 0.8;
		transform: scale(1.1);
	}
	
	.heat-char.punctuation {
		background-color: transparent !important;
	}

	.heat-char.selected-char {
		border-color: var(--accent-color);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
	}
	
	.edit-tooltip {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		background: var(--panel-background);
		border: 2px solid var(--accent-color);
		border-radius: 8px;
		padding: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 1000;
		width: 132px;
	}

	.tooltip-row {
		display: flex;
		width: 100%;
		gap: 0.25rem;
	}
	
	.tooltip-btn {
		flex: 1;
		padding: 0.25rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		transition: opacity 0.2s ease;
	}
	
	.tooltip-btn:hover {
		opacity: 0.8;
	}
	
	.tooltip-value {
		font-size: 1.2em;
		font-weight: bold;
		color: var(--nav-button-color);
		padding: 0.25rem 0;
	}
	
	.practice-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}
	
	.practice-button,
	.edit-button {
		padding: 0.75rem 1.5rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1em;
		font-weight: bold;
		transition: all 0.2s ease;
	}
	
	.practice-button:hover,
	.edit-button:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}
	
	.edit-button.active {
		background: var(--nav-button-color);
		color: var(--app-background);
	}
	
	/* Mobile adjustments */
	@media (max-width: 767px) {
		.heat-maps-container {
			padding: 1rem 0.5rem;
		}
		
		.heat-map-text {
			font-size: 1.25em;
			padding: 0.75rem;
		}
		
		.practice-buttons {
			flex-direction: column;
		}
		
		.practice-button,
		.edit-button {
			width: 100%;
		}
	}
</style>
