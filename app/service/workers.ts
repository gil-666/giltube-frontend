import api from './client'

export interface WorkerJob {
  video_id: string
  video_title: string
  progress: number
  started_at: string
  /** Distributed transcode task, e.g. "2160p" or "2160p-hdr"; absent for a whole job. */
  task?: string
}

/** What a worker reported it can encode, and how fast (megapixels per second per slot). */
export interface WorkerCapabilities {
  version?: number
  sdr_hw_max_height?: number
  hdr_hw_max_height?: number
  sdr_sw?: boolean
  hdr_sw?: boolean
  slots?: number
  sdr_hw_mpps?: number
  sdr_sw_mpps?: number
  hdr_hw_mpps?: number
  hdr_sw_mpps?: number
  decode_mpps?: number
  tonemap_mpps?: number
  download_bps?: number
  shared_storage?: boolean
  prep_lane?: boolean
}

/** Administrator caps: 0 = no limit, -1 (HDR only) = never. */
export interface WorkerLimits {
  sdr_max_height: number
  hdr_max_height: number
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
  roles_locked: boolean
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
  caption_engine?: string
  caption_status?: string
  current_caption_job?: WorkerJob
  capabilities?: WorkerCapabilities
  limits?: WorkerLimits
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

export const setWorkerRoles = async (id: string, roles: string[]) => {
  const response = await api.put(`/admin/workers/${encodeURIComponent(id)}/roles`, { roles })
  return response.data
}

export const setWorkerLimits = async (id: string, limits: WorkerLimits): Promise<WorkerLimits> => {
  const response = await api.put(`/admin/workers/${encodeURIComponent(id)}/limits`, limits)
  return response.data?.limits
}

export const deleteWorker = async (id: string) => {
  await api.delete(`/admin/workers/${encodeURIComponent(id)}`)
}
