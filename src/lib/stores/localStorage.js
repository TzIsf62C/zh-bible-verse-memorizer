import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export function createLocalStorageStore(key, initialValue) {
	let startValue = initialValue;

	if (browser) {
		const raw = localStorage.getItem(key);
		if (raw !== null) {
			try {
				startValue = JSON.parse(raw);
			} catch (error) {
				console.warn(`Failed to parse localStorage key: ${key}`, error);
			}
		}
	}

	const store = writable(startValue);

	if (browser) {
		store.subscribe((value) => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	return store;
}
