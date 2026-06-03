import api from './client'

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
  if (data.poster) formData.append('poster', data.poster)
  if (data.backdrop) formData.append('backdrop', data.backdrop)

  const res = await api.post('/admin/series', formData, { timeout: 0 })
  return res.data
}

export const setSeriesTrailer = async (seriesId: string, videoId: string) => {
  const res = await api.post(`/admin/series/${seriesId}/trailer`, { video_id: videoId })
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
