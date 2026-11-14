<template>
  <article class="geel-slide" :class="{ 'geel-slide--active': active }">
    <div class="geel-stage">
      <div
        ref="cardRef"
        class="geel-card"
        @pointerup="onCardPointerUp"
      >
        <img
          v-if="posterUrl"
          :src="posterUrl"
          alt=""
          class="geel-poster"
          :class="{ 'geel-poster--hidden': hasFrame }"
          draggable="false"
        >
        <video
          ref="videoRef"
          class="geel-video"
          playsinline
          loop
          preload="auto"
          :muted="muted"
          disablepictureinpicture
          @playing="onPlaying"
          @pause="paused = true"
          @timeupdate="onTimeUpdate"
          @loadeddata="hasFrame = true"
          @waiting="buffering = true"
          @canplay="buffering = false"
        />

        <div class="geel-shade" aria-hidden="true" />

        <!-- Paused / buffering indicators -->
        <Transition name="geel-fade">
          <div v-if="active && paused && userPaused && !autoplayBlocked" class="geel-center-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="h-10 w-10" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" /></svg>
          </div>
        </Transition>
        <div v-if="active && !suspended && !userPaused && !autoplayBlocked && (paused || buffering)" class="geel-spinner" aria-hidden="true" />

        <button v-if="active && autoplayBlocked" type="button" class="geel-unmute-pill" @click.stop="startWithSound">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" /></svg>
          {{ t('geels.tapToPlay') }}
        </button>

        <!-- Double-tap hearts -->
        <span
          v-for="burst in bursts"
          :key="burst.id"
          class="geel-burst"
          :style="{ left: `${burst.x}px`, top: `${burst.y}px`, '--geel-tilt': `${burst.tilt}deg` }"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" class="geel-burst-heart" fill="currentColor"><path :d="heartPath" /></svg>
          <i v-for="n in 6" :key="n" class="geel-burst-dot" :style="{ '--geel-angle': `${n * 60 + burst.tilt}deg` }" />
        </span>

        <!-- Top controls -->
        <div class="geel-top">
          <button
            v-if="hasCaptions"
            type="button"
            class="geel-icon-button geel-cc"
            :class="{ 'geel-cc--on': captionsOn }"
            :aria-label="captionsOn ? t('geels.captionsOff') : t('geels.captionsOn')"
            :aria-pressed="captionsOn"
            @click.stop="toggleCaptions"
            @pointerup.stop
          >CC</button>
          <button type="button" class="geel-icon-button" :aria-label="muted ? t('geels.unmute') : t('geels.mute')" @click.stop="emit('toggle-mute')">
            <svg v-if="muted" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5 6 9H3v6h3l5 4V5Zm5 4.5 5 5m0-5-5 5" /></svg>
            <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" /></svg>
          </button>
        </div>

        <!-- Caption, creator, sound -->
        <div class="geel-info" @pointerup.stop>
          <p v-if="captionsOn && captionText" class="geel-subtitle" aria-live="polite"><span>{{ captionText }}</span></p>
          <div class="flex min-w-0 items-center gap-2.5">
            <NuxtLink :to="localePath(`/channel/${geel.channel_id}`)" class="flex min-w-0 items-center gap-2.5">
              <img v-if="avatarUrl" :src="avatarUrl" alt="" class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/20">
              <span v-else class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold">{{ initial }}</span>
              <span class="truncate text-[15px] font-semibold text-white">@{{ geel.channel.name }}</span>
              <svg v-if="geel.channel.verified" viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-sky-400" fill="currentColor" :aria-label="t('geels.verified')"><path d="M12 2 14.4 4.2l3.2-.4.9 3.1 2.9 1.5-1 3.1 1 3.1-2.9 1.5-.9 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.9-3.1-2.9-1.5 1-3.1-1-3.1 2.9-1.5.9-3.1 3.2.4L12 2Zm-1.2 13.4 5.6-5.6-1.4-1.4-4.2 4.2-2-2-1.4 1.4 3.4 3.4Z" /></svg>
            </NuxtLink>
            <button
              v-if="!isOwnGeel"
              type="button"
              class="geel-subscribe"
              :class="{ 'geel-subscribe--on': subscribed }"
              :disabled="subscribing"
              @click="toggleSubscribe"
            >
              {{ subscribed ? t('geels.subscribed') : t('geels.subscribe') }}
            </button>
          </div>

          <p class="geel-caption" :class="{ 'geel-caption--open': captionOpen }" @click="captionOpen = !captionOpen">
            <span class="font-semibold">{{ geel.title }}</span>
            <template v-if="extraCaption">{{ ' ' + extraCaption }}</template>
          </p>

          <NuxtLink v-if="geel.sound" :to="localePath(`/geels/sound/${geel.sound.track_id}`)" class="geel-sound-line">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="currentColor"><path d="M9 18V5.25l10.5-1.5V16.5a2.25 2.25 0 1 1-1.5-2.12V6.98L10.5 8.04V18a2.25 2.25 0 1 1-1.5-2.12" /></svg>
            <span class="geel-marquee"><span :class="{ 'geel-marquee-run': active }">{{ soundLabel }} · {{ soundLabel }} · </span></span>
          </NuxtLink>
        </div>

        <!-- Progress -->
        <div
          class="geel-progress"
          role="slider"
          :aria-label="t('geels.seek')"
          :aria-valuenow="Math.round(progress * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
          @pointerdown.stop="startScrub"
          @pointerup.stop
        >
          <div class="geel-progress-track"><div class="geel-progress-fill" :style="{ transform: `scaleX(${progress})` }" /></div>
        </div>
      </div>

      <!-- Action rail -->
      <div class="geel-rail">
        <button type="button" class="geel-action" :class="{ 'geel-action--liked': geel.liked }" :aria-pressed="geel.liked" @click="toggleLike()">
          <span class="geel-action-icon" :class="{ 'geel-pop': likePop }" @animationend="likePop = false">
            <svg viewBox="0 0 24 24" class="h-7 w-7" :fill="geel.liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.9"><path stroke-linejoin="round" :d="heartPath" /></svg>
            <template v-if="likePop">
              <i v-for="n in 8" :key="n" class="geel-spark" :style="{ '--geel-angle': `${n * 45}deg` }" />
              <i class="geel-ring" />
            </template>
          </span>
          <span class="geel-action-label">{{ formatGeelCount(geel.likes, locale) }}</span>
        </button>

        <button type="button" class="geel-action" :class="{ 'geel-action--disliked': geel.disliked }" :aria-pressed="geel.disliked" @click="toggleDislike">
          <span class="geel-action-icon" :class="{ 'geel-shake': dislikeShake }" @animationend="dislikeShake = false">
            <svg viewBox="0 0 24 24" class="h-7 w-7" :fill="geel.disliked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.9"><path stroke-linejoin="round" d="M7.5 15h-3a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5h3M7.5 15V3.75m0 11.25 3.27 5.73a1.6 1.6 0 0 0 2.98-.8V16.5h4.6a2.1 2.1 0 0 0 2.06-2.52l-1.35-6.75A2.1 2.1 0 0 0 17 5.5h-1.75L12 3.75H7.5" /></svg>
          </span>
          <span class="geel-action-label">{{ geel.dislikes > 0 ? formatGeelCount(geel.dislikes, locale) : t('geels.dislike') }}</span>
        </button>

        <button type="button" class="geel-action" @click="emit('open-comments', geel)">
          <span class="geel-action-icon">
            <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.9"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 12c0 4.14-3.69 7.5-8.25 7.5-1.3 0-2.53-.27-3.62-.76L3.75 20.25l1.4-3.74A7.07 7.07 0 0 1 3.75 12c0-4.14 3.69-7.5 8.25-7.5s8.25 3.36 8.25 7.5Z" /></svg>
          </span>
          <span class="geel-action-label">{{ formatGeelCount(geel.comments_count, locale) }}</span>
        </button>

        <button type="button" class="geel-action" @click="share">
          <span class="geel-action-icon">
            <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.9"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12l-7.5 7.5v-4.25C8 15.25 5 17 3 20.25 3.75 14 7 9.5 13.5 8.75V4.5Z" /></svg>
          </span>
          <span class="geel-action-label">{{ shareCopied ? t('geels.copied') : t('geels.share') }}</span>
        </button>

        <NuxtLink
          v-if="geel.sound"
          :to="localePath(`/geels/sound/${geel.sound.track_id}`)"
          class="geel-disc"
          :class="{ 'geel-disc--spin': active && !paused }"
          :aria-label="t('geels.useSound')"
        >
          <img v-if="soundCover" :src="soundCover" alt="" class="h-full w-full rounded-full object-cover">
          <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M9 18V5.25l10.5-1.5V16.5a2.25 2.25 0 1 1-1.5-2.12V6.98L10.5 8.04V18a2.25 2.25 0 1 1-1.5-2.12" /></svg>
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatGeelCount, geelPoster, recordGeelView, setGeelReaction, type Geel } from '~/app/service/geels'
import { activeSubscriptionChannelID, getChannelSubscription, subscribeToChannel, unsubscribeFromChannel } from '~/app/service/subscriptions'
import { resolveAvatarUrl, resolveMediaUrl } from '~/app/utils/media'

