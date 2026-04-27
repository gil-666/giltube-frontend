import api from './client'

export interface LiveChannelInfo {
  id: string
  name: string
  avatar_url: string
  verified: boolean
}

export interface LiveStreamState {
  id?: string
  channel_id: string
  title: string
  description: string
  status: 'offline' | 'live'
  manual_status?: 'offline' | 'live'
  started_at: string | null
  ended_at: string | null
  stream_key?: string
  ingest_url?: string
  ingest_url_local?: string
  ingest_url_lan?: string
  stream_name?: string
  playback_url: string
  playback_url_public?: string
  is_live?: boolean
  use_publisher_presence?: boolean
  publisher_detected_live?: boolean
  channel?: LiveChannelInfo
}

export interface LiveChatMessage {
  id: string
  message: string
  created_at: string
  channel: LiveChannelInfo
}

export const getMyLiveStream = async (channelID: string): Promise<LiveStreamState> => {
  const res = await api.get<LiveStreamState>(`/live/me?channel_id=${encodeURIComponent(channelID)}`)
  return res.data
}

export const rotateMyLiveStreamKey = async (channelID: string): Promise<{ message: string; stream_key: string; ingest_url: string; stream_name: string; playback_url: string }> => {
  const res = await api.post<{ message: string; stream_key: string; ingest_url: string; stream_name: string; playback_url: string }>(
    '/live/me/key/rotate',
    { channel_id: channelID }
  )
  return res.data
}

export const startMyLiveStream = async (channelID: string, title: string, description: string): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>('/live/me/start', {
    channel_id: channelID,
    title,
    description
  })
  return res.data
}

export const stopMyLiveStream = async (channelID: string): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>('/live/me/stop', { channel_id: channelID })
  return res.data
}

export const setMyPublisherPresence = async (channelID: string, enabled: boolean): Promise<{ message: string; use_publisher_presence: boolean }> => {
  const res = await api.post<{ message: string; use_publisher_presence: boolean }>('/live/me/publisher-presence', {
    channel_id: channelID,
    enabled
  })
  return res.data
}

export const saveMyLiveStreamSettings = async (channelID: string, title: string, description: string): Promise<{ message: string; title: string; description: string }> => {
  const res = await api.put<{ message: string; title: string; description: string }>('/live/me/settings', {
    channel_id: channelID,
    title,
    description
  })
  return res.data
}

export const getChannelLiveStatus = async (channelID: string): Promise<LiveStreamState> => {
  const res = await api.get<LiveStreamState>(`/live/channels/${encodeURIComponent(channelID)}`)
  return res.data
}

export const listActiveLiveStreams = async (): Promise<LiveStreamState[]> => {
  const res = await api.get<LiveStreamState[]>('/live/active')
  return res.data
}

export const getLiveChatMessages = async (channelID: string, limit = 80): Promise<LiveChatMessage[]> => {
  const res = await api.get<LiveChatMessage[]>(`/live/channels/${encodeURIComponent(channelID)}/chat?limit=${limit}`)
  return res.data
}

export const postLiveChatMessage = async (targetChannelID: string, actorChannelID: string, message: string): Promise<{ message: string; id: string }> => {
  const res = await api.post<{ message: string; id: string }>(`/live/channels/${encodeURIComponent(targetChannelID)}/chat`, {
    channel_id: actorChannelID,
    message
  })
  return res.data
}
