import { createLocalStorageStore } from './localStorage.js';

// Placeholder streak store for future activity wiring.
export const streakData = createLocalStorageStore('streakData', {
	current: 0,
	best: 0,
	lastActiveDate: null
});
