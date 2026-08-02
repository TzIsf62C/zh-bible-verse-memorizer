import { describe, expect, it } from 'vitest';
import {
	buildManualIntervalUpdate,
	getRepetitionsForInterval,
	getSharedReviewSchedule,
	normalizeReviewFields,
	spacedRepetitionBinary
} from '$lib/utils/spacedRepetition.js';

describe('spacedRepetition helpers', () => {
	it('maps intervals to the expected repetition stage', () => {
		expect(getRepetitionsForInterval(1)).toBe(1);
		expect(getRepetitionsForInterval(2)).toBe(2);
		expect(getRepetitionsForInterval(6)).toBe(2);
		expect(getRepetitionsForInterval(7)).toBe(3);
		expect(getRepetitionsForInterval(24)).toBe(3);
	});

	it('builds a manual interval update with a live due date', () => {
		const currentDate = new Date('2026-05-25T00:00:00.000Z');
		const update = buildManualIntervalUpdate(24, currentDate);

		expect(update).toEqual({
			interval: 24,
			repetitions: 3,
			dueDate: '2026-06-18T00:00:00.000Z'
		});
	});

	it('normalizes legacy review fields from stored dates when interval is missing', () => {
		const normalized = normalizeReviewFields({
			lastReviewed: '2026-04-01T00:00:00.000Z',
			dueDate: '2026-04-25T00:00:00.000Z'
		});

		expect(normalized.interval).toBe(24);
		expect(normalized.repetitions).toBe(3);
		expect(normalized.dueDate).toBe('2026-04-25T00:00:00.000Z');
	});

	it('summarizes mixed and shared review schedules', () => {
		const shared = getSharedReviewSchedule([
			{ interval: 24, repetitions: 3, dueDate: '2026-06-18T00:00:00.000Z' },
			{ interval: 24, repetitions: 4, dueDate: '2026-06-18T00:00:00.000Z' }
		]);
		expect(shared.interval).toBe(24);
		expect(shared.dueDate).toBe('2026-06-18T00:00:00.000Z');
		expect(shared.hasMixedIntervals).toBe(false);
		expect(shared.hasMixedDueDates).toBe(false);

		const mixed = getSharedReviewSchedule([
			{ interval: 24, repetitions: 3, dueDate: '2026-06-18T00:00:00.000Z' },
			{ interval: 12, repetitions: 3, dueDate: '2026-06-06T00:00:00.000Z' }
		]);
		expect(mixed.interval).toBeNull();
		expect(mixed.dueDate).toBeNull();
		expect(mixed.hasMixedIntervals).toBe(true);
		expect(mixed.hasMixedDueDates).toBe(true);
	});

	it('keeps spaced repetition progression intact after manual-like updates', () => {
		const currentDate = new Date('2026-05-25T00:00:00.000Z');
		const updated = spacedRepetitionBinary(
			{ interval: 24, repetitions: 3, dueDate: '2026-05-25T00:00:00.000Z' },
			true,
			currentDate
		);

		expect(updated.interval).toBe(48);
		expect(updated.repetitions).toBe(4);
		expect(updated.dueDate).toBe('2026-07-12T00:00:00.000Z');
	});
});