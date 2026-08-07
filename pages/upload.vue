<template>
  <div class="fixed inset-0 z-[100] overflow-y-auto bg-zinc-950 text-white">
    <div class="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <header class="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-3 rounded-lg text-zinc-300 transition hover:text-white">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19 8 12l7-7" />
            </svg>
          </span>
          <span class="hidden text-sm font-bold sm:inline">{{ t('upload.cancel') }}</span>
        </NuxtLink>
        <div class="min-w-0 text-center">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{{ t('upload.title') }}</p>
          <h1 class="mt-1 truncate text-2xl font-black sm:text-3xl">
            {{ currentStageTitle }}
          </h1>
        </div>
        <div class="h-10 w-10" aria-hidden="true"></div>
      </header>

      <div v-if="!isReady" class="flex min-h-[70dvh] items-center justify-center">
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-zinc-700 border-b-blue-500"></div>
          <p class="text-sm font-semibold text-zinc-300">{{ t('upload.checkingChannels') }}</p>
        </div>
      </div>

      <main v-else class="grid flex-1 gap-6 py-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside class="hidden lg:block">
          <div class="sticky top-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/20">
            <div
              v-for="item in stageItems"
              :key="item.key"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
              :class="stage === item.key ? 'bg-blue-600 text-white' : 'text-zinc-500'"
            >
              <span class="h-2.5 w-2.5 rounded-full" :class="stage === item.key ? 'bg-white' : 'bg-zinc-700'"></span>
              <span class="font-bold">{{ item.label }}</span>
            </div>
          </div>
        </aside>

        <section class="min-w-0">
          <div v-if="error" class="mb-4 rounded-lg border border-red-900/70 bg-red-950/60 px-4 py-3 text-sm font-semibold text-red-100">
            {{ error }}
          </div>

          <div v-if="stage === 'select'" class="mx-auto max-w-3xl">
            <button
              type="button"
              class="group flex min-h-[22rem] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition sm:min-h-[28rem] sm:p-10"
              :class="isDraggingFile ? 'border-blue-500 bg-blue-950/20' : 'border-zinc-700 bg-zinc-950 hover:border-blue-500 hover:bg-zinc-900/40'"
              @click="triggerFileInput"
              @dragenter.prevent="isDraggingFile = true"
              @dragover.prevent="isDraggingFile = true"
              @dragleave.prevent="handleFileDragLeave"
              @drop.prevent="handleFileDrop"
            >
              <span class="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition group-hover:bg-blue-600 group-hover:text-white">
                <svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 0 1 15.9 6H16a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v11" />
                </svg>
              </span>
              <span class="text-2xl font-black">{{ t('upload.clickToSelect') }}</span>
              <span class="mt-2 max-w-sm text-sm leading-6 text-zinc-400">{{ t('upload.dragAndDrop') }}</span>
              <span class="mt-6 rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">MP4, WebM, MOV</span>
            </button>
            <input ref="fileInput" type="file" accept="video/*" class="hidden" @change="handleFileSelect" />
          </div>

          <form v-if="stage === 'details'" class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]" @submit.prevent="handleStartUpload">
            <div class="space-y-5">
              <section class="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/20 sm:p-5">
                <div class="flex items-center gap-4">
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-blue-300">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 10 4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{{ t('upload.selectedFile') }}</p>
                    <p class="mt-1 truncate text-base font-black">{{ selectedFileName }}</p>
                    <p v-if="selectedFile" class="mt-1 text-xs text-zinc-500">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                  <button type="button" class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50" :disabled="isUploading" @click="stage = 'select'">
                    {{ t('upload.changeFile') }}
                  </button>
                </div>
              </section>

              <section class="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/20 sm:p-5">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-bold">{{ t('upload.channel') }}</label>
                    <select v-model="form.channelId" required class="field-control">
                      <option value="">{{ t('upload.selectChannel') }}</option>
                      <option v-for="channel in channels" :key="channel.id" :value="channel.id">{{ channel.name }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-bold">{{ t('upload.category') }}</label>
                    <select v-model="form.categoryId" class="field-control">
                      <option value="">{{ t('upload.selectCategory') }}</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="mt-4">
                  <label class="mb-2 block text-sm font-bold">{{ t('upload.videoTitle') }}</label>
                  <input v-model="form.title" type="text" :placeholder="t('upload.videoTitlePlaceholder')" required class="field-control" />
                </div>

                <div class="mt-4">
                  <label class="mb-2 block text-sm font-bold">{{ t('upload.description') }}</label>
                  <textarea v-model="form.description" :placeholder="t('upload.descriptionPlaceholder')" rows="6" class="field-control resize-none" />
                </div>
              </section>
            </div>

            <aside class="space-y-5">
              <section class="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/20">
                <label class="flex cursor-pointer items-start gap-3">
                  <input id="explicit-toggle" v-model="form.explicit" type="checkbox" class="mt-1 h-4 w-4 rounded accent-red-500" />
                  <span class="min-w-0">
                    <span class="block text-sm font-black">{{ t('upload.explicit') }}</span>
                    <span class="mt-1 block text-xs leading-5 text-zinc-500">{{ t('upload.explicitHelper') }}</span>
                  </span>
                </label>
              </section>

              <section v-if="isAdmin" class="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/20">
                <label class="flex cursor-pointer items-start gap-3">
                  <input id="local-upload-toggle" v-model="useLocalUpload" type="checkbox" class="mt-1 h-4 w-4 rounded accent-blue-500" />
                  <span>
                    <span class="block text-sm font-black">{{ t('upload.localUpload') }}</span>
                    <span class="mt-1 block text-xs leading-5 text-zinc-500">{{ t('upload.localUploadHelper') }}</span>
                  </span>
                </label>
              </section>

              <section class="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/20">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <label class="text-sm font-black">{{ t('upload.customThumbnail') }}</label>
                  <button v-if="thumbnailPreview" type="button" class="text-xs font-bold text-red-300 transition hover:text-red-200" @click="clearThumbnail">
                    {{ t('upload.removeThumbnail') }}
                  </button>
                </div>
                <button type="button" class="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-700 bg-zinc-900 transition hover:border-blue-500" @click="triggerThumbnailInput">
                  <img v-if="thumbnailPreview" :src="thumbnailPreview" :alt="form.title" class="h-full w-full object-cover" />
                  <span v-else class="flex flex-col items-center px-4 text-center">
                    <svg class="mb-2 h-8 w-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                    </svg>
                    <span class="text-sm font-bold text-zinc-300">{{ t('upload.thumbnailClick') }}</span>
                    <span class="mt-1 text-xs text-zinc-500">{{ t('upload.thumbnailFormat') }}</span>
                  </span>
                </button>
                <input ref="thumbnailInput" type="file" accept="image/*" class="hidden" @change="onThumbnailSelected" />
                <p class="mt-2 text-xs text-zinc-500">{{ t('upload.maxSize') }}</p>
              </section>

              <div class="sticky bottom-0 -mx-4 border-t border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
                <button type="submit" :disabled="isUploading" class="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {{ t('upload.startUpload') }}
                </button>
              </div>
            </aside>
          </form>

          <div v-if="stage === 'uploading'" class="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/20 sm:p-8">
            <div class="mb-6 flex items-center gap-4">
              <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-950 text-blue-300">
                <svg class="h-7 w-7 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="truncate text-lg font-black">{{ selectedFileName }}</p>
                <p class="text-sm text-zinc-500">{{ t('upload.dontCloseWarning') }}</p>
              </div>
            </div>
            <div class="mb-3 flex items-center justify-between gap-4 text-sm">
              <span class="font-bold text-zinc-300">{{ t('upload.uploading') }}</span>
              <span class="font-black text-blue-300">{{ t('upload.uploadProgress', { percent: uploadProgress }) }}</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-zinc-900">
              <div class="h-full rounded-full bg-blue-600 transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
            </div>
          </div>

          <div v-if="stage === 'complete'" class="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/20 sm:p-8">
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-950 text-green-300">
                <svg class="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <h2 class="text-2xl font-black">{{ t('upload.uploadComplete') }}</h2>
              <p class="mt-2 text-sm text-zinc-400">{{ t('upload.uploadSuccess') }}</p>
            </div>

            <div class="mt-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:grid-cols-2">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{{ t('upload.channel') }}</p>
                <p class="mt-1 font-bold">{{ getChannelName(form.channelId) }}</p>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{{ t('upload.videoTitle') }}</p>
                <p class="mt-1 font-bold">{{ form.title }}</p>
              </div>
              <div v-if="form.description" class="sm:col-span-2">
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{{ t('upload.description') }}</p>
                <p class="mt-1 text-sm leading-6 text-zinc-300">{{ form.description }}</p>
              </div>
            </div>

            <p class="mt-4 rounded-lg border border-blue-900/70 bg-blue-950/40 px-4 py-3 text-sm text-blue-100">
              {{ t('upload.publishMessage') }}
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <button type="button" :disabled="isPublishing" class="rounded-lg bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50" @click="handlePublish">
                {{ isPublishing ? t('upload.publishing') : t('upload.publish') }}
              </button>
              <button type="button" :disabled="isPublishing" class="rounded-lg bg-zinc-800 px-5 py-3 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50" @click="startOver">
                {{ t('upload.uploadAnother') }}
              </button>
              <NuxtLink :to="localePath('/')" class="rounded-lg bg-zinc-800 px-5 py-3 text-center text-sm font-bold text-zinc-100 transition hover:bg-zinc-700">
                {{ t('upload.goHome') }}
              </NuxtLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { uploadVideo, fetchUserChannels } from '~/app/service/upload'
import { useLocalUploadBaseURL } from '~/app/composables/useLocalUploadBaseURL'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'

const { t } = useI18n()
const localePath = useLocalePath()

useMetaTags({
  title: 'Upload Video - GilTube',
  description: 'Upload and share your video'
})

const router = useRouter()
const isReady = ref(false)
const userId = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const thumbnailInput = ref<HTMLInputElement | null>(null)
const localUploadBaseURL = useLocalUploadBaseURL()

const form = ref({
  title: '',
  description: '',
  channelId: '',
  explicit: false,
  categoryId: '',
})
const thumbnailFile = ref<File | null>(null)
const thumbnailPreview = ref('')
const selectedFileName = ref('')
const selectedFile = ref<File | null>(null)
const uploadProgress = ref(0)
const error = ref('')
const isAdmin = ref(false)
const isDraggingFile = ref(false)
const useLocalUpload = ref(false)

const stage = ref('select')
const isUploading = ref(false)
const isPublishing = ref(false)
const channels = ref<any[]>([])
const categories = ref<any[]>([])

const stageItems = computed(() => [
  { key: 'select', label: t('upload.selectedFile') },
  { key: 'details', label: t('upload.videoDetails') },
  { key: 'uploading', label: t('upload.uploading') },
  { key: 'complete', label: t('upload.readyToPublish') },
])

const currentStageTitle = computed(() => {
  if (stage.value === 'details') return t('upload.videoDetails')
  if (stage.value === 'uploading') return t('upload.uploading')
  if (stage.value === 'complete') return t('upload.readyToPublish')
  return t('upload.title')
})

onMounted(async () => {
  await checkAuthStatus()
  await loadCategories()
})

const loadCategories = async () => {
  try {
    const response = await fetch('/api/v1/categories/all')
    if (response.ok) {
      categories.value = await response.json()
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const checkAuthStatus = async () => {
  const storedUserId = localStorage.getItem('user_id')
  if (!storedUserId) {
    await router.push(localePath('/login'))
    return
  }

  userId.value = storedUserId

  try {
    const userRes = await fetch(`/api/v1/user/${storedUserId}`, {
      headers: {
        'X-User-ID': storedUserId
      }
    })

    if (userRes.ok) {
      const user = await userRes.json()
      isAdmin.value = user.user_type === 'admin'
      if (user.status === 'banned') {
        error.value = t('upload.bannedError')
        setTimeout(() => router.push(localePath('/')), 2000)
        return
      }
    }
  } catch (err) {
    console.error('Failed to check user status:', err)
  }

  await loadChannels()
}

const loadChannels = async () => {
  if (!userId.value) return

  try {
    const channelResult = await fetchUserChannels(userId.value)
    channels.value = channelResult.channels

    channels.value = channels.value.filter(ch => ch.status !== 'banned')

    if (channels.value.length === 0) {
      error.value = t('upload.noChannelsError')
      await router.push(localePath('/create-channel'))
      return
    }

    const activeAccount = localStorage.getItem('active_account')
    const defaultChannelId = channelResult.default_channel_id || localStorage.getItem('default_channel_id')

    if (!activeAccount || activeAccount === 'personal') {
      form.value.channelId = channels.value.find(ch => ch.id === defaultChannelId)?.id || channels.value[0].id
    } else {
      const activeChannelId = channels.value.find(ch => ch.id === activeAccount)?.id
      if (activeChannelId) {
        form.value.channelId = activeChannelId
      } else {
        form.value.channelId = channels.value[0].id
      }
    }

    isReady.value = true
  } catch (err) {
    error.value = t('upload.channelsLoadError')
    console.error('Channel loading error:', err)
  }
}

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  fileInput.value?.click()
}

const triggerThumbnailInput = () => {
  if (thumbnailInput.value) {
    thumbnailInput.value.value = ''
  }
  thumbnailInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  setSelectedVideoFile(file)
}

const setSelectedVideoFile = (file?: File | null) => {
  if (!file) return
  if (!file.type.startsWith('video/')) {
    error.value = 'Please choose a video file.'
    return
  }
  selectedFile.value = file
  selectedFileName.value = file.name
  error.value = ''
  stage.value = 'details'
}

const handleFileDrop = (event: DragEvent) => {
  isDraggingFile.value = false
  const file = event.dataTransfer?.files?.[0]
  setSelectedVideoFile(file)
}

const handleFileDragLeave = (event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null
  if (!currentTarget || !relatedTarget || !currentTarget.contains(relatedTarget)) {
    isDraggingFile.value = false
  }
}

const onThumbnailSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    error.value = t('upload.thumbnailSizeError')
    return
  }

  if (!file.type.startsWith('image/')) {
    error.value = t('upload.thumbnailTypeError')
    return
  }

  error.value = ''
  thumbnailFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    thumbnailPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearThumbnail = () => {
  thumbnailFile.value = null
  thumbnailPreview.value = ''
  if (thumbnailInput.value) {
    thumbnailInput.value.value = ''
  }
}

const handleStartUpload = async () => {
  error.value = ''

  if (!form.value.channelId) {
    error.value = t('upload.selectChannelError')
    return
  }

  if (!form.value.title.trim()) {
    error.value = t('upload.titleRequiredError')
    return
  }

  if (!selectedFile.value) {
    error.value = t('upload.fileRequiredError')
    return
  }

  stage.value = 'uploading'
  isUploading.value = true
  uploadProgress.value = 0

  try {
    const uploadData: any = {
      title: form.value.title,
      description: form.value.description,
      channelId: form.value.channelId,
      videoFile: selectedFile.value,
      explicit: form.value.explicit,
      categoryId: form.value.categoryId,
      uploadBaseURL: isAdmin.value && useLocalUpload.value ? localUploadBaseURL : undefined,
      onProgress: (progress: number) => {
        uploadProgress.value = progress
      },
    }

    if (thumbnailFile.value) {
      uploadData.thumbnail = thumbnailFile.value
    }

    await uploadVideo(uploadData)

    stage.value = 'complete'
  } catch (err) {
    error.value = typeof err === 'string' ? err : t('upload.uploadError')
    console.error('Upload error:', err)
    stage.value = 'details'
  } finally {
    isUploading.value = false
  }
}

const handlePublish = async () => {
  isPublishing.value = true
  error.value = ''

  try {
    await router.push(localePath('/dashboard'))
  } catch (err) {
    error.value = typeof err === 'string' ? err : t('upload.publishError')
  } finally {
    isPublishing.value = false
  }
}

const startOver = () => {
  stage.value = 'select'
  uploadProgress.value = 0
  selectedFile.value = null
  selectedFileName.value = ''
  thumbnailFile.value = null
  thumbnailPreview.value = ''
  useLocalUpload.value = false
  isDraggingFile.value = false
  form.value = {
    title: '',
    description: '',
    channelId: form.value.channelId,
    explicit: false,
    categoryId: '',
  }
  error.value = ''
}

const getChannelName = (channelId: string) => {
  return channels.value.find(ch => ch.id === channelId)?.name || '-'
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

definePageMeta({
  layout: 'blank',
})
</script>

<style scoped>
.field-control {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(63 63 70);
  background: rgb(24 24 27);
  padding: 0.75rem 1rem;
  color: white;
  outline: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.field-control:focus {
  border-color: rgb(59 130 246);
  background: rgb(9 9 11);
}

input,
textarea,
select {
  color: white;
}

input::placeholder,
textarea::placeholder {
  color: #6b7280;
}

input:autofill,
input:autofill:hover,
input:autofill:focus,
input:autofill:active {
  -webkit-box-shadow: 0 0 0 30px #18181b inset !important;
  box-shadow: 0 0 0 30px #18181b inset !important;
  -webkit-text-fill-color: white !important;
}
</style>
