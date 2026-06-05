<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-white">{{ t('movieAdmin.title') }}</h2>
      <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.subtitle') }}</p>
    </div>

    <div class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.resumeExisting') }}</label>
      <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
        <select v-model="selectedMovieId" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" @change="selectExistingMovie">
          <option value="">{{ t('movieAdmin.createNewOption') }}</option>
          <option v-for="item in adminMovies" :key="item.id" :value="item.id">
            {{ item.title }}{{ item.video_id ? ` · ${t('movieAdmin.linkedBadge')}` : '' }}
          </option>
        </select>
        <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="startNewMovie">
          {{ t('movieAdmin.newMovie') }}
        </button>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5" @submit.prevent="handleMovieSubmit">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.title') }}</label>
            <input v-model="movieForm.title" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.slug') }}</label>
            <input v-model="movieForm.slug" :placeholder="t('movieAdmin.placeholders.slug')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.primaryGenre') }}</label>
            <input v-model="movieForm.genre" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.releaseYear') }}</label>
            <input v-model.number="movieForm.releaseYear" min="0" type="number" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.synopsis') }}</label>
          <textarea v-model="movieForm.synopsis" rows="4" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.genres') }}</label>
            <input v-model="movieForm.genres" :placeholder="t('movieAdmin.placeholders.genres')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.directors') }}</label>
            <input v-model="movieForm.directors" :placeholder="t('movieAdmin.placeholders.commaSeparated')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.cast') }}</label>
            <input v-model="movieForm.cast" :placeholder="t('movieAdmin.placeholders.commaSeparated')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.posterImage') }}</label>
            <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onMovieImageSelected($event, 'poster')" />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.backdropImage') }}</label>
            <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onMovieImageSelected($event, 'backdrop')" />
          </div>
        </div>

        <label class="flex items-center gap-3 rounded border border-zinc-700 bg-zinc-800 p-3 text-sm text-gray-300">
          <input v-model="movieForm.isFeatured" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('movieAdmin.featuredToggle') }}
        </label>

        <button type="submit" :disabled="movieCreating || movieSaving" class="rounded bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
          {{ createdMovieId ? (movieSaving ? t('common.saving') : t('movieAdmin.actions.saveMovieDetails')) : (movieCreating ? t('movieAdmin.actions.creatingMovie') : t('movieAdmin.actions.createMovie')) }}
        </button>
      </form>

      <aside class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
        <h3 class="font-semibold text-white">{{ t('movieAdmin.channelCard.title') }}</h3>
        <p class="mt-2 break-all text-sm text-gray-400">{{ moviesChannelId }}</p>
        <p class="mt-4 text-sm text-gray-400">{{ t('movieAdmin.channelCard.body') }}</p>
        <div v-if="movieVideoId || trailerVideoId" class="mt-4 space-y-3 rounded border border-zinc-800 bg-black/30 p-3 text-xs">
          <div v-if="movieVideoId" class="min-w-0">
            <span class="font-semibold uppercase tracking-wide text-gray-500">{{ t('movieAdmin.ids.movieVideo') }}</span>
            <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ movieVideoId }}</code>
          </div>
          <div v-if="trailerVideoId" class="min-w-0">
            <span class="font-semibold uppercase tracking-wide text-gray-500">{{ t('movieAdmin.ids.trailerVideo') }}</span>
            <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ trailerVideoId }}</code>
          </div>
        </div>
        <div v-if="movieProgressMessage" class="mt-4 rounded border border-blue-500/30 bg-blue-950/40 p-3 text-sm text-blue-100">{{ movieProgressMessage }}</div>
        <div v-if="movieError" class="mt-4 rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">{{ movieError }}</div>
      </aside>
    </div>

    <div v-if="createdMovieId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div>
        <h3 class="text-lg font-semibold text-white">{{ t('movieAdmin.trailer.title') }}</h3>
        <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.trailer.body') }}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]">
        <input v-model="trailerForm.title" :placeholder="t('movieAdmin.placeholders.trailerTitle')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onTrailerFileSelected" />
        <button type="button" :disabled="!trailerFile || trailerUploading" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadTrailer">
          {{ trailerUploading ? `${trailerProgress}%` : t('movieAdmin.actions.uploadTrailer') }}
        </button>
      </div>
    </div>

    <div v-if="createdMovieId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div>
        <h3 class="text-lg font-semibold text-white">{{ t('movieAdmin.fullMovie.title') }}</h3>
        <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.fullMovie.body') }}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_repeat(3,minmax(0,10rem))]">
        <input v-model="movieVideoTitle" :placeholder="t('movieAdmin.placeholders.movieVideoTitle')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onMovieFileSelected" />
        <button type="button" :disabled="!movieFile || movieUploading" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadMovieVideo()">
          {{ movieUploading ? `${movieUploadProgress}%` : (movieVideoId ? t('movieAdmin.actions.replaceUpload') : t('movieAdmin.actions.upload')) }}
        </button>
        <button type="button" :disabled="!movieFile || movieUploading" class="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadMovieVideo(true)">
          {{ t('movieAdmin.actions.localUpload') }}
        </button>
        <button type="button" :disabled="!movieVideoId || movieAttaching" class="rounded bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50" @click="attachMovieVideo">
          {{ movieAttaching ? t('movieAdmin.actions.attaching') : t('movieAdmin.actions.attachMovie') }}
        </button>
      </div>
    </div>

    <div v-if="createdMovieId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ t('movieAdmin.library.title') }}</h3>
          <p class="mt-1 text-sm text-gray-400">{{ t('movieAdmin.library.body') }}</p>
        </div>
        <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="loadExistingMovieVideos">
          {{ t('movieAdmin.actions.refreshLibrary') }}
        </button>
      </div>

      <input
        v-model="existingVideosQuery"
        :placeholder="t('movieAdmin.placeholders.searchLibrary')"
        class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />

      <div v-if="existingVideosLoading" class="rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-400">
        {{ t('movieAdmin.library.loading') }}
      </div>

      <div v-else-if="!filteredExistingMovieVideos.length" class="rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-400">
        {{ t('movieAdmin.library.empty') }}
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="video in filteredExistingMovieVideos" :key="video.id" class="overflow-hidden rounded-lg border border-zinc-800 bg-black/30">
          <div class="aspect-video overflow-hidden bg-zinc-950">
            <img v-if="video.thumbnail_url" :src="withBaseUrl(video.thumbnail_url)" :alt="video.title" class="h-full w-full object-cover" />
            <div v-else class="flex h-full items-center justify-center text-sm text-gray-500">{{ t('playlists.noThumbnail') }}</div>
          </div>
          <div class="space-y-3 p-4">
            <div>
              <h4 class="line-clamp-2 text-sm font-semibold text-white">{{ video.title }}</h4>
              <p class="mt-1 text-xs text-gray-500">
                {{ video.hidden ? t('movieAdmin.library.hidden') : t('movieAdmin.library.public') }} · {{ formatDate(video.created_at) }}
              </p>
              <code class="mt-2 block select-all break-all text-[11px] text-gray-400">{{ video.id }}</code>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                :disabled="trailerAttaching || trailerVideoId === video.id"
                class="rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                @click="linkExistingTrailer(video)"
              >
                {{ trailerVideoId === video.id ? t('movieAdmin.actions.trailerLinked') : (trailerAttaching ? t('movieAdmin.actions.linking') : t('movieAdmin.actions.useAsTrailer')) }}
              </button>
              <button
                type="button"
                :disabled="movieAttaching || movieVideoId === video.id"
                class="rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                @click="linkExistingMovie(video)"
              >
                {{ movieVideoId === video.id ? t('movieAdmin.actions.movieLinked') : (movieAttaching ? t('movieAdmin.actions.linking') : t('movieAdmin.actions.useAsMovie')) }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getChannelVideos } from '~/app/service/channels'
