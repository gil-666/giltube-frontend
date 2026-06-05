<template>
  <div class="w-full flex items-center justify-center relative">
    <div class="video-player-container w-full bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
      <video ref="videoElement" class="video-js vjs-default-skin" controls
        preload="auto"></video>

      <!-- <button
        v-if="isPictureInPictureSupported"
        ref="mobilePiPOverlay"
        type="button"
        class="mobile-pip-overlay"
        aria-label="Picture in picture"
        @click="togglePictureInPicture"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4.75 5.5A2.25 2.25 0 0 1 7 3.25h10A2.25 2.25 0 0 1 19.25 5.5v13A2.25 2.25 0 0 1 17 20.75H7a2.25 2.25 0 0 1-2.25-2.25v-13Zm2.25-.75a.75.75 0 0 0-.75.75v13c0 .41.34.75.75.75h10a.75.75 0 0 0 .75-.75v-13a.75.75 0 0 0-.75-.75H7Zm4.25 8.25c0-.41.34-.75.75-.75h4.5c.41 0 .75.34.75.75v3.5c0 .41-.34.75-.75.75H12a.75.75 0 0 1-.75-.75V13Z" fill="currentColor" />
        </svg>
      </button> -->

      <!-- Custom progress bar overlaid above the control bar (YouTube style) -->
      <div
        ref="progressBarOverlay"
        class="progress-bar-overlay"
        :class="{ 'progress-bar-overlay-locked': controlsLocked }"
        style="position: absolute; bottom: 32px; left: 2px; right: 2px; width: calc(100% - 4px); height: 5px; background-color: rgb(55, 65, 81); cursor: pointer; z-index: 50; pointer-events: auto; border-radius: 4px; overflow: hidden;"
        @mousedown="handleProgressBarInteraction"
        @touchstart="handleProgressBarInteraction"
        @mousemove="handleProgressBarHover"
        @touchmove="handleProgressBarHover"
      >
        <!-- Buffered amount -->
        <div
          v-if="bufferedEnd > 0"
          class="buffered-amount"
          style="position: absolute; left: 0; top: 0; height: 100%; background-color: rgb(107, 114, 128); opacity: 0.6;"
          :style="{ width: `${(bufferedEnd / duration) * 100}%` }"
        />
        <!-- Played amount -->
        <div
          class="played-amount"
          style="position: absolute; left: 0; top: 0; height: 100%; background-color: rgb(239, 68, 68); transition: width 75ms ease;"
          :style="{ width: `${(currentTime / duration) * 100}%` }"
        />
        <!-- Seek circle indicator -->
        <div
          class="seek-indicator"
          style="position: absolute; top: 50%; width: 12px; height: 12px; background-color: rgb(239, 68, 68); border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.5); opacity: 0; transition: opacity 150ms ease; pointer-events: none;"
          :style="{ left: `${(seekPreviewTime / duration) * 100}%`, transform: 'translate(-50%, -50%)' }"
        />
      </div>

      <!-- Presence overlay (live only) -->
      <div v-if="isLive && (viewers.length > 0 || anonymousCount > 0)" class="presence-overlay absolute left-3 top-3 bg-black/60 text-white rounded-md p-2 flex items-center gap-3">
        <div class="avatars flex items-center gap-2">
          <div v-for="v in visibleViewers" :key="v.id" class="viewer flex items-center gap-2">
            <img v-if="v.avatarUrl" :src="v.avatarUrl" alt="avatar" class="w-6 h-6 rounded-full object-cover" />
            <div v-else class="w-6 h-6 rounded-full bg-gray-500" />
          </div>
        </div>
        <div class="text-sm">
          <div v-if="viewers.length > 0">{{ viewers.length }} viewer{{ viewers.length === 1 ? '' : 's' }}</div>
          <div v-if="anonymousCount > 0">{{ anonText }}</div>
        </div>
      </div>

      <!-- <div v-if="episodeLabel" class="series-episode-label absolute left-3 top-3 rounded bg-black/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
        {{ episodeLabel }}
      </div> -->

      <div ref="seriesActionsOverlay" class="series-player-actions flex items-center justify-end gap-3">
        <button
          v-if="showSkipIntroButton"
          type="button"
          class="rounded bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:bg-zinc-200"
          @click="skipIntro"
        >
          Skip intro
        </button>
        <button
          v-if="showNextEpisodeOverlay"
          type="button"
          class="rounded bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:bg-zinc-200"
          @click="emit('nextEpisode')"
        >
          {{ nextEpisodeLabel }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-contrib-quality-levels'

interface Props {
  src?: string
  status?: 'processing' | 'ready' | 'failed' | string
  episodeLabel?: string
  introStartSeconds?: number
  introEndSeconds?: number
  hasNextEpisode?: boolean
  nextEpisodeLabel?: string
  startTimeSeconds?: number
  controlsLocked?: boolean
}

const emit = defineEmits<{
  play: []
  pause: []
  seeked: [payload: { currentTime: number }]
  ended: []
  nextEpisode: []
  progress: [payload: { currentTime: number, duration: number }]
}>()

const props = withDefaults(defineProps<Props>(), {
  status: 'ready',
  episodeLabel: '',
  introStartSeconds: 0,
  introEndSeconds: 0,
  hasNextEpisode: false,
  nextEpisodeLabel: 'Next episode',
  startTimeSeconds: 0,
  controlsLocked: false
})

type PresenceViewer = {
  id: string
  avatarUrl?: string
}

const isLive = ref(false)
const viewers = ref<PresenceViewer[]>([])
const anonymousCount = ref(0)
const visibleViewers = computed(() => viewers.value.slice(0, 6))
const anonText = computed(() => {
  const n = anonymousCount.value
  return `${n} anonymous viewer${n === 1 ? '' : 's'}`
})

// Progress bar state
const currentTime = ref(0)
const duration = ref(0)
const bufferedEnd = ref(0)
const seekPreviewTime = ref(0)
const isSeekingProgress = ref(false)
const progressBarOverlay = ref<HTMLElement | null>(null)
const seriesActionsOverlay = ref<HTMLElement | null>(null)
const mobilePiPOverlay = ref<HTMLElement | null>(null)
const isPictureInPictureSupported = ref(false)
const showSkipIntroButton = computed(() =>
  props.introEndSeconds > props.introStartSeconds &&
  currentTime.value >= props.introStartSeconds &&
  currentTime.value < props.introEndSeconds
)
const showNextEpisodeOverlay = computed(() =>
  props.hasNextEpisode &&
  duration.value > 0 &&
  duration.value - currentTime.value <= 45
)

const videoElement = ref<HTMLVideoElement | null>(null)
let player: any = null
let qualityButton: any = null
let audioButton: any = null
let mobileSettingsButton: any = null
let nextEpisodeButton: any = null
const DEFAULT_INACTIVITY_TIMEOUT = 3000
let ultrawideControlsGuardInterval: ReturnType<typeof setInterval> | null = null
let mobileControlsQuery: MediaQueryList | null = null
let hasAppliedInitialStartTime = false
let lastProgressEmitAt = 0
let applyingProgrammaticPlayback = false
let restoringLockedPlayback = false
let lockedExpectedTime = 0
let lockedExpectedPaused = true

declare global {
  interface Window {
    giltubePlayerDebug?: {
      getPlayer: () => any
      dump: () => void
    }
  }
}

const countUniqueQualityLevels = (levels: any) => {
  if (!levels || typeof levels.length !== 'number') return 0

  const seen = new Set<string>()
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]
    const key = `${level?.height ?? ''}:${level?.width ?? ''}:${level?.bitrate ?? ''}:${level?.label ?? ''}`
    seen.add(key)
  }
  return seen.size
}

const updateQualityButtonVisibility = () => {
  if (!player || !qualityButton || typeof player.qualityLevels !== 'function') return

  if (isMobileControlsWidth()) {
    qualityButton.hide()
    const menu = qualityButton.menu
    if (menu) {
      menu.classList.remove('vjs-open')
    }
    return
  }

  const levels = player.qualityLevels()
  const levelCount = countUniqueQualityLevels(levels)

  if (levelCount > 1) {
    qualityButton.show()
  } else {
    qualityButton.hide()
    const menu = qualityButton.menu
    if (menu) {
      menu.classList.remove('vjs-open')
    }
  }
}

const countSelectableAudioTracks = (tracks: any) => {
  if (!tracks || typeof tracks.length !== 'number') return 0
  let count = 0
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    if (track?.kind !== 'metadata') {
      count++
    }
  }
  return count
}

const updateAudioButtonVisibility = () => {
  if (!player || !audioButton || typeof player.audioTracks !== 'function') return

  if (isMobileControlsWidth()) {
    audioButton.hide()
    const menu = audioButton.menu
    if (menu) {
      menu.classList.remove('vjs-open')
    }
    return
  }

  const tracks = player.audioTracks()
  const trackCount = countSelectableAudioTracks(tracks)

  if (trackCount > 1) {
    audioButton.show()
  } else {
    audioButton.hide()
    const menu = audioButton.menu
    if (menu) {
      menu.classList.remove('vjs-open')
    }
  }
}

const countCaptionTracks = () => {
  if (!player || typeof player.textTracks !== 'function') return 0
  const tracks = player.textTracks()
  if (!tracks || typeof tracks.length !== 'number') return 0

  let count = 0
  for (let i = 0; i < tracks.length; i++) {
    if (isCaptionTrack(tracks[i])) {
      count++
    }
  }
  return count
}

