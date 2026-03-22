<script>
	import { createEventDispatcher } from 'svelte';
	import { verses as versesStore } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';
	import Modal from './Modal.svelte';

	export let verses = [];

	const dispatch = createEventDispatcher();

	let showCompletionMsg = false;
	let completionMessage = '';

	let currentIndex = 0;
	let userInput = '';
	let successCount = 0;
	let displayLines = [];
	let feedbackText = '';
	let feedbackClass = '';

	// Check if all verses are from same book/chapter
	$: allSameBookChapter = verses.every(v => 
		v.bookName === verses[0]?.bookName && 
		v.chapterNumber === verses[0]?.chapterNumber
	);

	// Build display lines
	$: {
		displayLines = verses.map((v, i) => {
			let ref = '';
			let refHtml = '';

			if (i === 0 || !allSameBookChapter) {
				ref = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
				refHtml = `<span class="reference-inline">${ref}</span>`;
			} else {
				ref = `${v.verseNumber}`;
				refHtml = `<span class="reference-inline">${ref}</span>`;
			}

			return {
				ref,
				refHtml,
				text: v.verseText,
				fullText: `${ref} ${v.verseText}`,
				finalHtml: ''
			};
		});
	}

	$: currentVerse = verses[currentIndex];
	$: expectedInput = currentVerse?.verseInitials || '';

	function handleInput(e) {
		const rawInput = e.target.value;
		userInput = rawInput.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

		// Check for completion
		if (userInput.length === expectedInput.length) {
			checkAnswer();
		}
	}

	function checkAnswer() {
		// Calculate accuracy
		let correct = 0;
		for (let i = 0; i < expectedInput.length; i++) {
			if (userInput[i] && userInput[i].toLowerCase() === expectedInput[i].toLowerCase()) {
				correct++;
			}
		}

		const accuracy = expectedInput.length > 0 ? (correct / expectedInput.length) * 100 : 0;
		feedbackText = `${t('accuracy')}: ${accuracy.toFixed(1)}%`;
		feedbackClass = accuracy >= 90 ? 'success' : 'error';

		// Save final colored HTML
		displayLines[currentIndex].finalHtml = renderCurrentVerse();

		// Update spaced repetition
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

		// Advance to next verse after delay
		setTimeout(() => {
			currentIndex++;
			userInput = '';
			feedbackText = '';
			feedbackClass = '';

			if (currentIndex >= verses.length) {
				// Session complete
				showCompletionModal();
			}
		}, 1500);
	}

	function showCompletionModal() {
		const msg = successCount > 0
			? t('congratulations_reviewed_count', { count: successCount })
			: t('congratulations_reviewed');
		completionMessage = msg;
		showCompletionMsg = true;
	}

	function handleCompletionConfirm() {
		showCompletionMsg = false;
		dispatch('complete');
	}

	function renderCurrentVerse() {
		const text = currentVerse.verseText;
		const initials = currentVerse.verseInitials;
		let html = '';
		let initialIndex = 0;

		for (const char of text) {
			const isHanChar = /\p{Script=Han}/u.test(char) || /[0-9]/.test(char);
			let className = 'verse-character';

			if (isHanChar && initialIndex < initials.length) {
				const expected = initials[initialIndex];
				const typed = userInput[initialIndex];

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
				if (initialIndex <= userInput.length) {
					className += ' correct';
					html += `<span class="${className}">${char}</span>`;
				} else {
					className += ' hidden';
					html += `<span class="${className}">${char}</span>`;
				}
			}
		}

		return html;
	}
</script>

<div class="single-text-review">
	<div class="progress-info">
		<span>{currentIndex + 1} / {verses.length}</span>
		<span>{successCount} {t('learned')}</span>
	</div>

	<div class="passage-display">
		<!-- Completed verses -->
		{#each displayLines.slice(0, currentIndex) as line}
			<div class="completed-verse">
				{@html line.refHtml}
				{@html line.finalHtml || line.text}
			</div>
		{/each}

		<!-- Current verse -->
		{#if currentIndex < verses.length}
			<div class="current-verse">
				{@html displayLines[currentIndex].refHtml}
				<span id="currentVerseDisplay">
					{@html renderCurrentVerse()}
				</span>
			</div>
		{/if}
	</div>

	{#if feedbackText}
		<div class="feedback {feedbackClass}">
			{feedbackText}
		</div>
	{/if}

	{#if currentIndex < verses.length}
		<div class="input-section">
			<input
				type="text"
				class="hidden-input"
				bind:value={userInput}
				on:input={handleInput}
				autofocus
				placeholder={t('type_to_continue')}
			/>
			<div class="input-hint">
				{t('type_initials')}...
			</div>
		</div>
	{/if}
</div>

<Modal 
	show={showCompletionMsg} 
	message={completionMessage}
	on:confirm={handleCompletionConfirm}
/>

<style>
	.single-text-review {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--file-bg);
		border-radius: 8px;
		margin-bottom: 2rem;
		font-size: 0.9em;
		color: var(--subtitle-color);
		border: 1px solid var(--file-border);
	}

	.passage-display {
		background: var(--panel-background);
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 1.4rem;
		line-height: 2;
		min-height: 200px;
	}

	.completed-verse {
		margin-bottom: 1rem;
		color: var(--text-color);
	}

	.current-verse {
		color: var(--text-color);
	}

	:global(.reference-inline) {
		color: var(--subtitle-color);
		font-size: 0.9em;
		margin-right: 0.5em;
		font-weight: 500;
	}

	.feedback {
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
		font-weight: 600;
		margin-bottom: 1.5rem;
		font-size: 1.1em;
	}

	.feedback.success {
		background: #e8f5e9;
		color: #2e7d32;
		border: 2px solid #4caf50;
	}

	.feedback.error {
		background: #ffebee;
		color: #c62828;
		border: 2px solid #f44336;
	}

	[data-theme='dark'] .feedback.success {
		background: #1b5e20;
		color: #81c784;
	}

	[data-theme='dark'] .feedback.error {
		background: #b71c1c;
		color: #ef5350;
	}

	.input-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.hidden-input {
		width: 100%;
		max-width: 500px;
		padding: 1rem;
		border: 2px solid var(--accent-color);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 8px;
		font-size: 1.25rem;
		text-align: center;
		font-weight: 600;
		letter-spacing: 0.1em;
		font-family: inherit;
	}

	.hidden-input:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.1);
	}

	.input-hint {
		color: var(--subtitle-color);
		font-size: 0.9em;
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
		.passage-display {
			font-size: 1.2em;
			padding: 1.5rem;
		}

		.hidden-input {
			font-size: 1.1em;
		}
	}
</style>
