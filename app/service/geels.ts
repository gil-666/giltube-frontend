import api from './client'

export type GeelSound = {
  track_id: string
  title: string
  slug: string
  artist_name: string
  artist_slug: string
  cover_url: string
  audio_url: string
  duration_seconds: number
  start_ms?: number
  usage_count?: number
}

export type Geel = {
  id: string
  title: string
  description: string
  views: number
  likes: number
  dislikes: number
  comments_count: number
  liked: boolean
  disliked: boolean
  hls_path: string
  thumbnail_url: string
  explicit: boolean
  duration_seconds: number
  display_width: number
  display_height: number
  created_at: string
  channel_id: string
  channel: {
    id: string
    user_id: string
    name: string
    avatar_url: string
    verified: boolean
  }
  sound?: GeelSound
}

export type GeelFeedPage = { items: Geel[]; has_more: boolean }

/** The account a viewer reacts as: their user id, or the channel they switched to. */
export const geelReactionChannelID = () => {
  if (typeof window === 'undefined') return ''
  const userID = localStorage.getItem('user_id') || ''
  const active = localStorage.getItem('active_account') || 'personal'
  return active === 'personal' || active === userID ? userID : active
}

/** An anonymous id for this browser, so the feed can skip what it already showed. */
export const geelViewerID = () => {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem('giltube_viewer_id') || ''
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem('giltube_viewer_id', id)
    }
    return id
  } catch {
    return ''
  }
}

export const getGeelsFeed = async (options: {
  limit?: number
  exclude?: string[]
  start?: string
  channel?: string
  sound?: string
} = {}) => {
  const params: Record<string, string | number> = {}
  if (options.limit) params.limit = options.limit
  if (options.exclude?.length) params.exclude = options.exclude.slice(-400).join(',')
  if (options.start) params.start = options.start
  if (options.channel) params.channel = options.channel
  if (options.sound) params.sound = options.sound
  const reactor = geelReactionChannelID()
  if (reactor) params.channel_id = reactor
  const viewer = geelViewerID()
  if (viewer) params.viewer = viewer
  const response = await api.get<GeelFeedPage>('/geels', { params })
  return response.data
}

export const getGeel = async (id: string) => {
  const reactor = geelReactionChannelID()
  const response = await api.get<Geel>(`/geels/${id}`, { params: reactor ? { channel_id: reactor } : undefined })
  return response.data
}

type ReactionState = { likes: number; dislikes?: number; liked: boolean; disliked?: boolean }

export const setGeelReaction = async (id: string, reaction: 'like' | 'dislike', on: boolean) => {
  const channelID = geelReactionChannelID()
  const path = `/videos/${id}/${reaction}`
  const response = on
    ? await api.post<ReactionState>(path, null, { params: { channel_id: channelID } })
    : await api.delete<ReactionState>(path, { params: { channel_id: channelID } })
  return response.data
}

/** Reports how much of a Geel was watched (0–1). */
export const recordGeelView = async (id: string, ratio: number) => {
  try {
    await api.post(`/geels/${id}/view`, null, { params: { viewer: geelViewerID(), ratio: Math.min(Math.max(ratio, 0), 1).toFixed(3) } })
  } catch {
    // Views are best effort.
  }
}

export const searchGeelSounds = async (q = '', limit = 30) => {
  const response = await api.get<{ sounds: GeelSound[] }>('/geels/sounds', { params: { q, limit } })
  return response.data.sounds
}

export const getGeelSound = async (trackID: string) => {
  const response = await api.get<{ sound: GeelSound; usable: boolean }>(`/geels/sounds/${trackID}`)
  return response.data
}

export const formatGeelCount = (value: number, locale = 'en') => {
  if (!Number.isFinite(value) || value <= 0) return '0'
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
