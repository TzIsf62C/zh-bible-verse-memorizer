<script>
	import { createEventDispatcher } from 'svelte';
	import { verses as versesStore } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';

	export let verses = [];

	const dispatch = createEventDispatcher();

	let currentIndex = 0;
	let userInput = '';
	let showResult = false;
	let accuracy = 0;
	let successCount = 0;

	$: currentVerse = verses[currentIndex];
	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;
	$: expectedInput = currentVerse?.verseInitials || '';

	function handleKeyInput(event) {
		const key = event.detail;

		if (key === '⌫') {
			userInput = userInput.slice(0, -1);
			return;
		}

		if (key === '↵') {
			checkAnswer();
			return;
		}

		userInput += key;

		// Auto-submit when reaching expected length
		if (userInput.length === expectedInput.length) {
			setTimeout(checkAnswer, 100);
		}
	}

	function checkAnswer() {
		if (showResult) return;

		// Calculate accuracy
		let correct = 0;
		const maxLen = Math.max(userInput.length, expectedInput.length);
		
		for (let i = 0; i < expectedInput.length; i++) {
			if (userInput[i] && userInput[i].toLowerCase() === expectedInput[i].toLowerCase()) {
				correct++;
			}
		}

		accuracy = expectedInput.length > 0 ? Math.round((correct / expectedInput.length) * 100) : 0;

		// Update verse with spaced repetition
		const now = new Date();
		const success = accuracy >= 90;
		
		versesStore.update(list => list.map(v => {
			if (v.id === currentVerse.id) {
				const card = {
					interval: v.interval || 0,
					repetitions: v.repetitions || 0,
					dueDate: v.dueDate
				};
				const updated = spacedRepetitionBinary(card, success, now);
				return {
					...v,
					interval: updated.interval,
					repetitions: updated.repetitions,
					dueDate: updated.dueDate.toISOString(),
					lastReviewed: success ? now.toISOString() : v.lastReviewed
				};
			}
			return v;
		}));

		if (success) {
			successCount++;
		}

		showResult = true;
	}

	function nextVerse() {
		if (currentIndex < verses.length - 1) {
			currentIndex++;
			userInput = '';
			showResult = false;
			accuracy = 0;
		} else {
			// Session complete
			showCompletionModal();
		}
	}

	function retry() {
		userInput = '';
		showResult = false;
		accuracy = 0;
	}

	function showCompletionModal() {
		const msg = t('congratulations_reviewed_count', { count: successCount });
		alert(msg);
		dispatch('complete');
	}

	function renderVerseText() {
		if (!currentVerse) return '';
		
		const text = currentVerse.verseText;
		const initials = currentVerse.verseInitials;
		let html = '';
		let initialIndex = 0;

		for (const char of text) {
			const isHanChar = /\p{Script=Han}/u.test(char) || /[0-9]/.test(char);
			
			if (isHanChar && initialIndex < initials.length) {
				const expected = initials[initialIndex];
				const typed = userInput[initialIndex];
				let className = 'verse-character';

				if (initialIndex < userInput.length) {
					if (typed && typed.toLowerCase() === expected.toLowerCase()) {
						className += ' correct';
					} else {
						className += ' incorrect';
					}
				} else {
					className += ' hidden';
				}

				html += `<span class="${className}">${char}</span>`;
				initialIndex++;
			} else {
				// Punctuation - reveal when previous character is typed
				const className = initialIndex <= userInput.length ? 'verse-character correct' : 'verse-character hidden';
				html += `<span class="${className}">${char}</span>`;
			}
		}

		return html;
	}
</script>

