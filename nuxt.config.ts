const THEME_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const themeColor = (name: string) => `rgb(var(--gt-${name}) / <alpha-value>)`
const STATUS_HUES = ['red', 'emerald', 'amber', 'green', 'yellow', 'cyan', 'purple', 'rose', 'pink', 'violet']
const themeRadius = (rem: number) => `calc(${rem}rem * var(--gt-radius-scale))`
const themeScale = (name: string) => Object.fromEntries(THEME_STEPS.map(step => [step, themeColor(`${name}-${step}`)]))

const config = {
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt', '@nuxtjs/i18n'],
  css: ['~/assets/css/theme.css'],
  tailwindcss: {
    config: {
      // The module's default globs don't cover app/** (components there are
      // imported directly rather than auto-registered), so scan it explicitly.
      content: ['./app/components/**/*.vue', './app/**/*.ts'],
      theme: {
        extend: {
          // --gt-font and --gt-radius-scale are theme choices; their defaults
          // (Inter, 1) reproduce the stock look.
          fontFamily: {
            sans: ['var(--gt-font)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
          },
          borderRadius: {
            sm: themeRadius(0.125),
            DEFAULT: themeRadius(0.25),
            md: themeRadius(0.375),
            lg: themeRadius(0.5),
            xl: themeRadius(0.75),
            '2xl': themeRadius(1),
            '3xl': themeRadius(1.5),
          },
          // Every palette the UI paints with reads a CSS variable holding an
          // "R G B" triplet, so a site theme can repaint the whole UI. The stock
          // values live in assets/css/theme.css; app/utils/theme.ts derives
          // the rest. zinc/gray are the neutral surfaces (gray mirrors zinc so
          // older markup stays consistent), white is the foreground, blue is
          // the accent, and primary is the brand color. red stays a fixed
          // palette for errors and destructive actions. The status hues keep
          // their stock values but are mirrored on light themes (theme.css).
          colors: {
            zinc: themeScale('zinc'),
            gray: themeScale('zinc'),
            white: themeColor('white'),
            blue: themeScale('accent'),
            primary: { ...themeScale('primary'), DEFAULT: themeColor('primary') },
            accent: { ...themeScale('accent'), DEFAULT: themeColor('accent') },
            'on-primary': themeColor('on-primary'),
            'on-accent': themeColor('on-accent'),
            ...Object.fromEntries(STATUS_HUES.map(hue => [hue, themeScale(hue)])),
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
