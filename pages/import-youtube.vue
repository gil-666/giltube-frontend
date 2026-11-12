<template>
  <div class="fixed inset-0 z-[100] overflow-y-auto bg-zinc-950 text-white">
    <div class="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <header class="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-3 rounded-lg text-zinc-300 transition hover:text-white">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19 8 12l7-7" />
            </svg>
          </span>
          <span class="hidden text-sm font-bold sm:inline">{{ t('youtubeImport.back') }}</span>
        </NuxtLink>
        <h1 class="min-w-0 truncate text-center text-xl font-semibold sm:text-2xl">{{ t('youtubeImport.title') }}</h1>
        <NuxtLink :to="localePath('/upload')" class="hidden rounded-lg px-3 py-2 text-xs font-bold text-zinc-400 transition hover:bg-zinc-900 hover:text-white sm:block">
          {{ t('youtubeImport.uploadFileInstead') }}
        </NuxtLink>
        <div class="h-10 w-10 sm:hidden" aria-hidden="true"></div>
      </header>

      <div v-if="loading" class="flex min-h-[60dvh] items-center justify-center">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-b-red-500"></div>
      </div>

      <!-- Feature not available for this account -->
      <section v-else-if="!access?.available" class="mt-10 rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-6 text-center sm:p-10">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-zinc-400">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold">{{ unavailableTitle }}</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">{{ unavailableBody }}</p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <NuxtLink v-if="access?.reason === 'signed_out'" :to="localePath('/login')" class="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white">
            {{ t('youtubeImport.signIn') }}
          </NuxtLink>
          <NuxtLink v-else :to="localePath('/upload')" class="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white">
            {{ t('youtubeImport.uploadFileInstead') }}
          </NuxtLink>
        </div>
      </section>

      <main v-else class="space-y-6 py-6">
        <!-- Step 1: paste a link -->
        <section class="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-4 sm:p-6">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 7.5v9l7.5-4.5L9 7.5Z" />
              </svg>
            </span>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold">{{ t('youtubeImport.pasteHeading') }}</h2>
              <p class="text-sm text-zinc-400">{{ t('youtubeImport.pasteBody') }}</p>
            </div>
          </div>

          <form class="mt-5 flex flex-col gap-3 sm:flex-row" @submit.prevent="lookUp">
            <input
              ref="urlInput"
              v-model="url"
              type="url"
              inputmode="url"
              autocomplete="off"
              :placeholder="t('youtubeImport.urlPlaceholder')"
              class="field-control min-w-0 flex-1"
              :disabled="previewing || importing"
              @paste="onPaste"
            />
            <button
              type="submit"
              :disabled="!url.trim() || previewing || importing"
              class="rounded-lg bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ previewing ? t('youtubeImport.lookingUp') : t('youtubeImport.next') }}
            </button>
          </form>

          <p class="mt-3 text-xs text-zinc-500">{{ limitsLine }}</p>

          <div v-if="error" class="mt-4 rounded-lg border border-red-900/70 bg-red-950/60 px-4 py-3 text-sm font-semibold text-red-100">
            {{ error }}
            <NuxtLink v-if="duplicateVideoId" :to="localePath(`/video/${duplicateVideoId}`)" class="ml-1 underline">{{ t('youtubeImport.viewIt') }}</NuxtLink>
          </div>
          <div v-if="successMessage" class="mt-4 rounded-lg border border-green-900/70 bg-green-950/50 px-4 py-3 text-sm font-semibold text-green-100">
            {{ successMessage }}
          </div>
        </section>

        <!-- Step 2: confirm -->
        <section v-if="preview" class="overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/40">
          <div class="grid gap-0 sm:grid-cols-[16rem_minmax(0,1fr)]">
            <div class="relative aspect-video bg-black sm:aspect-auto sm:h-full">
              <img :src="preview.thumbnail" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" />
              <span v-if="preview.duration_seconds" class="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold">
                {{ formatDuration(preview.duration_seconds) }}
              </span>
            </div>
            <div class="min-w-0 p-4 sm:p-5">
              <p class="truncate text-xs font-medium text-zinc-500">{{ t('youtubeImport.from', { channel: preview.youtube_channel || 'YouTube' }) }}</p>
              <p class="mt-1 line-clamp-2 font-semibold">{{ preview.title }}</p>

              <div v-if="preview.blocked_reason" class="mt-4 rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
                {{ preview.blocked_reason }}
              </div>
              <div v-else-if="preview.existing_video_id" class="mt-4 rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
                {{ t('youtubeImport.alreadyImported') }}
                <NuxtLink :to="localePath(`/video/${preview.existing_video_id}`)" class="ml-1 underline">{{ t('youtubeImport.viewIt') }}</NuxtLink>
              </div>
            </div>
          </div>

          <form v-if="!preview.blocked_reason && !preview.existing_video_id" class="space-y-4 border-t border-white/[0.07] p-4 sm:p-5" @submit.prevent="submitImport">
            <div>
              <label class="mb-2 block text-sm font-bold" for="yt-import-title">{{ t('youtubeImport.titleLabel') }}</label>
              <input id="yt-import-title" v-model="form.title" type="text" maxlength="200" required class="field-control" />
            </div>

            <div v-if="channels.length > 1">
              <label class="mb-2 block text-sm font-bold" for="yt-import-channel">{{ t('youtubeImport.channelLabel') }}</label>
              <select id="yt-import-channel" v-model="form.channelId" required class="field-control">
                <option v-for="channel in channels" :key="channel.id" :value="channel.id">{{ channel.name }}</option>
              </select>
            </div>
            <p v-else-if="channels.length === 1" class="text-sm text-zinc-400">
              {{ t('youtubeImport.postingTo') }} <span class="font-semibold text-zinc-200">{{ channels[0].name }}</span>
            </p>

            <label class="flex cursor-pointer items-start gap-3">
              <input v-model="form.explicit" type="checkbox" class="mt-1 h-4 w-4 rounded accent-red-500" />
              <span class="text-sm">{{ t('youtubeImport.explicit') }}</span>
            </label>

            <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
              <input v-model="form.rights" type="checkbox" class="mt-1 h-4 w-4 rounded accent-red-500" />
              <span class="text-sm leading-6 text-zinc-300">{{ t('youtubeImport.rights') }}</span>
            </label>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="rounded-lg bg-zinc-800 px-5 py-3 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700" @click="resetForm">
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="importing || !form.rights || !form.title.trim() || !form.channelId || limitReached"
                class="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ importing ? t('youtubeImport.starting') : t('youtubeImport.import') }}
              </button>
            </div>
          </form>
        </section>

        <!-- Your imports -->
        <section v-if="imports.length">
          <h2 class="mb-3 text-sm font-semibold text-zinc-400">{{ t('youtubeImport.yourImports') }}</h2>
          <ul class="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/40">
            <li v-for="item in imports" :key="item.id" class="flex items-center gap-3 p-3 sm:gap-4">
              <div class="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-black sm:w-36">
                <img :src="resolveMediaUrl(item.thumbnail)" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" loading="lazy" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ item.title }}</p>
                <p class="truncate text-xs text-zinc-500">{{ item.channel_name }}</p>
                <div class="mt-1.5 flex items-center gap-2 text-xs">
                  <span :class="['inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold', statusClass(item.status)]">
                    <span v-if="item.status === 'downloading' || item.status === 'processing'" class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"></span>
                    {{ statusLabel(item) }}
                  </span>
                </div>
                <p v-if="item.status === 'failed' && item.error" class="mt-1 line-clamp-2 text-xs text-red-300">{{ item.error }}</p>
              </div>
              <div class="shrink-0">
                <NuxtLink
                  v-if="item.status === 'ready'"
                  :to="localePath(`/video/${item.video_id}`)"
                  class="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white"
                >
                  {{ t('youtubeImport.watch') }}
                </NuxtLink>
                <button
                  v-else-if="item.status === 'failed'"
                  type="button"
                  :disabled="retrying === item.id"
                  class="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                  @click="retry(item)"
                >
                  {{ retrying === item.id ? t('youtubeImport.starting') : t('youtubeImport.retry') }}
                </button>
              </div>
            </li>
          </ul>
          <p class="mt-3 text-xs text-zinc-500">{{ t('youtubeImport.listHint') }}</p>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { fetchUserChannels } from '~/app/service/upload'
