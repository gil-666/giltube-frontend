import api from './client'
import { downloadAPIFile } from './downloads'

export const GILTUBE_SERIES_CHANNEL_ID = '17e36c9d-4235-4c9c-9c70-1858e538719a'

export const listSeries = async () => {
  const res = await api.get('/series')
  return res.data
}

export const getSeries = async (id: string) => {
  const res = await api.get(`/series/${id}`)
  return res.data
}

export const getSeriesEpisodeContext = async (videoId: string) => {
  const res = await api.get(`/series-episodes/${videoId}`)
  return res.data
}

export const getSeriesTrailerContext = async (videoId: string) => {
  const res = await api.get(`/series-trailers/${videoId}`)
  return res.data
}

export const getSeriesWatchProgress = async (seriesId: string) => {
  const res = await api.get(`/series/${seriesId}/progress`)
  return res.data
}

export const suggestSeriesEpisodeIntro = async (videoId: string, data: {
  introStartSeconds: number
  introEndSeconds: number
  note?: string
}) => {
  const res = await api.post(`/videos/${videoId}/intro-suggestions`, {
    intro_start_seconds: data.introStartSeconds,
    intro_end_seconds: data.introEndSeconds,
    note: data.note || '',
  })
  return res.data
}

export const listIntroSkipSuggestions = async (status = 'pending') => {
  const res = await api.get('/admin/intro-suggestions', { params: { status } })
  return res.data
}

export const approveIntroSkipSuggestion = async (suggestionId: string) => {
  const res = await api.post(`/admin/intro-suggestions/${suggestionId}/approve`)
  return res.data
}

export const rejectIntroSkipSuggestion = async (suggestionId: string) => {
  const res = await api.post(`/admin/intro-suggestions/${suggestionId}/reject`)
  return res.data
}

export const createSeries = async (data: {
  title: string
  slug?: string
  synopsis?: string
  genre?: string
  genres?: string
  seasons?: number
  directors?: string
  cast?: string
  channelId?: string
  isFeatured?: boolean
  poster?: File | null
  backdrop?: File | null
  posterUrl?: string
  backdropUrl?: string
}) => {
  const formData = new FormData()
  formData.append('title', data.title)
  if (data.slug) formData.append('slug', data.slug)
  if (data.synopsis) formData.append('synopsis', data.synopsis)
  if (data.genre) formData.append('genre', data.genre)
  if (data.genres) formData.append('genres', data.genres)
  if (data.seasons) formData.append('seasons', String(data.seasons))
  if (data.directors) formData.append('directors', data.directors)
  if (data.cast) formData.append('cast', data.cast)
  if (data.channelId) formData.append('channel_id', data.channelId)
  if (data.isFeatured) formData.append('is_featured', 'true')
  if (data.posterUrl) formData.append('poster_url', data.posterUrl)
  if (data.backdropUrl) formData.append('backdrop_url', data.backdropUrl)
  if (data.poster) formData.append('poster', data.poster)
  if (data.backdrop) formData.append('backdrop', data.backdrop)

  const res = await api.post('/admin/series', formData, { timeout: 0 })
  return res.data
}

export const updateSeries = async (seriesId: string, data: {
  title: string
  slug?: string
  synopsis?: string
  genre?: string
  genres?: string
  seasons?: number
  directors?: string
  cast?: string
  channelId?: string
  isFeatured?: boolean
  poster?: File | null
  backdrop?: File | null
  posterUrl?: string
  backdropUrl?: string
}) => {
  const formData = new FormData()
  formData.append('title', data.title)
  if (data.slug) formData.append('slug', data.slug)
  if (data.synopsis) formData.append('synopsis', data.synopsis)
  if (data.genre) formData.append('genre', data.genre)
  if (data.genres) formData.append('genres', data.genres)
  if (data.seasons) formData.append('seasons', String(data.seasons))
  if (data.directors) formData.append('directors', data.directors)
  if (data.cast) formData.append('cast', data.cast)
  if (data.channelId) formData.append('channel_id', data.channelId)
  if (data.isFeatured) formData.append('is_featured', 'true')
  if (data.posterUrl) formData.append('poster_url', data.posterUrl)
  if (data.backdropUrl) formData.append('backdrop_url', data.backdropUrl)
  if (data.poster) formData.append('poster', data.poster)
  if (data.backdrop) formData.append('backdrop', data.backdrop)

  const res = await api.put(`/admin/series/${seriesId}`, formData, { timeout: 0 })
  return res.data
}

export const setSeriesTrailer = async (seriesId: string, videoId: string) => {
  const res = await api.post(`/admin/series/${seriesId}/trailer`, { video_id: videoId })
  return res.data
}

export const deleteSeries = async (seriesId: string) => {
  const res = await api.delete(`/admin/series/${seriesId}`)
  return res.data
}

