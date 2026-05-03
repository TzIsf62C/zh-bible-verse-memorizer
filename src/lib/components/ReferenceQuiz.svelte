<script>
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n';

	export let verses = [];

	const dispatch = createEventDispatcher();

	// Quiz state
	let quizQueue = [];
	let correctCount = 0;
	let revealed = false;
	
	// Completion modal
	let showCompletionModal = false;
	
	// Initialize quiz
	$: {
		if (verses.length > 0) {
			initializeQuiz();
		}
	}
	
	function initializeQuiz() {
		// Shuffle verses and reset state
		quizQueue = shuffleArray([...verses]);
		correctCount = 0;
		revealed = false;
		showCompletionModal = false;
	}
	
	function shuffleArray(array) {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}
	
	function revealAnswer() {
		revealed = true;
	}
	
	function markCorrect() {
		if (quizQueue.length === 0) return;

		correctCount++;
		quizQueue = quizQueue.slice(1);
		revealed = false;

		if (quizQueue.length === 0) {
			showCompletionModal = true;
		}
	}
	
	function markIncorrect() {
		if (quizQueue.length === 0) return;

		if (quizQueue.length > 1) {
			const [currentVerse, ...remaining] = quizQueue;
			quizQueue = [...remaining, currentVerse];
		}
		revealed = false;
	}
	
	function done() {
		dispatch('complete');
	}
	
	function exit() {
		dispatch('exit');
	}
	
	$: currentVerse = quizQueue[0];
	$: progress = `${correctCount} / ${verses.length}`;
</script>

<div class="reference-quiz-container">
	<div class="header">
		<button class="exit-button" on:click={exit}>✕</button>
		<h2>{t('reference_quiz')}</h2>
		<div class="progress">{progress}</div>
	</div>
	
	<div class="instructions">
		{t('try_recall_reference')}
	</div>
	
	{#if currentVerse}
		<div class="verse-text">
			{currentVerse.verseText}
		</div>
		
		<div class="reference-display">
			{#if revealed}
				<div class="reference-answer">
					{currentVerse.bookName} {currentVerse.chapterNumber}:{currentVerse.verseNumber}
				</div>
			{:else}
				<div class="reference-hidden">
					{t('reference_hidden')}
				</div>
			{/if}
		</div>
		
		<div class="button-group">
			{#if !revealed}
				<button class="secondary-button" on:click={revealAnswer}>
					{t('reveal_answer')}
				</button>
			{:else}
				<button class="incorrect-button" on:click={markIncorrect}>✗</button>
				<button class="correct-button" on:click={markCorrect}>✓</button>
			{/if}
		</div>
	{/if}
</div>

{#if showCompletionModal}
	<div class="modal-overlay" on:click={done} on:keydown={(e) => e.key === 'Escape' && done()} role="button" tabindex="0">
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<h3>{t('reference_quiz')} {t('finish')}</h3>
			<p>{t('congratulations_reviewed_count').replace('{count}', verses.length)}</p>
			
			<button class="primary-button" on:click={done}>
				{t('done')}
			</button>
		</div>
	</div>
{/if}

<style>
	.reference-quiz-container {
		display: flex;
		flex-direction: column;
		height: 80vh;
		padding: 1rem;
		gap: 1.5rem;
	}
	
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.exit-button {
		padding: 0.5rem;
		background: none;
		border: none;
		font-size: 1.5em;
		cursor: pointer;
		color: var(--text-color);
	}
	
	h2 {
		margin: 0;
		font-size: 1.2em;
		flex: 1;
		text-align: center;
	}
	
	.progress {
		font-weight: 600;
		color: var(--accent-color);
		min-width: 60px;
		text-align: right;
	}
	
	.instructions {
		text-align: center;
		color: var(--subtitle-color);
		font-size: 0.95em;
	}
	
	.verse-text {
		flex: 1;
		font-size: 1.5em;
		line-height: 2;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.reference-display {
		text-align: center;
		min-height: 3em;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.reference-answer {
		font-size: 1.3em;
		font-weight: 600;
		color: var(--accent-color);
		padding: 1rem;
		background: var(--accent-color-light, rgba(76, 175, 80, 0.1));
		border-radius: 8px;
	}
	
	.reference-hidden {
		font-size: 1.1em;
		color: var(--subtitle-color);
		font-style: italic;
	}
	
	.button-group {
		display: flex;
		gap: 1rem;
	}
	
	.primary-button,
	.secondary-button,
	.incorrect-button,
	.correct-button {
		flex: 1;
		padding: 1rem;
		border: none;
		border-radius: 8px;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s;
	}
	
	.primary-button {
		background: var(--accent-color);
		color: white;
	}
	
	.secondary-button {
		background: var(--panel-background);
		color: var(--text-color);
		border: 2px solid var(--accent-color);
	}
	
	.incorrect-button {
		background: #f44336;
		color: white;
		font-size: 1.5em;
	}
	
	.correct-button {
		background: #4CAF50;
		color: white;
		font-size: 1.5em;
	}
	
	.primary-button:active,
	.secondary-button:active,
	.incorrect-button:active,
	.correct-button:active {
		transform: scale(0.98);
	}
	
	.completion-content {
		text-align: center;
		padding: 1rem;
	}
	
	.completion-content h3 {
		margin-bottom: 1rem;
	}
	
	.completion-content p {
		margin-bottom: 1.5rem;
	}
	
	.completion-content .primary-button {
		width: 100%;
	}
	
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background: var(--app-background);
		padding: 2rem;
		border-radius: 12px;
		max-width: 400px;
		width: 90%;
		text-align: center;
	}
	
	.modal-content h3 {
		margin: 0 0 1rem 0;
		color: var(--accent-color);
	}
	
	.modal-content p {
		margin: 1rem 0;
		color: var(--text-color);
		font-size: 1.1em;
	}
	
	.modal-content .primary-button {
		margin-top: 1rem;
		width: 100%;
	}
	
	@media (max-width: 767px) {
		.reference-quiz-container {
			padding: 0.5rem;
			gap: 1rem;
		}
		
		.verse-text {
			padding: 1rem;
		}
	}
</style>
