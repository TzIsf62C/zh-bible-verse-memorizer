<script>
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import { sortVersesByBibleOrder, createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { getDaysUntilDue, countDueVerses } from '$lib/utils/spacedRepetition';
	import IndividualReview from './IndividualReview.svelte';
	import SingleTextReview from './SingleTextReview.svelte';
	import Modal from './Modal.svelte';

	// State machine: 'initial' | 'selectCollection' | 'selectVerses' | 'editInterval' | 'reviewMode' | 'reviewOrder' | 'reviewing'
	let state = 'initial';
	let reviewMode = null; // 'individual' | 'singleText'
	let selectedVerses = [];
	let selectedCollectionIds = []; // Array for multi-select collections
	let sortedVerses = [];
	let expandedCollections = new Set(); // Track which collections are expanded
	let verseSortOrder = 'biblical'; // 'biblical' | 'dueDate'
	
	// Interval modal state
	let showIntervalModal = false;
	let currentInterval = 1;
	
	// Modal state
	let showModal = false;
	let modalMessage = '';

	// Get learned verses (verses that have been reviewed at least once)
	$: learnedVerses = $verses.filter(v => v.lastReviewed);

	// Sort learned verses based on selected order
	$: sortedLearnedVerses = verseSortOrder === 'biblical' 
		? sortVersesByBibleOrder(learnedVerses, $settings.bookNameCharset || 'simplified')
		: sortByDueDate(learnedVerses);

	// Create verse reference formatter that checks ALL verses for duplicates (not just learnedVerses)
	$: formatVerseRef = createVerseReferenceFormatter($verses);

	// Get due verses
	$: dueVerses = $verses.filter(v => {
		if (!v.lastReviewed) return false;
		if (!v.dueDate) return true;
		return new Date(v.dueDate) <= new Date();
	});

	// Helper functions
	function sortByDueDate(verses) {
		return [...verses].sort((a, b) => {
			const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
			const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
			return dateA - dateB;
		});
	}

	function shuffleArray(array) {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	// Button handlers for initial state
	function showDueVersesFlow() {
		if (dueVerses.length === 0) {
			modalMessage = t('no_learned_verses');
			showModal = true;
			return;
		}

		selectedVerses = dueVerses;
		proceedToReviewMode();
	}

	function showCollectionSelection() {
		if ($collections.length === 0) {
			modalMessage = t('no_collections');
			showModal = true;
			return;
		}
		state = 'selectCollection';
		selectedCollectionIds = [];
		expandedCollections = new Set();
	}

	function showVerseSelection() {
		if (learnedVerses.length === 0) {
			modalMessage = t('no_learned_verses');
			showModal = true;
			return;
		}
		state = 'selectVerses';
		selectedVerses = [];
		verseSortOrder = 'biblical';
	}

	function showEditInterval() {
		if (learnedVerses.length === 0) {
			modalMessage = t('no_learned_verses');
			showModal = true;
			return;
		}
		state = 'editInterval';
		selectedVerses = [];
		verseSortOrder = 'biblical';
	}

	function backToInitial() {
		state = 'initial';
		selectedVerses = [];
		selectedCollectionIds = [];
		expandedCollections = new Set();
	}

	function proceedFromCollectionSelection() {
		if (selectedCollectionIds.length === 0) {
			modalMessage = t('select_collection_to_review');
			showModal = true;
			return;
		}

		// Gather all verses from selected collections (use Set to deduplicate)
		const verseIdSet = new Set();
		selectedCollectionIds.forEach(collId => {
			const collection = $collections.find(c => c.id === collId);
			if (collection) {
				collection.verseIds.forEach(vId => verseIdSet.add(vId));
			}
		});

		// Get learned verses from the collected IDs
		const collectionLearnedVerses = Array.from(verseIdSet)
			.map(id => $verses.find(v => v.id === id))
			.filter(v => v && v.lastReviewed);

		if (collectionLearnedVerses.length === 0) {
			modalMessage = t('no_learned_verses_collection');
			showModal = true;
			return;
		}

		selectedVerses = collectionLearnedVerses;
		proceedToReviewMode();
	}

	function proceedFromVerseSelection() {
		if (selectedVerses.length === 0) {
			modalMessage = t('select_verse_to_review');
			showModal = true;
			return;
		}

		proceedToReviewMode();
	}

	function reviewDueVerses() {
		if (dueVerses.length === 0) {
			modalMessage = t('no_learned_verses');
			showModal = true;
			return;
		}

		selectedVerses = dueVerses;
		proceedToReviewMode();
	}

	function reviewCollection() {
		if (selectedCollectionIds.length === 0) {
			modalMessage = t('select_collection_to_review');
			showModal = true;
			return;
		}

		// Gather all verses from selected collections (use Set to deduplicate)
		const verseIdSet = new Set();
		selectedCollectionIds.forEach(collId => {
			const collection = $collections.find(c => c.id === collId);
			if (collection) {
				collection.verseIds.forEach(vId => verseIdSet.add(vId));
			}
		});

		// Get learned verses from the collected IDs
		const collectionLearnedVerses = Array.from(verseIdSet)
			.map(id => $verses.find(v => v.id === id))
			.filter(v => v && v.lastReviewed);

		if (collectionLearnedVerses.length === 0) {
			modalMessage = t('no_learned_verses_collection');
			showModal = true;
			return;
		}

		selectedVerses = collectionLearnedVerses;
		proceedToReviewMode();
	}
	
	function toggleCollectionSelection(collectionId) {
		if (selectedCollectionIds.includes(collectionId)) {
			selectedCollectionIds = selectedCollectionIds.filter(id => id !== collectionId);
		} else {
			selectedCollectionIds = [...selectedCollectionIds, collectionId];
		}
	}
	
	function toggleCollectionExpand(collectionId) {
		if (expandedCollections.has(collectionId)) {
			expandedCollections.delete(collectionId);
		} else {
			expandedCollections.add(collectionId);
		}
		expandedCollections = expandedCollections; // Trigger reactivity
	}

	function toggleVerseSelection(id) {
		if (selectedVerses.some(v => v.id === id)) {
			selectedVerses = selectedVerses.filter(v => v.id !== id);
		} else {
			const verse = $verses.find(v => v.id === id);
			if (verse) {
				selectedVerses = [...selectedVerses, verse];
			}
		}
	}

	function reviewSelected() {
		if (selectedVerses.length === 0) {
			modalMessage = t('select_verse_to_review');
			showModal = true;
			return;
		}

		proceedToReviewMode();
	}

	function proceedToReviewMode() {
		if (selectedVerses.length === 1) {
			// Single verse - start individual review immediately
			reviewMode = 'individual';
			sortedVerses = selectedVerses;
			state = 'reviewing';
		} else {
			// Multiple verses - show review mode modal
			state = 'reviewMode';
		}
	}

	function chooseIndividualReview() {
		reviewMode = 'individual';
		
		if (selectedVerses.length > 1) {
			// Show order modal
			state = 'reviewOrder';
		} else {
			sortedVerses = selectedVerses;
			state = 'reviewing';
		}
	}

	function chooseSingleTextReview() {
		reviewMode = 'singleText';
		// Single-text always uses Biblical order
		sortedVerses = sortVersesByBibleOrder(selectedVerses, $settings.bookNameCharset || 'simplified');
		state = 'reviewing';
	}

	function chooseOrder(order) {
		if (order === 'biblical') {
			sortedVerses = sortVersesByBibleOrder(selectedVerses, $settings.bookNameCharset || 'simplified');
		} else if (order === 'reverseBiblical') {
			sortedVerses = sortVersesByBibleOrder(selectedVerses, $settings.bookNameCharset || 'simplified').reverse();
		} else if (order === 'dueDate') {
			sortedVerses = sortByDueDate(selectedVerses);
		} else if (order === 'random') {
			sortedVerses = shuffleArray(selectedVerses);
		}
		state = 'reviewing';
	}

	function handleReviewComplete() {
		state = 'initial';
		selectedVerses = [];
		selectedCollectionIds = [];
		reviewMode = null;
		sortedVerses = [];
	}

	function handleReviewExit() {
		// Same as handleReviewComplete - return to initial three-button state
		state = 'initial';
		selectedVerses = [];
		selectedCollectionIds = [];
		reviewMode = null;
		sortedVerses = [];
	}

	function cancelReview() {
		state = 'initial';
		selectedVerses = [];
		selectedCollectionIds = [];
		reviewMode = null;
	}

	// Interval change functions
	function openIntervalModal() {
		if (selectedVerses.length === 0) {
			modalMessage = t('select_verse_to_change_interval');
			showModal = true;
			return;
		}
		currentInterval = 1;
		showIntervalModal = true;
	}

	function closeIntervalModal() {
		showIntervalModal = false;
	}

	function incrementInterval() {
		if (currentInterval < 20) {
			currentInterval++;
		}
	}

	function decrementInterval() {
		if (currentInterval > 1) {
			currentInterval--;
		}
	}

	function calculateDaysFromInterval(interval) {
		// Using same spaced repetition algorithm as the app
		// interval 1 = 1 day, interval 2 = 6 days, then exponential
		if (interval === 1) return 1;
		if (interval === 2) return 6;
		return Math.round(6 * Math.pow(2, interval - 2));
	}

	function confirmIntervalChange() {
		if (selectedVerses.length === 0) {
			closeIntervalModal();
			return;
		}

		// Update intervals for selected verses
		selectedVerses.forEach(selectedVerse => {
			verses.update(list => {
				return list.map(v => {
					if (v.id === selectedVerse.id) {
						const days = calculateDaysFromInterval(currentInterval);
						const newDueDate = new Date();
						newDueDate.setDate(newDueDate.getDate() + days);
						
						return {
							...v,
							interval: currentInterval,
							dueDate: newDueDate.toISOString()
						};
					}
					return v;
				});
			});
		});

		// Close modal and return to initial state
		closeIntervalModal();
		backToInitial();
	}

</script>

<div class="review-container">
	{#if state === 'initial'}
		<h2>{t('review_mode')}</h2>

		{#if learnedVerses.length === 0}
			<div class="empty-state">
				<p>{t('no_learned_verses')}</p>
			</div>
		{:else}
			<div class="initial-buttons">
				<button class="initial-btn due-btn" on:click={showDueVersesFlow}>
					{t('review_due_verses')}
					{#if dueVerses.length > 0}
						<span class="btn-count">({dueVerses.length})</span>
					{/if}
				</button>
				
				<button class="initial-btn" on:click={showCollectionSelection}>
					{t('review_collection_learned')}
					{#if $collections.length > 0}
						<span class="btn-count">({$collections.length})</span>
					{/if}
				</button>
				
				<button class="initial-btn" on:click={showVerseSelection}>
					{t('or_select_individual')}
					<span class="btn-count">({learnedVerses.length})</span>
				</button>
				
				<button class="initial-btn" on:click={showEditInterval}>
					{t('edit_review_interval')}
					<span class="btn-count">({learnedVerses.length})</span>
				</button>
			</div>
		{/if}

	{:else if state === 'selectCollection'}
		<div class="header-with-back">
			<button class="back-btn" on:click={backToInitial}>
				← {t('back')}
			</button>
			<h2>{t('review_collection_learned')}</h2>
		</div>

		<div class="collections-list">
			{#if $collections.length === 0}
				<p class="empty-message">{t('no_collections')}</p>
			{:else}
				{#each $collections as collection (collection.id)}
					{@const learnedInCollection = collection.verseIds.map(id => $verses.find(v => v.id === id)).filter(v => v && v.lastReviewed)}
					{@const dueCount = countDueVerses(collection.verseIds, $verses)}
					{@const isExpanded = expandedCollections.has(collection.id)}
					<div class="collection-item">
						<div 
							class="collection-header"
							on:click={(e) => {
								// If clicking the checkbox or expand button, let their handlers take over
								if (e.target.classList.contains('collection-checkbox') || 
								    e.target.classList.contains('expand-icon')) {
									return;
								}
								// Otherwise toggle the checkbox
								toggleCollectionSelection(collection.id);
							}}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggleCollectionSelection(collection.id);
								}
							}}
							role="button"
							tabindex="0"
						>
							<input
								type="checkbox"
								checked={selectedCollectionIds.includes(collection.id)}
								on:change|stopPropagation={() => toggleCollectionSelection(collection.id)}
								class="collection-checkbox"
							/>
							<span class="collection-title">
								{collection.title}
								<span class="collection-counts">({t('due_count', { count: dueCount })} / {t('learned_count', { count: learnedInCollection.length })})</span>
							</span>
							<button 
								class="expand-icon"
								class:expanded={isExpanded}
								on:click|stopPropagation={() => toggleCollectionExpand(collection.id)}
								aria-label="Expand"
								type="button"
							>▶</button>
						</div>
						<div class="collection-verses" class:expanded={isExpanded}>
							{#each learnedInCollection as verse (verse.id)}
								{@const dueInfo = getDaysUntilDue(verse.dueDate)}
								<div class="collection-verse-item">
									<div class="verse-ref">{formatVerseRef(verse)}</div>
									<div class="verse-status">
										{#if verse.lastReviewed}
											{@const date = new Date(verse.lastReviewed)}
											<span class="last-reviewed-text">{t('last_reviewed')}: {date.toLocaleDateString()}</span>
											{#if dueInfo !== null}
												{#if dueInfo.milliseconds < 0}
													{#if dueInfo.days <= -2}
														<span class="overdue">({t('days_overdue', { count: Math.abs(dueInfo.days) })})</span>
													{:else}
														<span class="due-soon">({t('due_today')})</span>
													{/if}
												{:else if dueInfo.days >= 1}
													{#if dueInfo.days === 1}
														<span class="due-future">({t('due_in_day')})</span>
													{:else}
														<span class="due-future">({t('due_in_days', { count: dueInfo.days })})</span>
													{/if}
												{:else if dueInfo.hours >= 2}
													<span class="due-soon">({t('due_in_hours', { count: dueInfo.hours })})</span>
												{:else if dueInfo.hours === 1}
													<span class="due-soon">({t('due_in_hour')})</span>
												{:else if dueInfo.minutes >= 1}
													<span class="due-soon">({t('due_in_minutes', { count: dueInfo.minutes })})</span>
												{:else}
													<span class="due-soon">({t('due_today')})</span>
												{/if}
											{/if}
										{:else}
											{t('not_reviewed_yet')}
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		{#if selectedCollectionIds.length > 0}
			<div class="fixed-bottom-btn">
				<button class="primary-btn large" on:click={proceedFromCollectionSelection}>
					{t('review')} {selectedCollectionIds.length} {selectedCollectionIds.length === 1 ? t('collection') : t('collections')}
				</button>
			</div>
		{/if}

	{:else if state === 'selectVerses'}
		<div class="header-with-back">
			<button class="back-btn" on:click={backToInitial}>
				← {t('back')}
			</button>
			<h2>{t('or_select_individual')}</h2>
		</div>

		<div class="sort-controls">
			<button 
				class="sort-btn" 
				class:active={verseSortOrder === 'biblical'}
				on:click={() => verseSortOrder = 'biblical'}
			>
				{t('order_biblical')}
			</button>
			<button 
				class="sort-btn" 
				class:active={verseSortOrder === 'dueDate'}
				on:click={() => verseSortOrder = 'dueDate'}
			>
				{t('order_due_date')}
			</button>
		</div>

		<div class="verse-list">
			{#each sortedLearnedVerses as verse (verse.id)}
				{@const isSelected = selectedVerses.some(v => v.id === verse.id)}
				{@const dueInfo = getDaysUntilDue(verse.dueDate)}
				<label class="verse-item">
					<input
						type="checkbox"
						checked={isSelected}
						on:change={() => toggleVerseSelection(verse.id)}
					/>
					<div class="verse-info">
						<div class="verse-ref">{formatVerseRef(verse)}</div>
						<div class="verse-status">
							{#if verse.lastReviewed}
								{@const date = new Date(verse.lastReviewed)}
								<span class="last-reviewed-text">{t('last_reviewed')}: {date.toLocaleDateString()}</span>
								{#if dueInfo !== null}
									{#if dueInfo.milliseconds < 0}
										{#if dueInfo.days <= -2}
											<span class="overdue">({t('days_overdue', { count: Math.abs(dueInfo.days) })})</span>
										{:else}
											<span class="due-soon">({t('due_today')})</span>
										{/if}
									{:else if dueInfo.days >= 1}
										{#if dueInfo.days === 1}
											<span class="due-future">({t('due_in_day')})</span>
										{:else}
											<span class="due-future">({t('due_in_days', { count: dueInfo.days })})</span>
										{/if}
									{:else if dueInfo.hours >= 2}
										<span class="due-soon">({t('due_in_hours', { count: dueInfo.hours })})</span>
									{:else if dueInfo.hours === 1}
										<span class="due-soon">({t('due_in_hour')})</span>
									{:else if dueInfo.minutes >= 1}
										<span class="due-soon">({t('due_in_minutes', { count: dueInfo.minutes })})</span>
									{:else}
										<span class="due-soon">({t('due_today')})</span>
									{/if}
								{/if}
							{:else}
								{t('not_reviewed_yet')}
							{/if}
						</div>
					</div>
				</label>
			{/each}
		</div>

		{#if selectedVerses.length > 0}
			<div class="fixed-bottom-btn">
				<button class="primary-btn large" on:click={proceedFromVerseSelection}>
					{t('review')} {selectedVerses.length} {selectedVerses.length === 1 ? t('verse') : t('verses')}
				</button>
			</div>
		{/if}

	{:else if state === 'editInterval'}
		<div class="header-with-back">
			<button class="back-btn" on:click={backToInitial}>
				← {t('back')}
			</button>
			<h2>{t('edit_review_interval')}</h2>
		</div>

		<div class="sort-controls">
			<button 
				class="sort-btn" 
				class:active={verseSortOrder === 'biblical'}
				on:click={() => verseSortOrder = 'biblical'}
			>
				{t('order_biblical')}
			</button>
			<button 
				class="sort-btn" 
				class:active={verseSortOrder === 'dueDate'}
				on:click={() => verseSortOrder = 'dueDate'}
			>
				{t('order_due_date')}
			</button>
		</div>

		<div class="verse-list">
			{#each sortedLearnedVerses as verse (verse.id)}
				{@const isSelected = selectedVerses.some(v => v.id === verse.id)}
				{@const dueInfo = getDaysUntilDue(verse.dueDate)}
				<label class="verse-item">
					<input
						type="checkbox"
						checked={isSelected}
						on:change={() => toggleVerseSelection(verse.id)}
					/>
					<div class="verse-info">
						<div class="verse-ref">{formatVerseRef(verse)}</div>
						<div class="verse-status">
							{#if verse.lastReviewed}
								{@const date = new Date(verse.lastReviewed)}
								<span class="last-reviewed-text">{t('last_reviewed')}: {date.toLocaleDateString()}</span>
								{#if dueInfo !== null}
									{#if dueInfo.milliseconds < 0}
										{#if dueInfo.days <= -2}
											<span class="overdue">({t('days_overdue', { count: Math.abs(dueInfo.days) })})</span>
										{:else}
											<span class="due-soon">({t('due_today')})</span>
										{/if}
									{:else if dueInfo.days >= 1}
										{#if dueInfo.days === 1}
											<span class="due-future">({t('due_in_day')})</span>
										{:else}
											<span class="due-future">({t('due_in_days', { count: dueInfo.days })})</span>
										{/if}
									{:else if dueInfo.hours >= 2}
										<span class="due-soon">({t('due_in_hours', { count: dueInfo.hours })})</span>
									{:else if dueInfo.hours === 1}
										<span class="due-soon">({t('due_in_hour')})</span>
									{:else if dueInfo.minutes >= 1}
										<span class="due-soon">({t('due_in_minutes', { count: dueInfo.minutes })})</span>
									{:else}
										<span class="due-soon">({t('due_today')})</span>
									{/if}
								{/if}
							{:else}
								{t('not_reviewed_yet')}
							{/if}
						</div>
					</div>
				</label>
			{/each}
		</div>

		{#if selectedVerses.length > 0}
			<div class="fixed-bottom-btn">
				<button class="primary-btn large" on:click={openIntervalModal}>
					{t('change_interval')}
				</button>
			</div>
		{/if}

	{:else if state === 'reviewMode'}
		<!-- Review Mode Modal -->
		<div class="modal-overlay" on:click={cancelReview} on:keydown={(e) => e.key === 'Escape' && cancelReview()} role="dialog" aria-modal="true">
			<div class="modal-content" on:click|stopPropagation role="document">
				<h3>{t('choose_review_mode')}</h3>
				<div class="modal-buttons">
					<button class="modal-option" on:click={chooseIndividualReview}>
						<div class="option-title">{t('review_individually')}</div>
						<div class="option-desc">Review verses one at a time in Advanced stage</div>
					</button>
					<button class="modal-option" on:click={chooseSingleTextReview}>
						<div class="option-title">{t('review_single_text')}</div>
						<div class="option-desc">Review as a continuous passage</div>
					</button>
				</div>
				<button class="cancel-btn" on:click={cancelReview}>{t('cancel')}</button>
			</div>
		</div>

	{:else if state === 'reviewOrder'}
		<!-- Review Order Modal -->
		<div class="modal-overlay" on:click={cancelReview} on:keydown={(e) => e.key === 'Escape' && cancelReview()} role="dialog" aria-modal="true">
			<div class="modal-content" on:click|stopPropagation role="document">
				<h3>{t('choose_review_order')}</h3>
				<div class="modal-buttons">
					<button class="modal-option" on:click={() => chooseOrder('biblical')}>
						<div class="option-title">{t('order_biblical')}</div>
					</button>
					<button class="modal-option" on:click={() => chooseOrder('reverseBiblical')}>
						<div class="option-title">{t('order_reverse_biblical')}</div>
					</button>
					<button class="modal-option" on:click={() => chooseOrder('dueDate')}>
						<div class="option-title">{t('order_due_date')}</div>
					</button>
					<button class="modal-option" on:click={() => chooseOrder('random')}>
						<div class="option-title">{t('order_random')}</div>
					</button>
				</div>
				<button class="cancel-btn" on:click={() => state = 'reviewMode'}>{t('back')}</button>
			</div>
		</div>

	{:else if state === 'reviewing'}
		{#if reviewMode === 'individual'}
			<IndividualReview verses={sortedVerses} on:complete={handleReviewComplete} on:exit={handleReviewExit} />
		{:else if reviewMode === 'singleText'}
			<SingleTextReview verses={sortedVerses} on:complete={handleReviewComplete} on:exit={handleReviewExit} />
		{/if}
	{/if}
</div>

<!-- Alert Modal -->
<Modal 
	show={showModal} 
	message={modalMessage}
	on:close={() => showModal = false}
/>

<!-- Change Interval Modal -->
{#if showIntervalModal}
	<div class="modal-overlay" on:click={closeIntervalModal} on:keydown={(e) => e.key === 'Escape' && closeIntervalModal()} role="dialog" aria-modal="true">
		<div class="modal-content interval-modal" on:click|stopPropagation role="document">
			<h3>{t('change_interval_title')}</h3>
			
			<div class="interval-control">
				<div class="interval-label">{t('interval_label')}</div>
				<div class="interval-adjuster">
					<button class="interval-btn" on:click={decrementInterval} aria-label="Decrease">−</button>
					<div class="interval-value">{currentInterval}</div>
					<button class="interval-btn" on:click={incrementInterval} aria-label="Increase">+</button>
				</div>
				<div class="interval-days">
					{t('review_in_days', { count: calculateDaysFromInterval(currentInterval) })}
				</div>
			</div>

			<div class="modal-buttons-horizontal">
				<button class="modal-btn secondary" on:click={closeIntervalModal}>{t('cancel')}</button>
				<button class="modal-btn primary" on:click={confirmIntervalChange}>{t('confirm')}</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.review-container {
		display: grid;
		gap: 1.5rem;
		width: 100%;
		padding: 1rem;
		padding-bottom: 120px; /* Add space for fixed bottom button */
		max-width: 1000px;
		margin: 0 auto;
		justify-self: stretch;
		min-width: 0;
	}

	h2 {
		margin: 0 0 1.5rem 0;
		color: var(--text-color);
	}

	h3 {
		margin: 0 0 1rem 0;
		color: var(--text-color);
		font-size: 1.1em;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--subtitle-color);
	}

	/* Initial state buttons */
	.initial-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.initial-btn {
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

	.initial-btn:hover {
		border-color: var(--accent-color);
		background: var(--nav-button-bg);
	}

	.initial-btn.due-btn {
		background: #d32f2f;
		color: white;
		border-color: #d32f2f;
	}

	.initial-btn.due-btn:hover {
		background: #b71c1c;
		border-color: #b71c1c;
	}

	.btn-count {
		margin-left: 0.5rem;
		font-weight: normal;
		opacity: 0.9;
	}

	/* Header with back button */
	.header-with-back {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	/* Sort controls */
	.sort-controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.sort-btn {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9em;
		transition: all 0.3s;
	}

	.sort-btn:hover {
		background: var(--nav-button-bg);
	}

	.sort-btn.active {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}

	/* Fixed bottom button */
	.fixed-bottom-btn {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		background: var(--app-background);
		border-top: 1px solid var(--file-border);
		z-index: 100;
		display: flex;
		justify-content: center;
	}

	.primary-btn.large {
		width: 100%;
		max-width: 600px;
		padding: 1.25rem 2rem;
		font-size: 1.1em;
	}
	
	/* Expandable collection list styles */
	.collections-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.empty-message {
		color: var(--subtitle-color);
		font-style: italic;
		padding: 1rem;
		text-align: center;
	}
	
	.collection-item {
		background: var(--file-bg);
		border-radius: 6px;
		overflow: hidden;
	}
	
	.collection-header {
		display: flex;
		align-items: center;
		padding: 0.75rem;
		gap: 0.75rem;
		cursor: pointer;
		transition: background 0.2s;
	}
	
	.collection-header:hover {
		background: var(--nav-button-bg);
	}
	
	.collection-checkbox {
		cursor: pointer;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	
	.collection-title {
		flex: 1;
		font-weight: 600;
		color: var(--text-color);
	}
	
	.collection-counts {
		font-weight: normal;
		color: var(--subtitle-color);
		font-size: 0.9em;
	}
	
	.expand-icon {
		background: transparent;
		border: none;
		color: var(--subtitle-color);
		cursor: pointer;
		padding: 0.25rem;
		font-size: 0.8em;
		transition: transform 0.2s;
		flex-shrink: 0;
	}
	
	.expand-icon.expanded {
		transform: rotate(90deg);
	}
	
	.collection-verses {
		display: none;
		padding: 0 0.75rem 0.75rem 2.5rem;
		background: var(--nav-button-bg);
	}
	
	.collection-verses.expanded {
		display: block;
	}
	
	.collection-verse-item {
		padding: 0.5rem;
		margin: 0.25rem 0;
		background: var(--panel-background);
		border-radius: 4px;
		font-size: 0.9em;
	}
	
	.verse-status {
		font-size: 0.85em;
		color: var(--subtitle-color);
		margin-top: 0.25rem;
	}
	
	.last-reviewed-text {
		margin-right: 0.5rem;
	}

	.primary-btn {
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

	.primary-btn:hover {
		opacity: 0.9;
	}

	.verse-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 60vh;
		overflow-y: auto;
		padding: 0.5rem;
		border: 1px solid var(--file-border);
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.verse-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--file-bg);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.verse-item:hover {
		background: var(--nav-button-bg);
	}

	.verse-item input[type="checkbox"] {
		cursor: pointer;
		width: 18px;
		height: 18px;
	}

	.verse-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.verse-ref {
		font-weight: 600;
		color: var(--text-color);
	}

	.overdue {
		color: #ff4444;
		font-weight: 500;
	}
	
	.due-soon {
		color: #ff9800;
		font-weight: 500;
	}
	
	.due-future {
		color: #4caf50;
	}

	/* Modal Styles */
	.modal-overlay {
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

	.modal-content {
		background: var(--panel-background);
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.modal-content h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.modal-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.modal-option {
		padding: 1.5rem;
		border: 2px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		text-align: left;
	}

	.modal-option:hover {
		border-color: var(--accent-color);
		background: var(--nav-button-bg);
	}

	.option-title {
		font-weight: 600;
		font-size: 1.1em;
		color: var(--accent-color);
	}

	.option-desc {
		margin-top: 0.5rem;
		font-size: 0.9em;
		color: var(--subtitle-color);
		font-weight: normal;
	}

	.cancel-btn {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		transition: all 0.3s;
	}

	.cancel-btn:hover {
		background: var(--file-bg);
	}

	/* Interval Modal Styles */
	.interval-modal {
		max-width: 400px;
	}

	.interval-control {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0;
	}

	.interval-label {
		font-size: 1em;
		color: var(--subtitle-color);
	}

	.interval-adjuster {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.interval-btn {
		width: 48px;
		height: 48px;
		border: 2px solid var(--accent-color);
		background: var(--file-bg);
		color: var(--accent-color);
		border-radius: 50%;
		font-size: 1.5em;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
		font-weight: bold;
	}

	.interval-btn:hover {
		background: var(--accent-color);
		color: white;
	}

	.interval-value {
		font-size: 2.5em;
		font-weight: bold;
		color: var(--accent-color);
		min-width: 80px;
		text-align: center;
	}

	.interval-days {
		font-size: 0.9em;
		color: var(--subtitle-color);
	}

	.modal-buttons-horizontal {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.modal-btn {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 600;
		transition: all 0.3s;
	}

	.modal-btn.primary {
		background: var(--accent-color);
		color: white;
	}

	.modal-btn.primary:hover {
		opacity: 0.9;
	}

	.modal-btn.secondary {
		background: var(--file-bg);
		color: var(--text-color);
		border: 1px solid var(--file-border);
	}

	.modal-btn.secondary:hover {
		background: var(--nav-button-bg);
	}

	@media (max-width: 767px) {
		.review-container {
			padding-left: 0.5rem;
			padding-right: 0.5rem;
			padding-top: 0px;
			gap: 1rem;
		}

		.initial-btn {
			padding: 1.25rem;
			font-size: 1em;
		}

		.verse-list {
			max-height: 50vh;
		}

		.fixed-bottom-btn {
			padding: 0.75rem;
		}
	}
</style>
