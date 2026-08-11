<template>
  <main class="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
    <div class="mx-auto max-w-8xl px-6 py-8 lg:py-10">
      <div v-if="isLoading" class="space-y-8">
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

      <div v-else-if="loadError" class="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-100">
        {{ loadError }}
      </div>

      <div v-else-if="!secondaryHomeLoading && recommendedVideos.length === 0 && publicWatchParties.length === 0 && homeMovies.length === 0 && homeSeries.length === 0" class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 class="text-xl font-semibold">{{ t('home.noVideos') }}</h2>
        <p class="mt-2 text-sm text-zinc-400">{{ t('home.noVideosBody') }}</p>
        <NuxtLink :to="localePath('/upload')" class="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200">
          {{ t('home.uploadVideo') }}
        </NuxtLink>
      </div>

      <div v-else class="home-sections space-y-8">
        <section v-if="continueWatchingItems.length > 0">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold">{{ t('home.continueWatching') }}</h2>
              <p class="text-sm text-zinc-400">{{ t('home.continueWatchingBody') }}</p>
            </div>
            <div class="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('continue', -1)"
              >
                ‹
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('continue', 1)"
              >
                ›
              </button>
            </div>
          </div>
          <div class="-mx-6 px-6 sm:mx-0 sm:px-0">
            <div :ref="setCarouselRef('continue')" class="homepage-carousel flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 sm:gap-5 xl:gap-6">
              <div v-for="(item, index) in continueWatchingItems" :key="item.video.id" class="homepage-carousel-item homepage-carousel-item--wide shrink-0 snap-start">
                <ContinueTile :item="item" :eager="index === 0" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section v-if="moviesHomeLoading || homeMovies.length > 0">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold">{{ t('home.movies') }}</h2>
              <p class="text-sm text-zinc-400">{{ t('home.moviesBody') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <NuxtLink :to="localePath('/category/movies')" class="text-sm font-medium text-zinc-300 hover:text-white">{{ t('home.viewAll') }}</NuxtLink>
              <div class="hidden items-center gap-2 xl:flex">
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="moviesHomeLoading"
                  @click="scrollCarousel('movies', -1)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="moviesHomeLoading"
                  @click="scrollCarousel('movies', 1)"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
          <div class="-mx-6 px-6 sm:mx-0 sm:px-0">
            <div v-if="moviesHomeLoading" aria-hidden="true" class="homepage-carousel flex snap-x gap-4 overflow-hidden pb-3 sm:gap-5 xl:gap-6">
              <div v-for="n in 8" :key="n" class="homepage-carousel-item homepage-carousel-item--poster shrink-0 snap-start">
                <div class="aspect-[2/3] w-full animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              </div>
            </div>
            <div v-else :ref="setCarouselRef('movies')" class="homepage-carousel flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 sm:gap-5 xl:gap-6">
              <div v-for="movie in homeMovies" :key="movie.id" class="homepage-carousel-item homepage-carousel-item--poster shrink-0 snap-start">
                <MediaPosterTile :item="movie" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section v-if="seriesHomeLoading || homeSeries.length > 0">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold">{{ t('home.series') }}</h2>
              <p class="text-sm text-zinc-400">{{ t('home.seriesBody') }}</p>
            </div>
            <div class="flex items-center gap-3">
              <NuxtLink :to="localePath('/category/series')" class="text-sm font-medium text-zinc-300 hover:text-white">{{ t('home.viewAll') }}</NuxtLink>
              <div class="hidden items-center gap-2 xl:flex">
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="seriesHomeLoading"
                  @click="scrollCarousel('series', -1)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="seriesHomeLoading"
                  @click="scrollCarousel('series', 1)"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
          <div class="-mx-6 px-6 sm:mx-0 sm:px-0">
            <div v-if="seriesHomeLoading" aria-hidden="true" class="homepage-carousel flex snap-x gap-4 overflow-hidden pb-3 sm:gap-5 xl:gap-6">
              <div v-for="n in 8" :key="n" class="homepage-carousel-item homepage-carousel-item--poster shrink-0 snap-start">
                <div class="aspect-[2/3] w-full animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              </div>
            </div>
            <div v-else :ref="setCarouselRef('series')" class="homepage-carousel flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 sm:gap-5 xl:gap-6">
              <div v-for="series in homeSeries" :key="series.id" class="homepage-carousel-item homepage-carousel-item--poster shrink-0 snap-start">
                <MediaPosterTile :item="series" class="h-full" />
              </div>
            </div>
          </div>
        </section>

        <section v-if="publicWatchParties.length > 0">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold">{{ t('home.watchParties') }}</h2>
              <p class="text-sm text-zinc-400">{{ t('home.watchPartiesBody') }}</p>
            </div>
            <div class="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('watch-parties', -1)"
              >
                â€¹
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                @click="scrollCarousel('watch-parties', 1)"
              >
                â€º
              </button>
            </div>
          </div>
          <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:hidden">
            <WatchPartyTile v-for="party in publicWatchParties" :key="party.id" :party="party" />
          </div>
          <div class="hidden xl:block">
            <div :ref="setCarouselRef('watch-parties')" class="homepage-carousel flex gap-6 overflow-x-auto scroll-smooth pb-2">
              <div v-for="party in publicWatchParties" :key="party.id" class="homepage-carousel-item shrink-0">
                <WatchPartyTile :party="party" class="h-full" />
              </div>
            </div>
          </div>
        </section>

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
            <VideoTile v-for="(video, index) in recommendedVideos" :key="video.id" :video="video" :eager="index === 0" />
          </div>
          <div class="hidden xl:block">
            <div :ref="setCarouselRef('recommended')" class="homepage-carousel flex gap-6 overflow-x-auto scroll-smooth pb-2">
              <div v-for="(video, index) in recommendedVideos" :key="video.id" class="homepage-carousel-item shrink-0">
                <VideoTile :video="video" :eager="index === 0" class="h-full" />
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

          <div v-if="!hasMore && browseVideos.length > 0" class="mt-6 text-center text-sm text-zinc-400">
            {{ t('home.noMoreVideos') }}
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref } from 'vue'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import GilAdsBanner from '~/app/components/ads/GilAdsBanner.vue'
import { getVideos, getHomeRecommendations, getRecentWatchProgress, getWatchProgressMap } from '~/app/service/videos'
import { listMovies } from '~/app/service/movies'
import { listSeries } from '~/app/service/series'
import { listPublicWatchParties } from '~/app/service/watchParties'
import { GILADS_PLACEMENTS } from '~/app/service/gilads'
import { listActiveLiveStreams } from '~/app/service/live'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { imageVariantSrcset, imageVariantUrl, isVideo4K, isVideo8K, resolveMediaUrl } from '~/app/utils/media'
import { useMetaTags } from '~/app/composables/useMetaTags'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const recommendationSourceVideos = ref([])
const liveStreams = ref([])
const publicWatchParties = ref([])
const browseVideos = ref([])
const recommendedVideos = ref([])
const trendingVideos = ref([])
const trustedVideos = ref([])
const freshVideos = ref([])
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
const carouselContainers = {}
const homeFeedCacheTTL = 5 * 60 * 1000

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
  imageUrl: movie.backdrop_url || movie.poster_url || movie.video?.thumbnail_url,
})

