import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { get } from 'svelte/store';

const defaultPracticeData = {
	bestTimes: {}, // { [collectionId]: { rawTime, penalties, officialTime, verseIds: [] } }
	bestVerseTimes: {} // { [verseId]: { rawTime, penalties, officialTime } }
};

function createPracticeStore() {
	let initialData = { ...defaultPracticeData };
	
	if (browser) {
		try {
			const stored = localStorage.getItem('practice');
			if (stored) {
				const parsed = JSON.parse(stored);
				initialData = { ...defaultPracticeData, ...parsed };
			}
		} catch (e) {
			console.error('Failed to load practice data from localStorage:', e);
		}
	}
	
	const { subscribe, set, update } = writable(initialData);
	
	// Auto-save to localStorage on changes
	if (browser) {
		subscribe(value => {
			try {
				localStorage.setItem('practice', JSON.stringify(value));
			} catch (e) {
				console.error('Failed to save practice data to localStorage:', e);
			}
		});
	}
	
	return {
		subscribe,
		set,
		update,
		
		/**
		 * Check if a collection has changed (different verse IDs)
		 * @param {string} collectionId
		 * @param {string[]} currentVerseIds
		 * @returns {boolean} true if collection has changed
		 */
		isCollectionChanged: (collectionId, currentVerseIds) => {
			const data = get({ subscribe });
			const bestTime = data.bestTimes[collectionId];
			
			if (!bestTime || !bestTime.verseIds) {
				return false;
			}
			
			// Check if arrays are different
			if (bestTime.verseIds.length !== currentVerseIds.length) {
				return true;
			}
			
			// Compare verse IDs (order matters for practice)
			for (let i = 0; i < bestTime.verseIds.length; i++) {
				if (bestTime.verseIds[i] !== currentVerseIds[i]) {
					return true;
				}
			}
			
			return false;
		},
		
		/**
		 * Reset best time for a collection
		 * @param {string} collectionId
		 */
		resetCollectionTime: (collectionId) => {
			update(data => {
				const newBestTimes = { ...data.bestTimes };
				delete newBestTimes[collectionId];
				return { ...data, bestTimes: newBestTimes };
			});
		},
		
		/**
		 * Update best time for a collection
		 * @param {string} collectionId
		 * @param {number} rawTime - Time in milliseconds
		 * @param {number} penalties - Number of errors
		 * @param {string[]} verseIds - Array of verse IDs in this collection
		 */
		updateCollectionBestTime: (collectionId, rawTime, penalties, verseIds) => {
			update(data => {
				const officialTime = rawTime + (penalties * 1000);
				const existingBest = data.bestTimes[collectionId];
				
				// Only update if this is a new best or first attempt
				if (!existingBest || officialTime < existingBest.officialTime) {
					return {
						...data,
						bestTimes: {
							...data.bestTimes,
							[collectionId]: {
								rawTime,
								penalties,
								officialTime,
								verseIds: [...verseIds],
								date: new Date().toISOString()
							}
						}
					};
				}
				
				return data;
			});
		},
		
		/**
		 * Update best time for a single verse
		 * @param {string} verseId
		 * @param {number} rawTime - Time in milliseconds
		 * @param {number} penalties - Number of errors
		 */
		updateVerseBestTime: (verseId, rawTime, penalties) => {
			update(data => {
				const officialTime = rawTime + (penalties * 1000);
				const existingBest = data.bestVerseTimes[verseId];
				
				// Only update if this is a new best or first attempt
				if (!existingBest || officialTime < existingBest.officialTime) {
					return {
						...data,
						bestVerseTimes: {
							...data.bestVerseTimes,
							[verseId]: {
								rawTime,
								penalties,
								officialTime,
								date: new Date().toISOString()
							}
						}
					};
				}
				
				return data;
			});
		},
		
		/**
		 * Get best time for a collection
		 * @param {string} collectionId
		 * @returns {object|null} Best time data or null
		 */
		getCollectionBestTime: (collectionId) => {
			const data = get({ subscribe });
			return data.bestTimes[collectionId] || null;
		},
		
		/**
		 * Get best time for a verse
		 * @param {string} verseId
		 * @returns {object|null} Best time data or null
		 */
		getVerseBestTime: (verseId) => {
			const data = get({ subscribe });
			return data.bestVerseTimes[verseId] || null;
		}
	};
}

export const practice = createPracticeStore();