const updateMobileSettingsButtonVisibility = () => {
  if (!player || !mobileSettingsButton) return

  if (!isMobileControlsWidth()) {
    mobileSettingsButton.hide()
    if (mobileSettingsButton.menu) {
      mobileSettingsButton.menu.classList.remove('vjs-open')
    }
    return
  }

  const levels = typeof player.qualityLevels === 'function' ? player.qualityLevels() : null
  const tracks = typeof player.audioTracks === 'function' ? player.audioTracks() : null
  const hasSettings =
    countUniqueQualityLevels(levels) > 1 ||
    countSelectableAudioTracks(tracks) > 1 ||
    countCaptionTracks() > 0

  if (hasSettings) {
    mobileSettingsButton.show()
    mobileSettingsButton.buildMenu?.()
  } else {
    mobileSettingsButton.hide()
  }
}

const nativeCaptionsControlSelectors = '.vjs-subs-caps-button, .vjs-captions-button, .vjs-subtitles-button'

const collapseNativeCaptionsControl = () => {
  const playerEl = player?.el?.() as HTMLElement | undefined
  if (!playerEl) return

  const shouldCollapse = isMobileControlsWidth()
  playerEl.querySelectorAll(nativeCaptionsControlSelectors).forEach((node) => {
    const el = node as HTMLElement
    el.classList.toggle('giltube-mobile-native-track-hidden', shouldCollapse)
    if (shouldCollapse) {
      el.style.setProperty('display', 'none', 'important')
      el.style.setProperty('width', '0', 'important')
      el.style.setProperty('min-width', '0', 'important')
      el.style.setProperty('flex', '0 0 0', 'important')
      el.style.setProperty('margin', '0', 'important')
      el.style.setProperty('padding', '0', 'important')
      el.style.setProperty('overflow', 'hidden', 'important')
    } else {
      el.classList.remove('giltube-mobile-native-track-hidden')
      el.style.removeProperty('display')
      el.style.removeProperty('width')
      el.style.removeProperty('min-width')
      el.style.removeProperty('flex')
      el.style.removeProperty('margin')
      el.style.removeProperty('padding')
      el.style.removeProperty('overflow')
    }
  })
}

const isMobileControlsWidth = () => {
  if (typeof window === 'undefined') return false
  mobileControlsQuery ||= window.matchMedia('(max-width: 768px)')
  return mobileControlsQuery.matches
}

const updateResponsiveControls = () => {
  updateQualityButtonVisibility()
  updateAudioButtonVisibility()
  updateMobileSettingsButtonVisibility()
  collapseNativeCaptionsControl()
}

const startMobileControlsWatcher = () => {
  if (typeof window === 'undefined') return
  mobileControlsQuery ||= window.matchMedia('(max-width: 768px)')
  if (typeof mobileControlsQuery.addEventListener === 'function') {
    mobileControlsQuery.addEventListener('change', updateResponsiveControls)
  } else if (typeof mobileControlsQuery.addListener === 'function') {
    mobileControlsQuery.addListener(updateResponsiveControls)
  }
}

const stopMobileControlsWatcher = () => {
  if (!mobileControlsQuery) return
  if (typeof mobileControlsQuery.removeEventListener === 'function') {
    mobileControlsQuery.removeEventListener('change', updateResponsiveControls)
  } else if (typeof mobileControlsQuery.removeListener === 'function') {
    mobileControlsQuery.removeListener(updateResponsiveControls)
  }
}

const resetAudioButtonMenu = () => {
  if (!audioButton?.menu) return
  audioButton.menu.innerHTML = ''
  audioButton.menu.classList.remove('vjs-open')
}

const dumpPlayerDebugState = () => {
  if (!player) return

  const controlBar = player.controlBar?.el?.()
  const playerEl = player.el?.()
  const levels = player.qualityLevels?.()
  const computed = controlBar ? window.getComputedStyle(controlBar) : null
  const rect = controlBar?.getBoundingClientRect?.()
  const sampleX = rect ? rect.left + rect.width / 2 : 0
  const sampleY = rect ? rect.top + rect.height / 2 : 0
  const topElement = rect ? document.elementFromPoint(sampleX, sampleY) as HTMLElement | null : null
  const controlSamples = controlBar
    ? Array.from(controlBar.querySelectorAll('.vjs-control')).slice(0, 6).map((el) => {
        const node = el as HTMLElement
        const style = window.getComputedStyle(node)
        return {
          tag: node.tagName,
          classes: node.className,
          text: node.textContent?.trim()?.slice(0, 40) || '',
          color: style.color,
          opacity: style.opacity,
          visibility: style.visibility,
          display: style.display,
          zIndex: style.zIndex
        }
      })
    : []

  console.log('[giltube-player]', {
    isFullscreen: player.isFullscreen?.(),
    userActive: player.userActive?.(),
    paused: player.paused?.(),
    controlBarClasses: controlBar?.className,
    playerClasses: playerEl?.className,
    controlBarDisplay: computed?.display,
    controlBarOpacity: computed?.opacity,
    controlBarVisibility: computed?.visibility,
    controlBarHeight: computed?.height,
    controlBarBackground: computed?.backgroundImage || computed?.backgroundColor,
    controlBarColor: computed?.color,
    controlBarZIndex: computed?.zIndex,
    controlBarPointerEvents: computed?.pointerEvents,
    controlBarRect: rect ? {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom
    } : null,
    topElementTag: topElement?.tagName,
    topElementClasses: topElement?.className,
    topElementOpacity: topElement ? window.getComputedStyle(topElement).opacity : null,
    controlSamples,
    qualityLevels: countUniqueQualityLevels(levels)
  })
}

const ULTRAWIDE_RATIO_THRESHOLD = 2

const isChromeBrowser = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return ua.includes('Chrome/') && !ua.includes('Edg/') && !ua.includes('OPR/')
}

const isUltrawideVideo = () => {
  if (!player) return false
  const width = Number(player.videoWidth?.() || 0)
  const height = Number(player.videoHeight?.() || 0)
  if (width <= 0 || height <= 0) return false
  return width / height >= ULTRAWIDE_RATIO_THRESHOLD
}

const setControlBarPinnedStyles = (enabled: boolean) => {
  if (!player) return
  const controlBar = player.controlBar?.el?.() as HTMLElement | undefined
  if (!controlBar) return

  if (enabled) {
    controlBar.style.setProperty('display', 'flex', 'important')
    controlBar.style.setProperty('visibility', 'visible', 'important')
    controlBar.style.setProperty('opacity', '1', 'important')
    controlBar.style.setProperty('transform', 'translateY(0)', 'important')
    controlBar.style.setProperty('pointer-events', 'auto', 'important')
  } else {
    controlBar.style.removeProperty('display')
    controlBar.style.removeProperty('visibility')
    controlBar.style.removeProperty('opacity')
    controlBar.style.removeProperty('transform')
    controlBar.style.removeProperty('pointer-events')
  }
}

const stopUltrawideControlsGuard = () => {
  if (ultrawideControlsGuardInterval) {
    clearInterval(ultrawideControlsGuardInterval)
    ultrawideControlsGuardInterval = null
  }
  setControlBarPinnedStyles(false)
}

const startUltrawideControlsGuard = () => {
  if (ultrawideControlsGuardInterval) return

  ultrawideControlsGuardInterval = setInterval(() => {
    if (!player) return

    const shouldPinControlsVisible =
      isChromeBrowser() &&
      Boolean(player.isFullscreen?.()) &&
      isUltrawideVideo()

    if (!shouldPinControlsVisible) {
      stopUltrawideControlsGuard()
      return
    }

    if (typeof player.reportUserActivity === 'function') {
      player.reportUserActivity()
    }
    if (typeof player.userActive === 'function') {
      player.userActive(true)
    }

    setControlBarPinnedStyles(true)
  }, 250)
}

const syncUltrawideFullscreenClass = () => {
  if (!player) return
  const playerEl = player.el?.() as HTMLElement | undefined
  if (!playerEl) return

  const shouldPinControlsVisible =
    isChromeBrowser() &&
    Boolean(player.isFullscreen?.()) &&
    isUltrawideVideo() &&
    !player.paused?.()
  playerEl.classList.toggle('giltube-ultrawide-fullscreen', shouldPinControlsVisible)

  if (typeof player.inactivityTimeout === 'function') {
    player.inactivityTimeout(shouldPinControlsVisible ? 0 : DEFAULT_INACTIVITY_TIMEOUT)
  }

  if (shouldPinControlsVisible && typeof player.userActive === 'function') {
    player.userActive(true)
    startUltrawideControlsGuard()
    setControlBarPinnedStyles(true)
  } else {
    stopUltrawideControlsGuard()
  }
}

const handleUserInactive = () => {
  if (!player) return
  if (
    isChromeBrowser() &&
    Boolean(player.isFullscreen?.()) &&
    isUltrawideVideo() &&
    !player.paused?.() &&
    typeof player.userActive === 'function'
  ) {
    player.userActive(true)
  }
}

const inferSourceType = (src: string) => {
  const normalized = (src.split('?')[0] ?? src).toLowerCase()
  if (normalized.endsWith('.m3u8')) {
    return 'application/x-mpegURL'
  }
  if (normalized.endsWith('.mp4') || normalized.endsWith('.m4v')) {
    return 'video/mp4'
  }
  if (normalized.endsWith('.webm')) {
    return 'video/webm'
  }
  if (normalized.endsWith('.mov')) {
    return 'video/quicktime'
  }
  return 'application/x-mpegURL'
}

