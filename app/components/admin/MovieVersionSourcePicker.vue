<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-zinc-950/60 p-1">
      <button
        type="button"
        :disabled="busy || disabled"
        :class="mode === 'upload' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'"
        class="flex-1 rounded-md px-3 py-2 text-sm font-bold transition disabled:opacity-50"
        @click="mode = 'upload'"
      >
        {{ t('admin.movieVersions.source.upload') }}
      </button>
      <button
        type="button"
        :disabled="busy || disabled"
        :class="mode === 'ingest' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'"
        class="flex-1 rounded-md px-3 py-2 text-sm font-bold transition disabled:opacity-50"
        @click="mode = 'ingest'"
      >
        {{ t('admin.movieVersions.source.ingest') }}
      </button>
    </div>

    <template v-if="mode === 'upload'">
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          :disabled="busy || disabled"
          class="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700 disabled:opacity-50"
          @click="fileInput?.click()"
        >
          {{ file ? t('admin.movieVersions.source.changeFile') : t('admin.movieVersions.source.chooseFile') }}
        </button>
        <input ref="fileInput" type="file" class="hidden" accept=".mkv,.mp4,.m4v,.mov,.ts,.m2ts,.avi,.webm" @change="onFileSelected" />
        <span v-if="file" class="min-w-0 truncate text-sm text-zinc-300">{{ file.name }} · {{ formatBytes(file.size) }}</span>
      </div>
      <div v-if="file && (busy || progress)" class="space-y-1">
        <div class="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div class="h-full rounded-full bg-primary-500 transition-[width] duration-300" :style="{ width: `${progress?.percent || 0}%` }" />
        </div>
        <p class="text-xs text-zinc-400">
          {{ t('admin.movieVersions.source.progress', { done: formatBytes(progress?.uploadedBytes || 0), total: formatBytes(file.size), percent: (progress?.percent || 0).toFixed(1) }) }}
          <template v-if="progress?.bytesPerSecond"> · {{ formatSpeed(progress.bytesPerSecond) }} · {{ etaLabel }}</template>
          <template v-if="progress?.resumed"> · {{ t('admin.movieVersions.source.resumed') }}</template>
        </p>
      </div>
      <div v-if="file && busy" class="flex flex-wrap gap-2">
        <button type="button" class="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-700" @click="pause">
          {{ t('admin.movieVersions.source.pause') }}
        </button>
      </div>
      <div v-else-if="file && progress && !uploadedIngestId" class="flex flex-wrap gap-2">
        <button type="button" class="rounded-lg bg-red-950/60 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-900/60" @click="discard">
          {{ t('admin.movieVersions.source.discard') }}
        </button>
      </div>
      <p class="text-xs leading-5 text-zinc-500">{{ t('admin.movieVersions.source.resumeHint') }}</p>
      <label class="flex cursor-pointer items-start gap-3">
        <input v-model="useLocalUpload" :disabled="busy || disabled" type="checkbox" class="mt-1 h-4 w-4 rounded accent-blue-500 disabled:opacity-50" />
        <span>
          <span class="block text-sm font-semibold">{{ t('upload.localUpload') }}</span>
          <span class="mt-0.5 block text-xs leading-5 text-zinc-500">{{ t('upload.localUploadHelper') }}</span>
        </span>
      </label>
    </template>

    <template v-else>
      <select
        v-model="ingestId"
        :disabled="busy || disabled"
        class="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:border-white/30 disabled:opacity-50"
      >
        <option value="">{{ t('admin.movieVersions.source.pickIngest') }}</option>
        <option v-for="item in usableIngests" :key="item.id" :value="item.id">
          {{ item.title }}{{ item.year ? ` (${item.year})` : '' }} · {{ item.qbittorrent_name || item.source_url }}
        </option>
      </select>
      <p v-if="!usableIngests.length" class="text-xs text-zinc-500">{{ t('admin.movieVersions.source.noIngests') }}</p>
    </template>

    <p v-if="error" class="rounded border border-red-500/30 bg-red-950/40 p-2 text-sm text-red-200">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MediaIngest } from '~/app/service/mediaIngests'
import { cancelIngestUpload, uploadIngestFileResumable, type ResumableUploadProgress } from '~/app/service/movieVersions'

const props = withDefaults(defineProps<{
  ingests: MediaIngest[]
  title?: string
  year?: number
  disabled?: boolean
  unattachedOnly?: boolean
}>(), { title: '', year: 0, disabled: false, unattachedOnly: false })

const emit = defineEmits<{ change: [] }>()

const { t } = useI18n()
const localUploadBaseURL = useLocalUploadBaseURL()

const mode = ref<'upload' | 'ingest'>('upload')
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const ingestId = ref('')
const uploadedIngestId = ref('')
const busy = ref(false)
const error = ref('')
const progress = ref<ResumableUploadProgress | null>(null)
const useLocalUpload = ref(false)
let controller: AbortController | null = null

// Downloaded ingests; for a new main version, only ones not attached yet.
const usableIngests = computed(() => props.ingests.filter(item =>
  (item.status === 'downloaded' || Number(item.progress) >= 1) && (!props.unattachedOnly || !item.attached_video_id)))

const etaLabel = computed(() => {
  const p = progress.value
  if (!p?.bytesPerSecond) return ''
  const seconds = Math.max(0, (p.totalBytes - p.uploadedBytes) / p.bytesPerSecond)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return t('admin.movieVersions.source.eta', { time: hours ? `${hours} h ${minutes} min` : `${minutes} min` })
})

watch([mode, ingestId], () => emit('change'))

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] || null
  input.value = ''
  uploadedIngestId.value = ''
  progress.value = null
  error.value = ''
  emit('change')
}

/** True once a source is chosen (the upload itself may still be pending). */
const hasSource = computed(() => mode.value === 'upload' ? Boolean(file.value) : Boolean(ingestId.value))

/** The chosen ingest, uploading the file first when needed. */
const ensureIngest = async (): Promise<string> => {
  error.value = ''
  if (mode.value === 'ingest') {
    if (!ingestId.value) throw new Error(t('admin.movieVersions.source.pickIngest'))
    return ingestId.value
  }
  if (uploadedIngestId.value) return uploadedIngestId.value
  if (!file.value) throw new Error(t('admin.movieVersions.source.chooseFile'))
  busy.value = true
  controller = new AbortController()
  try {
    const ingest = await uploadIngestFileResumable(file.value, {
      title: props.title,
      year: props.year,
      uploadBaseURL: useLocalUpload.value ? localUploadBaseURL : undefined,
      signal: controller.signal,
      onProgress: value => { progress.value = value },
    })
    uploadedIngestId.value = ingest.id
    return ingest.id
  } catch (err: any) {
    error.value = err?.name === 'AbortError'
      ? t('admin.movieVersions.source.paused')
      : err?.response?.data?.error || err?.message || t('admin.movieVersions.source.failed')
    throw err
  } finally {
    busy.value = false
    controller = null
  }
}

const pause = () => controller?.abort()

const discard = async () => {
  if (!file.value) return
  await cancelIngestUpload(file.value, useLocalUpload.value ? localUploadBaseURL : undefined)
  file.value = null
  progress.value = null
  error.value = ''
  emit('change')
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

const formatSpeed = (bytesPerSecond: number) => `${formatBytes(bytesPerSecond)}/s`

defineExpose({ ensureIngest, hasSource, busy })
</script>
