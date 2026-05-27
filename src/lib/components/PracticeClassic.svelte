<script>
	import { createEventDispatcher } from 'svelte';
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

	// Practice state
	let currentStage = 'basic'; //  'basic' | 'intermediate' | 'advanced'
	let intermediateVariant = 'odd'; // 'odd' | 'even' - for toggling intermediate mode
	let userInput = '';
	let accuracy = 0;
	let showResult = false;
	let verseSelectorOpacity = 1;
	
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
	let viewportAnchor; // Element to scroll into view for keyboard positioning
	let scrollTrigger = 0; // Increment this to trigger viewport scroll
	
	// Verse reference formatter
	$: formatVerseRef = createVerseReferenceFormatter($verses);
	
	// Build verse data
	$: {
		if (verse) {
			buildVerseData();
		}
	}
	
	// Update keyboard layout
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
	
	// Reset when stage changes
	$: {
		const _ = currentStage;
		userInput = '';
		showResult = false;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
	}
	
	// Fade out verse reference header as user types
	$: {
		const totalInputsRequired = fullInitials.length;
		const typedRatio = totalInputsRequired > 0 ? (userInput.length / totalInputsRequired) : 0;
		
		if (currentStage === 'intermediate' || currentStage === 'advanced') {
			// No fade below 25%, fully invisible at 50% or above
			if (typedRatio <= 0.25) {
				verseSelectorOpacity = 1;
			} else if (typedRatio >= 0.5) {
				verseSelectorOpacity = 0;
			} else {
				// Linear fade from 1 -> 0 as typedRatio goes 0.25 -> 0.5
				verseSelectorOpacity = 1 - (typedRatio - 0.25) / 0.25;
			}
		} else {
			// Ensure fully visible in basic mode
			verseSelectorOpacity = 1;
		}
	}
	
	// Scroll viewport to position content above keyboard
	$: {
		if (viewportAnchor && verse && !showResult) {
			// Include scrollTrigger in reactive dependencies
			const _ = scrollTrigger;
			
			setTimeout(() => {
				if (!viewportAnchor) return;
				
				// Get keyboard height (fixed at bottom of viewport)
				const keyboardEl = document.querySelector('.keyboard');
				if (!keyboardEl) return;
				
				const keyboardHeight = keyboardEl.offsetHeight;
				const viewportHeight = window.innerHeight;
				const anchorRect = viewportAnchor.getBoundingClientRect();
				
				// Calculate target position: anchor should be above the keyboard with 20px margin
				const targetAnchorPosition = viewportHeight - keyboardHeight - 20;
				
				// Calculate scroll adjustment needed
				const scrollAdjustment = anchorRect.top - targetAnchorPosition;
				
				// Only scroll if anchor would be hidden behind keyboard
				if (scrollAdjustment > 0) {
					window.scrollTo({
						top: window.scrollY + scrollAdjustment,
						behavior: 'smooth'
					});
				}
			}, 500); // Delay to ensure keyboard is rendered
		}
	}
	
	function toggleIntermediateVariant() {
		intermediateVariant = intermediateVariant === 'odd' ? 'even' : 'odd';
		userInput = '';
		showResult = false;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
	}
	
	function buildVerseData() {
		// Combine verse text and reference like LearningFlow: text first, then newline, then reference
		fullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
		fullInitials = `${verse.verseInitials}${verse.bookInitials}${verse.chapterNumber}${verse.verseNumber}`;
		
		// Build character to input mapping
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
		} else {
			// Incorrect
			pressedKey = key;
			correctKey = nextExpectedChar;
			triggerErrorFeedback($settings);
			userInput += key;
		}
		
		// Check if complete
		if (userInput.length === fullInitials.length) {
			checkAnswer();
		}
	}
	
	
	function selectStage(stage) {
		currentStage = stage;
	}

	function exit() {
		dispatch('exit');
	}

	function goBack() {
		dispatch('back');
	}

	function closeToInitial() {
		currentStage = 'basic';
		intermediateVariant = 'odd';
		userInput = '';
		accuracy = 0;
		showResult = false;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		exit();
	}
	
	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];

		if (map !== null) {
			// Input-requiring character (Chinese or digit)
			const expected = fullInitials[map];
			let className = 'verse-character';
			let hidden = false;
			let intermediateHidden = false;

			// Determine visibility based on stage
			if (currentStage === 'intermediate') {
				const isOdd = ((map + 1) % 2) === 1;
				const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
				if (!visibleByVariant) {
					hidden = true;
					intermediateHidden = true;
				}
			} else if (currentStage === 'advanced') {
				hidden = true;
			}

			// If hidden, only reveal when user has typed that index
			if (hidden) {
				if (userInput.length > map) {
					const inputMethod = $settings.inputMethod || 'pinyin';
					const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
					const expectedChar = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
					const isCorrect = typedChar === expectedChar;
					return { char, className: className + (isCorrect ? ' correct' : ' incorrect'), hidden: false, intermediateHidden: false };
				} else {
					// Return different hidden state for intermediate vs advanced
					if (intermediateHidden) {
						return { char, className: className + ' intermediate-hidden', hidden: true, intermediateHidden: true };
					} else {
						return { char, className: className + ' hidden', hidden: true, intermediateHidden: false };
					}
				}
			}

			// Not hidden: mark correct/incorrect if user has typed
			if (userInput.length > map) {
				const inputMethod = $settings.inputMethod || 'pinyin';
				const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
				const expectedChar = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
				const isCorrect = typedChar === expectedChar;
				className += isCorrect ? ' correct' : ' incorrect';
			}

			return { char, className, hidden: false, intermediateHidden: false };
		} else {
			// Punctuation/whitespace - complex visibility logic from LearningFlow
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

			// Show initial punctuation immediately in all modes
			if (isInitialPunct) {
				shown = true;
				className = 'verse-character correct'; // Initial punctuation always shown as correct (white)
			}

			// Stage-specific logic for non-initial punctuation
			if (!isInitialPunct) {
				if (currentStage === 'basic') {
					// Basic mode: show all punctuation, but only turn white after preceding char is typed
					shown = true;
					if (prevMap !== null && userInput.length > prevMap) {
						className = 'verse-character punctuation correct';
					} else {
						className = 'verse-character punctuation';
					}
				} else if (currentStage === 'intermediate') {
					// Intermediate: show if previous char is visible OR user has typed past it
					const isOdd = ((prevMap + 1) % 2) === 1;
					const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
					if (visibleByVariant || (prevMap !== null && userInput.length > prevMap)) {
						shown = true;
						// Inherit opacity from preceding character
						if (prevMap !== null && userInput.length > prevMap) {
							className = 'verse-character punctuation correct';
						} else {
							// Preceding char is visible but not typed yet - use default opacity
							className = 'verse-character punctuation';
						}
					}
				} else if (currentStage === 'advanced') {
					// Advanced: only show when user has typed past preceding character
					if (prevMap !== null && userInput.length > prevMap) {
						shown = true;
						// Punctuation appears as correct (white) when revealed
						className = 'verse-character punctuation correct';
					} else {
						// Not yet revealed - hide with opacity: 0
						shown = false;
						className = 'verse-character punctuation hidden';
					}
				}
			}

			return { char, className, hidden: !shown };
		}
	}
	
	function handlePhysicalKeyboard(e) {
		if (!verse) return;
		if (showResult) return;

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
			
			// Determine what the expected key is at this position
			const nextExpectedChar = fullInitials[userInput.length];
			const normalizedKey = inputMethod === 'pinyin' ? mappedValue.toLowerCase() : mappedValue;
			const normalizedExpected = inputMethod === 'pinyin' ? (nextExpectedChar || '').toLowerCase() : (nextExpectedChar || '');
			
			// Check if input is correct
			if (normalizedKey === normalizedExpected) {
				// Correct input - show success feedback
				lastCorrectKey = key; // Use the physical key for highlighting
			} else {
				// Incorrect input - show error feedback
				pressedKey = key; // Use the physical key for highlighting
				correctKey = nextExpectedChar;
				triggerErrorFeedback($settings);
			}
			
			userInput += mappedValue;
			
			if (userInput.length === fullInitials.length) {
				checkAnswer();
			}
		}
	}
	
	function checkAnswer() {
		// Calculate accuracy
		let correct = 0;
		const inputMethod = $settings.inputMethod || 'pinyin';
		
		for (let i = 0; i < fullInitials.length; i++) {
			const typed = inputMethod === 'pinyin' ? userInput[i].toLowerCase() : userInput[i];
			const expected = inputMethod === 'pinyin' ? fullInitials[i].toLowerCase() : fullInitials[i];
			if (typed === expected) {
				correct++;
			}
		}
		
		accuracy = Math.round((correct / fullInitials.length) * 100);
		showResult = true;

		if (currentStage === 'advanced' && accuracy >= 90) {
			dispatch('advancedcomplete');
		}
	}
	
	function retry() {
		// In intermediate mode, toggle variant on retry
		if (currentStage === 'intermediate') {
			intermediateVariant = intermediateVariant === 'odd' ? 'even' : 'odd';
		}
		userInput = '';
		showResult = false;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		scrollTrigger++; // Re-trigger autoscroll after retry
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="practice-classic-container">
	<div class="header">
		<button class="back-button" on:click={goBack} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<h2>{t('classic')} - {t('practice')}</h2>
		<button class="exit-button" on:click={closeToInitial} aria-label={t('exit')}>✕</button>
	</div>
	
	<div class="stage-selector">
		<button 
			class="stage-button" 
			class:active={currentStage === 'basic'}
			on:click={() => selectStage('basic')}
		>
			{t('basic')}
		</button>
		<button 
			class="stage-button" 
			class:active={currentStage === 'intermediate'}
			on:click={() => {
				if (currentStage === 'intermediate') {
					toggleIntermediateVariant();
				} else {
					selectStage('intermediate');
				}
			}}
		>
			{t('intermediate')}
		</button>
		<button 
			class="stage-button" 
			class:active={currentStage === 'advanced'}
			on:click={() => selectStage('advanced')}
		>
			{t('advanced')}
		</button>
	</div>
	
	<!-- Verse Reference Header (fades out as user types) -->
	{#if verse && formatVerseRef}
		<div 
			class="verse-reference-header" 
			style="opacity: {verseSelectorOpacity}; transition: opacity 0.3s ease;"
		>
			{formatVerseRef(verse)}
		</div>
	{/if}
	
	{#key `${currentStage}-${intermediateVariant}-${userInput.length}`}
		<div class="verse-display">
			{#each fullText.split('') as char, idx}
				{@const rendered = renderCharacter(char, idx)}
				{#if rendered.hidden}
					{#if rendered.intermediateHidden}
						<!-- Intermediate mode: show full-width low line for hidden characters -->
						<span class={rendered.className}>＿</span>
					{:else}
						<!-- Advanced mode: render character invisibly to maintain layout -->
						<span class={rendered.className}>{rendered.char}</span>
					{/if}
				{:else}
					<span class={rendered.className}>{rendered.char}</span>
				{/if}
			{/each}
		</div>
	{/key}
	
	{#if showResult}
		<div class="result-panel">
			<div class="accuracy-display">
				{t('accuracy')}: {accuracy}%
			</div>
			<button class="retry-button" on:click={retry}>
				↺
			</button>
		</div>
	{/if}
	
	<!-- Invisible viewport anchor for keyboard positioning -->
	<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>
	
	{#if !showResult}
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

<style>
	.practice-classic-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: 1rem;
		overflow-y: auto;
	}
	
	.header {
		display: grid;
		grid-template-columns: 40px 1fr 40px;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
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
	
	.stage-selector {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 1.5rem;
	}
	
	.stage-button {
		padding: 0.5rem 1rem;
		background: var(--panel-background);
		border: 2px solid var(--border-color);
		border-radius: 6px;
		cursor: pointer;
		color: var(--text-color);
		transition: all 0.2s;
	}
	
	.stage-button.active {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}
	
	.verse-reference-header {
		text-align: center;
		font-size: 1em;
		font-weight: 500;
		color: var(--text-color);
		margin-bottom: 1rem;
		padding: 0.5rem;
	}
	
	.verse-display {
		font-size: 1.5em;
		line-height: 2;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		margin-bottom: 1rem;
		min-height: 150px;
		font-weight: 500;
		white-space: pre-line; /* Preserve newlines between verse text and reference */
		width: 100%;
		box-sizing: border-box;
	}
	
	:global(.verse-character) {
		display: inline;
		transition: all 0.3s;
		opacity: 0.5;
	}
	
	:global(.verse-character.correct) {
		color: var(--correct-color);
		opacity: 1;
	}
	
	:global(.verse-character.incorrect) {
		color: var(--error-color);
		opacity: 1;
	}
	
	:global(.verse-character.punctuation) {
		/* Punctuation inherits opacity from preceding character */
		opacity: 0.5;
	}
	
	:global(.verse-character.punctuation.correct) {
		/* When punctuation is revealed (preceding char typed), show as white */
		color: var(--correct-color);
		opacity: 1;
	}
	
	:global(.verse-character.hidden) {
		/* Advanced mode: completely invisible but still takes up space */
		opacity: 0;
		pointer-events: none;
	}
	
	:global(.verse-character.intermediate-hidden) {
		/* Intermediate mode: show underscore placeholder */
		visibility: visible;
		opacity: 0.5;
		color: var(--text-color);
	}
	
	.result-panel {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--panel-background);
		border-radius: 8px;
		margin-bottom: 1rem;
	}
	
	.accuracy-display {
		font-size: 1.3em;
		font-weight: 600;
		color: var(--accent-color);
	}
	
	.retry-button {
		padding: 0.5rem 0.75rem;
		border: none;
		border-radius: 6px;
		font-size: 1.5em;
		cursor: pointer;
		background: var(--accent-color);
		color: white;
		line-height: 1;
	}
	
	.viewport-anchor {
		height: 0;
		overflow: hidden;
	}
	
	.keyboard-space {
		margin-top: auto;
	}
	
	
	
	
	@media (max-width: 767px) {
		.practice-classic-container {
			padding: 0.5rem;
		}
		
		.verse-display {
			padding: 1rem;
		}
		
		.stage-button {
			padding: 0.4rem 0.75rem;
			font-size: 0.9em;
		}
	}
</style>
