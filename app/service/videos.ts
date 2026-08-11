import api, { apiBaseURL } from './client'
import { downloadAPIFile } from './downloads'

export const getVideos = async (options: { channelId?: string; limit?: number; offset?: number } = {}) => {
  const params: Record<string, string | number> = {}
  if (options.channelId) {
    params.channelId = options.channelId
  }
  if (typeof options.limit === 'number') {
    params.limit = options.limit
  }
  if (typeof options.offset === 'number') {
    params.offset = options.offset
  }

  const res = await api.get('/videos', { params })
  return res.data
}

export const getHomeRecommendations = async (options: { limit?: number; offset?: number } = {}) => {
  const params: Record<string, string | number> = {}
  if (typeof options.limit === 'number') {
    params.limit = options.limit
  }
  if (typeof options.offset === 'number') {
    params.offset = options.offset
  }

  const res = await api.get('/recommendations/home', { params })
  return res.data
}

export const getMyVideos = async (channelId: string) => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
  
  const res = await api.get('/my-videos', {
    params: { channel_id: channelId },
    headers: userId ? { 'X-User-ID': userId } : {}
  })
  return res.data
}

export const getVideo = async (id: string) => {
  const res = await api.get(`/videos/${id}`)
  return res.data
}

export const getRelatedVideos = async (id: string, limit = 10) => {
  const res = await api.get(`/videos/${id}/related`, { params: { limit } })
  return res.data
}

export const getVideoClips = async (id: string) => {
  const res = await api.get(`/videos/${id}/clips`)
  return res.data
}

export const createVideoClip = async (id: string, data: {
  startSeconds: number
  endSeconds: number
  title?: string
  channelId?: string
}) => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
  const res = await api.post(`/videos/${id}/clips`, {
    start_seconds: data.startSeconds,
    end_seconds: data.endSeconds,
    title: data.title,
    channel_id: data.channelId,
  }, {
    headers: userId ? { 'X-User-ID': userId } : {}
  })
  return res.data
}

export const deleteVideo = async (id: string) => {
  const res = await api.delete(`/videos/${id}`)
  return res.data
}

export const updateVideo = async (id: string, data: any) => {
  const res = await api.put(`/videos/${id}`, data)
  return res.data
}

export const getAdminChannelVideos = async (channelId: string) => {
  const res = await api.get(`/admin/channels/${channelId}/videos`)
  return res.data
}

export const getAdminVideos = async (options: { q?: string; limit?: number } = {}) => {
  const params: Record<string, string | number> = {}
  if (options.q) params.q = options.q
  if (typeof options.limit === 'number') params.limit = options.limit

  const res = await api.get('/admin/videos', { params })
  return res.data
}

export const listVideoAudioTracks = async (videoId: string) => {
  const res = await api.get(`/videos/${videoId}/audio`)
  return res.data
}

