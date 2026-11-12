import { computed, onMounted, ref, shallowRef } from 'vue'

// GilTube for Windows (the Electron desktop app) exposes window.giltubeDesktop
// to GilTube pages. In a normal browser it is missing and nothing here shows.

export interface DesktopDownload {
  id: string
  title: string
  quality: string
  status: 'queued' | 'preparing' | 'downloading' | 'error'
  audio?: string[]
  // Enough has downloaded to start watching (the app plays it as it downloads).
  playable?: boolean
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
    start: (videoId: string, quality: string, title?: string, audio?: string[]) => Promise<void>
    audioOptions?: (videoId: string) => Promise<{ id: string, label: string, language: string, default: boolean }[]>
    cancel: (videoId: string) => Promise<void>
    remove: (videoId: string) => Promise<void>
    get: (videoId: string) => Promise<{ id: string, quality: string, size: number } | null>
    state: () => Promise<{ active: DesktopDownload[] }>
    onChange: (callback: (state: { active: DesktopDownload[] }) => void) => () => void
  }
  updates: {
    state: () => Promise<DesktopUpdate | null>
    install: () => Promise<boolean>
    onChange: (callback: (state: DesktopUpdate) => void) => () => void
  }
  theme?: {
    set: (vars: Record<string, string>) => Promise<boolean>
  }
  setLocale?: (locale: string) => Promise<boolean>
}

// Shared by every component: one subscription for the whole page.
const bridge = shallowRef<DesktopBridge | null>(null)
const activeDownloads = ref<DesktopDownload[]>([])
const desktopUpdate = ref<DesktopUpdate | null>(null)
// Bumped when a download finishes or is removed, so "saved" states recheck.
const libraryVersion = ref(0)
// Newer apps show downloads and updates in their own title bar.
const hasTitleBar = ref(false)
let subscribed = false
// The site's language, for the app's own text (tray, Downloads, title bar).
let siteLocale = ''

const sendLocale = () => {
  if (siteLocale && bridge.value?.features?.includes('locale')) void bridge.value.setLocale?.(siteLocale).catch(() => {})
}

export const setDesktopLocale = (locale: string) => {
  siteLocale = locale
  sendLocale()
}

// The theme variables the app's own pages use (title bar, offline library),
// sent whenever the site's theme changes so they match it, offline too.
const THEME_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const THEME_VARS = [
  '--gt-font', '--gt-radius-scale', '--gt-white', '--gt-on-primary', '--gt-on-accent', '--gt-primary', '--gt-accent',
  ...['zinc', 'primary', 'accent', 'red'].flatMap((scale) => THEME_STEPS.map((step) => `--gt-${scale}-${step}`)),
]

const sendTheme = (candidate: DesktopBridge) => {
  const style = getComputedStyle(document.documentElement)
  const vars: Record<string, string> = {}
  for (const name of THEME_VARS) {
    const value = style.getPropertyValue(name).trim()
    if (value) vars[name] = value
  }
  void candidate.theme?.set(vars).catch(() => {})
}

const watchTheme = (candidate: DesktopBridge) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => sendTheme(candidate), 400)
  }
  // The theme is a <style> in <head> plus attributes on <html>.
  const observer = new MutationObserver(schedule)
  observer.observe(document.head, { childList: true, subtree: true, characterData: true })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-scheme', 'style', 'class'] })
  schedule()
}

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
  if (candidate.features.includes('theme')) watchTheme(candidate)
  sendLocale()
  if (candidate.features.includes('titlebar')) hasTitleBar.value = true
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
    hasDesktopTitleBar: hasTitleBar,
    openDownloads: (videoId?: string) => bridge.value?.openDownloads(videoId),
    installDesktopUpdate: () => bridge.value?.updates.install(),
  }
}
