<script>
	import { createEventDispatcher } from 'svelte';
	import { verses } from '$lib/stores/verses';
	import { progressTrackingState } from '$lib/stores/progressHistory.js';
	import { streakData, setCurrentStreakDays } from '$lib/stores/streak.js';
	import {
		createEmptyProgress,
		getEffectiveInterval,
		getMasteryCategory,
		getProgressMax,
		getProgressTotal
	} from '$lib/utils/masteryProgress.js';
	import { computeCategoryChangeStats } from '$lib/utils/categoryHistory.js';
	import { computeNewStarts, getNewStartVerses } from '$lib/utils/learnedDate.js';
	import { t } from '$lib/i18n';
	import AchievementsModal from '$lib/components/AchievementsModal.svelte';

	const GRAPH_WIDTH = 920;
	const GRAPH_HEIGHT = 640;
	const GRAPH_PADDING = 52;

	const CATEGORY_META = [
		{ key: 'newLearning', labelKey: 'new_learning', className: 'bar-new', fill: '#f5576c' },
		{ key: 'developing', labelKey: 'developing', className: 'bar-developing', fill: '#00b5ff' },
		{ key: 'solid', labelKey: 'solid', className: 'bar-solid', fill: '#29cc97' },
		{ key: 'mastered', labelKey: 'mastered', className: 'bar-mastered', fill: '#f8ae2f' }
	];

	const CATEGORY_INTERVAL_LABEL_KEYS = {
		newLearning: 'stats_interval_range_new_learning',
		developing: 'stats_interval_range_developing',
		solid: 'stats_interval_range_solid',
		mastered: 'stats_interval_range_mastered'
	};
	const CATEGORY_ORDER = ['newLearning', 'developing', 'solid', 'mastered'];

	const dispatch = createEventDispatcher();
	let showAchievementsModal = false;
	let viewMode = 'totals';
	let timelineRange = 'all'; // 'all' | '30' | '7'
	let showCategoryModal = false;
	let selectedCategory = null;
	let showChangeModal = false;
	let selectedChangeCategory = null;
	let selectedChangeDirection = null;
	let showStreakModal = false;
	let isEditingStreak = false;
	let showNewStartsModal = false;

	$: trackingState = $progressTrackingState || {};
	$: currentProgress = trackingState.currentProgress || createEmptyProgress();
	$: progressHistory = Array.isArray(trackingState.progressHistory) ? trackingState.progressHistory : [];
	$: masteryData = {
		...currentProgress,
		total: getProgressTotal(currentProgress),
		max: getProgressMax(currentProgress)
	};
	$: activeMax = Math.max(
		masteryData.newLearning || 0,
		masteryData.developing || 0,
		masteryData.solid || 0,
		1
	);
	$: masteredScaled = scaleMasteredCappedLog(masteryData.mastered || 0);
	$: globalMax = Math.max(masteredScaled, activeMax, 1);
	$: graphData = buildGraphData(progressHistory, timelineRange);
	$: changeStats = buildChangeStats(timelineRange);
	$: selectedCategoryMeta = CATEGORY_META.find((category) => category.key === selectedCategory) || null;
	$: selectedCategoryVerses = getCategoryVerses(selectedCategory);
	$: selectedChangeCategoryMeta = CATEGORY_META.find((category) => category.key === selectedChangeCategory) || null;
	$: selectedChangeEvents = getChangeEvents(selectedChangeCategory, selectedChangeDirection);
	$: newStartsCount = computeNewStartsForRange(timelineRange);
	$: newStartVerses = getNewStartVersesForRange(timelineRange);
	$: currentStreakDays = Math.max(0, Number($streakData?.current || 0));
	$: streakDaysLabel = `${currentStreakDays} ${capitalizeLabel(currentStreakDays === 1 ? t('day') : t('days'))}`;
	$: hasExtendedStreakToday = hasStreakExtendedToday($streakData?.lastActiveDate);
	$: dueVerseCount = getDueVerseCount();
	$: streakStatusMessage = getStreakStatusMessage(hasExtendedStreakToday, dueVerseCount);

	function capitalizeLabel(value) {
		if (!value || typeof value !== 'string') return '';
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	function showHeatMaps() {
		dispatch('navigate-heat-maps');
	}

	function showAchievements() {
		showAchievementsModal = true;
	}

	function openStreakModal() {
		showStreakModal = true;
		isEditingStreak = false;
	}

	function closeStreakModal() {
		showStreakModal = false;
		isEditingStreak = false;
	}

	function incrementStreak() {
		setCurrentStreakDays(currentStreakDays + 1);
	}

	function decrementStreak() {
		setCurrentStreakDays(Math.max(0, currentStreakDays - 1));
	}

	function toggleStreakEdit() {
		isEditingStreak = !isEditingStreak;
	}

	function toDateKey(date = new Date()) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function hasStreakExtendedToday(lastActiveDate) {
		if (!lastActiveDate || typeof lastActiveDate !== 'string') return false;
		return lastActiveDate === toDateKey(new Date());
	}

	function getDueVerseCount() {
		const verseList = Array.isArray($verses) ? $verses : [];
		const now = new Date();

		return verseList.filter((verse) => {
			if (!verse?.lastReviewed) return false;
			if (!verse?.dueDate) return true;
			return new Date(verse.dueDate) <= now;
		}).length;
	}

	function getStreakStatusMessage(extendedToday, dueCount) {
		if (extendedToday) {
			return t('streak_status_extended_today');
		}

		if (dueCount > 0) {
			return t('streak_status_due_verses');
		}

		return t('streak_status_no_due_options');
	}

	function showTotalsView() {
		viewMode = 'totals';
	}

	function showTimelineView() {
		viewMode = 'timeline';
	}

	function setTimelineRange(range) {
		timelineRange = range;
	}

	function exitStats() {
		dispatch('exit');
	}

	function openCategoryModal(categoryKey) {
		selectedCategory = categoryKey;
		showCategoryModal = true;
	}

	function closeCategoryModal() {
		showCategoryModal = false;
		selectedCategory = null;
	}

	function closeChangeModal() {
		showChangeModal = false;
		selectedChangeCategory = null;
		selectedChangeDirection = null;
	}

	function openChangeModal(categoryKey, direction) {
		selectedChangeCategory = categoryKey;
		selectedChangeDirection = direction;
		showChangeModal = true;
	}

	function computeNewStartsForRange(range) {
		const rangeStart = getTimelineRangeStart(range);
		if (!rangeStart) return 0;
		return computeNewStarts($verses, rangeStart, new Date());
	}

	function getNewStartVersesForRange(range) {
		const rangeStart = getTimelineRangeStart(range);
		if (!rangeStart) return [];
		return getNewStartVerses($verses, rangeStart, new Date());
	}

	function openNewStartsModal() {
		showNewStartsModal = true;
	}

	function closeNewStartsModal() {
		showNewStartsModal = false;
	}

	function getTimelineRangeStart(range) {
		if (range === 'all') return null;
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		start.setDate(start.getDate() - (range === '7' ? 6 : 29));
		return start;
	}

	function buildChangeStats(range) {
		const rangeStart = getTimelineRangeStart(range);
		if (!rangeStart) return {};
		return computeCategoryChangeStats($verses, rangeStart, new Date());
	}

	function getChangeEvents(categoryKey, direction) {
		if (!categoryKey || !direction) return [];
		const events = changeStats?.[categoryKey]?.[direction] || [];
		const verseList = Array.isArray($verses) ? $verses : [];
		return events
			.map((event) => ({
				event,
				verse: verseList.find((verse) => verse.id === event.verseId)
			}))
			.filter((item) => item.verse)
			.sort((a, b) => {
				const bookCmp = String(a.verse.bookName || '').localeCompare(String(b.verse.bookName || ''), 'zh');
				if (bookCmp !== 0) return bookCmp;
				const chapterCmp = Number(a.verse.chapterNumber || 0) - Number(b.verse.chapterNumber || 0);
				if (chapterCmp !== 0) return chapterCmp;
				return Number(a.verse.verseNumber || 0) - Number(b.verse.verseNumber || 0);
			});
	}

	function getCategoryMovement(event) {
		if (!event?.from || !event?.to) return null;
		return CATEGORY_ORDER.indexOf(event.to) > CATEGORY_ORDER.indexOf(event.from) ? 'up' : 'down';
	}

	function getChangeAnnotation(event, direction) {
		if (direction === 'gained' && event?.from === null) {
			return { icon: '+', labelKey: 'stats_new_verse', className: 'change-annotation-new' };
		}
		const movement = getCategoryMovement(event);
		if (!movement) return null;
		return {
			icon: movement === 'up' ? '↑' : '↓',
			labelKey: direction === 'lost'
				? CATEGORY_META.find((category) => category.key === event.to)?.labelKey
				: CATEGORY_META.find((category) => category.key === event.from)?.labelKey,
			className: movement === 'up' ? 'change-annotation-up' : 'change-annotation-down'
		};
	}

	function getChangeScale() {
		const values = CATEGORY_META.flatMap((category) => [
			Number(changeStats?.[category.key]?.gained?.length || 0),
			Number(changeStats?.[category.key]?.lost?.length || 0)
		]);
		return Math.max(...values, 1);
	}

	function getCategoryVerses(categoryKey) {
		if (!categoryKey) return [];
		const verseList = Array.isArray($verses) ? $verses : [];
		return verseList
			.filter((verse) => Boolean(verse?.lastReviewed))
			.filter((verse) => {
				const effectiveInterval = getEffectiveInterval(verse.interval, verse.dueDate, new Date());
				return getMasteryCategory(effectiveInterval) === categoryKey;
			})
			.sort((a, b) => {
				const bookCmp = String(a.bookName || '').localeCompare(String(b.bookName || ''), 'zh');
				if (bookCmp !== 0) return bookCmp;
				const chapterCmp = Number(a.chapterNumber || 0) - Number(b.chapterNumber || 0);
				if (chapterCmp !== 0) return chapterCmp;
				return Number(a.verseNumber || 0) - Number(b.verseNumber || 0);
			});
	}

	function formatVerseReference(verse) {
		if (!verse) return '';
		return `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
	}

	function getCategoryIntervalLabel(categoryKey) {
		const key = CATEGORY_INTERVAL_LABEL_KEYS[categoryKey];
		return key ? t(key) : '';
	}

	/**
	 * Scales the mastered count with a capped log curve so the bar
	 * saturates visually once the user accumulates many mastered verses.
	 *
	 * @param {number} count
	 * @param {number} [a=0.15]
	 * @param {number} [cap=1.12]
	 * @param {number} [targetMax=40]
	 * @returns {number}
	 */
	function scaleMasteredCappedLog(count, a = 0.15, cap = 1.12, targetMax = 40) {
		const value = Number(count) || 0;
		if (value <= 0) return 0;
		return Math.min(targetMax, targetMax * (Math.log10(1 + a * value) / cap));
	}

	function getPleasantStep(maxValue) {
		const pleasantBases = [1, 2, 5, 10, 20, 25, 50];
		const rawStep = Math.max(1, Number(maxValue || 0) / 4);
		if (rawStep <= 1) return 1;

		const exponent = Math.floor(Math.log10(rawStep));
		for (let exp = exponent - 1; exp <= exponent + 6; exp += 1) {
			const power = 10 ** exp;
			for (const base of pleasantBases) {
				const candidate = base * power;
				if (candidate >= rawStep) {
					return candidate;
				}
			}
		}

		return rawStep;
	}

	function parseDate(dateString) {
		if (!dateString) return null;
		const parsed = new Date(dateString);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	function toPointTime(entry) {
		if (entry.kind === 'week' && entry.weekEnd) {
			const weekEnd = parseDate(`${entry.weekEnd}T00:00:00`);
			if (weekEnd) return weekEnd.getTime();
		}
		const date = parseDate(`${entry.date}T00:00:00`);
		if (date) return date.getTime();
		const updated = parseDate(entry.updatedAt);
		return updated ? updated.getTime() : 0;
	}

	function formatTimelineLabel(entry) {
		if (entry.kind === 'week' && entry.weekStart && entry.weekEnd) {
			return `${entry.weekStart} - ${entry.weekEnd}`;
		}
		return entry.date;
	}

	function formatAllTimeStartLabel(entry) {
		if (entry.kind === 'week' && entry.weekEnd) {
			return entry.weekEnd;
		}
		return formatTimelineLabel(entry);
	}

	function formatDateLabel(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function buildGraphData(history, range = 'all') {
		if (!Array.isArray(history) || history.length === 0) {
			return {
				points: [],
				maxTotal: 1,
				areas: {},
				firstLabel: '',
				lastLabel: t('today_short'),
				yTicks: []
			};
		}

		const now = new Date();
		now.setHours(0, 0, 0, 0);
		let rangeStart = null;
		if (range === '30') {
			rangeStart = new Date(now);
			rangeStart.setDate(now.getDate() - 29);
		} else if (range === '7') {
			rangeStart = new Date(now);
			rangeStart.setDate(now.getDate() - 6);
		}

		const sorted = [...history]
			.filter((entry) => {
				if (!rangeStart) return true;
				const entryTime = toPointTime(entry);
				return entryTime >= rangeStart.getTime();
			})
			.sort((a, b) => toPointTime(a) - toPointTime(b));

		if (sorted.length === 0) {
			return {
				points: [],
				maxTotal: 1,
				areas: {},
				firstLabel: '',
				lastLabel: t('today_short'),
				yTicks: []
			};
		}

		const maxTotal = Math.max(
			...sorted.map((entry) =>
				Number(entry.newLearning || 0) +
				Number(entry.developing || 0) +
				Number(entry.solid || 0) +
				Number(entry.mastered || 0)
			),
			1
		);
		const yStep = getPleasantStep(maxTotal);
		const maxAxis = yStep * 4;

		const chartWidth = GRAPH_WIDTH - GRAPH_PADDING * 2;
		const chartHeight = GRAPH_HEIGHT - GRAPH_PADDING * 2;
		const step = sorted.length > 1 ? chartWidth / (sorted.length - 1) : 0;
		const minTime = toPointTime(sorted[0]);
		const maxTime = toPointTime(sorted[sorted.length - 1]);
		const timeSpan = Math.max(maxTime - minTime, 1);

		const points = sorted.map((entry, index) => {
			const newLearning = Number(entry.newLearning || 0);
			const developing = Number(entry.developing || 0);
			const solid = Number(entry.solid || 0);
			const mastered = Number(entry.mastered || 0);
			return {
				x: sorted.length > 1
					? (range === 'all'
						? GRAPH_PADDING + ((toPointTime(entry) - minTime) / timeSpan) * chartWidth
						: GRAPH_PADDING + index * step)
					: GRAPH_PADDING + chartWidth / 2,
				baseline: 0,
				newLearning,
				developing,
				solid,
				mastered,
				newLearningTop: newLearning,
				developingTop: newLearning + developing,
				solidTop: newLearning + developing + solid,
				masteredTop: newLearning + developing + solid + mastered
			};
		});

		const toY = (value) => GRAPH_HEIGHT - GRAPH_PADDING - (Number(value) / maxAxis) * chartHeight;
		const yTicks = Array.from({ length: 5 }, (_, index) => {
			const ratio = index / 4;
			const value = Math.round(maxAxis * (1 - ratio));
			return {
				value,
				axisRatio: (GRAPH_PADDING + ratio * chartHeight) / GRAPH_HEIGHT,
				anchorClass: index === 0 ? 'top' : index === 4 ? 'bottom' : 'middle',
				y: GRAPH_PADDING + ratio * chartHeight
			};
		});

		const buildAreaPath = (upperKey, lowerKey) => {
			if (points.length === 0) return '';

			const upperPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${toY(point[upperKey])}`);
			const lowerPath = [...points]
				.reverse()
				.map((point) => `L ${point.x} ${toY(point[lowerKey])}`);

			return `${upperPath.join(' ')} ${lowerPath.join(' ')} Z`;
		};

		return {
			points,
			maxTotal,
			maxAxis,
			yStep,
			yTicks,
			areas: {
				newLearning: buildAreaPath('newLearningTop', 'baseline'),
				developing: buildAreaPath('developingTop', 'newLearningTop'),
				solid: buildAreaPath('solidTop', 'developingTop'),
				mastered: buildAreaPath('masteredTop', 'solidTop')
			},
			firstLabel: range === 'all' ? formatAllTimeStartLabel(sorted[0]) : formatDateLabel(rangeStart || now),
			lastLabel: t('today_short')
		};
	}
