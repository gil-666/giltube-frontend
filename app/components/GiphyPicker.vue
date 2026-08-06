<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div class="bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-zinc-700">
      <!-- Header -->
      <div class="border-b border-zinc-700 p-4 flex items-center justify-between">
        <h2 class="text-xl font-bold">{{ t('video.selectGif') || 'Select a GIF' }}</h2>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-white transition text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <!-- Search Bar -->
      <div class="border-b border-zinc-700 p-4">
        <input
          v-model="searchQuery"
          @keyup.enter="performSearch"
          type="text"
          :placeholder="t('video.searchGif') || 'Search GIFs...'"
          class="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <div class="flex gap-2 mt-2">
          <button
            @click="performSearch"
            :disabled="isLoading"
            :class="{
              'bg-blue-600 hover:bg-blue-700': activeMode === 'search',
              'bg-zinc-700 hover:bg-zinc-600': activeMode !== 'search'
            }"
            class="flex-1 px-3 py-2 rounded transition disabled:opacity-50 text-sm"
          >
            {{ isLoading && activeMode === 'search' ? (t('video.searching') || 'Searching...') : (t('video.search') || 'Search') }}
          </button>
          <button
            @click="loadTrending"
            :disabled="isLoading"
            :class="{
              'bg-blue-600 hover:bg-blue-700': activeMode === 'trending',
              'bg-zinc-700 hover:bg-zinc-600': activeMode !== 'trending'
            }"
            class="flex-1 px-3 py-2 rounded transition disabled:opacity-50 text-sm"
          >
            {{ isLoading && activeMode === 'trending' ? (t('video.searching') || 'Searching...') : (t('video.trending') || 'Trending') }}
          </button>
        </div>
      </div>

      <!-- GIF Grid -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="isLoading" class="flex items-center justify-center h-32">
          <div class="text-gray-400">{{ t('video.loading') || 'Loading...' }}</div>
        </div>
        <div v-else-if="gifs.length === 0" class="flex items-center justify-center h-32">
          <div class="text-gray-400">{{ t('video.noGifs') || 'No GIFs found' }}</div>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            v-for="gif in gifs"
            :key="gif.id"
            @click="selectGif(gif)"
            class="relative group overflow-hidden rounded border border-zinc-700 hover:border-blue-500 transition"
          >
            <img
              :src="gif.images.downsized.url"
              :alt="gif.title"
              class="w-full h-40 object-cover"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end justify-center">
              <span class="text-xs text-white opacity-0 group-hover:opacity-100 transition pb-2 px-1 text-center truncate">
                {{ gif.title }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-zinc-700 p-4 flex justify-end gap-2">
        <button
          @click="closeModal"
          class="px-4 py-2 text-gray-400 hover:text-white transition text-sm"
        >
          {{ t('video.cancel') || 'Cancel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchGiphy, getTrendingGiphy, type GiphyGif } from '~/app/utils/giphy'

const { t } = useI18n()

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'select', gif: GiphyGif): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const gifs = ref<GiphyGif[]>([])
const isLoading = ref(false)
const activeMode = ref<'search' | 'trending'>('trending')

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  activeMode.value = 'search'
  isLoading.value = true
  try {
    gifs.value = await searchGiphy(searchQuery.value)
  } finally {
    isLoading.value = false
  }
}

const loadTrending = async () => {
  activeMode.value = 'trending'
  isLoading.value = true
  try {
    gifs.value = await getTrendingGiphy()
  } finally {
    isLoading.value = false
  }
}

const selectGif = (gif: GiphyGif) => {
  emit('select', gif)
  closeModal()
}

const closeModal = () => {
  emit('close')
  searchQuery.value = ''
  gifs.value = []
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      loadTrending()
    }
  }
)
</script>
