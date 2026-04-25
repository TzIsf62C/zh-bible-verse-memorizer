<script>
	import { createEventDispatcher } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import { calculateHeatScore, getHeatColor } from '$lib/utils/heatTracking';
	import { sortVersesByBibleOrder } from '$lib/utils/bibleBooks';

	const dispatch = createEventDispatcher();

	let currentView = 'mastery'; // 'mastery', 'list', 'detail'
	let selectedVerse = null;
	let sortMode = 'biblical'; // 'biblical' or 'score'
	let sortDirection = 'asc'; // 'asc' or 'desc'

	// Calculate mastery categories
	$: masteryData = calculateMasteryData($verses);
	
	// Get verses with heat arrays for Heat Maps view
	$: versesWithHeat = $verses.filter(v => v.heatArray && v.heatArray.length > 0);
	
	// Sort and score verses for list view
	$: sortedVerses = getSortedVerses(versesWithHeat, sortMode, sortDirection);

	function calculateMasteryData(allVerses) {
		// Only count verses that have been reviewed (have lastReviewed date)
		const reviewedVerses = allVerses.filter(v => v.lastReviewed);
		const total = reviewedVerses.length;

		if (total === 0) {
			return {
				newLearning: 0,
				developing: 0,
				solid: 0,
				mastered: 0,
				total: 0,
				max: 0
			};
		}

		let newLearning = 0;
		let developing = 0;
		let solid = 0;
		let mastered = 0;

		reviewedVerses.forEach(v => {
			const interval = v.interval || 0;
			if (interval < 7) {
				newLearning++;
			} else if (interval >= 7 && interval <= 24) {
				developing++;
			} else if (interval >= 25 && interval <= 48) {
				solid++;
			} else {
				mastered++;
			}
		});

		// Calculate max for bar width calculation
		const max = Math.max(newLearning, developing, solid, mastered);

		return {
			newLearning,
			developing,
			solid,
			mastered,
			total,
			max
		};
	}

	function getSortedVerses(versesToSort, mode, direction) {
		const versesWithScores = versesToSort.map(v => ({
			...v,
			heatScore: calculateHeatScore(v.heatArray)
		}));

		if (mode === 'biblical') {
			return sortVersesByBibleOrder(versesWithScores);
		} else {
			// Sort by score
			const sorted = [...versesWithScores].sort((a, b) => {
				const scoreA = a.heatScore;
				const scoreB = b.heatScore;
				return direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
			});
			return sorted;
		}
	}

	function showHeatMaps() {
		currentView = 'list';
	}

	function showVerseDetail(verse) {
		selectedVerse = verse;
		currentView = 'detail';
	}

	function backToMastery() {
		currentView = 'mastery';
		sortMode = 'biblical';
		sortDirection = 'asc';
	}

	function backToList() {
		currentView = 'list';
		selectedVerse = null;
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

	function exitStats() {
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
				heatIndex++;
				return {
					char,
					color,
					score,
					isPunctuation: false
				};
			} else {
				// Punctuation - no background
				return {
					char,
					color: 'transparent',
					score: null,
					isPunctuation: true
				};
			}
		});
	}
</script>

