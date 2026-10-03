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

// Pixel widths of the sm/md/lg files the backend writes for each kind of image
// (see ImageVariantSpec usages); srcset descriptors must match the real files
// or the browser picks the wrong one.
const variantWidthsFor = (url: string): [number, number, number] => {
  const path = url.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0] || ''
  const fileName = path.split('/').pop() || ''
  if (path.includes('/avatars/')) return [96, 256, 512]
  if (path.includes('/channel-backgrounds/')) return [960, 1600, 2560]
  if (path.includes('/music-assets/artists/')) return [160, 400, 800]
  if (/\/videos\/(movies|series)\//.test(path)) {
    return fileName.startsWith('backdrop') ? [640, 1280, 1920] : [342, 500, 780]
  }
  return [320, 640, 1280]
}

export const imageVariantSrcset = (url?: string | null) => {
  const resolved = resolveMediaUrl(url)
  if (!/_(sm|md|lg)\.jpe?g(?=([?#].*)?$)/i.test(resolved)) return ''
  const [sm, md, lg] = variantWidthsFor(resolved)
  return [
    `${imageVariantUrl(resolved, 'sm')} ${sm}w`,
    `${imageVariantUrl(resolved, 'md')} ${md}w`,
    `${imageVariantUrl(resolved, 'lg')} ${lg}w`,
  ].join(', ')
}

// src/srcset/sizes for an <img>, e.g. v-bind="responsiveImage(video.thumbnail_url, '168px')".
// `sizes` is the rendered CSS width; without it the browser assumes 100vw and
// downloads the largest variant even for small cards.
export const responsiveImage = (url?: string | null, sizes = '100vw', fallback = '') => {
  const src = resolveMediaUrl(url, fallback)
  const srcset = imageVariantSrcset(url)
  return srcset ? { src, srcset, sizes: capDensity(sizes) } : { src }
}

// Split a sizes list on top-level commas (min()/calc() can contain commas).
const splitSizes = (sizes: string) => {
  const entries: string[] = []
  let depth = 0
  let current = ''
  for (const char of sizes) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && depth === 0) {
      entries.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) entries.push(current.trim())
  return entries
}

// Thumbnails don't visibly improve past ~1.5x density, so on high-density
// screens ask for images sized for 1.5x instead of fetching variants 2-3x the
// CSS width (which also keeps the browser from over-shrinking them).
const DENSITY_CAPS: Array<[string, number]> = [
  ['(min-resolution: 2.5dppx)', 0.5], // 3x -> 1.5x
  ['(min-resolution: 1.5dppx)', 0.75], // 2x -> 1.5x
]
export const capDensity = (sizes: string) => splitSizes(sizes).flatMap((entry) => {
  const match = entry.match(/^(\(.*\))\s+(\S.*)$/)
  const condition = match ? match[1] : ''
  const width = match ? match[2] : entry
  return [
    ...DENSITY_CAPS.map(([density, factor]) => `${condition ? `${condition} and ` : ''}${density} calc(${width} * ${factor})`),
    entry,
  ]
}).join(', ')

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
