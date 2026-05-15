import { derived, get, writable } from 'svelte/store';

const queueStore = writable([]);

export const toastQueue = derived(queueStore, ($queue) => $queue);

function makeToastId(prefix = 'toast') {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueueToast(toast) {
	if (!toast || typeof toast !== 'object') return;
	queueStore.update((queue) => [
		...queue,
		{
			id: toast.id || makeToastId(toast.type || 'toast'),
			...toast
		}
	]);
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