const reorderControlBar = () => {
  if (!player) return

  const controlBarEl = player.controlBar?.el?.() as HTMLElement | undefined
  if (!controlBarEl) return

  // Remove skip buttons from DOM
  const skipBackwardBtn = controlBarEl.querySelector('[class*="skip-backward"]')
  const skipForwardBtn = controlBarEl.querySelector('[class*="skip-forward"]')
  if (skipBackwardBtn) skipBackwardBtn.remove()
  if (skipForwardBtn) skipForwardBtn.remove()

  let leftGroup = controlBarEl.querySelector('.giltube-control-group-left') as HTMLElement | null
  let spacer = controlBarEl.querySelector('.giltube-control-group-spacer') as HTMLElement | null
  let rightGroup = controlBarEl.querySelector('.giltube-control-group-right') as HTMLElement | null

  if (!leftGroup) {
    leftGroup = document.createElement('div')
    leftGroup.className = 'giltube-control-group giltube-control-group-left'
  }
  if (!spacer) {
    spacer = document.createElement('div')
    spacer.className = 'giltube-control-group giltube-control-group-spacer'
  }
  if (!rightGroup) {
    rightGroup = document.createElement('div')
    rightGroup.className = 'giltube-control-group giltube-control-group-right'
  }

  if (!leftGroup.parentElement) {
    controlBarEl.insertBefore(leftGroup, controlBarEl.firstChild)
  }
  if (!spacer.parentElement) {
    controlBarEl.insertBefore(spacer, controlBarEl.firstChild?.nextSibling ?? null)
  }
  if (!rightGroup.parentElement) {
    controlBarEl.appendChild(rightGroup)
  }

  const playControl = controlBarEl.querySelector('.vjs-play-control')
  const volumePanel = controlBarEl.querySelector('.vjs-volume-panel')
  const currentTime = controlBarEl.querySelector('.vjs-current-time')
  const timeDivider = controlBarEl.querySelector('.vjs-time-divider')
  const duration = controlBarEl.querySelector('.vjs-duration')
  const pipControl = controlBarEl.querySelector('.vjs-picture-in-picture-control') || controlBarEl.querySelector('.vjs-picture-in-picture-toggle')
  const fullscreenControl = controlBarEl.querySelector('.vjs-fullscreen-control')
  const captionsControl =
    controlBarEl.querySelector('.vjs-subs-caps-button') ||
    controlBarEl.querySelector('.vjs-captions-button') ||
    controlBarEl.querySelector('.vjs-subtitles-button')
  const qualityControl = qualityButton?.el?.() as HTMLElement | undefined
  const audioControl = audioButton?.el?.() as HTMLElement | undefined
  const mobileSettingsControl = mobileSettingsButton?.el?.() as HTMLElement | undefined
  const nextControl = nextEpisodeButton?.el?.() as HTMLElement | undefined

  ;[playControl, volumePanel, currentTime, timeDivider, duration].filter(Boolean).forEach((node) => {
    leftGroup!.appendChild(node as HTMLElement)
  })

  ;[nextControl, mobileSettingsControl, audioControl, captionsControl, pipControl, fullscreenControl, qualityControl].filter(Boolean).forEach((node) => {
    rightGroup!.appendChild(node as HTMLElement)
  })
}

const skipIntro = () => {
  if (!player || props.introEndSeconds <= props.introStartSeconds) return
  player.currentTime(props.introEndSeconds)
}

const createNextEpisodeButton = () => {
  const Button = videojs.getComponent('Button')

  class NextEpisodeButton extends Button {
    constructor(playerRef: any, options: any) {
      super(playerRef, options)
      this.addClass('vjs-next-episode-button')
      this.controlText('Next episode')
      setTimeout(() => {
        const el = this.el()
        if (el) {
          el.innerHTML = '<span class="vjs-icon-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 6.75v10.5c0 .6.67.96 1.17.62L13.5 13v4.25c0 .6.67.96 1.17.62l7.5-5.25a.75.75 0 0 0 0-1.24l-7.5-5.25a.75.75 0 0 0-1.17.62V11L6.17 6.13A.75.75 0 0 0 5 6.75Z" fill="currentColor"/></svg></span><span class="vjs-control-text">Next episode</span>'
        }
      }, 0)
    }

    handleClick() {
      emit('nextEpisode')
    }
  }

  videojs.registerComponent('NextEpisodeButton', NextEpisodeButton)
  return 'NextEpisodeButton'
}

const getAudioTrackLabel = (track: any, index: number) => {
  const label = track?.label || track?.language || `Audio ${index + 1}`
  return String(label).trim() || `Audio ${index + 1}`
}

const createAudioButton = () => {
  const Button = videojs.getComponent('Button')

  class AudioButton extends Button {
    menu: any = null
    audioTracks: any = null

    constructor(playerRef: any, options: any) {
      super(playerRef, options)
      this.addClass('vjs-audio-button')
      this.controlText('Audio')
      this.audioTracks = playerRef.audioTracks?.()

      setTimeout(() => {
        const el = this.el()
        if (el) {
          el.innerHTML = '<span class="vjs-icon-placeholder"></span><span class="vjs-control-text">Audio</span>'
        }
      }, 0)

      if (this.audioTracks) {
        this.audioTracks.on?.('addtrack', () => {
          this.buildMenu()
          updateAudioButtonVisibility()
        })
        this.audioTracks.on?.('removetrack', () => {
          this.buildMenu()
          updateAudioButtonVisibility()
        })
        this.audioTracks.on?.('change', () => {
          this.updateMenuSelection()
        })
      }
    }

    bindPress(el: Element, handler: (e: Event) => void) {
      const node = el as HTMLElement
      node.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        handler(e)
      }
    }

    buildMenu() {
      if (!this.audioTracks || this.audioTracks.length === 0) return

      if (this.menu) {
        this.menu.innerHTML = ''
      } else {
        this.menu = videojs.dom.createEl('div', {
          className: 'vjs-audio-menu'
        })
        this.el().appendChild(this.menu)
      }

      for (let i = 0; i < this.audioTracks.length; i++) {
        const track = this.audioTracks[i]
        if (track?.kind === 'metadata') continue

        const item = videojs.dom.createEl('button', {
          className: 'vjs-audio-menu-item',
          innerHTML: getAudioTrackLabel(track, i),
          type: 'button'
        }) as HTMLButtonElement
        item.dataset.trackIndex = i.toString()

        this.bindPress(item, () => {
          const selectedIndex = parseInt(item.dataset.trackIndex || '0')
          for (let j = 0; j < this.audioTracks.length; j++) {
            this.audioTracks[j].enabled = j === selectedIndex
          }
          this.updateMenuSelection()
          this.toggleMenu()
        })

        this.menu.appendChild(item)
      }

      this.updateMenuSelection()
    }

    updateMenuSelection() {
      if (!this.menu || !this.audioTracks) return

      const items = this.menu.querySelectorAll('.vjs-audio-menu-item')
      items.forEach((item: any) => {
        const trackIndex = parseInt(item.dataset.trackIndex || '-1')
        const track = this.audioTracks[trackIndex]
        item.classList.toggle('vjs-selected', Boolean(track?.enabled))
      })
    }

    handleClick() {
      if (!this.audioTracks || countSelectableAudioTracks(this.audioTracks) <= 1) return

      if (!this.menu || this.menu.children.length === 0) {
        this.buildMenu()
      }

      this.toggleMenu()
    }

    handleTap(event: Event) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      this.handleClick()
    }

    toggleMenu() {
      if (this.menu) {
        this.menu.classList.toggle('vjs-open')
      }
    }
  }

  videojs.registerComponent('AudioButton', AudioButton)
  return 'AudioButton'
}

const getTextTrackLabel = (track: any, index: number) => {
  const label = track?.label || track?.language || `Caption ${index + 1}`
  return String(label).trim() || `Caption ${index + 1}`
}

const isCaptionTrack = (track: any) => track?.kind === 'subtitles' || track?.kind === 'captions'

