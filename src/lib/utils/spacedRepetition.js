const DAY_MS = 24 * 60 * 60 * 1000;

function toPositiveInteger(value, fallback = null) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	const integer = Math.floor(parsed);
	return integer > 0 ? integer : fallback;
}

function toNonNegativeInteger(value, fallback = null) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	const integer = Math.floor(parsed);
	return integer >= 0 ? integer : fallback;
}

function parseDateValue(value) {
	if (!value) return null;
	const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeSpacingCard(card = {}) {
	const secondChanceActive = Boolean(card.secondChanceActive);
	const originalInterval = Number.isFinite(Number(card.secondChanceOriginalInterval))
		? Math.max(1, Math.floor(Number(card.secondChanceOriginalInterval)))
		: null;
	const failureDate = parseDateValue(card.secondChanceFailureDate);
	const dueDate = parseDateValue(card.secondChanceDueDate);

	return {
		...card,
		interval: toPositiveInteger(card.interval, 1),
		repetitions: toNonNegativeInteger(card.repetitions, 0),
		dueDate: parseDateValue(card.dueDate),
		secondChanceActive,
		secondChanceOriginalInterval: secondChanceActive ? originalInterval : null,
		secondChanceFailureDate: secondChanceActive && failureDate ? failureDate.toISOString() : null,
		secondChanceDueDate: secondChanceActive && dueDate ? dueDate.toISOString() : null
	};
}

export function clearSecondChanceState(card = {}) {
	return {
		...card,
		secondChanceActive: false,
		secondChanceOriginalInterval: null,
		secondChanceFailureDate: null,
		secondChanceDueDate: null
	};
}

function clampRecoveryPercent(value, fallback = 60) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	const clamped = Math.min(100, Math.max(10, parsed));
	return Math.round(clamped);
}

export function getRepetitionsForInterval(interval) {
	const normalizedInterval = Math.max(1, toPositiveInteger(interval, 1));
	if (normalizedInterval <= 1) return 1;
	if (normalizedInterval <= 6) return 2;
	return 3;
}

export function normalizeReviewFields(card = {}, currentDate = new Date()) {
	const normalized = { ...card };
	const lastReviewed = parseDateValue(normalized.lastReviewed);
	let interval = toPositiveInteger(normalized.interval, null);
	const dueDate = parseDateValue(normalized.dueDate);

	if (interval === null && lastReviewed && dueDate) {
		const derivedDays = Math.round((dueDate.getTime() - lastReviewed.getTime()) / DAY_MS);
		interval = Math.max(1, derivedDays);
	}

	if (interval === null) {
		interval = 1;
	}

	const repetitions = toNonNegativeInteger(normalized.repetitions, null) ?? getRepetitionsForInterval(interval);
	const normalizedDueDate = dueDate || new Date((lastReviewed || currentDate).getTime() + interval * DAY_MS);

	return {
		...normalized,
		interval,
		repetitions,
		dueDate: normalizedDueDate.toISOString(),
		lastReviewed: lastReviewed ? lastReviewed.toISOString() : normalized.lastReviewed ?? null
	};
}

export function buildManualIntervalUpdate(intervalDays, currentDate = new Date()) {
	const interval = Math.max(1, toPositiveInteger(intervalDays, 1));
	return {
		interval,
		repetitions: getRepetitionsForInterval(interval),
		dueDate: new Date(currentDate.getTime() + interval * DAY_MS).toISOString()
	};
}

export function getSharedReviewSchedule(verses = [], currentDate = new Date()) {
	const normalizedVerses = Array.isArray(verses)
		? verses.map((verse) => normalizeReviewFields(verse, currentDate))
		: [];

	if (normalizedVerses.length === 0) {
		return {
			interval: null,
			dueDate: null,
			hasMixedIntervals: false,
			hasMixedDueDates: false,
			normalizedVerses
		};
	}

	const firstInterval = normalizedVerses[0].interval;
	const firstDueDate = normalizedVerses[0].dueDate;
	const hasMixedIntervals = normalizedVerses.some((verse) => verse.interval !== firstInterval);
	const hasMixedDueDates = normalizedVerses.some((verse) => verse.dueDate !== firstDueDate);

	return {
		interval: hasMixedIntervals ? null : firstInterval,
		dueDate: hasMixedDueDates ? null : firstDueDate,
		hasMixedIntervals,
		hasMixedDueDates,
		normalizedVerses
	};
}

export function spacedRepetitionBinary(card, success, currentDate, recoveryPercent = 60) {
	const updated = normalizeSpacingCard(card);
	const secondChanceDueDate = parseDateValue(updated.secondChanceDueDate);
	const isSecondChanceReviewDue = secondChanceDueDate && currentDate >= secondChanceDueDate;

	if (updated.secondChanceActive && secondChanceDueDate && !isSecondChanceReviewDue) {
		return updated;
	}

	if (updated.secondChanceActive && isSecondChanceReviewDue) {
		if (success) {
			const originalInterval = Number.isFinite(Number(updated.secondChanceOriginalInterval))
				? Math.max(1, Number(updated.secondChanceOriginalInterval))
				: Math.max(1, updated.interval || 1);
			const recoveryRate = clampRecoveryPercent(recoveryPercent, 60);
			updated.interval = Math.max(1, Math.floor((originalInterval * recoveryRate) / 100));
			updated.repetitions = (updated.repetitions || 0) + 1;
			updated.dueDate = new Date(currentDate.getTime() + updated.interval * DAY_MS).toISOString();
			return clearSecondChanceState(updated);
		}

		updated.repetitions = 0;
		updated.interval = 1;
		updated.dueDate = new Date(currentDate.getTime() + updated.interval * DAY_MS).toISOString();
		return clearSecondChanceState(updated);
	}

	if (!success) {
		updated.secondChanceActive = true;
		updated.secondChanceOriginalInterval = Math.max(1, updated.interval || 1);
		updated.secondChanceFailureDate = currentDate.toISOString();
		updated.secondChanceDueDate = new Date(currentDate.getTime() + DAY_MS).toISOString();
		return updated;
	}

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

	updated.dueDate = new Date(currentDate.getTime() + updated.interval * DAY_MS).toISOString();
	updated.secondChanceActive = false;
	updated.secondChanceOriginalInterval = null;
	updated.secondChanceFailureDate = null;
	updated.secondChanceDueDate = null;
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

export function countSecondChanceScheduledVerses(verses = [], now = new Date()) {
	if (!Array.isArray(verses)) return 0;

	const start = new Date(now.getTime());
	const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
	return verses.filter((verse) => {
		if (!verse || !verse.secondChanceActive || !verse.secondChanceDueDate) {
			return false;
		}
		const dueDate = new Date(verse.secondChanceDueDate);
		return dueDate >= start && dueDate <= cutoff;
	}).length;
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
