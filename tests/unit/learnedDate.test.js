import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeNewStarts, getNewStartVerses } from '$lib/utils/learnedDate.js';

const now = new Date('2026-08-27T12:00:00.000Z');

const originalDateNow = Date.now;

function buildVerse(overrides = {}) {
	return {
		id: 'verse-1',
		bookName: '馬太福音',
		chapterNumber: 5,
		verseNumber: 1,
		...overrides
	};
}

describe('learnedDate', () => {
	beforeEach(() => {
		Date.now = () => now.getTime();
	});

	afterEach(() => {
		Date.now = originalDateNow;
	});

	describe('computeNewStarts', () => {
		it('counts verses whose learnedDate is inside the range', () => {
			const verses = [
				buildVerse({ id: 'v1', learnedDate: '2026-08-26T12:00:00.000Z' }),
				buildVerse({ id: 'v2', learnedDate: '2026-08-20T12:00:00.000Z' }),
				buildVerse({ id: 'v3', learnedDate: '2026-08-27T12:00:00.000Z' })
			];
			const rangeStart = new Date('2026-08-20T00:00:00.000Z');
			const rangeEnd = new Date('2026-08-28T00:00:00.000Z');

			expect(computeNewStarts(verses, rangeStart, rangeEnd)).toBe(3);
		});

		it('uses inclusive start and exclusive end', () => {
			const verses = [
				buildVerse({ id: 'v1', learnedDate: '2026-08-20T00:00:00.000Z' }),
				buildVerse({ id: 'v2', learnedDate: '2026-08-27T12:00:00.000Z' }),
				buildVerse({ id: 'v3', learnedDate: '2026-08-28T00:00:00.000Z' })
			];
			const rangeStart = new Date('2026-08-20T00:00:00.000Z');
			const rangeEnd = new Date('2026-08-28T00:00:00.000Z');

			expect(computeNewStarts(verses, rangeStart, rangeEnd)).toBe(2);
		});

		it('ignores verses with no learnedDate', () => {
			const verses = [
				buildVerse({ id: 'v1', learnedDate: '2026-08-26T12:00:00.000Z' }),
				buildVerse({ id: 'v2' }),
				buildVerse({ id: 'v3', learnedDate: null })
			];
			const rangeStart = new Date('2026-08-20T00:00:00.000Z');
			const rangeEnd = new Date('2026-08-28T00:00:00.000Z');

			expect(computeNewStarts(verses, rangeStart, rangeEnd)).toBe(1);
		});

		it('ignores future learnedDate values', () => {
			const verses = [
				buildVerse({ id: 'v1', learnedDate: '2026-08-26T12:00:00.000Z' }),
				buildVerse({ id: 'v2', learnedDate: '2026-09-01T12:00:00.000Z' })
			];
			const rangeStart = new Date('2026-08-20T00:00:00.000Z');
			const rangeEnd = new Date('2026-09-05T00:00:00.000Z');

			expect(computeNewStarts(verses, rangeStart, rangeEnd)).toBe(1);
		});

		it('returns 0 for invalid range boundaries', () => {
			const verses = [buildVerse({ id: 'v1', learnedDate: '2026-08-26T12:00:00.000Z' })];

			expect(computeNewStarts(verses, null, now)).toBe(0);
			expect(computeNewStarts(verses, now, null)).toBe(0);
		});

		it('handles non-array input gracefully', () => {
			const rangeStart = new Date('2026-08-20T00:00:00.000Z');
			const rangeEnd = new Date('2026-08-28T00:00:00.000Z');

			expect(computeNewStarts(null, rangeStart, rangeEnd)).toBe(0);
			expect(computeNewStarts(undefined, rangeStart, rangeEnd)).toBe(0);
		});
	});

	describe('getNewStartVerses', () => {
		it('returns sorted verses whose learnedDate is inside the range', () => {
			const verses = [
				buildVerse({ id: 'v1', bookName: '約翰福音', chapterNumber: 1, verseNumber: 1, learnedDate: '2026-08-26T12:00:00.000Z' }),
				buildVerse({ id: 'v2', bookName: '馬太福音', chapterNumber: 5, verseNumber: 3, learnedDate: '2026-08-25T12:00:00.000Z' }),
				buildVerse({ id: 'v3', bookName: '馬太福音', chapterNumber: 5, verseNumber: 1, learnedDate: '2026-08-27T12:00:00.000Z' })
			];
			const rangeStart = new Date('2026-08-20T00:00:00.000Z');
			const rangeEnd = new Date('2026-08-28T00:00:00.000Z');

			const result = getNewStartVerses(verses, rangeStart, rangeEnd);
			expect(result.map((v) => v.id)).toEqual(['v3', 'v2', 'v1']);
		});

		it('ignores verses outside the range and without learnedDate', () => {
			const verses = [
				buildVerse({ id: 'v1', learnedDate: '2026-08-15T12:00:00.000Z' }),
				buildVerse({ id: 'v2', learnedDate: '2026-08-26T12:00:00.000Z' }),
				buildVerse({ id: 'v3' })
			];
			const rangeStart = new Date('2026-08-20T00:00:00.000Z');
			const rangeEnd = new Date('2026-08-28T00:00:00.000Z');

			const result = getNewStartVerses(verses, rangeStart, rangeEnd);
			expect(result.map((v) => v.id)).toEqual(['v2']);
		});
	});
});
