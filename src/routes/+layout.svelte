<script>
	import { onDestroy, onMount } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import '../app.css';

	let { children } = $props();
	let unsubscribe;
	let mediaQueryListener;
	let currentThemePreference = 'system';

	function applyThemePreference(themePreference) {
		if (!browser) return;
		currentThemePreference = themePreference;
		const root = document.documentElement;
		if (themePreference === 'light') {
			root.dataset.theme = 'light';
		} else if (themePreference === 'dark') {
			root.dataset.theme = 'dark';
		} else {
			// System preference - detect actual system theme
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			root.dataset.theme = prefersDark ? 'dark' : 'light';
		}
	}

	function applyTextSize(scale) {
		if (!browser) return;
		const scaleValue = Number.parseFloat(scale);
		const safeScale = Number.isFinite(scaleValue) && scaleValue > 0 ? scaleValue : 1;
		document.documentElement.style.setProperty('--text-scale', safeScale);
	}

	function handleSystemThemeChange(e) {
		// Only apply if user has selected 'system' theme
		if (currentThemePreference === 'system') {
			const root = document.documentElement;
			root.dataset.theme = e.matches ? 'dark' : 'light';
		}
	}

	onMount(() => {
		if (!browser) return;
		
		// Subscribe to settings changes
		unsubscribe = settings.subscribe((value) => {
			applyThemePreference(value.themePreference);
			applyTextSize(value.textSizePreference);
		});
		
		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQueryListener = handleSystemThemeChange;
		mediaQuery.addEventListener('change', mediaQueryListener);
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (browser && mediaQueryListener) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.removeEventListener('change', mediaQueryListener);
		}
	});
</script>

<svelte:head>
	<link rel="manifest" href={`${base}/manifest.json`} />
	<link rel="icon" href={`${base}/icons/icon-192x192.png`} />
	<meta name="theme-color" content="#3b82f6" />
	<meta name="description" content="ZH Bible Verse Memorizer" />
</svelte:head>

{@render children()}
