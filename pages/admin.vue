<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">🔧 Admin Panel</h1>
      <p class="text-gray-400">Platform management and statistics</p>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Total Users</p>
        <p class="text-3xl font-bold text-blue-400">{{ stats.total_users }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Total Channels</p>
        <p class="text-3xl font-bold text-green-400">{{ stats.total_channels }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Total Videos</p>
        <p class="text-3xl font-bold text-purple-400">{{ stats.total_videos }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Platform Views</p>
        <p class="text-3xl font-bold text-yellow-400">{{ formatNumber(stats.total_views) }}</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-4 border-b border-zinc-700">
      <button
        @click="activeTab = 'users'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        👥 Users
      </button>
      <button
        @click="activeTab = 'channels'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'channels' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        📺 Channels
      </button>
      <button
        @click="activeTab = 'videos'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'videos' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        🎬 Videos
      </button>
      <button
        @click="activeTab = 'series'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'series' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        Series
      </button>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="space-y-4">
      <h2 class="text-2xl font-bold text-white mb-4">User Management</h2>
      
      <!-- Search/Filter -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search users by name or email..."
        class="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />

      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Username</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Email</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Type</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Channels</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Videos</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Total Views</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-700">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-zinc-800 transition">
              <td class="px-4 py-3 text-white">{{ user.username }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 rounded text-xs font-semibold', user.user_type === 'admin' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200']">
                  {{ user.user_type }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 rounded text-xs font-semibold', user.status === 'active' ? 'bg-green-900 text-green-200' : user.status === 'suspended' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200']">
                  {{ user.status || 'active' }}
                </span>
              </td>
              <td class="px-4 py-3 text-white">{{ user.channel_count }}</td>
              <td class="px-4 py-3 text-white">{{ user.video_count }}</td>
              <td class="px-4 py-3 text-white">{{ formatNumber(user.total_views) }}</td>
              <td class="px-4 py-3 space-x-1 flex flex-wrap">
                <button
                  @click="toggleUserAdmin(user.id, user.user_type)"
                  :class="['px-2 py-1 rounded text-xs transition', user.user_type === 'admin' ? 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200' : 'bg-purple-900 hover:bg-purple-800 text-purple-200']"
                >
                  {{ user.user_type === 'admin' ? '⬇️ Demote' : '⬆️ Promote' }}
                </button>
                <button
                  v-if="user.status !== 'suspended'"
                  @click="suspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded text-xs transition"
                >
                  ⏸️ Suspend
                </button>
                <button
                  v-if="user.status === 'suspended'"
                  @click="unsuspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unsuspend
                </button>
                <button
                  v-if="user.status !== 'banned'"
                  @click="banUser(user.id, user.username)"
                  class="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs transition"
                >
                  🚫 Ban
                </button>
                <button
                  v-if="user.status === 'banned'"
                  @click="unbanUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unban
                </button>
                <button
                  @click="deleteUser(user.id, user.username)"
                  class="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded text-xs transition"
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Channels Tab -->
    <div v-if="activeTab === 'channels'" class="space-y-4">
      <h2 class="text-2xl font-bold text-white mb-4">Channel Management</h2>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Channel Name</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Owner</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Videos</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Total Views</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Created</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-700">
            <tr v-for="channel in channels" :key="channel.id" class="hover:bg-zinc-800 transition">
              <td class="px-4 py-3 text-white font-semibold">{{ channel.name }}</td>
              <td class="px-4 py-3 text-gray-400">{{ channel.username }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 rounded text-xs font-semibold', channel.status === 'active' ? 'bg-green-900 text-green-200' : channel.status === 'suspended' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200']">
                  {{ channel.status || 'active' }}
                </span>
              </td>
              <td class="px-4 py-3 text-white">{{ channel.video_count }}</td>
              <td class="px-4 py-3 text-white">{{ formatNumber(channel.total_views) }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ new Date(channel.created_at).toLocaleDateString() }}</td>
              <td class="px-4 py-3 space-x-1 flex flex-wrap">
                <button
                  v-if="channel.status !== 'suspended'"
                  @click="suspendChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded text-xs transition"
                >
                  ⏸️ Suspend
                </button>
                <button
                  v-if="channel.status === 'suspended'"
                  @click="unsuspendChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unsuspend
                </button>
                <button
                  v-if="channel.status !== 'banned'"
                  @click="banChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs transition"
                >
                  🚫 Ban
                </button>
                <button
                  v-if="channel.status === 'banned'"
                  @click="unbanChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unban
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Videos Tab -->
    <div v-if="activeTab === 'videos'" class="space-y-4">
      <h2 class="text-2xl font-bold text-white mb-4">Video Statistics</h2>
      <p class="text-gray-400">Total Videos: <span class="text-white font-bold">{{ stats.total_videos }}</span></p>
      <p class="text-gray-400">Total Comments: <span class="text-white font-bold">{{ stats.total_comments }}</span></p>
    </div>

    <!-- Series Tab -->
    <div v-if="activeTab === 'series'" class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-white">Series Creator</h2>
        <p class="mt-1 text-sm text-gray-400">Create metadata, upload a public trailer, and ingest hidden episode videos.</p>
      </div>

      <div class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
        <label class="mb-2 block text-sm font-medium text-gray-300">Resume existing series</label>
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
          <select v-model="selectedSeriesId" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" @change="selectExistingSeries">
            <option value="">Create a new series</option>
            <option v-for="item in adminSeries" :key="item.id" :value="item.id">
              {{ item.title }} · {{ item.episode_count || 0 }} episodes
            </option>
          </select>
          <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="startNewSeries">
            New series
          </button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5" @submit.prevent="handleCreateSeries">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Title</label>
              <input v-model="seriesForm.title" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Slug</label>
              <input v-model="seriesForm.slug" placeholder="Auto-generated if blank" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Primary Genre</label>
              <input v-model="seriesForm.genre" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Seasons</label>
              <input v-model.number="seriesForm.seasons" min="1" type="number" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">Synopsis</label>
            <textarea v-model="seriesForm.synopsis" rows="4" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Genres</label>
              <input v-model="seriesForm.genres" placeholder="Drama, Mystery" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Directors</label>
              <input v-model="seriesForm.directors" placeholder="Comma-separated" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Cast</label>
              <input v-model="seriesForm.cast" placeholder="Comma-separated" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Poster Image</label>
              <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onSeriesImageSelected($event, 'poster')" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">Backdrop Image</label>
              <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onSeriesImageSelected($event, 'backdrop')" />
            </div>
          </div>

          <label class="flex items-center gap-3 rounded border border-zinc-700 bg-zinc-800 p-3 text-sm text-gray-300">
            <input v-model="seriesForm.isFeatured" type="checkbox" class="h-4 w-4 accent-red-600" />
            Feature this series in the Series category hero
          </label>

          <button type="submit" :disabled="seriesCreating || !!createdSeriesId" class="rounded bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {{ createdSeriesId ? 'Series selected' : seriesCreating ? 'Creating...' : 'Create series' }}
          </button>
        </form>

        <aside class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
          <h3 class="font-semibold text-white">Series Channel</h3>
          <p class="mt-2 break-all text-sm text-gray-400">{{ seriesChannelId }}</p>
          <p class="mt-4 text-sm text-gray-400">Trailers are public videos. Episodes are uploaded as hidden videos, then attached to the series playback queue.</p>
          <div v-if="seriesProgressMessage" class="mt-4 rounded border border-blue-500/30 bg-blue-950/40 p-3 text-sm text-blue-100">{{ seriesProgressMessage }}</div>
          <div v-if="seriesError" class="mt-4 rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">{{ seriesError }}</div>
        </aside>
      </div>

      <div v-if="createdSeriesId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
        <div>
          <h3 class="text-lg font-semibold text-white">Trailer</h3>
          <p class="mt-1 text-sm text-gray-400">This video stays visible in normal GilTube surfaces and links viewers into the series.</p>
        </div>
        <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]">
          <input v-model="trailerForm.title" placeholder="Trailer title" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onTrailerFileSelected" />
          <button type="button" :disabled="!trailerFile || trailerUploading" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadTrailer">
            {{ trailerUploading ? `${trailerProgress}%` : 'Upload trailer' }}
          </button>
        </div>
      </div>

      <div v-if="createdSeriesId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-white">Episodes</h3>
            <p class="mt-1 text-sm text-gray-400">Episode videos are hidden from the main feeds after upload.</p>
          </div>
          <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="addEpisodeRow">Add episode</button>
        </div>

        <div class="space-y-4">
          <div v-for="(episode, index) in episodeRows" :key="episode.localId" class="rounded border border-zinc-800 bg-zinc-950 p-4">
            <div class="grid gap-3 md:grid-cols-[5rem_5rem_minmax(0,1fr)]">
              <input v-model.number="episode.seasonNumber" min="1" type="number" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              <input v-model.number="episode.episodeNumber" min="1" type="number" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              <input v-model="episode.title" placeholder="Episode title" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
            </div>
            <textarea v-model="episode.synopsis" rows="2" placeholder="Episode synopsis" class="mt-3 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
            <div class="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_8rem_18rem]">
              <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onEpisodeFileSelected($event, index)" />
              <input v-model.number="episode.introStartSeconds" min="0" type="number" placeholder="Intro start" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              <input v-model.number="episode.introEndSeconds" min="0" type="number" placeholder="Intro end" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              <div class="grid grid-cols-2 gap-2">
                <button type="button" :disabled="!episode.file || episode.uploading || episode.attached" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadEpisode(index)">
                  {{ episode.attached ? 'Attached' : episode.uploading ? `${episode.progress}%` : 'Upload' }}
                </button>
                <button type="button" :disabled="!episode.file || episode.uploading || episode.attached" class="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadEpisode(index, true)">
                  Local upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center text-gray-400 py-8">
      Loading admin data...
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalePath } from '#i18n'
import { uploadVideo } from '~/app/service/upload'
import { addSeriesEpisode, createSeries, getSeries, listSeries, setSeriesTrailer, GILTUBE_SERIES_CHANNEL_ID } from '~/app/service/series'

