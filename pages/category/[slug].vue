<template>
  <main v-if="isSeriesCategory" class="min-h-screen bg-black text-white">
    <div v-if="seriesLoading" class="px-6 py-8">
      <div class="h-[56vh] animate-pulse rounded bg-zinc-900" />
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="n in 8" :key="n" class="aspect-[2/3] animate-pulse rounded bg-zinc-900" />
      </div>
    </div>

    <div v-else-if="seriesError" class="mx-auto max-w-3xl px-6 py-16">
      <div class="rounded border border-red-500/30 bg-red-950/40 p-6 text-red-100">
        {{ seriesError }}
      </div>
    </div>

    <div v-else-if="!allSeries.length" class="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 class="text-3xl font-semibold">Series</h1>
      <p class="mt-3 text-zinc-400">No series have been published yet.</p>
    </div>

    <div v-else>
      <section
        v-if="featuredSeries"
        class="relative flex min-h-[68vh] items-end overflow-hidden px-6 pb-12 pt-28 sm:px-10 lg:px-14"
      >
        <Transition name="series-hero-image" mode="out-in">
          <img
            :key="featuredSeries.id"
            :src="getSeriesImage(featuredSeries, 'backdrop')"
            :alt="featuredSeries.title"
            class="absolute inset-0 h-full w-full object-cover object-center"
          />
        </Transition>
        <div class="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10" />
        <div class="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black to-transparent" />

        <Transition name="series-hero-copy" mode="out-in">
          <div :key="featuredSeries.id" class="relative max-w-3xl">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Featured Series</p>
            <h1 class="mt-3 text-4xl font-bold sm:text-6xl">{{ featuredSeries.title }}</h1>
            <p class="mt-4 max-w-2xl text-sm leading-6 text-zinc-200 sm:text-base">{{ featuredSeries.synopsis }}</p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span class="rounded bg-white/10 px-2 py-1">{{ featuredSeries.genre }}</span>
              <span class="rounded bg-white/10 px-2 py-1">{{ featuredSeries.seasons }} season{{ featuredSeries.seasons === 1 ? '' : 's' }}</span>
              <span class="rounded bg-white/10 px-2 py-1">{{ featuredSeries.episode_count }} episode{{ featuredSeries.episode_count === 1 ? '' : 's' }}</span>
            </div>
            <div class="mt-6 flex flex-wrap gap-3">
              <NuxtLink
                v-if="featuredSeries.first_episode"
                :to="seriesWatchLink(featuredSeries, 0)"
                class="inline-flex items-center rounded bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Play
              </NuxtLink>
              <button
                type="button"
                class="rounded border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                @click="openSeriesModal(featuredSeries)"
              >
                Episodes
              </button>
            </div>
            <div v-if="featuredSeriesItems.length > 1" class="mt-8 flex gap-2">
              <button
                v-for="(item, index) in featuredSeriesItems"
                :key="item.id"
                type="button"
                :aria-label="`Show featured series ${index + 1}`"
                :class="index === activeFeaturedIndex ? 'w-8 bg-white' : 'w-3 bg-white/35 hover:bg-white/60'"
                class="h-3 rounded-full transition-all"
                @click="setFeaturedIndex(index)"
              />
            </div>
          </div>
        </Transition>
      </section>

      <div class="space-y-10 px-6 pb-12 sm:px-10 lg:px-14">
        <section v-for="group in seriesGenres" :key="group.genre">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-xl font-semibold">{{ group.genre }}</h2>
          </div>
          <div class="series-row flex gap-4 overflow-x-auto pb-3">
            <article
              v-for="item in group.series"
              :key="item.id"
              class="w-44 shrink-0 sm:w-56"
            >
              <button type="button" class="group block w-full text-left" @click="openSeriesModal(item)">
                <div class="aspect-[2/3] overflow-hidden rounded bg-zinc-900">
                  <img
                    :src="getSeriesImage(item, 'poster')"
                    :alt="item.title"
                    class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                  />
                </div>
                <h3 class="mt-3 line-clamp-2 text-sm font-semibold">{{ item.title }}</h3>
                <p class="mt-1 text-xs text-zinc-500">{{ item.episode_count }} episodes</p>
              </button>
            </article>
          </div>
        </section>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="series-modal">
        <div
          v-if="selectedSeries"
          class="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-3 pb-4 pt-20 text-white backdrop-blur-sm sm:px-4 sm:pb-6 sm:pt-24"
          role="dialog"
          aria-modal="true"
          :aria-label="selectedSeries.title"
          @click.self="closeSeriesModal"
        >
          <section class="series-modal-panel flex max-h-[calc(100vh-5.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded bg-zinc-950 shadow-2xl ring-1 ring-white/10 sm:max-h-[calc(100vh-7rem)]">
            <div class="relative h-52 shrink-0 sm:h-72">
              <img :src="getSeriesImage(selectedSeries, 'backdrop')" :alt="selectedSeries.title" class="h-full w-full object-cover object-center" />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-black/20" />
              <button
                type="button"
                class="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-2xl leading-none text-white shadow-lg transition hover:bg-black"
                aria-label="Close series details"
                @click.stop="closeSeriesModal"
              >
                &times;
              </button>
              <div class="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-7">
                <p class="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">{{ selectedSeries.genre }}</p>
                <h2 class="mt-2 text-3xl font-bold sm:text-5xl">{{ selectedSeries.title }}</h2>
                <div class="mt-4 flex flex-wrap gap-3">
                  <NuxtLink
                    v-if="selectedSeriesPrimaryEpisode"
                    :to="seriesWatchLink(selectedSeries, selectedSeriesPrimaryEpisode._index)"
                    class="inline-flex items-center gap-3 rounded bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:px-6"
                  >
                    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                      <svg class="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" />
                      </svg>
                    </span>
                    <span>Play now</span>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
              <div class="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
                <div class="hidden lg:block">
                  <div class="aspect-[2/3] overflow-hidden rounded bg-zinc-900">
                    <img :src="getSeriesImage(selectedSeries, 'poster')" :alt="selectedSeries.title" class="h-full w-full object-cover" />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="hidden max-w-3xl text-sm leading-6 text-zinc-300 md:block">{{ selectedSeries.synopsis }}</p>
                  <dl class="mt-1 grid gap-3 text-sm text-zinc-400 sm:mt-5 sm:grid-cols-2">
                    <div v-if="selectedSeries.directors?.length">
                      <dt class="text-xs uppercase tracking-[0.18em] text-zinc-500">Directors</dt>
                      <dd class="mt-1 text-zinc-200">{{ selectedSeries.directors.join(', ') }}</dd>
                    </div>
                    <div v-if="selectedSeries.cast?.length">
                      <dt class="text-xs uppercase tracking-[0.18em] text-zinc-500">Cast</dt>
                      <dd class="mt-1 text-zinc-200">{{ selectedSeries.cast.join(', ') }}</dd>
                    </div>
                  </dl>

                  <div class="mt-6 flex gap-2 overflow-x-auto pb-2">
                    <button
                      v-for="season in selectedSeriesSeasons"
                      :key="season"
                      type="button"
                      :class="season === activeSeason ? 'bg-white text-black' : 'bg-zinc-900 text-white hover:bg-zinc-800'"
                      class="shrink-0 rounded px-4 py-2 text-sm font-semibold transition"
                      @click="activeSeason = season"
                    >
                      Season {{ season }}
                    </button>
                  </div>

                  <div class="mt-4 flex items-center justify-between gap-3 md:hidden">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Episodes</p>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10"
                        aria-label="Scroll episodes left"
                        @click="scrollEpisodes('left')"
                      >
                        &#8249;
                      </button>
                      <button
                        type="button"
                        class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10"
                        aria-label="Scroll episodes right"
                        @click="scrollEpisodes('right')"
                      >
                        &#8250;
                      </button>
                    </div>
                  </div>

                  <div
                    ref="episodeRailElement"
                    class="episode-grid mt-4 flex gap-3 overflow-x-auto pb-3 md:hidden"
                  >
                    <NuxtLink
                      v-for="episode in visibleSelectedEpisodes"
                      :key="episode.id"
                      :to="seriesWatchLink(selectedSeries, episode._index)"
                      class="group w-[18rem] shrink-0 rounded border border-white/10 bg-black/40 p-3 transition hover:bg-zinc-900 md:grid md:w-auto md:grid-cols-1 md:p-3"
                    >
                      <div class="relative aspect-video overflow-hidden rounded bg-zinc-800">
                        <img :src="getEpisodeThumbnail(episode)" :alt="episode.title" class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div class="absolute inset-0 flex items-center justify-center">
                          <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-xl text-black shadow-lg transition group-hover:scale-105 group-hover:bg-white md:opacity-0 md:group-hover:opacity-100">
                            <svg class="ml-1 h-5 w-5 text-black" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div class="min-w-0 md:mt-3">
                        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Season {{ episode.season_number }} | Episode {{ episode.episode_number }}
                        </p>
                        <h3 class="mt-1 line-clamp-2 font-semibold">{{ episode.title }}</h3>
                        <p class="mt-2 hidden line-clamp-3 text-sm text-zinc-400 md:block">{{ episode.synopsis }}</p>
                      </div>
                    </NuxtLink>
                  </div>

                  <div class="mt-5 hidden md:block">
                    <div class="mb-3 flex items-center justify-between gap-4">
                      <h3 class="text-2xl font-bold">Episodes</h3>
                      <p class="text-sm text-zinc-500">
                        Season {{ activeSeason }} / {{ visibleSelectedEpisodes.length }} episode{{ visibleSelectedEpisodes.length === 1 ? '' : 's' }}
                      </p>
                    </div>
                    <div class="series-episode-list">
                      <NuxtLink
                        v-for="episode in visibleSelectedEpisodes"
                        :key="episode.id"
                        :to="seriesWatchLink(selectedSeries, episode._index)"
                        class="series-episode-row group grid grid-cols-[3rem_11rem_minmax(0,1fr)_3.5rem] items-center gap-4 border-t border-white/10 px-3 py-4 transition hover:bg-white/10"
                      >
                        <div class="text-center text-2xl font-light text-zinc-400 group-hover:text-white">
                          {{ episode.episode_number }}
                        </div>
                        <div class="relative aspect-video overflow-hidden rounded-sm bg-zinc-900">
                          <img :src="getEpisodeThumbnail(episode)" :alt="episode.title" class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]" />
                          <div class="absolute inset-x-0 bottom-0 h-1 bg-red-600" />
                          <div class="absolute inset-0 hidden items-center justify-center bg-black/35 group-hover:flex">
                            <span class="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-black/50 text-white">
                              <svg class="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-start justify-between gap-3">
                            <h4 class="line-clamp-1 text-base font-semibold text-white">{{ episode.title }}</h4>
                          </div>
                          <p class="mt-1 line-clamp-2 text-sm leading-5 text-zinc-400">{{ episode.synopsis || '' }}</p>
                        </div>
                        <div class="text-right text-sm font-semibold text-zinc-300">
                          {{ episodeDurationLabel(episode) }}
                        </div>
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </main>

  <main v-else class="flex-1">
    <div class="p-6">
      <h1 class="mb-6 text-2xl font-bold">{{ categoryName }}</h1>

      <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="video in videos" :key="video.id">
          <NuxtLink :to="localePath(`/video/${video.id}`)">
            <div class="aspect-video overflow-hidden rounded-xl bg-zinc-800">
              <img class="h-full w-full object-cover" :src="getThumbnailUrl(video)" :alt="video.title" />
            </div>
          </NuxtLink>
          <div class="mt-3 flex gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700">
              <img
                v-if="video.channel?.avatar_url && typeof video.channel.avatar_url === 'string' && video.channel.avatar_url.trim()"
                class="h-9 w-9 rounded-full object-cover"
                :src="getAvatarUrl(video.channel.avatar_url)"
                :alt="video.channel.name"
              />
              <span v-else class="text-xs font-bold text-white">
                {{ video.channel?.name?.charAt(0).toUpperCase() ?? 'C' }}
              </span>
            </div>
            <div class="min-w-0">
              <NuxtLink :to="localePath(`/video/${video.id}`)">
                <div class="flex items-center gap-1">
                  <h3 class="line-clamp-2 text-sm font-semibold">{{ video.title }}</h3>
                  <span v-if="video.width == 7680" class="shrink-0 border border-gray-500 bg-gray-900 p-0.5 text-xs font-semibold text-gray-200">8K</span>
                  <span v-if="video.width == 3840" class="shrink-0 border border-gray-500 bg-gray-900 p-0.5 text-xs font-semibold text-gray-200">4K</span>
                </div>
              </NuxtLink>
              <NuxtLink :to="localePath(`/channel/${video.channel.id}`)" class="flex items-center gap-1 text-xs text-zinc-400 transition hover:text-yellow-400">
                {{ video.channel.name }}
                <VerifiedBadge :verified="video.channel?.verified || false" size="sm" />
              </NuxtLink>
              <p class="text-xs text-zinc-400">{{ t('channelPage.videoStats', { views: formatViews(video.views), time: getTimeAgo(video.created_at) }) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div ref="sentinelElement" class="mt-10 h-1"></div>

      <div v-if="isLoading" class="mt-8 flex justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>

      <div v-if="!hasMore && videos.length > 0" class="mt-8 text-center text-zinc-400">
        <p>{{ t('categoryPage.noMoreVideos') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import { listSeries, getSeries } from '~/app/service/series'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'

const route = useRoute()
const router = useRouter()
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
const { t } = useI18n()
const localePath = useLocalePath()

const videos = ref([])
const categoryName = ref('')
const categoryDescription = ref('')
const currentPage = ref(0)
const pageSize = 12
const hasMore = ref(true)
const isLoading = ref(false)
const sentinelElement = ref(null)
const episodeRailElement = ref(null)
let intersectionObserver = null

const seriesLoading = ref(false)
const seriesError = ref('')
const allSeries = ref([])
const seriesGenres = ref([])
const featuredSeries = ref(null)
const featuredSeriesItems = ref([])
const activeFeaturedIndex = ref(0)
const selectedSeries = ref(null)
const selectedEpisodes = ref([])
const activeSeason = ref(1)
let featuredHeroTimer = null

const isSeriesCategory = computed(() => route.params.slug === 'series')

const selectedSeriesSeasons = computed(() => {
  const seasons = new Set(selectedEpisodes.value.map((episode) => episode.season_number))
  return [...seasons].sort((a, b) => a - b)
})

const visibleSelectedEpisodes = computed(() =>
  selectedEpisodes.value.filter((episode) => episode.season_number === activeSeason.value)
)

const selectedSeriesPrimaryEpisode = computed(() =>
  visibleSelectedEpisodes.value[0] || selectedEpisodes.value[0] || null
)

const withBaseUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const getThumbnailUrl = (video) => withBaseUrl(video?.thumbnail_url || '/videos/placeholder-thumbnail.jpg')
const getAvatarUrl = (url) => withBaseUrl(url?.startsWith('/avatars/') ? url : `/avatars/${url}`)
const getEpisodeThumbnail = (episode) => getThumbnailUrl(episode?.video)

const episodeDurationLabel = (episode) => {
  const seconds = Number(
    episode?.duration_seconds ??
    episode?.duration ??
    episode?.video?.duration_seconds ??
    episode?.video?.duration ??
    0
  )
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `${minutes}m`
}

const normalizeSeriesDetail = (data) => {
  if (!data) return null
  if (!data.series) return data
  return {
    ...data.series,
    episodes: data.episodes || data.series.episodes || [],
  }
}

const getSeriesImage = (series, type) => {
  const preferred = type === 'backdrop' ? series?.backdrop_url : series?.poster_url
  if (preferred) return withBaseUrl(preferred)
  const firstEpisode = series?.first_episode || series?.episodes?.[0]
  return getThumbnailUrl(firstEpisode?.video)
}

const seriesWatchLink = (series, index = 0) => {
  const episode = series?.episodes?.[index] || series?.first_episode
  if (!episode) return localePath('/category/series')
  return localePath(`/video/${episode.video_id}?series_id=${series.id}&index=${index}`)
}

const findLoadedSeries = (id) => {
  if (!id) return null
  return allSeries.value.find((series) => series.id === id || series.slug === id) || null
}

const openSeriesModal = async (series, updateRoute = true) => {
  if (!series) return

  let detail = series
  if (!series.episodes) {
    try {
      detail = normalizeSeriesDetail(await getSeries(series.id || series.slug)) || series
    } catch {
      detail = series
    }
  }

  selectedSeries.value = detail
  if (updateRoute && route.query.series_id !== detail.id) {
    await router.push({
      query: {
        ...route.query,
        series_id: detail.id,
      },
    })
  }
}

const closeSeriesModal = async () => {
  selectedSeries.value = null
  const { series_id: _seriesId, ...query } = route.query
  await router.push({ query })
}

const scrollEpisodes = (direction) => {
  const rail = episodeRailElement.value
  if (!rail) return
  const amount = Math.max(rail.clientWidth * 0.85, 220)
  rail.scrollBy({
    left: direction === 'right' ? amount : -amount,
    behavior: 'smooth',
  })
}

const setFeaturedIndex = (index) => {
  if (!featuredSeriesItems.value.length) return
  activeFeaturedIndex.value = Math.max(0, Math.min(index, featuredSeriesItems.value.length - 1))
  featuredSeries.value = featuredSeriesItems.value[activeFeaturedIndex.value] || null
  restartFeaturedHeroTimer()
}

const stopFeaturedHeroTimer = () => {
  if (featuredHeroTimer) {
    clearInterval(featuredHeroTimer)
    featuredHeroTimer = null
  }
}

const startFeaturedHeroTimer = () => {
  stopFeaturedHeroTimer()
  if (!isSeriesCategory.value || featuredSeriesItems.value.length <= 1) return
  featuredHeroTimer = setInterval(() => {
    const nextIndex = (activeFeaturedIndex.value + 1) % featuredSeriesItems.value.length
    activeFeaturedIndex.value = nextIndex
    featuredSeries.value = featuredSeriesItems.value[nextIndex] || null
  }, 7000)
}

const restartFeaturedHeroTimer = () => {
  startFeaturedHeroTimer()
}

const { data: seriesMetaData } = await useAsyncData(
  `category-series-meta-${route.query.series_id || 'featured'}`,
  async () => {
    if (!isSeriesCategory.value) return null

    const requestedSeriesId = typeof route.query.series_id === 'string' ? route.query.series_id : ''
    if (requestedSeriesId) {
      return normalizeSeriesDetail(await getSeries(requestedSeriesId))
    }

    const data = await listSeries()
    return normalizeSeriesDetail(data.featured || data.series?.[0] || null)
  },
  { default: () => null }
)

const updateMetaTags = () => {
  if (isSeriesCategory.value) {
    const series = selectedSeries.value || seriesMetaData.value
    if (series?.title) {
      useMetaTags({
        title: `${series.title} - GilTube Series`,
        description: series.synopsis || 'Watch this series on GilTube.',
        image: getSeriesImage(series, 'backdrop') || getSeriesImage(series, 'poster'),
        url: route.fullPath,
        type: 'video.tv_show',
      })
      return
    }

    useMetaTags({
      title: 'Series - GilTube',
      description: 'Episodic GilTube series organized by genre.',
      url: route.fullPath,
    })
    return
  }

  useMetaTags({
    title: `${categoryName.value} ${t('categoryPage.metaTitleSuffix')}`,
    description: categoryDescription.value || t('categoryPage.metaDescription', { name: categoryName.value }),
    url: route.fullPath,
  })
}

updateMetaTags()

const loadSeriesCategory = async () => {
  seriesLoading.value = true
  seriesError.value = ''
  try {
    const data = await listSeries()
    const detailResults = await Promise.all(
      (data.series || []).map(async (item) => {
        try {
          const detail = await getSeries(item.id)
          const series = normalizeSeriesDetail(detail)
          return { ...item, ...series, episodes: series?.episodes || [] }
        } catch {
          return { ...item, episodes: [] }
        }
      })
    )

    allSeries.value = detailResults
    const byId = new Map(detailResults.map((item) => [item.id, item]))
    seriesGenres.value = (data.genres || []).map((group) => ({
      ...group,
      series: (group.series || []).map((item) => byId.get(item.id) || item),
    }))
    const featured = detailResults.filter((item) => item.is_featured).slice(0, 5)
    if (featured.length === 0 && data.featured) {
      const fallback = byId.get(data.featured.id) || data.featured
      if (fallback) featured.push(fallback)
    }
    if (featured.length === 0 && detailResults[0]) {
      featured.push(detailResults[0])
    }
    featuredSeriesItems.value = featured.slice(0, 5)
    activeFeaturedIndex.value = 0
    featuredSeries.value = featuredSeriesItems.value[0] || null
    startFeaturedHeroTimer()
    const requestedSeriesId = typeof route.query.series_id === 'string' ? route.query.series_id : ''
    selectedSeries.value = null
    if (requestedSeriesId) {
      const loadedSeries = findLoadedSeries(requestedSeriesId)
      if (loadedSeries) {
        await openSeriesModal(loadedSeries, false)
      } else {
        try {
          selectedSeries.value = normalizeSeriesDetail(await getSeries(requestedSeriesId))
        } catch {
          selectedSeries.value = null
        }
      }
    }
    updateMetaTags()
  } catch (err) {
    console.error('Failed to load series:', err)
    seriesError.value = 'Failed to load series.'
    featuredSeriesItems.value = []
    featuredSeries.value = null
    stopFeaturedHeroTimer()
  } finally {
    seriesLoading.value = false
  }
}

watch(selectedSeries, (series) => {
  selectedEpisodes.value = (series?.episodes || []).map((episode, index) => ({ ...episode, _index: index }))
  activeSeason.value = selectedEpisodes.value[0]?.season_number || 1
  if (isSeriesCategory.value) {
    updateMetaTags()
  }
})

watch(
  () => route.query.series_id,
  async (seriesId) => {
    if (!isSeriesCategory.value) return
    const id = typeof seriesId === 'string' ? seriesId : ''
    if (!id) {
      selectedSeries.value = null
      updateMetaTags()
      return
    }

    if (selectedSeries.value?.id === id) {
      updateMetaTags()
      return
    }

    const loaded = findLoadedSeries(id)
    if (loaded) {
      await openSeriesModal(loaded, false)
    } else {
      try {
        selectedSeries.value = normalizeSeriesDetail(await getSeries(id))
      } catch {
        selectedSeries.value = null
      }
    }
    updateMetaTags()
  }
)

const loadMoreVideos = async () => {
  if (isLoading.value || !hasMore.value || isSeriesCategory.value) return
  isLoading.value = true

  try {
    const offset = currentPage.value * pageSize
    const response = await fetch(`/api/v1/categories/${route.params.slug}/videos?limit=${pageSize}&offset=${offset}`)
    if (response.ok) {
      const newVideos = await response.json()
      if (newVideos.length < pageSize) {
        hasMore.value = false
      }
      videos.value = [...videos.value, ...newVideos]
      currentPage.value += 1
    }
  } catch (err) {
    console.error('Failed to load videos:', err)
  } finally {
    isLoading.value = false
  }
}

const resetPagination = () => {
  videos.value = []
  currentPage.value = 0
  hasMore.value = true
  isLoading.value = false
}

const setupIntersectionObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
  if (!sentinelElement.value || isSeriesCategory.value) return

  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasMore.value && !isLoading.value) {
        loadMoreVideos()
      }
    })
  }, { rootMargin: '100px' })

  intersectionObserver.observe(sentinelElement.value)
}

