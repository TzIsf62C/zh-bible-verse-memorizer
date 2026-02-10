<script>
	import { verses } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';

	let currentVerseIdx = 0;
	let currentStage = 'basic'; // basic, intermediate, advanced - user can choose any
	let intermediateVariant = 'odd'; // or 'even'
	let userInput = '';
	let feedbackMessage = '';
	let feedbackType = ''; // success, error, warning
	let accuracy = 0;
	let showNextButton = false;
	let showRetryButton = false;
	let keyboardLayout = keyboardLayouts.pinyin;
	let versesToLearn = [];
	let learnFullText = '';
	let learnFullInitials = '';
	let charToInputIndex = [];
	let inputIndexToCharIndex = [];

	// Update keyboard layout when input method changes
	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	// Filter unlearned verses - verses WITHOUT lastReviewed dates are unlearned
	$: {
		versesToLearn = $verses.filter((v) => !v.lastReviewed);
		console.log('[Learn] Filtered unlearned verses:', {
			total: $verses.length,
			unlearned: versesToLearn.length,
			filtered: versesToLearn.map(v => `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`)
		});
		
		// If we had a verse selected but it's now learned, reset
		if (currentVerseIdx >= versesToLearn.length) {
			currentVerseIdx = 0;
		}
		
		// Initialize first verse if available
		if (versesToLearn.length > 0 && currentVerseIdx === 0) {
			initializeVerse(versesToLearn[0]);
		}
	}

	function selectVerse(idx) {
		currentVerseIdx = idx;
		const verse = versesToLearn[idx];
		if (verse) {
			initializeVerse(verse);
		}
		console.log('[Learn] Selected verse', verse);
	}

	function setStage(stage) {
		currentStage = stage;
		userInput = '';
		feedbackMessage = '';
		showNextButton = false;
		showRetryButton = false;
		console.log('[Learn] Stage changed to', stage);
	}

	function initializeVerse(verse) {
		userInput = '';
		feedbackMessage = '';
		showNextButton = false;
		showRetryButton = false;

		// Combine verse text and reference like original app
		learnFullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
		
		// Combine all expected inputs: verse initials + book initials + chapter + verse number
		learnFullInitials = `${verse.verseInitials}${verse.bookInitials}${String(verse.chapterNumber)}${String(verse.verseNumber)}`;

		// Build character-to-input mapping (critical for punctuation handling)
		const chars = [...learnFullText];
		charToInputIndex = new Array(chars.length).fill(null);
		inputIndexToCharIndex = [];
		let inputIdx = 0;
		
		for (let i = 0; i < chars.length; i++) {
			const ch = chars[i];
			// Only Chinese characters and digits require input
			if (/[\u4e00-\u9fa5]/.test(ch) || /[0-9]/.test(ch)) {
				charToInputIndex[i] = inputIdx;
				inputIndexToCharIndex[inputIdx] = i;
				inputIdx++;
			} else {
				charToInputIndex[i] = null; // Punctuation/whitespace
			}
		}

		console.log('[Learn] Initialized verse:', {
			fullText: learnFullText,
			fullInitials: learnFullInitials,
			expectedLength: learnFullInitials.length,
			charToInputMap: charToInputIndex
		});
	}

	function getCurrentVerse() {
		if (!versesToLearn.length) return null;
		return versesToLearn[currentVerseIdx];
	}

	function getExpectedInitials() {
		return learnFullInitials;
	}

	function handleKeyInput(event) {
		const key = event.detail;
		console.log('[Learn] Keyboard key pressed:', key);

		if (key === '⌫' || key === 'Backspace') {
			// Backspace is disabled during learning - ignore
			console.log('[Learn] Backspace disabled during learning');
			return;
		}

		if (key === '↵' || key === 'Enter') {
			if (userInput.length === learnFullInitials.length) {
				submitAnswer();
			}
			return;
		}

		userInput += key;
		console.log('[Learn] User input now:', userInput, 'expected:', learnFullInitials);

		// Auto-submit when input matches expected length
		if (userInput.length === learnFullInitials.length) {
			submitAnswer();
		}
	}

	function submitAnswer() {
		const expected = getExpectedInitials();

		if (!expected) {
			feedbackMessage = t('fill_all_fields');
			feedbackType = 'error';
			console.log('[Learn] Submit failed - no expected initials');
			return;
		}

		// Calculate accuracy
		let correctChars = 0;
		const inputMethod = $settings.inputMethod || 'pinyin';
		for (let i = 0; i < expected.length; i++) {
			const typedChar = inputMethod === 'pinyin' ? (userInput[i] || '').toLowerCase() : (userInput[i] || '');
			const expectedChar = inputMethod === 'pinyin' ? expected[i].toLowerCase() : expected[i];
			if (typedChar === expectedChar) {
				correctChars++;
			}
		}

		accuracy = Math.round((correctChars / expected.length) * 100);
		console.log('[Learn] Submitted answer', {
			stage: currentStage,
			accuracy,
			inputLength: userInput.length,
			expectedLength: expected.length,
			correctChars,
			totalExpected: expected.length
		});

		if (accuracy >= 90) {
			// Success!
			console.log('[Learn] Success at', currentStage, 'stage');
			
			if (currentStage === 'basic') {
				console.log('[Learn] Auto-advancing from basic to intermediate');
				feedbackMessage = '';
				feedbackType = '';
				currentStage = 'intermediate';
				userInput = '';
				showNextButton = false;
				showRetryButton = false;
			} else if (currentStage === 'intermediate') {
				console.log('[Learn] Auto-advancing from intermediate to advanced');
				feedbackMessage = '';
				feedbackType = '';
				currentStage = 'advanced';
				userInput = '';
				showNextButton = false;
				showRetryButton = false;
			} else if (currentStage === 'advanced') {
				console.log('[Learn] Completed advanced stage - verse learned');
				feedbackMessage = `${t('congratulations_mastered')} (${accuracy}%)`;
				feedbackType = 'success';
				// Mark verse as learned
				updateVerseProgress(getCurrentVerse());
				showNextButton = true;
				userInput = '';
			}
		} else {
			// Failed - show error feedback
			console.log('[Learn] Failed with accuracy:', accuracy);
			let mismatchIndex = -1;
			for (let i = 0; i < Math.max(userInput.length, expected.length); i++) {
				const typedChar = inputMethod === 'pinyin' ? (userInput[i] || '').toLowerCase() : (userInput[i] || '');
				const expectedChar = inputMethod === 'pinyin' ? expected[i].toLowerCase() : expected[i];
				if (typedChar !== expectedChar) {
					mismatchIndex = i;
					break;
				}
			}
			if (currentStage === 'intermediate') {
				intermediateVariant = intermediateVariant === 'odd' ? 'even' : 'odd';
				console.log('[Learn] Toggled intermediate variant to', intermediateVariant);
			}
			feedbackMessage = `${t('nice_try')} (${accuracy}%)`;
			feedbackType = 'error';
			showRetryButton = true;
			userInput = '';
		}
	}

	function updateVerseProgress(verse) {
		const today = new Date();
		const updatedVerse = spacedRepetitionBinary(verse, true, today);

		verses.update((list) =>
			list.map((v) => (v.id === verse.id ? { ...updatedVerse, lastReviewed: today.toISOString() } : v))
		);
	}

	function handleRetry() {
		// Toggle intermediate variant on retry if in intermediate mode
		if (currentStage === 'intermediate') {
			intermediateVariant = intermediateVariant === 'odd' ? 'even' : 'odd';
		}
		userInput = '';
		feedbackMessage = '';
		accuracy = 0;
		showNextButton = false;
		showRetryButton = false;
	}

	function handleNext() {
		if (currentVerseIdx < versesToLearn.length - 1) {
			selectVerse(currentVerseIdx + 1);
			setStage('basic'); // Reset to basic for new verse
		} else {
			// No more verses
			feedbackMessage = t('completed_all_verses');
			feedbackType = 'warning';
		}
	}

	// Character rendering logic matching original app
	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];

		if (map !== null) {
			// Input-requiring character (Chinese or digit)
			const expected = learnFullInitials[map];
			let className = 'verse-character';
			let hidden = false;

			// Determine visibility based on stage
			if (currentStage === 'intermediate') {
				const isOdd = ((map + 1) % 2) === 1;
				const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
				if (!visibleByVariant) hidden = true;
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
					return { char, className: className + (isCorrect ? ' correct' : ' incorrect'), hidden: false };
				} else {
					return { char, className: className + ' hidden', hidden: true };
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

			return { char, className, hidden: false };
		} else {
			// Punctuation/whitespace - complex visibility logic from original
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

			// Find nearest next input-requiring character  
			let nextMap = null;
			for (let k = charIndex + 1; k < charToInputIndex.length; k++) {
				if (charToInputIndex[k] !== null) {
					nextMap = charToInputIndex[k];
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
					// Basic mode: show all punctuation adjacent to visible characters
					shown = true;
					className = 'verse-character correct';
				} else if (currentStage === 'intermediate') {
					// Intermediate: show if previous char is visible OR user has typed past it
					const isOdd = ((prevMap + 1) % 2) === 1;
					const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
					if (visibleByVariant || (prevMap !== null && userInput.length > prevMap)) {
						shown = true;
						className = 'verse-character correct';
					}
				} else if (currentStage === 'advanced') {
					// Advanced: only show when user has typed past preceding character
					if (prevMap !== null && userInput.length > prevMap) {
						shown = true;
						// In advanced mode, punctuation appears as white (correct) when revealed
						className = 'verse-character correct';
					}
				}
			}

			return { char, className, hidden: !shown };
		}
	}

	// Physical keyboard handler
	function handlePhysicalKeyboard(e) {
		if (!getCurrentVerse()) return;
		if (showNextButton || showRetryButton) return;

		if (e.key === 'Enter' && userInput.length === learnFullInitials.length) {
			e.preventDefault();
			submitAnswer();
			return;
		}

		// Backspace is disabled in learning mode
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
			userInput += mappedValue;
			if (userInput.length === learnFullInitials.length) {
				submitAnswer();
			}
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<span class="visually-hidden" aria-hidden="true">{$settings.languagePreference}</span>

<div class="learning-container">
	<h2>{t('learn_mode')}</h2>

	<!-- Stage Selection Buttons (Always Visible in Learn Mode) -->
	<div class="difficulty-controls">
		<button
			class="mode-btn"
			class:active={currentStage === 'basic'}
			on:click={() => setStage('basic')}
		>
			{t('basic')}
		</button>
		<button
			class="mode-btn"
			class:active={currentStage === 'intermediate'}
			on:click={() => setStage('intermediate')}
		>
			{t('intermediate')}
		</button>
		<button
			class="mode-btn"
			class:active={currentStage === 'advanced'}
			on:click={() => setStage('advanced')}
		>
			{t('advanced')}
		</button>
	</div>

	{#if versesToLearn.length === 0}
		<div class="empty-state">
			<p>{t('no_verses_to_learn')}</p>
		</div>
	{:else}
		<!-- Verse Selector -->
		<div class="learning-controls">
			<label for="verse-selector">{t('select_verse')}</label>
			<select id="verse-selector" bind:value={currentVerseIdx} on:change={(e) => selectVerse(parseInt(e.target.value))}>
				{#each versesToLearn as verse, idx}
					<option value={idx}>
						{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
					</option>
				{/each}
			</select>
		</div>

		{#if getCurrentVerse()}
			{@const verse = getCurrentVerse()}
			{@const chars = [...learnFullText]}
			{@const refIndex = learnFullText.indexOf('\n')}

			{#key `${currentVerseIdx}-${currentStage}-${intermediateVariant}-${userInput.length}`}
				<!-- Helper Text -->
				<div class="learn-helper-text">
					{#if $settings.inputMethod === 'pinyin'}
						<p>{t('pinyin_helper')}</p>
					{:else if $settings.inputMethod === 'zhuyin'}
						<p>{t('zhuyin_helper')}</p>
					{:else if $settings.inputMethod === 'cangjie'}
						<p>{t('cangjie_helper')}</p>
					{/if}
				</div>

				<!-- Verse Display -->
				<div class="verse-display">
					{#each chars as char, i}
						{#if i < refIndex}
							{@const rendered = renderCharacter(char, i)}
							{#if rendered.hidden}
								<span class={rendered.className}>_</span>
							{:else}
								<span class={rendered.className}>{rendered.char}</span>
							{/if}
						{/if}
					{/each}
				</div>
				
				<!-- Verse Reference -->
				<div class="verse-reference">
					{#each chars as char, i}
						{#if i > refIndex}
							{@const rendered = renderCharacter(char, i)}
							<span class={rendered.className}>{rendered.char}</span>
						{/if}
					{/each}
				</div>
			{/key}

			<!-- Hidden input for accessibility (not visible to user) -->
			<input
				type="text"
				class="visually-hidden-input"
				bind:value={userInput}
				readonly
				aria-hidden="true"
				tabindex="-1"
			/>

			<!-- Feedback -->
			{#if feedbackMessage}
				<div class="feedback" class:success={feedbackType === 'success'} class:error={feedbackType === 'error'} class:warning={feedbackType === 'warning'}>
					{feedbackMessage}
				</div>
			{/if}

			<!-- Onscreen Keyboard (no backspace/enter during learning) -->
			{#if !showNextButton && !showRetryButton}
				<Keyboard layout={keyboardLayout} on:key={handleKeyInput} showBackspace={false} showEnter={false} />
			{/if}

			<!-- Action Buttons -->
			<div class="control-buttons">
				{#if showRetryButton}
					<button class="retry-btn" on:click={handleRetry}>{t('retry')}</button>
				{/if}
				{#if showNextButton}
					<button class="next-btn" on:click={handleNext}>{t('next')}</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.learning-container {
		display: grid;
		gap: 1.5rem;
		padding: 1rem;
		padding-bottom: 400px; /* Add space for keyboard at bottom */
		max-width: 1000px;
		margin: 0 auto;
	}

	h2 {
		margin: 0;
		color: var(--text-color);
	}

	.difficulty-controls {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mode-btn {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--accent-color);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s;
	}

	.mode-btn.active {
		background: var(--accent-color);
		color: white;
	}

	.mode-btn:hover:not(.active) {
		opacity: 0.8;
	}

	.learning-controls {
		display: grid;
		gap: 0.5rem;
	}

	.learning-controls label {
		font-weight: 500;
		color: var(--subtitle-color);
	}

	.learning-controls select {
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1rem;
	}

	.verse-display {
		font-size: 1.5rem;
		line-height: 2;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		min-height: 150px;
		font-weight: 500;
	}

	.verse-character {
		display: inline;
		transition: all 0.3s;
	}

	.verse-character.correct {
		color: var(--correct-color);
	}

	.verse-character.incorrect {
		color: var(--error-color);
	}

	.verse-character.hidden {
		color: transparent;
		border-bottom: 2px solid var(--subtitle-color);
		user-select: none;
	}

	.verse-character.punctuation {
		color: var(--subtitle-color);
	}
	
	.verse-reference {
		font-size: 1.2rem;
		text-align: center;
		color: var(--subtitle-color);
		margin-top: -0.5rem;
		margin-bottom: 1rem;
	}

	.visually-hidden-input {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.feedback {
		padding: 1rem;
		border-radius: 6px;
		text-align: center;
		font-weight: 500;
		transition: all 0.3s;
	}

	.feedback.success {
		background: #e8f5e9;
		color: #2e7d32;
		border: 1px solid #4caf50;
	}

	.feedback.error {
		background: #ffebee;
		color: #c62828;
		border: 1px solid #f44336;
	}

	.feedback.warning {
		background: #fff3e0;
		color: #e65100;
		border: 1px solid #ff9800;
	}

	[data-theme='dark'] .feedback.success {
		background: #1b5e20;
		color: #81c784;
	}

	[data-theme='dark'] .feedback.error {
		background: #b71c1c;
		color: #ef5350;
	}

	[data-theme='dark'] .feedback.warning {
		background: #e65100;
		color: #ffb74d;
	}

	.control-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.retry-btn,
	.next-btn {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s;
	}

	.retry-btn {
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
	}

	.next-btn {
		background: var(--accent-color);
		color: white;
	}

	.retry-btn:hover,
	.next-btn:hover {
		opacity: 0.9;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--subtitle-color);
	}

	.visually-hidden {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
	}
</style>
