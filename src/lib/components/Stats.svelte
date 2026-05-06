<script>
	import { createEventDispatcher } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';
	import AchievementsModal from '$lib/components/AchievementsModal.svelte';

	const dispatch = createEventDispatcher();
	let showAchievementsModal = false;

	// Calculate mastery categories
	$: masteryData = calculateMasteryData($verses);

	function calculateMasteryData(allVerses) {
		// Only count verses that have been reviewed (have lastReviewed date)
		const reviewedVerses = allVerses.filter(v => v.lastReviewed);
		const total = reviewedVerses.length;

		if (total === 0) {
			return {
				newLearning: 0,
				developing: 0,
				solid: 0,
				mastered: 0,
				total: 0,
				max: 0
			};
		}

		let newLearning = 0;
		let developing = 0;
		let solid = 0;
		let mastered = 0;

		reviewedVerses.forEach(v => {
			const interval = v.interval || 0;
			if (interval < 7) {
				newLearning++;
			} else if (interval >= 7 && interval <= 24) {
				developing++;
			} else if (interval >= 25 && interval <= 48) {
				solid++;
			} else {
				mastered++;
			}
		});

		// Calculate max for bar width calculation
		const max = Math.max(newLearning, developing, solid, mastered);

		return {
			newLearning,
			developing,
			solid,
			mastered,
			total,
			max
		};
	}

	function showHeatMaps() {
		dispatch('navigate-heat-maps');
	}

	function showAchievements() {
		showAchievementsModal = true;
	}

	function exitStats() {
		dispatch('exit');
	}
</script>

<!-- Mastery Bars View -->
<div class="stats-container">
	<div class="stats-header">
		<h2 class="stats-title">{t('stats')}</h2>
	</div>

	{#if masteryData.total === 0}
		<div class="empty-state">
			<p>{t('no_reviewed_verses')}</p>
		</div>
	{:else}
		<div class="mastery-bars">
			<!-- New/Learning -->
			<div class="mastery-category">
				<div class="category-label">{t('new_learning')}</div>
				<div class="bar-container">
					<div 
						class="bar bar-new" 
						style="width: {masteryData.max > 0 ? (masteryData.newLearning / masteryData.max) * 100 : 0}%"
					>
						<span class="bar-count">{masteryData.newLearning}</span>
					</div>
				</div>
			</div>

			<!-- Developing -->
			<div class="mastery-category">
				<div class="category-label">{t('developing')}</div>
				<div class="bar-container">
					<div 
						class="bar bar-developing" 
						style="width: {masteryData.max > 0 ? (masteryData.developing / masteryData.max) * 100 : 0}%"
					>
						<span class="bar-count">{masteryData.developing}</span>
					</div>
				</div>
			</div>

			<!-- Solid -->
			<div class="mastery-category">
				<div class="category-label">{t('solid')}</div>
				<div class="bar-container">
					<div 
						class="bar bar-solid" 
						style="width: {masteryData.max > 0 ? (masteryData.solid / masteryData.max) * 100 : 0}%"
					>
						<span class="bar-count">{masteryData.solid}</span>
					</div>
				</div>
			</div>

			<!-- Mastered -->
			<div class="mastery-category">
				<div class="category-label">{t('mastered')}</div>
				<div class="bar-container">
					<div 
						class="bar bar-mastered" 
						style="width: {masteryData.max > 0 ? (masteryData.mastered / masteryData.max) * 100 : 0}%"
					>
						<span class="bar-count">{masteryData.mastered}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="stats-actions">
			<button type="button" class="heat-maps-button" on:click={showHeatMaps} aria-label={t('heat_maps')}>
				<svg
					class="flame-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 2c-2 3.5-4 6-4 9 0 3 2 5 4 5s4-2 4-5c0-3-2-5.5-4-9z"/>
					<path d="M12 7c-1 2-2 3-2 5 0 1.5 1 2.5 2 2.5s2-1 2-2.5c0-2-1-3-2-5z"/>
				</svg>
				<span class="heat-maps-label">{t('heat_maps')}</span>
			</button>

			<button type="button" class="achievements-button" on:click={showAchievements} aria-label={t('achievements')}>
				<span>{t('achievements')}</span>
			</button>
		</div>
	{/if}
</div>

<AchievementsModal show={showAchievementsModal} on:close={() => (showAchievementsModal = false)} />

<style>
	.stats-container {
		width: 100%;
		padding: 1rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.stats-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.stats-title {
		font-size: 1.75em;
		font-weight: 700;
		color: var(--text-color);
		margin: 0;
		flex: 1;
		text-align: center;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}

	/* Mastery Bars View */
	.mastery-bars {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.mastery-category {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-label {
		font-size: 1em;
		font-weight: 600;
		color: var(--text-color);
	}

	.bar-container {
		background: var(--panel-background);
		border-radius: 8px;
		height: 2rem;
		position: relative;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: width 0.3s ease;
		min-width: 3rem;
	}

	.bar-count {
		font-size: 1em;
		font-weight: 700;
		color: #ffffff;
	}

	.bar-new {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.bar-developing {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}

	.bar-solid {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}

	.bar-mastered {
		background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	}

	.stats-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.heat-maps-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 1rem;
		background: var(--accent-color);
		color: #ffffff;
		border: none;
		border-radius: 12px;
		font-size: 1.1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.heat-maps-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.flame-icon {
		width: 24px;
		height: 24px;
	}

	.heat-maps-label {
		font-size: 1em;
	}

	.achievements-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 1rem;
		background: var(--panel-background);
		color: var(--text-color);
		border: 1px solid var(--file-border);
		border-radius: 12px;
		font-size: 1.1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.achievements-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	@media (max-width: 767px) {
		.stats-container {
			padding: 0.5rem;
		}

		.stats-title {
			font-size: 1.5em;
		}
	}
</style>
