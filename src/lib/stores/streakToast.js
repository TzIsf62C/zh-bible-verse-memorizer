import { derived, get, writable } from 'svelte/store';

const queueStore = writable([]);

export const streakToastQueue = derived(queueStore, ($queue) => $queue);

export function enqueueStreakToast() {
	queueStore.update((queue) => [
		...queue,
		{
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
		}
	]);
}

export function dequeueStreakToast() {
	const queue = get(queueStore);
	if (!queue || queue.length === 0) {
		return null;
	}

	const [first, ...rest] = queue;
	queueStore.set(rest);
	return first;
}
