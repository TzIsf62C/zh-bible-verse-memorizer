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
	
	const dispatch = createEventDispatcher();
	
	// Export prop for preselected verse (from Stats "Practice Now" button)
	export let preselectedVerseId = null;
	
	// State machine: 'initial' | 'selectCollection' | 'selectVerse' | 'selectActivity' | 'practicing'
	let state = 'initial';
	let practiceType = null; // 'collection' | 'verse'
	let selectedCollection = null;
	let selectedVerse = null;
	let selectedActivity = null;
	let processedPreselection = false; // Prevent reactive loop with preselection
	
	// Modal state
	let showModal = false;
	let modalMessage = '';
	
	// Create verse reference formatter
	$: formatVerseRef = createVerseReferenceFormatter($verses);
	
	// Sort verses by biblical order for verse selection
	$: sortedVerses = sortVersesByBibleOrder($verses, $settings.bookNameCharset || 'simplified');
	
	// Activity choices based on practice type
	$: activityChoices = practiceType === 'collection' ? [
		{ id: 'speed-challenge', label: t('speed_challenge'), icon: '⚡' },
		{ id: 'reference-quiz', label: t('reference_quiz'), icon: '❓' }
	] : [
		{ id: 'classic', label: t('classic'), icon: '📖' },
		{ id: 'speed-challenge', label: t('speed_challenge'), icon: '⚡' }
	];
	
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
		state = 'selectVerse';
	}
	
	function selectCollection(collection) {
		selectedCollection = collection;
	}
	
	function selectVerse(verse) {
		selectedVerse = verse;
	}
	
	function proceedToActivitySelection() {
		if (practiceType === 'collection' && !selectedCollection) {
			modalMessage = t('select_collection_to_review');
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
		// Return to activity selection
		selectedActivity = null;
		state = 'selectActivity';
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
		selectedVerse = null;
		selectedActivity = null;
		processedPreselection = false; // Reset preselection flag
	}
	
	function exitPractice() {
		reset();
		dispatch('exit');
	}
	
	// Get verses for selected collection
	$: collectionVerses = selectedCollection 
		? sortVersesByBibleOrder(
			$verses.filter(v => selectedCollection.verseIds.includes(v.id)),
			$settings.bookNameCharset || 'simplified'
		)
		: [];
	
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
			<h2>{t('select_collection')}</h2>
			<div class="spacer"></div>
		</div>
		
		<div class="collection-list">
			{#each $collections as collection}
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
			{/each}
		</div>
		
		<div class="fixed-bottom-button">
			<button 
				class="primary-button"
				disabled={!selectedCollection}
				on:click={proceedToActivitySelection}
			>
				{t('select_activity')}
			</button>
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
			<h2>{t('select_verse')}</h2>
			<div class="spacer"></div>
		</div>
		
		<div class="verse-list">
			{#each sortedVerses as verse}
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
					<span class="activity-icon">{activity.icon}</span>
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
			on:exit={handleActivityExit}
		/>
	{:else if selectedActivity === 'speed-challenge' && practiceType === 'verse'}
		<SpeedChallengeVerse 
			verse={selectedVerse}
			on:complete={handleActivityComplete}
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
	
	.button-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2rem;
	}
	
	.primary-button {
		padding: 1.5rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1em;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		transition: opacity 0.2s;
	}
	
	.primary-button:hover:not(:disabled) {
		opacity: 0.9;
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
	
	.fixed-bottom-button {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		background: var(--app-background);
		border-top: 1px solid var(--border-color);
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
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
	}
	
	.activity-card:hover {
		border-color: var(--accent-color);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	
	.activity-icon {
		font-size: 3em;
	}
	
	.activity-label {
		font-weight: 600;
		font-size: 1.1em;
	}
	
	.best-time {
		font-size: 0.85em;
		color: var(--accent-color);
		font-weight: 600;
	}
	
	@media (max-width: 767px) {
		.practice-panel {
			padding: 0.5rem;
		}
		
		.panel-header {
			margin-bottom: 1rem;
		}
		
		h2 {
			font-size: 1.2em;
		}
		
		.button-group {
			margin-top: 1rem;
		}
		
		.primary-button {
			padding: 1.25rem;
			font-size: 1em;
		}
		
		.activity-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
