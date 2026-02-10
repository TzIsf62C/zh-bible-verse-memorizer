<script>
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';

	let reviewState = 'selectMode'; // selectMode, selectVerses, reviewing, results
	let reviewMode = 'individual'; // individual or singleText
	let reviewOrder = 'biblical'; // biblical, dueDate, random
	let selectedVerses = [];
	let selectedCollection = null;
	let currentVerseIdx = 0;
	let userInput = '';
	let accuracy = 0;
	let reviewedCount = 0;
	let failedCount = 0;
	let feedbackMessage = '';
	let feedbackType = '';
	let keyboardLayout = keyboardLayouts.pinyin;
	let versesForReview = [];
	let dueSentence = '';

	// Reactive updates
	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	// Get learned verses
	$: learnedVerses = $verses.filter((v) => v.repetitions > 0);

	// Get collections
	$: collectionsList = $collections;

	function startReview() {
		reviewState = 'selectVerses';
		selectedVerses = [];
		selectedCollection = null;
	}

	function selectAllDue() {
		const today = new Date();
		selectedVerses = learnedVerses
			.filter((v) => new Date(v.dueDate) <= today)
			.map((v) => v.id);
	}

	function toggleVerseSelection(id) {
		if (selectedVerses.includes(id)) {
			selectedVerses = selectedVerses.filter((v) => v !== id);
		} else {
			selectedVerses = [...selectedVerses, id];
		}
	}

	function startSession() {
		if (selectedVerses.length === 0) {
			alert(t('select_verse_to_review'));
			return;
		}

		// Filter selected verses
		versesForReview = $verses.filter((v) => selectedVerses.includes(v.id));

		// Sort based on order preference
		if (reviewOrder === 'random') {
			versesForReview = versesForReview.sort(() => Math.random() - 0.5);
		} else if (reviewOrder === 'dueDate') {
			versesForReview = versesForReview.sort(
				(a, b) => new Date(a.dueDate) - new Date(b.dueDate)
			);
		}
		// biblical is default - already ordered

		currentVerseIdx = 0;
		reviewedCount = 0;
		failedCount = 0;
		userInput = '';
		accuracy = 0;
		feedbackMessage = '';
		reviewState = 'reviewing';
	}

	function getCurrentVerse() {
		if (!versesForReview || currentVerseIdx >= versesForReview.length) {
			return null;
		}
		return versesForReview[currentVerseIdx];
	}

	function getDueInDays(dueDate) {
		const today = new Date();
		const due = new Date(dueDate);
		const diffTime = due - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	function getExpectedInitials() {
		const verse = getCurrentVerse();
		if (!verse) return '';
		return verse.verseInitials;
	}

	function handleKeyInput(event) {
		const key = event.detail;

		if (key === '⌫') {
			userInput = userInput.slice(0, -1);
			return;
		}

		if (key === '↵') {
			submitAnswer();
			return;
		}

		userInput += key;

		// Auto-check when we reach expected length
		const expected = getExpectedInitials();
		if (userInput.length === expected.length) {
			submitAnswer();
		}
	}

	function submitAnswer() {
		const verse = getCurrentVerse();
		const expected = getExpectedInitials();

		if (!verse) return;

		// Calculate accuracy
		let correctChars = 0;
		for (let i = 0; i < Math.max(userInput.length, expected.length); i++) {
			if (userInput[i] === expected[i]) {
				correctChars++;
			}
		}

		accuracy = Math.round((correctChars / expected.length) * 100);

		if (accuracy >= 90) {
			feedbackMessage = t('nice_try');
			feedbackType = 'success';
			reviewedCount++;
			// Apply spaced repetition
			const today = new Date();
			const updatedVerse = spacedRepetitionBinary(verse, true, today);
			verses.update((list) =>
				list.map((v) => (v.id === verse.id ? updatedVerse : v))
			);
		} else {
			feedbackMessage = t('nice_try');
			feedbackType = 'error';
			failedCount++;
			// Failed - reduce interval
			const today = new Date();
			const updatedVerse = spacedRepetitionBinary(verse, false, today);
			verses.update((list) =>
				list.map((v) => (v.id === verse.id ? updatedVerse : v))
			);
		}

		userInput = '';
	}

	function nextVerse() {
		if (currentVerseIdx < versesForReview.length - 1) {
			currentVerseIdx++;
			userInput = '';
			feedbackMessage = '';
			accuracy = 0;
		} else {
			// Review session complete
			reviewState = 'results';
		}
	}

	function retryVerse() {
		userInput = '';
		feedbackMessage = '';
		accuracy = 0;
	}

	function finishReview() {
		reviewState = 'selectMode';
		selectedVerses = [];
	}
</script>

<span class="visually-hidden" aria-hidden="true">{$settings.languagePreference}</span>

<div class="review-container">
	{#if reviewState === 'selectMode'}
		<!-- Select Review Mode -->
		<div class="selection-screen">
			<h3>{t('review_mode')}</h3>

			{#if learnedVerses.length === 0}
				<div class="empty-state">
					<p>{t('no_learned_verses')}</p>
				</div>
			{:else}
				<div class="mode-buttons">
					<button class="mode-btn" on:click={startReview}>
						<div class="mode-title">{t('review_individually')}</div>
						<div class="mode-desc">Review verses one at a time</div>
					</button>
				</div>
			{/if}
		</div>
	{:else if reviewState === 'selectVerses'}
		<!-- Select Verses to Review -->
		<div class="selection-screen">
			<h3>{t('choose_review_order')}</h3>

			<div class="order-selector">
				<label>
					<input
						type="radio"
						bind:group={reviewOrder}
						value="biblical"
					/>
					{t('order_biblical')}
				</label>
				<label>
					<input
						type="radio"
						bind:group={reviewOrder}
						value="dueDate"
					/>
					{t('order_due_date')}
				</label>
				<label>
					<input
						type="radio"
						bind:group={reviewOrder}
						value="random"
					/>
					{t('order_random')}
				</label>
			</div>

			<div class="verse-selection">
				<div class="selection-controls">
					<button class="secondary-small" on:click={selectAllDue}>
						{t('review_due_verses')}
					</button>
					<span class="count">{selectedVerses.length} selected</span>
				</div>

				<div class="verses-list">
					{#each learnedVerses as verse}
						<label class="verse-checkbox">
							<input
								type="checkbox"
								checked={selectedVerses.includes(verse.id)}
								on:change={() => toggleVerseSelection(verse.id)}
							/>
							<div class="verse-info">
								<span class="ref">
									{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
								</span>
								<span class="due">
									Due: {getDueInDays(verse.dueDate) > 0
										? `in ${getDueInDays(verse.dueDate)} days`
										: 'today'}
								</span>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<div class="button-group">
				<button class="primary" on:click={startSession}>
					{t('review_verses')}
				</button>
				<button class="secondary" on:click={() => (reviewState = 'selectMode')}>
					{t('cancel')}
				</button>
			</div>
		</div>
	{:else if reviewState === 'reviewing'}
		<!-- Review Session -->
		<div class="review-screen">
			{#if getCurrentVerse()}
				{@const verse = getCurrentVerse()}
				<div class="verse-display">
					<div class="progress">
						{currentVerseIdx + 1} / {versesForReview.length}
					</div>
					<h3>{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}</h3>
					<div class="verse-text">{verse.verseText}</div>
					<div class="verse-meta">
						<span>{verse.bibleVersion}</span>
						<span>
							{verse.interval ? `Interval: ${verse.interval} days` : 'Not yet reviewed'}
						</span>
					</div>
				</div>

				<div class="input-section">
					<div class="input-display">
						{#if userInput}
							{userInput}
						{:else}
							<span class="placeholder">Type initials...</span>
						{/if}
					</div>

					{#if feedbackMessage}
						<div class="feedback" class:success={feedbackType === 'success'} class:error={feedbackType === 'error'}>
							{feedbackMessage}
							{#if accuracy > 0}
								<div class="accuracy-badge">
									{accuracy}% accurate
								</div>
							{/if}
						</div>
					{/if}

					{#if !feedbackMessage}
						<Keyboard {keyboardLayout} on:key={handleKeyInput} />
					{:else}
						<div class="button-group">
							<button class="primary" on:click={nextVerse}>
								{currentVerseIdx === versesForReview.length - 1
									? t('finish')
									: t('next')}
							</button>
							<button class="secondary" on:click={retryVerse}>
								{t('retry')}
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else if reviewState === 'results'}
		<!-- Review Results -->
		<div class="results-screen">
			<h3>{t('result')}</h3>

			<div class="results-stats">
				<div class="stat">
					<div class="stat-value">{reviewedCount}</div>
					<div class="stat-label">{t('correct')}</div>
				</div>
				<div class="stat">
					<div class="stat-value">{failedCount}</div>
					<div class="stat-label">{t('incorrect')}</div>
				</div>
				<div class="stat">
					<div class="stat-value">
						{Math.round((reviewedCount / versesForReview.length) * 100)}%
					</div>
					<div class="stat-label">{t('accuracy')}</div>
				</div>
			</div>

			<div class="results-message">
				{#if failedCount === 0}
					<p>{t('congratulations_reviewed_count', { count: reviewedCount })}</p>
				{:else}
					<p>{t('congratulations_reviewed')} {reviewedCount} verses.</p>
				{/if}
			</div>

			<button class="primary" on:click={finishReview}>
				{t('finish')}
			</button>
		</div>
	{/if}
</div>

<style>
	.review-container {
		padding: 1rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.selection-screen,
	.review-screen,
	.results-screen {
		background: var(--panel-background);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: var(--panel-shadow);
	}

	h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: var(--text-color);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--subtitle-color);
	}

	.mode-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.mode-btn {
		background: var(--file-bg);
		border: 2px solid var(--file-border);
		border-radius: 6px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.3s;
		text-align: left;
		color: inherit;
		font-family: inherit;
	}

	.mode-btn:hover {
		border-color: var(--accent-color);
		background: var(--nav-button-bg);
	}

	.mode-title {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--accent-color);
	}

	.mode-desc {
		font-size: 0.9rem;
		color: var(--subtitle-color);
	}

	.order-selector {
		display: grid;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--file-bg);
		border-radius: 6px;
	}

	.order-selector label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.order-selector input[type='radio'] {
		cursor: pointer;
	}

	.verse-selection {
		margin: 1.5rem 0;
	}

	.selection-controls {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		align-items: center;
	}

	.count {
		color: var(--subtitle-color);
		font-size: 0.9rem;
		margin-left: auto;
	}

	.verses-list {
		display: grid;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
		border: 1px solid var(--file-border);
		border-radius: 4px;
		padding: 0.5rem;
	}

	.verse-checkbox {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--file-bg);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.verse-checkbox:hover {
		background: var(--nav-button-bg);
	}

	.verse-checkbox input[type='checkbox'] {
		cursor: pointer;
	}

	.verse-info {
		display: grid;
		gap: 0.25rem;
	}

	.verse-info .ref {
		font-weight: 600;
		color: var(--text-color);
	}

	.verse-info .due {
		font-size: 0.85rem;
		color: var(--subtitle-color);
	}

	.review-screen {
		display: grid;
		gap: 2rem;
	}

	.verse-display {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--file-border);
	}

	.progress {
		text-align: right;
		color: var(--subtitle-color);
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.verse-display h3 {
		margin-bottom: 1rem;
	}

	.verse-text {
		font-size: 1.2rem;
		line-height: 1.6;
		margin-bottom: 1rem;
		padding: 1rem;
		background: var(--file-bg);
		border-radius: 4px;
	}

	.verse-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.9rem;
		color: var(--subtitle-color);
	}

	.input-section {
		display: grid;
		gap: 1rem;
	}

	.input-display {
		background: var(--file-bg);
		border: 2px solid var(--accent-color);
		border-radius: 6px;
		padding: 1rem;
		font-size: 1.25rem;
		min-height: 50px;
		display: flex;
		align-items: center;
		font-weight: 500;
		color: var(--text-color);
	}

	.input-display .placeholder {
		color: var(--subtitle-color);
		font-weight: normal;
	}

	.feedback {
		padding: 1rem;
		border-radius: 6px;
		text-align: center;
		font-weight: 500;
		transition: all 0.3s;
	}

	.feedback.success {
		background: #e8f5e9;
		color: #2e7d32;
		border: 1px solid #4caf50;
	}

	.feedback.error {
		background: #ffebee;
		color: #c62828;
		border: 1px solid #f44336;
	}

	.accuracy-badge {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.25rem 0.75rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		font-size: 0.85rem;
	}

	.results-screen {
		text-align: center;
	}

	.results-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		margin: 2rem 0;
	}

	.stat {
		padding: 1.5rem;
		background: var(--file-bg);
		border-radius: 6px;
		border: 2px solid var(--file-border);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent-color);
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--subtitle-color);
	}

	.results-message {
		margin: 2rem 0;
		padding: 1rem;
		background: var(--file-bg);
		border-radius: 6px;
	}

	.results-message p {
		margin: 0;
		color: var(--text-color);
	}

	.button-group {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s;
	}

	button.primary {
		background: var(--accent-color);
		color: white;
	}

	button.primary:hover {
		opacity: 0.9;
	}

	button.secondary {
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
	}

	button.secondary-small {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
	}
</style>
