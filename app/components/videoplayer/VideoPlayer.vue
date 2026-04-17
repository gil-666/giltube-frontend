<template>
  <div class="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl bg-black">

    <!-- VIDEO -->
    <video
      ref="video"
      controls
      autoplay
      muted
      playsinline
      class="w-full"
      :class="{ 'opacity-40': isProcessing || isFailed }"
    ></video>

    <!-- PROCESSING OVERLAY -->
    <div
      v-if="isProcessing"
      class="absolute inset-0 flex items-center justify-center bg-black/70 text-center px-6"
    >
      <p class="text-white text-lg font-medium">
        This video is processing, it will be available later
      </p>
    </div>

    <!-- FAILED OVERLAY -->
    <div
      v-else-if="isFailed"
      class="absolute inset-0 flex items-center justify-center bg-black/70 text-center px-6"
    >
      <p class="text-red-400 text-lg font-medium">
        This video is not available
      </p>
    </div>

  </div>
</template>



<script setup lang="ts">
import Hls from 'hls.js'
import { onMounted, watch, ref, computed } from 'vue'

const props = defineProps({
  src: String,
  status: String
})

const video = ref<HTMLVideoElement | null>(null)

const isProcessing = computed(() => props.status === 'processing')
const isFailed = computed(() => props.status === 'failed')

function loadVideo(src: string) {
  if (!src || !video.value) return

  if (Hls.isSupported()) {
    const hls = new Hls()
    hls.loadSource(src)
    hls.attachMedia(video.value)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (!isProcessing.value && !isFailed.value) {
        video.value?.play()
      }
    })
  } else {
    video.value.src = src
    if (!isProcessing.value && !isFailed.value) {
      video.value.play()
    }
  }
}

onMounted(() => {
  if (!isProcessing.value && !isFailed.value) {
    loadVideo(props.src)
  }
})

watch(() => props.src, (newSrc) => {
  if (!isProcessing.value && !isFailed.value) {
    loadVideo(newSrc)
  }
})
</script>

