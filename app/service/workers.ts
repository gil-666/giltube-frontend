import api from './client'

export interface WorkerJob {
  video_id: string
  video_title: string
  progress: number
  started_at: string
}

export interface WorkerNode {
  id: string
  name: string
  platform: string
  arch: string
  encoder: string
  encoder_kind: string
  is_gpu: boolean
  roles: string[]
  version: string
  status: 'online' | 'offline' | 'revoked'
  managed: boolean
  disabled: boolean
  scheduling_disabled: boolean
  effective_enabled: boolean
  fallback_active: boolean
  is_primary: boolean
  last_ip: string
  started_at: string
  last_seen: string
  current_job?: WorkerJob
}

export interface WorkerRelease {
  filename: string
  version: string
  os: 'linux' | 'windows' | 'darwin'
  arch: 'amd64' | 'arm64'
  size: number
  sha256: string
  download_url: string
}

export const listWorkers = async (): Promise<WorkerNode[]> => {
  const response = await api.get('/admin/workers')
  return response.data?.workers || []
}

export const createWorkerEnrollmentCode = async (): Promise<{ code: string; expires_at: string }> => {
  const response = await api.post('/admin/workers/enrollment-codes')
  return response.data
}

export const listWorkerReleases = async (): Promise<WorkerRelease[]> => {
  const response = await api.get('/admin/workers/releases')
  return response.data?.releases || []
}

export const downloadWorkerRelease = async (release: WorkerRelease) => {
  const anchor = document.createElement('a')
  anchor.href = release.download_url || `/api/v1/worker-releases/download/${encodeURIComponent(release.filename)}`
  anchor.download = release.filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export const revokeWorker = async (id: string) => {
  const response = await api.post(`/admin/workers/${encodeURIComponent(id)}/revoke`)
  return response.data
}

export const enableWorker = async (id: string) => {
  const response = await api.post(`/admin/workers/${encodeURIComponent(id)}/enable`)
  return response.data
}

export const setWorkerScheduling = async (id: string, enabled: boolean) => {
  const response = await api.post(`/admin/workers/${encodeURIComponent(id)}/scheduling`, { enabled })
  return response.data
}

export const deleteWorker = async (id: string) => {
  await api.delete(`/admin/workers/${encodeURIComponent(id)}`)
}
