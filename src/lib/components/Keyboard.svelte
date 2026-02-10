<script>
	import { createEventDispatcher } from 'svelte';

	export let layout = [];
	export let showBackspace = true;
	export let showEnter = false;

	const dispatch = createEventDispatcher();

	function handleKeyPress(key) {
		dispatch('key', key);
	}
</script>

<div class="keyboard">
	{#each layout as row}
		<div class="keyboard-row">
			{#each row as key}
				<button type="button" class="key" on:click={() => handleKeyPress(key.key)}>
					{key.display}
				</button>
			{/each}
		</div>
	{/each}
	{#if showBackspace}
		<button type="button" class="key key-wide" on:click={() => handleKeyPress('Backspace')}>
			⌫
		</button>
	{/if}
	{#if showEnter}
		<button type="button" class="key key-wide" on:click={() => handleKeyPress('Enter')}>
			↵
		</button>
	{/if}
</div>
