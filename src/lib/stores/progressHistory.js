import { get } from 'svelte/store';
import { createLocalStorageStore } from '$lib/stores/localStorage.js';
import { verses } from '$lib/stores/verses.js';
import { calculateCurrentProgress, createEmptyProgress } from '$lib/utils/masteryProgress.js';
import {
	applyHybridRetention,
	hasMeaningfulChange,
	hasTodaySnapshot,
	normalizeProgressTrackingState,
	upsertTodaySnapshot
} from '$lib/utils/progressTracking.js';

const initialState = {
	currentProgress: createEmptyProgress(),
	progressHistory: [],
	lastUpdatedAt: null
};

export const progressTrackingState = createLocalStorageStore('progressTrackingState', initialState);

let trackingInitialized = false;

function updateTracking(allVerses, now = new Date()) {
	const nextProgress = calculateCurrentProgress(allVerses, now);
	progressTrackingState.update((existing) => {
		const currentState = normalizeProgressTrackingState(existing || initialState);
		const shouldUpdateToday =
			hasMeaningfulChange(currentState.currentProgress, nextProgress) ||
			!hasTodaySnapshot(currentState.progressHistory, now);

		const nextHistory = shouldUpdateToday
			? upsertTodaySnapshot(currentState.progressHistory, nextProgress, now)
			: currentState.progressHistory;

		return {
			currentProgress: nextProgress,
			progressHistory: applyHybridRetention(nextHistory, now),
			lastUpdatedAt: now.toISOString()
		};
	});
}

export function initializeProgressTracking() {
	if (trackingInitialized) return;
	trackingInitialized = true;

	updateTracking(get(verses) || []);
	verses.subscribe((allVerses) => {
		updateTracking(allVerses || []);
	});
}