import { uploadVideo } from '~/app/service/upload'
import { createMovie, getMovie, GILTUBE_MOVIES_CHANNEL_ID, listMovies, setMovieTrailer, setMovieVideo, updateMovie } from '~/app/service/movies'

const localUploadBaseURL = 'http://localhost:8080/api/v1'
const moviesChannelId = GILTUBE_MOVIES_CHANNEL_ID
const { t } = useI18n()

const adminMovies = ref<any[]>([])
const selectedMovieId = ref('')
const createdMovieId = ref('')
const movieCreating = ref(false)
const movieSaving = ref(false)
const movieError = ref('')
const movieProgressMessage = ref('')
const trailerUploading = ref(false)
const trailerProgress = ref(0)
const trailerFile = ref<File | null>(null)
const trailerVideoId = ref('')
const trailerAttaching = ref(false)
const movieFile = ref<File | null>(null)
const movieUploading = ref(false)
const movieUploadProgress = ref(0)
const movieAttaching = ref(false)
const movieVideoId = ref('')
const movieVideoTitle = ref('')
const existingMovieVideos = ref<any[]>([])
const existingVideosLoading = ref(false)
const existingVideosQuery = ref('')

const trailerForm = ref({
  title: '',
})

const movieForm = ref({
  title: '',
  slug: '',
  synopsis: '',
  genre: t('movieAdmin.defaults.genre'),
  genres: '',
  directors: '',
  cast: '',
  releaseYear: 0,
  isFeatured: false,
  poster: null as File | null,
  backdrop: null as File | null,
  posterUrl: '',
  backdropUrl: '',
})

