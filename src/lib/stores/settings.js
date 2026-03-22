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
	textSizePreference: 1
};

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
				: undefined
	};
}

let initialSettings = defaultSettings;

if (browser) {
	const raw = localStorage.getItem('settings');
	if (raw) {
		try {
			initialSettings = { ...defaultSettings, ...JSON.parse(raw) };
		} catch (error) {
			console.warn('Failed to parse settings from localStorage', error);
		}
	} else {
		const legacy = readLegacySettings();
		initialSettings = { ...defaultSettings, ...legacy };
	}
}

export const settings = writable(initialSettings);

if (browser) {
	settings.subscribe((value) => {
		localStorage.setItem('settings', JSON.stringify(value));
	});
}
