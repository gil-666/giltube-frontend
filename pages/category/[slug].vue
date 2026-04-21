<template>
  <!-- Main Content -->
  <main class="flex-1">
    <!-- Main Video Grid -->
    <div class="p-6">
      <!-- Category Title -->
      <h1 class="text-2xl font-bold mb-6">{{ categoryName }}</h1>

      <!-- Video Grid -->
      <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

        <!-- Video Card -->
        <div 
          v-for="video in videos" 
          :key="video.id"
          class=""
        >
          <NuxtLink :to="`/video/${video.id}`">
            <div class="bg-zinc-800 rounded-xl overflow-hidden aspect-video">
              <img class="w-full h-full object-cover" :src="baseUrl + video.thumbnail_url" :alt="video.title" />
            </div>
          </NuxtLink>
          <div class="flex mt-3 gap-3">
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
            <div>
              <NuxtLink :to="`/video/${video.id}`">
                <div class="flex items-center gap-1">
                  <h3 class="text-sm font-semibold line-clamp-2">
                    {{ video.title }}
                  </h3>
                  <span v-if="video.width >= 3840" class="p-0.5 bg-gray-900 text-gray-200 text-xs font-semibold flex-shrink-0 whitespace-nowrap border border-gray-500">4K</span>
                </div>
              </NuxtLink>
              <NuxtLink :to="`/channel/${video.channel.id}`" class="text-xs text-zinc-400 hover:text-yellow-400 transition flex items-center gap-1">
                {{ video.channel.name }}
                <VerifiedBadge :verified="video.channel?.verified || false" size="sm" />
              </NuxtLink>
              <p class="text-xs text-zinc-400">{{ formatViews(video.views) }} views • {{ getTimeAgo(video.created_at) }}</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Sentinel element for intersection observer -->
      <div ref="sentinelElement" class="h-1 mt-10"></div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex justify-center mt-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- End of content message -->
      <div v-if="!hasMore && videos.length > 0" class="text-center mt-8 text-zinc-400">
        <p>No more videos to load</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'

const route = useRoute()
const baseUrl = import.meta.env.VITE_API_BASE_URL

const videos = ref([])
const categoryName = ref('')
const categoryDescription = ref('')

// Pagination state
const currentPage = ref(0)
const pageSize = 12
const hasMore = ref(true)
const isLoading = ref(false)
const sentinelElement = ref(null)
let intersectionObserver = null

const updateMetaTags = () => {
  useMetaTags({
    title: `${categoryName.value} Videos - GilTube`,
    description: categoryDescription.value || `Browse ${categoryName.value} videos on GilTube`
  })
}

const loadMoreVideos = async () => {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true

  try {
    const offset = currentPage.value * pageSize
    const url = `/api/v1/categories/${route.params.slug}/videos?limit=${pageSize}&offset=${offset}`

    const response = await fetch(url)
    if (response.ok) {
      const newVideos = await response.json()
      console.log(`Loaded ${newVideos.length} videos from page ${currentPage.value}`)

      // If we got fewer videos than requested, we've reached the end
      if (newVideos.length < pageSize) {
        hasMore.value = false
      }

      // Append new videos instead of replacing
      videos.value = [...videos.value, ...newVideos]
      currentPage.value += 1
    }
  } catch (err) {
    console.error('Failed to load videos:', err)
  } finally {
    isLoading.value = false
  }
}

const resetPagination = () => {
  videos.value = []
  currentPage.value = 0
  hasMore.value = true
  isLoading.value = false
}

const setupIntersectionObserver = () => {
  // Clean up old observer
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  // Only set up observer if sentinel element exists
  if (!sentinelElement.value) {
    console.warn('Sentinel element not found!')
    return
  }

  console.log('Setting up intersection observer for sentinel element')

  // Create new observer
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log('Sentinel intersecting! Loading more videos...')
        }
        // When the sentinel comes into view, load more
        if (entry.isIntersecting && hasMore.value && !isLoading.value) {
          loadMoreVideos()
        }
      })
    },
    {
      rootMargin: '100px' // Start loading 100px before reaching the sentinel
    }
  )

  // Observe the sentinel element
  intersectionObserver.observe(sentinelElement.value)
}

onMounted(async () => {
  resetPagination()
  
  // Try to get category info from localStorage cache first
  const storedCategories = localStorage.getItem('categories')
  if (storedCategories) {
    try {
      const categories = JSON.parse(storedCategories)
      const category = categories.find(c => c.slug === route.params.slug)
      if (category) {
        categoryName.value = category.name
        categoryDescription.value = category.description
      }
    } catch (e) {
      console.error('Failed to parse categories:', e)
    }
  }
  
  // If category info not found, use slug as title (will be updated when first video loads)
  if (!categoryName.value) {
    categoryName.value = route.params.slug
  }
  
  updateMetaTags()
  await loadMoreVideos()
  await nextTick()
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})
</script>
