<template>
  <div class="fixed inset-0 bg-zinc-950 text-white p-6 overflow-y-auto flex flex-col items-center justify-start">
    <!-- Loading State -->
    <div v-if="!isReady" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Checking your channels...</p>
      </div>
    </div>

    <!-- Upload Stages -->
    <div v-else class="max-w-2xl mx-auto w-full py-8">
      <!-- Stage 1: File Upload -->
      <div v-if="stage === 'select'">
        <h1 class="text-4xl font-bold mb-8">Upload Video</h1>
        <div class="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center hover:border-blue-500 transition cursor-pointer" @click="triggerFileInput">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-xl mb-2">Click to select a video file</p>
          <p class="text-gray-400 text-sm">or drag and drop</p>
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
            to="/"
            class="inline-block px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition"
          >
            Cancel
          </NuxtLink>
        </div>
      </div>

      <!-- Stage 2: Fill in Details -->
      <div v-if="stage === 'details'">
        <h1 class="text-4xl font-bold mb-8">Video Details</h1>
        
        <div class="bg-zinc-900 rounded-lg p-8 space-y-6">
          <!-- Selected File -->
          <div class="bg-zinc-800 rounded p-4">
            <p class="text-sm text-gray-400 mb-2">Selected File:</p>
            <p class="font-medium">{{ selectedFileName }}</p>
          </div>

          <!-- Form Fields -->
          <form @submit.prevent="handleStartUpload" class="space-y-4">
            <!-- Channel -->
            <div>
              <label class="block text-sm font-medium mb-2">Channel *</label>
              <select
                v-model="form.channelId"
                required
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a channel</option>
                <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                  {{ channel.name }}
                </option>
              </select>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-medium mb-2">Title *</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Enter video title"
                required
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium mb-2">Description</label>
              <textarea
                v-model="form.description"
                placeholder="Enter video description"
                rows="4"
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <!-- Categories -->
            <div>
              <label class="block text-sm font-medium mb-2">Category</label>
              <select
                v-model="form.categoryId"
                class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a category (optional)</option>
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
                <span class="text-sm font-medium">Explicit/18+ Content</span>
                <p class="text-xs text-gray-400 mt-1">Mark this video as containing content for mature audiences</p>
              </label>
              <svg v-if="form.explicit" class="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>

            <!-- Thumbnail Upload -->
            <div>
              <label class="block text-sm font-medium mb-4">Custom Thumbnail</label>
              <div class="bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer" @click="triggerThumbnailInput">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm text-gray-300">Click to select an image or drag and drop</p>
                <p class="text-xs text-gray-500 mt-1">PNG or JPG, recommended size: 1280x720</p>
                <input
                  ref="thumbnailInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onThumbnailSelected"
                />
              </div>
              <p class="text-xs text-gray-400 mt-2">Max size: 5MB</p>
            </div>

            <!-- Thumbnail Preview -->
            <div v-if="thumbnailPreview">
              <label class="block text-sm font-medium mb-2">Thumbnail Preview</label>
              <div class="relative bg-zinc-800 rounded overflow-hidden aspect-video max-w-xs border border-blue-500 border-2">
                <img :src="thumbnailPreview" :alt="form.title" class="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                @click="clearThumbnail"
                class="mt-2 text-sm text-red-400 hover:text-red-300 transition"
              >
                Remove thumbnail
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
                Start Upload
              </button>
              <button
                type="button"
                @click="stage = 'select'"
                :disabled="isUploading"
                class="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change File
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Stage 3: Uploading Progress -->
      <div v-if="stage === 'uploading'">
        <h1 class="text-4xl font-bold mb-8">Uploading...</h1>
        
        <div class="bg-zinc-900 rounded-lg p-8 space-y-6">
          <!-- Upload Progress -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <p class="font-medium">File: {{ selectedFileName }}</p>
              <p class="text-blue-400 font-bold">{{ uploadProgress }}%</p>
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
            <p class="text-sm text-blue-200">Please don't close this page while your video is uploading.</p>
          </div>
        </div>
      </div>

      <!-- Stage 4: Upload Complete -->
      <div v-if="stage === 'complete'">
        <h1 class="text-4xl font-bold mb-8">Ready to Publish</h1>
        
        <div class="bg-zinc-900 rounded-lg p-8 space-y-6">
          <!-- Success Icon -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900 mb-4">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-2xl font-bold mb-2">Upload Complete!</p>
            <p class="text-gray-400">Your video has been uploaded successfully.</p>
          </div>

          <!-- Video Summary -->
          <div class="bg-zinc-800 rounded p-6 space-y-3">
            <div>
              <p class="text-gray-400 text-sm">Channel</p>
              <p class="text-lg font-medium">{{ getChannelName(form.channelId) }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-sm">Title</p>
              <p class="text-lg font-medium">{{ form.title }}</p>
            </div>
            <div v-if="form.description">
              <p class="text-gray-400 text-sm">Description</p>
              <p class="text-sm">{{ form.description }}</p>
            </div>
          </div>

          <!-- Info -->
          <div class="bg-blue-900/30 border border-blue-700 rounded p-4">
            <p class="text-sm text-blue-200">
              Click "Publish" to start processing your video. This may take a few minutes depending on the file size.
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
              {{ isPublishing ? 'Publishing...' : 'Publish Video' }}
            </button>
            <button
              @click="startOver"
              :disabled="isPublishing"
              class="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Another
            </button>
            <NuxtLink
              to="/"
              class="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition text-center"
            >
              Go Home
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

useMetaTags({
  title: 'Upload Video - GilTube',
  description: 'Upload and share your video'
})

const router = useRouter()
const isReady = ref(false)
const userId = ref('')
const fileInput = ref(null)
const thumbnailInput = ref(null)

// Form state
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
const selectedFile = ref(null)
const uploadProgress = ref(0)
const error = ref('')

// Upload state
const stage = ref('select') // 'select', 'details', 'uploading', 'complete'
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
    await router.push('/login')
    return
  }

  userId.value = storedUserId
  await loadChannels()
}

