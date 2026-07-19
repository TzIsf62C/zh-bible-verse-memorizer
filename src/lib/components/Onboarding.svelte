<script>
	import { createEventDispatcher, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { t } from '$lib/i18n';
	import { translations } from '$lib/i18n/translations';
	import Modal from './Modal.svelte';

	export let startAtTutorial = false;

	const dispatch = createEventDispatcher();

	const STEPS = {
		language: 'language',
		install: 'install',
		inputMethod: 'inputMethod',
		charset: 'charset',
		loading: 'loading',
		backupReminder: 'backupReminder',
		tutorialIntro: 'tutorialIntro',
		tutorialBasic: 'tutorialBasic',
		tutorialIntermediate: 'tutorialIntermediate',
		tutorialAdvanced: 'tutorialAdvanced'
	};

	const inputMethodTitles = {
		english: 'Choose Input Method',
		simplified: '选择输入法',
		traditional: '選擇輸入法'
	};

	const keyMappings = {
		pinyin: ['y', 'h', 'h', 'y', 'e', 'h'],
		zhuyin: ['ㄧ', 'ㄏ', 'ㄏ', 'ㄧ', 'ㄣ', 'ㄏ'],
		cangjie: ['尸', '竹', '廿', '大', '田', '十']
	};

	let currentStep = startAtTutorial ? STEPS.tutorialIntro : STEPS.language;
	let selectedLanguage = 'english';
	let selectedInputMethod = 'pinyin';
	let selectedCharset = 'simplified';
	let isBusy = false;
	let showErrorModal = false;
	let errorMessage = '';

	let activeAnimationStage = '';
	let tutorialInterval = null;
	let tutorialRestartTimeout = null;

	function tr(key, language = selectedLanguage) {
		const dictionary = translations[language] || translations.english;
		return dictionary[key] ?? translations.english[key] ?? key;
	}

	function showError(message) {
		errorMessage = message;
		showErrorModal = true;
	}

	function clearTutorialAnimation() {
		if (tutorialInterval) {
			clearInterval(tutorialInterval);
			tutorialInterval = null;
		}
		if (tutorialRestartTimeout) {
			clearTimeout(tutorialRestartTimeout);
			tutorialRestartTimeout = null;
		}
	}

	function isStandalone() {
		if (!browser) return false;
		return (
			window.matchMedia('(display-mode: standalone)').matches ||
			window.navigator.standalone === true
		);
	}

	function detectPlatform() {
		if (!browser) return 'browser_generic';
		const userAgent = navigator.userAgent || navigator.vendor || window.opera;

		if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
			return 'ios_safari';
		}
		if (/android/i.test(userAgent)) {
			return 'android_chrome';
		}
		if (!/mobile/i.test(userAgent)) {
			return 'desktop';
		}
		return 'browser_generic';
	}

	function getInstallInstructions() {
		return tr(`install_${detectPlatform()}`);
	}

	function getInputMethodTitle() {
		return inputMethodTitles[selectedLanguage] || inputMethodTitles.english;
	}

	function getResolvedCharset(method, charset) {
		if (method === 'pinyin' && selectedLanguage === 'english') {
			return charset || selectedCharset;
		}
		return selectedLanguage === 'traditional' ? 'traditional' : 'simplified';
	}

	function getSampleFileName(inputMethod, charset) {
		if (inputMethod === 'pinyin') {
			if (charset) {
				return charset === 'traditional' ? 'PY-Samples-zht.json' : 'PY-Samples-zhs.json';
			}
			if (selectedLanguage === 'traditional') {
				return 'PY-Samples-zht.json';
			}
			return 'PY-Samples-zhs.json';
		}
		if (inputMethod === 'zhuyin') {
			return 'ZY-Samples.json';
		}
		if (inputMethod === 'cangjie') {
			return 'CJ-Samples.json';
		}
		return null;
	}

	async function loadSampleVerses(inputMethod, charset) {
		const fileName = getSampleFileName(inputMethod, charset);
		if (!fileName) return;

		const response = await fetch(`/samples/${fileName}`);
		if (!response.ok) {
			throw new Error('Failed to load sample data');
		}

		const data = await response.json();
		const importedVerses = Array.isArray(data.verses) ? data.verses : [];
		verses.set(importedVerses);

		const importedCollections = Array.isArray(data.collections) ? data.collections : [];
		if (!importedCollections.length) {
			collections.set([]);
			return;
		}

		const mappedCollections = importedCollections
			.map((collection) => {
				const verseIds = (collection.verseRefs || [])
					.map((ref) => {
						const matchedVerse = importedVerses.find(
							(verse) =>
								verse.bookName === ref.bookName &&
								String(verse.chapterNumber) === String(ref.chapterNumber) &&
								String(verse.verseNumber) === String(ref.verseNumber)
						);
						return matchedVerse ? matchedVerse.id : null;
					})
					.filter(Boolean);

				if (!verseIds.length) {
					return null;
				}

				return {
					id: collection.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					title: collection.title,
					verseIds
				};
			})
			.filter(Boolean);

		collections.set(mappedCollections);
	}

	function setBackupReminderTimestamps() {
		if (!browser) return;
		const now = Date.now().toString();
		localStorage.setItem('firstBackupReminder', now);
		localStorage.setItem('lastBackupReminder', now);
	}

	function markOnboardingComplete() {
		clearTutorialAnimation();
		if (!startAtTutorial) {
			settings.update((current) => ({
				...current,
				hasCompletedOnboarding: true
			}));
			if (browser) {
				localStorage.setItem('hasVisitedBefore', 'true');
			}
		}
		if (browser) {
			localStorage.setItem('onboardingInProgress', 'false');
		}
		dispatch('complete');
	}

	async function handleLanguageSelect(language) {
		selectedLanguage = language;
		settings.update((current) => ({
			...current,
			languagePreference: language
		}));

		if (isStandalone()) {
			currentStep = STEPS.inputMethod;
			return;
		}
		currentStep = STEPS.install;
	}

	function handleInstallSkip() {
		currentStep = STEPS.inputMethod;
	}

	async function handleInputMethodSelect(inputMethod) {
		selectedInputMethod = inputMethod;
		if (inputMethod === 'pinyin' && selectedLanguage === 'english') {
			currentStep = STEPS.charset;
			return;
		}
		currentStep = STEPS.loading;
		await finalizeInputSelection(inputMethod);
	}

	async function handleCharsetSelect(charset) {
		selectedCharset = charset;
		currentStep = STEPS.loading;
		await finalizeInputSelection('pinyin', charset);
	}

	async function finalizeInputSelection(inputMethod, charset = null) {
		try {
			isBusy = true;
			const resolvedCharset = getResolvedCharset(inputMethod, charset);

			settings.update((current) => ({
				...current,
				languagePreference: selectedLanguage,
				inputMethod,
				bookNameCharset: resolvedCharset
			}));

			const sampleCharset = inputMethod === 'pinyin' && selectedLanguage === 'english' ? resolvedCharset : null;
			await loadSampleVerses(inputMethod, sampleCharset);
			setBackupReminderTimestamps();
			currentStep = STEPS.backupReminder;
		} catch (error) {
			console.error('Onboarding setup failed:', error);
			showError('Failed to load sample data. Please try reloading the app.');
		} finally {
			isBusy = false;
		}
	}

	function handleBackupReminderGotIt() {
		currentStep = STEPS.tutorialIntro;
	}

	function handleTutorialStart() {
		currentStep = STEPS.tutorialBasic;
	}

	function handleTutorialSkip() {
		markOnboardingComplete();
	}

	function handleTutorialBasicContinue() {
		currentStep = STEPS.tutorialIntermediate;
	}

	function handleTutorialIntermediateContinue() {
		currentStep = STEPS.tutorialAdvanced;
	}

	function handleTutorialBegin() {
		markOnboardingComplete();
	}

	function getTutorialKeystrokes() {
		return keyMappings[selectedInputMethod] || keyMappings.pinyin;
	}

	function startTutorialAnimation(stage) {
		clearTutorialAnimation();

		const chars = document.querySelectorAll(`#tutorial${stage}Chars .tutorial-char`);
		const keysContainer = document.getElementById(`tutorial${stage}Keys`);
		if (!chars.length || !keysContainer) {
			return;
		}

		const keystrokes = getTutorialKeystrokes();
		const keyCells = keysContainer.querySelectorAll('td');

		function animateStep() {
			chars.forEach((char, index) => {
				char.classList.remove('tutorial-typed');
				char.classList.remove('intermediate-hidden');
				const originalChar = char.dataset.char || char.textContent;
				char.textContent = originalChar;
				if (stage === 'Basic') {
					char.classList.remove('tutorial-hidden');
					return;
				}
				if (stage === 'Intermediate' && index % 2 === 0) {
					char.classList.remove('tutorial-hidden');
					return;
				}
				if (stage === 'Intermediate') {
					char.classList.remove('tutorial-hidden');
					char.classList.add('intermediate-hidden');
					char.textContent = '＿';
					return;
				}
				char.classList.add('tutorial-hidden');
			});

			keyCells.forEach((cell, index) => {
				cell.innerHTML = '';
				if (index < keystrokes.length) {
					const span = document.createElement('span');
					span.className = 'tutorial-key-span';
					span.textContent = keystrokes[index];
					cell.appendChild(span);
				}
			});

			const keySpans = keysContainer.querySelectorAll('span');
			let currentIndex = 0;

			tutorialInterval = setInterval(() => {
				if (currentIndex >= chars.length) {
					clearInterval(tutorialInterval);
					tutorialInterval = null;
					tutorialRestartTimeout = setTimeout(animateStep, 1000);
					return;
				}

				const key = keySpans[currentIndex];
				if (key) {
					key.classList.add('visible');
				}
				const originalChar = chars[currentIndex].dataset.char;
				if (originalChar) {
					chars[currentIndex].textContent = originalChar;
				}
				chars[currentIndex].classList.remove('intermediate-hidden');
				chars[currentIndex].classList.remove('tutorial-hidden');
				chars[currentIndex].classList.add('tutorial-typed');
				currentIndex += 1;
			}, 500);
		}

		animateStep();
	}

	function storeTutorialOriginalChars() {
		if (!browser) return;
		const tutorialChars = document.querySelectorAll('.tutorial-char');
		tutorialChars.forEach((char) => {
			if (!char.dataset.char) {
				char.dataset.char = char.textContent || '';
			}
		});
	}

	$: {
		const stageMap = {
			[STEPS.tutorialBasic]: 'Basic',
			[STEPS.tutorialIntermediate]: 'Intermediate',
			[STEPS.tutorialAdvanced]: 'Advanced'
		};
		const stage = stageMap[currentStep] || '';

		if (!stage) {
			activeAnimationStage = '';
			clearTutorialAnimation();
		} else if (stage !== activeAnimationStage) {
			activeAnimationStage = stage;
			tick().then(() => {
				storeTutorialOriginalChars();
				startTutorialAnimation(stage);
			});
		}
	}

	if (browser && !startAtTutorial) {
		localStorage.setItem('onboardingInProgress', 'true');
	}

	onDestroy(() => {
		clearTutorialAnimation();
	});
