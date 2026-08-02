import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';

function seedLocalStorage() {
	const verse = {
		id: 'v1',
		verseText: '神愛世人',
		bookName: '約翰福音',
		chapterNumber: 3,
		verseNumber: 16,
		verseInitials: 'sasr',
		bookInitials: 'yhfy',
		bibleVersion: 'CUV',
		lastReviewed: null,
		dueDate: null,
		interval: 1,
		repetitions: 0
	};

	localStorage.setItem('verses', JSON.stringify([verse]));
	localStorage.setItem('collections', JSON.stringify([]));
	localStorage.setItem('settings', JSON.stringify({
		languagePreference: 'english',
		inputMethod: 'pinyin',
		themePreference: 'light',
		defaultBibleVersion: 'CUV',
		vibrationEnabled: false,
		hasCompletedOnboarding: true,
		bookNameCharset: 'traditional'
	}));
}

async function run() {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
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

	let passed = false;
	try {
		await page.addInitScript(seedLocalStorage);
		await page.goto(baseURL, { waitUntil: 'networkidle' });

		const selector = page.locator('#verse-selector');
		await selector.waitFor({ timeout: 10000 });
		await selector.selectOption('0');

		await page.waitForTimeout(400);

		const verseDisplayVisible = await page.locator('.verse-display').isVisible();
		const keyboardVisible = await page.locator('.keyboard').first().isVisible();

		if (!verseDisplayVisible || !keyboardVisible) {
			throw new Error(`Expected verse display + keyboard after selection, got verseDisplay=${verseDisplayVisible}, keyboard=${keyboardVisible}`);
		}

		passed = true;
		console.log('PASS learningflow-integration');
	} catch (error) {
		console.error('FAIL learningflow-integration:', error.message);
		console.log('CONSOLE_ERRORS_START');
		consoleErrors.forEach((e) => console.log(e));
		console.log('CONSOLE_ERRORS_END');
		console.log('PAGE_ERRORS_START');
		pageErrors.forEach((e) => console.log(e));
		console.log('PAGE_ERRORS_END');
		console.log('FAILED_REQUESTS_START');
		failedRequests.forEach((r) => console.log(r));
		console.log('FAILED_REQUESTS_END');
	} finally {
		await browser.close();
	}

	if (!passed) {
		process.exit(1);
	}
}

run();
