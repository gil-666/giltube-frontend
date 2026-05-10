<template>
    <div class="min-h-screen bg-black text-white">
        <div class="p-6 max-w-6xl mx-auto">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>

            <!-- Playlist Header -->
            <div v-else-if="playlist">
                <!-- Playlist Title Section -->
                <div class="mb-8">
                    <div class="flex flex-col lg:flex-row lg:items-start gap-6 mb-4">
                        <div class="w-full lg:w-80 xl:w-96 flex-shrink-0">
                            <div class="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                                <img
                                    v-if="playlistCoverImage"
                                    :src="playlistCoverImage"
                                    :alt="playlist.title || t('playlists.playlistCover')"
                                    class="w-full h-full object-cover"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-gray-400">
                                    <div class="text-center">
                                        <div class="text-sm uppercase tracking-[0.3em] mb-2">{{ t('playlists.playlist') }}</div>
                                        <div class="text-lg font-semibold">{{ playlist.title }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <h1 class="text-4xl font-bold mb-2">{{ playlist.title }}</h1>
                            <p v-if="playlist.description" class="text-gray-400 text-lg">{{ playlist.description }}</p>
                            <div class="flex items-center gap-3 mt-4 flex-wrap">
                                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold" :class="{
                                    'bg-green-900 text-green-200': playlist.visibility === 'public',
                                    'bg-yellow-900 text-yellow-200': playlist.visibility === 'unlisted',
                                    'bg-red-900 text-red-200': playlist.visibility === 'private'
                                }">
                                    {{ playlist.visibility }}
                                </span>
                                <span class="text-sm text-gray-400">{{ playlist.videos_count }} {{ playlist.videos_count === 1 ? t('playlists.video') : t('playlists.videos') }}</span>
                            </div>
                        </div>

                        <!-- Play and Edit/Delete Buttons -->
                        <div class="flex gap-2">
                            <NuxtLink 
                                v-if="playlist.videos && playlist.videos.length > 0"
                                :to="localePath(`/video/${playlist.videos[0].id}?playlist_id=${route.params.id}&index=0`)"
                                class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition text-sm flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                                {{ t('playlists.playButton') || 'Play' }}
                            </NuxtLink>
                            <button v-if="isOwner" @click="showEditPlaylist = true"
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition text-sm">
                                {{ t('playlists.editButton') }}
                            </button>
                            <button v-if="isOwner" @click="deletePlaylist"
                                class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition text-sm">
                                {{ t('playlists.deleteButton') }}
                            </button>
                        </div>
                    </div>

                    <!-- Creator Card -->
                    <div class="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-700">
                        <div class="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                            <img v-if="creatorAvatarUrl" :src="creatorAvatarUrl" class="w-full h-full object-cover" />
                            <span v-else
                                class="text-xs font-semibold text-gray-300 w-full h-full flex items-center justify-center">
                                {{ creatorInitial }}
                            </span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-200">{{ isOwner ? t('common.you') : creatorName }}</p>
                            <p class="text-xs text-gray-500">{{ t('playlists.createdLabel') }} {{
                                formatDate(playlist.created_at || '') }}</p>
                        </div>
                    </div>
                </div>

                <!-- Videos List -->
                <div class="space-y-2">
                    <h2 class="text-xl font-bold mb-4">{{ t('playlists.videosList') }}</h2>

                    <div v-if="playlist.videos && playlist.videos.length > 0" class="space-y-2">
                        <div v-for="(video, index) in playlist.videos" :key="`${video.id}-${index}`"
                            class="flex items-center gap-4 p-4 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition group">
                            <!-- Video Number -->
                            <div class="text-sm font-medium text-gray-500 w-8">{{ index + 1 }}</div>

                            <!-- Video Thumbnail -->
                            <div class="w-20 h-20 flex-shrink-0 bg-zinc-700 rounded overflow-hidden">
                                <NuxtLink :to="localePath(`/video/${video.id}?playlist_id=${route.params.id}&index=${index}`)" class="w-full h-full">
                                    <img v-if="video.thumbnail_url" :src="video.thumbnail_url" :alt="video.title"
                                        class="w-full h-full object-cover hover:opacity-80 transition" />
                                    <div v-else
                                        class="w-full h-full flex items-center justify-center bg-zinc-700 text-gray-400 text-xs">
                                        {{ t('playlists.noThumbnail') }}
                                    </div>
                                </NuxtLink>
                            </div>

                            <!-- Video Info -->
                            <div class="flex-1 min-w-0">
                                <NuxtLink :to="localePath(`/video/${video.id}?playlist_id=${route.params.id}&index=${index}`)"
                                    class="block hover:text-blue-400 transition">
                                    <p class="font-medium truncate">{{ video.title }}</p>
                                </NuxtLink>
                                <NuxtLink :to="localePath(`/channel/${video.channel_id}`)"
                                    class="text-sm text-gray-400 hover:text-gray-200 transition truncate block">
                                    {{ channelsMap[video.channel_id]?.name || t('playlists.unknownChannel') }}
                                </NuxtLink>
                                <div v-if="video.duration" class="text-xs text-gray-500 mt-1">
                                    {{ formatDuration(video.duration) }}
                                </div>
                            </div>

                            <!-- Control Buttons (Owner Only) -->
                            <div v-if="isOwner"
                                class="flex gap-2 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                <!-- Move Up Button -->
                                <button v-if="index > 0" @click="moveVideoUp(index)"
                                    class="p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
                                    :title="t('playlists.moveUp')">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </button>

                                <!-- Move Down Button -->
                                <button v-if="index < playlist.videos.length - 1" @click="moveVideoDown(index)"
                                    class="p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
                                    :title="t('playlists.moveDown')">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </button>

                                <!-- Remove Button -->
                                <button @click="removeVideo(video.id, index)"
                                    class="p-2 bg-red-700 hover:bg-red-600 rounded transition"
                                    :title="t('playlists.removeVideo')">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path fill-rule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-8 text-gray-400">
                        <p>{{ t('playlists.noVideos') }}</p>
                    </div>
                </div>
            </div>

            <!-- Not Found State -->
            <div v-else class="text-center py-12">
                <h1 class="text-2xl font-bold text-gray-400">{{ t('playlists.notFound') }}</h1>
                <NuxtLink :to="localePath('/playlists')" class="text-blue-400 hover:text-blue-300 mt-4 inline-block">
                    {{ t('playlists.backToPlaylists') }}
                </NuxtLink>
            </div>
        </div>
    </div>

    <!-- Edit Playlist Modal (outside container for proper z-index) -->
    <PlaylistManager v-if="showEditPlaylist && playlistForEdit" :isOpen="showEditPlaylist"
        :editingPlaylist="playlistForEdit" :channels="channels" @save="handleSavePlaylist"
        @close="showEditPlaylist = false" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
const localePath = useLocalePath()
import { useI18n } from 'vue-i18n'
import PlaylistManager from '~/app/components/PlaylistManager.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// State
const playlist = ref<{
    id?: string
    title?: string
    description?: string
    visibility?: 'public' | 'private' | 'unlisted'
    user_id?: string
    channel_id?: string
    created_at?: string
    videos_count?: number
    videos: any[]
} | null>(null)
const isLoading = ref(true)
const showEditPlaylist = ref(false)
const creatorName = ref('')
const creatorAvatarUrl = ref('')

// Get user ID from header or localStorage
const userId = ref<string | null>(null)

// Computed properties
const isOwner = computed(() => {
  if (!playlist.value || !userId.value) return false
  
  // If playlist has a channel_id, check if user owns that channel
  if (playlist.value.channel_id) {
    return channels.value.some((ch: any) => ch.id === playlist.value?.channel_id)
  }
  
  // Otherwise check if user_id matches
  return playlist.value.user_id === userId.value
})
const creatorInitial = computed(() => creatorName.value.charAt(0).toUpperCase() || 'U')
const playlistCoverImage = computed(() => playlist.value?.videos?.[0]?.thumbnail_url || creatorAvatarUrl.value || '')
const playlistForEdit = computed(() => {
    if (!playlist.value) return null

    return {
        id: playlist.value.id,
        title: playlist.value.title || '',
        description: playlist.value.description || '',
        visibility: playlist.value.visibility || 'private',
        channelId: playlist.value.channel_id || ''
    }
})

const channels = ref<any[]>([])
const channelsMap = ref<Record<string, any>>({})
const loadChannelsForVideos = async () => {
  if (!playlist.value?.videos) return

    const uniqueChannelIds = [...new Set(
        playlist.value.videos.map((v: any) => v.channel_id).filter(Boolean)
    )] as string[]

  // First, populate from user's own channels if available
    for (const channel of channels.value as any[]) {
    if (channel.id && uniqueChannelIds.includes(channel.id)) {
      channelsMap.value[channel.id] = channel
    }
  }

  // For remaining channels, try to fetch from API
  for (const id of uniqueChannelIds) {
    if (!channelsMap.value[id]) {
      try {
        const response = await fetch(`/api/v1/channels/${id}/info`)
        if (response.ok) {
          const data = await response.json()
          channelsMap.value[id] = data.channel || { id, name: data.name || 'Channel' }
        } else {
          channelsMap.value[id] = { id, name: 'Channel' }
        }
      } catch (error) {
        channelsMap.value[id] = { id, name: 'Channel' }
      }
    }
  }
}
const loadChannels = async () => {
  if (!userId.value) return

  const res = await fetch(`/api/v1/users/${userId.value}/channels`)
  if (res.ok) {
    const data = await res.json()
    channels.value = data.channels || []
  }
}
// Format date utility
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
}

