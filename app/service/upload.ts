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

export const uploadFileInChunks = async (
  file: File,
  onProgress?: (progress: number) => void,
  uploadBaseURL?: string,
) => {
  const totalSize = file.size
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE)
  const uploadSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  const requestConfig = uploadBaseURL ? { baseURL: uploadBaseURL } : {}

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, totalSize)
    const chunkFormData = new FormData()
    chunkFormData.append('chunk', file.slice(start, end))
    chunkFormData.append('chunkIndex', String(chunkIndex))
    chunkFormData.append('totalChunks', String(totalChunks))
    chunkFormData.append('uploadSessionId', uploadSessionId)
    chunkFormData.append('fileName', file.name)

    await api.post('/videos/upload-chunk', chunkFormData, {
      ...requestConfig,
      timeout: 0,
      onUploadProgress: (event: any) => {
        const uploadedBytes = start + event.loaded
        onProgress?.(Math.min(100, Math.round((uploadedBytes * 100) / totalSize)))
      },
    })
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
