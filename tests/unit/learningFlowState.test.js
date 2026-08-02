import { describe, expect, it } from 'vitest';
import { resolveCurrentVerse } from '$lib/utils/learningFlowState.js';

describe('resolveCurrentVerse', () => {
	const verses = [
		{ id: 'v1', verseText: 'A' },
		{ id: 'v2', verseText: 'B' }
	];

	it('returns null for invalid list', () => {
		expect(resolveCurrentVerse(null, 0)).toBeNull();
		expect(resolveCurrentVerse([], 0)).toBeNull();
	});

	it('returns null for invalid index', () => {
		expect(resolveCurrentVerse(verses, -1)).toBeNull();
		expect(resolveCurrentVerse(verses, 2)).toBeNull();
		expect(resolveCurrentVerse(verses, 'abc')).toBeNull();
	});

	it('normalizes numeric string index and returns verse', () => {
		expect(resolveCurrentVerse(verses, '0')).toEqual(verses[0]);
		expect(resolveCurrentVerse(verses, 1)).toEqual(verses[1]);
	});
});
