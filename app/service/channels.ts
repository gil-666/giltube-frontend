import api from './client'

export const getUserChannels = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}/channels`)
    return response.data
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
