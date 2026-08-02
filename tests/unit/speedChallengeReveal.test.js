import { describe, expect, it } from 'vitest';
import { shouldRevealPunctuationAtIndex } from '$lib/utils/speedChallengeReveal.js';

describe('shouldRevealPunctuationAtIndex', () => {
	it('reveals initial punctuation before any input', () => {
		const map = [null, null, 0, 1, null];

		expect(shouldRevealPunctuationAtIndex(map, 0, 0)).toBe(true);
		expect(shouldRevealPunctuationAtIndex(map, 1, 0)).toBe(true);
	});

	it('hides punctuation after an input character until that character is typed', () => {
		const map = [null, 0, null, 1, null];

		expect(shouldRevealPunctuationAtIndex(map, 2, 0)).toBe(false);
		expect(shouldRevealPunctuationAtIndex(map, 2, 1)).toBe(true);
	});

	it('returns false for non-punctuation slots and invalid indexes', () => {
		const map = [null, 0, null];

		expect(shouldRevealPunctuationAtIndex(map, 1, 1)).toBe(false);
		expect(shouldRevealPunctuationAtIndex(map, -1, 1)).toBe(false);
		expect(shouldRevealPunctuationAtIndex(map, 99, 1)).toBe(false);
		expect(shouldRevealPunctuationAtIndex(null, 0, 0)).toBe(false);
	});
});
