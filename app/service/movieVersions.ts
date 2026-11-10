import api from './client'

// ---------- resumable ingest uploads ----------

type UploadSession = {
  session_id: string
  file_name: string
  size: number
  chunk_size: number
  total_chunks: number
  received: number[]
  received_bytes: number
  complete: boolean
}

export type ResumableUploadProgress = {
  uploadedBytes: number
  totalBytes: number
  percent: number
  bytesPerSecond: number
  resumed: boolean
}

export type UploadedIngest = { id: string; file_path: string; title: string }

const PARALLEL_CHUNKS = 3
const MAX_CHUNK_ATTEMPTS = 8

const sessionKey = (file: File) => `giltube_ingest_upload:${file.name}:${file.size}:${file.lastModified}`

const readSessionId = (file: File) => {
  try {
    return localStorage.getItem(sessionKey(file)) || ''
  } catch {
    return ''
  }
}

const writeSessionId = (file: File, id: string) => {
  try {
    if (id) localStorage.setItem(sessionKey(file), id)
    else localStorage.removeItem(sessionKey(file))
  } catch {
    // Resuming after a reload is a convenience; the upload still works.
  }
}

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => {
    clearTimeout(timer)
    reject(new DOMException('Upload cancelled', 'AbortError'))
  }, { once: true })
})

const errorStatus = (err: any) => Number(err?.response?.status || 0)

/**
 * Uploads one large media file as a new media ingest. Chunks are written in
 * place on the server, a few at a time, with retries; if the page reloads,
 * choosing the same file again resumes where it stopped.
 */
export const uploadIngestFileResumable = async (file: File, options: {
  title?: string
  year?: number
  uploadBaseURL?: string
  signal?: AbortSignal
  onProgress?: (progress: ResumableUploadProgress) => void
} = {}): Promise<UploadedIngest> => {
  const config = { timeout: 0, ...(options.uploadBaseURL ? { baseURL: options.uploadBaseURL } : {}) }
  let session: UploadSession | null = null
  let resumed = false
  const existing = readSessionId(file)
  if (existing) {
    try {
      const res = await api.get(`/admin/media-ingests/upload-sessions/${existing}`, config)
      if (res.data?.size === file.size && res.data?.file_name) {
        session = res.data
        resumed = (session?.received?.length || 0) > 0
      }
    } catch (err: any) {
      if (errorStatus(err) !== 404) throw err
    }
  }
  if (!session) {
    const res = await api.post('/admin/media-ingests/upload-sessions', {
      file_name: file.name,
      size: file.size,
      last_modified: file.lastModified,
    }, config)
    session = res.data as UploadSession
    writeSessionId(file, session.session_id)
  }

  const { session_id: id, chunk_size: chunkSize, total_chunks: totalChunks } = session
  const received = new Set(session.received || [])
  let doneBytes = session.received_bytes || 0
  const inFlight = new Map<number, number>()
  const startedAt = Date.now()
  const startBytes = doneBytes
  const report = () => {
    let partial = 0
    for (const value of inFlight.values()) partial += value
    const uploadedBytes = Math.min(file.size, doneBytes + partial)
    const elapsed = (Date.now() - startedAt) / 1000
    options.onProgress?.({
      uploadedBytes,
      totalBytes: file.size,
      percent: file.size ? Math.min(100, (uploadedBytes * 100) / file.size) : 100,
      bytesPerSecond: elapsed > 1 ? (uploadedBytes - startBytes) / elapsed : 0,
      resumed,
    })
  }
  report()

  const pending: number[] = []
  for (let index = 0; index < totalChunks; index++) {
    if (!received.has(index)) pending.push(index)
  }

  const sendChunk = async (index: number) => {
    const start = index * chunkSize
    const blob = file.slice(start, Math.min(file.size, start + chunkSize))
    for (let attempt = 1; ; attempt++) {
      if (options.signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')
      try {
        await api.put(`/admin/media-ingests/upload-sessions/${id}/chunks/${index}`, blob, {
          ...config,
          signal: options.signal,
          headers: { 'Content-Type': 'application/octet-stream' },
          onUploadProgress: (event: any) => {
            inFlight.set(index, Number(event.loaded || 0))
            report()
          },
        })
        inFlight.delete(index)
        doneBytes += blob.size
        report()
        return
      } catch (err: any) {
        inFlight.delete(index)
        const status = errorStatus(err)
        if (options.signal?.aborted || err?.name === 'CanceledError') throw new DOMException('Upload cancelled', 'AbortError')
        // 4xx other than timeouts/rate limits will not get better on retry.
        if (attempt >= MAX_CHUNK_ATTEMPTS || (status >= 400 && status < 500 && status !== 408 && status !== 429)) throw err
        await sleep(Math.min(30000, 1000 * 2 ** (attempt - 1)), options.signal)
      }
    }
  }

  const worker = async () => {
    while (pending.length) {
      const index = pending.shift()!
      await sendChunk(index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL_CHUNKS, pending.length || 1) }, worker))

  const res = await api.post(`/admin/media-ingests/upload-sessions/${id}/complete`, {
    media_type: 'movie',
    title: options.title || '',
    year: options.year || 0,
  }, config)
  writeSessionId(file, '')
  return res.data as UploadedIngest
}

