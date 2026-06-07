<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { achievementPanelSeries } from '$lib/stores/achievements';
	import { achievementState } from '$lib/stores/achievements';
	import { t } from '$lib/i18n';
	import { findBookByName } from '$lib/utils/bibleBooks';
	import { SPECIAL_PASSAGES } from '$lib/utils/bibleMetadata';

	export let show = false;
	const dispatch = createEventDispatcher();
	let carouselIndexBySeries = {};
	let carouselInitialized = false;

	const PASSAGE_BOOK_ALIASES = {
		'约翰二书': '约翰贰书',
		'約翰二書': '約翰貳書'
	};

	const ENGLISH_BOOK_NAMES = {
		'创世记': 'Genesis',
		'诗篇': 'Psalm',
		'以赛亚书': 'Isaiah',
		'马太福音': 'Matthew',
		'约翰福音': 'John',
		'约翰贰书': '2 John',
		'罗马书': 'Romans',
		'哥林多前书': '1 Corinthians',
		'以弗所书': 'Ephesians',
		'腓立比书': 'Philippians',
		'启示录': 'Revelation'
	};

	const PASSAGE_BOOK_ABBREVIATIONS = {
		english: {
			'约翰福音': 'Jn',
			'罗马书': 'Rm',
			'哥林多前书': '1 Cor',
			'以弗所书': 'Eph',
			'启示录': 'Rev'
		},
		simplified: {
			'约翰福音': '约',
			'罗马书': '罗',
			'哥林多前书': '林前',
			'以弗所书': '弗',
			'启示录': '启'
		},
		traditional: {
			'约翰福音': '約',
			'罗马书': '羅',
			'哥林多前书': '林前',
			'以弗所书': '弗',
			'启示录': '啟'
		}
	};

	function close() {
		dispatch('close');
	}

	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			close();
		}
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

	function normalizePassageBookName(bookName) {
		const aliasedName = PASSAGE_BOOK_ALIASES[bookName] || bookName;
		return findBookByName(aliasedName)?.simplified || aliasedName;
	}

	function getBookDisplayName(bookName, abbreviated = false) {
		const language = $settings?.languagePreference || 'english';
		const normalizedBookName = normalizePassageBookName(bookName);

		if (abbreviated) {
			const abbreviation = PASSAGE_BOOK_ABBREVIATIONS[language]?.[normalizedBookName];
			if (abbreviation) return abbreviation;
		}

		if (language === 'english') {
			return ENGLISH_BOOK_NAMES[normalizedBookName] || normalizedBookName;
		}

		const book = findBookByName(normalizedBookName);
		if (language === 'traditional') {
			return book?.traditional || PASSAGE_BOOK_ALIASES[bookName] || bookName;
		}

		return book?.simplified || normalizedBookName;
	}

	function collapseVerseRanges(verses) {
		const sortedVerses = [...new Set(verses.map((verse) => Number(verse)).filter(Boolean))].sort((a, b) => a - b);
		const ranges = [];
		let rangeStart = null;
		let previousVerse = null;

		sortedVerses.forEach((verse) => {
			if (rangeStart === null) {
				rangeStart = verse;
				previousVerse = verse;
				return;
			}

			if (verse === previousVerse + 1) {
				previousVerse = verse;
				return;
			}

			ranges.push(rangeStart === previousVerse ? `${rangeStart}` : `${rangeStart}-${previousVerse}`);
			rangeStart = verse;
			previousVerse = verse;
		});

		if (rangeStart !== null) {
			ranges.push(rangeStart === previousVerse ? `${rangeStart}` : `${rangeStart}-${previousVerse}`);
		}

		return ranges.join(', ');
	}

	function formatPassageRefs(refs, abbreviated = false) {
		const bookOrder = [];
		const groupedRefs = new Map();

		refs.forEach((ref) => {
			const normalizedBookName = normalizePassageBookName(ref.bookName);
			if (!groupedRefs.has(normalizedBookName)) {
				groupedRefs.set(normalizedBookName, new Map());
				bookOrder.push(normalizedBookName);
			}

			const chapterMap = groupedRefs.get(normalizedBookName);
			const chapterNumber = Number(ref.chapter);
			const verseNumber = Number(ref.verse);
			if (!chapterMap.has(chapterNumber)) {
				chapterMap.set(chapterNumber, []);
			}
			chapterMap.get(chapterNumber).push(verseNumber);
		});

		return bookOrder
			.map((bookName) => {
				const chapterMap = groupedRefs.get(bookName);
				const chapterRefs = Array.from(chapterMap.entries())
					.sort(([chapterA], [chapterB]) => chapterA - chapterB)
					.map(([chapterNumber, verses]) => `${chapterNumber}:${collapseVerseRanges(verses)}`);
				return `${getBookDisplayName(bookName, abbreviated)} ${chapterRefs.join(', ')}`;
			})
			.join('; ');
	}

	function formatPassageRange(passageDef) {
		const bookName = getBookDisplayName(passageDef.bookName);
		if (passageDef.startChapter === passageDef.endChapter) {
			return `${bookName} ${passageDef.startChapter}`;
		}
		return `${bookName} ${passageDef.startChapter}-${passageDef.endChapter}`;
	}

	function getPassageReferenceText(series) {
		const passageId = series?.id?.startsWith('passage_') ? series.id.slice(8) : null;
		const passageDef = passageId ? SPECIAL_PASSAGES[passageId] : null;
		if (!passageDef) return '';

		if (passageDef.type === 'range') {
			return formatPassageRange(passageDef);
		}

		const useAbbreviations = passageDef.id === 'romans_road' || passageDef.id === 'good_news';
		return formatPassageRefs(passageDef.refs || [], useAbbreviations);
	}

	function getProgressLabel(series, progressLevel) {
		if (!progressLevel) return '';
		if (series.category === 'passage' && progressLevel.tier === 2) {
			return `${t('achievement_progress_to_next')}: ${t('achievement_progress_to_next_mastered', {
				current: progressLevel.current,
				target: progressLevel.target
			})}`;
		}

		return `${t('achievement_progress_to_next')}: ${progressLevel.current}/${progressLevel.target}`;
	}

	$: unlockedCount = Object.keys($achievementState?.unlocked || {}).length;

	$: if (!show) {
		carouselInitialized = false;
		carouselIndexBySeries = {};
	}

	$: if (show && $achievementPanelSeries?.length && !carouselInitialized) {
		const next = {};
		$achievementPanelSeries.forEach((series) => {
			if (!isNumericSeries(series)) return;
			next[series.id] = getInitialCarouselIndex(series);
		});
		carouselIndexBySeries = next;
		carouselInitialized = true;
	}

	$: if (show && carouselInitialized && $achievementPanelSeries?.length) {
		const next = { ...carouselIndexBySeries };
		let changed = false;
		$achievementPanelSeries.forEach((series) => {
			if (!isNumericSeries(series)) return;
			const unlockedLevels = getUnlockedLevels(series);
			const maxIndex = Math.max(0, unlockedLevels.length - 1);
			const currentIndex = next[series.id] ?? maxIndex;
			const clampedIndex = Math.min(maxIndex, Math.max(0, currentIndex));
			if (currentIndex !== clampedIndex) {
				next[series.id] = clampedIndex;
				changed = true;
			}
		});
		if (changed) {
			carouselIndexBySeries = next;
		}
	}
	
	function getDescription(series, levelOverride = null) {
		const level = levelOverride || series.currentLevel;
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
			const passage = getPassageReferenceText(series);
			if (isLocked) {
				const descKey = level.tier === 1 ? 'achievement_desc_locked_passage_learned' : 'achievement_desc_locked_passage_mastered';
				return t(descKey, { passage });
			} else {
				const descKey = level.tier === 1 ? 'achievement_desc_passage_learned' : 'achievement_desc_passage_mastered';
				return t(descKey, { passage });
			}
		}
		
		return '';
	}
	
	function getSeriesIcon(series) {
		// Return SVG icon based on series type
		if (series.id === 'verses_learned') {
			// Fruit tree
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.122192 8.0814591 11.921519 12.706038"></path><path d="M10.046377 9.7021313 11.880271 13.418405 V 21.902804"></path><path d="M11.79842 2.0971956 C 21.677472 2.0971956, 18.609055 15.470697, 11.902992 15.470697"></path><path d="M12.222434 2.0971956 C 2.5023151 2.0971956, 5.2502071 15.470697, 11.81899 15.470697"></path></svg>`;
		} else if (series.id === 'verses_mastered') {
			// Evergreen tree
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.099931 V 22 M12 1.9999313 C 10.929335 4.4440111, 7 6.9999313, 7 6.9999313 H 17 C 17 6.9999313, 13.199301 4.4440111, 12 1.9999313 Z M12 6.9995263 6 11.000335 H 18 Z M12 10.999526 5 15.000336 H 19 Z"></path></svg>`;
		} else if (series.id === 'chapters_learned') {
			// Wave
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12 Q 5 8, 8 12 T 14 12 T 20 12 T 26 12"/><path d="M2 16 Q 5 12, 8 16 T 14 16 T 20 16 T 26 16" opacity="0.6"/></svg>`;
		} else if (series.id === 'chapters_mastered') {
			// Raindrop
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.525283 3.6019285 C 9.4052535 7.8520101, 7.7498738 9.6276887, 7.812403 12.001929 C 7.882609 14.667672, 9.0457363 16.801929, 11.712403 16.801929 C 14.37907 16.801929, 15.812403 14.668596, 15.812403 12.001929 C 15.812403 10.112229, 13.239823 7.2557672, 12.525283 3.6019285 Z"></path><path d="M5.312403 16.501929 C 1.1142196 16.501929, 1.4048196 20.397929, 12.010613 20.397929 C 22.81759 20.397929, 22.841533 16.63041, 18.512403 16.501929"></path></svg>`;
		} else if (series.id === 'psalms_learned') {
			// Mountain peak
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20 L 8 10 L 12 14 L 16 4 L 22 20 Z"/></svg>`;
		} else if (series.id === 'psalms_mastered') {
			// Harp
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.837193 5.3561504 C 6.0496017 3.8274516, 7.7408613 5.6726306, 7.0903625 7.1225894 C 4.5807516 12.716501, 6.7867809 20.036726, 11.982742 19.917 C 17.300511 19.794467, 19.221644 12.717211, 16.87512 7.0207713 C 15.898912 4.6509198, 18.313136 4.3669223, 19.162807 5.3561504"></path><path d="M7.466193 7.0437431 H 16.621193"></path><path d="M11.944743 6.9307987 V 19.124391"></path><path d="M8.982193 6.9309893 V 18.724783"></path><path d="M14.907293 6.9309893 V 18.56561"></path><path d="M7.466193 7.0437431 H 16.621193"></path></svg>`;
		} else if (series.id === 'streak_days') {
			// Apple
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m 10.582964,7.2308973 c 0.186029,0.00683 0.371058,0.010818 0.553404,0.012768 0.182347,0.00195 0.36201,0.00186 0.537311,5.323e-4 0.1753,-0.00133 0.346237,-0.00389 0.511129,-0.0069 0.164892,-0.003 0.32374,-0.00645 0.474862,-0.00952 0.151122,-0.00308 0.294518,-0.00579 0.428507,-0.00734 0.133989,-0.00155 0.258572,-0.00194 0.372066,-3.556e-4 0.113495,0.00158 0.215901,0.00512 0.305539,0.011436 2.374504,0.1671888 5.210233,0.517645 5.210233,4.8835904 0,2.182972 -1.642878,5.270996 -2.836244,6.874012 -1.193367,1.603016 -1.937221,1.721024 -4.138618,1.728147 -2.2013973,0.0071 -2.9186303,-0.07745 -4.0986863,-1.84376 C 6.7224113,17.107198 5.079533,13.65916 5.0262898,12.115106 5.012979,11.729092 5.0577842,11.361137 5.1492961,11.012964 5.240808,10.664792 5.3790266,10.336402 5.5525427,10.02952 5.7260587,9.7226385 5.9348722,9.4372647 6.1675739,9.1751236 6.4002756,8.9129826 6.6568654,8.6740744 6.9259341,8.4601239"></path><path d="m 12.200878,8.8087363 c 0.01689,-1.4014343 0.347258,-2.8091074 1.206106,-3.705367"></path><path d="m 10.51986,8.5517145 c -0.155374,-2.716929 -2.5922777,-3.335863 -3.9973164,-3.420812 -1.405038,-0.08495 -0.9356574,1.971665 0.3272278,2.81712 1.3256439,0.887469 3.6700886,0.603692 3.6700886,0.603692 z"/></svg>`;
		} else if (series.category === 'book') {
			// Closed book
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m 5.268617,6.5705 v 13.4 h 10.7 v -13.4 z"/><path d="m 8.799617,4.0295 h 9.931766 v 11.972"/><path d="m 5.293617,6.5555 3.409,-2.467"/><path d="M 16.060648,19.8669 18.73107,16.019253"/></svg>`;
		} else if (series.category === 'passage') {
			// Quill pen
			return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 14.752689,7.3197302 C 9.8283185,11.944961 4.1963518,18.24966 4.1963518,18.24966 4.3146961,17.656104 7.444816,15.138044 7.5267014,14.074827 7.6085874,13.01161 8.7860181,5.500673 10.214143,7.95748 c 0,0 1.985193,-4.131779 2.695268,-2.4058511 1.614149,-2.2256582 7.036134,-2.3295867 7.160614,-2.1380441 0,0 -1.393809,0.7464947 -1.442225,1.9109853 1.177849,0.5978052 1.483666,2.7046343 -0.831229,3.3308466 0.327686,0.3838686 -2.0909,2.4958083 -3.512965,3.0537403 0.382757,1.4861 -2.674765,3.866807 -4.163501,2.396338" id="path1" style="stroke-linecap:butt;stroke-linejoin:miter" /></svg>`;
		}
		return '';
	}

	function isNumericSeries(series) {
		return series.category === 'count' || series.category === 'streak';
	}

	function getInitialCarouselIndex(series) {
		const unlockedLevels = getUnlockedLevels(series);
		if (!unlockedLevels.length) return 0;
		return unlockedLevels.length - 1;
	}

	function getUnlockedLevels(series) {
		return (series?.levels || []).filter((level) => level.isUnlocked);
	}

	function getCarouselIndex(series) {
		const fallback = getInitialCarouselIndex(series);
		return carouselIndexBySeries[series.id] ?? fallback;
	}

	function getDisplayLevel(series, indexOverride = null) {
		if (!isNumericSeries(series) || !series?.levels?.length) {
			return series.currentLevel;
		}
		const unlockedLevels = getUnlockedLevels(series);
		if (!unlockedLevels.length) {
			return series.currentLevel;
		}
		const idx = indexOverride ?? getCarouselIndex(series);
		return unlockedLevels[idx] || series.currentLevel;
	}

	function previousCarouselLevel(series) {
		const idx = getCarouselIndex(series);
		if (idx <= 0) return;
		carouselIndexBySeries = {
			...carouselIndexBySeries,
			[series.id]: idx - 1
		};
	}

	function nextCarouselLevel(series) {
		const idx = getCarouselIndex(series);
		const unlockedLevels = getUnlockedLevels(series);
		const maxIndex = Math.max(0, (unlockedLevels.length || 1) - 1);
		if (idx >= maxIndex) return;
		carouselIndexBySeries = {
			...carouselIndexBySeries,
			[series.id]: idx + 1
		};
	}

	function hasPreviousLevel(series, indexOverride = null) {
		if (!isNumericSeries(series)) return false;
		const idx = indexOverride ?? getCarouselIndex(series);
		return idx > 0;
	}

	function hasNextLevel(series, indexOverride = null) {
		if (!isNumericSeries(series)) return false;
		const unlockedLevels = getUnlockedLevels(series);
		if (!unlockedLevels.length) return false;
		const idx = indexOverride ?? getCarouselIndex(series);
		return idx < unlockedLevels.length - 1;
	}

	function getSeriesProgressLevel(series, displayLevel) {
		if (!series || !displayLevel) return null;

		if (isNumericSeries(series)) {
			return series.nextLevel;
		}

		if ((series.category === 'book' || series.category === 'passage') && displayLevel.isUnlocked && !series.isSeriesComplete) {
			return series.nextLevel;
		}

		if (!displayLevel.isUnlocked && displayLevel.target > 0) {
			return displayLevel;
		}

		return null;
	}
