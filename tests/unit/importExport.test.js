import { describe, expect, it } from 'vitest';
import { buildExportPayload } from '$lib/utils/importExport.js';

describe('buildExportPayload', () => {
	it('removes learnedDate when review data is excluded from export', () => {
		const verses = [{
			id: 'v1',
			bookName: '馬太福音',
			chapterNumber: 5,
			verseNumber: 1,
			verseText: 'text',
			verseInitials: 'm5v1',
			lastReviewed: '2026-08-27T12:00:00.000Z',
			learnedDate: '2026-08-26T12:00:00.000Z',
			interval: 7,
			repetitions: 2,
			dueDate: '2026-08-30T12:00:00.000Z',
			heatArray: [1, 2, 3],
			categoryHistory: ['reviewed'],
			isLearned: true
		}];

		const payload = buildExportPayload(verses, [], { includeReview: false });

		expect(payload.verses[0]).not.toHaveProperty('lastReviewed');
		expect(payload.verses[0]).not.toHaveProperty('learnedDate');
		expect(payload.verses[0]).not.toHaveProperty('interval');
		expect(payload.verses[0]).not.toHaveProperty('repetitions');
		expect(payload.verses[0]).not.toHaveProperty('dueDate');
		expect(payload.verses[0]).not.toHaveProperty('heatArray');
		expect(payload.verses[0]).not.toHaveProperty('categoryHistory');
		expect(payload.verses[0]).not.toHaveProperty('isLearned');
	});
});