</script>

<div class="onboarding-overlay">
	<div class="onboarding-card" role="dialog" aria-modal="true">
		{#if currentStep === STEPS.language}
			<div class="modal-step">
				<img src="/icons/icon-192x192.png" alt="App Icon" class="app-icon" />
				<div class="app-intro">
					<div class="app-title">ZH Bible Verse Memorizer</div>
					<div class="app-subtitle">聖經經文背誦 V1.0</div>
				</div>
				<h2>Set Language<br />设定语言 / 設定語言</h2>
				<div class="onboarding-options">
					<button class="onboarding-btn" on:click={() => handleLanguageSelect('english')}>English</button>
					<button class="onboarding-btn" on:click={() => handleLanguageSelect('simplified')}>简体中文</button>
					<button class="onboarding-btn" on:click={() => handleLanguageSelect('traditional')}>繁體中文</button>
				</div>
			</div>
		{:else if currentStep === STEPS.install}
			<div class="modal-step">
				<h2>{tr('install_app_title')}</h2>
				<div class="install-instructions">{@html getInstallInstructions()}</div>
				<div class="onboarding-options">
					<button class="onboarding-btn" on:click={handleInstallSkip}>{tr('skip')}</button>
				</div>
			</div>
		{:else if currentStep === STEPS.inputMethod}
			<div class="modal-step">
				<h2>{getInputMethodTitle()}</h2>
				<div class="onboarding-options">
					<button class="onboarding-btn" disabled={isBusy} on:click={() => handleInputMethodSelect('pinyin')}>
						{tr('input_pinyin')}
					</button>
					<button class="onboarding-btn" disabled={isBusy} on:click={() => handleInputMethodSelect('zhuyin')}>
						{tr('input_zhuyin')}
					</button>
					<button class="onboarding-btn" disabled={isBusy} on:click={() => handleInputMethodSelect('cangjie')}>
						{tr('input_cangjie')}
					</button>
				</div>
				{#if isBusy}
					<p class="status-text">Loading sample verses...</p>
				{/if}
			</div>
		{:else if currentStep === STEPS.charset}
			<div class="modal-step">
				<h2>Choose Character Set</h2>
				<p class="helper-text">This can be changed in Settings</p>
				<div class="onboarding-options">
					<button class="onboarding-btn" disabled={isBusy} on:click={() => handleCharsetSelect('simplified')}>
						Simplified (简体)
					</button>
					<button class="onboarding-btn" disabled={isBusy} on:click={() => handleCharsetSelect('traditional')}>
						Traditional (繁體)
					</button>
				</div>
				{#if isBusy}
					<p class="status-text">Loading sample verses...</p>
				{/if}
			</div>
		{:else if currentStep === STEPS.loading}
			<div class="modal-step">
				<h2>Loading...</h2>
				<p class="status-text">Loading sample verses...</p>
			</div>
		{:else if currentStep === STEPS.backupReminder}
			<div class="modal-step">
				<h2>{t('backup_reminder_title')}</h2>
				<p>{t('backup_reminder_message')}</p>
				<div class="backup-card">
					<p><strong>{t('backup_reminder_how')}</strong></p>
					<p>{t('backup_reminder_steps')}</p>
				</div>
				<div class="onboarding-options">
					<button class="onboarding-btn" on:click={handleBackupReminderGotIt}>{t('backup_reminder_got_it')}</button>
				</div>
			</div>
		{:else if currentStep === STEPS.tutorialIntro}
			<div class="modal-step">
				<h2>{t('tutorial_intro_title')}</h2>
				<p>{t('tutorial_intro_desc')}</p>
				<div class="tutorial-stages-list">
					<div class="tutorial-stage-item">
						<div class="tutorial-stage-number">1</div>
						<div class="tutorial-stage-info">
							<h3>{t('basic')}</h3>
							<p>{t('tutorial_intro_basic')}</p>
						</div>
					</div>
					<div class="tutorial-stage-item">
						<div class="tutorial-stage-number">2</div>
						<div class="tutorial-stage-info">
							<h3>{t('intermediate')}</h3>
							<p>{t('tutorial_intro_intermediate')}</p>
						</div>
					</div>
					<div class="tutorial-stage-item">
						<div class="tutorial-stage-number">3</div>
						<div class="tutorial-stage-info">
							<h3>{t('advanced')}</h3>
							<p>{t('tutorial_intro_advanced')}</p>
						</div>
					</div>
				</div>
				<div class="onboarding-options">
					<button class="onboarding-btn tutorial-start-btn" on:click={handleTutorialStart}>{t('tutorial_start')}</button>
					<button class="onboarding-btn" on:click={handleTutorialSkip}>{t('skip')}</button>
				</div>
			</div>
		{:else if currentStep === STEPS.tutorialBasic}
			<div class="modal-step">
				<h2>{t('tutorial_basic_title')}</h2>
				<p>{t('tutorial_basic_desc')}</p>
				<div class="tutorial-example">
					<table class="tutorial-table">
						<tbody>
							<tr id="tutorialBasicChars">
								<td><span class="tutorial-char" data-index="0">耶</span></td>
								<td><span class="tutorial-char" data-index="1">和</span></td>
								<td><span class="tutorial-char" data-index="2">華</span></td>
								<td><span class="tutorial-char" data-index="3">有</span></td>
								<td><span class="tutorial-char" data-index="4">恩</span></td>
								<td><span class="tutorial-char" data-index="5">惠</span></td>
							</tr>
							<tr class="tutorial-arrows">
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
							</tr>
							<tr id="tutorialBasicKeys" class="tutorial-keys">
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="helper-text">{t('tutorial_basic_note')}</p>
				<div class="onboarding-options">
					<button class="onboarding-btn" on:click={handleTutorialBasicContinue}>{t('continue')}</button>
				</div>
			</div>
		{:else if currentStep === STEPS.tutorialIntermediate}
			<div class="modal-step">
				<h2>{t('tutorial_intermediate_title')}</h2>
				<p>{t('tutorial_intermediate_desc')}</p>
				<div class="tutorial-example">
					<table class="tutorial-table">
						<tbody>
							<tr id="tutorialIntermediateChars">
								<td><span class="tutorial-char" data-index="0">耶</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="1">和</span></td>
								<td><span class="tutorial-char" data-index="2">華</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="3">有</span></td>
								<td><span class="tutorial-char" data-index="4">恩</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="5">惠</span></td>
							</tr>
							<tr class="tutorial-arrows">
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
							</tr>
							<tr id="tutorialIntermediateKeys" class="tutorial-keys">
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="onboarding-options">
					<button class="onboarding-btn" on:click={handleTutorialIntermediateContinue}>{t('continue')}</button>
				</div>
			</div>
		{:else if currentStep === STEPS.tutorialAdvanced}
			<div class="modal-step">
				<h2>{t('tutorial_advanced_title')}</h2>
				<p>{t('tutorial_advanced_desc')}</p>
				<div class="tutorial-example">
					<table class="tutorial-table">
						<tbody>
							<tr id="tutorialAdvancedChars">
								<td><span class="tutorial-char tutorial-hidden" data-index="0">耶</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="1">和</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="2">華</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="3">有</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="4">恩</span></td>
								<td><span class="tutorial-char tutorial-hidden" data-index="5">惠</span></td>
							</tr>
							<tr class="tutorial-arrows">
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
								<td>↑</td>
							</tr>
							<tr id="tutorialAdvancedKeys" class="tutorial-keys">
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="backup-card">
					<p><strong>{t('tutorial_advanced_complete')}</strong></p>
					<p>{t('tutorial_advanced_spaced')}</p>
				</div>
				<div class="onboarding-options">
					<button class="onboarding-btn" on:click={handleTutorialBegin}>{t('begin')}</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<Modal
	show={showErrorModal}
	message={errorMessage}
	type="alert"
	on:confirm={() => {
		showErrorModal = false;
	}}
	on:cancel={() => {
		showErrorModal = false;
	}}
/>

<style>
	.onboarding-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--app-background, #f7f7f9);
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow-y: auto;
	}

	.onboarding-card {
		background: var(--panel-background, #ffffff);
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 560px;
		width: 100%;
		box-shadow: var(--panel-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));
	}

	.modal-step h2 {
		margin: 0 0 1rem 0;
		font-size: 1.4em;
		text-align: center;
	}

	.modal-step p {
		line-height: 1.6;
	}

	.app-icon {
		width: 5em;
		height: 5em;
		display: block;
		margin: 0 auto 1rem;
	}

	.app-intro {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.app-title {
		font-size: 1.1em;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.app-subtitle {
		font-size: 1em;
		color: var(--subtitle-color, #6b7280);
	}

	.install-instructions {
		margin: 1rem 0;
		line-height: 1.6;
	}

	.onboarding-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.onboarding-btn {
		padding: 0.9rem 1rem;
		font-size: 1em;
		font-weight: 500;
		background-color: var(--button-background);
		color: var(--button-text);
		border: 2px solid var(--button-background);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.onboarding-btn:hover {
		background-color: var(--button-hover);
		border-color: var(--button-hover);
	}

	.onboarding-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.tutorial-start-btn {
		background: var(--file-bg);
		color: var(--text-color);
	}

	.tutorial-start-btn:hover {
		background: var(--button-hover);
	}

	.helper-text {
		font-size: 0.9em;
		color: var(--subtitle-color, #6b7280);
		margin: 0.75rem 0;
	}

	.status-text {
		margin-top: 0.75rem;
		text-align: center;
		font-size: 0.9em;
		color: var(--subtitle-color, #6b7280);
	}

	.backup-card {
		margin: 1rem 0;
		padding: 0.75rem;
		background: var(--file-bg);
		border-radius: 8px;
		font-size: 0.9em;
	}

	.backup-card p {
		margin: 0;
	}

	.backup-card p + p {
		margin-top: 0.5rem;
	}

	.tutorial-example {
		margin: 1rem 0;
		padding: 1rem;
		background: var(--file-bg);
		border-radius: 8px;
		display: flex;
		justify-content: center;
	}

	.tutorial-table {
		border-collapse: collapse;
	}

	.tutorial-table td {
		text-align: center;
		vertical-align: middle;
		padding: 0.25rem;
	}

	.tutorial-char {
		font-size: 1.8em;
		font-weight: 500;
		color: var(--subtitle-color, #6b7280);
		transition: color 0.3s ease, opacity 0.3s ease;
		display: inline-block;
	}

	:global(.tutorial-char.tutorial-hidden) {
		opacity: 0;
		color: transparent;
	}

	:global(.tutorial-char.tutorial-typed) {
		color: var(--correct-color, #2e7d32);
	}

	:global(.tutorial-char.intermediate-hidden) {
		opacity: 0.5;
		color: var(--text-color, #1b1b1f);
	}

	.tutorial-arrows td {
		font-size: 1.1em;
		color: var(--accent-color);
	}

	.tutorial-keys {
		font-size: 1.3em;
		font-weight: 600;
		color: var(--accent-color);
	}

	:global(.tutorial-key-span) {
		opacity: 0;
		transition: opacity 0.3s ease;
		display: inline-block;
	}

	:global(.tutorial-key-span.visible) {
		opacity: 1;
	}

	.tutorial-stages-list {
		margin: 1rem 0;
		text-align: left;
		background: var(--file-bg);
		border-radius: 8px;
		padding: 1rem;
	}

	.tutorial-stage-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.tutorial-stage-item:last-child {
		margin-bottom: 0;
	}

	.tutorial-stage-number {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--accent-color);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1em;
		font-weight: 700;
		flex-shrink: 0;
	}

	.tutorial-stage-info h3 {
		margin: 0;
		font-size: 1em;
	}

	.tutorial-stage-info p {
		margin: 0.25rem 0 0;
		font-size: 0.9em;
		opacity: 0.8;
	}

	@media (min-width: 768px) {
		.onboarding-card {
			padding: 2rem;
		}

		.tutorial-char {
			font-size: 2em;
			min-width: 2.5rem;
		}
	}
</style>
