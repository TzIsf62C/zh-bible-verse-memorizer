import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SpeedChallengeCollection from '$lib/components/SpeedChallengeCollection.svelte';
import { settings } from '$lib/stores/settings.js';
import { practice } from '$lib/stores/practice.js';

const collection = {
	id: 'collection-1',
	title: 'Test Collection',
	verseIds: ['verse-1', 'verse-2']
};

const verses = [
	{
		id: 'verse-1',
		verseText: '起初神创造天地',
		bookName: '创世记',
		chapterNumber: 1,
		verseNumber: 1,
		verseInitials: 'qcscztd',
		bookInitials: 'csj',
		bibleVersion: 'CUV'
	},
	{
		id: 'verse-2',
		verseText: '地是空虚混沌',
		bookName: '创世记',
		chapterNumber: 1,
		verseNumber: 2,
		verseInitials: 'dskxhd',
		bookInitials: 'csj',
		bibleVersion: 'CUV'
	}
];

beforeEach(() => {
	settings.set({
		languagePreference: 'english',
		inputMethod: 'pinyin',
		themePreference: 'light',
		bookNameCharset: 'simplified',
		defaultBibleVersion: '',
		vibrationEnabled: false,
		buzzerEnabled: false,
		backupReminderEnabled: true,
		textSizePreference: 1,
		needsPracticeIncludeBelow: 80,
		needsPracticeIgnoreAbove: 94,
		hasCompletedOnboarding: true
	});

	practice.set({ bestTimes: {}, bestVerseTimes: {} });
});

describe('SpeedChallengeCollection component behavior', () => {
	it('hides unrevealed verse text at initial render while keeping initial reference visible', () => {
		const { container } = render(SpeedChallengeCollection, { props: { collection, verses } });
		const passageDisplay = container.querySelector('.passage-display');
		expect(passageDisplay).toBeTruthy();

		const hiddenChars = passageDisplay.querySelectorAll('.verse-character.hidden');
		expect(hiddenChars.length).toBeGreaterThan(0);

		const visibleText = passageDisplay.textContent || '';
		expect(visibleText).toContain('创世记 1:1');
	});

	it('scrolls back to top on retry', async () => {
		const scrollToSpy = vi.fn();
		window.scrollTo = scrollToSpy;

		const { container } = render(SpeedChallengeCollection, { props: { collection, verses } });
		const speedContainer = container.querySelector('.speed-challenge-container');
		const passageDisplay = container.querySelector('.passage-display');
		expect(speedContainer).toBeTruthy();
		expect(passageDisplay).toBeTruthy();

		Object.defineProperty(speedContainer, 'scrollTo', {
			value: vi.fn(),
			configurable: true
		});
		speedContainer.scrollTop = 160;

		Object.defineProperty(passageDisplay, 'scrollTo', {
			value: vi.fn(),
			configurable: true
		});
		passageDisplay.scrollTop = 240;

		const retryButton = container.querySelector('.retry-fab');
		expect(retryButton).toBeTruthy();
		await fireEvent.click(retryButton);

		expect(speedContainer.scrollTop).toBe(0);
		expect(speedContainer.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
		expect(passageDisplay.scrollTop).toBe(0);
		expect(passageDisplay.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
	});

	it('hides keyboard when finish modal is displayed', async () => {
		const { container } = render(SpeedChallengeCollection, { props: { collection, verses } });

		const expectedKeys = [...(verses[0].verseInitials + verses[1].verseInitials)];
		for (const key of expectedKeys) {
			const keyButton = Array.from(container.querySelectorAll('.keyboard button')).find(
				(button) => (button.textContent || '').trim().toLowerCase() === key
			);
			expect(keyButton).toBeTruthy();
			await fireEvent.click(keyButton);
		}

		expect(container.querySelector('.modal-overlay')).toBeTruthy();
		expect(container.querySelector('.keyboard-space')).toBeNull();
	});
});
