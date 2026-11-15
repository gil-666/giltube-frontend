import api from './client'

interface UploadVideoRequest {
  title: string
  description: string
  channelId: string
  videoFile: File
  explicit?: boolean
  categoryId?: string
  thumbnail?: File
  hidden?: boolean
  uploadBaseURL?: string
  onProgress?: (progress: number) => void
}

interface Channel {
  id: string
  name: string
  description: string
  avatar_url?: string
  background_url?: string
  background_position_x?: number
  background_position_y?: number
  background_scale?: number
  custom_header_html?: string
  custom_header_css?: string
  custom_content_html?: string
  custom_content_css?: string
  is_default?: boolean
  status?: string
}

interface UserChannelsResponse {
  channels: Channel[]
  default_channel_id?: string
}

interface CreateChannelRequest {
  userId: string
  name: string
  description: string
  avatar?: File | null
  background?: File | null
}

// Chunk size: 50MB (stays well under Cloudflare's 100MB proxy limit)
export const CHUNK_SIZE = 50 * 1024 * 1024

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Waits until the browser reports it is online again (or `ms` passes).
const waitForNetwork = (ms: number) => new Promise<void>((resolve) => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || navigator.onLine) {
    setTimeout(resolve, ms)
    return
  }
  const done = () => {
    window.removeEventListener('online', done)
    clearTimeout(timer)
    resolve()
  }
  const timer = setTimeout(done, Math.max(ms, 60_000))
  window.addEventListener('online', done)
})

// Network errors, timeouts, 408/429 and 5xx are worth retrying; other 4xx
// answers (bad session, wrong size, not allowed) are not.
const retryableUploadError = (error: any) => {
  const status = error?.response?.status
  if (!status) return true
  return status === 408 || status === 429 || status >= 500
}

// Keeps retrying a chunk through short outages (Wi-Fi drops, a server
// restart) for up to 30 minutes before giving up.
const CHUNK_RETRY_WINDOW_MS = 30 * 60 * 1000

const sha256Hex = async (blob: Blob): Promise<string | null> => {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

interface ResumeResponse {
  upload_id: string
  received_chunks: number[]
  received_bytes?: number
}

// Asks the server for an unfinished upload of this same file (matched by
// size and the first chunk's hash), so only the missing chunks are sent.
// Retries through outages; returns null only when the server says there is
// nothing to resume (or is too old to know), never because the network blinked.
const findResumableUpload = async (file: File, totalChunks: number, requestConfig: object, exclude: string[]): Promise<ResumeResponse | null> => {
  if (totalChunks < 2) return null
  const firstChunkHash = await sha256Hex(file.slice(0, Math.min(CHUNK_SIZE, file.size)))
  if (!firstChunkHash) return null
  const firstAttempt = Date.now()
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await api.post<ResumeResponse>('/videos/upload-resume', {
        file_name: file.name,
        file_size: file.size,
        total_chunks: totalChunks,
        chunk_size: CHUNK_SIZE,
        first_chunk_sha256: firstChunkHash,
        exclude_upload_ids: exclude,
      }, { ...requestConfig, timeout: 60_000 })
      const found = response.data
      return found?.upload_id && !exclude.includes(found.upload_id) ? found : null
    } catch (error: any) {
      if (!retryableUploadError(error)) return null // e.g. 404 from an older server
      if (Date.now() - firstAttempt > CHUNK_RETRY_WINDOW_MS) throw error
      await waitForNetwork(Math.min(30_000, 2_000 * 2 ** Math.min(attempt, 4)))
    }
  }
}

// `excludeUploadIds`: sessions already used for other files in the same
// batch, so two identical files never share one session.
export const uploadFileInChunks = async (
  file: File,
  onProgress?: (progress: number) => void,
  uploadBaseURL?: string,
  excludeUploadIds: string[] = [],
) => {
  const totalSize = file.size
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE)
  const requestConfig = uploadBaseURL ? { baseURL: uploadBaseURL } : {}

  const resumed = await findResumableUpload(file, totalChunks, requestConfig, excludeUploadIds)
  const uploadSessionId = resumed?.upload_id || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  const received = new Set(resumed?.received_chunks || [])
  let doneBytes = 0
  for (const index of received) {
    doneBytes += Math.min(CHUNK_SIZE, totalSize - index * CHUNK_SIZE)
  }
  if (received.size) onProgress?.(Math.min(100, Math.round((doneBytes * 100) / totalSize)))

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (received.has(chunkIndex)) continue
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, totalSize)
    const firstAttempt = Date.now()
    for (let attempt = 0; ; attempt++) {
      const chunkFormData = new FormData()
      chunkFormData.append('chunk', file.slice(start, end))
      chunkFormData.append('chunkIndex', String(chunkIndex))
      chunkFormData.append('totalChunks', String(totalChunks))
      chunkFormData.append('chunkSize', String(CHUNK_SIZE))
      chunkFormData.append('fileSize', String(totalSize))
      chunkFormData.append('uploadSessionId', uploadSessionId)
      chunkFormData.append('fileName', file.name)
      try {
        await api.post('/videos/upload-chunk', chunkFormData, {
          ...requestConfig,
          timeout: 0,
          onUploadProgress: (event: any) => {
            const uploadedBytes = doneBytes + (event.loaded || 0)
            onProgress?.(Math.min(100, Math.round((uploadedBytes * 100) / totalSize)))
          },
        })
        break
      } catch (error: any) {
        if (!retryableUploadError(error) || Date.now() - firstAttempt > CHUNK_RETRY_WINDOW_MS) throw error
        await waitForNetwork(Math.min(30_000, 2_000 * 2 ** Math.min(attempt, 4)))
      }
    }
    doneBytes += end - start
    onProgress?.(Math.min(100, Math.round((doneBytes * 100) / totalSize)))
  }

  return uploadSessionId
}

