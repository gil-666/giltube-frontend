import { computed } from 'vue'
import type { MusicTrack } from '~/app/service/music'

export type MusicRepeatMode = 'off' | 'all' | 'one'
export type MusicPanelView = 'player' | 'queue' | 'lyrics'

type MusicCommand =
  | { type: 'play' | 'pause' | 'toggle' | 'next' | 'previous' | 'queue-changed' | 'close' }
  | { type: 'seek'; value: number }
  | { type: 'volume'; value: number }
  | { type: 'load'; autoplay: boolean }

export interface MusicPlayerState {
  queue: MusicTrack[]
  currentIndex: number
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: MusicRepeatMode
  panelOpen: boolean
  panelView: MusicPanelView
}

export const MUSIC_PLAYER_STORAGE_KEY = 'giltube_music_player_v2'

const dispatchMusicCommand = (command: MusicCommand) => {
  if (!import.meta.client) return
  window.dispatchEvent(new CustomEvent('giltube-music-command', { detail: command }))
}

const clampIndex = (index: number, length: number) => Math.min(Math.max(index, 0), Math.max(0, length - 1))

export const useMusicPlayer = () => {
  const state = useState<MusicPlayerState>('giltube-music-player', () => ({
    queue: [],
    currentIndex: 0,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    shuffle: false,
    repeat: 'off',
    panelOpen: false,
    panelView: 'player',
  }))

  const currentTrack = computed(() => state.value.queue[state.value.currentIndex] || null)

  const loadQueue = (tracks: MusicTrack[], index = 0, autoplay = false) => {
    if (!tracks.length) return
    state.value.queue = [...tracks]
    state.value.currentIndex = clampIndex(index, tracks.length)
    state.value.currentTime = 0
    state.value.duration = Number(currentTrack.value?.duration_seconds || 0)
    dispatchMusicCommand({ type: 'load', autoplay })
  }

  const selectTrack = (index: number, autoplay = true) => {
    if (!state.value.queue[index]) return
    state.value.currentIndex = index
    state.value.currentTime = 0
    state.value.duration = Number(currentTrack.value?.duration_seconds || 0)
    dispatchMusicCommand({ type: 'load', autoplay })
  }

  const addToQueue = (track: MusicTrack) => {
    const existingIndex = state.value.queue.findIndex(item => item.id === track.id)
    if (existingIndex >= 0) return false
    if (!state.value.queue.length) {
      loadQueue([track], 0, false)
      return true
    }
    state.value.queue.push(track)
    dispatchMusicCommand({ type: 'queue-changed' })
    return true
  }

  const playNext = (track: MusicTrack) => {
    if (!state.value.queue.length) {
      loadQueue([track], 0, true)
      return
    }
    const insertAt = state.value.currentIndex + 1
    const existingIndex = state.value.queue.findIndex(item => item.id === track.id)
    if (existingIndex === state.value.currentIndex) return
    if (existingIndex >= 0) {
      state.value.queue.splice(existingIndex, 1)
      if (existingIndex < state.value.currentIndex) state.value.currentIndex -= 1
    }
    state.value.queue.splice(state.value.currentIndex + 1, 0, track)
    state.value.currentIndex = clampIndex(state.value.currentIndex, state.value.queue.length)
    dispatchMusicCommand({ type: 'queue-changed' })
  }

  const removeFromQueue = (index: number) => {
    if (!state.value.queue[index]) return
    if (state.value.queue.length === 1) {
      clearQueue()
      return
    }
    const removingCurrent = index === state.value.currentIndex
    state.value.queue.splice(index, 1)
    if (index < state.value.currentIndex) state.value.currentIndex -= 1
    state.value.currentIndex = clampIndex(state.value.currentIndex, state.value.queue.length)
    if (removingCurrent) {
      state.value.currentTime = 0
      state.value.duration = Number(currentTrack.value?.duration_seconds || 0)
      dispatchMusicCommand({ type: 'load', autoplay: state.value.playing })
    } else {
      dispatchMusicCommand({ type: 'queue-changed' })
    }
  }

  const moveQueueItem = (from: number, to: number) => {
    if (!state.value.queue[from] || to < 0 || to >= state.value.queue.length || from === to) return
    const currentID = currentTrack.value?.id
    const [track] = state.value.queue.splice(from, 1)
    if (!track) return
    state.value.queue.splice(to, 0, track)
    state.value.currentIndex = Math.max(0, state.value.queue.findIndex(item => item.id === currentID))
    dispatchMusicCommand({ type: 'queue-changed' })
  }

  const clearQueue = () => {
    state.value.queue = []
    state.value.currentIndex = 0
    state.value.playing = false
    state.value.currentTime = 0
    state.value.duration = 0
    dispatchMusicCommand({ type: 'close' })
  }

  const restore = () => {
    if (!import.meta.client || state.value.queue.length) return false
    localStorage.removeItem('giltube_music_player_v1')
    try {
      const saved = JSON.parse(localStorage.getItem(MUSIC_PLAYER_STORAGE_KEY) || '')
      if (!Array.isArray(saved?.queue) || !saved.queue.length) return false
      state.value.queue = saved.queue
      state.value.currentIndex = clampIndex(Number(saved.currentIndex || 0), saved.queue.length)
      state.value.currentTime = Math.max(0, Number(saved.currentTime || 0))
      state.value.duration = Math.max(0, Number(saved.duration || currentTrack.value?.duration_seconds || 0))
      state.value.volume = Math.min(1, Math.max(0, Number(saved.volume ?? 0.85)))
      state.value.shuffle = Boolean(saved.shuffle)
      state.value.repeat = ['off', 'all', 'one'].includes(saved.repeat) ? saved.repeat : 'off'
      state.value.playing = false
      return true
    } catch {
      localStorage.removeItem(MUSIC_PLAYER_STORAGE_KEY)
      return false
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    if (!state.value.queue.length) {
      localStorage.removeItem(MUSIC_PLAYER_STORAGE_KEY)
      return
    }
    localStorage.setItem(MUSIC_PLAYER_STORAGE_KEY, JSON.stringify({
      queue: state.value.queue,
      currentIndex: state.value.currentIndex,
      currentTime: state.value.currentTime,
      duration: state.value.duration,
      volume: state.value.volume,
      shuffle: state.value.shuffle,
      repeat: state.value.repeat,
    }))
  }

  const play = () => dispatchMusicCommand({ type: 'play' })
  const pause = () => dispatchMusicCommand({ type: 'pause' })
  const toggle = () => dispatchMusicCommand({ type: 'toggle' })
  const next = () => dispatchMusicCommand({ type: 'next' })
  const previous = () => dispatchMusicCommand({ type: 'previous' })
  const seek = (value: number) => dispatchMusicCommand({ type: 'seek', value })
  const setVolume = (value: number) => dispatchMusicCommand({ type: 'volume', value })
  const toggleShuffle = () => {
    state.value.shuffle = !state.value.shuffle
    persist()
  }
  const cycleRepeat = () => {
    const modes: MusicRepeatMode[] = ['off', 'all', 'one']
    state.value.repeat = modes[(modes.indexOf(state.value.repeat) + 1) % modes.length] || 'off'
    persist()
  }
  const openPlayer = (view: MusicPanelView = 'player') => {
    state.value.panelView = view
    state.value.panelOpen = true
  }
  const closePanel = () => {
    state.value.panelOpen = false
  }

  return {
    state,
    currentTrack,
    loadQueue,
    selectTrack,
    addToQueue,
    playNext,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    restore,
    persist,
    play,
    pause,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    openPlayer,
    closePanel,
  }
}
