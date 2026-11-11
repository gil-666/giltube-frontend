<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 flex overflow-hidden bg-black/90 text-white" :style="{ zIndex: 2147483647 }">
      <section class="flex min-h-0 w-full flex-col bg-zinc-950">
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-8">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase text-sky-400">{{ t('admin.movieVersions.kicker') }}</p>
            <h2 class="mt-1 truncate text-2xl font-semibold">{{ t('admin.movieVersions.title') }}</h2>
            <p class="mt-1 text-sm text-zinc-500">{{ t('admin.movieVersions.subtitle') }}</p>
          </div>
          <button type="button" :disabled="anyUploadBusy" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-800 text-2xl text-white hover:bg-zinc-700 disabled:opacity-50" :aria-label="t('common.close')" @click="close">×</button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <div class="mx-auto grid w-full max-w-5xl gap-5">
            <p v-if="error" class="rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ error }}</p>
            <p v-if="notice" class="rounded border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{{ notice }}</p>

            <!-- 1. Main version -->
            <section class="rounded-lg border border-white/[0.07] bg-zinc-900/60 p-4">
              <h3 class="font-bold">1 · {{ t('admin.movieVersions.main.title') }}</h3>
              <p class="mt-1 text-sm text-zinc-500">{{ t('admin.movieVersions.main.help') }}</p>
              <div class="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-zinc-950/60 p-1">
                <button type="button" :disabled="mainBusy" :class="mainMode === 'existing' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'" class="flex-1 rounded-md px-3 py-2 text-sm font-bold transition disabled:opacity-50" @click="mainMode = 'existing'">
                  {{ t('admin.movieVersions.main.existing') }}
                </button>
                <button type="button" :disabled="mainBusy" :class="mainMode === 'new' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'" class="flex-1 rounded-md px-3 py-2 text-sm font-bold transition disabled:opacity-50" @click="mainMode = 'new'">
                  {{ t('admin.movieVersions.main.new') }}
                </button>
              </div>

              <div v-if="mainMode === 'existing'" class="mt-3">
                <select v-model="movieId" class="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-white/30">
                  <option value="">{{ t('admin.movieVersions.main.pickMovie') }}</option>
                  <option v-for="movie in movies" :key="movie.id" :value="movie.id" :disabled="!movie.video_id">
                    {{ movie.title }}{{ movie.release_year ? ` (${movie.release_year})` : '' }}
                  </option>
                </select>
              </div>

              <div v-else class="mt-3 space-y-3">
                <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,14rem)]">
                  <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                    {{ t('admin.movieVersions.main.movieTitle') }}
                    <input v-model="mainForm.title" :disabled="mainBusy" class="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-white/30" />
                  </label>
                  <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                    {{ t('admin.mediaIngests.year') }}
                    <input v-model.number="mainForm.year" :disabled="mainBusy" type="number" min="0" class="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-white/30" />
                  </label>
                  <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                    {{ t('admin.movieVersions.main.channel') }}
                    <select v-model="mainForm.channelId" :disabled="mainBusy" class="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-white/30">
                      <option v-for="channel in channels" :key="channel.id" :value="channel.id">{{ channel.name }}</option>
                    </select>
                  </label>
                </div>
                <MovieVersionSourcePicker ref="mainPicker" :ingests="ingests" :title="mainForm.title" :year="mainForm.year" :disabled="mainBusy" unattached-only />
                <button type="button" :disabled="mainBusy || !mainForm.title.trim() || !mainForm.channelId" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50" @click="importMain">
                  {{ mainBusy ? t('admin.movieVersions.main.importing') : t('admin.movieVersions.main.import') }}
                </button>
              </div>

              <div v-if="movieId && state" class="mt-3 rounded-lg border border-white/[0.07] bg-zinc-950/60 p-3 text-sm">
                <p v-if="state.main_has_audio" class="text-emerald-300">{{ t('admin.movieVersions.main.ready', { tracks: state.main_audio.map(track => track.label).join(', ') }) }}</p>
                <p v-else class="text-amber-300">{{ t('admin.movieVersions.main.waiting') }}</p>
              </div>
            </section>

            <!-- Existing versions -->
            <section v-if="movieId && state?.versions?.length" class="rounded-lg border border-white/[0.07] bg-zinc-900/60 p-4">
              <h3 class="font-bold">{{ t('admin.movieVersions.existing.title') }}</h3>
              <div v-for="version in state.versions" :key="version.id" class="mt-3 flex flex-col gap-2 rounded-lg border border-white/[0.07] bg-zinc-950/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <p class="font-semibold"><span class="mr-2 rounded border border-sky-400/50 bg-sky-950/60 px-1.5 py-0.5 text-xs font-extrabold tracking-widest text-sky-100">{{ version.label }}</span>{{ version.source_name }}</p>
                  <p class="mt-1 text-xs text-zinc-400">
                    {{ versionStatusLabel(version) }}
                    <template v-if="version.offset_ms"> · {{ t('admin.movieVersions.existing.trimmed', { seconds: (version.offset_ms / 1000).toFixed(3) }) }}</template>
                  </p>
                  <p v-if="version.error_message" class="mt-1 text-xs text-red-300">{{ version.error_message }}</p>
                </div>
                <div class="flex shrink-0 gap-2">
                  <NuxtLink v-if="version.playable && state.video_id" :to="localePath(`/video/${state.video_id}?movie_id=${movieId}`)" target="_blank" class="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-700">
                    {{ t('admin.movieVersions.existing.watch') }}
                  </NuxtLink>
                  <button type="button" :disabled="removing === version.kind" class="rounded-lg bg-red-950/60 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-900/60 disabled:opacity-50" @click="removeVersion(version)">
                    {{ t('admin.movieVersions.existing.remove') }}
                  </button>
                </div>
              </div>
            </section>

            <!-- 2. IMAX source -->
            <section v-if="movieId && !hasImax" class="rounded-lg border border-white/[0.07] bg-zinc-900/60 p-4">
              <h3 class="font-bold">2 · {{ t('admin.movieVersions.imax.title') }}</h3>
              <p class="mt-1 text-sm text-zinc-500">{{ t('admin.movieVersions.imax.help') }}</p>
              <div class="mt-3 space-y-3">
                <MovieVersionSourcePicker ref="imaxPicker" :ingests="ingests" :title="imaxUploadTitle" :year="selectedMovie?.release_year || 0" :disabled="imaxBusy" @change="resetImaxSource" />
                <button type="button" :disabled="imaxBusy" class="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700 disabled:opacity-50" @click="loadImaxSource">
                  {{ imaxBusy ? t('admin.movieVersions.imax.loading') : t('admin.movieVersions.imax.use') }}
                </button>
              </div>

              <div v-if="imaxSources.length" class="mt-4 grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                  {{ t('admin.movieVersions.imax.file') }}
                  <select v-model="imaxFilePath" class="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-white/30" @change="pickSyncStream">
                    <option v-for="source in imaxSources" :key="source.file_path" :value="source.file_path">{{ source.relative_path }} · {{ formatBytes(source.size) }}</option>
                  </select>
                </label>
                <label class="grid gap-1 text-xs font-bold uppercase text-zinc-500">
                  {{ t('admin.movieVersions.imax.syncStream') }}
                  <select v-model.number="syncStreamIndex" class="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-white/30" @change="measurement = null">
                    <option v-for="stream in imaxAudioStreams" :key="stream.index" :value="stream.index">{{ audioStreamLabel(stream) }}</option>
                  </select>
                </label>
              </div>
            </section>

            <!-- 3. Line up -->
            <section v-if="movieId && !hasImax && imaxSources.length" class="rounded-lg border border-white/[0.07] bg-zinc-900/60 p-4">
              <h3 class="font-bold">3 · {{ t('admin.movieVersions.sync.title') }}</h3>
              <p class="mt-1 text-sm text-zinc-500">{{ t('admin.movieVersions.sync.help') }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" :disabled="measuring || !state?.main_has_audio || syncStreamIndex < 0" class="rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50" @click="measure">
                  {{ measuring ? t('admin.movieVersions.sync.measuring', { percent: measureProgress }) : t('admin.movieVersions.sync.measure') }}
                </button>
                <span v-if="!state?.main_has_audio" class="text-xs text-amber-300">{{ t('admin.movieVersions.main.waiting') }}</span>
              </div>
              <div v-if="measurement" class="mt-3 space-y-2 rounded-lg border p-3 text-sm" :class="measurement.verdict === 'ok' ? 'border-emerald-500/30 bg-emerald-950/30' : 'border-amber-500/30 bg-amber-950/30'">
                <p class="font-semibold">{{ verdictText }}</p>
                <p class="text-xs text-zinc-400">
                  {{ t('admin.movieVersions.sync.details', {
                    offset: (measurement.result.offset_ms / 1000).toFixed(3),
                    late: (measurement.result.late_offset_ms / 1000).toFixed(3),
                    confidence: Math.round(Math.min(measurement.result.confidence, measurement.result.late_confidence) * 100),
                    track: measurement.main_track,
                  }) }}
                </p>
              </div>
              <label v-if="measurement" class="mt-3 grid max-w-xs gap-1 text-xs font-bold uppercase text-zinc-500">
                {{ t('admin.movieVersions.sync.offset') }}
                <input v-model.number="offsetMs" type="number" step="1" class="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-normal normal-case text-white focus:border-white/30" />
                <span class="font-normal normal-case text-zinc-500">{{ t('admin.movieVersions.sync.offsetHelp') }}</span>
              </label>
            </section>

            <!-- 4. Extra tracks -->
            <section v-if="movieId && !hasImax && measurement" class="rounded-lg border border-white/[0.07] bg-zinc-900/60 p-4">
              <h3 class="font-bold">4 · {{ t('admin.movieVersions.extras.title') }}</h3>
              <p class="mt-1 text-sm text-zinc-500">{{ t('admin.movieVersions.extras.help') }}</p>
              <div class="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-xs font-bold uppercase text-zinc-500">{{ t('admin.movieVersions.extras.audio') }}</p>
                  <label v-for="stream in imaxAudioStreams" :key="`a${stream.index}`" class="mt-2 flex items-center gap-2 text-sm">
                    <input v-model="extraAudio" :value="stream.index" type="checkbox" class="h-4 w-4 accent-sky-500" />
                    <span>{{ audioStreamLabel(stream) }}<span v-if="mainHasLanguage(stream.tags?.language)" class="ml-1 text-xs text-zinc-500">· {{ t('admin.movieVersions.extras.alreadyHave') }}</span></span>
                  </label>
                  <p v-if="!imaxAudioStreams.length" class="mt-2 text-sm text-zinc-500">{{ t('admin.movieVersions.extras.none') }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold uppercase text-zinc-500">{{ t('admin.movieVersions.extras.subtitles') }}</p>
                  <label v-for="stream in imaxSubtitleStreams" :key="`s${stream.index}`" class="mt-2 flex items-center gap-2 text-sm">
                    <input v-model="extraSubtitles" :value="stream.index" type="checkbox" class="h-4 w-4 accent-sky-500" />
                    <span>{{ subtitleStreamLabel(stream) }}</span>
                  </label>
                  <p v-if="!imaxSubtitleStreams.length" class="mt-2 text-sm text-zinc-500">{{ t('admin.movieVersions.extras.none') }}</p>
                </div>
              </div>
            </section>

            <!-- 5. Import -->
            <section v-if="movieId && !hasImax && measurement" class="rounded-lg border border-white/[0.07] bg-zinc-900/60 p-4">
              <h3 class="font-bold">5 · {{ t('admin.movieVersions.import.title') }}</h3>
              <p class="mt-1 text-sm text-zinc-500">{{ t('admin.movieVersions.import.help') }}</p>
              <label v-if="measurement.verdict !== 'ok'" class="mt-3 flex items-start gap-2 text-sm text-amber-200">
                <input v-model="overrideVerdict" type="checkbox" class="mt-1 h-4 w-4 accent-amber-500" />
                <span>{{ t('admin.movieVersions.import.override') }}</span>
              </label>
              <button type="button" :disabled="importing || offsetMs < -21 || (measurement.verdict !== 'ok' && !overrideVerdict)" class="mt-3 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50" @click="importVersion">
                {{ importing ? importStep : t('admin.movieVersions.import.action') }}
              </button>
              <p v-if="offsetMs < -21" class="mt-2 text-xs text-red-300">{{ t('admin.movieVersions.sync.late') }}</p>
            </section>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import MovieVersionSourcePicker from '~/app/components/admin/MovieVersionSourcePicker.vue'
import {
  attachMediaIngest,
  importMediaIngestAudioTrack,
  importMediaIngestSubtitleTrack,
  listMediaIngestAudioSources,
  listMediaIngestSubtitleSources,
  listMediaIngests,
  type MediaIngest,
  type MediaIngestAudioSource,
  type MediaIngestAudioStream,
  type MediaIngestSubtitleSource,
  type MediaIngestSubtitleStream,
} from '~/app/service/mediaIngests'
import { clearMovieCache, GILTUBE_MOVIES_CHANNEL_ID, listMovies } from '~/app/service/movies'
import {
  createMovieVersion,
  deleteMovieVersion,
  listMovieVersions,
  measureMovieVersion,
  type MovieVersion,
  type MovieVersionMeasurement,
  type MovieVersionsState,
} from '~/app/service/movieVersions'

const props = defineProps<{
  open: boolean
  channels: Array<{ id: string; name: string }>
}>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const localePath = useLocalePath()

const VIDEO_EXTENSIONS = ['.mkv', '.mp4', '.m4v', '.mov', '.ts', '.m2ts', '.avi', '.webm']

const error = ref('')
const notice = ref('')
const ingests = ref<MediaIngest[]>([])
const movies = ref<any[]>([])
const movieId = ref('')
const state = ref<MovieVersionsState | null>(null)

const mainMode = ref<'existing' | 'new'>('existing')
const mainForm = reactive({ title: '', year: new Date().getFullYear(), channelId: '' })
const mainPicker = ref<InstanceType<typeof MovieVersionSourcePicker> | null>(null)
const mainBusy = ref(false)

const imaxPicker = ref<InstanceType<typeof MovieVersionSourcePicker> | null>(null)
const imaxBusy = ref(false)
const imaxIngestId = ref('')
const imaxSources = ref<MediaIngestAudioSource[]>([])
const imaxSubtitleSources = ref<MediaIngestSubtitleSource[]>([])
const imaxFilePath = ref('')
const syncStreamIndex = ref(-1)

const measuring = ref(false)
const measureProgress = ref(0)
const measurement = ref<MovieVersionMeasurement | null>(null)
const offsetMs = ref(0)

const extraAudio = ref<number[]>([])
const extraSubtitles = ref<number[]>([])
const importing = ref(false)
const overrideVerdict = ref(false)
const importStep = ref('')
const removing = ref('')

const anyUploadBusy = computed(() => Boolean(mainPicker.value?.busy || imaxPicker.value?.busy))
const selectedMovie = computed(() => movies.value.find(movie => movie.id === movieId.value))
const hasImax = computed(() => Boolean(state.value?.versions?.some(version => version.kind === 'imax')))
const imaxUploadTitle = computed(() => selectedMovie.value ? `${selectedMovie.value.title} (IMAX)` : 'IMAX')
const imaxAudioStreams = computed(() => imaxSources.value.find(source => source.file_path === imaxFilePath.value)?.streams || [])
const imaxSubtitleStreams = computed(() => imaxSubtitleSources.value.find(source => source.file_path === imaxFilePath.value)?.streams || [])

const verdictText = computed(() => {
  const value = measurement.value
  if (!value) return ''
  const seconds = (Math.abs(value.result.offset_ms) / 1000).toFixed(3)
  switch (value.verdict) {
    case 'ok':
      return Math.abs(value.result.offset_ms) <= 21 ? t('admin.movieVersions.sync.aligned') : t('admin.movieVersions.sync.trim', { seconds })
    case 'late':
      return t('admin.movieVersions.sync.late')
    case 'drift':
      return t('admin.movieVersions.sync.drift', { drift: (value.result.drift_ms / 1000).toFixed(3) })
    default:
      return t('admin.movieVersions.sync.weak')
  }
})

const errorText = (err: any, fallback: string) => err?.response?.data?.error || err?.message || fallback

const loadLists = async () => {
  const [ingestItems, movieData] = await Promise.all([listMediaIngests(), listMovies()])
  ingests.value = ingestItems
  movies.value = [...(movieData?.movies || [])].sort((a: any, b: any) => String(a.title).localeCompare(String(b.title)))
}

const refreshState = async () => {
  if (!movieId.value) {
    state.value = null
    return
  }
  try {
    state.value = await listMovieVersions(movieId.value)
  } catch (err: any) {
    error.value = errorText(err, t('admin.movieVersions.loadFailed'))
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
const stopPolling = () => {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

watch(() => props.open, async (open) => {
  stopPolling()
  if (!open) return
  error.value = ''
  notice.value = ''
  if (!mainForm.channelId) {
    mainForm.channelId = props.channels.find(channel => channel.id === GILTUBE_MOVIES_CHANNEL_ID)?.id || props.channels[0]?.id || ''
  }
  try {
    await loadLists()
  } catch (err: any) {
    error.value = errorText(err, t('admin.movieVersions.loadFailed'))
  }
  pollTimer = setInterval(() => {
    if (movieId.value && !measuring.value) void refreshState()
  }, 5000)
}, { immediate: true })

watch(movieId, () => {
  measurement.value = null
  void refreshState()
})

onBeforeUnmount(stopPolling)

const close = () => {
  if (anyUploadBusy.value) return
  stopPolling()
  emit('close')
}

const importMain = async () => {
  error.value = ''
  notice.value = ''
  mainBusy.value = true
  try {
    const ingestId = await mainPicker.value!.ensureIngest()
    const attached = await attachMediaIngest(ingestId, {
      channel_id: mainForm.channelId,
      title: mainForm.title.trim(),
      hidden: true,
    })
    clearMovieCache()
    await loadLists()
    mainMode.value = 'existing'
    movieId.value = String(attached?.movie_id || '')
    notice.value = t('admin.movieVersions.main.imported')
  } catch (err: any) {
    if (err?.name !== 'AbortError') error.value = errorText(err, t('admin.movieVersions.main.failed'))
  } finally {
    mainBusy.value = false
  }
}

const resetImaxSource = () => {
  imaxIngestId.value = ''
  imaxSources.value = []
  imaxSubtitleSources.value = []
  imaxFilePath.value = ''
  syncStreamIndex.value = -1
  measurement.value = null
  extraAudio.value = []
  extraSubtitles.value = []
}

const isEnglish = (language?: string) => ['en', 'eng'].includes(String(language || '').toLowerCase())

const pickSyncStream = () => {
  measurement.value = null
  extraAudio.value = []
  extraSubtitles.value = []
  const streams = imaxAudioStreams.value
  syncStreamIndex.value = (streams.find(stream => isEnglish(stream.tags?.language)) || streams[0])?.index ?? -1
}

const loadImaxSource = async () => {
  error.value = ''
  imaxBusy.value = true
  try {
    const ingestId = await imaxPicker.value!.ensureIngest()
    const [audio, subtitles] = await Promise.all([listMediaIngestAudioSources(ingestId), listMediaIngestSubtitleSources(ingestId)])
    imaxIngestId.value = ingestId
    imaxSources.value = (audio.sources || []).filter(source => VIDEO_EXTENSIONS.some(ext => source.file_path.toLowerCase().endsWith(ext)))
    imaxSubtitleSources.value = subtitles.sources || []
    if (!imaxSources.value.length) throw new Error(t('admin.movieVersions.imax.noVideo'))
    imaxFilePath.value = [...imaxSources.value].sort((a, b) => b.size - a.size)[0]!.file_path
    pickSyncStream()
    void loadLists()
  } catch (err: any) {
    if (err?.name !== 'AbortError') error.value = errorText(err, t('admin.movieVersions.imax.failed'))
  } finally {
    imaxBusy.value = false
  }
}

const measure = async () => {
  error.value = ''
  measuring.value = true
  measureProgress.value = 0
  measurement.value = null
  try {
    measurement.value = await measureMovieVersion(movieId.value, {
      ingest_id: imaxIngestId.value,
      file_path: imaxFilePath.value,
      stream_index: syncStreamIndex.value,
    }, percent => { measureProgress.value = percent })
    offsetMs.value = measurement.value.result.offset_ms
    overrideVerdict.value = false
  } catch (err: any) {
    error.value = errorText(err, t('admin.movieVersions.sync.failed'))
  } finally {
    measuring.value = false
  }
}

const mainHasLanguage = (language?: string) => {
  const value = String(language || '').toLowerCase()
  if (!value || value === 'und') return false
  return Boolean(state.value?.main_audio?.some(track => {
    const other = String(track.language || '').toLowerCase()
    return other === value || (other.length === 2 && value.startsWith(other)) || (value.length === 2 && other.startsWith(value))
  }))
}

const importVersion = async () => {
  error.value = ''
  notice.value = ''
  importing.value = true
  try {
    importStep.value = t('admin.movieVersions.import.starting')
    // The server snaps the cut to a frame; extra tracks use what it cuts.
    const { offset_ms: offset } = await createMovieVersion(movieId.value, {
      kind: 'imax',
      ingest_id: imaxIngestId.value,
      file_path: imaxFilePath.value,
      stream_index: syncStreamIndex.value,
      offset_ms: Math.max(0, Math.round(offsetMs.value)),
    })
    const failures: string[] = []
    for (const index of extraAudio.value) {
      const stream = imaxAudioStreams.value.find(item => item.index === index)
      importStep.value = t('admin.movieVersions.import.audio', { track: stream ? audioStreamLabel(stream) : `#${index}` })
      try {
        await importMediaIngestAudioTrack(imaxIngestId.value, {
          target_type: 'movie',
          target_id: movieId.value,
          file_path: imaxFilePath.value,
          stream_index: index,
          language: stream?.tags?.language || '',
          label: stream?.tags?.title || '',
          // The extra footage at the start of this source is cut from its
          // audio too, so it lines up with the main version.
          trim_start_ms: offset,
        })
      } catch (err: any) {
        failures.push(errorText(err, `#${index}`))
      }
    }
    for (const index of extraSubtitles.value) {
      const stream = imaxSubtitleStreams.value.find(item => item.index === index)
      importStep.value = t('admin.movieVersions.import.subtitle', { track: stream ? subtitleStreamLabel(stream) : `#${index}` })
      try {
        await importMediaIngestSubtitleTrack(imaxIngestId.value, {
          target_type: 'movie',
          target_id: movieId.value,
          file_path: imaxFilePath.value,
          stream_index: index,
          language: stream?.tags?.language || '',
          label: stream?.tags?.title || '',
          delay_ms: -offset,
        })
      } catch (err: any) {
        failures.push(errorText(err, `#${index}`))
      }
    }
    await refreshState()
    resetImaxSource()
    notice.value = t('admin.movieVersions.import.started')
    if (failures.length) error.value = t('admin.movieVersions.import.trackFailures', { errors: failures.join('; ') })
  } catch (err: any) {
    error.value = errorText(err, t('admin.movieVersions.import.failed'))
  } finally {
    importing.value = false
    importStep.value = ''
  }
}

const removeVersion = async (version: MovieVersion) => {
  if (!window.confirm(t('admin.movieVersions.existing.confirmRemove', { version: version.label }))) return
  removing.value = version.kind
  error.value = ''
  try {
    await deleteMovieVersion(movieId.value, version.kind)
    await refreshState()
  } catch (err: any) {
    error.value = errorText(err, t('admin.movieVersions.existing.removeFailed'))
  } finally {
    removing.value = ''
  }
}

const versionStatusLabel = (version: MovieVersion) => {
  switch (version.status) {
    case 'staging':
      return t('admin.movieVersions.status.staging', { percent: version.progress })
    case 'transcoding':
      return version.playable
        ? t('admin.movieVersions.status.playable', { percent: version.video_progress })
        : t('admin.movieVersions.status.transcoding', { percent: version.video_progress })
    case 'ready':
      return t('admin.movieVersions.status.ready')
    default:
      return t('admin.movieVersions.status.failed')
  }
}

const audioStreamLabel = (stream: MediaIngestAudioStream) => {
  const language = stream.tags?.language || 'und'
  const title = stream.tags?.title || ''
  const layout = stream.channels ? `${stream.channels} ch` : ''
  return [`#${stream.index}`, [language, title].filter(Boolean).join(' – '), stream.codec_name?.toUpperCase(), layout].filter(Boolean).join(' · ')
}

const subtitleStreamLabel = (stream: MediaIngestSubtitleStream) => {
  const language = stream.tags?.language || 'und'
  const title = stream.tags?.title || ''
  const forced = stream.disposition?.forced ? t('admin.mediaIngests.subtitles.forced') : ''
  return [`#${stream.index}`, [language, title].filter(Boolean).join(' – '), stream.codec_name?.toUpperCase(), forced].filter(Boolean).join(' · ')
}

const formatBytes = (bytes: number) => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}
</script>
