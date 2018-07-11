const CACHE_NAME = 'mws-restaurant-v22';

self.addEventListener('install', event => {
    const urlsToCache = [
        '/',
        './index.html',
        './restaurant.html',
        './js/dbhelper.js',
        './js/main.js',
        './js/restaurant_info.js',
        './js/idb.js',
        './css/styles.css',
        './data/restaurants.json',
        './destImg',
        './img/icon-512.png',
        './manifest.json'
    ];

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('mws-restaurant-') && cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            )
        )
    );
});

self.addEventListener('fetch', event => {
    const requestURL = new URL(event.request.url);
    if (requestURL.origin === location.origin || requestURL.hostname === 'localhost') {
        event.respondWith(
            caches
                .match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    const fetchRequest = event.request.clone();
                    return fetch(fetchRequest).then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));

                        return response;
                    });
                })
        );
    }
});
