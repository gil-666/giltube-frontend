import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  // Get the saved locale from cookie
  const localeCookie = useCookie('gilTube_locale')
  const savedLocale = localeCookie.value

  // If there's no saved locale cookie, don't force a redirect or default here.
  if (!savedLocale) return

  // Routes that should not be prefixed
  const skipPrefixRoutes = ['/login', '/register']

  // Check if route already has locale prefix
  const hasLocalePrefix = /^\/[a-z]{2}(?:\/|$)/.test(to.path)
  const routeWithoutPrefix = to.path.replace(/^\/[a-z]{2}/, '') || '/'

  // For Spanish locale
  if (savedLocale === 'es') {
    // If route doesn't have /es prefix and shouldn't be skipped, redirect
    if (!hasLocalePrefix && !skipPrefixRoutes.some(r => routeWithoutPrefix.startsWith(r))) {
      return navigateTo(`/es${to.path}`)
    }
  } else {
    // For English locale
    // If route has /es prefix, redirect to English version
    if (hasLocalePrefix && to.path.startsWith('/es')) {
      return navigateTo(routeWithoutPrefix)
    }
  }
})
