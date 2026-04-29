<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';

	export let verse;

	const dispatch = createEventDispatcher();

	// Input state
	let userInput = '';
	let verseInitials = '';
	let charToInputIndex = [];
	let isComplete = false;
	
	// Keyboard feedback (always show as correct during typing)
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let lastCorrectKey = null;
	
	// Completion state
	let showResult = false;
	let accuracyScore = 0;
	let correctCount = 0;
	let totalCount = 0;
	
	// Verse reference formatter
	$: formatVerseRef = createVerseReferenceFormatter($verses);
	
	// Build character to input index mapping
	$: {
		if (verse) {
			verseInitials = verse.verseInitials;
			
			// Build char to input index mapping (skip punctuation)
			const charMap = [];
			let inputIdx = 0;
			
			for (let i = 0; i < verse.verseText.length; i++) {
				const char = verse.verseText[i];
				if (/[\u4e00-\u9fa5]/.test(char) || /[0-9]/.test(char)) {
					charMap.push(inputIdx);
					inputIdx++;
				} else {
					charMap.push(null); // Punctuation - no input needed
				}
			}
			
			charToInputIndex = charMap;
		}
	}
	
	// Update keyboard layout based on next character
	$: {
		const nextCharIndex = userInput.length;
		const isNextCharNumber = nextCharIndex < verseInitials.length && /[0-9]/.test(verseInitials[nextCharIndex]);
		
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
	
	function handleKeyInput(event) {
		if (isComplete) return;
		
		const key = event.detail;
		
		// Always show as "correct" during typing (user gets no feedback)
		lastCorrectKey = key;
		userInput += key;
	}
	
	function completeChallenge() {
		isComplete = true;
		
		// Calculate accuracy
		const inputMethod = $settings.inputMethod || 'pinyin';
		correctCount = 0;
		totalCount = verseInitials.length;
		
		for (let i = 0; i < verseInitials.length; i++) {
			const typedChar = inputMethod === 'pinyin' 
				? userInput[i].toLowerCase() 
				: userInput[i];
			const expectedChar = inputMethod === 'pinyin' 
				? verseInitials[i].toLowerCase() 
				: verseInitials[i];
			
			if (typedChar === expectedChar) {
				correctCount++;
			}
		}
		
		accuracyScore = Math.round((correctCount / totalCount) * 100);
		showResult = true;
	}
	
	function submitAnswer() {
		if (userInput.length === 0) return;
		completeChallenge();
	}
	
	function tryAgain() {
		showResult = false;
		userInput = '';
		isComplete = false;
		lastCorrectKey = null;
		accuracyScore = 0;
		correctCount = 0;
		totalCount = 0;
	}
	
	function done() {
		dispatch('complete');
	}
	
	function exit() {
		dispatch('exit');
	}
	
	function renderCharacter(char, charIndex) {
		const inputMethod = $settings.inputMethod || 'pinyin';
		const map = charToInputIndex[charIndex];
		
		// Punctuation - hidden during typing, visible after completion
		if (map === null) {
			if (!isComplete) {
				return { char, className: 'verse-punctuation hidden' };
			}
			return { char, className: 'verse-punctuation' };
		}
		
		if (!isComplete) {
			// During typing - show asterisks for typed characters
			if (map < userInput.length) {
				return { char: '*', className: 'verse-hidden' };
			} else {
				return { char, className: 'verse-character hidden' };
			}
		} else {
			// After completion - show actual characters with color coding
			const typedChar = inputMethod === 'pinyin' 
				? userInput[map].toLowerCase() 
				: userInput[map];
			const expectedChar = inputMethod === 'pinyin' 
				? verseInitials[map].toLowerCase() 
				: verseInitials[map];
			const isCorrect = typedChar === expectedChar;
			
			return { 
				char, 
				className: 'verse-character' + (isCorrect ? ' correct' : ' incorrect') 
			};
		}
	}
	
	function handlePhysicalKeyboard(e) {
		if (!verse) return;
		if (isComplete) return;

		// Backspace is disabled
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
			
			// Always show as "correct" during typing
			lastCorrectKey = key;
			userInput += mappedValue;
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="blind-challenge-container">
	<div class="header">
		<button class="exit-button" on:click={exit}>✕</button>
		<h2>{t('blind_challenge')}</h2>
		<div class="spacer"></div>
	</div>
	
	{#if verse && formatVerseRef}
		<div class="verse-selector-header">
			{formatVerseRef(verse)}
		</div>
	{/if}
	
	<div class="instructions">
		{t('blind_challenge_instructions')}
	</div>
	
	<div class="verse-display">
		{#key userInput}{#key isComplete}
			{#each verse.verseText.split('') as char, idx}
				{@const rendered = renderCharacter(char, idx)}
				<span class={rendered.className}>{rendered.char}</span>
			{/each}
		{/key}{/key}
	</div>
	
	{#if showResult}
		<div class="result-panel">
			<div class="accuracy-display">
				{t('accuracy')}: {accuracyScore}%
			</div>
			<button class="retry-button" on:click={tryAgain}>
				↺
			</button>
		</div>
	{/if}
	
	{#if !showResult}
		<button class="submit-button" on:click={submitAnswer} disabled={userInput.length === 0}>
			{t('submit')}
		</button>
		
		<div class="keyboard-space">
			<Keyboard 
				layout={keyboardLayout}
				on:key={handleKeyInput}
				showBackspace={false}
				showEnter={false}
				isNumeric={isNumericKeyboard}
				pressedKey={null}
				correctKey={null}
				lastCorrectKey={lastCorrectKey}
			/>
		</div>
	{/if}
</div>

<style>
	.blind-challenge-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: 1rem;
		gap: 1rem;
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
	
	.spacer {
		min-width: 40px;
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
		min-height: 150px;
		max-height: 300px;
		font-size: 1.5em;
		line-height: 1.8;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		overflow-y: auto;
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: center;
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
	
	.verse-display :global(.verse-hidden) {
		display: inline-block;
		min-width: 1.2em;
		text-align: center;
		color: var(--subtitle-color);
		font-size: 0.8em;
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
	
	.result-panel {
		display: flex;
		align-items: center;
		justify-content: space-between;
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
	
	.keyboard-space {
		margin-top: auto;
	}
	
	.submit-button {
		width: 100%;
		padding: 0.875rem;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		background: var(--accent-color);
		color: white;
		transition: opacity 0.2s;
	}
	
	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	@media (max-width: 767px) {
		.blind-challenge-container {
			padding: 0.5rem;
		}
		
		.verse-display {
			padding: 1rem;
			font-size: 1.3em;
		}
	}
</style>
