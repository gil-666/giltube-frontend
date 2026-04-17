<template>
  <div class="w-full max-w-4xl mx-auto">
    <video ref="video" controls class="w-full rounded-xl bg-black"></video>
  </div>
</template>

<script setup>
import Hls from 'hls.js'
import { onMounted, watch, ref } from 'vue'

const props = defineProps({
  src: String
})

const video = ref(null)

function loadVideo(src) {
  if (!src || !video.value) return

  if (Hls.isSupported()) {
    const hls = new Hls()
    hls.loadSource(src)
    hls.attachMedia(video.value)
  } else {
    video.value.src = src
  }
}

onMounted(() => {
  loadVideo(props.src)
})

watch(() => props.src, (newSrc) => {
  loadVideo(newSrc)
})
</script>
