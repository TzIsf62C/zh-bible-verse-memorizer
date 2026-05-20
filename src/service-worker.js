import { build, files, prerendered, version } from '$service-worker';

const APP_CACHE = `app-shell-${version}`;
const RUNTIME_CACHE = `runtime-${version}`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const OFFLINE_URL = `${SCOPE_PATH}/offline.html`;
const APP_SHELL_FALLBACKS = [`${SCOPE_PATH}/`, `${SCOPE_PATH}/index.html`, OFFLINE_URL];

const PRECACHE_URLS = [...new Set([...build, ...files, ...prerendered, OFFLINE_URL])];
const PRECACHE_SET = new Set(PRECACHE_URLS);

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(APP_CACHE);
			await cache.addAll(PRECACHE_URLS);
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
	const cachedByPath = await cache.match(pathname);
	if (cachedByPath) {
		return cachedByPath;
	}

	const cachedByRequest = await cache.match(request);
	if (cachedByRequest) {
		return cachedByRequest;
	}

	return fetch(request);
}

async function handleNavigationRequest(request) {
	try {
		const response = await fetch(request);
		if (response && response.ok) {
			const cache = await caches.open(RUNTIME_CACHE);
			await cache.put(request, response.clone());
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

	const networkPromise = fetch(request)
		.then((response) => {
			if (response && response.ok) {
				event.waitUntil(cache.put(request, response.clone()));
			}
			return response;
		})
		.catch(() => null);

	return cached || networkPromise || new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

async function networkFirstData(request, event) {
	try {
		const response = await fetch(request);
		if (response && response.ok) {
			const cache = await caches.open(RUNTIME_CACHE);
			event.waitUntil(cache.put(request, response.clone()));
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