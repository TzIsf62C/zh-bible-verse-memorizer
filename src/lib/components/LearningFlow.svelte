<script>
	import { verses } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';

	let currentVerseIdx = null;
	let currentStage = 'basic'; // basic, intermediate, advanced
	let userInput = '';
	let feedbackMessage = '';
	let feedbackType = ''; // success, error, warning
	let accuracy = 0;
	let showNextButton = false;
	let keyboardLayout = keyboardLayouts.pinyin;
	let versesToLearn = [];

	// Update keyboard layout when input method changes
	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	// Filter unlearned verses
	$: {
		versesToLearn = $verses.filter((v) => v.repetitions === 0);
	}

	function selectVerse(idx) {
		currentVerseIdx = idx;
		currentStage = 'basic';
		userInput = '';
		feedbackMessage = '';
		accuracy = 0;
		showNextButton = false;
	}

	function getCurrentVerse() {
		if (currentVerseIdx === null) return null;
		return versesToLearn[currentVerseIdx];
	}

	function getExpectedInitials() {
		const verse = getCurrentVerse();
		if (!verse) return '';
		return currentStage === 'verse' ? verse.verseInitials : verse.bookInitials;
	}

	// Character visibility for intermediate stage
	function shouldShowCharacter(idx) {
		if (currentStage === 'basic') return true;
		if (currentStage === 'intermediate') return idx % 2 === 0; // Even indices visible
		return false; // Advanced: no characters shown
	}

	function handleKeyInput(event) {
		if (!getCurrentVerse()) return;

		const key = event.detail;

		if (key === '⌫') {
			userInput = userInput.slice(0, -1);
			return;
		}

		if (key === '↵') {
			submitAnswer();
			return;
		}

		userInput += key;

		// Auto-check if we've matched the expected input length
		const expected = getExpectedInitials();
		if (userInput.length === expected.length) {
			submitAnswer();
		}
	}

	function submitAnswer() {
		const verse = getCurrentVerse();
		const expected = getExpectedInitials();

		if (!verse) return;

		// Calculate accuracy
		let correctChars = 0;
		for (let i = 0; i < Math.max(userInput.length, expected.length); i++) {
			if (userInput[i] === expected[i]) {
				correctChars++;
			}
		}

		accuracy = Math.round((correctChars / expected.length) * 100);

		if (accuracy >= 90) {
			// Success!
			if (currentStage === 'basic') {
				feedbackMessage = t('great_job_basic');
				feedbackType = 'success';
				currentStage = 'intermediate';
			} else if (currentStage === 'intermediate') {
				feedbackMessage = t('great_job_intermediate');
				feedbackType = 'success';
				currentStage = 'advanced';
			} else if (currentStage === 'advanced') {
				feedbackMessage = t('congratulations_mastered');
				feedbackType = 'success';
				// Mark verse as learned
				updateVerseProgress(verse);
				showNextButton = true;
			}
		} else {
			// Failed - show error feedback
			feedbackMessage = t('nice_try');
			feedbackType = 'error';
			showNextButton = true;
		}

		userInput = '';
	}

	function updateVerseProgress(verse) {
		const today = new Date();
		const updatedVerse = spacedRepetitionBinary(verse, true, today);

		verses.update((list) =>
			list.map((v) => (v.id === verse.id ? updatedVerse : v))
		);
	}

	function handleRetry() {
		userInput = '';
		feedbackMessage = '';
		accuracy = 0;
		showNextButton = false;
	}

	function handleNext() {
		if (currentVerseIdx !== null && currentVerseIdx < versesToLearn.length - 1) {
			selectVerse(currentVerseIdx + 1);
		} else {
			// No more verses
			currentVerseIdx = null;
			feedbackMessage = t('completed_all_verses');
			feedbackType = 'warning';
		}
	}

	function handleSkip() {
		feedbackMessage = t('great_job_continue');
		feedbackType = 'warning';
		showNextButton = true;
	}
</script>

<svelte:document on:keydown={(e) => {
	if (e.key === 'Enter' && userInput.length > 0) {
		e.preventDefault();
		submitAnswer();
	} else if (e.key === 'Backspace') {
		e.preventDefault();
		userInput = userInput.slice(0, -1);
	}
}} />

