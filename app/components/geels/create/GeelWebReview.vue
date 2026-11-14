<template>
  <div class="review">
    <div class="review-preview">
      <video
        ref="videoRef"
        class="h-full w-full"
        :class="[current?.fill ? 'object-cover' : 'object-contain', { 'review-mirrored': current?.mirror }]"
        playsinline
        @ended="next"
      />
      <span v-if="coverMode" class="review-badge">{{ t('geels.cover') }}</span>
    </div>

    <div class="review-panel">
      <div class="flex items-center justify-between">
        <button type="button" class="flex items-center gap-1 text-sm font-semibold text-zinc-300 hover:text-white" :disabled="posting" @click="emit('back')">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6" /></svg>
          {{ t('geels.backToCamera') }}
        </button>
        <h1 class="text-lg font-extrabold text-white">{{ t('geels.newGeel') }}</h1>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="review-chip" @click="emit('pick-sound')">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M9 18V5.25l10.5-1.5V16.5a2.25 2.25 0 1 1-1.5-2.12V6.98L10.5 8.04V18a2.25 2.25 0 1 1-1.5-2.12" /></svg>
          <span class="truncate">{{ sound ? sound.title : t('geels.addSound') }}</span>
        </button>
        <button type="button" class="review-chip" :class="{ 'review-chip--on': coverMode }" @click="toggleCover">
          {{ coverMode ? t('geels.done') : t('geels.chooseCover') }}
        </button>
      </div>

      <label v-if="coverMode" class="review-field">
        <span class="review-label">{{ t('geels.coverFrame') }} <em>{{ clock(coverSeconds) }}</em></span>
        <input v-model.number="coverSeconds" type="range" min="0" :max="total" step="0.05" class="review-range" @input="showCover">
      </label>
      <label v-else-if="sound && sound.duration_seconds > total + 0.5" class="review-field">
        <span class="review-label">{{ t('geels.soundStart') }} <em>{{ clock(soundStart) }} – {{ clock(soundStart + total) }}</em></span>
        <input :value="soundStart" type="range" min="0" :max="Math.max(sound.duration_seconds - total, 0)" step="0.5" class="review-range" @input="emit('update:soundStartMS', Math.round(Number(($event.target as HTMLInputElement).value) * 1000))" @change="restart">
      </label>

      <label class="review-field">
        <span class="review-label">{{ t('geels.originalSound') }} <em>{{ Math.round(originalVolume * 100) }}%</em></span>
        <input :value="originalVolume" type="range" min="0" max="1" step="0.05" class="review-range" @input="emit('update:originalVolume', Number(($event.target as HTMLInputElement).value))">
      </label>
      <label v-if="sound" class="review-field">
        <span class="review-label">{{ t('geels.addedSound') }} <em>{{ Math.round(soundVolume * 100) }}%</em></span>
        <input :value="soundVolume" type="range" min="0" max="1" step="0.05" class="review-range" @input="emit('update:soundVolume', Number(($event.target as HTMLInputElement).value))">
      </label>

      <textarea
        :value="caption"
        rows="4"
        maxlength="2200"
        class="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] p-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/25"
        :placeholder="t('geels.captionPlaceholder')"
        @input="emit('update:caption', ($event.target as HTMLTextAreaElement).value)"
      />

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="review-field">
          <span class="review-label">{{ t('geels.postAs') }}</span>
          <select v-model="channelID" class="review-select">
            <option v-for="channel in channels" :key="channel.id" :value="channel.id">{{ channel.name }}</option>
          </select>
        </label>
        <label class="review-field">
          <span class="review-label">{{ t('geels.whoCanWatch') }}</span>
          <select v-model="hidden" class="review-select">
            <option :value="false">{{ t('geels.public') }}</option>
            <option :value="true">{{ t('geels.unlisted') }}</option>
          </select>
        </label>
      </div>
      <label class="flex items-center gap-2 text-sm text-zinc-300">
        <input v-model="explicit" type="checkbox" class="h-4 w-4 accent-red-600">
        {{ t('geels.mature') }}
      </label>

      <p v-if="!channels.length" class="text-sm text-zinc-400">
        <NuxtLink :to="localePath('/create-channel')" class="font-semibold text-white underline">{{ t('geels.createChannelToPost') }}</NuxtLink>
      </p>
      <p v-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error }}</p>

      <div v-if="posting" class="space-y-2">
        <p class="text-sm font-semibold text-white">{{ progress < 1 ? `${t('geels.uploading')} ${Math.round(progress * 100)}%` : t('geels.composing') }}</p>
        <div class="h-1.5 overflow-hidden rounded-full bg-white/10"><div class="h-full bg-accent-500 transition-all" :style="{ width: `${Math.round(progress * 100)}%` }" /></div>
      </div>
      <button v-else type="button" class="w-full rounded-full bg-accent-600 py-3 text-sm font-extrabold text-white hover:bg-accent-500 disabled:opacity-40" :disabled="!channelID || !caption.trim()" @click="post">
        {{ t('geels.postGeel') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { postGeel, type GeelSound, type GeelWebClip } from '~/app/service/geels'
import { activeSubscriptionChannelID } from '~/app/service/subscriptions'
import { fetchUserChannels } from '~/app/service/upload'
import { resolveAvatarUrl } from '~/app/utils/media'

const props = defineProps<{
  clips: GeelWebClip[]
  sound: GeelSound | null
  soundStartMS: number
  soundVolume: number
  originalVolume: number
  caption: string
}>()
const emit = defineEmits<{
  (event: 'update:soundStartMS' | 'update:soundVolume' | 'update:originalVolume', value: number): void
  (event: 'update:caption', value: string): void
  (event: 'pick-sound' | 'back'): void
  (event: 'posted', videoID: string, channelID: string): void
}>()
const { t } = useI18n()
const localePath = useLocalePath()

const videoRef = ref<HTMLVideoElement | null>(null)
const index = ref(0)
const coverMode = ref(false)
const total = computed(() => props.clips.reduce((sum, clip) => sum + clip.duration / clip.speed, 0))
const coverSeconds = ref(0)
const soundStart = computed(() => props.soundStartMS / 1000)
const channels = ref<{ id: string; name: string }[]>([])
const channelID = ref('')
const hidden = ref(false)
const explicit = ref(false)
const posting = ref(false)
const progress = ref(0)
const error = ref('')
let audio: HTMLAudioElement | null = null

const current = computed(() => props.clips[index.value])
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
const before = (at: number) => props.clips.slice(0, at).reduce((sum, clip) => sum + clip.duration / clip.speed, 0)

// Plays clip `at` from `offset` seconds into its file, with the sound lined up.
const playFrom = (at: number, offset = 0, paused = false) => {
  const video = videoRef.value
  const clip = props.clips[at]
  if (!video || !clip) return
  index.value = at
  if (video.src !== clip.url) video.src = clip.url
  video.playbackRate = clip.speed
  video.volume = props.originalVolume
  video.currentTime = offset
  if (props.sound) {
    audio ??= new Audio()
    const src = resolveAvatarUrl(props.sound.audio_url)
    if (audio.src !== src) audio.src = src
    audio.volume = props.soundVolume
    audio.currentTime = soundStart.value + before(at) + offset / clip.speed
  }
  if (paused) {
    video.pause()
    audio?.pause()
  } else {
    void video.play().catch(() => undefined)
    if (props.sound) void audio?.play().catch(() => undefined)
  }
}

const next = () => { if (!coverMode.value) playFrom(index.value + 1 < props.clips.length ? index.value + 1 : 0) }
const restart = () => playFrom(0)

const showCover = () => {
  let at = 0
  let start = 0
  for (const [i, clip] of props.clips.entries()) {
    const length = clip.duration / clip.speed
    if (coverSeconds.value < start + length || i === props.clips.length - 1) { at = i; break }
    start += length
  }
  playFrom(at, Math.max(0, coverSeconds.value - start) * props.clips[at]!.speed, true)
}
const toggleCover = () => {
  coverMode.value = !coverMode.value
  if (coverMode.value) showCover()
  else restart()
}

watch(() => props.originalVolume, (value) => { if (videoRef.value) videoRef.value.volume = value })
watch(() => props.soundVolume, (value) => { if (audio) audio.volume = value })
watch(() => props.sound?.track_id, () => { audio?.pause(); audio = null; restart() })

const post = async () => {
  error.value = ''
  posting.value = true
  progress.value = 0
  videoRef.value?.pause()
  audio?.pause()
  try {
    const result = await postGeel({
      clips: props.clips,
      channelID: channelID.value,
      caption: props.caption,
      hidden: hidden.value,
      explicit: explicit.value,
      soundTrackID: props.sound?.track_id,
      soundStartMS: props.soundStartMS,
      soundVolume: props.soundVolume,
      originalVolume: props.originalVolume,
      coverMS: coverSeconds.value * 1000,
    }, (value) => { progress.value = value })
    emit('posted', result.video_id, channelID.value)
  } catch (cause: any) {
    error.value = cause?.response?.data?.error || t('geels.postFailed')
    posting.value = false
  }
}

onMounted(async () => {
  coverSeconds.value = Math.min(1, total.value / 2)
  restart()
  const userID = localStorage.getItem('user_id') || ''
  if (!userID) return
  try {
    const result = await fetchUserChannels(userID)
    channels.value = (result.channels || []).map((channel: any) => ({ id: channel.id, name: channel.name }))
    const preferred = activeSubscriptionChannelID()
    channelID.value = channels.value.find((channel) => channel.id === preferred)?.id || channels.value[0]?.id || ''
  } catch { /* no channels */ }
})
onBeforeUnmount(() => audio?.pause())
</script>

<style scoped>
.review { display: flex; height: 100%; width: 100%; max-width: 980px; gap: 28px; align-items: stretch; justify-content: center; }
.review-preview { position: relative; height: 100%; aspect-ratio: 9 / 16; flex-shrink: 0; overflow: hidden; border-radius: 18px; background: #000; }
.review-mirrored { transform: scaleX(-1); }
.review-badge { position: absolute; top: 10px; left: 10px; padding: 3px 10px; border-radius: 999px; background: rgb(var(--gt-accent-600, 220 38 38)); font-size: 11px; font-weight: 800; color: #fff; }
.review-panel { display: flex; min-width: 0; flex: 1; max-width: 420px; flex-direction: column; gap: 16px; overflow-y: auto; padding: 4px 2px 16px; }
.review-chip { display: inline-flex; max-width: 60%; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); font-size: 13px; font-weight: 700; color: #fff; }
.review-chip:hover { background: rgba(255, 255, 255, 0.14); }
.review-chip--on { background: rgb(var(--gt-accent-600, 220 38 38)); }
.review-field { display: flex; flex-direction: column; gap: 6px; }
.review-label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #fff; }
.review-label em { font-style: normal; font-weight: 600; color: rgb(var(--gt-zinc-400, 161 161 170)); font-variant-numeric: tabular-nums; }
.review-range { width: 100%; accent-color: rgb(var(--gt-accent-500, 239 68 68)); }
.review-select { border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); padding: 9px 10px; font-size: 14px; color: #fff; }
.review-select option { background: #18181b; }
@media (max-width: 767px) {
  .review { flex-direction: column; height: auto; gap: 16px; padding: 12px 16px 24px; }
  .review-preview { height: 56vh; align-self: center; }
  .review-panel { max-width: none; overflow: visible; }
}
</style>
