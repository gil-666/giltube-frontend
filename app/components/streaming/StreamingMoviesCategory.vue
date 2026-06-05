<template>
  <StreamingCategory
    :title="t('moviesCategory.title')"
    :eyebrow="t('moviesCategory.featured')"
    :item-label="t('moviesCategory.itemLabel')"
    :details-label="t('moviesCategory.details')"
    :empty-message="t('moviesCategory.empty')"
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
    <template #modal-actions="{ item }">
      <button
        type="button"
        class="streaming-watch-party-button"
        @click="openMovieWatchPartyDialog(item)"
      >
        {{ t('watchParty.startButton') }}
      </button>
    </template>

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
              <dt>{{ t('moviesCategory.meta.channel') }}</dt>
              <dd>{{ item.video?.channel?.name || t('moviesCategory.channelName') }}</dd>
            </div>
            <div v-if="item.video?.created_at">
              <dt>{{ t('moviesCategory.meta.added') }}</dt>
              <dd>{{ getTimeAgo(item.video.created_at) }}</dd>
            </div>
            <div>
              <dt>{{ t('moviesCategory.meta.views') }}</dt>
              <dd>{{ formatViews(item.video?.views || 0) }}</dd>
            </div>
            <div v-if="item.durationLabel">
              <dt>{{ t('moviesCategory.meta.runtime') }}</dt>
              <dd>{{ item.durationLabel }}</dd>
            </div>
          </dl>

          <div class="movie-related-section">
            <h3>{{ t('moviesCategory.moreLikeThis') }}</h3>
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

  <Teleport to="body">
    <div
      v-if="watchPartyDialogOpen"
      class="streaming-party-dialog-backdrop"
      @click.self="watchPartyDialogOpen = false"
    >
      <section class="streaming-party-dialog">
        <h2>{{ t('moviesCategory.watchParty.title') }}</h2>
        <p>{{ t('moviesCategory.watchParty.body') }}</p>

        <label>{{ t('watchParty.visibility') }}</label>
        <select v-model="watchPartyVisibility">
          <option value="private">{{ t('playlists.private') }}</option>
          <option value="public">{{ t('playlists.public') }}</option>
        </select>

        <label v-if="moviePartySavedProgress" class="streaming-party-choice">
          <input v-model="useSavedMovieProgress" type="checkbox" />
          <span>{{ t('moviesCategory.watchParty.continueFrom', { time: formatPlaybackTime(moviePartySavedProgress.playback_time_seconds) }) }}</span>
        </label>

        <p v-if="watchPartyError" class="streaming-party-error">{{ watchPartyError }}</p>

        <div class="streaming-party-dialog-actions">
          <button type="button" @click="watchPartyDialogOpen = false">{{ t('common.cancel') }}</button>
          <button type="button" :disabled="creatingWatchParty" @click="startMovieWatchParty">
            {{ creatingWatchParty ? t('watchParty.starting') : t('watchParty.startParty') }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StreamingCategory from './StreamingCategory.vue'
import { getWatchProgressMap } from '~/app/service/videos'
import { createWatchParty, getWatchPartySavedProgress } from '~/app/service/watchParties'
import { GILTUBE_MOVIES_CHANNEL_ID, getMovie, listMovies } from '~/app/service/movies'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

const loading = ref(false)
const error = ref('')
const movies = ref([])
const activeFeaturedIndex = ref(0)
const selectedMovieId = ref('')
const watchProgressByVideoId = ref({})
const watchPartyDialogOpen = ref(false)
const watchPartyVisibility = ref('private')
const creatingWatchParty = ref(false)
const watchPartyError = ref('')
const watchPartyMovie = ref(null)
const moviePartySavedProgress = ref(null)
const useSavedMovieProgress = ref(false)
let featuredHeroTimer = null

const withBaseUrl = (url) => {
  if (!url) return `${baseUrl}/videos/placeholder-thumbnail.jpg`
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const normalizeMovieDetail = (data) => {
  if (!data) return null
  if (!data.movie) return data
  return data.movie
}

const durationLabel = (video) => {
  const seconds = Number(video?.duration_seconds ?? video?.duration ?? 0)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours > 0 ? `${hours}h ${remainder}m` : `${minutes}m`
}

const primaryGenre = (movie) => movie?.genre || movie?.video?.genre || t('moviesCategory.fallbackGenre')

const watchProgressPercent = (progress) => {
  const position = Number(progress?.position_seconds || 0)
  const duration = Number(progress?.duration_seconds || 0)
  if (progress?.completed || !Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return 0
  if (position <= 5 || position / duration >= 0.9) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

const movieWatchLink = (movie) => {
  const videoId = movie?.video_id || movie?.video?.id
  return videoId ? localePath(`/video/${videoId}?movie_id=${movie.id}`) : ''
}

const toDisplayMovie = (movie) => {
  const linkedVideoId = movie?.video_id || movie?.video?.id || ''
  const progress = linkedVideoId ? watchProgressByVideoId.value[linkedVideoId] : null
  const percent = watchProgressPercent(progress)
  return {
    ...movie,
    id: movie.id,
    video: movie.video || null,
    title: movie.title,
    synopsis: movie.synopsis || movie.video?.description || t('moviesCategory.synopsisFallback'),
    genre: primaryGenre(movie),
    posterUrl: withBaseUrl(movie.poster_url || movie.video?.thumbnail_url),
    backdropUrl: withBaseUrl(movie.backdrop_url || movie.video?.thumbnail_url || movie.poster_url),
    meta: [
      movie.release_year ? String(movie.release_year) : '',
      durationLabel(movie.video),
      `${formatViews(movie.video?.views || 0)} views`,
    ].filter(Boolean),
    cardMeta: durationLabel(movie.video) || `${formatViews(movie.video?.views || 0)} views`,
    primaryLink: movieWatchLink(movie),
    startOverLink: linkedVideoId ? localePath(`/video/${linkedVideoId}?movie_id=${movie.id}&start_over=1`) : '',
    primaryLabel: t('streaming.actions.play'),
    resumeLink: progress && percent > 0 && linkedVideoId ? localePath(`/video/${linkedVideoId}?movie_id=${movie.id}`) : '',
    durationLabel: durationLabel(movie.video),
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
    const genre = movie.genre || t('moviesCategory.fallbackGenre')
    if (!byGenre.has(genre)) byGenre.set(genre, [])
    byGenre.get(genre).push(movie)
  }
  return [...byGenre.entries()].map(([genre, items]) => ({ genre, items }))
})

const relatedMovies = (movie) => displayMovies.value
  .filter((item) => item.id !== movie.id && item.genre === movie.genre)
  .slice(0, 6)

const activeWatchPartyChannelId = () => {
  const activeAccount = typeof window !== 'undefined' ? localStorage.getItem('active_account') : ''
  return activeAccount && activeAccount !== 'personal' ? activeAccount : ''
}

const formatPlaybackTime = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds || 0)))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`
}

const openMovieWatchPartyDialog = async (movie) => {
  if (!movie?.id) return
  if (typeof window !== 'undefined' && !localStorage.getItem('user_id')) {
    await router.push(localePath('/login'))
    return
  }
  watchPartyMovie.value = movie
  watchPartyError.value = ''
  watchPartyVisibility.value = 'private'
  moviePartySavedProgress.value = null
  useSavedMovieProgress.value = false
  watchPartyDialogOpen.value = true
  try {
    const data = await getWatchPartySavedProgress('movie', movie.id)
    moviePartySavedProgress.value = data?.progress || null
    useSavedMovieProgress.value = !!moviePartySavedProgress.value
  } catch (err) {
    console.error('Failed to load saved movie party progress:', err)
  }
}

const startMovieWatchParty = async () => {
  const movie = watchPartyMovie.value
  if (!movie?.id) return
  creatingWatchParty.value = true
  watchPartyError.value = ''
  try {
    const saved = useSavedMovieProgress.value ? moviePartySavedProgress.value : null
    const party = await createWatchParty({
      videoId: saved?.video_id || movie.video_id || movie.video?.id,
      visibility: watchPartyVisibility.value,
      title: movie.title || '',
      channelId: activeWatchPartyChannelId(),
      partyType: 'single',
      mediaType: 'movie',
      mediaId: movie.id,
      startTimeSeconds: Number(saved?.playback_time_seconds || 0),
    })
    watchPartyDialogOpen.value = false
    if (typeof window !== 'undefined') {
      localStorage.setItem('giltube:active-watch-party', JSON.stringify({ id: party.id, title: movie.title || t('watchParty.titleFallback') }))
      window.dispatchEvent(new Event('giltube:watch-party-updated'))
    }
    await router.push(localePath(`/watch-party/${party.id}?room=1`))
  } catch (err) {
    watchPartyError.value = err?.response?.data?.error || err?.message || t('watchParty.errors.startFailed')
  } finally {
    creatingWatchParty.value = false
  }
}

const openMovieModal = async (movie, updateRoute = true) => {
  if (!movie?.id) return
  let detail = movie
  if (!movie.video && !movie.video_id) {
    try {
      detail = normalizeMovieDetail(await getMovie(movie.id)) || movie
    } catch {
      detail = movie
    }
  }
  selectedMovieId.value = detail.id || ''
  const loaded = movies.value.findIndex((item) => item.id === detail.id)
  if (loaded >= 0) {
    movies.value[loaded] = { ...movies.value[loaded], ...detail }
  }
  if (updateRoute && detail.id && route.query.movie_id !== detail.id) {
    await router.push({ query: { ...route.query, movie_id: detail.id } })
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
    const videoIds = movies.value.map((movie) => movie.video_id || movie.video?.id).filter(Boolean)
    const data = await getWatchProgressMap(videoIds)
    watchProgressByVideoId.value = data?.progress || {}
  } catch (err) {
    console.error('Failed to load movie progress:', err)
  }
}

const updateMetaTags = () => {
  const movie = selectedMovie.value || featuredItem.value
  useMetaTags({
    title: movie?.title ? `${movie.title} - ${t('moviesCategory.title')} - GilTube` : `${t('moviesCategory.title')} - GilTube`,
    description: movie?.synopsis || t('moviesCategory.metaDescription'),
    image: movie?.backdropUrl || movie?.posterUrl,
    url: route.fullPath,
    type: movie ? 'video.movie' : undefined,
  })
}

const loadMoviesCategory = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await listMovies()
    movies.value = (data.movies || []).filter((movie) => {
      const channelId = movie.channel_id || movie.video?.channel?.id
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
    error.value = t('moviesCategory.errors.load')
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
  if (movie) {
    await openMovieModal(movie, false)
    return
  }
  try {
    const detail = normalizeMovieDetail(await getMovie(id))
    if (detail) {
      const loaded = movies.value.findIndex((item) => item.id === detail.id)
      if (loaded >= 0) {
        movies.value[loaded] = { ...movies.value[loaded], ...detail }
      } else {
        movies.value = [detail, ...movies.value]
      }
      await openMovieModal(detail, false)
    }
  } catch (err) {
    console.error('Failed to load movie detail:', err)
  }
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

.streaming-watch-party-button {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(220, 38, 38, 0.92);
  padding: 0.75rem 1rem;
  color: #fff;
  font-weight: 800;
  transition: background-color 160ms ease;
}

.streaming-watch-party-button:hover {
  background: rgb(185 28 28);
}

.streaming-party-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgba(127, 29, 29, 0.34), rgba(0, 0, 0, 0.88) 58%);
  padding: 1rem;
}

.streaming-party-dialog {
  width: min(100%, 28rem);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  background: rgb(24 24 27);
  padding: 1.5rem;
  color: #fff;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65);
}

.streaming-party-dialog h2 {
  font-size: 1.25rem;
  font-weight: 800;
}

.streaming-party-dialog p {
  margin-top: 0.5rem;
  color: rgb(161 161 170);
  font-size: 0.875rem;
  line-height: 1.5;
}

.streaming-party-dialog label {
  display: block;
  margin-top: 1rem;
  color: rgb(212 212 216);
  font-size: 0.875rem;
  font-weight: 700;
}

.streaming-party-dialog select {
  margin-top: 0.5rem;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid rgb(63 63 70);
  background: rgb(39 39 42);
  padding: 0.65rem 0.75rem;
  color: #fff;
  outline: none;
}

.streaming-party-choice {
  display: flex !important;
  align-items: center;
  gap: 0.65rem;
}

.streaming-party-choice input {
  height: 1rem;
  width: 1rem;
}

.streaming-party-error {
  color: rgb(252 165 165) !important;
}

.streaming-party-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.streaming-party-dialog-actions button {
  border-radius: 0.375rem;
  background: rgb(63 63 70);
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-weight: 800;
}

.streaming-party-dialog-actions button:last-child {
  background: rgb(220 38 38);
}

.streaming-party-dialog-actions button:disabled {
  opacity: 0.6;
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
