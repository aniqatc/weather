// Key for cache storage. Bump the version whenever caching rules change; old caches are deleted on activate.
const CACHE_NAME = 'weather-cache-v2';
// App shell to cache on install
const MAIN_URLS = ['/', '/css/styles.css', '/src/main.js', '/json/icons.json', '/manifest.json'];

self.addEventListener('install', (event) => {
	// waitUntil() ensures installing isn't complete until the following promise resolves
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return fetch('/json/icons.json')
				.then((response) => response.json())
				.then((icons) => {
					// Several weather codes share an icon; addAll() fails on duplicate URLs, so dedupe first
					const iconURLs = icons.map((icon) => icon.src);
					const allURLs = [...new Set(MAIN_URLS.concat(iconURLs))];
					return cache.addAll(allURLs);
				});
		}),
	);
	// Activate the new worker right away instead of waiting for every tab to close
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// Remove caches from older versions so users don't keep stale files
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);

	// Only handle the site's own GET requests. Weather API calls and CDN files go straight to the
	// network, so weather data is never served from cache.
	if (request.method !== 'GET' || url.origin !== self.location.origin) {
		return;
	}

	// Pages: network first so updates show up immediately; fall back to the cached page when offline
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.ok) {
						const copy = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
					}
					return response;
				})
				.catch(() => caches.match('/')),
		);
		return;
	}

	// Everything else (CSS, JS, icons, city search shards): serve from cache when available for speed,
	// and refresh the cached copy in the background so the next visit gets the latest version
	event.respondWith(
		caches.open(CACHE_NAME).then((cache) =>
			cache.match(request).then((cached) => {
				const network = fetch(request)
					.then((response) => {
						if (response.ok) {
							// A response can only be read once, so store a clone and return the original
							cache.put(request, response.clone());
						}
						return response;
					})
					.catch(() => cached || Response.error());
				return cached || network;
			}),
		),
	);
});
