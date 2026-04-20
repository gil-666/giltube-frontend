<template>
  <div v-if="!isLoading && analytics" class="flex items-center gap-6 text-sm">
    <!-- Views Stat -->
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
      </svg>
      <span class="text-gray-300 font-medium">{{ formatNumber(analytics.total_views) }}</span>
    </div>

    <!-- Likes Stat -->
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
      </svg>
      <span class="text-gray-300 font-medium">{{ formatNumber(analytics.total_likes) }}</span>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else-if="isLoading" class="text-xs text-gray-400">
    Loading...
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getChannelAnalytics } from '~/app/service/videos'

const props = defineProps<{
  channelId: string
}>()

const isLoading = ref(true)
const analytics = ref<any>(null)

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const loadAnalytics = async () => {
  if (!props.channelId) return

  try {
    isLoading.value = true
    const data = await getChannelAnalytics(props.channelId)
    analytics.value = data
  } catch (err) {
    // Silently fail if analytics endpoint doesn't exist
    console.error('Analytics error:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAnalytics()
})
</script>
