<script>
	import { createEventDispatcher } from 'svelte';
	import { achievementPanelSeries } from '$lib/stores/achievements';
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

	function getSeriesTitle(series) {
		if (series.category === 'book') return t('achievement_series_book');
		if (series.category === 'passage') return t('achievement_series_passage');
		return t(`achievement_series_${series.id}`);
	}

	function getProgressPercent(nextLevel) {
		if (!nextLevel || nextLevel.target <= 0) return 0;
		return Math.min(100, Math.round((nextLevel.current / nextLevel.target) * 100));
	}
</script>

{#if show}
	<div class="modal-overlay" on:click={close} on:keydown={(e) => e.key === 'Escape' && close()} role="dialog" aria-modal="true" tabindex="0">
		<div class="modal-content" on:click|stopPropagation>
			<div class="header-row">
				<h3>{t('achievements')}</h3>
				<button class="close-btn" on:click={close} aria-label={t('close')}>×</button>
			</div>

			<div class="list">
				{#each $achievementPanelSeries as series}
					<div class="achievement-item" class:unlocked={series.currentLevel.isUnlocked}>
						<div class="series">{getSeriesTitle(series)}</div>
						<div class="title">{t(series.currentLevel.titleKey, series.currentLevel.titleVars || {})}</div>
						{#if series.currentLevel.isUnlocked}
							<div class="meta">{t('unlocked_on')}: {formatDate(series.currentLevel.unlockedAt)}</div>
						{:else}
							<div class="meta locked">{t('locked')}</div>
						{/if}

						{#if series.nextLevel}
							<div class="progress-wrap">
								<div class="progress-label">
									{t('achievement_progress_to_next')}: {series.nextLevel.current}/{series.nextLevel.target}
								</div>
								<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={getProgressPercent(series.nextLevel)}>
									<div class="progress-fill" style={`width: ${getProgressPercent(series.nextLevel)}%`}></div>
								</div>
							</div>
						{:else}
							<div class="meta">{t('achievement_progress_complete')}</div>
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

	.series {
		font-size: 0.78em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--subtitle-color);
		margin-bottom: 0.2rem;
	}

	.meta {
		font-size: 0.8em;
		margin-top: 0.3rem;
		color: var(--subtitle-color);
	}

	.meta.locked {
		font-style: italic;
	}

	.progress-wrap {
		margin-top: 0.4rem;
	}

	.progress-label {
		font-size: 0.78em;
		color: var(--subtitle-color);
		margin-bottom: 0.2rem;
	}

	.progress-track {
		height: 0.35rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--subtitle-color) 25%, transparent);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent-color);
	}
</style>
