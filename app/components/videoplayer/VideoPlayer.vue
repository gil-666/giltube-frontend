<template>
  <div class="w-full flex items-center justify-center relative">
    <div class="video-player-container w-full bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
      <video ref="videoElement" class="video-js vjs-default-skin" controls
        preload="auto"></video>

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
        remainingTimeDisplay: true,
        progressControl: true,
        playToggle: true,
        volumePanel: {
          inline: false,
          vertical: true
        }
      }
    })

    player.ready(function () {
      // Add quality button to control bar
      qualityButton = player.controlBar.addChild('QualityButton', {})
      qualityButton.hide()

      // Emit 'play' event when video starts playing
      player.on('play', () => {
        emit('play')
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
      player.on('play', syncUltrawideFullscreenClass)
      player.on('pause', syncUltrawideFullscreenClass)
      player.on('ended', syncUltrawideFullscreenClass)
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

:deep(.vjs-control-bar) {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  position: absolute;
  z-index: 30 !important;
}

:deep(.vjs-control-bar .vjs-control) {
  position: relative;
  z-index: 31;
  color: #fff !important;
  opacity: 1 !important;
  visibility: visible !important;
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
  background-color: transparent;
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
  padding: 5px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent !important;
  border: none;
  width: auto;
  gap: 3px;
  touch-action: manipulation;
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
</style>
