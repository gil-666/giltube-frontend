<template>
  <StreamingCategory
    title="Movies"
    eyebrow="Featured Movies"
    item-label="movie"
    details-label="Details"
    empty-message="No movies have been published yet."
    :loading="loading"
    :error="error"
    :groups="groups"
    :featured-item="featuredItem"
    :featured-items="featuredItems"
    :active-featured-index="activeFeaturedIndex"
    :selected-item="selectedMovie"
    @open="openMovieModal"
    @close="closeMovieModal"
    @feature="setFeaturedIndex"
  >
    <template #details="{ item }">
      <div class="movie-details-layout">
        <div class="movie-poster-column">
          <div class="movie-poster-frame">
            <img :src="item.posterUrl" :alt="item.title" class="movie-poster-image" />
          </div>
        </div>
        <div class="movie-details-main">
          <p class="movie-synopsis">{{ item.synopsis }}</p>
          <dl class="movie-meta-grid">
            <div>
              <dt>Channel</dt>
              <dd>{{ item.video?.channel?.name || 'GilTube Movies' }}</dd>
            </div>
            <div v-if="item.video?.created_at">
              <dt>Added</dt>
              <dd>{{ getTimeAgo(item.video.created_at) }}</dd>
            </div>
            <div>
              <dt>Views</dt>
              <dd>{{ formatViews(item.video?.views || 0) }}</dd>
            </div>
            <div v-if="item.durationLabel">
              <dt>Runtime</dt>
              <dd>{{ item.durationLabel }}</dd>
            </div>
          </dl>

          <div class="movie-related-section">
            <h3>More like this</h3>
            <div class="streaming-movie-grid">
              <NuxtLink
                v-for="movie in relatedMovies(item)"
                :key="movie.id"
                :to="movie.primaryLink"
                class="movie-related-card group"
              >
                <div class="movie-related-thumb">
                  <img :src="movie.backdropUrl" :alt="movie.title" />
                  <div v-if="movie.progressPercent > 0" class="movie-related-progress">
                    <div :style="{ width: `${movie.progressPercent}%` }" />
                  </div>
                </div>
                <h4>{{ movie.title }}</h4>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </StreamingCategory>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import StreamingCategory from './StreamingCategory.vue'
import { getWatchProgressMap } from '~/app/service/videos'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'

const GILTUBE_MOVIES_CHANNEL_ID = 'f765b137-9614-4b99-9f6d-6221abeb75cd'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

const loading = ref(false)
const error = ref('')
const movies = ref([])
const activeFeaturedIndex = ref(0)
const selectedMovieId = ref('')
const watchProgressByVideoId = ref({})
let featuredHeroTimer = null