// Format duration utility (seconds to HH:MM:SS)
const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`
}


// Load creator channel info (for channel-owned playlists)
const loadCreatorChannel = async (channelId: string) => {
    try {
        const response = await fetch(`/api/v1/channels/${channelId}/info`)
        if (response.ok) {
            const data = await response.json()
            creatorName.value = data.channel?.name || data.name || 'Channel'
            creatorAvatarUrl.value = data.channel?.avatar_url || data.avatar_url || ''
        } else {
            creatorName.value = 'Channel'
        }
    } catch (error) {
        console.error('Error loading creator channel:', error)
        creatorName.value = 'Channel'
    }
}

// Load creator profile info
const loadCreatorProfile = async (userId: string) => {
    try {
        const response = await fetch(`/api/v1/user/${userId}`)
        if (response.ok) {
            const data = await response.json()
            creatorName.value = data.user?.username || data.username || 'Unknown'

            // Get avatar from channels
            const channelsResponse = await fetch(`/api/v1/users/${userId}/channels`)
            if (channelsResponse.ok) {
                const channelsData = await channelsResponse.json()
                if (channelsData.channels && channelsData.channels.length > 0) {
                    creatorAvatarUrl.value = channelsData.channels[0].avatar_url || ''
                }
            }
        }
    } catch (error) {
        console.error('Error loading creator profile:', error)
    }
}

// Load playlist data
const loadPlaylist = async () => {
    try {
        isLoading.value = true
        const playlistId = route.params.id

        // Get user ID
        if (typeof window !== 'undefined') {
            userId.value = localStorage.getItem('user_id')
        }

        const response = await fetch(`/api/v1/playlists/${playlistId}`, {
            headers: userId.value ? { 'X-User-ID': userId.value } : {}
        })

        if (!response.ok) {
            if (response.status === 404) {
                playlist.value = null
            }
            return
        }

        const data = await response.json()

        playlist.value = {
            ...(data.playlist || data),
            videos: data.videos || data.playlist?.videos || []
        }
        await loadChannelsForVideos()
        await loadChannels()
        
        // Load creator info - check if channel-owned or user-owned
        if (playlist.value && playlist.value.channel_id) {
            await loadCreatorChannel(playlist.value.channel_id)
        } else if (playlist.value && playlist.value.user_id && playlist.value.user_id !== userId.value) {
            await loadCreatorProfile(playlist.value.user_id)
        } else if (userId.value) {
            creatorName.value = 'You'
            await loadCreatorAvatar(userId.value)
        }
    } catch (error) {
        console.error('Error loading playlist:', error)
    } finally {
        isLoading.value = false
    }
}

const loadPlaylistForMeta = async () => {
    const playlistId = route.params.id
    const response = await fetch(`/api/v1/playlists/${playlistId}`)

    if (!response.ok) {
        return null
    }

    const data = await response.json()
    return {
        ...(data.playlist || data),
        videos: data.videos || data.playlist?.videos || []
    }
}

const { data: serverPlaylist } = await useAsyncData(`playlist-meta-${route.params.id}`, loadPlaylistForMeta)

if (serverPlaylist.value) {
    playlist.value = serverPlaylist.value
    useMetaTags({
        title: `${serverPlaylist.value.title || 'Playlist'} - GilTube`,
        description: serverPlaylist.value.description || `Watch ${serverPlaylist.value.title || 'this playlist'} on GilTube.`,
        image: serverPlaylist.value.videos?.[0]?.thumbnail_url || undefined,
        url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/playlists/${route.params.id}`,
        type: 'video.playlist',
        twitterCard: serverPlaylist.value.videos?.[0]?.thumbnail_url ? 'summary_large_image' : 'summary'
    })
    isLoading.value = false
}

