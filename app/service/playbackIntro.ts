import api from './client'

export interface PlaybackIntro {
  enabled: boolean
  allow_skip: boolean
  url: string
  version: string
  size: number
  content_type: string
  updated_at: string
  play?: boolean
}

// Whether the intro should play before this video. The backend only answers
// play=true for movies and series episodes.
export const getPlaybackIntro = async (videoId: string): Promise<PlaybackIntro> => {
  const res = await api.get('/playback-intro', { params: { video_id: videoId } })
  return res.data
}

export const getAdminPlaybackIntro = async (): Promise<PlaybackIntro> => {
  const res = await api.get('/admin/playback-intro')
  return res.data
}

export const uploadPlaybackIntro = async (file: File, onProgress?: (percent: number) => void): Promise<PlaybackIntro> => {
  const form = new FormData()
  form.append('video', file)
  const res = await api.post('/admin/playback-intro', form, {
    timeout: 0,
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })
  return res.data
}

export const updatePlaybackIntroSettings = async (settings: { enabled?: boolean, allow_skip?: boolean }): Promise<PlaybackIntro> => {
  const res = await api.put('/admin/playback-intro', settings)
  return res.data
}

export const deletePlaybackIntro = async (): Promise<PlaybackIntro> => {
  const res = await api.delete('/admin/playback-intro')
  return res.data
}

// A manual "next episode" click skips the intro on the episode it opens. The
// target id is handed over in sessionStorage so it never leaks into the URL.
const SKIP_INTRO_KEY = 'giltube:playback-intro-skip'

export const skipPlaybackIntroFor = (videoId: string) => {
  try {
    sessionStorage.setItem(SKIP_INTRO_KEY, videoId)
  } catch {
    // Storage unavailable; the intro will simply play.
  }
}

export const consumePlaybackIntroSkip = (videoId: string) => {
  try {
    const target = sessionStorage.getItem(SKIP_INTRO_KEY)
    if (target) sessionStorage.removeItem(SKIP_INTRO_KEY)
    return target === videoId
  } catch {
    return false
  }
}

// The intro is kept in Cache Storage so it plays instantly and is downloaded
// only once per version. Its URL is content-addressed, so a new intro uploaded
// by an admin is a different cache entry and the old one is evicted.
const INTRO_CACHE_NAME = 'giltube-playback-intro-v1'

const absoluteIntroURL = (url: string) => new URL(url, window.location.origin).toString()

const storeIntroInCache = async (url: string) => {
  try {
    const cache = await caches.open(INTRO_CACHE_NAME)
    const response = await fetch(url, { credentials: 'omit' })
    if (!response.ok) return
    await cache.put(url, response)
    for (const request of await cache.keys()) {
      if (request.url !== url) await cache.delete(request)
    }
  } catch {
    // Caching is best effort; playback falls back to the network URL.
  }
}

export const resolvePlaybackIntroSource = async (intro: PlaybackIntro): Promise<{ src: string, release: () => void }> => {
  const noop = () => {}
  if (typeof window === 'undefined' || !intro.url) return { src: intro.url, release: noop }
  const url = absoluteIntroURL(intro.url)
  if (!('caches' in window)) return { src: url, release: noop }

  try {
    const cache = await caches.open(INTRO_CACHE_NAME)
    const cached = await cache.match(url)
    if (cached) {
      const objectURL = URL.createObjectURL(await cached.blob())
      return { src: objectURL, release: () => URL.revokeObjectURL(objectURL) }
    }
  } catch {
    return { src: url, release: noop }
  }

  // First play streams from the network while the full file is cached in the
  // background for next time.
  void storeIntroInCache(url)
  return { src: url, release: noop }
}