const withBaseUrl = (url) => {
  if (!url) return `${baseUrl}/videos/placeholder-thumbnail.jpg`
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const durationLabel = (video) => {
  const seconds = Number(video?.duration_seconds ?? video?.duration ?? 0)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours > 0 ? `${hours}h ${remainder}m` : `${minutes}m`
}

const primaryGenre = (video) => {
  const category = (video?.categories || []).find((item) => item.slug !== 'movies' && item.name?.toLowerCase() !== 'movies')
  return category?.name || video?.genre || 'Movies'
}

const watchProgressPercent = (progress) => {
  const position = Number(progress?.position_seconds || 0)
  const duration = Number(progress?.duration_seconds || 0)
  if (progress?.completed || !Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return 0
  if (position <= 5 || position / duration >= 0.9) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

const toDisplayMovie = (video) => {
  const progress = watchProgressByVideoId.value[video.id]
  const percent = watchProgressPercent(progress)
  return {
    id: video.id,
    video,
    title: video.title,
    synopsis: video.description || 'Watch this movie on GilTube.',
    genre: primaryGenre(video),
    posterUrl: withBaseUrl(video.thumbnail_url),
    backdropUrl: withBaseUrl(video.thumbnail_url),
    meta: [durationLabel(video), `${formatViews(video.views || 0)} views`].filter(Boolean),
    cardMeta: durationLabel(video) || `${formatViews(video.views || 0)} views`,
    primaryLink: localePath(`/video/${video.id}`),
    primaryLabel: 'Play',
    resumeLink: progress && percent > 0 ? localePath(`/video/${video.id}`) : '',
    durationLabel: durationLabel(video),
    progressPercent: percent,
  }
}

const displayMovies = computed(() => movies.value.map(toDisplayMovie))
const featuredItems = computed(() => [...displayMovies.value].sort((a, b) => Number(b.video?.views || 0) - Number(a.video?.views || 0)).slice(0, 5))
const featuredItem = computed(() => featuredItems.value[activeFeaturedIndex.value] || featuredItems.value[0] || null)
const selectedMovie = computed(() => displayMovies.value.find((movie) => movie.id === selectedMovieId.value) || null)

const groups = computed(() => {
  const byGenre = new Map()
  for (const movie of displayMovies.value) {
    const genre = movie.genre || 'Movies'
    if (!byGenre.has(genre)) byGenre.set(genre, [])
    byGenre.get(genre).push(movie)
  }
  return [...byGenre.entries()].map(([genre, items]) => ({ genre, items }))
})

const relatedMovies = (movie) => displayMovies.value
  .filter((item) => item.id !== movie.id && item.genre === movie.genre)
  .slice(0, 6)

const openMovieModal = async (movie, updateRoute = true) => {
  selectedMovieId.value = movie?.id || ''
  if (updateRoute && movie?.id && route.query.movie_id !== movie.id) {
    await router.push({ query: { ...route.query, movie_id: movie.id } })
  }
}

const closeMovieModal = async () => {
  selectedMovieId.value = ''
  const { movie_id: _movieId, ...query } = route.query
  await router.push({ query })
}

const setFeaturedIndex = (index) => {
  activeFeaturedIndex.value = Math.max(0, Math.min(index, featuredItems.value.length - 1))
  startFeaturedHeroTimer()
}

const stopFeaturedHeroTimer = () => {
  if (featuredHeroTimer) clearInterval(featuredHeroTimer)
  featuredHeroTimer = null
}

const startFeaturedHeroTimer = () => {
  stopFeaturedHeroTimer()
  if (featuredItems.value.length <= 1) return
  featuredHeroTimer = setInterval(() => {
    activeFeaturedIndex.value = (activeFeaturedIndex.value + 1) % featuredItems.value.length
  }, 7000)
}

const loadMovieProgress = async () => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
  if (!userId || !movies.value.length) return
  try {
    const data = await getWatchProgressMap(movies.value.map((movie) => movie.id))
    watchProgressByVideoId.value = data?.progress || {}
  } catch (err) {
    console.error('Failed to load movie progress:', err)
  }
}

const updateMetaTags = () => {
  const movie = selectedMovie.value || featuredItem.value
  useMetaTags({
    title: movie?.title ? `${movie.title} - GilTube Movies` : 'Movies - GilTube',
    description: movie?.synopsis || 'GilTube movies organized by genre.',
    image: movie?.backdropUrl || movie?.posterUrl,
    url: route.fullPath,
    type: movie ? 'video.movie' : undefined,
  })
}

const loadMoviesCategory = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/v1/categories/movies/videos?limit=96&offset=0')
    if (!response.ok) throw new Error('failed to fetch movies')
    const data = await response.json()
    movies.value = (data || []).filter((video) => {
      const channelId = video.channel_id || video.channel?.id
      return channelId === GILTUBE_MOVIES_CHANNEL_ID
    })
    await loadMovieProgress()
    startFeaturedHeroTimer()
    const requestedMovieId = typeof route.query.movie_id === 'string' ? route.query.movie_id : ''
    if (requestedMovieId) {
      const movie = displayMovies.value.find((item) => item.id === requestedMovieId)
      if (movie) await openMovieModal(movie, false)
    }
    updateMetaTags()
  } catch (err) {
    console.error('Failed to load movies:', err)
    error.value = 'Failed to load movies.'
    stopFeaturedHeroTimer()
  } finally {
    loading.value = false
  }
}

watch(selectedMovie, updateMetaTags)

watch(() => route.query.movie_id, async (movieId) => {
  const id = typeof movieId === 'string' ? movieId : ''
  if (!id) {
    selectedMovieId.value = ''
    updateMetaTags()
    return
  }
  const movie = displayMovies.value.find((item) => item.id === id)
  if (movie) await openMovieModal(movie, false)
})

onMounted(loadMoviesCategory)
onUnmounted(stopFeaturedHeroTimer)
</script>

<style scoped>
.movie-details-layout {
  display: grid;
  gap: 1.5rem;
}

.movie-poster-column {
  display: none;
}

.movie-poster-frame {
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 0.25rem;
  background: rgb(24 24 27);
}

.movie-poster-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.movie-details-main {
  min-width: 0;
}

.movie-synopsis {
  max-width: 48rem;
  color: rgb(212 212 216);
  font-size: 0.875rem;
  line-height: 1.65;
}

.movie-meta-grid {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.25rem;
  color: rgb(161 161 170);
  font-size: 0.875rem;
}

.movie-meta-grid dt {
  color: rgb(113 113 122);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.movie-meta-grid dd {
  margin-top: 0.25rem;
  color: rgb(228 228 231);
}

.movie-related-section {
  margin-top: 2rem;
}

.movie-related-section h3 {
  font-size: 1.125rem;
  font-weight: 800;
}

.streaming-movie-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  align-items: start;
}

.movie-related-card {
  display: block;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.75rem;
  color: #fff;
  text-decoration: none;
  transition: background-color 160ms ease;
}

.movie-related-card:hover {
  background: rgb(24 24 27);
}

.movie-related-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.25rem;
  background: rgb(24 24 27);
}

.movie-related-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 180ms ease;
}

.movie-related-card:hover .movie-related-thumb img {
  transform: scale(1.03);
}

.movie-related-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.25rem;
  background: rgba(0, 0, 0, 0.55);
}

.movie-related-progress > div {
  height: 100%;
  background: rgb(220 38 38);
}

.movie-related-card h4 {
  display: -webkit-box;
  margin-top: 0.5rem;
  overflow: hidden;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (min-width: 640px) {
  .movie-meta-grid,
  .streaming-movie-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .movie-details-layout {
    grid-template-columns: 12rem minmax(0, 1fr);
  }

  .movie-poster-column {
    display: block;
  }

  .streaming-movie-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
