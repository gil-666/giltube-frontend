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
        <img
          :src="getSeriesImage(featuredSeries, 'backdrop')"
          :alt="featuredSeries.title"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10" />
        <div class="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black to-transparent" />

        <div class="relative max-w-3xl">
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
              @click="selectedSeries = featuredSeries"
            >
              Episodes
            </button>
          </div>
        </div>
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
              <button type="button" class="group block w-full text-left" @click="selectedSeries = item">
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

        <section v-if="selectedSeries" class="border-t border-white/10 pt-8">
          <div class="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div>
              <div class="aspect-[2/3] overflow-hidden rounded bg-zinc-900">
                <img :src="getSeriesImage(selectedSeries, 'poster')" :alt="selectedSeries.title" class="h-full w-full object-cover" />
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">{{ selectedSeries.genre }}</p>
              <h2 class="mt-2 text-3xl font-bold">{{ selectedSeries.title }}</h2>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">{{ selectedSeries.synopsis }}</p>
              <dl class="mt-5 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
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

              <div class="mt-4 space-y-3">
                <NuxtLink
                  v-for="episode in visibleSelectedEpisodes"
                  :key="episode.id"
                  :to="seriesWatchLink(selectedSeries, episode._index)"
                  class="grid gap-4 rounded border border-white/10 bg-zinc-950 p-3 transition hover:bg-zinc-900 sm:grid-cols-[10rem_minmax(0,1fr)]"
                >
                  <div class="aspect-video overflow-hidden rounded bg-zinc-800">
                    <img :src="getEpisodeThumbnail(episode)" :alt="episode.title" class="h-full w-full object-cover" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Season {{ episode.season_number }} | Episode {{ episode.episode_number }}
                    </p>
                    <h3 class="mt-1 line-clamp-2 font-semibold">{{ episode.title }}</h3>
                    <p class="mt-2 line-clamp-2 text-sm text-zinc-400">{{ episode.synopsis }}</p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
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
const baseUrl = import.meta.env.VITE_API_BASE_URL
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
let intersectionObserver = null

const seriesLoading = ref(false)
const seriesError = ref('')
const allSeries = ref([])
const seriesGenres = ref([])
const featuredSeries = ref(null)
const selectedSeries = ref(null)
const selectedEpisodes = ref([])
const activeSeason = ref(1)

const isSeriesCategory = computed(() => route.params.slug === 'series')

const selectedSeriesSeasons = computed(() => {
  const seasons = new Set(selectedEpisodes.value.map((episode) => episode.season_number))
  return [...seasons].sort((a, b) => a - b)
})

const visibleSelectedEpisodes = computed(() =>
  selectedEpisodes.value.filter((episode) => episode.season_number === activeSeason.value)
)

const withBaseUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const getThumbnailUrl = (video) => withBaseUrl(video?.thumbnail_url || '/videos/placeholder-thumbnail.jpg')
const getAvatarUrl = (url) => withBaseUrl(url?.startsWith('/avatars/') ? url : `/avatars/${url}`)
const getEpisodeThumbnail = (episode) => getThumbnailUrl(episode?.video)

const getSeriesImage = (series, type) => {
  const preferred = type === 'backdrop' ? series?.backdrop_url : series?.poster_url
  if (preferred) return withBaseUrl(preferred)
  return getThumbnailUrl(series?.first_episode?.video)
}

const seriesWatchLink = (series, index = 0) => {
  const episode = series?.episodes?.[index] || series?.first_episode
  if (!episode) return localePath('/category/series')
  return localePath(`/video/${episode.video_id}?series_id=${series.id}&index=${index}`)
}

const updateMetaTags = () => {
  useMetaTags({
    title: `${categoryName.value} ${t('categoryPage.metaTitleSuffix')}`,
    description: categoryDescription.value || t('categoryPage.metaDescription', { name: categoryName.value }),
  })
}

const loadSeriesCategory = async () => {
  seriesLoading.value = true
  seriesError.value = ''
  try {
    const data = await listSeries()
    const detailResults = await Promise.all(
      (data.series || []).map(async (item) => {
        try {
          const detail = await getSeries(item.id)
          return { ...item, episodes: detail.episodes || [] }
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
    featuredSeries.value = data.featured ? byId.get(data.featured.id) || data.featured : detailResults[0] || null
    const requestedSeriesId = typeof route.query.series_id === 'string' ? route.query.series_id : ''
    selectedSeries.value = byId.get(requestedSeriesId) || featuredSeries.value || detailResults[0] || null
  } catch (err) {
    console.error('Failed to load series:', err)
    seriesError.value = 'Failed to load series.'
  } finally {
    seriesLoading.value = false
  }
}

watch(selectedSeries, (series) => {
  selectedEpisodes.value = (series?.episodes || []).map((episode, index) => ({ ...episode, _index: index }))
  activeSeason.value = selectedEpisodes.value[0]?.season_number || 1
})

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
</style>