import {
  getYouTubeImportAccess,
  listMyYouTubeImports,
  previewYouTubeImport,
  retryYouTubeImport,
  startYouTubeImport,
  type YouTubeImportAccess,
  type YouTubeImportItem,
  type YouTubeImportPreview,
} from '~/app/service/youtubeImport'
import { resolveMediaUrl } from '~/app/utils/media'
import { useMetaTags } from '~/app/composables/useMetaTags'

definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

useMetaTags({
  title: 'Import from YouTube - GilTube',
  description: 'Bring your YouTube videos to your GilTube channel',
})

const loading = ref(true)
const access = ref<YouTubeImportAccess | null>(null)
const channels = ref<Array<{ id: string; name: string; status?: string }>>([])
const imports = ref<YouTubeImportItem[]>([])
const url = ref('')
const urlInput = ref<HTMLInputElement | null>(null)
const preview = ref<YouTubeImportPreview | null>(null)
const previewing = ref(false)
const importing = ref(false)
const retrying = ref('')
const error = ref('')
const duplicateVideoId = ref('')
const successMessage = ref('')
const form = ref({ title: '', channelId: '', explicit: false, rights: false })
let pollTimer: ReturnType<typeof setTimeout> | null = null

const limitReached = computed(() => {
  const limit = access.value?.daily_limit || 0
  return limit > 0 && (access.value?.used_today || 0) >= limit
})

