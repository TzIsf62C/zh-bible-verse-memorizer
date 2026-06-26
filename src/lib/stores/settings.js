import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const defaultSettings = {
	languagePreference: 'english',
	inputMethod: 'pinyin',
	themePreference: 'system',
	bookNameCharset: 'traditional',
	defaultBibleVersion: '',
	vibrationEnabled: false,
	buzzerEnabled: false,
	backupReminderEnabled: true,
	textSizePreference: 1,
	needsPracticeIncludeBelow: 80,
	needsPracticeIgnoreAbove: 94,
	hasCompletedOnboarding: false
};

function clampThreshold(value, fallback) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.max(0, Math.min(99, value));
}

function mergeDefinedSettings(base, overrides) {
	return Object.fromEntries(
		Object.entries({ ...base, ...overrides }).filter(([, value]) => value !== undefined)
	);
}

function sanitizeSettings(settings) {
	const merged = mergeDefinedSettings(defaultSettings, settings);
	const textSizePreference = Number(merged.textSizePreference);
	const needsPracticeIncludeBelow = clampThreshold(
		Number(merged.needsPracticeIncludeBelow),
		defaultSettings.needsPracticeIncludeBelow
	);
	const needsPracticeIgnoreAbove = clampThreshold(
		Number(merged.needsPracticeIgnoreAbove),
		defaultSettings.needsPracticeIgnoreAbove
	);
	const normalizedIgnoreAbove = Math.max(needsPracticeIgnoreAbove, needsPracticeIncludeBelow);

	return {
		...merged,
		textSizePreference: Number.isFinite(textSizePreference) && textSizePreference > 0
			? textSizePreference
			: defaultSettings.textSizePreference,
		needsPracticeIncludeBelow,
		needsPracticeIgnoreAbove: normalizedIgnoreAbove
	};
}

function readLegacySettings() {
	if (!browser) return {};

	return {
		languagePreference: localStorage.getItem('languagePreference') || undefined,
		inputMethod: localStorage.getItem('inputMethod') || undefined,
		themePreference: localStorage.getItem('themePreference') || undefined,
		bookNameCharset: localStorage.getItem('bookNameCharset') || undefined,
		defaultBibleVersion: localStorage.getItem('defaultBibleVersion') || undefined,
		vibrationEnabled:
			localStorage.getItem('vibrationEnabled') !== null
				? localStorage.getItem('vibrationEnabled') === 'true'
				: undefined,
		buzzerEnabled:
			localStorage.getItem('buzzerEnabled') !== null
				? localStorage.getItem('buzzerEnabled') === 'true'
				: undefined,
		backupReminderEnabled:
			localStorage.getItem('backupReminderEnabled') !== null
				? localStorage.getItem('backupReminderEnabled') === 'true'
				: undefined,
		textSizePreference:
			localStorage.getItem('textSizePreference') !== null
				? Number(localStorage.getItem('textSizePreference'))
				: undefined,
		needsPracticeIncludeBelow:
			localStorage.getItem('needsPracticeIncludeBelow') !== null
				? Number(localStorage.getItem('needsPracticeIncludeBelow'))
				: undefined,
		needsPracticeIgnoreAbove:
			localStorage.getItem('needsPracticeIgnoreAbove') !== null
				? Number(localStorage.getItem('needsPracticeIgnoreAbove'))
				: undefined
	};
}

let initialSettings = defaultSettings;

if (browser) {
	const raw = localStorage.getItem('settings');
	if (raw) {
		try {
			initialSettings = sanitizeSettings(JSON.parse(raw));
		} catch (error) {
			console.warn('Failed to parse settings from localStorage', error);
		}
	} else {
		const legacy = readLegacySettings();
		initialSettings = sanitizeSettings(legacy);
	}
}

export const settings = writable(initialSettings);

if (browser) {
	settings.subscribe((value) => {
		localStorage.setItem('settings', JSON.stringify(sanitizeSettings(value)));
	});
}
