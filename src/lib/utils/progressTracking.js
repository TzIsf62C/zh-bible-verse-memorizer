import { PROGRESS_CATEGORIES, createEmptyProgress } from '$lib/utils/masteryProgress.js';

const DAILY_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(value) {
	return String(value).padStart(2, '0');
}

export function getDateKey(now = new Date()) {
	return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function parseDateKey(dateKey) {
	const [year, month, day] = String(dateKey || '')
		.split('-')
		.map((value) => Number(value));
	if (!year || !month || !day) return null;
	const parsed = new Date(year, month - 1, day);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
}

function toDateFromAny(entry) {
	if (entry?.date) {
		const keyDate = parseDateKey(entry.date);
		if (keyDate) return keyDate;
	}
	if (entry?.updatedAt) {
		const parsed = new Date(entry.updatedAt);
		if (!Number.isNaN(parsed.getTime())) return parsed;
	}
	return null;
}

function startOfWeek(date) {
	const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = local.getDay();
	const diffToMonday = (day + 6) % 7;
	local.setDate(local.getDate() - diffToMonday);
	return local;
}

export function getWeekKey(now = new Date()) {
	const weekStart = startOfWeek(now);
	return getDateKey(weekStart);
}

function getWeekEnd(weekStartDate) {
	const weekEnd = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate());
	weekEnd.setDate(weekEnd.getDate() + 6);
	return weekEnd;
}

function normalizeProgress(progress) {
	const empty = createEmptyProgress();
	PROGRESS_CATEGORIES.forEach((key) => {
		empty[key] = Number(progress?.[key] || 0);
	});
	return empty;
}

function normalizeEntry(entry) {
	const inferredDate = toDateFromAny(entry);
	const date = entry?.date || (inferredDate ? getDateKey(inferredDate) : null);
	if (!date) return null;

	const kind = entry?.kind === 'week' ? 'week' : 'day';
	const updatedAt = entry?.updatedAt || new Date().toISOString();
	const normalized = {
		kind,
		date,
		updatedAt,
		...normalizeProgress(entry)
	};

	if (kind === 'week') {
		const weekStartDate = parseDateKey(entry?.weekStart || entry?.date) || parseDateKey(date);
		if (!weekStartDate) return null;
		const weekEndDate = parseDateKey(entry?.weekEnd) || getWeekEnd(weekStartDate);
		normalized.weekStart = getDateKey(weekStartDate);
		normalized.weekEnd = getDateKey(weekEndDate);
		normalized.weekKey = entry?.weekKey || normalized.weekStart;
	}

	return normalized;
}

function getEntrySortTime(entry) {
	if (entry.kind === 'week' && entry.weekEnd) {
		const weekEndDate = parseDateKey(entry.weekEnd);
		if (weekEndDate) return weekEndDate.getTime();
	}
	const date = parseDateKey(entry.date);
	if (date) return date.getTime();
	const updatedAt = new Date(entry.updatedAt);
	return Number.isNaN(updatedAt.getTime()) ? 0 : updatedAt.getTime();
}

function dedupeDailyEntries(entries) {
	const byDate = new Map();
	entries.forEach((entry) => {
		if (entry.kind !== 'day') return;
		const existing = byDate.get(entry.date);
		if (!existing || new Date(entry.updatedAt) > new Date(existing.updatedAt)) {
			byDate.set(entry.date, entry);
		}
	});
	return Array.from(byDate.values());
}

function dedupeWeeklyEntries(entries) {
	const byWeekKey = new Map();
	entries.forEach((entry) => {
		if (entry.kind !== 'week') return;
		const weekKey = entry.weekKey || entry.weekStart || entry.date;
		const existing = byWeekKey.get(weekKey);
		if (!existing || new Date(entry.updatedAt) > new Date(existing.updatedAt)) {
			byWeekKey.set(weekKey, {
				...entry,
				weekKey
			});
		}
	});
	return Array.from(byWeekKey.values());
}

function compressDailyToWeekly(dailyEntries) {
	const byWeekKey = new Map();
	dailyEntries.forEach((entry) => {
		const dateObj = parseDateKey(entry.date);
		if (!dateObj) return;
		const weekStartDate = startOfWeek(dateObj);
		const weekStart = getDateKey(weekStartDate);
		const weekEnd = getDateKey(getWeekEnd(weekStartDate));
		const existing = byWeekKey.get(weekStart);
		if (!existing || new Date(entry.updatedAt) > new Date(existing.updatedAt)) {
			byWeekKey.set(weekStart, {
				kind: 'week',
				date: weekStart,
				weekKey: weekStart,
				weekStart,
				weekEnd,
				updatedAt: entry.updatedAt,
				...normalizeProgress(entry)
			});
		}
	});
	return Array.from(byWeekKey.values());
}

export function hasMeaningfulChange(previous, next) {
	return PROGRESS_CATEGORIES.some((key) => Number(previous?.[key] || 0) !== Number(next?.[key] || 0));
}

export function hasTodaySnapshot(history, now = new Date()) {
	const today = getDateKey(now);
	return Array.isArray(history) && history.some((entry) => entry.kind === 'day' && entry.date === today);
}

export function upsertTodaySnapshot(history, currentProgress, now = new Date()) {
	const today = getDateKey(now);
	const timestamp = now.toISOString();
	const normalizedProgress = normalizeProgress(currentProgress);
	const normalizedHistory = Array.isArray(history)
		? history.map(normalizeEntry).filter(Boolean)
		: [];

	let found = false;
	const updated = normalizedHistory.map((entry) => {
		if (entry.kind === 'day' && entry.date === today) {
			found = true;
			return {
				kind: 'day',
				date: today,
				updatedAt: timestamp,
				...normalizedProgress
			};
		}
		return entry;
	});

	if (!found) {
		updated.push({
			kind: 'day',
			date: today,
			updatedAt: timestamp,
			...normalizedProgress
		});
	}

	return updated;
}

export function applyHybridRetention(history, now = new Date()) {
	const normalizedHistory = Array.isArray(history)
		? history.map(normalizeEntry).filter(Boolean)
		: [];

	const dailyEntries = dedupeDailyEntries(normalizedHistory);
	const existingWeeklyEntries = dedupeWeeklyEntries(normalizedHistory);

	const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	cutoffDate.setDate(cutoffDate.getDate() - (DAILY_WINDOW_DAYS - 1));
	const cutoffTime = cutoffDate.getTime();

	const recentDaily = [];
	const oldDaily = [];
	dailyEntries.forEach((entry) => {
		const parsed = parseDateKey(entry.date);
		if (!parsed) return;
		if (parsed.getTime() >= cutoffTime) {
			recentDaily.push(entry);
		} else {
			oldDaily.push(entry);
		}
	});

	const rolledWeekly = compressDailyToWeekly(oldDaily);
	const mergedWeekly = dedupeWeeklyEntries([...existingWeeklyEntries, ...rolledWeekly]);

	const allEntries = [...mergedWeekly, ...recentDaily].sort((a, b) => getEntrySortTime(a) - getEntrySortTime(b));
	return allEntries;
}

export function normalizeProgressTrackingState(state) {
	const normalizedCurrent = normalizeProgress(state?.currentProgress);
	const normalizedHistory = applyHybridRetention(state?.progressHistory || []);
	return {
		currentProgress: normalizedCurrent,
		progressHistory: normalizedHistory,
		lastUpdatedAt: state?.lastUpdatedAt || null
	};
}