const listToText = (value: unknown) => Array.isArray(value) ? value.join(', ') : ''
const withBaseUrl = (url: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}
const formatDate = (value: string) => {
  if (!value) return t('movieAdmin.library.unknownDate')
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}
const filteredExistingMovieVideos = computed(() => {
  const query = existingVideosQuery.value.trim().toLowerCase()
  if (!query) return existingMovieVideos.value
  return existingMovieVideos.value.filter((video) =>
    String(video.title || '').toLowerCase().includes(query) ||
    String(video.description || '').toLowerCase().includes(query) ||
    String(video.id || '').toLowerCase().includes(query)
  )
})

const getMoviesCategoryId = () => {
  if (typeof window === 'undefined') return ''
  try {
    const stored = localStorage.getItem('categories')
    if (!stored) return ''
    const categories = JSON.parse(stored)
    return categories.find((item: any) => item.slug === 'movies')?.id || ''
  } catch {
    return ''
  }
}

const resetMovieWorkspace = () => {
  createdMovieId.value = ''
  selectedMovieId.value = ''
  trailerVideoId.value = ''
  movieVideoId.value = ''
  movieVideoTitle.value = ''
  existingVideosQuery.value = ''
  trailerForm.value.title = ''
  trailerFile.value = null
  movieFile.value = null
  trailerProgress.value = 0
  movieUploadProgress.value = 0
  movieForm.value = {
    title: '',
    slug: '',
    synopsis: '',
    genre: t('movieAdmin.defaults.genre'),
    genres: '',
    directors: '',
    cast: '',
    releaseYear: 0,
    isFeatured: false,
    poster: null,
    backdrop: null,
    posterUrl: '',
    backdropUrl: '',
  }
  movieError.value = ''
  movieProgressMessage.value = ''
}

const loadMoviesAdminData = async () => {
  const data = await listMovies()
  adminMovies.value = data.movies || []
}

const loadExistingMovieVideos = async () => {
  existingVideosLoading.value = true
  try {
    const videos = await getChannelVideos(moviesChannelId)
    existingMovieVideos.value = Array.isArray(videos) ? videos : []
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.loadLibrary')
  } finally {
    existingVideosLoading.value = false
  }
}

const hydrateMovieWorkspace = async (movieId: string) => {
  if (!movieId) {
    resetMovieWorkspace()
    return
  }
  movieError.value = ''
  movieProgressMessage.value = ''
  try {
    const detail = await getMovie(movieId)
    const item = detail.movie
    createdMovieId.value = item.id
    selectedMovieId.value = item.id
    trailerVideoId.value = item.trailer_video_id || ''
    movieVideoId.value = item.video_id || ''
    movieVideoTitle.value = item.video?.title || item.title || ''
    movieForm.value = {
      title: item.title || '',
      slug: item.slug || '',
      synopsis: item.synopsis || '',
      genre: item.genre || t('movieAdmin.defaults.genre'),
      genres: listToText(item.genres),
      directors: listToText(item.directors),
      cast: listToText(item.cast),
      releaseYear: item.release_year || 0,
      isFeatured: !!item.is_featured,
      poster: null,
      backdrop: null,
      posterUrl: item.poster_url || '',
      backdropUrl: item.backdrop_url || '',
    }
    trailerForm.value.title = `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`
    trailerFile.value = null
    movieFile.value = null
    trailerProgress.value = 0
    movieUploadProgress.value = 0
    movieProgressMessage.value = t('movieAdmin.messages.loaded', { title: movieForm.value.title })
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.loadMovie')
  }
}

