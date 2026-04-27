<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Modal from './Modal.svelte';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';

	export let verses = [];

	const dispatch = createEventDispatcher();

	// Quiz state
	let shuffledVerses = [];
	let currentIndex = 0;
	let userInput = '';
	let showFeedback = false;
	let feedbackCorrect = false;
	let allSameBook = false;
	let expectedInput = '';
	
	// Keyboard feedback
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;
	
	// Completion modal
	let showCompletionModal = false;
	
	// Initialize quiz
	$: {
		if (verses.length > 0) {
			initializeQuiz();
		}
	}
	
	// Update keyboard layout based on next character
	$: {
		const nextCharIndex = userInput.length;
		const isNextCharNumber = nextCharIndex < expectedInput.length && /[0-9:]/.test(expectedInput[nextCharIndex]);
		
		if (isNextCharNumber) {
			keyboardLayout = keyboardLayouts.numericCompact;
			isNumericKeyboard = true;
		} else {
			const inputMethod = $settings.inputMethod || 'pinyin';
			const layoutMap = {
				pinyin: keyboardLayouts.pinyinCompact,
				zhuyin: keyboardLayouts.zhuyinCompact,
				cangjie: keyboardLayouts.cangjieCompact
			};
			keyboardLayout = layoutMap[inputMethod] || keyboardLayouts.pinyinCompact;
			isNumericKeyboard = false;
		}
	}
	
	function initializeQuiz() {
		// Shuffle verses
		shuffledVerses = shuffleArray([...verses]);
		
		// Check if all verses are from same book
		const books = new Set(verses.map(v => v.bookName));
		allSameBook = books.size === 1;
		
		// Set expected input for first verse
		updateExpectedInput();
	}
	
	function shuffleArray(array) {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}
	
	function updateExpectedInput() {
		const verse = shuffledVerses[currentIndex];
		if (!verse) return;
		
		if (allSameBook) {
			// Only chapter:verse (e.g., "3:16")
			expectedInput = `${verse.chapterNumber}:${verse.verseNumber}`;
		} else {
			// Full reference with book initials (e.g., "yhfy3:16")
			expectedInput = `${verse.bookInitials}${verse.chapterNumber}:${verse.verseNumber}`;
		}
	}
	
	function handleKeyInput(event) {
		const key = event.detail;
		
		// Clear previous feedback
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		
		// Special handling for colon key - allow both : and the actual character
		const inputMethod = $settings.inputMethod || 'pinyin';
		const nextExpectedChar = expectedInput[userInput.length];
		
		let normalizedKey = key;
		let normalizedExpected = nextExpectedChar;
		
		// For numbers and colons, exact match
		if (/[0-9:]/.test(nextExpectedChar)) {
			normalizedKey = key;
			normalizedExpected = nextExpectedChar;
		} else {
			// For initials, apply pinyin lowercase
			normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
			normalizedExpected = inputMethod === 'pinyin' 
				? nextExpectedChar.toLowerCase() 
				: nextExpectedChar;
		}
		
		if (normalizedKey === normalizedExpected) {
			// Correct
			lastCorrectKey = key;
			userInput += key;
			
			// Check if complete
			if (userInput === expectedInput) {
				showCorrectFeedback();
			}
		} else {
			// Incorrect
			pressedKey = key;
			correctKey = nextExpectedChar;
			triggerErrorFeedback($settings);
		}
	}
	
	function showCorrectFeedback() {
		feedbackCorrect = true;
		showFeedback = true;
		
		// Auto-advance after short delay
		setTimeout(() => {
			showFeedback = false;
			nextVerse();
		}, 800);
	}
	
	function nextVerse() {
		if (currentIndex < shuffledVerses.length - 1) {
			currentIndex++;
			userInput = '';
			updateExpectedInput();
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
		} else {
			// Quiz complete
			showCompletionModal = true;
		}
	}
	
	function done() {
		dispatch('complete');
	}
	
	function exit() {
		dispatch('exit');
	}
	
	$: currentVerse = shuffledVerses[currentIndex];
	$: progress = `${currentIndex + 1} / ${shuffledVerses.length}`;
</script>

