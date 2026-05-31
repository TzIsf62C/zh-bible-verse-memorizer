<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { verses as versesStore } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';

	export let collection;
	export let verses = [];

	const dispatch = createEventDispatcher();

	// Progression state
	let currentSubsetSize = 1; // Start with 1 verse (last verse only)
	let userInput = '';
	
	// Verse data
	let fullText = '';
	let fullInitials = '';
	let charToInputIndex = [];
	
	// Keyboard feedback
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;
	let phaseCompleteGlow = false; // For arrow glow effect
	
	// Accuracy tracking
	let totalInputs = 0;
	let correctInputs = 0;
	let finalPhaseTotalInputs = 0;
	let finalPhaseCorrectInputs = 0;
	
	// Completion modal
	let showCompletionModal = false;
	
	// Viewport scrolling
	let viewportAnchor;
	let scrollTrigger = 0;
	
	// Get current subset of verses (last N verses)
	$: currentSubset = verses.slice(verses.length - currentSubsetSize);
	
	// Build full text whenever subset changes
	$: {
		if (currentSubset.length > 0) {
			buildFullText();
		}
	}
	
	// Update keyboard layout based on next character
	$: {
		const nextCharIndex = userInput.length;
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
	
	// Check if subset is complete (for Next button)
	$: isSubsetComplete = userInput.length === fullInitials.length;
	$: isLastSubset = currentSubsetSize === verses.length;
	
	// Check if current phase is complete (for glow effect)
	$: {
		if (userInput.length === fullInitials.length && !isLastSubset) {
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
	
	// Scroll viewport to position content above keyboard
	$: {
		if (viewportAnchor) {
			const _ = scrollTrigger;
			const __ = userInput.length;
			
			setTimeout(() => {
				if (isSubsetComplete || showCompletionModal) return;
				scrollNextHiddenCharacterIntoView();
			}, 120);
		}
	}

	function scrollNextHiddenCharacterIntoView() {
		const keyboard = document.querySelector('.reverse-by-verse-container .keyboard-space .keyboard');
		if (!keyboard) return;

		const verseDisplay = document.querySelector('.reverse-by-verse-container .verse-display');
		if (!verseDisplay) return;

		const nextInputIndex = userInput.length;
		const charIndex = charToInputIndex.findIndex((value) => value === nextInputIndex);
		if (charIndex === -1) return;

		const nextHiddenChar = verseDisplay.querySelector(`span:nth-child(${charIndex + 1})`);
		if (!nextHiddenChar) return;

		const keyboardRect = keyboard.getBoundingClientRect();
		const charRect = nextHiddenChar.getBoundingClientRect();
		const visibleTop = 0;
		const visibleBottom = Math.min(window.innerHeight, keyboardRect.top) - 12;

		const overlapsTop = charRect.top < visibleTop;
		const overlapsBottom = charRect.bottom > visibleBottom;
		if (!overlapsTop && !overlapsBottom) return;

		const visibleCenter = (visibleTop + visibleBottom) / 2;
		const charCenter = charRect.top + (charRect.height / 2);
		const scrollDelta = charCenter - visibleCenter;

		if (Math.abs(scrollDelta) > 2) {
			window.scrollTo({
				top: window.scrollY + scrollDelta,
				behavior: 'smooth'
			});
		}
	}
	
	function buildFullText() {
		// Use same reference abbreviation strategy as SpeedChallengeCollection
		const allSameBook = currentSubset.every(v => v.bookName === currentSubset[0].bookName);
		const allSameChapter = allSameBook && currentSubset.every(v => v.chapterNumber === currentSubset[0].chapterNumber);
		
		let text = '';
		let initials = '';
		const charMap = [];
		let inputIdx = 0;
		
		currentSubset.forEach((verse, vIdx) => {
			// Determine reference text based on position and strategy
			let refText;
			if (vIdx === 0) {
				// First verse in subset always gets full reference
				refText = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber} `;
			} else if (allSameChapter) {
				// Same chapter: just verse number
				refText = `${verse.verseNumber} `;
			} else if (allSameBook) {
				// Same book, different chapters: chapter:verse
				refText = `${verse.chapterNumber}:${verse.verseNumber} `;
			} else {
				// Different books: full reference
				refText = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber} `;
			}
			
			// Add reference characters to charMap (auto-reveal, no input needed)
			for (let i = 0; i < refText.length; i++) {
				charMap.push(null);
			}
			
			// Add verse text characters
			for (let i = 0; i < verse.verseText.length; i++) {
				if (/[\u4e00-\u9fa5]/.test(verse.verseText[i]) || /[0-9]/.test(verse.verseText[i])) {
					charMap.push(inputIdx);
					inputIdx++;
				} else {
					charMap.push(null);
				}
			}
			
			// Build fullText and fullInitials
			if (vIdx < currentSubset.length - 1) {
				text += refText + verse.verseText + ' ';
				initials += verse.verseInitials;
				charMap.push(null); // Space between verses
			} else {
				text += refText + verse.verseText;
				initials += verse.verseInitials;
			}
		});
		
		fullText = text;
		fullInitials = initials;
		charToInputIndex = charMap;
	}
	
	function handleKeyInput(event) {
		const key = event.detail;
		
		// Clear previous feedback
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		
		// Get expected character
		const inputMethod = $settings.inputMethod || 'pinyin';
		const nextExpectedChar = fullInitials[userInput.length];
		const normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
		const normalizedExpected = inputMethod === 'pinyin' 
			? (nextExpectedChar || '').toLowerCase() 
			: (nextExpectedChar || '');
		
		if (normalizedKey === normalizedExpected) {
			// Correct
			lastCorrectKey = key;
			userInput += key;
			totalInputs++;
			correctInputs++;
			if (isLastSubset) {
				finalPhaseTotalInputs++;
				finalPhaseCorrectInputs++;
			}
		} else {
			// Incorrect
			pressedKey = key;
			correctKey = nextExpectedChar;
			triggerErrorFeedback($settings);
			
			// Still add to input
			userInput += key;
			totalInputs++;
			if (isLastSubset) {
				finalPhaseTotalInputs++;
			}
		}
		
		// Trigger scroll
		scrollTrigger++;
		
		// Check if all verses complete
		if (isLastSubset && userInput.length === fullInitials.length) {
			completeChallenge();
		}
	}
	
	function handlePhysicalKeyboard(e) {
		if (!currentSubset || currentSubset.length === 0) return;
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
			const nextExpectedChar = fullInitials[userInput.length];
			const normalizedKey = inputMethod === 'pinyin' ? mappedValue.toLowerCase() : mappedValue;
			const normalizedExpected = inputMethod === 'pinyin' 
				? (nextExpectedChar || '').toLowerCase() 
				: (nextExpectedChar || '');
			
			if (normalizedKey === normalizedExpected) {
				// Correct
				lastCorrectKey = key;
				totalInputs++;
				correctInputs++;
				if (isLastSubset) {
					finalPhaseTotalInputs++;
					finalPhaseCorrectInputs++;
				}
			} else {
				// Incorrect
				pressedKey = key;
				correctKey = nextExpectedChar;
				triggerErrorFeedback($settings);
				totalInputs++;
				if (isLastSubset) {
					finalPhaseTotalInputs++;
				}
			}
			
			userInput += mappedValue;
			scrollTrigger++;
			
			// Check if complete
			if (isLastSubset && userInput.length === fullInitials.length) {
				completeChallenge();
			}
		}
	}
	
	function advancePhase() {
		if (currentSubsetSize < verses.length) {
			const nextSubsetSize = currentSubsetSize + 1;
			if (nextSubsetSize === verses.length) {
				finalPhaseTotalInputs = 0;
				finalPhaseCorrectInputs = 0;
			}
			currentSubsetSize++;
			userInput = '';
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			scrollTrigger++;
		} else if (currentSubsetSize === verses.length && userInput.length === fullInitials.length) {
			// All phases complete
			completeChallenge();
		}
	}
	
	function previousPhase() {
		if (currentSubsetSize > 1) {
			currentSubsetSize--;
			userInput = '';
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			scrollTrigger++;
		}
	}
	
	function retryPhase() {
		userInput = '';
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		if (isLastSubset) {
			finalPhaseTotalInputs = 0;
			finalPhaseCorrectInputs = 0;
		}
	}
	
	function completeChallenge() {
		showCompletionModal = true;
	}
	
	function tryAgain() {
		showCompletionModal = false;
		currentSubsetSize = 1;
		userInput = '';
		totalInputs = 0;
		correctInputs = 0;
		finalPhaseTotalInputs = 0;
		finalPhaseCorrectInputs = 0;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
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
		currentSubsetSize = 1;
		userInput = '';
		totalInputs = 0;
		correctInputs = 0;
		finalPhaseTotalInputs = 0;
		finalPhaseCorrectInputs = 0;
		showCompletionModal = false;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		phaseCompleteGlow = false;
		exit();
	}
	
	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];
		
		if (map !== null) {
			// Character requires input
			const inputMethod = $settings.inputMethod || 'pinyin';
			let className = 'verse-character';
			
			if (userInput.length > map) {
				// Character has been typed
				const typedChar = inputMethod === 'pinyin' 
					? userInput[map].toLowerCase() 
					: userInput[map];
				const expectedChar = inputMethod === 'pinyin' 
					? fullInitials[map].toLowerCase() 
					: fullInitials[map];
				const isCorrect = typedChar === expectedChar;
				
				return { 
					char, 
					className: className + (isCorrect ? ' correct' : ' incorrect'), 
					hidden: false 
				};
			}
			return { char, className: className + ' hidden', hidden: true };
		} else {
			// Punctuation/reference - reveal based on previous character
			let prevCharInputIndex = null;
			for (let i = charIndex - 1; i >= 0; i--) {
				if (charToInputIndex[i] !== null) {
					prevCharInputIndex = charToInputIndex[i];
					break;
				}
			}
			
			// If no previous input char, always reveal
			// Otherwise, reveal when past the previous input character
			const shouldReveal = prevCharInputIndex === null 
				? true 
				: userInput.length > prevCharInputIndex;
			return {
				char,
				className: 'verse-punctuation' + (shouldReveal ? '' : ' hidden'),
				hidden: !shouldReveal
			};
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="reverse-by-verse-container">
	<div class="header">
		<button class="back-button" on:click={goBack} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<h2>{t('reverse_by_verse')}</h2>
		<button class="exit-button" on:click={closeToInitial} aria-label={t('exit')}>✕</button>
	</div>
	
	{#if collection}
		<div class="collection-header">
			{collection.title}
		</div>
	{/if}
	
	<div class="progress-indicator">
		{t('verses')}: {currentSubsetSize} / {verses.length}
	</div>
	
	<div class="verse-display">
		{#key currentSubsetSize}{#key userInput.length}
			{#each fullText.split('') as char, idx}
				{@const rendered = renderCharacter(char, idx)}
				<span class={rendered.className}>{rendered.char}</span>
			{/each}
		{/key}{/key}
	</div>
	

	<div class="navigation-controls">
		<button class="nav-button next-button {phaseCompleteGlow ? 'glow' : ''}" on:click={advancePhase}>
			←
		</button>
		<button class="nav-button retry-button" on:click={retryPhase}>
			↺
		</button>
		<button class="nav-button prev-button" on:click={previousPhase} disabled={currentSubsetSize <= 1}>
			→
		</button>
	</div>

	<div class="nav-bottom-spacer" aria-hidden="true"></div>
	
	<!-- Invisible viewport anchor for keyboard positioning -->
	<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>
	
	{#if !isSubsetComplete}
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
			<h3>{t('reverse_by_verse')} {t('finish')}</h3>
			<p>{t('congratulations_practice')}</p>
			
			{#if finalPhaseTotalInputs > 0}
				<div class="accuracy-display">
					<div class="accuracy-label">{t('accuracy')}</div>
					<div class="accuracy-value">{Math.round((finalPhaseCorrectInputs / finalPhaseTotalInputs) * 100)}%</div>
					<div class="accuracy-detail">{finalPhaseCorrectInputs} / {finalPhaseTotalInputs} {t('correct')}</div>
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
	.reverse-by-verse-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 1rem;
		padding-bottom: 12rem;
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
	
	.collection-header {
		text-align: center;
		font-weight: 600;
		color: var(--subtitle-color);
		padding: 0.5rem;
	}
	
	.progress-indicator {
		text-align: center;
		color: var(--subtitle-color);
		font-size: 0.9em;
		padding: 0.25rem;
	}
	
	.verse-display {
		font-size: 1.5em;
		line-height: 1.6;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
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
		margin-top: auto;
	}

	.nav-bottom-spacer {
		height: 360px;
	}
	
	.viewport-anchor {
		height: 1px;
		width: 100%;
		visibility: hidden;
		pointer-events: none;
		margin: 0;
		padding: 0;
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
	
	.accuracy-detail {
		font-size: 0.9em;
		color: var(--subtitle-color);
	}
	
	@media (max-width: 767px) {
		.reverse-by-verse-container {
			padding: 0.5rem;
			padding-bottom: 10rem;
		}
		
		.verse-display {
			padding: 1rem;
		}
	}
</style>
