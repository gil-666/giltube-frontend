<template>
  <div class="min-h-screen bg-zinc-950 text-white p-6">
    <!-- Download Status Toast -->
    <div v-if="downloadStatus" class="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
      {{ downloadStatus }}
    </div>

    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold mb-2">Your Videos</h1>
          <p class="text-gray-400">Manage and organize your video library</p>
        </div>
        <!-- <NuxtLink
          to="/upload"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition"
        >
          Upload New Video
        </NuxtLink> -->
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-7xl mx-auto text-center py-12">
      <div class="inline-block">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading your videos...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="videos.length === 0" class="max-w-7xl mx-auto text-center py-12">
      <div class="bg-zinc-900 rounded-lg p-12">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-2xl font-bold mb-2">No videos yet</h2>
        <p class="text-gray-400 mb-6">Start by uploading your first video</p>
        <NuxtLink
          to="/upload"
          class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition"
        >
          Upload Video
        </NuxtLink>
      </div>
    </div>

    <!-- Videos List -->
    <div v-else class="max-w-7xl mx-auto">
      <div class="space-y-3">
        <div
          v-for="video in videos"
          :key="video.id"
          class="bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition flex flex-col md:flex-row"
        >
          <!-- Video Thumbnail -->
          <div class="relative bg-black w-full md:w-48 h-40 md:h-28 flex-shrink-0 group cursor-pointer">
            <img
              v-if="getThumbnailUrl(video)"
              :src="getThumbnailUrl(video)"
              :alt="video.title"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-zinc-800">
              <svg class="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 7H6a1 1 0 00-.553.106A1 1 0 004 8v4a1 1 0 001.447.894l4-2.667a1 1 0 000-1.788l-4-2.667z" />
              </svg>
            </div>

            <!-- Play Button Overlay -->
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center" @click="router.push(`/video/${video.id}`)">
              <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>

            <!-- Status Badge -->
            <div v-if="video.status !== 'ready'" class="absolute top-2 right-2">
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  video.status === 'published'
                    ? 'bg-green-900 text-green-200'
                    : video.status === 'processing'
                    ? 'bg-yellow-900 text-yellow-200'
                    : video.status === 'failed'
                    ? 'bg-red-900 text-red-200'
                    : 'bg-blue-900 text-blue-200',
                ]"
              >
                {{ formatStatus(video.status) }}
              </span>
            </div>
          </div>

          <!-- Video Info -->
          <div class="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-lg mb-1 line-clamp-1">{{ video.title }}</h3>
              <p class="text-sm text-gray-400 mb-2 line-clamp-1">{{ video.description || 'No description' }}</p>

              <!-- Meta Info -->
              <div class="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-4 text-xs text-gray-400">
                <p>
                  <span class="text-gray-500">Uploaded:</span>
                  {{ formatDate(video.created_at) }}
                </p>
                <p v-if="video.views !== undefined">
                  <span class="text-gray-500">Views:</span>
                  {{ formatNumber(video.views) }}
                </p>
              </div>
            </div>

            <!-- Progress Bar for Processing Videos -->
            <div v-if="video.status === 'processing'" class="mt-2">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-400">Processing</span>
                <span class="text-xs text-gray-400 font-medium">{{ video.progress || 0 }}%</span>
              </div>
              <div class="w-full bg-zinc-700 rounded-full h-1 overflow-hidden">
                <div
                  class="bg-yellow-500 h-full transition-all duration-300"
                  :style="{ width: (video.progress || 0) + '%' }"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex md:flex-col gap-2 p-4 justify-center">
            <button
              @click="editVideo(video.id)"
              class="flex-1 md:flex-none px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition whitespace-nowrap"
            >
              Edit
            </button>
            <button
              @click="downloadVideo(video)"
              :disabled="video.status !== 'published' && video.status !== 'ready' || downloadingVideoIds.has(video.id)"
              class="flex-1 md:flex-none px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              :title="video.status !== 'published' && video.status !== 'ready' ? 'Only published videos can be downloaded' : 'Download highest quality version'"
            >
              {{ downloadingVideoIds.has(video.id) ? 'Downloading...' : 'Download' }}
            </button>
            <button
              @click="confirmDelete(video)"
              class="flex-1 md:flex-none px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition whitespace-nowrap"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-zinc-900 rounded-lg p-8 max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">Delete Video?</h2>
        <p class="text-gray-400 mb-6">
          Are you sure you want to delete "<strong>{{ deleteConfirm.title }}</strong>"? This action cannot be undone.
        </p>
        <div class="flex gap-4">
          <button
            @click="deleteConfirm = null"
            class="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition"
          >
            Cancel
          </button>
          <button
            @click="handleDelete(deleteConfirm.id)"
            :disabled="isDeleting"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition disabled:opacity-50"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { getMyVideos, deleteVideo, downloadVideo as downloadVideoService } from '~/app/service/videos'