const loadChannels = async () => {
  if (!userId.value) return
  
  try {
    channels.value = await fetchUserChannels(userId.value)
    if (channels.value.length === 0) {
      await router.push('/create-channel')
      return
    }
    
    // Get active account or default to personal
    const activeAccount = localStorage.getItem('active_account')
    
    // If personal account, use first available channel
    if (!activeAccount || activeAccount === 'personal') {
      form.value.channelId = channels.value[0].id
    } else {
      // If specific channel account, find and use it
      const activeChannelId = channels.value.find(ch => ch.id === activeAccount)?.id
      if (activeChannelId) {
        form.value.channelId = activeChannelId
      } else {
        form.value.channelId = channels.value[0].id
      }
    }
    
    isReady.value = true
  } catch (err) {
    error.value = 'Failed to load channels'
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
  if (!file) return

  selectedFile.value = file
  selectedFileName.value = file.name
  error.value = ''
  
  // Move to details stage to let user fill in info
  stage.value = 'details'
}

const onThumbnailSelected = (event: any) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Thumbnail file must be smaller than 5MB'
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select a valid image file'
    return
  }

  error.value = ''
  thumbnailFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    thumbnailPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearThumbnail = () => {
  thumbnailFile.value = null
  thumbnailPreview.value = ''
  // Reset file input
  if (thumbnailInput.value) {
    thumbnailInput.value.value = ''
  }
}

const handleStartUpload = async () => {
  error.value = ''
  
  // Validate form
  if (!form.value.channelId) {
    error.value = 'Please select a channel'
    return
  }

  if (!form.value.title.trim()) {
    error.value = 'Please enter a title'
    return
  }

  if (!selectedFile.value) {
    error.value = 'No file selected'
    return
  }

  // Move to uploading stage and start upload
  stage.value = 'uploading'
  isUploading.value = true
  uploadProgress.value = 0

  try {
    // Start upload
    const uploadData: any = {
      title: form.value.title,
      description: form.value.description,
      channelId: form.value.channelId,
      videoFile: selectedFile.value,
      explicit: form.value.explicit,
      categoryId: form.value.categoryId,
      onProgress: (progress) => {
        uploadProgress.value = progress
      },
    }

    // Add thumbnail if selected
    if (thumbnailFile.value) {
      uploadData.thumbnail = thumbnailFile.value
    }

    await uploadVideo(uploadData)

    // Move to complete stage
    stage.value = 'complete'
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Upload failed. Please try again.'
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
    // On backend, the video processing starts automatically when uploaded
    // Redirect to dashboard to show all videos
    await router.push('/dashboard')
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Failed to navigate to dashboard.'
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
  return channels.value.find(ch => ch.id === channelId)?.name || 'Unknown'
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
