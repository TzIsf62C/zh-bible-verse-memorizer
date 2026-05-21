import { derived, get, writable } from 'svelte/store';

const queueStore = writable([]);

export const toastQueue = derived(queueStore, ($queue) => $queue);

function makeToastId(prefix = 'toast') {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueueToast(toast) {
	if (!toast || typeof toast !== 'object') return;
	queueStore.update((queue) => {
		const nextToast = {
			id: toast.id || makeToastId(toast.type || 'toast'),
			...toast
		};

		if (nextToast.type === 'streak') {
			const firstNonStreakIndex = queue.findIndex((item) => item?.type !== 'streak');
			if (firstNonStreakIndex === -1) {
				return [...queue, nextToast];
			}
			return [
				...queue.slice(0, firstNonStreakIndex),
				nextToast,
				...queue.slice(firstNonStreakIndex)
			];
		}

		return [...queue, nextToast];
	});
}

export function dequeueToast() {
	const queue = get(queueStore);
	if (!queue || queue.length === 0) {
		return null;
	}

	const [firstItem, ...rest] = queue;
	queueStore.set(rest);
	return firstItem;
}
