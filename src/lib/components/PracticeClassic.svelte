<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Modal from './Modal.svelte';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';

	export let verse;

	const dispatch = createEventDispatcher();

	// Practice state
	let currentStage = 'basic'; //  'basic' | 'intermediate' | 'advanced'
	let userInput = '';
	let accuracy = 0;
	let showResult = false;
	let showStageCompleteModal = false;
	let stageCompleteMessage = '';
	
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
	
	function buildVerseData() {
		const refText = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber} `;
		const refInitials = `${verse.bookInitials}${verse.chapterNumber}${verse.verseNumber}`;
		
		fullText = refText + verse.verseText;
		fullInitials = refInitials + verse.verseInitials;
		
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
	}
	
	function retry() {
		userInput = '';
		showResult = false;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
	}
	
	function advanceStage() {
		if (accuracy >= 90) {
			if (currentStage === 'basic') {
				stageCompleteMessage = t('great_job_basic');
				showStageCompleteModal = true;
			} else if (currentStage === 'intermediate') {
				stageCompleteMessage = t('great_job_intermediate');
				showStageCompleteModal = true;
			} else if (currentStage === 'advanced') {
				// Practice complete!
				stageCompleteMessage = t('great_job_continue');
				showStageCompleteModal = true;
			}
		} else {
			retry();
		}
	}
	
	function closeStageModal() {
		showStageCompleteModal = false;
		
		if (currentStage === 'basic') {
			currentStage = 'intermediate';
		} else if (currentStage === 'intermediate') {
			currentStage = 'advanced';
		} else {
			// Advanced complete - return to activity selection
			dispatch('complete');
		}
	}
	
	function selectStage(stage) {
		currentStage = stage;
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
			
			// Determine visibility based on stage
			if (currentStage === 'basic') {
				// Always show in basic
				if (userInput.length > map) {
					const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
					const expectedChar = inputMethod === 'pinyin' ? fullInitials[map].toLowerCase() : fullInitials[map];
					const isCorrect = typedChar === expectedChar;
					return { char, className: className + (isCorrect ? ' correct' : ' incorrect'), hidden: false };
				}
				return { char, className, hidden: false };
			} else if (currentStage === 'intermediate') {
				// Show odd characters (index 0, 2, 4...), hide even
				const isOdd = map % 2 === 0;
				if (isOdd) {
					if (userInput.length > map) {
						const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
						const expectedChar = inputMethod === 'pinyin' ? fullInitials[map].toLowerCase() : fullInitials[map];
						const isCorrect = typedChar === expectedChar;
						return { char, className: className + (isCorrect ? ' correct' : ' incorrect'), hidden: false };
					}
					return { char, className, hidden: false };
				} else {
					// Even index - show after typed
					if (userInput.length > map) {
						const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
						const expectedChar = inputMethod === 'pinyin' ? fullInitials[map].toLowerCase() : fullInitials[map];
						const isCorrect = typedChar === expectedChar;
						return { char, className: className + (isCorrect ? ' correct' : ' incorrect'), hidden: false };
					}
					return { char, className: className + ' hidden', hidden: true };
				}
			} else {
				// Advanced - all hidden until typed
				if (userInput.length > map) {
					const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
					const expectedChar = inputMethod === 'pinyin' ? fullInitials[map].toLowerCase() : fullInitials[map];
					const isCorrect = typedChar === expectedChar;
					return { char, className: className + (isCorrect ? ' correct' : ' incorrect'), hidden: false };
				}
				return { char, className: className + ' hidden', hidden: true };
			}
		} else {
			// Punctuation - always visible in basic, conditional in other stages
			if (currentStage === 'basic') {
				return { char, className: 'verse-punctuation', hidden: false };
			} else {
				// Reveal based on previous character typed
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
	}
</script>

<div class="practice-classic-container">
	<div class="header">
		<button class="exit-button" on:click={exit}>✕</button>
		<h2>{t('classic')} - {t('practice')}</h2>
		<div class="spacer"></div>
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
			on:click={() => selectStage('intermediate')}
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
	
	<div class="verse-display">
		{#each fullText.split('') as char, idx}
			{@const rendered = renderCharacter(char, idx)}
			<span class={rendered.className}>{rendered.char}</span>
		{/each}
	</div>
	
	{#if showResult}
		<div class="result-panel">
			<div class="accuracy-display">
				{t('accuracy')}: {accuracy}%
			</div>
			<div class="result-buttons">
				<button class="secondary-button" on:click={retry}>
					{t('retry')}
				</button>
				<button 
					class="primary-button"
					on:click={advanceStage}
				>
					{accuracy >= 90 ? t('next') : t('retry')}
				</button>
			</div>
		</div>
	{/if}
	
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

<Modal show={showStageCompleteModal} type="success" on:close={closeStageModal}>
	<div class="modal-content">
		<p>{stageCompleteMessage}</p>
		<button class="primary-button" on:click={closeStageModal}>
			{t('ok')}
		</button>
	</div>
</Modal>

<style>
	.practice-classic-container {
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
	
	.spacer {
		width: 40px;
	}
	
	h2 {
		margin: 0;
		font-size: 1.2em;
		flex: 1;
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
	
	.verse-display {
		flex: 1;
		font-size: 1.5em;
		line-height: 2;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		margin-bottom: 1rem;
		overflow-y: auto;
	}
	
	:global(.verse-character),
	:global(.verse-punctuation) {
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
	
	.result-panel {
		padding: 1rem;
		background: var(--panel-background);
		border-radius: 8px;
		margin-bottom: 1rem;
	}
	
	.accuracy-display {
		text-align: center;
		font-size: 1.3em;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--accent-color);
	}
	
	.result-buttons {
		display: flex;
		gap: 0.75rem;
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
	
	.keyboard-space {
		margin-top: auto;
	}
	
	.modal-content {
		text-align: center;
		padding: 1rem;
	}
	
	.modal-content p {
		margin-bottom: 1.5rem;
		font-size: 1.1em;
	}
	
	.modal-content .primary-button {
		width: 100%;
	}
	
	@media (max-width: 767px) {
		.practice-classic-container {
			padding: 0.5rem;
		}
		
		.verse-display {
			font-size: 1.2em;
			padding: 1rem;
		}
		
		.stage-button {
			padding: 0.4rem 0.75rem;
			font-size: 0.9em;
		}
	}
</style>
