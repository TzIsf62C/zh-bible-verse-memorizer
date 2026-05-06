<script>
	import { createEventDispatcher } from 'svelte';
	import { achievementList } from '$lib/stores/achievements';
	import { t } from '$lib/i18n';

	export let show = false;
	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	function formatDate(isoDate) {
		if (!isoDate) return '';
		const date = new Date(isoDate);
		return date.toLocaleDateString();
	}
</script>

{#if show}
	<div class="modal-overlay" on:click={close} on:keydown={(e) => e.key === 'Escape' && close()} role="dialog" aria-modal="true" tabindex="0">
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="header-row">
				<h3>{t('achievements')}</h3>
				<button class="close-btn" on:click={close} aria-label={t('close')}>×</button>
			</div>

			<div class="list">
				{#each $achievementList as achievement}
					<div class="achievement-item" class:unlocked={achievement.isUnlocked}>
						<div class="title">{t(achievement.titleKey)}</div>
						<div class="desc">{t(achievement.descriptionKey)}</div>
						{#if achievement.isUnlocked}
							<div class="meta">{t('unlocked_on')}: {formatDate(achievement.unlockedAt)}</div>
						{:else}
							<div class="meta locked">{t('locked')}</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--panel-background);
		border-radius: 12px;
		width: min(760px, 100%);
		max-height: 80vh;
		overflow: auto;
		padding: 1rem;
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	h3 {
		margin: 0;
		font-size: 1.2em;
	}

	.close-btn {
		background: transparent;
		color: var(--text-color);
		border: none;
		font-size: 1.4em;
		line-height: 1;
		padding: 0.2rem 0.5rem;
	}

	.list {
		display: grid;
		gap: 0.5rem;
	}

	.achievement-item {
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		opacity: 0.65;
	}

	.achievement-item.unlocked {
		opacity: 1;
		background: color-mix(in srgb, var(--accent-color) 12%, var(--panel-background));
	}

	.title {
		font-weight: 700;
		font-size: 0.95em;
	}

	.desc {
		font-size: 0.85em;
		margin-top: 0.2rem;
		color: var(--subtitle-color);
	}

	.meta {
		font-size: 0.8em;
		margin-top: 0.3rem;
		color: var(--subtitle-color);
	}

	.meta.locked {
		font-style: italic;
	}
</style>
