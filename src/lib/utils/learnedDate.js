function getValidTimestamp(value) {
	if (value === null || value === undefined || value === '') return null;
	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? null : timestamp;
}

function parseRangeBoundary(value) {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'string' && value !== '') return new Date(value).getTime();
	if (typeof value === 'number') return value;
	return NaN;
}

/**
 * Count how many verses were first marked learned inside the given date range.
 *
 * @param {Array<Object>} verseList - Array of verse objects
 * @param {Date} rangeStart - Inclusive start of the range
 * @param {Date} rangeEnd - Exclusive end of the range
 * @returns {number} Count of verses whose learnedDate falls in [rangeStart, rangeEnd)
 */
export function computeNewStarts(verseList, rangeStart, rangeEnd) {
	const startTime = parseRangeBoundary(rangeStart);
	const endTime = parseRangeBoundary(rangeEnd);
	const nowTime = Date.now();

	if (Number.isNaN(startTime) || Number.isNaN(endTime)) return 0;

	return (Array.isArray(verseList) ? verseList : []).filter((verse) => {
		const learnedTime = getValidTimestamp(verse?.learnedDate);
		if (learnedTime === null) return false;
		// Ignore future dates in case of device clock skew
		if (learnedTime > nowTime) return false;
		return learnedTime >= startTime && learnedTime < endTime;
	}).length;
}

/**
 * Get all verses whose learnedDate falls inside the given date range,
 * sorted canonically by book/chapter/verse.
 *
 * @param {Array<Object>} verseList - Array of verse objects
 * @param {Date} rangeStart - Inclusive start of the range
 * @param {Date} rangeEnd - Exclusive end of the range
 * @returns {Array<Object>} Sorted verse objects with a learnedDate in range
 */
export function getNewStartVerses(verseList, rangeStart, rangeEnd) {
	const startTime = parseRangeBoundary(rangeStart);
	const endTime = parseRangeBoundary(rangeEnd);
	const nowTime = Date.now();

	if (Number.isNaN(startTime) || Number.isNaN(endTime)) return [];

	return (Array.isArray(verseList) ? verseList : [])
		.filter((verse) => {
			const learnedTime = getValidTimestamp(verse?.learnedDate);
			if (learnedTime === null) return false;
			if (learnedTime > nowTime) return false;
			return learnedTime >= startTime && learnedTime < endTime;
		})
		.sort((a, b) => {
			const bookCmp = String(a.bookName || '').localeCompare(String(b.bookName || ''), 'zh');
			if (bookCmp !== 0) return bookCmp;
			const chapterCmp = Number(a.chapterNumber || 0) - Number(b.chapterNumber || 0);
			if (chapterCmp !== 0) return chapterCmp;
			return Number(a.verseNumber || 0) - Number(b.verseNumber || 0);
		});
}
