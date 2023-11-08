const CACHE_NAME = 'weather-cache-1';
const MAIN_URLS = ['/', '/css/styles.css', '/src/main.js'];

self.addEventListener('install', event => {
	// waitUntil() ensures installing isn't complete until the following promise resolves
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return fetch('/json/icons.json')
				.then(response => response.json())
				.then(icons => {
					const iconURLs = icons.map(icon => icon.src);
					const allURLs = MAIN_URLS.concat(iconURLs);
					// Add all fetched URLs to the cache
					return cache.addAll(allURLs);
				});
		})
	);
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