const router = useRouter()
const localePath = useLocalePath()
const activeTab = ref('users')
const searchQuery = ref('')
const loading = ref(true)
const error = ref('')

const stats = ref({
  total_users: 0,
  total_channels: 0,
  total_videos: 0,
  total_views: 0,
  total_comments: 0,
  admin_count: 0,
  total_categories: 0
})

const users = ref<any[]>([])
const channels = ref<any[]>([])
const adminSeries = ref<any[]>([])
const selectedSeriesId = ref('')
const seriesChannelId = GILTUBE_SERIES_CHANNEL_ID
const localUploadBaseURL = 'http://localhost:8080/api/v1'

const seriesForm = ref({
  title: '',
  slug: '',
  synopsis: '',
  genre: 'Drama',
  genres: '',
  seasons: 1,
  directors: '',
  cast: '',
  isFeatured: false,
  poster: null as File | null,
  backdrop: null as File | null,
})
const createdSeriesId = ref('')
const seriesCreating = ref(false)
const seriesError = ref('')
const seriesProgressMessage = ref('')

const trailerForm = ref({
  title: '',
})
const trailerFile = ref<File | null>(null)
const trailerUploading = ref(false)
const trailerProgress = ref(0)

type EpisodeRow = {
  localId: string
  seasonNumber: number
  episodeNumber: number
  title: string
  synopsis: string
  introStartSeconds: number
  introEndSeconds: number
  file: File | null
  uploading: boolean
  progress: number
  attached: boolean
}

