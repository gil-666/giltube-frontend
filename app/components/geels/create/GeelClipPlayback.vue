<template>
  <div class="playback" @keydown.esc="emit('close')">
    <video
      ref="videoRef"
      class="playback-video"
      :class="{ 'playback-video--mirrored': current?.mirror, 'playback-video--fit': current && !current.fill }"
      playsinline
      @click="togglePause"
      @ended="next"
      @timeupdate="onTime"
    />
    <div v-if="paused" class="playback-paused">
      <svg viewBox="0 0 24 24" class="h-16 w-16" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.04-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" /></svg>
    </div>

    <div class="playback-progress">
      <span v-for="(clip, position) in clips" :key="clip.url" class="playback-part" :style="{ flexGrow: output(clip) }">
        <span class="playback-fill" :style="{ width: `${partFill(position) * 100}%` }" />
      </span>
    </div>

    <button type="button" class="playback-close" :aria-label="t('geels.close')" @click="emit('close')">
      <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
    </button>
    <p class="playback-title">{{ t('geels.playback') }}</p>

    <div class="playback-bottom">
      <p class="playback-time">{{ clock(elapsed) }} / {{ clock(total) }}</p>
      <p v-if="clips.length > 1" class="playback-clip">{{ t('geels.clipOf', { current: index + 1, total: clips.length }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveAvatarUrl } from '~/app/utils/media'
import type { GeelSound, GeelWebClip } from '~/app/service/geels'

// Plays back what has been recorded so far, clip after clip at each clip's
// speed (mirrored and framed the way the Geel will be), with the sound lined
// up. Click to pause; loops until closed.
const props = defineProps<{ clips: GeelWebClip[]; sound: GeelSound | null; soundStartMS: number }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const { t } = useI18n()

const videoRef = ref<HTMLVideoElement | null>(null)
const index = ref(0)
const paused = ref(false)
const clipTime = ref(0)
let soundAudio: HTMLAudioElement | null = null

const output = (clip: GeelWebClip) => clip.duration / clip.speed
const total = computed(() => props.clips.reduce((sum, clip) => sum + output(clip), 0))
const startOf = (position: number) => props.clips.slice(0, position).reduce((sum, clip) => sum + output(clip), 0)
const current = computed(() => props.clips[index.value])
const elapsed = computed(() => Math.min(total.value, startOf(index.value) + (current.value ? clipTime.value / current.value.speed : 0)))
const partFill = (position: number) => Math.min(1, Math.max(0, (elapsed.value - startOf(position)) / output(props.clips[position]!)))
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

const playClip = (position: number) => {
  const video = videoRef.value
  const clip = props.clips[position]
  if (!video || !clip) return
  index.value = position
  paused.value = false
  clipTime.value = 0
  video.src = clip.url
  video.playbackRate = clip.speed
  video.defaultPlaybackRate = clip.speed
  void video.play().catch(() => { paused.value = true })
  if (props.sound) {
    soundAudio ??= new Audio(resolveAvatarUrl(props.sound.audio_url))
    soundAudio.currentTime = props.soundStartMS / 1000 + startOf(position)
    soundAudio.playbackRate = 1
    void soundAudio.play().catch(() => undefined)
  }
}

const next = () => playClip(index.value + 1 < props.clips.length ? index.value + 1 : 0)
const onTime = () => { clipTime.value = videoRef.value?.currentTime || 0 }

const togglePause = () => {
  const video = videoRef.value
  if (!video) return
  if (paused.value) {
    void video.play().catch(() => undefined)
    if (soundAudio) {
      soundAudio.currentTime = props.soundStartMS / 1000 + elapsed.value
      void soundAudio.play().catch(() => undefined)
    }
  } else {
    video.pause()
    soundAudio?.pause()
  }
  paused.value = !paused.value
}

const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
  else if (event.key === ' ') { event.preventDefault(); event.stopImmediatePropagation(); togglePause() }
}

onMounted(() => {
  // Capture phase, so the recorder's Space-to-record shortcut doesn't fire.
  document.addEventListener('keydown', onKey, true)
  playClip(0)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey, true)
  videoRef.value?.pause()
  soundAudio?.pause()
  soundAudio = null
})
</script>

<style scoped>
.playback { position: absolute; inset: 0; z-index: 10; background: #000; color: #fff; }
.playback-video { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; cursor: pointer; }
.playback-video--fit { object-fit: contain; }
.playback-video--mirrored { transform: scaleX(-1); }
.playback-paused { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.9); pointer-events: none; filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5)); }
.playback-progress { position: absolute; top: 10px; left: 12px; right: 12px; display: flex; gap: 2px; height: 5px; }
.playback-part { position: relative; overflow: hidden; border-radius: 3px; background: rgba(255, 255, 255, 0.3); }
.playback-fill { position: absolute; inset: 0 auto 0 0; background: rgb(var(--gt-accent-500, 239 68 68)); }
.playback-close { position: absolute; top: 24px; left: 10px; padding: 6px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6)); }
.playback-title { position: absolute; top: 31px; left: 50%; transform: translateX(-50%); font-size: 15px; font-weight: 900; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); pointer-events: none; }
.playback-bottom { position: absolute; left: 0; right: 0; bottom: 28px; display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); }
.playback-time { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }
.playback-clip { font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.75); }
</style>
