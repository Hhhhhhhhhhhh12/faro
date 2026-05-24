// Faro Service Worker — cache-first for static assets, network-first for API calls
const CACHE = 'faro-v1'
const STATIC = ['/']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Always network-first for external APIs
  if (url.hostname !== self.location.hostname) return

  // Cache-first for same-origin assets
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ?? fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
    )
  )
})