const createMobileSettingsButton = () => {
  const Button = videojs.getComponent('Button')

  class MobileSettingsButton extends Button {
    menu: HTMLElement | null = null
    pane: 'root' | 'quality' | 'audio' | 'captions' = 'root'

    constructor(playerRef: any, options: any) {
      super(playerRef, options)
      this.addClass('vjs-mobile-settings-button')
      this.controlText('Settings')

      setTimeout(() => {
        const el = this.el()
        if (el) {
          el.innerHTML = '<span class="vjs-icon-placeholder">&#9881;</span><span class="vjs-control-text">Settings</span>'
        }
      }, 0)
    }

    bindPress(el: Element, handler: (e: Event) => void) {
      const node = el as HTMLElement
      node.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        handler(e)
      }
    }

    addHeading(title: string) {
      if (!this.menu) return
      const heading = videojs.dom.createEl('div', {
        className: 'vjs-mobile-settings-heading',
        innerHTML: title
      })
      this.menu.appendChild(heading)
    }

    addItem(label: string, selected: boolean, handler: () => void, closeAfterSelect = true) {
      if (!this.menu) return
      const item = videojs.dom.createEl('button', {
        className: `vjs-mobile-settings-item${selected ? ' vjs-selected' : ''}`,
        innerHTML: label,
        type: 'button'
      }) as HTMLButtonElement

      this.bindPress(item, () => {
        handler()
        this.buildMenu()
        if (closeAfterSelect) {
          this.menu?.classList.remove('vjs-open')
        }
      })

      this.menu.appendChild(item)
    }

    addBackItem() {
      if (!this.menu) return
      const item = videojs.dom.createEl('button', {
        className: 'vjs-mobile-settings-item vjs-mobile-settings-back',
        innerHTML: 'Back',
        type: 'button'
      }) as HTMLButtonElement

      this.bindPress(item, () => {
        this.pane = 'root'
        this.buildMenu()
      })

      this.menu.appendChild(item)
    }

    hasQualityItems() {
      const levels = this.player_?.qualityLevels?.()
      return Boolean(levels && countUniqueQualityLevels(levels) > 1)
    }

    hasAudioItems() {
      const tracks = this.player_?.audioTracks?.()
      return Boolean(tracks && countSelectableAudioTracks(tracks) > 1)
    }

    getCaptionTracks() {
      const tracks = this.player_?.textTracks?.()
      const captionTracks: Array<{ track: any, index: number }> = []
      if (!tracks || typeof tracks.length !== 'number') return captionTracks

      for (let i = 0; i < tracks.length; i++) {
        if (isCaptionTrack(tracks[i])) {
          captionTracks.push({ track: tracks[i], index: i })
        }
      }
      return captionTracks
    }

    buildRootItems() {
      let count = 0

      if (this.hasQualityItems()) {
        this.buildQualityItems(false)
        count++
      }

      if (this.hasAudioItems()) {
        this.buildAudioItems(false)
        count++
      }

      if (this.getCaptionTracks().length > 0) {
        this.buildCaptionItems(false)
        count++
      }

      if (count === 0) {
        const empty = videojs.dom.createEl('div', {
          className: 'vjs-mobile-settings-empty',
          innerHTML: 'No settings'
        })
        this.menu?.appendChild(empty)
      }
    }

    buildQualityItems(showBack = true) {
      const levels = this.player_?.qualityLevels?.()
      if (!levels || countUniqueQualityLevels(levels) <= 1) return false

      if (showBack) {
        this.addBackItem()
      }
      this.addHeading('Quality')
      let enabledIndexes: number[] = []
      for (let i = 0; i < levels.length; i++) {
        if (levels[i]?.enabled) enabledIndexes.push(i)
      }
      const isAuto = enabledIndexes.length !== 1

      this.addItem('Auto', isAuto, () => {
        if (qualityButton) {
          qualityButton.manualSelectionIndex = null
        }
        for (let i = 0; i < levels.length; i++) {
          levels[i].enabled = true
        }
        qualityButton?.refreshQuality?.()
        qualityButton?.updateMenuSelection?.()
      })

      const seenLabels = new Set<string>()
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i]
        const label = level?.label?.match?.(/(\d+p)/)?.[1] || (level?.height ? `${level.height}p` : `Quality ${i + 1}`)
        if (seenLabels.has(label)) continue
        seenLabels.add(label)
        const selected = enabledIndexes.length === 1 && enabledIndexes[0] === i
        this.addItem(label, selected, () => {
          if (qualityButton) {
            qualityButton.manualSelectionIndex = i
          }
          for (let j = 0; j < levels.length; j++) {
            levels[j].enabled = j === i
          }
          qualityButton?.refreshQuality?.()
          qualityButton?.updateMenuSelection?.()
        })
      }
      return true
    }

    buildAudioItems(showBack = true) {
      const tracks = this.player_?.audioTracks?.()
      if (!tracks || countSelectableAudioTracks(tracks) <= 1) return false

      if (showBack) {
        this.addBackItem()
      }
      this.addHeading('Audio')
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        if (track?.kind === 'metadata') continue
        this.addItem(getAudioTrackLabel(track, i), Boolean(track?.enabled), () => {
          for (let j = 0; j < tracks.length; j++) {
            tracks[j].enabled = j === i
          }
          audioButton?.updateMenuSelection?.()
        })
      }
      return true
    }

    buildCaptionItems(showBack = true) {
      const captionTracks = this.getCaptionTracks()
      if (captionTracks.length === 0) return false

      if (showBack) {
        this.addBackItem()
      }
      this.addHeading('Captions')
      const captionsOff = !captionTracks.some(({ track }) => track?.mode === 'showing')
      this.addItem('Off', captionsOff, () => {
        captionTracks.forEach(({ track }) => {
          track.mode = 'disabled'
        })
      })

      captionTracks.forEach(({ track, index }) => {
        this.addItem(getTextTrackLabel(track, index), track?.mode === 'showing', () => {
          captionTracks.forEach(({ track: candidate }) => {
            candidate.mode = candidate === track ? 'showing' : 'disabled'
          })
        })
      })
      return true
    }

    buildMenu() {
      if (this.menu) {
        this.menu.innerHTML = ''
      } else {
        this.menu = videojs.dom.createEl('div', {
          className: 'vjs-mobile-settings-menu'
        }) as HTMLElement
      }
      const playerEl = this.player_?.el?.()
      if (playerEl && this.menu.parentElement !== playerEl) {
        playerEl.appendChild(this.menu)
      }

      if (this.pane === 'quality') {
        this.buildQualityItems()
      } else if (this.pane === 'audio') {
        this.buildAudioItems()
      } else if (this.pane === 'captions') {
        this.buildCaptionItems()
      } else {
        this.buildRootItems()
      }
    }

    handleClick() {
      this.pane = 'root'
      if (!this.menu || this.menu.children.length === 0) {
        this.buildMenu()
      }
      this.menu?.classList.toggle('vjs-open')
    }

    handleTap(event: Event) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }
      this.handleClick()
    }
  }

  videojs.registerComponent('MobileSettingsButton', MobileSettingsButton)
  return 'MobileSettingsButton'
}

// Progress bar interaction handlers
const handleProgressBarInteraction = (event: MouseEvent | TouchEvent) => {
  if (!player || duration.value === 0) return
  if (props.controlsLocked) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  isSeekingProgress.value = true

  const seekTime = getSeekTimeFromEvent(event)
  if (seekTime !== null) {
    currentTime.value = seekTime
    player.currentTime(seekTime)
  }

  // Add listeners for mouse/touch move and end
  const handleMove = (e: MouseEvent | TouchEvent) => {
    const newSeekTime = getSeekTimeFromEvent(e)
    if (newSeekTime !== null) {
      currentTime.value = newSeekTime
      player.currentTime(newSeekTime)
    }
  }

  const handleEnd = () => {
    isSeekingProgress.value = false
    document.removeEventListener('mousemove', handleMove as EventListener)
    document.removeEventListener('touchmove', handleMove as EventListener)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchend', handleEnd)
  }

  document.addEventListener('mousemove', handleMove as EventListener)
  document.addEventListener('touchmove', handleMove as EventListener)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchend', handleEnd)
}

const handleProgressBarHover = (event: MouseEvent | TouchEvent) => {
  if (duration.value === 0) return

  const seekTime = getSeekTimeFromEvent(event)
  if (seekTime !== null) {
    seekPreviewTime.value = seekTime
  }
}

const getSeekTimeFromEvent = (event: MouseEvent | TouchEvent): number | null => {
  const progressBar = event.currentTarget as HTMLElement | null
  if (!progressBar) return null

  const rect = progressBar.getBoundingClientRect()
  const clientX = event instanceof TouchEvent ? event.touches[0]?.clientX : (event as MouseEvent).clientX

  if (clientX === undefined) return null

  const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  return percentage * duration.value
}

const attachProgressBarOverlay = () => {
  if (!player || !progressBarOverlay.value) return

  const playerEl = player.el?.() as HTMLElement | undefined
  if (!playerEl) return

  if (progressBarOverlay.value.parentElement !== playerEl) {
    playerEl.appendChild(progressBarOverlay.value)
  }
}

const attachSeriesActionsOverlay = () => {
  if (!player || !seriesActionsOverlay.value) return
  const playerEl = player.el?.() as HTMLElement | undefined
  if (!playerEl || seriesActionsOverlay.value.parentElement === playerEl) return
  playerEl.appendChild(seriesActionsOverlay.value)
}

const setPlaybackTime = (seconds: number) => {
  if (!player || !Number.isFinite(seconds)) return
  const nextTime = Math.max(0, seconds)
  lockedExpectedTime = nextTime
  void runProgrammaticPlayback(() => {
    player.currentTime(nextTime)
  })
}

const playFrom = async (seconds?: number) => {
  if (!player) return
  await runProgrammaticPlayback(async () => {
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      lockedExpectedTime = Math.max(0, seconds)
      player.currentTime(lockedExpectedTime)
    } else {
      lockedExpectedTime = Number(player.currentTime?.() || currentTime.value || 0)
    }
    lockedExpectedPaused = false
    try {
      await player.play?.()
    } catch (err) {
      // Remote play can be blocked until the user interacts with the page.
    }
  })
}

const pauseAt = (seconds?: number) => {
  if (!player) return
  void runProgrammaticPlayback(() => {
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      lockedExpectedTime = Math.max(0, seconds)
      player.currentTime(lockedExpectedTime)
    } else {
      lockedExpectedTime = Number(player.currentTime?.() || currentTime.value || 0)
    }
    lockedExpectedPaused = true
    player.pause?.()
  })
}

const getPlaybackState = () => ({
  currentTime: Number(player?.currentTime?.() || currentTime.value || 0),
  duration: Number(player?.duration?.() || duration.value || 0),
  paused: Boolean(player?.paused?.() ?? true),
})

defineExpose({
  setPlaybackTime,
  playFrom,
  pauseAt,
  getPlaybackState,
})

const attachMobilePiPOverlay = () => {
  if (!player || !mobilePiPOverlay.value) return
  const playerEl = player.el?.() as HTMLElement | undefined
  if (!playerEl || mobilePiPOverlay.value.parentElement === playerEl) return
  playerEl.appendChild(mobilePiPOverlay.value)
}

const updatePictureInPictureSupport = () => {
  const video = videoElement.value as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<any> }) | null
  const doc = typeof document !== 'undefined'
    ? document as Document & { pictureInPictureEnabled?: boolean }
    : null
  isPictureInPictureSupported.value = Boolean(
    player?.requestPictureInPicture ||
    (doc?.pictureInPictureEnabled && video?.requestPictureInPicture)
  )
}

const togglePictureInPicture = async () => {
  const video = videoElement.value as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<any> }) | null
  if (!video) return
  const doc = document as Document & {
    pictureInPictureEnabled?: boolean
    pictureInPictureElement?: Element | null
    exitPictureInPicture?: () => Promise<void>
  }

  try {
    if (doc.pictureInPictureElement) {
      await doc.exitPictureInPicture?.()
      return
    }
    if (player?.requestPictureInPicture) {
      await player.requestPictureInPicture()
      return
    }
    if (doc.pictureInPictureEnabled && video.requestPictureInPicture) {
      await video.requestPictureInPicture()
    }
  } catch (err) {
    console.warn('Picture-in-picture failed:', err)
  }
}

