<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/index.js';
	
	export let show = false;
	
	const dispatch = createEventDispatcher();
	let showToast = false;
	let toastTimeout;
	
	// Enable/disable body scroll when overlay opens/closes
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
		if (toastTimeout) {
			clearTimeout(toastTimeout);
		}
	});
	
	function handleBackdropClick() {
		dispatch('close');
	}
	
	function handleClose() {
		dispatch('close');
	}
	
    async function copyURL() {    
        const myUrl = "https://tzisf62c.github.io/zh-bible-verse-memorizer/"; 

        if (typeof window !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(myUrl);
                
                // Show toast notification
                showToast = true;
                
                // Clear any existing timeout
                if (toastTimeout) {
                    clearTimeout(toastTimeout);
                }
                
                // Auto-hide after 2 seconds
                toastTimeout = setTimeout(() => {
                    showToast = false;
                }, 2000);
            } catch (err) {
                // Fallback - still use alert for errors
                alert('Could not copy URL: ' + myUrl);
            }
        }
    }
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="share-overlay-backdrop" on:click={handleBackdropClick}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="share-overlay-panel" on:click|stopPropagation>
			<img src="/share-qr.png" alt="QR Code" class="share-qr" />
			<div class="share-buttons">
				<button class="share-btn" on:click={handleClose}>{t('back')}</button>
				<button class="share-btn primary" on:click={copyURL}>{t('copy_url')}</button>
			</div>
			
			{#if showToast}
				<div class="toast">URL Copied!</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.share-overlay-backdrop {
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
	
	.share-overlay-panel {
		background: var(--panel-background);
		border-radius: 20px;
		padding: 2rem;
		max-width: 600px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
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
	
	.share-qr {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.share-buttons {
		display: flex;
		gap: 1rem;
		width: 100%;
		max-width: 400px;
	}

	.share-btn {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		transition: all 0.3s;
	}

	.share-btn:hover {
		background: var(--nav-button-bg);
	}

	.share-btn.primary {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}

	.share-btn.primary:hover {
		opacity: 0.9;
	}

	.toast {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent-color);
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 0.9em;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: toastSlideIn 0.3s ease;
		z-index: 10;
	}

	@keyframes toastSlideIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