const startNewMovie = () => {
  resetMovieWorkspace()
}

const selectExistingMovie = async () => {
  await hydrateMovieWorkspace(selectedMovieId.value)
}

const onMovieImageSelected = (event: Event, kind: 'poster' | 'backdrop') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  if (kind === 'poster') {
    movieForm.value.poster = file
  } else {
    movieForm.value.backdrop = file
  }
}

const handleCreateMovie = async () => {
  movieError.value = ''
  movieProgressMessage.value = ''
  if (!movieForm.value.title.trim()) {
    movieError.value = t('movieAdmin.errors.titleRequired')
    return
  }
  movieCreating.value = true
  try {
    const created = await createMovie({
      title: movieForm.value.title,
      slug: movieForm.value.slug,
      synopsis: movieForm.value.synopsis,
      genre: movieForm.value.genre,
      genres: movieForm.value.genres,
      directors: movieForm.value.directors,
      cast: movieForm.value.cast,
      releaseYear: movieForm.value.releaseYear,
      channelId: moviesChannelId,
      isFeatured: movieForm.value.isFeatured,
      poster: movieForm.value.poster,
      backdrop: movieForm.value.backdrop,
    })
    createdMovieId.value = created.id
    selectedMovieId.value = created.id
    trailerForm.value.title = `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`
    movieVideoTitle.value = movieForm.value.title
    await loadMoviesAdminData()
    movieProgressMessage.value = t('movieAdmin.messages.created')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.createMovie')
  } finally {
    movieCreating.value = false
  }
}

const saveMovieDetails = async () => {
  if (!createdMovieId.value) return
  movieError.value = ''
  movieProgressMessage.value = ''
  if (!movieForm.value.title.trim()) {
    movieError.value = t('movieAdmin.errors.titleRequired')
    return
  }
  movieSaving.value = true
  try {
    const updated = await updateMovie(createdMovieId.value, {
      title: movieForm.value.title,
      slug: movieForm.value.slug,
      synopsis: movieForm.value.synopsis,
      genre: movieForm.value.genre,
      genres: movieForm.value.genres,
      directors: movieForm.value.directors,
      cast: movieForm.value.cast,
      releaseYear: movieForm.value.releaseYear,
      channelId: moviesChannelId,
      isFeatured: movieForm.value.isFeatured,
      poster: movieForm.value.poster,
      backdrop: movieForm.value.backdrop,
      posterUrl: movieForm.value.posterUrl,
      backdropUrl: movieForm.value.backdropUrl,
      videoId: movieVideoId.value,
    })
    if (updated.poster_url) movieForm.value.posterUrl = updated.poster_url
    if (updated.backdrop_url) movieForm.value.backdropUrl = updated.backdrop_url
    movieForm.value.poster = null
    movieForm.value.backdrop = null
    await loadMoviesAdminData()
    await hydrateMovieWorkspace(createdMovieId.value)
    movieProgressMessage.value = t('movieAdmin.messages.saved')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.saveMovie')
  } finally {
    movieSaving.value = false
  }
}

const handleMovieSubmit = async () => {
  if (createdMovieId.value) {
    await saveMovieDetails()
  } else {
    await handleCreateMovie()
  }
}

const onTrailerFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  trailerFile.value = input.files?.[0] || null
}