const limitsLine = computed(() => {
  const parts: string[] = []
  const limit = access.value?.daily_limit || 0
  if (limit > 0) parts.push(t('youtubeImport.dailyUsage', { used: access.value?.used_today || 0, limit }))
  const minutes = access.value?.max_duration_minutes || 0
  if (minutes > 0) {
    parts.push(minutes % 60 === 0
      ? t('youtubeImport.maxLengthHours', { hours: minutes / 60 }, minutes / 60)
      : t('youtubeImport.maxLengthMinutes', { minutes }))
  }
  if (access.value?.max_height) parts.push(t('youtubeImport.maxQuality', { height: access.value.max_height }))
  return parts.join(' · ')
})

const unavailableTitle = computed(() => access.value?.reason === 'signed_out'
  ? t('youtubeImport.unavailable.signedOutTitle')
  : t('youtubeImport.unavailable.title'))

const unavailableBody = computed(() => {
  switch (access.value?.reason) {
    case 'signed_out': return t('youtubeImport.unavailable.signedOut')
    case 'revoked': return t('youtubeImport.unavailable.revoked')
    case 'not_allowed': return t('youtubeImport.unavailable.notAllowed')
    case 'banned': return t('youtubeImport.unavailable.banned')
    default: return t('youtubeImport.unavailable.off')
  }
})

const errorText = (err: any, fallback: string) => {
  const data = err?.response?.data || {}
  if (data.reason && ['off', 'revoked', 'not_allowed', 'banned'].includes(data.reason)) {
    access.value = { ...(access.value || { available: false }), available: false, reason: data.reason }
  }
  return data.error || fallback
}

const refreshAccess = async () => {
  try {
    access.value = await getYouTubeImportAccess()
  } catch {
    access.value = { available: false, reason: 'off' }
  }
}

const loadImports = async () => {
  try {
    imports.value = await listMyYouTubeImports()
  } catch {
    // keep the last list
  }
  schedulePoll()
}

const schedulePoll = () => {
  if (pollTimer) clearTimeout(pollTimer)
  const active = imports.value.some(item => item.status === 'downloading' || item.status === 'processing')
  if (active) pollTimer = setTimeout(loadImports, 5000)
}

