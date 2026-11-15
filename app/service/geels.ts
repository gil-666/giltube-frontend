import api from './client'
import { imageVariantUrl, resolveMediaUrl } from '~/app/utils/media'

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
  /** 9:16 poster (thumbnails are 16:9 crops); empty until generated. */
  poster_url?: string
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
  /** A clip of another video (any aspect ratio): play and loop this range of the shared stream. */
  clip?: GeelClip
}

export type GeelClip = {
  start_seconds: number
  end_seconds: number
  original_video_id: string
  original_video_title: string
  /** The clipper's channel; absent when they clipped as their personal account. */
  clipped_by_channel_id?: string
  clipped_by_name: string
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

/** The best portrait image for a Geel card or poster. */
export const geelPoster = (geel: Pick<Geel, 'poster_url' | 'thumbnail_url'>) =>
  geel.poster_url ? resolveMediaUrl(geel.poster_url) : (imageVariantUrl(geel.thumbnail_url, 'lg') || resolveMediaUrl(geel.thumbnail_url))

export const formatGeelCount = (value: number, locale = 'en') => {
  if (!Number.isFinite(value) || value <= 0) return '0'
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export type GeelWebClip = { file: File; url: string; duration: number; speed: number; mirror: boolean; fill: boolean }

export type GeelWebPost = {
  clips: GeelWebClip[]
  channelID: string
  caption: string
  hidden: boolean
  explicit: boolean
  soundTrackID?: string
  soundStartMS: number
  soundVolume: number
  originalVolume: number
  coverMS: number
}

/** Uploads each clip, then asks the server to put the Geel together. */
export const postGeel = async (post: GeelWebPost, onProgress: (fraction: number) => void) => {
  const { uploadFileInChunks } = await import('./upload')
  const totalBytes = post.clips.reduce((sum, clip) => sum + clip.file.size, 0) || 1
  let doneBytes = 0
  const segments: { upload_id: string; speed: number; mirror: boolean; fill: boolean }[] = []
  for (const clip of post.clips) {
    const uploadID = await uploadFileInChunks(clip.file, (percent) => onProgress(0.95 * (doneBytes + clip.file.size * percent / 100) / totalBytes))
    doneBytes += clip.file.size
    segments.push({ upload_id: uploadID, speed: clip.speed, mirror: clip.mirror, fill: clip.fill })
  }
  const form = new FormData()
  form.append('channel_id', post.channelID)
  form.append('description', post.caption.trim())
  form.append('title', post.caption.trim().split('\n')[0]!.slice(0, 100))
  form.append('segments', JSON.stringify(segments))
  form.append('original_volume', post.originalVolume.toFixed(2))
  form.append('cover_ms', String(Math.max(0, Math.round(post.coverMS))))
  if (post.soundTrackID) {
    form.append('sound_track_id', post.soundTrackID)
    form.append('sound_start_ms', String(Math.max(0, Math.round(post.soundStartMS))))
    form.append('sound_volume', post.soundVolume.toFixed(2))
  }
  if (post.hidden) form.append('hidden', 'true')
  if (post.explicit) form.append('explicit', 'true')
  const response = await api.post<{ video_id: string }>('/geels/compose', form, { timeout: 0 })
  onProgress(1)
  return response.data
}
