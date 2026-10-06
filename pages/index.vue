<template>
  <main class="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
    <div class="mx-auto max-w-[110rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div v-if="isLoading" class="space-y-8">
        <div class="home-hero animate-pulse bg-white/[0.04]" />
        <div class="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          <div v-for="n in 10" :key="n">
            <div class="aspect-video animate-pulse rounded-xl bg-white/[0.06]" />
            <div class="mt-3 h-4 w-4/5 animate-pulse rounded bg-white/[0.06]" />
            <div class="mt-2 h-3 w-2/5 animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
      </div>

      <div v-else-if="loadError && featuredItems.length === 0" class="rounded-xl border border-white/[0.07] bg-white/[0.03] p-6 text-sm text-zinc-300">
        {{ loadError }}
      </div>

      <div v-else-if="!isSabrinaTube && !secondaryHomeLoading && featuredItems.length === 0 && recommendedVideos.length === 0 && publicWatchParties.length === 0 && homeMovies.length === 0 && homeSeries.length === 0" class="rounded-xl border border-white/[0.07] bg-white/[0.03] p-10 text-center">
        <h2 class="text-xl font-semibold">{{ t('home.noVideos') }}</h2>
        <p class="mt-2 text-sm text-zinc-400">{{ t('home.noVideosBody') }}</p>
        <NuxtLink :to="localePath('/upload')" class="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200">
          {{ t('home.uploadVideo') }}
        </NuxtLink>
      </div>

      <div v-else class="home-sections space-y-10 lg:space-y-12">
        <section v-if="featuredItems.length" class="home-hero gt-media text-white" :aria-label="activeFeatured.title">
          <Transition name="featured-fade" mode="out-in">
            <div :key="activeFeatured.id" class="absolute inset-0">
              <img :src="featuredImage(activeFeatured)" :alt="activeFeatured.title" class="h-full w-full object-cover" fetchpriority="high" />
              <div class="home-hero__shade" />
            </div>
          </Transition>
          <div class="relative z-10 flex h-full max-w-2xl flex-col justify-end p-6 sm:p-10 lg:p-12">
            <p v-if="featuredEyebrow(activeFeatured)" class="home-hero__eyebrow" :class="{ 'is-live': activeFeatured.is_live }">
              <span v-if="activeFeatured.is_live" class="home-live-dot" aria-hidden="true" />
              {{ featuredEyebrow(activeFeatured) }}
            </p>
            <h1 class="text-3xl font-bold leading-tight sm:text-5xl">{{ activeFeatured.title }}</h1>
            <p v-if="activeFeatured.description" class="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">{{ activeFeatured.description }}</p>
            <p v-if="activeFeatured.content_type === 'live' && activeFeatured.scheduled_for && !activeFeatured.is_live" class="mt-3 text-sm text-zinc-300">{{ formatFeaturedDate(activeFeatured.scheduled_for) }}</p>
            <div class="mt-6">
              <NuxtLink :to="localePath(activeFeatured.target_url)" class="home-hero__action">
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" /></svg>
                {{ activeFeatured.action_text || t('home.play') }}
              </NuxtLink>
            </div>
          </div>
          <div v-if="featuredItems.length > 1" class="absolute bottom-6 right-6 z-20 flex gap-1.5">
            <button
              v-for="(item, index) in featuredItems"
              :key="item.id"
              type="button"
              :aria-label="t('home.showSlide', { index: index + 1 })"
              :aria-current="index === featuredIndex"
              class="h-1.5 rounded-full transition-all"
              :class="index === featuredIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'"
              @click="featuredIndex = index"
            />
          </div>
        </section>

        <section v-if="isSabrinaTube && (sabrinaVideosLoading || sabrinaVideos.length > 0)" class="sabrina-video-shelf">
          <div class="mb-4 flex items-end justify-between gap-4">
            <div>
              <p class="sabrina-video-shelf__eyebrow">{{ t('home.sabrinaSpotlight') }}</p>
              <h2 class="text-xl font-semibold">{{ t('home.sabrinaRecommendations') }}</h2>
            </div>
            <ShelfArrows carousel="sabrina" />
          </div>
          <div class="-mx-6 px-6 sm:mx-0 sm:px-0">
            <div v-if="sabrinaVideosLoading" class="sabrina-video-grid homepage-carousel overflow-hidden pb-3" aria-hidden="true">
              <div v-for="n in 12" :key="n" class="sabrina-video-grid__item">
                <div class="w-full">
                  <div class="aspect-video animate-pulse rounded-xl bg-white/[0.06]" />
                  <div class="mt-3 h-4 w-4/5 animate-pulse rounded bg-white/[0.06]" />
                </div>
              </div>
            </div>
            <div v-else :ref="setCarouselRef('sabrina')" class="sabrina-video-grid homepage-carousel overflow-x-auto scroll-smooth pb-3">
              <div v-for="(video, index) in sabrinaVideos" :key="video.id" class="sabrina-video-grid__item">
                <VideoTile :video="video" :eager="index < 2" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section v-if="continueWatchingItems.length > 0">
          <ShelfHeader :title="t('home.continueWatching')" carousel="continue" />
          <div :ref="setCarouselRef('continue')" class="homepage-carousel">
            <div v-for="(item, index) in continueWatchingItems" :key="item.video.id" class="homepage-carousel-item homepage-carousel-item--wide">
              <ContinueTile :item="item" :eager="index === 0" />
            </div>
          </div>
        </section>

        <section v-if="moviesHomeLoading || homeMovies.length > 0">
          <ShelfHeader :title="t('home.movies')" :href="localePath('/category/movies')" carousel="movies" :disabled="moviesHomeLoading" />
          <div v-if="moviesHomeLoading" class="homepage-carousel overflow-hidden" aria-hidden="true">
            <div v-for="n in 8" :key="n" class="homepage-carousel-item homepage-carousel-item--poster">
              <div class="aspect-[2/3] w-full animate-pulse rounded-xl bg-white/[0.06]" />
            </div>
          </div>
          <div v-else :ref="setCarouselRef('movies')" class="homepage-carousel">
            <div v-for="movie in homeMovies" :key="movie.id" class="homepage-carousel-item homepage-carousel-item--poster">
              <MediaPosterTile :item="movie" />
            </div>
          </div>
        </section>

        <section v-if="seriesHomeLoading || homeSeries.length > 0">
          <ShelfHeader :title="t('home.series')" :href="localePath('/category/series')" carousel="series" :disabled="seriesHomeLoading" />
          <div v-if="seriesHomeLoading" class="homepage-carousel overflow-hidden" aria-hidden="true">
            <div v-for="n in 8" :key="n" class="homepage-carousel-item homepage-carousel-item--poster">
              <div class="aspect-[2/3] w-full animate-pulse rounded-xl bg-white/[0.06]" />
            </div>
          </div>
          <div v-else :ref="setCarouselRef('series')" class="homepage-carousel">
            <div v-for="series in homeSeries" :key="series.id" class="homepage-carousel-item homepage-carousel-item--poster">
              <MediaPosterTile :item="series" />
            </div>
          </div>
        </section>

        <section v-if="publicWatchParties.length > 0">
          <ShelfHeader :title="t('home.watchParties')" carousel="watch-parties" />
          <div :ref="setCarouselRef('watch-parties')" class="homepage-carousel">
            <div v-for="party in publicWatchParties" :key="party.id" class="homepage-carousel-item">
              <WatchPartyTile :party="party" />
            </div>
          </div>
        </section>

        <section v-if="liveStreams.length > 0">
          <ShelfHeader :title="t('home.nowLive')" carousel="live" />
          <div :ref="setCarouselRef('live')" class="homepage-carousel">
            <div v-for="video in liveStreams" :key="video.id" class="homepage-carousel-item">
              <VideoTile :video="video" :live-href="localePath(`/live/${video.channel?.id}`)" />
            </div>
          </div>
        </section>

        <section v-for="shelf in videoShelves" :key="shelf.key">
          <ShelfHeader :title="shelf.title" :carousel="shelf.key" />
          <div :ref="setCarouselRef(shelf.key)" class="homepage-carousel">
            <div v-for="(video, index) in shelf.videos" :key="video.id" class="homepage-carousel-item">
              <VideoTile :video="video" :eager="shelf.key === 'recommended' && index === 0" />
            </div>
          </div>
        </section>

        <section>
          <ShelfHeader :title="t('home.allVideos')" />
          <div class="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            <template v-for="item in browseGridItems" :key="item.key">
              <GilAdsBanner
                v-if="item.type === 'ad'"
                :placement="GILADS_PLACEMENTS.homeFeed"
                type="feed"
                size="16x9"
                variant="feed"
                :context="{ page: 'home', surface: 'all-videos-grid' }"
                :fallback-title="t('home.featuredSponsor')"
              />
              <VideoTile v-else :video="item.video" />
            </template>
          </div>

          <div ref="sentinelElement" class="h-1" />

          <div v-if="isLoadingMore" class="mt-6 flex justify-center">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white/60" />
          </div>

        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import GilAdsBanner from '~/app/components/ads/GilAdsBanner.vue'