const uploadTrailer = async () => {
  if (!createdMovieId.value || !trailerFile.value) return
  trailerUploading.value = true
  trailerProgress.value = 0
  movieError.value = ''
  try {
    const uploaded = await uploadVideo({
      title: trailerForm.value.title || `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`,
      description: t('movieAdmin.messages.trailerDescription', { title: movieForm.value.title }),
      channelId: moviesChannelId,
      videoFile: trailerFile.value,
      explicit: false,
      hidden: false,
      categoryId: getMoviesCategoryId(),
      onProgress: (progress) => {
        trailerProgress.value = progress
      },
    })
    trailerVideoId.value = uploaded.video_id
    await setMovieTrailer(createdMovieId.value, uploaded.video_id)
    await loadMoviesAdminData()
    await loadExistingMovieVideos()
    movieProgressMessage.value = t('movieAdmin.messages.trailerUploaded')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.uploadTrailer')
  } finally {
    trailerUploading.value = false
  }
}

const onMovieFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  movieFile.value = input.files?.[0] || null
}

const uploadMovieVideo = async (useLocalUpload = false) => {
  if (!movieFile.value) return
  movieUploading.value = true
  movieUploadProgress.value = 0
  movieError.value = ''
  try {
    const uploaded = await uploadVideo({
      title: movieVideoTitle.value || movieForm.value.title,
      description: movieForm.value.synopsis,
      channelId: moviesChannelId,
      videoFile: movieFile.value,
      explicit: false,
      hidden: true,
      uploadBaseURL: useLocalUpload ? localUploadBaseURL : undefined,
      onProgress: (progress) => {
        movieUploadProgress.value = progress
      },
    })
    movieVideoId.value = uploaded.video_id
    movieVideoTitle.value = uploaded.title || movieVideoTitle.value || movieForm.value.title
    await loadExistingMovieVideos()
    movieProgressMessage.value = t(useLocalUpload ? 'movieAdmin.messages.movieUploadedLocal' : 'movieAdmin.messages.movieUploaded')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.uploadMovieVideo')
  } finally {
    movieUploading.value = false
  }
}

const attachMovieVideo = async () => {
  if (!createdMovieId.value || !movieVideoId.value) return
  movieAttaching.value = true
  movieError.value = ''
  try {
    await setMovieVideo(createdMovieId.value, movieVideoId.value)
    await updateMovie(createdMovieId.value, {
      title: movieForm.value.title,
      slug: movieForm.value.slug,
      synopsis: movieForm.value.synopsis,
      genre: movieForm.value.genre,
      genres: movieForm.value.genres,
      directors: movieForm.value.directors,
      cast: movieForm.value.cast,
      releaseYear: movieForm.value.releaseYear,
      channelId: moviesChannelId,
      isFeatured: movieForm.value.isFeatured,
      posterUrl: movieForm.value.posterUrl,
      backdropUrl: movieForm.value.backdropUrl,
      videoId: movieVideoId.value,
    })
    await loadMoviesAdminData()
    await loadExistingMovieVideos()
    await hydrateMovieWorkspace(createdMovieId.value)
    movieProgressMessage.value = t('movieAdmin.messages.movieLinked')
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.attachMovie')
  } finally {
    movieAttaching.value = false
  }
}

const linkExistingTrailer = async (video: any) => {
  if (!createdMovieId.value || !video?.id) return
  trailerAttaching.value = true
  movieError.value = ''
  try {
    await setMovieTrailer(createdMovieId.value, video.id)
    trailerVideoId.value = video.id
    if (!trailerForm.value.title) {
      trailerForm.value.title = video.title || `${movieForm.value.title} ${t('movieAdmin.defaults.trailerSuffix')}`
    }
    await loadMoviesAdminData()
    await hydrateMovieWorkspace(createdMovieId.value)
    movieProgressMessage.value = t('movieAdmin.messages.linkedExistingTrailer', { title: video.title })
  } catch (err: any) {
    movieError.value = err?.response?.data?.error || err?.message || t('movieAdmin.errors.linkTrailer')
  } finally {
    trailerAttaching.value = false
  }
}

const linkExistingMovie = async (video: any) => {
  if (!video?.id) return
  movieVideoId.value = video.id
  movieVideoTitle.value = video.title || movieForm.value.title
  await attachMovieVideo()
}

onMounted(async () => {
  await loadMoviesAdminData()
  await loadExistingMovieVideos()
})
</script>
