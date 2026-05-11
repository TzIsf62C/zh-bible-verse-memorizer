<script>
	import { onDestroy } from 'svelte';
	import { achievementPopupQueue, dequeueAchievementPopup } from '$lib/stores/achievements';
	import { t } from '$lib/i18n';

	let currentPopup = null;
	let hideTimer = null;
	let retryTimer = null;
	let isAdvancing = false;

	const unsubscribe = achievementPopupQueue.subscribe((items) => {
		if (!currentPopup && !isAdvancing && items.length > 0) {
			showNext();
		}
	});

	function showNext() {
		if (isAdvancing) {
			return;
		}

		if (hasOpenModal()) {
			scheduleRetry();
			return;
		}

		isAdvancing = true;
		const next = dequeueAchievementPopup();
		if (!next) {
			currentPopup = null;
			isAdvancing = false;
			return;
		}

		currentPopup = next;
		isAdvancing = false;
		if (hideTimer) {
			clearTimeout(hideTimer);
		}
		hideTimer = setTimeout(() => {
			currentPopup = null;
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

{#if currentPopup}
	<div class="achievement-toast" role="status" aria-live="polite">
		<div class="icon-wrap" aria-hidden="true">
			<svg
				class="trophy-icon"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M 8.050513 7.7785995 V 3.7785995 H 16.050513 V 7.7785995"></path>
    			<path d="M8 5.8 C 6.6666667 6.4666667, 4 5.466667, 4 6.8 C 4 8.133333, 10.637994 13.119525, 8.1667604 15.8"></path>
    			<path d="M8.0778901 8.8051269 C 8.0778901 10.805127, 10 17, 12 17 C 14 17, 15.92211 10.571358, 15.92211 8.5713581"></path>
   				<path d="M12 17 V 21 M 9 21 H15"></path>
    			<path d="M15.898974 5.799835 C 17.232307 6.4665017, 19.898974 5.466667, 19.898974 6.8 C 19.898974 8.133333, 13.26098 13.119525, 15.732214 15.8"></path>
			</svg>
		</div>
		<div class="text-wrap">
			<div class="title">{t('achievement_unlocked')}</div>
			<div class="name">{t(currentPopup.titleKey, currentPopup.titleVars || {})}</div>
		</div>
	</div>
{/if}

<style>
	.achievement-toast {
		position: fixed;
		top: calc(4.5rem + env(safe-area-inset-top, 0px));
		left: 50%;
		transform: translateX(-50%);
		z-index: 950;
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

	.trophy-icon {
		width: 1.5em;
		height: 1.5em;
	}

	.text-wrap {
		text-align: left;
		min-width: 0;
	}

	.title {
		font-size: 0.8em;
		opacity: 0.85;
	}

	.name {
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
