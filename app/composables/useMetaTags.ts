import { useHead, useRuntimeConfig, useRequestHeaders } from '#app'

const getSiteUrl = () => {
  const config = useRuntimeConfig()
  
  if (import.meta.server) {
    const headers = useRequestHeaders(['host', 'x-forwarded-proto'])
    const protocol = headers['x-forwarded-proto'] || 'http'
    const host = headers.host || 'localhost:3000'
    return `${protocol}://${host}`
  } else if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  return config.public.siteUrl || 'http://localhost:3000'
}

export const useMetaTags = (options: {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
} = {}) => {
  const siteUrl = getSiteUrl()
  
  const title = options.title || 'GilTube - Video Sharing'
  const description = options.description || 'Share and watch videos on GilTube'
  const image = options.image
    ? (options.image.startsWith('http') ? options.image : `${siteUrl}${options.image}`)
    : `${siteUrl}/logo.png`
  const url = options.url || siteUrl
  const type = options.type || 'website'
  const twitterCard = options.twitterCard || 'summary_large_image'

  useHead({
    title: title,
    meta: [
      { name: 'description', content: description },
      // Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:site_name', content: 'GilTube' },
      // Twitter Card tags
      { name: 'twitter:card', content: twitterCard },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ]
  })
}

