import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const STORE_SYNC_EVENT = 'cbm-local-storage-store-sync';

function parseStoredValue(rawValue, fallbackValue, key) {
	if (rawValue === null) {
		return fallbackValue;
	}

	try {
		return JSON.parse(rawValue);
	} catch (error) {
		console.warn(`Failed to parse localStorage key: ${key}`, error);
		return fallbackValue;
	}
}

export function createLocalStorageStore(key, initialValue) {
	let startValue = initialValue;

	if (browser) {
		startValue = parseStoredValue(localStorage.getItem(key), initialValue, key);
	}

	const store = writable(startValue);

	if (browser) {
		const sourceId = `${key}-${Math.random().toString(36).slice(2, 10)}`;
		let isApplyingExternalUpdate = false;

		store.subscribe((value) => {
			if (isApplyingExternalUpdate) {
				return;
			}

			localStorage.setItem(key, JSON.stringify(value));
			window.dispatchEvent(
				new CustomEvent(STORE_SYNC_EVENT, {
					detail: { key, value, sourceId }
				})
			);
		});

		const applyExternalValue = (value) => {
			isApplyingExternalUpdate = true;
			store.set(value);
			isApplyingExternalUpdate = false;
		};

		const handleStorage = (event) => {
			if (event.key !== key) {
				return;
			}

			applyExternalValue(parseStoredValue(event.newValue, initialValue, key));
		};

		const handleStoreSync = (event) => {
			const detail = event.detail;
			if (!detail || detail.key !== key || detail.sourceId === sourceId) {
				return;
			}

			applyExternalValue(detail.value);
		};

		window.addEventListener('storage', handleStorage);
		window.addEventListener(STORE_SYNC_EVENT, handleStoreSync);
	}

	return store;
}