<div class="reference-quiz-container">
	<div class="header">
		<button class="exit-button" on:click={exit}>✕</button>
		<h2>{t('reference_quiz')}</h2>
		<div class="progress">{progress}</div>
	</div>
	
	{#if allSameBook && currentVerse}
		<div class="hint">
			<span class="hint-label">{t('chinese_book_name')}:</span>
			<span class="hint-value">{currentVerse.bookName}</span>
		</div>
	{/if}
	
	<div class="instructions">
		{t('enter_reference')}
	</div>
	
	{#if currentVerse}
		<div class="verse-text">
			{currentVerse.verseText}
		</div>
	{/if}
	
	<div class="input-display">
		<div class="expected-format">
			{#if allSameBook}
				<span class="format-label">{t('chapter')}:{t('verse')}</span>
			{:else}
				<span class="format-label">{t('chinese_book_name')} {t('chapter')}:{t('verse')}</span>
			{/if}
		</div>
		
		<div class="user-input-text">
			{#each expectedInput.split('') as char, idx}
				{#if idx < userInput.length}
					{@const typedChar = userInput[idx]}
					{@const isCorrect = typedChar === char}
					<span class="input-char" class:correct={isCorrect} class:incorrect={!isCorrect}>
						{char}
					</span>
				{:else}
					<span class="input-char placeholder">_</span>
				{/if}
			{/each}
		</div>
		
		{#if showFeedback && feedbackCorrect}
			<div class="feedback correct-feedback">
				✓ {t('correct_reference')}
			</div>
		{/if}
	</div>
	
	<div class="keyboard-space">
		<Keyboard 
			layout={keyboardLayout}
			on:key={handleKeyInput}
			showBackspace={false}
			showEnter={false}
			isNumeric={isNumericKeyboard}
			pressedKey={pressedKey}
			correctKey={correctKey}
			lastCorrectKey={lastCorrectKey}
		/>
	</div>
</div>

{#if showCompletionModal}
	<Modal show={true} type="success" on:close={done}>
		<div class="completion-content">
			<h3>{t('reference_quiz')} {t('finish')}</h3>
			<p>{t('congratulations_reviewed_count').replace('{count}', verses.length)}</p>
			
			<button class="primary-button" on:click={done}>
				{t('done')}
			</button>
		</div>
	</Modal>
{/if}

<style>
	.reference-quiz-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: 1rem;
		overflow-y: auto;
	}
	
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
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
	
	.hint {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		padding: 0.5rem;
		background: var(--accent-color-light, rgba(76, 175, 80, 0.1));
		border-radius: 6px;
		margin-bottom: 1rem;
	}
	
	.hint-label {
		color: var(--subtitle-color);
		font-size: 0.9em;
	}
	
	.hint-value {
		font-weight: 600;
		color: var(--text-color);
	}
	
	.instructions {
		text-align: center;
		color: var(--subtitle-color);
		margin-bottom: 1rem;
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
		margin-bottom: 1.5rem;
	}
	
	.input-display {
		margin-bottom: 1.5rem;
	}
	
	.expected-format {
		text-align: center;
		color: var(--subtitle-color);
		font-size: 0.85em;
		margin-bottom: 0.5rem;
	}
	
	.user-input-text {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
		font-size: 1.5em;
		font-family: monospace;
		min-height: 2em;
		align-items: center;
	}
	
	.input-char {
		width: 1.2em;
		height: 1.5em;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}
	
	.input-char.placeholder {
		color: var(--subtitle-color);
		opacity: 0.3;
	}
	
	.input-char.correct {
		color: var(--text-color);
		background: var(--accent-color-light, rgba(76, 175, 80, 0.1));
	}
	
	.input-char.incorrect {
		color: #f44336;
		background: rgba(244, 67, 54, 0.1);
	}
	
	.feedback {
		text-align: center;
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 6px;
		font-weight: 600;
	}
	
	.correct-feedback {
		color: var(--accent-color);
		background: var(--accent-color-light, rgba(76, 175, 80, 0.1));
	}
	
	.keyboard-space {
		margin-top: auto;
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
	
	.primary-button {
		width: 100%;
		padding: 0.75rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1em;
		cursor: pointer;
	}
	
	@media (max-width: 767px) {
		.reference-quiz-container {
			padding: 0.5rem;
		}
		
		.verse-text {
			font-size: 1.2em;
			padding: 1rem;
		}
		
		.user-input-text {
			font-size: 1.2em;
		}
	}
</style>
