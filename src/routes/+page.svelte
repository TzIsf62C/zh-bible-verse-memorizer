<script>
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { STORE_SYNC_EVENT } from '$lib/stores/localStorage.js';
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
	import Practice from '$lib/components/Practice.svelte';
	import IconNav from '$lib/components/IconNav.svelte';
	import MenuOverlay from '$lib/components/MenuOverlay.svelte';
	import ShareOverlay from '$lib/components/ShareOverlay.svelte';
	import Onboarding from '$lib/components/Onboarding.svelte';
	import { t } from '$lib/i18n/index.js';

	let currentPanel = 'learn';
	let showMenu = false;
	let showShare = false;
	let showOnboarding = false;
	let selectedPracticeVerseId = null; // For \"Practice Now\" from Stats

	let keyboardInput = '';
	let keyboardLayout = keyboardLayouts.pinyin;
	let removeListener = () => {};
	let reviewBadgeCount = 0;
	let lastKnownVersesSnapshot = '';

	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	function countDueReviewVerses(verseList) {
		return verseList.filter((verse) => {
			if (!verse.lastReviewed) return false;
			if (!verse.dueDate) return true;
			return new Date(verse.dueDate) <= new Date();
		}).length;
	}

	function refreshReviewBadgeCount(verseList = null) {
		if (Array.isArray(verseList)) {
			lastKnownVersesSnapshot = JSON.stringify(verseList);
			reviewBadgeCount = countDueReviewVerses(verseList);
			return;
		}

		if (!browser) {
			return;
		}

		try {
			const rawVerses = localStorage.getItem('verses') || '[]';
			lastKnownVersesSnapshot = rawVerses;
			const storedVerses = JSON.parse(rawVerses);
			reviewBadgeCount = countDueReviewVerses(storedVerses);
		} catch {
			reviewBadgeCount = countDueReviewVerses($verses);
		}
	}

	function syncReviewBadgeFromStorage() {
		if (!browser) {
			return;
		}

		const rawVerses = localStorage.getItem('verses') || '[]';
		if (rawVerses === lastKnownVersesSnapshot) {
			return;
		}

		refreshReviewBadgeCount();
	}

	$: reviewBadgeCount = countDueReviewVerses($verses);
	
	// Check if onboarding should be shown
	$: {
		const shouldShow = !$settings.hasCompletedOnboarding && $verses.length === 0;
		showOnboarding = shouldShow;
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
		currentPanel = panelId;
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
		
		currentPanel = panelId;
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
		settings.update((value) => value);
		refreshReviewBadgeCount();

		const handleStoreSync = (event) => {
			if (event.detail?.key !== 'verses') {
				return;
			}

			refreshReviewBadgeCount(event.detail.value || []);
		};

		window.addEventListener('keydown', handlePhysicalKey);
		window.addEventListener(STORE_SYNC_EVENT, handleStoreSync);
		const badgePollId = window.setInterval(syncReviewBadgeFromStorage, 250);
		removeListener = () => {
			window.removeEventListener('keydown', handlePhysicalKey);
			window.removeEventListener(STORE_SYNC_EVENT, handleStoreSync);
			window.clearInterval(badgePollId);
		};
	});

	onDestroy(() => {
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

	{#key `${currentPanel}:${reviewBadgeCount}`}
		<IconNav
			currentPanel={currentPanel}
			badges={{ review: reviewBadgeCount }}
			onMenuClick={handleMenuClick}
			on:navigate={(e) => switchPanel(e.detail)}
		/>
	{/key}

	<MenuOverlay
		bind:show={showMenu}
		on:navigate={handleMenuNavigate}
		on:close={handleMenuClose}
	/>

	<ShareOverlay
		bind:show={showShare}
		on:close={handleShareClose}
	/>

	{#if currentPanel === 'learn'}
		<LearningFlow />
	{:else if currentPanel === 'review'}
		<ReviewSessions on:reviewupdated={() => refreshReviewBadgeCount()} />
	{:else if currentPanel === 'add'}
		<AddVerseForm />
	{:else if currentPanel === 'collections'}
		{#key $settings.languagePreference}
			<Collections />
		{/key}
	{:else if currentPanel === 'settings'}
		{#key $settings.languagePreference}
			<Settings />
		{/key}
	{:else if currentPanel === 'data'}
		{#key $settings.languagePreference}
			<ExportImport on:imported={() => refreshReviewBadgeCount()} />
		{/key}
	{:else if currentPanel === 'stats'}
		{#key $settings.languagePreference}
			<Stats 
				on:exit={() => currentPanel = 'learn'}
				on:practice={(e) => {
					selectedPracticeVerseId = e.detail?.verseId || null;
					currentPanel = 'practice';
				}}
			/>
		{/key}
	{:else if currentPanel === 'practice'}
		<Practice 
			preselectedVerseId={selectedPracticeVerseId}
			on:clearPreselection={() => { selectedPracticeVerseId = null; }}
			on:exit={() => {
				selectedPracticeVerseId = null;
				currentPanel = 'learn';
			}}
		/>
	{/if}
	
	<!-- Onboarding overlay (shown on first run) -->
	{#if showOnboarding}
		<Onboarding on:complete={() => { showOnboarding = false; }} />
	{/if}
</main>