const applyInitialStartTime = () => {
  if (!player || hasAppliedInitialStartTime) return
  const startTime = Number(props.startTimeSeconds || 0)
  const playerDuration = Number(player.duration?.() || duration.value || 0)
  if (!Number.isFinite(startTime) || startTime <= 5) {
    return
  }
  if (!Number.isFinite(playerDuration) || playerDuration <= 0) return
  if (playerDuration > 0 && startTime / playerDuration >= 0.9) {
    hasAppliedInitialStartTime = true
    return
  }
  player.currentTime(Math.max(0, startTime - 2))
  currentTime.value = Math.max(0, startTime - 2)
  hasAppliedInitialStartTime = true
}

const emitWatchProgress = (force = false) => {
  if (!player) return
  const now = Date.now()
  if (!force && now - lastProgressEmitAt < 5000) return
  const playerDuration = Number(player.duration?.() || duration.value || 0)
  const playerCurrentTime = Number(player.currentTime?.() || currentTime.value || 0)
  if (!Number.isFinite(playerDuration) || playerDuration <= 0 || !Number.isFinite(playerCurrentTime)) return
  lastProgressEmitAt = now
  emit('progress', {
    currentTime: Math.max(0, playerCurrentTime),
    duration: Math.max(0, playerDuration)
  })
}

const syncControlsLockedClass = () => {
  const playerEl = player?.el?.() as HTMLElement | undefined
  if (!playerEl) return
  playerEl.classList.toggle('giltube-controls-locked', props.controlsLocked)
}

const captureLockedExpectedState = () => {
  if (!player) return
  lockedExpectedTime = Number(player.currentTime?.() || currentTime.value || 0)
  lockedExpectedPaused = Boolean(player.paused?.() ?? true)
}

const runProgrammaticPlayback = async (operation: () => void | Promise<void>) => {
  applyingProgrammaticPlayback = true
  try {
    await operation()
  } finally {
    window.setTimeout(() => {
      applyingProgrammaticPlayback = false
    }, 0)
  }
}

const restoreLockedPlayback = async () => {
  if (!props.controlsLocked || !player || applyingProgrammaticPlayback) return

  restoringLockedPlayback = true
  try {
    await runProgrammaticPlayback(async () => {
      const playerTime = Number(player.currentTime?.() || 0)
      if (Number.isFinite(lockedExpectedTime) && Math.abs(playerTime - lockedExpectedTime) > 0.35) {
        player.currentTime(Math.max(0, lockedExpectedTime))
      }

      if (lockedExpectedPaused) {
        player.pause?.()
        return
      }

      try {
        await player.play?.()
      } catch (err) {
        // Browsers can block programmatic play until user interaction.
      }
    })
  } finally {
    window.setTimeout(() => {
      restoringLockedPlayback = false
    }, 0)
  }
}

// Create quality button component
const createQualityButton = (player: any) => {
  const Button = videojs.getComponent('Button')

  class QualityButton extends Button {
    menu: any = null
    qualityLevels: any = null
    lastPressAt = 0
    manualSelectionIndex: number | null = null

    constructor(playerRef: any, options: any) {
      super(playerRef, options)
      this.addClass('vjs-quality-button')
      this.qualityLevels = playerRef.qualityLevels()

      // Set button content after it's created
      setTimeout(() => {
        const el = this.el()
        if (el) {
          el.innerHTML = '<span class="vjs-icon-placeholder">⚙</span><span class="vjs-control-text">Quality</span>'
        }
      }, 0)

      // Listen for quality levels being added
      if (this.qualityLevels) {
        this.qualityLevels.on('addqualitylevel', () => {
          this.buildMenu()
        })
        this.qualityLevels.on('change', () => {
          this.updateMenuSelection()
        })
      }
    }

    bindPress(el: Element, handler: (e: Event) => void) {
      const node = el as HTMLElement
      node.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        handler(e)
      }
    }



    refreshQuality() {
      const player = this.player_
      if (!player) return

      const isPlaying = !player.paused()
      const currentTime = player.currentTime()

      // Pause, seek to current time, then resume
      player.pause()
      player.currentTime(currentTime)

      if (isPlaying) {
        // Resume after a brief delay to allow HLS to reload segments
        setTimeout(() => {
          player.play()
        }, 100)
      }
    }

    buildMenu() {
      if (!this.qualityLevels || this.qualityLevels.length === 0) return

      // Clear existing menu
      if (this.menu) {
        this.menu.innerHTML = ''
      } else {
        this.menu = videojs.dom.createEl('div', {
          className: 'vjs-quality-menu'
        })
        this.el().appendChild(this.menu)
      }

      // ===== AUTO OPTION =====
      const autoItem = videojs.dom.createEl('button', {
        className: 'vjs-quality-menu-item',
        innerHTML: 'Auto',
        type: 'button'
      }) as HTMLButtonElement

      this.bindPress(autoItem, () => {
        this.manualSelectionIndex = null
        for (let j = 0; j < this.qualityLevels.length; j++) {
          this.qualityLevels[j].enabled = true
        }
        this.updateMenuSelection()
        this.refreshQuality()
        this.toggleMenu()
      })

      this.menu.appendChild(autoItem)

      // ===== SEPARATOR =====
      const separator = videojs.dom.createEl('div', {
        className: 'vjs-quality-menu-separator'
      })
      this.menu.appendChild(separator)

      // ===== QUALITY LEVELS =====
      for (let i = 0; i < this.qualityLevels.length; i++) {
        const level = this.qualityLevels[i]

        let label = ''
        if (level.label) {
          const match = level.label.match(/(\d+p)/)
          label = match ? match[1] : level.label
        } else if (level.height) {
          label = `${level.height}p`
        } else {
          label = `Quality ${i}`
        }

        const item = videojs.dom.createEl('button', {
          className: 'vjs-quality-menu-item',
          innerHTML: label,
          type: 'button'
        }) as HTMLButtonElement

        // 🔥 attach real index
        item.dataset.levelIndex = i.toString()

        this.bindPress(item, () => {
          const selectedIndex = parseInt(item.dataset.levelIndex!)
          this.manualSelectionIndex = selectedIndex

          for (let j = 0; j < this.qualityLevels.length; j++) {
            this.qualityLevels[j].enabled = j === selectedIndex
          }

          this.updateMenuSelection()
          this.refreshQuality()
          this.toggleMenu()
        })

        this.menu.appendChild(item)
      }

      this.updateMenuSelection()
    }


    updateMenuSelection() {
      if (!this.menu) return

      const items = this.menu.querySelectorAll('.vjs-quality-menu-item')

      // Check if AUTO (all enabled)
      let enabledIndexes: number[] = []

      for (let i = 0; i < this.qualityLevels.length; i++) {
        if (this.qualityLevels[i].enabled) {
          enabledIndexes.push(i)
        }
      }

      const manualIndex = this.manualSelectionIndex
      const hasSingleExplicitSelection =
        manualIndex !== null &&
        enabledIndexes.length === 1 &&
        enabledIndexes[0] === manualIndex
      const isAuto = !hasSingleExplicitSelection

      if (!isAuto && manualIndex !== null && enabledIndexes[0] !== manualIndex) {
        this.manualSelectionIndex = null
      }

      items.forEach((item: any) => {
        const levelIndex = item.dataset.levelIndex

        // AUTO button
        if (levelIndex === undefined) {
          item.classList.toggle('vjs-selected', isAuto)
          return
        }

        const i = parseInt(levelIndex)

        // ✅ Only highlight if:
        // - not auto
        // - AND it's the only enabled one
        item.classList.toggle(
          'vjs-selected',
          !isAuto && manualIndex !== null && i === manualIndex
        )
      })
    }




    handleClick() {
      if (!this.qualityLevels || this.qualityLevels.length === 0) {
        console.log('No quality levels available yet')
        return
      }

      // Build menu on first click
      if (!this.menu || this.menu.children.length === 0) {
        this.buildMenu()
      }

      this.toggleMenu()
    }

    handleTap(event: Event) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      this.handleClick()
    }

    toggleMenu() {
      if (this.menu) {
        this.menu.classList.toggle('vjs-open')
      }
    }
  }

  videojs.registerComponent('QualityButton', QualityButton)
  return 'QualityButton'
}

