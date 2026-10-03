import api from './client'
import { downloadAPIFile } from './downloads'

const CHUNK_SIZE = 50 * 1024 * 1024

export const GILTUBE_MOVIES_CHANNEL_ID = 'f765b137-9614-4b99-9f6d-6221abeb75cd'

export const listMovies = async () => {
  const res = await api.get('/movies')
  return res.data
}

export const getMovie = async (id: string) => {
  const res = await api.get(`/movies/${id}`)
  return res.data
}

// Short-lived client cache so the home rows, the category page and the detail
// modal share one request instead of refetching on every navigation.
const MOVIE_CACHE_TTL_MS = 60_000
let moviesListCache: { data: any, at: number } | null = null
let moviesListRequest: Promise<any> | null = null
const moviesDetailCache = new Map<string, { data: any, at: number }>()
const moviesDetailRequests = new Map<string, Promise<any>>()

const isFresh = (entry: { at: number } | null | undefined) => !!entry && Date.now() - entry.at < MOVIE_CACHE_TTL_MS

export const clearMovieCache = () => {
  moviesListCache = null
  moviesListRequest = null
  moviesDetailCache.clear()
  moviesDetailRequests.clear()
}

export const peekCachedMovies = () => (import.meta.client && isFresh(moviesListCache) ? moviesListCache!.data : null)

export const listMoviesCached = async () => {
  if (!import.meta.client) return listMovies()
  if (isFresh(moviesListCache)) return moviesListCache!.data
  if (!moviesListRequest) {
    moviesListRequest = listMovies()
      .then((data) => {
        moviesListCache = { data, at: Date.now() }
        return data
      })
      .finally(() => {
        moviesListRequest = null
      })
  }
  return moviesListRequest
}

export const getMovieCached = async (id: string) => {
  if (!import.meta.client) return getMovie(id)
  const cached = moviesDetailCache.get(id)
  if (isFresh(cached)) return cached!.data
  let request = moviesDetailRequests.get(id)
  if (!request) {
    request = getMovie(id)
      .then((data) => {
        moviesDetailCache.set(id, { data, at: Date.now() })
        return data
      })
      .finally(() => {
        moviesDetailRequests.delete(id)
      })
    moviesDetailRequests.set(id, request)
  }
  return request
}

export const prefetchMovie = (id: string) => {
  if (!import.meta.client || !id) return
  getMovieCached(id).catch(() => {})
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
  posterUrl?: string
  backdropUrl?: string
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
  if (data.poster) formData.append('poster', data.poster)
  if (data.backdrop) formData.append('backdrop', data.backdrop)

  const res = await api.post('/admin/movies', formData, { timeout: 0 })
  clearMovieCache()
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
  clearMovieCache()
  return res.data
}

export const setMovieTrailer = async (movieId: string, videoId: string) => {
  const res = await api.post(`/admin/movies/${movieId}/trailer`, { video_id: videoId })
  clearMovieCache()
  return res.data
}

export const setMovieVideo = async (movieId: string, videoId: string) => {
  const res = await api.post(`/admin/movies/${movieId}/video`, { video_id: videoId })
  clearMovieCache()
  return res.data
}

export const deleteMovie = async (movieId: string, options: { deleteVideos?: boolean } = {}) => {
  const res = await api.delete(`/admin/movies/${movieId}`, {
    params: { delete_videos: options.deleteVideos ? 'true' : 'false' },
  })
  clearMovieCache()
  return res.data
}

export const listMovieAudioTracks = async (movieId: string) => {
  const res = await api.get(`/admin/movies/${movieId}/audio`)
  return res.data
}

