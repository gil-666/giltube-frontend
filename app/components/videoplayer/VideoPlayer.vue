<template>
  <div class="w-full max-w-4xl mx-auto">
    <video
      ref="video"
      controls
      class="w-full rounded-xl bg-black"
    ></video>
  </div>
</template>

<script setup>
import Hls from 'hls.js'
import { onMounted, ref } from 'vue'

const video = ref(null)

// change this later dynamically
const src = 'http://localhost:8080/api/v1/videos/6aaf69c8-567d-4f9c-a2ba-ca6999f5729b/stream/master.m3u8'

onMounted(() => {
  if (Hls.isSupported()) {
    const hls = new Hls()

    hls.loadSource(src)
    hls.attachMedia(video.value)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.value.play()
    })
  } else if (video.value.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari fallback
    video.value.src = src
    video.value.play()
  }
})
</script>
