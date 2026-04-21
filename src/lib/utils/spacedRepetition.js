export function spacedRepetitionBinary(card, success, currentDate) {
	const updated = { ...card };

	if (!success) {
		updated.repetitions = 0;
		updated.interval = 1;
	} else {
		updated.repetitions = (updated.repetitions || 0) + 1;

		let baseInterval;
		if (updated.repetitions === 1) {
			baseInterval = 1;
		} else if (updated.repetitions === 2) {
			baseInterval = 6;
		} else {
			baseInterval = Math.round((updated.interval || 1) * 2);
		}

		if (updated.dueDate) {
			const dueDate = new Date(updated.dueDate);
			const daysSinceDue = (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);

			if (daysSinceDue < 0) {
				const previousInterval = updated.interval || 1;
				const daysWaited = Math.max(0, previousInterval + daysSinceDue);
				const earlyReviewFactor = Math.max(0.5, daysWaited / previousInterval);
				updated.interval = Math.round(baseInterval * earlyReviewFactor);
			} else {
				updated.interval = baseInterval;
			}
		} else {
			updated.interval = baseInterval;
		}
	}

	updated.dueDate = new Date(currentDate.getTime() + updated.interval * 24 * 60 * 60 * 1000).toISOString();
	return updated;
}

/**
 * Calculate days/hours/minutes until a verse is due for review
 * @param {string|Date} dueDate - The due date for the verse
 * @returns {Object|null} Object with { days, hours, minutes, milliseconds } or null if no dueDate
 */
export function getDaysUntilDue(dueDate) {
	if (!dueDate) return null;
	const now = new Date();
	const due = new Date(dueDate);
	const diffTime = due.getTime() - now.getTime();
	const msPerMinute = 1000 * 60;
	const msPerHour = msPerMinute * 60;
	const msPerDay = msPerHour * 24;
	const days = Math.floor(diffTime / msPerDay);
	const hours = Math.floor(diffTime / msPerHour);
	const minutes = Math.floor(diffTime / msPerMinute);
	return { days, hours, minutes, milliseconds: diffTime };
}

/**
 * Count how many verses in a collection are due for review
 * @param {Array<string>} verseIds - Array of verse IDs
 * @param {Array<Object>} verses - Array of all verse objects
 * @returns {number} Count of due verses
 */
export function countDueVerses(verseIds, verses) {
	const now = new Date();
	return verseIds.filter(vid => {
		const v = verses.find(x => x.id === vid);
		if (!v || !v.lastReviewed) return false;
		if (!v.dueDate) return true; // Consider verses without dueDate as due
		return new Date(v.dueDate) <= now;
	}).length;
}
