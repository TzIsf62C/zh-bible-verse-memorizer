Inspect the app as if you are designing an **app shell plus offline fallback** system, not just a generic cache. It should identify every file that must be present for the UI to boot, every route that must work offline, and every network dependency that would break when the host is down or blocked. [svelte](https://svelte.dev/docs/kit/service-workers)

## What to investigate

- The app entry points and boot path: `src/routes/+layout.*`, `src/routes/+page.*`, any root HTML template, and the client bootstrap code that registers the service worker. [github](https://github.com/sveltejs/kit/issues/3498)
- The production build output shape, because the SW should precache the built JS/CSS/assets that SvelteKit emits rather than only source files. [polymer-2-dot-polymer-project.appspot](https://polymer-2-dot-polymer-project.appspot.com/2.0/toolbox/service-worker)
- The `static/` folder, icons, manifest, fonts, and any files the first render needs before the app can display anything. [polymer-library.polymer-project](https://polymer-library.polymer-project.org/3.0/docs/apps/service-worker)
- All navigation routes, especially which ones should fall back to the cached shell or an `offline.html` page when the network fails. [paul.kinlan](https://paul.kinlan.me/offline-fallback-page-with-service-worker/)
- All API endpoints, remote fetches, and third-party resources, because those need a separate strategy from HTML navigations and may need local persistence or graceful degradation. [developer.mozilla](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/fetch_event)
- Any dynamic assets, query-string URLs, or CMS/media URLs that could create cache-miss problems if matched too literally. [stackoverflow](https://stackoverflow.com/questions/66876809/how-to-pre-cache-a-workbox-navigationroute-networkfirst-request)

## Questions the agent should answer

- What is the minimal set of files required to render the app shell offline?
- Which routes should use network-first, cache-first, or offline fallback?
- Which requests must never be turned into HTML fallback responses, such as JS, CSS, images, and API calls ? [stackoverflow](https://stackoverflow.com/questions/69806198/service-worker-returns-offline-html-page-for-javascript-files)
- Which assets are safe to precache at install time, and which are too dynamic or too large?
- What cache versioning and invalidation strategy matches the app’s release process ? [developer.chrome](https://developer.chrome.com/docs/workbox/precaching-dos-and-donts)

## Files and behaviors to map

- App shell files: root HTML, main layout, key route components, CSS, and startup JS. [svelte](https://svelte.dev/docs/kit/service-workers)
- Offline fallback file: a self-contained `offline.html` or equivalent UI. [dev](https://dev.to/chromiumdev/offline-fallback-page-with-service-worker-1jfe)
- Manifest and icons: needed so the installed app still looks and launches correctly. [polymer-library.polymer-project](https://polymer-library.polymer-project.org/3.0/docs/apps/service-worker)
- Static assets: images, fonts, and local libraries that the shell depends on. [developer.chrome](https://developer.chrome.com/docs/workbox/precaching-dos-and-donts)
- Data layer: API calls, IndexedDB usage, local storage, and any sync queue for edits made offline. [developer.mozilla](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent)

## SW design constraints

The agent should verify that navigation requests are handled only when `event.request.mode === 'navigate'`, so the SW does not mistakenly return HTML for JavaScript or other resources. It should also ensure cache writes happen with `event.waitUntil()` where needed, and that version updates use `skipWaiting()` and `clients.claim()` only after the new shell is complete. [developer.mozilla](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting)

## Implementation target

The end goal is a service worker that precaches the shell, serves cached navigations when the host is unavailable, and keeps data requests separate from page requests. For SvelteKit, that usually means working from the built output plus `static/`, not from source files alone. [github](https://github.com/sveltejs/kit/issues/3498)

A concise instruction to the agent would be: “Inventory the app shell, build artifacts, static assets, routes, and network dependencies; determine the offline-critical subset; then generate a service worker that precaches that subset and uses separate strategies for navigations, static assets, and API/data requests.” [polymer-2-dot-polymer-project.appspot](https://polymer-2-dot-polymer-project.appspot.com/2.0/toolbox/service-worker)