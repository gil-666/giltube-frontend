<template>
  <section
    class="clip-editor rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur sm:p-4"
    :aria-label="t('video.clip.create')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">{{ t('video.clip.create') }}</p>
        <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm text-zinc-300">
          <span>{{ formatTime(start, true) }} – {{ formatTime(end, true) }}</span>
          <span
            class="rounded-full px-2 py-0.5 font-sans text-xs font-bold"
            :class="clipLength >= MAX_CLIP_SECONDS - 0.05 ? 'bg-red-500/25 text-red-100' : 'bg-white/10 text-zinc-200'"
          >
            {{ t('video.clip.length', { length: formatTime(clipLength, true), max: MAX_CLIP_SECONDS }) }}
          </span>
        </p>
      </div>
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
        :aria-label="t('video.clip.closeEditor')"
        @click="emit('cancel')"
      >
        &times;
      </button>
    </div>

    <!-- Whole-video overview: shows where the zoomed view and the clip sit; drag to pan. -->
    <div
      ref="overviewRef"
      class="relative mt-4 h-2.5 cursor-pointer touch-none rounded-full bg-zinc-800"
      role="presentation"
      :title="t('video.clip.overview')"
      @pointerdown="beginOverviewDrag"
    >
      <div class="absolute inset-y-[-3px] rounded-full bg-white/10 ring-1 ring-white/25" :style="overviewWindowStyle" />
      <div class="absolute inset-y-0 min-w-[3px] rounded-full bg-red-500" :style="overviewSelectionStyle" />
      <div class="absolute inset-y-[-4px] w-0.5 -translate-x-1/2 rounded-full bg-white" :style="overviewPlayheadStyle" />
    </div>

    <div class="mt-3 rounded-xl bg-zinc-900/80 px-3 pb-3 pt-2 sm:px-4">
      <div
        ref="trackRef"
        class="relative h-28 touch-none select-none sm:h-24"
        @pointerdown="beginDrag('seek', $event)"
      >
        <!-- Time ruler -->
        <div class="pointer-events-none absolute inset-x-0 top-0 h-6 overflow-hidden">
          <div
            v-for="tick in ticks"
            :key="tick"
            class="absolute top-0 flex h-full -translate-x-1/2 flex-col items-center"
            :style="{ left: `${toPercent(tick)}%` }"
          >
            <span class="font-mono text-[10px] text-zinc-500">{{ formatTime(tick) }}</span>
            <span class="mt-auto h-1.5 w-px bg-zinc-600" />
          </div>
        </div>

        <div class="absolute inset-x-0 bottom-1 top-7 overflow-hidden rounded-lg bg-zinc-800">
          <div
            v-for="tick in ticks"
            :key="`grid-${tick}`"
            class="pointer-events-none absolute inset-y-0 w-px bg-white/[0.04]"
            :style="{ left: `${toPercent(tick)}%` }"
          />

          <!-- Selection: drag the body to move the clip, the edges to trim it -->
          <div
            v-show="selectionVisible"
            class="clip-selection absolute inset-y-0 cursor-grab bg-red-500/30 ring-2 ring-inset ring-red-400 active:cursor-grabbing"
            :style="selectionStyle"
            role="slider"
            tabindex="0"
            :aria-label="t('video.clip.moveSelection')"
            :aria-valuemin="0"
            :aria-valuemax="Math.round(duration)"
            :aria-valuenow="Math.round(start)"
            :aria-valuetext="`${formatTime(start, true)} – ${formatTime(end, true)}`"
            @pointerdown.stop="beginDrag('move', $event)"
            @keydown="handleKey('move', $event)"
          >
            <div
              class="clip-handle absolute inset-y-0 left-0 flex w-4 cursor-ew-resize items-center justify-center bg-red-400 sm:w-3"
              role="slider"
              tabindex="0"
              :aria-label="t('video.clip.moveStart')"
              :aria-valuemin="0"
              :aria-valuemax="Math.round(duration)"
              :aria-valuenow="Math.round(start)"
              :aria-valuetext="formatTime(start, true)"
              @pointerdown.stop="beginDrag('start', $event)"
              @keydown.stop="handleKey('start', $event)"
            >
              <span class="h-6 w-0.5 rounded-full bg-red-950/60" />
            </div>
            <div
              class="clip-handle absolute inset-y-0 right-0 flex w-4 cursor-ew-resize items-center justify-center bg-red-400 sm:w-3"
              role="slider"
              tabindex="0"
              :aria-label="t('video.clip.moveEnd')"
              :aria-valuemin="0"
              :aria-valuemax="Math.round(duration)"
              :aria-valuenow="Math.round(end)"
              :aria-valuetext="formatTime(end, true)"
              @pointerdown.stop="beginDrag('end', $event)"
              @keydown.stop="handleKey('end', $event)"
            >
              <span class="h-6 w-0.5 rounded-full bg-red-950/60" />
            </div>
          </div>
        </div>

        <!-- Playhead -->
        <div
          v-show="playheadVisible"
          class="absolute bottom-0 top-5 z-10 w-5 -translate-x-1/2 cursor-ew-resize"
          :style="{ left: `${toPercent(currentTime)}%` }"
          aria-hidden="true"
          @pointerdown.stop="beginDrag('seek', $event)"
        >
          <span class="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          <span class="absolute bottom-0 left-1/2 top-2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        </div>
      </div>

      <div class="mt-2 flex items-center gap-3 text-xs text-zinc-400">
        <span class="w-14 font-mono">{{ formatTime(viewStart) }}</span>
        <div class="mx-auto flex min-w-0 items-center gap-2 rounded-full bg-black/25 px-2 py-1">
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full text-base font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            :aria-label="t('video.clip.zoomOut')"
            :disabled="zoomIndex >= zoomSpans.length - 1"
            @click="setZoom(zoomIndex + 1)"
          >
            &minus;
          </button>
          <span class="min-w-[4.5rem] text-center font-semibold text-zinc-300">{{ t('video.clip.viewSpan', { span: formatTime(viewSpan) }) }}</span>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full text-base font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            :aria-label="t('video.clip.zoomIn')"
            :disabled="zoomIndex <= 0"
            @click="setZoom(zoomIndex - 1)"
          >
            +
          </button>
        </div>
        <span class="w-14 text-right font-mono">{{ formatTime(viewEnd) }}</span>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2 sm:flex sm:items-center">
      <button
        type="button"
        class="flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-zinc-200"
        @click="togglePreview"
      >
        <svg v-if="previewing" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M5.75 4a.75.75 0 0 0-.75.75v10.5c0 .41.34.75.75.75h2.5a.75.75 0 0 0 .75-.75V4.75A.75.75 0 0 0 8.25 4h-2.5Zm6 0a.75.75 0 0 0-.75.75v10.5c0 .41.34.75.75.75h2.5a.75.75 0 0 0 .75-.75V4.75a.75.75 0 0 0-.75-.75h-2.5Z" />
        </svg>
        <svg v-else class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" />
        </svg>
        <span>{{ previewing ? t('video.clip.stopPreview') : t('video.clip.preview') }}</span>
      </button>
      <button
        type="button"
        class="min-h-11 rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
        :title="t('video.clip.setStartHint')"
        @click="setStartAtPlayhead"
      >
        {{ t('video.clip.setStart') }}
      </button>
      <button
        type="button"
        class="min-h-11 rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
        :title="t('video.clip.setEndHint')"
        @click="setEndAtPlayhead"
      >
        {{ t('video.clip.setEnd') }}
      </button>
      <p class="col-span-3 text-xs text-zinc-500 sm:col-span-1 sm:ml-2">{{ t('video.clip.hint') }}</p>
    </div>

    <form class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center" @submit.prevent="publish">
      <input
        v-model="title"
        type="text"
        maxlength="200"
        class="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-400 focus:outline-none"
        :placeholder="defaultTitle"
      />
      <button
        type="submit"
        class="min-h-11 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="publishing || clipLength < MIN_CLIP_SECONDS"
      >
        {{ publishing ? t('video.clip.publishing') : t('video.clip.publish') }}
      </button>
    </form>
    <p v-if="error" class="mt-2 text-sm text-red-300">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type PlayerApi = {
  getPlaybackState?: () => { currentTime: number, duration: number, paused: boolean }
  setPlaybackTime?: (seconds: number) => void
  playFrom?: (seconds?: number) => void
  pauseAt?: (seconds?: number) => void
}
type DragType = 'start' | 'end' | 'edge' | 'move' | 'seek'

