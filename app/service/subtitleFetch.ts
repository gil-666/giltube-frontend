import api from './client'

export interface SubtitleProvider {
  name: string
  configured: boolean
}

export interface SubtitleResult {
  provider: string
  id: string
  language: string
  language_name: string
  release: string
  file_name: string
  downloads: number
  hearing_impaired: boolean
  fps: number
  trusted: boolean
  machine_translated: boolean
  uploader: string
  season?: number
  episode?: number
  score: number
}

export interface SubtitleSearchMedia {
  kind: 'movie' | 'episode'
  title: string
  year?: number
  season?: number
  episode?: number
  tmdb_id?: number
  fps?: number
  release?: string
}

export interface SubtitleSearchResponse {
  media: SubtitleSearchMedia
  results: SubtitleResult[]
  errors: Record<string, string>
  present_languages: string[]
}

export const listSubtitleProviders = async (): Promise<{ providers: SubtitleProvider[], auto_languages: string[] }> => {
  const response = await api.get('/admin/subtitle-providers')
  return response.data
}

export const searchVideoSubtitlesOnline = async (videoId: string, options: { tmdbId?: number, title?: string } = {}): Promise<SubtitleSearchResponse> => {
  const params: Record<string, string> = {}
  if (options.tmdbId) params.tmdb_id = String(options.tmdbId)
  if (options.title) params.title = options.title
  const response = await api.get(`/admin/videos/${encodeURIComponent(videoId)}/subtitle-search`, { params, timeout: 60000 })
  return response.data
}

export const fetchVideoSubtitleOnline = async (videoId: string, result: SubtitleResult) => {
  const response = await api.post(`/admin/videos/${encodeURIComponent(videoId)}/subtitle-search/fetch`, {
    provider: result.provider,
    id: result.id,
    language: result.language,
    file_name: result.file_name,
    hearing_impaired: result.hearing_impaired,
  }, { timeout: 90000 })
  return response.data
}
