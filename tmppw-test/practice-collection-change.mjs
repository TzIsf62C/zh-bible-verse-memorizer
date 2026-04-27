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
		id: 'collection-test',
		title: 'Collection Change Test',
		verseIds: ['verse-1', 'verse-2']
	}
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

try {
	// Seed localStorage with existing best time
	await page.addInitScript(
		({ seededSettings, seededVerses, seededCollections }) => {
			localStorage.clear();
			localStorage.setItem('settings', JSON.stringify(seededSettings));
			localStorage.setItem('verses', JSON.stringify(seededVerses));
			localStorage.setItem('collections', JSON.stringify(seededCollections));
			// Pre-existing best time with specific verse IDs
			localStorage.setItem('practice', JSON.stringify({ 
				bestTimes: {
					'collection-test': {
						time: 5000,
						verseIds: ['verse-1', 'verse-2']
					}
				}, 
				bestVerseTimes: {} 
			}));
		},
		{ seededSettings: settings, seededVerses: verses, seededCollections: collections }
	);

	await page.goto(baseUrl, { waitUntil: 'networkidle' });

	// Navigate to Practice mode
	await page.getByRole('button', { name: 'Practice' }).click();

	// Select "Practice a Collection"
	await page.getByRole('button', { name: /Practice a Collection/i }).click();

	// Select the test collection
	await page.getByText('Collection Change Test').click();

	// Select "Speed Challenge" activity
	await page.getByRole('button', { name: /Speed Challenge/i }).click();

	// Wait for Speed Challenge interface
	const timerDisplay = page.locator('.timer-display');
	await timerDisplay.waitFor({ state: 'visible' });

	// Verify best time is displayed (should show 5.000s from our seeded data)
	const bestTimeDisplay = page.locator('.best-time');
	const bestTimeText = await bestTimeDisplay.textContent();
	if (!bestTimeText.includes('5.0')) {
		throw new Error(`Expected best time ~5.0s, got: ${bestTimeText}`);
	}

	console.log('✅ Initial best time loaded: ' + bestTimeText);

	// Exit back to main menu
	const exitButton = page.locator('button').filter({ hasText: '×' });
	await exitButton.click();

	// Navigate to Collections to modify
	await page.getByRole('button', { name: 'Collections' }).click();

	// Find and click the collection
	await page.getByText('Collection Change Test').click();

	// Remove a verse (click the X on verse-1)
	const removeButtons = page.locator('button').filter({ hasText: '×' });
	await removeButtons.first().click();

	// Confirm deletion if modal appears
	try {
		const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Delete/i });
		await confirmButton.click({ timeout: 1000 });
	} catch {
		// No confirmation modal, continue
	}

	// Go back to Practice mode
	const backButton = page.locator('button').filter({ hasText: '←' });
	await backButton.click();

	await page.getByRole('button', { name: 'Practice' }).click();
	await page.getByRole('button', { name: /Practice a Collection/i }).click();
	await page.getByText('Collection Change Test').click();
	await page.getByRole('button', { name: /Speed Challenge/i }).click();

	// Check for "Collection changed" modal
	const modal = page.locator('.modal-overlay');
	const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);

	if (!modalVisible) {
		throw new Error('Expected "Collection changed" modal to appear after modifying collection');
	}

	const modalText = await modal.textContent();
	if (!modalText.includes('changed') && !modalText.includes('reset')) {
		throw new Error(`Modal should mention collection change/reset, got: ${modalText}`);
	}

	// Close modal
	const okButton = page.getByRole('button', { name: /OK|Close|Confirm/i });
	await okButton.click();

	// Verify best time is now reset (should not show previous time)
	await page.waitForTimeout(500);
	const newBestTimeDisplay = page.locator('.best-time');
	const newBestTimeVisible = await newBestTimeDisplay.isVisible({ timeout: 1000 }).catch(() => false);

	// Best time display should either be hidden or show different text (not 5.0s)
	if (newBestTimeVisible) {
		const newBestTimeText = await newBestTimeDisplay.textContent();
		if (newBestTimeText.includes('5.0')) {
			throw new Error('Best time was not reset after collection change');
		}
	}

	// Verify localStorage practice data was updated
	const practiceData = await page.evaluate(() => {
		const data = localStorage.getItem('practice');
		return data ? JSON.parse(data) : null;
	});

	if (practiceData?.bestTimes?.['collection-test']?.time === 5000) {
		throw new Error('localStorage still contains old best time after collection change');
	}

	console.log('✅ Practice Collection Change Detection test PASSED');
	console.log(`   - Initial best time loaded: 5.000s`);
	console.log(`   - Collection modified (verse removed)`);
	console.log(`   - "Collection changed" modal displayed`);
	console.log(`   - Best time reset correctly`);

	await browser.close();
	process.exit(0);
} catch (error) {
	console.error('❌ Practice Collection Change Detection test FAILED');
	console.error(error.message);
	await browser.close();
	process.exit(1);
}
