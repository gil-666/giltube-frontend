const configuredApiBase = import.meta.env.VITE_API_BASE_URL || ''

const mediaBaseFromApiBase = (apiBase: string) => {
  return apiBase.replace(/\/+$/, '').replace(/\/api\/v1$/i, '')
}

export const resolveMediaUrl = (url?: string | null, fallback = '') => {
  const value = url || fallback
  if (!value) return ''
  if (value.startsWith('blob:') || value.startsWith('data:')) {
    return value
  }

  if (/^https?:\/\//i.test(value)) {
    const parsed = new URL(value)
    parsed.pathname = parsed.pathname.replace(/^\/api\/v1(?=\/(?:videos|avatars|downloads)\/)/i, '')
    parsed.pathname = parsed.pathname.replace(/\/avatars\/(?:\/?avatars\/)+/i, '/avatars/')
    return parsed.toString()
  }

  const normalizedPath = `/${value.replace(/^\/+/, '')}`.replace(/^\/api\/v1(?=\/(?:videos|avatars|downloads)\/)/i, '')
    .replace(/^\/avatars\/(?:\/?avatars\/)+/i, '/avatars/')
  return `${mediaBaseFromApiBase(configuredApiBase)}${normalizedPath}`
}

export const resolveAvatarUrl = (url?: string | null) => {
  const value = String(url || '').trim()
  if (!value) return ''
  if (value.startsWith('blob:') || value.startsWith('data:')) {
    return resolveMediaUrl(value)
  }
  if (/^https?:\/\//i.test(value)) {
    const resolved = resolveMediaUrl(value)
    return resolved.replace(/\/avatars\/(?:\/?avatars\/)+/i, '/avatars/')
  }
  const normalized = value.replace(/^\/api\/v1/i, '').replace(/^\/?avatars\/(?:\/?avatars\/)+/i, '/avatars/')
  if (
    normalized.startsWith('/avatars/')
    || normalized.startsWith('/music-assets/')
    || normalized.startsWith('/channel-backgrounds/')
    || normalized.startsWith('/videos/')
  ) {
    return resolveMediaUrl(normalized)
  }
  return resolveMediaUrl(`/avatars/${normalized.replace(/^\/+/, '')}`)
}

export const imageVariantUrl = (url?: string | null, size: 'sm' | 'md' | 'lg' = 'md') => {
  const resolved = resolveMediaUrl(url)
  if (!resolved) return ''
  return resolved.replace(/_(sm|md|lg)(\.jpe?g)(?=([?#].*)?$)/i, `_${size}$2`)
}

export const imageVariantSrcset = (url?: string | null) => {
  const resolved = resolveMediaUrl(url)
  if (!/_(sm|md|lg)\.jpe?g(?=([?#].*)?$)/i.test(resolved)) return ''
  return [
    `${imageVariantUrl(resolved, 'sm')} 320w`,
    `${imageVariantUrl(resolved, 'md')} 640w`,
    `${imageVariantUrl(resolved, 'lg')} 1280w`,
  ].join(', ')
}

const LEGACY_4K_WIDTH_FLOOR = 3000
const LEGACY_8K_WIDTH_FLOOR = 7000

export const videoQualityBadge = (width?: number | string | null) => {
  const numericWidth = Number(width)
  if (!Number.isFinite(numericWidth)) return ''

  // Older records kept the source width instead of the normalized rendition width.
  if (numericWidth >= LEGACY_8K_WIDTH_FLOOR) return '8K'
  if (numericWidth >= LEGACY_4K_WIDTH_FLOOR) return '4K'
  return ''
}

export const isVideo4K = (width?: number | string | null) => videoQualityBadge(width) === '4K'
export const isVideo8K = (width?: number | string | null) => videoQualityBadge(width) === '8K'