import { getVideos, getHomeRecommendations, getRecentWatchProgress, getWatchProgressMap } from '~/app/service/videos'
import { getChannelVideos } from '~/app/service/channels'
import { listMoviesCached, prefetchMovie } from '~/app/service/movies'
import { listSeriesCached, prefetchSeries } from '~/app/service/series'
import { listPublicWatchParties } from '~/app/service/watchParties'
import { GILADS_PLACEMENTS } from '~/app/service/gilads'
import { listActiveLiveStreams } from '~/app/service/live'
import { listFeaturedContent } from '~/app/service/featured'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { capDensity, imageVariantSrcset, imageVariantUrl, isVideo4K, isVideo8K, resolveMediaUrl } from '~/app/utils/media'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { useEasterEggs } from '~/app/composables/useEasterEggs'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const { activeEasterEgg } = useEasterEggs()
const isSabrinaTube = computed(() => activeEasterEgg.value?.id === 'sabrina-tube')
const recommendationSourceVideos = ref([])
const liveStreams = ref([])
const featuredItems = ref([])
const featuredIndex = ref(0)
const publicWatchParties = ref([])
const browseVideos = ref([])
const recommendedVideos = ref([])
const trendingVideos = ref([])
const trustedVideos = ref([])
const freshVideos = ref([])
const sabrinaVideos = ref([])
const sabrinaVideosLoading = ref(false)
const homeMovies = ref([])
const homeSeries = ref([])
const continueWatchingItems = ref([])
const liveChannelIds = ref(new Set())
const watchProgressByVideoId = ref({})
const isLoading = ref(true)
const secondaryHomeLoading = ref(true)
const moviesHomeLoading = ref(true)
const seriesHomeLoading = ref(true)
const isLoadingMore = ref(false)
const currentPage = ref(0)
const pageSize = 24
const hasMore = ref(true)
const loadError = ref('')
const sentinelElement = ref(null)
const homeAdInsertionIndex = ref(5)
let intersectionObserver = null
let deferredHomeLoadHandle = null
let deferredHomeLoadStarted = false
let sabrinaVideosRequest = null
let featuredTimer = null
const carouselContainers = {}
const homeFeedCacheTTL = 5 * 60 * 1000