const router = useRouter()
const isLoading = ref(true)
const isDeleting = ref(false)
const downloadingVideoIds = ref(new Set())
const downloadStatus = ref('')
const videos = ref([])
const deleteConfirm = ref(null)
const userId = ref('')
const channelId = ref('')
let refreshInterval = null

const apiBaseURL = import.meta.env.VITE_API_BASE_URL

// Check if any videos are processing
const hasProcessingVideos = computed(() => {
  return videos.value.some(v => v.status === 'processing')
})

const getThumbnailUrl = (video) => {
  if (!video.thumbnail_url) return null
  // If it's already a full URL, return as-is
  if (video.thumbnail_url.startsWith('http')) return video.thumbnail_url
  // Otherwise, construct full URL from the API base
  return `${apiBaseURL}${video.thumbnail_url}`
}

onMounted(async () => {
  await checkAuth()
  loadActiveChannel()
  await loadVideos()
  
  // Auto-refresh every 5 seconds if there are processing videos
  refreshInterval = setInterval(() => {
    if (hasProcessingVideos.value) {
      loadVideos(true) // Silent refresh (no loading spinner)
    }
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

const handleImageError = (event) => {
  // Fallback when thumbnail fails to load - show placeholder
  event.target.style.display = 'none'
}

const checkAuth = async () => {
  const storedUserId = localStorage.getItem('user_id')
  if (!storedUserId) {
    await router.push('/login')
  }
  userId.value = storedUserId
}

const loadActiveChannel = () => {
  // Load the currently active channel from localStorage
  const activeAccount = localStorage.getItem('active_account')
  if (activeAccount && activeAccount !== 'personal') {
    channelId.value = activeAccount
  }
}

const loadVideos = async (silent = false) => {
  if (!channelId.value) {
    console.error('No channel selected')
    return
  }
  
  try {
    if (!silent) {
      isLoading.value = true
    }
    const data = await getMyVideos(channelId.value)
    videos.value = data || []
  } catch (err) {
    console.error('Failed to load videos:', err)
  } finally {
    if (!silent) {
      isLoading.value = false
    }
  }
}

const formatStatus = (status) => {
  const map = {
    published: 'Published',
    ready: 'Ready',
    processing: 'Processing',
    failed: 'Failed',
    pending: 'Pending',
  }
  return map[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const editVideo = (videoId) => {
  // TODO: Implement edit functionality
  router.push(`/edit-video/${videoId}`)
}

const confirmDelete = (video) => {
  deleteConfirm.value = video
}

const handleDelete = async (videoId) => {
  try {
    isDeleting.value = true
    await deleteVideo(videoId)
    videos.value = videos.value.filter((v) => v.id !== videoId)
    deleteConfirm.value = null
  } catch (err) {
    console.error('Failed to delete video:', err)
    alert('Failed to delete video')
  } finally {
    isDeleting.value = false
  }
}

const downloadVideo = async (video) => {
  try {
    downloadingVideoIds.value.add(video.id)
    downloadStatus.value = 'Preparing download...'
    
    const blob = await downloadVideoService(video.id, '1080p', (status) => {
      downloadStatus.value = status
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${video.title}.mp4`
    link.click()
    window.URL.revokeObjectURL(url)
    
    downloadStatus.value = ''
  } catch (err) {
    console.error('Failed to download video:', err)
    alert(err.message || 'Failed to download video. Please try again.')
    downloadStatus.value = ''
  } finally {
    downloadingVideoIds.value.delete(video.id)
  }
}

definePageMeta({
  layout: false,
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
