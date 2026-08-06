<template>
  <div class="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:p-6">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="mb-2 text-3xl font-bold text-white sm:text-4xl">{{ t('admin.title') }}</h1>
          <AdminHelpButton :title="t('admin.help.title')" :body="t('admin.help.body')" :close-label="t('common.close')" />
        </div>
        <NuxtLink
          :to="localePath('/admin/music')"
          class="rounded-md border border-red-800 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-900/40"
        >
          Music catalog
        </NuxtLink>
      </div>
      <p class="text-gray-400">{{ t('admin.subtitle') }}</p>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">{{ t('admin.stats.totalUsers') }}</p>
        <p class="text-3xl font-bold text-blue-400">{{ stats.total_users }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">{{ t('admin.stats.totalChannels') }}</p>
        <p class="text-3xl font-bold text-green-400">{{ stats.total_channels }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">{{ t('admin.stats.totalVideos') }}</p>
        <p class="text-3xl font-bold text-purple-400">{{ stats.total_videos }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">{{ t('admin.stats.platformViews') }}</p>
        <p class="text-3xl font-bold text-yellow-400">{{ formatNumber(stats.total_views) }}</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <label class="block sm:hidden">
      <span class="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">{{ t('admin.title') }}</span>
      <select v-model="activeTab" class="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-500">
        <option v-for="tab in adminTabOptions" :key="tab.value" :value="tab.value">{{ tab.label }}</option>
      </select>
    </label>

    <nav
      class="admin-tabs -mx-3 hidden snap-x snap-mandatory gap-1 overflow-x-auto border-b border-zinc-700 px-3 sm:mx-0 sm:flex sm:gap-4 sm:px-0"
      :aria-label="t('admin.title')"
    >
      <button
        @click="activeTab = 'users'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.users') }}
      </button>
      <button
        @click="activeTab = 'channels'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'channels' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.channels') }}
      </button>
      <button
        @click="activeTab = 'videos'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'videos' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.videos') }}
      </button>
      <button
        @click="activeTab = 'series'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'series' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.series') }}
      </button>
      <button
        @click="activeTab = 'movies'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'movies' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.movies') }}
      </button>
      <button
        @click="activeTab = 'youtube-mirrors'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'youtube-mirrors' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.youtubeMirrors') }}
      </button>
      <button
        @click="activeTab = 'media-ingests'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'media-ingests' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.mediaIngests') }}
      </button>
      <button
        @click="activeTab = 'transcode-jobs'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'transcode-jobs' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.transcodeJobs') }}
      </button>
      <button
        @click="activeTab = 'intro-suggestions'"
        :class="['flex-none snap-start whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition sm:px-4', activeTab === 'intro-suggestions' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        {{ t('admin.tabs.introSuggestions') }}
      </button>
    </nav>

    <div v-if="activeTab === 'intro-suggestions'" class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">{{ t('admin.introSuggestions.title') }}</h2>
          <p class="mt-1 text-sm text-gray-400">{{ t('admin.introSuggestions.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <select v-model="introSuggestionStatusFilter" class="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white">
            <option value="pending">{{ t('admin.introSuggestions.statuses.pending') }}</option>
            <option value="approved">{{ t('admin.introSuggestions.statuses.approved') }}</option>
            <option value="rejected">{{ t('admin.introSuggestions.statuses.rejected') }}</option>
            <option value="all">{{ t('admin.introSuggestions.statuses.all') }}</option>
          </select>
          <button type="button" class="rounded bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700" @click="loadIntroSuggestions">
            {{ t('common.refresh') }}
          </button>
        </div>
      </div>

      <p v-if="introSuggestionsError" class="rounded border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{{ introSuggestionsError }}</p>
      <p v-if="introSuggestionsMessage" class="rounded border border-green-500/40 bg-green-950/30 p-3 text-sm text-green-200">{{ introSuggestionsMessage }}</p>

      <div v-if="introSuggestionsLoading" class="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-400">
        {{ t('common.loading') }}
      </div>
      <div v-else-if="introSuggestions.length === 0" class="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-400">
        {{ t('admin.introSuggestions.empty') }}
      </div>
      <div v-else class="grid gap-3">
        <article v-for="suggestion in introSuggestions" :key="suggestion.id" class="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wide text-red-300">{{ suggestion.status }}</p>
              <h3 class="mt-1 text-lg font-semibold text-white">
                {{ suggestion.series_title }} · {{ t('admin.introSuggestions.episodeLabel', { season: suggestion.season_number, episode: suggestion.episode_number }) }}
              </h3>
              <p class="mt-1 text-sm text-zinc-400">{{ suggestion.episode_title }}</p>
              <p class="mt-2 text-xs text-zinc-500">
                {{ t('admin.introSuggestions.suggestedBy', { username: suggestion.username || 'User' }) }}
              </p>
            </div>
            <div class="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[24rem]">
              <div class="rounded border border-zinc-800 bg-black/30 p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-500">{{ t('admin.introSuggestions.currentTiming') }}</p>
                <p class="mt-1 font-mono text-white">{{ formatDuration(suggestion.current_intro_start_seconds || 0) }} - {{ formatDuration(suggestion.current_intro_end_seconds || 0) }}</p>
              </div>
              <div class="rounded border border-zinc-800 bg-black/30 p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-500">{{ t('admin.introSuggestions.suggestedTiming') }}</p>
                <p class="mt-1 font-mono text-white">{{ formatDuration(suggestion.intro_start_seconds || 0) }} - {{ formatDuration(suggestion.intro_end_seconds || 0) }}</p>
              </div>
            </div>
          </div>
          <p v-if="suggestion.note" class="mt-3 rounded-lg border border-zinc-800 bg-black/20 p-3 text-sm text-zinc-300">{{ suggestion.note }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <NuxtLink :to="localePath(`/video/${suggestion.video_id}?series_id=${suggestion.series_id}`)" class="rounded bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700">
              {{ t('admin.introSuggestions.openEpisode') }}
            </NuxtLink>
            <button
              type="button"
              class="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
              @click="openIntroSuggestionPreview(suggestion)"
            >
              {{ t('admin.introSuggestions.preview') }}
            </button>
            <button
              type="button"
              :disabled="introSuggestionReviewingId === suggestion.id || suggestion.status !== 'pending'"
              class="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              @click="reviewIntroSuggestion(suggestion.id, 'approve')"
            >
              {{ t('admin.introSuggestions.apply') }}
            </button>
            <button
              type="button"
              :disabled="introSuggestionReviewingId === suggestion.id || suggestion.status !== 'pending'"
              class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="reviewIntroSuggestion(suggestion.id, 'reject')"
            >
              {{ t('admin.introSuggestions.reject') }}
            </button>
          </div>
        </article>
      </div>
    </div>

    <div
      v-if="introSuggestionPreviewOpen"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-12"
      @click.self="closeIntroSuggestionPreview"
    >
      <div class="w-full max-w-4xl rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-zinc-800 p-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-blue-300">{{ t('admin.introSuggestions.preview') }}</p>
            <h3 class="mt-1 text-lg font-semibold text-white">
              {{ introSuggestionPreviewItem?.series_title }} · {{ t('admin.introSuggestions.episodeLabel', { season: introSuggestionPreviewItem?.season_number || 0, episode: introSuggestionPreviewItem?.episode_number || 0 }) }}
            </h3>
            <p class="mt-1 text-sm text-zinc-400">{{ introSuggestionPreviewItem?.episode_title }}</p>
          </div>
          <button type="button" class="rounded bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700" @click="closeIntroSuggestionPreview">
            {{ t('common.close') }}
          </button>
        </div>
        <div class="space-y-4 p-4">
          <VideoPlayer
            ref="introSuggestionPreviewPlayer"
            :key="introSuggestionPreviewKey"
            :src="introSuggestionPreviewSource"
            status="ready"
            :autoplay="false"
            :start-time-seconds="introSuggestionPreviewStart"
            :exact-start-time="true"
            :progress-emit-interval-ms="100"
            :disable-fullscreen-toggle="true"
            :disable-picture-in-picture-toggle="true"
            class="intro-suggestion-preview-player"
            @progress="onIntroSuggestionPreviewProgress"
            @seeked="onIntroSuggestionPreviewSeeked"
          />
          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">{{ t('seriesAdmin.introPicker.currentTime') }}</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ formatDuration(introSuggestionPreviewCurrentTime) }}</p>
            </div>
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">{{ t('admin.introSuggestions.suggestedTiming') }}</p>
              <p class="mt-1 font-mono text-xl font-semibold text-white">{{ formatDuration(introSuggestionPreviewStart) }} - {{ formatDuration(introSuggestionPreviewEnd) }}</p>
            </div>
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">{{ t('admin.introSuggestions.currentTiming') }}</p>
              <p class="mt-1 font-mono text-xl font-semibold text-white">{{ formatDuration(introSuggestionPreviewItem?.current_intro_start_seconds || 0) }} - {{ formatDuration(introSuggestionPreviewItem?.current_intro_end_seconds || 0) }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" @click="playIntroSuggestionPreview">
              {{ t('admin.introSuggestions.playSuggestedRange') }}
            </button>
            <button
              type="button"
              :disabled="!introSuggestionPreviewItem || introSuggestionReviewingId === introSuggestionPreviewItem.id || introSuggestionPreviewItem.status !== 'pending'"
              class="ml-auto rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              @click="reviewIntroSuggestion(introSuggestionPreviewItem.id, 'approve')"
            >
              {{ t('admin.introSuggestions.apply') }}
            </button>
            <button
              type="button"
              :disabled="!introSuggestionPreviewItem || introSuggestionReviewingId === introSuggestionPreviewItem.id || introSuggestionPreviewItem.status !== 'pending'"
              class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="reviewIntroSuggestion(introSuggestionPreviewItem.id, 'reject')"
            >
              {{ t('admin.introSuggestions.reject') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="space-y-4">
      <div class="mb-4 flex items-center gap-3">
        <h2 class="text-2xl font-bold text-white">{{ t('admin.users.title') }}</h2>
        <AdminHelpButton :title="t('admin.users.helpTitle')" :body="t('admin.users.helpBody')" :close-label="t('common.close')" />
      </div>
      
      <!-- Search/Filter -->
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('admin.users.searchPlaceholder')"
        class="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />

      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="min-w-[58rem] w-full text-sm">
          <thead class="bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.username') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.email') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.type') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.status') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.channels') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.videos') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.totalViews') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.users.columns.actions') }}</th>
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
                  {{ user.user_type === 'admin' ? t('admin.actions.demote') : t('admin.actions.promote') }}
                </button>
                <button
                  v-if="user.status !== 'suspended' && !isProtectedAdminUser(user)"
                  @click="suspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.suspend') }}
                </button>
                <button
                  v-if="user.status === 'suspended'"
                  @click="unsuspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.unsuspend') }}
                </button>
                <button
                  v-if="user.status !== 'banned' && !isProtectedAdminUser(user)"
                  @click="banUser(user.id, user.username)"
                  class="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.ban') }}
                </button>
                <button
                  v-if="user.status === 'banned'"
                  @click="unbanUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.unban') }}
                </button>
                <button
                  v-if="!isProtectedAdminUser(user)"
                  @click="deleteUser(user.id, user.username)"
                  class="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded text-xs transition"
                >
                  {{ t('common.delete') }}
                </button>
                <span v-if="isProtectedAdminUser(user)" class="rounded bg-zinc-800 px-2 py-1 text-xs text-gray-400">
                  {{ t('admin.users.adminProtected') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Channels Tab -->
    <div v-if="activeTab === 'channels'" class="space-y-4">
      <div class="mb-4 flex items-center gap-3">
        <h2 class="text-2xl font-bold text-white">{{ t('admin.channels.title') }}</h2>
        <AdminHelpButton :title="t('admin.channels.helpTitle')" :body="t('admin.channels.helpBody')" :close-label="t('common.close')" />
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-[52rem] w-full text-sm">
          <thead class="bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.channels.columns.name') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.channels.columns.owner') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.channels.columns.status') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.channels.columns.videos') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.channels.columns.totalViews') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.channels.columns.created') }}</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">{{ t('admin.channels.columns.actions') }}</th>
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
                  v-if="channel.status !== 'suspended' && !isProtectedAdminChannel(channel)"
                  @click="suspendChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.suspend') }}
                </button>
                <button
                  v-if="channel.status === 'suspended'"
                  @click="unsuspendChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.unsuspend') }}
                </button>
                <button
                  v-if="channel.status !== 'banned' && !isProtectedAdminChannel(channel)"
                  @click="banChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.ban') }}
                </button>
                <button
                  v-if="channel.status === 'banned'"
                  @click="unbanChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  {{ t('admin.actions.unban') }}
                </button>
                <span v-if="isProtectedAdminChannel(channel)" class="rounded bg-zinc-800 px-2 py-1 text-xs text-gray-400">
                  {{ t('admin.channels.adminProtected') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Videos Tab -->
    <div v-if="activeTab === 'videos'" class="space-y-6">
      <div>
        <h2 class="mb-2 text-2xl font-bold text-white">{{ t('admin.videos.title') }}</h2>
        <p class="text-gray-400">{{ t('admin.videos.body') }}</p>
      </div>

      <div class="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div class="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
          <div class="border-b border-zinc-800 px-4 py-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-300">{{ t('admin.videos.channelListTitle') }}</h3>
          </div>
          <div class="max-h-[70vh] overflow-auto">
            <table class="min-w-[30rem] w-full text-sm">
              <thead class="sticky top-0 bg-zinc-950 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold">{{ t('admin.channels.columns.name') }}</th>
                  <th class="px-4 py-3 text-left font-semibold">{{ t('admin.channels.columns.videos') }}</th>
                  <th class="px-4 py-3 text-left font-semibold">{{ t('admin.channels.columns.totalViews') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                <tr
                  v-for="channel in channels"
                  :key="channel.id"
                  class="cursor-pointer transition hover:bg-zinc-800/70"
                  :class="selectedAdminChannelId === channel.id ? 'bg-zinc-800' : ''"
                  @click="selectAdminChannel(channel)"
                >
                  <td class="px-4 py-3">
                    <p class="font-semibold text-white">{{ channel.name }}</p>
                    <p class="text-xs text-gray-500">@{{ channel.username }}</p>
                  </td>
                  <td class="px-4 py-3 text-white">{{ channel.video_count }}</td>
                  <td class="px-4 py-3 text-gray-300">{{ formatNumber(channel.total_views) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-4">
          <div class="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
            <div class="border-b border-zinc-800 px-4 py-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-300">{{ t('admin.videos.videoListTitle') }}</h3>
                  <p class="mt-1 text-xs text-gray-500">
                    <span v-if="selectedAdminChannelName">{{ selectedAdminChannelName }}</span>
                    <span v-else>{{ t('admin.videos.selectChannelPrompt') }}</span>
                  </p>
                </div>
                <button v-if="selectedAdminChannelId" type="button" class="rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700" @click="loadAdminChannelVideos(selectedAdminChannelId)">
                  {{ t('common.refresh') }}
                </button>
              </div>
            </div>

            <div class="max-h-[24rem] overflow-auto">
              <table class="min-w-[42rem] w-full text-sm">
                <thead class="sticky top-0 bg-zinc-950 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold">{{ t('movieAdmin.fields.title') }}</th>
                    <th class="px-4 py-3 text-left font-semibold">{{ t('admin.users.columns.status') }}</th>
                    <th class="px-4 py-3 text-left font-semibold">{{ t('admin.channels.columns.totalViews') }}</th>
                    <th class="px-4 py-3 text-left font-semibold">{{ t('video.likes') }}</th>
                    <th class="px-4 py-3 text-left font-semibold">{{ t('video.comments') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800">
                  <tr
                    v-for="video in adminChannelVideos"
                    :key="video.id"
                    class="cursor-pointer transition hover:bg-zinc-800/70"
                    :class="selectedAdminVideoId === video.id ? 'bg-zinc-800' : ''"
                    @click="selectedAdminVideoId = video.id"
                  >
                    <td class="px-4 py-3">
                      <p class="font-semibold text-white">{{ video.title }}</p>
                      <p class="line-clamp-1 text-xs text-gray-500">{{ video.description || t('admin.videos.noDescription') }}</p>
                    </td>
                    <td class="px-4 py-3 text-gray-300">{{ video.status }}</td>
                    <td class="px-4 py-3 text-white">{{ formatNumber(video.views) }}</td>
                    <td class="px-4 py-3 text-white">{{ formatNumber(video.likes) }}</td>
                    <td class="px-4 py-3 text-white">{{ formatNumber(video.comments_count) }}</td>
                  </tr>
                  <tr v-if="!adminChannelVideos.length && selectedAdminChannelId">
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">{{ t('admin.videos.emptyChannel') }}</td>
                  </tr>
                  <tr v-if="!selectedAdminChannelId">
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">{{ t('admin.videos.selectChannelTablePrompt') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <VideoEditorPanel
            v-if="selectedAdminVideoId"
            :video-id="selectedAdminVideoId"
            :heading="t('videoEditor.title')"
            :subheading="t('admin.videos.editorBody')"
            stacked-layout
          />
        </div>
      </div>
    </div>

    <MovieAdminPanel v-if="activeTab === 'movies'" />
    <YouTubeMirrorAdminPanel v-if="activeTab === 'youtube-mirrors'" :channels="channels" />
    <MediaIngestAdminPanel v-if="activeTab === 'media-ingests'" :channels="channels" :series-items="adminSeries" />
    <TranscodeJobsAdminPanel v-if="activeTab === 'transcode-jobs'" />

    <!-- Series Tab -->
    <div v-if="activeTab === 'series'" class="space-y-6">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-white">{{ t('seriesAdmin.title') }}</h2>
          <AdminHelpButton :title="t('seriesAdmin.help.title')" :body="t('seriesAdmin.help.body')" :close-label="t('common.close')" />
        </div>
        <p class="mt-1 text-sm text-gray-400">{{ t('seriesAdmin.subtitle') }}</p>
      </div>

      <div class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
        <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('seriesAdmin.resumeExisting') }}</label>
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
          <select v-model="selectedSeriesId" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" @change="selectExistingSeries">
            <option value="">{{ t('seriesAdmin.createNewOption') }}</option>
            <option v-for="item in adminSeries" :key="item.id" :value="item.id">
              {{ item.title }} · {{ t('seriesAdmin.episodeCount', { count: item.episode_count || 0 }) }}
            </option>
          </select>
          <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="startNewSeries">
            {{ t('seriesAdmin.newSeries') }}
          </button>
        </div>
      </div>

      <div v-if="seriesProgressMessage" class="rounded border border-blue-500/30 bg-blue-950/40 p-3 text-sm text-blue-100">{{ seriesProgressMessage }}</div>
      <div v-if="seriesError" class="rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">{{ seriesError }}</div>

      <div>
        <form class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5" @submit.prevent="handleSeriesSubmit">
          <section class="space-y-3 rounded border border-zinc-800 bg-black/30 p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-end">
              <div class="min-w-0 flex-1">
                <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.metadata.seriesTitle') }}</label>
                <input v-model="seriesMetadataQuery" :placeholder="t('movieAdmin.metadata.placeholder')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" @keydown.enter.prevent="searchSeriesMetadata" />
              </div>
              <button type="button" :disabled="seriesMetadataSearching || !seriesMetadataQuery.trim()" class="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="searchSeriesMetadata">
                {{ seriesMetadataSearching ? t('movieAdmin.metadata.searching') : t('movieAdmin.metadata.search') }}
              </button>
            </div>

            <div v-if="seriesMetadataResults.length" class="grid gap-3 md:grid-cols-2">
              <article v-for="result in seriesMetadataResults" :key="`${result.source}-${result.source_id}`" class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded border border-zinc-800 bg-zinc-950 p-3">
                <img v-if="result.poster_url" :src="result.poster_url" :alt="result.title" class="aspect-[2/3] w-full rounded object-cover" />
                <div v-else class="aspect-[2/3] rounded bg-zinc-800" />
                <div class="min-w-0">
                  <h4 class="line-clamp-1 text-sm font-semibold text-white">{{ result.title }}</h4>
                  <p class="mt-1 text-xs text-gray-500">{{ result.release_year || t('movieAdmin.library.unknownDate') }} · {{ result.genres.slice(0, 2).join(', ') }}</p>
                  <p class="mt-2 line-clamp-2 text-xs text-gray-400">{{ result.synopsis }}</p>
                  <button type="button" class="mt-3 rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600" @click="applySeriesMetadata(result)">
                    {{ t('movieAdmin.metadata.apply') }}
                  </button>
                </div>
              </article>
            </div>
          </section>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.title') }}</label>
              <input v-model="seriesForm.title" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.slug') }}</label>
              <input v-model="seriesForm.slug" :placeholder="t('movieAdmin.placeholders.slug')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.primaryGenre') }}</label>
              <input v-model="seriesForm.genre" required class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('seriesAdmin.fields.seasons') }}</label>
              <input v-model.number="seriesForm.seasons" min="1" type="number" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.synopsis') }}</label>
            <textarea v-model="seriesForm.synopsis" rows="4" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.genres') }}</label>
              <input v-model="seriesForm.genres" :placeholder="t('movieAdmin.placeholders.genres')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.directors') }}</label>
              <input v-model="seriesForm.directors" :placeholder="t('movieAdmin.placeholders.commaSeparated')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.cast') }}</label>
              <input v-model="seriesForm.cast" :placeholder="t('movieAdmin.placeholders.commaSeparated')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.posterImage') }}</label>
              <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onSeriesImageSelected($event, 'poster')" />
              <div v-if="seriesForm.posterUrl" class="mt-3 overflow-hidden rounded border border-zinc-800 bg-black/40">
                <img :src="seriesForm.posterUrl" :alt="seriesForm.title || t('movieAdmin.fields.posterImage')" class="aspect-[2/3] max-h-64 w-full object-contain" />
              </div>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('movieAdmin.fields.backdropImage') }}</label>
              <input type="file" accept="image/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onSeriesImageSelected($event, 'backdrop')" />
              <div v-if="seriesForm.backdropUrl" class="mt-3 overflow-hidden rounded border border-zinc-800 bg-black/40">
                <img :src="seriesForm.backdropUrl" :alt="seriesForm.title || t('movieAdmin.fields.backdropImage')" class="aspect-video max-h-64 w-full object-cover" />
              </div>
            </div>
          </div>

          <label class="flex items-center gap-3 rounded border border-zinc-700 bg-zinc-800 p-3 text-sm text-gray-300">
            <input v-model="seriesForm.isFeatured" type="checkbox" class="h-4 w-4 accent-red-600" />
            {{ t('seriesAdmin.featuredToggle') }}
          </label>

          <div class="flex flex-wrap gap-3">
            <button type="submit" :disabled="seriesCreating || seriesSaving || seriesDeleting" class="rounded bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
              {{ createdSeriesId ? (seriesSaving ? t('common.saving') : t('seriesAdmin.actions.saveSeriesDetails')) : (seriesCreating ? t('seriesAdmin.actions.creatingSeries') : t('seriesAdmin.actions.createSeries')) }}
            </button>
            <button v-if="createdSeriesId" type="button" :disabled="seriesCreating || seriesSaving || seriesDeleting" class="rounded bg-red-950 px-5 py-2.5 font-semibold text-red-100 ring-1 ring-red-800 transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50" @click="deleteCurrentSeries">
              {{ seriesDeleting ? t('common.deleting') : t('seriesAdmin.actions.deleteSeries') }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="createdSeriesId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ t('seriesAdmin.trailer.title') }}</h3>
          <p class="mt-1 text-sm text-gray-400">{{ t('seriesAdmin.trailer.body') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_12rem]">
          <input v-model="trailerForm.title" :placeholder="t('movieAdmin.placeholders.trailerTitle')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onTrailerFileSelected" />
          <button type="button" :disabled="!trailerFile || trailerUploading" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadTrailer">
            {{ trailerUploading ? `${trailerProgress}%` : t('movieAdmin.actions.uploadTrailer') }}
          </button>
          <button type="button" :disabled="trailerAttaching" class="rounded bg-amber-600 px-4 py-2 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50" @click="openTrailerPicker">
            {{ trailerAttaching ? t('movieAdmin.actions.linking') : t('seriesAdmin.actions.pickTrailer') }}
          </button>
        </div>
      </div>

      <div v-if="createdSeriesId" class="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white">{{ t('seriesAdmin.episodes.title') }}</h3>
            <p class="mt-1 text-sm text-gray-400">{{ t('seriesAdmin.episodes.body') }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              :disabled="!canSaveEpisodeDetails || savingEpisodeDetails"
              class="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="saveAllEpisodeDetails"
            >
              {{ savingEpisodeDetails ? t('seriesAdmin.actions.savingEpisodes') : t('seriesAdmin.actions.saveEpisodeDetails') }}
            </button>
            <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="addEpisodeRow">{{ t('seriesAdmin.actions.addEpisode') }}</button>
          </div>
        </div>

        <section v-if="orderedAttachedEpisodes.length > 1" class="rounded border border-zinc-800 bg-black/30">
          <div class="flex items-center gap-3 p-3">
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
              :aria-expanded="episodeOrderOpen"
              @click="episodeOrderOpen = !episodeOrderOpen"
            >
              <span class="min-w-0">
              <h4 class="text-sm font-semibold text-white">{{ t('seriesAdmin.reorder.title') }}</h4>
                <span class="mt-1 block text-xs text-gray-500">{{ t('seriesAdmin.reorder.summary', { count: orderedAttachedEpisodes.length }) }}</span>
              </span>
              <span class="text-xl text-gray-400" aria-hidden="true">{{ episodeOrderOpen ? '-' : '+' }}</span>
            </button>
            <button
              v-if="episodeOrderOpen"
              type="button"
              :disabled="episodeOrderSaving"
              class="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="saveEpisodeOrder"
            >
              {{ episodeOrderSaving ? t('seriesAdmin.reorder.saving') : t('seriesAdmin.reorder.save') }}
            </button>
          </div>

          <div v-if="episodeOrderOpen" class="grid gap-2 border-t border-zinc-800 p-3">
            <p class="text-xs text-gray-500">{{ t('seriesAdmin.reorder.body') }}</p>
            <article
              v-for="(episode, orderIndex) in orderedAttachedEpisodes"
              :key="`order-${episode.localId}`"
              class="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded border border-zinc-800 bg-zinc-950 p-2"
            >
              <img :src="thumbnailUrl(episode.thumbnailUrl)" :alt="episode.videoTitle || episode.title" class="aspect-video w-full rounded object-cover" />
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-blue-300">{{ t('seriesAdmin.reorder.position', { season: episode.seasonNumber, episode: episode.episodeNumber }) }}</p>
                <p class="truncate text-sm font-semibold text-white">{{ episode.title }}</p>
                <p class="truncate text-xs text-gray-500">{{ t('seriesAdmin.reorder.sourceVideo', { title: episode.videoTitle || episode.videoId }) }}</p>
                <p class="truncate text-xs text-gray-400" :title="episode.originalFilename || t('seriesAdmin.reorder.filenameUnavailable')">
                  {{ t('seriesAdmin.reorder.originalFilename', { filename: episode.originalFilename || t('seriesAdmin.reorder.filenameUnavailable') }) }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  :disabled="orderIndex === 0 || episodeOrderSaving"
                  :aria-label="t('seriesAdmin.reorder.moveUp')"
                  :title="t('seriesAdmin.reorder.moveUp')"
                  class="flex h-9 w-9 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-lg text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
                  @click="moveEpisodeToAdjacentSlot(episode, -1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  :disabled="orderIndex === orderedAttachedEpisodes.length - 1 || episodeOrderSaving"
                  :aria-label="t('seriesAdmin.reorder.moveDown')"
                  :title="t('seriesAdmin.reorder.moveDown')"
                  class="flex h-9 w-9 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-lg text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
                  @click="moveEpisodeToAdjacentSlot(episode, 1)"
                >
                  ↓
                </button>
              </div>
            </article>
          </div>
        </section>

        <div class="grid gap-3 rounded border border-zinc-800 bg-black/30 p-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:items-end">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ t('movieAdmin.subtitles.globalDelay') }}</label>
            <p class="mt-1 text-xs text-gray-500">{{ t('movieAdmin.subtitles.globalDelaySeriesHelp') }}</p>
          </div>
          <input v-model.number="seriesSubtitleDelayMs" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
          <button type="button" :disabled="!canApplySeriesSubtitleDelay || seriesSubtitleDelaySaving" class="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="applySeriesSubtitleDelay">
            {{ seriesSubtitleDelaySaving ? t('common.saving') : t('movieAdmin.subtitles.applyGlobalDelay') }}
          </button>
        </div>

        <div class="space-y-4">
          <div v-for="(episode, index) in episodeRows" :key="episode.localId" class="rounded border border-zinc-800 bg-zinc-950 p-4">
            <div class="grid gap-3 md:grid-cols-[5rem_5rem_minmax(0,1fr)]">
              <input v-model.number="episode.seasonNumber" min="1" type="number" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              <input v-model.number="episode.episodeNumber" min="1" type="number" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              <input v-model="episode.title" :placeholder="t('seriesAdmin.placeholders.episodeTitle')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
            </div>
            <div v-if="episode.episodeId || episode.videoId" class="mt-3 grid gap-2 rounded border border-zinc-800 bg-black/30 px-3 py-2 text-xs md:grid-cols-2">
              <div v-if="episode.episodeId" class="min-w-0">
                <span class="font-semibold uppercase tracking-wide text-gray-500">{{ t('seriesAdmin.ids.episode') }}</span>
                <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ episode.episodeId }}</code>
              </div>
              <div v-if="episode.videoId" class="min-w-0">
                <span class="font-semibold uppercase tracking-wide text-gray-500">{{ t('seriesAdmin.ids.video') }}</span>
                <code class="mt-1 block select-all break-all font-mono text-gray-200">{{ episode.videoId }}</code>
              </div>
            </div>
            <textarea v-model="episode.synopsis" rows="2" :placeholder="t('seriesAdmin.placeholders.episodeSynopsis')" class="mt-3 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
            <div class="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_8.5rem_26rem]">
              <input type="file" accept="video/*" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onEpisodeFileSelected($event, index)" />
              <input v-model.number="episode.introStartSeconds" min="0" type="number" :placeholder="t('seriesAdmin.placeholders.introStart')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              <input v-model.number="episode.introEndSeconds" min="0" type="number" :placeholder="t('seriesAdmin.placeholders.introEnd')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              <button type="button" :disabled="!canPickIntro(episode)" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="openIntroPicker(index)">
                {{ t('seriesAdmin.actions.pickIntro') }}
              </button>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" :disabled="(!episode.file && !episode.videoId) || episode.uploading || episode.attached" class="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadEpisode(index)">
                  {{ episode.attached ? t('seriesAdmin.actions.attached') : episode.uploading ? `${episode.progress}%` : episode.videoId ? t('seriesAdmin.actions.attach') : t('movieAdmin.actions.upload') }}
                </button>
                <button type="button" :disabled="!episode.file || !!episode.videoId || episode.uploading || episode.attached" class="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadEpisode(index, true)">
                  {{ t('movieAdmin.actions.localUpload') }}
                </button>
                <button type="button" :disabled="!episode.attached || episode.saving" class="rounded bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveEpisode(index)">
                  {{ episode.saving ? t('common.saving') : t('common.save') }}
                </button>
              </div>
            </div>

            <div v-if="episode.attached" class="mt-4 rounded border border-zinc-800 bg-black/30 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-semibold text-white">{{ t('movieAdmin.subtitles.title') }}</h4>
                  <p class="mt-1 text-xs text-gray-500">{{ t('movieAdmin.subtitles.body') }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="needsSubtitleDefaultFix(episode)"
                    type="button"
                    :disabled="episode.subtitleUploading"
                    class="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="fixSubtitleDefaults(index)"
                  >
                    {{ t('movieAdmin.subtitles.fixDefaults') }}
                  </button>
                  <button type="button" class="rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700" @click="loadEpisodeSubtitles(episode)">
                    {{ t('common.refresh') }}
                  </button>
                </div>
              </div>

              <div v-if="episode.subtitles.length" class="mt-3 space-y-2">
                <div v-for="track in episode.subtitles" :key="track.id" class="flex flex-col gap-3 rounded bg-zinc-900 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
                    <input v-model="track.language" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
                    <input v-model="track.label" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
                    <p class="text-xs text-gray-500 sm:col-span-2">{{ track.language || 'und' }} · {{ track.default ? t('movieAdmin.subtitles.default') : t('movieAdmin.subtitles.optional') }}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <input v-model.number="track.delay_ms" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 sm:w-28" />
                    <button v-if="!track.default || hasDuplicateSubtitleDefaults(episode)" type="button" :disabled="episode.subtitleUploading" class="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" @click="makeSubtitleDefault(index, track)">
                      {{ track.default ? t('movieAdmin.subtitles.keepOnlyDefault') : t('movieAdmin.subtitles.makeDefault') }}
                    </button>
                    <button type="button" :disabled="episode.subtitleUploading" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleMetadata(index, track)">
                      Save title
                    </button>
                    <button type="button" :disabled="episode.subtitleUploading" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveSubtitleDelay(index, track)">
                      {{ t('movieAdmin.subtitles.saveDelay') }}
                    </button>
                    <a
                      :href="subtitleDownloadUrl(episode, track)"
                      :download="subtitleDownloadName(episode, track)"
                      class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600"
                    >
                      {{ t('movieAdmin.subtitles.download') }}
                    </a>
                    <button type="button" :disabled="episode.subtitleUploading" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="startReplaceSubtitle(index, track)">
                      {{ t('movieAdmin.subtitles.replace') }}
                    </button>
                    <button type="button" :disabled="episode.subtitleUploading" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" @click="deleteSubtitle(index, track)">
                      {{ t('common.delete') }}
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-gray-500">{{ t('movieAdmin.subtitles.empty') }}</p>

              <div class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_10rem_8rem_8rem]">
                <input type="file" accept=".srt,.ass,.vtt,text/vtt" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onSubtitleFileSelected($event, index)" />
                <input v-model="episode.subtitleLanguage" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
                <input v-model="episode.subtitleLabel" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
                <label class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-gray-300">
                  <input v-model="episode.subtitleDefault" type="checkbox" class="h-4 w-4 accent-red-600" />
                  {{ t('movieAdmin.subtitles.default') }}
                </label>
                <input v-model.number="episode.subtitleDelayMS" type="number" step="100" :placeholder="t('movieAdmin.subtitles.delayMs')" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" :disabled="(!episode.subtitleFile && !episode.subtitleReplacingTrackId) || episode.subtitleUploading" class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="uploadSubtitle(index, episode.subtitleReplacingTrackId)">
                  {{ episode.subtitleUploading ? t('common.saving') : episode.subtitleReplacingTrackId ? t('movieAdmin.subtitles.saveSubtitle') : t('movieAdmin.subtitles.addSubtitle') }}
                </button>
                <button v-if="episode.subtitleReplacingTrackId" type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="cancelReplaceSubtitle(index)">
                  {{ t('common.cancel') }}
                </button>
              </div>
            </div>

            <div v-if="episode.attached" class="mt-4 rounded border border-zinc-800 bg-black/30 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-semibold text-white">Audio tracks</h4>
                  <p class="mt-1 text-xs text-gray-500">Edit audio track titles/languages, choose the default, or add/replace alternate audio tracks.</p>
                </div>
                <button type="button" class="rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700" @click="loadEpisodeAudioTracks(episode)">
                  {{ t('common.refresh') }}
                </button>
              </div>

              <div v-if="episode.audioTracks.length" class="mt-3 space-y-2">
                <div v-for="track in episode.audioTracks" :key="track.id" class="flex flex-wrap items-center justify-between gap-3 rounded bg-zinc-900 px-3 py-2">
                  <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
                    <input v-model="track.language" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
                    <input v-model="track.label" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-gray-500" />
                    <p class="text-xs text-gray-500 sm:col-span-2">{{ track.language || 'und' }} · {{ track.default ? t('movieAdmin.subtitles.default') : t('movieAdmin.subtitles.optional') }} · {{ track.delay_ms || 0 }}ms</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button v-if="!track.default || hasDuplicateAudioDefaults(episode)" type="button" :disabled="episode.audioUploading" class="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" @click="makeAudioDefault(index, track)">
                      {{ track.default ? t('movieAdmin.subtitles.keepOnlyDefault') : t('movieAdmin.subtitles.makeDefault') }}
                    </button>
                    <button type="button" :disabled="episode.audioUploading" class="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAudioMetadata(index, track)">
                      Save title
                    </button>
                    <button type="button" :disabled="seriesAudioDownloadingId === `${episode.episodeId}:${track.id}`" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="downloadEpisodeAudioTrack(episode, track)">
                      {{ seriesAudioDownloadingId === `${episode.episodeId}:${track.id}` ? t('common.preparing') : t('videoEditor.audio.downloadWav') }}
                    </button>
                    <button type="button" :disabled="episode.audioUploading" class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="startReplaceAudio(index, track)">
                      {{ t('movieAdmin.subtitles.replace') }}
                    </button>
                    <button type="button" :disabled="episode.audioUploading" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50" @click="deleteAudioTrack(index, track)">
                      {{ t('common.delete') }}
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-gray-500">No alternate audio tracks found.</p>

              <div class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_10rem_8rem_8rem]">
                <input type="file" accept="audio/*,video/*,.mka,.mkv,.mp4,.aac,.mp3,.wav,.flac,.m4a" class="block w-full text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" @change="onAudioFileSelected($event, index)" />
                <input v-model="episode.audioLanguage" placeholder="en" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
                <input v-model="episode.audioLabel" placeholder="English" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
                <label class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-gray-300">
                  <input v-model="episode.audioDefault" type="checkbox" class="h-4 w-4 accent-red-600" />
                  {{ t('movieAdmin.subtitles.default') }}
                </label>
                <input v-model.number="episode.audioDelayMS" type="number" step="100" placeholder="Delay ms" class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500" />
              </div>
              <p class="mt-2 text-xs text-gray-500">Audio delay is applied when adding/replacing a file. Existing encoded tracks can only edit title/language/default.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" :disabled="(!episode.audioFile && !episode.audioReplacingTrackId) || episode.audioUploading" class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAudioTrack(index, episode.audioReplacingTrackId)">
                  {{ episode.audioUploading ? t('common.saving') : episode.audioReplacingTrackId ? 'Save audio track' : 'Add audio track' }}
                </button>
                <button v-if="episode.audioReplacingTrackId" type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="cancelReplaceAudio(index)">
                  {{ t('common.cancel') }}
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
            <h3 class="text-lg font-semibold text-white">{{ t('seriesAdmin.introPicker.title') }}</h3>
            <p class="mt-1 text-sm text-gray-400">{{ activeIntroEpisode?.title || activeIntroEpisode?.file?.name || t('seriesAdmin.introPicker.previewFallback') }}</p>
          </div>
          <button type="button" class="rounded bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700" @click="closeIntroPicker">
            {{ t('common.close') }}
          </button>
        </div>

        <div class="space-y-4 p-4">
          <video
            v-if="introPickerSourceIsObjectUrl"
            ref="introPickerVideo"
            :src="introPickerVideoUrl"
            controls
            playsinline
            class="aspect-video w-full rounded bg-black"
            @loadedmetadata="onIntroPickerLoaded"
            @timeupdate="onIntroPickerTimeUpdate"
          />
          <VideoPlayer
            v-else
            ref="introPickerPlayer"
            :key="introPickerVideoUrl"
            :src="introPickerVideoUrl"
            status="ready"
            :autoplay="false"
            :start-time-seconds="introPickerInitialTime"
            :exact-start-time="true"
            :progress-emit-interval-ms="100"
            :disable-fullscreen-toggle="true"
            :disable-picture-in-picture-toggle="true"
            class="intro-picker-giltube-player"
            @progress="onIntroPickerPlayerProgress"
            @seeked="onIntroPickerPlayerSeeked"
          />

          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">{{ t('seriesAdmin.introPicker.currentTime') }}</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ formatDuration(introPickerCurrentTime) }}</p>
            </div>
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">{{ t('seriesAdmin.introPicker.introStart') }}</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ formatDuration(activeIntroEpisode?.introStartSeconds || 0) }}</p>
            </div>
            <div class="rounded border border-zinc-800 bg-black/30 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">{{ t('seriesAdmin.introPicker.introEnd') }}</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ formatDuration(activeIntroEpisode?.introEndSeconds || 0) }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" @click="setIntroPickerPoint('start')">
              {{ t('seriesAdmin.introPicker.setStart') }}
            </button>
            <button type="button" class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" @click="setIntroPickerPoint('end')">
              {{ t('seriesAdmin.introPicker.setEnd') }}
            </button>
            <button type="button" :disabled="!canPreviewIntroRange" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50" @click="previewIntroRange">
              {{ t('seriesAdmin.introPicker.previewRange') }}
            </button>
            <button type="button" class="ml-auto rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700" @click="closeIntroPicker">
              {{ t('common.done') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="trailerPickerOpen"
        class="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.22),_rgba(0,0,0,0.92)_45%,_rgba(0,0,0,0.98))] p-3 text-white sm:items-center sm:p-6"
        :style="{ zIndex: 2147483647 }"
        @click.self="closeTrailerPicker"
      >
        <section class="flex h-full w-full max-w-6xl flex-col overflow-hidden border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl sm:h-[min(88dvh,760px)] sm:rounded-2xl">
          <div class="border-b border-white/10 p-4 sm:p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-bold">{{ t('seriesAdmin.trailer.pickerTitle') }}</h2>
                <p class="mt-1 text-sm text-zinc-500">{{ t('seriesAdmin.trailer.pickerBody') }}</p>
              </div>
              <button type="button" class="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/15" @click="closeTrailerPicker">
                X
              </button>
            </div>
            <input
              v-model="trailerPickerSearch"
              type="search"
              class="mt-4 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-500"
              :placeholder="t('movieAdmin.placeholders.searchLibrary')"
              @input="handleTrailerPickerSearchInput"
            />
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div v-if="trailerPickerLoading" class="py-12 text-center text-sm text-zinc-400">{{ t('movieAdmin.library.loading') }}</div>
            <div v-else-if="trailerPickerVideos.length === 0" class="py-12 text-center text-sm text-zinc-400">{{ t('movieAdmin.library.empty') }}</div>
            <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <button
                v-for="video in trailerPickerVideos"
                :key="video.id"
                type="button"
                :disabled="trailerAttaching"
                class="group overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:border-amber-500/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                @click="linkExistingSeriesTrailer(video)"
              >
                <div class="relative aspect-video bg-black">
                  <img v-if="video.thumbnail_url || video.thumbnail" :src="thumbnailUrl(video.thumbnail_url || video.thumbnail)" :alt="video.title" class="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                  <div v-else class="flex h-full items-center justify-center text-sm text-zinc-500">{{ t('playlists.noThumbnail') }}</div>
                  <div class="absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />
                  <span class="absolute inset-x-3 bottom-3 rounded bg-amber-600 px-3 py-2 text-center text-xs font-bold opacity-0 transition group-hover:opacity-100">
                    {{ t('seriesAdmin.actions.useAsTrailer') }}
                  </span>
                </div>
                <div class="p-3">
                  <p class="line-clamp-2 text-sm font-semibold">{{ video.title }}</p>
                  <p class="mt-1 line-clamp-1 text-xs text-zinc-500">{{ video.channel?.name || video.channel || video.username || video.id }}</p>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- Loading State -->
    <div v-if="loading" class="text-center text-gray-400 py-8">
      {{ t('admin.loading') }}
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalePath } from '#i18n'
import { useI18n } from 'vue-i18n'
import { useLocalUploadBaseURL } from '~/app/composables/useLocalUploadBaseURL'
import MovieAdminPanel from '~/app/components/admin/MovieAdminPanel.vue'
import MediaIngestAdminPanel from '~/app/components/admin/MediaIngestAdminPanel.vue'
import TranscodeJobsAdminPanel from '~/app/components/admin/TranscodeJobsAdminPanel.vue'
import VideoEditorPanel from '~/app/components/admin/VideoEditorPanel.vue'
import YouTubeMirrorAdminPanel from '~/app/components/admin/YouTubeMirrorAdminPanel.vue'
import AdminHelpButton from '~/app/components/admin/AdminHelpButton.vue'
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import { getMediaMetadataDetails, searchMediaMetadata, type MediaMetadataResult } from '~/app/service/mediaMetadata'
import { uploadVideo } from '~/app/service/upload'
import { getAdminChannelVideos, getVideo, getVideos } from '~/app/service/videos'
import { searchWatchPartyVideos } from '~/app/service/watchParties'
import { resolveMediaUrl } from '~/app/utils/media'
import {
  addSeriesEpisode,
  approveIntroSkipSuggestion,
  createSeries,
  deleteSeries,
  deleteSeriesEpisodeAudioTrack,
  downloadSeriesEpisodeAudioTrackWAV,
  deleteSeriesEpisodeSubtitle,
  getSeries,
  GILTUBE_SERIES_CHANNEL_ID,
  listIntroSkipSuggestions,
  listSeries,
  listSeriesEpisodeAudioTracks,
  listSeriesEpisodeSubtitles,
  rejectIntroSkipSuggestion,
  reorderSeriesEpisodes,
  setSeriesTrailer,
  updateSeries,
  updateSeriesEpisode,
  uploadSeriesEpisodeAudioTrack,
  uploadSeriesEpisodeSubtitle,
} from '~/app/service/series'

const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()
const activeTab = ref('users')
const adminTabOptions = computed(() => [
  { value: 'users', label: t('admin.tabs.users') },
  { value: 'channels', label: t('admin.tabs.channels') },
  { value: 'videos', label: t('admin.tabs.videos') },
  { value: 'series', label: t('admin.tabs.series') },
  { value: 'movies', label: t('admin.tabs.movies') },
  { value: 'youtube-mirrors', label: t('admin.tabs.youtubeMirrors') },
  { value: 'media-ingests', label: t('admin.tabs.mediaIngests') },
  { value: 'transcode-jobs', label: t('admin.tabs.transcodeJobs') },
  { value: 'intro-suggestions', label: t('admin.tabs.introSuggestions') },
])
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
const selectedAdminChannelId = ref('')
const selectedAdminChannelName = ref('')
const adminChannelVideos = ref<any[]>([])
const selectedAdminVideoId = ref('')
const adminSeries = ref<any[]>([])
const introSuggestions = ref<any[]>([])
const introSuggestionStatusFilter = ref('pending')
const introSuggestionsLoading = ref(false)
const introSuggestionsError = ref('')
const introSuggestionsMessage = ref('')
const introSuggestionReviewingId = ref('')
const introSuggestionPreviewOpen = ref(false)
const introSuggestionPreviewItem = ref<any | null>(null)
const introSuggestionPreviewPlayer = ref<any | null>(null)
const introSuggestionPreviewKey = ref('')
const introSuggestionPreviewSource = ref('')
const introSuggestionPreviewStart = ref(0)
const introSuggestionPreviewEnd = ref(0)
const introSuggestionPreviewCurrentTime = ref(0)
const introSuggestionPreviewPlayingRange = ref(false)
const selectedSeriesId = ref('')
const seriesChannelId = GILTUBE_SERIES_CHANNEL_ID
const localUploadBaseURL = useLocalUploadBaseURL()

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
const seriesDeleting = ref(false)
const seriesError = ref('')
const seriesProgressMessage = ref('')
const seriesMetadataQuery = ref('')
const seriesMetadataSearching = ref(false)
const seriesMetadataResults = ref<MediaMetadataResult[]>([])

const trailerForm = ref({
  title: '',
})
const trailerFile = ref<File | null>(null)
const trailerUploading = ref(false)
const trailerProgress = ref(0)
const trailerAttaching = ref(false)
const trailerPickerOpen = ref(false)
const trailerPickerSearch = ref('')
const trailerPickerVideos = ref<any[]>([])
const trailerPickerLoading = ref(false)
let trailerPickerSearchTimer: ReturnType<typeof setTimeout> | null = null

type EpisodeRow = {
  localId: string
  episodeId: string
  videoId: string
  videoTitle: string
  thumbnailUrl: string
  originalFilename: string
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
  audioTracks: AudioTrack[]
  audioFile: File | null
  audioLabel: string
  audioLanguage: string
  audioDefault: boolean
  audioDelayMS: number
  audioUploading: boolean
  audioReplacingTrackId: string
}

type SubtitleTrack = {
  id: string
  label: string
  language: string
  uri: string
  default: boolean
  delay_ms: number
}

type AudioTrack = SubtitleTrack
type IntroPickerPlayer = {
  setPlaybackTime: (seconds: number) => void
  playFrom: (seconds?: number) => Promise<void>
  pauseAt: (seconds?: number) => void
  getPlaybackState: () => { currentTime: number; duration: number; paused: boolean }
}

const episodeRows = ref<EpisodeRow[]>([])
const savingEpisodeDetails = ref(false)
const episodeOrderSaving = ref(false)
const episodeOrderOpen = ref(false)
const seriesSubtitleDelayMs = ref(0)
const seriesSubtitleDelaySaving = ref(false)
const seriesAudioDownloadingId = ref('')
const introPickerOpen = ref(false)
const introPickerEpisodeIndex = ref(-1)
const introPickerVideoUrl = ref('')
const introPickerVideo = ref<HTMLVideoElement | null>(null)
const introPickerPlayer = ref<IntroPickerPlayer | null>(null)
const introPickerInitialTime = ref(0)
const introPickerCurrentTime = ref(0)
const introPickerDuration = ref(0)
const introPickerPreviewing = ref(false)
const introPickerSourceIsObjectUrl = ref(false)

const activeIntroEpisode = computed(() => {
  if (introPickerEpisodeIndex.value < 0) return null
  return episodeRows.value[introPickerEpisodeIndex.value] || null
})

const canPreviewIntroRange = computed(() => {
  const row = activeIntroEpisode.value
  return Boolean(row && row.introEndSeconds > row.introStartSeconds)
})

const canSaveEpisodeDetails = computed(() => (
  episodeRows.value.some(row => row.episodeId)
))

const orderedAttachedEpisodes = computed(() => (
  episodeRows.value
    .filter(row => row.episodeId)
    .slice()
    .sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber)
))

const canApplySeriesSubtitleDelay = computed(() => (
  episodeRows.value.some(row => row.episodeId && row.subtitles.length > 0)
))

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
      if (selectedAdminChannelId.value) {
        const existing = channels.value.find((channel: any) => channel.id === selectedAdminChannelId.value)
        if (!existing) {
          selectedAdminChannelId.value = ''
          selectedAdminChannelName.value = ''
          selectedAdminVideoId.value = ''
          adminChannelVideos.value = []
        }
      }
    }

    const seriesData = await listSeries()
    adminSeries.value = seriesData.series || []
    await loadIntroSuggestions()
  } catch (err) {
    console.error('Failed to load admin data:', err)
    error.value = 'Failed to load admin data'
  } finally {
    loading.value = false
  }
}

const loadIntroSuggestions = async () => {
  introSuggestionsLoading.value = true
  introSuggestionsError.value = ''
  try {
    const data = await listIntroSkipSuggestions(introSuggestionStatusFilter.value)
    introSuggestions.value = data.suggestions || []
  } catch (err: any) {
    introSuggestionsError.value = err?.response?.data?.error || err?.message || t('admin.introSuggestions.loadError')
  } finally {
    introSuggestionsLoading.value = false
  }
}

const reviewIntroSuggestion = async (suggestionId: string, action: 'approve' | 'reject') => {
  introSuggestionReviewingId.value = suggestionId
  introSuggestionsError.value = ''
  introSuggestionsMessage.value = ''
  try {
    if (action === 'approve') {
      await approveIntroSkipSuggestion(suggestionId)
      introSuggestionsMessage.value = t('admin.introSuggestions.applied')
    } else {
      await rejectIntroSkipSuggestion(suggestionId)
      introSuggestionsMessage.value = t('admin.introSuggestions.rejected')
    }
    await loadIntroSuggestions()
    if (introSuggestionPreviewOpen.value) {
      closeIntroSuggestionPreview()
    }
  } catch (err: any) {
    introSuggestionsError.value = err?.response?.data?.error || err?.message || t('admin.introSuggestions.reviewError')
  } finally {
    introSuggestionReviewingId.value = ''
  }
}

const openIntroSuggestionPreview = (suggestion: any) => {
  introSuggestionPreviewItem.value = suggestion
  introSuggestionPreviewStart.value = Number(suggestion?.intro_start_seconds || 0)
  introSuggestionPreviewEnd.value = Number(suggestion?.intro_end_seconds || 0)
  introSuggestionPreviewCurrentTime.value = introSuggestionPreviewStart.value
  introSuggestionPreviewSource.value = resolveMediaUrl(suggestion?.video_hls_path || '')
  introSuggestionPreviewKey.value = `${suggestion?.id || 'suggestion'}-${Date.now()}`
  introSuggestionPreviewPlayingRange.value = false
  introSuggestionPreviewOpen.value = true
}

const closeIntroSuggestionPreview = () => {
  introSuggestionPreviewPlayer.value?.pauseAt?.()
  introSuggestionPreviewOpen.value = false
  introSuggestionPreviewItem.value = null
  introSuggestionPreviewSource.value = ''
  introSuggestionPreviewPlayingRange.value = false
  introSuggestionPreviewCurrentTime.value = 0
}

const onIntroSuggestionPreviewProgress = (payload: { currentTime: number; duration: number }) => {
  const currentTime = Number(payload.currentTime || 0)
  introSuggestionPreviewCurrentTime.value = currentTime
  if (introSuggestionPreviewPlayingRange.value && currentTime >= introSuggestionPreviewEnd.value) {
    introSuggestionPreviewPlayer.value?.pauseAt?.(introSuggestionPreviewEnd.value)
    introSuggestionPreviewPlayingRange.value = false
  }
}

const onIntroSuggestionPreviewSeeked = (payload: { currentTime: number }) => {
  introSuggestionPreviewCurrentTime.value = Number(payload.currentTime || 0)
}

const playIntroSuggestionPreview = async () => {
  introSuggestionPreviewPlayingRange.value = true
  try {
    await introSuggestionPreviewPlayer.value?.playFrom?.(introSuggestionPreviewStart.value)
  } catch {
    introSuggestionPreviewPlayingRange.value = false
  }
}

watch(introSuggestionStatusFilter, () => {
  if (activeTab.value === 'intro-suggestions') {
    loadIntroSuggestions()
  }
})

const loadAdminChannelVideos = async (channelId: string) => {
  if (!channelId) return
  try {
    adminChannelVideos.value = await getAdminChannelVideos(channelId)
    if (selectedAdminVideoId.value && !adminChannelVideos.value.some((video: any) => video.id === selectedAdminVideoId.value)) {
      selectedAdminVideoId.value = ''
    }
  } catch (err) {
    console.error('Failed to load admin channel videos:', err)
    error.value = 'Failed to load channel videos'
    adminChannelVideos.value = []
  }
}

const selectAdminChannel = async (channel: any) => {
  selectedAdminChannelId.value = channel.id
  selectedAdminChannelName.value = channel.name
  selectedAdminVideoId.value = ''
  await loadAdminChannelVideos(channel.id)
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    u.username.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query)
  )
})

const isProtectedAdminUser = (user: any) => user?.user_type === 'admin'
const isProtectedAdminChannel = (channel: any) => channel?.user_type === 'admin'

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
  videoTitle: episode.video?.title || '',
  thumbnailUrl: episode.video?.thumbnail_url || '',
  originalFilename: episode.video?.original_filename || '',
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
  audioTracks: [],
  audioFile: null,
  audioLabel: '',
  audioLanguage: 'en',
  audioDefault: false,
  audioDelayMS: 0,
  audioUploading: false,
  audioReplacingTrackId: '',
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

const loadEpisodeAudioTracks = async (row: EpisodeRow) => {
  if (!row.episodeId) return
  try {
    const data = await listSeriesEpisodeAudioTracks(row.episodeId)
    row.audioTracks = data.audio_tracks || []
  } catch (err) {
    console.error('Failed to load episode audio tracks:', err)
    row.audioTracks = []
  }
}

const loadAllEpisodeSubtitles = async () => {
  await Promise.all(episodeRows.value.filter(row => row.episodeId).map(loadEpisodeSubtitles))
}

const loadAllEpisodeAudioTracks = async () => {
  await Promise.all(episodeRows.value.filter(row => row.episodeId).map(loadEpisodeAudioTracks))
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
  episodeOrderOpen.value = false
  seriesSubtitleDelayMs.value = 0
  seriesProgressMessage.value = ''
  seriesError.value = ''
  seriesMetadataQuery.value = ''
  seriesMetadataResults.value = []
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
  episodeOrderOpen.value = false
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
    await loadAllEpisodeAudioTracks()
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

const deleteUser = async (userIdToDelete: string, username: string) => {
  if (!confirm(`Are you sure you want to DELETE user "${username}" and all their data? This cannot be undone.`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToDelete}?user_id=${userId}`, {
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
    const res = await fetch(`/api/v1/admin/users/${userIdToSuspend}/suspend?user_id=${userId}`, {
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
    const res = await fetch(`/api/v1/admin/users/${userIdToUnsuspend}/unsuspend?user_id=${userId}`, {
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
      posterUrl: seriesForm.value.posterUrl,
      backdropUrl: seriesForm.value.backdropUrl,
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

const searchSeriesMetadata = async () => {
  const query = seriesMetadataQuery.value.trim()
  if (!query) return
  seriesMetadataSearching.value = true
  seriesError.value = ''
  try {
    const data = await searchMediaMetadata('series', query)
    seriesMetadataResults.value = data.results || []
    if (!seriesMetadataResults.value.length) {
      seriesProgressMessage.value = t('movieAdmin.metadata.empty')
    }
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || t('movieAdmin.metadata.error')
  } finally {
    seriesMetadataSearching.value = false
  }
}

const applySeriesMetadata = async (result: MediaMetadataResult) => {
  seriesMetadataSearching.value = true
  seriesError.value = ''
  let detail = result
  try {
    const data = await getMediaMetadataDetails('series', result.source_id)
    detail = data.result || result
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || t('movieAdmin.metadata.error')
  } finally {
    seriesMetadataSearching.value = false
  }

  seriesForm.value.title = detail.title || seriesForm.value.title
  seriesForm.value.synopsis = detail.synopsis || seriesForm.value.synopsis
  seriesForm.value.genre = detail.genre || seriesForm.value.genre
  seriesForm.value.genres = detail.genres.join(', ')
  seriesForm.value.directors = detail.directors.join(', ')
  seriesForm.value.cast = detail.cast.join(', ')
  seriesForm.value.seasons = detail.seasons || seriesForm.value.seasons
  seriesForm.value.posterUrl = detail.poster_url || seriesForm.value.posterUrl
  seriesForm.value.backdropUrl = detail.backdrop_url || seriesForm.value.backdropUrl
  seriesForm.value.poster = null
  seriesForm.value.backdrop = null
  trailerForm.value.title = `${detail.title} Trailer`
  const episodeCount = applySeriesEpisodeMetadata(detail)
  seriesProgressMessage.value = episodeCount > 0
    ? `${t('movieAdmin.metadata.applied', { title: detail.title })} ${t('movieAdmin.metadata.episodesApplied', { count: episodeCount })}`
    : t('movieAdmin.metadata.applied', { title: detail.title })
}

const applySeriesEpisodeMetadata = (result: MediaMetadataResult) => {
  const episodes = result.episodes || []
  if (!episodes.length) return 0

  let filledCount = 0
  for (const episode of episodes) {
    const seasonNumber = episode.season_number || 1
    const episodeNumber = episode.episode_number || 1
    let row = episodeRows.value.find(existing =>
      existing.seasonNumber === seasonNumber && existing.episodeNumber === episodeNumber
    )

    if (!row) {
      row = createEpisodeRow({
        season_number: seasonNumber,
        episode_number: episodeNumber,
      }, episodeNumber)
      episodeRows.value.push(row)
    }

    if (episode.title) row.title = episode.title
    if (episode.synopsis) row.synopsis = episode.synopsis
    filledCount++
  }

  episodeRows.value.sort((a, b) => {
    if (a.seasonNumber === b.seasonNumber) return a.episodeNumber - b.episodeNumber
    return a.seasonNumber - b.seasonNumber
  })
  return filledCount
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

const deleteCurrentSeries = async () => {
  if (!createdSeriesId.value) return
  const title = seriesForm.value.title || createdSeriesId.value
  if (!confirm(`Delete "${title}" and all linked episode/trailer videos? This cannot be undone.`)) return

  seriesDeleting.value = true
  seriesError.value = ''
  seriesProgressMessage.value = ''
  try {
    await deleteSeries(createdSeriesId.value)
    resetSeriesWorkspace()
    await loadAdminData()
    seriesProgressMessage.value = `Deleted "${title}".`
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to delete series'
  } finally {
    seriesDeleting.value = false
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

const thumbnailUrl = (url?: string) => {
  return resolveMediaUrl(url, '/videos/placeholder-thumbnail.jpg')
}

const loadRecommendedTrailerVideos = async () => {
  trailerPickerLoading.value = true
  try {
    trailerPickerVideos.value = await getVideos({ limit: 24, offset: 0 })
  } catch (err) {
    console.error('Failed to load trailer picker videos:', err)
    trailerPickerVideos.value = []
  } finally {
    trailerPickerLoading.value = false
  }
}

const performTrailerPickerSearch = async () => {
  const query = trailerPickerSearch.value.trim()
  if (!query) {
    await loadRecommendedTrailerVideos()
    return
  }

  trailerPickerLoading.value = true
  try {
    const data = await searchWatchPartyVideos(query)
    trailerPickerVideos.value = data.results || []
  } catch (err) {
    console.error('Failed to search trailer picker videos:', err)
    trailerPickerVideos.value = []
  } finally {
    trailerPickerLoading.value = false
  }
}

const handleTrailerPickerSearchInput = () => {
  if (trailerPickerSearchTimer) clearTimeout(trailerPickerSearchTimer)
  trailerPickerSearchTimer = setTimeout(performTrailerPickerSearch, 250)
}

const openTrailerPicker = async () => {
  if (!createdSeriesId.value) return
  trailerPickerOpen.value = true
  trailerPickerSearch.value = ''
  await loadRecommendedTrailerVideos()
}

const closeTrailerPicker = () => {
  trailerPickerOpen.value = false
}

const linkExistingSeriesTrailer = async (video: any) => {
  if (!createdSeriesId.value || !video?.id) return
  trailerAttaching.value = true
  seriesError.value = ''
  try {
    await setSeriesTrailer(createdSeriesId.value, video.id)
    if (!trailerForm.value.title) {
      trailerForm.value.title = video.title || `${seriesForm.value.title} Trailer`
    }
    closeTrailerPicker()
    await loadAdminData()
    await hydrateSeriesWorkspace(createdSeriesId.value)
    seriesProgressMessage.value = t('seriesAdmin.messages.linkedExistingTrailer', { title: video.title || video.id })
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || t('seriesAdmin.errors.linkTrailer')
  } finally {
    trailerAttaching.value = false
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
  if (introPickerSourceIsObjectUrl.value) {
    URL.revokeObjectURL(introPickerVideoUrl.value)
  }
  introPickerVideoUrl.value = ''
  introPickerSourceIsObjectUrl.value = false
}

const canPickIntro = (row: EpisodeRow) => {
  return Boolean(row.file || row.videoId)
}

const openIntroPicker = async (index: number) => {
  const row = episodeRows.value[index]
  if (!row || !canPickIntro(row)) return

  revokeIntroPickerUrl()
  introPickerEpisodeIndex.value = index
  introPickerInitialTime.value = row.introStartSeconds || 0
  introPickerCurrentTime.value = introPickerInitialTime.value
  introPickerDuration.value = 0

  if (row.file) {
    introPickerVideoUrl.value = URL.createObjectURL(row.file)
    introPickerSourceIsObjectUrl.value = true
  } else if (row.videoId) {
    try {
      const video = await getVideo(row.videoId)
      introPickerVideoUrl.value = resolveMediaUrl(video?.hls_path || video?.video_url || video?.file_url || '')
    } catch (err: any) {
      seriesError.value = err?.response?.data?.error || err?.message || 'Failed to load episode preview'
      introPickerEpisodeIndex.value = -1
      return
    }
  }

  if (!introPickerVideoUrl.value) {
    seriesError.value = 'Episode preview is not ready yet.'
    introPickerEpisodeIndex.value = -1
    return
  }

  introPickerOpen.value = true

  await nextTick()
  if (introPickerSourceIsObjectUrl.value && introPickerVideo.value && row.introStartSeconds > 0) {
    introPickerVideo.value.currentTime = row.introStartSeconds
  } else if (!introPickerSourceIsObjectUrl.value && row.introStartSeconds > 0) {
    introPickerPlayer.value?.setPlaybackTime(row.introStartSeconds)
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
  introPickerPlayer.value?.pauseAt()
  introPickerEpisodeIndex.value = -1
  introPickerInitialTime.value = 0
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

const onIntroPickerPlayerProgress = (payload: { currentTime: number; duration: number }) => {
  const currentTime = Number(payload.currentTime || 0)
  introPickerCurrentTime.value = currentTime
  introPickerDuration.value = Number(payload.duration || 0)

  const row = activeIntroEpisode.value
  if (introPickerPreviewing.value && row && currentTime >= row.introEndSeconds) {
    introPickerPlayer.value?.pauseAt(row.introEndSeconds)
    introPickerPreviewing.value = false
  }
}

const onIntroPickerPlayerSeeked = (payload: { currentTime: number }) => {
  introPickerCurrentTime.value = Number(payload.currentTime || 0)
}

const introPickerPlaybackState = () => {
  if (introPickerSourceIsObjectUrl.value) {
    return {
      currentTime: Number(introPickerVideo.value?.currentTime || 0),
      duration: Number(introPickerVideo.value?.duration || introPickerDuration.value || 0)
    }
  }
  const state = introPickerPlayer.value?.getPlaybackState()
  return {
    currentTime: Number(state?.currentTime || introPickerCurrentTime.value || 0),
    duration: Number(state?.duration || introPickerDuration.value || 0)
  }
}

const roundedVideoTime = () => Math.max(0, Number(introPickerPlaybackState().currentTime.toFixed(2)))

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
  if (!row || row.introEndSeconds <= row.introStartSeconds) return

  introPickerPreviewing.value = true
  if (introPickerSourceIsObjectUrl.value) {
    const video = introPickerVideo.value
    if (!video) {
      introPickerPreviewing.value = false
      return
    }
    video.currentTime = row.introStartSeconds
    await video.play().catch(() => {
      introPickerPreviewing.value = false
    })
    return
  }

  try {
    await introPickerPlayer.value?.playFrom(row.introStartSeconds)
  } catch {
    introPickerPreviewing.value = false
  }
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

const onAudioFileSelected = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  const row = episodeRows.value[index]
  if (!row) return
  row.audioFile = input.files?.[0] || null
  if (row.audioFile && !row.audioLabel) {
    row.audioLabel = row.audioFile.name.replace(/\.[^.]+$/, '')
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

const saveEpisodeRowDetails = async (row: EpisodeRow) => {
  if (!row.episodeId) return

  await updateSeriesEpisode(row.episodeId, {
    seasonNumber: row.seasonNumber,
    episodeNumber: row.episodeNumber,
    title: row.title,
    synopsis: row.synopsis,
    introStartSeconds: row.introStartSeconds,
    introEndSeconds: row.introEndSeconds,
  })
}

const saveEpisode = async (index: number) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return

  row.saving = true
  seriesError.value = ''
  try {
    await saveEpisodeRowDetails(row)
    seriesProgressMessage.value = `Saved S${row.seasonNumber} E${row.episodeNumber}.`
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to save episode'
  } finally {
    row.saving = false
  }
}

const saveAllEpisodeDetails = async () => {
  const rows = episodeRows.value.filter(row => row.episodeId)
  if (!rows.length) return

  savingEpisodeDetails.value = true
  seriesError.value = ''
  seriesProgressMessage.value = ''
  rows.forEach(row => { row.saving = true })
  let savedCount = 0

  try {
    await reorderSeriesEpisodes(createdSeriesId.value, rows.map(row => ({
      id: row.episodeId,
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
    })), false)
    for (const row of rows) {
      await saveEpisodeRowDetails(row)
      savedCount++
    }
    seriesProgressMessage.value = `Saved details for ${savedCount} episode${savedCount === 1 ? '' : 's'}.`
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to save episode details'
  } finally {
    rows.forEach(row => { row.saving = false })
    savingEpisodeDetails.value = false
  }
}

const moveEpisodeToAdjacentSlot = (row: EpisodeRow, direction: -1 | 1) => {
  const ordered = orderedAttachedEpisodes.value
  const currentIndex = ordered.findIndex(episode => episode.localId === row.localId)
  const target = ordered[currentIndex + direction]
  if (currentIndex < 0 || !target) return

  const currentSlot = { seasonNumber: row.seasonNumber, episodeNumber: row.episodeNumber }
  row.seasonNumber = target.seasonNumber
  row.episodeNumber = target.episodeNumber
  target.seasonNumber = currentSlot.seasonNumber
  target.episodeNumber = currentSlot.episodeNumber
}

const saveEpisodeOrder = async () => {
  if (!createdSeriesId.value || orderedAttachedEpisodes.value.length < 2) return

  episodeOrderSaving.value = true
  seriesError.value = ''
  seriesProgressMessage.value = ''
  try {
    await reorderSeriesEpisodes(createdSeriesId.value, orderedAttachedEpisodes.value.map(row => ({
      id: row.episodeId,
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
    })))
    await hydrateSeriesWorkspace(createdSeriesId.value)
    seriesProgressMessage.value = t('seriesAdmin.reorder.saved')
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || t('seriesAdmin.reorder.error')
  } finally {
    episodeOrderSaving.value = false
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

const saveSubtitleMetadata = async (index: number, track: SubtitleTrack) => {
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
    seriesProgressMessage.value = 'Subtitle track updated.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to update subtitle track'
  } finally {
    row.subtitleUploading = false
  }
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

const applySeriesSubtitleDelay = async () => {
  const rows = episodeRows.value.filter(row => row.episodeId && row.subtitles.length > 0)
  if (!rows.length) return

  const delayMs = Number(seriesSubtitleDelayMs.value || 0)
  const updates = rows.flatMap(row => (
    row.subtitles.map(track => ({ row, track: { ...track, delay_ms: delayMs } }))
  ))
  if (!updates.length) return

  seriesSubtitleDelaySaving.value = true
  seriesError.value = ''
  rows.forEach(row => { row.subtitleUploading = true })

  try {
    for (const update of updates) {
      const data = await uploadSeriesEpisodeSubtitle(update.row.episodeId, {
        label: update.track.label,
        language: update.track.language,
        isDefault: update.track.default,
        delayMs,
        trackId: update.track.id,
      })
      update.row.subtitles = data.subtitles || []
    }
    seriesProgressMessage.value = t('movieAdmin.subtitles.messages.globalDelaySaved', { count: updates.length })
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || t('movieAdmin.subtitles.errors.globalDelay')
  } finally {
    rows.forEach(row => { row.subtitleUploading = false })
    seriesSubtitleDelaySaving.value = false
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

const audioDefaultCount = (row: EpisodeRow) => row.audioTracks.filter(track => track.default).length

const hasDuplicateAudioDefaults = (row: EpisodeRow) => audioDefaultCount(row) > 1

const resetAudioForm = (row: EpisodeRow) => {
  row.audioFile = null
  row.audioLabel = ''
  row.audioLanguage = 'en'
  row.audioDefault = false
  row.audioDelayMS = 0
  row.audioReplacingTrackId = ''
}

const saveAudioTrack = async (index: number, trackId = '') => {
  const row = episodeRows.value[index]
  if (!row?.episodeId || (!row.audioFile && !trackId)) return

  row.audioUploading = true
  seriesError.value = ''
  try {
    const data = await uploadSeriesEpisodeAudioTrack(row.episodeId, {
      file: row.audioFile,
      label: row.audioLabel,
      language: row.audioLanguage,
      isDefault: row.audioDefault,
      delayMs: row.audioDelayMS || 0,
      trackId,
    })
    row.audioTracks = data.audio_tracks || []
    resetAudioForm(row)
    seriesProgressMessage.value = 'Audio track updated.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to update audio track'
  } finally {
    row.audioUploading = false
  }
}

const saveAudioMetadata = async (index: number, track: AudioTrack) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return

  row.audioUploading = true
  seriesError.value = ''
  try {
    const data = await uploadSeriesEpisodeAudioTrack(row.episodeId, {
      label: track.label,
      language: track.language,
      isDefault: track.default,
      trackId: track.id,
    })
    row.audioTracks = data.audio_tracks || []
    seriesProgressMessage.value = 'Audio track updated.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to update audio track'
  } finally {
    row.audioUploading = false
  }
}

const makeAudioDefault = async (index: number, track: AudioTrack) => {
  track.default = true
  await saveAudioMetadata(index, track)
}

const startReplaceAudio = (index: number, track: AudioTrack) => {
  const row = episodeRows.value[index]
  if (!row) return
  row.audioReplacingTrackId = track.id
  row.audioLabel = track.label || ''
  row.audioLanguage = track.language || 'en'
  row.audioDefault = Boolean(track.default)
  row.audioDelayMS = track.delay_ms || 0
  row.audioFile = null
}

const cancelReplaceAudio = (index: number) => {
  const row = episodeRows.value[index]
  if (!row) return
  resetAudioForm(row)
}

const episodeAudioDownloadName = (row: EpisodeRow, track: AudioTrack) => {
  const base = (row.title || `s${row.seasonNumber}-e${row.episodeNumber}` || 'episode')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const label = (track.label || track.language || track.id || 'audio')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'episode'}-${label || 'audio'}.wav`
}

const downloadEpisodeAudioTrack = async (row: EpisodeRow, track: AudioTrack) => {
  if (!row.episodeId) return
  const downloadId = `${row.episodeId}:${track.id}`
  seriesAudioDownloadingId.value = downloadId
  seriesError.value = ''
  try {
    await downloadSeriesEpisodeAudioTrackWAV(row.episodeId, track.id, episodeAudioDownloadName(row, track))
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || t('videoEditor.errors.downloadAudio')
  } finally {
    seriesAudioDownloadingId.value = ''
  }
}

const deleteAudioTrack = async (index: number, track: AudioTrack) => {
  const row = episodeRows.value[index]
  if (!row?.episodeId) return
  if (!confirm(`Delete audio track "${track.label || track.language || track.id}"?`)) return

  row.audioUploading = true
  seriesError.value = ''
  try {
    const data = await deleteSeriesEpisodeAudioTrack(row.episodeId, track.id)
    row.audioTracks = data.audio_tracks || []
    seriesProgressMessage.value = 'Audio track deleted.'
  } catch (err: any) {
    seriesError.value = err?.response?.data?.error || err?.message || 'Failed to delete audio track'
  } finally {
    row.audioUploading = false
  }
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
  if (trailerPickerSearchTimer) clearTimeout(trailerPickerSearchTimer)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

watch(trailerPickerOpen, (isOpen) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = isOpen ? 'hidden' : ''
})
</script>

<style scoped>
.admin-tabs {
  scrollbar-width: thin;
  scrollbar-color: rgb(82 82 91) transparent;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

.admin-tabs::-webkit-scrollbar {
  height: 4px;
}

.admin-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.admin-tabs::-webkit-scrollbar-thumb {
  background: rgb(82 82 91);
  border-radius: 999px;
}

:deep(.intro-picker-giltube-player .video-player-container) {
  aspect-ratio: 16 / 9;
  height: auto;
  max-height: min(56vh, 32rem);
}

:deep(.intro-suggestion-preview-player .video-player-container) {
  aspect-ratio: 16 / 9;
  height: auto;
  max-height: min(56vh, 32rem);
}

:deep(.intro-picker-giltube-player .vjs-fullscreen-control),
:deep(.intro-picker-giltube-player .vjs-picture-in-picture-control),
:deep(.intro-picker-giltube-player .vjs-picture-in-picture-toggle),
:deep(.intro-suggestion-preview-player .vjs-fullscreen-control),
:deep(.intro-suggestion-preview-player .vjs-picture-in-picture-control),
:deep(.intro-suggestion-preview-player .vjs-picture-in-picture-toggle) {
  display: none !important;
}
</style>