const isChannelLive = (channelId) => liveChannelIds.value.has(channelId)
const activeFeatured = computed(() => featuredItems.value[featuredIndex.value] || featuredItems.value[0] || {})
const featuredImage = (item) => imageVariantUrl(item?.image_url, 'lg') || resolveMediaUrl(item?.image_url, '/videos/placeholder-thumbnail.jpg')
// Only say something when it adds information: a custom header, or live state.
const featuredEyebrow = (item) => {
  if (item?.header) return item.header
  if (item?.content_type === 'live') return item?.is_live ? t('home.live') : t('home.upcoming')
  return ''
}
const formatFeaturedDate = (value) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const loadFeatured = async () => { try { featuredItems.value = await listFeaturedContent() } catch (err) { console.warn('Featured content unavailable:', err); featuredItems.value = [] } }

const setCarouselRef = (key) => (element) => {
  if (!element) {
    delete carouselContainers[key]
    return
  }

  carouselContainers[key] = element
}

const videoShelves = computed(() => [
  { key: 'recommended', title: t('home.recommended'), videos: recommendedVideos.value },
  { key: 'trending', title: t('home.trending'), videos: trendingVideos.value },
  { key: 'trusted', title: t('home.trustedChannels'), videos: trustedVideos.value },
  { key: 'fresh', title: t('home.recentUploads'), videos: freshVideos.value },
].filter((shelf) => shelf.videos.length > 0))

const chevron = (direction) => h('svg', { class: 'h-4 w-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: direction < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6' }),
])

const ShelfArrows = defineComponent({
  name: 'ShelfArrows',
  props: { carousel: { type: String, required: true }, disabled: { type: Boolean, default: false } },
  setup(props) {
    return () => h('div', { class: 'hidden items-center gap-1 md:flex' }, [-1, 1].map((direction) => h('button', {
      type: 'button',
      class: 'shelf-arrow',
      disabled: props.disabled,
      'aria-label': direction < 0 ? t('home.previous') : t('home.next'),
      onClick: () => scrollCarousel(props.carousel, direction),
    }, [chevron(direction)])))
  },
})

// Row title with an optional "View all" link and scroll arrows.
const ShelfHeader = defineComponent({
  name: 'ShelfHeader',
  props: {
    title: { type: String, required: true },
    href: { type: String, default: '' },
    carousel: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('div', { class: 'mb-4 flex items-center justify-between gap-4' }, [
      props.href
        ? h(NuxtLink, { to: props.href, class: 'shelf-title group' }, () => [
            h('h2', props.title),
            h('span', { class: 'shelf-title__more' }, [t('home.viewAll'), chevron(1)]),
          ])
        : h('h2', { class: 'shelf-title' }, props.title),
      props.carousel ? h(ShelfArrows, { carousel: props.carousel, disabled: props.disabled }) : null,
    ])
  },
})

const scrollCarousel = (key, direction) => {
  const element = carouselContainers[key]
  if (!element) return

  element.scrollBy({
    left: direction * element.clientWidth,
    behavior: 'smooth',
  })
}

const toHomeVideoFromSearch = (result) => ({
  id: result.id,
  title: result.title,
  description: result.description || '',
  thumbnail_url: result.thumbnail || '',
  views: Number(result.views || 0),
  created_at: null,
  channel_id: result.channel_id,
  channel: {
    id: result.channel_id,
    name: result.channel || 'Sabrina Carpenter',
    avatar_url: result.avatar || '',
    verified: !!result.verified,
  },
})

