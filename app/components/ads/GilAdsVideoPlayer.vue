<template>
  <div class="relative">
    <div
      v-if="showPreroll && prerollAd?.creative"
      class="gilads-preroll-container overflow-hidden rounded-lg bg-black"
    >
      <div class="relative h-full w-full bg-black">
        <video
          ref="adVideoElement"
          class="video-js vjs-default-skin h-full w-full object-contain gilads-preroll-video"
          playsinline
          preload="auto"
        />
        <div class="gilads-preroll-controls">
          <div class="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent p-4">
            <div class="pointer-events-auto flex max-w-[calc(100%-4rem)] items-center gap-2 rounded-full border border-cyan-300/30 bg-black/60 px-3 py-1 text-xs text-cyan-200">
              <span class="shrink-0 font-medium">{{ t('ads.sponsored') }}</span>
              <span class="truncate font-medium normal-case tracking-normal text-white/85">{{ prerollAd.creative.headline || 'Sponsored video' }}</span>
            </div>
            <button
              type="button"
              class="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/70 text-sm font-bold text-white transition hover:bg-black"
              :aria-label="t('ads.about')"
              :title="t('ads.about')"
              @click="showSponsorInfo = true"
            >
              i
            </button>
          </div>

          <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-5">
            <a
              v-if="prerollAd.creative.destinationUrl"
              :href="prerollAd.creative.destinationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="pointer-events-auto inline-flex min-w-0 max-w-[60%] shrink items-center justify-center truncate rounded border border-cyan-300/30 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-cyan-500/30"
              @click="handleAdClick"
            >
              Visit sponsor
            </a>
            <span v-else />

            <button
              type="button"
              class="pointer-events-auto shrink-0 rounded border border-white/20 bg-black/85 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-75"
              :disabled="skipCountdown > 0"
              @click="finishPreroll"
            >
              {{ skipCountdown > 0 ? `Skip in ${skipCountdown}s` : 'Skip ad' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showIntroFrame"
      class="gilads-preroll-container playback-intro-container overflow-hidden rounded-lg bg-black"
    >
      <div v-if="showPlaybackIntro" ref="introHost" class="h-full w-full" />
      <button
        v-if="introMuted && !introNeedsTap"
        type="button"
        class="absolute left-5 top-5 rounded border border-white/20 bg-black/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
        @click="unmuteIntro"
      >
        🔇 {{ t('playbackIntro.unmute') }}
      </button>
      <button
        v-if="introNeedsTap"
        type="button"
        class="absolute inset-0 flex items-center justify-center bg-black/40 text-white"
        :aria-label="t('playbackIntro.play')"
        @click="playIntroElement"
      >
        <span class="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl text-black">▶</span>
      </button>
      <button
        v-if="introAllowSkip && showPlaybackIntro"
        type="button"
        class="absolute bottom-12 right-5 z-10 rounded border border-white/20 bg-black/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
        @click="finishPlaybackIntro"
      >
        {{ t('playbackIntro.skip') }}
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="showSponsorInfo && prerollAd?.creative"
        class="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
        style="z-index: 2147483647 !important; pointer-events: auto; overflow: visible;"
        @click.self="showSponsorInfo = false"
      >
        <div class="w-full max-w-md rounded-lg bg-zinc-800" style="z-index: 2147483647 !important; position: relative; overflow: visible;">
          <div class="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ t('ads.about') }}</h2>
            <button type="button" class="text-gray-400 hover:text-white" @click="showSponsorInfo = false">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4 px-6 py-4">
            <div>
              <p class="text-xs font-medium text-cyan-300/80">{{ t('ads.sponsoredVideo') }}</p>
              <h3 class="mt-1 text-base font-semibold text-white">{{ prerollAd.creative.headline || 'Sponsored video' }}</h3>
              <p v-if="prerollAd.creative.body" class="mt-2 text-sm text-zinc-300">{{ prerollAd.creative.body }}</p>
            </div>

            <div v-if="prerollAd.creative.destinationUrl" class="rounded border border-white/10 bg-zinc-900 p-3">
              <p class="text-xs text-zinc-500">{{ t('ads.sponsorLink') }}</p>
              <p class="mt-1 break-all text-sm text-zinc-200">{{ prerollAd.creative.destinationUrl }}</p>
            </div>

            <div class="flex justify-end">
              <a
                v-if="prerollAd.creative.destinationUrl"
                :href="prerollAd.creative.destinationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white"
                @click="handleAdClick"
              >
                Visit sponsor
              </a>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <VideoPlayer
      v-if="!showPreroll || !prerollAd?.creative"
      ref="videoPlayerRef"
      :standby="introBlocksContent"
      :class="{ 'playback-intro-standby': introBlocksContent }"
      :inert="introBlocksContent"
      :src="src"
      :status="status"
      :autoplay="autoplay"
      :episode-label="episodeLabel"
      :intro-start-seconds="introStartSeconds"
      :intro-end-seconds="introEndSeconds"
      :has-next-episode="hasNextEpisode"
      :next-episode-label="nextEpisodeLabel"
      :start-time-seconds="startTimeSeconds"
      :clip-mode="clipMode"
      :clip-start-seconds="clipStartSeconds"
      :clip-end-seconds="clipEndSeconds"
      :content-rating="contentRating"
      :content-warning="contentWarning"
      @play="$emit('play')"
      @ended="$emit('ended')"
      @next-episode="$emit('nextEpisode')"
      @progress="$emit('progress', $event)"
      @seeked="$emit('seeked', $event)"
      @hdrchange="$emit('hdrchange', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import {
  GILADS_PLACEMENTS,
  serveGilAd,
  trackGilAdEvent,
  type GilAdsServeResponse,
} from '~/app/service/gilads'
import { getPlaybackIntro, resolvePlaybackIntroSource } from '~/app/service/playbackIntro'
import {
  getPlaybackIntroElement,
  getPlaybackIntroPlayer,
  setPlaybackIntroActive,
  setPlaybackIntroPlayer,
} from '~/app/utils/playbackIntroElement'

const PLAYBACK_INTRO_VOLUME = 0.35

// Same volume control as the main player (video.js vertical volume panel);
// every other control is off, and clicks don't pause the intro.
const PLAYBACK_INTRO_PLAYER_OPTIONS = {
  controls: true,
  autoplay: false,
  preload: 'auto',
  fill: true,
  fluid: false,
  responsive: false,
  inactivityTimeout: 3000,
  bigPlayButton: false,
  userActions: { click: false, doubleClick: false, hotkeys: false },
  controlBar: {
    playToggle: false,
    progressControl: false,
    currentTimeDisplay: false,
    durationDisplay: false,
    timeDivider: false,
    remainingTimeDisplay: false,
    liveDisplay: false,
    seekToLive: false,
    pictureInPictureToggle: false,
    fullscreenToggle: false,
    playbackRateMenuButton: false,
    chaptersButton: false,
    descriptionsButton: false,
    subsCapsButton: false,
    audioTrackButton: false,
    volumePanel: {
      inline: false,
      vertical: true,
    },
  },
}

const { t } = useI18n()

interface Props {
  src?: string
  status?: string
  videoId?: string
  channelId?: string
  episodeLabel?: string
  introStartSeconds?: number
  introEndSeconds?: number
  hasNextEpisode?: boolean
  nextEpisodeLabel?: string
  startTimeSeconds?: number
  clipMode?: boolean
  clipStartSeconds?: number
  clipEndSeconds?: number
  autoplay?: boolean
  // Movies and series episodes may get the site-wide playback intro first.
  introCandidate?: boolean
  // The page sets introReady once it knows whether to suppress the intro
  // (resuming, or arriving via a manual "next episode" click).
  introReady?: boolean
  introSuppressed?: boolean
  contentRating?: { rating?: string, descriptors?: string[] } | null
  contentWarning?: '' | 'movie' | 'episode'
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  status: 'ready',
  videoId: '',
  channelId: '',
  episodeLabel: '',
  introStartSeconds: 0,
  introEndSeconds: 0,
  hasNextEpisode: false,
  nextEpisodeLabel: 'Next episode',
  startTimeSeconds: 0,
  clipMode: false,
  clipStartSeconds: 0,
  clipEndSeconds: 0,
  autoplay: true,
  introCandidate: false,
  introReady: true,
  introSuppressed: false,
  contentRating: null,
  contentWarning: '',
})

