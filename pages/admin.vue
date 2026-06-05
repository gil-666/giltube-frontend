<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">Admin Panel</h1>
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
      <button
        @click="activeTab = 'movies'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'movies' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        Movies
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
                  {{ user.user_type === 'admin' ? 'Demote' : 'Promote' }}
                </button>
                <button
                  v-if="user.status !== 'suspended'"
                  @click="suspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded text-xs transition"
                >
                  Suspend
                </button>
                <button
                  v-if="user.status === 'suspended'"
                  @click="unsuspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  Unsuspend
                </button>
                <button
                  v-if="user.status !== 'banned'"
                  @click="banUser(user.id, user.username)"
                  class="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs transition"
                >
                  Ban
                </button>
                <button
                  v-if="user.status === 'banned'"
                  @click="unbanUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  Unban
                </button>
                <button
                  @click="deleteUser(user.id, user.username)"
                  class="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded text-xs transition"
                >
                  Delete
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

    <MovieAdminPanel v-if="activeTab === 'movies'" />

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
        <form class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5" @submit.prevent="handleSeriesSubmit">
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

          <button type="submit" :disabled="seriesCreating || seriesSaving" class="rounded bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {{ createdSeriesId ? (seriesSaving ? 'Saving...' : 'Save series details') : (seriesCreating ? 'Creating...' : 'Create series') }}
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
            <div v-if="episode.episodeId || episode.videoId" class="mt-3 grid gap-2 rounded border border-zinc-800 bg-black/30 px-3 py-2 text-xs md:grid-cols-2">
              <div v-if="episode.episodeId" class="min-w-0">
                <span class="font-semibold uppercase tracking-wide text-gray-500">Episode ID</span>
                <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ episode.episodeId }}</code>
              </div>
              <div v-if="episode.videoId" class="min-w-0">
                <span class="font-semibold uppercase tracking-wide text-gray-500">Video ID</span>
                <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ episode.videoId }}</code>
              </div>
            </div>
            <textarea v-model="episode.synopsis" rows="2" placeholder="Episode synopsis" class="mt-3 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
            <div class="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_8.5rem_26rem]">
              <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onEpisodeFileSelected($event, index)" />
              <input v-model.number="episode.introStartSeconds" min="0" type="number" placeholder="Intro start" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              <input v-model.number="episode.introEndSeconds" min="0" type="number" placeholder="Intro end" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              <button type="button" :disabled="!episode.file" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="openIntroPicker(index)">
                Pick intro
              </button>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" :disabled="(!episode.file && !episode.videoId) || episode.uploading || episode.attached" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadEpisode(index)">
                  {{ episode.attached ? 'Attached' : episode.uploading ? `${episode.progress}%` : episode.videoId ? 'Attach' : 'Upload' }}
                </button>
                <button type="button" :disabled="!episode.file || !!episode.videoId || episode.uploading || episode.attached" class="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadEpisode(index, true)">
                  Local upload
                </button>
                <button type="button" :disabled="!episode.attached || episode.saving" class="rounded bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveEpisode(index)">
                  {{ episode.saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>

            <div v-if="episode.attached" class="mt-4 rounded border border-zinc-800 bg-black/30 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-semibold text-white">Subtitles</h4>
                  <p class="mt-1 text-xs text-gray-500">Upload .srt, .ass, or .vtt. Non-VTT files are converted automatically.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="needsSubtitleDefaultFix(episode)"
                    type="button"
                    :disabled="episode.subtitleUploading"
                    class="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="fixSubtitleDefaults(index)"
                  >
                    Fix defaults
                  </button>
                  <button type="button" class="rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700" @click="loadEpisodeSubtitles(episode)">
                    Refresh tracks
                  </button>
                </div>
              </div>

              <div v-if="episode.subtitles.length" class="mt-3 space-y-2">
                <div v-for="track in episode.subtitles" :key="track.id" class="flex flex-wrap items-center justify-between gap-3 rounded bg-zinc-900 px-3 py-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-white">{{ track.label || track.language || track.id }}</p>
                    <p class="text-xs text-gray-500">{{ track.language || 'und' }} · {{ track.default ? 'Default' : 'Optional' }}</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <input v-model.number="track.delay_ms" type="number" step="100" placeholder="Delay ms" class="w-28 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
                    <button v-if="!track.default || hasDuplicateSubtitleDefaults(episode)" type="button" :disabled="episode.subtitleUploading" class="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" @click="makeSubtitleDefault(index, track)">
                      {{ track.default ? 'Keep as only default' : 'Make default' }}
                    </button>
                    <button type="button" :disabled="episode.subtitleUploading" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleDelay(index, track)">
                      Save delay
                    </button>
                    <a
                      :href="subtitleDownloadUrl(episode, track)"
                      :download="subtitleDownloadName(episode, track)"
                      class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600"
                    >
                      Download
                    </a>
                    <button type="button" :disabled="episode.subtitleUploading" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="startReplaceSubtitle(index, track)">
                      Replace
                    </button>
                    <button type="button" :disabled="episode.subtitleUploading" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" @click="deleteSubtitle(index, track)">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-gray-500">No subtitle tracks found in the master playlist.</p>

              <div class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_10rem_8rem_8rem]">
                <input type="file" accept=".srt,.ass,.vtt,text/vtt" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onSubtitleFileSelected($event, index)" />
                <input v-model="episode.subtitleLanguage" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
                <input v-model="episode.subtitleLabel" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
                <label class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-gray-300">
                  <input v-model="episode.subtitleDefault" type="checkbox" class="h-4 w-4 accent-red-600" />
                  Default
                </label>
                <input v-model.number="episode.subtitleDelayMS" type="number" step="100" placeholder="Delay ms" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" :disabled="(!episode.subtitleFile && !episode.subtitleReplacingTrackId) || episode.subtitleUploading" class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadSubtitle(index, episode.subtitleReplacingTrackId)">
                  {{ episode.subtitleUploading ? 'Saving...' : episode.subtitleReplacingTrackId ? 'Save subtitle' : 'Add subtitle' }}
                </button>
                <button v-if="episode.subtitleReplacingTrackId" type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="cancelReplaceSubtitle(index)">
                  Cancel replace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="introPickerOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-16">
      <div class="w-full max-w-4xl rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-zinc-800 p-4">
          <div>
            <h3 class="text-lg font-semibold text-white">Pick Intro Times</h3>
            <p class="mt-1 text-sm text-gray-400">{{ activeIntroEpisode?.title || activeIntroEpisode?.file?.name || 'Episode preview' }}</p>
          </div>
          <button type="button" class="rounded bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700" @click="closeIntroPicker">
            Close
          </button>
        </div>

        <div class="space-y-4 p-4">
          <video
            ref="introPickerVideo"
            :src="introPickerVideoUrl"
            controls
            playsinline
            class="aspect-video w-full rounded bg-black"
            @loadedmetadata="onIntroPickerLoaded"
            @timeupdate="onIntroPickerTimeUpdate"
          />

          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">Current time</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ formatDuration(introPickerCurrentTime) }}</p>
            </div>
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">Intro start</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ formatDuration(activeIntroEpisode?.introStartSeconds || 0) }}</p>
            </div>
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">Intro end</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ formatDuration(activeIntroEpisode?.introEndSeconds || 0) }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" @click="setIntroPickerPoint('start')">
              Set start here
            </button>
            <button type="button" class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" @click="setIntroPickerPoint('end')">
              Set end here
            </button>
            <button type="button" :disabled="!canPreviewIntroRange" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="previewIntroRange">
              Preview range
            </button>
            <button type="button" class="ml-auto rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700" @click="closeIntroPicker">
              Done
            </button>
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
import { ref, computed, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalePath } from '#i18n'
import MovieAdminPanel from '~/app/components/admin/MovieAdminPanel.vue'
import { uploadVideo } from '~/app/service/upload'
import {
  addSeriesEpisode,
  createSeries,
  deleteSeriesEpisodeSubtitle,
  getSeries,
  listSeries,
  listSeriesEpisodeSubtitles,
  setSeriesTrailer,
  updateSeries,
  updateSeriesEpisode,
  uploadSeriesEpisodeSubtitle,
  GILTUBE_SERIES_CHANNEL_ID
} from '~/app/service/series'

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
  posterUrl: '',
  backdropUrl: '',
})
const createdSeriesId = ref('')
const seriesCreating = ref(false)
const seriesSaving = ref(false)
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
  episodeId: string
  videoId: string
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
  saving: boolean
  subtitles: SubtitleTrack[]
  subtitleFile: File | null
  subtitleLabel: string
  subtitleLanguage: string
  subtitleDefault: boolean
  subtitleDelayMS: number
  subtitleUploading: boolean
  subtitleReplacingTrackId: string
}