onMounted(async () => {
  await nextTick()
  startMobileControlsWatcher()

  if (videoElement.value) {
    // Register quality button before creating player
    createQualityButton(null)
    createAudioButton()
    createMobileSettingsButton()
    createNextEpisodeButton()

    player = videojs(videoElement.value, {
      controls: true,
      autoplay: true,
      preload: 'auto',
      inactivityTimeout: DEFAULT_INACTIVITY_TIMEOUT,
      responsive: false,
      fluid: false,
      fill: false,
      html5: {
        hls: {
          overrideNative: true,
          enableLowInitialPlaylist: false
        }
      },
      controlBar: {
        remainingTimeDisplay: false,
        progressControl: false,
        playToggle: true,
        volumePanel: {
          inline: false,
          vertical: true
        },
        pictureInPictureToggle: true,
        fullscreenToggle: true,
        playbackRateMenuButton: false,
        chaptersButton: false,
        descriptionsButton: false,
        subsCapsButton: true,
        audioTrackButton: false,
        liveDisplay: false,
        seekToLive: false,
        skipButtons: false,
        skipBackButton: false,
        skipForwardButton: false
      }
    })

    player.ready(function () {
      // Add quality button to control bar
      qualityButton = player.controlBar.addChild('QualityButton', {})
      qualityButton.hide()
      audioButton = player.controlBar.addChild('AudioButton', {})
      audioButton.hide()
      mobileSettingsButton = player.controlBar.addChild('MobileSettingsButton', {})
      mobileSettingsButton.hide()
      nextEpisodeButton = player.controlBar.addChild('NextEpisodeButton', {})
      if (props.hasNextEpisode) {
        nextEpisodeButton.show()
      } else {
        nextEpisodeButton.hide()
      }

      reorderControlBar()
      setTimeout(reorderControlBar, 0)
      attachProgressBarOverlay()
      attachSeriesActionsOverlay()
      updatePictureInPictureSupport()
      nextTick(attachMobilePiPOverlay)
      updateResponsiveControls()
      syncControlsLockedClass()
      if (props.controlsLocked) {
        captureLockedExpectedState()
      }

      // Emit 'play' event when video starts playing
      player.on('play', () => {
        if (props.controlsLocked && !applyingProgrammaticPlayback) {
          void restoreLockedPlayback()
          return
        }
        emit('play')
      })

      player.on('pause', () => {
        if (props.controlsLocked && !applyingProgrammaticPlayback) {
          void restoreLockedPlayback()
          return
        }
        emit('pause')
      })

      player.on('seeking', () => {
        if (props.controlsLocked && !applyingProgrammaticPlayback) {
          void restoreLockedPlayback()
        }
      })

      player.on('seeked', () => {
        if (props.controlsLocked && !applyingProgrammaticPlayback) {
          void restoreLockedPlayback()
          return
        }
        emit('seeked', { currentTime: Number(player.currentTime?.() || 0) })
      })

      // Update progress bar state from player
      player.on('timeupdate', () => {
        if (!isSeekingProgress.value) {
          currentTime.value = player.currentTime() || 0
        }
        if (props.controlsLocked && !lockedExpectedPaused && !applyingProgrammaticPlayback && !restoringLockedPlayback) {
          lockedExpectedTime = Number(player.currentTime?.() || currentTime.value || 0)
        }
        emitWatchProgress()
      })

      player.on('durationchange', () => {
        duration.value = player.duration() || 0
        applyInitialStartTime()
      })

      player.on('progress', () => {
        const buffered = player.buffered()
        if (buffered && buffered.length > 0) {
          bufferedEnd.value = buffered.end(buffered.length - 1)
        }
      })

      const qualityLevels = player.qualityLevels?.()
      if (qualityLevels) {
        qualityLevels.on('addqualitylevel', updateQualityButtonVisibility)
        qualityLevels.on('change', updateQualityButtonVisibility)
        qualityLevels.on('addqualitylevel', updateMobileSettingsButtonVisibility)
        qualityLevels.on('change', updateMobileSettingsButtonVisibility)
      }

      const audioTracks = player.audioTracks?.()
      if (audioTracks) {
        audioTracks.on?.('addtrack', updateAudioButtonVisibility)
        audioTracks.on?.('removetrack', updateAudioButtonVisibility)
        audioTracks.on?.('change', updateAudioButtonVisibility)
        audioTracks.on?.('addtrack', updateMobileSettingsButtonVisibility)
        audioTracks.on?.('removetrack', updateMobileSettingsButtonVisibility)
        audioTracks.on?.('change', updateMobileSettingsButtonVisibility)
      }

      const textTracks = player.textTracks?.()
      if (textTracks) {
        textTracks.on?.('addtrack', updateResponsiveControls)
        textTracks.on?.('removetrack', updateResponsiveControls)
        textTracks.on?.('change', updateResponsiveControls)
      }

      player.on('loadedmetadata', updateQualityButtonVisibility)
      player.on('loadedmetadata', () => {
        resetAudioButtonMenu()
        audioButton?.buildMenu?.()
        updateAudioButtonVisibility()
        updateMobileSettingsButtonVisibility()
        updatePictureInPictureSupport()
        nextTick(attachMobilePiPOverlay)
        applyInitialStartTime()
      })
      player.on('fullscreenchange', updateQualityButtonVisibility)
      player.on('fullscreenchange', updateAudioButtonVisibility)
      player.on('fullscreenchange', updateMobileSettingsButtonVisibility)
      player.on('loadedmetadata', syncUltrawideFullscreenClass)
      player.on('fullscreenchange', syncUltrawideFullscreenClass)
      player.on('fullscreenchange', attachProgressBarOverlay)
      player.on('fullscreenchange', attachSeriesActionsOverlay)
      player.on('fullscreenchange', attachMobilePiPOverlay)
      player.on('play', syncUltrawideFullscreenClass)
      player.on('pause', syncUltrawideFullscreenClass)
      player.on('ended', syncUltrawideFullscreenClass)
      player.on('ended', () => {
        emitWatchProgress(true)
        emit('ended')
      })
      player.on('userinactive', handleUserInactive)

      player.on('fullscreenchange', dumpPlayerDebugState)
      player.on('loadedmetadata', dumpPlayerDebugState)

      window.giltubePlayerDebug = {
        getPlayer: () => player,
        dump: dumpPlayerDebugState
      }

      if (props.src && props.status === 'ready') {
        player.src({
          src: props.src,
          type: inferSourceType(props.src)
        })
      }
    })

  }
})

onBeforeUnmount(() => {
  stopMobileControlsWatcher()
  stopUltrawideControlsGuard()
  if (window.giltubePlayerDebug?.getPlayer?.() === player) {
    delete window.giltubePlayerDebug
  }
  if (player) {
    emitWatchProgress(true)
    const playerEl = player.el?.() as HTMLElement | undefined
    if (playerEl) {
      playerEl.classList.remove('giltube-ultrawide-fullscreen')
      playerEl.classList.remove('giltube-controls-locked')
    }
    if (progressBarOverlay.value?.parentElement) {
      progressBarOverlay.value.parentElement.removeChild(progressBarOverlay.value)
    }
    if (seriesActionsOverlay.value?.parentElement) {
      seriesActionsOverlay.value.parentElement.removeChild(seriesActionsOverlay.value)
    }
    if (mobilePiPOverlay.value?.parentElement) {
      mobilePiPOverlay.value.parentElement.removeChild(mobilePiPOverlay.value)
    }
    player.dispose()
    player = null
    qualityButton = null
    audioButton = null
    mobileSettingsButton = null
    nextEpisodeButton = null
  }
})

watch(
  () => props.src,
  (newSrc) => {
    if (player && newSrc && props.status === 'ready') {
      hasAppliedInitialStartTime = false
      lastProgressEmitAt = 0
      audioButton?.hide?.()
      mobileSettingsButton?.hide?.()
      resetAudioButtonMenu()
      if (mobileSettingsButton?.menu) {
        mobileSettingsButton.menu.innerHTML = ''
        mobileSettingsButton.menu.classList.remove('vjs-open')
      }
      player.src({
        src: newSrc,
        type: inferSourceType(newSrc)
      })
    }
  }
)

watch(
  () => props.status,
  (newStatus) => {
    if (newStatus === 'processing' && player) {
      player.pause()
    }
  }
)

watch(
  () => props.startTimeSeconds,
  () => {
    hasAppliedInitialStartTime = false
    applyInitialStartTime()
  }
)

watch(
  () => props.controlsLocked,
  (locked) => {
    syncControlsLockedClass()
    if (locked) {
      captureLockedExpectedState()
    }
  }
)

watch(
  () => props.hasNextEpisode,
  (hasNext) => {
    if (!nextEpisodeButton) return
    if (hasNext) {
      nextEpisodeButton.show()
    } else {
      nextEpisodeButton.hide()
    }
  }
)
</script>

<style scoped>
.video-player-container {
  height: 250px;
  isolation: isolate;
  z-index: 0;
}

@media (min-width: 768px) {
  .video-player-container {
    height: 500px;
  }
}

.progress-bar-overlay {
  pointer-events: auto;
  z-index: 50 !important;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

.progress-bar-overlay:hover {
  height: 7px !important;
}

.progress-bar-overlay-locked {
  cursor: not-allowed !important;
  opacity: 0.7;
}

:deep(.video-js.giltube-controls-locked .vjs-tech),
:deep(.video-js.giltube-controls-locked .vjs-play-control),
:deep(.video-js.giltube-controls-locked .vjs-progress-control),
:deep(.video-js.giltube-controls-locked .vjs-big-play-button) {
  pointer-events: none !important;
  cursor: not-allowed !important;
}

:deep(.video-js.giltube-controls-locked .vjs-play-control),
:deep(.video-js.giltube-controls-locked .vjs-progress-control),
:deep(.video-js.giltube-controls-locked .vjs-big-play-button) {
  opacity: 0.45 !important;
}

.series-player-actions {
  position: absolute;
  right: 1rem;
  bottom: 4.75rem;
  z-index: 90;
  max-width: calc(100% - 2rem);
  pointer-events: none;
}

:deep(.video-js .series-player-actions) {
  position: absolute;
  right: 1rem;
  bottom: 4.75rem;
  z-index: 90;
  max-width: calc(100% - 2rem);
  pointer-events: none;
}

:deep(.video-js .series-player-actions button),
.series-player-actions button {
  min-height: 44px;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.96) !important;
  color: #000 !important;
  font-size: 0.875rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2);
  pointer-events: auto;
}

:deep(.video-js .series-player-actions button:hover),
.series-player-actions button:hover {
  background: #fff !important;
}

:deep(.video-js.vjs-fullscreen .series-player-actions) {
  bottom: 5.5rem;
  right: 1.5rem;
  z-index: 90;
}

:deep(.video-js.vjs-fullscreen .series-player-actions button) {
  min-height: 52px;
  padding: 0.9rem 1.15rem;
  font-size: 1rem;
}

