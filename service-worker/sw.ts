import { cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { CacheExpiration } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()

// Skip problematic precaching - use runtime caching instead
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.matchAll({ type: 'window' }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({ type: 'SKIP_WAITING' })
    })
  })
})

// Cache pages on demand
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheExpiration({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60
      })
    ]
  })
)

// Cache API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheExpiration({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60
      })
    ]
  })
)

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'image',
  new CacheFirst({
    cacheName: 'assets',
    plugins: [
      new CacheExpiration({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
)

// Cache HLS playlists
registerRoute(
  ({ url }) => url.pathname.endsWith('.m3u8'),
  new NetworkFirst({
    cacheName: 'hls-playlists',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheExpiration({
        maxEntries: 20,
        maxAgeSeconds: 3600
      })
    ]
  })
)

// Cache video segments
registerRoute(
  ({ url }) => url.pathname.endsWith('.ts'),
  new CacheFirst({
    cacheName: 'video-segments',
    plugins: [
      new CacheExpiration({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60
      })
    ]
  })
)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.matchAll({ type: 'window' }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({ type: 'SKIP_WAITING' })
    })
  })
})

registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new CacheExpiration({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60
      })
    ]
  })
)

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheExpiration({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60
      })
    ]
  })
)

registerRoute(
  ({ url }) => url.pathname.endsWith('.m3u8'),
  new NetworkFirst({
    cacheName: 'hls-playlists',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheExpiration({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60
      })
    ]
  })
)

registerRoute(
  ({ url }) => url.pathname.endsWith('.ts') && url.pathname.includes('segments'),
  new CacheFirst({
    cacheName: 'video-segments',
    plugins: [
      new CacheExpiration({
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60
      })
    ]
  })
)

registerRoute(
  ({ url }) => /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheExpiration({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
)
