<script>
	import { createEventDispatcher, tick } from 'svelte';
	import { verses as versesStore } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';
	import { appendCategoryHistory } from '$lib/utils/categoryHistory.js';
	import Modal from './Modal.svelte';
	import Keyboard from './Keyboard.svelte';
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { initializeHeatArray, updateHeatArray, buildCorrectnessMap } from '$lib/utils/heatTracking';

	export let verses = [];

	const dispatch = createEventDispatcher();

	// Create verse reference formatter that checks ALL verses for duplicates (not just current review set)
	$: formatVerseRef = createVerseReferenceFormatter($versesStore);

	let showCompletionMsg = false;
	let completionMessage = '';

	let currentIndex = 0;
	let userInput = '';
	let successCount = 0;
	let feedbackText = '';
	let feedbackClass = '';
	let isTransitioningToFeedback = false;

	// Keyboard state variables
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;

	// Error tracking and scrolling
	let lastErrorIndex = null;
	let lastErrorChar = null;
	let showInputMismatchWarning = false;

	function scrollFeedbackIntoViewIfNeeded() {
		const feedbackElement = document.querySelector('.feedback');
		const keyboardElement = document.querySelector('.keyboard-space .keyboard');

		if (!feedbackElement || !keyboardElement) {
			return;
		}

		const feedbackRect = feedbackElement.getBoundingClientRect();
		const keyboardRect = keyboardElement.getBoundingClientRect();
		const minGap = 12;
		const overlap = feedbackRect.bottom + minGap - keyboardRect.top;

		// Only scroll when feedback is actually covered or too close to the keyboard.
		if (overlap > 0) {
			window.scrollTo({
				top: window.scrollY + overlap,
				behavior: 'smooth'
			});
		}
	}

	async function scrollNextHiddenCharacterIntoViewIfNeeded() {
		if (!currentVerse || feedbackText || userInput.length >= reviewFullInitials.length) {
			return;
		}

		await tick();

		const keyboardElement = document.querySelector('.keyboard-space .keyboard');
		if (!keyboardElement) {
			return;
		}

		const nextInputIndex = userInput.length;
		const nextCharIndex = inputIndexToCharIndex[nextInputIndex];
		if (nextCharIndex === undefined || nextCharIndex === null) {
			return;
		}

		const nextCharElement = document.querySelector(`.current-verse [data-char-index="${nextCharIndex}"]`);
		if (!nextCharElement) {
			return;
		}

		const keyboardRect = keyboardElement.getBoundingClientRect();
		const charRect = nextCharElement.getBoundingClientRect();
		const visibleTop = 12;
		const visibleBottom = keyboardRect.top - 12;

		const isVisible = charRect.top >= visibleTop && charRect.bottom <= visibleBottom;
		if (isVisible) {
			return;
		}

		const targetCenter = (visibleTop + visibleBottom) / 2;
		const charCenter = charRect.top + charRect.height / 2;
		const scrollDelta = charCenter - targetCenter;

		if (Math.abs(scrollDelta) > 2) {
			window.scrollTo({
				top: window.scrollY + scrollDelta,
				behavior: 'smooth'
			});
		}
	}

	// Current verse data
	let reviewFullText = '';
	let reviewFullInitials = '';
	let charToInputIndex = [];
	let inputIndexToCharIndex = [];
	let initializedVerseId = null;
	let verseReadyToRender = false; // Flag to prevent rendering before mapping is built
	let renderedChars = []; // Rendered characters array (computed reactively)

	// Reset keyboard feedback when verse changes
	$: {
		const _ = currentIndex;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		verseReadyToRender = false; // Prevent stale renderedChars computation
		console.log('[SingleTextReview] Verse changed, feedback reset, verseReadyToRender = false');
	}

	// Track feedback changes for debugging
	$: console.log('[SingleTextReview] Feedback state:', { pressedKey, correctKey, lastCorrectKey });

	// Create reactive rendered characters array for progressive reveal
	// Explicitly depend on reviewFullText, userInput, verseReadyToRender, AND currentVerse.id
	// Only compute when reviewFullText has content AND mapping is ready to prevent stale data
	$: {
		// Explicit dependency tracking
		const _text = reviewFullText;
		const _input = userInput;
		const _ready = verseReadyToRender;
		const _verseId = currentVerse?.id; // Ensure recomputation on verse change
		
		if (_text && _text.length > 0 && _ready) {
			renderedChars = [..._text].map((char, index) => ({
				char,
				...renderCharacter(char, index)
			}));
			console.log('[SingleTextReview] renderedChars computed, length:', renderedChars.length, 'userInput:', _input, 'verseId:', _verseId);
		} else {
			renderedChars = [];
			console.log('[SingleTextReview] renderedChars cleared (empty array)', 'reviewFullText.length:', _text.length, 'verseReadyToRender:', _ready, 'verseId:', _verseId);
		}
	}

	// Check for input method mismatch and show warning
	$: {
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
				feedbackText = t('input_method_mismatch').replace('{method}', methodNames[verseInputMethod] || verseInputMethod);
				feedbackClass = 'warning';
			} else if (verseInputMethod === currentMethod && feedbackClass === 'warning') {
				feedbackText = '';
				feedbackClass = '';
			}
		}
	}

	// Update keyboard layout based on input method (no numeric keyboard needed in SingleTextReview)
	$: {
		const inputMethod = $settings.inputMethod || 'pinyin';
		keyboardLayout = keyboardLayouts[`${inputMethod}Compact`] || keyboardLayouts.pinyinCompact;
		isNumericKeyboard = false;
	}

	$: currentVerse = verses[currentIndex];

	// Initialize verse data when current verse changes (based on ID)
	$: if (currentVerse && currentVerse.id !== initializedVerseId && feedbackClass !== 'success' && feedbackClass !== 'error') {
		initializeVerse(currentVerse);
		initializedVerseId = currentVerse.id;
	}

	// Auto-focus hidden input for physical keyboard
	let hiddenInputElement;
	$: if (currentVerse && !feedbackText && hiddenInputElement) {
		console.log('[SingleTextReview] Auto-focusing hidden input');
		setTimeout(() => hiddenInputElement?.focus(), 100);
	}

	function detectInputMethod(initials) {
		if (!initials || initials.length === 0) return null;
		
		const sample = initials.split('').filter(c => !/[0-9]/.test(c)).slice(0, 5).join('');
		if (!sample) return null;
		
		if (/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/.test(sample)) return 'zhuyin';
		if (/[\u4e00-\u9fa5]/.test(sample)) return 'cangjie';
		if (/[a-z]/.test(sample)) return 'pinyin';
		
		return null;
	}

	function initializeVerse(verse) {
		console.log('[SingleTextReview] initializeVerse called for verse:', verse.id);
		
		// Prevent rendering during initialization to avoid using stale mapping data
		verseReadyToRender = false;
		console.log('[SingleTextReview] Set verseReadyToRender = false');
		userInput = '';
		
		// CRITICAL: Clear ALL state before setting new verse to prevent stale data
		// Clear mapping arrays FIRST (before setting reviewFullText) so renderCharacter 
		// doesn't use old verse's mapping when reactive renderedChars triggers
		charToInputIndex = [];
		inputIndexToCharIndex = [];
		reviewFullText = '';
		reviewFullInitials = '';
		
		// Now set new verse data - reactive renderedChars will use clean slate
		reviewFullText = verse.verseText;
		reviewFullInitials = verse.verseInitials;

		console.log('[SingleTextReview] reviewFullText:', reviewFullText);
		console.log('[SingleTextReview] reviewFullInitials:', reviewFullInitials);

		// Build character-to-input mapping for verse text only (Chinese chars only, no digits)
		const chars = [...reviewFullText];
		charToInputIndex = new Array(chars.length).fill(null);
		inputIndexToCharIndex = [];
		let inputIdx = 0;
		
		for (let i = 0; i < chars.length; i++) {
			const ch = chars[i];
			if (/[\u4e00-\u9fa5]/.test(ch)) {
				charToInputIndex[i] = inputIdx;
				inputIndexToCharIndex[inputIdx] = i;
				inputIdx++;
			} else {
				charToInputIndex[i] = null;
			}
		}
		console.log('[SingleTextReview] Mapping complete. Total input chars:', inputIdx);
		
		// Now it's safe to render - mapping arrays are built
		verseReadyToRender = true;
		console.log('[SingleTextReview] Set verseReadyToRender = true');
		
		// Immediately compute initial renderedChars to show initial punctuation
		renderedChars = [...reviewFullText].map((char, index) => ({
			char,
			...renderCharacter(char, index)
		}));
		console.log('[SingleTextReview] Initial renderedChars computed in initializeVerse, length:', renderedChars.length);
	}

	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];

		if (map !== null) {
			// Input-requiring character
			const expected = reviewFullInitials[map];
			let className = 'verse-character';
			let hidden = true; // Always hidden initially (like advanced mode)

			// Reveal as user types
			if (userInput.length > map) {
				const inputMethod = $settings.inputMethod || 'pinyin';
				const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
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
				if (prevMap !== null && userInput.length > prevMap) {
					shown = true;
					className = 'verse-character punctuation correct';
				} else {
					shown = false;
					className = 'verse-character punctuation hidden';
				}
			}

			return { char, className, hidden: !shown };
		}
	}

	function handleKeyInput(event) {
		const key = event.detail;
		console.log('[SingleTextReview] handleKeyInput called with key:', key);
		console.log('[SingleTextReview] Current userInput:', userInput);
		console.log('[SingleTextReview] Expected initials:', reviewFullInitials);

		if (key === '⌫' || key === 'Backspace') {
			console.log('[SingleTextReview] Backspace pressed - disabled in review');
			// Backspace disabled in review
			return;
		}

		if (key === '↵' || key === 'Enter') {
			console.log('[SingleTextReview] Enter pressed');
			if (userInput.length === reviewFullInitials.length) {
				checkAnswer();
			}
			return;
		}

		// Clear previous feedback
		console.log('[SingleTextReview] Clearing previous feedback');
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		
		// Check correctness
		const inputMethod = $settings.inputMethod || 'pinyin';
		const nextExpectedChar = reviewFullInitials[userInput.length];
		const normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
		const normalizedExpected = inputMethod === 'pinyin' ? (nextExpectedChar || '').toLowerCase() : (nextExpectedChar || '');
		
		console.log('[SingleTextReview] Next expected char:', nextExpectedChar, 'Normalized:', normalizedExpected);
		console.log('[SingleTextReview] Key pressed:', key, 'Normalized:', normalizedKey);
		
		if (normalizedKey === normalizedExpected) {
			console.log('[SingleTextReview] Key is CORRECT');
			lastCorrectKey = key;
			console.log('[SingleTextReview] Set lastCorrectKey to:', lastCorrectKey);
		} else {
			console.log('[SingleTextReview] Key is INCORRECT');
			pressedKey = key;
			correctKey = nextExpectedChar;
			console.log('[SingleTextReview] Set pressedKey to:', pressedKey, 'correctKey to:', correctKey);
		}

		userInput += key;
		console.log('[SingleTextReview] Updated userInput:', userInput);
		console.log('[SingleTextReview] Feedback variables after update:', { pressedKey, correctKey, lastCorrectKey });
		updateErrorFeedback();
		scrollNextHiddenCharacterIntoViewIfNeeded();

		// Auto-submit when complete
		if (userInput.length === reviewFullInitials.length) {
			console.log('[SingleTextReview] Input complete, checking answer');
			checkAnswer();
		}
	}

	function handlePhysicalKeyboard(e) {
		if (!currentVerse) {
			return;
		}
		if (feedbackClass === 'success' || feedbackClass === 'error') {
			return;
		}

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
			
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			
			const nextExpectedChar = reviewFullInitials[userInput.length];
			const normalizedKey = inputMethod === 'pinyin' ? mappedValue.toLowerCase() : mappedValue;
			const normalizedExpected = inputMethod === 'pinyin' ? (nextExpectedChar || '').toLowerCase() : (nextExpectedChar || '');
			
			
				if (normalizedKey === normalizedExpected) {
				lastCorrectKey = mappedValue;
			} else {
				pressedKey = mappedValue;
				correctKey = nextExpectedChar;
			}
			
			userInput += mappedValue;
			updateErrorFeedback();
			scrollNextHiddenCharacterIntoViewIfNeeded();
			
			if (userInput.length === reviewFullInitials.length) {
				checkAnswer();
			}
		}
	}

	function updateErrorFeedback() {
		const inputMethod = $settings.inputMethod || 'pinyin';
		let latestErrorIndex = -1;
		let latestErrorChar = '';

		for (let i = 0; i < userInput.length; i++) {
			const expected = reviewFullInitials[i];
			const typed = userInput[i];
			const expectedNorm = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
			const typedNorm = inputMethod === 'pinyin' ? typed.toLowerCase() : typed;
			
			if (typedNorm !== expectedNorm) {
				latestErrorIndex = i;
				latestErrorChar = expected;
			}
		}

		if (latestErrorIndex === -1) {
			lastErrorIndex = null;
			lastErrorChar = null;
		} else {
			if (lastErrorIndex !== latestErrorIndex || lastErrorChar !== latestErrorChar) {
				lastErrorIndex = latestErrorIndex;
				lastErrorChar = latestErrorChar;
				triggerErrorFeedback($settings);
			}
		}
	}

	// Check if all verses are from same book
	$: allSameBook = verses.every(v => 
		v.bookName === verses[0]?.bookName
	);

	function getDisplayReference(verse, isFirst = false) {
		if (!verse) return '';
		if (isFirst) {
			return `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
		}
		if (allSameBook) {
			return `${verse.chapterNumber}:${verse.verseNumber}`;
		}
		return formatVerseRef(verse);
	}

	// Store completed verses with their final rendering for display
	let completedVerses = [];

	function checkAnswer() {
		// Calculate accuracy against reviewFullInitials
		const inputMethod = $settings.inputMethod || 'pinyin';
		let correct = 0;
		for (let i = 0; i < reviewFullInitials.length; i++) {
			const expected = reviewFullInitials[i];
			const typed = userInput[i];
			const expectedNorm = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
			const typedNorm = inputMethod === 'pinyin' ? (typed || '').toLowerCase() : (typed || '');
			
			if (typedNorm === expectedNorm) {
				correct++;
			}
		}

		const accuracy = reviewFullInitials.length > 0 ? (correct / reviewFullInitials.length) * 100 : 0;
		const nextFeedbackText = `${t('accuracy')}: ${accuracy.toFixed(1)}%`;
		const nextFeedbackClass = accuracy >= 90 ? 'success' : 'error';

			isTransitioningToFeedback = true;

		setTimeout(() => {
			feedbackText = nextFeedbackText;
			feedbackClass = nextFeedbackClass;
			setTimeout(scrollFeedbackIntoViewIfNeeded, 50);
			}, 180);

		// Build correctness map for heat tracking (verse text only)
		const correctnessMap = buildCorrectnessMap(
			currentVerse.verseText,
			currentVerse.bookName,
			currentVerse.chapterNumber,
			currentVerse.verseNumber,
			currentVerse.verseInitials,
			currentVerse.bookInitials,
			userInput,
			inputMethod,
			true // verseTextOnly: only track verse text in SingleTextReview
		);

		// Save current verse's final rendered state BEFORE advancing
		const finalRenderedChars = [...reviewFullText].map((char, index) => ({
			char,
			...renderCharacter(char, index)
		}));
		completedVerses = [...completedVerses, {
			verse: currentVerse,
			renderedChars: finalRenderedChars
		}];

		// Update spaced repetition (silently - no modals)
		const now = new Date();
		const success = accuracy >= 90;

		versesStore.update(list => list.map(v => {
			if (v.id === currentVerse.id) {
				const card = {
					interval: v.interval || 0,
					repetitions: v.repetitions || 0,
					dueDate: v.dueDate
				};
				const updated = spacedRepetitionBinary(card, success, now, $settings.secondChanceRecoveryPercent ?? 60);
				const categoryHistory = appendCategoryHistory(v, updated.interval, now);
				
				// Initialize or update heatArray (verse text only)
				let newHeatArray = v.heatArray;
				if (!newHeatArray) {
					// First review: initialize heat array for full verse + reference
					newHeatArray = initializeHeatArray(
						v.verseText,
						v.bookName,
						v.chapterNumber,
						v.verseNumber
					);
				}
				// Update based on this review's performance (verse text only, reference unchanged)
				newHeatArray = updateHeatArray(newHeatArray, correctnessMap);
				
				return {
					...v,
					isLearned: v.isLearned || Boolean(v.lastReviewed),
					interval: updated.interval,
					repetitions: updated.repetitions,
					// dueDate from spacedRepetitionBinary is a Date object
					dueDate: updated.dueDate instanceof Date ? updated.dueDate.toISOString() : updated.dueDate,
					lastReviewed: success ? now.toISOString() : v.lastReviewed,
					heatArray: newHeatArray,
					categoryHistory
				};
			}
			return v;
		}));

		dispatch('reviewed');

		if (success) {
			successCount++;
		}

		// Advance to next verse after delay
		setTimeout(() => {
			// Clear feedback BEFORE incrementing currentIndex
			// This ensures the reactive initializeVerse statement can run properly
			feedbackText = '';
			feedbackClass = '';
			isTransitioningToFeedback = false;
			userInput = '';
			
			currentIndex++;

			if (currentIndex >= verses.length) {
				// Session complete
				showCompletionModal();
			}
		}, 1500);
	}

	function showCompletionModal() {
		isTransitioningToFeedback = false;
		const msg = successCount > 0
			? t('congratulations_reviewed_count', { count: successCount })
			: t('congratulations_reviewed');
		completionMessage = msg;
		showCompletionMsg = true;
	}

	function handleCompletionConfirm() {
		showCompletionMsg = false;
		// Don't dispatch 'complete' here - stay on page to review mistakes
		// User will navigate away manually via navigation buttons
	}

	function exitReview() {
		dispatch('exit');
	}
</script>

<div class="single-text-review">
	<div class="review-header">
		<button class="back-btn exit-btn" on:click={exitReview} aria-label={t('exit')}>×</button>
	</div>
	
	<div class="progress-bar">
		<div class="progress-text">
			<div>{currentIndex} / {verses.length}</div>
		</div>
		<div class="progress-fill" style="width: {((currentIndex) / verses.length) * 100}%"></div>
	</div>

	<div class="passage-display">
		<!-- Completed verses with preserved styling -->
		{#each completedVerses as {verse, renderedChars}, i (verse.id)}
			<div class="completed-verse">
				<span class="reference-inline">{getDisplayReference(verse, i === 0)}</span>
				<!-- Render with preserved correct/incorrect styling -->
				{#each renderedChars as rendered, charIndex (charIndex)}
					<span class="{rendered.className}">{rendered.char}</span>
				{/each}
			</div>
		{/each}

		<!-- Current verse being typed (hidden during feedback to prevent duplication) -->
		{#if currentVerse && !feedbackText && !isTransitioningToFeedback}
			{#key currentVerse.id}
			<div class="current-verse">
				<!-- Show reference first (always visible) -->
				<span class="reference-inline">{getDisplayReference(currentVerse, currentIndex === 0)}</span>
				<!-- Then verse text with hidden characters -->
			{#each renderedChars as rendered, charIndex (charIndex)}
				<span class="{rendered.className}" data-char-index={charIndex}>{rendered.char}</span>
				{/each}
			</div>
			{/key}
		{/if}
	</div>

	{#if feedbackText}
		<div class="feedback {feedbackClass}">
			{feedbackText}
		</div>
	{:else}
		<div class="feedback feedback-placeholder" aria-hidden="true"></div>
	{/if}

	{#if currentVerse}
		<!-- Hidden input for physical keyboard capture -->
		<!-- Note: Positioned off-screen but must remain focusable for keyboard events -->
		<input
			bind:this={hiddenInputElement}
			type="text"
			class="visually-hidden-input"
			value=""
			on:input={(e) => { e.target.value = ''; console.log('[SingleTextReview] Input event blocked'); }}
			on:keydown={(e) => {
				if (feedbackText) {
					console.log('[SingleTextReview] Keyboard disabled during feedback');
					e.preventDefault();
					return;
				}
				console.log('[SingleTextReview] Keydown event fired:', e.key);
				handlePhysicalKeyboard(e);
			}}
			on:focus={() => console.log('[SingleTextReview] Input focused')}
			on:blur={() => console.log('[SingleTextReview] Input blurred')}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
			inputmode="none"
			aria-label="Hidden input for keyboard capture"
		/>

		<!-- Warning for mismatched input methods -->
		{#if showInputMismatchWarning}
			<div class="warning-message">
				{t('input_method_mismatch_warning')}
			</div>
		{/if}

		<!-- Onscreen keyboard - always visible, but disabled during feedback -->
		<div class="keyboard-space" class:keyboard-disabled={feedbackText}>
			<Keyboard 
				layout={keyboardLayout}
				showBackspace={false}
				showEnter={false}
				isNumeric={isNumericKeyboard}
				pressedKey={pressedKey}
				correctKey={correctKey}
				lastCorrectKey={lastCorrectKey}
				on:key={(e) => {
					if (feedbackText) {
						console.log('[SingleTextReview] Onscreen keyboard disabled during feedback');
						return;
					}
					handleKeyInput(e);
				}}
			/>
		</div>
	{/if}
</div>

<Modal 
	show={showCompletionMsg} 
	message={completionMessage}
	on:close={handleCompletionConfirm}
/>

<style>
	.single-text-review {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		justify-self: stretch;
		min-width: 0;
		padding: 2rem 1rem;
		padding-top: 0px;
		padding-bottom: calc(20rem + env(safe-area-inset-bottom, 0px));

	}

	.review-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;
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
		margin-bottom: 1.5rem;
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
		text-align: center;
	}


	.passage-display {
		width: 100%;
		background: var(--panel-background);
		padding: 2rem;
		border: 1px solid var(--file-border);
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 1.5em;
		line-height: 1.5;
		min-height: 200px;
		/* Prevent horizontal overflow from hidden characters */
		overflow-wrap: break-word;
		word-wrap: break-word;
		word-break: break-word;
		overflow-x: hidden;
		position: relative;
	}

	.passage-display.is-second-chance {
		border-color: var(--warning-color);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--warning-color) 30%, transparent);
	}

	.completed-verse {
		display: block;
		margin-bottom: 0rem;
		line-height: 1.5;
		color: var(--text-color);
	}

	.current-verse {
		display: block;
		line-height: 1.5;
		color: var(--text-color);
	}

	:global(.reference-inline) {
		color: var(--subtitle-color);
		font-size: 0.9em;
		margin-right: 0.5em;
		font-weight: 500;
	}

	.feedback {
		text-align: center;
		font-size: 1em;
		margin-bottom: 1.25rem;
		min-height: 2em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.feedback.success {
		color: var(--success-color);
	}

	.feedback.error {
		color: var(--danger-color);
	}

	.visually-hidden-input {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
		/* Note: pointer-events must NOT be none - it blocks keyboard events! */
		/* Input must remain focusable to capture keyboard events */
	}

	.warning-message {
		text-align: center;
		padding: 0.75rem;
		background: color-mix(in srgb, var(--warning-color) 15%, transparent);
		color: var(--warning-color);
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9em;
		border: 1px solid var(--warning-color);
	}

	.keyboard-space {
		margin-top: 1.5rem;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	/* Keyboard disabled state during feedback */
	.keyboard-space.keyboard-disabled {
		pointer-events: none;
		opacity: 0.6;
	}

	/* Character styling */
	.passage-display :global(.verse-character) {
		display: inline;
		transition: all 0.15s ease;
	}

	.passage-display :global(.verse-character.correct) {
		color: var(--text-color);
	}

	.passage-display :global(.verse-character.incorrect) {
		color: var(--danger-color);
		background: color-mix(in srgb, var(--danger-color) 12%, transparent);
		padding: 0 2px;
		border-radius: 2px;
	}

	.passage-display :global(.verse-character.hidden) {
		opacity: 0;
		pointer-events: none;
	}

	.passage-display :global(.verse-character.punctuation) {
		color: var(--text-color);
	}

	.completed-verse {
		color: var(--text-color);
	}

	.verse-text {
		color: var(--text-color);
	}

	.reference-inline {
		color: var(--subtitle-color);
		font-size: 0.9em;
		margin-right: 0.5em;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.single-text-review {
			padding: 1rem 0.5rem;
			padding-top: 0px;
			padding-bottom: calc(18rem + env(safe-area-inset-bottom, 0px));

		}

		.passage-display {
			padding: 1.5rem;
		}

		.keyboard-space {
			margin-top: 1rem;
		}
	}
</style>
