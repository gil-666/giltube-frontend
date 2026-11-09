import api from './client'

export type CaptionJobStatus = 'queued' | 'running' | 'completed' | 'skipped' | 'failed' | 'cancelled'

export type CaptionJob = {
  video_id: string
  title: string
  mode: 'auto' | 'manual' | string
  requested_language: string
  detected_language: string
  status: CaptionJobStatus | string
  progress: number
  error_message: string
  attempts: number
  worker_id: string
  worker_name: string
  created_at: string
  updated_at: string
  started_at?: string
  finished_at?: string
}

export type CaptionJobList = {
  items: CaptionJob[]
  counts: Record<string, number>
  workers_online: number
}

export const listCaptionJobs = async (status = 'all') => {
  const res = await api.get('/admin/caption-jobs', { params: { status } })
  return {
    items: res.data.items || [],
    counts: res.data.counts || {},
    workers_online: res.data.workers_online || 0,
  } as CaptionJobList
}

export const retryCaptionJob = async (videoId: string) => {
  const res = await api.post(`/admin/caption-jobs/${videoId}/retry`)
  return res.data
}

export const cancelCaptionJob = async (videoId: string) => {
  const res = await api.post(`/admin/caption-jobs/${videoId}/cancel`)
  return res.data
}

export const backfillCaptionJobs = async () => {
  const res = await api.post('/admin/caption-jobs/backfill')
  return res.data as { queued: number }
}
