import { calculateHeatScore, transformHeatScore } from '$lib/utils/heatTracking';

export const NEEDS_PRACTICE_COLLECTION_ID = '__needs_practice__';

function clampThreshold(value, fallback) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return Math.max(0, Math.min(99, parsed));
}

export function normalizeNeedsPracticeThresholds(settings = {}) {
	const includeBelow = clampThreshold(settings.needsPracticeIncludeBelow, 80);
	const ignoreAbove = Math.max(clampThreshold(settings.needsPracticeIgnoreAbove, 94), includeBelow);

	return {
		includeBelow,
		ignoreAbove
	};
}

export function getDisplayedHeatScore(verse) {
	if (!verse?.heatArray || verse.heatArray.length === 0) {
		return null;
	}

	const rawScore = calculateHeatScore(verse.heatArray);
	return transformHeatScore(rawScore);
}

export function buildNeedsPracticeCollection(verses = [], settings = {}, title = 'Needs Practice') {
	const { includeBelow, ignoreAbove } = normalizeNeedsPracticeThresholds(settings);

	const eligibleVerses = verses
		.map((verse) => ({
			verse,
			displayedScore: getDisplayedHeatScore(verse)
		}))
		.filter((entry) => entry.displayedScore !== null && entry.displayedScore <= ignoreAbove)
		.sort((a, b) => {
			if (a.displayedScore !== b.displayedScore) {
				return a.displayedScore - b.displayedScore;
			}
			return String(a.verse.id).localeCompare(String(b.verse.id));
		});

	if (eligibleVerses.length === 0) {
		return {
			id: NEEDS_PRACTICE_COLLECTION_ID,
			title,
			verseIds: [],
			isComputed: true,
			readOnly: true
		};
	}

	const belowThresholdIds = new Set(
		eligibleVerses
			.filter((entry) => entry.displayedScore < includeBelow)
			.map((entry) => entry.verse.id)
	);

	const lowestCount = Math.min(5, eligibleVerses.length);
	const lowestCutoffScore = eligibleVerses[lowestCount - 1]?.displayedScore;
	const fallbackIds = new Set(
		eligibleVerses
			.filter((entry) => entry.displayedScore <= lowestCutoffScore)
			.map((entry) => entry.verse.id)
	);

	const finalIds = eligibleVerses
		.map((entry) => entry.verse.id)
		.filter((id) => belowThresholdIds.has(id) || fallbackIds.has(id));

	return {
		id: NEEDS_PRACTICE_COLLECTION_ID,
		title,
		verseIds: finalIds,
		isComputed: true,
		readOnly: true
	};
}

export function findCollectionById(collections = [], needsPracticeCollection, id) {
	if (!id) return null;
	if (id === NEEDS_PRACTICE_COLLECTION_ID) return needsPracticeCollection;
	return collections.find((collection) => collection.id === id) || null;
}