const episodeRows = ref<EpisodeRow[]>([])

// Get user_id from localStorage
const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') : null

// Check if user is admin by fetching from backend
// Backend will return 401/403 if not authenticated or not admin
onMounted(async () => {
  if (!userId) {
    error.value = 'Not authenticated'
    setTimeout(() => router.push(localePath('/login')), 2000)
    return
  }

  // Verify admin status by trying to fetch admin stats
  // Backend will enforce authentication and admin check
  try {
    const statsRes = await fetch(`/api/v1/admin/stats?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    
    // If 401/403, user is not admin
    if (statsRes.status === 401 || statsRes.status === 403) {
      error.value = 'Access denied. Admin privileges required.'
      setTimeout(() => router.push(localePath('/')), 2000)
      return
    }
    
    if (!statsRes.ok) {
      throw new Error(`HTTP ${statsRes.status}`)
    }
  } catch (err) {
    console.error('Failed to verify admin status:', err)
    error.value = 'Failed to verify admin status'
    setTimeout(() => router.push(localePath('/')), 2000)
    return
  }

  await loadAdminData()
})

const loadAdminData = async () => {
  if (!userId) return
  
  try {
    loading.value = true
    
    // Fetch stats
    const statsRes = await fetch(`/api/v1/admin/stats?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    if (statsRes.ok) {
      stats.value = await statsRes.json()
    }

    // Fetch users
    const usersRes = await fetch(`/api/v1/admin/users?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    if (usersRes.ok) {
      users.value = await usersRes.json() || []
    }

    // Fetch channels
    const channelsRes = await fetch(`/api/v1/admin/channels?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    if (channelsRes.ok) {
      channels.value = await channelsRes.json() || []
    }

    const seriesData = await listSeries()
    adminSeries.value = seriesData.series || []
  } catch (err) {
    console.error('Failed to load admin data:', err)
    error.value = 'Failed to load admin data'
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    u.username.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query)
  )
})

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const listToText = (value: unknown) => Array.isArray(value) ? value.join(', ') : ''

const resetSeriesWorkspace = () => {
  createdSeriesId.value = ''
  selectedSeriesId.value = ''
  seriesForm.value = {
    title: '',
    slug: '',
    synopsis: '',
    genre: 'Drama',
    genres: '',
    seasons: 1,
    directors: '',
    cast: '',
    isFeatured: false,
    poster: null,
    backdrop: null,
  }
  trailerForm.value = { title: '' }
  trailerFile.value = null
  trailerProgress.value = 0
  episodeRows.value = []
  seriesProgressMessage.value = ''
  seriesError.value = ''
}

const startNewSeries = () => {
  resetSeriesWorkspace()
}

const hydrateSeriesWorkspace = async (seriesId: string) => {
  if (!seriesId) {
    resetSeriesWorkspace()
    return
  }

  seriesError.value = ''
  seriesProgressMessage.value = ''
  try {
    const detail = await getSeries(seriesId)
    const item = detail.series
    createdSeriesId.value = item.id
    selectedSeriesId.value = item.id
    seriesForm.value = {
      title: item.title || '',
      slug: item.slug || '',
      synopsis: item.synopsis || '',
      genre: item.genre || 'Drama',
      genres: listToText(item.genres),
      seasons: item.seasons || 1,
      directors: listToText(item.directors),
      cast: listToText(item.cast),
      isFeatured: Boolean(item.is_featured),
      poster: null,
      backdrop: null,
    }
    trailerForm.value.title = `${seriesForm.value.title} Trailer`
    trailerFile.value = null
    trailerProgress.value = 0
    episodeRows.value = (detail.episodes || []).map((episode: any) => ({
      localId: episode.id || `${episode.video_id}-${episode.season_number}-${episode.episode_number}`,
      seasonNumber: episode.season_number || 1,
      episodeNumber: episode.episode_number || 1,
      title: episode.title || '',
      synopsis: episode.synopsis || '',
      introStartSeconds: episode.intro_start_seconds || 0,
      introEndSeconds: episode.intro_end_seconds || 0,
      file: null,
      uploading: false,
      progress: 100,
      attached: true,
    }))
    if (episodeRows.value.length === 0) {
      addEpisodeRow()
    }
    seriesProgressMessage.value = `Loaded "${seriesForm.value.title}". You can upload more episodes below.`
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to load series'
  }
}

const selectExistingSeries = async () => {
  await hydrateSeriesWorkspace(selectedSeriesId.value)
}

const toggleUserAdmin = async (userIdToAffect: string, currentType: string) => {
  if (!confirm(`Are you sure you want to ${currentType === 'admin' ? 'demote' : 'promote'} this user?`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToAffect}/toggle-admin?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json'
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User status updated')
    } else {
      error.value = 'Failed to update user status'
    }
  } catch (err) {
    console.error('Error toggling admin:', err)
    error.value = 'Failed to toggle admin status'
  }
}