const props = defineProps<{
  geel: Geel
  active: boolean
  /** Comments open or tab hidden: pause without rewinding. */
  suspended?: boolean
  preload: boolean
  muted: boolean
  loggedIn: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle-mute'): void
  (event: 'unmute'): void
  (event: 'open-comments', geel: Geel): void
  (event: 'need-login'): void
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const heartPath = 'M12 20.25s-7.5-4.6-9.17-9.4C1.6 7.3 3.86 4 7.13 4c2.03 0 3.48 1.1 4.87 2.9C13.39 5.1 14.84 4 16.87 4c3.27 0 5.53 3.3 4.3 6.85C19.5 15.65 12 20.25 12 20.25Z'

const videoRef = ref<HTMLVideoElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)
const paused = ref(true)
const buffering = ref(false)
const hasFrame = ref(false)
const progress = ref(0)
const autoplayBlocked = ref(false)
const captionOpen = ref(false)
const likePop = ref(false)
const dislikeShake = ref(false)
const shareCopied = ref(false)
const reacting = ref(false)
const bursts = ref<{ id: number; x: number; y: number; tilt: number }[]>([])
const subscribed = ref(false)
const subscribing = ref(false)
let subscriptionLoaded = false
let hls: { destroy: () => void } | null = null
let viewTimer: ReturnType<typeof setTimeout> | null = null
let viewRecorded = false
let watchedRatio = 0
let loops = 0
const captionText = ref('')
const hasCaptions = ref(false)
const captionsOn = ref(true)
const CAPTIONS_KEY = 'giltube_geels_captions'
let captionTrack: TextTrack | null = null
let tapTimer: ReturnType<typeof setTimeout> | null = null
let lastTapAt = 0
let burstSeq = 0
// Paused by the viewer (tap / Space), as opposed to loading or buffering.
const userPaused = ref(false)