type SubtitleTrack = {
  id: string
  label: string
  language: string
  uri: string
  default: boolean
  delay_ms: number
}

const episodeRows = ref<EpisodeRow[]>([])
const introPickerOpen = ref(false)
const introPickerEpisodeIndex = ref(-1)
const introPickerVideoUrl = ref('')
const introPickerVideo = ref<HTMLVideoElement | null>(null)
const introPickerCurrentTime = ref(0)
const introPickerDuration = ref(0)
const introPickerPreviewing = ref(false)

const activeIntroEpisode = computed(() => {
  if (introPickerEpisodeIndex.value < 0) return null
  return episodeRows.value[introPickerEpisodeIndex.value] || null
})

const canPreviewIntroRange = computed(() => {
  const row = activeIntroEpisode.value
  return Boolean(row && row.introEndSeconds > row.introStartSeconds)
})

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

const createEpisodeRow = (episode: any = {}, nextNumber = 1): EpisodeRow => ({
  localId: episode.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  episodeId: episode.id || '',
  videoId: episode.video_id || '',
  seasonNumber: episode.season_number || 1,
  episodeNumber: episode.episode_number || nextNumber,
  title: episode.title || '',
  synopsis: episode.synopsis || '',
  introStartSeconds: episode.intro_start_seconds || 0,
  introEndSeconds: episode.intro_end_seconds || 0,
  file: null,
  uploading: false,
  progress: episode.id ? 100 : 0,
  attached: Boolean(episode.id),
  saving: false,
  subtitles: [],
  subtitleFile: null,
  subtitleLabel: '',
  subtitleLanguage: 'en',
  subtitleDefault: false,
  subtitleDelayMS: 0,
  subtitleUploading: false,
  subtitleReplacingTrackId: '',
})

