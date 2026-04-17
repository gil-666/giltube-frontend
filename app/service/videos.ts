import api, { apiBaseURL } from './client'

export const getVideos = async (channelId?: string) => {
  const params: any = {}
  if (channelId) {
    params.channelId = channelId
  }
  
  const res = await api.get('/videos', { params })
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

export const deleteVideo = async (id: string) => {
  const res = await api.delete(`/videos/${id}`)
  return res.data
}

export const updateVideo = async (id: string, data: any) => {
  const res = await api.put(`/videos/${id}`, data)
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

export const downloadVideo = async (id: string, quality: string = '1080p', onStatusChange?: (status: string) => void) => {
  try {
    // First request to initiate download (returns 202 if queued, 200 if ready)
    const res = await api.get(`/videos/${id}/download`, {
      params: { quality },
      validateStatus: () => true,
    })

    // If file is ready immediately (200), check status to get the file path
    if (res.status === 200) {
      const statusRes = await api.get(`/videos/${id}/download-status`, {
        params: { quality },
      })
      
      if (statusRes.data.status === 'ready' && statusRes.data.file_url) {
        // Fetch the file as blob using the dedicated endpoint with retries
        const fullUrl = `${apiBaseURL}${statusRes.data.file_url}`
        const blob = await fetchFileWithRetry(fullUrl)
        return blob
      }
    }

    // If processing (202), poll for status
    if (res.status === 202) {
      onStatusChange?.('Processing your download...')
      
      // Poll every 2 seconds for up to 5 minutes
      for (let i = 0; i < 150; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000))

        const statusRes = await api.get(`/videos/${id}/download-status`, {
          params: { quality },
        })

        // If file is ready
        if (statusRes.data.status === 'ready' && statusRes.data.file_url) {
          // Fetch the file as blob using the dedicated endpoint with retries
          const fullUrl = `${apiBaseURL}${statusRes.data.file_url}`
          const blob = await fetchFileWithRetry(fullUrl)
          return blob
        }

        // Still processing
        onStatusChange?.(`Processing your download... (${(i + 1) * 2}s)`)
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