const unbanChannel = async (channelId: string, channelName: string) => {
  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/unban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert(`Channel "${channelName}" unbanned`)
    } else {
      error.value = 'Failed to unban channel'
    }
  } catch (err) {
    console.error('Error unbanning channel:', err)
    error.value = 'Failed to unban channel'
  }
}

const unbanUser = async (userIdToBan: string, username: string) => {
  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToBan}/unban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert(`User "${username}" unbanned`)
    } else {
      error.value = 'Failed to unban user'
    }
  } catch (err) {
    console.error('Error unbanning user:', err)
    error.value = 'Failed to unban user'
  }
}

const deleteUser = async (userId: string, username: string) => {
  if (!confirm(`Are you sure you want to DELETE user "${username}" and all their data? This cannot be undone.`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User deleted successfully')
    } else {
      error.value = 'Failed to delete user'
    }
  } catch (err) {
    console.error('Error deleting user:', err)
    error.value = 'Failed to delete user'
  }
}

const suspendUser = async (userIdToSuspend: string, username: string) => {
  if (!confirm(`Suspend user "${username}"? They can still login and use the site but cannot upload videos.`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToSuspend}/suspend?user_id=${userIdToSuspend}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User suspended')
    } else {
      error.value = 'Failed to suspend user'
    }
  } catch (err) {
    console.error('Error suspending user:', err)
    error.value = 'Failed to suspend user'
  }
}

