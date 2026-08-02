const DAY_MS = 24 * 60 * 60 * 1000;

export const PROGRESS_CATEGORIES = ['newLearning', 'developing', 'solid', 'mastered'];

export function createEmptyProgress() {
	return {
		newLearning: 0,
		developing: 0,
		solid: 0,
		mastered: 0
	};
}

export function getOverdueDays(dueDate, now = new Date()) {
	if (!dueDate) return 0;
	const due = new Date(dueDate);
	if (Number.isNaN(due.getTime())) return 0;
	const diffMs = now.getTime() - due.getTime();
	if (diffMs <= 0) return 0;
	return Math.floor(diffMs / DAY_MS);
}

export function getEffectiveInterval(interval, dueDate, now = new Date()) {
	const baseInterval = Math.max(1, Number(interval) || 1);
	const overdueDays = getOverdueDays(dueDate, now);
	return Math.max(1, baseInterval - overdueDays);
}

export function getMasteryCategory(effectiveInterval) {
	const normalized = Math.max(1, Number(effectiveInterval) || 1);
	if (normalized <= 7) return 'newLearning';
	if (normalized <= 24) return 'developing';
	if (normalized <= 48) return 'solid';
	return 'mastered';
}

export function calculateCurrentProgress(allVerses, now = new Date()) {
	const progress = createEmptyProgress();
	if (!Array.isArray(allVerses) || allVerses.length === 0) {
		return progress;
	}

	allVerses.forEach((verse) => {
		if (!verse?.lastReviewed) return;
		const effectiveInterval = getEffectiveInterval(verse.interval, verse.dueDate, now);
		const category = getMasteryCategory(effectiveInterval);
		progress[category] += 1;
	});

	return progress;
}

export function getProgressTotal(progress) {
	return PROGRESS_CATEGORIES.reduce((sum, key) => sum + Number(progress?.[key] || 0), 0);
}

export function getProgressMax(progress) {
	return Math.max(...PROGRESS_CATEGORIES.map((key) => Number(progress?.[key] || 0)), 0);
}
