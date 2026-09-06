<script>
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n';

	export let show = false;
	export let message = '';
	export let title = '';
	export let buttons = [];
	export let type = 'info'; // 'info', 'confirm', 'success', 'error'

	const dispatch = createEventDispatcher();

	function handleClick(button) {
		dispatch('click', { action: button.action });
		if (button.close !== false) {
			close();
		}
	}

	function close() {
		dispatch('close');
		dispatch('cancel');
	}

	function confirm() {
		dispatch('confirm');
		if (type === 'confirm') {
			show = false;
		}
	}

	function handleOverlayClick() {
		if (type !== 'confirm') {
			close();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Escape' && type !== 'confirm') {
			close();
		}
	}

	// Map button variants onto the shared button classes from app.css
	// (bare <button> = primary accent pill)
	const variantClasses = {
		primary: '',
		secondary: 'btn-outline',
		danger: 'btn-danger'
	};
</script>

{#if show}
	<div 
		class="modal-overlay" 
		on:click={handleOverlayClick} 
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
	>
		<div class="modal-content" on:click|stopPropagation role="document">
			{#if title}
				<h3 class="modal-title">{title}</h3>
			{/if}
		<div class="modal-message">{@html message}</div>
			<div class="modal-buttons">
				{#if buttons.length > 0}
					{#each buttons as button}
						<button
							class="modal-btn {variantClasses[button.variant] ?? ''}"
							on:click={() => handleClick(button)}
						>
							{button.label}
						</button>
					{/each}
				{:else if type === 'confirm'}
					<button class="modal-btn" on:click={confirm}>
						{t('yes')}
					</button>
					<button class="modal-btn btn-outline" on:click={close}>
						{t('no')}
					</button>
				{:else}
					<button class="modal-btn" on:click={close}>
						{t('ok')}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Overlay/content/buttons shells come from the shared classes in app.css */
	.modal-content {
		position: relative;
		max-width: 760px;
		max-height: min(88vh, 760px);
		overflow-y: auto;
	}

	.modal-title {
		margin: 0 0 1rem 0;
		color: var(--text-color);
		font-size: 1.3rem;
	}

	.modal-message {
		margin-bottom: 1.5rem;
		color: var(--text-color);
		font-size: 1.1em;
		line-height: 1.5;
	}

	.modal-message :global(ul) {
		text-align: left;
		margin: 0.5rem 0;
		padding-left: 2rem;
		list-style-position: inside;
	}

	.modal-message :global(li) {
		text-align: left;
		margin: 0.25rem 0;
	}

	/* Sizing only — colors/shape come from the shared button classes in app.css */
	.modal-btn {
		min-width: 100px;
	}
</style>
