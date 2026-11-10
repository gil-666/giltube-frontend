import api from './client'

export interface PromotionTheme {
  from: string
  via: string
  to: string
  accent: string
}

// Translated text; empty fields fall back to the main (English) text.
export interface PromotionText {
  label?: string
  title?: string
  tagline?: string
  badge?: string
  cta_label?: string
  partner_caption?: string
}

export const PROMOTION_TEXT_FIELDS = ['label', 'title', 'tagline', 'badge', 'cta_label', 'partner_caption'] as const
export const PROMOTION_LOCALES = ['es'] as const

export interface Promotion {
  id: string
  placement: string
  label: string
  title: string
  tagline: string
  badge: string
  cta_label: string
  url: string
  partner_caption: string
  logo_url: string
  logo_style: 'white' | 'original'
  partner_url: string
  partner_style: 'card' | 'original'
  sprite_url: string
  effect: 'none' | 'flutter'
  scene: 'none' | 'lighthouse'
  theme: PromotionTheme
  translations: Record<string, PromotionText>
  sort_order: number
  enabled: boolean
  starts_at: string | null
  ends_at: string | null
  impressions?: number
  clicks?: number
}

export type PromotionInput = Omit<Promotion, 'id' | 'logo_url' | 'partner_url' | 'sprite_url' | 'impressions' | 'clicks'>
export type PromotionAssetSlot = 'logo' | 'partner' | 'sprite'

// localizePromotion returns the promotion with its text in the given locale
// ("es", "es-MX"), keeping the main text for fields without a translation.
export const localizePromotion = (promo: Promotion, locale: string): Promotion => {
  const text = promo.translations?.[locale.toLowerCase().split('-')[0]]
  if (!text) return promo
  const localized = { ...promo }
  for (const field of PROMOTION_TEXT_FIELDS) {
    const value = text[field]?.trim()
    if (value) localized[field] = value
  }
  return localized
}

export const listPromotions = async (placement = 'home'): Promise<Promotion[]> => {
  const response = await api.get('/promotions', { params: { placement } })
  return response.data?.promotions || []
}

// Impressions and clicks are best-effort counters; a failure is ignored.
export const recordPromotionEvent = (id: string, event: 'impression' | 'click') => {
  const path = `${api.defaults.baseURL || '/api/v1'}/promotions/${encodeURIComponent(id)}/${event}`
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon && navigator.sendBeacon(path)) return
  } catch {}
  api.post(`/promotions/${encodeURIComponent(id)}/${event}`).catch(() => {})
}

export const listAdminPromotions = async (): Promise<{ promotions: Promotion[], placements: string[] }> => {
  const response = await api.get('/admin/promotions')
  return response.data
}

export const savePromotion = async (input: PromotionInput, id?: string): Promise<Promotion> => {
  const response = id
    ? await api.put(`/admin/promotions/${encodeURIComponent(id)}`, input)
    : await api.post('/admin/promotions', input)
  return response.data.promotion
}

export const deletePromotion = async (id: string) => {
  await api.delete(`/admin/promotions/${encodeURIComponent(id)}`)
}

export const uploadPromotionAsset = async (id: string, slot: PromotionAssetSlot, file: File): Promise<Promotion> => {
  const form = new FormData()
  form.append('file', file)
  const response = await api.post(`/admin/promotions/${encodeURIComponent(id)}/assets/${slot}`, form)
  return response.data.promotion
}

export const deletePromotionAsset = async (id: string, slot: PromotionAssetSlot): Promise<Promotion> => {
  const response = await api.delete(`/admin/promotions/${encodeURIComponent(id)}/assets/${slot}`)
  return response.data.promotion
}
