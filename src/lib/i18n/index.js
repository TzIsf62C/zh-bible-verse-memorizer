import { get } from 'svelte/store';
import { settings } from '$lib/stores/settings.js';
import { translations } from './translations.js';

export function t(key, variables = {}) {
	const language = get(settings)?.languagePreference || 'english';
	const dictionary = translations[language] || translations.english;
	let value = dictionary[key] || translations.english[key] || key;

	Object.entries(variables).forEach(([placeholder, replacement]) => {
		value = value.replaceAll(`{${placeholder}}`, replacement);
	});

	return value;
}
