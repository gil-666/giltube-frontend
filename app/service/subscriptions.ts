import api from './client'

export type SubscriptionState = {
  subscribed: boolean
  subscriber_count: number
}

export const activeSubscriptionChannelID = () => {
  if (typeof window === 'undefined') return ''
  const active = localStorage.getItem('active_account') || ''
  const userID = localStorage.getItem('user_id') || ''
  if (active && active !== 'personal' && active !== userID) return active
  return localStorage.getItem('default_channel_id') || ''
}

export const getChannelSubscription = async (channelID: string, subscriberChannelID = '') => {
  const response = await api.get<SubscriptionState>(`/channels/${channelID}/subscription`, {
    params: subscriberChannelID ? { subscriber_channel_id: subscriberChannelID } : undefined,
  })
  return response.data
}

export const subscribeToChannel = async (channelID: string, subscriberChannelID = '') => {
  const response = await api.post<SubscriptionState>(`/channels/${channelID}/subscription`, {
    subscriber_channel_id: subscriberChannelID,
  })
  return response.data
}

export const unsubscribeFromChannel = async (channelID: string, subscriberChannelID = '') => {
  const response = await api.delete<SubscriptionState>(`/channels/${channelID}/subscription`, {
    params: subscriberChannelID ? { subscriber_channel_id: subscriberChannelID } : undefined,
  })
  return response.data
}

export const listSubscribedChannels = async (subscriberChannelID = '') => {
  const response = await api.get('/subscriptions', {
    params: subscriberChannelID ? { subscriber_channel_id: subscriberChannelID } : undefined,
  })
  return response.data
}

export const getSubscriptionsFeed = async (subscriberChannelID = '', perChannelLimit = 12) => {
  const response = await api.get('/subscriptions/feed', {
    params: {
      ...(subscriberChannelID ? { subscriber_channel_id: subscriberChannelID } : {}),
      limit: perChannelLimit,
    },
  })
  return response.data
}