const loadSabrinaVideos = async () => {
  if (sabrinaVideosRequest) return sabrinaVideosRequest

  sabrinaVideosLoading.value = true
  sabrinaVideosRequest = (async () => {
    try {
      const response = await fetch('/api/v1/search?q=sabrina%20carpenter&page=1')
      if (!response.ok) throw new Error(`Search returned ${response.status}`)

      const data = await response.json()
      const results = Array.isArray(data?.results) ? data.results : []
      const channelResult = results.find((result) => (
        result.type === 'channel' && String(result.name || result.title || '').trim().toLowerCase() === 'sabrina carpenter'
      ))
      const officialVideos = channelResult?.id
        ? await getChannelVideos(channelResult.id).catch(() => [])
        : []
      const mentionedVideos = results
        .filter(result => result.type === 'video')
        .map(toHomeVideoFromSearch)

      const officialLead = officialVideos.slice(0, 8)
      const officialRemainder = officialVideos.slice(8)
      const nonOfficialMentions = mentionedVideos.filter(video => video.channel?.id !== channelResult?.id)
      const videosByID = new Map()
      for (const video of [...officialLead, ...nonOfficialMentions, ...officialRemainder]) {
        if (video?.id && !videosByID.has(video.id)) videosByID.set(video.id, video)
      }
      sabrinaVideos.value = [...videosByID.values()].slice(0, 12)
      loadProgressForVideos(sabrinaVideos.value.map(video => video.id))
    } catch (err) {
      console.warn('SabrinaTube shelf unavailable:', err)
      sabrinaVideos.value = []
    } finally {
      sabrinaVideosLoading.value = false
    }
  })()

  return sabrinaVideosRequest
}

const resetHomeAdInsertionIndex = (itemCount) => {
  if (!itemCount) {
    homeAdInsertionIndex.value = 0
    return
  }
  const earliest = Math.min(2, itemCount)
  const latest = Math.min(Math.max(earliest, 10), itemCount)
  homeAdInsertionIndex.value = earliest + Math.floor(Math.random() * Math.max(1, latest - earliest + 1))
}

const browseGridItems = computed(() => {
  const items = browseVideos.value.map((video) => ({
    type: 'video',
    key: `video-${video.id}`,
    video,
  }))
  if (!items.length) return []

  const adIndex = Math.min(Math.max(0, homeAdInsertionIndex.value), items.length)
  return [
    ...items.slice(0, adIndex),
    { type: 'ad', key: 'home-feed-ad' },
    ...items.slice(adIndex),
  ]
})

const getThumbnailUrl = (video) => {
  return imageVariantUrl(video?.thumbnail_url, 'md') || resolveMediaUrl(video?.thumbnail_url, '/videos/placeholder-thumbnail.jpg')
}

const getWatchPartyThumbnailUrl = (party) => {
  return imageVariantUrl(party?.thumbnail_url, 'md') || resolveMediaUrl(party?.thumbnail_url, '/videos/placeholder-thumbnail.jpg')
}

const getMediaImage = (item) => {
  return imageVariantUrl(item?.imageUrl || item?.backdropUrl || item?.posterUrl, 'md') || resolveMediaUrl(item?.imageUrl || item?.backdropUrl || item?.posterUrl, '/videos/placeholder-thumbnail.jpg')
}

const getContinueImage = (item) => {
  const image =
    item?.series?.backdrop_url ||
    item?.series?.poster_url ||
    item?.movie?.backdrop_url ||
    item?.movie?.poster_url ||
    item?.video?.thumbnail_url
  return imageVariantUrl(image, 'md') || resolveMediaUrl(
    image,
    '/videos/placeholder-thumbnail.jpg'
  )
}

const getImageSrcset = (url) => imageVariantSrcset(url)

const getVideoImageSrcset = (video) => getImageSrcset(video?.thumbnail_url)

const getMediaImageSrcset = (item) => getImageSrcset(item?.imageUrl || item?.backdropUrl || item?.posterUrl)

const getContinueImageSrcset = (item) => getImageSrcset(
  item?.series?.backdrop_url ||
    item?.series?.poster_url ||
    item?.movie?.backdrop_url ||
    item?.movie?.poster_url ||
    item?.video?.thumbnail_url
)

