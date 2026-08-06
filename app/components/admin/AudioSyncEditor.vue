<template>
  <section class="audio-sync-editor">
    <div class="sync-preview">
      <video
        ref="videoEl"
        class="sync-video"
        controls
        playsinline
        @play="syncCandidate"
        @pause="pauseCandidate"
        @seeking="syncCandidate"
        @timeupdate="keepCandidateAligned"
      />
      <audio ref="candidateEl" preload="auto" />
    </div>

    <div class="sync-workspace">
      <div>
        <p class="sync-kicker">{{ t('admin.mediaIngests.audio.syncTitle') }}</p>
        <h3>{{ targetTitle }}</h3>
        <p class="sync-track-name">{{ trackLabel }}</p>
      </div>

      <div class="source-toggle" aria-label="Preview audio source">
        <button type="button" :class="{ active: monitorSource === 'original' }" @click="setMonitorSource('original')">{{ t('admin.mediaIngests.audio.original') }}</button>
        <button type="button" :class="{ active: monitorSource === 'added' }" @click="setMonitorSource('added')">{{ t('admin.mediaIngests.audio.added') }}</button>
      </div>

      <div class="timing-grid">
        <label>
          <span>{{ t('admin.mediaIngests.audio.delay') }}</span>
          <div class="timing-input">
            <button type="button" title="Subtract 100 ms" @click="delayMs -= 100">-</button>
            <input v-model.number="delayMs" type="number" step="10" @input="syncCandidate" />
            <span>ms</span>
            <button type="button" title="Add 100 ms" @click="delayMs += 100">+</button>
          </div>
        </label>
        <label>
          <span>{{ t('admin.mediaIngests.audio.trim') }}</span>
          <div class="timing-input">
            <button type="button" title="Subtract 100 ms" @click="trimStartMs = Math.max(0, trimStartMs - 100)">-</button>
            <input v-model.number="trimStartMs" min="0" type="number" step="10" @input="syncCandidate" />
            <span>ms</span>
            <button type="button" title="Add 100 ms" @click="trimStartMs += 100">+</button>
          </div>
        </label>
      </div>

      <p class="sync-note">{{ t('admin.mediaIngests.audio.syncNote') }}</p>

      <div class="sync-actions">
        <button type="button" class="secondary" @click="$emit('close')">Close</button>
        <button type="button" class="primary" :disabled="saving" @click="applySync">
          {{ saving ? t('admin.mediaIngests.audio.encoding') : t('admin.mediaIngests.audio.apply') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Hls from 'hls.js'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  videoSrc: string
  candidateSrc: string
  targetTitle: string
  trackLabel: string
  initialDelayMs?: number
  initialTrimStartMs?: number
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [settings: { delayMs: number; trimStartMs: number }]
}>()

const { t } = useI18n()

const videoEl = ref<HTMLVideoElement | null>(null)
const candidateEl = ref<HTMLAudioElement | null>(null)
const monitorSource = ref<'original' | 'added'>('added')
const delayMs = ref(Number(props.initialDelayMs || 0))
const trimStartMs = ref(Math.max(0, Number(props.initialTrimStartMs || 0)))
let videoHls: Hls | null = null
let candidateHls: Hls | null = null

const attachMedia = (element: HTMLMediaElement, src: string, kind: 'video' | 'candidate') => {
  if (Hls.isSupported() && src.toLowerCase().includes('.m3u8')) {
    const instance = new Hls({ enableWorker: true })
    instance.loadSource(src)
    instance.attachMedia(element)
    if (kind === 'video') videoHls = instance
    else candidateHls = instance
    return
  }
  element.src = src
}

const desiredCandidateTime = () => {
  const videoTime = Number(videoEl.value?.currentTime || 0)
  return Math.max(0, videoTime - (Number(delayMs.value || 0) / 1000) + (Number(trimStartMs.value || 0) / 1000))
}

const syncCandidate = async () => {
  const video = videoEl.value
  const candidate = candidateEl.value
  if (!video || !candidate) return
  const beforeTrackStart = video.currentTime < Number(delayMs.value || 0) / 1000
  const desired = desiredCandidateTime()
  if (Number.isFinite(candidate.duration)) candidate.currentTime = Math.min(desired, Math.max(0, candidate.duration - 0.02))
  else candidate.currentTime = desired
  if (!video.paused && monitorSource.value === 'added' && !beforeTrackStart) {
    await candidate.play().catch(() => undefined)
  } else {
    candidate.pause()
  }
}

const keepCandidateAligned = () => {
  const video = videoEl.value
  const candidate = candidateEl.value
  if (!video || !candidate || monitorSource.value !== 'added') return
  const desired = desiredCandidateTime()
  if (Math.abs(candidate.currentTime - desired) > 0.12) candidate.currentTime = desired
  if (video.currentTime >= Number(delayMs.value || 0) / 1000 && !video.paused && candidate.paused) {
    candidate.play().catch(() => undefined)
  }
}

const pauseCandidate = () => candidateEl.value?.pause()

const setMonitorSource = async (source: 'original' | 'added') => {
  monitorSource.value = source
  if (videoEl.value) videoEl.value.muted = source === 'added'
  if (candidateEl.value) candidateEl.value.muted = source === 'original'
  await syncCandidate()
}

const applySync = () => emit('save', {
  delayMs: Number(delayMs.value || 0),
  trimStartMs: Math.max(0, Number(trimStartMs.value || 0)),
})

watch(() => props.candidateSrc, async () => {
  candidateHls?.destroy()
  candidateHls = null
  await nextTick()
  if (candidateEl.value) attachMedia(candidateEl.value, props.candidateSrc, 'candidate')
})

onMounted(() => {
  if (videoEl.value) attachMedia(videoEl.value, props.videoSrc, 'video')
  if (candidateEl.value) attachMedia(candidateEl.value, props.candidateSrc, 'candidate')
  setMonitorSource('added')
})

onBeforeUnmount(() => {
  videoHls?.destroy()
  candidateHls?.destroy()
})
</script>

<style scoped>
.audio-sync-editor { display: grid; min-height: 0; gap: 1.25rem; }
.sync-preview { display: grid; min-height: 18rem; place-items: center; overflow: hidden; border: 1px solid rgb(63 63 70); border-radius: .75rem; background: #000; }
.sync-video { width: 100%; max-height: 52dvh; background: #000; }
.sync-workspace { display: grid; align-content: start; gap: 1.1rem; }
.sync-kicker { color: rgb(248 113 113); font-size: .72rem; font-weight: 800; text-transform: uppercase; }
h3 { margin-top: .2rem; color: white; font-size: 1.35rem; font-weight: 800; }
.sync-track-name, .sync-note { color: rgb(161 161 170); font-size: .86rem; }
.source-toggle { display: grid; grid-template-columns: 1fr 1fr; padding: .25rem; border: 1px solid rgb(63 63 70); border-radius: .65rem; background: rgb(24 24 27); }
.source-toggle button { min-height: 2.6rem; border-radius: .45rem; color: rgb(161 161 170); font-weight: 750; }
.source-toggle button.active { background: white; color: #09090b; }
.timing-grid { display: grid; gap: .8rem; }
.timing-grid label > span { display: block; margin-bottom: .35rem; color: rgb(212 212 216); font-size: .78rem; font-weight: 700; }
.timing-input { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr) 2.5rem 2.6rem; align-items: center; overflow: hidden; border: 1px solid rgb(63 63 70); border-radius: .55rem; background: rgb(24 24 27); }
.timing-input button { height: 2.75rem; color: white; font-size: 1.2rem; background: rgb(39 39 42); }
.timing-input input { min-width: 0; height: 2.75rem; padding: 0 .75rem; color: white; background: transparent; outline: none; }
.timing-input span { color: rgb(113 113 122); font-size: .75rem; }
.sync-actions { display: flex; justify-content: flex-end; gap: .65rem; }
.sync-actions button { min-height: 2.75rem; padding: 0 1rem; border-radius: .5rem; font-weight: 750; }
.sync-actions .secondary { background: rgb(39 39 42); color: white; }
.sync-actions .primary { background: rgb(220 38 38); color: white; }
.sync-actions .primary:disabled { opacity: .55; }
@media (min-width: 900px) {
  .audio-sync-editor { grid-template-columns: minmax(0, 1.45fr) minmax(19rem, .75fr); }
  .timing-grid { grid-template-columns: 1fr 1fr; }
}
</style>
