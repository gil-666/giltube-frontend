<template>
  <div class="min-h-screen bg-black text-white flex flex-col p-6">
    
    <div class="w-full max-w-5xl">
      <VideoPlayer 
  :src="videoSrc" 
  :status="video?.status" 
/>
    </div>

    <div v-if="video" class="w-full max-w-5xl mt-6">
      <h1 class="text-2xl font-bold">{{ video.title }}</h1>
      <p class="text-gray-400 mt-2">{{ video.description }}</p>
      <NuxtLink :to="`/channel/${video.channel?.id}`" class="flex items-center mt-4 gap-4 hover:bg-zinc-800 p-2 rounded-lg cursor-pointer">
        <div class="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center">
          <img
            v-if="video.channel?.avatar_url && typeof video.channel.avatar_url === 'string' && video.channel.avatar_url.trim()"
            class="rounded-full w-9 h-9 object-cover"
            :src="video.channel.avatar_url"
            :alt="video.channel.name"
          />
          <span v-else class="text-xs font-bold text-white">
            {{ video.channel?.name?.charAt(0).toUpperCase() ?? 'C' }}
          </span>
        </div>
        <p class="text-sm font-medium text-gray-100 mt-1">{{ video.channel.name }}</p>
      </NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import { getVideo, incrementViews } from '~/app/service/videos'
import { computed, onMounted } from 'vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const id = route.params.id as string

const { data: video } = await useAsyncData(`video-${id}`, () =>
  getVideo(id)
)

// Increment views when the video page loads
onMounted(async () => {
  try {
    await incrementViews(id)
  } catch (err) {
    console.error('Failed to increment views:', err)
  }
})

// HLS stream URL
const videoSrc = computed(() =>
  video.value
    ? `${baseUrl}/api/v1/videos/${id}/stream/master.m3u8`
    : ''
)
</script>

