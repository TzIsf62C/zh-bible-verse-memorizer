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
