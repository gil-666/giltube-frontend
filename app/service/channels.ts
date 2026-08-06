import api from './client'

export const getUserChannels = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}/channels`)
    return Array.isArray(response.data) ? response.data : response.data?.channels || []
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to fetch user channels'
  }
}

export const getChannelInfo = async (channelId: string) => {
  try {
    const response = await api.get(`/channels/${channelId}/info`)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to fetch channel'
  }
}

export const getChannelVideos = async (channelId: string) => {
  try {
    const response = await api.get(`/channels/${channelId}/videos`)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || 'Failed to fetch channel videos'
  }
}

export const getChannelClips = async (channelId: string) => {
  try {
    const response = await api.get(`/channels/${channelId}/clips`)
    return response.data
  } catch (error: any) {
    throw error.response?.data?.error || "Failed to fetch channel clips"
  }
}
