<template>
  <section class="space-y-5">
    <div>
      <h2 class="text-2xl font-bold text-white">Playback intro</h2>
      <p class="mt-1 text-sm text-zinc-400">
        A short clip played before every movie and series episode. Viewers download it once and keep it cached until you replace it.
      </p>
    </div>

    <p v-if="error" class="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{{ error }}</p>
    <p v-if="message" class="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">{{ message }}</p>

    <div class="grid gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:grid-cols-2">
      <div class="space-y-3">
        <p class="text-sm font-semibold text-zinc-300">Current intro</p>
        <video
          v-if="intro?.url"
          :key="intro.version"
          :src="intro.url"
          controls
          playsinline
          preload="metadata"
          class="aspect-video w-full rounded-xl bg-black"
        />
        <div v-else class="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-500">
          {{ loading ? 'Loading…' : 'No intro uploaded' }}
        </div>
        <p v-if="intro?.url" class="text-xs text-zinc-500">
          {{ formatSize(intro.size) }} · version {{ intro.version }} · updated {{ formatDate(intro.updated_at) }}
        </p>
      </div>

      <div class="space-y-4">
        <label class="grid gap-2 text-sm font-semibold text-zinc-300">
          {{ intro?.url ? 'Replace intro' : 'Upload intro' }}
          <input
            type="file"
            accept="video/mp4,video/webm,.mp4,.m4v,.webm"
            class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white"
            @change="onFileSelected"
          />
          <span class="text-xs font-normal text-zinc-500">MP4 (H.264/AAC) or WebM, up to 500 MB. Keep it short — it plays before every title.</span>
        </label>
        <button
          type="button"
          :disabled="!file || uploading"
          class="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white hover:bg-red-500 disabled:opacity-50"
          @click="upload"
        >
          {{ uploading ? `Uploading ${uploadProgress}%` : 'Upload' }}
        </button>

        <div class="space-y-3 border-t border-zinc-800 pt-4">
          <label class="flex items-center gap-3 text-sm text-zinc-200">
            <input :checked="intro?.enabled" :disabled="!intro?.url || saving" type="checkbox" class="h-4 w-4 accent-red-600" @change="saveSetting('enabled', ($event.target as HTMLInputElement).checked)" />
            Play intro before movies and episodes
          </label>
          <label class="flex items-center gap-3 text-sm text-zinc-200">
            <input :checked="intro?.allow_skip" :disabled="saving" type="checkbox" class="h-4 w-4 accent-red-600" @change="saveSetting('allow_skip', ($event.target as HTMLInputElement).checked)" />
            Let viewers skip the intro
          </label>
        </div>

        <button
          v-if="intro?.url"
          type="button"
          :disabled="saving || uploading"
          class="rounded-xl bg-zinc-800 px-5 py-2.5 font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
          @click="remove"
        >
          Remove intro
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  deletePlaybackIntro,
  getAdminPlaybackIntro,
  updatePlaybackIntroSettings,
  uploadPlaybackIntro,
  type PlaybackIntro,
} from '~/app/service/playbackIntro'

const intro = ref<PlaybackIntro | null>(null)
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const file = ref<File | null>(null)
const error = ref('')
const message = ref('')

const errorText = (err: any, fallback: string) => err?.response?.data?.error || err?.message || fallback

const formatSize = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : ''

const load = async () => {
  loading.value = true
  try {
    intro.value = await getAdminPlaybackIntro()
  } catch (err: any) {
    error.value = errorText(err, 'Failed to load playback intro')
  } finally {
    loading.value = false
  }
}

const onFileSelected = (event: Event) => {
  file.value = (event.target as HTMLInputElement).files?.[0] || null
}

const upload = async () => {
  if (!file.value) return
  uploading.value = true
  uploadProgress.value = 0
  error.value = ''
  message.value = ''
  try {
    intro.value = await uploadPlaybackIntro(file.value, (percent) => { uploadProgress.value = percent })
    file.value = null
    message.value = 'Intro uploaded and enabled. Viewers will fetch the new version on their next movie or episode.'
  } catch (err: any) {
    error.value = errorText(err, 'Failed to upload intro')
  } finally {
    uploading.value = false
  }
}

const saveSetting = async (key: 'enabled' | 'allow_skip', value: boolean) => {
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    intro.value = await updatePlaybackIntroSettings({ [key]: value })
    message.value = 'Intro settings saved.'
  } catch (err: any) {
    error.value = errorText(err, 'Failed to save intro settings')
    await load()
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  if (!window.confirm('Remove the playback intro? Movies and episodes will start immediately.')) return
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    intro.value = await deletePlaybackIntro()
    message.value = 'Intro removed.'
  } catch (err: any) {
    error.value = errorText(err, 'Failed to remove intro')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
