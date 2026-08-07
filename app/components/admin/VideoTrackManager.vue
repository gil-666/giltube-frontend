<template>
  <div :class="containerClass">
    <section class="space-y-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ t('videoEditor.audio.title') }}</h3>
          <p class="mt-1 text-sm text-gray-400">{{ t('videoEditor.audio.body') }}</p>
        </div>
        <button type="button" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600" @click="loadAudioTracks">
          {{ t('common.refresh') }}
        </button>
      </div>

      <div v-if="audioTracks.length" class="space-y-2">
        <div v-for="track in audioTracks" :key="track.id" class="flex flex-wrap items-center justify-between gap-3 rounded bg-zinc-950 px-3 py-2">
          <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <input v-model="track.language" :placeholder="t('videoEditor.languagePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <input v-model="track.label" :placeholder="t('videoEditor.languageNamePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <p class="text-xs text-gray-500 sm:col-span-2">{{ track.language || 'und' }} · {{ track.default ? t('movieAdmin.subtitles.default') : t('movieAdmin.subtitles.optional') }} · {{ track.delay_ms || 0 }}ms</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-if="!track.default || hasDuplicateAudioDefaults" type="button" :disabled="audioSaving" class="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" @click="makeAudioDefault(track)">
              {{ track.default ? t('movieAdmin.subtitles.keepOnlyDefault') : t('movieAdmin.subtitles.makeDefault') }}
            </button>
            <button type="button" :disabled="audioSaving" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAudioMetadata(track)">
              {{ t('videoEditor.actions.saveTitle') }}
            </button>
            <button type="button" :disabled="audioDownloadingId === track.id" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="downloadAudioTrack(track)">
              {{ audioDownloadingId === track.id ? t('common.preparing') : t('videoEditor.audio.downloadWav') }}
            </button>
            <button type="button" :disabled="audioSaving" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="startReplaceAudio(track)">
              {{ t('movieAdmin.subtitles.replace') }}
            </button>
            <button type="button" :disabled="audioSaving" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" @click="removeAudioTrack(track)">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
      <p v-else class="rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-500">{{ t('videoEditor.audio.empty') }}</p>

      <div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_7rem_9rem_7rem_7rem]">
        <input type="file" accept="audio/*,video/*,.mka,.mkv,.mp4,.aac,.mp3,.wav,.flac,.m4a" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white sm:col-span-2 2xl:col-span-1" @change="onAudioFileSelected" />
        <input v-model="audioForm.language" :placeholder="t('videoEditor.languagePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <input v-model="audioForm.label" :placeholder="t('videoEditor.languageNamePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <label class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-gray-300">
          <input v-model="audioForm.isDefault" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('movieAdmin.subtitles.default') }}
        </label>
        <input v-model.number="audioForm.delayMs" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
      </div>
      <p class="text-xs text-gray-500">{{ t('videoEditor.audio.delayHelp') }}</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" :disabled="(!audioForm.file && !audioForm.trackId) || audioSaving" class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAudioTrack">
          {{ audioSaving ? t('common.saving') : audioForm.trackId ? t('videoEditor.audio.saveTrack') : t('videoEditor.audio.addTrack') }}
        </button>
        <button v-if="audioForm.trackId" type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="resetAudioForm">
          {{ t('common.cancel') }}
        </button>
      </div>
    </section>

    <section class="space-y-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ t('videoEditor.subtitles.title') }}</h3>
          <p class="mt-1 text-sm text-gray-400">{{ t('videoEditor.subtitles.body') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-if="needsSubtitleDefaultFix" type="button" :disabled="subtitleSaving" class="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50" @click="fixSubtitleDefaults">
            {{ t('movieAdmin.subtitles.fixDefaults') }}
          </button>
          <button type="button" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600" @click="loadSubtitles">
            {{ t('common.refresh') }}
          </button>
        </div>
      </div>

      <div v-if="subtitles.length" class="mt-3 space-y-2">
        <div v-for="track in subtitles" :key="track.id" class="flex flex-col gap-3 rounded bg-zinc-950 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <input v-model="track.language" :placeholder="t('videoEditor.languagePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <input v-model="track.label" :placeholder="t('videoEditor.languageNamePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
            <p class="text-xs text-gray-500 sm:col-span-2">{{ track.language || 'und' }} · {{ track.default ? t('movieAdmin.subtitles.default') : t('movieAdmin.subtitles.optional') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <input v-model.number="track.delay_ms" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 sm:w-28" />
            <button v-if="!track.default || hasDuplicateSubtitleDefaults" type="button" :disabled="subtitleSaving" class="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" @click="makeSubtitleDefault(track)">
              {{ track.default ? t('movieAdmin.subtitles.keepOnlyDefault') : t('movieAdmin.subtitles.makeDefault') }}
            </button>
            <button type="button" :disabled="subtitleSaving" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleMetadata(track)">
              {{ t('videoEditor.actions.saveTitle') }}
            </button>
            <button type="button" :disabled="subtitleSaving" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleDelay(track)">
              {{ t('movieAdmin.subtitles.saveDelay') }}
            </button>
            <a :href="subtitleDownloadUrl(track)" :download="subtitleDownloadName(track)" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600">
              {{ t('movieAdmin.subtitles.download') }}
            </a>
            <button type="button" :disabled="subtitleSaving" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="startReplaceSubtitle(track)">
              {{ t('movieAdmin.subtitles.replace') }}
            </button>
            <button type="button" :disabled="subtitleSaving" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" @click="removeSubtitle(track)">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
      <p v-else class="mt-3 rounded border border-zinc-800 bg-black/30 px-4 py-6 text-sm text-gray-500">{{ t('movieAdmin.subtitles.empty') }}</p>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_7rem_9rem_7rem_7rem]">
        <input type="file" accept=".srt,.ass,.vtt,text/vtt" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white sm:col-span-2 2xl:col-span-1" @change="onSubtitleFileSelected" />
        <input v-model="subtitleForm.language" :placeholder="t('videoEditor.languagePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <input v-model="subtitleForm.label" :placeholder="t('videoEditor.languageNamePlaceholder')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
        <label class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-gray-300">
          <input v-model="subtitleForm.isDefault" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('movieAdmin.subtitles.default') }}
        </label>
        <input v-model.number="subtitleForm.delayMs" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" :disabled="(!subtitleForm.file && !subtitleForm.trackId) || subtitleSaving" class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleTrack">
          {{ subtitleSaving ? t('common.saving') : subtitleForm.trackId ? t('movieAdmin.subtitles.saveSubtitle') : t('movieAdmin.subtitles.addSubtitle') }}
        </button>
        <button v-if="subtitleForm.trackId" type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="resetSubtitleForm">
          {{ t('common.cancel') }}
        </button>
      </div>
    </section>

    <div v-if="errorMessage" class="rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteVideoAudioTrack, deleteVideoSubtitle, downloadAudioTrackWAV, listVideoAudioTracks, listVideoSubtitles, uploadVideoAudioTrack, uploadVideoSubtitle } from '~/app/service/videos'
import { resolveMediaUrl } from '~/app/utils/media'

type Track = {
  id: string
  label: string
  language: string
  uri: string
  default: boolean
  delay_ms: number
}

const props = withDefaults(defineProps<{
  videoId: string
  videoTitle?: string
  stacked?: boolean
}>(), {
  stacked: false,
})
const { t } = useI18n()

const containerClass = computed(() => [
  'grid gap-6',
  props.stacked ? 'grid-cols-1' : 'lg:grid-cols-2',
])

const subtitles = ref<Track[]>([])
const audioTracks = ref<Track[]>([])
const subtitleSaving = ref(false)
const audioSaving = ref(false)
const audioDownloadingId = ref('')
const errorMessage = ref('')

const subtitleForm = ref({
  file: null as File | null,
  label: '',
  language: 'en',
  isDefault: false,
  delayMs: 0,
  trackId: '',
})

const audioForm = ref({
  file: null as File | null,
  label: '',
  language: 'en',
  isDefault: false,
  delayMs: 0,
  trackId: '',
})

const hasDuplicateSubtitleDefaults = computed(() => subtitles.value.filter(track => track.default).length > 1)
const needsSubtitleDefaultFix = computed(() => subtitles.value.length > 0 && subtitles.value.filter(track => track.default).length !== 1)
const hasDuplicateAudioDefaults = computed(() => audioTracks.value.filter(track => track.default).length > 1)

const loadSubtitles = async () => {
  if (!props.videoId) return
  try {
    const data = await listVideoSubtitles(props.videoId)
    subtitles.value = data.subtitles || []
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.loadSubtitles')
    subtitles.value = []
  }
}

const loadAudioTracks = async () => {
  if (!props.videoId) return
  try {
    const data = await listVideoAudioTracks(props.videoId)
    audioTracks.value = data.audio_tracks || []
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.loadAudio')
    audioTracks.value = []
  }
}

const loadAll = async () => {
  errorMessage.value = ''
  resetSubtitleForm()
  resetAudioForm()
  await Promise.all([loadSubtitles(), loadAudioTracks()])
}

watch(() => props.videoId, async (next, prev) => {
  if (next && next !== prev) {
    await loadAll()
  }
}, { immediate: false })

onMounted(loadAll)

const onSubtitleFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  subtitleForm.value.file = input.files?.[0] || null
}

const onAudioFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  audioForm.value.file = input.files?.[0] || null
}