:deep(.video-js.vjs-user-inactive .progress-bar-overlay),
:deep(.video-js.vjs-fullscreen.vjs-user-inactive .progress-bar-overlay) {
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
}

:deep(.video-js.vjs-user-active .progress-bar-overlay),
:deep(.video-js.vjs-fullscreen.vjs-user-active .progress-bar-overlay),
:deep(.video-js.vjs-fullscreen.giltube-ultrawide-fullscreen .progress-bar-overlay) {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.progress-bar-overlay:hover .seek-indicator {
  opacity: 1 !important;
}

.mobile-pip-overlay {
  display: none;
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  z-index: 70;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.68);
  color: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  pointer-events: auto;
  transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease, background-color 160ms ease;
}

.mobile-pip-overlay:hover {
  background: rgba(0, 0, 0, 0.82);
}

.mobile-pip-overlay svg {
  height: 22px;
  width: 22px;
}

:deep(.video-js.vjs-user-inactive .mobile-pip-overlay),
:deep(.video-js.vjs-fullscreen.vjs-user-inactive .mobile-pip-overlay) {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  pointer-events: none;
}

:deep(.video-js.vjs-user-active .mobile-pip-overlay),
:deep(.video-js.vjs-fullscreen.vjs-user-active .mobile-pip-overlay),
:deep(.video-js.vjs-fullscreen.giltube-ultrawide-fullscreen .mobile-pip-overlay) {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

:deep(.video-js) {
  width: 100%;
  height: 100%;
  background-color: #000;
  isolation: isolate;
  z-index: 0;
}

:deep(.vjs-tech) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

:deep(.vjs-player) {
  height: 100%;
}

:deep(.vjs-menu) {
  background-color: #1a1a1a;
  border: 1px solid #333;
}

:deep(.vjs-menu-item) {
  color: white;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
}

:deep(.vjs-menu-item:last-child) {
  border-bottom: none;
}

:deep(.vjs-menu-item:hover) {
  background-color: #ef4444;
}

:deep(.vjs-menu-item.vjs-selected) {
  background-color: #ef4444;
  font-weight: bold;
}

:deep(.vjs-text-track-settings) {
  background-color: #111827;
  color: #f3f4f6;
  border-color: #374151;
}

:deep(.vjs-text-track-settings legend),
:deep(.vjs-text-track-settings label),
:deep(.vjs-text-track-settings span),
:deep(.vjs-text-track-settings .vjs-label) {
  color: #f3f4f6;
}

:deep(.vjs-text-track-settings select) {
  background-color: #1f2937;
  color: #f9fafb;
  border: 1px solid #4b5563;
}

:deep(.vjs-text-track-settings option) {
  background-color: #111827;
  color: #f9fafb;
}

:deep(.vjs-text-track-settings .vjs-track-settings-controls button) {
  background-color: #374151;
  color: #f9fafb;
  border-color: #4b5563;
}

:deep(.vjs-text-track-settings .vjs-track-settings-controls button:hover) {
  background-color: #4b5563;
}

:deep(.vjs-skip-backward),
:deep(.vjs-skip-forward),
:deep([class*="skip-backward"]),
:deep([class*="skip-forward"]) {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  visibility: hidden !important;
  position: absolute !important;
  left: -9999px !important;
}

:deep(.vjs-control-bar) {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  position: absolute;
  z-index: 30 !important;
  display: flex !important;
  align-items: center !important;
  padding: 8px 12px !important;
  gap: 4px !important;
  width: 100% !important;
  box-sizing: border-box;
}

:deep(.vjs-control-bar .vjs-control) {
  position: relative;
  z-index: 31;
  color: #fff !important;
  opacity: 1 !important;
  visibility: visible !important;
  flex-shrink: 0;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 28px !important;
  margin: 0 !important;
  padding: 0 6px !important;
  line-height: 1 !important;
}

:deep(.vjs-control-bar .vjs-control.vjs-hidden),
:deep(.vjs-control-bar .vjs-button.vjs-hidden),
:deep(.vjs-control-bar .vjs-hidden) {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  visibility: hidden !important;
}

:deep(.giltube-control-group) {
  display: flex !important;
  align-items: center !important;
  gap: 4px;
  min-width: 0;
}

:deep(.giltube-control-group-left) {
  flex: 0 0 auto;
}

:deep(.giltube-control-group-spacer) {
  flex: 1 1 auto;
}

:deep(.giltube-control-group-right) {
  flex: 0 0 auto;
  margin-left: auto;
}

:deep(.vjs-current-time),
:deep(.vjs-time-divider),
:deep(.vjs-duration) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 !important;
  font-family: monospace;
  font-size: 12px;
  font-weight: normal;
  line-height: 1 !important;
}

:deep(.vjs-current-time-display),
:deep(.vjs-duration-display),
:deep(.vjs-remaining-time-display) {
  display: inline-flex !important;
  align-items: center !important;
}

:deep(.vjs-current-time)::after {
  content: ' / ';
  white-space: nowrap;
  display: inline;
  margin: 0 2px;
  line-height: inherit;
}

:deep(.vjs-time-divider) {
  display: none !important;
}

:deep(.vjs-remaining-time) {
  display: none !important;
}

:deep(.video-js.vjs-fullscreen .vjs-control-bar) {
  background: rgba(0, 0, 0, 0.92) !important;
}

:deep(.video-js.vjs-fullscreen .vjs-button::before),
:deep(.video-js.vjs-fullscreen .vjs-icon-placeholder::before),
:deep(.video-js.vjs-fullscreen .vjs-icon-placeholder) {
  color: #fff !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.9);
}

:deep(.vjs-button) {
  color: white;
}

:deep(.vjs-button:hover) {
  text-shadow: 0 0 1em #fff;
}

:deep(.vjs-progress-control) {
  display: none !important;
}

:deep(.vjs-play-progress) {
  background-color: #ef4444;
}

:deep(.vjs-quality-levels-button) {
  margin-left: 10px;
  order: 20;
}

:deep(.vjs-quality-levels-button .vjs-icon-placeholder) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.vjs-quality-levels-button::before) {
  content: '⚙';
  font-size: 16px;
}

:deep(.vjs-quality-button) {
  font-size: 12px;
  color: white;
  cursor: pointer;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  background-color: transparent !important;
  border: none;
  width: auto;
  gap: 3px;
  touch-action: manipulation;
  line-height: 1;
}

:deep(.vjs-audio-button) {
  font-size: 11px;
  color: white;
  cursor: pointer;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  background-color: transparent !important;
  border: none;
  width: auto;
  min-width: 36px;
  touch-action: manipulation;
  line-height: 1;
}

:deep(.vjs-mobile-settings-button) {
  display: none !important;
  position: relative;
  color: white;
  cursor: pointer;
  padding: 0 8px;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 32px;
  background-color: transparent !important;
  border: none;
  touch-action: manipulation;
  line-height: 1;
}

:deep(.vjs-mobile-settings-button::before) {
  content: none !important;
  display: none !important;
}

:deep(.vjs-mobile-settings-button .vjs-icon-placeholder) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

:deep(.vjs-next-episode-button) {
  width: 40px !important;
  min-width: 40px;
  padding: 0 !important;
}

:deep(.vjs-audio-button::before),
:deep(.vjs-next-episode-button::before) {
  content: none !important;
  display: none !important;
}

:deep(.vjs-next-episode-button .vjs-icon-placeholder) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

:deep(.vjs-next-episode-button .vjs-icon-placeholder svg) {
  height: 22px;
  width: 22px;
}

:deep(.vjs-next-episode-button .vjs-control-text) {
  display: none;
}

:deep(.vjs-quality-button .vjs-icon-placeholder) {
  display: inline-block;
  font-size: 18px;
  font-weight: 500;
}

:deep(.vjs-quality-button .vjs-control-text) {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
}

:deep(.vjs-quality-button:hover) {
  color: #ef4444;
}

:deep(.vjs-quality-button:hover .vjs-control-text) {
  color: #ef4444;
}

:deep(.vjs-audio-button:hover) {
  color: #ef4444;
}

:deep(.vjs-audio-button .vjs-icon-placeholder) {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

:deep(.vjs-audio-button .vjs-control-text) {
  display: none;
}

:deep(.vjs-quality-menu),
:deep(.vjs-audio-menu) {
  position: absolute;
  bottom: 35px;
  right: 0;

  background-color: #1a1a1a;
  border: 1px solid #333;

  min-width: 85px;
  z-index: 100;

  display: none;

  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);

  overflow-y: auto;

  /* 🔥 KEY FIX */
  max-height: 40vh;
  /* or 200px–300px depending your taste */

  /* smoother mobile scroll */
  -webkit-overflow-scrolling: touch;
}


:deep(.vjs-quality-menu.vjs-open),
:deep(.vjs-audio-menu.vjs-open) {
  display: block !important;
}

:deep(.vjs-quality-menu-item),
:deep(.vjs-audio-menu-item) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  color: white;
  min-height: 32px;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  border-left: none;
  border-right: none;
  border-top: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  line-height: 1.2;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  appearance: none;
  -webkit-appearance: none;
}

:deep(.vjs-quality-menu-item:last-child),
:deep(.vjs-audio-menu-item:last-child) {
  border-bottom: none;
}

:deep(.vjs-quality-menu-item:hover),
:deep(.vjs-audio-menu-item:hover) {
  background-color: #ef4444;
  color: white;
}

:deep(.vjs-quality-menu-item.vjs-selected),
:deep(.vjs-audio-menu-item.vjs-selected) {
  background-color: #ef4444;
  font-weight: bold;
}

:deep(.vjs-quality-menu-separator) {
  height: 1px;
  background-color: #333;
  margin: 0px 0;
}

