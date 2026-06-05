import api from './client'

export const listPublicWatchParties = async () => {
  const res = await api.get('/watch-parties/public')
  return res.data
}

export const createWatchParty = async (data: {
  videoId: string
  visibility: 'public' | 'private'
  title?: string
  channelId?: string
}) => {
  const res = await api.post('/watch-parties', {
    video_id: data.videoId,
    visibility: data.visibility,
    title: data.title || '',
    channel_id: data.channelId || '',
  })
  return res.data
}

export const getWatchParty = async (partyId: string) => {
  const res = await api.get(`/watch-parties/${partyId}`)
  return res.data
}

export const joinWatchParty = async (partyId: string, channelId?: string) => {
  const res = await api.post(`/watch-parties/${partyId}/join`, { channel_id: channelId || '' })
  return res.data
}

export const leaveWatchParty = async (partyId: string) => {
  const res = await api.post(`/watch-parties/${partyId}/leave`)
  return res.data
}

export const transferWatchPartyHost = async (partyId: string, userId: string) => {
  const res = await api.post(`/watch-parties/${partyId}/transfer-host`, { user_id: userId })
  return res.data
}

export const setWatchPartySuggestPermission = async (partyId: string, userId: string, canSuggest: boolean) => {
  const res = await api.put(`/watch-parties/${partyId}/suggest-permission`, {
    user_id: userId,
    can_suggest: canSuggest,
  })
  return res.data
}

export const setWatchPartySyncMode = async (partyId: string, mode: 'host-only' | 'open') => {
  const res = await api.put(`/watch-parties/${partyId}/sync-mode`, { mode })
  return res.data
}

export const postWatchPartyChat = async (partyId: string, data: {
  message?: string
  gifUrl?: string
  reaction?: string
  channelId?: string
}) => {
  const res = await api.post(`/watch-parties/${partyId}/chat`, {
    message: data.message || '',
    gif_url: data.gifUrl || '',
    reaction: data.reaction || '',
    channel_id: data.channelId || '',
  })
  return res.data
}

export const postWatchPartyPlayback = async (partyId: string, data: {
  action: string
  currentTime?: number
  channelId?: string
}) => {
  const res = await api.post(`/watch-parties/${partyId}/playback`, {
    action: data.action,
    current_time: data.currentTime || 0,
    channel_id: data.channelId || '',
  })
  return res.data
}

export const addWatchPartyQueueItem = async (partyId: string, videoId: string) => {
  const res = await api.post(`/watch-parties/${partyId}/queue`, { video_id: videoId })
  return res.data
}

export const playWatchPartyQueueItem = async (partyId: string, itemId: string) => {
  const res = await api.post(`/watch-parties/${partyId}/queue/${itemId}/play`)
  return res.data
}

export const removeWatchPartyQueueItem = async (partyId: string, itemId: string) => {
  const res = await api.delete(`/watch-parties/${partyId}/queue/${itemId}`)
  return res.data
}

export const reorderWatchPartyQueue = async (partyId: string, itemIds: string[]) => {
  const res = await api.put(`/watch-parties/${partyId}/queue/reorder`, { item_ids: itemIds })
  return res.data
}

export const watchPartyEventURL = (partyId: string, userId: string) =>
  `/api/v1/watch-parties/${partyId}/events?user_id=${encodeURIComponent(userId)}`

export const searchWatchPartyVideos = async (query: string, page = 1) => {
  const res = await api.get('/search', { params: { q: query, page } })
  return {
    ...res.data,
    results: (res.data?.results || []).filter((item: any) => item.type === 'video'),
  }
}