const toHomeSeries = (series) => ({
  id: series.id,
  title: series.title,
  meta: t('home.seriesMeta', { seasons: series.seasons || 1, episodes: series.episode_count || 0 }),
  href: localePath(`/category/series?series_id=${series.id}`),
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

  const moviesData = await listMovies().catch((err) => {
    console.warn('Movies row unavailable:', err)
    return { movies: [] }
  })
  homeMovies.value = (moviesData?.movies || []).filter((movie) => movie.video_id || movie.video).slice(0, 12).map(toHomeMovie)
  moviesHomeLoading.value = false

  const seriesData = await listSeries().catch((err) => {
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
    return () => h('article', { class: 'motion-card group h-full w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5' }, [
      h(NuxtLink, { to: props.item.href || '/', class: 'block' }, () => [
        h('div', { class: 'relative aspect-[2/3] bg-black' }, [
          h('img', {
            src: getMediaImage(props.item),
            srcset: getMediaImageSrcset(props.item) || undefined,
            sizes: '(min-width: 1280px) 14rem, 42vw',
            alt: props.item.title,
            loading: 'lazy',
            decoding: 'async',
            class: 'h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]',
          }),
          h('div', { class: 'absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-90' }),
          h('div', { class: 'absolute inset-x-0 bottom-0 p-3' }, [
            h('h3', { class: 'line-clamp-2 text-sm font-semibold text-white' }, props.item.title),
            props.item.meta ? h('p', { class: 'mt-1 line-clamp-1 text-xs text-zinc-300' }, props.item.meta) : null,
          ]),
        ]),
      ]),
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
  },
  setup(props) {
    const progressPercent = () => getContinueProgressPercent(props.item)

    return () => h('article', { class: 'motion-card group h-full w-full min-w-0 overflow-hidden rounded-2xl border border-red-500/20 bg-red-950/15' }, [
      h(NuxtLink, { to: continueLink(props.item), class: 'block' }, () => [
        h('div', { class: 'relative aspect-video bg-black' }, [
          h('img', {
            src: getContinueImage(props.item),
            srcset: getContinueImageSrcset(props.item) || undefined,
            sizes: '(min-width: 1280px) 24rem, 85vw',
            alt: continueTitle(props.item),
            loading: props.eager ? 'eager' : 'lazy',
            decoding: 'async',
            fetchpriority: props.eager ? 'high' : 'auto',
            class: 'h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]',
          }),
          h('div', { class: 'absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent' }),
          progressPercent() > 0
            ? h('div', { class: 'absolute inset-x-0 bottom-0 h-1 bg-black/55' }, [
                h('div', {
                  class: 'h-full bg-red-600',
                  style: { width: `${progressPercent()}%` },
                }),
              ])
            : null,
        ]),
      ]),
      h('div', { class: 'p-4' }, [
        h(NuxtLink, { to: continueLink(props.item), class: 'block' }, () => [
          h('h3', { class: 'line-clamp-2 text-sm font-semibold text-white' }, continueTitle(props.item)),
        ]),
        h('p', { class: 'mt-1 line-clamp-1 text-xs text-zinc-400' }, continueSubtitle(props.item)),
      ]),
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

    return () => h('article', { class: 'motion-card group h-full w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5' }, [
      h(NuxtLink, { to: getVideoLink(), class: 'block' }, () => [
        h('div', { class: 'relative aspect-video bg-black' }, [
          h('img', {
            src: getThumbnailUrl(props.video),
            srcset: getVideoImageSrcset(props.video) || undefined,
            sizes: '(min-width: 1280px) 16rem, (min-width: 640px) 50vw, 100vw',
            alt: props.video.title,
            loading: props.eager ? 'eager' : 'lazy',
            decoding: 'async',
            fetchpriority: props.eager ? 'high' : 'auto',
            class: 'h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]',
          }),
          is8K()
            ? h('div', { class: 'absolute right-2 top-2 rounded border border-green-700 bg-green-900 px-1.5 py-0.5 text-xs font-semibold text-green-200' }, '8K')
            : is4K()
              ? h('div', { class: 'absolute right-2 top-2 rounded border border-green-700 bg-green-900 px-1.5 py-0.5 text-xs font-semibold text-green-200' }, '4K')
              : null,
          progressPercent() > 0
            ? h('div', { class: 'absolute inset-x-0 bottom-0 h-1 bg-black/55' }, [
                h('div', {
                  class: 'h-full bg-red-600',
                  style: { width: `${progressPercent()}%` },
                }),
              ])
            : null,
        ]),
      ]),
      h('div', { class: 'p-4' }, [
        h('div', { class: 'flex gap-3' }, [
          h(NuxtLink, { to: getChannelLink(), class: 'relative block h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-700' }, () => [
            h(AvatarFallback, {
              src: props.video.channel?.avatar_url || '',
              name: props.video.channel?.name || 'Channel',
              class: 'h-full w-full text-xs',
            }),
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

    return () => h('article', { class: 'motion-card group h-full w-full min-w-0 overflow-hidden rounded-2xl border border-red-500/25 bg-red-950/20' }, [
      h(NuxtLink, { to: partyLink(), class: 'block' }, () => [
        h('div', { class: 'relative aspect-video bg-black' }, [
          h('img', {
            src: getWatchPartyThumbnailUrl(props.party),
            srcset: getImageSrcset(props.party?.thumbnail_url) || undefined,
            sizes: '(min-width: 1280px) 24rem, (min-width: 640px) 50vw, 100vw',
            alt: props.party.video_title || props.party.title || 'Watch party',
            loading: 'lazy',
            decoding: 'async',
            class: 'h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]',
          }),
          h('div', { class: 'absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent' }),
          h('span', { class: 'absolute left-3 top-3 rounded-full bg-red-600 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white' }, 'Live party'),
          h('div', { class: 'absolute inset-x-0 bottom-0 p-4' }, [
            h('h3', { class: 'line-clamp-2 text-sm font-semibold text-white' }, props.party.title || props.party.video_title || 'Watch party'),
            h('p', { class: 'mt-1 text-xs text-zinc-300' }, `${Number(props.party.participant_count || 0)} watching together`),
          ]),
        ]),
      ]),
      h('div', { class: 'p-4' }, [
        h('p', { class: 'line-clamp-1 text-sm text-zinc-300' }, props.party.video_title || ''),
        h('p', { class: 'mt-1 line-clamp-1 text-xs text-zinc-500' }, props.party.channel_name || ''),
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
  if (deferredHomeLoadHandle != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(deferredHomeLoadHandle)
  } else if (deferredHomeLoadHandle != null) {
    clearTimeout(deferredHomeLoadHandle)
  }
})

</script>

<style scoped>
.homepage-carousel {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.home-sections > section {
  content-visibility: auto;
  contain-intrinsic-size: auto 24rem;
}

.homepage-carousel::-webkit-scrollbar {
  display: none;
}

.homepage-carousel-item {
  display: flex;
  width: clamp(13rem, 18vw, 18rem);
  align-self: stretch;
}

.homepage-carousel-item--wide {
  width: clamp(18rem, 28vw, 22rem);
}

.homepage-carousel-item--poster {
  width: clamp(9rem, 11vw, 11.5rem);
}

@media (max-width: 640px) {
  .homepage-carousel {
    padding-bottom: 0.75rem;
  }

  .homepage-carousel-item {
    width: min(74vw, 19rem);
  }

  .homepage-carousel-item--wide {
    width: min(76vw, 22rem);
  }

  .homepage-carousel-item--poster {
    width: min(42vw, 10.5rem);
  }
}
</style>
