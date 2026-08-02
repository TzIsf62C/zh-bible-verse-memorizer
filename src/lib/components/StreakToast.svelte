<script>
	import { onDestroy } from 'svelte';
	import { dequeueStreakToast, streakToastQueue } from '$lib/stores/streakToast.js';
	import { t } from '$lib/i18n';

	let currentToast = null;
	let hideTimer = null;
	let retryTimer = null;
	let isAdvancing = false;

	const unsubscribe = streakToastQueue.subscribe((items) => {
		if (!currentToast && !isAdvancing && items.length > 0) {
			showNext();
		}
	});

	function showNext() {
		if (isAdvancing) return;

		if (hasOpenModal()) {
			scheduleRetry();
			return;
		}

		isAdvancing = true;
		const next = dequeueStreakToast();
		if (!next) {
			currentToast = null;
			isAdvancing = false;
			return;
		}

		currentToast = next;
		isAdvancing = false;

		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			currentToast = null;
			showNext();
		}, 3000);
	}

	function hasOpenModal() {
		if (typeof document === 'undefined') return false;
		return Boolean(document.querySelector('.modal-overlay, .conflict-modal-overlay, [role="dialog"]'));
	}

	function scheduleRetry() {
		if (retryTimer) return;
		retryTimer = setTimeout(() => {
			retryTimer = null;
			showNext();
		}, 200);
	}

	onDestroy(() => {
		unsubscribe();
		if (hideTimer) clearTimeout(hideTimer);
		if (retryTimer) clearTimeout(retryTimer);
	});
</script>

{#if currentToast}
	<div class="streak-toast" role="status" aria-live="polite">
		<div class="icon-wrap" aria-hidden="true">
			<svg
				class="streak-icon"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m 17.743805,20.940542 -5.781531,-3.693107 -5.819038,3.633721 1.725761,-6.6397954 -5.254055,-4.4113532 6.84811,-0.4105127 2.571854,-6.3600867 2.506604,6.3860845 6.843548,0.4806036 -5.298944,4.3573299 z"></path>
			</svg>
		</div>
		<div class="text-wrap">
			<div class="title">{t('streak_extended')}</div>
		</div>
	</div>
{/if}

<style>
	.streak-toast {
		position: fixed;
		top: calc(4.5rem + env(safe-area-inset-top, 0px));
		left: 50%;
		transform: translateX(-50%);
		z-index: 2100;
		background: var(--accent-color);
		color: #fff;
		padding: 0.6rem 0.9rem;
		border-radius: 12px;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 220px;
		max-width: min(90vw, 420px);
		animation: toast-in 0.2s ease;
	}

	.icon-wrap {
		width: 1.8em;
		height: 1.8em;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.streak-icon {
		width: 1.5em;
		height: 1.5em;
	}

	.text-wrap {
		text-align: left;
		min-width: 0;
	}

	.title {
		font-size: 0.95em;
		font-weight: 700;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
