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
  whip_url?: string
  thumbnail_url?: string
	has_custom_thumbnail?: boolean
  watching_now?: number
  playback_url_public?: string
  is_live?: boolean
  use_publisher_presence?: boolean
  publisher_detected_live?: boolean
  waiting_for_publisher?: boolean
  dvr_enabled?: boolean
	adaptive_transcoding_enabled?: boolean
	playback_url_fallback?: string
	scheduled_for?: string | null
  channel?: LiveChannelInfo
}

export interface LiveChatMessage {
  id: string
  message: string
  created_at: string
  channel: LiveChannelInfo
}

export interface LivePollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

export interface LivePoll {
  id: string
  question: string
  status: 'active' | 'ended'
  total_votes: number
  created_at: string
  ended_at?: string | null
  selected_option_id?: string
  creator: LiveChannelInfo
  options: LivePollOption[]
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

export const startMyLiveStream = async (channelID: string, title: string, description: string, dvrEnabled?: boolean, adaptiveTranscodingEnabled?: boolean): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>('/live/me/start', {
    channel_id: channelID,
    title,
    description,
    dvr_enabled: dvrEnabled,
    adaptive_transcoding_enabled: adaptiveTranscodingEnabled
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

export const saveMyLiveStreamSettings = async (channelID: string, title: string, description: string, dvrEnabled?: boolean, adaptiveTranscodingEnabled?: boolean, scheduledFor?: string): Promise<{ message: string; title: string; description: string; dvr_enabled: boolean; adaptive_transcoding_enabled: boolean; scheduled_for?: string | null }> => {
  const res = await api.put<{ message: string; title: string; description: string; dvr_enabled: boolean; adaptive_transcoding_enabled: boolean }>('/live/me/settings', {
    channel_id: channelID,
    title,
    description,
	dvr_enabled: dvrEnabled,
	adaptive_transcoding_enabled: adaptiveTranscodingEnabled,
	scheduled_for: scheduledFor,
	clear_schedule: !scheduledFor
  })
  return res.data
}

export const uploadMyLiveStreamThumbnail = async (channelID: string, file: File): Promise<{ thumbnail_url: string; has_custom_thumbnail: boolean }> => {
  const body = new FormData()
  body.append('channel_id', channelID)
  body.append('thumbnail', file)
  const res = await api.post<{ thumbnail_url: string; has_custom_thumbnail: boolean }>('/live/me/thumbnail', body)
  return res.data
}

export const deleteMyLiveStreamThumbnail = async (channelID: string): Promise<void> => {
  await api.delete(`/live/me/thumbnail?channel_id=${encodeURIComponent(channelID)}`)
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

export const getLivePoll = async (channelID: string, actorChannelID = ''): Promise<LivePoll | null> => {
  const suffix = actorChannelID ? `?channel_id=${encodeURIComponent(actorChannelID)}` : ''
  const res = await api.get<LivePoll | null>(`/live/channels/${encodeURIComponent(channelID)}/poll${suffix}`, {
    validateStatus: status => status === 200 || status === 204
  })
  return res.status === 204 ? null : res.data
}

export const createLivePoll = async (channelID: string, question: string, options: string[]): Promise<void> => {
  await api.post(`/live/channels/${encodeURIComponent(channelID)}/polls`, { channel_id: channelID, question, options })
}

export const voteLivePoll = async (channelID: string, pollID: string, actorChannelID: string, optionID: string): Promise<void> => {
  await api.post(`/live/channels/${encodeURIComponent(channelID)}/polls/${encodeURIComponent(pollID)}/vote`, { channel_id: actorChannelID, option_id: optionID })
}

export const endLivePoll = async (channelID: string, pollID: string): Promise<void> => {
  await api.post(`/live/channels/${encodeURIComponent(channelID)}/polls/${encodeURIComponent(pollID)}/end`, { channel_id: channelID })
}
