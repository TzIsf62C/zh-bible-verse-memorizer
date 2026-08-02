import { build, files, prerendered, version } from '$service-worker';

const APP_CACHE = `app-shell-${version}`;
const RUNTIME_CACHE = `runtime-${version}`;
const RUNTIME_MAX_ENTRIES = 250;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const OFFLINE_URL = `${SCOPE_PATH}/offline.html`;
const APP_SHELL_FALLBACKS = [`${SCOPE_PATH}/`, `${SCOPE_PATH}/index.html`, OFFLINE_URL];

const PRECACHE_URLS = [...new Set([...build, ...files, ...prerendered, OFFLINE_URL])];
const PRECACHE_SET = new Set(PRECACHE_URLS);

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(APP_CACHE);
			const failures = [];

			await Promise.all(
				PRECACHE_URLS.map(async (url) => {
					try {
						await cache.add(url);
					} catch {
						failures.push(url);
					}
				})
			);

			const hasOfflineFallback = !failures.includes(OFFLINE_URL);
			const hasNavigationShell = [`${SCOPE_PATH}/`, `${SCOPE_PATH}/index.html`].some(
				(url) => !failures.includes(url)
			);

			if (!hasOfflineFallback || !hasNavigationShell) {
				throw new Error('Service worker install failed: critical shell assets are unavailable');
			}

			if (failures.length > 0) {
				console.warn('[SW] Optional precache assets failed to cache', failures);
			}
		})()
	);
});

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((cacheName) => {
						const appCache = cacheName.startsWith('app-shell-') && cacheName !== APP_CACHE;
						const runtimeCache = cacheName.startsWith('runtime-') && cacheName !== RUNTIME_CACHE;
						return appCache || runtimeCache;
					})
					.map((cacheName) => caches.delete(cacheName))
			);

			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;

	if (request.method !== 'GET') {
		return;
	}

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) {
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(handleNavigationRequest(request));
		return;
	}

	if (PRECACHE_SET.has(url.pathname)) {
		event.respondWith(cacheFirstPrecached(url.pathname, request));
		return;
	}

	if (isStaticAssetRequest(request)) {
		event.respondWith(staleWhileRevalidate(request, event));
		return;
	}

	event.respondWith(networkFirstData(request, event));
});

function isStaticAssetRequest(request) {
	return ['style', 'script', 'worker', 'font', 'image'].includes(request.destination);
}

async function cacheFirstPrecached(pathname, request) {
	const cache = await caches.open(APP_CACHE);
	const cachedByRequest = await cache.match(request, { ignoreSearch: true });
	if (cachedByRequest) {
		return cachedByRequest;
	}

	const cachedByPath = await cache.match(pathname);
	if (cachedByPath) {
		return cachedByPath;
	}

	return fetch(request);
}

async function handleNavigationRequest(request) {
	try {
		const response = await fetch(request);
		if (response && response.ok) {
			const cache = await caches.open(RUNTIME_CACHE);
			await cache.put(request, response.clone());
			await trimCache(cache, RUNTIME_MAX_ENTRIES);
		}

		return response;
	} catch {
		const runtimeCache = await caches.open(RUNTIME_CACHE);
		const cachedNavigation = await runtimeCache.match(request, { ignoreSearch: true });
		if (cachedNavigation) {
			return cachedNavigation;
		}

		const appCache = await caches.open(APP_CACHE);
		for (const fallback of APP_SHELL_FALLBACKS) {
			const cachedFallback = await appCache.match(fallback);
			if (cachedFallback) {
				return cachedFallback;
			}
		}

		return new Response('Offline', {
			status: 503,
			statusText: 'Service Unavailable',
			headers: {
				'Content-Type': 'text/plain; charset=utf-8'
			}
		});
	}
}

async function staleWhileRevalidate(request, event) {
	const cache = await caches.open(RUNTIME_CACHE);
	const cached = await cache.match(request);

	const updateFromNetwork = async () => {
		try {
			const response = await fetch(request);
			if (response && response.ok) {
				event.waitUntil(
					(async () => {
						await cache.put(request, response.clone());
						await trimCache(cache, RUNTIME_MAX_ENTRIES);
					})()
				);
			}
			return response;
		} catch {
			return null;
		}
	};

	if (cached) {
		event.waitUntil(updateFromNetwork());
		return cached;
	}

	const networkResponse = await updateFromNetwork();
	if (networkResponse) {
		return networkResponse;
	}

	return new Response('Offline', {
		status: 503,
		statusText: 'Service Unavailable',
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
}

async function networkFirstData(request, event) {
	try {
		const response = await fetch(request);
		if (shouldCacheDataResponse(request, response)) {
			const cache = await caches.open(RUNTIME_CACHE);
			event.waitUntil(
				(async () => {
					await cache.put(request, response.clone());
					await trimCache(cache, RUNTIME_MAX_ENTRIES);
				})()
			);
		}
		return response;
	} catch {
		const cache = await caches.open(RUNTIME_CACHE);
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}

		const acceptsJson = request.headers.get('accept')?.includes('application/json');
		if (acceptsJson) {
			return new Response(JSON.stringify({ error: 'offline' }), {
				status: 503,
				headers: {
					'Content-Type': 'application/json; charset=utf-8'
				}
			});
		}

		return new Response('Offline', {
			status: 503,
			statusText: 'Service Unavailable',
			headers: {
				'Content-Type': 'text/plain; charset=utf-8'
			}
		});
	}
}

function shouldCacheDataResponse(request, response) {
	if (!response || !response.ok) {
		return false;
	}

	const cacheControl = response.headers.get('cache-control')?.toLowerCase() || '';
	if (cacheControl.includes('no-store') || cacheControl.includes('private')) {
		return false;
	}

	const contentType = response.headers.get('content-type')?.toLowerCase() || '';
	if (contentType.includes('text/html')) {
		return false;
	}

	const url = new URL(request.url);
	if (url.pathname.endsWith('/service-worker.js') || url.pathname.endsWith('/sw.js')) {
		return false;
	}

	return true;
}

async function trimCache(cache, maxEntries) {
	const keys = await cache.keys();
	if (keys.length <= maxEntries) {
		return;
	}

	const deleteCount = keys.length - maxEntries;
	for (let i = 0; i < deleteCount; i += 1) {
		await cache.delete(keys[i]);
	}
}