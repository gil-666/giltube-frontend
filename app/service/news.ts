import api from './client'

export type NewsNotifyMode = 'none' | 'silent' | 'loud'
export type NewsCTAKind = 'none' | 'internal' | 'external'

export interface NewsItem {
  id: string
  title: string
  body: string
  show_panel: boolean
  notify_mode: NewsNotifyMode
  cta_kind: NewsCTAKind
  cta_label: string
  cta_target: string
  enabled: boolean
  starts_at: string
  ends_at: string | null
  notified_at: string | null
  created_at: string
  updated_at: string
  dismiss_count?: number
}

export interface NewsPayload {
  title: string
  body: string
  show_panel: boolean
  notify_mode: NewsNotifyMode
  cta_kind: NewsCTAKind
  cta_label: string
  cta_target: string
  enabled?: boolean
  starts_at?: string
  ends_at?: string | null
}

export const listNewsPanels = async (): Promise<NewsItem[]> => {
  const { data } = await api.get<{ items: NewsItem[] }>('/news/panels')
  return data.items || []
}

export const getNewsItem = async (id: string): Promise<NewsItem> => {
  const { data } = await api.get<{ item: NewsItem }>(`/news/${encodeURIComponent(id)}`)
  return data.item
}

export const dismissNewsItem = async (id: string) => (await api.post<{ dismissed: boolean }>(`/news/${encodeURIComponent(id)}/dismiss`)).data

export const listAdminNews = async (): Promise<NewsItem[]> => {
  const { data } = await api.get<{ items: NewsItem[] }>('/admin/news')
  return data.items || []
}

export const createNewsItem = async (payload: NewsPayload): Promise<NewsItem> => (await api.post<{ item: NewsItem }>('/admin/news', payload)).data.item
export const updateNewsItem = async (id: string, payload: NewsPayload): Promise<NewsItem> => (await api.put<{ item: NewsItem }>(`/admin/news/${encodeURIComponent(id)}`, payload)).data.item
export const deleteNewsItem = async (id: string) => (await api.delete<{ deleted: boolean }>(`/admin/news/${encodeURIComponent(id)}`)).data

/** The payload that reproduces an item as-is (used for quick toggles). */
export const newsPayloadOf = (item: NewsItem): NewsPayload => ({
  title: item.title,
  body: item.body,
  show_panel: item.show_panel,
  notify_mode: item.notify_mode,
  cta_kind: item.cta_kind,
  cta_label: item.cta_label,
  cta_target: item.cta_target,
  enabled: item.enabled,
  starts_at: item.starts_at,
  ends_at: item.ends_at,
})

// Guests keep their dismissals in the browser.
export const NEWS_DISMISSED_STORAGE_KEY = 'giltube:news-dismissed'

export const readLocallyDismissedNews = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(NEWS_DISMISSED_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

export const rememberNewsDismissedLocally = (id: string) => {
  try {
    const ids = readLocallyDismissedNews().filter(value => value !== id)
    ids.push(id)
    localStorage.setItem(NEWS_DISMISSED_STORAGE_KEY, JSON.stringify(ids.slice(-200)))
  } catch {
    // Storage may be unavailable (private mode); the panel still closes for this launch.
  }
}