defineEmits<{
  play: []
  ended: []
  nextEpisode: []
  progress: [payload: { currentTime: number, duration: number }]
  seeked: [payload: { currentTime: number }]
  hdrchange: [playing: boolean]
}>()

const PREROLL_COOLDOWN_VIDEOS = 3
const PREROLL_COOLDOWN_MS = 0 * 60 * 1000
const PREROLL_CAP_KEY = 'giltube:gilads:preroll-cap:v1'
const MAX_PREROLL_FETCH_ATTEMPTS = 4

interface PrerollCapState {
  videosUntilNextAd: number
  lastAdAt: number
  lastVideoId: string
}

const prerollAd = ref<GilAdsServeResponse | null>(null)
const showPreroll = ref(false)
const impressionTracked = ref(false)
const videoViewTracked = ref(false)
const skipCountdown = ref(5)
const adVideoElement = ref<HTMLVideoElement | null>(null)
const showSponsorInfo = ref(false)
const videoPlayerRef = ref<any>(null)
let adPlayer: any = null

// Playback intro: 'pending' while we ask the backend whether this video gets
// one, 'playing' while it is shown (after any preroll ad), then 'done'.
const introState = ref<'pending' | 'playing' | 'done'>(props.introCandidate && props.videoId ? 'pending' : 'done')
const introSrc = ref('')
const introAllowSkip = ref(true)
const introNeedsTap = ref(false)
const introMuted = ref(false)
const introHost = ref<HTMLElement | null>(null)
let introElement: HTMLVideoElement | null = null
const introBlocksContent = computed(() => introState.value !== 'done')
// The black frame also covers the brief lookup, so the standby player behind
// it keeps real dimensions while it starts buffering.
const showIntroFrame = computed(() => introBlocksContent.value && !(showPreroll.value && prerollAd.value?.creative))
const showPlaybackIntro = computed(() => introState.value === 'playing' && Boolean(introSrc.value) && !(showPreroll.value && prerollAd.value?.creative))
let introLookupStarted = false
let releaseIntroSource = () => {}

