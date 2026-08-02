import { chromium } from 'playwright';

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:4173';

const settings = {
	languagePreference: 'english',
	inputMethod: 'pinyin',
	themePreference: 'light',
	bookNameCharset: 'simplified',
	defaultBibleVersion: '',
	vibrationEnabled: false,
	buzzerEnabled: false,
	backupReminderEnabled: true,
	textSizePreference: 1
};

const verses = [
	{
		id: 'verse-1',
		verseText: '阿们。',
		bookName: '约翰福音',
		chapterNumber: 1,
		verseNumber: 1,
		verseInitials: 'am',
		bookInitials: 'yhfy',
		bibleVersion: 'CUV',
		lastReviewed: '2026-04-01T00:00:00.000Z',
		dueDate: '2026-04-02T00:00:00.000Z',
		interval: 1,
		repetitions: 1
	},
	{
		id: 'verse-2',
		verseText: '和平。',
		bookName: '约翰福音',
		chapterNumber: 1,
		verseNumber: 2,
		verseInitials: 'hp',
		bookInitials: 'yhfy',
		bibleVersion: 'CUV',
		lastReviewed: '2026-04-01T00:00:00.000Z',
		dueDate: '2026-04-02T00:00:00.000Z',
		interval: 1,
		repetitions: 1
	}
];

async function measureWidth(locator) {
	return locator.evaluate((element) => {
		const { width } = element.getBoundingClientRect();
		return Math.round(width * 100) / 100;
	});
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

try {
	await page.addInitScript(
		({ seededSettings, seededVerses }) => {
			localStorage.clear();
			localStorage.setItem('settings', JSON.stringify(seededSettings));
			localStorage.setItem('verses', JSON.stringify(seededVerses));
			localStorage.setItem('collections', JSON.stringify([]));
		},
		{ seededSettings: settings, seededVerses: verses }
	);

	await page.goto(baseUrl, { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: 'Review' }).click();
	await page.getByRole('button', { name: /Review Due Verses/i }).click();
	await page.getByRole('button', { name: /Review as a single text/i }).click();

	const reviewContainer = page.locator('.single-text-review');
	const passageDisplay = page.locator('.single-text-review .passage-display');
	const firstKey = page.locator('.keyboard').getByRole('button', { name: 'a' }).first();

	await reviewContainer.waitFor({ state: 'visible' });
	await firstKey.waitFor({ state: 'visible' });

	const initialContainerWidth = await measureWidth(reviewContainer);
	const initialPassageWidth = await measureWidth(passageDisplay);

	if (initialContainerWidth < 700) {
		throw new Error(`Single-text review container loaded too narrow: ${initialContainerWidth}px`);
	}

	await firstKey.click();
	await page.waitForFunction(
		() => document.querySelectorAll('.single-text-review .verse-character.correct, .single-text-review .verse-character.incorrect').length > 0
	);

	const postInputContainerWidth = await measureWidth(reviewContainer);
	const postInputPassageWidth = await measureWidth(passageDisplay);

	if (Math.abs(postInputContainerWidth - initialContainerWidth) > 2) {
		throw new Error(
			`Single-text review container width changed after first input: ${initialContainerWidth}px -> ${postInputContainerWidth}px`
		);
	}

	if (Math.abs(postInputPassageWidth - initialPassageWidth) > 2) {
		throw new Error(
			`Passage display width changed after first input: ${initialPassageWidth}px -> ${postInputPassageWidth}px`
		);
	}

	console.log('Single-text review width is stable.');
	console.log(`Container width: ${initialContainerWidth}px -> ${postInputContainerWidth}px`);
	console.log(`Passage width: ${initialPassageWidth}px -> ${postInputPassageWidth}px`);
} finally {
	await page.close();
	await browser.close();
}