export const uploadMovieAudioTrack = async (movieId: string, data: {
  file?: File | null
  label?: string
  language?: string
  isDefault?: boolean
  delayMs?: number
  trackId?: string
  uploadBaseURL?: string
  onUploadProgress?: (progress: number) => void
}) => {
  const requestConfig = data.uploadBaseURL ? { baseURL: data.uploadBaseURL } : {}

  if (data.file) {
    const file = data.file
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const uploadSessionId = `movie-audio-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    let uploadedBytes = 0

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      const chunkFormData = new FormData()
      chunkFormData.append('chunk', chunk)
      chunkFormData.append('chunkIndex', String(chunkIndex))
      chunkFormData.append('totalChunks', String(totalChunks))
      chunkFormData.append('uploadSessionId', uploadSessionId)
      chunkFormData.append('fileName', file.name)

      await api.post('/videos/upload-chunk', chunkFormData, {
        ...requestConfig,
        timeout: 0,
        onUploadProgress: event => {
          uploadedBytes = start + event.loaded
          data.onUploadProgress?.(Math.min(99, Math.round((uploadedBytes / file.size) * 100)))
        },
      })
    }

    const finalizeFormData = new FormData()
    finalizeFormData.append('uploadSessionId', uploadSessionId)
    finalizeFormData.append('fileName', file.name)
    if (data.label) finalizeFormData.append('label', data.label)
    if (data.language) finalizeFormData.append('language', data.language)
    if (data.isDefault) finalizeFormData.append('default', 'true')
    if (typeof data.delayMs === 'number') finalizeFormData.append('delay_ms', String(data.delayMs))
    if (data.trackId) finalizeFormData.append('trackId', data.trackId)

    const res = await api.post(`/admin/movies/${movieId}/audio-upload/finalize`, finalizeFormData, {
      ...requestConfig,
      timeout: 0,
    })
    data.onUploadProgress?.(100)
    clearMovieCache()
    return res.data
  }

  const formData = new FormData()
  if (data.label) formData.append('label', data.label)
  if (data.language) formData.append('language', data.language)
  if (data.isDefault) formData.append('default', 'true')
  if (typeof data.delayMs === 'number') formData.append('delay_ms', String(data.delayMs))

  const url = data.trackId
    ? `/admin/movies/${movieId}/audio/${data.trackId}`
    : `/admin/movies/${movieId}/audio`
  const res = data.trackId
    ? await api.put(url, formData, {
      timeout: 0,
      onUploadProgress: event => {
        if (event.total) data.onUploadProgress?.(Math.round((event.loaded / event.total) * 100))
      },
    })
    : await api.post(url, formData, {
      timeout: 0,
      onUploadProgress: event => {
        if (event.total) data.onUploadProgress?.(Math.round((event.loaded / event.total) * 100))
      },
    })
  clearMovieCache()
  return res.data
}

export const downloadMovieAudioTrackWAV = async (movieId: string, trackId: string, fileName: string) => {
  await downloadAPIFile(`/admin/movies/${movieId}/audio/${trackId}/download-wav`, fileName)
}

export const deleteMovieAudioTrack = async (movieId: string, trackId: string) => {
  const res = await api.delete(`/admin/movies/${movieId}/audio/${trackId}`)
  clearMovieCache()
  return res.data
}

export const syncMovieAudioTrack = async (movieId: string, trackId: string, data: { delayMs: number; trimStartMs: number }) => {
  const res = await api.post(`/admin/movies/${movieId}/audio/${trackId}/sync`, {
    delay_ms: data.delayMs,
    trim_start_ms: data.trimStartMs,
  }, { timeout: 0 })
  clearMovieCache()
  return res.data
}

export const listMovieSubtitles = async (movieId: string) => {
  const res = await api.get(`/admin/movies/${movieId}/subtitles`)
  return res.data
}

export const uploadMovieSubtitle = async (movieId: string, data: {
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
    ? `/admin/movies/${movieId}/subtitles/${data.trackId}`
    : `/admin/movies/${movieId}/subtitles`
  const res = data.trackId
    ? await api.put(url, formData, { timeout: 0 })
    : await api.post(url, formData, { timeout: 0 })
  clearMovieCache()
  return res.data
}

export const deleteMovieSubtitle = async (movieId: string, trackId: string) => {
  const res = await api.delete(`/admin/movies/${movieId}/subtitles/${trackId}`)
  clearMovieCache()
  return res.data
}
