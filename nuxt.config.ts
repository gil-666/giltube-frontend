const config = {
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt', '@nuxtjs/i18n'],
  tailwindcss: {
    config: {
      // The module's default globs don't cover app/components/**; opt files in here.
      content: ['./app/components/videoplayer/ClipEditor.vue'],
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
          },
          // One neutral scale for the whole UI: near-black canvas with evenly
          // spaced, slightly cool surface steps. gray mirrors zinc so older
          // markup that mixes the two stays consistent.
          colors: {
            zinc: {
              50: '#fafafb', 100: '#f2f2f4', 200: '#e2e2e6', 300: '#c8c8cf', 400: '#9b9ba5',
              500: '#6c6c76', 600: '#4a4a52', 700: '#333339', 800: '#232328', 900: '#16161a', 950: '#0c0c0e',
            },
            gray: {
              50: '#fafafb', 100: '#f2f2f4', 200: '#e2e2e6', 300: '#c8c8cf', 400: '#9b9ba5',
              500: '#6c6c76', 600: '#4a4a52', 700: '#333339', 800: '#232328', 900: '#16161a', 950: '#0c0c0e',
            },
          },
        },
      },
    }
  },
  pages: true,
  srcDir: './',

  dir: {
    pages: 'pages'
  },

  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
  routeRules: {
    '/.well-known/assetlinks.json': {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=300, must-revalidate'
      }
    }
  },
  i18n: {
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: 'locales/',
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json' },
      { code: 'es', language: 'es-MX', file: 'es.json' }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'gilTube_locale',
      redirectOn: 'root'
    }
  },
  runtimeConfig: {
    apiInternalUrl: 'http://localhost:8080/api/v1',
    public: {
      siteUrl: 'http://localhost:3000',
      localUploadBaseUrl: 'http://localhost:8080/api/v1'
    }
  },

  app: {
    pageTransition: { name: 'page-shift' },
    layoutTransition: { name: 'layout-shift' },
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&display=swap' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#0c0c0e' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'GilTube' }
      ]
    }
  },

  pwa: {
    injectRegister: false,
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true
    },
    manifest: {
      name: 'GilTube',
      short_name: 'GilTube',
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
    injectManifest: {
      globPatterns: [],
      rollupFormat: 'iife',
    }
  }
} as any

export default defineNuxtConfig(config)
