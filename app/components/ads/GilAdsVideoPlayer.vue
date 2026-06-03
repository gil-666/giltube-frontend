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
              <span class="shrink-0 font-semibold uppercase tracking-[0.18em]">Sponsored</span>
              <span class="truncate font-medium normal-case tracking-normal text-white/85">{{ prerollAd.creative.headline || 'Sponsored video' }}</span>
            </div>
            <button
              type="button"
              class="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/70 text-sm font-bold text-white transition hover:bg-black"
              aria-label="About this sponsor"
              title="About this sponsor"
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

    <Teleport to="body">
      <div
        v-if="showSponsorInfo && prerollAd?.creative"
        class="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
        style="z-index: 2147483647 !important; pointer-events: auto; overflow: visible;"
        @click.self="showSponsorInfo = false"
      >
        <div class="w-full max-w-md rounded-lg bg-zinc-800" style="z-index: 2147483647 !important; position: relative; overflow: visible;">
          <div class="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
            <h2 class="text-lg font-semibold text-white">About this sponsor</h2>
            <button type="button" class="text-gray-400 hover:text-white" @click="showSponsorInfo = false">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4 px-6 py-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Sponsored video</p>
              <h3 class="mt-1 text-base font-semibold text-white">{{ prerollAd.creative.headline || 'Sponsored video' }}</h3>
              <p v-if="prerollAd.creative.body" class="mt-2 text-sm text-zinc-300">{{ prerollAd.creative.body }}</p>
            </div>

            <div v-if="prerollAd.creative.destinationUrl" class="rounded border border-zinc-700 bg-zinc-900 p-3">
              <p class="text-xs uppercase tracking-[0.18em] text-zinc-500">Sponsor link</p>
              <p class="mt-1 break-all text-sm text-zinc-200">{{ prerollAd.creative.destinationUrl }}</p>
            </div>

            <div class="flex justify-end">
              <a
                v-if="prerollAd.creative.destinationUrl"
                :href="prerollAd.creative.destinationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
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
      :src="src"
      :status="status"
      :episode-label="episodeLabel"
      :intro-start-seconds="introStartSeconds"
      :intro-end-seconds="introEndSeconds"
      :has-next-episode="hasNextEpisode"
      :next-episode-label="nextEpisodeLabel"
      @play="$emit('play')"
      @ended="$emit('ended')"
      @next-episode="$emit('nextEpisode')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import {
  GILADS_PLACEMENTS,
  serveGilAd,
  trackGilAdEvent,
  type GilAdsServeResponse,
} from '~/app/service/gilads'

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
})

defineEmits<{
  play: []
  ended: []
  nextEpisode: []
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
let adPlayer: any = null

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

const disposeAdPlayer = () => {
  if (adPlayer) {
    adPlayer.dispose()
    adPlayer = null
  }
}

const createAdPlayer = async () => {
  await nextTick()
  if (!adVideoElement.value || !isPlayableVideoAd(prerollAd.value)) return

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

    adPlayer.src({
      src: prerollAd.value?.creative?.assetUrl || '',
      type: inferSourceType(prerollAd.value?.creative?.assetUrl || ''),
    })

    adPlayer.on('play', handleAdPlay)
    adPlayer.on('timeupdate', handleAdTimeUpdate)
    adPlayer.on('ended', finishPreroll)
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

onMounted(async () => {
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
})
</script>

<style scoped>
.gilads-preroll-container {
  position: relative;
  height: 250px;
}

.gilads-preroll-controls {
  position: absolute;
  inset: 0;
  z-index: 2147483600;
  pointer-events: none;
}

@media (min-width: 768px) {
  .gilads-preroll-container {
    height: 500px;
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