/** Abandons a resumable upload of this file, freeing its space on the server. */
export const cancelIngestUpload = async (file: File, uploadBaseURL?: string) => {
  const id = readSessionId(file)
  writeSessionId(file, '')
  if (!id) return
  try {
    await api.delete(`/admin/media-ingests/upload-sessions/${id}`, uploadBaseURL ? { baseURL: uploadBaseURL } : {})
  } catch {
    // Stale sessions are cleaned up by the server after two weeks.
  }
}

// ---------- movie versions ----------

export type MovieVersion = {
  id: string
  kind: string
  label: string
  video_id: string
  ingest_id: string
  source_name: string
  offset_ms: number
  status: 'staging' | 'transcoding' | 'ready' | 'failed' | string
  progress: number
  error_message: string
  playable: boolean
  hls_path: string
  video_status: string
  video_progress: number
}

export type MovieVersionsState = {
  movie_id: string
  video_id: string
  versions: MovieVersion[]
  main_audio: Array<{ id: string; label: string; language: string; default: boolean }>
  main_has_audio: boolean
}

export type MovieVersionAlignment = {
  offset_ms: number
  confidence: number
  drift_ms: number
  late_offset_ms: number
  late_confidence: number
  main_duration: number
  alt_duration: number
}

export type MovieVersionMeasurement = {
  result: MovieVersionAlignment
  verdict: 'ok' | 'late' | 'drift' | 'weak' | string
  main_track: string
}

export const listMovieVersions = async (movieId: string) => {
  const res = await api.get(`/admin/movies/${movieId}/versions`)
  return res.data as MovieVersionsState
}

export const measureMovieVersion = async (movieId: string, data: {
  ingest_id: string
  file_path: string
  stream_index: number
}, onProgress?: (percent: number) => void): Promise<MovieVersionMeasurement> => {
  const res = await api.post(`/admin/movies/${movieId}/versions/measure`, data)
  const jobId = String(res.data?.job_id || '')
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const status = await api.get(`/admin/movie-version-measurements/${jobId}`)
    const job = status.data || {}
    onProgress?.(Number(job.progress || 0))
    if (job.status === 'completed') return { result: job.result, verdict: job.verdict, main_track: job.main_track }
    if (job.status === 'failed') throw new Error(job.error || 'Failed to measure the offset.')
  }
}

export const createMovieVersion = async (movieId: string, data: {
  kind: string
  ingest_id: string
  file_path: string
  stream_index: number
  offset_ms: number
}) => {
  const res = await api.post(`/admin/movies/${movieId}/versions`, data)
  return res.data as { id: string; video_id: string; status: string; offset_ms: number }
}

export const deleteMovieVersion = async (movieId: string, kind: string) => {
  const res = await api.delete(`/admin/movies/${movieId}/versions/${kind}`)
  return res.data
}
