import { cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, NetworkOnly } from 'workbox-strategies'
import { CacheExpiration } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<any> }
const SW_BUILD_ID = 'sw-no-precache-2026-04-27-v4'

// Keep injectManifest happy by referencing __WB_MANIFEST, but do not precache
// at install time. This avoids SW install failures on transient 404 chunk URLs.
const injectedManifest = self.__WB_MANIFEST
if (injectedManifest.length < 0) {
  self.skipWaiting()
}
cleanupOutdatedCaches()

self.addEventListener('install', (_event) => {
  console.log('[SW] install build=%s', SW_BUILD_ID)
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] activate build=%s', SW_BUILD_ID)
  event.waitUntil(self.clients.claim())
})

// Pages
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

// API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/live/'),
  new NetworkOnly()
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

// Static assets
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheExpiration({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
)

// Live HLS should never be cached; stale playlists or auth-shaped failures are disruptive.
registerRoute(
  ({ url }) => url.pathname.startsWith('/live/'),
  new NetworkOnly()
)

// HLS playlists
registerRoute(
  ({ url }) => url.pathname.startsWith('/videos/') && url.pathname.endsWith('.m3u8'),
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

// HLS/video segments
registerRoute(
  ({ url }) => url.pathname.startsWith('/videos/') && url.pathname.endsWith('.ts'),
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

self.addEventListener('push', (event: PushEvent) => {
  let payload: any = {}
  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload = { title: 'GilTube', body: event.data.text() }
    }
  } else {
    payload = { title: 'GilTube', body: 'You have a new notification.', url: '/notifications' }
  }

  const title = payload.title || 'GilTube Notification'
  const icon = payload.icon || '/icon-192.png'
  console.log('[SW Push] icon=%s image=%s url=%s', icon, payload.image || '', payload.url || '')
  const options: NotificationOptions = {
    body: payload.body || 'You have a new notification.',
    icon,
    image: payload.image || payload.icon || undefined,
    data: {
      url: payload.url || '/notifications'
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/notifications'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
      return Promise.resolve(undefined)
    })
  )
})