// Load creator channel info (for channel-owned playlists)\nconst loadCreatorChannel = async (channelId: string) => {\n    try {\n        const response = await fetch(`/api/v1/channels/${channelId}/info`)\n        if (response.ok) {\n            const data = await response.json()\n            creatorName.value = data.channel?.name || data.name || 'Channel'\n            creatorAvatarUrl.value = data.channel?.avatar_url || data.avatar_url || ''\n        } else {\n            creatorName.value = 'Channel'\n        }\n    } catch (error) {\n        console.error('Error loading creator channel:', error)\n        creatorName.value = 'Channel'\n    }\n}

// Load creator avatar
const loadCreatorAvatar = async (userId: string) => {
    try {
        const channelsResponse = await fetch(`/api/v1/users/${userId}/channels`)
        if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json()
            if (channelsData.channels && channelsData.channels.length > 0) {
                creatorAvatarUrl.value = channelsData.channels[0].avatar_url || ''
            }
        }
    } catch (error) {
        console.error('Error loading creator avatar:', error)
    }
}

// Move video up in playlist
const moveVideoUp = async (index: number) => {
    if (index <= 0 || !playlist.value || !playlist.value.videos) return

    try {
        // Swap in local state first
        const temp = playlist.value.videos[index - 1]
        playlist.value.videos[index - 1] = playlist.value.videos[index]
        playlist.value.videos[index] = temp
        
        // Send all videos with new positions
        const videos = playlist.value.videos.map((v: any, i: number) => ({
            video_id: v.id,
            position: i
        }))
        
        const response = await fetch(`/api/v1/playlists/${route.params.id}/videos/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': userId.value || ''
            },
            body: JSON.stringify({ videos })
        })

        if (!response.ok) {
            console.error('Failed to reorder videos')
            // Revert on error
            const tempRevert = playlist.value.videos[index - 1]
            playlist.value.videos[index - 1] = playlist.value.videos[index]
            playlist.value.videos[index] = tempRevert
        }
    } catch (error) {
        console.error('Error moving video:', error)
    }
}

// Move video down in playlist
const moveVideoDown = async (index: number) => {
    if (!playlist.value || !playlist.value.videos || index >= playlist.value.videos.length - 1) return

    try {
        // Swap in local state first
        const temp = playlist.value.videos[index + 1]
        playlist.value.videos[index + 1] = playlist.value.videos[index]
        playlist.value.videos[index] = temp
        
        // Send all videos with new positions
        const videos = playlist.value.videos.map((v: any, i: number) => ({
            video_id: v.id,
            position: i
        }))
        
        const response = await fetch(`/api/v1/playlists/${route.params.id}/videos/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': userId.value || ''
            },
            body: JSON.stringify({ videos })
        })

        if (!response.ok) {
            console.error('Failed to reorder videos')
            // Revert on error
            const tempRevert = playlist.value.videos[index + 1]
            playlist.value.videos[index + 1] = playlist.value.videos[index]
            playlist.value.videos[index] = tempRevert
        }
    } catch (error) {
        console.error('Error moving video:', error)
    }
}