const watchProgressPercent = (progress) => {
  const position = Number(progress?.position_seconds || 0)
  const duration = Number(progress?.duration_seconds || 0)
  if (progress?.completed || !Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return 0
  if (position <= 5 || position / duration >= 0.9) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

const getVideoProgressPercent = (videoId) => watchProgressPercent(watchProgressByVideoId.value[videoId])

const getContinueProgressPercent = (item) => watchProgressPercent(item?.progress)

const movieDurationLabel = (video) => {
  const seconds = Number(video?.duration_seconds ?? video?.duration ?? 0)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours > 0 ? `${hours}h ${remainder}m` : `${minutes}m`
}

const toHomeMovie = (movie) => ({
  id: movie.id,
  title: movie.title,
  meta: [
    movie.release_year ? String(movie.release_year) : '',
    movieDurationLabel(movie.video),
  ].filter(Boolean).join(' • ') || t('home.movieLabel'),
  href: localePath(`/category/movies?movie_id=${movie.id}`),
  prefetch: () => prefetchMovie(movie.id),
  imageUrl: movie.backdrop_url || movie.poster_url || movie.video?.thumbnail_url,
})

const toHomeSeries = (series) => ({
  id: series.id,
  title: series.title,
  meta: t('home.seriesMeta', { seasons: series.seasons || 1, episodes: series.episode_count || 0 }),
  href: localePath(`/category/series?series_id=${series.id}`),
  prefetch: () => prefetchSeries(series.id),
  imageUrl: series.backdrop_url || series.poster_url || series.first_episode?.video?.thumbnail_url,
})

const continueTitle = (item) => {
  if (item?.kind === 'series' && item.series) return item.series.title
  if (item?.kind === 'movie' && item.movie) return item.movie.title
  return item?.video?.title || t('home.continueFallbackTitle')
}

const continueSubtitle = (item) => {
  if (item?.kind === 'series' && item.episode) {
    return t('home.seriesEpisodeMeta', {
      season: item.episode.season_number,
      episode: item.episode.episode_number,
      title: item.episode.title,
    })
  }
  if (item?.kind === 'movie') return t('home.movieLabel')
  return item?.video?.channel?.name || ''
}

const continueLink = (item) => {
  const videoId = item?.video?.id || item?.progress?.video_id
  if (!videoId) return '/'
  if (item?.kind === 'series' && item.series?.id) {
    return localePath(`/video/${videoId}?series_id=${item.series.id}&index=${Number(item.episode?.index || 0)}`)
  }
  if (item?.kind === 'movie' && item.movie?.id) {
    return localePath(`/video/${videoId}?movie_id=${item.movie.id}`)
  }
  return localePath(`/video/${videoId}`)
}

const normalizeContinueWatchingItems = (items) => {
  const latestByKey = new Map()
  for (const item of items || []) {
    const key = item?.kind === 'series' && item?.series?.id
      ? `series:${item.series.id}`
      : `video:${item?.video?.id || item?.progress?.video_id || ''}`
    if (!key || key === 'video:') continue

    const updatedAt = new Date(item?.progress?.updated_at || 0).getTime()
    const existing = latestByKey.get(key)
    const existingUpdatedAt = new Date(existing?.progress?.updated_at || 0).getTime()
    if (!existing || updatedAt > existingUpdatedAt) {
      latestByKey.set(key, item)
    }
  }

  return [...latestByKey.values()].sort((a, b) => (
    new Date(b?.progress?.updated_at || 0).getTime() - new Date(a?.progress?.updated_at || 0).getTime()
  ))
}

const loadProgressForVideos = async (videoIds) => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
  const missingIds = [...new Set((videoIds || []).filter((id) => id && !watchProgressByVideoId.value[id]))]
  if (!userId || !missingIds.length) return
  try {
    const data = await getWatchProgressMap(missingIds)
    watchProgressByVideoId.value = {
      ...watchProgressByVideoId.value,
      ...(data?.progress || {}),
    }
  } catch (err) {
    console.error('Failed to load watch progress:', err)
  }
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

const applyRecentProgress = (recentProgress) => {
  continueWatchingItems.value = normalizeContinueWatchingItems(recentProgress?.items || [])
  for (const item of continueWatchingItems.value) {
    if (item?.video?.id && item.progress) {
      watchProgressByVideoId.value[item.video.id] = item.progress
    }
  }
}

const applyRecommendationFeed = (homeFeed) => {
  const recommendedPool = homeFeed?.browse || []
  recommendationSourceVideos.value = recommendedPool
  if (Array.isArray(homeFeed?.recommended)) {
    recommendedVideos.value = homeFeed.recommended || []
    trendingVideos.value = homeFeed.trending || []
    trustedVideos.value = homeFeed.trusted || []
    freshVideos.value = homeFeed.fresh || []
  } else {
    buildCollections(recommendedPool)
  }
  browseVideos.value = recommendedPool.slice(0, pageSize)
  resetHomeAdInsertionIndex(browseVideos.value.length)
  currentPage.value = 1
  hasMore.value = recommendedPool.length >= pageSize
}

const homeFeedCacheKey = (userId) => `giltube:home-feed:${userId || 'guest'}`

const restoreCachedHomeFeed = (userId) => {
  if (typeof window === 'undefined') return false
  try {
    const cached = JSON.parse(sessionStorage.getItem(homeFeedCacheKey(userId)) || 'null')
    if (!cached?.savedAt || Date.now() - Number(cached.savedAt) > homeFeedCacheTTL || !cached.feed) return false
    applyRecommendationFeed(cached.feed)
    return true
  } catch {
    return false
  }
}

const cacheHomeFeed = (userId, homeFeed) => {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(homeFeedCacheKey(userId), JSON.stringify({ savedAt: Date.now(), feed: homeFeed }))
  } catch {
    // Storage can be unavailable in private browsing; the network path still works.
  }
}

const loadDeferredHomeSections = async () => {
  const [activeLive, parties] = await Promise.all([
    listActiveLiveStreams().catch((err) => {
      console.warn('Live row unavailable:', err)
      return []
    }),
    listPublicWatchParties().catch((err) => {
      console.warn('Watch parties row unavailable:', err)
      return []
    }),
  ])
  liveStreams.value = (activeLive || []).slice(0, 12)
  publicWatchParties.value = Array.isArray(parties) ? parties : []
  liveChannelIds.value = new Set((activeLive || []).map((entry) => entry.channel_id))

  const moviesData = await listMoviesCached().catch((err) => {
    console.warn('Movies row unavailable:', err)
    return { movies: [] }
  })
  homeMovies.value = (moviesData?.movies || []).filter((movie) => movie.video_id || movie.video).slice(0, 12).map(toHomeMovie)
  moviesHomeLoading.value = false

  const seriesData = await listSeriesCached().catch((err) => {
    console.warn('Series row unavailable:', err)
    return { series: [] }
  })
  homeSeries.value = (seriesData?.series || []).filter((series) => series.first_episode || series.episode_count > 0).slice(0, 12).map(toHomeSeries)
  seriesHomeLoading.value = false
  secondaryHomeLoading.value = false
}

const scheduleDeferredHomeSections = () => {
  if (deferredHomeLoadStarted || deferredHomeLoadHandle != null) return
  const run = () => {
    deferredHomeLoadHandle = null
    deferredHomeLoadStarted = true
    loadDeferredHomeSections()
  }
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    deferredHomeLoadHandle = window.requestIdleCallback(run, { timeout: 1800 })
  } else {
    deferredHomeLoadHandle = setTimeout(run, 250)
  }
}

