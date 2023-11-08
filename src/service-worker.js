const CACHE_NAME = 'weather-cache-1';
const CACHE_URLS = [
	'/',
	'/css/styles.css',
	'/src/main.js',
	'/json/cities.json',
	'/json/icons.json',
];

// Add resources to cache during install event
self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS)));
});

// Fetch event fired any time resources from CACHE_URLS is fetched
self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request).then(response => {
			// If cache is found, return - otherwise fetch from network
			return (
				response ||
				fetch(event.request).then(fetchResponse => {
					// If bad response, don't cache & return
					if (!fetchResponse || !fetchResponse.ok) {
						return fetchResponse;
					}

					// Response is a stream and can only be consumed once - to use twice, it has to be cloned (one to send to webpage, one to store in cache)
					const cachedResponse = fetchResponse.clone();
					console.log(fetchResponse, event.request);
					// Add cloned response to cache (request as key, response as value)
					caches.open(CACHE_NAME).then(cache => {
						cache.put(event.request, cachedResponse);
					});
					// Return the fetched response of the resource to render on page
					return fetchResponse;
				})
			);
		})
	);
});
