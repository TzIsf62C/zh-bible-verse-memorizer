<script>
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { icons } from '$lib/utils/icons.js';
	
	export let currentPanel = '';
	export let onMenuClick = () => {};
	export let badges = {}; // Object with nav item IDs as keys and badge counts as values
	
	const dispatch = createEventDispatcher();
	
	const navItems = [
		{ id: 'menu', label: 'menu', icon: 'menu' },
		{ id: 'add', label: 'add_verse', icon: 'plus' },
		{ id: 'learn', label: 'learn', icon: 'book' },
		{ id: 'practice', label: 'practice', icon: 'dumbbell' },
		{ id: 'review', label: 'review', icon: 'hourglass' },
		{ id: 'collections', label: 'collections', icon: 'folder' }
	];
	
	function handleClick(item) {
		if (item.id === 'menu') {
			onMenuClick();
		} else {
			dispatch('navigate', item.id);
		}
	}
	
	// Get badge count for a nav item
	function getBadgeCount(itemId) {
		return badges[itemId] || 0;
	}
	
</script>

<nav class="icon-nav">
	{#each navItems as item}
		<button
			type="button"
			class="icon-nav-item"
			class:active={currentPanel === item.id && item.id !== 'menu'}
			on:click={() => handleClick(item)}
			aria-label={t(item.label)}
		>
			<div class="icon-wrapper">
				<svg
					class="icon-nav-svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					{@html icons[item.icon]}
				</svg>
				{#if getBadgeCount(item.id) > 0}
					<span class="nav-badge">{getBadgeCount(item.id)}</span>
				{/if}
			</div>
		</button>
	{/each}
</nav>

<style>
	.icon-nav {
		display: flex;
		justify-content: space-around;
		align-items: stretch;
		gap: 0.25rem;
		padding: 0.5rem;
		padding-top: calc(0.5rem + env(safe-area-inset-top, 0px));
		background: var(--panel-background);
		border-radius: 0;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		border-bottom: 1px solid var(--file-border);
		/* Fixed positioning with iPhone safe area */
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 900;
	}
	
	.icon-nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: background 0.2s ease;
		color: var(--nav-button-color);
		min-width: 0; /* Allow flex items to shrink */
	}
	
	.icon-nav-item:hover {
		background: var(--nav-button-bg);
	}
	
	.icon-nav-item.active {
		background: var(--accent-color);
		color: #ffffff;
	}
	
	.icon-nav-svg {
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
	}
	
	.icon-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	
	.nav-badge {
		position: absolute;
		top: -4px;
		right: -8px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: var(--danger-color);
		color: white;
		border-radius: 9px;
		font-size: 0.7em;
		font-weight: bold;
		line-height: 18px;
		text-align: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	
	/* Responsive adjustments */
	@media (max-width: 480px) {
		.icon-nav {
			gap: 0.125rem;
			padding: 0.375rem;
			padding-top: calc(0.375rem + env(safe-area-inset-top, 0px));
		}
		
		.icon-nav-item {
			padding: 0.375rem 0.25rem;
		}
		
		.icon-nav-svg {
			width: 1.75rem;
			height: 1.75rem;
		}
		
		.nav-badge {
			top: -3px;
			right: -6px;
			min-width: 16px;
			height: 16px;
			font-size: 0.65em;
			line-height: 16px;
		}
	}
</style>