const adContext = computed(() => ({
  videoId: props.videoId,
  channelId: props.channelId,
  page: 'watch',
}))

const defaultPrerollCapState = (): PrerollCapState => ({
  videosUntilNextAd: 0,
  lastAdAt: 0,
  lastVideoId: '',
})

const readPrerollCapState = (): PrerollCapState => {
  if (typeof window === 'undefined') return defaultPrerollCapState()

  try {
    const raw = window.localStorage.getItem(PREROLL_CAP_KEY)
    if (!raw) return defaultPrerollCapState()

    const parsed = JSON.parse(raw) as Partial<PrerollCapState>
    return {
      videosUntilNextAd: Math.max(0, Number(parsed.videosUntilNextAd || 0)),
      lastAdAt: Number(parsed.lastAdAt || 0),
      lastVideoId: String(parsed.lastVideoId || ''),
    }
  } catch {
    return defaultPrerollCapState()
  }
}

const writePrerollCapState = (state: PrerollCapState) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PREROLL_CAP_KEY, JSON.stringify(state))
}

const currentVideoKey = () => props.videoId || props.src || 'unknown-video'

defineExpose({
  setPlaybackTime: (seconds: number) => videoPlayerRef.value?.setPlaybackTime?.(seconds),
  playFrom: (seconds?: number) => videoPlayerRef.value?.playFrom?.(seconds),
  pauseAt: (seconds?: number) => {
    adPlayer?.pause?.()
    introElement?.pause()
    videoPlayerRef.value?.pauseAt?.(seconds)
  },
  getPlaybackState: () => videoPlayerRef.value?.getPlaybackState?.() || { currentTime: 0, duration: 0, paused: true },
})

const shouldRequestPrerollAd = () => {
  const state = readPrerollCapState()
  const videoKey = currentVideoKey()
  const isNewVideo = state.lastVideoId !== videoKey

  if (!isNewVideo) {
    return state.videosUntilNextAd <= 0 && Date.now() - state.lastAdAt >= PREROLL_COOLDOWN_MS
  }

  const nextState = {
    ...state,
    lastVideoId: videoKey,
    videosUntilNextAd: Math.max(0, state.videosUntilNextAd - 1),
  }
  writePrerollCapState(nextState)

  return nextState.videosUntilNextAd <= 0 && Date.now() - nextState.lastAdAt >= PREROLL_COOLDOWN_MS
}

const markPrerollShown = () => {
  writePrerollCapState({
    videosUntilNextAd: PREROLL_COOLDOWN_VIDEOS,
    lastAdAt: Date.now(),
    lastVideoId: currentVideoKey(),
  })
}

const creativeType = (candidate: GilAdsServeResponse | null) => {
  return String(candidate?.creative?.type || '').trim().toLowerCase()
}

const isPlayableVideoAd = (candidate: GilAdsServeResponse | null) => {
  return Boolean(
    candidate?.creative?.assetUrl && creativeType(candidate) === 'video'
  )
}