export const addSeriesEpisode = async (seriesId: string, data: {
  videoId: string
  seasonNumber: number
  episodeNumber: number
  title?: string
  synopsis?: string
  introStartSeconds?: number
  introEndSeconds?: number
}) => {
  const res = await api.post(`/admin/series/${seriesId}/episodes`, {
    video_id: data.videoId,
    season_number: data.seasonNumber,
    episode_number: data.episodeNumber,
    title: data.title || '',
    synopsis: data.synopsis || '',
    intro_start_seconds: data.introStartSeconds || 0,
    intro_end_seconds: data.introEndSeconds || 0,
  })
  return res.data
}

export const updateSeriesEpisode = async (episodeId: string, data: {
  seasonNumber: number
  episodeNumber: number
  title?: string
  synopsis?: string
  introStartSeconds?: number
  introEndSeconds?: number
}) => {
  const res = await api.put(`/admin/series/episodes/${episodeId}`, {
    season_number: data.seasonNumber,
    episode_number: data.episodeNumber,
    title: data.title || '',
    synopsis: data.synopsis || '',
    intro_start_seconds: data.introStartSeconds || 0,
    intro_end_seconds: data.introEndSeconds || 0,
  })
  return res.data
}

export const reorderSeriesEpisodes = async (seriesId: string, episodes: Array<{
  id: string
  seasonNumber: number
  episodeNumber: number
}>, preserveSlotMetadata = true) => {
  const res = await api.put(`/admin/series/${seriesId}/episodes/order`, {
    episodes: episodes.map(episode => ({
      id: episode.id,
      season_number: episode.seasonNumber,
      episode_number: episode.episodeNumber,
    })),
    preserve_slot_metadata: preserveSlotMetadata,
  })
  return res.data
}

export const listSeriesEpisodeAudioTracks = async (episodeId: string) => {
  const res = await api.get(`/admin/series/episodes/${episodeId}/audio`)
  return res.data
}

export const uploadSeriesEpisodeAudioTrack = async (episodeId: string, data: {
  file?: File | null
  label?: string
  language?: string
  isDefault?: boolean
  delayMs?: number
  trackId?: string
}) => {
  const formData = new FormData()
  if (data.file) formData.append('audio', data.file)
  if (data.label) formData.append('label', data.label)
  if (data.language) formData.append('language', data.language)
  if (data.isDefault) formData.append('default', 'true')
  if (typeof data.delayMs === 'number') formData.append('delay_ms', String(data.delayMs))

  const url = data.trackId
    ? `/admin/series/episodes/${episodeId}/audio/${data.trackId}`
    : `/admin/series/episodes/${episodeId}/audio`
  const res = data.trackId
    ? await api.put(url, formData, { timeout: 0 })
    : await api.post(url, formData, { timeout: 0 })
  return res.data
}

export const downloadSeriesEpisodeAudioTrackWAV = async (episodeId: string, trackId: string, fileName: string) => {
  await downloadAPIFile(`/admin/series/episodes/${episodeId}/audio/${trackId}/download-wav`, fileName)
}

export const deleteSeriesEpisodeAudioTrack = async (episodeId: string, trackId: string) => {
  const res = await api.delete(`/admin/series/episodes/${episodeId}/audio/${trackId}`)
  return res.data
}

export const syncSeriesEpisodeAudioTrack = async (episodeId: string, trackId: string, data: { delayMs: number; trimStartMs: number }) => {
  const res = await api.post(`/admin/series/episodes/${episodeId}/audio/${trackId}/sync`, {
    delay_ms: data.delayMs,
    trim_start_ms: data.trimStartMs,
  }, { timeout: 0 })
  return res.data
}

export const listSeriesEpisodeSubtitles = async (episodeId: string) => {
  const res = await api.get(`/admin/series/episodes/${episodeId}/subtitles`)
  return res.data
}

export const uploadSeriesEpisodeSubtitle = async (episodeId: string, data: {
  file?: File | null
  label?: string
  language?: string
  isDefault?: boolean
  delayMs?: number
  trackId?: string
}) => {
  const formData = new FormData()
  if (data.file) formData.append('subtitle', data.file)
  if (data.label) formData.append('label', data.label)
  if (data.language) formData.append('language', data.language)
  if (data.isDefault) formData.append('default', 'true')
  if (typeof data.delayMs === 'number') formData.append('delay_ms', String(data.delayMs))

  const url = data.trackId
    ? `/admin/series/episodes/${episodeId}/subtitles/${data.trackId}`
    : `/admin/series/episodes/${episodeId}/subtitles`
  const res = data.trackId
    ? await api.put(url, formData, { timeout: 0 })
    : await api.post(url, formData, { timeout: 0 })
  return res.data
}

export const deleteSeriesEpisodeSubtitle = async (episodeId: string, trackId: string) => {
  const res = await api.delete(`/admin/series/episodes/${episodeId}/subtitles/${trackId}`)
  return res.data
}
