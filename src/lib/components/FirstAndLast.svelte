<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { verses as versesStore } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';
	import { icons } from '$lib/utils/icons.js';

	export let collection;
	export let verses = [];

	const dispatch = createEventDispatcher();

	// Progression state
	let currentVerseIndex = 0;
	let userInput = ''; // Max 2 characters per verse
	
	// Keyboard feedback
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;
	
	// Accuracy tracking
	let totalCorrect = 0; // Correct character inputs
	let totalAttempts = 0; // Total character inputs (2 per verse)
	
	// Completion modal
	let showCompletionModal = false;
	
	// Auto-advance timeout
	let advanceTimeout = null;
	
	// Viewport scrolling
	let viewportAnchor;
	let scrollTrigger = 0;
	
	// Get current verse
	$: currentVerse = verses[currentVerseIndex];
	
	// Extract first and last Chinese characters or numbers (skip punctuation)
	$: firstChar = currentVerse ? getFirstCharacter(currentVerse.verseText) : '';
	$: lastChar = currentVerse ? getLastCharacter(currentVerse.verseText) : '';
	
	// Extract expected initials (first initial + last initial)
	$: expectedInitials = currentVerse 
		? currentVerse.verseInitials[0] + currentVerse.verseInitials[currentVerse.verseInitials.length - 1]
		: '';
	
	// Verse reference for display
	$: verseRef = currentVerse 
		? `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber}`
		: '';
	
	// Helper function to get first Chinese character or number
	function getFirstCharacter(text) {
		for (let i = 0; i < text.length; i++) {
			if (/[\u4e00-\u9fa5]/.test(text[i]) || /[0-9]/.test(text[i])) {
				return text[i];
			}
		}
		return '';
	}
	
	// Helper function to get last Chinese character or number
	function getLastCharacter(text) {
		for (let i = text.length - 1; i >= 0; i--) {
			if (/[\u4e00-\u9fa5]/.test(text[i]) || /[0-9]/.test(text[i])) {
				return text[i];
			}
		}
		return '';
	}
	
	// Update keyboard layout based on next character
	$: {
		const nextCharIndex = userInput.length;
		const isNextCharNumber = nextCharIndex < expectedInitials.length && /[0-9]/.test(expectedInitials[nextCharIndex]);
		
		if (isNextCharNumber) {
			keyboardLayout = keyboardLayouts.numericCompact;
		} else {
			const inputMethod = $settings.inputMethod || 'pinyin';
			const layoutMap = {
				pinyin: keyboardLayouts.pinyinCompact,
				zhuyin: keyboardLayouts.zhuyinCompact,
				cangjie: keyboardLayouts.cangjieCompact
			};
			keyboardLayout = layoutMap[inputMethod] || keyboardLayouts.pinyinCompact;
		}
	}
	
	// Scroll viewport to position content above keyboard
	$: {
		if (viewportAnchor) {
			const _ = scrollTrigger;
			
			setTimeout(() => {
				const anchorRect = viewportAnchor.getBoundingClientRect();
				const keyboard = viewportAnchor.nextElementSibling;
				
				if (keyboard) {
					const keyboardRect = keyboard.getBoundingClientRect();
					const scrollTarget = window.scrollY + (anchorRect.top - keyboardRect.top);
					
					window.scrollTo({ 
						top: scrollTarget, 
						behavior: 'smooth' 
					});
				}
			}, 150);
		}
	}
	
	function handleKeyInput(event) {
		if (!currentVerse || userInput.length >= 2) return;
		
		const key = event.detail;
		
		// Clear previous feedback
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		
		// Get expected character
		const inputMethod = $settings.inputMethod || 'pinyin';
		const nextExpectedChar = expectedInitials[userInput.length];
		const normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
		const normalizedExpected = inputMethod === 'pinyin' 
			? (nextExpectedChar || '').toLowerCase() 
			: (nextExpectedChar || '');
		
		totalAttempts++;
		
		if (normalizedKey === normalizedExpected) {
			// Correct
			lastCorrectKey = key;
			userInput += key;
			totalCorrect++;
			
			// If completed both characters, auto-advance
			if (userInput.length === 2) {
				scheduleAdvance();
			}
		} else {
			// Incorrect
			pressedKey = key;
			correctKey = nextExpectedChar;
			triggerErrorFeedback($settings);
			
			// Still add to input
			userInput += key;
			
			// If completed both characters, auto-advance
			if (userInput.length === 2) {
				scheduleAdvance();
			}
		}
		
		// Trigger scroll
		scrollTrigger++;
	}
	
	function handlePhysicalKeyboard(e) {
		if (!currentVerse || userInput.length >= 2) return;
		if (showCompletionModal) return;

		// Backspace is disabled in practice mode
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
			
			// Clear previous feedback
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			
			// Get expected character
			const nextExpectedChar = expectedInitials[userInput.length];
			const normalizedKey = inputMethod === 'pinyin' ? mappedValue.toLowerCase() : mappedValue;
			const normalizedExpected = inputMethod === 'pinyin' 
				? (nextExpectedChar || '').toLowerCase() 
				: (nextExpectedChar || '');
			
			totalAttempts++;
			
			if (normalizedKey === normalizedExpected) {
				// Correct
				lastCorrectKey = mappedValue;
				totalCorrect++;
			} else {
				// Incorrect
				pressedKey = mappedValue;
				correctKey = nextExpectedChar;
				triggerErrorFeedback($settings);
			}
			
			userInput += mappedValue;
			scrollTrigger++;
			
			// If completed both characters, auto-advance
			if (userInput.length === 2) {
				scheduleAdvance();
			}
		}
	}
	
	function scheduleAdvance() {
		// Clear any existing timeout
		if (advanceTimeout) {
			clearTimeout(advanceTimeout);
		}
		
		// Schedule auto-advance after 1 second
		advanceTimeout = setTimeout(() => {
			advanceToNext();
		}, 1000);
	}
	
	function advanceToNext() {
		// Clear timeout
		if (advanceTimeout) {
			clearTimeout(advanceTimeout);
			advanceTimeout = null;
		}
		
		// Check if more verses remain
		if (currentVerseIndex < verses.length - 1) {
			currentVerseIndex++;
			userInput = '';
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			scrollTrigger++;
		} else {
			// All verses complete
			completeChallenge();
		}
	}
	
	function completeChallenge() {
		// Clear any pending timeout
		if (advanceTimeout) {
			clearTimeout(advanceTimeout);
			advanceTimeout = null;
		}
		showCompletionModal = true;
	}
	
	function tryAgain() {
		showCompletionModal = false;
		currentVerseIndex = 0;
		userInput = '';
		totalCorrect = 0;
		totalAttempts = 0;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		scrollTrigger++;
	}
	
	function done() {
		dispatch('complete');
	}
	
	function exit() {
		// Clear any pending timeout
		if (advanceTimeout) {
			clearTimeout(advanceTimeout);
			advanceTimeout = null;
		}
		dispatch('exit');
	}

	function goBack() {
		dispatch('back');
	}

	function closeToInitial() {
		if (advanceTimeout) {
			clearTimeout(advanceTimeout);
			advanceTimeout = null;
		}
		showCompletionModal = false;
		currentVerseIndex = 0;
		userInput = '';
		totalCorrect = 0;
		totalAttempts = 0;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		exit();
	}
	
	// Clean up on component destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (advanceTimeout) {
			clearTimeout(advanceTimeout);
		}
	});
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="first-and-last-container">
	<div class="mode-header">
		<button class="back-btn" on:click={goBack} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				{@html icons.back}
			</svg>
		</button>
		<h2>{t('first_and_last')}</h2>
		<button class="back-btn exit-button" on:click={closeToInitial} aria-label={t('exit')}>✕</button>
	</div>
	
	<div class="collection-meta-row">
		<div class="collection-meta-spacer" aria-hidden="true"></div>
		{#if collection}
			<div class="collection-header">
				{collection.title}
			</div>
		{:else}
			<div></div>
		{/if}
		<div class="progress-indicator">
			{currentVerseIndex + 1} / {verses.length}
		</div>
	</div>
	
	{#if currentVerse}
		<div class="verse-ref">
			{verseRef}
		</div>
		
		<div class="verse-display">
			{#key currentVerseIndex}{#key userInput.length}
				<div class="character-group">
					{#if userInput.length >= 1}
						{@const inputMethod = $settings.inputMethod || 'pinyin'}
						{@const typedChar = inputMethod === 'pinyin' ? userInput[0].toLowerCase() : userInput[0]}
						{@const expectedChar = inputMethod === 'pinyin' ? expectedInitials[0].toLowerCase() : expectedInitials[0]}
						{@const isCorrect = typedChar === expectedChar}
						<span class="first-char {isCorrect ? 'correct' : 'incorrect'}">{firstChar}</span>
					{:else}
						<span class="first-char blank">_</span>
					{/if}
					
					<span class="ellipsis">••••••</span>
					
					{#if userInput.length >= 2}
						{@const inputMethod = $settings.inputMethod || 'pinyin'}
						{@const typedChar = inputMethod === 'pinyin' ? userInput[1].toLowerCase() : userInput[1]}
						{@const expectedChar = inputMethod === 'pinyin' ? expectedInitials[1].toLowerCase() : expectedInitials[1]}
						{@const isCorrect = typedChar === expectedChar}
						<span class="last-char {isCorrect ? 'correct' : 'incorrect'}">{lastChar}</span>
					{:else}
						<span class="last-char blank">_</span>
					{/if}
				</div>
			{/key}{/key}
		</div>
	{/if}
	
	<!-- Invisible viewport anchor for keyboard positioning -->
	<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>
	
	{#if !showCompletionModal}
		<div class="keyboard-space">
			<Keyboard 
				layout={keyboardLayout}
				on:key={handleKeyInput}
				showBackspace={false}
				showEnter={false}
				pressedKey={pressedKey}
				correctKey={correctKey}
				lastCorrectKey={lastCorrectKey}
			/>
		</div>
	{/if}
</div>

{#if showCompletionModal}
	<div class="modal-overlay" on:click={done} on:keydown={(e) => e.key === 'Escape' && done()} role="button" tabindex="0">
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<h3>{t('first_and_last')} {t('finish')}</h3>
			<p>{t('congratulations_practice')}</p>
			
			{#if totalAttempts > 0}
				<div class="accuracy-display">
					<div class="accuracy-label">{t('accuracy')}</div>
					<div class="accuracy-value">{Math.round((totalCorrect / totalAttempts) * 100)}%</div>
					<div class="accuracy-detail">{totalCorrect} / {totalAttempts} {t('correct')}</div>
				</div>
			{/if}
			
			<div class="modal-buttons">
				<button class="btn-outline" on:click={tryAgain}>
					{t('try_again')}
				</button>
				<button on:click={done}>
					{t('done')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.first-and-last-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: 1rem;
		gap: 1rem;
	}
	
	.exit-button {
		font-size: 1.5em;
	}

	.collection-meta-row {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	.collection-meta-spacer {
		justify-self: start;
	}

	.collection-header {
		text-align: center;
		font-weight: 600;
		color: var(--subtitle-color);
		padding: 0.5rem;
	}
	
	.progress-indicator {
		justify-self: end;
		color: var(--subtitle-color);
		font-size: 0.9em;
		padding: 0.25rem;
	}
	
	.verse-ref {
		text-align: center;
		font-size: 1em;
		color: var(--subtitle-color);
		padding: 0.5rem;
		font-weight: 500;
	}
	
	.verse-display {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem 1rem;
		background: var(--panel-background);
		border-radius: 8px;
		min-height: 200px;
	}
	
	.character-group {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 2.5em;
		font-weight: 600;
	}
	
	.first-char,
	.last-char {
		display: inline-block;
		min-width: 1.2em;
		text-align: center;
		transition: color 0.3s;
		flex-shrink: 0;
	}
	
	.first-char.blank,
	.last-char.blank {
		color: var(--subtitle-color);
		opacity: 0.5;
	}
	
	.first-char.correct,
	.last-char.correct {
		color: var(--success-color);
	}

	.first-char.incorrect,
	.last-char.incorrect {
		color: var(--danger-color);
	}
	
	.ellipsis {
		color: var(--subtitle-color);
		font-size: 0.6em;
		letter-spacing: 0.2em;
		display: inline-block;
		min-width: 3em;
		text-align: center;
		flex-shrink: 0;
	}
	
	.keyboard-space {
		margin-top: auto;
	}
	
	.viewport-anchor {
		height: 1px;
		width: 100%;
		visibility: hidden;
		pointer-events: none;
		margin: 0;
		padding: 0;
	}
	
	/* Overlay/content shells come from the shared modal classes in app.css */
	.modal-content h3 {
		margin: 0 0 1rem 0;
		color: var(--accent-color);
	}
	
	.modal-content p {
		margin: 1rem 0;
		color: var(--text-color);
	}
	
	.modal-buttons {
		margin-top: 1.5rem;
	}

	.modal-buttons button {
		flex: 1;
	}

	.accuracy-display {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		text-align: center;
	}
	
	.accuracy-label {
		font-size: 0.9em;
		color: var(--subtitle-color);
		margin-bottom: 0.5rem;
	}
	
	.accuracy-value {
		font-size: 2.5em;
		font-weight: bold;
		color: var(--accent-color);
		margin-bottom: 0.25rem;
	}
	
	.accuracy-detail {
		font-size: 0.9em;
		color: var(--subtitle-color);
	}
	
	@media (max-width: 767px) {
		.first-and-last-container {
			padding: 0.5rem;
		}
		
		.verse-display {
			padding: 1.5rem 0.5rem;
			min-height: 150px;
		}
		
		.character-group {
			font-size: 2em;
			gap: 0.5rem;
		}
	}
</style>
