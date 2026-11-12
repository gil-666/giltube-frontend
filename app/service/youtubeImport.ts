import api from './client'

export interface YouTubeImportAccess {
  available: boolean
  reason: '' | 'off' | 'revoked' | 'not_allowed' | 'banned' | 'signed_out'
  daily_limit?: number
  used_today?: number
  max_duration_minutes?: number
  max_height?: number
}

export interface YouTubeImportPreview {
  youtube_video_id: string
  title: string
  description: string
  thumbnail: string
  duration_seconds: number
  youtube_channel: string
  blocked_reason: string
  existing_video_id: string
  daily_limit: number
  used_today: number
}

export type YouTubeImportStatus = 'downloading' | 'processing' | 'ready' | 'failed'

export interface YouTubeImportItem {
  id: string
  video_id: string
  youtube_video_id: string
  title: string
  status: YouTubeImportStatus
  progress: number
  error: string
  thumbnail: string
  channel_id: string
  channel_name: string
  created_at: string
}

export interface YouTubeImportSettings {
  mode: 'everyone' | 'allowlist' | 'off'
  daily_limit: number
  max_duration_minutes: number
  max_height: number
}

export interface YouTubeImportUserAccess {
  user_id: string
  username: string
  email: string
  access: 'allowed' | 'revoked'
  updated_at: string
  import_count: number
}

export interface YouTubeImportAdminRecent {
  id: string
  user_id: string
  username: string
  access: '' | 'allowed' | 'revoked'
  video_id: string
  youtube_video_id: string
  title: string
  status: YouTubeImportStatus
  error: string
  channel_name: string
  created_at: string
}

export const getYouTubeImportAccess = async () => {
  const res = await api.get('/youtube-import/access')
  return res.data as YouTubeImportAccess
}

export const previewYouTubeImport = async (url: string) => {
  const res = await api.post('/youtube-import/preview', { url }, { timeout: 120000 })
  return res.data as YouTubeImportPreview
}

export const startYouTubeImport = async (data: { url: string; channelId: string; title: string; explicit: boolean }) => {
  const res = await api.post('/youtube-import', {
    url: data.url,
    channel_id: data.channelId,
    title: data.title,
    explicit: data.explicit,
  }, { timeout: 120000 })
  return res.data as { import_id: string; video_id: string; title: string }
}

export const listMyYouTubeImports = async () => {
  const res = await api.get('/youtube-import/imports')
  return (res.data?.imports || []) as YouTubeImportItem[]
}

export const retryYouTubeImport = async (id: string) => {
  const res = await api.post(`/youtube-import/imports/${encodeURIComponent(id)}/retry`, {}, { timeout: 120000 })
  return res.data
}

export const getAdminYouTubeImportSettings = async () => {
  const res = await api.get('/admin/youtube-import/settings')
  return res.data as { settings: YouTubeImportSettings; users: YouTubeImportUserAccess[]; recent: YouTubeImportAdminRecent[] }
}

export const saveAdminYouTubeImportSettings = async (settings: YouTubeImportSettings) => {
  const res = await api.put('/admin/youtube-import/settings', settings)
  return res.data
}

export const setAdminYouTubeImportUserAccess = async (user: string, access: '' | 'allowed' | 'revoked') => {
  const res = await api.put('/admin/youtube-import/users', { user, access })
  return res.data
}
