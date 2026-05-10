<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';
	
	export let show = false;
	
	const dispatch = createEventDispatcher();
	
	// Enable/disable body scroll when menu opens/closes
	$: if (browser) {
		if (show) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}
	
	// Clean up on destroy
	onDestroy(() => {
		if (browser) {
			document.body.style.overflow = '';
		}
	});
	
	const menuItems = [
		{ id: 'add', label: 'add_verse', icon: 'plus' },
		{ id: 'learn', label: 'learn', icon: 'book' },
		{ id: 'practice', label: 'practice', icon: 'dumbbell' },
		{ id: 'review', label: 'review', icon: 'hourglass' },
		{ id: 'collections', label: 'collections', icon: 'folder' },
		{ id: 'data', label: 'export_import', icon: 'import-export' },
		{ id: 'stats', label: 'stats', icon: 'stats' },
		{ id: 'heat-maps', label: 'heat_maps', icon: 'flame' },
		{ id: 'share', label: 'share_app', icon: 'qr-code' },
		{ id: 'settings', label: 'settings', icon: 'settings' }
	];
	
	function handleItemClick(itemId) {
		dispatch('navigate', itemId);
		show = false;
	}
	
	function handleBackdropClick() {
		dispatch('close');
	}
	
	// SVG icon paths
	const icons = {
		plus: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>',
		book: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>',
		dumbbell: '<path stroke-linecap="round" stroke-linejoin="round" d="m 5.0331616,8.705 1.775e-4,6.59"/><path stroke-linecap="round" stroke-linejoin="round" d="m 3.0660225,12 17.8679545,10e-7 M 7.0308384,7.032 v 9.936 M 17.097162,7.032 v 9.936"/><path stroke-linecap="round" stroke-linejoin="round" d="m 19.050838,8.705 -1.77e-4,6.59"/>',
		hourglass: '<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75h9v3.75l-4.5 4.5-4.5-4.5v-3.75zM7.5 20.25h9v-3.75l-4.5-4.5-4.5 4.5v3.75z"/>',
		folder: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>',
		'import-export': '<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>',
		stats: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 13h4V21H3V13zM10 3h4v18h-4V3zM17 8h4v13h-4V8z"/>',
		flame: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.2999951 3.8000854 C 12.7999951 4.6750854, 13.2316851 7.2173135, 11.1689951 7.8730854 C 10.4033891 7.6411752, 9.4752731 6.3183354, 9.0502171 7.2870854 C 8.2001102 9.22474, 7.2056998 13.699845, 7.2056998 15.199845 C 7.2056998 18.199845, 10.0004451 20.199845, 12.0004451 20.199845 C 14.0004451 20.199845, 16.7943011 18.199845, 16.7943011 15.199845 C 16.7943011 12.199845, 16.2200361 7.037218, 13.3001441 3.8000854 Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12.0004451 10.6000379 C 13.4434481 12.0818086, 14.0004451 13.6000379, 14.0004451 15.600038 C 14.0004451 17.100038, 13.0004451 20.100038, 12.0004451 20.100038 C 11.0004451 20.100038, 10.0004451 17.100038, 10.0004451 15.600038 C 10.0004451 13.6000379, 12.3442961 13.1196429, 12.0004451 10.6000379 Z"/>',
		settings: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
		'qr-code': '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h. 75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"/>'
	};
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="menu-overlay-backdrop" on:click={handleBackdropClick}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="menu-overlay-panel" on:click|stopPropagation>
			<h2 class="menu-overlay-title">{t('menu')}</h2>
			<div class="menu-overlay-grid">
				{#each menuItems as item}
					<button
						type="button"
						class="menu-overlay-item"
						on:click={() => handleItemClick(item.id)}
					>
						<svg
							class="menu-overlay-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							{@html icons[item.icon]}
						</svg>
						<span class="menu-overlay-label">{t(item.label)}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.menu-overlay-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.menu-overlay-panel {
		background: var(--panel-background);
		border-radius: 20px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.menu-overlay-title {
		margin: 0 0 1.5rem;
		font-size: 1.5em;
		text-align: center;
		color: var(--text-color);
	}
	
	.menu-overlay-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	
	.menu-overlay-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.25rem 0.75rem;
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border: none;
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 100px;
	}
	
	.menu-overlay-item:hover {
		background: var(--accent-color);
		color: #ffffff;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.menu-overlay-icon {
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
	}
	
	.menu-overlay-label {
		font-size: 0.9em;
		font-weight: 600;
		text-align: center;
		line-height: 1.2;
	}
	
	/* Responsive adjustments */
	@media (max-width: 480px) {
		.menu-overlay-panel {
			padding: 1.5rem;
		}
		
		.menu-overlay-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}
		
		.menu-overlay-item {
			padding: 1rem 0.5rem;
			min-height: 90px;
		}
		
		.menu-overlay-icon {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		.menu-overlay-label {
			font-size: 0.85em;
		}
	}
</style>
