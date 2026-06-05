import api from './client'

export const GILTUBE_MOVIES_CHANNEL_ID = 'f765b137-9614-4b99-9f6d-6221abeb75cd'

export const listMovies = async () => {
  const res = await api.get('/movies')
  return res.data
}

export const getMovie = async (id: string) => {
  const res = await api.get(`/movies/${id}`)
  return res.data
}

export const getMovieVideoContext = async (videoId: string) => {
  const res = await api.get(`/movie-videos/${videoId}`)
  return res.data
}

export const getMovieTrailerContext = async (videoId: string) => {
  const res = await api.get(`/movie-trailers/${videoId}`)
  return res.data
}

export const createMovie = async (data: {
  title: string
  slug?: string
  synopsis?: string
  genre?: string
  genres?: string
  directors?: string
  cast?: string
  releaseYear?: number
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
  if (data.directors) formData.append('directors', data.directors)
  if (data.cast) formData.append('cast', data.cast)
  if (data.releaseYear) formData.append('release_year', String(data.releaseYear))
  if (data.channelId) formData.append('channel_id', data.channelId)
  if (data.isFeatured) formData.append('is_featured', 'true')
  if (data.poster) formData.append('poster', data.poster)
  if (data.backdrop) formData.append('backdrop', data.backdrop)

  const res = await api.post('/admin/movies', formData, { timeout: 0 })
  return res.data
}

export const updateMovie = async (movieId: string, data: {
  title: string
  slug?: string
  synopsis?: string
  genre?: string
  genres?: string
  directors?: string
  cast?: string
  releaseYear?: number
  channelId?: string
  isFeatured?: boolean
  poster?: File | null
  backdrop?: File | null
  posterUrl?: string
  backdropUrl?: string
  videoId?: string
}) => {
  const formData = new FormData()
  formData.append('title', data.title)
  if (data.slug) formData.append('slug', data.slug)
  if (data.synopsis) formData.append('synopsis', data.synopsis)
  if (data.genre) formData.append('genre', data.genre)
  if (data.genres) formData.append('genres', data.genres)
  if (data.directors) formData.append('directors', data.directors)
  if (data.cast) formData.append('cast', data.cast)
  if (data.releaseYear) formData.append('release_year', String(data.releaseYear))
  if (data.channelId) formData.append('channel_id', data.channelId)
  if (data.isFeatured) formData.append('is_featured', 'true')
  if (data.posterUrl) formData.append('poster_url', data.posterUrl)
  if (data.backdropUrl) formData.append('backdrop_url', data.backdropUrl)
  if (data.videoId) formData.append('video_id', data.videoId)
  if (data.poster) formData.append('poster', data.poster)
  if (data.backdrop) formData.append('backdrop', data.backdrop)

  const res = await api.put(`/admin/movies/${movieId}`, formData, { timeout: 0 })
  return res.data
}

export const setMovieTrailer = async (movieId: string, videoId: string) => {
  const res = await api.post(`/admin/movies/${movieId}/trailer`, { video_id: videoId })
  return res.data
}

export const setMovieVideo = async (movieId: string, videoId: string) => {
  const res = await api.post(`/admin/movies/${movieId}/video`, { video_id: videoId })
  return res.data
}
