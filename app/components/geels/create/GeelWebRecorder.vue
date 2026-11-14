<template>
  <div class="recorder">
    <video
      ref="previewRef"
      class="recorder-preview"
      :class="{ 'recorder-preview--mirrored': facingUser }"
      autoplay
      muted
      playsinline
    />

    <div v-if="cameraError" class="recorder-blocked">
      <svg viewBox="0 0 24 24" class="h-12 w-12 text-zinc-500" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5 20.47 5.78a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25ZM3 3l18 18" /></svg>
      <p class="text-base font-semibold text-white">{{ t('geels.cameraUnavailable') }}</p>
      <p class="max-w-xs text-sm text-zinc-400">{{ cameraError }}</p>
      <div class="flex gap-2">
        <button type="button" class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" @click="startCamera">{{ t('geels.tryAgain') }}</button>
        <button type="button" class="rounded-full bg-accent-600 px-4 py-2 text-sm font-bold text-white hover:bg-accent-500" @click="fileInput?.click()">{{ t('geels.uploadVideo') }}</button>
      </div>
    </div>

    <!-- Progress: one block per clip, plus the live one. -->
    <div class="recorder-progress">
      <span v-for="(clip, index) in clips" :key="clip.url" class="recorder-progress-part" :style="{ flexGrow: clip.duration / clip.speed }" :data-index="index" />
      <span v-if="recording" class="recorder-progress-part recorder-progress-live" :style="{ flexGrow: Math.max(liveOutput, 0.01) }" />
      <span :style="{ flexGrow: Math.max(maxSeconds - recordedOutput - liveOutput, 0.001) }" />
    </div>

    <button type="button" class="recorder-close" :aria-label="t('geels.close')" :disabled="busy" @click="emit('close')">
      <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
    </button>

    <button type="button" class="recorder-sound" :disabled="busy || clips.length > 0" @click="emit('pick-sound')">
      <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="currentColor"><path d="M9 18V5.25l10.5-1.5V16.5a2.25 2.25 0 1 1-1.5-2.12V6.98L10.5 8.04V18a2.25 2.25 0 1 1-1.5-2.12" /></svg>
      <span class="truncate">{{ sound ? `${sound.title} · ${sound.artist_name}` : t('geels.addSound') }}</span>
    </button>

    <div class="recorder-tools">
      <button v-if="canFlip" type="button" class="recorder-tool" :disabled="countdown > 0" @click="flip">
        <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 7.5 19.5 4.5m0 0L22.5 7.5M19.5 4.5V12a7.5 7.5 0 0 1-12.6 5.5M7.5 16.5l-3 3m0 0-3-3m3 3V12a7.5 7.5 0 0 1 12.6-5.5" /></svg>
        <span>{{ t('geels.flip') }}</span>
      </button>
      <template v-if="!busy">
        <button type="button" class="recorder-tool" :class="{ 'recorder-tool--on': speed !== 1 }" @click="speedOpen = !speedOpen">
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          <span>{{ speed }}x</span>
        </button>
        <button type="button" class="recorder-tool" :class="{ 'recorder-tool--on': timer > 0 }" @click="cycleTimer">
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l2.5 2.5M9 2.25h6M12 21a8.25 8.25 0 1 0 0-16.5A8.25 8.25 0 0 0 12 21Z" /></svg>
          <span>{{ timer ? `${timer}s` : t('geels.timer') }}</span>
        </button>
        <button v-if="torchSupported" type="button" class="recorder-tool" :class="{ 'recorder-tool--on': torch }" @click="toggleTorch">
          <svg viewBox="0 0 24 24" class="h-7 w-7" :fill="torch ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8"><path stroke-linejoin="round" d="M13 2.25 4.5 13.5H12l-1 8.25 8.5-11.25H12l1-8.25Z" /></svg>
          <span>{{ t('geels.flash') }}</span>
        </button>
      </template>
    </div>

    <div v-if="countdown > 0" class="recorder-countdown">{{ countdown }}</div>

    <div class="recorder-bottom">
      <div v-if="speedOpen && !busy" class="recorder-speeds">
        <button v-for="value in speeds" :key="value" type="button" :class="{ 'is-on': speed === value }" @click="speed = value; speedOpen = false">{{ value }}x</button>
      </div>
      <div v-if="!clips.length && !busy" class="recorder-lengths">
        <button v-for="length in lengths" :key="length" type="button" :class="{ 'is-on': maxSeconds === length }" @click="emit('update:maxSeconds', length)">{{ length < 60 ? `${length}s` : `${length / 60}m` }}</button>
      </div>
      <p class="recorder-time">{{ clock(recordedOutput + liveOutput) }} / {{ clock(maxSeconds) }}</p>
      <div class="recorder-controls">
        <div class="recorder-side">
          <button v-if="clips.length && !busy" type="button" class="recorder-side-button" :aria-label="t('geels.deleteLastClip')" @click="undo">
            <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.37-6.37a1.13 1.13 0 0 1 0-1.6l6.37-6.37c.21-.21.5-.33.8-.33h10.03c.62 0 1.13.5 1.13 1.13v12.74c0 .62-.5 1.13-1.13 1.13H10.22c-.3 0-.59-.12-.8-.33Z" /></svg>
          </button>
          <button v-else-if="!busy" type="button" class="recorder-side-button" :aria-label="t('geels.uploadVideo')" @click="fileInput?.click()">
            <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.16-5.16a2.25 2.25 0 0 1 3.18 0l5.16 5.16m-1.5-1.5 1.41-1.41a2.25 2.25 0 0 1 3.18 0l2.91 2.91M3.75 21h16.5A1.5 1.5 0 0 0 21.75 19.5V4.5A1.5 1.5 0 0 0 20.25 3H3.75A1.5 1.5 0 0 0 2.25 4.5v15A1.5 1.5 0 0 0 3.75 21Z" /></svg>
            <span>{{ t('geels.upload') }}</span>
          </button>
        </div>
        <button
          type="button"
          class="recorder-record"
          :class="{ 'is-recording': recording }"
          :aria-label="recording ? t('geels.stopRecording') : t('geels.record')"
          :disabled="!streamReady && !recording"
          @pointerdown.prevent="onPressIn"
          @pointerup.prevent="onPressOut"
          @pointerleave="onPressOut"
        ><span /></button>
        <div class="recorder-side">
          <button v-if="recordedOutput >= 1 && !busy" type="button" class="recorder-next" :aria-label="t('geels.nextStep')" @click="emit('next')">
            <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2.6"><path stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </button>
        </div>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="video/*" class="hidden" @change="importFile">
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveAvatarUrl } from '~/app/utils/media'
import type { GeelSound, GeelWebClip } from '~/app/service/geels'

