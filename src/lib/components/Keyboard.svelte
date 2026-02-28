<script>
	import { createEventDispatcher } from 'svelte';

	export let layout = [];
	export let showBackspace = true;
	export let showEnter = false;
	export let isNumeric = false;

	const dispatch = createEventDispatcher();

	function handleKeyPress(key) {
		// Map special characters to their function names
		if (key === '⌫') {
			dispatch('key', 'Backspace');
		} else if (key === '✔') {
			dispatch('key', 'Enter');
		} else {
			dispatch('key', key);
		}
	}
</script>

<div class="keyboard" class:numeric={isNumeric}>
	{#each layout as row}
		<div class="keyboard-row">
			{#each row as key}
				{#if key.key === 'SPACER'}
					<div class="key spacer"></div>
				{:else}
					<button type="button" class="key" class:backspace={key.key === '⌫'} class:enter={key.key === '✔'} class:narrow={key.narrow} on:click={() => handleKeyPress(key.key)}>
						{key.display}
					</button>
				{/if}
			{/each}
		</div>
	{/each}
	{#if showBackspace && layout.length > 0 && !layout.some(row => row.some(k => k.key === '⌫'))}
		<button type="button" class="key key-wide backspace" on:click={() => handleKeyPress('Backspace')}>
			⌫
		</button>
	{/if}
	{#if showEnter && layout.length > 0 && !layout.some(row => row.some(k => k.key === '✔'))}
		<button type="button" class="key key-wide enter" on:click={() => handleKeyPress('Enter')}>
			↵
		</button>
	{/if}
</div>
