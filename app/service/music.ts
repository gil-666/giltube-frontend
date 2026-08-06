import api from './client'
import { uploadFileInChunks } from './upload'

export interface MusicArtist {
  id: string
  name: string
  slug: string
  bio: string
  avatar_url: string
  banner_url: string
  primary_channel_id: string
  channel_name: string
  verified: boolean
  created_at: string
}

export interface MusicRelease {
  id: string
  artist_id: string
  artist_name: string
  artist_slug: string
  artist_avatar_url: string
  title: string
  slug: string
  release_type: 'single' | 'ep' | 'album'
  cover_url: string
  release_date?: string
  label: string
  copyright_text: string
  phonogram_text: string
  territories: string
  rights_confirmed: boolean
  has_lossless_audio: boolean
  max_audio_bit_depth: number
  max_audio_sample_rate: number
  status: 'draft' | 'published'
  track_count: number
  created_at: string
}

export interface MusicTrack {
  id: string
  release_id: string
  release_title: string
  release_slug: string
  release_label: string
  release_copyright_text: string
  release_phonogram_text: string
  release_territories: string
  release_rights_confirmed: boolean
  cover_url: string
  primary_artist_id: string
  artist_name: string
  artist_slug: string
  title: string
  slug: string
  disc_number: number
  track_number: number
  duration_seconds: number
  isrc: string
  explicit: boolean
  language: string
  audio_url: string
  audio_original_name: string
  audio_codec: string
  audio_container: string
  audio_sample_rate: number
  audio_bit_depth: number
  audio_lossless: boolean
  audio_low_url: string
  audio_medium_url: string
  audio_high_url: string
  lyrics?: string
  synced_lyrics?: string
  lyrics_source?: string
  lyrics_synced_at?: string
  rights_holder: string
  publisher: string
  copyright_holder: string
  copyright_year: number
  phonogram_holder: string
  phonogram_year: number
  territories: string
  rights_confirmed: boolean
  status: 'draft' | 'published'
  official_video_id: string
  official_video_title: string
  official_video_thumbnail: string
  published_at?: string
  created_at: string
}

export interface MusicOverview {
  artists: number
  releases: number
  tracks: number
  published: number
  blocked: number
}

export interface MusicAdminChannel {
  id: string
  name: string
  username: string
  status: string
}

export interface MusicArtistInput {
  name: string
  bio: string
  primary_channel_id: string
  verified: boolean
}

export interface MusicReleaseInput {
  artist_id: string
  title: string
  release_type: MusicRelease['release_type']
  release_date: string
  label: string
  copyright_text: string
  phonogram_text: string
  territories: string
  rights_confirmed: boolean
}

export interface MusicTrackInput {
  release_id: string
  title: string
  disc_number: number
  track_number: number
  duration_seconds: number
  isrc: string
  explicit: boolean
  language: string
}

export const getMusicHome = async (): Promise<{ artists: MusicArtist[]; releases: MusicRelease[] }> =>
  (await api.get('/music')).data

export const getMusicArtist = async (slug: string): Promise<{ artist: MusicArtist; releases: MusicRelease[] }> =>
  (await api.get(`/music/artists/${slug}`)).data

export const getMusicRelease = async (slug: string): Promise<{ release: MusicRelease; tracks: MusicTrack[] }> =>
  (await api.get(`/music/releases/${slug}`)).data

export const getMusicTrack = async (slug: string): Promise<{ track: MusicTrack }> =>
  (await api.get(`/music/tracks/${slug}`)).data

export const getChannelMusic = async (channelId: string): Promise<{ artist: MusicArtist; releases: MusicRelease[] }> =>
  (await api.get(`/channels/${channelId}/music`)).data

export const getMusicVideoContext = async (videoId: string): Promise<{ track: MusicTrack }> =>
  (await api.get(`/music-videos/${videoId}`)).data

export const getAdminMusicOverview = async (): Promise<MusicOverview> =>
  (await api.get('/admin/music/overview')).data

export const listMusicAdminChannels = async (): Promise<MusicAdminChannel[]> =>
  (await api.get('/admin/channels')).data

