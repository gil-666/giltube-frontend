<template>
  <div class="min-h-screen bg-zinc-950 text-white">
    <!-- Channel Header -->
    <div v-if="channel" class="bg-zinc-900 border-b border-zinc-800">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <!-- Channel Avatar -->
          <div class="flex-shrink-0">
            <img
              v-if="channel.avatar_url && channel.avatar_url.trim() && !failedChannelAvatar"
              :src="channel.avatar_url"
              :alt="channel.name"
              class="w-24 sm:w-32 h-24 sm:h-32 rounded-full object-cover border-2 border-zinc-700"
              @error="failedChannelAvatar = true"
            />
            <div v-else
              class="w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-zinc-700 flex items-center justify-center text-3xl sm:text-5xl font-bold border-2 border-zinc-700">
              {{ channel.name.charAt(0).toUpperCase() }}
            </div>
          </div>

          <!-- Channel Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl sm:text-4xl font-bold break-words">{{ channel.name }}</h1>
              <VerifiedBadge :verified="channel.verified" size="lg"
                tooltip="This account is verified by Giltube. It belongs to the channel owner and is not a fan account or impersonator." />
              <span
                v-if="liveStatus?.is_live"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-red-200 border border-red-700"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p class="text-gray-400 mt-2 text-sm sm:text-base break-words">{{ channel.description || 'No description provided' }}</p>

            <NuxtLink
              v-if="liveStatus?.is_live"
              :to="`/live/${channelId}`"
              class="inline-flex mt-3 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 transition text-sm font-semibold"
            >
              Watch Live
            </NuxtLink>

            <!-- Channel Metrics -->
            <div class="mt-4">
              <ChannelMetricsCompact :channel-id="channelId" />
            </div>

            <!-- More Details Section -->
            <div class="mt-4 sm:mt-6 bg-zinc-800 rounded-lg p-3 sm:p-4 space-y-2">
              <h3 class="text-base sm:text-lg font-semibold text-gray-300 mb-3 sm:mb-4">Channel Details</h3>
              <div class="flex flex-col sm:flex-row sm:justify-between border-b border-zinc-700 pb-2">
                <span class="text-gray-400 text-sm sm:text-base">Owner:</span>
                <span class="text-white font-medium text-sm sm:text-base break-words">{{ ownerUsername }}</span>
              </div>
              <div class="flex flex-col sm:flex-row sm:justify-between pt-2">
                <span class="text-gray-400 text-sm sm:text-base">Created:</span>
                <span class="text-white font-medium text-sm sm:text-base">{{ formatDate(channel.created_at) }}</span>
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

    <div v-if="error" class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div class="bg-red-900 text-white p-4 rounded">
        {{ error }}
      </div>
    </div>

    <!-- Videos Section -->
    <div v-if="!isLoading && channel" class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Videos</h2>

      <div v-if="videos.length === 0" class="text-gray-400 text-center py-8">
        No videos yet
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <NuxtLink v-for="video in videos" :key="video.id" :to="`/video/${video.id}`"
          class="group cursor-pointer min-w-0">
          <div class="relative bg-zinc-800 rounded-lg overflow-hidden mb-1 sm:mb-2 aspect-video">
            <img v-if="video.thumbnail_url" :src="video.thumbnail_url" :alt="video.title"
              class="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
            <div v-else class="w-full h-full bg-zinc-700 flex items-center justify-center">
              <span class="text-zinc-500 text-xs">No thumbnail</span>
            </div>
          </div>
          <h3
            class="text-zinc-400 font-semibold text-xs sm:text-sm line-clamp-2 group-hover:text-yellow-400 transition-colors break-words">
            {{ video.title }}
          </h3>
          <span v-if="video.width >= 3840"
            class="p-0.5 bg-gray-900 text-gray-200 text-xs font-semibold flex-shrink-0 whitespace-nowrap border border-gray-500">4K</span>
          <div class="flex items-center gap-2 mt-1 text-">
            <p class="text-xs text-zinc-400 line-clamp-1">{{ video.channel.name }}</p>
            <VerifiedBadge v-if="video.channel?.verified" :verified="true" size="sm" />
          </div>
          <p class="text-xs text-zinc-400 line-clamp-1">{{ formatViews(video.views) }} views • {{ getTimeAgo(video.created_at) }}</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getChannelInfo, getChannelVideos } from '~/app/service/channels'
import { getChannelLiveStatus } from '~/app/service/live'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'
import ChannelMetricsCompact from '~/app/components/ChannelMetricsCompact.vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const channelId = route.params.id as string

const channel = ref(null)
const videos = ref([])
const ownerUsername = ref('')
const isLoading = ref(true)
const error = ref('')
const failedChannelAvatar = ref(false)
const liveStatus = ref<any>(null)

onMounted(async () => {
  try {
    failedChannelAvatar.value = false
    const data = await getChannelInfo(channelId)
    channel.value = data.channel
    ownerUsername.value = data.owner_username

    liveStatus.value = await getChannelLiveStatus(channelId)

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

watch(channel, (newChannel) => {
  if (newChannel) {
    const siteUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:3000'
    useMetaTags({
      title: `${newChannel.name} - GilTube`,
      description: newChannel.description || `Watch videos from ${newChannel.name} on GilTube`,
      image: newChannel.avatar_url ? `${baseUrl}${newChannel.avatar_url}` : undefined,
      url: `${siteUrl}/channel/${channelId}`
    })
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

<style scoped></style>