const loadVideoPrerollAd = async () => {
  for (let attempt = 0; attempt < MAX_PREROLL_FETCH_ATTEMPTS; attempt += 1) {
    const candidate = await serveGilAd({
      placement: GILADS_PLACEMENTS.videoPreroll,
      type: 'video',
      context: adContext.value,
    })

    if (!candidate?.creative) {
      return null
    }

    if (isPlayableVideoAd(candidate)) {
      return candidate
    }

    console.warn('Skipping non-video GilAds preroll creative:', candidate.creative.type, candidate.creative.id)
  }

  return null
}

const inferSourceType = (src: string) => {
  const normalized = (src.split('?')[0] ?? src).toLowerCase()
  if (normalized.endsWith('.m3u8')) return 'application/x-mpegURL'
  if (normalized.endsWith('.mp4') || normalized.endsWith('.m4v')) return 'video/mp4'
  if (normalized.endsWith('.webm')) return 'video/webm'
  if (normalized.endsWith('.mov')) return 'video/quicktime'
  return 'application/x-mpegURL'
}

const PLAYER_VOLUME_STORAGE_KEY = 'giltube:player-volume'
const PLAYER_MUTED_STORAGE_KEY = 'giltube:player-muted'

const clampVolume = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 1
  return Math.max(0, Math.min(1, numeric))
}

const readSavedPlayerVolume = () => {
  if (typeof window === 'undefined') {
    return { volume: 1, muted: false }
  }
  try {
    const savedVolume = window.localStorage.getItem(PLAYER_VOLUME_STORAGE_KEY)
    const savedMuted = window.localStorage.getItem(PLAYER_MUTED_STORAGE_KEY)
    return {
      volume: clampVolume(savedVolume ?? 1),
      muted: savedMuted === 'true',
    }
  } catch {
    return { volume: 1, muted: false }
  }
}

const persistPlayerVolume = () => {
  if (!adPlayer || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PLAYER_VOLUME_STORAGE_KEY, String(clampVolume(adPlayer.volume?.() ?? 1)))
    window.localStorage.setItem(PLAYER_MUTED_STORAGE_KEY, String(Boolean(adPlayer.muted?.())))
  } catch {
    // Ignore storage failures.
  }
}

const disposeAdPlayer = () => {
  if (adPlayer) {
    adPlayer.dispose()
    adPlayer = null
  }
}

const createAdPlayer = async () => {
  await nextTick()
  if (!props.autoplay || !adVideoElement.value || !isPlayableVideoAd(prerollAd.value)) return

  disposeAdPlayer()

  adPlayer = videojs(adVideoElement.value, {
    controls: true,
    autoplay: true,
    muted: false,
    preload: 'auto',
    fluid: false,
    fill: true,
    responsive: false,
    inactivityTimeout: 0,
    html5: {
      hls: {
        overrideNative: true,
        enableLowInitialPlaylist: false,
      },
    },
    controlBar: {
      playToggle: false,
      progressControl: false,
      currentTimeDisplay: false,
      durationDisplay: false,
      timeDivider: false,
      remainingTimeDisplay: false,
      liveDisplay: false,
      seekToLive: false,
      pictureInPictureToggle: false,
      fullscreenToggle: false,
      playbackRateMenuButton: false,
      chaptersButton: false,
      descriptionsButton: false,
      subsCapsButton: false,
      audioTrackButton: false,
      volumePanel: {
        inline: false,
        vertical: true,
      },
    },
  })

  adPlayer.ready(() => {
    if (!isPlayableVideoAd(prerollAd.value)) {
      disposeAdPlayer()
      showPreroll.value = false
      return
    }

    const savedAudioState = readSavedPlayerVolume()
    adPlayer.volume(savedAudioState.volume)
    adPlayer.muted(savedAudioState.muted)

    adPlayer.src({
      src: prerollAd.value?.creative?.assetUrl || '',
      type: inferSourceType(prerollAd.value?.creative?.assetUrl || ''),
    })

    adPlayer.on('play', handleAdPlay)
    adPlayer.on('timeupdate', handleAdTimeUpdate)
    adPlayer.on('ended', finishPreroll)
    adPlayer.on('volumechange', persistPlayerVolume)
    adPlayer.play()?.catch?.(() => {})
  })
}

