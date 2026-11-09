import { tryUseNuxtApp } from '#app'

type TimeAgoUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

const TIME_AGO_STRINGS = {
  en: {
    unknown: 'Unknown',
    justNow: 'just now',
    unit: (unit: TimeAgoUnit, n: number) => {
      const suffix = { minute: 'm', hour: 'h', day: 'd', week: 'w', month: 'mo', year: 'y' }[unit]
      return `${n}${suffix} ago`
    },
  },
  es: {
    unknown: 'Desconocido',
    justNow: 'hace un momento',
    unit: (unit: TimeAgoUnit, n: number) => {
      const label = {
        minute: () => 'min',
        hour: () => 'h',
        day: () => (n === 1 ? ' día' : ' días'),
        week: () => (n === 1 ? ' semana' : ' semanas'),
        month: () => (n === 1 ? ' mes' : ' meses'),
        year: () => (n === 1 ? ' año' : ' años'),
      }[unit]()
      return unit === 'minute' ? `hace ${n} ${label}` : `hace ${n}${label}`
    },
  },
} as const

// Falls back to the active i18n locale so existing getTimeAgo(date) callers
// pick up the language without having to thread `locale` through.
const currentLocale = (): string => {
  try {
    const i18n = tryUseNuxtApp()?.$i18n as { locale?: { value?: string } } | undefined
    return i18n?.locale?.value || 'en'
  } catch {
    return 'en'
  }
}

export const getTimeAgo = (dateString: string, locale?: string): string => {
  const lang = (locale || currentLocale()).toLowerCase().startsWith('es') ? 'es' : 'en'
  const strings = TIME_AGO_STRINGS[lang]
  if (!dateString) return strings.unknown

  // Parse the ISO string and convert to milliseconds
  const date = new Date(dateString).getTime()
  if (Number.isNaN(date)) return strings.unknown

  const now = new Date().getTime()
  const secondsAgo = Math.floor((now - date) / 1000)

  // Small future values are usually client/server clock skew. Larger future
  // values should not stay pinned to "just now" forever.
  if (secondsAgo < -120) {
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }
  if (secondsAgo < 60) return strings.justNow
  if (secondsAgo < 3600) return strings.unit('minute', Math.floor(secondsAgo / 60))
  if (secondsAgo < 86400) return strings.unit('hour', Math.floor(secondsAgo / 3600))
  if (secondsAgo < 604800) return strings.unit('day', Math.floor(secondsAgo / 86400))
  if (secondsAgo < 2592000) return strings.unit('week', Math.floor(secondsAgo / 604800))
  if (secondsAgo < 31536000) return strings.unit('month', Math.floor(secondsAgo / 2592000))

  return strings.unit('year', Math.floor(secondsAgo / 31536000))
}

/**
 * Format a video length for thumbnail badges: 0:42, 12:05, 1:02:09.
 * Returns '' when the duration is unknown so callers can skip the badge.
 */
export const formatVideoDuration = (value: unknown): string => {
  const total = Math.floor(Number(value))
  if (!Number.isFinite(total) || total <= 0) return ''
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = String(total % 60).padStart(2, '0')
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`
}
