<script>
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings.js';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts.js';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps.js';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import AddVerseForm from '$lib/components/AddVerseForm.svelte';
	import LearningFlow from '$lib/components/LearningFlow.svelte';
	import ReviewSessions from '$lib/components/ReviewSessions.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import Collections from '$lib/components/Collections.svelte';
	import ExportImport from '$lib/components/ExportImport.svelte';
	import IconNav from '$lib/components/IconNav.svelte';
	import MenuOverlay from '$lib/components/MenuOverlay.svelte';
	import { t } from '$lib/i18n/index.js';

	let currentPanel = 'learn';
	let showMenu = false;

	let keyboardInput = '';
	let keyboardLayout = keyboardLayouts.pinyin;
	let removeListener = () => {};

	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

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
			handleShare();
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
		window.addEventListener('keydown', handlePhysicalKey);
		removeListener = () => window.removeEventListener('keydown', handlePhysicalKey);
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

	<IconNav
		currentPanel={currentPanel}
		onMenuClick={handleMenuClick}
		on:navigate={(e) => switchPanel(e.detail)}
	/>

	<MenuOverlay
		bind:show={showMenu}
		on:navigate={handleMenuNavigate}
		on:close={handleMenuClose}
	/>

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
			<Settings />
		{/key}
	{:else if currentPanel === 'data'}
		{#key $settings.languagePreference}
			<ExportImport />
		{/key}
	{:else if currentPanel === 'practice'}
		<div class="panel">
			<h2>{t('practice')}</h2>
			<p style="color: var(--subtitle-color);">Practice panel coming soon...</p>
		</div>
	{/if}
</main>
