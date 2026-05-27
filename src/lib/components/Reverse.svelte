<script>
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';

	export let verse;

	const dispatch = createEventDispatcher();

	// Input state
	let userInput = '';
	let fullText = '';
	let fullInitials = '';
	let charToInputIndex = [];
	let revealedCount = 1; // First phase always includes the final input character
	
	// Keyboard feedback
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;
	let phaseCompleteGlow = false; // For arrow glow effect
	
	// Accuracy tracking (current phase + final snapshot)
	let phaseInputs = 0;
	let phaseCorrectInputs = 0;
	let finalPhaseInputs = 0;
	let finalPhaseCorrectInputs = 0;
	
	// Completion modal
	let showCompletionModal = false;
	
	// Verse reference formatter
	$: formatVerseRef = createVerseReferenceFormatter($verses);
	
	// Build full text (verse text + reference)
	$: {
		if (verse) {
			buildFullText();
		}
	}
	
	// Update keyboard layout based on next character
	$: {
		const nextCharIndex = fullInitials.length - revealedCount + userInput.length;
		const isNextCharNumber = nextCharIndex < fullInitials.length && /[0-9]/.test(fullInitials[nextCharIndex]);
		
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
	
	function buildFullText() {
		// Build string: reference then verseText (so backwards starts from text)
		const refText = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber} `;
		const refInitials = `${verse.bookInitials}${verse.chapterNumber}${verse.verseNumber}`;
		
		fullText = refText + verse.verseText;
		fullInitials = refInitials + verse.verseInitials;
		
		// Build char to input index mapping
		const charMap = [];
		let inputIdx = 0;
		
		for (let i = 0; i < fullText.length; i++) {
			const char = fullText[i];
			if (/[\u4e00-\u9fa5]/.test(char) || /[0-9]/.test(char)) {
				charMap.push(inputIdx);
				inputIdx++;
			} else {
				charMap.push(null);
			}
		}
		
		charToInputIndex = charMap;
	}
	
	// Check if current phase is complete (for glow effect)
	$: {
		if (userInput.length === revealedCount && revealedCount < fullInitials.length) {
			// Phase complete - glow the left arrow
			phaseCompleteGlow = true;
			// Remove glow after 2 seconds
			setTimeout(() => {
				phaseCompleteGlow = false;
			}, 2000);
		} else {
			phaseCompleteGlow = false;
		}
	}
	
	function advancePhase() {
		if (revealedCount < fullInitials.length) {
			revealedCount++;
			userInput = '';
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			phaseInputs = 0;
			phaseCorrectInputs = 0;
		}
	}
	
	function previousPhase() {
		if (revealedCount > 1) {
			revealedCount--;
			userInput = '';
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			phaseInputs = 0;
			phaseCorrectInputs = 0;
		}
	}
	
	function retryPhase() {
		userInput = '';
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		phaseInputs = 0;
		phaseCorrectInputs = 0;
	}
	
	function handleKeyInput(event) {
		const key = event.detail;
		
		// Clear previous feedback
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		
		// Get expected character (working backward from end)
		const inputMethod = $settings.inputMethod || 'pinyin';
		const currentSectionStartIndex = fullInitials.length - revealedCount;
		const expectedCharIndex = currentSectionStartIndex + userInput.length;
		const nextExpectedChar = fullInitials[expectedCharIndex];
		
		const normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
		const normalizedExpected = inputMethod === 'pinyin' 
			? (nextExpectedChar || '').toLowerCase() 
			: (nextExpectedChar || '');
		
		if (normalizedKey === normalizedExpected) {
			// Correct
			lastCorrectKey = key;
			userInput += key;
			phaseInputs++;
			phaseCorrectInputs++;
		} else {
			// Incorrect
			pressedKey = key;
			correctKey = nextExpectedChar;
			triggerErrorFeedback($settings);
			
			// Still add to input
			userInput += key;
			phaseInputs++;
		}

		if (revealedCount === fullInitials.length && userInput.length === revealedCount) {
			completeChallenge();
		}
	}
	
	function completeChallenge() {
		finalPhaseInputs = phaseInputs;
		finalPhaseCorrectInputs = phaseCorrectInputs;
		showCompletionModal = true;
	}
	
	function tryAgain() {
		showCompletionModal = false;
		userInput = '';
		revealedCount = 1;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		phaseInputs = 0;
		phaseCorrectInputs = 0;
		finalPhaseInputs = 0;
		finalPhaseCorrectInputs = 0;
	}
	
	function done() {
		dispatch('complete');
	}
	
	function exit() {
		dispatch('exit');
	}

	function goBack() {
		dispatch('back');
	}

	function closeToInitial() {
		userInput = '';
		revealedCount = 1;
		phaseCompleteGlow = false;
		phaseInputs = 0;
		phaseCorrectInputs = 0;
		finalPhaseInputs = 0;
		finalPhaseCorrectInputs = 0;
		showCompletionModal = false;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		exit();
	}

	// Autoscroll on mount to position nav controls above keyboard
	let navControlsEl;
	onMount(() => {
		setTimeout(() => {
			const keyboardEl = document.querySelector('.keyboard');
			if (keyboardEl && navControlsEl) {
				const keyTop = keyboardEl.getBoundingClientRect().top;
				const navBottom = navControlsEl.getBoundingClientRect().bottom;
				if (navBottom > keyTop - 8) {
					const scrollAmt = navBottom - keyTop + 16;
					window.scrollTo({ top: window.scrollY + scrollAmt, behavior: 'smooth' });
				}
			}
		}, 300);
	});
	
	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];
		
		if (map !== null) {
			// Character requires input
			const inputMethod = $settings.inputMethod || 'pinyin';
			let className = 'verse-character';
			
			// Determine if this character should be revealed
			const currentSectionStartIndex = fullInitials.length - revealedCount;
			const isRevealed = map >= currentSectionStartIndex;
			
			if (!isRevealed) {
				// Not yet revealed - completely hidden
				return { char, className: className + ' hidden', hidden: true };
			}
			
			// Character is revealed
			const relativeInputIndex = map - currentSectionStartIndex;
			
			// Check if this is the NEWLY revealed character (leftmost in section, shown first)
			const isNewlyRevealed = (map === currentSectionStartIndex);
			
			if (isNewlyRevealed && relativeInputIndex >= userInput.length) {
				// Newly revealed character - show as actual character (not blank) until typed
				return { 
					char, 
					className: className, 
					hidden: false 
				};
			} else if (relativeInputIndex < userInput.length) {
				// User has typed this character - show with color feedback
				const typedChar = inputMethod === 'pinyin' 
					? userInput[relativeInputIndex].toLowerCase() 
					: userInput[relativeInputIndex];
				const expectedChar = inputMethod === 'pinyin' 
					? fullInitials[map].toLowerCase() 
					: fullInitials[map];
				const isCorrect = typedChar === expectedChar;
				
				return { 
					char, 
					className: className + (isCorrect ? ' correct' : ' incorrect'), 
					hidden: false 
				};
			} else {
				// Previously revealed but not yet typed - show as blank
				return { char: '＿', className: 'verse-blank', hidden: false };
			}
		} else {
			// Punctuation - reveal based on the character BEFORE it (to the left in original order)
			let prevCharInputIndex = null;
			for (let i = charIndex - 1; i >= 0; i--) {
				if (charToInputIndex[i] !== null) {
					prevCharInputIndex = charToInputIndex[i];
					break;
				}
			}
			
			if (prevCharInputIndex === null) {
				// No previous character - hide
				return { char, className: 'verse-punctuation hidden', hidden: true };
			}
			
			const currentSectionStartIndex = fullInitials.length - revealedCount;
			const shouldReveal = prevCharInputIndex >= currentSectionStartIndex;
			
			if (!shouldReveal) {
				return { char, className: 'verse-punctuation hidden', hidden: true };
			}
			
			// Punctuation is revealed when its previous character is currently revealed.
			const relativeInputIndex = prevCharInputIndex - currentSectionStartIndex;
			const hasBeenTyped = relativeInputIndex < userInput.length;
			const isNewestRevealedChar = relativeInputIndex === 0;
			const shouldShowNow = hasBeenTyped || isNewestRevealedChar;
			
			return {
				char,
				className: 'verse-punctuation' + (shouldShowNow ? '' : ' hidden'),
				hidden: !shouldShowNow
			};
		}
	}
	
	function handlePhysicalKeyboard(e) {
		if (!verse) return;
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
			
			// Clear previous feedback before adding new input
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			
			// Get expected character (working backward from end)
			const currentSectionStartIndex = fullInitials.length - revealedCount;
			const expectedCharIndex = currentSectionStartIndex + userInput.length;
			const nextExpectedChar = fullInitials[expectedCharIndex];
			
			const normalizedKey = inputMethod === 'pinyin' ? mappedValue.toLowerCase() : mappedValue;
			const normalizedExpected = inputMethod === 'pinyin' 
				? (nextExpectedChar || '').toLowerCase() 
				: (nextExpectedChar || '');
			
			// Check if input is correct
			if (normalizedKey === normalizedExpected) {
				// Correct input - show success feedback
				lastCorrectKey = key; // Use the physical key for highlighting
				phaseInputs++;
				phaseCorrectInputs++;
			} else {
				// Incorrect input
				pressedKey = key; // Use the physical key for highlighting
				correctKey = nextExpectedChar;
				triggerErrorFeedback($settings);
				phaseInputs++;
			}
			
			userInput += mappedValue;

			if (revealedCount === fullInitials.length && userInput.length === revealedCount) {
				completeChallenge();
			}
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="reverse-container">
	<div class="header">
		<button class="back-button" on:click={goBack} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<h2>{t('reverse')}</h2>
		<button class="exit-button" on:click={closeToInitial} aria-label={t('exit')}>✕</button>
	</div>
	
	{#if verse && formatVerseRef}
		<div class="verse-selector-header">
			{formatVerseRef(verse)}
		</div>
	{/if}
	
	<div class="instructions">
		{t('reverse_instructions')}
	</div>
	
	<div class="verse-display">
		{#key userInput}{#key revealedCount}
			{#each fullText.split('') as char, idx}
				{@const rendered = renderCharacter(char, idx)}
				<span class={rendered.className}>{rendered.char}</span>
			{/each}
		{/key}{/key}
	</div>
	
	<div class="navigation-controls" bind:this={navControlsEl}>
		<button class="nav-button next-button {phaseCompleteGlow ? 'glow' : ''}" on:click={advancePhase}>
			←
		</button>
		<button class="nav-button retry-button" on:click={retryPhase}>
			↺
		</button>
		<button class="nav-button prev-button" on:click={previousPhase} disabled={revealedCount <= 1}>
			→
		</button>
	</div>
	
	{#if !showCompletionModal}
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
	{/if}
</div>

{#if showCompletionModal}
	<div class="modal-overlay" on:click={done} on:keydown={(e) => e.key === 'Escape' && done()} role="button" tabindex="0">
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<h3>{t('reverse')} {t('finish')}</h3>
			<p>{t('congratulations_practice')}</p>
			
			{#if finalPhaseInputs > 0}
				<div class="accuracy-display">
					<div class="accuracy-label">{t('accuracy')}</div>
					<div class="accuracy-value">{Math.round((finalPhaseCorrectInputs / finalPhaseInputs) * 100)}%</div>
				</div>
			{/if}
			
			<div class="button-group">
				<button class="secondary-button" on:click={tryAgain}>
					{t('try_again')}
				</button>
				<button class="primary-button" on:click={done}>
					{t('done')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.reverse-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 1rem;
		padding-bottom: 0.5rem;
		gap: 1rem;
	}
	
	.header {
		display: grid;
		grid-template-columns: 40px 1fr 40px;
		align-items: center;
		gap: 0.5rem;
	}

	.back-button,
	.exit-button {
		width: 40px;
		height: 40px;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-color);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.exit-button {
		font-size: 1.5em;
	}
	
	h2 {
		margin: 0;
		font-size: 1.2em;
		text-align: center;
	}
	
	.verse-selector-header {
		text-align: center;
		font-weight: 600;
		color: var(--subtitle-color);
		padding: 0.5rem;
	}
	
	.instructions {
		text-align: center;
		color: var(--subtitle-color);
		font-size: 0.9em;
		padding: 0.5rem;
	}
	
	.verse-display {
		font-size: 1.5em;
		line-height: 1.6;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		min-height: 150px;
		font-weight: 500;
		width: 100%;
		box-sizing: border-box;
	}
	
	.verse-display :global(.verse-character) {
		display: inline-block;
		min-width: 1.2em;
		text-align: center;
		transition: color 0.3s;
	}
	
	.verse-display :global(.verse-character.hidden) {
		opacity: 0;
		pointer-events: none;
	}
	
	.verse-display :global(.verse-character.correct) {
		color: #4CAF50;
	}
	
	.verse-display :global(.verse-character.incorrect) {
		color: #f44336;
	}
	
	.verse-display :global(.verse-blank) {
		display: inline-block;
		min-width: 1.2em;
		text-align: center;
		color: var(--subtitle-color);
		opacity: 0.5;
	}
	
	.verse-display :global(.verse-punctuation) {
		display: inline-block;
		min-width: 0.5em;
		text-align: center;
		color: var(--text-color);
	}
	
	.verse-display :global(.verse-punctuation.hidden) {
		opacity: 0;
		pointer-events: none;
	}
	
	.navigation-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 1rem;
		position: relative;
		z-index: 1;
	}
	
	.nav-button {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--accent-color);
		border-radius: 8px;
		font-size: 1.5em;
		cursor: pointer;
		background: var(--panel-background);
		color: var(--text-color);
		transition: all 0.3s ease;
		min-width: 60px;
	}
	
	.nav-button:hover:not(:disabled) {
		background: var(--accent-color);
		color: white;
		transform: scale(1.05);
	}
	
	.nav-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	.nav-button.glow {
		background: var(--accent-color);
		color: white;
		box-shadow: 0 0 20px var(--accent-color);
		animation: pulse 1s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			box-shadow: 0 0 20px var(--accent-color);
			transform: scale(1);
		}
		50% {
			box-shadow: 0 0 30px var(--accent-color);
			transform: scale(1.05);
		}
	}
	
	.retry-button {
		font-size: 1.8em;
		padding: 0.6rem 1.2rem;
	}
	
	.keyboard-space {
		height: 250px;
		flex-shrink: 0;
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
		z-index: 1002;
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
	}
	
	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}
	
	.primary-button,
	.secondary-button {
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
	
	.primary-button:active,
	.secondary-button:active {
		transform: scale(0.98);
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
	
	@media (max-width: 767px) {
		.reverse-container {
			padding: 0.5rem;
			padding-bottom: 0.5rem;
		}
		
		.verse-display {
			padding: 1rem;
			font-size: 1.3em;
		}
		
		.navigation-controls {
			gap: 1rem;
			padding: 0.5rem;
		}

		.keyboard-space {
			height: 240px;
		}
		
		.nav-button {
			padding: 0.6rem 1.2rem;
			font-size: 1.3em;
			min-width: 50px;
		}
	}
	
</style>
