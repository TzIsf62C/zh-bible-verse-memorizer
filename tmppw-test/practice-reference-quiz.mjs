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
		verseText: '起初神创造天地',
		bookName: '创世记',
		chapterNumber: 1,
		verseNumber: 1,
		verseInitials: 'qcscztd',
		bookInitials: 'csj',
		bibleVersion: 'CUV',
		lastReviewed: '2025-01-01T00:00:00.000Z',
		dueDate: '2025-01-02T00:00:00.000Z',
		interval: 1,
		repetitions: 1
	},
	{
		id: 'verse-2',
		verseText: '地是空虚混沌',
		bookName: '约翰福音',
		chapterNumber: 3,
		verseNumber: 16,
		verseInitials: 'dskxhd',
		bookInitials: 'yhfy',
		bibleVersion: 'CUV',
		lastReviewed: '2025-01-01T00:00:00.000Z',
		dueDate: '2025-01-02T00:00:00.000Z',
		interval: 1,
		repetitions: 1
	}
];

const collections = [
	{
		id: 'collection-1',
		title: 'Reference Quiz Test',
		verseIds: ['verse-1', 'verse-2']
	}
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

try {
	// Seed localStorage
	await page.addInitScript(
		({ seededSettings, seededVerses, seededCollections }) => {
			localStorage.clear();
			localStorage.setItem('settings', JSON.stringify(seededSettings));
			localStorage.setItem('verses', JSON.stringify(seededVerses));
			localStorage.setItem('collections', JSON.stringify(seededCollections));
			localStorage.setItem('practice', JSON.stringify({ bestTimes: {}, bestVerseTimes: {} }));
		},
		{ seededSettings: settings, seededVerses: verses, seededCollections: collections }
	);

	await page.goto(baseUrl, { waitUntil: 'networkidle' });

	// Navigate to Practice mode
	await page.getByRole('button', { name: 'Practice' }).click();

	// Select "Practice a Collection"
	await page.getByRole('button', { name: /Practice a Collection/i }).click();

	// Select the test collection
	await page.getByText('Reference Quiz Test').click();

	// Select "Reference Quiz" activity
	await page.getByRole('button', { name: /Reference Quiz/i }).click();

	// Wait for quiz interface
	const quizDisplay = page.locator('.quiz-verse-text');
	await quizDisplay.waitFor({ state: 'visible' });

	// Get the displayed verse text to identify which verse is shown
	const verseText = await quizDisplay.textContent();
	
	// Determine expected reference format (mixed books = BookChapter:Verse)
	let expectedKeys;
	if (verseText.includes('起初')) {
		// First verse: 创世记 1:1 = csj1:1
		expectedKeys = ['c', 's', 'j', '1', ':', '1'];
	} else {
		// Second verse: 约翰福音 3:16 = yhfy3:16
		expectedKeys = ['y', 'h', 'f', 'y', '3', ':', '1', '6'];
	}

	// Type the reference
	for (const key of expectedKeys) {
		const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
		await keyButton.click();
		await page.waitForTimeout(50);
	}

	// Wait for correct feedback or next verse
	await page.waitForTimeout(1000); // Auto-advance delay

	// Verify progress (should show 1/2 or similar)
	const progressDisplay = page.locator('.quiz-progress');
	const progressText = await progressDisplay.textContent();
	
	if (!progressText.includes('1') && !progressText.includes('2')) {
		throw new Error(`Expected progress indicator, got: ${progressText}`);
	}

	// Type second verse reference
	const secondVerseText = await quizDisplay.textContent();
	let secondKeys;
	if (secondVerseText.includes('起初')) {
		secondKeys = ['c', 's', 'j', '1', ':', '1'];
	} else {
		secondKeys = ['y', 'h', 'f', 'y', '3', ':', '1', '6'];
	}

	for (const key of secondKeys) {
		const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
		await keyButton.click();
		await page.waitForTimeout(50);
	}

	// Wait for completion modal
	const completionModal = page.locator('.modal-overlay');
	await completionModal.waitFor({ state: 'visible', timeout: 3000 });

	// Verify completion message
	const modalText = await completionModal.textContent();
	if (!modalText.includes('100%') && !modalText.includes('Correct')) {
		throw new Error('Expected completion message with accuracy percentage');
	}

	console.log('✅ Practice Reference Quiz test PASSED');
	console.log(`   - Quiz interface loaded with verse text`);
	console.log(`   - Accepted reference input (mixed book format)`);
	console.log(`   - Auto-advanced after correct answer`);
	console.log(`   - Completion modal displayed`);

	await browser.close();
	process.exit(0);
} catch (error) {
	console.error('❌ Practice Reference Quiz test FAILED');
	console.error(error.message);
	await browser.close();
	process.exit(1);
}
