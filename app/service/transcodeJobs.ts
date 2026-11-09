import api from './client'

export type TranscodeJobStatus = 'queued' | 'running' | 'paused' | 'failed' | 'cancelled' | 'completed'

export type TranscodeTask = {
  name: string
  kind: 'prep' | 'sdr' | 'hdr' | string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled' | string
  progress: number
  attempts: number
  worker_id: string
  worker_name: string
  error_message: string
}

export type TranscodeJob = {
  video_id: string
  title: string
  file_path: string
  status: TranscodeJobStatus | string
  progress: number
  error_message: string
  attempts: number
  worker_id: string
  video_status: string
  video_progress: number
  hls_path: string
  created_at: string
  updated_at: string
  started_at?: string
  finished_at?: string
  /** "split" for jobs encoded as distributed tasks, listed in tasks. */
  mode?: string
  tasks?: TranscodeTask[]
}

export const listTranscodeJobs = async (status = 'all') => {
  const res = await api.get('/admin/transcode-jobs', { params: { status } })
  return (res.data.items || []) as TranscodeJob[]
}

export const startTranscodeJob = async (videoId: string) => {
  const res = await api.post(`/admin/transcode-jobs/${videoId}/start`)
  return res.data
}

export const restartTranscodeJob = async (videoId: string) => {
  const res = await api.post(`/admin/transcode-jobs/${videoId}/restart`)
  return res.data
}

export const pauseTranscodeJob = async (videoId: string) => {
  const res = await api.post(`/admin/transcode-jobs/${videoId}/pause`)
  return res.data
}

export const cancelTranscodeJob = async (videoId: string) => {
  const res = await api.post(`/admin/transcode-jobs/${videoId}/cancel`)
  return res.data
}