const loadEpisodeSubtitles = async (row: EpisodeRow) => {
  if (!row.episodeId) return
  try {
    const data = await listSeriesEpisodeSubtitles(row.episodeId)
    row.subtitles = data.subtitles || []
  } catch (err) {
    console.error('Failed to load episode subtitles:', err)
    row.subtitles = []
  }
}

const loadAllEpisodeSubtitles = async () => {
  await Promise.all(episodeRows.value.filter(row => row.episodeId).map(loadEpisodeSubtitles))
}

const subtitleDownloadUrl = (row: EpisodeRow, track: SubtitleTrack) => {
  if (!row.videoId || !track.uri) return '#'
  const subtitlePath = track.uri.replace(/playlist\.m3u8(?:\?.*)?$/i, 'captions.vtt')
  return `${import.meta.env.VITE_API_BASE_URL || ''}/videos/${row.videoId}/${subtitlePath.startsWith('/') ? subtitlePath.slice(1) : subtitlePath}`
}

const subtitleDownloadName = (row: EpisodeRow, track: SubtitleTrack) => {
  const label = (track.label || track.language || track.id || 'subtitle')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `s${row.seasonNumber}e${row.episodeNumber}-${label || 'subtitle'}.vtt`
}

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
    posterUrl: '',
    backdropUrl: '',
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
      posterUrl: item.poster_url || '',
      backdropUrl: item.backdrop_url || '',
    }
    trailerForm.value.title = `${seriesForm.value.title} Trailer`
    trailerFile.value = null
    trailerProgress.value = 0
    episodeRows.value = (detail.episodes || []).map((episode: any, index: number) => createEpisodeRow(episode, index + 1))
    await loadAllEpisodeSubtitles()
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

const handleSeriesSubmit = async () => {
  if (createdSeriesId.value) {
    await saveSeriesDetails()
  } else {
    await handleCreateSeries()
  }
}