:deep(.vjs-mobile-settings-menu) {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 56px;
  z-index: 40;
  display: none;
  max-height: min(360px, calc(100% - 72px));
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background-color: rgba(18, 18, 22, 0.98);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  -webkit-overflow-scrolling: touch;
}

:deep(.vjs-mobile-settings-menu.vjs-open) {
  display: block !important;
}

:deep(.vjs-mobile-settings-heading) {
  padding: 8px 12px 4px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

:deep(.vjs-mobile-settings-item),
:deep(.vjs-mobile-settings-empty) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 34px;
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid #333;
  border-radius: 0;
  background: transparent;
  color: white;
  font-size: 12px;
  line-height: 1.2;
  text-align: left;
  touch-action: manipulation;
  appearance: none;
  -webkit-appearance: none;
}

:deep(.vjs-mobile-settings-item:hover),
:deep(.vjs-mobile-settings-item.vjs-selected) {
  background-color: #ef4444;
  color: white;
  font-weight: 700;
}

:deep(.vjs-mobile-settings-back) {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #111827;
  font-weight: 700;
}
</style>

<style>
.video-js .vjs-mobile-settings-button {
  display: none !important;
  position: relative !important;
  overflow: visible !important;
}

.video-js .vjs-mobile-settings-menu {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 56px;
  z-index: 40;
  display: none;
  max-height: min(360px, calc(100% - 72px));
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background-color: rgba(18, 18, 22, 0.98);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  -webkit-overflow-scrolling: touch;
}

.video-js.vjs-fullscreen .vjs-mobile-settings-menu {
  bottom: 64px;
  z-index: 50;
}

.video-js .vjs-mobile-settings-menu.vjs-open {
  display: block !important;
}

.video-js .vjs-mobile-settings-back {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #111827;
  font-weight: 700;
}

.video-js.vjs-fullscreen .vjs-control-bar {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent) !important;
  background-color: rgba(0, 0, 0, 0.9) !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 30 !important;
}

.video-js.vjs-fullscreen.vjs-user-active .vjs-control-bar {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  transform: translateY(0) !important;
  pointer-events: auto !important;
}

.video-js.vjs-fullscreen.vjs-user-inactive .vjs-control-bar {
  visibility: hidden !important;
  opacity: 0 !important;
  transform: translateY(100%) !important;
  pointer-events: none !important;
}

.video-js.vjs-fullscreen.giltube-ultrawide-fullscreen .vjs-control-bar,
.video-js.vjs-fullscreen.giltube-ultrawide-fullscreen.vjs-user-inactive .vjs-control-bar,
.video-js.vjs-fullscreen.giltube-ultrawide-fullscreen.vjs-user-active .vjs-control-bar {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  transform: translateY(0) !important;
  pointer-events: auto !important;
}

.video-js.vjs-fullscreen .vjs-control-bar .vjs-control,
.video-js.vjs-fullscreen .vjs-control-bar .vjs-button,
.video-js.vjs-fullscreen .vjs-control-bar .vjs-button::before,
.video-js.vjs-fullscreen .vjs-control-bar .vjs-icon-placeholder,
.video-js.vjs-fullscreen .vjs-control-bar .vjs-icon-placeholder::before {
  color: #fff !important;
  opacity: 1 !important;
  visibility: visible !important;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.9) !important;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .video-js .vjs-mobile-settings-button {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .video-js .vjs-quality-button,
  .video-js .vjs-audio-button,
  .video-js .vjs-subs-caps-button,
  .video-js .vjs-captions-button,
  .video-js .vjs-subtitles-button,
  .video-js .vjs-picture-in-picture-control,
  .video-js .vjs-picture-in-picture-toggle {
    display: none !important;
    flex: 0 0 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: hidden !important;
  }

  .video-js .vjs-control-bar .giltube-mobile-native-track-hidden,
  .video-js.vjs-fullscreen .vjs-control-bar .giltube-mobile-native-track-hidden,
  .video-js.vjs-fullscreen .vjs-control-bar .giltube-mobile-native-track-hidden.vjs-button,
  .video-js.vjs-fullscreen .vjs-control-bar .giltube-mobile-native-track-hidden.vjs-control {
    display: none !important;
    flex: 0 0 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    opacity: 0 !important;
    visibility: hidden !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }

  :deep(.vjs-mobile-settings-button) {
    display: inline-flex !important;
  }

  :deep(.vjs-quality-button),
  :deep(.vjs-audio-button),
  :deep(.vjs-subs-caps-button),
  :deep(.vjs-captions-button),
  :deep(.vjs-subtitles-button),
  :deep(.vjs-picture-in-picture-control),
  :deep(.vjs-picture-in-picture-toggle) {
    display: none !important;
    flex: 0 0 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: hidden !important;
  }

  .mobile-pip-overlay,
  :deep(.mobile-pip-overlay) {
    display: inline-flex;
  }

  /* Hide current time and duration, show only remaining time */
  :deep(.vjs-current-time) {
    display: none !important;
  }

  :deep(.vjs-time-divider) {
    display: none !important;
  }

  :deep(.vjs-duration) {
    display: none !important;
  }

  :deep(.vjs-remaining-time) {
    display: inline-flex !important;
    margin: 0 2px !important;
    padding: 0 2px !important;
    font-size: 10px !important;
  }

  :deep(.vjs-remaining-time-display) {
    font-size: 10px !important;
  }

  :deep(.vjs-control-bar) {
    padding: 8px 8px !important;
    gap: 2px !important;
  }

  /* Reduce control button padding and size */
  :deep(.vjs-control-bar .vjs-button) {
    padding: 4px 4px !important;
    width: 32px !important;
    height: 32px !important;
    font-size: 14px !important;
  }

  :deep(.vjs-control-bar .vjs-control) {
    padding: 0 4px !important;
    height: 32px !important;
  }

  :deep(.vjs-play-control) {
    width: 32px !important;
    height: 32px !important;
  }

  :deep(.vjs-volume-panel) {
    width: 30px !important;
  }

  :deep(.vjs-volume-control) {
    width: 30px !important;
  }

  :deep(.vjs-quality-button) {
    width: 32px !important;
    height: 32px !important;
  }

  :deep(.vjs-audio-button) {
    width: 38px !important;
    height: 32px !important;
    padding: 0 4px !important;
  }

  :deep(.vjs-fullscreen-control) {
    width: 32px !important;
    height: 32px !important;
  }

  :deep(.vjs-picture-in-picture-toggle) {
    display: none !important;
    flex: 0 0 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: hidden !important;
  }

  :deep(.giltube-control-group) {
    gap: 1px;
  }

  :deep(.giltube-control-group-spacer) {
    flex: 1 1 auto;
  }

  .progress-bar-overlay {
    height: 8px !important;
  }

  .progress-bar-overlay:hover {
    height: 12px !important;
  }

  .series-player-actions {
    right: 0.75rem;
    bottom: 5.25rem;
    gap: 0.5rem;
  }

  .series-player-actions button {
    min-height: 42px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8125rem;
  }
}

@media (max-width: 400px) {
  :deep(.vjs-control-bar) {
    padding: 6px 4px !important;
    gap: 0 !important;
  }

  :deep(.vjs-control-bar .vjs-button) {
    padding: 0 !important;
    width: 26px !important;
    height: 26px !important;
    margin: 0 !important;
    font-size: 12px !important;
  }

  :deep(.vjs-control-bar .vjs-control) {
    padding: 0 !important;
    height: 26px !important;
  }

  :deep(.vjs-play-control) {
    width: 26px !important;
    height: 26px !important;
  }

  :deep(.vjs-volume-panel) {
    width: 24px !important;
  }

  :deep(.vjs-volume-control) {
    width: 24px !important;
  }

  :deep(.vjs-quality-button) {
    width: 26px !important;
    height: 26px !important;
  }

  :deep(.vjs-fullscreen-control) {
    width: 26px !important;
    height: 26px !important;
  }

  :deep(.vjs-picture-in-picture-toggle) {
    display: none !important;
    flex: 0 0 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: hidden !important;
  }

  :deep(.vjs-remaining-time) {
    font-size: 8px !important;
    margin: 0 !important;
    padding: 0 !important;
    white-space: nowrap;
  }

  :deep(.giltube-control-group) {
    gap: 0;
  }

  .progress-bar-overlay {
    height: 10px !important;
  }

  .progress-bar-overlay:hover {
    height: 14px !important;
  }
}

@media (max-width: 340px) {
  :deep(.vjs-control-bar) {
    padding: 4px 2px !important;
    gap: 0 !important;
  }

  :deep(.vjs-control-bar .vjs-button) {
    padding: 0 !important;
    width: 24px !important;
    height: 24px !important;
    margin: 0 !important;
    font-size: 11px !important;
  }

  :deep(.vjs-control-bar .vjs-control) {
    padding: 0 !important;
    height: 24px !important;
  }

  :deep(.vjs-play-control) {
    width: 24px !important;
    height: 24px !important;
  }

  :deep(.vjs-volume-panel) {
    width: 22px !important;
  }

  :deep(.vjs-volume-control) {
    width: 22px !important;
  }

  :deep(.vjs-quality-button) {
    width: 24px !important;
    height: 24px !important;
  }

  :deep(.vjs-fullscreen-control) {
    width: 24px !important;
    height: 24px !important;
  }

  :deep(.vjs-picture-in-picture-toggle) {
    display: none !important;
    flex: 0 0 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: hidden !important;
  }

  :deep(.vjs-remaining-time) {
    font-size: 7px !important;
    margin: 0 !important;
    padding: 0 !important;
    white-space: nowrap;
  }

  :deep(.vjs-time-control) {
    width: unset !important;
  }

  :deep(.giltube-control-group) {
    gap: 0;
  }

  .progress-bar-overlay {
    height: 12px !important;
  }

  .progress-bar-overlay:hover {
    height: 16px !important;
  }
}
</style>
