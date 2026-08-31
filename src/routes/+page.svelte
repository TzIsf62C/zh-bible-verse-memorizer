<script>
	import { onDestroy, onMount } from 'svelte';
	import { browser, dev } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts.js';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps.js';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import AddVerseForm from '$lib/components/AddVerseForm.svelte';
	import LearningFlow from '$lib/components/LearningFlow.svelte';
	import ReviewSessions from '$lib/components/ReviewSessions.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import Collections from '$lib/components/Collections.svelte';
	import ExportImport from '$lib/components/ExportImport.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import HeatMaps from '$lib/components/HeatMaps.svelte';
	import Practice from '$lib/components/Practice.svelte';
	import IconNav from '$lib/components/IconNav.svelte';
	import MenuOverlay from '$lib/components/MenuOverlay.svelte';
	import ShareOverlay from '$lib/components/ShareOverlay.svelte';
	import Onboarding from '$lib/components/Onboarding.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import AchievementToast from '$lib/components/AchievementToast.svelte';
	import { scrollRootToTopLeft } from '$lib/utils/scroll';
	import { t } from '$lib/i18n/index.js';
	import { initializeAchievementsTracking } from '$lib/stores/achievements';
	import { initializeProgressTracking } from '$lib/stores/progressHistory.js';
	import { initializeDailyStreakOnOpen } from '$lib/stores/streak.js';

	let currentPanel = 'learn';
	let heatMapsSource = null; // 'stats' | 'menu' | null
	let showMenu = false;
	let showShare = false;
	let showOnboarding = false;
	let selectedPracticeVerseId = null; // For "Practice Now" from Stats or Heat Maps
	let keyboardInput = '';
	let keyboardLayout = keyboardLayouts.pinyin;
	let removeListener = () => {};
	let reviewBadgeCount = 0;
	let dueNowTimestamp = Date.now();
	let showBackupReminder = false;
	let tutorialOnlyMode = false;

	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	function debugReviewBadge(message, payload = {}) {
		if (!dev || !browser) return;
		console.debug('[ReviewBadge]', message, payload);
	}

	function isVerseDue(verse, now = new Date()) {
		if (!verse.lastReviewed) return false;
		if (verse.secondChanceActive) {
			if (!verse.secondChanceDueDate) return true;
			return new Date(verse.secondChanceDueDate) <= now;
		}
		if (!verse.dueDate) return true;
		return new Date(verse.dueDate) <= now;
	}

	function refreshDueNowTimestamp() {
		dueNowTimestamp = Date.now();
		debugReviewBadge('refreshDueNowTimestamp', {
			dueNowTimestamp,
			isoNow: new Date(dueNowTimestamp).toISOString()
		});
	}

	function handleImportedData() {
		debugReviewBadge('imported event received', {
			versesTotal: $verses.length,
			reviewedVerses: $verses.filter((verse) => Boolean(verse.lastReviewed)).length,
			previewDueCount: $verses.filter((verse) => isVerseDue(verse, new Date(dueNowTimestamp))).length
		});
		refreshDueNowTimestamp();
		queueMicrotask(() => {
			debugReviewBadge('imported microtask snapshot', {
				versesTotal: $verses.length,
				reviewedVerses: $verses.filter((verse) => Boolean(verse.lastReviewed)).length,
				previewDueCount: $verses.filter((verse) => isVerseDue(verse, new Date(dueNowTimestamp))).length
			});
		});
		window.setTimeout(() => {
			debugReviewBadge('imported timeout snapshot', {
				versesTotal: $verses.length,
				reviewedVerses: $verses.filter((verse) => Boolean(verse.lastReviewed)).length,
				previewDueCount: $verses.filter((verse) => isVerseDue(verse, new Date(dueNowTimestamp))).length
			});
		}, 0);
	}

	$: reviewBadgeCount = $verses.filter((verse) => isVerseDue(verse, new Date(dueNowTimestamp))).length;
	$: if (dev && browser) {
		debugReviewBadge('reactive badge recompute', {
			reviewBadgeCount,
			versesTotal: $verses.length,
			reviewedVerses: $verses.filter((verse) => Boolean(verse.lastReviewed)).length,
			dueNowTimestamp,
			isoNow: new Date(dueNowTimestamp).toISOString(),
			panel: currentPanel
		});
	}

	function scrollToTop() {
		if (!browser) return;
		scrollRootToTopLeft();
	}
	
	// Check if onboarding should be shown
	$: {
		const inProgress = browser && localStorage.getItem('onboardingInProgress') === 'true';
		const shouldShow = tutorialOnlyMode || (!$settings.hasCompletedOnboarding && ($verses.length === 0 || inProgress));
		showOnboarding = shouldShow;
		if (showOnboarding) {
			showBackupReminder = false;
		}
	}

	function openTutorialFromSettings() {
		tutorialOnlyMode = true;
		showOnboarding = true;
	}

	function getBackupReminderMessage() {
		return `${t('backup_reminder_message')}<div style="margin-top: 16px; padding: 12px; background: var(--file-bg); border-radius: 4px; font-size: 0.9em;"><p style="margin: 0 0 8px 0;"><strong>${t('backup_reminder_how')}</strong></p><p style="margin: 0;">${t('backup_reminder_steps')}</p></div>`;
	}

	function toTimestamp(value) {
		if (typeof value !== 'string' || !value.trim()) {
			return 0;
		}

		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
	}

	function getLocalDateKey(timestamp = Date.now()) {
		const date = new Date(timestamp);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function checkBackupReminder() {
		if (!browser || showOnboarding || !$settings.hasCompletedOnboarding) {
			return;
		}

		if ($settings.backupReminderEnabled === false) {
			return;
		}

		const now = Date.now();
		const reminderShownTodayKey = localStorage.getItem('lastBackupReminderShownDate');
		const todayKey = getLocalDateKey(now);
		if (reminderShownTodayKey === todayKey) {
			return;
		}

		const lastExportDate = $settings.lastExportDate || localStorage.getItem('lastExportDate') || '';
		const lastExportTimestamp = toTimestamp(lastExportDate);
		const reminderWeeks = Number.isFinite(Number($settings.backupReminderWeeks))
			? Math.max(1, Math.min(52, Math.round(Number($settings.backupReminderWeeks))))
			: 4;

		if (!lastExportTimestamp) {
			localStorage.setItem('lastBackupReminderShownDate', todayKey);
			showBackupReminder = true;
			return;
		}

		const reminderIntervalMs = reminderWeeks * 7 * 24 * 60 * 60 * 1000;

		if (now - lastExportTimestamp >= reminderIntervalMs) {
			localStorage.setItem('lastBackupReminderShownDate', todayKey);
			showBackupReminder = true;
		}
	}

	function handleBackupReminderClick(event) {
		const action = event.detail?.action;
		showBackupReminder = false;
		if (action === 'export') {
			switchPanel('data');
		}
	}

	function handleOnboardingComplete() {
		showOnboarding = false;
		showBackupReminder = false;
		tutorialOnlyMode = false;
	}

	function appendKeyboardInput(key) {
		if (key === 'Backspace') {
			keyboardInput = keyboardInput.slice(0, -1);
			return;
		}
		if (key === 'Enter') return;
		keyboardInput += key;
	}

	function handlePhysicalKey(event) {
		if (!event?.key) return;
		const key = event.key.toLowerCase();
		if (key === 'backspace') {
			keyboardInput = keyboardInput.slice(0, -1);
			return;
		}
		if ($settings.inputMethod === 'zhuyin' && zhuyinKeyMap[key]) {
			keyboardInput += zhuyinKeyMap[key];
			return;
		}
		if ($settings.inputMethod === 'cangjie' && cangjieKeyMap[key]) {
			keyboardInput += cangjieKeyMap[key];
			return;
		}
		if ($settings.inputMethod === 'pinyin' && /^[a-z0-9]$/.test(key)) {
			keyboardInput += key;
		}
	}

	function switchPanel(panelId) {
		debugReviewBadge('switchPanel', { from: currentPanel, to: panelId });
		if (panelId !== 'heat-maps') {
			heatMapsSource = null;
		}
		currentPanel = panelId;
		scrollToTop();
	}

	function openHeatMaps(source) {
		heatMapsSource = source;
		currentPanel = 'heat-maps';
		scrollToTop();
	}

	function handleMenuClick() {
		showMenu = true;
	}

	function handleMenuNavigate(event) {
		const panelId = event.detail;
		
		if (panelId === 'share') {
			showShare = true;
			showMenu = false;
			return;
		}
		
		if (panelId === 'heat-maps') {
			openHeatMaps('menu');
		} else {
			switchPanel(panelId);
		}
		showMenu = false;
	}
	
	async function handleShare() {
		if (browser && navigator.share) {
			try {
				await navigator.share({
					title: 'ZH Bible Verse Memorizer',
					text: 'Check out this Chinese Bible verse memorization app!',
					url: window.location.href
				});
			} catch (err) {
				// User cancelled share or share failed
				console.log('Share cancelled or failed:', err);
			}
		} else {
			// Fallback: copy URL to clipboard
			if (browser) {
				try {
					await navigator.clipboard.writeText(window.location.href);
					alert('App URL copied to clipboard!');
				} catch (err) {
					alert('Share URL: ' + window.location.href);
				}
			}
		}
	}

	function handleMenuClose() {
		showMenu = false;
	}

	function handleShareClose() {
		showShare = false;
	}

	function updateSetting(key, value) {
		if (key === 'inputMethod') {
			keyboardInput = '';
		}
		console.log('[Settings] Update', { key, value });
		settings.update((current) => ({
			...current,
			[key]: value
		}));
	}

	onMount(() => {
		if (!browser) return;
		debugReviewBadge('onMount start', {
			versesTotal: $verses.length,
			reviewedVerses: $verses.filter((verse) => Boolean(verse.lastReviewed)).length
		});
		initializeDailyStreakOnOpen();
		initializeAchievementsTracking();
		initializeProgressTracking();
		settings.update((value) => value);
		refreshDueNowTimestamp();

		const handleVisibilityChange = () => {
			debugReviewBadge('visibilitychange', { hidden: document.hidden });
			if (!document.hidden) {
				refreshDueNowTimestamp();
			}
		};

		window.addEventListener('keydown', handlePhysicalKey);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		const badgeTickId = window.setInterval(refreshDueNowTimestamp, 30000);
		debugReviewBadge('badge tick interval registered', { intervalMs: 30000 });
		const backupReminderTimer = window.setTimeout(() => {
			checkBackupReminder();
		}, 350);
		removeListener = () => {
			debugReviewBadge('removeListener cleanup');
			window.removeEventListener('keydown', handlePhysicalKey);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.clearInterval(badgeTickId);
			window.clearTimeout(backupReminderTimer);
		};
	});

	onDestroy(() => {
		debugReviewBadge('onDestroy');
		removeListener();
	});
</script>

<svelte:head>
	<title>ZH Bible Verse Memorizer (SvelteKit)</title>
</svelte:head>

<main class="app-shell">
	<span class="visually-hidden" aria-hidden="true">{$settings.languagePreference}</span>
	<header class="app-header">
		<h1>{t('app_title')}</h1>
		<p class="subtitle">{t('app_subtitle')}</p>
	</header>

	<IconNav
		currentPanel={currentPanel}
		reviewBadge={reviewBadgeCount}
		onMenuClick={handleMenuClick}
		on:navigate={(e) => switchPanel(e.detail)}
	/>

	<MenuOverlay
		bind:show={showMenu}
		on:navigate={handleMenuNavigate}
		on:close={handleMenuClose}
	/>

	<ShareOverlay
		bind:show={showShare}
		on:close={handleShareClose}
	/>

	<AchievementToast />

	{#if currentPanel === 'learn'}
		<LearningFlow />
	{:else if currentPanel === 'review'}
		<ReviewSessions />
	{:else if currentPanel === 'add'}
		<AddVerseForm />
	{:else if currentPanel === 'collections'}
		{#key $settings.languagePreference}
			<Collections />
		{/key}
	{:else if currentPanel === 'settings'}
		{#key $settings.languagePreference}
			<Settings on:viewtutorial={openTutorialFromSettings} />
		{/key}
	{:else if currentPanel === 'data'}
		{#key $settings.languagePreference}
			<ExportImport on:imported={handleImportedData} />
		{/key}
	{:else if currentPanel === 'stats'}
		{#key $settings.languagePreference}
			<Stats 
				on:exit={() => switchPanel('learn')}
				on:navigate-heat-maps={() => openHeatMaps('stats')}
			/>
		{/key}
	{:else if currentPanel === 'heat-maps'}
		{#key $settings.languagePreference}
			<HeatMaps 
				on:exit={() => switchPanel('learn')}
				showStatsBack={heatMapsSource === 'stats'}
				on:back-to-stats={() => {
					currentPanel = 'stats';
					scrollToTop();
				}}
				on:practice={(e) => {
					selectedPracticeVerseId = e.detail?.verseId || null;
					switchPanel('practice');
				}}
			/>
		{/key}
	{:else if currentPanel === 'practice'}
		<Practice 
			preselectedVerseId={selectedPracticeVerseId}
			on:clearPreselection={() => { selectedPracticeVerseId = null; }}
			on:exit={() => {
				selectedPracticeVerseId = null;
				switchPanel('learn');
			}}
		/>
	{/if}
	
	<!-- Onboarding overlay (shown on first run) -->
	{#if showOnboarding}
		<Onboarding startAtTutorial={tutorialOnlyMode} on:complete={handleOnboardingComplete} />
	{/if}

	<Modal
		show={showBackupReminder}
		title={t('backup_reminder_title')}
		message={getBackupReminderMessage()}
		buttons={[
			{ label: t('backup_reminder_got_it'), action: 'dismiss', variant: 'primary' },
			{ label: t('backup_reminder_export_now'), action: 'export', variant: 'secondary' }
		]}
		on:click={handleBackupReminderClick}
		on:close={() => {
			showBackupReminder = false;
		}}
	/>
</main>