const trackAdEvent = async (eventType: 'impression' | 'click' | 'video_view') => {
  if (!prerollAd.value?.creative?.id || creativeType(prerollAd.value) !== 'video') return
  try {
    await trackGilAdEvent({
      creativeId: prerollAd.value.creative.id,
      eventType,
      placement: GILADS_PLACEMENTS.videoPreroll,
      context: adContext.value,
    })
  } catch (error) {
    console.error(`Failed to track gilADS ${eventType}:`, error)
  }
}

const finishPreroll = () => {
  if (showPreroll.value && !videoViewTracked.value) {
    trackAdEvent('video_view')
    videoViewTracked.value = true
  }
  showPreroll.value = false
  showSponsorInfo.value = false
  disposeAdPlayer()
}

const handleAdPlay = async () => {
  if (!impressionTracked.value) {
    impressionTracked.value = true
    await trackAdEvent('impression')
  }
}

const handleAdTimeUpdate = async () => {
  if (!adPlayer) return

  const watchedSeconds = Math.floor(adPlayer.currentTime?.() || 0)
  skipCountdown.value = Math.max(0, 5 - watchedSeconds)

  if (!videoViewTracked.value && watchedSeconds >= 5) {
    videoViewTracked.value = true
    await trackAdEvent('video_view')
  }
}

const handleAdClick = () => {
  trackAdEvent('click')
}

const startPlaybackIntro = async () => {
  if (introLookupStarted || introState.value !== 'pending' || !props.introReady) return
  if (props.introSuppressed) {
    introState.value = 'done'
    return
  }
  if (!props.autoplay) return
  introLookupStarted = true
  try {
    const intro = await getPlaybackIntro(props.videoId)
    if (introState.value !== 'pending') return
    if (!intro.play || !intro.url) {
      introState.value = 'done'
      return
    }
    introAllowSkip.value = intro.allow_skip
    const source = await resolvePlaybackIntroSource(intro)
    if (introState.value !== 'pending') {
      source.release()
      return
    }
    releaseIntroSource = source.release
    introSrc.value = source.src
    introState.value = 'playing'
  } catch (error) {
    console.error('Failed to load playback intro:', error)
    introState.value = 'done'
  }
}

const isAutoplayBlocked = (error: unknown) => (error as DOMException)?.name === 'NotAllowedError'

// When sound was blocked, the first tap or key press anywhere turns it on.
const unmuteOnInteraction = () => unmuteIntro()
const stopUnmuteOnInteraction = () => {
  for (const event of ['pointerdown', 'touchend', 'keydown']) {
    document.removeEventListener(event, unmuteOnInteraction, true)
  }
}

const unmuteIntro = () => {
  if (!introElement) return
  introElement.muted = false
  introMuted.value = false
  stopUnmuteOnInteraction()
}

// Intro volume changes the visitor makes are saved for the main player too,
// but not the automatic mute applied when the browser blocks sound.
let introPlaybackStarted = false
let introAutoMuted = false

const handleIntroVolumeChange = () => {
  if (!introElement) return
  introMuted.value = introElement.muted
  if (!introElement.muted && introAutoMuted) {
    introAutoMuted = false
    stopUnmuteOnInteraction()
  }
  if (!introPlaybackStarted || introAutoMuted) return
  try {
    window.localStorage.setItem(PLAYER_VOLUME_STORAGE_KEY, String(clampVolume(introElement.volume)))
    window.localStorage.setItem(PLAYER_MUTED_STORAGE_KEY, String(introElement.muted))
  } catch {
    // Ignore storage failures.
  }
}

const handleIntroPlaying = () => {
  introPlaybackStarted = true
}

const playIntroElement = async () => {
  const element = introElement
  if (!element) return
  introNeedsTap.value = false
  try {
    await element.play()
    return
  } catch (error) {
    if (!isAutoplayBlocked(error)) {
      // Interrupted or not ready yet (not an autoplay block): retry with sound
      // once the media can play.
      element.addEventListener('canplay', () => {
        element.play().catch(() => { introNeedsTap.value = true })
      }, { once: true })
      return
    }
  }
  // The browser refused audible autoplay (no interaction with the page yet).
  // Play muted and restore sound on the visitor's first interaction.
  introAutoMuted = true
  element.muted = true
  introMuted.value = true
  for (const event of ['pointerdown', 'touchend', 'keydown']) {
    document.addEventListener(event, unmuteOnInteraction, true)
  }
  try {
    await element.play()
  } catch {
    introNeedsTap.value = true
  }
}

