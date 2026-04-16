<template>
  <div class="min-h-screen bg-black text-white flex items-center justify-center">
    <h1 class="text-5xl font-bold text-red-500">
      Welcome to GilTube
    </h1>
    <VideoPlayer />
  </div>
</template>
<script setup>
import VideoPlayer from './components/videoplayer/VideoPlayer.vue'
</script>