<script>
	import { createEventDispatcher } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { t } from '$lib/i18n';
	import { calculateHeatScore, getHeatColor, transformHeatScore } from '$lib/utils/heatTracking';
	import { sortVersesByBibleOrder } from '$lib/utils/bibleBooks';

	const dispatch = createEventDispatcher();
	export let showStatsBack = false;

	let currentView = 'list'; // 'list' or 'detail'
	let selectedVerse = null;
	let sortMode = 'biblical'; // 'biblical' | 'collection' | 'scoreAsc' | 'scoreDesc'
	let editMode = false; // Heat map edit mode
	let editingCharIndex = null; // Index of character being edited
	let tooltipPosition = { x: 0, y: 0 }; // Tooltip position
	const HEAT_LEGEND_STOPS = [99, 80, 60, 40];
	const HEAT_LEGEND_MAX = HEAT_LEGEND_STOPS[0];
	const HEAT_LEGEND_MIN = HEAT_LEGEND_STOPS[HEAT_LEGEND_STOPS.length - 1];
	function getHeatLegendPercent(score) {
		if (HEAT_LEGEND_MAX === HEAT_LEGEND_MIN) return 0;
		return ((HEAT_LEGEND_MAX - score) / (HEAT_LEGEND_MAX - HEAT_LEGEND_MIN)) * 100;
	}
	$: heatLegendPoints = HEAT_LEGEND_STOPS.map((score, index) => ({
		score,
		percent: getHeatLegendPercent(score),
		anchorClass: index === 0 ? 'start' : index === HEAT_LEGEND_STOPS.length - 1 ? 'end' : 'middle'
	}));
	$: heatLegendGradient = `linear-gradient(to right, ${heatLegendPoints.map((point) => `${getHeatColor(point.score)} ${point.percent}%`).join(', ')})`;

	// Get verses with heat arrays for Heat Maps view
	$: versesWithHeat = $verses.filter(v => v.heatArray && v.heatArray.length > 0);
	$: scoredVerses = versesWithHeat.map(v => {
		const heatRawScore = calculateHeatScore(v.heatArray || []);
		return {
			...v,
			heatRawScore,
			heatScore: transformHeatScore(heatRawScore)
		};
	});
	
	// Sort and score verses for list view
	$: sortedVerses = getSortedVerses(scoredVerses, sortMode);
	$: groupedBiblicalVerses = sortMode === 'biblical' ? groupVersesByBookAndChapter(sortedVerses) : [];
	$: groupedCollectionVerses = sortMode === 'collection' ? groupVersesByCollection(scoredVerses) : [];

	function getSortedVerses(versesWithScores, mode) {
		let sorted = [];
		if (mode === 'biblical') {
			sorted = sortVersesByBibleOrder(versesWithScores);
		} else if (mode === 'collection') {
			sorted = sortByCollectionOrder(versesWithScores);
		} else {
			// Sort by score
			sorted = [...versesWithScores].sort((a, b) => {
				return mode === 'scoreAsc'
					? a.heatScore - b.heatScore
					: b.heatScore - a.heatScore;
			});
		}
		return sorted;
	}

	function sortByCollectionOrder(inputVerses) {
		const verseById = new Map(inputVerses.map((verse) => [verse.id, verse]));
		const ordered = [];
		const seen = new Set();

		for (const collection of $collections) {
			for (const verseId of collection.verseIds || []) {
				if (seen.has(verseId)) continue;
				const verse = verseById.get(verseId);
				if (verse) {
					seen.add(verseId);
					ordered.push(verse);
				}
			}
		}

		for (const verse of inputVerses) {
			if (!seen.has(verse.id)) {
				ordered.push(verse);
			}
		}

		return ordered;
	}

	function groupVersesByCollection(inputVerses) {
		const verseById = new Map(inputVerses.map((verse) => [verse.id, verse]));
		const groups = [];
		const seen = new Set();

		for (const collection of $collections) {
			const collectionVerses = (collection.verseIds || [])
				.map((verseId) => verseById.get(verseId))
				.filter(Boolean);

			if (collectionVerses.length > 0) {
				groups.push({
					id: collection.id,
					title: collection.title,
					verses: collectionVerses
				});
				collectionVerses.forEach((verse) => seen.add(verse.id));
			}
		}

		const uncollectedVerses = inputVerses.filter((verse) => !seen.has(verse.id));
		if (uncollectedVerses.length > 0) {
			groups.push({
				id: '__uncollected__',
				title: t('not_in_collection'),
				verses: uncollectedVerses
			});
		}

		return groups;
	}

	function groupVersesByBookAndChapter(verses) {
		return verses.reduce((books, verse) => {
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

	function backToStats() {
		dispatch('back-to-stats');
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
			{#if showStatsBack}
				<button type="button" class="back-btn" on:click={backToStats} aria-label={t('back')}>
					<svg
						class="back-icon"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path d="M19 12H5M12 19l-7-7 7-7"/>
					</svg>
				</button>
			{:else}
				<div class="header-spacer" aria-hidden="true"></div>
			{/if}
			<h2 class="heat-maps-title">{t('heat_maps')}</h2>
			<div class="header-spacer" aria-hidden="true"></div>
		</div>

		{#if versesWithHeat.length === 0}
			<div class="empty-state">
				<p>{t('no_reviewed_verses')}</p>
			</div>
		{:else}
			<div class="sort-controls">
				<label class="sort-label" for="heatmaps-sort">{t('sort')}:</label>
				<select id="heatmaps-sort" class="sort-select" bind:value={sortMode}>
					<option value="biblical">{t('order_biblical')}</option>
					<option value="collection">{t('order_collection')}</option>
					<option value="scoreAsc">{t('sort_by_score_L2H')}</option>
					<option value="scoreDesc">{t('sort_by_score_H2L')}</option>
				</select>
			</div>

			{#if sortMode === 'biblical'}
				<div class="verse-list grouped-list">
					{#each groupedBiblicalVerses as bookGroup (bookGroup.bookName)}
						<details class="verse-book-group">
							<summary class="verse-group-toggle book-toggle">
								<span class="verse-toggle-icon" aria-hidden="true">▶</span>
								<span class="verse-group-label">{bookGroup.bookName}</span>
								<span class="verse-group-count">({bookGroup.chapters.reduce((total, chapter) => total + chapter.verses.length, 0)})</span>
							</summary>

							<div class="verse-chapter-groups">
								{#each bookGroup.chapters as chapterGroup (chapterGroup.chapterNumber)}
									<details class="verse-chapter-group" open={bookGroup.chapters.length === 1}>
										<summary class="verse-group-toggle chapter-toggle">
											<span class="verse-toggle-icon" aria-hidden="true">▶</span>
											<span class="verse-group-label">{t('chapter')} {chapterGroup.chapterNumber}</span>
											<span class="verse-group-count">({chapterGroup.verses.length})</span>
										</summary>

										<div class="verse-group-items">
											{#each chapterGroup.verses as verse (verse.id)}
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
									</details>
								{/each}
							</div>
						</details>
					{/each}
				</div>
			{:else if sortMode === 'collection'}
				<div class="verse-list grouped-list">
					{#each groupedCollectionVerses as group (group.id)}
						<details class="verse-book-group">
							<summary class="verse-group-toggle book-toggle">
								<span class="verse-toggle-icon" aria-hidden="true">▶</span>
								<span class="verse-group-label">{group.title}</span>
								<span class="verse-group-count">({group.verses.length})</span>
							</summary>

							<div class="verse-group-items">
								{#each group.verses as verse (verse.id)}
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
						</details>
					{/each}
				</div>
			{:else}
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
			<div class="header-spacer" aria-hidden="true"></div>
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
				<div class="heat-legend" aria-hidden="true">
					<div class="legend-gradient" style={`background: ${heatLegendGradient};`}></div>
					<div class="legend-scale-row">
						{#each heatLegendPoints as point}
							<span class={`legend-scale-label ${point.anchorClass}`} style={`left: ${point.percent}%`}>
								{point.score}
							</span>
						{/each}
					</div>
				</div>
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
					<button type="button" class="tooltip-btn" on:click={() => adjustHeat(editingCharIndex, 5)} aria-label="Increase by 5">
						+5
					</button>
					<div class="tooltip-value">{selectedVerse.heatArray[editingCharIndex]}</div>
					<button type="button" class="tooltip-btn" on:click={() => adjustHeat(editingCharIndex, -10)} aria-label="Decrease by 10">
						-10
					</button>
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

	.heat-maps-header .header-spacer {
		width: 2.5rem;
		height: 2.5rem;
		flex-shrink: 0;
	}
	
	.heat-maps-title {
		font-size: 1.5em;
		font-weight: bold;
		color: var(--nav-button-color);
		margin: 0;
		flex: 1;
		text-align: center;
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

	.list-header .heat-maps-title {
		flex: 1;
	}
	
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--nav-button-color);
		opacity: 0.6;
	}
	
	.sort-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		justify-content: flex-start;
	}

	.sort-label {
		font-size: 0.95em;
		font-weight: 600;
		color: var(--subtitle-color);
		white-space: nowrap;
	}
	
	.sort-select {
		padding: 0.55rem 0.75rem;
		background: var(--panel-background);
		border: 1px solid var(--nav-button-bg);
		border-radius: 8px;
		color: var(--nav-button-color);
		font-size: 0.95em;
		min-width: 15em;
		transition: all 0.2s ease;
	}
	
	.sort-select:hover {
		background: var(--nav-button-bg);
	}
	
	.verse-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.grouped-list {
		gap: 0.5rem;
	}

	.verse-book-group,
	.verse-chapter-group {
		border: 1px solid var(--nav-button-bg);
		border-radius: 8px;
		background: var(--panel-background);
		overflow: hidden;
	}

	.verse-chapter-group {
		border-color: color-mix(in srgb, var(--nav-button-bg) 75%, transparent);
	}

	.verse-chapter-groups {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.35rem;
	}

	.verse-group-toggle {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		width: 100%;
		padding: 0.55rem 0.75rem;
		cursor: pointer;
		font-weight: 600;
		color: var(--nav-button-color);
		list-style: none;
	}

	.verse-group-toggle::-webkit-details-marker {
		display: none;
	}

	.verse-group-toggle::marker {
		content: '';
	}

	.book-toggle {
		background: color-mix(in srgb, var(--nav-button-bg) 55%, transparent);
	}

	.chapter-toggle {
		background: color-mix(in srgb, var(--nav-button-bg) 35%, transparent);
		padding-left: 1rem;
	}

	.verse-toggle-icon {
		width: 1em;
		text-align: center;
		color: var(--subtitle-color);
		transition: transform 0.2s ease;
	}

	details[open] > .verse-group-toggle .verse-toggle-icon {
		transform: rotate(90deg);
	}

	.verse-group-label {
		min-width: 0;
	}

	.verse-group-count {
		margin-left: auto;
		font-size: 0.9em;
		font-weight: 500;
		color: var(--subtitle-color);
	}

	.verse-group-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
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

	.heat-legend {
		margin-bottom: 0.9rem;
	}

	.legend-gradient {
		height: 0.7rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
		margin-top: 0.9rem;
	}

	.legend-scale-row {
		position: relative;
		height: 1em;
		font-size: 0.75em;
		color: var(--subtitle-color);
		margin-top: 0.2rem;
	}

	.legend-scale-label {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		white-space: nowrap;
	}

	.legend-scale-label.start {
		transform: translateX(0);
	}

	.legend-scale-label.end {
		transform: translateX(-100%);
	}
	
	.heat-map-text {
		font-size: 1.5em;
		line-height: 2;
		padding: 1rem;
		background: var(--panel-background);
		border-radius: 8px;
		margin-bottom: 1.2rem;
	}
	
	.heat-char {
		padding: 0px 8px;
		border-radius: 30px;
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
		color: var(--text-color);
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
		width: 100px;
	}

	.tooltip-row {
		display: flex;
		width: 100%;
		gap: 0.25rem;
	}
	
	.tooltip-btn {
		flex: 1;
		padding: 0.25rem 1.5rem 0.25rem 1.5rem;
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
			padding: 0.75rem 0.75rem 0.3rem 0.75rem;
		}

		.sort-select {
			min-width: 0;               /* remove the 15em floor */
			width: 100%;                /* take full width of its flex line */
			flex: 1 1 100%;             /* allow shrinking and growing */
		}
		.practice-button,
		.edit-button {
			width: 100%;
		}
	}
</style>
