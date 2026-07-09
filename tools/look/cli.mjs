#!/usr/bin/env node
/**
 * look — bare-bones visual verification CLI for this repo.
 *
 * Boots the real vite dev server, drives a headless Chrome (puppeteer-core),
 * and saves light + dark PNG screenshots so you (or an agent) can visually
 * verify UI changes without clicking around.
 *
 * Two modes:
 *
 *  1. Panel mode — screenshot a panel of the real app, seeded with fixture data:
 *       node tools/look/cli.mjs panel learn
 *       node tools/look/cli.mjs panel stats --fixture rich
 *       node tools/look/cli.mjs panel settings --theme dark
 *
 *  2. Component mode — mount one component in isolation with props from a
 *     sibling `<Name>.stories.js` file:
 *       node tools/look/cli.mjs component Modal            # all stories
 *       node tools/look/cli.mjs component Modal --story Confirm
 *
 * Common options:
 *   --theme light|dark|both   (default both)
 *   --viewport WxH            (default 400x700)
 *   --fixture rich|empty|<path-to-json>  (panel mode, default rich)
 *   --out <dir>               (default tools/look/shots)
 *   --full-page               capture full scrollable page
 *
 * Screenshots land in tools/look/shots/ (gitignored).
 *
 * Requires a Chrome/Chromium binary. Set CHROME_PATH if autodetection fails
 * (e.g. `export CHROME_PATH=/usr/bin/chromium`). In a devcontainer:
 * `sudo apt-get install -y chromium`.
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---------------------------------------------------------------------------
// Panel navigation map (mirrors IconNav.svelte navItems + MenuOverlay items)
// ---------------------------------------------------------------------------
const NAV_ORDER = ['menu', 'add', 'learn', 'practice', 'review', 'collections'];
const MENU_ORDER = ['add', 'learn', 'practice', 'review', 'collections', 'data', 'stats', 'heat-maps', 'share', 'settings'];
const PANELS = [...NAV_ORDER.slice(1), 'data', 'stats', 'heat-maps', 'settings'];

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
	const args = { _: [], theme: 'both', viewport: '400x700', fixture: 'rich', out: 'tools/look/shots', fullPage: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--theme') args.theme = argv[++i];
		else if (a === '--viewport') args.viewport = argv[++i];
		else if (a === '--fixture') args.fixture = argv[++i];
		else if (a === '--out') args.out = argv[++i];
		else if (a === '--story') args.story = argv[++i];
		else if (a === '--full-page') args.fullPage = true;
		else if (a === '--help' || a === '-h') args.help = true;
		else args._.push(a);
	}
	return args;
}

function usage() {
	console.log(`Usage:
  node tools/look/cli.mjs panel <${PANELS.join('|')}> [options]
  node tools/look/cli.mjs component <Name> [--story <StoryName>] [options]
  node tools/look/cli.mjs list

Options:
  --theme light|dark|both    default: both
  --viewport WxH             default: 400x700
  --fixture rich|empty|path  default: rich (panel mode)
  --out <dir>                default: tools/look/shots
  --full-page                capture full scrollable page`);
}

// ---------------------------------------------------------------------------
// Chrome discovery
// ---------------------------------------------------------------------------
function findChrome() {
	const candidates = [
		process.env.CHROME_PATH,
		process.env.PUPPETEER_EXECUTABLE_PATH,
		'/usr/bin/chromium',
		'/usr/bin/chromium-browser',
		'/usr/bin/google-chrome',
		'/usr/bin/google-chrome-stable',
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Chromium.app/Contents/MacOS/Chromium',
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	].filter(Boolean);
	for (const c of candidates) if (existsSync(c)) return c;
	console.error('No Chrome/Chromium found. Set CHROME_PATH to your browser binary.');
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Component mode: virtual entry served through the vite pipeline
// ---------------------------------------------------------------------------
const VIRTUAL_PREFIX = 'virtual:look-entry';

function lookPlugin() {
	return {
		name: 'look-harness',
		resolveId(id) {
			if (id.startsWith(VIRTUAL_PREFIX)) return '\0' + id;
		},
		load(id) {
			if (!id.startsWith('\0' + VIRTUAL_PREFIX)) return;
			const params = new URLSearchParams(id.split('?')[1] ?? '');
			const component = params.get('component');
			const story = params.get('story') ?? 'Default';
			return `
import '/src/app.css';
import { mount } from 'svelte';
import Component from '/src/lib/components/${component}.svelte';
import * as stories from '/src/lib/components/${component}.stories.js';
const story = stories[${JSON.stringify(story)}];
if (!story) throw new Error('Story not found: ' + ${JSON.stringify(story)});
mount(Component, { target: document.getElementById('look-root'), props: story.props ?? {} });
requestAnimationFrame(() => { document.body.dataset.lookReady = '1'; });
`;
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (!req.url?.startsWith('/__look')) return next();
				const url = new URL(req.url, 'http://localhost');
				const component = url.searchParams.get('component');
				const story = url.searchParams.get('story') ?? 'Default';
				const theme = url.searchParams.get('theme') ?? 'light';
				const entry = `/@id/__x00__${VIRTUAL_PREFIX}?component=${component}&story=${story}`;
				res.setHeader('content-type', 'text/html');
				res.end(`<!doctype html>
<html data-theme="${theme}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script type="module" src="/@vite/client"></script></head>
<body style="margin:0; background: var(--app-background)"><div id="look-root"></div>
<script type="module" src="${entry}"></script></body></html>`);
			});
		},
	};
}

// ---------------------------------------------------------------------------
// Shared: server + browser lifecycles
// ---------------------------------------------------------------------------
async function startServer() {
	const server = await createServer({
		configFile: path.join(repoRoot, 'vite.config.js'),
		root: repoRoot,
		server: { port: 0 },
		logLevel: 'error',
		plugins: [lookPlugin()],
	});
	await server.listen();
	const { port } = server.httpServer.address();
	return { server, base: `http://localhost:${port}` };
}

async function launchBrowser() {
	return puppeteer.launch({
		executablePath: findChrome(),
		headless: true,
		args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'],
	});
}

function loadFixture(name) {
	const file = ['rich', 'empty'].includes(name)
		? path.join(repoRoot, 'tools/look/fixtures', `${name}.json`)
		: path.resolve(repoRoot, name);
	return JSON.parse(readFileSync(file, 'utf8'));
}

async function newPage(browser, viewport) {
	const page = await browser.newPage();
	const [w, h] = viewport.split('x').map(Number);
	await page.setViewport({ width: w, height: h });
	page.on('pageerror', (err) => console.error('[page error]', err.message));
	return page;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Panel mode
// ---------------------------------------------------------------------------
async function shootPanel(browser, base, panel, theme, args, outDir) {
	const fixture = loadFixture(args.fixture);
	const entries = { ...fixture, settings: { ...(fixture.settings ?? {}), themePreference: theme } };

	const page = await newPage(browser, args.viewport);
	await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
	await page.evaluateOnNewDocument((data) => {
		for (const [key, value] of Object.entries(data)) {
			localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
		}
	}, entries);
	await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
	await page.waitForSelector('.icon-nav', { timeout: 15000 });

	// Use DOM clicks (el.click()) rather than coordinate clicks — the nav is
	// re-rendered by a {#key} wrapper which can detach nodes mid-interaction.
	const domClick = (selector, index) =>
		page.evaluate(
			({ selector, index }) => {
				const els = document.querySelectorAll(selector);
				if (!els[index]) throw new Error(`No element: ${selector}[${index}]`);
				els[index].click();
			},
			{ selector, index }
		);

	if (NAV_ORDER.includes(panel) && panel !== 'menu') {
		await domClick('.icon-nav button', NAV_ORDER.indexOf(panel));
	} else {
		const idx = MENU_ORDER.indexOf(panel);
		if (idx === -1) throw new Error(`Unknown panel: ${panel}. Known: ${PANELS.join(', ')}`);
		await domClick('.icon-nav button', 0); // open menu
		await page.waitForSelector('.menu-overlay-grid', { timeout: 5000 });
		await domClick('.menu-overlay-grid button', idx);
	}
	await sleep(600); // let panel transitions/animations settle

	const file = path.join(outDir, `panel-${panel}_${theme}.png`);
	await page.screenshot({ path: file, fullPage: args.fullPage });
	await page.close();
	console.log(file);
}

// ---------------------------------------------------------------------------
// Component mode
// ---------------------------------------------------------------------------
async function listStories(component) {
	const storiesPath = path.join(repoRoot, 'src/lib/components', `${component}.stories.js`);
	if (!existsSync(storiesPath)) {
		console.error(`No stories file: src/lib/components/${component}.stories.js`);
		console.error(`Create one exporting story objects, e.g.\n  export const Default = { props: { title: 'Hi' } }`);
		process.exit(1);
	}
	const mod = await import(storiesPath);
	return Object.keys(mod).filter((k) => mod[k] && typeof mod[k] === 'object');
}

async function shootComponent(browser, base, component, story, theme, args, outDir) {
	const page = await newPage(browser, args.viewport);
	await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
	const url = `${base}/__look?component=${component}&story=${story}&theme=${theme}`;
	await page.goto(url, { waitUntil: 'networkidle0' });
	await page.waitForSelector('body[data-look-ready]', { timeout: 15000 });
	await sleep(150);

	const file = path.join(outDir, `${component}-${story}_${theme}.png`);
	await page.screenshot({ path: file, fullPage: args.fullPage });
	await page.close();
	console.log(file);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
	const args = parseArgs(process.argv.slice(2));
	const [mode, target] = args._;

	if (args.help || !mode) return usage();

	if (mode === 'list') {
		console.log('Panels:\n  ' + PANELS.join('\n  '));
		const { globSync } = await import('node:fs');
		const storyFiles = globSync(path.join(repoRoot, 'src/lib/components/*.stories.js'));
		if (storyFiles.length) {
			console.log('Components with stories:');
			for (const f of storyFiles) console.log('  ' + path.basename(f, '.stories.js'));
		} else {
			console.log('Components with stories: (none yet — create <Name>.stories.js next to a component)');
		}
		return;
	}

	const themes = args.theme === 'both' ? ['light', 'dark'] : [args.theme];
	const outDir = path.resolve(repoRoot, args.out);
	mkdirSync(outDir, { recursive: true });

	const { server, base } = await startServer();
	const browser = await launchBrowser();

	try {
		if (mode === 'panel') {
			if (!target) throw new Error(`Which panel? One of: ${PANELS.join(', ')}`);
			for (const theme of themes) await shootPanel(browser, base, target, theme, args, outDir);
		} else if (mode === 'component') {
			if (!target) throw new Error('Which component? e.g. Modal');
			const stories = args.story ? [args.story] : await listStories(target);
			for (const story of stories) {
				for (const theme of themes) await shootComponent(browser, base, target, story, theme, args, outDir);
			}
		} else {
			usage();
		}
	} finally {
		await browser.close();
		await server.close();
	}
}

main().catch((err) => {
	console.error(err.message ?? err);
	process.exit(1);
});
