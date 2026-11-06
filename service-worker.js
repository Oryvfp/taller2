const CACHE_NAME = 'frenos-movil-shell-v2';
const APP_ROOT = self.registration.scope;
const APP_URL = new URL('insertpatentes.html', APP_ROOT).href;
const SHELL_URLS = [
    APP_URL,
    new URL('manifest.webmanifest', APP_ROOT).href,
    new URL('pwa-icon-192.png', APP_ROOT).href,
    new URL('pwa-icon-512.png', APP_ROOT).href,
    new URL('images/LOGO.png', APP_ROOT).href
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith('frenos-movil-shell-') && key !== CACHE_NAME)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(request)) || caches.match(APP_URL))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request).then(response => {
            if (response.ok && response.type === 'basic') {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            }
            return response;
        }))
    );
});
