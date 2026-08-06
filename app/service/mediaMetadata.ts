import api from './client'

export type MediaMetadataType = 'movie' | 'series'

export type MediaMetadataResult = {
  source: string
  source_id: string
  external_id: string
  media_type: MediaMetadataType
  title: string
  synopsis: string
  genre: string
  genres: string[]
  directors: string[]
  cast: string[]
  release_year: number
  seasons: number
  poster_url: string
  backdrop_url: string
  source_url: string
  episodes?: MediaMetadataEpisode[]
}

export type MediaMetadataEpisode = {
  season_number: number
  episode_number: number
  title: string
  synopsis: string
}

export const searchMediaMetadata = async (type: MediaMetadataType, query: string) => {
  const res = await api.get('/admin/metadata/search', {
    params: { type, query },
  })
  return res.data as { results: MediaMetadataResult[] }
}

export const getMediaMetadataDetails = async (type: MediaMetadataType, sourceId: string) => {
  const res = await api.get('/admin/metadata/details', {
    params: { type, source_id: sourceId },
  })
  return res.data as { result: MediaMetadataResult }
}