// Remove video from playlist
const removeVideo = async (videoId: string, index: number) => {
    if (!confirm(t('playlists.confirmRemoveVideo'))) return

    try {
        const response = await fetch(`/api/v1/playlists/${route.params.id}/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'X-User-ID': userId.value || ''
            }
        })

        if (response.ok) {
            // Remove from local state
            const currentPlaylist = playlist.value
            if (!currentPlaylist) return
            currentPlaylist.videos.splice(index, 1)
            currentPlaylist.videos_count = Math.max(0, (currentPlaylist.videos_count || 0) - 1)
        }
    } catch (error) {
        console.error('Error removing video:', error)
    }
}

// Delete entire playlist
const deletePlaylist = async () => {
    if (!confirm(t('playlists.confirmDeletePlaylist'))) return

    try {
        const response = await fetch(`/api/v1/playlists/${route.params.id}`, {
            method: 'DELETE',
            headers: {
                'X-User-ID': userId.value || ''
            }
        })

        if (response.ok) {
            router.push(localePath('/playlists'))
        }
    } catch (error) {
        console.error('Error deleting playlist:', error)
    }
}

// Handle playlist saved/updated
const handleSavePlaylist = async (updatedPlaylist: any) => {
    try {
        const playlistId = route.params.id
        const response = await fetch(`/api/v1/playlists/${playlistId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': userId.value || ''
            },
            body: JSON.stringify({
                title: updatedPlaylist.title,
                description: updatedPlaylist.description,
                visibility: updatedPlaylist.visibility,
                channel_id: updatedPlaylist.channelId || undefined
            })
        })

        if (!response.ok) {
            console.error('Failed to update playlist')
            return
        }

        showEditPlaylist.value = false
        await loadPlaylist()
    } catch (error) {
        console.error('Error saving playlist:', error)
    }
}

// Initialize
onMounted(async () => {
    if (typeof window !== 'undefined') {
        userId.value = localStorage.getItem('user_id')
    }
    await loadChannels()
    if (!playlist.value) {
        await loadPlaylist()
    } else {
        isLoading.value = false
    }
})
</script>