const resetSubtitleForm = () => {
  subtitleForm.value = { file: null, label: '', language: 'en', isDefault: false, delayMs: 0, trackId: '' }
}

const resetAudioForm = () => {
  audioForm.value = { file: null, label: '', language: 'en', isDefault: false, delayMs: 0, trackId: '' }
}

const saveSubtitleTrack = async () => {
  if (!props.videoId) return
  subtitleSaving.value = true
  errorMessage.value = ''
  try {
    const data = await uploadVideoSubtitle(props.videoId, {
      file: subtitleForm.value.file,
      label: subtitleForm.value.label,
      language: subtitleForm.value.language,
      isDefault: subtitleForm.value.isDefault,
      delayMs: subtitleForm.value.delayMs,
      trackId: subtitleForm.value.trackId || undefined,
    })
    subtitles.value = data.subtitles || []
    resetSubtitleForm()
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.saveSubtitle')
  } finally {
    subtitleSaving.value = false
  }
}

const saveSubtitleMetadata = async (track: Track) => {
  subtitleSaving.value = true
  errorMessage.value = ''
  try {
    const data = await uploadVideoSubtitle(props.videoId, {
      trackId: track.id,
      label: track.label,
      language: track.language,
      isDefault: track.default,
      delayMs: track.delay_ms || 0,
    })
    subtitles.value = data.subtitles || []
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.updateSubtitle')
  } finally {
    subtitleSaving.value = false
  }
}