const saveSeriesDetails = async () => {
  if (!createdSeriesId.value) return
  seriesError.value = ''
  seriesProgressMessage.value = ''
  if (!seriesForm.value.title.trim()) {
    seriesError.value = 'Series title is required'
    return
  }

  seriesSaving.value = true
  try {
    const updated = await updateSeries(createdSeriesId.value, {
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
      posterUrl: seriesForm.value.posterUrl,
      backdropUrl: seriesForm.value.backdropUrl,
    })
    if (updated.poster_url) seriesForm.value.posterUrl = updated.poster_url
    if (updated.backdrop_url) seriesForm.value.backdropUrl = updated.backdrop_url
    seriesForm.value.poster = null
    seriesForm.value.backdrop = null
    await loadAdminData()
    await hydrateSeriesWorkspace(createdSeriesId.value)
    seriesProgressMessage.value = 'Series details saved.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to save series details'
  } finally {
    seriesSaving.value = false
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
  episodeRows.value.push(createEpisodeRow({}, nextNumber))
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

const revokeIntroPickerUrl = () => {
  if (!introPickerVideoUrl.value) return
  URL.revokeObjectURL(introPickerVideoUrl.value)
  introPickerVideoUrl.value = ''
}

const openIntroPicker = async (index: number) => {
  const row = episodeRows.value[index]
  if (!row?.file) return

  revokeIntroPickerUrl()
  introPickerEpisodeIndex.value = index
  introPickerCurrentTime.value = row.introStartSeconds || 0
  introPickerDuration.value = 0
  introPickerVideoUrl.value = URL.createObjectURL(row.file)
  introPickerOpen.value = true

  await nextTick()
  if (introPickerVideo.value && row.introStartSeconds > 0) {
    introPickerVideo.value.currentTime = row.introStartSeconds
  }
}

const closeIntroPicker = () => {
  introPickerOpen.value = false
  introPickerPreviewing.value = false
  if (introPickerVideo.value) {
    introPickerVideo.value.pause()
    introPickerVideo.value.removeAttribute('src')
    introPickerVideo.value.load()
  }
  introPickerEpisodeIndex.value = -1
  introPickerCurrentTime.value = 0
  introPickerDuration.value = 0
  revokeIntroPickerUrl()
}

const onIntroPickerLoaded = () => {
  if (!introPickerVideo.value) return
  introPickerDuration.value = Number.isFinite(introPickerVideo.value.duration) ? introPickerVideo.value.duration : 0
  const row = activeIntroEpisode.value
  if (row && row.introStartSeconds > 0) {
    introPickerVideo.value.currentTime = Math.min(row.introStartSeconds, introPickerDuration.value || row.introStartSeconds)
  }
}

const onIntroPickerTimeUpdate = () => {
  const currentTime = introPickerVideo.value?.currentTime || 0
  introPickerCurrentTime.value = currentTime

  const row = activeIntroEpisode.value
  if (introPickerPreviewing.value && row && currentTime >= row.introEndSeconds) {
    introPickerVideo.value?.pause()
    introPickerPreviewing.value = false
  }
}

const roundedVideoTime = () => Math.max(0, Number((introPickerVideo.value?.currentTime || 0).toFixed(2)))

const setIntroPickerPoint = (point: 'start' | 'end') => {
  const row = activeIntroEpisode.value
  if (!row) return

  const value = roundedVideoTime()
  if (point === 'start') {
    row.introStartSeconds = value
    if (row.introEndSeconds < value) {
      row.introEndSeconds = value
    }
    return
  }

  row.introEndSeconds = value
  if (row.introStartSeconds > value) {
    row.introStartSeconds = value
  }
}

const previewIntroRange = async () => {
  const row = activeIntroEpisode.value
  const video = introPickerVideo.value
  if (!row || !video || row.introEndSeconds <= row.introStartSeconds) return

  video.currentTime = row.introStartSeconds
  introPickerPreviewing.value = true
  await video.play().catch(() => {
    introPickerPreviewing.value = false
  })
}

const formatDuration = (seconds: number) => {
  const total = Math.max(0, seconds || 0)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`
}

const onSubtitleFileSelected = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  const row = episodeRows.value[index]
  if (!row) return
  row.subtitleFile = input.files?.[0] || null
  if (row.subtitleFile && !row.subtitleLabel) {
    row.subtitleLabel = row.subtitleFile.name.replace(/\.[^.]+$/, '')
  }
}

const uploadEpisode = async (index: number, useLocalUpload = false) => {
  const row = episodeRows.value[index]
  if (!createdSeriesId.value || (!row?.file && !row?.videoId)) return

  row.uploading = true
  if (!row.videoId) {
    row.progress = 0
  }
  seriesError.value = ''
  try {
    let uploadedVideoId = row.videoId
    if (!uploadedVideoId && row.file) {
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
      uploadedVideoId = uploaded.video_id || uploaded.id || uploaded.video?.id || ''
      row.videoId = uploadedVideoId
    }

    if (!uploadedVideoId) {
      throw new Error('Upload finalized but no video id was returned')
    }

    await addSeriesEpisode(createdSeriesId.value, {
      videoId: uploadedVideoId,
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
      title: row.title,
      synopsis: row.synopsis,
      introStartSeconds: row.introStartSeconds,
      introEndSeconds: row.introEndSeconds,
    })
    row.attached = true
    row.videoId = uploadedVideoId
    await hydrateSeriesWorkspace(createdSeriesId.value)
    await loadAdminData()
    seriesProgressMessage.value = `Attached S${row.seasonNumber} E${row.episodeNumber}${useLocalUpload ? ' via local upload' : ''}.`
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to upload episode'
  } finally {
    row.uploading = false
  }
}

const saveEpisode = async (index: number) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return

  row.saving = true
  seriesError.value = ''
  try {
    await updateSeriesEpisode(row.episodeId, {
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
      title: row.title,
      synopsis: row.synopsis,
      introStartSeconds: row.introStartSeconds,
      introEndSeconds: row.introEndSeconds,
    })
    if (createdSeriesId.value) {
      await hydrateSeriesWorkspace(createdSeriesId.value)
    }
    seriesProgressMessage.value = `Saved S${row.seasonNumber} E${row.episodeNumber}.`
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to save episode'
  } finally {
    row.saving = false
  }
}

const uploadSubtitle = async (index: number, trackId = '') => {
  const row = episodeRows.value[index]
  if (!row?.episodeId || (!row.subtitleFile && !trackId)) return

  row.subtitleUploading = true
  seriesError.value = ''
  try {
    const data = await uploadSeriesEpisodeSubtitle(row.episodeId, {
      file: row.subtitleFile,
      label: row.subtitleLabel,
      language: row.subtitleLanguage,
      isDefault: row.subtitleDefault,
      delayMs: row.subtitleDelayMS || 0,
      trackId,
    })
    row.subtitles = data.subtitles || []
    row.subtitleFile = null
    row.subtitleLabel = ''
    row.subtitleLanguage = 'en'
    row.subtitleDefault = false
    row.subtitleDelayMS = 0
    row.subtitleReplacingTrackId = ''
    seriesProgressMessage.value = 'Subtitle track updated.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to update subtitle track'
  } finally {
    row.subtitleUploading = false
  }
}

const startReplaceSubtitle = (index: number, track: SubtitleTrack) => {
  const row = episodeRows.value[index]
  if (!row) return
  row.subtitleReplacingTrackId = track.id
  row.subtitleLabel = track.label || ''
  row.subtitleLanguage = track.language || 'en'
  row.subtitleDefault = Boolean(track.default)
  row.subtitleDelayMS = track.delay_ms || 0
  row.subtitleFile = null
}

const cancelReplaceSubtitle = (index: number) => {
  const row = episodeRows.value[index]
  if (!row) return
  row.subtitleReplacingTrackId = ''
  row.subtitleLabel = ''
  row.subtitleLanguage = 'en'
  row.subtitleDefault = false
  row.subtitleDelayMS = 0
  row.subtitleFile = null
}

const saveSubtitleDelay = async (index: number, track: SubtitleTrack) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return

  row.subtitleUploading = true
  seriesError.value = ''
  try {
    const data = await uploadSeriesEpisodeSubtitle(row.episodeId, {
      label: track.label,
      language: track.language,
      isDefault: track.default,
      delayMs: track.delay_ms || 0,
      trackId: track.id,
    })
    row.subtitles = data.subtitles || []
    seriesProgressMessage.value = 'Subtitle delay updated.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to update subtitle delay'
  } finally {
    row.subtitleUploading = false
  }
}

const subtitleDefaultCount = (row: EpisodeRow) => row.subtitles.filter(track => track.default).length

const hasDuplicateSubtitleDefaults = (row: EpisodeRow) => subtitleDefaultCount(row) > 1

const needsSubtitleDefaultFix = (row: EpisodeRow) => row.subtitles.length > 0 && subtitleDefaultCount(row) !== 1

const subtitleDefaultFixTarget = (row: EpisodeRow) => {
  const defaults = row.subtitles.filter(track => track.default)
  return defaults[defaults.length - 1] || row.subtitles[0] || null
}

const makeSubtitleDefault = async (index: number, track: SubtitleTrack) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return

  row.subtitleUploading = true
  seriesError.value = ''
  try {
    const data = await uploadSeriesEpisodeSubtitle(row.episodeId, {
      label: track.label,
      language: track.language,
      isDefault: true,
      delayMs: track.delay_ms || 0,
      trackId: track.id,
    })
    row.subtitles = data.subtitles || []
    seriesProgressMessage.value = 'Default subtitle track updated.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to update default subtitle track'
  } finally {
    row.subtitleUploading = false
  }
}

const fixSubtitleDefaults = async (index: number) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return

  const target = subtitleDefaultFixTarget(row)
  if (!target) return

  await makeSubtitleDefault(index, target)
}

const deleteSubtitle = async (index: number, track: SubtitleTrack) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return
  if (!confirm(`Delete subtitle track "${track.label}"?`)) return

  seriesError.value = ''
  try {
    const data = await deleteSeriesEpisodeSubtitle(row.episodeId, track.id)
    row.subtitles = data.subtitles || []
    seriesProgressMessage.value = 'Subtitle track deleted.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to delete subtitle track'
  }
}

onBeforeUnmount(() => {
  revokeIntroPickerUrl()
})
</script>

<style scoped>
</style>