const posterUrl = computed(() => geelPoster(props.geel))
const avatarUrl = computed(() => resolveAvatarUrl(props.geel.channel.avatar_url))
const initial = computed(() => (props.geel.channel.name || '?').slice(0, 1).toUpperCase())
const soundCover = computed(() => props.geel.sound?.cover_url ? resolveAvatarUrl(props.geel.sound.cover_url) : '')
const soundLabel = computed(() => props.geel.sound ? `${props.geel.sound.title} — ${props.geel.sound.artist_name}` : '')
const extraCaption = computed(() => {
  const description = (props.geel.description || '').trim()
  if (!description) return ''
  return description.startsWith(props.geel.title) ? description.slice(props.geel.title.length).trim() : description
})
const isOwnGeel = computed(() => {
  if (typeof window === 'undefined') return false
  const userID = localStorage.getItem('user_id') || ''
  return !!userID && props.geel.channel.user_id === userID
})

// ---- playback -------------------------------------------------------------

const attach = async () => {
  const video = videoRef.value
  if (!video || hls || video.src) return
  const src = resolveMediaUrl(props.geel.hls_path)
  if (!src) return
  // hls.js wherever Media Source works;
  // native HLS only where it doesn't (iOS Safari).
  const { default: Hls } = await import('hls.js')
  if (!videoRef.value || hls || videoRef.value.src) return
  if (!Hls.isSupported()) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = src
    return
  }
  // No capLevelToPlayerSize: master playlists list nominal landscape sizes
  // (1920x1080 for a 608x1080 portrait rendition), so it would pick a rung
  // far below the screen. Bandwidth alone decides.
  const instance = new Hls({ maxBufferLength: 20, startLevel: -1, abrEwmaDefaultEstimate: 2_500_000 })
  instance.subtitleDisplay = false
  instance.on(Hls.Events.MANIFEST_PARSED, () => {
    const tracks = instance.subtitleTracks || []
    if (!tracks.length) return
    const language = (navigator.language || '').slice(0, 2).toLowerCase()
    let index = tracks.findIndex((track) => (track.lang || '').toLowerCase().startsWith(language))
    if (index < 0) index = Math.max(0, tracks.findIndex((track) => track.default))
    instance.subtitleTrack = index
    instance.subtitleDisplay = false
  })
  instance.loadSource(src)
  instance.attachMedia(videoRef.value)
  hls = instance
}

