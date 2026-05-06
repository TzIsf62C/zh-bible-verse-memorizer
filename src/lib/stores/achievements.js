import { browser } from '$app/environment';
import { derived, get, writable } from 'svelte/store';
import { createLocalStorageStore } from '$lib/stores/localStorage.js';
import { verses } from '$lib/stores/verses.js';
import {
	getAllBooksWithTotals,
	getBookChapterCount,
	getChapterKey,
	getChapterVerseCount,
	getRangeChapterKeys,
	PREDEFINED_RANGES
} from '$lib/utils/bibleMetadata.js';
import { achievementDefinitions } from '$lib/utils/achievementDefinitions.js';

const MASTERED_INTERVAL_THRESHOLD = 48;

export const chapterProgress = createLocalStorageStore('chapterProgress', {});
export const achievementState = createLocalStorageStore('achievementState', {
	unlocked: {},
	order: []
});

const popupQueueStore = writable([]);
export const achievementPopupQueue = derived(popupQueueStore, ($queue) => $queue);

let trackingInitialized = false;
let suppressQueue = true;

function isVerseLearned(verse) {
	return Boolean(verse.isLearned || verse.lastReviewed);
}

function isVerseMastered(verse) {
	return isVerseLearned(verse) && Number(verse.interval || 0) > MASTERED_INTERVAL_THRESHOLD;
}

function summarizeChapterProgress(progressMap) {
	const chapterKeys = Object.keys(progressMap);
	const learnedChapterCount = chapterKeys.filter((key) => {
		const [bookName, chapterRaw] = splitChapterKey(key);
		const total = getChapterVerseCount(bookName, Number(chapterRaw));
		return total > 0 && progressMap[key].learnedCount >= total;
	}).length;

	const masteredChapterCount = chapterKeys.filter((key) => {
		const [bookName, chapterRaw] = splitChapterKey(key);
		const total = getChapterVerseCount(bookName, Number(chapterRaw));
		return total > 0 && progressMap[key].masteredCount >= total;
	}).length;

	let learnedVerseCount = 0;
	let masteredVerseCount = 0;
	chapterKeys.forEach((key) => {
		learnedVerseCount += progressMap[key].learnedCount || 0;
		masteredVerseCount += progressMap[key].masteredCount || 0;
	});

	const books = getAllBooksWithTotals();
	const learnedBookCount = books.filter((book) => isBookComplete(progressMap, book.bookName, 'learnedCount')).length;
	const masteredBookCount = books.filter((book) => isBookComplete(progressMap, book.bookName, 'masteredCount')).length;

	const ranges = Object.fromEntries(
		Object.entries(PREDEFINED_RANGES).map(([rangeId, rangeDef]) => {
			const keys = getRangeChapterKeys(rangeDef);
			const learned = keys.every((key) => hasCompleteChapter(progressMap, key, 'learnedCount'));
			const mastered = keys.every((key) => hasCompleteChapter(progressMap, key, 'masteredCount'));
			return [rangeId, { learned, mastered }];
		})
	);

	return {
		learnedVerseCount,
		masteredVerseCount,
		learnedChapterCount,
		masteredChapterCount,
		learnedBookCount,
		masteredBookCount,
		ranges
	};
}

function splitChapterKey(key) {
	const lastDash = key.lastIndexOf('-');
	if (lastDash === -1) return [key, '0'];
	return [key.slice(0, lastDash), key.slice(lastDash + 1)];
}

function hasCompleteChapter(progressMap, chapterKey, countField) {
	const [bookName, chapterRaw] = splitChapterKey(chapterKey);
	const total = getChapterVerseCount(bookName, Number(chapterRaw));
	if (total <= 0) return false;
	return (progressMap[chapterKey]?.[countField] || 0) >= total;
}

function isBookComplete(progressMap, bookName, countField) {
	const chapterCount = getBookChapterCount(bookName);
	if (chapterCount <= 0) return false;

	for (let chapter = 1; chapter <= chapterCount; chapter++) {
		const chapterKey = getChapterKey(bookName, chapter);
		if (!hasCompleteChapter(progressMap, chapterKey, countField)) {
			return false;
		}
	}

	return true;
}

function buildChapterProgress(allVerses) {
	const map = {};

	allVerses.forEach((verse) => {
		const chapterKey = getChapterKey(verse.bookName, verse.chapterNumber);
		if (!map[chapterKey]) {
			map[chapterKey] = {
				learnedCount: 0,
				masteredCount: 0
			};
		}

		if (isVerseLearned(verse)) {
			map[chapterKey].learnedCount += 1;
		}

		if (isVerseMastered(verse)) {
			map[chapterKey].masteredCount += 1;
		}
	});

	return map;
}

function enqueueUnlockPopups(newlyUnlockedIds) {
	if (!newlyUnlockedIds.length || !browser) return;

	const definitionsById = Object.fromEntries(achievementDefinitions.map((def) => [def.id, def]));
	popupQueueStore.update((queue) => [
		...queue,
		...newlyUnlockedIds
			.map((id) => definitionsById[id])
			.filter(Boolean)
			.map((def) => ({
				id: def.id,
				titleKey: def.titleKey,
				descriptionKey: def.descriptionKey
			}))
	]);
}

function evaluateUnlocks(summary) {
	const currentState = get(achievementState) || { unlocked: {}, order: [] };
	const unlocked = { ...(currentState.unlocked || {}) };
	const order = [...(currentState.order || [])];
	const nowIso = new Date().toISOString();
	const newlyUnlocked = [];

	achievementDefinitions.forEach((definition) => {
		if (unlocked[definition.id]) {
			return;
		}
		if (definition.condition(summary)) {
			unlocked[definition.id] = nowIso;
			order.push(definition.id);
			newlyUnlocked.push(definition.id);
		}
	});

	if (newlyUnlocked.length > 0) {
		achievementState.set({ unlocked, order });
		if (!suppressQueue) {
			enqueueUnlockPopups(newlyUnlocked);
		}
	}
}

function syncFromVerses(allVerses) {
	const progress = buildChapterProgress(allVerses);
	chapterProgress.set(progress);
	const summary = summarizeChapterProgress(progress);
	evaluateUnlocks(summary);
}

export function initializeAchievementsTracking() {
	if (trackingInitialized) return;
	trackingInitialized = true;

	syncFromVerses(get(verses) || []);
	suppressQueue = false;

	verses.subscribe((allVerses) => {
		syncFromVerses(allVerses || []);
	});
}

export function dequeueAchievementPopup() {
	const queue = get(popupQueueStore);
	if (!queue || queue.length === 0) {
		return null;
	}

	const [firstItem, ...rest] = queue;
	popupQueueStore.set(rest);
	return firstItem;
}

export const achievementList = derived(achievementState, ($achievementState) => {
	const unlockedMap = $achievementState?.unlocked || {};
	return achievementDefinitions.map((definition) => ({
		...definition,
		isUnlocked: Boolean(unlockedMap[definition.id]),
		unlockedAt: unlockedMap[definition.id] || null
	}));
});