const props = defineProps<{
  player: PlayerApi | null
  defaultTitle: string
  publishing: boolean
  error: string
}>()

const emit = defineEmits<{
  cancel: []
  publish: [payload: { startSeconds: number, endSeconds: number, title: string }]
}>()

const { t } = useI18n()

const MAX_CLIP_SECONDS = 30
const MIN_CLIP_SECONDS = 1
const DEFAULT_CLIP_SECONDS = 15
const ZOOM_STEPS = [30, 60, 120, 300, 600, 1800, 3600]
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]

const trackRef = ref<HTMLElement | null>(null)
const overviewRef = ref<HTMLElement | null>(null)
const duration = ref(0)
const currentTime = ref(0)
const paused = ref(true)
const previewing = ref(false)
const start = ref(0)
const end = ref(0)
const title = ref(props.defaultTitle)
const zoomIndex = ref(0)
const viewStart = ref(0)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const clipLength = computed(() => Math.max(0, end.value - start.value))

// Zoom levels are visible spans; the last one always shows the whole video.
const zoomSpans = computed(() => {
  const total = duration.value
  if (total <= 0) return [1]
  return [...ZOOM_STEPS.filter((span) => span < total), total]
})
const viewSpan = computed(() => zoomSpans.value[clamp(zoomIndex.value, 0, zoomSpans.value.length - 1)] || 1)
const viewEnd = computed(() => viewStart.value + viewSpan.value)