const loadHomeFeed = async () => {
  isLoading.value = true
  loadError.value = ''
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
  const restoredFromCache = restoreCachedHomeFeed(userId)
  if (restoredFromCache) {
    isLoading.value = false
    scheduleDeferredHomeSections()
  }
  const recentProgressPromise = userId
    ? getRecentWatchProgress(12).catch((err) => {
        console.warn('Continue watching unavailable:', err)
        return { items: [] }
      })
    : Promise.resolve({ items: [] })
  recentProgressPromise.then(applyRecentProgress)

  try {
    const homeFeed = await getHomeRecommendations({ limit: 48, offset: 0 }).catch(async (err) => {
      console.warn('Personalized home feed unavailable, falling back to video list:', err)
      const fallbackVideos = await getVideos({ limit: 48, offset: 0 })
      return { browse: fallbackVideos || [] }
    })
    applyRecommendationFeed(homeFeed)
    cacheHomeFeed(userId, homeFeed)
    isLoading.value = false
    scheduleDeferredHomeSections()

    const initialProgressIds = [...new Set([
      ...recommendedVideos.value.map((video) => video.id),
      ...browseVideos.value.map((video) => video.id),
    ].filter(Boolean))]
    loadProgressForVideos(initialProgressIds)
  } catch (err) {
    console.error('Failed to load home feed:', err)
    if (!restoredFromCache) loadError.value = t('home.loadError')
    isLoading.value = false
  }
}

