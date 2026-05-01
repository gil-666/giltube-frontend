<template>
  <main class="min-h-screen bg-zinc-950 text-white">
    <div class="mx-auto max-w-8xl px-6 py-8 lg:py-10">
      <div class="flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ t('home.title') }}</h1>
        </div>
        <NuxtLink :to="localePath('/search')" class="text-sm text-zinc-400 hover:text-white">{{ t('home.searchAll') }}</NuxtLink>
      </div>

      <div v-if="isLoading" class="mt-8 space-y-8">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div class="aspect-video animate-pulse rounded-xl bg-white/10" />
          <div class="mt-4 h-5 w-2/5 animate-pulse rounded bg-white/10" />
          <div class="mt-2 h-4 w-1/3 animate-pulse rounded bg-white/10" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div v-for="n in 8" :key="n" class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="aspect-video animate-pulse rounded-xl bg-white/10" />
            <div class="mt-3 h-4 w-4/5 animate-pulse rounded bg-white/10" />
            <div class="mt-2 h-3 w-2/5 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>

      <div v-else-if="loadError" class="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-100">
        {{ loadError }}
      </div>

      <div v-else-if="recommendedVideos.length === 0" class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 class="text-xl font-semibold">{{ t('home.noVideos') }}</h2>
        <p class="mt-2 text-sm text-zinc-400">{{ t('home.noVideosBody') }}</p>
        <NuxtLink :to="localePath('/upload')" class="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200">
          {{ t('home.uploadVideo') }}
        </NuxtLink>
      </div>

      <div v-else class="mt-8 space-y-10">
        <section v-if="liveStreams.length > 0">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold">{{ t('home.nowLive') }}</h2>
              <p class="text-sm text-zinc-400">{{ t('home.nowLiveBody') }}</p>
            </div>
            <div class="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('live', -1)"
              >
                ‹
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('live', 1)"
              >
                ›
              </button>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:hidden">
            <VideoTile
              v-for="video in liveStreams.slice(0, 6)"
              :key="video.channel_id"
              :video="video"
              :live-href="localePath(`/live/${video.channel?.id}`)"
            />
          </div>
          <div class="hidden xl:block">
            <div :ref="setCarouselRef('live')" class="homepage-carousel flex gap-6 overflow-x-auto scroll-smooth pb-2">
              <div v-for="video in liveStreams" :key="video.id" class="homepage-carousel-item shrink-0">
                <VideoTile :video="video" :live-href="localePath(`/live/${video.channel?.id}`)" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-4 flex items-center justify-between gap-4">
            <h2 class="text-lg font-semibold">{{ t('home.recommended') }}</h2>
            <div class="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('recommended', -1)"
              >
                ‹
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('recommended', 1)"
              >
                ›
              </button>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:hidden">
            <VideoTile v-for="video in recommendedVideos" :key="video.id" :video="video" />
          </div>
          <div class="hidden xl:block">
            <div :ref="setCarouselRef('recommended')" class="homepage-carousel flex gap-6 overflow-x-auto scroll-smooth pb-2">
              <div v-for="video in recommendedVideos" :key="video.id" class="homepage-carousel-item shrink-0">
                <VideoTile :video="video" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold">{{ t('home.trending') }}</h3>
            </div>
            <div class="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('trending', -1)"
              >
                ‹
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('trending', 1)"
              >
                ›
              </button>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:hidden">
            <VideoTile v-for="video in trendingVideos" :key="video.id" :video="video" />
          </div>
          <div class="hidden xl:block">
            <div :ref="setCarouselRef('trending')" class="homepage-carousel flex gap-6 overflow-x-auto scroll-smooth pb-2">
              <div v-for="video in trendingVideos" :key="video.id" class="homepage-carousel-item shrink-0">
                <VideoTile :video="video" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-4 flex items-center justify-between gap-4">
              <h3 class="text-lg font-semibold">{{ t('home.trustedChannels') }}</h3>
            <div class="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('trusted', -1)"
              >
                ‹
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('trusted', 1)"
              >
                ›
              </button>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:hidden">
            <VideoTile v-for="video in trustedVideos" :key="video.id" :video="video" />
          </div>
          <div class="hidden xl:block">
            <div :ref="setCarouselRef('trusted')" class="homepage-carousel flex gap-6 overflow-x-auto scroll-smooth pb-2">
              <div v-for="video in trustedVideos" :key="video.id" class="homepage-carousel-item shrink-0">
                <VideoTile :video="video" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-4 flex items-center justify-between gap-4">
              <h3 class="text-lg font-semibold">{{ t('home.recentUploads') }}</h3>
            <div class="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('fresh', -1)"
              >
                ‹
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('fresh', 1)"
              >
                ›
              </button>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:hidden">
            <VideoTile v-for="video in freshVideos" :key="video.id" :video="video" />
          </div>
          <div class="hidden xl:block">
            <div :ref="setCarouselRef('fresh')" class="homepage-carousel flex gap-6 overflow-x-auto scroll-smooth pb-2">
              <div v-for="video in freshVideos" :key="video.id" class="homepage-carousel-item shrink-0">
                <VideoTile :video="video" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-4 flex items-end justify-between">
            <div>
              <h3 class="text-lg font-semibold">{{ t('home.allVideos') }}</h3>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <VideoTile v-for="video in browseVideos" :key="video.id" :video="video" />
          </div>

          <div ref="sentinelElement" class="h-1" />

          <div v-if="isLoadingMore" class="mt-6 flex justify-center">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white/60" />
          </div>

          <div v-if="!hasMore && browseVideos.length > 0" class="mt-6 text-center text-sm text-zinc-400">
            {{ t('home.noMoreVideos') }}
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { defineComponent, h, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { getVideos } from '~/app/service/videos'
import { listActiveLiveStreams } from '~/app/service/live'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const { t } = useI18n()
const localePath = useLocalePath()
const recommendationSourceVideos = ref([])
const liveStreams = ref([])
const browseVideos = ref([])
const recommendedVideos = ref([])
const trendingVideos = ref([])
const trustedVideos = ref([])
const freshVideos = ref([])
const liveChannelIds = ref(new Set())
const isLoading = ref(true)
const isLoadingMore = ref(false)
const currentPage = ref(0)
const pageSize = 24
const hasMore = ref(true)
const loadError = ref('')
const sentinelElement = ref(null)
let intersectionObserver = null
const carouselContainers = {}

const isChannelLive = (channelId) => liveChannelIds.value.has(channelId)

const setCarouselRef = (key) => (element) => {
  if (!element) {
    delete carouselContainers[key]
    return
  }

  carouselContainers[key] = element
}

const scrollCarousel = (key, direction) => {
  const element = carouselContainers[key]
  if (!element) return

  element.scrollBy({
    left: direction * element.clientWidth,
    behavior: 'smooth',
  })
}

const loadLiveChannels = () => {
  const active = listActiveLiveStreams()
  liveChannelIds.value = new Set((active || []).map((entry) => entry.channel_id))
}

const getThumbnailUrl = (video) => {
  if (!video?.thumbnail_url) return `${baseUrl}/videos/placeholder-thumbnail.jpg`
  if (video.thumbnail_url.startsWith('http')) return video.thumbnail_url
  return `${baseUrl}${video.thumbnail_url}`
}

const getLiveStartedAgo = (startedAt) => {
  if (!startedAt) return t('home.startedJustNow')
  const diffMs = Date.now() - new Date(startedAt).getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return t('home.startedJustNow')

  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000))
  if (totalMinutes < 1) return t('home.startedJustNow')
  if (totalMinutes < 60) return t('home.startedMinutesAgo', { count: totalMinutes })

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) {
    return minutes > 0
      ? t('home.startedHoursMinutesAgo', { hours, minutes })
      : t('home.startedHoursAgo', { hours })
  }

  const days = Math.floor(hours / 24)
  return t('home.startedDaysAgo', { days })
}

const formatRecommendationScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'Score 0.00'
  return `Score ${score.toFixed(2)}`
}

const clamp01 = (value) => Math.min(1, Math.max(0, value))

const logNormalize = (value, maxValue) => {
  if (!maxValue || maxValue <= 0) return 0
  return Math.log1p(Math.max(0, value)) / Math.log1p(maxValue)
}

const daysSince = (dateString) => {
  const time = new Date(dateString).getTime()
  if (Number.isNaN(time)) return 3650
  return Math.max(0, (Date.now() - time) / 86400000)
}

const buildRecommendationProfile = (video, maxValues) => {
  const views = Number(video.views || 0)
  const likes = Number(video.likes || 0)
  const ageHours = Math.max((Date.now() - new Date(video.created_at).getTime()) / 3600000, 0)
  const recency = clamp01(Math.exp(-ageHours / 72))

  const popularity = clamp01(
    (logNormalize(views, maxValues.views) * 0.62) +
    (logNormalize(likes, maxValues.likes) * 0.23) +
    (clamp01(likes / Math.max(views, 25)) * 0.15)
  )

  const channelAge = clamp01(1 - Math.exp(-daysSince(video.channel?.created_at) / 180))
  const trust = clamp01(
    (video.channel?.verified ? 0.72 : 0.28) +
    (channelAge * 0.28)
  )

  const score = clamp01((popularity * 0.46) + (trust * 0.28) + (recency * 0.26))
  const reason = getRecommendationReason({ popularity, trust, recency })

  return {
    popularity,
    trust,
    recency,
    score,
    reason,
  }
}