const toPercent = (seconds: number) => ((seconds - viewStart.value) / viewSpan.value) * 100
const overviewPercent = (seconds: number) => (duration.value > 0 ? clamp((seconds / duration.value) * 100, 0, 100) : 0)

const selectionVisible = computed(() => end.value > viewStart.value && start.value < viewEnd.value)
const playheadVisible = computed(() => currentTime.value >= viewStart.value && currentTime.value <= viewEnd.value)
const selectionStyle = computed(() => ({
  left: `${toPercent(start.value)}%`,
  width: `${(clipLength.value / viewSpan.value) * 100}%`,
}))
const overviewWindowStyle = computed(() => ({
  left: `${overviewPercent(viewStart.value)}%`,
  width: `${Math.max(1, overviewPercent(viewEnd.value) - overviewPercent(viewStart.value))}%`,
}))
const overviewSelectionStyle = computed(() => ({
  left: `${overviewPercent(start.value)}%`,
  width: `${overviewPercent(end.value) - overviewPercent(start.value)}%`,
}))
const overviewPlayheadStyle = computed(() => ({ left: `${overviewPercent(currentTime.value)}%` }))

const ticks = computed(() => {
  const span = viewSpan.value
  const step = TICK_STEPS.find((candidate) => span / candidate <= 8) || TICK_STEPS[TICK_STEPS.length - 1]!
  const result: number[] = []
  for (let tick = Math.ceil(viewStart.value / step) * step; tick <= viewEnd.value; tick += step) result.push(tick)
  return result
})