const loadMoreVideos = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  try {
    const offset = currentPage.value * pageSize
    const bufferedVideos = recommendationSourceVideos.value.slice(offset, offset + pageSize)
    const newVideos = bufferedVideos.length > 0
      ? bufferedVideos
      : await getVideos({ limit: pageSize, offset })

    if (!Array.isArray(newVideos) || newVideos.length === 0) {
      hasMore.value = false
      return
    }

    browseVideos.value = [...browseVideos.value, ...newVideos]
    loadProgressForVideos(newVideos.map((video) => video.id))
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

const MediaPosterTile = defineComponent({
  name: 'MediaPosterTile',
  props: {
    item: {
      type: Object,
      required: true,
    },
    eager: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    return () => h(NuxtLink, {
      to: props.item.href || '/',
      class: 'tile group block w-full min-w-0',
      onPointerenter: props.item.prefetch,
      onFocus: props.item.prefetch,
      onTouchstart: props.item.prefetch,
    }, () => [
      h('div', { class: 'tile-media aspect-[2/3]' }, [
        h('img', {
          src: getMediaImage(props.item),
          srcset: getMediaImageSrcset(props.item) || undefined,
          sizes: capDensity('(min-width: 1280px) 12rem, 42vw'),
          alt: props.item.title,
          loading: props.eager ? 'eager' : 'lazy',
          decoding: 'async',
          class: 'tile-image',
        }),
      ]),
      h('h3', { class: 'mt-2.5 line-clamp-1 text-sm font-medium text-zinc-100' }, props.item.title),
      props.item.meta ? h('p', { class: 'mt-0.5 line-clamp-1 text-xs text-zinc-500' }, props.item.meta) : null,
    ])
  },
})

const ContinueTile = defineComponent({
  name: 'ContinueTile',
  props: {
    item: {
      type: Object,
      required: true,
    },
    eager: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const progressPercent = () => getContinueProgressPercent(props.item)

    return () => h(NuxtLink, { to: continueLink(props.item), class: 'tile group block w-full min-w-0' }, () => [
      h('div', { class: 'tile-media aspect-video' }, [
        h('img', {
          src: getContinueImage(props.item),
          srcset: getContinueImageSrcset(props.item) || undefined,
          sizes: capDensity('(min-width: 1280px) 22rem, 85vw'),
          alt: continueTitle(props.item),
          loading: props.eager ? 'eager' : 'lazy',
          decoding: 'async',
          fetchpriority: props.eager ? 'high' : 'auto',
          class: 'tile-image',
        }),
        progressPercent() > 0
          ? h('div', { class: 'tile-progress' }, [h('div', { style: { width: `${progressPercent()}%` } })])
          : null,
      ]),
      h('h3', { class: 'mt-3 line-clamp-1 text-sm font-medium text-zinc-100' }, continueTitle(props.item)),
      h('p', { class: 'mt-0.5 line-clamp-1 text-xs text-zinc-500' }, continueSubtitle(props.item)),
    ])
  },
})

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
    eager: {
      type: Boolean,
      default: false,
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

    const is4K = () => isVideo4K(props.video.width)
    const is8K = () => isVideo8K(props.video.width)
    const progressPercent = () => getVideoProgressPercent(props.video.id)

    const qualityBadge = () => is8K() ? '8K' : is4K() ? '4K' : ''

    return () => h('article', { class: 'tile group w-full min-w-0' }, [
      h(NuxtLink, { to: getVideoLink(), class: 'block', tabindex: '-1', 'aria-hidden': 'true' }, () => [
        h('div', { class: 'tile-media aspect-video' }, [
          h('img', {
            src: getThumbnailUrl(props.video),
            srcset: getVideoImageSrcset(props.video) || undefined,
            sizes: capDensity('(min-width: 1280px) 20rem, (min-width: 640px) 50vw, 100vw'),
            alt: '',
            loading: props.eager ? 'eager' : 'lazy',
            decoding: 'async',
            fetchpriority: props.eager ? 'high' : 'auto',
            class: 'tile-image',
          }),
          isLiveCard()
            ? h('span', { class: 'tile-badge tile-badge--live' }, [h('span', { class: 'home-live-dot' }), t('home.live')])
            : qualityBadge()
              ? h('span', { class: 'tile-badge' }, qualityBadge())
              : null,
          progressPercent() > 0
            ? h('div', { class: 'tile-progress' }, [h('div', { style: { width: `${progressPercent()}%` } })])
            : null,
        ]),
      ]),
      h('div', { class: 'mt-3 flex gap-3' }, [
        h(NuxtLink, { to: getChannelLink(), class: 'relative block h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800', 'aria-label': props.video.channel?.name || '' }, () => [
          h(AvatarFallback, {
            src: props.video.channel?.avatar_url || '',
            name: props.video.channel?.name || 'Channel',
            class: 'h-full w-full text-xs',
          }),
          isChannelLive(props.video.channel?.id)
            ? h('span', { class: 'absolute inset-0 rounded-full ring-2 ring-inset ring-red-500' })
            : null,
        ]),
        h('div', { class: 'min-w-0 flex-1' }, [
          h(NuxtLink, { to: getVideoLink(), class: 'block' }, () => [
            h('h3', { class: 'line-clamp-2 text-sm font-medium leading-5 text-zinc-100 group-hover:text-white' }, props.video.title),
          ]),
          h(NuxtLink, { to: getChannelLink(), class: 'mt-1 flex items-center gap-1 text-[13px] text-zinc-400 transition hover:text-zinc-200' }, () => [
            h('span', { class: 'truncate' }, props.video.channel?.name || ''),
            h(VerifiedBadge, { verified: props.video.channel?.verified || false, size: 'sm' }),
          ]),
          h(
            'p',
            { class: 'text-[13px] text-zinc-500' },
            isLiveCard()
              ? t('home.liveStats', { count: Number(props.video.watching_now || 0), started: getLiveStartedAgo(props.video.started_at) })
              : t('home.videoStats', { views: formatViews(props.video.views), time: getTimeAgo(props.video.created_at) })
          ),
        ]),
      ]),
    ])
  },
})

const WatchPartyTile = defineComponent({
  name: 'WatchPartyTile',
  props: {
    party: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const partyLink = () => localePath(`/watch-party/${props.party.id}`)

    return () => h(NuxtLink, { to: partyLink(), class: 'tile group block w-full min-w-0' }, () => [
      h('div', { class: 'tile-media aspect-video' }, [
        h('img', {
          src: getWatchPartyThumbnailUrl(props.party),
          srcset: getImageSrcset(props.party?.thumbnail_url) || undefined,
          sizes: capDensity('(min-width: 1280px) 20rem, (min-width: 640px) 50vw, 100vw'),
          alt: '',
          loading: 'lazy',
          decoding: 'async',
          class: 'tile-image',
        }),
        h('span', { class: 'tile-badge tile-badge--live' }, [h('span', { class: 'home-live-dot' }), t('home.watchParty')]),
      ]),
      h('h3', { class: 'mt-3 line-clamp-2 text-sm font-medium leading-5 text-zinc-100' }, props.party.title || props.party.video_title || t('home.watchParty')),
      h('p', { class: 'mt-0.5 line-clamp-1 text-[13px] text-zinc-500' }, [
        t('home.watching', { count: Number(props.party.participant_count || 0) }),
        props.party.channel_name ? ` · ${props.party.channel_name}` : '',
      ].join('')),
    ])
  },
})

watch(isSabrinaTube, (isActive) => {
  if (isActive) loadSabrinaVideos()
}, { immediate: true })

onMounted(async () => {
  await Promise.all([loadFeatured(), loadHomeFeed()])
	if (featuredItems.value.length > 1) featuredTimer = setInterval(() => { featuredIndex.value = (featuredIndex.value + 1) % featuredItems.value.length }, 7000)
  await nextTick()
  setupIntersectionObserver()
})