export const listAdminMusicArtists = async (): Promise<MusicArtist[]> =>
  (await api.get('/admin/music/artists')).data

export const createMusicArtist = async (input: MusicArtistInput): Promise<MusicArtist> =>
  (await api.post('/admin/music/artists', input)).data

export const updateMusicArtist = async (id: string, input: MusicArtistInput): Promise<MusicArtist> =>
  (await api.put(`/admin/music/artists/${id}`, input)).data

export const uploadMusicArtistAvatar = async (id: string, avatar: File, onProgress?: (value: number) => void): Promise<MusicArtist> => {
  const form = new FormData()
  form.append('avatar', avatar)
  return (await api.post(`/admin/music/artists/${id}/avatar`, form, {
    timeout: 0,
    onUploadProgress: event => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })).data
}

export const deleteMusicArtist = async (id: string) =>
  api.delete(`/admin/music/artists/${id}`)

export const listAdminMusicReleases = async (): Promise<MusicRelease[]> =>
  (await api.get('/admin/music/releases')).data

export const createMusicRelease = async (input: MusicReleaseInput): Promise<MusicRelease> =>
  (await api.post('/admin/music/releases', input)).data

export const updateMusicRelease = async (id: string, input: MusicReleaseInput): Promise<MusicRelease> =>
  (await api.put(`/admin/music/releases/${id}`, input)).data

export const uploadMusicReleaseCover = async (id: string, cover: File, onProgress?: (value: number) => void) => {
  const form = new FormData()
  form.append('cover', cover)
  return (await api.post(`/admin/music/releases/${id}/cover`, form, {
    timeout: 0,
    onUploadProgress: event => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })).data
}

export const useMusicTrackArtwork = async (releaseId: string, trackId: string): Promise<{ cover_url: string }> =>
  (await api.post(`/admin/music/releases/${releaseId}/cover/from-track`, { track_id: trackId })).data

export const publishMusicRelease = async (id: string) =>
  (await api.post(`/admin/music/releases/${id}/publish`)).data

export const unpublishMusicRelease = async (id: string) =>
  (await api.post(`/admin/music/releases/${id}/unpublish`)).data

export const deleteMusicRelease = async (id: string) =>
  api.delete(`/admin/music/releases/${id}`)

export const listAdminMusicTracks = async (): Promise<MusicTrack[]> =>
  (await api.get('/admin/music/tracks')).data

export const createMusicTrack = async (input: MusicTrackInput): Promise<MusicTrack> =>
  (await api.post('/admin/music/tracks', input)).data

export const updateMusicTrack = async (id: string, input: MusicTrackInput): Promise<MusicTrack> =>
  (await api.put(`/admin/music/tracks/${id}`, input)).data

export const syncMusicTrackLyrics = async (id: string): Promise<MusicTrack> =>
  (await api.post(`/admin/music/tracks/${id}/lyrics/sync`)).data

export const uploadMusicTrackAudio = async (id: string, audio: File, onProgress?: (value: number) => void) => {
  const uploadSessionId = await uploadFileInChunks(audio, value => {
    onProgress?.(Math.min(95, Math.round(value * 0.95)))
  })
  const form = new FormData()
  form.append('uploadSessionId', uploadSessionId)
  form.append('fileName', audio.name)
  const response = await api.post(`/admin/music/tracks/${id}/audio/finalize`, form, { timeout: 0 })
  onProgress?.(100)
  return response.data
}

export const setMusicTrackVideo = async (id: string, videoId: string) =>
  (await api.post(`/admin/music/tracks/${id}/video`, { video_id: videoId })).data

export const clearMusicTrackVideo = async (id: string) =>
  api.delete(`/admin/music/tracks/${id}/video`)

export const publishMusicTrack = async (id: string) =>
  (await api.post(`/admin/music/tracks/${id}/publish`)).data

export const unpublishMusicTrack = async (id: string) =>
  (await api.post(`/admin/music/tracks/${id}/unpublish`)).data

export const deleteMusicTrack = async (id: string) =>
  api.delete(`/admin/music/tracks/${id}`)
