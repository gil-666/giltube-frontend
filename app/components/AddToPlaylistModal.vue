<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center" style="z-index: 2147483647 !important; pointer-events: auto; overflow: visible;" @click.self="closeModal">
      <div class="bg-zinc-800 rounded-lg max-w-md w-full mx-4" style="z-index: 2147483647 !important; position: relative; overflow: visible;">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 class="text-lg font-semibold text-white">{{ t('playlists.addToPlaylist') }}</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <div v-if="isLoading" class="text-center py-8">
            <p class="text-gray-400">{{ t('common.loading') }}</p>
          </div>

          <div v-else-if="playlists.length === 0" class="text-center py-8">
            <p class="text-gray-400 mb-4">{{ t('playlists.noPlaylists') }}</p>
            <button @click="emitCreateNew" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white">
              {{ t('playlists.createNew') }}
            </button>
          </div>

          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <button v-for="playlist in playlists" :key="playlist.id" @click="selectPlaylist(playlist)" 
              class="w-full text-left p-3 rounded border border-zinc-700 hover:border-red-500 hover:bg-zinc-700 transition">
              <div class="font-medium text-white">{{ playlist.title }}</div>
              <div class="text-sm text-gray-400">{{ playlist.video_count }} {{ t('playlists.videos') }}</div>
            </button>

            <button @click="emitCreateNew" class="w-full p-3 rounded border border-dashed border-zinc-600 hover:border-red-500 text-gray-400 hover:text-white transition">
              + {{ t('playlists.createNew') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Playlist {
  id: string
  title: string
  description: string
  video_count: number
  visibility: string
}

const props = defineProps<{
  isOpen: boolean
  videoId: string
}>()

const emit = defineEmits<{
  close: []
  select: [playlistId: string]
  createNew: []
}>()

const { t } = useI18n()
const isLoading = ref(false)
const playlists = ref<Playlist[]>([])

const getActivePlaylistScope = () => {
  if (typeof window === 'undefined') return { mode: 'personal', value: '' }

  const activeAccount = localStorage.getItem('active_account') || 'personal'
  const userID = localStorage.getItem('user_id') || ''

  if (!activeAccount || activeAccount === 'personal' || activeAccount === userID) {
    return { mode: 'personal', value: userID }
  }

  return { mode: 'channel', value: activeAccount }
}

const loadPlaylists = async () => {
  if (!props.videoId) return
  
  isLoading.value = true
  try {
    const scope = getActivePlaylistScope()
    const queryParam = scope.mode === 'channel'
      ? `channel_id=${encodeURIComponent(scope.value)}`
      : `user_id=${encodeURIComponent(scope.value)}`

    const headers: Record<string, string> = {}
    if (scope.mode === 'personal' && scope.value) {
      headers['X-User-Id'] = scope.value
    }

    const response = await fetch(`/api/v1/playlists?${queryParam}`, {
      headers,
      credentials: 'include'
    })
    if (response.ok) {
      const data = await response.json()
      const allPlaylists = data.playlists || []
      playlists.value = scope.mode === 'personal'
        ? allPlaylists.filter((playlist: Playlist & { channel_id?: string }) => !playlist.channel_id)
        : allPlaylists
    }
  } catch (error) {
    console.error('Failed to load playlists:', error)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadPlaylists()
  }
})

onMounted(() => {
  if (props.isOpen) {
    loadPlaylists()
  }
})

const selectPlaylist = (playlist: Playlist) => {
  emit('select', playlist.id)
  closeModal()
}

const emitCreateNew = () => {
  emit('createNew')
  closeModal()
}

const closeModal = () => {
  emit('close')
}
</script>