const banUser = async (userIdToBan: string, username: string) => {
  if (!confirm(`BAN user "${username}"? They will be unable to login and all their videos will be hidden. This is a serious action.`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToBan}/ban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User banned')
    } else {
      error.value = 'Failed to ban user'
    }
  } catch (err) {
    console.error('Error banning user:', err)
    error.value = 'Failed to ban user'
  }
}

const unsuspendUser = async (userIdToUnsuspend: string, username: string) => {
  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToUnsuspend}/unsuspend?user_id=${userIdToUnsuspend}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User status restored to active')
    } else {
      error.value = 'Failed to unsuspend user'
    }
  } catch (err) {
    console.error('Error unsuspending user:', err)
    error.value = 'Failed to unsuspend user'
  }
}

const suspendChannel = async (channelId: string, channelName: string) => {
  if (!confirm(`Suspend channel "${channelName}"? They can still access it but cannot upload videos.`)) return

  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/suspend?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('Channel suspended')
    } else {
      error.value = 'Failed to suspend channel'
    }
  } catch (err) {
    console.error('Error suspending channel:', err)
    error.value = 'Failed to suspend channel'
  }
}

const banChannel = async (channelId: string, channelName: string) => {
  if (!confirm(`BAN channel "${channelName}"? All its videos will be hidden and users cannot switch to this channel.`)) return

  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/ban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('Channel banned')
    } else {
      error.value = 'Failed to ban channel'
    }
  } catch (err) {
    console.error('Error banning channel:', err)
    error.value = 'Failed to ban channel'
  }
}

const unsuspendChannel = async (channelId: string, channelName: string) => {
  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/unsuspend?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('Channel status restored to active')
    } else {
      error.value = 'Failed to unsuspend channel'
    }
  } catch (err) {
    console.error('Error unsuspending channel:', err)
    error.value = 'Failed to unsuspend channel'
  }
}

const onSeriesImageSelected = (event: Event, kind: 'poster' | 'backdrop') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  if (kind === 'poster') {
    seriesForm.value.poster = file
  } else {
    seriesForm.value.backdrop = file
  }
}