const detach = () => {
  captionTrack?.removeEventListener('cuechange', onCueChange)
  captionTrack = null
  captionText.value = ''
  hls?.destroy()
  hls = null
  const video = videoRef.value
  if (video) {
    video.pause()
    video.removeAttribute('src')
    video.load()
  }
  hasFrame.value = false
  progress.value = 0
}

const play = async () => {
  const video = videoRef.value
  if (!video) return
  await attach()
  try {
    await video.play()
    autoplayBlocked.value = false
    // Paused (comments opened, scrolled away) while play() was pending.
    if (!props.active || props.suspended || userPaused.value) video.pause()
  } catch (error) {
    // pause() during a pending play() rejects it: not an autoplay block.
    if ((error as DOMException)?.name === 'AbortError' || !props.active || props.suspended) return
    // Browsers refuse unmuted autoplay before any interaction: retry muted.
    if (!video.muted) {
      video.muted = true
      try {
        await video.play()
        autoplayBlocked.value = false
        emit('toggle-mute')
        return
      } catch { /* fall through */ }
    }
    autoplayBlocked.value = true
    paused.value = true
  }
}

const startWithSound = () => {
  autoplayBlocked.value = false
  if (props.muted) emit('unmute')
  void nextTick(() => void play())
}

const syncPlayback = async (active: boolean, preload: boolean, suspended = false) => {
  if (active && suspended) {
    videoRef.value?.pause()
    return
  }
  if (active) {
    if (userPaused.value) return
    await play()
    void loadSubscription()
  } else {
    videoRef.value?.pause()
    if (viewTimer) clearTimeout(viewTimer)
    viewTimer = null
    if (viewRecorded) void recordGeelView(props.geel.id, watchedRatio)
    viewRecorded = false
    watchedRatio = 0
    loops = 0
    if (preload) {
      await attach()
      if (videoRef.value) videoRef.value.currentTime = 0
    } else {
      detach()
    }
  }
}

// Not `immediate`: the <video> element only exists once mounted.
watch(() => [props.active, props.preload, props.suspended] as const, ([active, preload, suspended], previous) => {
  if (previous && previous[0] && !active) userPaused.value = false
  void syncPlayback(active, preload, suspended)
})
onMounted(() => {
  try { captionsOn.value = localStorage.getItem(CAPTIONS_KEY) !== '0' } catch { /* private mode */ }
  const tracks = videoRef.value?.textTracks
  tracks?.addEventListener('addtrack', syncCaptionTracks)
  tracks?.addEventListener('change', syncCaptionTracks)
  void syncPlayback(props.active, props.preload, props.suspended)
})

watch(() => props.muted, (muted) => {
  if (videoRef.value) videoRef.value.muted = muted
})

const onPlaying = () => {
  paused.value = false
  buffering.value = false
  if (!viewRecorded && !viewTimer) {
    viewTimer = setTimeout(() => {
      viewTimer = null
      viewRecorded = true
      void recordGeelView(props.geel.id, watchedRatio)
    }, 2000)
  }
}

const onTimeUpdate = () => {
  const video = videoRef.value
  if (!video || !(video.duration > 0)) return
  const ratio = Math.min(video.currentTime / video.duration, 1)
  // A wrap-around means the Geel looped: it was watched through.
  if (ratio + 0.5 < progress.value) loops += 1
  progress.value = ratio
  watchedRatio = loops > 0 ? 1 : Math.max(watchedRatio, ratio)
}

