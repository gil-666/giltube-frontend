import api from './client'

export interface YouTubeMirrorChannel {
  youtube_channel_id: string
  youtube_channel_title: string
  youtube_channel_url: string
  giltube_channel_id: string
  giltube_channel_name: string
  created_at: string
  updated_at: string
}

export const listYouTubeMirrorChannels = async () => {
  const res = await api.get('/admin/youtube-mirrors/channels')
  return res.data as { mappings: YouTubeMirrorChannel[] }
}

export const saveYouTubeMirrorChannel = async (data: {
  youtubeChannelId: string
  youtubeChannelTitle?: string
  youtubeChannelUrl?: string
  giltubeChannelId: string
  createNewChannel?: boolean
}) => {
  const res = await api.post('/admin/youtube-mirrors/channels', {
    youtube_channel_id: data.youtubeChannelId,
    youtube_channel_title: data.youtubeChannelTitle || '',
    youtube_channel_url: data.youtubeChannelUrl || '',
    giltube_channel_id: data.giltubeChannelId,
    create_new_channel: !!data.createNewChannel,
  })
  return res.data
}

export const deleteYouTubeMirrorChannel = async (youtubeChannelId: string) => {
  const res = await api.delete(`/admin/youtube-mirrors/channels/${encodeURIComponent(youtubeChannelId)}`)
  return res.data
}

export const importYouTubeMirrorVideo = async (data: {
  url: string
  giltubeChannelId?: string
  explicit?: boolean
  hidden?: boolean
  createNewChannel?: boolean
}) => {
  const res = await api.post('/admin/youtube-mirrors/import', {
    url: data.url,
    giltube_channel_id: data.giltubeChannelId || '',
    explicit: !!data.explicit,
    hidden: !!data.hidden,
    create_new_channel: !!data.createNewChannel,
  }, { timeout: 0 })
  return res.data
}
