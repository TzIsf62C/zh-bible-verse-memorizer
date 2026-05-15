import { browser } from '$app/environment';
import { derived, get } from 'svelte/store';
import { createLocalStorageStore } from '$lib/stores/localStorage.js';
import { verses } from '$lib/stores/verses.js';
import { streakData } from '$lib/stores/streak.js';
import { dequeueToast, enqueueToast, toastQueue } from '$lib/stores/toastQueue.js';
import {
	getAllBooksWithTotals,
	getChapterKey,
	getChapterVerseCount,
	getPassageReferenceKeys,
	getVerseReferenceKey,
	normalizeBookName,
	SPECIAL_PASSAGES
} from '$lib/utils/bibleMetadata.js';
import { COUNT_SERIES } from '$lib/utils/achievementDefinitions.js';

const MASTERED_INTERVAL_THRESHOLD = 48;

export const chapterProgress = createLocalStorageStore('chapterProgress', {});
export const achievementState = createLocalStorageStore('achievementState', {
	unlocked: {},
	order: []
});

export const achievementPopupQueue = toastQueue;

let trackingInitialized = false;
let suppressQueue = true;

function isVerseLearned(verse) {
	return Boolean(verse.isLearned || verse.lastReviewed);
}

function isVerseMastered(verse) {
	return isVerseLearned(verse) && Number(verse.interval || 0) > MASTERED_INTERVAL_THRESHOLD;
}

function splitChapterKey(key) {
	const lastDash = key.lastIndexOf('-');
	if (lastDash === -1) return [key, '0'];
	return [key.slice(0, lastDash), key.slice(lastDash + 1)];
}

function buildVerseReferenceMap(allVerses) {
	const map = {};
	allVerses.forEach((verse) => {
		const refKey = getVerseReferenceKey(verse.bookName, verse.chapterNumber, verse.verseNumber);
		if (!map[refKey]) {
			map[refKey] = { learned: false, mastered: false };
		}

		if (isVerseLearned(verse)) {
			map[refKey].learned = true;
		}

		if (isVerseMastered(verse)) {
			map[refKey].mastered = true;
		}
	});
	return map;
}

function buildChapterProgressFromReferences(referenceMap) {
	const map = {};

	Object.entries(referenceMap).forEach(([refKey, status]) => {
		const parts = refKey.split('-');
		const chapter = Number(parts[parts.length - 2]);
		const bookName = parts.slice(0, parts.length - 2).join('-');
		const chapterKey = getChapterKey(bookName, chapter);

		if (!map[chapterKey]) {
			map[chapterKey] = { learnedCount: 0, masteredCount: 0 };
		}

		if (status.learned) {
			map[chapterKey].learnedCount += 1;
		}
		if (status.mastered) {
			map[chapterKey].masteredCount += 1;
		}
	});

	Object.keys(map).forEach((chapterKey) => {
		const [bookName, chapterRaw] = splitChapterKey(chapterKey);
		const total = getChapterVerseCount(bookName, Number(chapterRaw));
		if (total > 0) {
			map[chapterKey].learnedCount = Math.min(map[chapterKey].learnedCount, total);
			map[chapterKey].masteredCount = Math.min(map[chapterKey].masteredCount, total);
		}
	});

	return map;
}

