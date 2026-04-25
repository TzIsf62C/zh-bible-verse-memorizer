<script>
	import { createEventDispatcher } from 'svelte';
	import { verses as versesStore } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';
	import Modal from './Modal.svelte';
	import Keyboard from './Keyboard.svelte';
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';
	import { triggerErrorFeedback } from '$lib/utils/feedback';

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

	// Keyboard state variables
	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;

	// Error tracking and scrolling
	let lastErrorIndex = null;
	let lastErrorChar = null;
	let scrollTrigger = 0;
	let viewportAnchor;
	let showInputMismatchWarning = false;

	// Scroll viewport to position content above keyboard after each input
	$: {
		if (viewportAnchor && currentVerse && !feedbackText) {
			// Include userInput and scrollTrigger in reactive dependencies
			const _ = userInput.length;
			const __ = scrollTrigger;
			
			setTimeout(() => {
				const anchorRect = viewportAnchor.getBoundingClientRect();
				
				// Find keyboard element (it's inside the keyboard-space div)
				const keyboardSpace = viewportAnchor.nextElementSibling;
				if (keyboardSpace) {
					const keyboardRect = keyboardSpace.getBoundingClientRect();
					
					// Calculate scroll position: align anchor with keyboard's top edge
					const scrollTarget = window.scrollY + (anchorRect.top - keyboardRect.top);
					
					window.scrollTo({ 
						top: scrollTarget, 
						behavior: 'smooth' 
					});
				}
			}, 150);
		}
	}

	// Scroll when feedback message appears to ensure it's visible above keyboard
	$: {
		if (feedbackText && viewportAnchor) {
			setTimeout(() => {
				const keyboardSpace = viewportAnchor.nextElementSibling;
				if (keyboardSpace) {
					const keyboardRect = keyboardSpace.getBoundingClientRect();
					const viewportHeight = window.innerHeight;
					
					// Scroll to ensure there's comfortable space above keyboard
					// Use passage-display as reference point
					const passageDisplay = document.querySelector('.passage-display');
					if (passageDisplay) {
						const passageRect = passageDisplay.getBoundingClientRect();
						const passageBottom = passageRect.bottom;
						
						// If passage bottom + feedback is too close to keyboard, scroll up
						if (passageBottom > keyboardRect.top - 50) {
							const scrollAdjustment = passageBottom - keyboardRect.top + 100; // Add 100px buffer
							window.scrollTo({
								top: window.scrollY + scrollAdjustment,
								behavior: 'smooth'
							});
						}
					}
				}
			}, 150);
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
				scrollTrigger++;
			}
		}
	}

	// Check if all verses are from same book/chapter
	$: allSameBookChapter = verses.every(v => 
		v.bookName === verses[0]?.bookName && 
		v.chapterNumber === verses[0]?.chapterNumber
	);

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
		feedbackText = `${t('accuracy')}: ${accuracy.toFixed(1)}%`;
		feedbackClass = accuracy >= 90 ? 'success' : 'error';

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
				const updated = spacedRepetitionBinary(card, success, now);
				return {
					...v,
					interval: updated.interval,
					repetitions: updated.repetitions,
					// dueDate from spacedRepetitionBinary is a Date object
					dueDate: updated.dueDate instanceof Date ? updated.dueDate.toISOString() : updated.dueDate,
					lastReviewed: success ? now.toISOString() : v.lastReviewed
				};
			}
			return v;
		}));

		if (success) {
			successCount++;
		}

		// Advance to next verse after delay
		setTimeout(() => {
			// Clear feedback BEFORE incrementing currentIndex
			// This ensures the reactive initializeVerse statement can run properly
			feedbackText = '';
			feedbackClass = '';
			userInput = '';
			
			currentIndex++;

			if (currentIndex >= verses.length) {
				// Session complete
				showCompletionModal();
			}
		}, 1500);
	}

	function showCompletionModal() {
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
		<button class="exit-btn" on:click={exitReview} aria-label={t('exit')}>×</button>
	</div>
	
	<div class="progress-bar">
		<div class="progress-text">
			<div>{currentIndex + 1} / {verses.length}</div>
		</div>
		<div class="progress-fill" style="width: {((currentIndex + 1) / verses.length) * 100}%"></div>
	</div>

	<div class="passage-display">
		<!-- Completed verses with preserved styling -->
		{#each completedVerses as {verse, renderedChars}, i (verse.id)}
			<div class="completed-verse">
				{#if i === 0 || !allSameBookChapter}
					<span class="reference-inline">{formatVerseRef(verse)}</span>
				{:else}
					<span class="reference-inline">{verse.verseNumber}</span>
				{/if}
				<!-- Render with preserved correct/incorrect styling -->
				{#each renderedChars as rendered, charIndex (charIndex)}
					<span class="{rendered.className}">{rendered.char}</span>
				{/each}
			</div>
		{/each}

		<!-- Current verse being typed (hidden during feedback to prevent duplication) -->
		{#if currentVerse && !feedbackText}
			{#key currentVerse.id}
			<div class="current-verse">
				<!-- Show reference first (always visible) -->
				{#if currentIndex === 0 || !allSameBookChapter}
					<span class="reference-inline">{formatVerseRef(currentVerse)}</span>
				{:else}
					<span class="reference-inline">{currentVerse.verseNumber}</span>
				{/if}
				<!-- Then verse text with hidden characters -->
			{#each renderedChars as rendered, charIndex (charIndex)}
				<span class="{rendered.className}">{rendered.char}</span>
				{/each}
			</div>
			{/key}
		{/if}
	</div>

	{#if feedbackText}
		<div class="feedback {feedbackClass}">
			{feedbackText}
		</div>
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

		<!-- Invisible viewport anchor for keyboard positioning -->
		<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>

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

	}

	.review-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;
	}

	.exit-btn {
		padding: 0.5rem;
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		background: transparent;
		color: #000;
		cursor: pointer;
		font-size: 1.5em;
		font-weight: 300;
		line-height: 1;
		transition: opacity 0.2s;
		opacity: 0.6;
	}

	.exit-btn:hover {
		opacity: 1;
	}

	:global([data-theme='dark']) .exit-btn {
		color: #fff;
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
		margin-bottom: 1rem;
	}

	.feedback.success {
		color: #4caf50;
	}

	.feedback.error {
		color: #f44336;
	}

	[data-theme='dark'] .feedback.success {
		color: #81c784;
	}

	[data-theme='dark'] .feedback.error {
		color: #ef5350;
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
		background: #fff3e0;
		color: #e65100;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9em;
		border: 1px solid #ff9800;
	}

	[data-theme='dark'] .warning-message {
		background: #e65100;
		color: #ffb74d;
		border-color: #ffb74d;
	}

	.viewport-anchor {
		height: 0;
		width: 0;
		overflow: hidden;
		visibility: hidden;
	}

	.keyboard-space {
		margin-top: 1.5rem;
	}

	/* Keyboard disabled state during feedback */
	.keyboard-space.keyboard-disabled {
		pointer-events: none;
		opacity: 0.6;
	}

	/* Character styling */
	:global(.verse-character) {
		display: inline;
		transition: all 0.15s ease;
	}

	:global(.verse-character.correct) {
		color: var(--text-color);
	}

	:global(.verse-character.incorrect) {
		color: #f44336;
		background: rgba(244, 67, 54, 0.1);
		padding: 0 2px;
		border-radius: 2px;
	}

	:global(.verse-character.hidden) {
		opacity: 0;
		pointer-events: none;
	}

	:global(.verse-character.punctuation) {
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

		}

		.passage-display {
			font-size: 1.2em;
			padding: 1.5rem;
		}

		.keyboard-space {
			margin-top: 1rem;
		}
	}
</style>
