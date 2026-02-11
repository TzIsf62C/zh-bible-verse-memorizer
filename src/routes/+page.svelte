<script>
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { verses } from '$lib/stores/verses.js';
	import { collections } from '$lib/stores/collections.js';
	import { settings } from '$lib/stores/settings.js';
	import {
		parseImportPayload,
		mergeVerses,
		mergeCollections,
		buildExportPayload
	} from '$lib/utils/importExport.js';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts.js';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps.js';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import AddVerseForm from '$lib/components/AddVerseForm.svelte';
	import LearningFlow from '$lib/components/LearningFlow.svelte';
	import ReviewSessions from '$lib/components/ReviewSessions.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import Collections from '$lib/components/Collections.svelte';
	import { t } from '$lib/i18n/index.js';

	const panels = [
		{ id: 'learn', label: 'learn' },
		{ id: 'review', label: 'review' },
		{ id: 'add', label: 'add_verse' },
		{ id: 'collections', label: 'collections' },
		{ id: 'settings', label: 'settings' },
		{ id: 'data', label: 'export_import' }
	];
	let currentPanel = 'data';

	let importStatus = '';
	let exportStatus = '';
	let includeReview = true;
	let includeCollections = true;
	let keyboardInput = '';
	let keyboardLayout = keyboardLayouts.pinyin;
	let removeListener = () => {};

	$: keyboardLayout = keyboardLayouts[$settings.inputMethod] || keyboardLayouts.pinyin;

	function handleImportFile(event) {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const { verses: importedVerses, collections: importedCollections } = parseImportPayload(
					e.target.result
				);

				const mergedVerses = mergeVerses($verses, importedVerses, {
					includeReview
				});
				verses.set(mergedVerses);

				if (includeCollections && importedCollections?.length) {
					const mergedCollections = mergeCollections($collections, importedCollections, mergedVerses);
					collections.set(mergedCollections);
				}

				importStatus = 'Import successful.';
			} catch (error) {
				importStatus = `Import failed: ${error.message}`;
			}
		};
		reader.readAsText(file);
	}

	function handleExport() {
		const payload = buildExportPayload($verses, $collections, {
			includeReview,
			includeCollections
		});

		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'bible-verses.json';
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
		exportStatus = 'Exported bible-verses.json.';
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
		importStatus = '';
		exportStatus = '';
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

	<nav class="panel-nav">
		{#each panels as panel}
			<button
				type="button"
				class:active={currentPanel === panel.id}
				on:click={() => switchPanel(panel.id)}
			>
				{#key $settings.languagePreference}
					{t(panel.label)}
				{/key}
			</button>
		{/each}
	</nav>

	{#if currentPanel === 'learn'}
		<LearningFlow />
	{:else if currentPanel === 'review'}
		<ReviewSessions />
	{:else if currentPanel === 'add'}
		<AddVerseForm />
	{:else if currentPanel === 'collections'}
		<section class="panel">
			{#key $settings.languagePreference}
				<Collections />
			{/key}
		</section>
	{:else if currentPanel === 'settings'}
		<section class="panel">
			{#key $settings.languagePreference}
				<Settings />
			{/key}
		</section>
	{:else}
		<section class="panel">
			<h2>{t('data_compatibility')}</h2>
			<p>{t('data_compatibility_description')}</p>

			<div class="control-row">
				<label>
					<input type="checkbox" bind:checked={includeReview} />
					{t('include_review_data')}
				</label>
				<label>
					<input type="checkbox" bind:checked={includeCollections} />
					{t('include_collections')}
				</label>
			</div>

			<div class="control-row">
				<input type="file" accept="application/json" on:change={handleImportFile} />
				<button type="button" on:click={handleExport}>{t('export_json')}</button>
			</div>

			{#if importStatus}
				<p class="status">{importStatus}</p>
			{/if}
			{#if exportStatus}
				<p class="status">{exportStatus}</p>
			{/if}
		</section>

		<section class="panel">
			<h2>{t('current_data')}</h2>
			<ul>
				<li>Verses: {$verses.length}</li>
				<li>Collections: {$collections.length}</li>
				<li>{t('language')}: {$settings.languagePreference}</li>
				<li>{t('input_method')}: {$settings.inputMethod}</li>
				<li>{t('theme')}: {$settings.themePreference}</li>
			</ul>
		</section>
	{/if}
</main>
