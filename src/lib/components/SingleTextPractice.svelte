<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';

	export let collection;
	export let verses = [];

	const dispatch = createEventDispatcher();

	let userInput = '';
	let fullText = '';
	let fullInitials = '';
	let charToInputIndex = [];

	let keyboardLayout = keyboardLayouts.pinyinCompact;
	let isNumericKeyboard = false;
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;

	let totalInputs = 0;
	let correctInputs = 0;
	let showCompletionModal = false;

	let viewportAnchor;
	let scrollTrigger = 0;

	$: buildFullText();

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

	$: isComplete = userInput.length === fullInitials.length;

	$: {
		if (viewportAnchor) {
			const _ = scrollTrigger;
			const __ = userInput.length;

			setTimeout(() => {
				if (isComplete || showCompletionModal) return;
				scrollNextHiddenCharacterIntoView();
			}, 120);
		}
	}

	function scrollNextHiddenCharacterIntoView() {
		const keyboard = document.querySelector('.single-text-practice-container .keyboard-space .keyboard');
		if (!keyboard) return;

		const verseDisplay = document.querySelector('.single-text-practice-container .verse-display');
		if (!verseDisplay) return;

		const nextInputIndex = userInput.length;
		const charIndex = charToInputIndex.findIndex((value) => value === nextInputIndex);
		if (charIndex === -1) return;

		const nextHiddenChar = verseDisplay.querySelector(`span:nth-child(${charIndex + 1})`);
		if (!nextHiddenChar) return;

		const keyboardRect = keyboard.getBoundingClientRect();
		const charRect = nextHiddenChar.getBoundingClientRect();
		const visibleTop = 0;
		const visibleBottom = Math.min(window.innerHeight, keyboardRect.top) - 12;

		const overlapsTop = charRect.top < visibleTop;
		const overlapsBottom = charRect.bottom > visibleBottom;
		if (!overlapsTop && !overlapsBottom) return;

		const visibleCenter = (visibleTop + visibleBottom) / 2;
		const charCenter = charRect.top + (charRect.height / 2);
		const scrollDelta = charCenter - visibleCenter;

		if (Math.abs(scrollDelta) > 2) {
			window.scrollTo({
				top: window.scrollY + scrollDelta,
				behavior: 'smooth'
			});
		}
	}

	function buildFullText() {
		if (!verses || verses.length === 0) {
			fullText = '';
			fullInitials = '';
			charToInputIndex = [];
			return;
		}

		const allSameBook = verses.every(v => v.bookName === verses[0].bookName);
		const allSameChapter = allSameBook && verses.every(v => v.chapterNumber === verses[0].chapterNumber);

		let text = '';
		let initials = '';
		const charMap = [];
		let inputIdx = 0;

		verses.forEach((verse, vIdx) => {
			let refText;
			if (vIdx === 0) {
				refText = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber} `;
			} else if (allSameChapter) {
				refText = `${verse.verseNumber} `;
			} else if (allSameBook) {
				refText = `${verse.chapterNumber}:${verse.verseNumber} `;
			} else {
				refText = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber} `;
			}

			for (let i = 0; i < refText.length; i++) {
				charMap.push(null);
			}

			for (let i = 0; i < verse.verseText.length; i++) {
				if (/[\u4e00-\u9fa5]/.test(verse.verseText[i]) || /[0-9]/.test(verse.verseText[i])) {
					charMap.push(inputIdx);
					inputIdx++;
				} else {
					charMap.push(null);
				}
			}

			if (vIdx < verses.length - 1) {
				text += refText + verse.verseText + ' ';
				initials += verse.verseInitials;
				charMap.push(null);
			} else {
				text += refText + verse.verseText;
				initials += verse.verseInitials;
			}
		});

		fullText = text;
		fullInitials = initials;
		charToInputIndex = charMap;
	}

	function handleKeyInput(event) {
		const key = event.detail;

		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;

		const inputMethod = $settings.inputMethod || 'pinyin';
		const nextExpectedChar = fullInitials[userInput.length];
		const normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
		const normalizedExpected = inputMethod === 'pinyin'
			? (nextExpectedChar || '').toLowerCase()
			: (nextExpectedChar || '');

		if (normalizedKey === normalizedExpected) {
			lastCorrectKey = key;
			userInput += key;
			totalInputs++;
			correctInputs++;
		} else {
			pressedKey = key;
			correctKey = nextExpectedChar;
			triggerErrorFeedback($settings);
			userInput += key;
			totalInputs++;
		}

		scrollTrigger++;

		if (userInput.length === fullInitials.length) {
			completeChallenge();
		}
	}

	function handlePhysicalKeyboard(e) {
		if (!verses || verses.length === 0) return;
		if (showCompletionModal) return;

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

			const nextExpectedChar = fullInitials[userInput.length];
			const normalizedKey = inputMethod === 'pinyin' ? mappedValue.toLowerCase() : mappedValue;
			const normalizedExpected = inputMethod === 'pinyin'
				? (nextExpectedChar || '').toLowerCase()
				: (nextExpectedChar || '');

			if (normalizedKey === normalizedExpected) {
				lastCorrectKey = key;
				totalInputs++;
				correctInputs++;
			} else {
				pressedKey = key;
				correctKey = nextExpectedChar;
				triggerErrorFeedback($settings);
				totalInputs++;
			}

			userInput += mappedValue;
			scrollTrigger++;

			if (userInput.length === fullInitials.length) {
				completeChallenge();
			}
		}
	}

	function retryPhase() {
		userInput = '';
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		totalInputs = 0;
		correctInputs = 0;
	}

	function completeChallenge() {
		showCompletionModal = true;
	}

	function tryAgain() {
		showCompletionModal = false;
		retryPhase();
	}

	function done() {
		dispatch('complete');
	}

	function closeToInitial() {
		showCompletionModal = false;
		retryPhase();
		dispatch('exit');
	}

	function goBack() {
		dispatch('back');
	}

	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];

		if (map !== null) {
			const inputMethod = $settings.inputMethod || 'pinyin';
			const className = 'verse-character';

			if (userInput.length > map) {
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
		}

		let prevCharInputIndex = null;
		for (let i = charIndex - 1; i >= 0; i--) {
			if (charToInputIndex[i] !== null) {
				prevCharInputIndex = charToInputIndex[i];
				break;
			}
		}

		const shouldReveal = prevCharInputIndex === null
			? true
			: userInput.length > prevCharInputIndex;
		return {
			char,
			className: 'verse-punctuation' + (shouldReveal ? '' : ' hidden'),
			hidden: !shouldReveal
		};
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<div class="single-text-practice-container">
	<div class="header">
		<button class="back-button" on:click={goBack} aria-label={t('back')}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<h2>{t('single_text')}</h2>
		<button class="exit-button" on:click={closeToInitial} aria-label={t('exit')}>✕</button>
	</div>

	<div class="collection-meta-row">
		<div class="collection-meta-spacer" aria-hidden="true"></div>
		{#if collection}
			<div class="collection-header">
				{collection.title}
			</div>
		{:else}
			<div></div>
		{/if}
		<div class="progress-indicator">
			{t('verses')}: {verses.length}
		</div>
	</div>

	<div class="verse-display">
		{#key userInput.length}
			{#each fullText.split('') as char, idx}
				{@const rendered = renderCharacter(char, idx)}
				<span class={rendered.className}>{rendered.char}</span>
			{/each}
		{/key}
	</div>

	<div class="navigation-controls">
		<button class="nav-button retry-button" on:click={retryPhase}>
			↺
		</button>
	</div>

	<div class="nav-bottom-spacer" aria-hidden="true"></div>

	<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>

	{#if !isComplete}
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
	{/if}
</div>

{#if showCompletionModal}
	<div class="modal-overlay" on:click={done} on:keydown={(e) => e.key === 'Escape' && done()} role="button" tabindex="0">
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<h3>{t('single_text')} {t('finish')}</h3>
			<p>{t('congratulations_practice')}</p>

			{#if totalInputs > 0}
				<div class="accuracy-display">
					<div class="accuracy-label">{t('accuracy')}</div>
					<div class="accuracy-value">{Math.round((correctInputs / totalInputs) * 100)}%</div>
					<div class="accuracy-detail">{correctInputs} / {totalInputs} {t('correct')}</div>
				</div>
			{/if}

			<div class="button-group">
				<button class="secondary-button" on:click={tryAgain}>
					{t('try_again')}
				</button>
				<button class="primary-button" on:click={done}>
					{t('done')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.single-text-practice-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 1rem;
		padding-bottom: 12rem;
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

	.collection-meta-row {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	.collection-meta-spacer {
		justify-self: start;
	}

	.collection-header {
		text-align: center;
		font-weight: 600;
		color: var(--subtitle-color);
		padding: 0.5rem;
	}

	.progress-indicator {
		justify-self: end;
		color: var(--subtitle-color);
		font-size: 0.9em;
		padding: 0.25rem;
	}

	.verse-display {
		font-size: 1.5em;
		line-height: 1.6;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		font-weight: 500;
		width: 100%;
		box-sizing: border-box;
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
		color: var(--text-color);
	}

	.verse-display :global(.verse-character.incorrect) {
		color: #f44336;
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

	.navigation-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.nav-button {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--accent-color);
		border-radius: 8px;
		font-size: 1.5em;
		cursor: pointer;
		background: var(--panel-background);
		color: var(--text-color);
		transition: all 0.3s ease;
		min-width: 60px;
	}

	.nav-button:hover {
		background: var(--accent-color);
		color: white;
		transform: scale(1.05);
	}

	.retry-button {
		font-size: 1.8em;
		padding: 0.6rem 1.2rem;
	}

	.keyboard-space {
		margin-top: auto;
	}

	.nav-bottom-spacer {
		height: 360px;
	}

	.viewport-anchor {
		height: 1px;
		width: 100%;
		visibility: hidden;
		pointer-events: none;
		margin: 0;
		padding: 0;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--app-background);
		padding: 2rem;
		border-radius: 12px;
		max-width: 400px;
		width: 90%;
		text-align: center;
	}

	.modal-content h3 {
		margin: 0 0 1rem 0;
		color: var(--accent-color);
	}

	.modal-content p {
		margin: 1rem 0;
		color: var(--text-color);
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.primary-button,
	.secondary-button {
		flex: 1;
		padding: 1rem;
		border: none;
		border-radius: 8px;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.primary-button {
		background: var(--accent-color);
		color: white;
	}

	.secondary-button {
		background: var(--panel-background);
		color: var(--text-color);
		border: 2px solid var(--accent-color);
	}

	.primary-button:active,
	.secondary-button:active {
		transform: scale(0.98);
	}

	.accuracy-display {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		text-align: center;
	}

	.accuracy-label {
		font-size: 0.9em;
		color: var(--subtitle-color);
		margin-bottom: 0.5rem;
	}

	.accuracy-value {
		font-size: 2.5em;
		font-weight: bold;
		color: var(--accent-color);
		margin-bottom: 0.25rem;
	}

	.accuracy-detail {
		font-size: 0.9em;
		color: var(--subtitle-color);
	}

	@media (max-width: 767px) {
		.single-text-practice-container {
			padding: 0.5rem;
			padding-bottom: 10rem;
		}

		.verse-display {
			padding: 1rem;
		}
	}
</style>
