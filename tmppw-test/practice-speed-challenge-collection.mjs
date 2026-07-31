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
const consoleErrors = [];
const failedRequests = [];
const pageErrors = [];

page.on('console', (msg) => {
	if (msg.type() === 'error') {
		consoleErrors.push(msg.text());
	}
});
page.on('requestfailed', (req) => {
	failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText || 'failed'}`);
});
page.on('pageerror', (err) => {
	pageErrors.push(err.message);
});

try {
	// Seed localStorage
	await page.addInitScript(
		({ seededSettings, seededVerses, seededCollections }) => {
			localStorage.clear();
			localStorage.setItem('settings', JSON.stringify(seededSettings));
			localStorage.setItem('verses', JSON.stringify(seededVerses));
			localStorage.setItem('collections', JSON.stringify(seededCollections));
			localStorage.setItem('practice', JSON.stringify({ bestTimes: {}, bestVerseTimes: {} }));
			localStorage.setItem('firstBackupReminder', String(Date.now()));
			localStorage.setItem('lastBackupReminder', String(Date.now()));
		},
		{ seededSettings: settings, seededVerses: verses, seededCollections: collections }
	);

	await page.goto(baseUrl, { waitUntil: 'networkidle' });

	// Dismiss any first-run reminder overlay if present
	const gotItButton = page.getByRole('button', { name: /Got it/i });
	if (await gotItButton.count()) {
		await gotItButton.first().click();
	}

	// Navigate to Practice mode
	await page.getByRole('button', { name: 'Practice' }).click();

	// Select "Practice a Collection"
	await page.getByRole('button', { name: /Practice a Collection/i }).click();

	// Select the test collection
	await page.getByText('Test Collection').click();

	// Confirm selected collection and continue to activity choices
	await page.getByRole('button', { name: /^Next$/i }).click();

	// Select "Speed Challenge" activity
	await page.getByRole('button', { name: /Speed Challenge/i }).click();

	// Wait for Speed Challenge interface
	const timerDisplay = page.locator('.timer-value');
	await timerDisplay.waitFor({ state: 'visible' });

	// Verify initial reveal state: first reference visible, verse text still hidden
	const passageDisplay = page.locator('.passage-display');
	await passageDisplay.waitFor({ state: 'visible' });
	const hiddenCharactersAtStart = await passageDisplay.locator('.verse-character.hidden').count();
	if (hiddenCharactersAtStart < 1) {
		await page.screenshot({ path: 'tmppw-test/speed-challenge-collection-initial-visibility-failure.png', fullPage: true });
		throw new Error('Expected hidden verse characters at start, but full passage appears visible');
	}

	const passageTextAtStart = (await passageDisplay.textContent()) || '';
	if (!passageTextAtStart.includes('创世记 1:1')) {
		await page.screenshot({ path: 'tmppw-test/speed-challenge-collection-reference-failure.png', fullPage: true });
		throw new Error(`Expected first verse reference to be visible at start, got: ${passageTextAtStart}`);
	}

	// Verify timer starts at 0
	const initialTimerText = await timerDisplay.textContent();
	if (!initialTimerText.includes('0.0')) {
		throw new Error(`Timer should start at 0, got: ${initialTimerText}`);
	}

	// Type first character to start timer
	const firstKey = page.locator('.keyboard').getByRole('button', { name: 'q' }).first();
	await firstKey.click();

	// Wait for timer to start (should show non-zero value)
	await page.waitForTimeout(100);
	const runningTimerText = await timerDisplay.textContent();
	if (runningTimerText === initialTimerText) {
		throw new Error('Timer did not start after first keystroke');
	}

	// Move scroll position then verify retry returns to top
	await page.evaluate(() => {
		const passage = document.querySelector('.passage-display');
		const container = document.querySelector('.speed-challenge-container');
		if (passage) {
			passage.scrollTop = 300;
		}
		if (container) {
			container.scrollTop = 220;
		}
		window.scrollTo(0, 220);
	});
	await page.locator('.retry-fab').click();
	await page.waitForTimeout(120);

	const scrollPositions = await page.evaluate(() => {
		const passage = document.querySelector('.passage-display');
		const container = document.querySelector('.speed-challenge-container');
		return {
			containerTop: passage ? passage.scrollTop : -1,
			pageTop: container ? container.scrollTop : -1,
			windowTop: window.scrollY
		};
	});

	if (scrollPositions.containerTop !== 0 || scrollPositions.pageTop !== 0) {
		throw new Error(`Retry should reset scroll to top, got passage=${scrollPositions.containerTop}, page=${scrollPositions.pageTop}, window=${scrollPositions.windowTop}`);
	}

	// Type full first-verse initials after retry reset
	const keys = ['q', 'c', 's', 'c', 'z', 't', 'd'];
	for (const key of keys) {
		const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
		await keyButton.click();
		await page.waitForTimeout(50);
	}

	// Type second verse initials
	const keys2 = ['d', 's', 'k', 'x', 'h', 'd'];
	for (const key of keys2) {
		const keyButton = page.locator('.keyboard').getByRole('button', { name: key }).first();
		await keyButton.click();
		await page.waitForTimeout(50);
	}

	// Wait for completion modal
	const completionModal = page.locator('.modal-overlay');
	await completionModal.waitFor({ state: 'visible', timeout: 5000 });

	// Verify onscreen keyboard is hidden while completion modal is displayed
	const keyboardVisibleWithModal = await page.locator('.keyboard-space').isVisible().catch(() => false);
	if (keyboardVisibleWithModal) {
		await page.screenshot({ path: 'tmppw-test/speed-challenge-collection-keyboard-modal-failure.png', fullPage: true });
		throw new Error('Keyboard should be hidden when completion modal is displayed');
	}

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
	console.log('CONSOLE_ERRORS_START');
	consoleErrors.forEach((e) => console.log(e));
	console.log('CONSOLE_ERRORS_END');
	console.log('PAGE_ERRORS_START');
	pageErrors.forEach((e) => console.log(e));
	console.log('PAGE_ERRORS_END');
	console.log('FAILED_REQUESTS_START');
	failedRequests.forEach((r) => console.log(r));
	console.log('FAILED_REQUESTS_END');
	await browser.close();
	process.exit(1);
}
