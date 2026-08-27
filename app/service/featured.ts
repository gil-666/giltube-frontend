import api from './client'

export type FeaturedContentType = 'video' | 'live' | 'movie' | 'series'

export interface FeaturedContent {
  id: string
  content_type: FeaturedContentType
  content_id: string
  header: string
  description: string
  action_text: string
  position: number
  enabled: boolean
  notifications_enabled: boolean
  title: string
  image_url: string
  channel_id: string
  channel_name: string
  target_url: string
  is_live: boolean
  scheduled_for: string | null
}

export interface FeaturedCandidate {
  id: string
  content_type: FeaturedContentType
  title: string
  image_url: string
  channel_id: string
  channel_name: string
  scheduled_for: string | null
}

export const listFeaturedContent = async (): Promise<FeaturedContent[]> => {
  const { data } = await api.get<{ items: FeaturedContent[] }>('/featured')
  return data.items || []
}

export const listAdminFeaturedContent = async (): Promise<FeaturedContent[]> => {
  const { data } = await api.get<{ items: FeaturedContent[] }>('/admin/featured')
  return data.items || []
}

export const searchFeaturedCandidates = async (type: FeaturedContentType, query = ''): Promise<FeaturedCandidate[]> => {
  const { data } = await api.get<{ items: FeaturedCandidate[] }>('/admin/featured/candidates', { params: { type, q: query } })
  return data.items || []
}

export const createFeaturedContent = async (payload: Record<string, unknown>) => (await api.post('/admin/featured', payload)).data
export const updateFeaturedContent = async (id: string, payload: Record<string, unknown>) => (await api.put(`/admin/featured/${id}`, payload)).data
export const deleteFeaturedContent = async (id: string) => api.delete(`/admin/featured/${id}`)

