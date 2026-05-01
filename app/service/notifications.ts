import api from './client'

export type NotificationType = 'comment_video' | 'reply_comment' | 'like_video' | 'like_comment' | 'live_started'

export interface NotificationActorChannel {
  id: string
  name: string
  avatar_url: string
  verified: boolean
}

export interface NotificationTargetVideo {
  id: string
  title: string
}

export interface NotificationTargetComment {
  id: string
  snippet: string
}

export interface NotificationItem {
  id: string
  type: NotificationType
  is_read: boolean
  created_at: string
  actor_channel: NotificationActorChannel
  target_video: NotificationTargetVideo | null
  target_comment: NotificationTargetComment | null
  url: string
}

export interface NotificationListResponse {
  items: NotificationItem[]
  limit: number
  offset: number
}

export interface PushConfigResponse {
  enabled: boolean
  send_enabled: boolean
  vapid_public_key: string
}

export const listNotifications = async (params?: { limit?: number; offset?: number; unread_only?: boolean }) => {
  const res = await api.get<NotificationListResponse>('/notifications', { params })
  return res.data
}

export const getUnreadNotificationCount = async () => {
  const res = await api.get<{ unread_count: number }>('/notifications/unread-count')
  return res.data
}

export const markNotificationRead = async (id: string, isRead: boolean) => {
  const res = await api.patch(`/notifications/${id}/read`, { is_read: isRead })
  return res.data
}

export const markAllNotificationsRead = async () => {
  const res = await api.post<{ updated: number }>('/notifications/read-all')
  return res.data
}

export const getPushConfig = async () => {
  const res = await api.get<PushConfigResponse>('/notifications/push/config')
  return res.data
}

export const subscribePush = async (payload: { endpoint: string; keys: { p256dh: string; auth: string } }) => {
  const res = await api.post('/notifications/push/subscribe', payload)
  return res.data
}

export const unsubscribePush = async (payload: { endpoint: string }) => {
  const res = await api.post('/notifications/push/unsubscribe', payload)
  return res.data
}