const props = defineProps<{ clips: GeelWebClip[]; maxSeconds: number; sound: GeelSound | null; soundStartMS: number }>()
const emit = defineEmits<{
  (event: 'update:clips', clips: GeelWebClip[]): void
  (event: 'update:maxSeconds', seconds: number): void
  (event: 'pick-sound'): void
  (event: 'next'): void
  (event: 'close'): void
}>()
const { t } = useI18n()

const speeds = [0.5, 1, 2, 3]
const lengths = [15, 60, 180]
const MIN_CLIP = 0.35

const previewRef = ref<HTMLVideoElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const cameraError = ref('')
const streamReady = ref(false)
const facingUser = ref(true)
const canFlip = ref(false)
const torchSupported = ref(false)
const torch = ref(false)
const speed = ref(1)
const speedOpen = ref(false)
const timer = ref(0)
const countdown = ref(0)
const recording = ref(false)
const liveSeconds = ref(0)
let stream: MediaStream | null = null
let recorder: MediaRecorder | null = null
let startedAt = 0
let liveTimer: ReturnType<typeof setInterval> | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null
let countdownTimer: ReturnType<typeof setTimeout> | null = null
let pressedAt = 0
let holdCandidate = false
let flipPending = false
let soundAudio: HTMLAudioElement | null = null

const recordedOutput = computed(() => props.clips.reduce((sum, clip) => sum + clip.duration / clip.speed, 0))
const liveOutput = computed(() => (recording.value ? liveSeconds.value / speed.value : 0))
const remaining = computed(() => Math.max(props.maxSeconds - recordedOutput.value, 0))
const busy = computed(() => recording.value || countdown.value > 0)
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

const mimeType = () => ['video/mp4;codecs=avc1,mp4a', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
  .find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) || ''

const stopStream = () => {
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  streamReady.value = false
}