onUnmounted(() => {
	if (featuredTimer) clearInterval(featuredTimer)
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
  if (deferredHomeLoadHandle != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(deferredHomeLoadHandle)
  } else if (deferredHomeLoadHandle != null) {
    clearTimeout(deferredHomeLoadHandle)
  }
})

</script>

<style scoped>
.homepage-carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 1rem;
  margin-inline: -1rem;
  padding-inline: 1rem;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.homepage-carousel::-webkit-scrollbar {
  display: none;
}

@media (min-width: 640px) {
  .homepage-carousel {
    margin-inline: 0;
    padding-inline: 0;
    scroll-padding-inline: 0;
  }
}

.home-sections > section {
  content-visibility: auto;
  contain-intrinsic-size: auto 22rem;
}

.home-sections > .home-hero {
  content-visibility: visible;
}

.featured-fade-enter-active,
.featured-fade-leave-active {
  transition: opacity 0.4s ease;
}

.featured-fade-enter-from,
.featured-fade-leave-to {
  opacity: 0;
}

.homepage-carousel-item {
  display: flex;
  flex-shrink: 0;
  width: clamp(15rem, 19vw, 20rem);
  scroll-snap-align: start;
}

.homepage-carousel-item--wide {
  width: clamp(17rem, 24vw, 22rem);
}

.homepage-carousel-item--poster {
  width: clamp(8.5rem, 10.5vw, 11rem);
}

.sabrina-video-shelf {
  margin-inline: -1.5rem;
  border-block: 1px solid rgba(219, 39, 119, 0.2);
  background: rgba(255, 255, 255, 0.24);
  padding: 1.35rem 1.5rem 1rem;
}

.sabrina-video-shelf__eyebrow {
  margin-bottom: 0.2rem;
  color: #be185d;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.sabrina-video-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: clamp(13rem, 18vw, 18rem);
  grid-template-rows: minmax(0, 1fr);
  gap: 1rem 1.5rem;
}

.sabrina-video-grid__item {
  display: flex;
  min-width: 0;
}

@media (max-width: 640px) {
  .homepage-carousel-item {
    width: min(78vw, 19rem);
  }

  .homepage-carousel-item--wide {
    width: min(80vw, 22rem);
  }

  .homepage-carousel-item--poster {
    width: min(40vw, 10rem);
  }

  .sabrina-video-grid {
    grid-auto-columns: min(74vw, 19rem);
    gap: 1rem;
  }
}
</style>

<style>
/* Home tiles and shelves are render-function components, so their classes
   cannot be scoped to this page. */
.home-hero {
  position: relative;
  isolation: isolate;
  height: clamp(22rem, 46vw, 34rem);
  overflow: hidden;
  border-radius: 1.25rem;
  background: #000;
}

.home-hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(12, 12, 14, 0.92) 0%, rgba(12, 12, 14, 0.55) 40%, rgba(12, 12, 14, 0) 72%),
    linear-gradient(0deg, rgba(12, 12, 14, 0.85) 0%, rgba(12, 12, 14, 0) 45%);
}

.home-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #c8c8cf;
  font-size: 0.8125rem;
  font-weight: 600;
}

.home-hero__eyebrow.is-live {
  color: #fca5a5;
}

.home-hero__action {
  display: inline-flex;
  height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  background: #fff;
  padding: 0 1.375rem 0 1.125rem;
  color: #0c0c0e;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: transform 150ms ease, background-color 150ms ease;
}

.home-hero__action:hover {
  background: #e2e2e6;
}

.home-hero__action:active {
  transform: scale(0.98);
}

.home-live-dot {
  display: inline-block;
  height: 0.4375rem;
  width: 0.4375rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
}

.shelf-title {
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
  color: rgb(var(--gt-zinc-100));
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.shelf-title__more {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  color: rgb(var(--gt-zinc-500));
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0;
  transition: color 150ms ease;
}

.shelf-title:hover .shelf-title__more {
  color: rgb(var(--gt-zinc-200));
}

.shelf-arrow {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: rgb(var(--gt-zinc-400));
  transition: background-color 150ms ease, color 150ms ease;
}

.shelf-arrow:hover:not(:disabled) {
  background: rgb(var(--gt-white) / 0.07);
  color: rgb(var(--gt-white));
}

.shelf-arrow:disabled {
  opacity: 0.35;
}

.tile-media {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
  background: rgb(var(--gt-zinc-900));
}

.tile-media::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgb(var(--gt-white) / 0.06);
  pointer-events: none;
}

.tile-image {
  height: 100%;
  width: 100%;
  object-fit: cover;
  transition: transform 300ms cubic-bezier(0.2, 0, 0, 1), filter 300ms ease;
}

.tile:hover .tile-image {
  transform: scale(1.03);
}

.tile-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.375rem;
  background: rgba(12, 12, 14, 0.82);
  padding: 0.1875rem 0.4375rem;
  color: #f2f2f4;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  backdrop-filter: blur(6px);
}

.tile-badge--live {
  left: 0.5rem;
  right: auto;
  top: 0.5rem;
  bottom: auto;
}

.tile-progress {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
}

.tile-progress > div {
  height: 100%;
  background: rgb(var(--gt-primary));
}
</style>
