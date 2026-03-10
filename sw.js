// GLS MET Power — Service Worker v3
const CACHE_NAME = 'glsmp-v3';

// Only cache the shell — don't cache Firebase/API calls
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL))
      .catch(() => {}) // fail silently if offline
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept Firebase, Anthropic, Google APIs — let them go direct
  if (
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com') ||
    url.includes('anthropic.com') ||
    url.includes('gstatic.com') ||
    e.request.method !== 'GET'
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache fresh copy of page shell
        if (url.includes('index.html') || url === self.location.origin + '/') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(r =>
          r || new Response('Offline — please reconnect', { status: 503 })
        )
      )
  );
});
