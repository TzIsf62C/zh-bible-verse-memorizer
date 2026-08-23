import { describe, expect, it } from 'vitest';
import {
	appendCategoryHistory,
	applyManualCorrection,
	computeCategoryChangeStats,
	getCurrentCategory,
	shouldTreatManualEditAsReview
} from '$lib/utils/categoryHistory.js';

const now = new Date('2026-08-22T12:00:00.000Z');

function reviewedVerse(overrides = {}) {
	return {
		id: 'verse-1',
		isLearned: true,
		lastReviewed: '2026-08-20T12:00:00.000Z',
		interval: 15,
		...overrides
	};
}

describe('category history', () => {
	it('records the first review from an unreviewed verse', () => {
		const history = appendCategoryHistory({ id: 'verse-1' }, 1, now);

		expect(history).toEqual([{
			at: now.toISOString(),
			from: null,
			to: 'newLearning',
			interval: 1
		}]);
	});

	it('does not record a review that stays in the same category', () => {
		const verse = reviewedVerse({ interval: 15 });
		const history = [{
			at: '2026-08-20T12:00:00.000Z',
			from: 'newLearning',
			to: 'developing',
			interval: 12
		}];

		expect(appendCategoryHistory({ ...verse, categoryHistory: history }, 20, now)).toBe(history);
	});

	it('uses the latest history category before falling back to the current interval', () => {
		expect(getCurrentCategory(reviewedVerse())).toBe('developing');
		expect(getCurrentCategory(reviewedVerse({
		interval: 1,
		categoryHistory: [{ from: 'developing', to: 'solid', interval: 25, at: now.toISOString() }]
	}))).toBe('solid');
		expect(getCurrentCategory({})).toBeNull();
	});

	it('prunes entries older than 30 days when appending', () => {
		const history = [{
			at: '2026-07-20T11:59:59.000Z',
			from: 'newLearning',
			to: 'developing',
			interval: 8
		}];
		const result = appendCategoryHistory(reviewedVerse({ categoryHistory: history }), 25, now);

		expect(result).toHaveLength(1);
		expect(result[0].to).toBe('solid');
	});

	it('recognizes only recent new-learning regressions as correction candidates', () => {
		const verse = reviewedVerse({ categoryHistory: [{
			at: '2026-08-22T11:30:00.000Z',
			from: 'developing',
			to: 'newLearning',
			interval: 1
		}] });
		expect(shouldTreatManualEditAsReview(verse, now)).toBe(true);
		expect(shouldTreatManualEditAsReview(verse, new Date('2026-08-22T13:01:00.000Z'))).toBe(false);
		expect(shouldTreatManualEditAsReview(reviewedVerse(), now)).toBe(false);
	});

	it('collapses a typo regression into a direct category transition', () => {
		const verse = reviewedVerse({ categoryHistory: [{
			at: '2026-08-22T11:30:00.000Z',
			from: 'developing',
			to: 'newLearning',
			interval: 1
		}] });
		const result = applyManualCorrection(verse, 30, now);

		expect(result).toEqual([{
			at: now.toISOString(),
			from: 'developing',
			to: 'solid',
			interval: 30
		}]);
	});

	it('removes a typo regression without recording a no-op correction', () => {
		const verse = reviewedVerse({ categoryHistory: [{
			at: '2026-08-22T11:30:00.000Z',
			from: 'developing',
			to: 'newLearning',
			interval: 1
		}] });
		expect(applyManualCorrection(verse, 20, now)).toEqual([]);
	});

	it('aggregates gained and lost verses inside the selected period', () => {
		const stats = computeCategoryChangeStats([
			{
				id: 'verse-1',
				bookName: 'Matthew',
				chapterNumber: 5,
				verseNumber: 33,
				categoryHistory: [{
					at: '2026-08-22T10:00:00.000Z',
					from: 'developing',
					to: 'solid',
					interval: 25
				}]
			}
		], new Date('2026-08-22T00:00:00.000Z'), now);

		expect(stats.developing.lost[0].verseId).toBe('verse-1');
		expect(stats.solid.gained[0].bookName).toBe('Matthew');
		expect(stats.developing.net).toBe(-1);
		expect(stats.solid.net).toBe(1);
	});
});
