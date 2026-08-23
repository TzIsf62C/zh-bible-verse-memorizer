<script>
	import { createEventDispatcher, tick } from 'svelte';
	import { verses as versesStore } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import Modal from './Modal.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';
	import { appendCategoryHistory } from '$lib/utils/categoryHistory.js';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { initializeHeatArray, updateHeatArray, buildCorrectnessMap } from '$lib/utils/heatTracking';

	export let verses = [];

	const dispatch = createEventDispatcher();

	// Create verse reference formatter that checks ALL verses for duplicates (not just current review set)
	$: formatVerseRef = createVerseReferenceFormatter($versesStore);

	let currentIndex = 0;
	let userInput = '';
	let showResult = false;
	let accuracy = 0;
	let successCount = 0;
	let reviewedVerseIds = new Set(); // Track which verses have been successfully reviewed (prevents double-counting on retry)
	let feedbackMessage = '';
	let feedbackType = '';
	let lastErrorIndex = null;
	let lastErrorChar = null;
	let viewportAnchor;
	let verseDisplayEl;
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let verseHeaderOpacity = 1;
	let showCompletionMsg = false;
	let completionMessage = '';
	
	// Keyboard feedback tracking
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;
	
	// Reset keyboard feedback when verse changes
	$: {
		// React to verse change to clear feedback
		const _ = currentIndex;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
	}

	// Check for input method mismatch and show warning
	$: {
		// Explicitly depend on both reviewFullInitials and inputMethod
		const currentMethod = $settings.inputMethod;
		const fullInitials = reviewFullInitials;
		
		if (fullInitials && currentMethod) {
			const verseInputMethod = detectInputMethod(fullInitials);
			
			if (verseInputMethod && verseInputMethod !== currentMethod) {
				const methodNames = { 
					pinyin: t('input_pinyin'), 
					zhuyin: t('input_zhuyin'), 
					cangjie: t('input_cangjie') 
				};
				feedbackMessage = t('input_method_mismatch').replace('{method}', methodNames[verseInputMethod] || verseInputMethod);
				feedbackType = 'warning';
			} else if (verseInputMethod === currentMethod && feedbackType === 'warning') {
				// Only clear warning if we successfully detected a matching method
				feedbackMessage = '';
				feedbackType = '';
			}
		}
	}
	
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
			keyboardLayout = keyboardLayouts.numericCompact;
			isNumericKeyboard = true;
		} else {
			// Use compact layouts (no delete/enter row) for review mode
			const inputMethod = $settings.inputMethod || 'pinyin';
			keyboardLayout = keyboardLayouts[`${inputMethod}Compact`] || keyboardLayouts.pinyinCompact;
			isNumericKeyboard = false;
		}
	}

	$: {
		const _ = userInput.length;
		if (verseDisplayEl && !showResult) {
			scheduleAutoscroll();
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
		if (verseDisplayEl) {
			verseDisplayEl.scrollTop = 0;
		}

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

	async function scheduleAutoscroll() {
		await tick();
		requestAnimationFrame(() => {
			scrollNextHiddenCharacterIntoView();
		});
	}

	function scrollNextHiddenCharacterIntoView() {
		if (!verseDisplayEl) return;

		const keyboard = document.querySelector('.individual-review .input-section .keyboard');
		const nextInputIndex = userInput.length;
		const charIndex = charToInputIndex.findIndex((value) => value === nextInputIndex);
		if (charIndex === -1) return;

		const targetChar = verseDisplayEl.querySelector(`span:nth-child(${charIndex + 1})`);
		if (!targetChar) return;

		const containerRect = verseDisplayEl.getBoundingClientRect();
		const keyboardRect = keyboard ? keyboard.getBoundingClientRect() : null;
		const charRect = targetChar.getBoundingClientRect();
		const viewportTop = 12;
		const viewportBottom = Math.min(
			window.innerHeight,
			keyboardRect ? keyboardRect.top : window.innerHeight
		) - 12;
		const visibleTop = Math.max(viewportTop, containerRect.top + 12);
		const visibleBottom = Math.min(viewportBottom, containerRect.bottom - 12);
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
		if (!containerCanScroll) return;

		verseDisplayEl.scrollTo({
			top: verseDisplayEl.scrollTop + scrollDelta,
			behavior: 'smooth'
		});
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
			lastErrorIndex = null;
			lastErrorChar = null;
		} else {
			// Only trigger feedback if this is a new or different error
			if (lastErrorIndex !== latestErrorIndex || lastErrorChar !== latestErrorChar) {
				lastErrorIndex = latestErrorIndex;
				lastErrorChar = latestErrorChar;
				
				// Trigger audio/haptic feedback
				triggerErrorFeedback($settings);
			}
		}
	}

	function detectInputMethod(initials) {
		if (!initials || initials.length === 0) {
			return null;
		}
		
		// Sample first few characters (excluding numbers)
		const sample = initials.split('').filter(c => !/[0-9]/.test(c)).slice(0, 5).join('');
		
		if (!sample) {
			return null;
		}
		
		// Check for Zhuyin (Bopomofo characters U+3105-U+3129 and tone marks)
		if (/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/.test(sample)) return 'zhuyin';
		
		// Check for Cangjie (Chinese characters used as input)
		if (/[\u4e00-\u9fa5]/.test(sample)) return 'cangjie';
		
		// Check for Pinyin (lowercase Latin letters)
		if (/[a-z]/.test(sample)) return 'pinyin';

		return null;
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

		// Clear previous feedback before adding new input
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		
		// Determine what the expected key is at this position
		const inputMethod = $settings.inputMethod || 'pinyin';
		const nextExpectedChar = reviewFullInitials[userInput.length];
		const normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
		const normalizedExpected = inputMethod === 'pinyin' ? (nextExpectedChar || '').toLowerCase() : (nextExpectedChar || '');
		
		// Check if input is correct
		if (normalizedKey === normalizedExpected) {
			// Correct input - show success feedback
			lastCorrectKey = key;
		} else {
			// Incorrect input - show error feedback
			pressedKey = key;
			correctKey = nextExpectedChar;
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
			
			// Clear previous feedback before adding new input
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			
			// Determine what the expected key is at this position
			const nextExpectedChar = reviewFullInitials[userInput.length];
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
			}
			
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

		// Build correctness map for heat tracking
		const correctnessMap = buildCorrectnessMap(
			currentVerse.verseText,
			currentVerse.bookName,
			currentVerse.chapterNumber,
			currentVerse.verseNumber,
			currentVerse.verseInitials,
			currentVerse.bookInitials,
			userInput,
			inputMethod,
			false // Track both verse text and reference
		);

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
				const categoryHistory = appendCategoryHistory(v, updated.interval, now);
				
				// Initialize or update heatArray
				let newHeatArray = v.heatArray;
				if (!newHeatArray) {
					// First review: initialize heat array
					newHeatArray = initializeHeatArray(
						v.verseText,
						v.bookName,
						v.chapterNumber,
						v.verseNumber
					);
				}
				// Update based on this review's performance
				newHeatArray = updateHeatArray(newHeatArray, correctnessMap);
				
				return {
					...v,
					isLearned: v.isLearned || Boolean(v.lastReviewed),
					interval: updated.interval,
					repetitions: updated.repetitions,
					dueDate: updated.dueDate,
					lastReviewed: success ? now.toISOString() : v.lastReviewed,
					heatArray: newHeatArray,
					categoryHistory
				};
			}
			return v;
		}));

		dispatch('reviewed');

		// Only increment successCount if this verse hasn't been successfully reviewed yet in this session
		if (success && !reviewedVerseIds.has(currentVerse.id)) {
			successCount++;
			reviewedVerseIds.add(currentVerse.id);
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

	function exitReview() {
		dispatch('exit');
	}

	// Character rendering (same as Advanced Learning Mode)
	function renderCharacter(char, charIndex, typedInput, inputMethod) {
		const map = charToInputIndex[charIndex];

		if (map !== null) {
			// Input-requiring character
			const expected = reviewFullInitials[map];
			let className = 'verse-character';
			let hidden = true; // Always hidden initially (like advanced mode)

			// Reveal as user types
			if (typedInput.length > map) {
				const typedChar = inputMethod === 'pinyin' ? typedInput[map].toLowerCase() : typedInput[map];
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
				if (prevMap !== null && typedInput.length > prevMap) {
					shown = true;
					className = 'verse-character punctuation correct';
				} else {
					// Not yet revealed - hide with opacity: 0
					shown = false;
					className = 'verse-character punctuation hidden';
				}
			}

			return { char, className, hidden: !shown };
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="individual-review">
	<div class="review-header">
		<button class="back-btn exit-btn" on:click={exitReview} aria-label={t('exit')}>×</button>
	</div>
	
	<div class="progress-bar">
		<div class="progress-text">
			{currentIndex} / {verses.length}
		</div>
		<div class="progress-fill" style="width: {((currentIndex) / verses.length) * 100}%"></div>
	</div>
	
	{#if currentVerse}
		<div class="verse-header" style="opacity: {verseHeaderOpacity}; transition: opacity 0.3s ease;">
			<h3>{formatVerseRef(currentVerse)}</h3>
		</div>

		<div class="verse-display" bind:this={verseDisplayEl}>
			{#each [...reviewFullText] as char, i}
				{@const rendered = renderCharacter(char, i, userInput, $settings.inputMethod || 'pinyin')}
				<span class={rendered.className}>{rendered.char}</span>
			{/each}
		</div>

		<div class="input-section">
			<!-- Input method mismatch warning -->
			{#if feedbackMessage && feedbackType === 'warning' && !showResult}
				<div class="feedback warning">
					{feedbackMessage}
				</div>
			{/if}

			<!-- Invisible viewport anchor for keyboard positioning -->
			<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>

			{#if !showResult}
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
					<div class="message">{currentIndex === verses.length - 1 ? t('great_job_finish') : t('great_job_continue')}</div>
				{:else}
					<div class="message">{t('nice_try')}</div>
				{/if}
			</div>
			<div class="modal-buttons">
				<button class="modal-btn" on:click={nextVerse}>
					{currentIndex === verses.length - 1 ? t('finish') : t('next')}
				</button>
				<button class="modal-btn btn-outline" on:click={retry}>
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
		display: grid;
		gap: .5rem;
		padding: 1rem;
		padding-top: 0px;
		padding-bottom: 1rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.review-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: -1rem;
	}

	.exit-btn {
		font-size: 1.5em;
		font-weight: 300;
	}

	.progress-bar {
		position: relative;
		width: 100%;
		height: 32px;
		background: var(--file-bg);
		border-radius: 8px;
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
		font-size: 1.5em;
		line-height: 2;
		margin-bottom: 2rem;
		padding: 2rem;
		background: var(--panel-background);
		border-radius: 8px;
		min-height: 120px;
		max-height: clamp(240px, 44vh, 560px);
		width: 100%;
		box-sizing: border-box;
		overflow-y: auto;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
	}

	.input-section {
		display: grid;
		gap: 1.5rem;
	}

	.result-display {
		padding: 1.5rem;
		border-radius: 8px;
		text-align: center;
		border: 2px solid;
	}

	.result-display.success {
		background: color-mix(in srgb, var(--success-color) 12%, transparent);
		border-color: var(--success-color);
		color: var(--success-color);
	}

	.result-display.error {
		background: color-mix(in srgb, var(--danger-color) 12%, transparent);
		border-color: var(--danger-color);
		color: var(--danger-color);
	}

	.accuracy-text {
		font-size: 1.5em;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.message {
		font-size: 1.1em;
	}

	/* Overlay/content/buttons shells come from the shared modal classes in app.css */
	.modal-message {
		margin-bottom: 1.5rem;
	}

	.modal-message .accuracy-text {
		font-size: 1.5em;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-color);
	}

	.modal-message .message {
		font-size: 1.2em;
		color: var(--subtitle-color);
	}

	/* Sizing only — colors/shape come from the shared button classes in app.css */
	.modal-btn {
		min-width: 100px;
	}

	/* Feedback styling */
	.feedback {
		padding: 1rem;
		border-radius: 8px;
		font-weight: 600;
		border: 2px solid;
	}

	.feedback.error {
		background: color-mix(in srgb, var(--danger-color) 12%, transparent);
		border-color: var(--danger-color);
		color: var(--danger-color);
	}

	.feedback.warning {
		background: color-mix(in srgb, var(--warning-color) 15%, transparent);
		border-color: var(--warning-color);
		color: var(--warning-color);
	}

	.feedback.success {
		background: color-mix(in srgb, var(--success-color) 12%, transparent);
		border-color: var(--success-color);
		color: var(--success-color);
	}

	/* Viewport anchor for keyboard positioning */
	.viewport-anchor {
		height: 1px;
		visibility: hidden;
		pointer-events: none;
	}

	/* Character styling */
	.verse-display :global(.verse-character) {
		display: inline;
		transition: all 0.15s ease;
	}

	.verse-display :global(.verse-character.correct) {
		color: var(--text-color);
	}

	.verse-display :global(.verse-character.incorrect) {
		color: var(--danger-color);
		background: color-mix(in srgb, var(--danger-color) 12%, transparent);
		padding: 0 2px;
		border-radius: 2px;
	}

	.verse-display :global(.verse-character.hidden) {
		opacity: 0;
		pointer-events: none;
	}

	@media (max-width: 768px) {
		.verse-display {
			padding: 1.5rem;
		}
	}
</style>
