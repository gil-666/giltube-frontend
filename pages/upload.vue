<template>
  <div class="fixed inset-0 bg-zinc-950 text-white p-6 overflow-y-auto flex flex-col items-center justify-start" :style="{zIndex: 100}">
    <!-- Loading State -->
    <div v-if="!isReady" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>{{ t('upload.checkingChannels') }}</p>
      </div>
    </div>

    <!-- Upload Stages -->
    <div v-else class="max-w-2xl mx-auto w-full py-8">
      <!-- Stage 1: File Upload -->
      <div v-if="stage === 'select'">
        <h1 class="text-4xl font-bold mb-8">{{ t('upload.title') }}</h1>
        <div
          class="bg-zinc-900 border-2 border-dashed rounded-lg p-12 text-center transition cursor-pointer"
          :class="isDraggingFile ? 'border-blue-500 bg-blue-950/20' : 'border-zinc-700 hover:border-blue-500'"
          @click="triggerFileInput"
          @dragenter.prevent="isDraggingFile = true"
          @dragover.prevent="isDraggingFile = true"
          @dragleave.prevent="handleFileDragLeave"
          @drop.prevent="handleFileDrop"
        >
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-xl mb-2">{{ t('upload.clickToSelect') }}</p>
          <p class="text-gray-400 text-sm">{{ t('upload.dragAndDrop') }}</p>
          <input
            ref="fileInput"
            type="file"
            accept="video/*"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>
        <div class="mt-4">
          <NuxtLink
            :to="localePath('/')"
            class="inline-block px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition"
          >
            {{ t('upload.cancel') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Stage 2: Fill in Details -->
      <div v-if="stage === 'details'">
        <h1 class="text-4xl font-bold mb-8">{{ t('upload.videoDetails') }}</h1>
        
        <div class="bg-zinc-900 rounded-lg p-8 space-y-6">
          <!-- Selected File -->
          <div class="bg-zinc-800 rounded p-4">
            <p class="text-sm text-gray-400 mb-2">{{ t('upload.selectedFile') }}</p>
            <p class="font-medium">{{ selectedFileName }}</p>
          </div>

          <!-- Form Fields -->
          <form @submit.prevent="handleStartUpload" class="space-y-4">
            <!-- Channel -->
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('upload.channel') }}</label>
              <select
                v-model="form.channelId"
                required
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">{{ t('upload.selectChannel') }}</option>
                <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                  {{ channel.name }}
                </option>
              </select>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('upload.videoTitle') }}</label>
              <input
                v-model="form.title"
                type="text"
                :placeholder="t('upload.videoTitlePlaceholder')"
                required
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('upload.description') }}</label>
              <textarea
                v-model="form.description"
                :placeholder="t('upload.descriptionPlaceholder')"
                rows="4"
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <!-- Categories -->
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('upload.category') }}</label>
              <select
                v-model="form.categoryId"
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">{{ t('upload.selectCategory') }}</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <!-- Explicit Content Warning -->
            <div class="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded p-4">
              <input
                v-model="form.explicit"
                type="checkbox"
                id="explicit-toggle"
                class="w-4 h-4 rounded cursor-pointer accent-red-500"
              />
              <label for="explicit-toggle" class="flex-1 cursor-pointer">
                <span class="text-sm font-medium">{{ t('upload.explicit') }}</span>
                <p class="text-xs text-gray-400 mt-1">{{ t('upload.explicitHelper') }}</p>
              </label>
              <svg v-if="form.explicit" class="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>

            <!-- Admin Local Upload -->
            <div v-if="isAdmin" class="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded p-4">
              <input
                id="local-upload-toggle"
                v-model="useLocalUpload"
                type="checkbox"
                class="w-4 h-4 rounded cursor-pointer accent-blue-500"
              />
              <label for="local-upload-toggle" class="flex-1 cursor-pointer">
                <span class="text-sm font-medium">Local upload</span>
                <p class="text-xs text-gray-400 mt-1">Upload directly to the local backend on port 8080.</p>
              </label>
            </div>

            <!-- Thumbnail Upload -->
            <div>
              <label class="block text-sm font-medium mb-4">{{ t('upload.customThumbnail') }}</label>
              <div class="bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer" @click="triggerThumbnailInput">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm text-gray-300">{{ t('upload.thumbnailClick') }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ t('upload.thumbnailFormat') }}</p>
                <input
                  ref="thumbnailInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onThumbnailSelected"
                />
              </div>
              <p class="text-xs text-gray-400 mt-2">{{ t('upload.maxSize') }}</p>
            </div>

            <!-- Thumbnail Preview -->
            <div v-if="thumbnailPreview">
              <label class="block text-sm font-medium mb-2">{{ t('upload.thumbnailPreview') }}</label>
              <div class="relative bg-zinc-800 rounded overflow-hidden aspect-video max-w-xs border border-blue-500 border-2">
                <img :src="thumbnailPreview" :alt="form.title" class="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                @click="clearThumbnail"
                class="mt-2 text-sm text-red-400 hover:text-red-300 transition"
              >
                {{ t('upload.removeThumbnail') }}
              </button>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="bg-red-900 text-white p-4 rounded">
              {{ error }}
            </div>

            <!-- Buttons -->
            <div class="flex gap-4">
              <button
                type="submit"
                :disabled="isUploading"
                class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ t('upload.startUpload') }}
              </button>
              <button
                type="button"
                @click="stage = 'select'"
                :disabled="isUploading"
                class="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ t('upload.changeFile') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Stage 3: Uploading Progress -->
      <div v-if="stage === 'uploading'">
        <h1 class="text-4xl font-bold mb-8">{{ t('upload.uploading') }}</h1>
        
        <div class="bg-zinc-900 rounded-lg p-8 space-y-6">
          <!-- Upload Progress -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <p class="font-medium">{{ t('upload.selectedFile') }} {{ selectedFileName }}</p>
              <p class="text-blue-400 font-bold">{{ t('upload.uploadProgress', { percent: uploadProgress }) }}</p>
            </div>
            <div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div
                class="bg-blue-600 h-full transition-all duration-300"
                :style="{ width: uploadProgress + '%' }"
              />
            </div>
          </div>

          <!-- Info -->
          <div class="bg-blue-900/30 border border-blue-700 rounded p-4">
            <p class="text-sm text-blue-200">{{ t('upload.dontCloseWarning') }}</p>
          </div>
        </div>
      </div>

      <!-- Stage 4: Upload Complete -->
      <div v-if="stage === 'complete'">
        <h1 class="text-4xl font-bold mb-8">{{ t('upload.readyToPublish') }}</h1>
        
        <div class="bg-zinc-900 rounded-lg p-8 space-y-6">
          <!-- Success Icon -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900 mb-4">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-2xl font-bold mb-2">{{ t('upload.uploadComplete') }}</p>
            <p class="text-gray-400">{{ t('upload.uploadSuccess') }}</p>
          </div>

          <!-- Video Summary -->
          <div class="bg-zinc-800 rounded p-6 space-y-3">
            <div>
              <p class="text-gray-400 text-sm">{{ t('upload.channel') }}</p>
              <p class="text-lg font-medium">{{ getChannelName(form.channelId) }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-sm">{{ t('upload.videoTitle') }}</p>
              <p class="text-lg font-medium">{{ form.title }}</p>
            </div>
            <div v-if="form.description">
              <p class="text-gray-400 text-sm">{{ t('upload.description') }}</p>
              <p class="text-sm">{{ form.description }}</p>
            </div>
          </div>

          <!-- Info -->
          <div class="bg-blue-900/30 border border-blue-700 rounded p-4">
            <p class="text-sm text-blue-200">
              {{ t('upload.publishMessage') }}
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-900 text-white p-4 rounded">
            {{ error }}
          </div>

          <!-- Buttons -->
          <div class="flex gap-4">
            <button
              @click="handlePublish"
              :disabled="isPublishing"
              class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPublishing ? t('upload.publishing') : t('upload.publish') }}
            </button>
            <button
              @click="startOver"
              :disabled="isPublishing"
              class="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ t('upload.uploadAnother') }}
            </button>
            <NuxtLink
              :to="localePath('/')"
              class="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition text-center"
            >
              {{ t('upload.goHome') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { uploadVideo, fetchUserChannels } from '~/app/service/upload'
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
const fileInput = ref(null)
const thumbnailInput = ref(null)
const localUploadBaseURL = 'http://localhost:8080/api/v1'

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
const channels = ref([])
const categories = ref([])

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
  
  // Check user status - block banned users, warn suspended users
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
    channels.value = await fetchUserChannels(userId.value)
    
    // Filter out banned channels
    channels.value = channels.value.filter(ch => ch.status !== 'banned')
    
    if (channels.value.length === 0) {
      error.value = t('upload.noChannelsError')
      await router.push(localePath('/create-channel'))
      return
    }
    
    const activeAccount = localStorage.getItem('active_account')
    
    if (!activeAccount || activeAccount === 'personal') {
      form.value.channelId = channels.value[0].id
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
  fileInput.value?.click()
}

const triggerThumbnailInput = () => {
  thumbnailInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
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

const onThumbnailSelected = (event: any) => {
  const file = event.target.files?.[0]
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
      onProgress: (progress) => {
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

const getChannelName = (channelId) => {
  return channels.value.find(ch => ch.id === channelId)?.name || '-'
}

definePageMeta({
  layout: 'blank',
})
</script>

<style scoped>
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
  -webkit-box-shadow: 0 0 0 30px #27272a inset !important;
  box-shadow: 0 0 0 30px #27272a inset !important;
  -webkit-text-fill-color: white !important;
}

</style>
