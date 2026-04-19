<template>
  <div class="min-h-screen bg-zinc-950 text-white p-6">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">Edit Video</h1>
        <p class="text-gray-400">Update your video details and thumbnail</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>

      <!-- Edit Form -->
      <form v-else @submit.prevent="handleSave" class="space-y-6 bg-zinc-900 rounded-lg p-8">
        <!-- Video Title -->
        <div>
          <label class="block text-sm font-medium mb-2">Video Title *</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Enter video title"
            required
            class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <!-- Video Description -->
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <textarea
            v-model="form.description"
            placeholder="Tell viewers about your video"
            rows="5"
            class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
          />
        </div>

        <!-- Thumbnail Section -->
        <div class="border-t border-zinc-700 pt-6">
          <h2 class="text-lg font-semibold mb-4">Thumbnail</h2>

          <!-- Current Thumbnail Preview -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Current Thumbnail</label>
            <div class="relative bg-zinc-800 rounded overflow-hidden aspect-video max-w-xs border border-zinc-700">
              <img
                v-if="currentThumbnailUrl"
                :src="currentThumbnailUrl"
                :alt="form.title"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 7H6a1 1 0 00-.553.106A1 1 0 004 8v4a1 1 0 001.447.894l4-2.667a1 1 0 000-1.788l-4-2.667z" />
                </svg>
              </div>
            </div>
            <p v-if="!hasCustomThumbnail" class="text-xs text-gray-400 mt-2">
              Auto-generated from video
            </p>
            <p v-else class="text-xs text-blue-400 mt-2">
              Custom thumbnail
            </p>
          </div>

          <!-- Thumbnail Upload -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Upload Custom Thumbnail</label>
            <div class="bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer" @click="triggerFileInput">
              <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm text-gray-300">Click to select an image or drag and drop</p>
              <p class="text-xs text-gray-500 mt-1">PNG or JPG, recommended size: 1280x720</p>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onThumbnailSelected"
              />
            </div>
            <p class="text-xs text-gray-400 mt-2">Max size: 5MB</p>
          </div>

          <!-- Thumbnail Preview -->
          <div v-if="thumbnailPreview" class="mb-4">
            <label class="block text-sm font-medium mb-2">New Thumbnail Preview</label>
            <div class="relative bg-zinc-800 rounded overflow-hidden aspect-video max-w-xs border border-blue-500 border-2">
              <img :src="thumbnailPreview" :alt="form.title" class="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              @click="clearThumbnail"
              class="mt-2 text-sm text-red-400 hover:text-red-300 transition"
            >
              Remove new thumbnail
            </button>
          </div>

          <!-- Revert to Auto Thumbnail Button -->
          <div v-if="hasCustomThumbnail && !thumbnailPreview" class="mb-4">
            <button
              type="button"
              @click="revertToAutoThumbnail"
              class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition"
            >
              Revert to Auto-Generated Thumbnail
            </button>
            <p class="text-xs text-gray-400 mt-2">This will regenerate the thumbnail from the video</p>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-900 text-red-200 p-4 rounded border border-red-700">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-900 text-green-200 p-4 rounded border border-green-700">
          {{ successMessage }}
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 pt-6 border-t border-zinc-700">
          <button
            type="submit"
            :disabled="isSaving"
            class="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <NuxtLink
            to="/dashboard"
            class="flex-1 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition text-center"
          >
            Cancel
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getVideo, updateVideo } from '~/app/service/videos'
import { useMetaTags } from '~/app/composables/useMetaTags'

const router = useRouter()
const route = useRoute()

// Set meta tags
useMetaTags({
  title: 'Edit Video - GilTube',
  description: 'Edit your video details'
})

const videoId = ref(route.params.id as string)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref('')
const successMessage = ref('')
const fileInput = ref<HTMLInputElement>()

const form = ref({
  title: '',
  description: '',
})

const thumbnailPreview = ref('')
const currentThumbnailUrl = ref('')
const hasCustomThumbnail = ref(false)
const thumbnailFile = ref<File | null>(null)
const apiBaseURL = import.meta.env.VITE_API_BASE_URL

onMounted(async () => {
  await loadVideo()
})

const loadVideo = async () => {
  try {
    isLoading.value = true
    const video = await getVideo(videoId.value)
    
    form.value.title = video.title || ''
    form.value.description = video.description || ''
    
    // Set thumbnail URL
    if (video.thumbnail_url) {
      if (video.thumbnail_url.startsWith('http')) {
        currentThumbnailUrl.value = video.thumbnail_url
      } else {
        currentThumbnailUrl.value = `${apiBaseURL}${video.thumbnail_url}`
      }
    }
    
    // Check if thumbnail is custom
    hasCustomThumbnail.value = video.has_custom_thumbnail || false
  } catch (err) {
    error.value = 'Failed to load video. Please try again.'
    console.error('Load video error:', err)
  } finally {
    isLoading.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
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
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const revertToAutoThumbnail = () => {
  // Mark that we want to revert to auto-generated thumbnail
  thumbnailFile.value = null
  thumbnailPreview.value = ''
  hasCustomThumbnail.value = false
  currentThumbnailUrl.value = '' // Clear to show placeholder while processing
}

const handleImageError = () => {
  currentThumbnailUrl.value = ''
}

const handleSave = async () => {
  error.value = ''
  successMessage.value = ''

  if (!form.value.title.trim()) {
    error.value = 'Video title is required'
    return
  }

  isSaving.value = true

  try {
    const updateData: any = {
      title: form.value.title,
      description: form.value.description,
    }

    // If user wants to revert to auto thumbnail
    if (!hasCustomThumbnail.value && !thumbnailFile.value) {
      updateData.revert_to_auto_thumbnail = true
    }

    // Upload with thumbnail if selected
    if (thumbnailFile.value) {
      const formData = new FormData()
      formData.append('title', form.value.title)
      formData.append('description', form.value.description)
      formData.append('thumbnail', thumbnailFile.value)

      const response = await fetch(`${apiBaseURL}/api/v1/videos/${videoId.value}`, {
        method: 'PUT',
        headers: {
          'X-User-ID': localStorage.getItem('user_id') || '',
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to update video')
      }
    } else {
      // Update without thumbnail
      await updateVideo(videoId.value, updateData)
    }

    successMessage.value = 'Video updated successfully!'
    
    // Redirect to dashboard after 1.5 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Failed to save changes. Please try again.'
    console.error('Save error:', err)
  } finally {
    isSaving.value = false
  }
}

definePageMeta({
  layout: 'blank',
})
</script>

<style scoped>
textarea {
  color: white;
}

textarea::placeholder {
  color: #6b7280;
}
</style>
