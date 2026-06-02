import api from './client'

export type GilAdsCreativeType = 'banner' | 'vertical' | 'video' | 'feed' | string
export type GilAdsEventType = 'impression' | 'click' | 'video_view' | string

export interface GilAdsServeRequest {
  placement: string
  type?: GilAdsCreativeType
  size?: string
  context?: Record<string, any>
}

export interface GilAdsCreative {
  id: string
  type: GilAdsCreativeType
  size: string
  headline: string
  body: string
  assetUrl: string
  destinationUrl: string
}

export interface GilAdsServeResponse {
  requestId: string
  placement: string
  campaignId: string
  creative: GilAdsCreative
}

export interface GilAdsTrackEventRequest {
  creativeId: string
  eventType: GilAdsEventType
  placement: string
  context?: Record<string, any>
}

export const GILADS_PLACEMENTS = {
  homeBanner: 'giltube_home_banner',
  videoPreroll: 'giltube_video_preroll',
  videoSidebarSquare: 'giltube_video_sidebar_square',
} as const

export const serveGilAd = async (payload: GilAdsServeRequest): Promise<GilAdsServeResponse | null> => {
  try {
    const res = await api.post('/ads/serve', payload)
    return res.data
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null
    }
    throw error
  }
}

export const trackGilAdEvent = async (payload: GilAdsTrackEventRequest) => {
  const res = await api.post('/ads/events', payload)
  return res.data
}