function summarizeChapterProgress(progressMap, referenceMap) {
	const chapterKeys = Object.keys(progressMap);
	const learnedChapterCount = chapterKeys.filter((key) => {
		const [bookName, chapterRaw] = splitChapterKey(key);
		const total = getChapterVerseCount(bookName, Number(chapterRaw));
		return total > 0 && (progressMap[key].learnedCount || 0) >= total;
	}).length;

	const masteredChapterCount = chapterKeys.filter((key) => {
		const [bookName, chapterRaw] = splitChapterKey(key);
		const total = getChapterVerseCount(bookName, Number(chapterRaw));
		return total > 0 && (progressMap[key].masteredCount || 0) >= total;
	}).length;

	const books = getAllBooksWithTotals();
	const bookProgress = {};
	books.forEach((book) => {
		bookProgress[book.bookName] = {
			bookName: book.bookName,
			totalVerses: book.verseTotal,
			learnedCount: 0,
			masteredCount: 0
		};
	});

	let learnedVerseCount = 0;
	let masteredVerseCount = 0;
	Object.entries(referenceMap).forEach(([refKey, status]) => {
		const parts = refKey.split('-');
		const bookName = normalizeBookName(parts.slice(0, parts.length - 2).join('-'));
		if (status.learned) {
			learnedVerseCount += 1;
			if (bookProgress[bookName]) bookProgress[bookName].learnedCount += 1;
		}
		if (status.mastered) {
			masteredVerseCount += 1;
			if (bookProgress[bookName]) bookProgress[bookName].masteredCount += 1;
		}
	});

	const psalmsBook = normalizeBookName('诗篇');
	const learnedPsalmsCount = chapterKeys.filter((key) => {
		const [bookName, chapterRaw] = splitChapterKey(key);
		if (normalizeBookName(bookName) !== psalmsBook) return false;
		const total = getChapterVerseCount(bookName, Number(chapterRaw));
		return total > 0 && (progressMap[key].learnedCount || 0) >= total;
	}).length;

	const masteredPsalmsCount = chapterKeys.filter((key) => {
		const [bookName, chapterRaw] = splitChapterKey(key);
		if (normalizeBookName(bookName) !== psalmsBook) return false;
		const total = getChapterVerseCount(bookName, Number(chapterRaw));
		return total > 0 && (progressMap[key].masteredCount || 0) >= total;
	}).length;

	const passages = {};
	Object.values(SPECIAL_PASSAGES).forEach((passageDef) => {
		const refKeys = getPassageReferenceKeys(passageDef);
		let learnedCount = 0;
		let masteredCount = 0;
		refKeys.forEach((key) => {
			if (referenceMap[key]?.learned) learnedCount += 1;
			if (referenceMap[key]?.mastered) masteredCount += 1;
		});
		passages[passageDef.id] = {
			total: refKeys.length,
			learnedCount,
			masteredCount,
			started: learnedCount > 0
		};
	});

	return {
		learnedVerseCount,
		masteredVerseCount,
		learnedChapterCount,
		masteredChapterCount,
		learnedPsalmsCount,
		masteredPsalmsCount,
		bookProgress,
		passages,
		streakDays: Number(get(streakData)?.current || 0)
	};
}

function getMetricValue(summary, metric) {
	return Number(summary[metric] || 0);
}

function buildSeriesFromSummary(summary) {
	const series = [];

	const orderedCountSeries = Object.values(COUNT_SERIES).sort((a, b) => {
		if (a.id === 'streak_days') return -1;
		if (b.id === 'streak_days') return 1;
		return 0;
	});

	orderedCountSeries.forEach((seriesDef) => {
		const currentMetricValue = getMetricValue(summary, seriesDef.metric);
		
		// Determine if series should be hidden (surprise achievements)
		let isSurprise = false;
		let isStarted = true;
		if (seriesDef.id === 'psalms_learned') {
			isSurprise = true;
			isStarted = summary.learnedPsalmsCount > 0;
		} else if (seriesDef.id === 'psalms_mastered') {
			isSurprise = true;
			isStarted = summary.masteredPsalmsCount > 0;
		}
		
		series.push({
			id: seriesDef.id,
			category: seriesDef.category,
			surprise: isSurprise,
			started: isStarted,
			levels: seriesDef.levels.map((level, index) => ({
				achievementId: `${seriesDef.id}_${level.id}`,
				tier: index + 1,
				titleKey: level.titleKey,
				current: currentMetricValue,
				target: level.threshold
			}))
		});
	});

	Object.values(summary.bookProgress).forEach((book) => {
		series.push({
			id: `book_${book.bookName}`,
			category: 'book',
			surprise: true,
			started: book.learnedCount > 0,
			titleVars: { book: book.bookName },
			levels: [
				{
					achievementId: `book_${book.bookName}_learned`,
					tier: 1,
					titleKey: 'achievement_book_learned_template',
					titleVars: { book: book.bookName },
					current: book.learnedCount,
					target: book.totalVerses
				},
				{
					achievementId: `book_${book.bookName}_mastered`,
					tier: 2,
					titleKey: 'achievement_book_mastered_template',
					titleVars: { book: book.bookName },
					current: book.masteredCount,
					target: book.totalVerses
				}
			]
		});
	});

	Object.values(SPECIAL_PASSAGES).forEach((passageDef) => {
		const progress = summary.passages[passageDef.id] || { total: 0, learnedCount: 0, masteredCount: 0, started: false };
		series.push({
			id: `passage_${passageDef.id}`,
			category: 'passage',
			surprise: true,
			started: progress.started,
			levels: [
				{
					achievementId: `passage_${passageDef.id}_learned`,
					tier: 1,
					titleKey: passageDef.nameKeyLearned,
					current: progress.learnedCount,
					target: progress.total
				},
				{
					achievementId: `passage_${passageDef.id}_mastered`,
					tier: 2,
					titleKey: passageDef.nameKeyMastered,
					current: progress.masteredCount,
					target: progress.total
				}
			]
		});
	});

	return series;
}

