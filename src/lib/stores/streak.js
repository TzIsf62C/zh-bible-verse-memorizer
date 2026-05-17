import { get } from 'svelte/store';
import { createLocalStorageStore } from './localStorage.js';
import { verses } from '$lib/stores/verses.js';
import { enqueueToast } from '$lib/stores/toastQueue.js';

const DEFAULT_STREAK_STATE = {
	current: 0,
	best: 0,
	lastActiveDate: null
};

export const streakData = createLocalStorageStore('streakData', DEFAULT_STREAK_STATE);

function pad2(value) {
	return String(value).padStart(2, '0');
}

function toDateKey(date = new Date()) {
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function fromDateKey(dateKey) {
	if (!dateKey || typeof dateKey !== 'string') return null;
	const [year, month, day] = dateKey.split('-').map((part) => Number(part));
	if (!year || !month || !day) return null;
	const date = new Date(year, month - 1, day);
	return Number.isNaN(date.getTime()) ? null : date;
}

function getYesterdayKey(date = new Date()) {
	const yesterday = new Date(date);
	yesterday.setDate(yesterday.getDate() - 1);
	return toDateKey(yesterday);
}

function normalizeState(rawState) {
	if (!rawState || typeof rawState !== 'object') {
		return { ...DEFAULT_STREAK_STATE };
	}

	return {
		current: Number(rawState.current || 0),
		best: Number(rawState.best || 0),
		lastActiveDate: rawState.lastActiveDate || null
	};
}

function normalizeForToday(state, todayKey, yesterdayKey) {
	const safeState = normalizeState(state);
	if (!safeState.lastActiveDate) return safeState;
	if (safeState.lastActiveDate === todayKey) return safeState;
	if (safeState.lastActiveDate === yesterdayKey) return safeState;

	return {
		...safeState,
		current: 0,
		lastActiveDate: null
	};
}

function countDueVerses(verseList, now = new Date()) {
	if (!Array.isArray(verseList)) return 0;

	return verseList.filter((verse) => {
		if (!verse?.lastReviewed) return false;
		if (!verse?.dueDate) return true;
		return new Date(verse.dueDate) <= now;
	}).length;
}

function canExtendForActivity(activityType, dueCount) {
	if (activityType === 'review') {
		return dueCount === 0;
	}

	if (activityType === 'learning' || activityType === 'practice') {
		return dueCount === 0;
	}

	return false;
}

export function initializeDailyStreakOnOpen() {
	const now = new Date();
	const todayKey = toDateKey(now);
	const yesterdayKey = getYesterdayKey(now);

	streakData.update((state) => normalizeForToday(state, todayKey, yesterdayKey));
}

export function registerStreakActivity(activityType) {
	let extended = false;

	streakData.update((state) => {
		const now = new Date();
		const todayKey = toDateKey(now);
		const yesterdayKey = getYesterdayKey(now);
		const baseState = normalizeForToday(state, todayKey, yesterdayKey);

		if (baseState.lastActiveDate === todayKey) {
			return baseState;
		}

		const dueCount = countDueVerses(get(verses), now);
		if (!canExtendForActivity(activityType, dueCount)) {
			return baseState;
		}

		const nextCurrent = baseState.current + 1;
		extended = true;

		return {
			...baseState,
			current: nextCurrent,
			best: Math.max(baseState.best, nextCurrent),
			lastActiveDate: todayKey
		};
	});

	if (extended) {
		enqueueToast({ type: 'streak' });
	}

	return extended;
}

export function getDueVerseCountForStreak() {
	return countDueVerses(get(verses));
}

export function isStreakDateKeyValid(dateKey) {
	return Boolean(fromDateKey(dateKey));
}

export function setCurrentStreakDays(days) {
	const normalizedDays = Math.max(0, Number.parseInt(days, 10) || 0);
	const todayKey = toDateKey(new Date());

	streakData.update((state) => {
		const safeState = normalizeState(state);
		return {
			...safeState,
			current: normalizedDays,
			best: Math.max(safeState.best, normalizedDays),
			lastActiveDate: normalizedDays > 0 ? todayKey : null
		};
	});
}