const saveSubtitleDelay = async (track: Track) => {
  await saveSubtitleMetadata(track)
}

const makeSubtitleDefault = async (track: Track) => {
  await saveSubtitleMetadata({ ...track, default: true })
}

const fixSubtitleDefaults = async () => {
  const fallback = subtitles.value.find(track => track.default) || subtitles.value[0]
  if (!fallback) return
  await makeSubtitleDefault(fallback)
}

const startReplaceSubtitle = (track: Track) => {
  subtitleForm.value.trackId = track.id
  subtitleForm.value.label = track.label
  subtitleForm.value.language = track.language
  subtitleForm.value.isDefault = track.default
  subtitleForm.value.delayMs = track.delay_ms || 0
}

const removeSubtitle = async (track: Track) => {
  if (!confirm(t('videoEditor.subtitles.confirmDelete', { label: track.label || track.language || track.id }))) return
  subtitleSaving.value = true
  errorMessage.value = ''
  try {
    const data = await deleteVideoSubtitle(props.videoId, track.id)
    subtitles.value = data.subtitles || []
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.deleteSubtitle')
  } finally {
    subtitleSaving.value = false
  }
}

const saveAudioTrack = async () => {
  if (!props.videoId) return
  audioSaving.value = true
  errorMessage.value = ''
  try {
    const data = await uploadVideoAudioTrack(props.videoId, {
      file: audioForm.value.file,
      label: audioForm.value.label,
      language: audioForm.value.language,
      isDefault: audioForm.value.isDefault,
      delayMs: audioForm.value.delayMs,
      trackId: audioForm.value.trackId || undefined,
    })
    audioTracks.value = data.audio_tracks || []
    resetAudioForm()
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.saveAudio')
  } finally {
    audioSaving.value = false
  }
}

const saveAudioMetadata = async (track: Track) => {
  audioSaving.value = true
  errorMessage.value = ''
  try {
    const data = await uploadVideoAudioTrack(props.videoId, {
      trackId: track.id,
      label: track.label,
      language: track.language,
      isDefault: track.default,
    })
    audioTracks.value = data.audio_tracks || []
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.updateAudio')
  } finally {
    audioSaving.value = false
  }
}

const makeAudioDefault = async (track: Track) => {
  await saveAudioMetadata({ ...track, default: true })
}

const startReplaceAudio = (track: Track) => {
  audioForm.value.trackId = track.id
  audioForm.value.label = track.label
  audioForm.value.language = track.language
  audioForm.value.isDefault = track.default
  audioForm.value.delayMs = track.delay_ms || 0
}

const removeAudioTrack = async (track: Track) => {
  if (!confirm(t('videoEditor.audio.confirmDelete', { label: track.label || track.language || track.id }))) return
  audioSaving.value = true
  errorMessage.value = ''
  try {
    const data = await deleteVideoAudioTrack(props.videoId, track.id)
    audioTracks.value = data.audio_tracks || []
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.deleteAudio')
  } finally {
    audioSaving.value = false
  }
}

const subtitleDownloadUrl = (track: Track) => {
  const subtitlePath = track.uri.replace(/playlist\.m3u8(?:\?.*)?$/i, 'captions.vtt')
  return resolveMediaUrl(`/videos/${props.videoId}/${subtitlePath.startsWith('/') ? subtitlePath.slice(1) : subtitlePath}`)
}

const audioDownloadName = (track: Track) => {
  const base = (props.videoTitle || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const label = (track.label || track.language || track.id || 'audio').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${base || 'video'}-${label || 'audio'}.wav`
}

const downloadAudioTrack = async (track: Track) => {
  audioDownloadingId.value = track.id
  errorMessage.value = ''
  try {
    await downloadAudioTrackWAV(props.videoId, track.id, audioDownloadName(track))
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.downloadAudio')
  } finally {
    audioDownloadingId.value = ''
  }
}

const subtitleDownloadName = (track: Track) => {
  const base = (props.videoTitle || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const label = (track.label || track.language || track.id || 'subtitle').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${base || 'video'}-${label || 'subtitle'}.vtt`
}
</script>
