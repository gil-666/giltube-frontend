<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-white">{{ t('playlists.myPlaylists') }}</h1>
        <p class="text-gray-400 mt-2">{{ playlists.length }} {{ t('playlists.playlists') }}</p>
      </div>
      <button v-if="isLoggedIn" @click="openCreateModal" class="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition">
        + {{ t('playlists.createPlaylist') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && playlists.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 class="text-xl font-medium text-gray-300 mb-2">{{ t('playlists.noPlaylistsYet') }}</h3>
      <p class="text-gray-400 mb-6">{{ t('playlists.createYourFirst') }}</p>
      <button v-if="isLoggedIn" @click="openCreateModal" class="px-6 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition">
        {{ t('playlists.createPlaylist') }}
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink v-for="playlist in playlists" :key="playlist.id" :to="localePath(`/playlists/${playlist.id}`)" 
        class="bg-zinc-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-red-500/20 transition group cursor-pointer">
        
        <!-- Thumbnail placeholder with video count -->
        <div class="w-full aspect-video bg-zinc-700 relative overflow-hidden">
          <img
            v-if="getPlaylistThumbnail(playlist)"
            :src="getPlaylistThumbnail(playlist)"
            :alt="playlist.title"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div v-else class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p class="text-gray-400 text-sm font-medium">{{ playlist.video_count }} {{ t('playlists.videos') }}</p>
            </div>
          </div>
          
          <!-- Visibility badge -->
          <div class="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs font-medium text-white">
            {{ getVisibilityLabel(playlist.visibility) }}
          </div>
        </div>

        <!-- Info -->
        <div class="p-4">
          <h3 class="font-semibold text-white truncate">{{ playlist.title }}</h3>
          <p v-if="playlist.description" class="text-gray-400 text-sm line-clamp-2 mt-1">{{ playlist.description }}</p>

          <div class="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-700">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center shrink-0">
              <img v-if="creatorAvatarUrl" :src="creatorAvatarUrl" alt="Creator avatar" class="w-full h-full object-cover" />
              <span v-else class="text-xs font-semibold text-gray-300">Y</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-200 truncate">You</p>
              <p class="text-xs text-gray-500">Created {{ formatDate(playlist.created_at) }}</p>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-2 mt-4 pt-4 border-t border-zinc-700">
            <button @click.prevent="editPlaylist(playlist)" class="flex-1 px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded text-gray-300 transition">
              {{ t('common.edit') }}
            </button>
            <button @click.prevent="deletePlaylist(playlist.id)" class="flex-1 px-3 py-1 text-sm bg-red-900/30 hover:bg-red-900/50 rounded text-red-400 transition">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>

  <!-- Manager Modal (outside container for proper z-index) -->
  <PlaylistManager :is-open="showManager" :channels="channels" :editing-playlist="editingPlaylist" @close="showManager = false" @save="handleSavePlaylist" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import PlaylistManager from '~/app/components/PlaylistManager.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'

interface Playlist {
  id: string
  title: string
  description: string
  visibility: 'public' | 'private' | 'unlisted'
  video_count: number
  channel_id?: string
  thumbnail_url?: string
  created_at: string
}

interface EditablePlaylist {
  id: string
  title: string
  description: string
  visibility: 'public' | 'private' | 'unlisted'
  channelId: string
}

interface Channel {
  id: string
  name: string
  avatar_url?: string
}

const { t } = useI18n()
const localePath = useLocalePath()

const isLoading = ref(false)
const playlists = ref<Playlist[]>([])
const channels = ref<Channel[]>([])
const creatorAvatarUrl = computed(() => channels.value[0]?.avatar_url || '')
const showManager = ref(false)
const editingPlaylist = ref<EditablePlaylist | null>(null)
const isLoggedIn = ref(false)

useMetaTags({
  title: `${t('playlists.myPlaylists')} - GilTube`,
  description: t('playlists.myPlaylists')
})

const getPlaylistThumbnail = (playlist: Playlist) => {
  if (!playlist.thumbnail_url) return ''
  if (playlist.thumbnail_url.startsWith('http')) return playlist.thumbnail_url
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${baseUrl}${playlist.thumbnail_url}`
}

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
  if (typeof window === 'undefined') return
  const userID = localStorage.getItem('user_id')
  if (!userID) return

  isLoading.value = true
  try {
    const scope = getActivePlaylistScope()
    const queryParam = scope.mode === 'channel'
      ? `channel_id=${encodeURIComponent(scope.value)}`
      : `user_id=${encodeURIComponent(scope.value)}`

    const response = await fetch(`/api/v1/playlists?${queryParam}`)
    if (response.ok) {
      const data = await response.json()
      playlists.value = data.playlists || []
    }
  } catch (error) {
    console.error('Failed to load playlists:', error)
  } finally {
    isLoading.value = false
  }
}

const loadChannels = async () => {
  if (typeof window === 'undefined') return
  const userID = localStorage.getItem('user_id')
  if (!userID) return

  try {
    const response = await fetch(`/api/v1/users/${userID}/channels`)
    if (response.ok) {
      const data = await response.json()
      channels.value = data.channels || []
    }
  } catch (error) {
    console.error('Failed to load channels:', error)
  }
}

const openCreateModal = () => {
  editingPlaylist.value = null
  showManager.value = true
}

const editPlaylist = (playlist: Playlist) => {
  editingPlaylist.value = {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    visibility: playlist.visibility,
    channelId: playlist.channel_id || ''
  }
  showManager.value = true
}

const deletePlaylist = async (id: string) => {
  if (typeof window === 'undefined') return
  if (!confirm(t('playlists.confirmDelete'))) return

  try {
    const response = await fetch(`/api/v1/playlists/${id}`, {
      method: 'DELETE',
      headers: {
        'X-User-ID': localStorage.getItem('user_id') || ''
      }
    })
    if (response.ok) {
      playlists.value = playlists.value.filter(p => p.id !== id)
    }
  } catch (error) {
    console.error('Failed to delete playlist:', error)
  }
}

const handleSavePlaylist = async (playlist: any) => {
  if (typeof window === 'undefined') return
  const userID = localStorage.getItem('user_id')
  const isNew = !playlist.id

  try {
    const method = isNew ? 'POST' : 'PUT'
    const url = isNew ? '/api/v1/playlists' : `/api/v1/playlists/${playlist.id}`

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userID || ''
      },
      body: JSON.stringify({
        title: playlist.title,
        description: playlist.description,
        visibility: playlist.visibility,
        channel_id: playlist.channelId || undefined
      })
    })

    if (response.ok) {
      loadPlaylists()
    }
  } catch (error) {
    console.error('Failed to save playlist:', error)
  }
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const getVisibilityLabel = (visibility: string) => {
  const labels: Record<string, string> = {
    public: t('playlists.public'),
    private: t('playlists.private'),
    unlisted: t('playlists.unlisted')
  }
  return labels[visibility] || visibility
}

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('user_id')
  loadPlaylists()
  loadChannels()
})

// Watch for changes to active account and reload playlists
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'active_account') {
      loadPlaylists()
    }
  })
}
</script>

