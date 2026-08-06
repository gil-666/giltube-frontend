<template>
  <div class="min-h-full bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
    <!-- Download Status Toast -->
    <div v-if="downloadStatus" class="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
      {{ downloadStatus }}
    </div>

    <!-- Header -->
    <div class="mx-auto mb-6 max-w-[96rem]">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-4xl font-bold mb-2">{{ t('dashboard.title') }}</h1>
          <p class="text-gray-400">{{ t('dashboard.subtitle') }}</p>
        </div>
        <NuxtLink
          :to="localePath('/upload')"
          class="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          {{ t('dashboard.uploadVideo') }}
        </NuxtLink>
      </div>
    </div>

    <div class="mx-auto mb-6 max-w-[96rem] border-b border-zinc-800">
      <div class="flex gap-8 overflow-x-auto text-sm font-semibold text-zinc-400">
        <button
          type="button"
          :class="['border-b-2 px-1 pb-3 transition', activeDashboardTab === 'videos' ? 'border-white text-white' : 'border-transparent hover:text-zinc-200']"
          @click="activeDashboardTab = 'videos'"
        >
          Videos
        </button>
        <button
          type="button"
          :class="['border-b-2 px-1 pb-3 transition', activeDashboardTab === 'analytics' ? 'border-white text-white' : 'border-transparent hover:text-zinc-200']"
          @click="activeDashboardTab = 'analytics'"
        >
          Analytics
        </button>
      </div>
    </div>

    <div v-if="activeDashboardTab === 'analytics'" class="mx-auto max-w-[96rem]">
      <ChannelMetrics v-if="channelId" :channel-id="channelId" />
    </div>

    <template v-else>
      <!-- Loading State -->
      <div v-if="isLoading" class="mx-auto max-w-[96rem] py-12 text-center">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>{{ t('dashboard.loading') }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="videos.length === 0" class="mx-auto max-w-[96rem] py-12 text-center">
        <div class="bg-zinc-900 rounded-lg p-12">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-2xl font-bold mb-2">{{ t('dashboard.noVideos') }}</h2>
          <p class="text-gray-400 mb-6">{{ t('dashboard.startUploading') }}</p>
          <NuxtLink
            :to="localePath('/upload')"
            class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition"
          >
            {{ t('dashboard.uploadVideo') }}
          </NuxtLink>
        </div>
      </div>

      <div
        v-else
        ref="tableCardRef"
        class="mx-auto flex max-w-[96rem] flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20"
        :style="{ minHeight: dashboardTableMinHeight }"
      >
        <div class="shrink-0 flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <svg class="h-5 w-5 flex-shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          <input
            v-model="videoFilter"
            type="search"
            placeholder="Filter videos"
            class="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          />
        </div>

        <div ref="tableScrollRef" class="dashboard-table-scroll min-h-0 flex-1 overflow-auto">
          <table class="w-full min-w-[1500px] table-fixed text-left text-sm">
            <thead class="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-400">
              <tr>
                <th class="w-10 px-4 py-3">
                  <input type="checkbox" class="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-red-600" aria-label="Select all videos" />
                </th>
                <th class="w-[34rem] px-2 py-3">Video</th>
                <th class="w-40 px-4 py-3">Visibility</th>
                <th class="w-40 px-4 py-3">Restrictions</th>
                <th class="w-44 px-4 py-3">Date</th>
                <th class="w-28 px-4 py-3 text-right">Views</th>
                <th class="w-32 px-4 py-3 text-right">Comments</th>
                <th class="w-32 px-4 py-3 text-right">Likes</th>
                <th class="sticky right-0 w-16 bg-zinc-950 px-4 py-3 text-right shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.9)]"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
              <tr v-for="video in paginatedVideos" :key="video.id" class="motion-row group transition hover:bg-zinc-900/80">
                <td class="px-4 py-3 align-top">
                  <input type="checkbox" class="mt-7 h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-red-600" :aria-label="`Select ${video.title}`" />
                </td>
                <td class="px-2 py-3 align-top">
                  <div class="flex gap-4">
                    <button
                      type="button"
                      class="relative h-[68px] w-[120px] flex-shrink-0 overflow-hidden rounded-md bg-black text-left"
                      @click="router.push(localePath(`/video/${video.id}`))"
                    >
                      <img
                        v-if="getThumbnailUrl(video)"
                        :src="getThumbnailUrl(video)"
                        :alt="video.title"
                        class="h-full w-full object-cover"
                        @error="handleImageError"
                      />
                      <span v-else class="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-600">
                        <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 7H6a1 1 0 00-.553.106A1 1 0 004 8v4a1 1 0 001.447.894l4-2.667a1 1 0 000-1.788l-4-2.667z" />
                        </svg>
                      </span>
                      <span v-if="video.status === 'processing'" class="absolute inset-x-0 bottom-0 h-1 bg-zinc-700">
                        <span class="block h-full bg-yellow-500" :style="{ width: (video.progress || 0) + '%' }" />
                      </span>
                    </button>

                    <div class="min-w-0 py-1">
                      <div class="flex min-w-0 items-center gap-2">
                        <button type="button" class="truncate text-left font-semibold text-white hover:text-red-200" @click="editVideo(video.id)">
                          {{ video.title }}
                        </button>
                        <span v-if="isVideo8K(video.width)" class="flex-shrink-0 border border-zinc-600 bg-zinc-900 px-1 py-0.5 text-[10px] font-semibold text-zinc-200">8K</span>
                        <span v-if="isVideo4K(video.width)" class="flex-shrink-0 border border-zinc-600 bg-zinc-900 px-1 py-0.5 text-[10px] font-semibold text-zinc-200">4K</span>
                      </div>
                      <p class="mt-1 line-clamp-2 max-w-xl text-xs leading-5 text-zinc-500">{{ video.description || t('channels.noDescription') }}</p>
                      <div v-if="video.status === 'processing'" class="mt-2 flex max-w-xs items-center gap-2">
                        <div class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div class="h-full rounded-full bg-yellow-500 transition-all" :style="{ width: formatProcessingProgress(video.progress) }" />
                        </div>
                        <span class="shrink-0 text-xs font-semibold text-yellow-300">{{ t('dashboard.processing') }} {{ formatProcessingProgress(video.progress) }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 align-top">
                  <div class="mt-5 flex items-center gap-2 font-semibold text-white">
                    <svg class="h-5 w-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path v-if="video.hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9-4.5-9-7s4-7 9-7c1.08 0 2.117.2 3.075.568M17.94 17.94A10.9 10.9 0 0 0 21 12c0-1.3-1.08-2.998-2.777-4.335M9.88 9.88a3 3 0 0 0 4.24 4.24M3 3l18 18" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                    </svg>
                    {{ video.hidden ? 'Unlisted' : 'Public' }}
                  </div>
                </td>
                <td class="px-4 py-3 align-top">
                  <p class="mt-5 font-semibold text-white">{{ video.explicit ? '18+ content' : 'None' }}</p>
                </td>
                <td class="px-4 py-3 align-top">
                  <p class="mt-5 font-semibold text-white">{{ formatTableDate(video.created_at) }}</p>
                  <p class="mt-1 text-xs text-zinc-500">{{ formatStatus(video.status) }}</p>
                </td>
                <td class="px-4 py-3 text-right align-top">
                  <p class="mt-5 font-semibold text-white">{{ formatNumber(video.views || 0) }}</p>
                </td>
                <td class="px-4 py-3 text-right align-top">
                  <p class="mt-5 font-semibold text-white">{{ formatNumber(video.comments_count || 0) }}</p>
                </td>
                <td class="px-4 py-3 text-right align-top">
                  <p class="mt-5 font-semibold text-white">{{ formatNumber(video.likes || 0) }}</p>
                </td>
                <td class="sticky right-0 bg-zinc-950 px-4 py-3 text-right align-top shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.9)] transition group-hover:bg-zinc-900">
                  <button
                    type="button"
                    class="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                    aria-label="Video actions"
                    :aria-expanded="openActionsMenuId === video.id"
                    @click.stop="toggleActionsMenu(video, $event)"
                  >
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredVideos.length === 0" class="border-t border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
          No videos match your filter.
        </div>

        <div v-else class="shrink-0 flex flex-col gap-3 border-t border-zinc-800 px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center justify-between gap-4 sm:justify-end">
            <span>{{ paginationStart }}-{{ paginationEnd }} of {{ filteredVideos.length }}</span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                :disabled="currentPage <= 1"
                class="rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
                @click="currentPage--"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span class="min-w-16 text-center text-xs text-zinc-500">Page {{ currentPage }} / {{ totalPages }}</span>
              <button
                type="button"
                :disabled="currentPage >= totalPages"
                class="rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
                @click="currentPage++"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <Transition name="fade-soft">
      <div
        v-if="openActionsMenuId"
        class="fixed inset-0 z-40"
        @click="openActionsMenuId = ''"
      />
    </Transition>

    <Transition name="menu-pop">
      <div
        v-if="selectedActionsVideo"
        class="fixed z-50 w-56 origin-top-right overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/50"
        :style="{ top: actionsMenuPosition.top + 'px', right: actionsMenuPosition.right + 'px' }"
      >
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-100 transition hover:bg-zinc-800"
          @click="handleEditAction(selectedActionsVideo.id)"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4 4 0 0 1-1.897 1.06L6 17.75l.62-2.685a4 4 0 0 1 1.06-1.897L16.862 4.487Z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 7.125 16.875 4.5M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </span>
          <span class="font-semibold">{{ t('dashboard.edit') }}</span>
        </button>

        <button
          type="button"
          :disabled="selectedActionsVideo.status !== 'published' && selectedActionsVideo.status !== 'ready' || downloadingVideoIds.has(selectedActionsVideo.id)"
          class="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-3 text-left text-sm text-gray-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          :title="selectedActionsVideo.status !== 'published' && selectedActionsVideo.status !== 'ready' ? t('dashboard.downloadUnavailable') : t('dashboard.downloadHint')"
          @click="handleDownloadAction(selectedActionsVideo)"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
            </svg>
          </span>
          <span class="font-semibold">{{ downloadingVideoIds.has(selectedActionsVideo.id) ? t('dashboard.downloading') : t('dashboard.download') }}</span>
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-3 text-left text-sm text-red-100 transition hover:bg-zinc-800"
          @click="handleDeleteAction(selectedActionsVideo)"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-red-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.74 9-.346 9m-4.788 0L9.26 9M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2m-7 0h10" />
            </svg>
          </span>
          <span class="font-semibold">{{ t('dashboard.delete') }}</span>
        </button>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-zinc-900 rounded-lg p-8 max-w-md w-full">
        <h2 class="text-2xl font-bold mb-4">{{ t('dashboard.deleteModal') }}</h2>
        <p class="text-gray-400 mb-6">
          {{ t('dashboard.deleteConfirm', { title: deleteConfirm.title }) }}
        </p>
        <div class="flex gap-4">
          <button
            @click="deleteConfirm = null"
            class="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition"
          >
            {{ t('video.cancel') }}
          </button>
          <button
            @click="handleDelete(deleteConfirm.id)"
            :disabled="isDeleting"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition disabled:opacity-50"
          >
            {{ isDeleting ? t('dashboard.deleting') : t('dashboard.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ChannelMetrics from '~/app/components/ChannelMetrics.vue'
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from 'vue'
import { getMyVideos, deleteVideo, downloadVideo as downloadVideoService } from '~/app/service/videos'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { isVideo4K, isVideo8K, resolveMediaUrl } from '~/app/utils/media'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'

const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()

// Set meta tags for dashboard page
useMetaTags({
  title: 'My Videos - GilTube',
  description: 'Manage your uploaded videos'
})

const isLoading = ref(true)
const isDeleting = ref(false)
const downloadingVideoIds = ref(new Set())
const downloadStatus = ref('')
const videos = ref([])
const deleteConfirm = ref(null)
const openActionsMenuId = ref('')
const activeDashboardTab = ref('videos')
const videoFilter = ref('')
const currentPage = ref(1)
const videosPerPage = ref(10)
const tableCardRef = ref(null)
const tableScrollRef = ref(null)
const dashboardTableMinHeight = ref('28rem')
const actionsMenuPosition = ref({ top: 0, right: 16 })
const userId = ref('')
const channelId = ref('')
let refreshInterval = null

// Check if any videos are processing
const hasProcessingVideos = computed(() => {
  return videos.value.some(v => v.status === 'processing')
})

const filteredVideos = computed(() => {
  const query = videoFilter.value.trim().toLowerCase()
  if (!query) return videos.value
  return videos.value.filter((video) =>
    String(video.title || '').toLowerCase().includes(query) ||
    String(video.description || '').toLowerCase().includes(query) ||
    String(video.status || '').toLowerCase().includes(query)
  )
})

const selectedActionsVideo = computed(() => {
  if (!openActionsMenuId.value) return null
  return videos.value.find(video => video.id === openActionsMenuId.value) || null
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredVideos.value.length / videosPerPage.value)))

const paginatedVideos = computed(() => {
  const start = (currentPage.value - 1) * videosPerPage.value
  return filteredVideos.value.slice(start, start + videosPerPage.value)
})

const paginationStart = computed(() => {
  if (filteredVideos.value.length === 0) return 0
  return (currentPage.value - 1) * videosPerPage.value + 1
})

const paginationEnd = computed(() => Math.min(currentPage.value * videosPerPage.value, filteredVideos.value.length))

watch(videoFilter, () => {
  currentPage.value = 1
  updateViewportRows()
})

watch([filteredVideos, videosPerPage], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

watch(activeDashboardTab, (tab) => {
  if (tab === 'videos') {
    updateViewportRows()
  }
})

const updateViewportRows = async () => {
  await nextTick()
  const tableEl = tableScrollRef.value
  if (!tableEl || typeof window === 'undefined') return

  const cardEl = tableCardRef.value
  const rect = tableEl.getBoundingClientRect()
  const cardRect = cardEl?.getBoundingClientRect?.()
  const viewportHeight = Math.min(window.visualViewport?.height || window.innerHeight, window.innerHeight)
  const paginationHeight = 62
  const bottomPadding = 24
  const tableHeaderHeight = 44
  const rowHeight = 93
  if (cardRect) {
    const cardHeight = Math.max(320, viewportHeight - cardRect.top - bottomPadding)
    dashboardTableMinHeight.value = `${Math.floor(cardHeight)}px`
  }
  const availableRowsHeight = viewportHeight - rect.top - paginationHeight - bottomPadding - tableHeaderHeight
  const nextRows = Math.max(4, Math.min(50, Math.floor(availableRowsHeight / rowHeight)))
  videosPerPage.value = Number.isFinite(nextRows) ? nextRows : 10
}

const getThumbnailUrl = (video) => {
  if (!video.thumbnail_url) return null
  return resolveMediaUrl(video.thumbnail_url)
}

onMounted(async () => {
  await checkAuth()
  loadActiveChannel()
  await loadVideos()
  await updateViewportRows()
  window.addEventListener('resize', updateViewportRows)
  window.visualViewport?.addEventListener('resize', updateViewportRows)
  
  // Auto-refresh every 5 seconds if there are processing videos
  refreshInterval = setInterval(() => {
    if (hasProcessingVideos.value) {
      loadVideos(true) // Silent refresh (no loading spinner)
    }
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  window.removeEventListener('resize', updateViewportRows)
  window.visualViewport?.removeEventListener('resize', updateViewportRows)
})

const handleImageError = (event) => {
  // Fallback when thumbnail fails to load - show placeholder
  event.target.style.display = 'none'
}

const checkAuth = async () => {
  const storedUserId = localStorage.getItem('user_id')
  if (!storedUserId) {
    await router.push(localePath('/login'))
  }
  userId.value = storedUserId
}

const loadActiveChannel = () => {
  // Load the currently active channel from localStorage
  const activeAccount = localStorage.getItem('active_account')
  if (activeAccount && activeAccount !== 'personal') {
    channelId.value = activeAccount
  }
}

const loadVideos = async (silent = false) => {
  if (!channelId.value) {
    console.error('No channel selected')
    return
  }
  
  try {
    if (!silent) {
      isLoading.value = true
    }
    const data = await getMyVideos(channelId.value)
    videos.value = data || []
  } catch (err) {
    console.error('Failed to load videos:', err)
  } finally {
    if (!silent) {
      isLoading.value = false
    }
  }
}

const formatProcessingProgress = (progress) => {
  const value = Number(progress || 0)
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return Math.round(clamped) + '%'
}

const formatStatus = (status) => {
  const map = {
    published: t('dashboard.published'),
    ready: t('dashboard.ready'),
    processing: t('dashboard.processing'),
    failed: t('dashboard.failed'),
    pending: t('dashboard.pending'),
  }
  return map[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTableDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const editVideo = (videoId) => {
  // TODO: Implement edit functionality
  router.push(localePath(`/edit-video/${videoId}`))
}

const toggleActionsMenu = (video, event) => {
  if (openActionsMenuId.value === video.id) {
    openActionsMenuId.value = ''
    return
  }

  const rect = event.currentTarget.getBoundingClientRect()
  actionsMenuPosition.value = {
    top: Math.min(rect.bottom + 8, window.innerHeight - 220),
    right: Math.max(window.innerWidth - rect.right, 16),
  }
  openActionsMenuId.value = video.id
}

const handleEditAction = (videoId) => {
  openActionsMenuId.value = ''
  editVideo(videoId)
}

const confirmDelete = (video) => {
  deleteConfirm.value = video
}

const handleDeleteAction = (video) => {
  openActionsMenuId.value = ''
  confirmDelete(video)
}

const handleDelete = async (videoId) => {
  try {
    isDeleting.value = true
    await deleteVideo(videoId)
    videos.value = videos.value.filter((v) => v.id !== videoId)
    deleteConfirm.value = null
  } catch (err) {
    console.error('Failed to delete video:', err)
    alert(err?.response?.data?.error || err?.message || t('dashboard.deleteError'))
  } finally {
    isDeleting.value = false
  }
}

const downloadVideo = async (video) => {
  try {
    downloadingVideoIds.value.add(video.id)
    downloadStatus.value = t('dashboard.preparingDownload')
    
    const blob = await downloadVideoService(video.id, '1080p', (status) => {
      downloadStatus.value = status
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${video.title}.mp4`
    link.click()
    window.URL.revokeObjectURL(url)
    
    downloadStatus.value = ''
  } catch (err) {
    console.error('Failed to download video:', err)
    alert(err.message || t('dashboard.downloadError'))
    downloadStatus.value = ''
  } finally {
    downloadingVideoIds.value.delete(video.id)
  }
}

const handleDownloadAction = async (video) => {
  openActionsMenuId.value = ''
  await downloadVideo(video)
}

definePageMeta({
  layout: false,
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dashboard-table-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(82 82 91) rgb(9 9 11);
  overscroll-behavior-x: contain;
}

.dashboard-table-scroll::-webkit-scrollbar {
  height: 10px;
}

.dashboard-table-scroll::-webkit-scrollbar-track {
  background: rgb(9 9 11);
  border-top: 1px solid rgb(39 39 42);
}

.dashboard-table-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, rgb(63 63 70), rgb(113 113 122));
  border: 2px solid rgb(9 9 11);
  border-radius: 999px;
}

.dashboard-table-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, rgb(82 82 91), rgb(161 161 170));
}
</style>