</script>

{#if show}
	<div class="modal-overlay" on:click={handleOverlayClick} on:keydown={(e) => e.key === 'Escape' && close()} role="dialog" aria-modal="true" tabindex="0">
		<div class="modal-content" role="document" tabindex="-1">
			<div class="header-row">
				<h3>{t('achievements')} {unlockedCount}/?</h3>
				<button class="close-btn" on:click={close} aria-label={t('close')}>×</button>
			</div>

			<div class="list">
				{#each $achievementPanelSeries as series}
					{@const carouselIndex = carouselIndexBySeries[series.id] ?? getInitialCarouselIndex(series)}
					{@const displayLevel = getDisplayLevel(series, carouselIndex)}
					{#if isNumericSeries(series)}
						{@const unlockedLevels = getUnlockedLevels(series)}
						{@const hasUnlockedLevels = unlockedLevels.length > 0}
						{@const isMostRecentUnlocked = hasUnlockedLevels && carouselIndex === unlockedLevels.length - 1}
						{@const isActiveProgressCard = hasUnlockedLevels ? isMostRecentUnlocked : true}
						{@const progressLevel = hasUnlockedLevels
							? (isMostRecentUnlocked ? series.nextLevel : null)
							: series.currentLevel}
						<div class="carousel-row">
							<button
								type="button"
								class="carousel-button outside"
								on:click={() => previousCarouselLevel(series)}
								disabled={!hasPreviousLevel(series, carouselIndex)}
								aria-label="Previous unlocked achievement"
							>
								←
							</button>
							<div class="achievement-item" class:unlocked={displayLevel.isUnlocked}>
								<div class="achievement-header">
									<div class="icon-container" class:unlocked={displayLevel.isUnlocked}>
										{@html getSeriesIcon(series)}
									</div>
									<div class="achievement-content">
										<div class="title">{t(displayLevel.titleKey, displayLevel.titleVars || {})}</div>
										<div class="description">{getDescription(series, displayLevel)}</div>
									</div>
								</div>
								{#if displayLevel.isUnlocked}
									<div class="meta">{t('unlocked_on')}: {formatDate(displayLevel.unlockedAt)}</div>
								{:else}
									<div class="meta locked">{t('locked')}</div>
								{/if}

								{#if progressLevel}
									<div class="progress-wrap">
										<div class="progress-label">
											{getProgressLabel(series, progressLevel)}
										</div>
										<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={getProgressPercent(progressLevel)}>
											<div class="progress-fill" style={`width: ${getProgressPercent(progressLevel)}%`}></div>
										</div>
									</div>
								{:else if isActiveProgressCard}
									<div class="meta">{t('achievement_progress_complete')}</div>
								{/if}
							</div>
							<button
								type="button"
								class="carousel-button outside"
								on:click={() => nextCarouselLevel(series)}
								disabled={!hasNextLevel(series, carouselIndex)}
								aria-label="Next unlocked achievement"
							>
								→
							</button>
						</div>
					{:else}
						{@const progressLevel = getSeriesProgressLevel(series, displayLevel)}
						<div class="achievement-item" class:unlocked={displayLevel.isUnlocked}>
							<div class="achievement-header">
								<div class="icon-container" class:unlocked={displayLevel.isUnlocked}>
									{@html getSeriesIcon(series)}
								</div>
								<div class="achievement-content">
									<div class="title">{t(displayLevel.titleKey, displayLevel.titleVars || {})}</div>
									<div class="description">{getDescription(series, displayLevel)}</div>
								</div>
							</div>
							{#if displayLevel.isUnlocked}
								<div class="meta">{t('unlocked_on')}: {formatDate(displayLevel.unlockedAt)}</div>
							{:else}
								<div class="meta locked">{t('locked')}</div>
							{/if}

							{#if progressLevel}
								<div class="progress-wrap">
									<div class="progress-label">
											{getProgressLabel(series, progressLevel)}
									</div>
									<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={getProgressPercent(progressLevel)}>
										<div class="progress-fill" style={`width: ${getProgressPercent(progressLevel)}%`}></div>
									</div>
								</div>
							{:else}
								<div class="meta">{t('achievement_progress_complete')}</div>
							{/if}
						</div>
					{/if}
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
		width: 100%;
		box-sizing: border-box;
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

	.carousel-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
	}

	.carousel-row .achievement-item {
		flex: 1 1 auto;
		min-width: 0;
	}

	.carousel-button {
		border: 1px solid var(--file-border);
		background: var(--panel-background);
		color: var(--text-color);
		border-radius: 6px;
		font-size: 0.85em;
		line-height: 1;
		padding: 0.2rem 0.45rem;
		cursor: pointer;
	}

	.carousel-button.outside {
		align-self: stretch;
		min-width: 2rem;
		font-size: 1em;
	}

	.carousel-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
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
