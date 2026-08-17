<script>
	import { createEventDispatcher, tick } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { practice } from '$lib/stores/practice';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';
	import { icons } from '$lib/utils/icons.js';

	export let verse;

	const dispatch = createEventDispatcher();

	// Timer state
	let timerStarted = false;
	let startTime = 0;
	let currentTime = 0; // For reactive timer display
	let rawTime = 0;
	let penalties = 0;
	let timerInterval;
	
	// Input state
	let userInput = '';
	let fullText = '';
	let fullInitials = '';
	let charToInputIndex = [];
	let verseDisplayEl;
	
	// Keyboard feedback
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;
	
	// Completion modal
	let showCompletionModal = false;
	let isNewBest = false;
	let previousBestTime = null;
	let improvementMs = 0;
	let accuracyScore = 0;
	let unrecordedTime = 0;
	let challengeSucceeded = false;
	
	// Verse reference header opacity (fade out as user types)
	let verseSelectorOpacity = 1;
	
	// Verse reference formatter
	$: formatVerseRef = createVerseReferenceFormatter($verses);
	
	// Update opacity based on progress
	$: {
		if (fullInitials.length > 0) {
			const progress = userInput.length / fullInitials.length;
			verseSelectorOpacity = Math.max(0, 1 - progress * 2);
		}
	}
	
	// Get best time for this verse
	$: bestTime = $practice.bestVerseTimes[verse?.id];
	
	// Build full text (verse text + reference)
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

	$: {
		const __ = userInput.length;
		if (verseDisplayEl && !showCompletionModal) {
			scheduleAutoscroll();
		}
	}

	async function scheduleAutoscroll() {
		await tick();
		requestAnimationFrame(() => {
			scrollNextHiddenCharacterIntoView();
		});
	}

	function scrollNextHiddenCharacterIntoView() {
		if (!verseDisplayEl) return;
		const keyboard = document.querySelector('.speed-challenge-container .keyboard-space .keyboard');
		if (!keyboard) return;

		const nextInputIndex = userInput.length;
		const charIndex = charToInputIndex.findIndex((value) => value === nextInputIndex);
		if (charIndex === -1) return;

		const targetChar = verseDisplayEl.querySelector(`span:nth-child(${charIndex + 1})`);
		if (!targetChar) return;

		const containerRect = verseDisplayEl.getBoundingClientRect();
		const keyboardRect = keyboard.getBoundingClientRect();
		const charRect = targetChar.getBoundingClientRect();
		const visibleTop = containerRect.top + 12;
		const visibleBottom = Math.min(containerRect.bottom, window.innerHeight, keyboardRect.top) - 12;
		const visibleHeight = Math.max(0, visibleBottom - visibleTop);
		if (visibleHeight <= 0) return;
		const charCenter = charRect.top + (charRect.height / 2);
		const preferredTop = visibleTop + (visibleHeight * 0.35);
		const preferredBottom = visibleTop + (visibleHeight * 0.55);
		const overlapsTop = charCenter < preferredTop;
		const overlapsBottom = charCenter > preferredBottom;

		if (!overlapsTop && !overlapsBottom) return;

		const visibleCenter = (preferredTop + preferredBottom) / 2;
		const scrollDelta = charCenter - visibleCenter;

		const containerCanScroll = verseDisplayEl.scrollHeight > verseDisplayEl.clientHeight + 1;
		if (containerCanScroll) {
			verseDisplayEl.scrollTo({
				top: verseDisplayEl.scrollTop + scrollDelta,
				behavior: 'smooth'
			});
		} else {
			window.scrollTo({
				top: window.scrollY + scrollDelta,
				behavior: 'smooth'
			});
		}
	}
	
	function buildFullText() {
		// Build string: verseText then reference
		const refText = ` ${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
		const refInitials = `${verse.bookInitials}${verse.chapterNumber}${verse.verseNumber}`;
		
		fullText = verse.verseText + refText;
		fullInitials = verse.verseInitials + refInitials;
		
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
			// Start timer interval for live updates
			timerInterval = setInterval(() => {
				currentTime = Date.now() - startTime;
			}, 50); // Update every 50ms for smooth display
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
		// Stop timer
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		
		rawTime = Date.now() - startTime;
		unrecordedTime = rawTime + (penalties * 1000);
		accuracyScore = calculateAccuracyScore();
		challengeSucceeded = accuracyScore >= 90;
		
		if (challengeSucceeded) {
			// Check if new best
			const currentBest = $practice.bestVerseTimes[verse.id];
			previousBestTime = currentBest || null;
			isNewBest = !currentBest || unrecordedTime < currentBest.officialTime;
			improvementMs = isNewBest && currentBest ? currentBest.officialTime - unrecordedTime : 0;
			
			// Save if new best
			if (isNewBest || !currentBest) {
				practice.updateVerseBestTime(verse.id, rawTime, penalties);
			}
		} else {
			previousBestTime = null;
			isNewBest = false;
			improvementMs = 0;
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
		currentTime = 0;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		isNewBest = false;
		previousBestTime = null;
		improvementMs = 0;
		accuracyScore = 0;
		unrecordedTime = 0;
		challengeSucceeded = false;
		verseSelectorOpacity = 1;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}
	
	function done() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (challengeSucceeded) {
			dispatch('complete');
		} else {
			dispatch('back');
		}
	}
	
	function exit() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		dispatch('exit');
	}

	function back() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		dispatch('back');
	}

	function selectActivity() {
		back();
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

	function calculateAccuracyScore() {
		if (!fullInitials.length) return 0;

		const inputMethod = $settings.inputMethod || 'pinyin';
		let correct = 0;

		for (let i = 0; i < fullInitials.length; i++) {
			const typedChar = inputMethod === 'pinyin' ? (userInput[i] || '').toLowerCase() : (userInput[i] || '');
			const expectedChar = inputMethod === 'pinyin' ? fullInitials[i].toLowerCase() : fullInitials[i];

			if (typedChar === expectedChar) {
				correct++;
			}
		}

		return Math.round((correct / fullInitials.length) * 100);
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
			
			// Start timer on first input
			if (!timerStarted) {
				startTime = Date.now();
				timerStarted = true;
				// Start timer interval for live updates
				timerInterval = setInterval(() => {
					currentTime = Date.now() - startTime;
				}, 50); // Update every 50ms for smooth display
			}
			
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
				// Incorrect input - count penalty
				penalties++;
				pressedKey = key; // Use the physical key for highlighting
				correctKey = nextExpectedChar;
				triggerErrorFeedback($settings);
			}
			
			userInput += mappedValue;
			
			if (userInput.length === fullInitials.length) {
				completeChallenge();
			}
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="speed-challenge-container">
	<div class="mode-header">
		<button class="back-btn" on:click={back} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				{@html icons.back}
			</svg>
		</button>
		<h2>{t('speed_challenge')}</h2>
		<button class="back-btn exit-button" on:click={exit}>✕</button>
	</div>
	
	{#if verse && formatVerseRef}
		<div 
			class="verse-selector-header"
			style="opacity: {verseSelectorOpacity}; transition: opacity 0.3s ease;"
		>
			{formatVerseRef(verse)}
		</div>
	{/if}
	
	<div class="stats-bar">
		<span class="stat timer-stat">
			<span class="stat-value timer-value">
				{#if timerStarted}⏱ {formatTime(currentTime)}{:else}⏱ 0.0s{/if}
			</span>
		</span>
		<span class="stat">
			<span class="stat-label">{t('penalties')}:</span>
			<span class="stat-value">{penalties}</span>
		</span>
		{#if bestTime}
			<span class="stat">
				<span class="stat-label">{t('best_time').replace('{time}', '')}</span>
				<span class="stat-value">{formatTime(bestTime.officialTime)}</span>
			</span>
		{/if}
	</div>
	
	<div class="verse-display" bind:this={verseDisplayEl}>
		{#key userInput}
			{#each fullText.split('') as char, idx}
				{@const rendered = renderCharacter(char, idx)}
				<span class={rendered.className}>{rendered.char}</span>
			{/each}
		{/key}
	</div>

	{#if !showCompletionModal}
		<button class="retry-fab" on:click={tryAgain} aria-label={t('try_again')}>
			↺ {t('retry')}
		</button>
	{/if}
	
	<div class="keyboard-space">
		{#if !showCompletionModal}
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
		{/if}
	</div>
</div>

{#if showCompletionModal}
	<div class="modal-overlay" on:click={done} on:keydown={(e) => e.key === 'Escape' && done()} role="button" tabindex="0">
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<h3>{t('speed_challenge')} {t('finish')}</h3>
			{#if challengeSucceeded}
				{#if isNewBest}
					<p class="new-best">🎉 {t('new_best')}!</p>
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
						<span class="value">{formatTime(unrecordedTime)}</span>
					</div>

					{#if isNewBest && previousBestTime}
						<div class="time-stat best">
							<span class="label">{t('previous_best')}:</span>
							<span class="value">{formatTime(previousBestTime.officialTime)}</span>
						</div>
						<div class="time-stat improvement">
							<span class="label">{t('improved_by')}:</span>
							<span class="value">-{formatTime(improvementMs)}</span>
						</div>
					{/if}
					
					{#if $practice.bestVerseTimes[verse.id] && !isNewBest}
						{@const currentBestTime = $practice.bestVerseTimes[verse.id]}
						<div class="time-stat best">
							<span class="label">{t('best_time').replace('{time}', '')}</span>
							<span class="value">{formatTime(currentBestTime.officialTime)}</span>
						</div>
					{/if}
				</div>
				
				<div class="modal-buttons">
					<button class="btn-outline" on:click={tryAgain}>
						{t('try_again')}
					</button>
					<button on:click={done}>
						{t('done')}
					</button>
				</div>
			{:else}
				<p class="warning">⚠️ {t('time_not_recorded')}</p>
				
				<div class="time-stats">
					<div class="time-stat accuracy">
						<span class="label">{t('accuracy')}:</span>
						<span class="value">{accuracyScore}%</span>
					</div>
					<div class="time-stat unrecorded">
						<span class="label">{t('unrecorded_time')}:</span>
						<span class="value">{formatTime(unrecordedTime)}</span>
					</div>
				</div>
				
				<div class="modal-buttons">
					<button class="btn-outline" on:click={tryAgain}>
						{t('try_again')}
					</button>
					<button on:click={selectActivity}>
						{t('select_activity')}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.speed-challenge-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: 1rem;
	}
	
	.exit-button {
		font-size: 1.5em;
	}

	.timer-stat {
		display: flex;
		justify-content: flex-end;
		min-width: 9ch;
		border-right: 1px solid var(--file-border);
		padding-right: 1rem;
		margin-right: 0.5rem;
	}

	.timer-value {
		font-weight: 700;
		color: var(--accent-color);
		font-variant-numeric: tabular-nums;
		font-feature-settings: "tnum" 1;
	}

	.retry-fab {
		position: fixed;
		right: 1rem;
		bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
		z-index: 1002;
		background: var(--panel-background);
		border: 1px solid var(--file-border);
		border-radius: 8px;
		padding: 0.45rem 0.95rem;
		font-size: 0.9em;
		cursor: pointer;
		color: var(--text-color);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}

	.retry-fab:hover {
		background: var(--app-background);
	}
	
	.verse-selector-header {
		text-align: center;
		font-weight: 600;
		font-size: 1.1em;
		margin-bottom: 0.5rem;
		color: var(--text-color);
	}
	
	.stats-bar {
		display: grid;
		grid-template-columns: repeat(3, max-content);
		align-items: center;
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
		font-variant-numeric: tabular-nums;
		font-feature-settings: "tnum" 1;
	}
	
	.verse-display {
		flex: 1;
		font-size: 1.5em;
		line-height: 2;
		margin-bottom: 1rem;
		padding: 1rem 1rem 12rem;
		background: var(--panel-background);
		border-radius: 8px;
		overflow-y: auto;
	}
	
	.verse-display :global(.verse-character) {
		transition: opacity 0.1s;
	}
	
	.verse-display :global(.verse-character.correct) {
		color: var(--text-color);
		opacity: 1;
	}
	
	.verse-display :global(.verse-character.incorrect) {
		color: var(--danger-color);
		background: color-mix(in srgb, var(--danger-color) 12%, transparent);
		padding: 0 2px;
		border-radius: 2px;
	}
	
	.verse-display :global(.verse-character.hidden),
	.verse-display :global(.verse-punctuation.hidden) {
		opacity: 0;
	}
	
	.verse-display :global(.verse-punctuation) {
		color: var(--text-color);
	}
	
	.keyboard-space {
		margin-top: auto;
		height: 250px;
		flex-shrink: 0;
	}
	
	/* Modal styles */
	/* Overlay/content shells come from the shared modal classes in app.css */
	.modal-content h3 {
		margin: 0 0 1rem 0;
		text-align: center;
		color: var(--text-color);
	}
	
	.new-best {
		color: var(--accent-color);
		font-size: 1.3em;
		font-weight: bold;
		margin: 0 0 1rem 0;
		text-align: center;
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
		background: var(--app-background);
		border-radius: 4px;
	}
	
	.time-stat .label {
		color: var(--subtitle-color);
	}
	
	.time-stat .value {
		font-weight: 600;
		color: var(--text-color);
	}
	
	.time-stat.official {
		background: color-mix(in srgb, var(--success-color) 12%, transparent);
		font-weight: 600;
		font-size: 1.1em;
	}
	
	.time-stat.official .label,
	.time-stat.official .value {
		color: var(--success-color);
	}
	
	.time-stat.best {
		background: color-mix(in srgb, var(--accent-color) 12%, transparent);
	}

	.time-stat.accuracy {
		background: color-mix(in srgb, var(--accent-color) 12%, transparent);
	}

	.time-stat.unrecorded {
		background: color-mix(in srgb, var(--warning-color) 15%, transparent);
	}
	
	.time-stat.best .label,
	.time-stat.best .value {
		color: var(--accent-color);
	}

	.time-stat.accuracy .label,
	.time-stat.accuracy .value {
		color: var(--accent-color);
	}

	.time-stat.unrecorded .label,
	.time-stat.unrecorded .value {
		color: var(--warning-color);
	}

	.time-stat.improvement {
		background: color-mix(in srgb, var(--success-color) 12%, transparent);
	}

	.time-stat.improvement .label,
	.time-stat.improvement .value {
		color: var(--success-color);
	}
	
	.modal-buttons {
		margin-top: 1.5rem;
	}

	.modal-buttons button {
		flex: 1;
	}
	
	@media (max-width: 767px) {
		.speed-challenge-container {
			padding: 0.5rem;
		}
		
		.verse-display {
			padding: 0.75rem 0.75rem 11.5rem;
		}

		.keyboard-space {
			height: 240px;
		}
		
		.stats-bar {
			gap: 1rem;
			font-size: 0.9em;
		}
		
		.modal-content {
			padding: 1.5rem;
		}
	}
</style>
