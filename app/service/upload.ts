import api from './client'

interface UploadVideoRequest {
  title: string
  description: string
  channelId: string
  videoFile: File
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
  const formData = new FormData()
  formData.append('title', data.title)
  formData.append('description', data.description)
  formData.append('channel_id', data.channelId)
  formData.append('video', data.videoFile)

  try {
    const response = await api.post('/videos', formData, {
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        data.onProgress?.(percentCompleted)
      },
    })
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
