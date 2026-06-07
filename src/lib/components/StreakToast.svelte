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
				<path d="m 10.582964,7.2308973 c 0.186029,0.00683 0.371058,0.010818 0.553404,0.012768 0.182347,0.00195 0.36201,0.00186 0.537311,5.323e-4 0.1753,-0.00133 0.346237,-0.00389 0.511129,-0.0069 0.164892,-0.003 0.32374,-0.00645 0.474862,-0.00952 0.151122,-0.00308 0.294518,-0.00579 0.428507,-0.00734 0.133989,-0.00155 0.258572,-0.00194 0.372066,-3.556e-4 0.113495,0.00158 0.215901,0.00512 0.305539,0.011436 2.374504,0.1671888 5.210233,0.517645 5.210233,4.8835904 0,2.182972 -1.642878,5.270996 -2.836244,6.874012 -1.193367,1.603016 -1.937221,1.721024 -4.138618,1.728147 -2.2013973,0.0071 -2.9186303,-0.07745 -4.0986863,-1.84376 C 6.7224113,17.107198 5.079533,13.65916 5.0262898,12.115106 5.012979,11.729092 5.0577842,11.361137 5.1492961,11.012964 5.240808,10.664792 5.3790266,10.336402 5.5525427,10.02952 5.7260587,9.7226385 5.9348722,9.4372647 6.1675739,9.1751236 6.4002756,8.9129826 6.6568654,8.6740744 6.9259341,8.4601239"></path><path d="m 12.200878,8.8087363 c 0.01689,-1.4014343 0.347258,-2.8091074 1.206106,-3.705367"></path><path d="m 10.51986,8.5517145 c -0.155374,-2.716929 -2.5922777,-3.335863 -3.9973164,-3.420812 -1.405038,-0.08495 -0.9356574,1.971665 0.3272278,2.81712 1.3256439,0.887469 3.6700886,0.603692 3.6700886,0.603692 z"></path>
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
		border-radius: 10px;
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
