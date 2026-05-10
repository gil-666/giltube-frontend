<template>
  <div class="w-full flex items-center justify-center relative">
    <div class="video-player-container w-full bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
      <video ref="videoElement" class="video-js vjs-default-skin" controls
        preload="auto"></video>

      <!-- Custom progress bar overlaid above the control bar (YouTube style) -->
      <div
        ref="progressBarOverlay"
        class="progress-bar-overlay"
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
}

const emit = defineEmits<{
  play: []
  ended: []
}>()

const props = withDefaults(defineProps<Props>(), {
  status: 'ready'
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

const videoElement = ref<HTMLVideoElement | null>(null)
let player: any = null
let qualityButton: any = null
const DEFAULT_INACTIVITY_TIMEOUT = 3000
let ultrawideControlsGuardInterval: ReturnType<typeof setInterval> | null = null

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

  if (player.isFullscreen?.()) {
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
  const qualityControl = qualityButton?.el?.() as HTMLElement | undefined

  ;[playControl, volumePanel, currentTime, timeDivider, duration].filter(Boolean).forEach((node) => {
    leftGroup!.appendChild(node as HTMLElement)
  })

  ;[pipControl, fullscreenControl, qualityControl].filter(Boolean).forEach((node) => {
    rightGroup!.appendChild(node as HTMLElement)
  })
}

// Progress bar interaction handlers
const handleProgressBarInteraction = (event: MouseEvent | TouchEvent) => {
  if (!player || duration.value === 0) return

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

  if (videoElement.value) {
    // Register quality button before creating player
    createQualityButton(null)

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
        subsCapsButton: false,
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

      reorderControlBar()
      setTimeout(reorderControlBar, 0)
      attachProgressBarOverlay()

      // Emit 'play' event when video starts playing
      player.on('play', () => {
        emit('play')
      })

      // Update progress bar state from player
      player.on('timeupdate', () => {
        if (!isSeekingProgress.value) {
          currentTime.value = player.currentTime() || 0
        }
      })

      player.on('durationchange', () => {
        duration.value = player.duration() || 0
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
      }

      player.on('loadedmetadata', updateQualityButtonVisibility)
      player.on('fullscreenchange', updateQualityButtonVisibility)
      player.on('loadedmetadata', syncUltrawideFullscreenClass)
      player.on('fullscreenchange', syncUltrawideFullscreenClass)
      player.on('fullscreenchange', attachProgressBarOverlay)
      player.on('play', syncUltrawideFullscreenClass)
      player.on('pause', syncUltrawideFullscreenClass)
      player.on('ended', syncUltrawideFullscreenClass)
      player.on('ended', () => {
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
  stopUltrawideControlsGuard()
  if (window.giltubePlayerDebug?.getPlayer?.() === player) {
    delete window.giltubePlayerDebug
  }
  if (player) {
    const playerEl = player.el?.() as HTMLElement | undefined
    if (playerEl) {
      playerEl.classList.remove('giltube-ultrawide-fullscreen')
    }
    if (progressBarOverlay.value?.parentElement) {
      progressBarOverlay.value.parentElement.removeChild(progressBarOverlay.value)
    }
    player.dispose()
    player = null
    qualityButton = null
  }
})

watch(
  () => props.src,
  (newSrc) => {
    if (player && newSrc && props.status === 'ready') {
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
</script>

<style scoped>
.video-player-container {
  height: 250px;
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

:deep(.video-js) {
  width: 100%;
  height: 100%;
  background-color: #000;
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

:deep(.vjs-quality-menu) {
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


:deep(.vjs-quality-menu.vjs-open) {
  display: block !important;
}

:deep(.vjs-quality-menu-item) {
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

:deep(.vjs-quality-menu-item:last-child) {
  border-bottom: none;
}

:deep(.vjs-quality-menu-item:hover) {
  background-color: #ef4444;
  color: white;
}

:deep(.vjs-quality-menu-item.vjs-selected) {
  background-color: #ef4444;
  font-weight: bold;
}

:deep(.vjs-quality-menu-separator) {
  height: 1px;
  background-color: #333;
  margin: 0px 0;
}
</style>

<style>
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

  :deep(.vjs-fullscreen-control) {
    width: 32px !important;
    height: 32px !important;
  }

  :deep(.vjs-picture-in-picture-toggle) {
    width: 32px !important;
    height: 32px !important;
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
    width: 26px !important;
    height: 26px !important;
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
    width: 24px !important;
    height: 24px !important;
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