</script>

<div class="stats-container">
	<div class="stats-header">
		<h2 class="stats-title">{t('stats')}</h2>
	</div>

	<div class="view-toggle" role="tablist" aria-label={t('stats_progress_view')}>
		<button
			type="button"
			class="toggle-option"
			class:active={viewMode === 'totals'}
			on:click={showTotalsView}
			role="tab"
			aria-selected={viewMode === 'totals'}
		>
			{t('stats_current_totals')}
		</button>
		<button
			type="button"
			class="toggle-option"
			class:active={viewMode === 'timeline'}
			on:click={showTimelineView}
			role="tab"
			aria-selected={viewMode === 'timeline'}
		>
			{t('stats_progress_timeline')}
		</button>
	</div>

	{#if masteryData.total === 0}
		<div class="empty-state">
			<p>{t('no_reviewed_verses')}</p>
		</div>
	{:else if viewMode === 'totals'}
		<div class="mastery-bars">
			{#each CATEGORY_META as category}
				{@const raw = masteryData[category.key] ?? 0}
				{@const isMastered = category.key === 'mastered'}
				{@const valueForScale = isMastered ? masteredScaled : raw}
				{@const percent = globalMax > 0 ? (valueForScale / globalMax) * 100 : 0}

				<div class="mastery-category">
					<div class="category-label">{t(category.labelKey)}</div>
					<div class="bar-container">
						<button
							type="button"
							class={`bar ${category.className}`}
							style="width: {percent}%"
							on:click={() => openCategoryModal(category.key)}
							aria-label={`${t(category.labelKey)} ${raw}`}
						>
							<span class="bar-count">{raw}</span>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="timeline-panel">
			{#if timelineRange === 'all'}
			{#if graphData.points.length === 0}
				<div class="empty-state">
					<p>{t('stats_progress_empty')}</p>
				</div>
			{:else}
				<div class="timeline-legend">
					{#each CATEGORY_META as category}
						<div class="legend-item">
							<span class="legend-dot" style="background: {category.fill};"></span>
							<span>{t(category.labelKey)}</span>
						</div>
					{/each}
				</div>

				<div class="timeline-chart-area">
					<div class="timeline-y-axis" aria-hidden="true">
						{#each graphData.yTicks as tick}
							<span class={`timeline-y-axis-label ${tick.anchorClass}`} style={`top: ${tick.axisRatio * 100}%`}>{tick.value}</span>
						{/each}
					</div>

					<div class="timeline-chart-wrap">
						<svg
							class="timeline-chart"
							viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
							role="img"
							aria-label={t('stats_progress_timeline')}
						>
							<rect x={GRAPH_PADDING} y={GRAPH_PADDING} width={GRAPH_WIDTH - GRAPH_PADDING * 2} height={GRAPH_HEIGHT - GRAPH_PADDING * 2} class="chart-bg"></rect>
							{#each graphData.yTicks as tick}
								<line x1={GRAPH_PADDING} y1={tick.y} x2={GRAPH_WIDTH - GRAPH_PADDING} y2={tick.y} class="chart-grid-line"></line>
							{/each}
							<path d={graphData.areas.newLearning} class="area-new"></path>
							<path d={graphData.areas.developing} class="area-developing"></path>
							<path d={graphData.areas.solid} class="area-solid"></path>
							<path d={graphData.areas.mastered} class="area-mastered"></path>
						</svg>
					</div>
				</div>

				<div class="timeline-labels">
					<span>{graphData.firstLabel}</span>
					<span>{graphData.lastLabel}</span>
				</div>
					<div class="timeline-range-controls" role="tablist" aria-label={t('stats_timeline_range')}>
					<button class="range-btn" class:active={timelineRange === 'all'} on:click={() => setTimelineRange('all')}>{t('stats_all_time')}</button>
					<button class="range-btn" class:active={timelineRange === '30'} on:click={() => setTimelineRange('30')}>{t('stats_last_30_days')}</button>
					<button class="range-btn" class:active={timelineRange === '7'} on:click={() => setTimelineRange('7')}>{t('stats_last_7_days')}</button>
				</div>
			{/if}
			{:else}
				<div class="timeline-legend">
					{#each CATEGORY_META as category}
						<div class="legend-item">
							<span class="legend-dot" style="background: {category.fill};"></span>
							<span>{t(category.labelKey)}</span>
						</div>
					{/each}
				</div>
				<div class="change-chart-layout">
					<div class="change-chart-header">
						<div class="change-header-track">
							<span>{t('stats_lost')}</span>
							<span>{t('stats_gained')}</span>
						</div>
						<span class="change-net-header">{t('stats_net_change')}</span>
					</div>
					<div class="change-chart">
						{#each [...CATEGORY_META].reverse() as category}
							{@const gained = changeStats?.[category.key]?.gained?.length || 0}
							{@const lost = changeStats?.[category.key]?.lost?.length || 0}
							<div class="change-row">
								<div class="change-track">
								<div class="change-zero-line"></div>
								<button
									type="button"
									class="change-bar change-bar-lost"
									style={`width: ${(lost / getChangeScale()) * 50}%; background: color-mix(in srgb, ${category.fill} 42%, transparent);`}
									on:click={() => openChangeModal(category.key, 'lost')}
									disabled={lost === 0}
									aria-label={`${t('stats_lost')} ${t(category.labelKey)} ${lost}`}
								>
									{#if lost > 0}{lost}{/if}
								</button>
								<button
									type="button"
									class="change-bar change-bar-gained"
									style={`width: ${(gained / getChangeScale()) * 50}%; background: ${category.fill};`}
									on:click={() => openChangeModal(category.key, 'gained')}
									disabled={gained === 0}
									aria-label={`${t('stats_gained')} ${t(category.labelKey)} ${gained}`}
								>
									{#if gained > 0}{gained}{/if}
								</button>
								</div>
								<div class="change-net">{changeStats?.[category.key]?.net > 0 ? '+' : ''}{changeStats?.[category.key]?.net || 0}</div>
							</div>
						{/each}
						</div>
				</div>
				<button
					type="button"
					class="new-starts-row"
					on:click={openNewStartsModal}
					disabled={newStartsCount === 0}
					aria-label={`${t('stats_new_starts')} ${newStartsCount}`}
				>
					<span class="new-starts-dot" aria-hidden="true"></span>
					<span class="new-starts-label">{t('stats_new_starts')}</span>
					<span class="new-starts-count">+ {newStartsCount}</span>
				</button>
				<div class="timeline-range-controls" role="tablist" aria-label={t('stats_timeline_range')}>
					<button class="range-btn" class:active={timelineRange === 'all'} on:click={() => setTimelineRange('all')}>{t('stats_all_time')}</button>
					<button class="range-btn" class:active={timelineRange === '30'} on:click={() => setTimelineRange('30')}>{t('stats_last_30_days')}</button>
					<button class="range-btn" class:active={timelineRange === '7'} on:click={() => setTimelineRange('7')}>{t('stats_last_7_days')}</button>
				</div>
			{/if}
		</div>
	{/if}

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
				<path d="M13.2999951 3.8000854 C 12.7999951 4.6750854, 13.2316851 7.2173135, 11.1689951 7.8730854 C 10.4033891 7.6411752, 9.4752731 6.3183354, 9.0502171 7.2870854 C 8.2001102 9.22474, 7.2056998 13.699845, 7.2056998 15.199845 C 7.2056998 18.199845, 10.0004451 20.199845, 12.0004451 20.199845 C 14.0004451 20.199845, 16.7943011 18.199845, 16.7943011 15.199845 C 16.7943011 12.199845, 16.2200361 7.037218, 13.3001441 3.8000854 Z"></path>
    <path d="M12.0004451 10.6000379 C 13.4434481 12.0818086, 14.0004451 13.6000379, 14.0004451 15.600038 C 14.0004451 17.100038, 13.0004451 20.100038, 12.0004451 20.100038 C 11.0004451 20.100038, 10.0004451 17.100038, 10.0004451 15.600038 C 10.0004451 13.6000379, 12.3442961 13.1196429, 12.0004451 10.6000379 Z"></path>
			</svg>
			<span class="heat-maps-label">{t('heat_maps')}</span>
		</button>

		<button type="button" class="streaks-button" on:click={openStreakModal} aria-label={t('achievement_series_streak_days')}>
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
			<span class="streak-days-label">{streakDaysLabel}</span>
		</button>

		<button type="button" class="achievements-button" on:click={showAchievements} aria-label={t('achievements')}>
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
			<span class="achievements-label">{t('achievements')}</span>
		</button>
	</div>
</div>

{#if showCategoryModal}
	<div class="modal-overlay" on:click={(event) => event.target === event.currentTarget && closeCategoryModal()} on:keydown={(event) => event.key === 'Escape' && closeCategoryModal()} role="dialog" aria-modal="true" tabindex="0">
		<div class="stats-category-modal" role="document">
			<button type="button" class="stats-modal-close" on:click={closeCategoryModal} aria-label={t('close')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 6 L18 18"></path>
					<path d="M18 6 L6 18"></path>
				</svg>
			</button>
			<h3>
				{#if selectedCategoryMeta}
					{t(selectedCategoryMeta.labelKey)} {getCategoryIntervalLabel(selectedCategoryMeta.key)}
				{/if}
			</h3>
			{#if selectedCategoryVerses.length === 0}
				<p class="stats-modal-empty">{t('no_reviewed_verses')}</p>
			{:else}
				<div class="stats-modal-list" role="list">
					{#each selectedCategoryVerses as verse (verse.id)}
						<div class="stats-modal-item" role="listitem">
							<span class="stats-modal-ref">{formatVerseReference(verse)}</span>
							<span class="stats-modal-interval">{t('interval_label')} {Math.max(1, Number(verse.interval || 1))}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showChangeModal}
	<div class="modal-overlay" on:click={(event) => event.target === event.currentTarget && closeChangeModal()} on:keydown={(event) => event.key === 'Escape' && closeChangeModal()} role="dialog" aria-modal="true" tabindex="0">
		<div class="stats-category-modal" role="document">
			<button type="button" class="stats-modal-close" on:click={closeChangeModal} aria-label={t('close')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 6 L18 18"></path>
					<path d="M18 6 L6 18"></path>
				</svg>
			</button>
			<h3>
				{#if selectedChangeCategoryMeta}
					{t(selectedChangeDirection === 'gained' ? 'stats_gained' : 'stats_lost')} {t(selectedChangeCategoryMeta.labelKey)}
				{/if}
			</h3>
			{#if selectedChangeEvents.length === 0}
				<p class="stats-modal-empty">{t('no_reviewed_verses')}</p>
			{:else}
				<div class="stats-modal-list" role="list">
					{#each selectedChangeEvents as item, index (`${item.event.at}-${item.event.verseId}-${index}`)}
						{@const annotation = getChangeAnnotation(item.event, selectedChangeDirection)}
						<div class="stats-modal-item" role="listitem">
							<span class="stats-modal-ref">{formatVerseReference(item.verse)}</span>
							{#if annotation}
								<span class={`change-annotation ${annotation.className}`}>
									<span class="change-annotation-icon" aria-hidden="true">{annotation.icon}</span>
									{t(annotation.labelKey)}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showNewStartsModal}
	<div class="modal-overlay" on:click={(event) => event.target === event.currentTarget && closeNewStartsModal()} on:keydown={(event) => event.key === 'Escape' && closeNewStartsModal()} role="dialog" aria-modal="true" tabindex="0">
		<div class="stats-category-modal" role="document">
			<button type="button" class="stats-modal-close" on:click={closeNewStartsModal} aria-label={t('close')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 6 L18 18"></path>
					<path d="M18 6 L6 18"></path>
				</svg>
			</button>
			<h3>{t('stats_new_starts')}</h3>
			{#if newStartVerses.length === 0}
				<p class="stats-modal-empty">{t('no_reviewed_verses')}</p>
			{:else}
				<div class="stats-modal-list" role="list">
					{#each newStartVerses as verse (verse.id)}
						<div class="stats-modal-item" role="listitem">
							<span class="stats-modal-ref">{formatVerseReference(verse)}</span>
							<span class="stats-modal-interval">{formatDateLabel(new Date(verse.learnedDate))}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showStreakModal}
	<div class="modal-overlay" on:click={(event) => event.target === event.currentTarget && closeStreakModal()} on:keydown={(event) => event.key === 'Escape' && closeStreakModal()} role="dialog" aria-modal="true" tabindex="0">
		<div class="stats-streak-modal" role="document">
			<button type="button" class="stats-modal-close" on:click={closeStreakModal} aria-label={t('close')}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 6 L18 18"></path>
					<path d="M18 6 L6 18"></path>
				</svg>
			</button>
			<h3>{t('achievement_series_streak_days')}</h3>
			<div class="streak-display-area" class:editing={isEditingStreak}>
				{#if isEditingStreak}
					<button type="button" class="streak-interval-btn" on:click={decrementStreak} aria-label={t('remove')}>−</button>
				{/if}

				<div class="streak-count-display" class:editing={isEditingStreak}>
					{#if isEditingStreak}
						<span class="streak-edit-value">{currentStreakDays}</span>
					{:else}
						{streakDaysLabel}
					{/if}
				</div>

				{#if isEditingStreak}
					<button type="button" class="streak-interval-btn" on:click={incrementStreak} aria-label={t('add')}>+</button>
				{/if}
			</div>
			<p class="streak-status-message">{streakStatusMessage}</p>
			<button type="button" class="streak-edit-btn" on:click={toggleStreakEdit}>
				{isEditingStreak ? t('done') : t('edit')}
			</button>
		</div>
	</div>
{/if}

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

	.view-toggle {
		display: grid;
   		grid-template-columns: 1fr 1fr;
		background: var(--panel-background);
		border: 2px solid var(--file-border);
		border-radius: 12px;
		padding: 0.25rem;
		margin-bottom: 1.25rem;
	}

	.toggle-option {
		background: transparent;
		color: var(--text-color);
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.9em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.toggle-option.active {
		background: var(--accent-color);
		color: #ffffff;
	}

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
		background: var(--app-background);
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
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.bar:hover {
		filter: brightness(1.06);
	}

	.bar-count {
		font-size: 1em;
		font-weight: 700;
		color: #ffffff;
	}

	.bar-new {
		background: rgb(245, 87, 108);
	}

	.bar-developing {
		background: rgb(0, 181, 255);
	}

	.bar-solid {
		background: rgb(41, 204, 151);
	}

	.bar-mastered {
		background: rgb(248, 174, 47);
	}

	.timeline-panel {
		background: var(--panel-background);
		border: 1px solid var(--file-border);
		border-radius: 12px;
		padding: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.timeline-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem 0.8rem;
		margin-bottom: 0.6rem;
	}

	.timeline-range-controls {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		align-self: center;
		gap: 0.4rem;
		background: color-mix(in srgb, var(--app-background) 82%, transparent);
		border: 1px solid var(--file-border);
		border-radius: 12px;
		padding: 0.25rem;
		margin-top: 0.8rem;
	}

	.range-btn {
		border: none;
		background: transparent;
		color: var(--text-color);
		font-size: 0.82em;
		font-weight: 600;
		padding: 0.35rem 0.65rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.range-btn.active {
		background: var(--accent-color);
		color: #fff;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82em;
		color: var(--text-color);
	}

	.legend-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 999px;
		flex-shrink: 0;
	}

	.timeline-chart-wrap {
		width: 100%;
		overflow-x: auto;
	}

	.timeline-chart-area {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem;
		align-items: stretch;
	}

	.timeline-y-axis {
		position: relative;
		width: 2.2rem;
	}

	.timeline-y-axis-label {
		position: absolute;
		right: 0;
		font-size: 0.75em;
		line-height: 1;
		color: var(--subtitle-color);
	}

	.timeline-y-axis-label.top {
		transform: translateY(0);
	}

	.timeline-y-axis-label.middle {
		transform: translateY(-50%);
	}

	.timeline-y-axis-label.bottom {
		transform: translateY(-100%);
	}

	.timeline-chart {
		width: 100%;
		height: auto;
		display: block;
		border-radius: 8px;
	}

	.chart-bg {
		fill: color-mix(in srgb, var(--app-background) 70%, transparent);
		stroke: color-mix(in srgb, var(--text-color) 20%, transparent);
		stroke-width: 1;
	}

	.chart-grid-line {
		stroke: color-mix(in srgb, var(--text-color) 18%, transparent);
		stroke-width: 1;
	}

	.area-new {
		fill: #f5576c;
	}

	.area-developing {
		fill: #00b5ff;
	}

	.area-solid {
		fill: #29cc97;
	}

	.area-mastered {
		fill: #f8ae2f;
	}

	.timeline-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75em;
		color: var(--subtitle-color);
		margin-top: 0.45rem;
	}

	.change-chart-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) max-content;
		column-gap: 0.5rem;
	}

	.change-chart-header {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		align-items: end;
		gap: 0.5rem;
		font-size: 0.78em;
		color: var(--subtitle-color);
		margin-bottom: 0.75rem;
	}

	.change-header-track {
		display: grid;
		grid-template-columns: 1fr 1fr;
		text-align: center;
	}

	.change-net-header {
		text-align: center;
	}

	.change-chart {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		gap: 0.75rem;
	}

	.change-row {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: 1 / -1;
		align-items: center;
		gap: 0.5rem;
	}

	.change-track {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2rem;
		background: color-mix(in srgb, var(--app-background) 75%, transparent);
		border-radius: 8px;
		overflow: hidden;
	}

	.change-zero-line {
		position: absolute;
		inset-block: 0;
		left: 50%;
		width: 1px;
		background: color-mix(in srgb, var(--text-color) 28%, transparent);
	}

	.change-bar {
		position: absolute;
		z-index: 1;
		min-width: 0;
		height: 1.5rem;
		padding: 0 0.35rem;
		border: none;
		border-radius: 4px;
		color: #fff;
		font-size: 1em;
		font-weight: 700;
		line-height: 1.5rem;
		cursor: pointer;
	}

	.change-bar:disabled {
		cursor: default;
	}

	.change-bar-lost {
		right: 50%;
		text-align: center;
	}

	.change-bar-gained {
		left: 50%;
		text-align: center;
	}

	.change-net {
		font-size: 1em;
		font-weight: 700;
		text-align: center;
	}

	.new-starts-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.55rem 0.7rem;
		margin-top: 0.75rem;
		border: 1px solid var(--file-border);
		border-radius: 10px;
		background: color-mix(in srgb, var(--app-background) 82%, transparent);
		color: var(--text-color);
		font-size: 0.95em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new-starts-row:hover:not(:disabled) {
		background: color-mix(in srgb, var(--app-background) 65%, transparent);
	}

	.new-starts-row:disabled {
		cursor: default;
		opacity: 0.55;
	}

	.new-starts-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 999px;
		background: #f5576c;
		flex-shrink: 0;
	}

	.new-starts-label {
		flex: 1;
		text-align: left;
	}

	.new-starts-count {
		font-weight: 700;
		min-width: 1.5rem;
		text-align: right;
	}

	/* Shell comes from the shared modal classes; sits above the stats panel chrome */
	.modal-overlay {
		z-index: 2200;
	}

	.stats-category-modal {
		position: relative;
		background: var(--panel-background);
		color: var(--text-color);
		width: min(92vw, 560px);
		max-height: min(80vh, 640px);
		border-radius: 16px;
		padding: 1rem;
		overflow: hidden;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
	}

	.stats-category-modal h3 {
		margin: 0 2rem 0.8rem 0;
		font-size: 1.1em;
	}

	.stats-modal-close {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--text-color);
		border-radius: 999px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: .2rem .5rem;
	}

	.stats-modal-close:hover {
		background: color-mix(in srgb, var(--text-color) 15%, transparent);
	}

	.stats-modal-close svg {
		width: 1.2rem;
		height: 1.2rem;
		stroke: var(--text-color);
		stroke-width: 2.2;
	}

	.stats-modal-list {
		max-height: min(68vh, 520px);
		overflow-y: auto;
		display: grid;
		gap: 0.5rem;
		padding-right: 0.3rem;
	}

	.stats-modal-item {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		background: color-mix(in srgb, var(--app-background) 82%, transparent);
		border: 1px solid var(--file-border);
	}

	.stats-modal-ref {
		font-weight: 600;
	}

	.change-annotation {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.85em;
		font-weight: 600;
		white-space: nowrap;
	}

	.change-annotation-icon {
		font-size: 1.25em;
		font-weight: 700;
		line-height: 1;
	}

	.change-annotation-up,
	.change-annotation-new {
		color: var(--success-color);
	}

	.change-annotation-down {
		color: var(--danger-color);
	}

	.stats-modal-interval {
		color: var(--subtitle-color);
		white-space: nowrap;
	}

	.stats-modal-empty {
		color: var(--subtitle-color);
		margin: 0.5rem 0 0;
	}

	.stats-actions {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.75rem;
	}

	.heat-maps-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: .75rem;
		background: var(--panel-background);
		color: var(--text-color);
		border: 1px solid var(--file-border);
		border-radius: 12px;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.heat-maps-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.flame-icon {
		width: 32px;
		height: 32px;
	}

	.heat-maps-label {
		font-size: 0.9em;
		line-height: 1.2;
	}

	.achievements-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0.75rem;
		background: var(--panel-background);
		color: var(--text-color);
		border: 1px solid var(--file-border);
		border-radius: 12px;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.achievements-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.achievements-label {
		font-size: 0.9em;
		line-height: 1.2;
	}

	.streaks-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0.75rem;
		background: var(--panel-background);
		color: var(--text-color);
		border: 1px solid var(--file-border);
		border-radius: 12px;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		gap: 0.2rem;
	}

	.streaks-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.streak-icon {
		width: 30px;
		height: 30px;
	}

	.streak-days-label {
		font-size: 0.9em;
		line-height: 1.2;
	}

	.stats-streak-modal {
		position: relative;
		background: var(--panel-background);
		color: var(--text-color);
		width: min(92vw, 420px);
		border-radius: 12px;
		padding: 1rem;
		display: grid;
		gap: 0.75rem;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
	}

	.stats-streak-modal h3 {
		margin: 0;
		font-size: 1.1em;
		text-align:center;
	}

	.streak-status-message {
		margin: 0;
		font-size: 0.95em;
		line-height: 1.5;
		color: var(--subtitle-color);
		text-align:center;
	}

	.streak-edit-btn {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 8px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 600;
		transition: all 0.3s;
	}

	.streak-edit-btn:hover {
		background: var(--nav-button-bg);
	}

	.streak-display-area {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 64px;
	}

	.streak-display-area.editing {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		min-height: 80px;
	}

	.streak-interval-btn {
		width: 48px;
		height: 48px;
		border: 2px solid var(--accent-color);
		background: var(--file-bg);
		color: var(--accent-color);
		border-radius: 50%;
		font-size: 1.5em;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
		font-weight: bold;
	}

	.streak-interval-btn:hover {
		background: var(--accent-color);
		color: #ffffff;
	}

	.streak-count-display {
		font-size: 2em;
		font-weight: 700;
		text-align: center;
		color: var(--accent-color);
	}

	.streak-count-display.editing {
		min-width: 80px;
	}

	.streak-edit-value {
		font-size: 2.5em;
		font-weight: bold;
		color: var(--accent-color);
		min-width: 80px;
		text-align: center;
	}
	
	.trophy-icon {
		width: 32px;
		height: 32px;
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