onMounted(async () => {
  resetPagination()

  if (isSeriesCategory.value) {
    categoryName.value = 'Series'
    categoryDescription.value = 'Episodic GilTube series organized by genre.'
    updateMetaTags()
    await loadSeriesCategory()
    return
  }

  const storedCategories = localStorage.getItem('categories')
  if (storedCategories) {
    try {
      const categories = JSON.parse(storedCategories)
      const category = categories.find((candidate) => candidate.slug === route.params.slug)
      if (category) {
        categoryName.value = category.name
        categoryDescription.value = category.description
      }
    } catch (e) {
      console.error('Failed to parse categories:', e)
    }
  }

  if (!categoryName.value) {
    categoryName.value = route.params.slug
  }

  updateMetaTags()
  await loadMoreVideos()
  await nextTick()
  setupIntersectionObserver()
})

onUnmounted(() => {
  stopFeaturedHeroTimer()
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})
</script>

<style scoped>
.series-row {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.series-row::-webkit-scrollbar {
  display: none;
}

.series-hero-image-enter-active,
.series-hero-image-leave-active,
.series-hero-copy-enter-active,
.series-hero-copy-leave-active {
  transition: opacity 520ms ease, transform 520ms ease;
}

.series-hero-image-enter-from,
.series-hero-image-leave-to {
  opacity: 0;
  transform: scale(1.015);
}

.series-hero-copy-enter-from,
.series-hero-copy-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.episode-grid {
  scrollbar-width: none;
  -ms-overflow-style: none;
  touch-action: pan-x pan-y;
}

.episode-grid::-webkit-scrollbar {
  display: none;
}

.series-episode-row:first-child {
  border-top-color: transparent;
}

.series-modal-enter-active,
.series-modal-leave-active {
  transition: opacity 220ms ease;
}

.series-modal-enter-active .series-modal-panel,
.series-modal-leave-active .series-modal-panel {
  transition: transform 220ms ease, opacity 220ms ease;
}

.series-modal-enter-from,
.series-modal-leave-to {
  opacity: 0;
}

.series-modal-enter-from .series-modal-panel,
.series-modal-leave-to .series-modal-panel {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
</style>