function evaluateUnlocksFromSeries(seriesList) {
	const currentState = get(achievementState) || { unlocked: {}, order: [] };
	const unlocked = { ...(currentState.unlocked || {}) };
	const order = [...(currentState.order || [])];
	const nowIso = new Date().toISOString();
	const newlyUnlocked = [];

	seriesList.forEach((series) => {
		series.levels.forEach((level) => {
			if (unlocked[level.achievementId]) return;
			if (level.target > 0 && level.current >= level.target) {
				unlocked[level.achievementId] = nowIso;
				order.push(level.achievementId);
				newlyUnlocked.push(level);
			}
		});
	});

	if (newlyUnlocked.length > 0) {
		achievementState.set({ unlocked, order });
		if (!suppressQueue) {
			enqueueUnlockPopups(newlyUnlocked);
		}
	}
}

function enqueueUnlockPopups(newlyUnlockedLevels) {
	if (!browser || newlyUnlockedLevels.length === 0) return;

	newlyUnlockedLevels.forEach((level) => {
		enqueueToast({
			type: 'achievement',
			id: level.achievementId,
			titleKey: level.titleKey,
			titleVars: level.titleVars || null
		});
	});
}

function syncFromVerses(allVerses) {
	const referenceMap = buildVerseReferenceMap(allVerses);
	const progress = buildChapterProgressFromReferences(referenceMap);
	chapterProgress.set(progress);
	const summary = summarizeChapterProgress(progress, referenceMap);
	const series = buildSeriesFromSummary(summary);
	evaluateUnlocksFromSeries(series);
}

export function initializeAchievementsTracking() {
	if (trackingInitialized) return;
	trackingInitialized = true;

	syncFromVerses(get(verses) || []);
	suppressQueue = false;

	verses.subscribe((allVerses) => {
		syncFromVerses(allVerses || []);
	});

	streakData.subscribe(() => {
		syncFromVerses(get(verses) || []);
	});
}

export function dequeueAchievementPopup() {
	return dequeueToast();
}

function buildPanelSeries(seriesList, unlockedMap) {
	return seriesList
		.filter((series) => !series.surprise || series.started)
		.map((series) => {
			const levels = series.levels.map((level) => ({
				...level,
				isUnlocked: Boolean(unlockedMap[level.achievementId]),
				unlockedAt: unlockedMap[level.achievementId] || null
			}));

			let highestUnlockedIndex = -1;
			levels.forEach((level, index) => {
				if (level.isUnlocked) highestUnlockedIndex = index;
			});

			const currentLevel = highestUnlockedIndex >= 0 ? levels[highestUnlockedIndex] : levels[0];
			const nextLevel = highestUnlockedIndex >= 0 ? levels[highestUnlockedIndex + 1] || null : levels[0];

			return {
				id: series.id,
				category: series.category,
				levels,
				currentLevel,
				nextLevel,
				isSeriesComplete: highestUnlockedIndex === levels.length - 1
			};
		});
}

export const achievementPanelSeries = derived([verses, achievementState, streakData], ([$verses, $achievementState]) => {
	const referenceMap = buildVerseReferenceMap($verses || []);
	const progress = buildChapterProgressFromReferences(referenceMap);
	const summary = summarizeChapterProgress(progress, referenceMap);
	const series = buildSeriesFromSummary(summary);
	const unlockedMap = $achievementState?.unlocked || {};
	return buildPanelSeries(series, unlockedMap);
});

export const achievementList = derived([achievementPanelSeries], ([$achievementPanelSeries]) =>
	$achievementPanelSeries.map((series) => ({
		id: series.id,
		titleKey: series.currentLevel.titleKey,
		titleVars: series.currentLevel.titleVars || null,
		isUnlocked: series.currentLevel.isUnlocked,
		unlockedAt: series.currentLevel.unlockedAt,
		nextLevel: series.nextLevel
	}))
);
