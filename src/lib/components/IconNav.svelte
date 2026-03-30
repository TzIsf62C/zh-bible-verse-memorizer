<script>
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	
	export let currentPanel = '';
	export let onMenuClick = () => {};
	
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
	
	// SVG icon paths
	const icons = {
		menu: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>',
		plus: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>',
		book: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>',
		dumbbell: '<path stroke-linecap="round" stroke-linejoin="round" d="m 5.0331616,8.705 1.775e-4,6.59"/><path stroke-linecap="round" stroke-linejoin="round" d="m 3.0660225,12 17.8679545,10e-7 M 7.0308384,7.032 v 9.936 M 17.097162,7.032 v 9.936"/><path stroke-linecap="round" stroke-linejoin="round" d="m 19.050838,8.705 -1.77e-4,6.59"/>',
		hourglass: '<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75h9v3.75l-4.5 4.5-4.5-4.5v-3.75zM7.5 20.25h9v-3.75l-4.5-4.5-4.5 4.5v3.75z"/>',
		folder: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>'
	};
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
		background: var(--panel-background);
		border-radius: 16px;
		box-shadow: var(--panel-shadow);
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
	
	/* Responsive adjustments */
	@media (max-width: 480px) {
		.icon-nav {
			gap: 0.125rem;
			padding: 0.375rem;
		}
		
		.icon-nav-item {
			padding: 0.375rem 0.25rem;
		}
		
		.icon-nav-svg {
			width: 1.75rem;
			height: 1.75rem;
		}
	}
</style>