const getRecommendationReason = ({ popularity, trust, recency }) => {
  const best = Math.max(popularity, trust, recency)
  if (best === trust) return t('home.trustedChannel')
  if (best === recency) return t('home.freshUpload')
  return t('home.popularRightNow')
}

const diversifyByChannel = (items, limit) => {
  const remaining = [...items]
  const selected = []
  const channelCounts = new Map()

  while (remaining.length && selected.length < limit) {
    let bestIndex = 0
    let bestAdjustedScore = -Infinity

    for (let i = 0; i < remaining.length; i += 1) {
      const item = remaining[i]
      const channelId = item.channel?.id || item.channel_id || item.id
      const repeatCount = channelCounts.get(channelId) || 0
      const adjustedScore = item._recommendation.score * Math.pow(0.82, repeatCount)

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore
        bestIndex = i
      }
    }

    const [picked] = remaining.splice(bestIndex, 1)
    selected.push(picked)
    const channelId = picked.channel?.id || picked.channel_id || picked.id
    channelCounts.set(channelId, (channelCounts.get(channelId) || 0) + 1)
  }

  return selected
}

const buildCollections = (pool) => {
  if (!pool.length) {
    recommendedVideos.value = []
    trendingVideos.value = []
    trustedVideos.value = []
    freshVideos.value = []
    return
  }

  const maxValues = pool.reduce((acc, video) => ({
    views: Math.max(acc.views, Number(video.views || 0)),
    likes: Math.max(acc.likes, Number(video.likes || 0)),
  }), { views: 0, likes: 0 })

  const enriched = pool.map((video) => ({
    ...video,
    _recommendation: buildRecommendationProfile(video, maxValues),
  }))

  const byScore = [...enriched].sort((a, b) => b._recommendation.score - a._recommendation.score)
  recommendedVideos.value = diversifyByChannel(byScore, 12)
  trendingVideos.value = [...enriched].sort((a, b) => b._recommendation.popularity - a._recommendation.popularity).slice(0, 12)
  trustedVideos.value = [...enriched].sort((a, b) => b._recommendation.trust - a._recommendation.trust).slice(0, 12)
  freshVideos.value = [...enriched].sort((a, b) => b._recommendation.recency - a._recommendation.recency).slice(0, 12)
}

useMetaTags({
  title: 'GilTube - ' + t('home.recommended'),
  description: t('home.description')
})

const loadHomeFeed = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const [recommendedPool, activeLive] = await Promise.all([
      getVideos({ limit: 48, offset: 0 }),
      listActiveLiveStreams(),
    ])

    recommendationSourceVideos.value = recommendedPool || []
    liveStreams.value = (activeLive || []).slice(0, 12)
    liveChannelIds.value = new Set((activeLive || []).map((entry) => entry.channel_id))
    buildCollections(recommendationSourceVideos.value)
    browseVideos.value = recommendationSourceVideos.value.slice(0, pageSize)
    currentPage.value = 1
    hasMore.value = recommendationSourceVideos.value.length > pageSize
  } catch (err) {
    console.error('Failed to load home feed:', err)
    loadError.value = t('home.loadError')
  } finally {
    isLoading.value = false
  }
}

const loadMoreVideos = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  try {
    const offset = currentPage.value * pageSize
    const newVideos = await getVideos({ limit: pageSize, offset })

    if (!Array.isArray(newVideos) || newVideos.length === 0) {
      hasMore.value = false
      return
    }

    browseVideos.value = [...browseVideos.value, ...newVideos]
    currentPage.value += 1
    hasMore.value = newVideos.length === pageSize
  } catch (err) {
    console.error('Failed to load more videos:', err)
  } finally {
    isLoadingMore.value = false
  }
}

const setupIntersectionObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  if (!sentinelElement.value) return

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadMoreVideos()
        }
      }
    },
    { rootMargin: '200px' }
  )

  intersectionObserver.observe(sentinelElement.value)
}

const VideoTile = defineComponent({
  name: 'VideoTile',
  props: {
    video: {
      type: Object,
      required: true,
    },
    liveHref: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const isLiveCard = () => !!props.liveHref || !!props.video.is_live

    const getChannelLink = () => {
      const channelId = props.video.channel?.id
      if (props.liveHref) return props.liveHref
      if (!channelId) return '/'
      return isChannelLive(channelId) ? localePath(`/live/${channelId}`) : localePath(`/channel/${channelId}`)
    }

    const getVideoLink = () => props.liveHref || localePath(`/video/${props.video.id}`)

    const is4K = () => props.video.width == 3840
    const is8K = () => props.video.width == 7680

    return () => h('article', { class: 'group overflow-hidden rounded-2xl border border-white/10 bg-white/5' }, [
      h(NuxtLink, { to: getVideoLink(), class: 'block' }, () => [
        h('div', { class: 'relative aspect-video bg-black' }, [
          h('img', {
            src: getThumbnailUrl(props.video),
            alt: props.video.title,
            class: 'h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]',
          }),
          is8K()
            ? h('div', { class: 'absolute right-2 top-2 rounded border border-green-700 bg-green-900 px-1.5 py-0.5 text-xs font-semibold text-green-200' }, '8K')
            : is4K()
              ? h('div', { class: 'absolute right-2 top-2 rounded border border-green-700 bg-green-900 px-1.5 py-0.5 text-xs font-semibold text-green-200' }, '4K')
              : null,
        ]),
      ]),
      h('div', { class: 'p-4' }, [
        h('div', { class: 'flex gap-3' }, [
          h(NuxtLink, { to: getChannelLink(), class: 'relative block h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-700' }, () => [
            props.video.channel?.avatar_url && typeof props.video.channel.avatar_url === 'string' && props.video.channel.avatar_url.trim()
              ? h('img', {
                  src: props.video.channel.avatar_url.startsWith('http') ? props.video.channel.avatar_url : `${baseUrl}${props.video.channel.avatar_url}`,
                  alt: props.video.channel.name,
                  class: 'h-full w-full object-cover',
                })
              : h('div', { class: 'flex h-full w-full items-center justify-center text-xs font-bold text-white' }, props.video.channel?.name?.charAt(0)?.toUpperCase?.() || 'C'),
            isChannelLive(props.video.channel?.id)
              ? h('span', {
                  class: 'absolute inset-x-0 bottom-0 flex justify-center bg-red-600/95 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white',
                }, 'LIVE')
              : null,
          ]),
          h('div', { class: 'min-w-0 flex-1' }, [
            h(NuxtLink, { to: getVideoLink(), class: 'block' }, () => [
              h('h3', { class: 'line-clamp-2 text-sm font-medium leading-5 text-white' }, props.video.title),
            ]),
            h(NuxtLink, { to: getChannelLink(), class: 'mt-1 flex items-center gap-1 text-xs text-zinc-400 hover:text-white' }, () => [
              h('span', props.video.channel.name),
              h(VerifiedBadge, { verified: props.video.channel?.verified || false, size: 'sm' }),
            ]),
            h(
              'p',
              { class: 'mt-2 text-xs text-zinc-500' },
              isLiveCard()
                ? t('home.liveStats', { count: Number(props.video.watching_now || 0), started: getLiveStartedAgo(props.video.started_at) })
                : t('home.videoStats', { views: formatViews(props.video.views), time: getTimeAgo(props.video.created_at) })
            ),
          ]),
        ]),
      ]),
    ])
  },
})

onMounted(async () => {
  await loadHomeFeed()
  await nextTick()
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})

</script>

<style scoped>
.homepage-carousel {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.homepage-carousel::-webkit-scrollbar {
  display: none;
}

.homepage-carousel-item {
  display: flex;
  width: calc((100% - 7.5rem) / 6);
  align-self: stretch;
}
</style>
