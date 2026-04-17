import axios from 'axios'

const baseUrl = import.meta.env.VITE_API_BASE_URL

export const getVideoComments = async (videoId: string) => {
  try {
    const response = await axios.get(`${baseUrl}/api/v1/videos/${videoId}/comments`)
    return response.data
  } catch (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
}

export const postComment = async (videoId: string, channelId: string, text: string) => {
  try {
    const formData = new FormData()
    formData.append('channel_id', channelId)
    formData.append('text', text)
    
    const response = await axios.post(
      `${baseUrl}/api/v1/videos/${videoId}/comments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error posting comment:', error)
    throw error
  }
}

export const deleteComment = async (commentId: string) => {
  try {
    const response = await axios.delete(`${baseUrl}/api/v1/comments/${commentId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}
