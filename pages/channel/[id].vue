<template>
  <div class="min-h-screen bg-zinc-950 text-white">
    <!-- Channel Header -->
    <div v-if="channel" class="bg-zinc-900 border-b border-zinc-800">
      <div class="max-w-6xl mx-auto px-6 py-8">
        <div class="flex items-start gap-6">
          <!-- Channel Avatar -->
          <div class="flex-shrink-0">
            <img
              v-if="channel.avatar_url && channel.avatar_url.trim()"
              :src="channel.avatar_url"
              :alt="channel.name"
              class="w-32 h-32 rounded-full object-cover border-2 border-zinc-700"
            />
            <div
              v-else
              class="w-32 h-32 rounded-full bg-zinc-700 flex items-center justify-center text-5xl font-bold border-2 border-zinc-700"
            >
              {{ channel.name.charAt(0).toUpperCase() }}
            </div>
          </div>

          <!-- Channel Info -->
          <div class="flex-1 pt-4">
            <h1 class="text-4xl font-bold">{{ channel.name }}</h1>
            <p class="text-gray-400 mt-2">{{ channel.description || 'No description provided' }}</p>

            <!-- More Details Section -->
            <div class="mt-6 bg-zinc-800 rounded-lg p-4 space-y-2">
              <h3 class="text-lg font-semibold text-gray-300 mb-4">Channel Details</h3>
              <div class="flex justify-between border-b border-zinc-700 pb-2">
                <span class="text-gray-400">Owner:</span>
                <span class="text-white font-medium">{{ ownerUsername }}</span>
              </div>
              <div class="flex justify-between pt-2">
                <span class="text-gray-400">Created:</span>
                <span class="text-white font-medium">{{ formatDate(channel.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading/Error State -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-if="error" class="max-w-6xl mx-auto px-6 py-8">
      <div class="bg-red-900 text-white p-4 rounded">
        {{ error }}
      </div>
    </div>

    <!-- Videos Section -->
    <div v-if="!isLoading && channel" class="max-w-6xl mx-auto px-6 py-8">
      <h2 class="text-2xl font-bold mb-6">Videos</h2>
      
      <div v-if="videos.length === 0" class="text-gray-400 text-center py-8">
        No videos yet
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="video in videos"
          :key="video.id"
          :to="`/video/${video.id}`"
          class="group cursor-pointer"
        >
          <div class="relative bg-zinc-800 rounded-lg overflow-hidden mb-2 aspect-video">
            <img
              v-if="video.thumbnail_url"
              :src="video.thumbnail_url"
              :alt="video.title"
              class="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
            <div v-else class="w-full h-full bg-zinc-700 flex items-center justify-center">
              <span class="text-zinc-500">No thumbnail</span>
            </div>
          </div>
          <h3 class="text-white font-semibold text-sm line-clamp-2 group-hover:text-yellow-400 transition-colors">
            {{ video.title }}
          </h3>
          <p class="text-gray-400 text-xs mt-1">
            {{ formatDate(video.created_at) }}
          </p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getChannelInfo, getChannelVideos } from '~/app/service/channels'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const channelId = route.params.id as string

const channel = ref(null)
const videos = ref([])
const ownerUsername = ref('')
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const data = await getChannelInfo(channelId)
    channel.value = data.channel
    ownerUsername.value = data.owner_username

    const videosData = await getChannelVideos(channelId)
    videos.value = videosData.map((video: any) => ({
      ...video,
      thumbnail_url: video.thumbnail_url ? `${baseUrl}${video.thumbnail_url}` : null
    }))
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Failed to load channel'
    console.error('Channel load error:', err)
  } finally {
    isLoading.value = false
  }
})

const formatDate = (date) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
</style>
