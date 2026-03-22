<script>
	import { createEventDispatcher } from 'svelte';

	export let layout = [];
	export let showBackspace = true;
	export let showEnter = false;
	export let isNumeric = false;
	
	// Feedback props for learn/review modes
	export let pressedKey = null; // The key that was just pressed (show red if incorrect)
	export let correctKey = null; // The key that should have been pressed (show green if pressedKey is wrong)
	export let lastCorrectKey = null; // The last correctly pressed key (show white/grey feedback)

	const dispatch = createEventDispatcher();

	function handleKeyPress(keyObj) {
		// If it's a simple string (legacy support), handle directly
		if (typeof keyObj === 'string') {
			if (keyObj === '⌫') {
				dispatch('key', 'Backspace');
			} else if (keyObj === '✔') {
				dispatch('key', 'Enter');
			} else {
				dispatch('key', keyObj);
			}
			return;
		}
		
		// For key objects, emit the display value (mapped character for zhuyin/cangjie)
		const key = keyObj.key;
		const display = keyObj.display;
		
		if (key === '⌫') {
			dispatch('key', 'Backspace');
		} else if (key === '✔') {
			dispatch('key', 'Enter');
		} else {
			// Emit the display value (this is the mapped character for zhuyin/cangjie)
			dispatch('key', display);
		}
	}
	
	// Helper function to check if a key should have feedback styling
	function getKeyFeedback(keyValue) {
		// Normalize key for comparison (handle both raw keys and display values)
		const normalizedKey = keyValue.toLowerCase();
		const normalizedPressed = pressedKey ? pressedKey.toLowerCase() : null;
		const normalizedCorrect = correctKey ? correctKey.toLowerCase() : null;
		const normalizedLastCorrect = lastCorrectKey ? lastCorrectKey.toLowerCase() : null;
		
		if (normalizedPressed && normalizedCorrect && normalizedPressed !== normalizedCorrect) {
			// There was an error
			if (normalizedKey === normalizedPressed) {
				return 'incorrect'; // Red background for the pressed wrong key
			} else if (normalizedKey === normalizedCorrect) {
				return 'correct'; // Green background for the key that should have been pressed
			}
		} else if (normalizedLastCorrect && normalizedKey === normalizedLastCorrect) {
			// Last input was correct
			return 'success'; // White/grey background for the last correct key
		}
		return null;
	}
</script>

<div class="keyboard" class:numeric={isNumeric}>
	{#each layout as row}
		<div class="keyboard-row">
			{#each row as key}
				{#if key.key === 'SPACER'}
					<div class="key spacer"></div>
				{:else}
					{@const feedback = getKeyFeedback(key.display)}
					<button 
						type="button" 
						class="key" 
						class:backspace={key.key === '⌫'} 
						class:enter={key.key === '✔'} 
						class:narrow={key.narrow}
						class:key-incorrect={feedback === 'incorrect'}
						class:key-correct={feedback === 'correct'}
						class:key-success={feedback === 'success'}
						on:mousedown|preventDefault 
						on:click={() => handleKeyPress(key)}
					>
						{key.display}
					</button>
				{/if}
			{/each}
		</div>
	{/each}
	{#if showBackspace && layout.length > 0 && !layout.some(row => row.some(k => k.key === '⌫'))}
		<button type="button" class="key key-wide backspace" on:mousedown|preventDefault on:click={() => handleKeyPress('Backspace')}>
			⌫
		</button>
	{/if}
	{#if showEnter && layout.length > 0 && !layout.some(row => row.some(k => k.key === '✔'))}
		<button type="button" class="key key-wide enter" on:mousedown|preventDefault on:click={() => handleKeyPress('Enter')}>
			↵
		</button>
	{/if}
</div>

<style>
	/* Feedback state styling */
	.key.key-incorrect {
		background: #dc3545 !important;
		color: #ffffff !important;
		border-color: #c82333 !important;
	}
	
	.key.key-correct {
		background: #28a745 !important;
		color: #ffffff !important;
		border-color: #218838 !important;
	}
	
	/* Success feedback - different for light and dark themes */
	.key.key-success {
		/* Default (light theme) - deep grey with white text */
		background: #4a4a4a !important;
		color: #ffffff !important;
		border-color: #333333 !important;
	}
	
	:global([data-theme='dark']) .key.key-success {
		/* Dark theme - light grey with black text */
		background: #d0d0d0 !important;
		color: #000000 !important;
		border-color: #b0b0b0 !important;
	}
</style>
