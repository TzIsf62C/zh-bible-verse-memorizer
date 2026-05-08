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

	function getProgressPercent(nextLevel) {
		if (!nextLevel || nextLevel.target <= 0) return 0;
		return Math.min(100, Math.round((nextLevel.current / nextLevel.target) * 100));
	}
	
	function getDescription(series) {
		const level = series.currentLevel;
		const isLocked = !level.isUnlocked;
		
		// For count-based achievements (verses, chapters, psalms, streaks)
		if (series.category === 'count' || series.category === 'streak') {
			const metricMap = {
				'verses_learned': 'verses_learned',
				'verses_mastered': 'verses_mastered',
				'chapters_learned': 'chapters_learned',
				'chapters_mastered': 'chapters_mastered',
				'psalms_learned': 'psalms_learned',
				'psalms_mastered': 'psalms_mastered',
				'streak_days': 'streak_days'
			};
			const singularMetricMap = {
				'verses_learned': 'verse_learned',
				'verses_mastered': 'verse_mastered',
				'chapters_learned': 'chapter_learned',
				'chapters_mastered': 'chapter_mastered',
				'psalms_learned': 'psalm_learned',
				'psalms_mastered': 'psalm_mastered'
			};
			const isSingular = level.target === 1 && Boolean(singularMetricMap[series.id]);
			const descKey = isSingular
				? `achievement_desc_${singularMetricMap[series.id]}`
				: `achievement_desc_${metricMap[series.id] || series.id}`;
			return t(descKey, { count: level.target });
		}
		
		// For book achievements
		if (series.category === 'book') {
			const bookName = series.currentLevel.titleVars?.book || '';
			if (isLocked) {
				const descKey = level.tier === 1 ? 'achievement_desc_locked_book_learned' : 'achievement_desc_locked_book_mastered';
				return t(descKey, { book: bookName });
			} else {
				const descKey = level.tier === 1 ? 'achievement_desc_book_learned' : 'achievement_desc_book_mastered';
				return t(descKey, { book: bookName });
			}
		}
		
		// For passage achievements
		if (series.category === 'passage') {
			if (isLocked) {
				const descKey = level.tier === 1 ? 'achievement_desc_locked_passage_learned' : 'achievement_desc_locked_passage_mastered';
				return t(descKey);
			} else {
				const descKey = level.tier === 1 ? 'achievement_desc_passage_learned' : 'achievement_desc_passage_mastered';
				return t(descKey);
			}
		}
		
		return '';
	}
	
	function getSeriesIcon(series) {
		// Return SVG icon based on series type
		if (series.id === 'verses_learned') {
			// Fruit tree
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L12 22 M8 6 Q 6 10, 8 14 M16 6 Q 18 10, 16 14"/><circle cx="8" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="8" r="2" fill="currentColor"/><circle cx="10" cy="12" r="1.5" fill="currentColor"/><circle cx="14" cy="12" r="1.5" fill="currentColor"/></svg>`;
		} else if (series.id === 'verses_mastered') {
			// Evergreen tree
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L12 22 M12 2 L 7 7 L 17 7 Z M12 6 L 6 11 L 18 11 Z M12 10 L 5 15 L 19 15 Z"/></svg>`;
		} else if (series.id === 'chapters_learned') {
			// Wave
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12 Q 5 8, 8 12 T 14 12 T 20 12 T 26 12"/><path d="M2 16 Q 5 12, 8 16 T 14 16 T 20 16 T 26 16" opacity="0.6"/></svg>`;
		} else if (series.id === 'chapters_mastered') {
			// Raindrop
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 Q 8 8, 8 14 Q 8 18, 12 18 Q 16 18, 16 14 Q 16 8, 12 2 Z"/></svg>`;
		} else if (series.id === 'psalms_learned') {
			// Mountain peak
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20 L 8 10 L 12 14 L 16 4 L 22 20 Z"/></svg>`;
		} else if (series.id === 'psalms_mastered') {
			// Harp
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18 C 4 10, 8 6, 12 5 C 16 6, 20 10, 20 18"/><line x1="8" y1="18" x2="8" y2="10"/><line x1="12" y1="18" x2="12" y2="8"/><line x1="16" y1="18" x2="16" y2="10"/></svg>`;
		} else if (series.id === 'streak_days') {
			// Up-right arrow
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19 L 19 5 M 19 5 L 19 15 M 19 5 L 9 5"/></svg>`;
		} else if (series.category === 'book') {
			// Closed book
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4 L 4 20 L 20 20 L 20 4 Z M 12 4 L 12 20"/></svg>`;
		} else if (series.category === 'passage') {
			// Quill pen
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 3 20 L 8 15 M 8 15 Q 10 13, 14 8 L 20 3 L 21 4 L 16 10 Q 11 14, 9 16 Z"/></svg>`;
		}
		return '';
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
						<div class="achievement-header">
							<div class="icon-container" class:unlocked={series.currentLevel.isUnlocked}>
								{@html getSeriesIcon(series)}
							</div>
							<div class="achievement-content">
								<div class="title">{t(series.currentLevel.titleKey, series.currentLevel.titleVars || {})}</div>
								<div class="description">{getDescription(series)}</div>
							</div>
						</div>
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
	
	.achievement-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	
	.icon-container {
		flex-shrink: 0;
		width: 2.5em;
		height: 2.5em;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--file-bg);
		border: 2px solid var(--file-border);
		color: var(--subtitle-color);
	}
	
	.icon-container.unlocked {
		background: color-mix(in srgb, var(--accent-color) 20%, transparent);
		border-color: var(--accent-color);
		color: var(--accent-color);
	}
	
	.icon-container :global(svg) {
		width: 1.5em;
		height: 1.5em;
	}
	
	.achievement-content {
		flex: 1;
		min-width: 0;
	}

	.title {
		font-weight: 700;
		font-size: 0.95em;
		margin-bottom: 0.15rem;
	}
	
	.description {
		font-size: 0.8em;
		color: var(--subtitle-color);
		line-height: 1.3;
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
