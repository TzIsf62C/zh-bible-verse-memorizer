<script>
	import { onDestroy } from 'svelte';
	import { achievementPopupQueue, dequeueAchievementPopup } from '$lib/stores/achievements';
	import { t } from '$lib/i18n';

	let currentPopup = null;
	let hideTimer = null;

	const unsubscribe = achievementPopupQueue.subscribe(() => {
		if (!currentPopup) {
			showNext();
		}
	});

	function showNext() {
		const next = dequeueAchievementPopup();
		if (!next) {
			currentPopup = null;
			return;
		}

		currentPopup = next;
		if (hideTimer) {
			clearTimeout(hideTimer);
		}
		hideTimer = setTimeout(() => {
			currentPopup = null;
			showNext();
		}, 3000);
	}

	onDestroy(() => {
		unsubscribe();
		if (hideTimer) clearTimeout(hideTimer);
	});
</script>

{#if currentPopup}
	<div class="achievement-toast" role="status" aria-live="polite">
		<div class="title">{t('achievement_unlocked')}</div>
		<div class="name">{t(currentPopup.titleKey)}</div>
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
		padding: 0.6rem 1rem;
		border-radius: 10px;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
		text-align: center;
		min-width: 220px;
		max-width: min(90vw, 420px);
		animation: toast-in 0.2s ease;
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
