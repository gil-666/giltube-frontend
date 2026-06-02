<template>
  <div class="relative">
    <div
      v-if="showPreroll && prerollAd?.creative"
      class="overflow-hidden rounded-2xl border border-cyan-400/20 bg-black shadow-[0_30px_90px_rgba(6,182,212,0.16)]"
    >
      <div class="relative aspect-video bg-black">
        <video
          ref="adVideoElement"
          class="h-full w-full object-contain"
          :src="prerollAd.creative.assetUrl"
          autoplay
          playsinline
          controls
          @play="handleAdPlay"
          @timeupdate="handleAdTimeUpdate"
          @ended="finishPreroll"
        />
        <div class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/75 to-transparent p-4">
          <div class="pointer-events-auto rounded-full border border-cyan-300/30 bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Sponsored
          </div>
          <button
            type="button"
            class="pointer-events-auto rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="skipCountdown > 0"
            @click="finishPreroll"
          >
            {{ skipCountdown > 0 ? `Skip in ${skipCountdown}s` : 'Skip ad' }}
          </button>
        </div>
        <a
          v-if="prerollAd.creative.destinationUrl"
          :href="prerollAd.creative.destinationUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="absolute bottom-4 right-4 rounded-full border border-cyan-300/30 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-cyan-500/30"
          @click="handleAdClick"
        >
          Visit sponsor
        </a>
      </div>
      <div class="border-t border-white/10 bg-zinc-950/90 px-4 py-3">
        <p class="text-sm font-semibold text-white">{{ prerollAd.creative.headline || 'Sponsored video' }}</p>
        <p v-if="prerollAd.creative.body" class="mt-1 text-sm text-zinc-300">{{ prerollAd.creative.body }}</p>
      </div>
    </div>

    <VideoPlayer
      v-else
      :src="src"
      :status="status"
      @play="$emit('play')"
      @ended="$emit('ended')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  status: 'ready',
  videoId: '',
  channelId: '',
})

defineEmits<{
  play: []
  ended: []
}>()

const prerollAd = ref<GilAdsServeResponse | null>(null)
const showPreroll = ref(false)
const impressionTracked = ref(false)
const videoViewTracked = ref(false)
const skipCountdown = ref(5)
const adVideoElement = ref<HTMLVideoElement | null>(null)

const adContext = computed(() => ({
  videoId: props.videoId,
  channelId: props.channelId,
  page: 'watch',
}))

const trackAdEvent = async (eventType: 'impression' | 'click' | 'video_view') => {
  if (!prerollAd.value?.creative?.id) return
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
}

const handleAdPlay = async () => {
  if (!impressionTracked.value) {
    impressionTracked.value = true
    await trackAdEvent('impression')
  }
}

const handleAdTimeUpdate = async () => {
  if (!adVideoElement.value) return

  const watchedSeconds = Math.floor(adVideoElement.value.currentTime)
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
  prerollAd.value = await serveGilAd({
    placement: GILADS_PLACEMENTS.videoPreroll,
    type: 'video',
    context: adContext.value,
  })

  showPreroll.value = Boolean(prerollAd.value?.creative?.assetUrl)
})
</script>
