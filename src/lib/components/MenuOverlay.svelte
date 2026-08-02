<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';
	import { icons } from '$lib/utils/icons.js';
	
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
		border-radius: 16px;
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
		border-radius: 12px;
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