const startCamera = async () => {
  cameraError.value = ''
  stopStream()
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingUser.value ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    })
    if (previewRef.value) previewRef.value.srcObject = stream
    const devices = await navigator.mediaDevices.enumerateDevices()
    canFlip.value = devices.filter((device) => device.kind === 'videoinput').length > 1
    const track = stream.getVideoTracks()[0]
    const capabilities = (track?.getCapabilities?.() || {}) as MediaTrackCapabilities & { torch?: boolean }
    torchSupported.value = !!capabilities.torch
    torch.value = false
    streamReady.value = true
  } catch (error) {
    cameraError.value = (error as DOMException)?.name === 'NotAllowedError'
      ? t('geels.cameraDenied')
      : t('geels.cameraFailed')
  }
}

const toggleTorch = async () => {
  const track = stream?.getVideoTracks()[0]
  if (!track) return
  try {
    await track.applyConstraints({ advanced: [{ torch: !torch.value } as MediaTrackConstraintSet] })
    torch.value = !torch.value
  } catch { /* unsupported */ }
}

const startSound = () => {
  if (!props.sound) return
  soundAudio ??= new Audio()
  const src = resolveAvatarUrl(props.sound.audio_url)
  if (soundAudio.src !== src) soundAudio.src = src
  soundAudio.currentTime = props.soundStartMS / 1000 + recordedOutput.value
  soundAudio.playbackRate = 1 / speed.value
  ;(soundAudio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false
  void soundAudio.play().catch(() => undefined)
}

const startClip = () => {
  if (!stream || recording.value || remaining.value < MIN_CLIP) return
  const type = mimeType()
  if (!type) { cameraError.value = t('geels.recordingUnsupported'); return }
  const chunks: Blob[] = []
  const clipSpeed = speed.value
  const clipMirror = facingUser.value
  recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8_000_000 })
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
  recorder.onstop = () => {
    const duration = Math.min((performance.now() - startedAt) / 1000, remaining.value * clipSpeed)
    recording.value = false
    liveSeconds.value = 0
    if (liveTimer) clearInterval(liveTimer)
    if (stopTimer) clearTimeout(stopTimer)
    soundAudio?.pause()
    if (duration >= MIN_CLIP && chunks.length) {
      const extension = type.includes('mp4') ? 'mp4' : 'webm'
      const file = new File(chunks, `geel-clip-${Date.now()}.${extension}`, { type: type.split(';')[0] })
      emit('update:clips', [...props.clips, { file, url: URL.createObjectURL(file), duration, speed: clipSpeed, mirror: clipMirror, fill: true }])
    }
    if (flipPending) {
      flipPending = false
      facingUser.value = !facingUser.value
      void startCamera().then(() => startClip())
    }
  }
  recorder.start(1000)
  startedAt = performance.now()
  recording.value = true
  speedOpen.value = false
  liveTimer = setInterval(() => { liveSeconds.value = (performance.now() - startedAt) / 1000 }, 100)
  stopTimer = setTimeout(() => stopClip(), remaining.value * clipSpeed * 1000)
  startSound()
}

const stopClip = () => {
  if (recorder && recorder.state !== 'inactive') recorder.stop()
}

const flip = () => {
  torch.value = false
  if (recording.value) {
    flipPending = true
    stopClip()
    return
  }
  facingUser.value = !facingUser.value
  void startCamera()
}

const cycleTimer = () => { timer.value = timer.value === 0 ? 3 : timer.value === 3 ? 10 : 0 }

const tick = () => {
  if (countdown.value <= 1) {
    countdown.value = 0
    startClip()
    return
  }
  countdown.value -= 1
  countdownTimer = setTimeout(tick, 1000)
}

// Tap: start/stop. Hold: record while pressed.
const onPressIn = () => {
  pressedAt = Date.now()
  holdCandidate = false
  if (countdown.value > 0) {
    countdown.value = 0
    if (countdownTimer) clearTimeout(countdownTimer)
    return
  }
  if (recording.value) { stopClip(); return }
  if (remaining.value < MIN_CLIP) { emit('next'); return }
  if (timer.value > 0) {
    countdown.value = timer.value
    countdownTimer = setTimeout(tick, 1000)
    return
  }
  holdCandidate = true
  startClip()
}
const onPressOut = () => {
  if (holdCandidate && Date.now() - pressedAt > 400) stopClip()
  holdCandidate = false
}

const undo = () => {
  const last = props.clips[props.clips.length - 1]
  if (!last || !window.confirm(t('geels.deleteLastClipConfirm'))) return
  URL.revokeObjectURL(last.url)
  emit('update:clips', props.clips.slice(0, -1))
}

const importFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const url = URL.createObjectURL(file)
  const duration = await new Promise<number>((resolve) => {
    const probe = document.createElement('video')
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => resolve(Number.isFinite(probe.duration) ? probe.duration : 0)
    probe.onerror = () => resolve(0)
    probe.src = url
  })
  if (duration <= 0) {
    URL.revokeObjectURL(url)
    window.alert(t('geels.unreadableVideo'))
    return
  }
  if (recordedOutput.value + duration > 180.5) {
    URL.revokeObjectURL(url)
    window.alert(t('geels.tooLong'))
    return
  }
  const needed = lengths.find((length) => length >= recordedOutput.value + duration) ?? 180
  if (needed > props.maxSeconds) emit('update:maxSeconds', needed)
  emit('update:clips', [...props.clips, { file, url, duration, speed: 1, mirror: false, fill: false }])
}

const onKey = (event: KeyboardEvent) => {
  if (event.key === ' ' && !(event.target as HTMLElement)?.closest('input, textarea')) {
    event.preventDefault()
    if (recording.value) stopClip()
    else if (!countdown.value) onPressIn()
  }
}

const onVisibility = () => { if (document.visibilityState !== 'visible') stopClip() }

watch(() => props.sound, () => { soundAudio?.pause() })

onMounted(() => {
  void startCamera()
  document.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  stopClip()
  stopStream()
  soundAudio?.pause()
  if (countdownTimer) clearTimeout(countdownTimer)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.recorder {
  position: relative;
  height: 100%;
  aspect-ratio: 9 / 16;
  max-width: 100vw;
  overflow: hidden;
  border-radius: 18px;
  background: #000;
  color: #fff;
  user-select: none;
}
.recorder-preview { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; }
.recorder-preview--mirrored { transform: scaleX(-1); }
.recorder-blocked { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; background: #09090b; }
.recorder-progress { position: absolute; top: 10px; left: 12px; right: 12px; display: flex; gap: 2px; height: 5px; overflow: hidden; border-radius: 3px; background: rgba(255, 255, 255, 0.25); }
.recorder-progress-part { background: rgb(var(--gt-accent-500, 239 68 68)); }
.recorder-progress-live { background: #fff; }
.recorder-close { position: absolute; top: 24px; left: 10px; padding: 6px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6)); }
.recorder-sound { position: absolute; top: 26px; left: 50%; display: flex; max-width: 58%; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; background: rgba(0, 0, 0, 0.45); font-size: 13px; font-weight: 700; transform: translateX(-50%); }
.recorder-sound:disabled { opacity: 0.8; }
.recorder-tools { position: absolute; top: 78px; right: 8px; display: flex; flex-direction: column; gap: 16px; }
.recorder-tool { display: flex; min-width: 52px; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; font-weight: 800; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.7)); }
.recorder-tool--on { color: rgb(var(--gt-accent-400, 248 113 113)); }
.recorder-countdown { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 120px; font-weight: 900; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6); pointer-events: none; }
.recorder-bottom { position: absolute; left: 0; right: 0; bottom: 18px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.recorder-speeds { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(0, 0, 0, 0.5); }
.recorder-speeds button { padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 800; }
.recorder-speeds button.is-on { background: #fff; color: #000; }
.recorder-lengths { display: flex; gap: 18px; }
.recorder-lengths button { font-size: 14px; font-weight: 800; color: rgba(255, 255, 255, 0.65); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); }
.recorder-lengths button.is-on { color: #fff; }
.recorder-time { font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); }
.recorder-controls { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 0 30px; }
.recorder-side { display: flex; width: 64px; justify-content: center; }
.recorder-side-button { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; font-weight: 800; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.7)); }
.recorder-record { display: flex; height: 84px; width: 84px; align-items: center; justify-content: center; border-radius: 999px; border: 5px solid rgba(255, 255, 255, 0.9); touch-action: none; }
.recorder-record:disabled { opacity: 0.5; }
.recorder-record span { height: 64px; width: 64px; border-radius: 999px; background: rgb(var(--gt-accent-500, 239 68 68)); transition: all 0.2s ease; }
.recorder-record.is-recording { animation: recorder-pulse 1s ease-in-out infinite; }
.recorder-record.is-recording span { height: 34px; width: 34px; border-radius: 8px; }
.recorder-next { display: flex; height: 52px; width: 52px; align-items: center; justify-content: center; border-radius: 999px; background: rgb(var(--gt-accent-600, 220 38 38)); }
@keyframes recorder-pulse { 50% { transform: scale(1.07); } }
@media (max-width: 767px) { .recorder { border-radius: 0; width: 100%; aspect-ratio: auto; } }
</style>