const loadChannels = async (userId: string) => {
  const result = await fetchUserChannels(userId)
  channels.value = (result.channels || []).filter((ch: any) => ch.status !== 'banned' && ch.status !== 'suspended')
  const activeAccount = localStorage.getItem('active_account')
  const preferred = channels.value.find(ch => ch.id === activeAccount)
    || channels.value.find(ch => ch.id === result.default_channel_id)
    || channels.value[0]
  form.value.channelId = preferred?.id || ''
}

onMounted(async () => {
  const userId = localStorage.getItem('user_id')
  if (!userId) {
    access.value = { available: false, reason: 'signed_out' }
    loading.value = false
    return
  }
  await refreshAccess()
  if (access.value?.available) {
    try {
      await loadChannels(userId)
    } catch {
      error.value = t('youtubeImport.errors.channels')
    }
    if (!channels.value.length) {
      await router.push(localePath('/create-channel'))
      return
    }
    await loadImports()
  }
  loading.value = false
})

onBeforeUnmount(() => {
  if (pollTimer) clearTimeout(pollTimer)
})

const onPaste = (event: ClipboardEvent) => {
  const pasted = event.clipboardData?.getData('text')?.trim()
  if (!pasted) return
  event.preventDefault()
  url.value = pasted
  lookUp()
}

const lookUp = async () => {
  if (!url.value.trim() || previewing.value) return
  error.value = ''
  duplicateVideoId.value = ''
  successMessage.value = ''
  preview.value = null
  previewing.value = true
  try {
    const data = await previewYouTubeImport(url.value.trim())
    preview.value = data
    form.value.title = data.title || ''
    form.value.explicit = false
    form.value.rights = false
    if (access.value) {
      access.value.used_today = data.used_today
      access.value.daily_limit = data.daily_limit
    }
  } catch (err: any) {
    error.value = errorText(err, t('youtubeImport.errors.lookup'))
  } finally {
    previewing.value = false
  }
}

const submitImport = async () => {
  if (!preview.value || importing.value) return
  error.value = ''
  duplicateVideoId.value = ''
  importing.value = true
  try {
    await startYouTubeImport({
      url: url.value.trim(),
      channelId: form.value.channelId,
      title: form.value.title.trim(),
      explicit: form.value.explicit,
    })
    successMessage.value = t('youtubeImport.started')
    if (access.value) access.value.used_today = (access.value.used_today || 0) + 1
    resetForm()
    await loadImports()
  } catch (err: any) {
    error.value = errorText(err, t('youtubeImport.errors.import'))
    duplicateVideoId.value = err?.response?.data?.reason === 'duplicate' ? err.response.data.video_id || '' : ''
  } finally {
    importing.value = false
  }
}

const resetForm = () => {
  preview.value = null
  url.value = ''
  form.value = { title: '', channelId: form.value.channelId, explicit: false, rights: false }
  urlInput.value?.focus()
}

const retry = async (item: YouTubeImportItem) => {
  retrying.value = item.id
  error.value = ''
  try {
    await retryYouTubeImport(item.id)
    await loadImports()
  } catch (err: any) {
    error.value = errorText(err, t('youtubeImport.errors.retry'))
  } finally {
    retrying.value = ''
  }
}

const statusLabel = (item: YouTubeImportItem) => {
  switch (item.status) {
    case 'downloading': return t('youtubeImport.status.downloading')
    case 'processing': return item.progress > 0
      ? t('youtubeImport.status.processingPercent', { percent: item.progress })
      : t('youtubeImport.status.processing')
    case 'ready': return t('youtubeImport.status.ready')
    default: return t('youtubeImport.status.failed')
  }
}

const statusClass = (status: string) => {
  switch (status) {
    case 'ready': return 'bg-green-950 text-green-300'
    case 'failed': return 'bg-red-950 text-red-300'
    default: return 'bg-zinc-800 text-zinc-300'
  }
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
</script>

<style scoped>
.field-control {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--gt-zinc-700));
  background: rgb(var(--gt-zinc-900));
  padding: 0.75rem 1rem;
  color: rgb(var(--gt-white));
  outline: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.field-control:focus {
  border-color: rgb(var(--gt-accent-500));
  background: rgb(var(--gt-zinc-950));
}

input::placeholder {
  color: rgb(var(--gt-zinc-500));
}
</style>
