<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { practice } from '$lib/stores/practice';
	import { t } from '$lib/i18n';
	import Modal from './Modal.svelte';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';

	export let verse;

	const dispatch = createEventDispatcher();

	// Timer state
	let timerStarted = false;
	let startTime = 0;
	let rawTime = 0;
	let penalties = 0;
	
	// Input state
	let userInput = '';
	let fullText = '';
	let fullInitials = '';
	let charToInputIndex = [];
	
	// Keyboard feedback
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;
	
	// Completion modal
	let showCompletionModal = false;
	let isNewBest = false;
	
	// Build full text (reference + verse text)
	$: {
		if (verse) {
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
	
	function buildFullText() {
		// Build string: bookName chapter:verse verseText
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
	
	function handleKeyInput(event) {
		const key = event.detail;
		
		// Start timer on first input
		if (!timerStarted) {
			startTime = Date.now();
			timerStarted = true;
		}
		
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
			// Incorrect - count penalty
			penalties++;
			pressedKey = key;
			correctKey = nextExpectedChar;
			triggerErrorFeedback($settings);
			
			// Still add to input
			userInput += key;
		}
		
		// Check if complete
		if (userInput.length === fullInitials.length) {
			completeChallenge();
		}
	}
	
	function completeChallenge() {
		rawTime = Date.now() - startTime;
		const officialTime = rawTime + (penalties * 1000);
		
		// Check if new best
		const currentBest = $practice.bestVerseTimes[verse.id];
		isNewBest = !currentBest || officialTime < currentBest.officialTime;
		
		// Save if new best
		if (isNewBest || !currentBest) {
			practice.updateVerseBestTime(verse.id, rawTime, penalties);
		}
		
		showCompletionModal = true;
	}
	
	function tryAgain() {
		showCompletionModal = false;
		userInput = '';
		rawTime = 0;
		penalties = 0;
		timerStarted = false;
		startTime = 0;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		isNewBest = false;
	}
	
	function done() {
		dispatch('complete');
	}
	
	function exit() {
		dispatch('exit');
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
			// Punctuation - reveal based on previous character
			let prevCharInputIndex = null;
			for (let i = charIndex - 1; i >= 0; i--) {
				if (charToInputIndex[i] !== null) {
					prevCharInputIndex = charToInputIndex[i];
					break;
				}
			}
			
			const shouldReveal = prevCharInputIndex !== null && userInput.length > prevCharInputIndex;
			return {
				char,
				className: 'verse-punctuation' + (shouldReveal ? '' : ' hidden'),
				hidden: !shouldReveal
			};
		}
	}
	
	function formatTime(ms) {
		return (ms / 1000).toFixed(1) + 's';
	}
</script>

<div class="speed-challenge-container">
	<div class="header">
		<button class="exit-button" on:click={exit}>✕</button>
		<h2>{t('speed_challenge')}</h2>
		<div class="timer">
			{#if timerStarted}
				⏱ {formatTime(Date.now() - startTime)}
			{:else}
				⏱ 0.0s
			{/if}
		</div>
	</div>
	
	<div class="stats-bar">
		<span class="stat">
			<span class="stat-label">{t('penalties')}:</span>
			<span class="stat-value">{penalties}</span>
		</span>
		<span class="stat">
			<span class="stat-label">{t('progress')}:</span>
			<span class="stat-value">{userInput.length}/{fullInitials.length}</span>
		</span>
	</div>
	
	<div class="verse-display">
		{#each fullText.split('') as char, idx}
			{@const rendered = renderCharacter(char, idx)}
			<span class={rendered.className}>{rendered.char}</span>
		{/each}
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
			<h3>{t('speed_challenge')} {t('finish')}</h3>
			
			{#if isNewBest}
				<p class="new-best">{t('new_best')}</p>
			{/if}
			
			<div class="time-stats">
				<div class="time-stat">
					<span class="label">{t('raw_time')}:</span>
					<span class="value">{formatTime(rawTime)}</span>
				</div>
				<div class="time-stat">
					<span class="label">{t('penalties')}:</span>
					<span class="value">{penalties} (+{formatTime(penalties * 1000)})</span>
				</div>
				<div class="time-stat official">
					<span class="label">{t('official_time')}:</span>
					<span class="value">{formatTime(rawTime + (penalties * 1000))}</span>
				</div>
				
				{#if $practice.bestVerseTimes[verse.id] && !isNewBest}
					{@const bestTime = $practice.bestVerseTimes[verse.id]}
					<div class="time-stat best">
						<span class="label">{t('best_time').replace('{time}', '')}:</span>
						<span class="value">{formatTime(bestTime.officialTime)}</span>
					</div>
				{/if}
			</div>
			
			<div class="modal-buttons">
				<button class="secondary-button" on:click={tryAgain}>
					{t('try_again')}
				</button>
				<button class="primary-button" on:click={done}>
					{t('done')}
				</button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.speed-challenge-container {
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
	
	.timer {
		font-weight: 600;
		font-size: 1.1em;
		color: var(--accent-color);
		min-width: 60px;
		text-align: right;
	}
	
	.stats-bar {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: var(--panel-background);
		border-radius: 8px;
	}
	
	.stat {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.stat-label {
		color: var(--subtitle-color);
		font-size: 0.9em;
	}
	
	.stat-value {
		font-weight: 600;
		color: var(--text-color);
	}
	
	.verse-display {
		flex: 1;
		font-size: 1.5em;
		line-height: 2;
		margin-bottom: 1rem;
		padding: 1rem;
		background: var(--panel-background);
		border-radius: 8px;
		overflow-y: auto;
	}
	
	:global(.verse-character) {
		transition: opacity 0.1s;
	}
	
	:global(.verse-character.correct) {
		color: var(--text-color);
		opacity: 1;
	}
	
	:global(.verse-character.incorrect) {
		color: #f44336;
		background: rgba(244, 67, 54, 0.1);
		padding: 0 2px;
		border-radius: 2px;
	}
	
	:global(.verse-character.hidden),
	:global(.verse-punctuation.hidden) {
		opacity: 0;
	}
	
	:global(.verse-punctuation) {
		color: var(--text-color);
	}
	
	.keyboard-space {
		margin-top: auto;
	}
	
	.completion-content {
		text-align: center;
	}
	
	.completion-content h3 {
		margin-bottom: 1rem;
	}
	
	.new-best {
		color: var(--accent-color);
		font-size: 1.3em;
		font-weight: bold;
		margin-bottom: 1rem;
	}
	
	.time-stats {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 1.5rem 0;
	}
	
	.time-stat {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
		background: var(--panel-background);
		border-radius: 4px;
	}
	
	.time-stat.official {
		background: var(--accent-color-light, rgba(76, 175, 80, 0.1));
		font-weight: 600;
		font-size: 1.1em;
	}
	
	.time-stat.best {
		background: rgba(33, 150, 243, 0.1);
		color: #2196f3;
	}
	
	.modal-buttons {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	
	.primary-button,
	.secondary-button {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 6px;
		font-size: 1em;
		cursor: pointer;
	}
	
	.primary-button {
		background: var(--accent-color);
		color: white;
	}
	
	.secondary-button {
		background: var(--panel-background);
		color: var(--text-color);
		border: 1px solid var(--border-color);
	}
	
	@media (max-width: 767px) {
		.speed-challenge-container {
			padding: 0.5rem;
		}
		
		.verse-display {
			font-size: 1.2em;
		}
		
		.stats-bar {
			gap: 1rem;
			font-size: 0.9em;
		}
	}
</style>
