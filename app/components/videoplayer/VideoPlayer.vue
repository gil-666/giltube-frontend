<template>
  <div class="w-full max-w-4xl mx-auto">
    <video
      ref="videoElement"
      class="video-js vjs-default-skin"
      controls
      preload="auto"
      width="100%"
      height="auto"
    ></video>
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

const props = withDefaults(defineProps<Props>(), {
  status: 'ready'
})

const videoElement = ref<HTMLVideoElement | null>(null)
let player: any = null

// Create quality button component
const createQualityButton = (player: any) => {
  const Button = videojs.getComponent('Button')
  
  class QualityButton extends Button {
    menu: any = null
    qualityLevels: any = null
    
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
          // Refresh video to apply quality change
          this.refreshQuality()
        })
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

      // Clear existing menu if any
      if (this.menu) {
        this.menu.innerHTML = ''
      } else {
        this.menu = videojs.dom.createEl('div', { 
          className: 'vjs-quality-menu'
        })
        this.el().appendChild(this.menu)
      }

      // Add Auto option
      const autoItem = videojs.dom.createEl('div', {
        className: 'vjs-quality-menu-item',
        innerHTML: 'Auto'
      })

      // Check if all levels are enabled (auto mode)
      let allEnabled = true
      for (let i = 0; i < this.qualityLevels.length; i++) {
        if (this.qualityLevels[i].enabled === false) {
          allEnabled = false
          break
        }
      }
      
      if (allEnabled) {
        autoItem.classList.add('vjs-selected')
      }

      autoItem.addEventListener('click', (e: any) => {
        e.stopPropagation()
        // Enable all levels for auto selection
        for (let j = 0; j < this.qualityLevels.length; j++) {
          this.qualityLevels[j].enabled = true
        }
        this.updateMenuSelection()
        this.toggleMenu()
      })

      this.menu.appendChild(autoItem)

      // Add separator
      const separator = videojs.dom.createEl('div', {
        className: 'vjs-quality-menu-separator'
      })
      this.menu.appendChild(separator)

      // Populate menu items
      for (let i = 0; i < this.qualityLevels.length; i++) {
        const level = this.qualityLevels[i]
        
        // Extract resolution from label or use height
        let label = ''
        if (level.label) {
          // Extract just the resolution part (e.g., "1080p" from "1080p/playlist.m3u8")
          const match = level.label.match(/(\d+p)/)
          label = match ? match[1] : level.label
        } else if (level.height) {
          label = `${level.height}p`
        } else {
          label = `Quality ${i}`
        }
        
        const item = videojs.dom.createEl('div', {
          className: 'vjs-quality-menu-item',
          innerHTML: label
        })

        // Check if only this level is enabled
        let isSelected = this.qualityLevels[i].enabled === true
        let onlyThisEnabled = true
        for (let j = 0; j < this.qualityLevels.length; j++) {
          if (j !== i && this.qualityLevels[j].enabled !== false) {
            onlyThisEnabled = false
            break
          }
        }
        
        if (isSelected && onlyThisEnabled) {
          item.classList.add('vjs-selected')
        }

        item.addEventListener('click', (e: any) => {
          e.stopPropagation()
          // Disable all except this one
          for (let j = 0; j < this.qualityLevels.length; j++) {
            this.qualityLevels[j].enabled = i === j
          }
          this.updateMenuSelection()
          this.toggleMenu()
        })

        this.menu.appendChild(item)
      }
    }

    updateMenuSelection() {
      if (!this.menu) return
      const items = this.menu.querySelectorAll('.vjs-quality-menu-item')
      
      let allEnabled = true
      for (let i = 0; i < this.qualityLevels.length; i++) {
        if (this.qualityLevels[i].enabled === false) {
          allEnabled = false
          break
        }
      }
      
      items.forEach((item: any, index: number) => {
        if (index === 0) {
          // First item is Auto
          if (allEnabled) {
            item.classList.add('vjs-selected')
          } else {
            item.classList.remove('vjs-selected')
          }
        } else if (index > 1) {
          // Skip separator at index 1
          const levelIndex = index - 2
          let isSelected = this.qualityLevels[levelIndex].enabled === true
          let onlyThisEnabled = true
          for (let j = 0; j < this.qualityLevels.length; j++) {
            if (j !== levelIndex && this.qualityLevels[j].enabled !== false) {
              onlyThisEnabled = false
              break
            }
          }
          
          if (isSelected && onlyThisEnabled) {
            item.classList.add('vjs-selected')
          } else {
            item.classList.remove('vjs-selected')
          }
        }
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
      autoplay: false,
      preload: 'auto',
      responsive: true,
      fluid: true,
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

    player.ready(function() {
      // Add quality button to control bar
      player.controlBar.addChild('QualityButton', {})
      
      if (props.src && props.status === 'ready') {
        player.src({
          src: props.src,
          type: 'application/x-mpegURL'
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
        type: 'application/x-mpegURL'
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
:deep(.video-js) {
  width: 100%;
  height: auto;
  background-color: #000;
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
  bottom: 50px;
  right: 0;
  background-color: #1a1a1a;
  border: 1px solid #333;
  min-width: 120px;
  z-index: 100;
  display: none;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
}

:deep(.vjs-quality-menu.vjs-open) {
  display: block !important;
}

:deep(.vjs-quality-menu-item) {
  color: white;
  padding: 10px 12px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  user-select: none;
  font-size: 11px;
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
  margin: 4px 0;
}</style>


