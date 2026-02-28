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
			<div class="modal-message">{message}</div>
			<div class="modal-buttons">
				{#if buttons.length > 0}
					{#each buttons as button}
						<button 
							class="modal-btn {button.variant || 'primary'}" 
							on:click={() => handleClick(button)}
						>
							{button.label}
						</button>
					{/each}
				{:else if type === 'confirm'}
					<button class="modal-btn primary" on:click={confirm}>
						{t('yes')}
					</button>
					<button class="modal-btn secondary" on:click={close}>
						{t('no')}
					</button>
				{:else}
					<button class="modal-btn primary" on:click={close}>
						{t('ok')}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--panel-background);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		width: 100%;
		text-align: center;
	}

	.modal-title {
		margin: 0 0 1rem 0;
		color: var(--text-color);
		font-size: 1.3rem;
	}

	.modal-message {
		margin-bottom: 1.5rem;
		color: var(--text-color);
		font-size: 1.1rem;
		line-height: 1.5;
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.modal-btn {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s;
		min-width: 100px;
	}

	.modal-btn.primary {
		background: var(--accent-color);
		color: white;
	}

	.modal-btn.secondary {
		background: var(--file-bg);
		color: var(--text-color);
		border: 1px solid var(--file-border);
	}

	.modal-btn.danger {
		background: #d32f2f;
		color: white;
	}

	.modal-btn:hover {
		opacity: 0.9;
	}
</style>