export const createChannel = async (data: CreateChannelRequest): Promise<Channel> => {
  try {
    const formData = new FormData()
    formData.append('user_id', data.userId)
    formData.append('name', data.name)
    formData.append('description', data.description)
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }
    if (data.background) {
      formData.append('background', data.background)
    }

    const response = await api.post('/channels', formData)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to create channel'
  }
}

export const fetchUserChannels = async (userId: string): Promise<UserChannelsResponse> => {
  try {
    const response = await api.get(`/users/${userId}/channels`)
    const payload = response.data || []
    const channels = Array.isArray(payload) ? payload : payload.channels || []
    const defaultChannelId = Array.isArray(payload) ? channels.find((channel: Channel) => channel.is_default)?.id || '' : payload.default_channel_id || ''
    // Store in localStorage so the app can access them
    localStorage.setItem('user_channels', JSON.stringify(channels))
    if (defaultChannelId) {
      localStorage.setItem('default_channel_id', defaultChannelId)
    } else {
      localStorage.removeItem('default_channel_id')
    }
    return { channels, default_channel_id: defaultChannelId }
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to fetch channels'
  }
}

export const setDefaultChannel = async (channelId: string): Promise<{ default_channel_id: string; channel_id: string; channel_name: string }> => {
  try {
    const response = await api.put('/account/default-channel', { channel_id: channelId })
    if (response.data?.default_channel_id) {
      localStorage.setItem('default_channel_id', response.data.default_channel_id)
    }
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to set default channel'
  }
}

export const uploadVideo = async (data: UploadVideoRequest) => {
  const file = data.videoFile
  const requestConfig = data.uploadBaseURL ? { baseURL: data.uploadBaseURL } : {}

  try {
    const uploadSessionId = await uploadFileInChunks(file, data.onProgress, data.uploadBaseURL)

    // All chunks uploaded, now finalize the video
    const finalizeFormData = new FormData()
    finalizeFormData.append('title', data.title)
    finalizeFormData.append('description', data.description)
    finalizeFormData.append('channel_id', data.channelId)
    finalizeFormData.append('uploadSessionId', uploadSessionId)
    finalizeFormData.append('fileName', file.name)
    if (data.explicit) {
      finalizeFormData.append('explicit', 'true')
    }
    if (data.hidden) {
      finalizeFormData.append('hidden', 'true')
    }
    if (data.categoryId) {
      finalizeFormData.append('category_ids[]', data.categoryId)
    }
    if (data.thumbnail) {
      finalizeFormData.append('thumbnail', data.thumbnail)
    }

    const response = await api.post('/videos/finalize-upload', finalizeFormData, {
      ...requestConfig,
      timeout: 0,
    })

    data.onProgress?.(100)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Upload failed'
  }
}

export const updateChannel = async (channelId: string, data: {
  name: string
  description: string
  avatar?: File | null
  background?: File | null
  removeAvatar?: boolean
  removeBackground?: boolean
  backgroundPositionX?: number
  backgroundPositionY?: number
  backgroundScale?: number
  customHeaderHtml?: string
  customHeaderCss?: string
  customContentHtml?: string
  customContentCss?: string
}): Promise<Channel> => {
  try {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('description', data.description)
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }
    if (data.background) {
      formData.append('background', data.background)
    }
    if (data.removeAvatar) {
      formData.append('remove_avatar', 'true')
    }
    if (data.removeBackground) {
      formData.append('remove_background', 'true')
    }
    if (data.backgroundPositionX !== undefined) {
      formData.append('background_position_x', String(data.backgroundPositionX))
    }
    if (data.backgroundPositionY !== undefined) {
      formData.append('background_position_y', String(data.backgroundPositionY))
    }
    if (data.backgroundScale !== undefined) {
      formData.append('background_scale', String(data.backgroundScale))
    }
    formData.append('custom_header_html', data.customHeaderHtml || '')
    formData.append('custom_header_css', data.customHeaderCss || '')
    formData.append('custom_content_html', data.customContentHtml || '')
    formData.append('custom_content_css', data.customContentCss || '')

    const response = await api.put(`/channels/${channelId}`, formData)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to update channel'
  }
}

export const deleteChannel = async (channelId: string): Promise<void> => {
  try {
    await api.delete(`/channels/${channelId}`)
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to delete channel'
  }
}
