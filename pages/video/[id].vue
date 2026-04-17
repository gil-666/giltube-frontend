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
      <div class="flex items-center mt-4 gap-4 hover:bg-zinc-800 p-2 rounded-lg cursor-pointer">
      <div class="w-9 h-9 bg-zinc-700 rounded-full"><img class="rounded-full" :src="video.channel.avatar_url" :alt="video.channel.name" /></div>
      <p class="text-sm font-medium text-gray-100 mt-1">{{ video.channel.name }}</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import { getVideo } from '~/app/service/videos'
const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const id = route.params.id as string

const { data: video } = await useAsyncData(`video-${id}`, () =>
  getVideo(id)
)

// HLS stream URL
const videoSrc = computed(() =>
  video.value
    ? `${baseUrl}/api/v1/videos/${id}/stream/master.m3u8`
    : ''
)
</script>

