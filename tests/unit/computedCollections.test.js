import { describe, expect, it } from 'vitest';
import {
	buildNeedsPracticeCollection,
	getDisplayedHeatScore,
	normalizeNeedsPracticeThresholds,
	NEEDS_PRACTICE_COLLECTION_ID
} from '$lib/utils/computedCollections.js';

function verse(id, rawScore) {
	return {
		id,
		heatArray: rawScore === null ? null : [rawScore]
	};
}

describe('computed collections', () => {
	it('normalizes threshold values and enforces include <= ignore', () => {
		expect(normalizeNeedsPracticeThresholds({
			needsPracticeIncludeBelow: 110,
			needsPracticeIgnoreAbove: -10
		})).toEqual({ includeBelow: 99, ignoreAbove: 99 });

		expect(normalizeNeedsPracticeThresholds({
			needsPracticeIncludeBelow: 70,
			needsPracticeIgnoreAbove: 80
		})).toEqual({ includeBelow: 70, ignoreAbove: 80 });
	});

	it('excludes verses above ignore threshold and with no heat data', () => {
		const verses = [
			verse('no-heat', null),
			verse('very-high', 99),
			verse('mid', 70)
		];

		const collection = buildNeedsPracticeCollection(
			verses,
			{ needsPracticeIncludeBelow: 80, needsPracticeIgnoreAbove: 94 },
			'Needs Practice'
		);

		expect(collection.id).toBe(NEEDS_PRACTICE_COLLECTION_ID);
		expect(collection.readOnly).toBe(true);
		expect(collection.isComputed).toBe(true);
		expect(collection.verseIds).toContain('mid');
		expect(collection.verseIds).not.toContain('no-heat');
		expect(collection.verseIds).not.toContain('very-high');
	});

	it('includes all verses below include-threshold when that set is larger than fallback', () => {
		const verses = [
			verse('a', 50),
			verse('b', 55),
			verse('c', 60),
			verse('d', 65),
			verse('e', 70),
			verse('f', 75),
			verse('g', 80)
		];

		const includeBelow = 90;
		const collection = buildNeedsPracticeCollection(
			verses,
			{ needsPracticeIncludeBelow: includeBelow, needsPracticeIgnoreAbove: 94 },
			'Needs Practice'
		);

		const expectedIds = verses
			.filter((entry) => getDisplayedHeatScore(entry) < includeBelow)
			.map((entry) => entry.id);

		expect(collection.verseIds).toEqual(expectedIds);
		expect(collection.verseIds.length).toBeGreaterThanOrEqual(5);
	});

	it('applies lowest-five fallback and includes ties at the boundary', () => {
		const verses = [
			verse('a', 50),
			verse('b', 55),
			verse('c', 60),
			verse('d', 65),
			verse('e', 70),
			verse('f', 70),
			verse('g', 75),
			verse('ignored', 99)
		];

		const collection = buildNeedsPracticeCollection(
			verses,
			{ needsPracticeIncludeBelow: 10, needsPracticeIgnoreAbove: 94 },
			'Needs Practice'
		);

		expect(collection.verseIds).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
		expect(collection.verseIds).not.toContain('ignored');
	});
});
