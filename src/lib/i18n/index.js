import { get } from 'svelte/store';
import { settings } from '$lib/stores/settings.js';
import { translations } from './translations.js';

// Translation function that reads from settings store
// In Svelte templates, call this normally and it will be reactive
// because the template has a reactive reference marker ($settings.languagePreference)
export function t(key, variables = {}) {
	const currentSettings = get(settings);
	const language = currentSettings?.languagePreference || 'english';
	const dictionary = translations[language] || translations.english;
	let value = dictionary[key] ?? translations.english[key] ?? key;

	Object.entries(variables).forEach(([placeholder, replacement]) => {
		value = value.replaceAll(`{${placeholder}}`, replacement);
	});

	return value;
}