const finishPlaybackIntro = () => {
  if (introState.value === 'done') return
  stopUnmuteOnInteraction()
  introPlaybackStarted = false
  introAutoMuted = false
  if (introElement) {
    introElement.pause()
    introElement.removeEventListener('volumechange', handleIntroVolumeChange)
    introElement.removeEventListener('playing', handleIntroPlaying)
    introElement.removeEventListener('ended', finishPlaybackIntro)
    introElement.removeEventListener('error', finishPlaybackIntro)
    introElement.removeAttribute('src')
    introElement.load()
    getPlaybackIntroPlayer()?.el?.()?.remove()
    introElement = null
  }
  setPlaybackIntroActive(false)
  introState.value = 'done'
  introNeedsTap.value = false
  introMuted.value = false
  nextTick(() => {
    releaseIntroSource()
    releaseIntroSource = () => {}
  })
}

// Client-only: this callback creates a video.js player, and registering it on
// the server would pull video.js into the SSR bundle (it cannot load in Node).
if (process.client) watch(introHost, (host) => {
  if (!host || introElement) return
  // Reuse the app-wide element that was unlocked for audio by a user gesture,
  // wrapped once in a video.js player so its volume control matches the main
  // player's. The player is kept for the app's lifetime and re-attached here.
  const element = getPlaybackIntroElement()
  let introPlayer = getPlaybackIntroPlayer()
  if (introPlayer) {
    host.appendChild(introPlayer.el())
  } else {
    host.appendChild(element)
    introPlayer = videojs(element, PLAYBACK_INTRO_PLAYER_OPTIONS)
    setPlaybackIntroPlayer(introPlayer)
  }
  setPlaybackIntroActive(true)
  element.pause()
  element.muted = false
  // The intro is mixed louder than most content, so it always starts quieter.
  element.volume = PLAYBACK_INTRO_VOLUME
  element.addEventListener('ended', finishPlaybackIntro)
  element.addEventListener('error', finishPlaybackIntro)
  element.addEventListener('volumechange', handleIntroVolumeChange)
  element.addEventListener('playing', handleIntroPlaying)
  element.src = introSrc.value
  introElement = element
  introMuted.value = element.muted
  void playIntroElement()
})

watch(() => [props.autoplay, props.introReady, props.introSuppressed], () => {
  void startPlaybackIntro()
})

onMounted(async () => {
  void startPlaybackIntro()

  if (!props.autoplay) {
    return
  }

  if (!shouldRequestPrerollAd()) {
    return
  }

  prerollAd.value = await loadVideoPrerollAd()
  showPreroll.value = isPlayableVideoAd(prerollAd.value)

  if (showPreroll.value) {
    markPrerollShown()
    await createAdPlayer()
  }
})

onBeforeUnmount(() => {
  showSponsorInfo.value = false
  disposeAdPlayer()
  if (introState.value !== 'done') finishPlaybackIntro()
  releaseIntroSource()
})
</script>

<style scoped>
.gilads-preroll-container {
  position: relative;
  height: 250px;
}

/* The main player buffers behind the intro at the same size, so adaptive
   quality picks the rendition it will actually play. */
.playback-intro-standby {
  position: absolute;
  inset: 0;
  z-index: 0;
  /* opacity, unlike visibility, cannot be overridden by video.js controls. */
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.playback-intro-container {
  z-index: 1;
}

.gilads-preroll-controls {
  position: absolute;
  inset: 0;
  z-index: 2147483600;
  pointer-events: none;
}

@media (min-width: 768px) {
  .gilads-preroll-container {
    height: clamp(500px, 70vh, 780px);
  }
}

:deep(.gilads-preroll-video),
:deep(.video-js) {
  width: 100%;
  height: 100%;
  background: #000;
}

:deep(.gilads-preroll-video .vjs-tech),
:deep(.video-js .vjs-tech) {
  object-fit: contain;
}

:deep(.gilads-preroll-video .vjs-control-bar) {
  z-index: 15;
  display: flex !important;
  justify-content: flex-start;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78), transparent);
  pointer-events: auto;
}

:deep(.gilads-preroll-video .vjs-play-control),
:deep(.gilads-preroll-video .vjs-progress-control),
:deep(.gilads-preroll-video .vjs-current-time),
:deep(.gilads-preroll-video .vjs-duration),
:deep(.gilads-preroll-video .vjs-time-divider),
:deep(.gilads-preroll-video .vjs-remaining-time),
:deep(.gilads-preroll-video .vjs-picture-in-picture-control),
:deep(.gilads-preroll-video .vjs-fullscreen-control) {
  display: none !important;
}
</style>
