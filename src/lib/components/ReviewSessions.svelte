<script>
	import { createEventDispatcher } from 'svelte';
	import { browser, dev } from '$app/environment';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import { sortVersesByBibleOrder, createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { getDaysUntilDue, countDueVerses, buildManualIntervalUpdate, getSharedReviewSchedule } from '$lib/utils/spacedRepetition';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { icons } from '$lib/utils/icons.js';
	import {
		buildNeedsPracticeCollection,
		findCollectionById
	} from '$lib/utils/computedCollections';
	import IndividualReview from './IndividualReview.svelte';
	import SingleTextReview from './SingleTextReview.svelte';
	import Keyboard from './Keyboard.svelte';
	import { registerStreakActivity } from '$lib/stores/streak.js';
	import Modal from './Modal.svelte';
	import { scrollRootToTopLeft } from '$lib/utils/scroll';

	const dispatch = createEventDispatcher();

	// State machine: 'initial' | 'selectCollection' | 'selectVerses' | 'editInterval' | 'reviewMode' | 'reviewOrder' | 'reviewing'
	let state = 'initial';
	let reviewMode = null; // 'individual' | 'singleText'
	let selectedVerses = [];
	let selectedCollectionIds = []; // Array for multi-select collections
	let sortedVerses = [];
	let expandedCollections = new Set(); // Track which collections are expanded
	let verseSortOrder = 'biblical'; // 'biblical' | 'dueDate' | 'collection'
	let reviewModeBackState = 'initial';
	let needsPracticeCollection = null;
	let selectableCollections = [];
	
	// Interval modal state
	let showIntervalModal = false;
	let intervalInputValue = '';
	let intervalInputAppendMode = false;
	let intervalInputDirty = false;
	let intervalModalBaseDate = new Date();
	let intervalModalSchedule = {
		interval: null,
		dueDate: null,
		hasMixedIntervals: false,
		hasMixedDueDates: false,
		normalizedVerses: []
	};
	let intervalDraftNumber = NaN;
	let intervalDraftIsValid = false;
	let intervalDisplayValue = '-';
	let intervalPreviewDueDate = '-';
	
	// Modal state
	let showModal = false;
	let modalMessage = '';
	let showReviewModeInfoModal = false;

	const infoIconPath = '<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path>';

	const DAY_MS = 24 * 60 * 60 * 1000;

	// Get learned verses (verses that have been reviewed at least once)
	$: learnedVerses = $verses.filter(v => v.lastReviewed);

	// Sort learned verses based on selected order
	$: sortedLearnedVerses = verseSortOrder === 'collection'
		? sortByCollectionOrder(learnedVerses)
		: verseSortOrder === 'dueDate'
			? sortByDueDate(learnedVerses)
			: sortVersesByBibleOrder(learnedVerses, $settings.bookNameCharset || 'simplified');

	$: reviewBiblicalGroups = buildReviewBiblicalGroups(
		sortVersesByBibleOrder(learnedVerses, $settings.bookNameCharset || 'simplified')
	);
	$: reviewCollectionGroups = buildCollectionGroups(sortedLearnedVerses, selectableCollections);
	$: needsPracticeCollection = buildNeedsPracticeCollection(
		$verses,
		$settings,
		t('needs_practice_collection_title')
	);
	$: selectableCollections = [...$collections, needsPracticeCollection];

	// Create verse reference formatter that checks ALL verses for duplicates (not just learnedVerses)
	$: formatVerseRef = createVerseReferenceFormatter($verses);

	$: intervalModalSchedule = showIntervalModal
		? getSharedReviewSchedule(selectedVerses, intervalModalBaseDate)
		: {
			interval: null,
			dueDate: null,
			hasMixedIntervals: false,
			hasMixedDueDates: false,
			normalizedVerses: []
		};

	$: intervalDraftNumber = Number.parseInt(intervalInputValue, 10);
	$: intervalDraftIsValid = Number.isFinite(intervalDraftNumber) && intervalDraftNumber > 0;
	$: intervalDisplayValue = intervalInputValue.trim().length > 0 ? intervalInputValue : '-';
	$: intervalPreviewDueDate = intervalDraftIsValid
		? new Date(intervalModalBaseDate.getTime() + intervalDraftNumber * DAY_MS).toLocaleDateString()
		: !intervalInputDirty && intervalModalSchedule.dueDate
			? new Date(intervalModalSchedule.dueDate).toLocaleDateString()
			: intervalModalSchedule.hasMixedDueDates
			? t('different_due_dates')
			: '-';

	// Get due verses
	$: dueVerses = $verses.filter(v => {
		if (!v.lastReviewed) return false;
		if (!v.dueDate) return true;
		return new Date(v.dueDate) <= new Date();
	});

	$: if (dev && browser) {
		console.debug('[ReviewSessions] dueVerses recalculated', {
			dueCount: dueVerses.length,
			learnedCount: learnedVerses.length,
			totalVerses: $verses.length,
			isoNow: new Date().toISOString(),
			state
		});
	}

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

	function sortByCollectionOrder(inputVerses) {
		if (selectedCollectionIds.length === 0) return [...inputVerses];

		const verseById = new Map(inputVerses.map(v => [v.id, v]));
		const ordered = [];
		const seen = new Set();

		for (const collectionId of selectedCollectionIds) {
			const collection = findCollectionById($collections, needsPracticeCollection, collectionId);
			if (!collection) continue;
			for (const verseId of collection.verseIds) {
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

	function buildCollectionGroups(inputVerses, inputCollections = []) {
		const verseById = new Map(inputVerses.map((verse) => [verse.id, verse]));
		const groups = [];
		const seen = new Set();

		for (const collection of inputCollections) {
			const versesInCollection = (collection.verseIds || [])
				.map((verseId) => verseById.get(verseId))
				.filter(Boolean);

			if (versesInCollection.length > 0) {
				groups.push({
					id: collection.id,
					title: collection.title,
					verses: versesInCollection
				});
				versesInCollection.forEach((verse) => seen.add(verse.id));
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

	function buildReviewBiblicalGroups(inputVerses) {
		const books = [];

		for (const verse of inputVerses) {
			let bookGroup = books.find((book) => book.bookName === verse.bookName);
			if (!bookGroup) {
				bookGroup = {
					bookName: verse.bookName,
					chapters: [],
					verseCount: 0
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
			bookGroup.verseCount += 1;
		}

		return books.map((book) => {
			if (book.verseCount === 1) {
				return {
					type: 'single',
					key: `single-${book.bookName}`,
					verse: book.chapters[0].verses[0]
				};
			}

			return {
				type: 'book',
				key: `book-${book.bookName}`,
				bookName: book.bookName,
				chapters: book.chapters,
				verseCount: book.verseCount,
				showChapterHeaders: book.chapters.length > 1
			};
		});
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
		if (selectableCollections.length === 0) {
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
		scrollRootToTopLeft();
	}

	function handleReviewedVerse() {
		if (dev && browser) {
			console.debug('[ReviewSessions] handleReviewedVerse dispatch reviewupdated', {
				isoNow: new Date().toISOString(),
				state,
				dueCount: dueVerses.length
			});
		}
		dispatch('reviewupdated');
		registerStreakActivity('review');
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
			const collection = findCollectionById($collections, needsPracticeCollection, collId);
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
			const collection = findCollectionById($collections, needsPracticeCollection, collId);
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
		const originatingState = state;

		if (selectedVerses.length === 1) {
			// Single verse - start individual review immediately
			reviewMode = 'individual';
			sortedVerses = selectedVerses;
			state = 'reviewing';
		} else {
			// Multiple verses - show review mode modal
			reviewModeBackState = originatingState;
			state = 'reviewMode';
		}
	}

	function chooseIndividualReview() {
		showReviewModeInfoModal = false;
		reviewMode = 'individual';
		
		if (selectedVerses.length > 1) {
			if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
			// Show order modal
			state = 'reviewOrder';
		} else {
			sortedVerses = selectedVerses;
			state = 'reviewing';
		}
	}

	function chooseSingleTextReview() {
		showReviewModeInfoModal = false;
		reviewMode = 'singleText';
		// Single-text always uses Biblical order
		sortedVerses = sortVersesByBibleOrder(selectedVerses, $settings.bookNameCharset || 'simplified');
		state = 'reviewing';
	}

	function chooseOrder(order) {
		if (order === 'biblical') {
			sortedVerses = sortVersesByBibleOrder(selectedVerses, $settings.bookNameCharset || 'simplified');
		} else if (order === 'collection') {
			sortedVerses = sortByCollectionOrder(selectedVerses);
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
		scrollRootToTopLeft();
	}

	function handleReviewExit() {
		// Same as handleReviewComplete - return to initial three-button state
		state = 'initial';
		selectedVerses = [];
		selectedCollectionIds = [];
		reviewMode = null;
		sortedVerses = [];
		scrollRootToTopLeft();
	}

	function cancelReview() {
		showReviewModeInfoModal = false;
		state = 'initial';
		selectedVerses = [];
		selectedCollectionIds = [];
		reviewMode = null;
		scrollRootToTopLeft();
	}

	function backFromReviewMode() {
		showReviewModeInfoModal = false;
		state = reviewModeBackState || 'initial';
		reviewMode = null;
		sortedVerses = [];
	}

	function backFromReviewOrder() {
		state = 'reviewMode';
	}

	// Interval change functions
	function openIntervalModal() {
		if (selectedVerses.length === 0) {
			modalMessage = t('select_verse_to_change_interval');
			showModal = true;
			return;
		}
		intervalModalBaseDate = new Date();
		const schedule = getSharedReviewSchedule(selectedVerses, intervalModalBaseDate);
		intervalModalSchedule = schedule;
		intervalInputValue = schedule.interval === null ? '' : String(schedule.interval);
		intervalInputAppendMode = false;
		intervalInputDirty = false;
		showIntervalModal = true;
	}

	function closeIntervalModal() {
		showIntervalModal = false;
		intervalInputValue = '';
		intervalInputAppendMode = false;
		intervalInputDirty = false;
	}

	function handleIntervalDigit(digit) {
		if (!/^\d$/.test(digit)) return;

		if (!intervalInputAppendMode) {
			intervalInputValue = digit;
			intervalInputAppendMode = true;
			intervalInputDirty = true;
			return;
		}

		intervalInputValue = `${intervalInputValue}${digit}`;
		intervalInputDirty = true;
	}

	function handleIntervalDelete() {
		if (intervalInputValue.length === 0) return;

		intervalInputValue = intervalInputValue.slice(0, -1);
		intervalInputAppendMode = intervalInputValue.length > 0;
		intervalInputDirty = true;
	}

	function handleIntervalKeyInput(event) {
		const key = event.detail;
		if (key === 'Backspace' || key === 'Delete') {
			handleIntervalDelete();
			return;
		}

		if (key === 'Enter') {
			if (intervalDraftIsValid) {
				confirmIntervalChange();
			}
			return;
		}

		handleIntervalDigit(key);
	}

	function handleIntervalPhysicalKeyboard(event) {
		if (!showIntervalModal) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			closeIntervalModal();
			return;
		}

		if (event.key === 'Backspace' || event.key === 'Delete') {
			event.preventDefault();
			handleIntervalDelete();
			return;
		}

		if (event.key === 'Enter') {
			if (intervalDraftIsValid) {
				event.preventDefault();
				confirmIntervalChange();
			}
			return;
		}

		if (/^\d$/.test(event.key)) {
			event.preventDefault();
			handleIntervalDigit(event.key);
		}
	}

	function confirmIntervalChange() {
		if (selectedVerses.length === 0) {
			closeIntervalModal();
			return;
		}

		const intervalDays = intervalDraftIsValid ? intervalDraftNumber : intervalModalSchedule.interval;
		if (!Number.isFinite(intervalDays) || intervalDays < 1) {
			return;
		}

		const manualUpdate = buildManualIntervalUpdate(intervalDays, intervalModalBaseDate);
		const selectedVerseIds = new Set(selectedVerses.map((verse) => verse.id));

		verses.update((list) => list.map((verse) => {
			if (!selectedVerseIds.has(verse.id)) {
				return verse;
			}

			return {
				...verse,
				isLearned: verse.isLearned || Boolean(verse.lastReviewed),
				interval: manualUpdate.interval,
				repetitions: manualUpdate.repetitions,
				dueDate: manualUpdate.dueDate
			};
		}));

		// Close modal and return to edit interval panel
		closeIntervalModal();
	}

</script>

<svelte:document on:keydown={handleIntervalPhysicalKeyboard} />

<div class="review-container">
	{#if state === 'initial'}
		<h2>{t('review_mode')}</h2>

		{#if learnedVerses.length === 0}
			<div class="empty-state">
				<p>{t('no_learned_verses')}</p>
			</div>
		{:else}
			<div class="initial-buttons">
				{#if dueVerses.length > 0}
					<button class="initial-btn due-btn" on:click={showDueVersesFlow}>
						{t('review_due_verses')}
						<span class="btn-count">({dueVerses.length})</span>
					</button>
				{/if}
				
				{#if selectableCollections.length > 0}
					<button class="initial-btn" on:click={showCollectionSelection}>
						{t('review_collection_learned')}
					</button>
				{/if}
				
				<button class="initial-btn" on:click={showVerseSelection}>
					{t('or_select_individual')}
				</button>
				
				<button class="initial-btn" on:click={showEditInterval}>
					{t('edit_review_interval')}
				</button>
			</div>
		{/if}

	{:else if state === 'selectCollection'}
		<div class="panel-header">
			<button class="back-btn" on:click={backToInitial} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				{@html icons.back}
			</svg>
		</button>
			<h3>{t('review_collection_learned')}</h3>
			<div class="spacer"></div>
		</div>

		<div class="collections-list">
			{#if selectableCollections.length === 0}
				<p class="empty-message">{t('no_collections')}</p>
			{:else}
				{#each selectableCollections as collection (collection.id)}
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
				<button class="proceed-btn" on:click={proceedFromCollectionSelection}>
					{t('review')} {selectedCollectionIds.length} {selectedCollectionIds.length === 1 ? t('collection') : t('collections')}
				</button>
			</div>
		{/if}

	{:else if state === 'selectVerses'}
		<div class="panel-header">
			<button class="back-btn" on:click={backToInitial} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				{@html icons.back}
			</svg>
		</button>
			<h3>{t('or_select_individual')}</h3>
			<div class="spacer"></div>
		</div>

		<div class="sort-controls">
			<label class="sort-label" for="select-verses-sort">{t('sort')}:</label>
			<select id="select-verses-sort" class="sort-select" bind:value={verseSortOrder}>
				<option value="biblical">{t('order_biblical')}</option>
				<option value="dueDate">{t('order_due_date')}</option>
				<option value="collection">{t('order_collection')}</option>
			</select>
		</div>

		{#if verseSortOrder === 'collection'}
			<div class="verse-list grouped-verse-list">
				{#each reviewCollectionGroups as group (group.id)}
					<details class="review-group-details">
						<summary class="review-group-summary">
							<span class="review-toggle-icon" aria-hidden="true">▶</span>
							<span class="review-group-label">{group.title}</span>
							<span class="review-group-count">({group.verses.length})</span>
						</summary>
						<div class="review-group-items">
							{#each group.verses as verse (verse.id)}
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
					</details>
				{/each}
			</div>
		{:else if verseSortOrder === 'biblical'}
			<div class="verse-list grouped-verse-list">
				{#each reviewBiblicalGroups as group (group.key)}
					{#if group.type === 'single'}
						{@const verse = group.verse}
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
					{:else}
						<details class="review-group-details">
							<summary class="review-group-summary">
								<span class="review-toggle-icon" aria-hidden="true">▶</span>
								<span class="review-group-label">{group.bookName}</span>
								<span class="review-group-count">({group.verseCount})</span>
							</summary>
							<div class="review-group-items">
								{#if group.showChapterHeaders}
									{#each group.chapters as chapter (chapter.chapterNumber)}
										<details class="review-chapter-details">
											<summary class="review-chapter-summary">
												<span class="review-toggle-icon" aria-hidden="true">▶</span>
												<span>{t('chapter')} {chapter.chapterNumber}</span>
												<span class="review-group-count">({chapter.verses.length})</span>
											</summary>
											<div class="review-group-items">
												{#each chapter.verses as verse (verse.id)}
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
										</details>
									{/each}
								{:else}
									{#each group.chapters[0].verses as verse (verse.id)}
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
								{/if}
							</div>
						</details>
					{/if}
				{/each}
			</div>
		{:else}
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
		{/if}

		{#if selectedVerses.length > 0}
			<div class="fixed-bottom-btn">
				<button class="proceed-btn" on:click={proceedFromVerseSelection}>
					{t('review')} {selectedVerses.length} {selectedVerses.length === 1 ? t('verse') : t('verses')}
				</button>
			</div>
		{/if}

	{:else if state === 'editInterval'}
		<div class="panel-header">
			<button class="back-btn" on:click={backToInitial} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				{@html icons.back}
			</svg>
		</button>
			<h3>{t('edit_review_interval')}</h3>
			<div class="spacer"></div>
		</div>

		<div class="sort-controls">
			<label class="sort-label" for="edit-interval-sort">{t('sort')}:</label>
			<select id="edit-interval-sort" class="sort-select" bind:value={verseSortOrder}>
				<option value="biblical">{t('order_biblical')}</option>
				<option value="dueDate">{t('order_due_date')}</option>
				<option value="collection">{t('order_collection')}</option>
			</select>
		</div>

		{#if verseSortOrder === 'collection'}
			<div class="verse-list grouped-verse-list">
				{#each reviewCollectionGroups as group (group.id)}
					<details class="review-group-details">
						<summary class="review-group-summary">
							<span class="review-toggle-icon" aria-hidden="true">▶</span>
							<span class="review-group-label">{group.title}</span>
							<span class="review-group-count">({group.verses.length})</span>
						</summary>
						<div class="review-group-items">
							{#each group.verses as verse (verse.id)}
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
					</details>
				{/each}
			</div>
		{:else}
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
		{/if}

		{#if selectedVerses.length > 0}
			<div class="fixed-bottom-btn">
				<button class="proceed-btn" on:click={openIntervalModal}>
					{t('change_interval')}
				</button>
			</div>
		{/if}

	{:else if state === 'reviewMode'}
		<!-- Review Mode Modal -->
		<div class="modal-overlay" on:click={(e) => e.target === e.currentTarget && cancelReview()} on:keydown={(e) => e.key === 'Escape' && cancelReview()} role="dialog" aria-modal="true" tabindex="0">
			<div class="modal-content" role="document">
				<div class="modal-header">
					<button class="back-btn" on:click={backFromReviewMode} aria-label={t('back')}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					<h3>{t('choose_review_mode')}</h3>
					<button class="back-btn modal-close-btn" on:click={cancelReview} aria-label={t('exit')}>✕</button>
				</div>
				<div class="modal-buttons">
					<button class="initial-btn" on:click={chooseIndividualReview}>
						{t('review_individually')}
					</button>
					<button class="initial-btn" on:click={chooseSingleTextReview}>
						{t('review_single_text')}
					</button>
				</div>
				<div class="modal-info-footer">
					<button
						type="button"
						class="modal-info-icon-btn"
						on:click={() => showReviewModeInfoModal = true}
						aria-label={t('review_mode_info_aria')}
					>
						<svg class="activity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							{@html infoIconPath}
						</svg>
					</button>
				</div>
			</div>
		</div>

		{#if showReviewModeInfoModal}
			<div class="modal-overlay" on:click={(e) => e.target === e.currentTarget && (showReviewModeInfoModal = false)} on:keydown={(e) => e.key === 'Escape' && (showReviewModeInfoModal = false)} role="dialog" aria-modal="true" tabindex="0">
				<div class="modal-content info-content" role="document">
					<button class="back-btn modal-close-btn info-modal-close-btn" type="button" on:click={() => showReviewModeInfoModal = false} aria-label={t('close')}>✕</button>
					<h3>{t('review_mode_info_title')}</h3>
					<div class="info-description-list">
						<div class="info-description-item">
							<div class="info-description-title">{t('review_individually')}</div>
							<p>{t('review_individually_desc')}</p>
						</div>
						<div class="info-description-item">
							<div class="info-description-title">{t('review_single_text')}</div>
							<p>{t('review_single_text_desc')}</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

	{:else if state === 'reviewOrder'}
		<!-- Review Order Modal -->
		<div class="modal-overlay" on:click={(e) => e.target === e.currentTarget && cancelReview()} on:keydown={(e) => e.key === 'Escape' && cancelReview()} role="dialog" aria-modal="true" tabindex="0">
			<div class="modal-content" role="document">
				<div class="modal-header">
					<button class="back-btn" on:click={backFromReviewOrder} aria-label={t('back')}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					<h3>{t('choose_review_order')}</h3>
					<button class="back-btn modal-close-btn" on:click={cancelReview} aria-label={t('exit')}>✕</button>
				</div>
				<div class="modal-buttons">
					{#if selectedCollectionIds.length > 0}
						<button class="modal-option" on:click={() => chooseOrder('collection')}>
							<div class="option-title">{t('order_collection')}</div>
						</button>
					{/if}
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
			</div>
		</div>

	{:else if state === 'reviewing'}
		{#if reviewMode === 'individual'}
			<IndividualReview verses={sortedVerses} on:complete={handleReviewComplete} on:exit={handleReviewExit} on:reviewed={handleReviewedVerse} />
		{:else if reviewMode === 'singleText'}
			<SingleTextReview verses={sortedVerses} on:complete={handleReviewComplete} on:exit={handleReviewExit} on:reviewed={handleReviewedVerse} />
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
	<div class="modal-overlay interval-modal-overlay" on:click={(e) => e.target === e.currentTarget && closeIntervalModal()} on:keydown={(e) => e.key === 'Escape' && closeIntervalModal()} role="dialog" aria-modal="true" tabindex="0">
		<div class="modal-content interval-modal" role="document">
			<h3>{t('change_interval_title')}</h3>

			<div class="interval-card">
				<div class="interval-row">
					<div class="interval-row-label">{t('interval_label')}</div>
					<div class="interval-row-value">
						<span class="interval-number">{intervalDisplayValue}</span>
						<span class="interval-unit">{t('days_unit')}</span>
					</div>
				</div>
				<div class="interval-row">
					<div class="interval-row-label">{t('next_due_date')}</div>
					<div class="interval-row-value interval-preview">{intervalPreviewDueDate}</div>
				</div>
			</div>

			<Keyboard
				layout={keyboardLayouts.numeric}
				showBackspace={false}
				showEnter={false}
				isNumeric={true}
				on:key={handleIntervalKeyInput}
			/>

			<div class="modal-buttons-horizontal">
				<button class="modal-btn btn-outline" on:click={closeIntervalModal}>{t('cancel')}</button>
				<button class="modal-btn" on:click={confirmIntervalChange} disabled={!intervalDraftIsValid}>{t('confirm')}</button>
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
		text-align: center;
	}

	h3 {
		color: var(--text-color);
		font-size: 1.1em;
		text-align: center;
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
		background: var(--danger-color);
		color: white;
		border-color: var(--danger-color);
	}

	.initial-btn.due-btn:hover {
		background: var(--danger-color);
		border-color: var(--danger-color);
	}

	.btn-count {
		margin-left: 0.5rem;
		font-weight: normal;
		opacity: 0.9;
	}

	/* Header with back button */
	.panel-header {
		display: grid;
		grid-template-columns: 40px 1fr 40px;
		align-items: center;
		gap: 0.5rem;
	}

	.panel-header h3 {
		margin: 0;
		text-align: center;
	}

	.spacer {
		width: 40px;
		height: 40px;
	}

	/* Sort controls */
	.sort-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.sort-label {
		color: var(--subtitle-color);
		font-size: 0.95em;
		font-weight: 600;
		white-space: nowrap;
	}

	.sort-select {
		flex: 1;
		font-size: 0.95em;
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

	/* Sizing only — accent pill look comes from the global button rule */
	.proceed-btn {
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

	.verse-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
		padding: 0.5rem;
		border: 1px solid var(--file-border);
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.grouped-verse-list {
		gap: 0.5rem;
	}

	.review-group-details,
	.review-chapter-details {
		border: 1px solid var(--file-border);
		border-radius: 6px;
		background: var(--file-bg);
		overflow: hidden;
	}

	.review-group-summary,
	.review-chapter-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.75rem;
		cursor: pointer;
		list-style: none;
		font-weight: 600;
		color: var(--text-color);
	}

	.review-group-summary::-webkit-details-marker,
	.review-chapter-summary::-webkit-details-marker {
		display: none;
	}

	.review-toggle-icon {
		width: 1em;
		color: var(--subtitle-color);
		text-align: center;
		transition: transform 0.2s ease;
	}

	details[open] > .review-group-summary .review-toggle-icon,
	details[open] > .review-chapter-summary .review-toggle-icon {
		transform: rotate(90deg);
	}

	.review-group-label {
		min-width: 0;
	}

	.review-group-count {
		margin-left: auto;
		color: var(--subtitle-color);
		font-size: 0.9em;
		font-weight: 500;
	}

	.review-group-items {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.4rem;
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

	/* .overdue/.due-soon/.due-future come from app.css */

	/* Modal Styles */
	/* Overlay/content shells come from the shared modal classes in app.css */
	.modal-content h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.modal-header {
		display: grid;
		grid-template-columns: 40px 1fr 40px;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.modal-header h3 {
		margin: 0;
	}

	.modal-close-btn {
		font-size: 1.5em;
	}

	/* Review-mode options stack vertically inside the shared modal shell */
	.modal-buttons {
		flex-direction: column;
		margin-bottom: 0.75rem;
	}

	.modal-info-footer {
		display: flex;
		justify-content: flex-start;
	}

	.modal-info-icon-btn {
		width: 34px;
		height: 34px;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: transparent;
		color: var(--subtitle-color);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.modal-info-icon-btn:hover,
	.modal-info-icon-btn:focus-visible {
		background: var(--nav-button-bg);
		color: var(--accent-color);
		outline: none;
	}

	.modal-info-icon-btn .activity-icon {
		width: 1.2em;
		height: 1.2em;
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

	@media (hover: hover) {
		.modal-option:hover {
			border-color: var(--accent-color);
			background: var(--nav-button-bg);
		}
	}

	.option-title {
		font-weight: 600;
		font-size: 1.1em;
		color: var(--accent-color);
	}

	/* Interval Modal Styles */
	.interval-modal {
		max-width: 420px;
	}

	.info-content {
		position: relative;
		max-width: 680px;
	}

	.info-modal-close-btn {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
	}

	.info-description-list {
		display: grid;
		gap: 0.9rem;
	}

	.info-description-item {
		padding: 0.85rem;
		border: 1px solid var(--file-border);
		border-radius: 8px;
		background: var(--file-bg);
	}

	.info-description-title {
		font-weight: 600;
		margin-bottom: 0.35rem;
		color: var(--accent-color);
	}

	.info-description-item p {
		margin: 0;
		line-height: 1.5;
	}

	.interval-card {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid var(--file-border);
		border-radius: 12px;
		background: var(--file-bg);
		margin-bottom: 1rem;
	}

	.interval-row {
		display: grid;
		gap: 0.35rem;
	}

	.interval-row-label {
		font-size: 0.9em;
		font-weight: 600;
		color: var(--subtitle-color);
	}

	.interval-row-value {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		flex-wrap: wrap;
		font-size: 1.8em;
		font-weight: 700;
		color: var(--text-color);
	}

	.interval-number {
		min-width: 1ch;
	}

	.interval-unit {
		font-size: 0.6em;
		font-weight: 500;
		color: var(--subtitle-color);
	}

	.interval-preview {
		font-size: 1.1em;
		font-weight: 600;
		color: var(--accent-color);
	}

	.interval-modal-overlay {
		top: calc(4.5rem + env(safe-area-inset-top, 0px));
		align-items: flex-start;
		padding-top: 1rem;
	}

	:global(.interval-modal .keyboard) {
		margin: 0;
	}

	.modal-buttons-horizontal {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	/* Sizing only — colors/shape/disabled come from the shared button classes */
	.modal-btn {
		flex: 1;
	}

	@media (max-width: 767px) {
		.review-container {
			padding-left: 0.5rem;
			padding-right: 0.5rem;
			padding-top: 1rem;
			gap: 1rem;
		}

		.initial-btn {
			padding: 1.25rem;
			font-size: 1em;
		}

		.fixed-bottom-btn {
			padding: 0.75rem;
		}
	}
</style>
