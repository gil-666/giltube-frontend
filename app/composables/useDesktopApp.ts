import { computed, onMounted, ref, shallowRef } from 'vue'

// GilTube for Windows (the Electron desktop app) exposes window.giltubeDesktop
// to GilTube pages. In a normal browser it is missing and nothing here shows.

export interface DesktopDownload {
  id: string
  title: string
  quality: string
  status: 'queued' | 'preparing' | 'downloading' | 'error'
  message: string
  received: number
  total: number
}

export interface DesktopUpdate {
  status: 'idle' | 'checking' | 'downloading' | 'ready'
  version: string
  notes: string
  percent: number
  current: string
}

interface DesktopBridge {
  features?: readonly string[]
  openDownloads: (videoId?: string) => Promise<void>
  downloads: {
    qualities: (videoId: string) => Promise<string[]>
    start: (videoId: string, quality: string, title?: string) => Promise<void>
    cancel: (videoId: string) => Promise<void>
    get: (videoId: string) => Promise<{ id: string, quality: string, size: number } | null>
    state: () => Promise<{ active: DesktopDownload[] }>
    onChange: (callback: (state: { active: DesktopDownload[] }) => void) => () => void
  }
  updates: {
    state: () => Promise<DesktopUpdate | null>
    install: () => Promise<boolean>
    onChange: (callback: (state: DesktopUpdate) => void) => () => void
  }
}

// Shared by every component: one subscription for the whole page.
const bridge = shallowRef<DesktopBridge | null>(null)
const activeDownloads = ref<DesktopDownload[]>([])
const desktopUpdate = ref<DesktopUpdate | null>(null)
// Bumped when a download finishes or is removed, so "saved" states recheck.
const libraryVersion = ref(0)
let subscribed = false

const connect = () => {
  if (subscribed || !import.meta.client) return
  const candidate = (window as unknown as { giltubeDesktop?: DesktopBridge }).giltubeDesktop
  if (!candidate?.features?.includes('downloads')) return
  subscribed = true
  bridge.value = candidate
  const applyDownloads = (state: { active: DesktopDownload[] }) => {
    const before = activeDownloads.value.length
    activeDownloads.value = state?.active || []
    if (activeDownloads.value.length < before) libraryVersion.value += 1
  }
  candidate.downloads.onChange(applyDownloads)
  void candidate.downloads.state().then(applyDownloads).catch(() => {})
  if (candidate.features.includes('updates')) {
    candidate.updates.onChange((state) => { desktopUpdate.value = state })
    void candidate.updates.state().then((state) => { desktopUpdate.value = state }).catch(() => {})
  }
}

export const useDesktopApp = () => {
  onMounted(connect)

  const hasDesktopDownloads = computed(() => Boolean(bridge.value))
  const desktopUpdateReady = computed(() => desktopUpdate.value?.status === 'ready')

  return {
    bridge,
    hasDesktopDownloads,
    activeDownloads,
    libraryVersion,
    desktopUpdate,
    desktopUpdateReady,
    openDownloads: (videoId?: string) => bridge.value?.openDownloads(videoId),
    installDesktopUpdate: () => bridge.value?.updates.install(),
  }
}