// ---- captions ----------------------------------------------------------
// The browser would draw them at the very bottom, under the caption and
// creator. Keep the track hidden (cues still load) and draw them ourselves
// just above the info block.

const pickCaptionTrack = (tracks: TextTrack[]) => {
  const language = (navigator.language || '').slice(0, 2).toLowerCase()
  return tracks.find((track) => (track.language || '').toLowerCase().startsWith(language))
    || tracks.find((track) => track.mode === 'showing')
    || tracks[0]
}

const cueText = (cues: TextTrackCueList | null) => Array.from(cues || [])
  .map((cue) => ((cue as VTTCue).text || '').replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').trim())
  .filter(Boolean)
  .join('\n')

const onCueChange = () => { captionText.value = cueText(captionTrack?.activeCues || null) }

const syncCaptionTracks = () => {
  const video = videoRef.value
  if (!video) return
  const tracks = Array.from(video.textTracks).filter((track) => track.kind === 'subtitles' || track.kind === 'captions')
  hasCaptions.value = tracks.length > 0
  const chosen = tracks.length ? pickCaptionTrack(tracks) : null
  if (chosen !== captionTrack) {
    captionTrack?.removeEventListener('cuechange', onCueChange)
    captionTrack = chosen
    captionTrack?.addEventListener('cuechange', onCueChange)
  }
  for (const track of tracks) {
    const mode = track === captionTrack && captionsOn.value ? 'hidden' : 'disabled'
    if (track.mode !== mode) track.mode = mode
  }
  if (!captionsOn.value) captionText.value = ''
}

const toggleCaptions = () => {
  captionsOn.value = !captionsOn.value
  try { localStorage.setItem(CAPTIONS_KEY, captionsOn.value ? '1' : '0') } catch { /* private mode */ }
  syncCaptionTracks()
  onCueChange()
}

const togglePlay = () => {
  const video = videoRef.value
  if (!video) return
  if (video.paused) {
    userPaused.value = false
    void play()
  } else {
    userPaused.value = true
    video.pause()
  }
}

// Single tap pauses; a second tap within 280 ms likes instead.
const onCardPointerUp = (event: PointerEvent) => {
  if (event.button !== 0 || autoplayBlocked.value) return
  const now = Date.now()
  if (now - lastTapAt < 280) {
    if (tapTimer) clearTimeout(tapTimer)
    tapTimer = null
    lastTapAt = 0
    addBurst(event)
    if (!props.geel.liked) void toggleLike(true)
    return
  }
  lastTapAt = now
  tapTimer = setTimeout(() => {
    tapTimer = null
    togglePlay()
  }, 280)
}

const addBurst = (event: PointerEvent) => {
  const rect = cardRef.value?.getBoundingClientRect()
  if (!rect) return
  const id = ++burstSeq
  bursts.value.push({ id, x: event.clientX - rect.left, y: event.clientY - rect.top, tilt: Math.round(Math.random() * 40 - 20) })
  setTimeout(() => { bursts.value = bursts.value.filter((burst) => burst.id !== id) }, 950)
}

let scrubbing = false
const scrubTo = (event: PointerEvent, target: HTMLElement) => {
  const video = videoRef.value
  if (!video || !(video.duration > 0)) return
  const rect = target.getBoundingClientRect()
  const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
  video.currentTime = ratio * video.duration
  progress.value = ratio
}
const startScrub = (event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement
  scrubbing = true
  target.setPointerCapture(event.pointerId)
  scrubTo(event, target)
  const move = (moveEvent: PointerEvent) => { if (scrubbing) scrubTo(moveEvent, target) }
  const end = () => {
    scrubbing = false
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', end)
    target.removeEventListener('pointercancel', end)
  }
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', end)
  target.addEventListener('pointercancel', end)
}

// ---- reactions ------------------------------------------------------------

const applyReaction = (state: { likes: number; dislikes?: number; liked: boolean; disliked?: boolean }) => {
  props.geel.likes = state.likes
  props.geel.liked = state.liked
  if (typeof state.dislikes === 'number') props.geel.dislikes = state.dislikes
  if (typeof state.disliked === 'boolean') props.geel.disliked = state.disliked
}

const toggleLike = async (forceOn = false) => {
  if (!props.loggedIn) {
    emit('need-login')
    return
  }
  if (reacting.value) return
  const on = forceOn || !props.geel.liked
  if (on === props.geel.liked) return
  const previous = { likes: props.geel.likes, dislikes: props.geel.dislikes, liked: props.geel.liked, disliked: props.geel.disliked }
  // Optimistic: animate right away.
  applyReaction({
    likes: Math.max(0, props.geel.likes + (on ? 1 : -1)),
    dislikes: on && props.geel.disliked ? Math.max(0, props.geel.dislikes - 1) : props.geel.dislikes,
    liked: on,
    disliked: on ? false : props.geel.disliked,
  })
  if (on) likePop.value = true
  reacting.value = true
  try {
    applyReaction(await setGeelReaction(props.geel.id, 'like', on))
    if (on) props.geel.disliked = false
  } catch {
    applyReaction(previous)
  } finally {
    reacting.value = false
  }
}

const toggleDislike = async () => {
  if (!props.loggedIn) {
    emit('need-login')
    return
  }
  if (reacting.value) return
  const on = !props.geel.disliked
  const previous = { likes: props.geel.likes, dislikes: props.geel.dislikes, liked: props.geel.liked, disliked: props.geel.disliked }
  applyReaction({
    likes: on && props.geel.liked ? Math.max(0, props.geel.likes - 1) : props.geel.likes,
    dislikes: Math.max(0, props.geel.dislikes + (on ? 1 : -1)),
    liked: on ? false : props.geel.liked,
    disliked: on,
  })
  if (on) dislikeShake.value = true
  reacting.value = true
  try {
    applyReaction(await setGeelReaction(props.geel.id, 'dislike', on))
  } catch {
    applyReaction(previous)
  } finally {
    reacting.value = false
  }
}

// ---- subscribe / share ----------------------------------------------------

const loadSubscription = async () => {
  if (subscriptionLoaded || !props.loggedIn || isOwnGeel.value) return
  subscriptionLoaded = true
  try {
    const state = await getChannelSubscription(props.geel.channel_id, activeSubscriptionChannelID())
    subscribed.value = state.subscribed
  } catch { /* leave as not subscribed */ }
}

const toggleSubscribe = async () => {
  if (!props.loggedIn) {
    emit('need-login')
    return
  }
  subscribing.value = true
  try {
    const actor = activeSubscriptionChannelID()
    const state = subscribed.value
      ? await unsubscribeFromChannel(props.geel.channel_id, actor)
      : await subscribeToChannel(props.geel.channel_id, actor)
    subscribed.value = state.subscribed
  } catch { /* keep state */ } finally {
    subscribing.value = false
  }
}

const share = async () => {
  const url = `${window.location.origin}${localePath(`/geels/${props.geel.id}`)}`
  try {
    if (navigator.share) {
      await navigator.share({ title: props.geel.title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    shareCopied.value = true
    setTimeout(() => { shareCopied.value = false }, 1800)
  } catch { /* cancelled */ }
}

defineExpose({ togglePlay, toggleLike, seekBy: (seconds: number) => {
  const video = videoRef.value
  if (video && video.duration > 0) video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration)
} })

onBeforeUnmount(() => {
  if (viewRecorded) void recordGeelView(props.geel.id, watchedRatio)
  videoRef.value?.textTracks?.removeEventListener('addtrack', syncCaptionTracks)
  videoRef.value?.textTracks?.removeEventListener('change', syncCaptionTracks)
  if (viewTimer) clearTimeout(viewTimer)
  if (tapTimer) clearTimeout(tapTimer)
  detach()
})
</script>

<style scoped>
.geel-slide {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.geel-stage {
  position: relative;
  display: flex;
  height: 100%;
  align-items: flex-end;
  gap: 14px;
}

.geel-card {
  position: relative;
  height: 100%;
  aspect-ratio: 9 / 16;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  border-radius: calc(18px * var(--gt-radius-scale, 1));
  background: #000;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
}

.geel-poster,
.geel-video {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.geel-poster { filter: blur(0); transition: opacity 0.25s ease; }
.geel-poster--hidden { opacity: 0; }

.geel-shade {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent 18%),
    linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.18) 34%, transparent 52%);
}

.geel-center-icon {
  pointer-events: none;
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  height: 76px;
  width: 76px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.42);
  color: #fff;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(6px);
}

.geel-spinner {
  pointer-events: none;
  position: absolute;
  left: 50%;
  top: 50%;
  height: 44px;
  width: 44px;
  margin: -22px 0 0 -22px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  /* Appears after a moment, so quick loads don't flash it. */
  animation: geel-spin 0.8s linear infinite, geel-spinner-in 0.15s ease-out 0.25s both;
}
@keyframes geel-spinner-in { from { opacity: 0; } to { opacity: 1; } }

.geel-unmute-pill {
  position: absolute;
  left: 50%;
  top: 50%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(8px);
}

.geel-top {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  gap: 8px;
}

.geel-icon-button {
  display: flex;
  height: 38px;
  width: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  backdrop-filter: blur(6px);
  transition: background 0.15s ease;
}
.geel-icon-button:hover { background: rgba(0, 0, 0, 0.55); }

.geel-info {
  position: absolute;
  bottom: 18px;
  left: 14px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #fff;
  cursor: default;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.geel-subtitle {
  align-self: center;
  max-width: 100%;
  margin-bottom: 6px;
  text-align: center;
  white-space: pre-line;
  text-shadow: none;
}
.geel-subtitle span {
  display: inline;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.62);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.55;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
.geel-cc { font-size: 12px; font-weight: 900; letter-spacing: 0.02em; opacity: 0.75; }
.geel-cc--on { opacity: 1; background: rgba(255, 255, 255, 0.92); color: #0a0a0a; }
.geel-cc--on:hover { background: #fff; }

.geel-subscribe {
  flex-shrink: 0;
  padding: 6px 13px;
  border-radius: 999px;
  background: #fff;
  color: #0a0a0a;
  font-size: 13px;
  font-weight: 800;
  text-shadow: none;
  transition: transform 0.15s ease, background 0.15s ease;
}
.geel-subscribe:active { transform: scale(0.94); }
.geel-subscribe--on { background: rgba(255, 255, 255, 0.18); color: #fff; }

.geel-caption {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 14px;
  line-height: 1.35;
  white-space: pre-line;
  cursor: pointer;
}
.geel-caption--open { -webkit-line-clamp: 12; }

.geel-sound-line {
  display: flex;
  max-width: 78%;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.geel-marquee {
  overflow: hidden;
  white-space: nowrap;
  mask-image: linear-gradient(to right, #000 85%, transparent);
}
.geel-marquee > span { display: inline-block; }
.geel-marquee-run { animation: geel-marquee 9s linear infinite; }

.geel-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 14px;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
  touch-action: none;
}
.geel-progress-track {
  height: 3px;
  width: 100%;
  background: rgba(255, 255, 255, 0.25);
  transition: height 0.15s ease;
}
.geel-progress:hover .geel-progress-track { height: 6px; }
.geel-progress-fill {
  height: 100%;
  width: 100%;
  background: #fff;
  transform-origin: left;
}

/* Action rail: beside the card on wide screens, over it on phones. */
.geel-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-bottom: 6px;
}

.geel-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: rgb(var(--gt-zinc-100, 244 244 245));
}

.geel-action-icon {
  position: relative;
  display: flex;
  height: 50px;
  width: 50px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  transition: background 0.15s ease, transform 0.12s ease;
}
.geel-action:hover .geel-action-icon { background: rgba(255, 255, 255, 0.16); }
.geel-action:active .geel-action-icon { transform: scale(0.9); }
.geel-action-label { font-size: 12px; font-weight: 700; }
.geel-action--liked .geel-action-icon { color: rgb(var(--gt-accent-500, 239 68 68)); }
.geel-action--disliked .geel-action-icon { color: #fff; background: rgba(255, 255, 255, 0.24); }

.geel-disc {
  display: flex;
  height: 46px;
  width: 46px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px;
  background: conic-gradient(from 0deg, #27272a, #52525b, #27272a, #52525b, #27272a);
  color: #fff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.geel-disc--spin { animation: geel-spin 4.5s linear infinite; }

/* Like button: pop, ring and sparks. */
.geel-pop svg { animation: geel-pop 0.45s cubic-bezier(0.2, 1.6, 0.4, 1); }
.geel-ring {
  pointer-events: none;
  position: absolute;
  inset: 4px;
  border-radius: 999px;
  border: 2px solid rgb(var(--gt-accent-500, 239 68 68));
  animation: geel-ring 0.5s ease-out forwards;
}
.geel-spark {
  pointer-events: none;
  position: absolute;
  left: 50%;
  top: 50%;
  height: 6px;
  width: 6px;
  margin: -3px;
  border-radius: 999px;
  background: rgb(var(--gt-accent-400, 248 113 113));
  animation: geel-spark 0.55s ease-out forwards;
}
.geel-spark:nth-child(even) { background: #fbbf24; }
.geel-shake svg { animation: geel-shake 0.4s ease; }

/* Double-tap heart. */
.geel-burst {
  pointer-events: none;
  position: absolute;
  height: 0;
  width: 0;
}
.geel-burst-heart {
  position: absolute;
  left: -48px;
  top: -48px;
  height: 96px;
  width: 96px;
  color: rgb(var(--gt-accent-500, 239 68 68));
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.35));
  animation: geel-burst 0.9s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
}
.geel-burst-dot {
  position: absolute;
  height: 9px;
  width: 9px;
  margin: -4.5px;
  border-radius: 999px;
  background: rgb(var(--gt-accent-400, 248 113 113));
  animation: geel-burst-dot 0.7s ease-out forwards;
}
.geel-burst-dot:nth-child(odd) { background: #fbbf24; }

.geel-fade-enter-active, .geel-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.geel-fade-enter-from, .geel-fade-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }

@keyframes geel-spin { to { transform: rotate(360deg); } }
@keyframes geel-marquee { to { transform: translateX(-50%); } }
@keyframes geel-pop {
  0% { transform: scale(1); }
  35% { transform: scale(1.38); }
  100% { transform: scale(1); }
}
@keyframes geel-ring {
  0% { opacity: 0.9; transform: scale(0.6); }
  100% { opacity: 0; transform: scale(1.5); }
}
@keyframes geel-spark {
  0% { opacity: 1; transform: rotate(var(--geel-angle)) translateY(0) scale(1); }
  100% { opacity: 0; transform: rotate(var(--geel-angle)) translateY(-34px) scale(0.4); }
}
@keyframes geel-shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-14deg) translateY(2px); }
  60% { transform: rotate(10deg); }
}
@keyframes geel-burst {
  0% { opacity: 0; transform: rotate(var(--geel-tilt)) scale(0.2); }
  18% { opacity: 1; transform: rotate(var(--geel-tilt)) scale(1.2); }
  32% { transform: rotate(var(--geel-tilt)) scale(0.95); }
  60% { opacity: 1; transform: rotate(var(--geel-tilt)) scale(1) translateY(0); }
  100% { opacity: 0; transform: rotate(var(--geel-tilt)) scale(1.1) translateY(-90px); }
}
@keyframes geel-burst-dot {
  0% { opacity: 0; transform: rotate(var(--geel-angle)) translateY(0); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--geel-angle)) translateY(-70px) scale(0.3); }
}

@media (max-width: 767px) {
  .geel-stage { width: 100%; }
  .geel-card {
    width: 100%;
    max-width: none;
    aspect-ratio: auto;
    border-radius: 0;
  }
  .geel-rail {
    position: absolute;
    right: 8px;
    bottom: 96px;
    z-index: 2;
    gap: 14px;
  }
  .geel-action { color: #fff; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); }
  .geel-action-icon { height: 44px; width: 44px; background: transparent; }
  .geel-action:hover .geel-action-icon { background: transparent; }
  .geel-action-icon svg { height: 32px; width: 32px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5)); }
  .geel-info { right: 72px; bottom: 16px; }
  .geel-top { top: max(env(safe-area-inset-top), 10px); }
}

@media (prefers-reduced-motion: reduce) {
  .geel-disc--spin, .geel-marquee-run { animation: none; }
}
</style>
