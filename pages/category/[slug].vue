<template>
  <StreamingSeriesCategory v-if="isSeriesCategory" />
  <StreamingMoviesCategory v-else-if="isMoviesCategory" />

  <main v-else class="flex-1">
    <div class="p-6">
      <h1 class="mb-6 text-2xl font-bold">{{ categoryName }}</h1>

      <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="video in videos" :key="video.id">
          <NuxtLink :to="localePath(`/video/${video.id}`)">
            <div class="relative aspect-video overflow-hidden rounded-xl bg-zinc-800">
              <img class="h-full w-full object-cover" :src="getThumbnailUrl(video)" :alt="video.title" />
              <div v-if="videoProgressPercent(video.id) > 0" class="absolute inset-x-0 bottom-0 h-1 bg-black/55">
                <div class="h-full bg-red-600" :style="{ width: `${videoProgressPercent(video.id)}%` }" />
              </div>
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

      <div ref="sentinelElement" class="mt-10 h-1" />

      <div v-if="isLoading" class="mt-8 flex justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>

      <div v-if="!hasMore && videos.length > 0" class="mt-8 text-center text-zinc-400">
        <p>{{ t('categoryPage.noMoreVideos') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import StreamingSeriesCategory from '~/app/components/streaming/StreamingSeriesCategory.vue'
import StreamingMoviesCategory from '~/app/components/streaming/StreamingMoviesCategory.vue'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import { getWatchProgressMap } from '~/app/service/videos'
import { getSeries } from '~/app/service/series'
import { getMovie } from '~/app/service/movies'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'

const route = useRoute()
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
const videoProgressById = ref({})
let intersectionObserver = null

const isSeriesCategory = computed(() => route.params.slug === 'series')
const isMoviesCategory = computed(() => route.params.slug === 'movies')

const normalizeSeriesDetail = (data) => {
  if (!data) return null
  if (!data.series) return data
  return {
    ...data.series,
    episodes: data.episodes || data.series.episodes || [],
  }
}

const withBaseUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const getThumbnailUrl = (video) => withBaseUrl(video?.thumbnail_url || '/videos/placeholder-thumbnail.jpg')
const getAvatarUrl = (url) => withBaseUrl(url?.startsWith('/avatars/') ? url : `/avatars/${url}`)

const getSeriesImage = (series, type = 'backdrop') => {
  const preferred = type === 'backdrop' ? series?.backdrop_url : series?.poster_url
  if (preferred) return preferred
  const firstEpisode = series?.first_episode || series?.episodes?.[0]
  return firstEpisode?.video?.thumbnail_url || ''
}

const { data: ssrSeriesMeta } = await useAsyncData(
  `category-series-social-${route.query.series_id || 'none'}`,
  async () => {
    if (route.params.slug !== 'series') return null
    const seriesId = typeof route.query.series_id === 'string' ? route.query.series_id : ''
    if (!seriesId) return null
    try {
      return normalizeSeriesDetail(await getSeries(seriesId))
    } catch {
      return null
    }
  },
  { default: () => null }
)

const normalizeMovieDetail = (data) => {
  if (!data) return null
  if (!data.movie) return data
  return data.movie
}

const { data: ssrMovieMeta } = await useAsyncData(
  `category-movie-social-${route.query.movie_id || 'none'}`,
  async () => {
    if (route.params.slug !== 'movies') return null
    const movieId = typeof route.query.movie_id === 'string' ? route.query.movie_id : ''
    if (!movieId) return null
    try {
      return normalizeMovieDetail(await getMovie(movieId))
    } catch {
      return null
    }
  },
  { default: () => null }
)

const watchProgressPercent = (progress) => {
  const position = Number(progress?.position_seconds || 0)
  const duration = Number(progress?.duration_seconds || 0)
  if (progress?.completed || !Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return 0
  if (position <= 5 || position / duration >= 0.9) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

const videoProgressPercent = (videoId) => watchProgressPercent(videoProgressById.value[videoId])

const loadProgressForVideos = async (videoIds) => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
  const missingIds = [...new Set((videoIds || []).filter((id) => id && !videoProgressById.value[id]))]
  if (!userId || !missingIds.length) return
  try {
    const data = await getWatchProgressMap(missingIds)
    videoProgressById.value = {
      ...videoProgressById.value,
      ...(data?.progress || {}),
    }
  } catch (err) {
    console.error('Failed to load watch progress:', err)
  }
}

const updateMetaTags = () => {
  if (isSeriesCategory.value) {
    const series = ssrSeriesMeta.value
    if (series?.title) {
      useMetaTags({
        title: `${series.title} - ${t('seriesCategory.title')} - GilTube`,
        description: series.synopsis || t('seriesCategory.synopsisFallback'),
        image: getSeriesImage(series, 'backdrop') || getSeriesImage(series, 'poster'),
        url: route.fullPath,
        type: 'video.tv_show',
        twitterCard: 'summary_large_image',
      })
      return
    }

    useMetaTags({
      title: `${t('seriesCategory.title')} - GilTube`,
      description: t('seriesCategory.metaDescription'),
      url: route.fullPath,
      type: 'website',
      twitterCard: 'summary_large_image',
    })
    return
  }

  if (isMoviesCategory.value) {
    const movie = ssrMovieMeta.value
    if (movie?.title) {
      useMetaTags({
        title: `${movie.title} - ${t('moviesCategory.title')} - GilTube`,
        description: movie.synopsis || t('moviesCategory.synopsisFallback'),
        image: getThumbnailUrl({ thumbnail_url: movie.backdrop_url || movie.poster_url || movie.video?.thumbnail_url }),
        url: route.fullPath,
        type: 'video.movie',
        twitterCard: 'summary_large_image',
      })
      return
    }

    useMetaTags({
      title: `${t('moviesCategory.title')} - GilTube`,
      description: t('moviesCategory.metaDescription'),
      url: route.fullPath,
      type: 'website',
      twitterCard: 'summary_large_image',
    })
    return
  }

  const name = categoryName.value || String(route.params.slug || '')
  useMetaTags({
    title: `${name} ${t('categoryPage.metaTitleSuffix')}`,
    description: categoryDescription.value || t('categoryPage.metaDescription', { name }),
    url: route.fullPath,
  })
}

updateMetaTags()

const loadMoreVideos = async () => {
  if (isLoading.value || !hasMore.value || isSeriesCategory.value || isMoviesCategory.value) return
  isLoading.value = true

  try {
    const offset = currentPage.value * pageSize
    const response = await fetch(`/api/v1/categories/${route.params.slug}/videos?limit=${pageSize}&offset=${offset}`)
    if (response.ok) {
      const newVideos = await response.json()
      if (newVideos.length < pageSize) hasMore.value = false
      videos.value = [...videos.value, ...newVideos]
      await loadProgressForVideos(newVideos.map((video) => video.id))
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
  videoProgressById.value = {}
  currentPage.value = 0
  hasMore.value = true
  isLoading.value = false
}

const setupIntersectionObserver = () => {
  if (intersectionObserver) intersectionObserver.disconnect()
  if (!sentinelElement.value || isSeriesCategory.value || isMoviesCategory.value) return

  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasMore.value && !isLoading.value) {
        loadMoreVideos()
      }
    })
  }, { rootMargin: '100px' })

  intersectionObserver.observe(sentinelElement.value)
}

const loadCategoryMetadata = () => {
  const storedCategories = localStorage.getItem('categories')
  if (storedCategories) {
    try {
      const categories = JSON.parse(storedCategories)
      const category = categories.find((candidate) => candidate.slug === route.params.slug)
      if (category) {
        categoryName.value = category.name
        categoryDescription.value = category.description
      }
    } catch (err) {
      console.error('Failed to parse categories:', err)
    }
  }

  if (!categoryName.value) categoryName.value = route.params.slug
}

onMounted(async () => {
  resetPagination()
  if (isSeriesCategory.value || isMoviesCategory.value) return
  loadCategoryMetadata()
  updateMetaTags()
  await loadMoreVideos()
  await nextTick()
  setupIntersectionObserver()
})

watch(() => route.params.slug, async () => {
  if (intersectionObserver) intersectionObserver.disconnect()
  resetPagination()
  if (isSeriesCategory.value || isMoviesCategory.value) return
  loadCategoryMetadata()
  updateMetaTags()
  await loadMoreVideos()
  await nextTick()
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (intersectionObserver) intersectionObserver.disconnect()
})
</script>
