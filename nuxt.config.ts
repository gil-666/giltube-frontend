export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  pages: true,
  srcDir: './',

  dir: {
    pages: 'pages'
  },

  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },

  app: {
    head: {
      favicon: '/favicon.ico',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#1f2937' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Giltube' }
      ]
    }
  },

  pwa: {
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    manifest: {
      name: 'Giltube',
      short_name: 'Giltube',
      description: 'Video streaming platform',
      theme_color: '#1f2937',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-maskable-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        {
          src: '/screenshot-wide.png',
          sizes: '540x720',
          type: 'image/png',
          form_factor: 'wide'
        },
        {
          src: '/screenshot-narrow.png',
          sizes: '270x540',
          type: 'image/png',
          form_factor: 'narrow'
        }
      ],
      categories: ['video', 'entertainment'],
      shortcuts: [
        {
          name: 'Upload Video',
          short_name: 'Upload',
          description: 'Upload a new video',
          url: '/upload'
        }
      ]
    },
    workbox: {
      globPatterns: [],
      globIgnores: [
        'node_modules/**/*',
        '.nuxt/**/*',
        '.output/**/*',
        'dist/**/*',
        '**/**/builds/**',
        '**/stats.html'
      ],
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\/api\/v1\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 300
            }
          }
        },
        {
          urlPattern: /\.m3u8$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'hls-cache',
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 3600
            }
          }
        },
        {
          urlPattern: /\.ts$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'video-segments',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 86400
            }
          }
        }
      ]
    }
  }
})