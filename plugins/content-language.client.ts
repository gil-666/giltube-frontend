import { watch } from 'vue'
import { setContentLanguage } from '~/app/service/client'
import { clearMovieCache } from '~/app/service/movies'
import { clearSeriesCache } from '~/app/service/series'

// Public catalog requests follow the site language: Spanish pages get Spanish
// titles and synopses. Cached English (or Spanish) data is dropped on a switch.
export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: { value: string } }
  const apply = (locale: string) => {
    setContentLanguage(String(locale || '').toLowerCase().startsWith('es') ? 'es' : '')
  }
  apply(i18n.locale.value)
  watch(() => i18n.locale.value, (locale) => {
    apply(locale)
    clearMovieCache()
    clearSeriesCache()
  })
})