export const uploadVideoAudioTrack = async (videoId: string, data: {
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
    ? `/videos/${videoId}/audio/${data.trackId}`
    : `/videos/${videoId}/audio`
  const res = data.trackId
    ? await api.put(url, formData, { timeout: 0 })
    : await api.post(url, formData, { timeout: 0 })
  return res.data
}

export const deleteVideoAudioTrack = async (videoId: string, trackId: string) => {
  const res = await api.delete(`/videos/${videoId}/audio/${trackId}`)
  return res.data
}

export const listVideoSubtitles = async (videoId: string) => {
  const res = await api.get(`/videos/${videoId}/subtitles`)
  return res.data
}

export const uploadVideoSubtitle = async (videoId: string, data: {
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
    ? `/videos/${videoId}/subtitles/${data.trackId}`
    : `/videos/${videoId}/subtitles`
  const res = data.trackId
    ? await api.put(url, formData, { timeout: 0 })
    : await api.post(url, formData, { timeout: 0 })
  return res.data
}

export const deleteVideoSubtitle = async (videoId: string, trackId: string) => {
  const res = await api.delete(`/videos/${videoId}/subtitles/${trackId}`)
  return res.data
}

const fetchFileWithRetry = async (url: string, maxRetries: number = 3): Promise<Blob> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch file')
      const blob = await response.blob()
      if (blob.size > 0) return blob // Success
      throw new Error('Empty blob received')
    } catch (err) {
      if (attempt === maxRetries) throw err
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  throw new Error('Failed to fetch file after retries')
}

const resolveDownloadUrl = (fileUrl: string) => {
  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl
  }

  if (typeof window !== 'undefined') {
    return new URL(fileUrl, window.location.origin).toString()
  }

  return `${apiBaseURL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
}

export const downloadVideo = async (
  id: string,
  arg2?: string | ((status: string) => void),
  arg3?: string | ((status: string) => void),
) => {
  const quality = typeof arg2 === 'string' ? arg2 : typeof arg3 === 'string' ? arg3 : undefined
  const onStatusChange =
    typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : undefined

  try {
    // First request to initiate download (returns 202 if queued, 200 if ready)
    const params: Record<string, string> = {}
    if (quality) {
      params.quality = quality
    }

    const res = await api.get(`/videos/${id}/download`, {
      params,
      validateStatus: () => true,
    })

    // If file is ready immediately (200), fetch the direct download endpoint.
    if (res.status === 200) {
      const selectedQuality = res.data?.selected_quality || res.headers?.['x-download-quality'] || quality || 'best'
      const fileUrl = res.data?.file_url || `/api/v1/downloads/${id}/${selectedQuality}`
      const fullUrl = resolveDownloadUrl(fileUrl)
      return fetchFileWithRetry(fullUrl)
    }

    const selectedQuality = res.data?.selected_quality || quality || 'best'

    // If processing (202), poll for status
    if (res.status === 202) {
      onStatusChange?.('Processing your download...')
      
      const startedAt = Date.now()
      const maxWaitMs = 5 * 60 * 1000
      const pollDelays = [0, 250, 500, 1000, 1500]
      let pollCount = 0

      while (Date.now() - startedAt < maxWaitMs) {
        const delay = pollDelays[pollCount] ?? 2000
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const statusRes = await api.get(`/videos/${id}/download-status`, {
          params: { quality: selectedQuality },
        })

        // If file is ready
        if (statusRes.data.status === 'ready' && statusRes.data.file_url) {
          // Fetch the file as blob using the dedicated endpoint with retries
          return fetchFileWithRetry(resolveDownloadUrl(statusRes.data.file_url))
        }

        // Still processing
        pollCount += 1
        onStatusChange?.(`Processing your download... (${Math.max(1, Math.round((Date.now() - startedAt) / 1000))}s)`)
      }

      throw new Error('Download preparation timed out. Please try again.')
    }

    // Handle other errors
    if (res.data?.error) {
      throw new Error(res.data.error)
    }

    throw new Error('Download failed')
  } catch (err) {
    throw err
  }
}

export const incrementViews = async (id: string) => {
  const res = await api.post(`/videos/${id}/view`)
  return res.data
}

export const getWatchProgress = async (videoId: string) => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
  const res = await api.get(`/videos/${videoId}/progress`, {
    params: userId ? { user_id: userId } : undefined,
  })
  return res.data
}

export const getWatchProgressMap = async (videoIds: string[]) => {
  const ids = [...new Set(videoIds.filter(Boolean))].slice(0, 100)
  if (!ids.length) return { progress: {} }
  const res = await api.get('/watch-progress/videos', {
    params: { ids: ids.join(',') },
  })
  return res.data
}

export const getRecentWatchProgress = async (limit = 12) => {
  const res = await api.get('/watch-progress/recent', {
    params: { limit },
  })
  return res.data
}

export const saveWatchProgress = async (videoId: string, data: {
  positionSeconds: number
  durationSeconds: number
}) => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
  const res = await api.put(`/videos/${videoId}/progress`, {
    position_seconds: data.positionSeconds,
    duration_seconds: data.durationSeconds,
  }, {
    params: userId ? { user_id: userId } : undefined,
  })
  return res.data
}

export const likeVideo = async (videoId: string, channelId: string) => {
  const res = await api.post(`/videos/${videoId}/like?channel_id=${channelId}`)
  return res.data
}

export const unlikeVideo = async (videoId: string, channelId: string) => {
  const res = await api.delete(`/videos/${videoId}/like?channel_id=${channelId}`)
  return res.data
}

export const checkIfLiked = async (videoId: string, channelId: string) => {
  const res = await api.get(`/videos/${videoId}/liked?channel_id=${channelId}`)
  return res.data
}

export const getChannelAnalytics = async (channelId: string) => {
  const res = await api.get(`/channels/${channelId}/analytics`)
  return res.data
}

export const downloadAudioTrackWAV = async (videoId: string, trackId: string, fileName: string) => {
  await downloadAPIFile(`/videos/${videoId}/audio/${trackId}/download-wav`, fileName)
}
