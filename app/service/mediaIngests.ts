import api from './client'

export type MediaIngest = {
  id: string
  media_type: 'movie' | 'series'
  title: string
  year: number
  season_count: number
  source_url: string
  status: string
  qbittorrent_hash: string
  qbittorrent_name: string
  save_path: string
  content_path: string
  progress: number
  download_speed: number
  eta: number
  attached_video_id: string
  error_message: string
  video_status: string
  video_progress: number
  created_at: string
  updated_at: string
}

export const listMediaIngests = async () => {
  const res = await api.get('/admin/media-ingests')
  return res.data.items || []
}

export type MediaIngestSeriesPreviewFile = {
  file_path: string
  file_name: string
  relative_path: string
  size: number
  season_number: number
  episode_number: number
  title: string
}

export type MediaIngestAudioStream = {
  index: number
  codec_name: string
  channels: number
  sample_rate: string
  duration: string
  tags: Record<string, string>
}

export type MediaIngestAudioSource = {
  file_path: string
  relative_path: string
  size: number
  streams: MediaIngestAudioStream[]
}

export type MediaIngestSubtitleStream = {
  index: number
  codec_name: string
  tags: Record<string, string>
  disposition?: { default?: number; forced?: number }
}

export type MediaIngestSubtitleSource = {
  file_path: string
  relative_path: string
  size: number
  streams: MediaIngestSubtitleStream[]
}

export const createMediaIngest = async (data: {
  media_type: 'movie' | 'series'
  title: string
  year?: number
  season_count?: number
  source_url: string
}) => {
  const res = await api.post('/admin/media-ingests', data)
  return res.data
}

export const createUploadedMediaIngest = async (data: {
  media_type: 'movie' | 'series'
  title?: string
  year?: number
  season_count?: number
  files: Array<{ upload_id: string; file_name: string }>
}) => {
  const res = await api.post('/admin/media-ingests/uploads', data, { timeout: 0 })
  return res.data
}

export const attachMediaIngest = async (id: string, data: {
  channel_id: string
  title?: string
  description?: string
  file_path?: string
  hidden?: boolean
  series_id?: string
  season_number?: number
  episode_number?: number
  episode_title?: string
  episode_synopsis?: string
}) => {
  const res = await api.post(`/admin/media-ingests/${id}/attach`, data)
  return res.data
}

export const previewSeriesMediaIngest = async (id: string) => {
  const res = await api.get(`/admin/media-ingests/${id}/series-preview`)
  return res.data as { season_count: number; files: MediaIngestSeriesPreviewFile[] }
}

export const listMediaIngestAudioSources = async (id: string) => {
  const res = await api.get(`/admin/media-ingests/${id}/audio-sources`, { timeout: 0 })
  return res.data as { sources: MediaIngestAudioSource[] }
}

export const importMediaIngestAudioTrack = async (id: string, data: {
  target_type: 'movie' | 'episode'
  target_id: string
  file_path: string
  stream_index: number
  label?: string
  language?: string
  default?: boolean
  delay_ms?: number
  trim_start_ms?: number
}) => {
  const res = await api.post(`/admin/media-ingests/${id}/audio-tracks`, data)
  const jobId = String(res.data?.job_id || '')
  if (!jobId) return res.data

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1200))
    const statusRes = await api.get(`/admin/media-ingests/${id}/audio-jobs/${jobId}`)
    const job = statusRes.data || {}
    if (job.status === 'completed') return job.result
    if (job.status === 'failed') throw new Error(job.error || 'Failed to extract audio.')
  }
}

export const listMediaIngestSubtitleSources = async (id: string) => {
  const res = await api.get(`/admin/media-ingests/${id}/subtitle-sources`, { timeout: 0 })
  return res.data as { sources: MediaIngestSubtitleSource[] }
}

export const importMediaIngestSubtitleTrack = async (id: string, data: {
  target_type: 'movie' | 'episode'
  target_id: string
  file_path: string
  stream_index: number
  label?: string
  language?: string
  default?: boolean
  delay_ms?: number
}) => {
  const res = await api.post(`/admin/media-ingests/${id}/subtitle-tracks`, data, { timeout: 0 })
  return res.data
}

export const bulkAttachSeriesMediaIngest = async (id: string, data: {
  channel_id: string
  title?: string
  description?: string
  hidden?: boolean
  series_id?: string
  episodes: Array<{
    file_path: string
    season_number: number
    episode_number: number
    episode_title?: string
    episode_synopsis?: string
  }>
}) => {
  const res = await api.post(`/admin/media-ingests/${id}/series-bulk-attach`, data)
  return res.data
}

export const retryMediaIngest = async (id: string) => {
  const res = await api.post(`/admin/media-ingests/${id}/retry`)
  return res.data
}

export const pauseMediaIngest = async (id: string) => {
  const res = await api.post(`/admin/media-ingests/${id}/pause`)
  return res.data
}

export const deleteMediaIngest = async (id: string) => {
  const res = await api.delete(`/admin/media-ingests/${id}`)
  return res.data
}

export const deleteMediaIngestFiles = async (id: string) => {
  const res = await api.delete(`/admin/media-ingests/${id}/files`, { timeout: 0 })
  return res.data
}
