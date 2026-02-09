<script>
	import { onDestroy, onMount } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings.js';
	import '../app.css';

	let { children } = $props();
	let unsubscribe;

	function applyThemePreference(themePreference) {
		if (!browser) return;
		const root = document.documentElement;
		if (themePreference === 'light') {
			root.dataset.theme = 'light';
		} else if (themePreference === 'dark') {
			root.dataset.theme = 'dark';
		} else {
			root.dataset.theme = 'system';
		}
	}

	onMount(() => {
		if (!browser) return;
		unsubscribe = settings.subscribe((value) => {
			applyThemePreference(value.themePreference);
		});
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
</script>

<svelte:head>
	<link rel="manifest" href={`${base}/manifest.json`} />
	<link rel="icon" href={`${base}/icons/icon-192x192.png`} />
	<meta name="theme-color" content="#3b82f6" />
	<meta name="description" content="ZH Bible Verse Memorizer" />
</svelte:head>

{@render children()}
