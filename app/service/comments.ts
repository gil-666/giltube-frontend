import axios from 'axios'

const baseUrl = import.meta.env.VITE_API_BASE_URL

export const getVideoComments = async (videoId: string, channelId?: string) => {
  try {
  const response = await axios.get(`${baseUrl}/api/v1/videos/${videoId}/comments`, {
    params: channelId ? { channel_id: channelId } : undefined,
  })
    return response.data
  } catch (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
}

export const postComment = async (videoId: string, channelId: string, text: string, parentCommentId?: string) => {
  try {
    const formData = new FormData()
    formData.append('channel_id', channelId)
    formData.append('text', text)
    if (parentCommentId) {
      formData.append('parent_comment_id', parentCommentId)
    }
    
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

export const likeComment = async (commentId: string, channelId: string) => {
  try {
    const response = await axios.post(`${baseUrl}/api/v1/comments/${commentId}/like?channel_id=${channelId}`)
    return response.data
  } catch (error) {
    console.error('Error liking comment:', error)
    throw error
  }
}

export const unlikeComment = async (commentId: string, channelId: string) => {
  try {
    const response = await axios.delete(`${baseUrl}/api/v1/comments/${commentId}/like?channel_id=${channelId}`)
    return response.data
  } catch (error) {
    console.error('Error unliking comment:', error)
    throw error
  }
}

export const checkIfCommentLiked = async (commentId: string, channelId: string) => {
  try {
    const response = await axios.get(`${baseUrl}/api/v1/comments/${commentId}/liked?channel_id=${channelId}`)
    return response.data
  } catch (error) {
    console.error('Error checking comment like status:', error)
    throw error
  }
}
