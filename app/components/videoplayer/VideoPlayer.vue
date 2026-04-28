<template>
  <div class="w-full flex items-center justify-center relative">
    <div class="video-player-container w-full bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
      <video ref="videoElement" class="video-js vjs-default-skin w-full h-full object-contain" controls
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
import { ref, onMounted, watch, nextTick } from 'vue'
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

const videoElement = ref<HTMLVideoElement | null>(null)
let player: any = null

const inferSourceType = (src: string) => {
  const normalized = src.split('?')[0].toLowerCase()
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

    bindPress(el: HTMLElement, handler: (e: Event) => void) {
      el.onclick = (e) => {
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
      })

      this.bindPress(autoItem, () => {
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
        })

        // 🔥 attach real index
        item.dataset.levelIndex = i.toString()

        this.bindPress(item, () => {
          const selectedIndex = parseInt(item.dataset.levelIndex!)

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

      const isAuto = enabledIndexes.length === this.qualityLevels.length

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
          !isAuto &&
          enabledIndexes.length === 1 &&
          enabledIndexes[0] === i
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
      player.controlBar.addChild('QualityButton', {})

      // Emit 'play' event when video starts playing
      player.on('play', () => {
        emit('play')
      })

      if (props.src && props.status === 'ready') {
        player.src({
          src: props.src,
          type: inferSourceType(props.src)
        })
      }
    })

    // Listen for quality changes when manifest loads
    player.on('loadedmetadata', () => {
      // Menu will be populated on button click
    })
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
  height: 100%;
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

:deep(.vjs-control-bar) {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
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