const handleCreateSeries = async () => {
  seriesError.value = ''
  seriesProgressMessage.value = ''
  if (!seriesForm.value.title.trim()) {
    seriesError.value = 'Series title is required'
    return
  }

  seriesCreating.value = true
  try {
    const created = await createSeries({
      title: seriesForm.value.title,
      slug: seriesForm.value.slug,
      synopsis: seriesForm.value.synopsis,
      genre: seriesForm.value.genre,
      genres: seriesForm.value.genres,
      seasons: seriesForm.value.seasons,
      directors: seriesForm.value.directors,
      cast: seriesForm.value.cast,
      channelId: seriesChannelId,
      isFeatured: seriesForm.value.isFeatured,
      poster: seriesForm.value.poster,
      backdrop: seriesForm.value.backdrop,
    })
    createdSeriesId.value = created.id
    selectedSeriesId.value = created.id
    trailerForm.value.title = `${seriesForm.value.title} Trailer`
    if (episodeRows.value.length === 0) {
      addEpisodeRow()
    }
    await loadAdminData()
    seriesProgressMessage.value = 'Series created. Upload a trailer and episodes next.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to create series'
  } finally {
    seriesCreating.value = false
  }
}

const onTrailerFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  trailerFile.value = input.files?.[0] || null
}

const uploadTrailer = async () => {
  if (!createdSeriesId.value || !trailerFile.value) return

  trailerUploading.value = true
  trailerProgress.value = 0
  seriesError.value = ''
  try {
    const uploaded = await uploadVideo({
      title: trailerForm.value.title || `${seriesForm.value.title} Trailer`,
      description: `Trailer for ${seriesForm.value.title}`,
      channelId: seriesChannelId,
      videoFile: trailerFile.value,
      explicit: false,
      hidden: false,
      onProgress: (progress) => {
        trailerProgress.value = progress
      },
    })
    await setSeriesTrailer(createdSeriesId.value, uploaded.video_id)
    await loadAdminData()
    seriesProgressMessage.value = 'Trailer uploaded and linked.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to upload trailer'
  } finally {
    trailerUploading.value = false
  }
}

const addEpisodeRow = () => {
  const nextNumber = episodeRows.value.length + 1
  episodeRows.value.push({
    localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    seasonNumber: 1,
    episodeNumber: nextNumber,
    title: '',
    synopsis: '',
    introStartSeconds: 0,
    introEndSeconds: 0,
    file: null,
    uploading: false,
    progress: 0,
    attached: false,
  })
}

const onEpisodeFileSelected = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  const row = episodeRows.value[index]
  if (!row) return
  row.file = input.files?.[0] || null
  if (row.file && !row.title) {
    row.title = row.file.name.replace(/\.[^.]+$/, '')
  }
}

const uploadEpisode = async (index: number, useLocalUpload = false) => {
  const row = episodeRows.value[index]
  if (!createdSeriesId.value || !row?.file) return

  row.uploading = true
  row.progress = 0
  seriesError.value = ''
  try {
    const uploaded = await uploadVideo({
      title: row.title || `${seriesForm.value.title} S${row.seasonNumber} E${row.episodeNumber}`,
      description: row.synopsis,
      channelId: seriesChannelId,
      videoFile: row.file,
      explicit: false,
      hidden: true,
      uploadBaseURL: useLocalUpload ? localUploadBaseURL : undefined,
      onProgress: (progress) => {
        row.progress = progress
      },
    })

    await addSeriesEpisode(createdSeriesId.value, {
      videoId: uploaded.video_id,
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
      title: row.title,
      synopsis: row.synopsis,
      introStartSeconds: row.introStartSeconds,
      introEndSeconds: row.introEndSeconds,
    })
    row.attached = true
    await loadAdminData()
    seriesProgressMessage.value = `Attached S${row.seasonNumber} E${row.episodeNumber}${useLocalUpload ? ' via local upload' : ''}.`
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to upload episode'
  } finally {
    row.uploading = false
  }
}
</script>

<style scoped>
</style>