<div class="learning-container">
	{#if currentVerseIdx === null}
		<!-- Verse Selection Screen -->
		<div class="verse-selection">
			<h3>{t('select_verse')}</h3>

			{#if versesToLearn.length === 0}
				<div class="empty-state">
					<p>{t('no_verses_to_learn')}</p>
				</div>
			{:else}
				<div class="verses-grid">
					{#each versesToLearn as verse, idx}
						<button class="verse-card" on:click={() => selectVerse(idx)}>
							<div class="verse-ref">
								{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
							</div>
							<div class="verse-preview">{verse.verseText.substring(0, 40)}...</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Learning Screen -->
		<div class="learning-screen">
			{#if getCurrentVerse()}
				{@const verse = getCurrentVerse()}
				<div class="verse-display">
					<h3>{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}</h3>

					{#if currentStage !== 'advanced'}
						<div class="verse-text">
							{#each verse.verseText as char, idx}
								<span
									class="char"
									class:visible={shouldShowCharacter(idx)}
									class:hidden={!shouldShowCharacter(idx)}
								>
									{char}
								</span>
							{/each}
						</div>
					{:else}
						<div class="no-text-notice">{t('tutorial_advanced_desc')}</div>
					{/if}

					<div class="stage-indicator">
						<span>{t(currentStage)}</span>
						<span class="accuracy" class:good={accuracy >= 90}>
							{accuracy > 0 ? `${accuracy}%` : ''}
						</span>
					</div>
				</div>

				<!-- Input Section -->
				<div class="input-section">
					<div class="input-display">
						{#if userInput}
							{userInput}
						{:else}
							<span class="placeholder">Type initials...</span>
						{/if}
					</div>

					{#if feedbackMessage}
						<div class="feedback" class:success={feedbackType === 'success'} class:error={feedbackType === 'error'} class:warning={feedbackType === 'warning'}>
							{feedbackMessage}
						</div>
					{/if}

					{#if !showNextButton}
						<Keyboard {keyboardLayout} on:key={handleKeyInput} />
					{/if}

					<!-- Action Buttons -->
					<div class="button-group">
						{#if showNextButton}
							{#if feedbackType === 'success' && currentStage === 'advanced'}
								<button class="primary" on:click={handleNext}>{t('next')}</button>
								<button class="secondary" on:click={handleSkip}>{t('skip')}</button>
							{:else}
								<button class="primary" on:click={handleRetry}>{t('retry')}</button>
								<button class="secondary" on:click={handleSkip}>{t('skip')}</button>
							{/if}
						{:else}
							<button class="secondary" on:click={handleSkip}>{t('skip')}</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.learning-container {
		display: grid;
		gap: 1.5rem;
		padding: 1rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.verse-selection {
		background: var(--panel-background);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: var(--panel-shadow);
	}

	.verse-selection h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.verses-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.verse-card {
		background: var(--file-bg);
		border: 1px solid var(--file-border);
		border-radius: 6px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.3s;
		text-align: left;
		color: inherit;
		font-family: inherit;
	}

	.verse-card:hover {
		background: var(--nav-button-bg);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.verse-ref {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--accent-color);
	}

	.verse-preview {
		font-size: 0.9rem;
		color: var(--subtitle-color);
		line-height: 1.4;
	}

	.learning-screen {
		background: var(--panel-background);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: var(--panel-shadow);
	}

	.verse-display {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--file-border);
	}

	.verse-display h3 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.verse-text {
		font-size: 1.5rem;
		line-height: 1.8;
		margin: 1rem 0;
		font-weight: 500;
	}

	.char {
		display: inline-block;
		margin: 0 2px;
		padding: 2px 4px;
		transition: all 0.3s;
	}

	.char.visible {
		color: var(--text-color);
		background: transparent;
	}

	.char.hidden {
		color: transparent;
		background: var(--file-bg);
		border-bottom: 2px solid var(--subtitle-color);
		user-select: none;
	}

	.no-text-notice {
		font-style: italic;
		color: var(--subtitle-color);
		text-align: center;
		padding: 2rem;
	}

	.stage-indicator {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--file-bg);
		border-radius: 4px;
		margin-top: 1rem;
	}

	.stage-indicator span:first-child {
		text-transform: uppercase;
		font-weight: 600;
		color: var(--accent-color);
		letter-spacing: 1px;
	}

	.accuracy {
		font-weight: 600;
		font-size: 1.1rem;
		color: var(--subtitle-color);
	}

	.accuracy.good {
		color: #4caf50;
	}

	.input-section {
		display: grid;
		gap: 1rem;
	}

	.input-display {
		background: var(--file-bg);
		border: 2px solid var(--accent-color);
		border-radius: 6px;
		padding: 1rem;
		font-size: 1.25rem;
		min-height: 50px;
		display: flex;
		align-items: center;
		font-weight: 500;
		color: var(--text-color);
	}

	.input-display .placeholder {
		color: var(--subtitle-color);
		font-weight: normal;
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

	.button-group {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s;
	}

	button.primary {
		background: var(--accent-color);
		color: white;
	}

	button.primary:hover {
		opacity: 0.9;
	}

	button.secondary {
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--subtitle-color);
	}
</style>
