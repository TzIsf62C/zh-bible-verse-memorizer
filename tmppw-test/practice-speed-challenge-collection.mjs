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
		bookName: '创世记',
		chapterNumber: 1,
		verseNumber: 2,
		verseInitials: 'dskxhd',
		bookInitials: 'csj',
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
		title: 'Test Collection',
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
	await page.getByText('Test Collection').click();

	// Select "Speed Challenge" activity
	await page.getByRole('button', { name: /Speed Challenge/i }).click();

	// Wait for Speed Challenge interface
	const timerDisplay = page.locator('.timer-display');
	await timerDisplay.waitFor({ state: 'visible' });

	// Verify timer starts at 0
	const initialTimerText = await timerDisplay.textContent();
	if (!initialTimerText.includes('0.0')) {
		throw new Error(`Timer should start at 0, got: ${initialTimerText}`);
	}

	// Type first character to start timer
	const firstKey = page.locator('.keyboard').getByRole('button', { name: 'c' }).first();
	await firstKey.click();

	// Wait for timer to start (should show non-zero value)
	await page.waitForTimeout(100);
	const runningTimerText = await timerDisplay.textContent();
	if (runningTimerText === initialTimerText) {
		throw new Error('Timer did not start after first keystroke');
	}

	// Type correct sequence: csj (bookInitials) + 1:1 + qcscztd (verseInitials)
	const keys = ['s', 'j', '1', ':', '1', 'q', 'c', 's', 'c', 'z', 't', 'd'];
	for (const key of keys) {
		const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
		await keyButton.click();
		await page.waitForTimeout(50);
	}

	// Type second verse: csj (bookInitials) + 1:2 + dskxhd (verseInitials)
	const keys2 = ['c', 's', 'j', '1', ':', '2', 'd', 's', 'k', 'x', 'h', 'd'];
	for (const key of keys2) {
		const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
		await keyButton.click();
		await page.waitForTimeout(50);
	}

	// Wait for completion modal
	const completionModal = page.locator('.modal-overlay');
	await completionModal.waitFor({ state: 'visible', timeout: 5000 });

	// Verify completion modal shows results
	const modalText = await completionModal.textContent();
	if (!modalText.includes('Raw Time') || !modalText.includes('Official Time')) {
		throw new Error('Completion modal missing time information');
	}

	// Verify "New Best!" appears (first attempt)
	if (!modalText.includes('New Best!')) {
		throw new Error('Expected "New Best!" message on first completion');
	}

	// Verify best time was saved to localStorage
	const practiceData = await page.evaluate(() => {
		const data = localStorage.getItem('practice');
		return data ? JSON.parse(data) : null;
	});

	if (!practiceData || !practiceData.bestTimes || !practiceData.bestTimes['collection-1']) {
		throw new Error('Best time not saved to localStorage');
	}

	console.log('✅ Practice Speed Challenge Collection test PASSED');
	console.log(`   - Timer started on first keystroke`);
	console.log(`   - Completion modal displayed`);
	console.log(`   - Best time saved: ${practiceData.bestTimes['collection-1']}ms`);

	await browser.close();
	process.exit(0);
} catch (error) {
	console.error('❌ Practice Speed Challenge Collection test FAILED');
	console.error(error.message);
	await browser.close();
	process.exit(1);
}
