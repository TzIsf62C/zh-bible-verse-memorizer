<script>
	import { createEventDispatcher, onMount } from 'svelte';
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
	let verseCharacters = []; // Array of Chinese characters (excluding punctuation)
	let isComplete = false;
	
	// Keyboard feedback (always show as correct during typing)
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let lastCorrectKey = null;
	
	// Completion state
	let showResult = false;
	let accuracyScore = 0;
	let alignmentData = null; // Stores the alignment result for display

	// Verse reference formatter
	$: formatVerseRef = createVerseReferenceFormatter($verses);

	// Build verse data
	$: {
		if (verse) {
			verseInitials = verse.verseInitials;

			// Extract trackable characters for alignment display
			verseCharacters = [];
			for (let i = 0; i < verse.verseText.length; i++) {
				const char = verse.verseText[i];
				if (/[\u4e00-\u9fa5]/.test(char) || /[0-9]/.test(char)) {
					verseCharacters.push(char);
				}
			}
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

	function isTrackableCharacter(char) {
		return /[\u4e00-\u9fa5]/.test(char) || /[0-9]/.test(char);
	}

	function injectPunctuationIntoAlignment(baseAlignment, verseText) {
		if (!Array.isArray(baseAlignment)) return [];

		// Bucket punctuation by how many trackable chars have been consumed so far.
		const punctuationAfterTrackableCount = {};
		let trackableSeen = 0;
		for (const char of [...verseText]) {
			if (isTrackableCharacter(char)) {
				trackableSeen++;
				continue;
			}
			if (!punctuationAfterTrackableCount[trackableSeen]) {
				punctuationAfterTrackableCount[trackableSeen] = [];
			}
			punctuationAfterTrackableCount[trackableSeen].push(char);
		}

		const output = [];
		let trackableConsumed = 0;

		const appendPunctuationForCount = (count) => {
			const punctuationChars = punctuationAfterTrackableCount[count] || [];
			for (const punctuationChar of punctuationChars) {
				output.push({
					type: 'punctuation',
					expectedChar: punctuationChar,
					expectedOriginal: punctuationChar,
					userChar: punctuationChar,
					userOriginal: punctuationChar,
					verseChar: punctuationChar
				});
			}
		};

		appendPunctuationForCount(0);

		for (const item of baseAlignment) {
			if (item.type === 'insertion') {
				// Keep insertion exactly where alignment placed it.
				output.push(item);
				continue;
			}

			output.push(item);
			trackableConsumed++;
			appendPunctuationForCount(trackableConsumed);
		}

		return output;
	}

	function keepTypingAreaVisible(behavior = 'smooth') {
		if (showResult || isComplete) return;

		const keyboard = document.querySelector('.blind-challenge-container .keyboard-space .keyboard');
		const submitButton = document.querySelector('.blind-challenge-container .submit-button');
		const inputDisplay = document.querySelector('.blind-challenge-container .input-display');
		if (!keyboard || !submitButton || !inputDisplay) return;

		const keyboardRect = keyboard.getBoundingClientRect();
		const submitRect = submitButton.getBoundingClientRect();
		const inputRect = inputDisplay.getBoundingClientRect();
		const buffer = 16;
		const targetBottom = Math.max(submitRect.bottom, inputRect.bottom);

		if (targetBottom > keyboardRect.top - buffer) {
			const scrollDelta = targetBottom - (keyboardRect.top - buffer);
			window.scrollTo({
				top: window.scrollY + scrollDelta,
				behavior
			});
		}

		inputDisplay.scrollTop = inputDisplay.scrollHeight;
	}

	onMount(() => {
		setTimeout(() => keepTypingAreaVisible('auto'), 250);
	});

	$: {
		const _ = userInput.length;
		if (!showResult && !isComplete) {
			setTimeout(() => keepTypingAreaVisible('smooth'), 0);
		}
	}
	
	/**
	 * Align user input with expected verse initials using edit distance algorithm
	 * Returns alignment data showing matches, mismatches, insertions, deletions
	 */
	function alignStrings(expected, userTyped, inputMethod) {
		// Normalize for comparison
		const normalize = (str) => inputMethod === 'pinyin' ? str.toLowerCase() : str;
		const exp = normalize(expected);
		const usr = normalize(userTyped);
		
		const m = exp.length;
		const n = usr.length;
		
		// Dynamic programming table for edit distance
		const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
		const ops = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));
		
		// Initialize base cases
		for (let i = 0; i <= m; i++) {
			dp[i][0] = i; // Deletions
			ops[i][0] = 'delete';
		}
		for (let j = 0; j <= n; j++) {
			dp[0][j] = j; // Insertions
			ops[0][j] = 'insert';
		}
		ops[0][0] = 'match';
		
		// Fill DP table
		for (let i = 1; i <= m; i++) {
			for (let j = 1; j <= n; j++) {
				if (exp[i-1] === usr[j-1]) {
					// Match
					dp[i][j] = dp[i-1][j-1];
					ops[i][j] = 'match';
				} else {
					// Find minimum cost operation
					const substitute = dp[i-1][j-1] + 1;
					const deleteOp = dp[i-1][j] + 1;
					const insert = dp[i][j-1] + 1;
					
					const minCost = Math.min(substitute, deleteOp, insert);
					dp[i][j] = minCost;
					
					if (minCost === substitute) {
						ops[i][j] = 'substitute';
					} else if (minCost === deleteOp) {
						ops[i][j] = 'delete';
					} else {
						ops[i][j] = 'insert';
					}
				}
			}
		}
		
		// Backtrack to build alignment
		const alignment = [];
		let i = m, j = n;
		
		while (i > 0 || j > 0) {
			const op = ops[i][j];
			
			if (op === 'match') {
				alignment.unshift({
					type: 'match',
					expectedChar: exp[i-1],
					expectedOriginal: expected[i-1],
					userChar: usr[j-1],
					userOriginal: userTyped[j-1],
					verseChar: verseCharacters[i-1]
				});
				i--;
				j--;
			} else if (op === 'substitute') {
				alignment.unshift({
					type: 'mismatch',
					expectedChar: exp[i-1],
					expectedOriginal: expected[i-1],
					userChar: usr[j-1],
					userOriginal: userTyped[j-1],
					verseChar: verseCharacters[i-1]
				});
				i--;
				j--;
			} else if (op === 'delete') {
				alignment.unshift({
					type: 'deletion',
					expectedChar: exp[i-1],
					expectedOriginal: expected[i-1],
					userChar: null,
					userOriginal: null,
					verseChar: verseCharacters[i-1]
				});
				i--;
			} else if (op === 'insert') {
				alignment.unshift({
					type: 'insertion',
					expectedChar: null,
					expectedOriginal: null,
					userChar: usr[j-1],
					userOriginal: userTyped[j-1],
					verseChar: null
				});
				j--;
			}
		}
		
		// Calculate accuracy (penalize extra inserted inputs)
		const matches = alignment.filter(a => a.type === 'match').length;
		const insertions = alignment.filter(a => a.type === 'insertion').length;
		const denominator = expected.length + insertions;
		const accuracy = denominator > 0 ? Math.round((matches / denominator) * 100) : 0;
		
		return {
			alignment,
			accuracy,
			matches,
			mismatches: alignment.filter(a => a.type === 'mismatch').length,
			insertions: alignment.filter(a => a.type === 'insertion').length,
			deletions: alignment.filter(a => a.type === 'deletion').length,
			editDistance: dp[m][n]
		};
	}
	
	function handleKeyInput(event) {
		if (isComplete) return;
		
		const key = event.detail;
		if (key === 'Backspace') {
			if (userInput.length > 0) {
				userInput = userInput.slice(0, -1);
			}
			lastCorrectKey = null;
			return;
		}
		
		// Always show as "correct" during typing (user gets no feedback)
		lastCorrectKey = key;
		userInput += key;
	}
	
	function completeChallenge() {
		isComplete = true;
		
		// Align and score
		const inputMethod = $settings.inputMethod || 'pinyin';
		const result = alignStrings(verseInitials, userInput, inputMethod);
		const punctuatedAlignment = injectPunctuationIntoAlignment(result.alignment, verse.verseText || '');
		
			alignmentData = {
				...result,
				alignment: punctuatedAlignment
			};
		accuracyScore = result.accuracy;
		
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
		alignmentData = null;
		setTimeout(() => keepTypingAreaVisible('auto'), 150);
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
		showResult = false;
		userInput = '';
		isComplete = false;
		lastCorrectKey = null;
		accuracyScore = 0;
		alignmentData = null;
		exit();
	}
	
	function handlePhysicalKeyboard(e) {
		if (!verse) return;
		if (isComplete) return;

		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault();
			if (userInput.length > 0) {
				userInput = userInput.slice(0, -1);
			}
			lastCorrectKey = null;
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
		<button class="back-button" on:click={goBack} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<h2>{t('blind_challenge')}</h2>
		<button class="exit-button" on:click={closeToInitial} aria-label={t('exit')}>✕</button>
	</div>
	
	{#if verse && formatVerseRef}
		<div class="verse-selector-header">
			{formatVerseRef(verse)}
		</div>
	{/if}
	
	{#if !showResult}
		<div class="instructions">
			{t('blind_challenge_instructions')}
		</div>
	{/if}
	
	{#if !isComplete}
		<!-- During typing: password-style display (last character visible) -->
		<div class="input-display">
			<div class="input-text">{userInput.length > 1 ? `${'*'.repeat(userInput.length - 1)}${userInput[userInput.length - 1]}` : (userInput || ' ')}</div>
		</div>
	{:else}
		<!-- After submission: show interlinear alignment (verse char, user input below it) -->
		<div class="alignment-display">
			{#if alignmentData}
				<div class="interlinear-container">
					{#each alignmentData.alignment as item}
						<div class="char-pair">
							{#if item.type === 'insertion'}
								<span class="verse-char gap">_</span>
							{:else}
								<span class="verse-char {item.type}">{item.verseChar}</span>
							{/if}
							
							{#if item.type === 'deletion'}
								<span class="input-char gap">_</span>
							{:else}
								<span class="input-char {item.type}">{item.userOriginal}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
	
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
				showBackspace={true}
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
	
	.input-display {
		min-height: 150px;
		max-height: 300px;
		font-size: 1.5em;
		line-height: 1.8;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		align-items: flex-start;
		justify-content: flex-start;
		position: relative;
	}
	
	.input-text {
		font-family: monospace;
		letter-spacing: 0.1em;
		color: var(--text-color);
		min-height: 1.5em;
		width: 100%;
		overflow-wrap: anywhere;
		word-break: break-word;
		white-space: pre-wrap;
		max-width: 100%;
	}
	
	.alignment-display {
		min-height: 150px;
		max-height: 400px;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		overflow-y: auto;
	}
	
	.interlinear-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: flex-start;
		align-items: flex-start;
		padding: 0.5rem;
	}
	
	.char-pair {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-width: 2em;
	}
	
	.alignment-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		font-size: 1.5em;
		line-height: 2;
		justify-content: center;
	}
	
	.verse-row {
		border-bottom: 2px solid var(--subtitle-color);
		padding-bottom: 0.5rem;
	}
	
	.input-row {
		padding-top: 0.5rem;
	}
	
	.verse-char,
	.input-char {
		display: inline-block;
		min-width: 1.2em;
		text-align: center;
		font-weight: 500;
		font-size: 1.5em;
		line-height: 1.5;
	}
	
	.verse-char.match,
	.input-char.match {
		color: #4CAF50;
	}
	
	.verse-char.mismatch,
	.input-char.mismatch {
		color: #f44336;
		font-weight: 700;
	}
	
	.verse-char.deletion {
		color: #f44336;
		font-weight: 700;
		background: rgba(244, 67, 54, 0.1);
	}
	
	.input-char.insertion {
		color: #f44336;
		font-weight: 700;
		background: rgba(244, 67, 54, 0.1);
	}
	
	.gap {
		display: inline-block;
		min-width: 1.2em;
		text-align: center;
		color: var(--subtitle-color);
		opacity: 0.3;
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
		position: relative;
	}
	
	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	@media (max-width: 767px) {
		.blind-challenge-container {
			padding: 0.5rem;
		}
		
		.input-display,
		.alignment-display {
			padding: 1rem;
		}
		
		.alignment-row {
			font-size: 1.3em;
		}
		.verse-selector-header {
		padding: 0rem;
		}
	
		.instructions {
		padding: 0rem;
		}
	}
</style>
