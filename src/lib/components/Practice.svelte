<script>
	import { createEventDispatcher } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { settings } from '$lib/stores/settings';
	import { practice } from '$lib/stores/practice';
	import { t } from '$lib/i18n';
	import { sortVersesByBibleOrder, createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import Modal from './Modal.svelte';
	import SpeedChallengeCollection from './SpeedChallengeCollection.svelte';
	import SpeedChallengeVerse from './SpeedChallengeVerse.svelte';
	import ReferenceQuiz from './ReferenceQuiz.svelte';
	import PracticeClassic from './PracticeClassic.svelte';
	import Reverse from './Reverse.svelte';
	import BlindChallenge from './BlindChallenge.svelte';
	import ReverseByVerse from './ReverseByVerse.svelte';
	import FirstAndLast from './FirstAndLast.svelte';
	import { registerStreakActivity } from '$lib/stores/streak.js';
	
	const dispatch = createEventDispatcher();
	
	// Export prop for preselected verse (from Stats "Practice Now" button)
	export let preselectedVerseId = null;
	
	// State machine: 'initial' | 'selectCollection' | 'selectVerse' | 'selectActivity' | 'practicing'
	let state = 'initial';
	let practiceType = null; // 'collection' | 'verse'
	let selectedCollection = null;
	let selectedCollectionFilter = null; // 'learned' | 'all'
	let selectedVerse = null;
	let selectedActivity = null;
	let processedPreselection = false; // Prevent reactive loop with preselection
	let expandedVerseGroups = new Set();
	
	// Get verses for selected collection (reactive based on stores and selected collection/filter)
	$: baseVerses = selectedCollection 
		? $verses.filter(v => selectedCollection.verseIds.includes(v.id))
		: [];
	
	$: filteredVerses = selectedCollectionFilter === 'learned' && baseVerses
		? baseVerses.filter(v => v.lastReviewed && v.lastReviewed !== null)
		: baseVerses;
		
	$: collectionVerses = filteredVerses
		? sortVersesByBibleOrder(filteredVerses, $settings.bookNameCharset || 'simplified')
		: [];
	
	// Modal state
	let showModal = false;
	let modalMessage = '';
	
	// Create verse reference formatter
	$: formatVerseRef = createVerseReferenceFormatter($verses);
	
	// Sort verses by biblical order for verse selection
	$: sortedVerses = sortVersesByBibleOrder($verses, $settings.bookNameCharset || 'simplified');

	// Group verses by book/chapter for expandable verse selection list
	$: groupedVerses = (() => {
		const groups = [];
		let currentKey = null;
		for (const verse of sortedVerses) {
			const key = `${verse.bookName}-${verse.chapterNumber}`;
			if (key !== currentKey) {
				groups.push({
					key,
					bookName: verse.bookName,
					chapterNumber: verse.chapterNumber,
					verses: [verse]
				});
				currentKey = key;
			} else {
				groups[groups.length - 1].verses.push(verse);
			}
		}
		return groups;
	})();

	$: if (state === 'selectVerse' && groupedVerses.length > 0 && expandedVerseGroups.size === 0) {
		expandedVerseGroups = new Set([groupedVerses[0].key]);
	}
	
	// Activity choices based on practice type
	$: activityChoices = practiceType === 'collection' ? [
		{ id: 'speed-challenge', label: t('speed_challenge'), icon: 'lightning' },
		{ id: 'reference-quiz', label: t('reference_quiz'), icon: 'question' },
		{ id: 'reverse-by-verse', label: t('reverse_by_verse'), icon: 'arrows-reverse' },
		{ id: 'first-and-last', label: t('first_and_last'), icon: 'brackets' }
	] : [
		{ id: 'classic', label: t('classic'), icon: 'book-open' },
		{ id: 'speed-challenge', label: t('speed_challenge'), icon: 'lightning' },
		{ id: 'reverse', label: t('reverse'), icon: 'arrows-reverse' },
		{ id: 'blind-challenge', label: t('blind_challenge'), icon: 'eye-off' }
	];
	
	// SVG icon paths for practice activities
	const activityIcons = {
		'book-open': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>',
		'lightning': '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
		'arrows-reverse': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>',
		'eye-off': '<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>',
		'question': '<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>',
		'layers': '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>',
		'brackets': '<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21V3M16.5 21V3M3 7.5h4.5M3 16.5h4.5M16.5 7.5H21M16.5 16.5H21"/>'
	};
	
	// Button handlers
	function practiceCollection() {
		if ($collections.length === 0) {
			modalMessage = t('no_collections');
			showModal = true;
			return;
		}
		practiceType = 'collection';
		state = 'selectCollection';
	}
	
	function practiceVerse() {
		if ($verses.length === 0) {
			modalMessage = t('no_verses_to_learn');
			showModal = true;
			return;
		}
		practiceType = 'verse';
		expandedVerseGroups = new Set();
		state = 'selectVerse';
	}
	
	function selectCollection(collection) {
		selectedCollection = collection;
		selectedCollectionFilter = null;
	}
	
	function startCollectionPractice(filter) {
		selectedCollectionFilter = filter;
		proceedToActivitySelection();
	}
	
	function selectVerse(verse) {
		selectedVerse = verse;
		expandedVerseGroups.add(`${verse.bookName}-${verse.chapterNumber}`);
		expandedVerseGroups = new Set(expandedVerseGroups);
	}

	function toggleVerseGroup(groupKey) {
		if (expandedVerseGroups.has(groupKey)) {
			expandedVerseGroups.delete(groupKey);
		} else {
			expandedVerseGroups.add(groupKey);
		}
		expandedVerseGroups = new Set(expandedVerseGroups);
	}
	
	function proceedToActivitySelection() {
		if (practiceType === 'collection' && !selectedCollection) {
			modalMessage = t('select_collection_to_review');
			showModal = true;
			return;
		}
		if (practiceType === 'collection' && !selectedCollectionFilter) {
			modalMessage = t('select_learned_or_all');
			showModal = true;
			return;
		}
		if (practiceType === 'verse' && !selectedVerse) {
			modalMessage = t('select_verse');
			showModal = true;
			return;
		}
		state = 'selectActivity';
	}
	
	function chooseActivity(activityId) {
		selectedActivity = activityId;
		state = 'practicing';
	}
	
	function handleActivityComplete() {
		registerStreakActivity('practice');
		// Return to activity selection
		selectedActivity = null;
		state = 'selectActivity';
	}

	function handleActivityBack() {
		selectedActivity = null;
		state = 'selectActivity';
	}

	function handleClassicAdvancedComplete() {
		registerStreakActivity('practice');
	}
	
	function handleActivityExit() {
		// Return to initial state
		reset();
	}
	
	function goBack() {
		if (state === 'selectActivity') {
			processedPreselection = false; // Clear preselection flag when user manually navigates
			// Clear the parent's preselection when manually navigating back
			if (preselectedVerseId) {
				dispatch('clearPreselection');
			}
			state = practiceType === 'collection' ? 'selectCollection' : 'selectVerse';
		} else if (state === 'selectCollection' || state === 'selectVerse') {
			reset();
		} else if (state === 'practicing') {
			selectedActivity = null;
			state = 'selectActivity';
		}
	}
	
	function reset() {
		state = 'initial';
		practiceType = null;
		selectedCollection = null;
		selectedCollectionFilter = null;
		selectedVerse = null;
		selectedActivity = null;
		processedPreselection = false; // Reset preselection flag
	}
	
	function exitPractice() {
		reset();
		dispatch('exit');
	}
	
	// Handle preselected verse (from Stats "Practice Now")
	$: if (preselectedVerseId && $verses.length > 0 && state === 'initial' && !processedPreselection) {
		const verse = $verses.find(v => v.id === preselectedVerseId);
		if (verse) {
			practiceType = 'verse';
			selectedVerse = verse;
			state = 'selectActivity';
			processedPreselection = true; // Prevent re-triggering
		}
	}
	
	// Reset flag when preselection is cleared
	$: if (preselectedVerseId === null) {
		processedPreselection = false;
	}
</script>

{#if state === 'initial'}
	<div class="panel practice-panel">
		<div class="panel-header">
			<h2>{t('practice_mode')}</h2>
		</div>
		
		<div class="button-group">
			<button class="primary-button" on:click={practiceCollection}>
				{t('practice_a_collection')}
			</button>
			<button class="primary-button" on:click={practiceVerse}>
				{t('practice_a_verse')}
			</button>
		</div>
	</div>

{:else if state === 'selectCollection'}
	<div class="panel practice-panel">
		<div class="panel-header">
			<button class="back-button" on:click={goBack} aria-label={t('back')}>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
			<h3>{t('select_collection')}</h3>
			<div class="spacer"></div>
		</div>
		
		<div class="collection-list">
			{#each $collections as collection}
				{@const collectionBaseVerses = $verses.filter(v => collection.verseIds.includes(v.id))}
				{@const learnedCount = collectionBaseVerses.filter(v => v.lastReviewed && v.lastReviewed !== null).length}
				{@const allCount = collectionBaseVerses.length}
				<div class="collection-item-container">
					<button 
						class="collection-item" 
						class:selected={selectedCollection?.id === collection.id}
						on:click={() => selectCollection(collection)}
					>
						<span class="collection-title">{collection.title}</span>
						<span class="verse-count">{collection.verseIds.length} {t('verses')}</span>
						{#if selectedCollection?.id === collection.id}
							<span class="check-icon">✓</span>
						{/if}
					</button>
					{#if selectedCollection?.id === collection.id}
						<div class="collection-practice-actions">
							{#if learnedCount !== allCount}
								<button class="primary-button split-action" on:click={() => startCollectionPractice('learned')}>
									{t('practice')} {t('learned')}
								</button>
								<button class="primary-button split-action" on:click={() => startCollectionPractice('all')}>
									{t('practice')} {t('all')}
								</button>
							{:else}
								<button class="primary-button" on:click={() => startCollectionPractice('all')}>
									{t('next')}
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

{:else if state === 'selectVerse'}
	<div class="panel practice-panel">
		<div class="panel-header">
			<button class="back-button" on:click={goBack} aria-label={t('back')}>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
			<h3>{t('select_verse')}</h3>
			<div class="spacer"></div>
		</div>
		
		<div class="verse-list">
			{#each groupedVerses as group}
				<div class="verse-group" class:expanded={expandedVerseGroups.has(group.key)}>
					<button class="verse-group-header" on:click={() => toggleVerseGroup(group.key)}>
						<span>{group.bookName} {group.chapterNumber}</span>
						<span class="group-meta">{group.verses.length} {t('verses')}</span>
						<span class="expand-icon">{expandedVerseGroups.has(group.key) ? '▾' : '▸'}</span>
					</button>
					{#if expandedVerseGroups.has(group.key)}
						<div class="verse-group-items">
							{#each group.verses as verse}
								<button
									class="verse-item"
									class:selected={selectedVerse?.id === verse.id}
									on:click={() => selectVerse(verse)}
								>
									<span class="verse-ref">{formatVerseRef(verse)}</span>
									<span class="verse-preview">{verse.verseText.substring(0, 20)}...</span>
									{#if selectedVerse?.id === verse.id}
										<span class="check-icon">✓</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
		
		<div class="fixed-bottom-button">
			<button 
				class="primary-button"
				disabled={!selectedVerse}
				on:click={proceedToActivitySelection}
			>
				{t('select_activity')}
			</button>
		</div>
	</div>

{:else if state === 'selectActivity'}
	<div class="panel practice-panel">
		<div class="panel-header">
			<button class="back-button" on:click={goBack} aria-label={t('back')}>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
			<h2>{t('select_activity')}</h2>
			<div class="spacer"></div>
		</div>
		
		<div class="selected-target">
			{#if practiceType === 'collection'}
				<span class="target-label">{selectedCollection?.title}</span>
			{:else if practiceType === 'verse'}
				<span class="target-label">{formatVerseRef(selectedVerse)}</span>
			{/if}
		</div>
		
		<div class="activity-grid">
			{#each activityChoices as activity}
				<button 
					class="activity-card" 
					on:click={() => chooseActivity(activity.id)}
				>
					<svg
						class="activity-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						{@html activityIcons[activity.icon]}
					</svg>
					<span class="activity-label">{activity.label}</span>
					
					{#if activity.id === 'speed-challenge'}
						{@const bestTime = practiceType === 'collection' 
							? $practice.bestTimes[selectedCollection?.id]
							: $practice.bestVerseTimes[selectedVerse?.id]}
						{#if bestTime}
							<span class="best-time">
								{t('best_time').replace('{time}', (bestTime.officialTime / 1000).toFixed(1) + 's')}
							</span>
						{/if}
					{/if}
				</button>
			{/each}
		</div>
	</div>

{:else if state === 'practicing'}
	{#if selectedActivity === 'speed-challenge' && practiceType === 'collection'}
		<SpeedChallengeCollection 
			collection={selectedCollection}
			verses={collectionVerses}
			on:complete={handleActivityComplete}
			on:back={handleActivityBack}
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'speed-challenge' && practiceType === 'verse'}
		<SpeedChallengeVerse 
			verse={selectedVerse}
			on:complete={handleActivityComplete}
			on:back={handleActivityBack}
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'reference-quiz'}
		<ReferenceQuiz 
			collection={selectedCollection}
			verses={collectionVerses}
			on:complete={handleActivityComplete}
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'classic'}
		<PracticeClassic 
			verse={selectedVerse}
			on:complete={handleActivityComplete}
			on:advancedcomplete={handleClassicAdvancedComplete}
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'reverse'}
		<Reverse 
			verse={selectedVerse}
			on:complete={handleActivityComplete}
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'blind-challenge'}
		<BlindChallenge 
			verse={selectedVerse}
			on:complete={handleActivityComplete}
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'reverse-by-verse'}
		<ReverseByVerse 
			collection={selectedCollection}
			verses={collectionVerses}
			on:complete={handleActivityComplete}
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'first-and-last'}
		<FirstAndLast 
			collection={selectedCollection}
			verses={collectionVerses}
			on:complete={handleActivityComplete}
			on:exit={handleActivityExit}
		/>
	{/if}
{/if}

<Modal 
	show={showModal} 
	message={modalMessage}
	on:close={() => showModal = false}
/>

<style>
	.practice-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		overflow-y: auto;
	}
	
	.panel-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.back-button {
		padding: 0.5rem;
		background: none;
		border: none;
		color: var(--text-color);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.spacer {
		width: 40px;
	}
	
	h2 {
		margin: 0;
		font-size: 1.5em;
		flex: 1;
		text-align: center;
	}
	h3 {
		margin: 0;
		font-size: 1.2em;
		flex: 1;
		text-align: center;
	}
	
	.button-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2rem;
	}
	
	.primary-button {
		width: 100%;
		padding: 1.5rem;
		border: 2px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1em;
		font-weight: 600;
		transition: all 0.3s;
		text-align: center;
	}
	
	.primary-button:hover:not(:disabled) {
		border-color: var(--accent-color);
		background: var(--nav-button-bg);
	}
	
	.primary-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.collection-list,
	.verse-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 5rem;
	}
	
	.collection-item-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.verse-group {
		border: 1px solid var(--border-color);
		border-radius: 8px;
		overflow: hidden;
		background: var(--panel-background);
	}

	.verse-group-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 1rem;
		border: none;
		background: transparent;
		color: var(--text-color);
		font-weight: 600;
		cursor: pointer;
		text-align: left;
	}

	.verse-group-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
		border-top: 1px solid var(--border-color);
	}

	.group-meta {
		margin-left: auto;
		font-size: 0.9em;
		color: var(--subtitle-color);
	}

	.expand-icon {
		min-width: 1.2em;
		text-align: center;
		color: var(--subtitle-color);
	}
	
	.collection-item,
	.verse-item {
		padding: 1rem;
		background: var(--panel-background);
		border: 2px solid var(--border-color);
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: all 0.2s;
		text-align: left;
	}
	
	.collection-item.selected,
	.verse-item.selected {
		border-color: var(--accent-color);
		background: var(--accent-color-light, rgba(76, 175, 80, 0.1));
	}
	
	.collection-title,
	.verse-ref {
		font-weight: 600;
		flex-shrink: 0;
		color: var(--text-color);
	}
	
	.verse-count,
	.verse-preview {
		color: var(--subtitle-color);
		font-size: 0.9em;
		flex: 1;
	}
	
	.check-icon {
		color: var(--accent-color);
		font-size: 1.2em;
		font-weight: bold;
	}
	
	.collection-practice-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: nowrap;
		padding: 0 0.25rem 0.5rem;
	}

	.split-action {
		flex: 1;
		padding: 0.9rem;
	}
	
	.fixed-bottom-button {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		background: var(--app-background);
		border-top: 1px solid var(--border-color);
		display: flex;
		justify-content: center;
	}
	
	.fixed-bottom-button .primary-button {
		max-width: 400px;
	}
	
	.selected-target {
		text-align: center;
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		background: var(--accent-color-light, rgba(76, 175, 80, 0.1));
		border-radius: 8px;
	}
	
	.target-label {
		font-size: 1.1em;
		font-weight: 600;
		color: var(--text-color);
	}
	
	.activity-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}
	
	.activity-card {
		padding: 2rem 1rem;
		background: var(--panel-background);
		border: 2px solid var(--border-color);
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		transition: all 0.2s;
		min-width: 0;
	}
	
	.activity-card:hover {
		border-color: var(--accent-color);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	
	.activity-icon {
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		color: var(--text-color);
	}
	
	.activity-label {
		font-weight: 600;
		font-size: 1.1em;
		color: var(--text-color);
	}
	
	.best-time {
		font-size: 0.85em;
		color: var(--accent-color);
		font-weight: 600;
	}
	
	@media (max-width: 767px) {
		.practice-panel {
			padding: 1rem;
			border-radius:8px;
		}
		
		.panel-header {
			margin-bottom: 1rem;
		}
		
		.button-group {
			margin-top: 1rem;
		}
		
		.primary-button {
			padding: 1.25rem;
			font-size: 1em;
		}
		
		.fixed-bottom-button .primary-button {
			max-width: 100%;
			width: 100%;
		}
		
		.activity-grid {
			gap: 0.5rem;
		}
		
		.activity-card {
			padding: 1.5rem 0.75rem;
		}
		
		.activity-icon {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		.activity-label {
			font-size: 0.95em;
		}

		.collection-practice-actions {
			flex-direction: row;
		}
	}
</style>