<div class="individual-review">
	<div class="progress-bar">
		<div class="progress-text">
			{currentIndex + 1} / {verses.length}
		</div>
		<div class="progress-fill" style="width: {((currentIndex + 1) / verses.length) * 100}%"></div>
	</div>

	{#if currentVerse}
		<div class="verse-header">
			<h3>{currentVerse.bookName} {currentVerse.chapterNumber}:{currentVerse.verseNumber}</h3>
			{#if currentVerse.bibleVersion}
				<span class="version-badge">{currentVerse.bibleVersion}</span>
			{/if}
		</div>

		<div class="verse-display">
			{@html renderVerseText()}
		</div>

		<div class="input-section">
			<div class="input-display">
				{#if userInput}
					{userInput}
				{:else}
					<span class="placeholder">{t('type_initials')}</span>
				{/if}
			</div>

			{#if showResult}
				<div class="result-display" class:success={accuracy >= 90} class:error={accuracy < 90}>
					<div class="accuracy-text">
						{t('accuracy')}: {accuracy}%
					</div>
					{#if accuracy >= 90}
						<div class="message">{t('great_job_continue')}</div>
					{:else}
						<div class="message">{t('nice_try')}</div>
					{/if}
				</div>

				<div class="button-group">
					<button class="primary-btn" on:click={nextVerse}>
						{currentIndex === verses.length - 1 ? t('finish') : t('next')}
					</button>
					<button class="secondary-btn" on:click={retry}>
						{t('retry')}
					</button>
				</div>
			{:else}
				<Keyboard layout={keyboardLayout} on:key={handleKeyInput} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.individual-review {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	.progress-bar {
		position: relative;
		width: 100%;
		height: 32px;
		background: var(--file-bg);
		border-radius: 16px;
		margin-bottom: 2rem;
		overflow: hidden;
		border: 1px solid var(--file-border);
	}

	.progress-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--accent-color);
		transition: width 0.3s ease;
	}

	.progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-weight: 600;
		color: var(--text-color);
		z-index: 1;
	}

	.verse-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--file-border);
	}

	.verse-header h3 {
		margin: 0;
		color: var(--text-color);
	}

	.version-badge {
		padding: 0.25rem 0.75rem;
		background: var(--file-bg);
		border: 1px solid var(--file-border);
		border-radius: 12px;
		font-size: 0.85rem;
		color: var(--subtitle-color);
	}

	.verse-display {
		font-size: 1.5rem;
		line-height: 2;
		margin-bottom: 2rem;
		padding: 2rem;
		background: var(--panel-background);
		border-radius: 8px;
		min-height: 120px;
	}

	.input-section {
		display: grid;
		gap: 1.5rem;
	}

	.input-display {
		background: var(--file-bg);
		border: 2px solid var(--accent-color);
		border-radius: 8px;
		padding: 1.25rem;
		font-size: 1.5rem;
		min-height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--text-color);
	}

	.input-display .placeholder {
		color: var(--subtitle-color);
		font-weight: normal;
		letter-spacing: normal;
	}

	.result-display {
		padding: 1.5rem;
		border-radius: 8px;
		text-align: center;
		border: 2px solid;
	}

	.result-display.success {
		background: #e8f5e9;
		border-color: #4caf50;
		color: #2e7d32;
	}

	.result-display.error {
		background: #ffebee;
		border-color: #f44336;
		color: #c62828;
	}

	[data-theme='dark'] .result-display.success {
		background: #1b5e20;
		color: #81c784;
	}

	[data-theme='dark'] .result-display.error {
		background: #b71c1c;
		color: #ef5350;
	}

	.accuracy-text {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.message {
		font-size: 1.1rem;
	}

	.button-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.primary-btn, .secondary-btn {
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: 600;
		transition: all 0.3s;
	}

	.primary-btn {
		background: var(--accent-color);
		color: white;
	}

	.primary-btn:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}

	.secondary-btn {
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border: 1px solid var(--file-border);
	}

	.secondary-btn:hover {
		background: var(--file-bg);
	}

	/* Character styling */
	:global(.verse-character) {
		display: inline;
		transition: all 0.15s ease;
	}

	:global(.verse-character.correct) {
		color: var(--text-color);
	}

	:global(.verse-character.incorrect) {
		color: #f44336;
		background: rgba(244, 67, 54, 0.1);
		padding: 0 2px;
		border-radius: 2px;
	}

	:global(.verse-character.hidden) {
		color: transparent;
		user-select: none;
	}

	@media (max-width: 768px) {
		.verse-display {
			font-size: 1.25rem;
			padding: 1.5rem;
		}

		.input-display {
			font-size: 1.25rem;
		}

		.button-group {
			grid-template-columns: 1fr;
		}
	}
</style>
