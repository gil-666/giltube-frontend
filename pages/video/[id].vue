<template>
  <div class="w-full min-h-screen bg-black text-white flex flex-col items-center p-6">
    
    <div class="w-full max-w-5xl">
      <VideoPlayer :src="videoSrc" />
    </div>

    <div v-if="video" class="w-full max-w-5xl mt-6">
      <h1 class="text-2xl font-bold">{{ video.title }}</h1>
      <p class="text-gray-400 mt-2">{{ video.description }}</p>
      <p class="text-sm text-gray-500 mt-1">
        Channel: {{ video.channel.name }}
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import { getVideo } from '~/app/service/videos'

const route = useRoute()
const id = route.params.id as string

const { data: video } = await useAsyncData(`video-${id}`, () =>
  getVideo(id)
)

// HLS stream URL
const videoSrc = computed(() =>
  video.value
    ? `http://localhost:8080/api/v1/videos/${id}/stream/master.m3u8`
    : ''
)
</script>

