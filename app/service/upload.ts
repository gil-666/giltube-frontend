import api from './client'

interface UploadVideoRequest {
  title: string
  description: string
  channelId: string
  videoFile: File
  explicit?: boolean
  categoryId?: string
  thumbnail?: File
  onProgress?: (progress: number) => void
}

interface Channel {
  id: string
  name: string
  description: string
  avatar_url?: string
}

interface CreateChannelRequest {
  userId: string
  name: string
  description: string
  avatar?: File | null
}

// Chunk size: 50MB (stays well under Cloudflare's 100MB proxy limit)
const CHUNK_SIZE = 50 * 1024 * 1024

export const createChannel = async (data: CreateChannelRequest): Promise<Channel> => {
  try {
    const formData = new FormData()
    formData.append('user_id', data.userId)
    formData.append('name', data.name)
    formData.append('description', data.description)
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }

    const response = await api.post('/channels', formData)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to create channel'
  }
}

export const fetchUserChannels = async (userId: string): Promise<Channel[]> => {
  try {
    const response = await api.get(`/users/${userId}/channels`)
    const channels = response.data || []
    // Store in localStorage so the app can access them
    localStorage.setItem('user_channels', JSON.stringify(channels))
    return channels
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to fetch channels'
  }
}

export const uploadVideo = async (data: UploadVideoRequest) => {
  const file = data.videoFile
  const totalSize = file.size
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE)
  let uploadedBytes = 0

  // Generate a unique upload session ID
  const uploadSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    // Upload file in chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, totalSize)
      const chunk = file.slice(start, end)

      const chunkFormData = new FormData()
      chunkFormData.append('chunk', chunk)
      chunkFormData.append('chunkIndex', chunkIndex.toString())
      chunkFormData.append('totalChunks', totalChunks.toString())
      chunkFormData.append('uploadSessionId', uploadSessionId)
      chunkFormData.append('fileName', file.name)

      // Upload this chunk
      await api.post('/videos/upload-chunk', chunkFormData, {
        timeout: 0, // No timeout for chunk uploads
        onUploadProgress: (progressEvent: any) => {
          uploadedBytes = start + progressEvent.loaded
          const percentCompleted = Math.round((uploadedBytes * 100) / totalSize)
          data.onProgress?.(percentCompleted)
        },
      })
    }

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
    if (data.categoryId) {
      finalizeFormData.append('category_ids', data.categoryId)
    }
    if (data.thumbnail) {
      finalizeFormData.append('thumbnail', data.thumbnail)
    }

    const response = await api.post('/videos/finalize-upload', finalizeFormData, {
      timeout: 0,
    })

    data.onProgress?.(100)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Upload failed'
  }
}

export const updateChannel = async (channelId: string, data: { name: string; description: string; avatar?: File | null }): Promise<Channel> => {
  try {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('description', data.description)
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }

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
