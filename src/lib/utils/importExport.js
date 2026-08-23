import { applyHybridRetention } from '$lib/utils/progressTracking.js';

function normalizeVerseNumbers(value) {
	return String(value ?? '').trim();
}

export function parseImportPayload(payload) {
	const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
	if (Array.isArray(parsed)) {
		return {
			verses: parsed,
			collections: [],
			practiceData: null,
			achievementsData: null,
			progressHistoryData: null,
			streakData: null,
			lastExportDate: null,
			raw: parsed
		};
	}

	return {
		verses: parsed?.verses ?? [],
		collections: parsed?.collections ?? [],
		practiceData: parsed?.practiceData ?? null,
		achievementsData: parsed?.achievementsData ?? null,
		progressHistoryData: parsed?.progressHistoryData ?? null,
		streakData: parsed?.streakData ?? null,
		lastExportDate: parsed?.lastExportDate ?? null,
		raw: parsed
	};
}

export function mergeVerses(currentVerses, importedVerses, options = {}) {
	const { includeReview = true } = options;
	const merged = [...currentVerses];
	const conflicts = [];

	importedVerses.forEach((importedVerse, importIndex) => {
		const incoming = { ...importedVerse };
		if (!includeReview) {
			delete incoming.lastReviewed;
			delete incoming.interval;
			delete incoming.repetitions;
			delete incoming.dueDate;
			delete incoming.heatArray;
			delete incoming.categoryHistory;
		}

		const existingIndex = merged.findIndex((v) =>
			v.bookName === importedVerse.bookName &&
			normalizeVerseNumbers(v.chapterNumber) === normalizeVerseNumbers(importedVerse.chapterNumber) &&
			normalizeVerseNumbers(v.verseNumber) === normalizeVerseNumbers(importedVerse.verseNumber)
		);

		if (existingIndex !== -1) {
			const existing = merged[existingIndex];
			
			// Check if content is identical (same translation/version)
			const isIdenticalContent = 
				existing.verseText === incoming.verseText &&
				existing.verseInitials === incoming.verseInitials;
			
			if (isIdenticalContent) {
				// Same content - merge normally, keeping most recent review data
				const existingReviewDate = existing?.lastReviewed ? new Date(existing.lastReviewed) : null;
				const importedReviewDate = incoming?.lastReviewed ? new Date(incoming.lastReviewed) : null;

				if (importedReviewDate && (!existingReviewDate || importedReviewDate > existingReviewDate)) {
					merged[existingIndex] = incoming;
				}
			} else {
				// Different content - this is a conflict (different translation)
				conflicts.push({
					existing,
					imported: incoming,
					existingIndex,
					importIndex
				});
			}
		} else {
			// New verse - add it
			merged.push(incoming);
		}
	});

	return { merged, conflicts };
}

function findVerseIdByRef(verses, ref) {
	return verses.find(
		(v) =>
			v.bookName === ref.bookName &&
			normalizeVerseNumbers(v.chapterNumber) === normalizeVerseNumbers(ref.chapterNumber) &&
			normalizeVerseNumbers(v.verseNumber) === normalizeVerseNumbers(ref.verseNumber)
	)?.id;
}

