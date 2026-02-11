<script>
	import { createEventDispatcher } from 'svelte';
	import { verses as versesStore } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import Modal from './Modal.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';

	export let verses = [];

	const dispatch = createEventDispatcher();

	let currentIndex = 0;
	let userInput = '';
	let showResult = false;
	let accuracy = 0;
	let successCount = 0;
	let feedbackMessage = '';
	let feedbackType = '';
	let lastErrorIndex = null;
	let lastErrorChar = null;
	let scrollTrigger = 0;
	let viewportAnchor;
	let keyboardLayout = keyboardLayouts.pinyin;
	let isNumericKeyboard = false;
	let verseHeaderOpacity = 1;
	let showCompletionMsg = false;
	let completionMessage = '';
	
	// Data for current verse (like Learning Mode)
	let reviewFullText = '';
	let reviewFullInitials = '';
	let charToInputIndex = [];
	let inputIndexToCharIndex = [];

	$: currentVerse = verses[currentIndex];
	
	// Fade verse header as user types (same logic as Learning Mode)
	$: {
		const totalInputsRequired = reviewFullInitials.length;
		const typedRatio = totalInputsRequired > 0 ? (userInput.length / totalInputsRequired) : 0;
		
		// No fade below 25%, fully invisible at 50% or above
		if (typedRatio <= 0.25) {
			verseHeaderOpacity = 1;
		} else if (typedRatio >= 0.5) {
			verseHeaderOpacity = 0;
		} else {
			// Linear fade from 1 -> 0 as typedRatio goes 0.25 -> 0.5
			verseHeaderOpacity = 1 - (typedRatio - 0.25) / 0.25;
		}
	}
	$: {
		// Update keyboard layout based on next character
		const nextCharIndex = userInput.length;
		const isNextCharNumber = nextCharIndex < reviewFullInitials.length && /[0-9]/.test(reviewFullInitials[nextCharIndex]);
		
		if (isNextCharNumber) {
			keyboardLayout = keyboardLayouts.numeric;
			isNumericKeyboard = true;
		} else {
			keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;
			isNumericKeyboard = false;
		}
	}
	
	// Initialize verse data when current verse changes
	$: if (currentVerse && !showResult) {
		initializeVerse(currentVerse);
	}

	function initializeVerse(verse) {
		userInput = '';
		feedbackMessage = '';
		feedbackType = '';
		lastErrorIndex = null;
		lastErrorChar = null;

		// Combine verse text and reference (same as Learning Mode Advanced)
		reviewFullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
		
		// Combine all expected inputs: verse initials + book initials + chapter + verse number
		reviewFullInitials = `${verse.verseInitials}${verse.bookInitials}${String(verse.chapterNumber)}${String(verse.verseNumber)}`;

		// Build character-to-input mapping
		const chars = [...reviewFullText];
		charToInputIndex = new Array(chars.length).fill(null);
		inputIndexToCharIndex = [];
		let inputIdx = 0;
		
		for (let i = 0; i < chars.length; i++) {
			const ch = chars[i];
			if (/[\u4e00-\u9fa5]/.test(ch) || /[0-9]/.test(ch)) {
				charToInputIndex[i] = inputIdx;
				inputIndexToCharIndex[inputIdx] = i;
				inputIdx++;
			} else {
				charToInputIndex[i] = null;
			}
		}
	}

	function updateErrorFeedback() {
		const inputMethod = $settings.inputMethod || 'pinyin';
		let latestErrorIndex = -1;
		let latestErrorChar = '';
		let mappedCharIndex = -1;

		// Find the most recent error
		for (let i = 0; i < userInput.length; i++) {
			const expected = reviewFullInitials[i];
			const typed = userInput[i];
			const expectedNorm = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
			const typedNorm = inputMethod === 'pinyin' ? typed.toLowerCase() : typed;
			
			if (typedNorm !== expectedNorm) {
				latestErrorIndex = i;
				latestErrorChar = expected;
				mappedCharIndex = inputIndexToCharIndex[i] !== undefined ? inputIndexToCharIndex[i] : -1;
			}
		}

		if (latestErrorIndex === -1) {
			feedbackMessage = '';
			feedbackType = '';
			lastErrorIndex = null;
			lastErrorChar = null;
		} else {
			const chars = [...reviewFullText];
			const errorCharacter = mappedCharIndex !== -1 ? chars[mappedCharIndex] : '?';
			
			if (lastErrorIndex !== latestErrorIndex || lastErrorChar !== latestErrorChar) {
				feedbackMessage = t('incorrect_input')
					.replace('{char}', errorCharacter)
					.replace('{pos}', latestErrorIndex + 1)
					.replace('{expected}', latestErrorChar);
				feedbackType = 'error';
				lastErrorIndex = latestErrorIndex;
				lastErrorChar = latestErrorChar;
				scrollTrigger++;
			}
		}
	}

	function handleKeyInput(event) {
		const key = event.detail;

		if (key === '⌫' || key === 'Backspace') {
			// Backspace disabled during review
			return;
		}

		if (key === '↵' || key === 'Enter') {
			if (userInput.length === reviewFullInitials.length) {
				checkAnswer();
			}
			return;
		}

		userInput += key;
		updateErrorFeedback();

		// Auto-submit when complete
		if (userInput.length === reviewFullInitials.length) {
			checkAnswer();
		}
	}

	function handlePhysicalKeyboard(e) {
		if (!currentVerse || showResult) return;

		if (e.key === 'Enter' && userInput.length === reviewFullInitials.length) {
			e.preventDefault();
			checkAnswer();
			return;
		}

		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault();
			return;
		}

		const inputMethod = $settings.inputMethod || 'pinyin';
		const key = e.key.toLowerCase();
		let mappedValue = '';

		if (inputMethod === 'zhuyin') {
			mappedValue = zhuyinKeyMap[key] || '';
		} else if (inputMethod === 'cangjie') {
			mappedValue = cangjieKeyMap[key] || '';
		} else if (/^[a-z0-9]$/i.test(key)) {
			mappedValue = key;
		}

		if (mappedValue) {
			e.preventDefault();
			userInput += mappedValue;
			updateErrorFeedback();
			
			if (userInput.length === reviewFullInitials.length) {
				checkAnswer();
			}
		}
	}

	function checkAnswer() {
		if (showResult) return;

		// Calculate accuracy
		let correct = 0;
		const inputMethod = $settings.inputMethod || 'pinyin';
		
		for (let i = 0; i < reviewFullInitials.length; i++) {
			const typedChar = inputMethod === 'pinyin' ? (userInput[i] || '').toLowerCase() : (userInput[i] || '');
			const expectedChar = inputMethod === 'pinyin' ? reviewFullInitials[i].toLowerCase() : reviewFullInitials[i];
			if (typedChar === expectedChar) {
				correct++;
			}
		}

		accuracy = reviewFullInitials.length > 0 ? Math.round((correct / reviewFullInitials.length) * 100) : 0;

		// Update verse with spaced repetition
		const now = new Date();
		const success = accuracy >= 90;
		
		versesStore.update(list => list.map(v => {
			if (v.id === currentVerse.id) {
				const card = {
					interval: v.interval || 0,
					repetitions: v.repetitions || 0,
					dueDate: v.dueDate ? (typeof v.dueDate === 'string' ? new Date(v.dueDate) : v.dueDate) : now
				};
				const updated = spacedRepetitionBinary(card, success, now);
				return {
					...v,
					interval: updated.interval,
					repetitions: updated.repetitions,
					dueDate: updated.dueDate,
					lastReviewed: success ? now.toISOString() : v.lastReviewed
				};
			}
			return v;
		}));

		if (success) {
			successCount++;
		}

		feedbackMessage = '';
		feedbackType = '';
		showResult = true;
	}

	function nextVerse() {
		if (currentIndex < verses.length - 1) {
			currentIndex++;
			userInput = '';
			showResult = false;
			accuracy = 0;
		} else {
			showCompletionModal();
		}
	}

	function retry() {
		userInput = '';
		showResult = false;
		accuracy = 0;
		feedbackMessage = '';
		feedbackType = '';
		initializeVerse(currentVerse);
	}

	function showCompletionModal() {
		completionMessage = t('congratulations_reviewed_count', { count: successCount });
		showCompletionMsg = true;
	}

	function handleCompletionClose() {
		showCompletionMsg = false;
		dispatch('complete');
	}

	// Character rendering (same as Advanced Learning Mode)
	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];

		if (map !== null) {
			// Input-requiring character
			const expected = reviewFullInitials[map];
			let className = 'verse-character';
			let hidden = true; // Always hidden initially (like advanced mode)

			// Reveal as user types
			if (userInput.length > map) {
				const inputMethod = $settings.inputMethod || 'pinyin';
				const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
				const expectedChar = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
				const isCorrect = typedChar === expectedChar;
				return { 
					char, 
					className: className + (isCorrect ? ' correct' : ' incorrect'), 
					hidden: false 
				};
			} else {
				return { char, className: className + ' hidden', hidden: true };
			}
		} else {
			// Punctuation
			let className = 'verse-character punctuation';
			let shown = false;

			// Find nearest previous input-requiring character
			let prevMap = null;
			for (let k = charIndex - 1; k >= 0; k--) {
				if (charToInputIndex[k] !== null) {
					prevMap = charToInputIndex[k];
					break;
				}
			}

			const isInitialPunct = (prevMap === null);

			if (isInitialPunct) {
				shown = true;
				className = 'verse-character correct';
			} else {
				// Show when previous character is typed
				if (prevMap !== null && userInput.length > prevMap) {
					shown = true;
					className = 'verse-character punctuation correct';
				}
			}

			return { char, className, hidden: !shown };
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="individual-review">
	<div class="progress-bar">
		<div class="progress-text">
			{currentIndex + 1} / {verses.length}
		</div>
		<div class="progress-fill" style="width: {((currentIndex + 1) / verses.length) * 100}%"></div>
	</div>
	
	{#if currentVerse}
		<div class="verse-header" style="opacity: {verseHeaderOpacity}; transition: opacity 0.3s ease;">
			<h3>{currentVerse.bookName} {currentVerse.chapterNumber}:{currentVerse.verseNumber}</h3>
			{#if currentVerse.bibleVersion}
				<span class="version-badge">{currentVerse.bibleVersion}</span>
			{/if}
		</div>

		{#key `${currentIndex}-${userInput.length}`}
			<div class="verse-display">
				{#each [...reviewFullText] as char, i}
					{@const rendered = renderCharacter(char, i)}
					{#if !rendered.hidden}
						<span class={rendered.className}>{rendered.char}</span>
					{/if}
				{/each}
			</div>
		{/key}

		<div class="input-section">
			<!-- Feedback for errors during typing -->
			{#if feedbackMessage && !showResult}
				<div class="feedback" class:success={feedbackType === 'success'} class:error={feedbackType === 'error'} class:warning={feedbackType === 'warning'}>
					{feedbackMessage}
				</div>
			{/if}

			<!-- Invisible viewport anchor -->
			<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>
			<!-- Invisible viewport anchor -->
			<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>

			{#if !showResult}
				<Keyboard layout={keyboardLayout} on:key={handleKeyInput} showBackspace={false} showEnter={false} />
			{/if}
		</div>
	{/if}
</div>

<!-- Result Modal -->
{#if showResult}
	<div class="modal-overlay" on:click={nextVerse} on:keydown={(e) => e.key === 'Escape' && nextVerse()}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-message">
				<div class="accuracy-text">
					{t('accuracy')}: {accuracy}%
				</div>
				{#if accuracy >= 90}
					<div class="message">{t('great_job_continue')}</div>
				{:else}
					<div class="message">{t('nice_try')}</div>
				{/if}
			</div>
			<div class="modal-buttons">
				<button class="modal-btn primary" on:click={nextVerse}>
					{currentIndex === verses.length - 1 ? t('finish') : t('next')}
				</button>
				<button class="modal-btn secondary" on:click={retry}>
					{t('retry')}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Completion Modal -->
<Modal 
	show={showCompletionMsg} 
	message={completionMessage}
	type="success"
	on:close={handleCompletionClose}
/>

<style>
	.individual-review {
		margin: 0 auto;
		padding: 1rem;
		width: 100%;
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
		width: 100%;
		box-sizing: border-box;
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

	/* Modal styling */
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
	}

	.modal-content {
		background: var(--panel-background);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		text-align: center;
	}

	.modal-message {
		margin-bottom: 1.5rem;
	}

	.modal-message .accuracy-text {
		font-size: 2rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-color);
	}

	.modal-message .message {
		font-size: 1.2rem;
		color: var(--subtitle-color);
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.modal-btn {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s;
	}

	.modal-btn.primary {
		background: var(--accent-color);
		color: white;
	}

	.modal-btn.secondary {
		background: var(--file-bg);
		color: var(--text-color);
		border: 1px solid var(--file-border);
	}

	.modal-btn:hover {
		opacity: 0.9;
	}

	/* Feedback styling */
	.feedback {
		padding: 1rem;
		border-radius: 8px;
		font-weight: 600;
		border: 2px solid;
	}

	.feedback.error {
		background: #ffebee;
		border-color: #f44336;
		color: #c62828;
	}

	.feedback.warning {
		background: #fff3e0;
		border-color: #ff9800;
		color: #e65100;
	}

	.feedback.success {
		background: #e8f5e9;
		border-color: #4caf50;
		color: #2e7d32;
	}

	[data-theme='dark'] .feedback.error {
		background: #b71c1c;
		color: #ef5350;
	}

	[data-theme='dark'] .feedback.warning {
		background: #e65100;
		color: #ffb74d;
	}

	[data-theme='dark'] .feedback.success {
		background: #1b5e20;
		color: #81c784;
	}

	/* Viewport anchor for keyboard positioning */
	.viewport-anchor {
		height: 1px;
		visibility: hidden;
		pointer-events: none;
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