{#if currentView === 'mastery'}
	<!-- View A: Mastery Bars -->
	<div class="stats-container">
		<div class="stats-header">
			<h2 class="stats-title">{t('stats')}</h2>
			<button type="button" class="exit-btn" on:click={exitStats} aria-label={t('close')}>×</button>
		</div>

		{#if masteryData.total === 0}
			<div class="empty-state">
				<p>{t('no_reviewed_verses')}</p>
			</div>
		{:else}
			<div class="mastery-bars">
				<!-- New/Learning -->
				<div class="mastery-category">
					<div class="category-label">{t('new_learning')}</div>
					<div class="bar-container">
						<div 
							class="bar bar-new" 
							style="width: {masteryData.max > 0 ? (masteryData.newLearning / masteryData.max) * 100 : 0}%"
						>
							<span class="bar-count">{masteryData.newLearning}</span>
						</div>
					</div>
				</div>

				<!-- Developing -->
				<div class="mastery-category">
					<div class="category-label">{t('developing')}</div>
					<div class="bar-container">
						<div 
							class="bar bar-developing" 
							style="width: {masteryData.max > 0 ? (masteryData.developing / masteryData.max) * 100 : 0}%"
						>
							<span class="bar-count">{masteryData.developing}</span>
						</div>
					</div>
				</div>

				<!-- Solid -->
				<div class="mastery-category">
					<div class="category-label">{t('solid')}</div>
					<div class="bar-container">
						<div 
							class="bar bar-solid" 
							style="width: {masteryData.max > 0 ? (masteryData.solid / masteryData.max) * 100 : 0}%"
						>
							<span class="bar-count">{masteryData.solid}</span>
						</div>
					</div>
				</div>

				<!-- Mastered -->
				<div class="mastery-category">
					<div class="category-label">{t('mastered')}</div>
					<div class="bar-container">
						<div 
							class="bar bar-mastered" 
							style="width: {masteryData.max > 0 ? (masteryData.mastered / masteryData.max) * 100 : 0}%"
						>
							<span class="bar-count">{masteryData.mastered}</span>
						</div>
					</div>
				</div>
			</div>

			<button type="button" class="heat-maps-button" on:click={showHeatMaps}>
				{t('heat_maps')}
			</button>
		{/if}
	</div>

{:else if currentView === 'list'}
	<!-- View B: Verse List -->
	<div class="stats-container">
		<div class="stats-header">
			<button type="button" class="back-btn" on:click={backToMastery}>
				← {t('back')}
			</button>
			<h2 class="stats-title">{t('heat_maps')}</h2>
			<button type="button" class="exit-btn" on:click={exitStats} aria-label={t('close')}>×</button>
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
	<!-- View C: Heat Map Detail -->
	<div class="stats-container">
		<div class="stats-header">
			<button type="button" class="back-btn" on:click={backToList}>
				← {t('back')}
			</button>
			<h2 class="stats-title">{t('heat_map')}</h2>
			<button type="button" class="exit-btn" on:click={exitStats} aria-label={t('close')}>×</button>
		</div>

		<div class="heat-map">
			<div class="heat-map-text">
				{#each getHeatMapChars(selectedVerse) as charData}
					{#if charData.char === '\n'}
						<br />
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

			<button 
				type="button" 
				class="practice-button" 
				on:click={() => practiceVerse(selectedVerse.id)}
			>
				{t('practice_now')}
			</button>
		</div>
	</div>
{/if}

<style>
	.stats-container {
		width: 100%;
		padding: 1rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.stats-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.stats-title {
		font-size: 1.75em;
		font-weight: 700;
		color: var(--text-color);
		margin: 0;
		flex: 1;
		text-align: left;
	}

	.back-btn {
		align-self: flex-start;
		padding: 0.5rem 1rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9em;
		transition: all 0.3s;
	}

	.back-btn:hover {
		background: var(--nav-button-bg);
	}

	.exit-btn {
		padding: 0.5rem;
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		background: transparent;
		color: #000;
		cursor: pointer;
		font-size: 1.5em;
		font-weight: 300;
		line-height: 1;
		transition: opacity 0.2s;
		opacity: 0.6;
	}

	.exit-btn:hover {
		opacity: 1;
	}

	:global([data-theme='dark']) .exit-btn {
		color: #fff;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}

	/* Mastery Bars View */
	.mastery-bars {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.mastery-category {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-label {
		font-size: 1em;
		font-weight: 600;
		color: var(--text-color);
	}

	.bar-container {
		background: var(--panel-background);
		border-radius: 8px;
		height: 2rem;
		position: relative;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: width 0.3s ease;
		min-width: 3rem;
	}

	.bar-count {
		font-size: 1em;
		font-weight: 700;
		color: #ffffff;
	}

	.bar-new {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.bar-developing {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}

	.bar-solid {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}

	.bar-mastered {
		background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	}

	.heat-maps-button {
		width: 100%;
		padding: 1rem;
		background: var(--accent-color);
		color: #ffffff;
		border: none;
		border-radius: 12px;
		font-size: 1.1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.heat-maps-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	/* Verse List View */
	.sort-controls {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.sort-button {
		padding: 0.5rem 1rem;
		background: var(--nav-button-bg);
		color: var(--text-color);
		border: none;
		border-radius: 8px;
		font-size: 0.9em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.sort-button:hover {
		background: var(--accent-color);
		color: #ffffff;
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
		padding: 1rem 1.25rem;
		background: var(--panel-background);
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--text-color);
		text-align: left;
	}

	.verse-list-item:hover {
		background: var(--accent-color);
		color: #ffffff;
		transform: translateX(4px);
	}

	.verse-ref {
		font-size: 1em;
		font-weight: 600;
	}

	.verse-score {
		font-size: 1.1em;
		font-weight: 700;
		opacity: 0.8;
	}

	/* Heat Map Detail View */
	.heat-map {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.heat-map-text {
		font-size: 1.5em;
		line-height: 2;
		color: var(--text-color);
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 12px;
	}

	.heat-char {
		display: inline-block;
		padding: 0.1em 0.05em;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.heat-char.punctuation {
		background-color: transparent !important;
	}

	:global([data-theme='dark']) .heat-char:not(.punctuation) {
		color: #000;
	}

	.verse-reference {
		text-align: center;
		font-size: 1.2em;
		font-weight: 600;
		color: var(--text-muted);
		margin-top: -1rem;
	}

	.practice-button {
		width: 100%;
		padding: 1rem;
		background: var(--accent-color);
		color: #ffffff;
		border: none;
		border-radius: 12px;
		font-size: 1.1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.practice-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 767px) {
		.stats-container {
			padding: 0.5rem;
		}

		.stats-title {
			font-size: 1.5em;
		}

		.heat-map-text {
			font-size: 1.25em;
			padding: 1rem;
		}
	}
</style>