export function mergeCollections(currentCollections, importedCollections, verses) {
	const merged = [...currentCollections];
	importedCollections.forEach((collection) => {
		const ids = (collection.verseRefs || [])
			.map((ref) => findVerseIdByRef(verses, ref))
			.filter(Boolean);

		if (ids.length === 0) return;

		const existing = merged.find((c) => c.title === collection.title);
		if (!existing) {
			merged.push({
				id: `${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
				title: collection.title,
				verseIds: ids
			});
			return;
		}

		const set = new Set();
		const combined = [];
		ids.forEach((id) => {
			if (!set.has(id)) {
				set.add(id);
				combined.push(id);
			}
		});
		(existing.verseIds || []).forEach((id) => {
			if (!set.has(id)) {
				set.add(id);
				combined.push(id);
			}
		});
		existing.verseIds = combined;
	});

	return merged;
}

export function buildExportPayload(verses, collections, options = {}) {
	const {
		includeReview = true,
		includeCollections = false,
		collectionIds = [],
		lastExportDate = null,
		practiceData = null,
		achievementsData = null,
		progressHistoryData = null,
		streakData = null
	} = options;

	const cleaned = verses.map((verse) => {
		const entry = { ...verse };
		if (!includeReview) {
			delete entry.lastReviewed;
			delete entry.interval;
			delete entry.repetitions;
			delete entry.dueDate;
			delete entry.heatArray;
			delete entry.categoryHistory;
		}
		return entry;
	});

	const shouldIncludePracticeData = includeReview && practiceData;
	const shouldIncludeAchievementsData = includeReview && achievementsData;
	const shouldIncludeProgressHistoryData = includeReview && progressHistoryData;
 	const shouldIncludeStreakData = includeReview && streakData;

	const includeCols = collectionIds.length
		? collections.filter((c) => collectionIds.includes(c.id))
		: collections;

	const idToVerse = new Map(verses.map((verse) => [verse.id, verse]));
	const collectionsExport = includeCollections
		? includeCols.map((collection) => {
			const verseRefs = (collection.verseIds || [])
				.map((id) => idToVerse.get(id))
				.filter(Boolean)
				.map((verse) => ({
					bookName: verse.bookName,
					chapterNumber: verse.chapterNumber,
					verseNumber: verse.verseNumber
				}));

			return { title: collection.title, verseRefs };
		})
		: [];

	const payload = {
		type: 'cbm-export',
		version: 4,
		generatedAt: new Date().toISOString(),
		lastExportDate,
		verses: cleaned,
		collections: collectionsExport
	};

	// Include practice data (speed challenge times) if review data is included
	if (shouldIncludePracticeData) {
		payload.practiceData = practiceData;
	}

	if (shouldIncludeAchievementsData) {
		payload.achievementsData = achievementsData;
	}

	if (shouldIncludeProgressHistoryData) {
		payload.progressHistoryData = progressHistoryData;
	}

	if (shouldIncludeStreakData) {
		payload.streakData = streakData;
	}

	return payload;
}

export function mergePracticeData(currentPractice, importedPractice) {
	const current = {
		bestTimes: currentPractice?.bestTimes || {},
		bestVerseTimes: currentPractice?.bestVerseTimes || {}
	};
	const incoming = {
		bestTimes: importedPractice?.bestTimes || {},
		bestVerseTimes: importedPractice?.bestVerseTimes || {}
	};

	const mergedBestTimes = { ...current.bestTimes };
	Object.entries(incoming.bestTimes).forEach(([collectionId, incomingTime]) => {
		const existing = mergedBestTimes[collectionId];
		if (!existing || incomingTime.officialTime < existing.officialTime) {
			mergedBestTimes[collectionId] = incomingTime;
		}
	});

	const mergedBestVerseTimes = { ...current.bestVerseTimes };
	Object.entries(incoming.bestVerseTimes).forEach(([verseId, incomingTime]) => {
		const existing = mergedBestVerseTimes[verseId];
		if (!existing || incomingTime.officialTime < existing.officialTime) {
			mergedBestVerseTimes[verseId] = incomingTime;
		}
	});

	return {
		bestTimes: mergedBestTimes,
		bestVerseTimes: mergedBestVerseTimes
	};
}

export function mergeAchievementsData(currentAchievements, importedAchievements) {
	const currentUnlocked = currentAchievements?.unlocked || {};
	const importedUnlocked = importedAchievements?.unlocked || {};
	const mergedUnlocked = { ...currentUnlocked };

	Object.entries(importedUnlocked).forEach(([achievementId, importedDate]) => {
		const existingDate = mergedUnlocked[achievementId];
		if (!existingDate) {
			mergedUnlocked[achievementId] = importedDate;
			return;
		}

		if (new Date(importedDate) < new Date(existingDate)) {
			mergedUnlocked[achievementId] = importedDate;
		}
	});

	const ordered = [
		...(currentAchievements?.order || []),
		...(importedAchievements?.order || [])
	].filter((value, index, arr) => arr.indexOf(value) === index);

	Object.keys(mergedUnlocked).forEach((id) => {
		if (!ordered.includes(id)) {
			ordered.push(id);
		}
	});

	return {
		unlocked: mergedUnlocked,
		order: ordered
	};
}

export function mergeProgressHistoryData(currentProgressTracking, importedProgressTracking) {
	const currentHistory = Array.isArray(currentProgressTracking?.progressHistory)
		? currentProgressTracking.progressHistory
		: [];
	const importedHistory = Array.isArray(importedProgressTracking?.progressHistory)
		? importedProgressTracking.progressHistory
		: [];

	const currentProgress = currentProgressTracking?.currentProgress || {
		newLearning: 0,
		developing: 0,
		solid: 0,
		mastered: 0
	};

	const importedProgress = importedProgressTracking?.currentProgress || currentProgress;
	const mergedCurrentProgress =
		Object.values(importedProgress).reduce((sum, value) => sum + Number(value || 0), 0) >=
		Object.values(currentProgress).reduce((sum, value) => sum + Number(value || 0), 0)
			? importedProgress
			: currentProgress;

	const mergeKey = (entry) => {
		const kind = entry?.kind === 'week' ? 'week' : 'day';
		if (kind === 'week') {
			return `week:${entry?.weekKey || entry?.weekStart || entry?.date || ''}`;
		}
		return `day:${entry?.date || ''}`;
	};

	const byKey = new Map();
	[...currentHistory, ...importedHistory].forEach((entry) => {
		if (!entry) return;
		const key = mergeKey(entry);
		if (!key || key.endsWith(':')) return;

		const existing = byKey.get(key);
		if (!existing || new Date(entry.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
			byKey.set(key, entry);
		}
	});

	const mergedHistory = applyHybridRetention(Array.from(byKey.values()));

	const currentUpdatedAt = currentProgressTracking?.lastUpdatedAt || null;
	const importedUpdatedAt = importedProgressTracking?.lastUpdatedAt || null;

	return {
		currentProgress: mergedCurrentProgress,
		progressHistory: mergedHistory,
		lastUpdatedAt:
			new Date(importedUpdatedAt || 0) > new Date(currentUpdatedAt || 0)
				? importedUpdatedAt
				: currentUpdatedAt
	};
}

export function mergeStreakData(currentStreak, importedStreak) {
	const current = {
		current: Number(currentStreak?.current || 0),
		best: Number(currentStreak?.best || 0),
		lastActiveDate: currentStreak?.lastActiveDate || null
	};
	const incoming = {
		current: Number(importedStreak?.current || 0),
		best: Number(importedStreak?.best || 0),
		lastActiveDate: importedStreak?.lastActiveDate || null
	};

	const toTime = (dateString) => {
		if (!dateString) return 0;
		const parsed = new Date(dateString);
		return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
	};

	const useIncomingDate = toTime(incoming.lastActiveDate) > toTime(current.lastActiveDate);
	const lastActiveDate = useIncomingDate ? incoming.lastActiveDate : current.lastActiveDate;

	return {
		current: Math.max(current.current, incoming.current),
		best: Math.max(current.best, incoming.best, incoming.current, current.current),
		lastActiveDate: (Math.max(current.current, incoming.current) > 0) ? lastActiveDate : null
	};
}

/**
 * Apply user's conflict resolution choices
 * @param {Array} mergedVerses - The merged verses array
 * @param {Array} conflicts - The conflicts array from mergeVerses
 * @param {Array} resolutions - Array of resolution choices: 'existing', 'imported', or 'both'
 * @returns {Array} Final verses array with conflicts resolved
 */
export function applyConflictResolutions(mergedVerses, conflicts, resolutions) {
	const result = [...mergedVerses];
	
	conflicts.forEach((conflict, i) => {
		const resolution = resolutions[i];
		const { existing, imported, existingIndex } = conflict;
		
		if (resolution === 'imported') {
			// Replace existing with imported
			result[existingIndex] = imported;
		} else if (resolution === 'both') {
			// Keep existing and add imported as new verse
			result.push(imported);
		}
		// If resolution === 'existing', do nothing (keep current state)
	});
	
	return result;
}
