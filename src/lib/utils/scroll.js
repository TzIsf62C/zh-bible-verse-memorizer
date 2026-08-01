export function scrollRootToTopLeft() {
	if (typeof window === 'undefined') return;

	const reset = () => {
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
		if (typeof document !== 'undefined') {
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	};

	// Run immediately, then once on the next frame to handle modal/state unmount timing.
	reset();
	requestAnimationFrame(reset);
}
