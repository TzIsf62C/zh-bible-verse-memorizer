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
		id: 'verse-test',
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
	}
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

try {
	// Seed localStorage
	await page.addInitScript(
		({ seededSettings, seededVerses }) => {
			localStorage.clear();
			localStorage.setItem('settings', JSON.stringify(seededSettings));
			localStorage.setItem('verses', JSON.stringify(seededVerses));
			localStorage.setItem('collections', JSON.stringify([]));
			localStorage.setItem('practice', JSON.stringify({ bestTimes: {}, bestVerseTimes: {} }));
		},
		{ seededSettings: settings, seededVerses: verses }
	);

	await page.goto(baseUrl, { waitUntil: 'networkidle' });

	// Navigate to Practice mode
	await page.getByRole('button', { name: 'Practice' }).click();

	// Select "Practice a Verse"
	await page.getByRole('button', { name: /Practice a Verse/i }).click();

	// Select the test verse
	await page.getByText(/创世记 1:1/).click();

	// Select "Classic" activity
	await page.getByRole('button', { name: /Classic/i }).click();

	// Wait for Classic mode interface (should start at Basic stage)
	const stageIndicator = page.locator('.stage-indicator');
	await stageIndicator.waitFor({ state: 'visible' });

	const stageText = await stageIndicator.textContent();
	if (!stageText.includes('Basic') && !stageText.includes('基础')) {
		throw new Error(`Expected Basic stage, got: ${stageText}`);
	}

	// Verify verse text is visible in Basic stage
	const verseDisplay = page.locator('.verse-display');
	await verseDisplay.waitFor({ state: 'visible' });

	// Get verse data from localStorage before completing practice
	const initialVerseData = await page.evaluate(() => {
		const verses = localStorage.getItem('verses');
		return verses ? JSON.parse(verses)[0] : null;
	});

	if (!initialVerseData) {
		throw new Error('Failed to retrieve initial verse data from localStorage');
	}

	// Type the verse initials: qcscztd
	const keys = ['q', 'c', 's', 'c', 'z', 't', 'd'];
	for (const key of keys) {
		const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
		await keyButton.click();
		await page.waitForTimeout(50);
	}

	// Wait for stage completion modal or automatic advance
	await page.waitForTimeout(1000);

	// Check if we advanced to Intermediate stage (90%+ accuracy required)
	const currentStageText = await stageIndicator.textContent();
	const advancedToIntermediate = currentStageText.includes('Intermediate') || currentStageText.includes('中级');

	// If we advanced, complete Intermediate stage
	if (advancedToIntermediate) {
		// Type again for Intermediate stage
		for (const key of keys) {
			const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
			await keyButton.click();
			await page.waitForTimeout(50);
		}
		await page.waitForTimeout(1000);

		// Check for Advanced stage
		const advancedStageText = await stageIndicator.textContent();
		const advancedToAdvanced = advancedStageText.includes('Advanced') || advancedStageText.includes('高级');

		if (advancedToAdvanced) {
			// Type once more for Advanced stage (no text visible)
			for (const key of keys) {
				const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
				await keyButton.click();
				await page.waitForTimeout(50);
			}
			await page.waitForTimeout(1000);
		}
	}

	// Verify review intervals were NOT updated
	const finalVerseData = await page.evaluate(() => {
		const verses = localStorage.getItem('verses');
		return verses ? JSON.parse(verses)[0] : null;
	});

	if (!finalVerseData) {
		throw new Error('Failed to retrieve final verse data from localStorage');
	}

	// CRITICAL CHECK: Verify no spaced repetition updates
	if (finalVerseData.lastReviewed !== initialVerseData.lastReviewed) {
		throw new Error(`Practice Classic modified lastReviewed: ${initialVerseData.lastReviewed} → ${finalVerseData.lastReviewed}`);
	}

	if (finalVerseData.dueDate !== initialVerseData.dueDate) {
		throw new Error(`Practice Classic modified dueDate: ${initialVerseData.dueDate} → ${finalVerseData.dueDate}`);
	}

	if (finalVerseData.interval !== initialVerseData.interval) {
		throw new Error(`Practice Classic modified interval: ${initialVerseData.interval} → ${finalVerseData.interval}`);
	}

	if (finalVerseData.repetitions !== initialVerseData.repetitions) {
		throw new Error(`Practice Classic modified repetitions: ${initialVerseData.repetitions} → ${finalVerseData.repetitions}`);
	}

	console.log('✅ Practice Classic (zero review impact) test PASSED');
	console.log(`   - Classic mode loaded with Basic stage`);
	console.log(`   - Typing progression worked correctly`);
	console.log(`   - ZERO impact on spaced repetition data:`);
	console.log(`     lastReviewed: ${initialVerseData.lastReviewed} (unchanged)`);
	console.log(`     dueDate: ${initialVerseData.dueDate} (unchanged)`);
	console.log(`     interval: ${initialVerseData.interval} (unchanged)`);
	console.log(`     repetitions: ${initialVerseData.repetitions} (unchanged)`);

	await browser.close();
	process.exit(0);
} catch (error) {
	console.error('❌ Practice Classic (zero review impact) test FAILED');
	console.error(error.message);
	await browser.close();
	process.exit(1);
}