const formatTime = (seconds: number, precise = false) => {
  const raw = Math.max(0, Number(seconds) || 0)
  // Round to the shown precision first so 14.99s reads as 0:15.0, not 0:14.9.
  const safe = precise ? Math.round(raw * 10) / 10 : Math.floor(raw)
  const whole = Math.floor(safe)
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const secs = whole % 60
  const base = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`
  return precise ? `${base}.${Math.round((safe - whole) * 10) % 10}` : base
}

const setViewStart = (seconds: number) => {
  viewStart.value = clamp(seconds, 0, Math.max(0, duration.value - viewSpan.value))
}

const centerViewOnSelection = () => {
  setViewStart(start.value + clipLength.value / 2 - viewSpan.value / 2)
}

// Keep a time on screen without recentring (only pans when it would leave the view).
const revealTime = (seconds: number) => {
  if (seconds < viewStart.value) setViewStart(seconds)
  else if (seconds > viewEnd.value) setViewStart(seconds - viewSpan.value)
}

const setZoom = (index: number) => {
  zoomIndex.value = clamp(index, 0, zoomSpans.value.length - 1)
  centerViewOnSelection()
}

// Seeks during a drag are coalesced to one per frame so the player isn't flooded.
let pendingSeek: number | null = null
let seekFrame = 0
let lastLocalSeekAt = 0
const seekTo = (seconds: number) => {
  const next = clamp(seconds, 0, duration.value)
  currentTime.value = next
  lastLocalSeekAt = performance.now()
  pendingSeek = next
  if (seekFrame) return
  seekFrame = requestAnimationFrame(() => {
    seekFrame = 0
    if (pendingSeek !== null) props.player?.setPlaybackTime?.(pendingSeek)
    pendingSeek = null
  })
}

const setRange = (nextStart: number, nextEnd: number) => {
  start.value = clamp(nextStart, 0, Math.max(0, duration.value - MIN_CLIP_SECONDS))
  end.value = clamp(nextEnd, start.value + MIN_CLIP_SECONDS, Math.min(duration.value, start.value + MAX_CLIP_SECONDS))
}

const moveStartTo = (seconds: number) => {
  const nextStart = clamp(seconds, 0, end.value - MIN_CLIP_SECONDS)
  // Dragging the start past the 30s limit carries the end along with it.
  setRange(nextStart, Math.min(end.value, nextStart + MAX_CLIP_SECONDS))
}

const moveEndTo = (seconds: number) => {
  const nextEnd = clamp(seconds, start.value + MIN_CLIP_SECONDS, duration.value)
  const nextStart = Math.max(start.value, nextEnd - MAX_CLIP_SECONDS)
  start.value = nextStart
  end.value = nextEnd
}

const moveSelectionTo = (nextStart: number) => {
  const length = clipLength.value
  const clampedStart = clamp(nextStart, 0, Math.max(0, duration.value - length))
  start.value = clampedStart
  end.value = clampedStart + length
}

// ---- Pointer dragging -------------------------------------------------------

let drag: { type: DragType, pointerId: number, offset: number, target: HTMLElement } | null = null

const timeFromClientX = (clientX: number) => {
  const rect = trackRef.value?.getBoundingClientRect()
  if (!rect || rect.width <= 0) return viewStart.value
  return viewStart.value + ((clientX - rect.left) / rect.width) * viewSpan.value
}

const applyDrag = (clientX: number) => {
  if (!drag) return
  const raw = timeFromClientX(clientX)
  const time = clamp(raw, 0, duration.value)
  if (drag.type === 'edge') {
    // Handles overlap on a short clip at a wide zoom: pick the side by direction.
    if (raw < start.value) drag.type = 'start'
    else if (raw > end.value) drag.type = 'end'
    else return
  }
  if (drag.type === 'start') {
    moveStartTo(time)
    revealTime(start.value)
    seekTo(start.value)
  } else if (drag.type === 'end') {
    moveEndTo(time)
    revealTime(end.value)
    seekTo(end.value)
  } else if (drag.type === 'move') {
    moveSelectionTo(raw - drag.offset)
    revealTime(raw < viewStart.value ? start.value : end.value)
    seekTo(start.value)
  } else {
    revealTime(time)
    seekTo(time)
  }
}

const handlePointerMove = (event: PointerEvent) => {
  if (!drag || event.pointerId !== drag.pointerId) return
  event.preventDefault()
  applyDrag(event.clientX)
}

const endDrag = (event?: PointerEvent) => {
  if (!drag || (event && event.pointerId !== drag.pointerId)) return
  const { target, pointerId } = drag
  drag = null
  if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId)
  target.removeEventListener('pointermove', handlePointerMove)
  target.removeEventListener('pointerup', endDrag)
  target.removeEventListener('pointercancel', endDrag)
}

const beginDrag = (type: DragType, event: PointerEvent) => {
  if (event.button !== 0 || !trackRef.value) return
  event.preventDefault()
  endDrag()
  stopPreview()
  const target = trackRef.value
  const selectionPx = (clipLength.value / viewSpan.value) * target.getBoundingClientRect().width
  const dragType: DragType = (type === 'start' || type === 'end') && selectionPx < 36 ? 'edge' : type
  drag = { type: dragType, pointerId: event.pointerId, offset: timeFromClientX(event.clientX) - start.value, target }
  target.setPointerCapture?.(event.pointerId)
  target.addEventListener('pointermove', handlePointerMove)
  target.addEventListener('pointerup', endDrag)
  target.addEventListener('pointercancel', endDrag)
  if (dragType !== 'move' && dragType !== 'edge') applyDrag(event.clientX)
}

const panOverviewTo = (clientX: number) => {
  const rect = overviewRef.value?.getBoundingClientRect()
  if (!rect || rect.width <= 0) return
  const time = ((clientX - rect.left) / rect.width) * duration.value
  setViewStart(time - viewSpan.value / 2)
}

const beginOverviewDrag = (event: PointerEvent) => {
  const target = overviewRef.value
  if (event.button !== 0 || !target) return
  event.preventDefault()
  target.setPointerCapture?.(event.pointerId)
  panOverviewTo(event.clientX)
  const move = (moveEvent: PointerEvent) => panOverviewTo(moveEvent.clientX)
  const up = () => {
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', up)
    target.removeEventListener('pointercancel', up)
  }
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', up)
  target.addEventListener('pointercancel', up)
}

// ---- Keyboard ---------------------------------------------------------------

const handleKey = (type: 'start' | 'end' | 'move', event: KeyboardEvent) => {
  const step = event.shiftKey ? 1 : 0.1
  const delta = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
  if (!delta) return
  event.preventDefault()
  stopPreview()
  if (type === 'start') {
    moveStartTo(start.value + delta)
    revealTime(start.value)
    seekTo(start.value)
  } else if (type === 'end') {
    moveEndTo(end.value + delta)
    revealTime(end.value)
    seekTo(end.value)
  } else {
    moveSelectionTo(start.value + delta)
    revealTime(delta < 0 ? start.value : end.value)
    seekTo(start.value)
  }
}

// ---- Playback ---------------------------------------------------------------

let previewStartedAt = 0
const stopPreview = () => {
  if (!previewing.value) return
  previewing.value = false
  props.player?.pauseAt?.()
}

const togglePreview = () => {
  if (previewing.value) {
    stopPreview()
    return
  }
  const from = currentTime.value >= start.value && currentTime.value < end.value - 0.25 ? currentTime.value : start.value
  previewing.value = true
  previewStartedAt = performance.now()
  revealTime(from)
  props.player?.playFrom?.(from)
}

const setStartAtPlayhead = () => {
  stopPreview()
  const length = clipLength.value
  const nextStart = clamp(currentTime.value, 0, Math.max(0, duration.value - MIN_CLIP_SECONDS))
  setRange(nextStart, end.value > nextStart + MIN_CLIP_SECONDS && end.value - nextStart <= MAX_CLIP_SECONDS ? end.value : nextStart + length)
  revealTime(end.value)
  revealTime(start.value)
}

const setEndAtPlayhead = () => {
  stopPreview()
  const length = clipLength.value
  const nextEnd = clamp(currentTime.value, MIN_CLIP_SECONDS, duration.value)
  const nextStart = start.value < nextEnd - MIN_CLIP_SECONDS && nextEnd - start.value <= MAX_CLIP_SECONDS ? start.value : nextEnd - length
  start.value = clamp(nextStart, 0, nextEnd - MIN_CLIP_SECONDS)
  end.value = nextEnd
  revealTime(start.value)
  revealTime(end.value)
}

// Follow the real player every frame so the playhead is smooth and reflects
// seeks made from the player's own controls.
let pollFrame = 0
const poll = () => {
  pollFrame = requestAnimationFrame(poll)
  const state = props.player?.getPlaybackState?.()
  if (!state) return
  if (Number.isFinite(state.duration) && state.duration > 0) duration.value = state.duration
  paused.value = Boolean(state.paused)
  // Ignore the player's position while our own seek is still landing.
  if (drag || pendingSeek !== null || performance.now() - lastLocalSeekAt < 400) return
  const time = Number(state.currentTime) || 0
  if (Math.abs(time - currentTime.value) > 0.01) currentTime.value = time
  if (previewing.value) {
    const settling = performance.now() - previewStartedAt < 600
    if (paused.value && !settling && time < end.value - 0.1) {
      previewing.value = false
    } else if (time >= end.value) {
      previewing.value = false
      props.player?.pauseAt?.(end.value)
    } else if (!paused.value) {
      revealTime(time)
    }
  }
}

const publish = () => {
  if (props.publishing || clipLength.value < MIN_CLIP_SECONDS) return
  stopPreview()
  emit('publish', {
    startSeconds: Math.round(start.value * 10) / 10,
    endSeconds: Math.round(end.value * 10) / 10,
    title: title.value.trim() || props.defaultTitle,
  })
}

onMounted(() => {
  const state = props.player?.getPlaybackState?.()
  duration.value = Math.max(0, Number(state?.duration || 0))
  const now = clamp(Number(state?.currentTime || 0), 0, Math.max(0, duration.value - MIN_CLIP_SECONDS))
  currentTime.value = now
  setRange(now, now + DEFAULT_CLIP_SECONDS)
  // Start zoomed so the default clip fills roughly a quarter of the track.
  const preferred = zoomSpans.value.findIndex((span) => span >= Math.max(60, clipLength.value * 4))
  zoomIndex.value = preferred >= 0 ? preferred : zoomSpans.value.length - 1
  centerViewOnSelection()
  props.player?.pauseAt?.(start.value)
  pollFrame = requestAnimationFrame(poll)
})

onBeforeUnmount(() => {
  endDrag()
  cancelAnimationFrame(pollFrame)
  cancelAnimationFrame(seekFrame)
})
</script>

<style scoped>
.clip-selection:focus-visible,
.clip-handle:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
