import { describe, expect, it } from 'vitest';
import {
	buildManualIntervalUpdate,
	countSecondChanceScheduledVerses,
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

	it('enters second-chance mode on a first failed review without resetting the interval', () => {
		const currentDate = new Date('2026-05-25T00:00:00.000Z');
		const updated = spacedRepetitionBinary(
			{ interval: 24, repetitions: 3, dueDate: '2026-05-25T00:00:00.000Z' },
			false,
			currentDate,
			60
		);

		expect(updated.interval).toBe(24);
		expect(updated.repetitions).toBe(3);
		expect(updated.secondChanceActive).toBe(true);
		expect(updated.secondChanceOriginalInterval).toBe(24);
		expect(updated.secondChanceFailureDate).toBe('2026-05-25T00:00:00.000Z');
		expect(updated.secondChanceDueDate).toBe('2026-05-26T00:00:00.000Z');
	});

	it('resets below the configured minimum score instead of scheduling second chance', () => {
		const currentDate = new Date('2026-05-25T00:00:00.000Z');
		const updated = spacedRepetitionBinary(
			{ interval: 24, repetitions: 3, dueDate: '2026-05-25T00:00:00.000Z' },
			false,
			currentDate,
			60,
			70,
			69
		);

		expect(updated.interval).toBe(1);
		expect(updated.repetitions).toBe(0);
		expect(updated.dueDate).toBe('2026-05-26T00:00:00.000Z');
		expect(updated.secondChanceActive).toBe(false);
	});

	it('schedules second chance when the score equals the configured minimum', () => {
		const currentDate = new Date('2026-05-25T00:00:00.000Z');
		const updated = spacedRepetitionBinary(
			{ interval: 24, repetitions: 3, dueDate: '2026-05-25T00:00:00.000Z' },
			false,
			currentDate,
			60,
			70,
			70
		);

		expect(updated.interval).toBe(24);
		expect(updated.repetitions).toBe(3);
		expect(updated.secondChanceActive).toBe(true);
	});

	it('keeps a zero minimum compatible with all failed scores below 90', () => {
		const currentDate = new Date('2026-05-25T00:00:00.000Z');
		const updated = spacedRepetitionBinary(
			{ interval: 24, repetitions: 3, dueDate: '2026-05-25T00:00:00.000Z' },
			false,
			currentDate,
			60,
			0,
			0
		);

		expect(updated.secondChanceActive).toBe(true);
		expect(updated.interval).toBe(24);
	});

	it('returns a recovered interval after a successful second-chance review', () => {
		const reviewDate = new Date('2026-05-26T00:00:00.000Z');
		const updated = spacedRepetitionBinary(
			{
				interval: 24,
				repetitions: 3,
				dueDate: '2026-05-25T00:00:00.000Z',
				secondChanceActive: true,
				secondChanceOriginalInterval: 24,
				secondChanceFailureDate: '2026-05-25T00:00:00.000Z',
				secondChanceDueDate: '2026-05-26T00:00:00.000Z'
			},
			true,
			reviewDate,
			60
		);

		expect(updated.interval).toBe(14);
		expect(updated.repetitions).toBe(4);
		expect(updated.secondChanceActive).toBe(false);
		expect(updated.secondChanceOriginalInterval).toBeNull();
		expect(updated.secondChanceFailureDate).toBeNull();
		expect(updated.secondChanceDueDate).toBeNull();
		expect(updated.dueDate).toBe('2026-06-09T00:00:00.000Z');
	});

	it('resets the interval when a second-chance review is failed', () => {
		const reviewDate = new Date('2026-05-26T00:00:00.000Z');
		const updated = spacedRepetitionBinary(
			{
				interval: 24,
				repetitions: 3,
				dueDate: '2026-05-25T00:00:00.000Z',
				secondChanceActive: true,
				secondChanceOriginalInterval: 24,
				secondChanceFailureDate: '2026-05-25T00:00:00.000Z',
				secondChanceDueDate: '2026-05-26T00:00:00.000Z'
			},
			false,
			reviewDate,
			60
		);

		expect(updated.interval).toBe(1);
		expect(updated.repetitions).toBe(0);
		expect(updated.secondChanceActive).toBe(false);
		expect(updated.secondChanceOriginalInterval).toBeNull();
		expect(updated.secondChanceFailureDate).toBeNull();
		expect(updated.secondChanceDueDate).toBeNull();
	});

	it('counts verses scheduled for a second-chance review within the next 24 hours', () => {
		const now = new Date('2026-05-25T12:00:00.000Z');
		const verses = [
			{ id: 'a', secondChanceActive: true, secondChanceDueDate: '2026-05-26T00:00:00.000Z' },
			{ id: 'b', secondChanceActive: true, secondChanceDueDate: '2026-05-27T12:00:00.000Z' },
			{ id: 'c', secondChanceActive: true, secondChanceDueDate: '2026-05-28T00:00:00.000Z' },
			{ id: 'd', secondChanceActive: false, secondChanceDueDate: null }
		];

		expect(countSecondChanceScheduledVerses(verses, now)).toBe(1);
	});
});