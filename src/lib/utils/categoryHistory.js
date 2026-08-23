import { getMasteryCategory } from '$lib/utils/masteryProgress.js';

const HISTORY_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CORRECTION_WINDOW_MS = 60 * 60 * 1000;

function getValidTimestamp(value) {
	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? null : timestamp;
}

function pruneHistory(history, now) {
	const cutoff = now.getTime() - HISTORY_RETENTION_DAYS * DAY_MS;
	return history.filter((entry) => {
		const timestamp = getValidTimestamp(entry?.at);
		return timestamp !== null && timestamp >= cutoff;
	});
}

export function getCurrentCategory(verse) {
	const latestEntry = Array.isArray(verse?.categoryHistory) ? verse.categoryHistory[0] : null;
	if (latestEntry?.to) return latestEntry.to;
	if (verse?.isLearned || verse?.lastReviewed) {
		return getMasteryCategory(verse.interval);
	}
	return null;
}

export function appendCategoryHistory(verse, newInterval, now = new Date()) {
	const previousCategory = getCurrentCategory(verse);
	const newCategory = getMasteryCategory(newInterval);
	if (previousCategory === newCategory) {
		return Array.isArray(verse?.categoryHistory) ? verse.categoryHistory : [];
	}

	const entry = {
		at: now.toISOString(),
		from: previousCategory,
		to: newCategory,
		interval: Math.max(1, Number(newInterval) || 1)
	};
	const existingHistory = Array.isArray(verse?.categoryHistory) ? verse.categoryHistory : [];
	return pruneHistory([entry, ...existingHistory], now);
}

export function shouldTreatManualEditAsReview(
	verse,
	now = new Date(),
	windowMs = DEFAULT_CORRECTION_WINDOW_MS
) {
	const latestEntry = Array.isArray(verse?.categoryHistory) ? verse.categoryHistory[0] : null;
	const entryTime = getValidTimestamp(latestEntry?.at);
	if (!latestEntry || latestEntry.to !== 'newLearning' || entryTime === null) return false;
	const elapsed = now.getTime() - entryTime;
	return elapsed >= 0 && elapsed <= windowMs;
}

export function applyManualCorrection(verse, newInterval, now = new Date()) {
	const history = Array.isArray(verse?.categoryHistory) ? verse.categoryHistory : [];
	if (!shouldTreatManualEditAsReview(verse, now)) return history;

	const regressionEntry = history[0];
	const correctedCategory = getMasteryCategory(newInterval);
	const remainingHistory = history.slice(1);
	if (regressionEntry.from === correctedCategory) {
		return pruneHistory(remainingHistory, now);
	}

	return pruneHistory([
		{
			at: now.toISOString(),
			from: regressionEntry.from,
			to: correctedCategory,
			interval: Math.max(1, Number(newInterval) || 1)
		},
		...remainingHistory
	], now);
}

export function computeCategoryChangeStats(verseList, rangeStart, rangeEnd) {
	const categories = ['newLearning', 'developing', 'solid', 'mastered'];
	const stats = Object.fromEntries(categories.map((category) => [category, {
		gained: [],
		lost: [],
		net: 0
	}]));
	const startTime = new Date(rangeStart).getTime();
	const endTime = new Date(rangeEnd).getTime();

	if (Number.isNaN(startTime) || Number.isNaN(endTime)) return stats;

	(Array.isArray(verseList) ? verseList : []).forEach((verse) => {
		(Array.isArray(verse?.categoryHistory) ? verse.categoryHistory : []).forEach((entry) => {
			const entryTime = getValidTimestamp(entry?.at);
			if (entryTime === null || entryTime < startTime || entryTime >= endTime) return;
			const event = {
				...entry,
				verseId: verse.id,
				bookName: verse.bookName,
				chapterNumber: verse.chapterNumber,
				verseNumber: verse.verseNumber
			};
			if (stats[entry.to]) stats[entry.to].gained.push(event);
			if (entry.from !== null && stats[entry.from]) stats[entry.from].lost.push(event);
		});
	});

	categories.forEach((category) => {
		stats[category].net = stats[category].gained.length - stats[category].lost.length;
	});
	return stats;
}
