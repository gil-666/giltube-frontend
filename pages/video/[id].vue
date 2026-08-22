<template>
  <div v-if="videoNotFound" class="flex min-h-screen items-center justify-center bg-black px-4 text-white">
    <div class="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl shadow-black/50">
      <p class="text-sm font-bold uppercase tracking-[0.24em] text-red-300">{{ t('video.notFoundKicker') }}</p>
      <h1 class="mt-3 text-3xl font-black">{{ t('video.notFoundTitle') }}</h1>
      <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('video.notFoundBody') }}</p>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <NuxtLink :to="localePath('/')" class="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500">
          {{ t('video.goBackHome') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/search')" class="rounded-lg bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700">
          {{ t('video.searchVideos') }}
        </NuxtLink>
      </div>
    </div>
  </div>

  <div
    v-else
    class="min-h-screen bg-black text-white flex flex-col lg:flex-row p-3 gap-4 sm:p-4 lg:p-4 lg:gap-5"
    :class="{ 'mobile-watch-layout': isMobileWatchDevice }"
  >
    
    <!-- Left: Video Player and Info -->
    <div class="flex-1 min-w-0">
      <!-- Video Player -->
      <div class="watch-player-shell relative w-full">
        <GilAdsVideoPlayer
          ref="videoPlayerRef"
          :src="videoSrc"
          :status="video?.status"
          :video-id="id"
          :channel-id="video?.channel?.id"
          :episode-label="currentEpisodeLabel"
          :intro-start-seconds="currentSeriesEpisode?.intro_start_seconds || 0"
          :intro-end-seconds="currentSeriesEpisode?.intro_end_seconds || 0"
          :has-next-episode="hasNextQueueVideo"
          :next-episode-label="isPlayingFromSeries ? t('watchPage.nextEpisode') : t('watchPage.nextVideo')"
          :start-time-seconds="resumeStartSeconds"
          :autoplay="canAutoplayWatchVideo"
          :clip-mode="isClipMode"
          :clip-start-seconds="clipPlaybackStart"
          :clip-end-seconds="clipPlaybackEnd"
          @play="onVideoPlay"
          @progress="handleWatchProgress"
          @seeked="handleWatchSeeked"
          @ended="handleVideoEnded"
          @next-episode="skipToNextVideo"
        />

      </div>

      <div
        v-if="isClipMode"
        ref="clipEditorRef"
        class="clip-editor-panel mt-3 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur sm:p-4"
      >
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">{{ t('video.clip.create') }}</p>
              <p class="mt-1 text-sm text-zinc-300">{{ formatClipTime(clipStart) }} - {{ formatClipTime(clipEnd) }} · max 30s</p>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button type="button" class="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200" @click="toggleClipPlayback">
                {{ clipPlayerPaused ? "Play" : "Pause" }}
              </button>
              <button type="button" class="rounded-full bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700" @click="cancelClipMode">{{ t('video.clip.cancel') }}</button>
            </div>
          </div>

          <div class="flex flex-col gap-3 rounded-xl bg-zinc-900/80 p-3 sm:p-4">
            <div class="grid gap-3 text-xs text-zinc-400 sm:grid-cols-[auto_minmax(12rem,1fr)_auto] sm:items-center">
              <span class="font-mono">{{ formatClipTime(clipViewportStart) }}</span>
              <label class="flex min-w-0 items-center gap-2 rounded-full bg-black/25 px-3 py-2">
                <span class="font-semibold uppercase tracking-[0.14em] text-zinc-500">{{ t('video.clip.zoom') }}</span>
                <input
                  v-model.number="clipZoom"
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  class="h-2 min-w-0 flex-1 accent-red-500"
                  :aria-label="t('video.clip.zoomTimeline')"
                />
                <span class="w-9 text-right font-bold text-zinc-300">{{ clipZoom }}x</span>
              </label>
              <span class="text-right font-mono">{{ formatClipTime(clipViewportEnd) }}</span>
            </div>

            <div
              ref="clipTrackRef"
              class="clip-timeline relative h-28 touch-none overflow-visible rounded-xl bg-zinc-800/90 px-4 sm:h-24"
              @pointerdown="handleClipTrackPointerDown"
            >
              <div class="absolute left-4 right-4 top-1/2 h-3 -translate-y-1/2 rounded-full bg-zinc-700" />
              <div class="pointer-events-none absolute inset-y-3 left-1/2 w-px bg-white/10" />
              <div class="absolute top-1/2 z-10 h-8 -translate-y-1/2 rounded-full bg-red-500/40 ring-1 ring-red-300/40" :style="clipSelectionStyle" />
              <button type="button" class="clip-handle absolute top-1/2 z-20 h-16 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.55)] sm:h-14 sm:w-5" :style="clipStartHandleStyle" :aria-label="t('video.clip.moveStart')" @pointerdown.stop="startClipDrag('start', $event)" />
              <button type="button" class="clip-handle absolute top-1/2 z-20 h-16 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.55)] sm:h-14 sm:w-5" :style="clipEndHandleStyle" :aria-label="t('video.clip.moveEnd')" @pointerdown.stop="startClipDrag('end', $event)" />
              <button type="button" class="absolute bottom-3 top-3 z-30 w-4 -translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.5)] ring-1 ring-black/20 sm:w-3" :style="clipPlayheadStyle" :aria-label="t('video.clip.seekPreview')" @pointerdown.stop="startClipDrag('playhead', $event)">
                <span class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[115%] rounded-full border border-white/20 bg-white px-2 py-1 text-[11px] font-black text-black shadow-lg">
                  {{ formatClipTime(playerCurrentTime) }}
                </span>
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input v-model="clipTitle" type="text" maxlength="200" class="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-400 focus:outline-none" :placeholder="clipTitlePlaceholder" />
            <button type="button" class="min-h-11 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isPublishingClip" @click="publishClip">
              {{ isPublishingClip ? "Publishing..." : "Publish clip" }}
            </button>
          </div>
          <p v-if="clipError" class="text-sm text-red-300">{{ clipError }}</p>
        </div>
      </div>

      <!-- Video Info -->
      <div v-if="video" class="mt-3">
        <!-- Processing Message -->
        <div v-if="video.status === 'processing'" class="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg mb-4">
          <p class="font-semibold">{{ t('video.videoProcessing') }}</p>
          <p class="text-sm mt-1">{{ t('video.processingMessage') }}</p>
        </div>

        <h1 class="text-2xl font-bold">{{ watchDisplayTitle }}</h1>

        <!-- Badges Container - Horizontally Scrollable -->
        <div v-if="video.explicit || is4K || is8K || (video.categories && video.categories.length > 0)" class="mt-3 flex gap-2 overflow-x-auto pb-2">
          <!-- Explicit Content Warning Badge -->
          <div v-if="video.explicit" class="inline-flex flex-shrink-0 items-center gap-2 bg-red-900 text-red-200 px-3 py-1.5 rounded-full border border-red-700">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs font-semibold whitespace-nowrap">{{ t('video.explicitBadge') }}</span>
          </div>
          <!-- 8K Badge -->
          <div v-if="is8K" class="inline-flex flex-shrink-0 items-center gap-2 bg-green-900 text-green-200 px-3 py-1.5 rounded-full border border-green-700">
            <span class="text-xs font-semibold whitespace-nowrap">{{ t('video.eightKBadge') }}</span>
          </div>
          <!-- 4K Badge -->
          <div v-if="is4K" class="inline-flex flex-shrink-0 items-center gap-2 bg-green-900 text-green-200 px-3 py-1.5 rounded-full border border-green-700">
            <span class="text-xs font-semibold whitespace-nowrap">{{ t('video.fourKBadge') }}</span>
          </div>

          <!-- Category Badges -->
          <NuxtLink
            v-for="category in video.categories"
            :key="category.id"
            :to="localePath(`/category/${category.slug}`)"
            class="inline-flex flex-shrink-0 items-center px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded-full text-xs font-semibold transition border border-blue-700 whitespace-nowrap"
          >
            {{ category.name }}
          </NuxtLink>
        </div>
        
        <!-- Views and Date -->
        <div class="flex gap-4 text-sm text-gray-400 mt-3">
          <span>{{ formatViews(video.views) }} {{ t('video.views') }}</span>
          <span>{{ getTimeAgo(video.created_at) }}</span>
        </div>
        <div v-if="video.clip" class="mt-3 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-100">
          <p class="font-semibold">Clipped by {{ clipAttributionName }}</p>
          <NuxtLink :to="originalVideoLink" class="mt-1 inline-flex text-red-200 underline-offset-4 hover:underline">
            Go to original video: {{ video.clip.original_video_title || "Original video" }}
          </NuxtLink>
        </div>

        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <NuxtLink :to="localePath(`/channel/${video.channel?.id}`)" class="flex min-w-0 items-center gap-4 rounded-lg p-1 transition hover:bg-zinc-800 sm:pr-4">
            <AvatarFallback
              :src="video.channel?.avatar_url"
              :name="video.channel?.name || 'Channel'"
              class="h-9 w-9 shrink-0 text-xs"
            />
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm font-medium text-gray-100">{{ video.channel.name }}</p>
                <VerifiedBadge :verified="video.channel?.verified || false" size="md" />
              </div>
            </div>
          </NuxtLink>

          <!-- Action Buttons (Like, Share, Add to Playlist) -->
          <div class="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <button
              @click="toggleLike"
              :disabled="!isLoggedIn || isToggglingLike"
              :class="{
                'bg-red-600 hover:bg-red-700': isLiked,
                'bg-zinc-700 hover:bg-zinc-600': !isLiked,
                'opacity-50 cursor-not-allowed': !isLoggedIn || isToggglingLike
              }"
              class="watch-action-button flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <span>{{ isLiked ? '❤️' : '🤍' }}</span>
              <span>{{ likes }}</span>
            </button>

            <button
              v-if="isLoggedIn && canCreateClip"
              @click="startClipMode"
              class="watch-action-button flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-zinc-700 hover:bg-zinc-600"
              :title="t('video.clip.create')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M20 4 8.12 15.88" />
                <path d="M14.47 14.48 20 20" />
                <path d="M8.12 8.12 12 12" />
              </svg>
              <span>{{ t('video.clip.button') }}</span>
            </button>

            <button
              v-if="isLoggedIn"
              @click="showAddToPlaylist = true"
              class="watch-action-button flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-zinc-700 hover:bg-zinc-600"
              :title="t('video.addPlaylist')"
            >
              <span class="text-lg font-bold">+</span>
              <span>{{ t('playlists.addVideoButton') }}</span>
            </button>

            <button
              @click="shareVideo"
              class="watch-action-button flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-zinc-700 hover:bg-zinc-600"
              :title="t('video.share')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 6l-4-4-4 4"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v13"/>
              </svg>
              <span>{{ t('video.share') }}</span>
            </button>

            <button
              v-if="isClipVideo && (video.status === 'ready' || video.status === 'published')"
              @click="downloadCurrentVideo"
              :disabled="isDownloadingVideo"
              class="watch-action-button flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-zinc-700 hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              :title="t('video.download')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              <span>{{ isDownloadingVideo ? 'Preparing...' : 'Download' }}</span>
            </button>

            <button
              v-if="isLoggedIn && !isClipVideo"
              @click="showWatchPartyDialog = true"
              class="flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-red-700 hover:bg-red-600"
              :title="t('watchParty.startButton')"
            >
              <span>{{ t('watchParty.startButton') }}</span>
            </button>

            <div v-if="hasOverflowActions" class="relative">
              <button
                type="button"
                class="watch-action-button flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-700 text-xl font-bold transition hover:bg-zinc-600"
                :aria-label="t('video.moreActions')"
                @click="showVideoActionMenu = !showVideoActionMenu"
              >
                ⋯
              </button>
              <div
                v-if="showVideoActionMenu"
                class="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/60"
              >
                <button
                  v-if="canSuggestIntro"
                  type="button"
                  class="block w-full px-4 py-3 text-left text-sm text-zinc-100 transition hover:bg-zinc-800"
                  @click="openIntroSuggestionDialog"
                >
                  {{ t('video.introSuggestion.menu') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="downloadStatus" class="mt-2 text-sm text-blue-300">{{ downloadStatus }}</p>

        <div v-if="descriptionBlocks.length" class="watch-description mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-gray-300">
          <div
            class="relative space-y-3"
            :class="{
              'max-h-24 overflow-hidden': !isDescriptionExpanded && descriptionIsLong
            }"
          >
            <p
              v-for="(block, blockIndex) in descriptionBlocks"
              :key="blockIndex"
              class="whitespace-pre-wrap break-words"
            >
              <template
                v-for="(part, partIndex) in block"
                :key="`${blockIndex}-${partIndex}`"
              >
                <a
                  v-if="part.href"
                  :href="part.href"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {{ part.text }}
                </a>
                <span v-else>{{ part.text }}</span>
              </template>
            </p>

            <div
              v-if="!isDescriptionExpanded && descriptionIsLong"
              class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-950/95 to-transparent"
            />
          </div>
          <button
            v-if="descriptionIsLong"
            type="button"
            class="mt-3 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            @click="isDescriptionExpanded = !isDescriptionExpanded"
          >
            {{ isDescriptionExpanded ? t('video.showLess') : t('video.showMore') }}
          </button>
        </div>

        <section
          v-if="currentMusicTrack"
          class="music-attribution mt-3"
          aria-labelledby="music-in-video-heading"
        >
          <h2 id="music-in-video-heading" class="music-attribution-heading">{{ t('video.musicInVideo') }}</h2>

          <div class="music-attribution-track">
            <NuxtLink
              :to="localePath(`/music/tracks/${currentMusicTrack.slug}`)"
              class="music-attribution-cover"
              :aria-label="`Open ${currentMusicTrack.title}`"
            >
              <img
                v-if="currentMusicTrack.cover_url"
                :src="imageVariantUrl(currentMusicTrack.cover_url, 'sm')"
                :srcset="imageVariantSrcset(currentMusicTrack.cover_url)"
                sizes="96px"
                :alt="`${currentMusicTrack.release_title} cover`"
              >
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" />
              </svg>
            </NuxtLink>

            <div class="music-attribution-details">
              <NuxtLink
                :to="localePath(`/music/tracks/${currentMusicTrack.slug}`)"
                class="music-attribution-title"
              >
                {{ currentMusicTrack.title }}
              </NuxtLink>
              <NuxtLink
                :to="localePath(`/music/artists/${currentMusicTrack.artist_slug}`)"
                class="music-attribution-link"
              >
                {{ currentMusicTrack.artist_name }}
              </NuxtLink>
              <NuxtLink
                :to="localePath(`/music/releases/${currentMusicTrack.release_slug}`)"
                class="music-attribution-link"
              >
                {{ currentMusicTrack.release_title }}
              </NuxtLink>
            </div>

            <NuxtLink
              :to="localePath(`/music/tracks/${currentMusicTrack.slug}`)"
              class="music-attribution-listen"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>{{ t('video.listen') }}</span>
            </NuxtLink>
          </div>

          <div
            v-if="currentMusicTrack.release_copyright_text || currentMusicTrack.release_phonogram_text"
            class="music-attribution-copyright"
          >
            <p v-if="currentMusicTrack.release_copyright_text">
              {{ currentMusicTrack.release_copyright_text }}
            </p>
            <p v-if="currentMusicTrack.release_phonogram_text">
              {{ currentMusicTrack.release_phonogram_text }}
            </p>
          </div>
        </section>

        <section v-if="trailerSeries" class="mt-6 rounded-lg border border-red-500/30 bg-zinc-900 p-4">
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="w-32 shrink-0 overflow-hidden rounded bg-zinc-800">
              <img
                :src="getTrailerSeriesPosterUrl(trailerSeries.poster_url)"
                :alt="trailerSeries.title"
                class="aspect-[2/3] h-full w-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">{{ t('watchPage.seriesTrailer') }}</p>
              <h2 class="mt-1 text-2xl font-bold text-white">{{ trailerSeries.title }}</h2>
              <p class="mt-2 line-clamp-3 text-sm leading-6 text-gray-300">{{ trailerSeries.synopsis }}</p>
              <NuxtLink
                v-if="trailerSeries.first_episode"
                :to="localePath(`/video/${trailerSeries.first_episode.video_id}?series_id=${trailerSeries.id}&index=0`)"
                class="mt-4 inline-flex rounded bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {{ t('watchPage.watchSeries') }}
              </NuxtLink>
            </div>
          </div>
        </section>

        <section v-if="currentSeries && currentSeriesEpisode" class="mt-6 rounded-lg border border-red-500/30 bg-zinc-900 p-4">
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="w-32 shrink-0 overflow-hidden rounded bg-zinc-800">
              <img
                :src="getTrailerSeriesPosterUrl(currentSeries.poster_url)"
                :alt="currentSeries.title"
                class="aspect-[2/3] h-full w-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">{{ currentSeries.title }}</p>
              <h2 class="mt-1 text-2xl font-bold text-white">{{ currentSeriesEpisode.title }}</h2>
              <p class="mt-2 line-clamp-3 text-sm leading-6 text-gray-300">{{ currentSeriesEpisode.description }}</p>
              <NuxtLink
                :to="localePath(`/category/series?series_id=${currentSeries.id}`)"
                class="mt-4 inline-flex rounded bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {{ t('watchPage.viewSeries') }}
              </NuxtLink>
            </div>
          </div>
        </section>

        <section v-if="trailerMovie" class="mt-6 rounded-lg border border-red-500/30 bg-zinc-900 p-4">
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="w-32 shrink-0 overflow-hidden rounded bg-zinc-800">
              <img
                :src="getTrailerSeriesPosterUrl(trailerMovie.poster_url || trailerMovie.backdrop_url)"
                :alt="trailerMovie.title"
                class="aspect-[2/3] h-full w-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">{{ t('watchPage.movieTrailer') }}</p>
              <h2 class="mt-1 text-2xl font-bold text-white">{{ trailerMovie.title }}</h2>
              <p class="mt-2 line-clamp-3 text-sm leading-6 text-gray-300">{{ trailerMovie.synopsis }}</p>
              <NuxtLink
                v-if="trailerMovie.video_id"
                :to="localePath(`/video/${trailerMovie.video_id}?movie_id=${trailerMovie.id}`)"
                class="mt-4 inline-flex rounded bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {{ t('watchPage.watchMovie') }}
              </NuxtLink>
            </div>
          </div>
        </section>

        <section v-if="currentMovie" class="mt-6 rounded-lg border border-red-500/30 bg-zinc-900 p-4">
          <div class="flex flex-col gap-4 sm:flex-row">
            <div class="w-32 shrink-0 overflow-hidden rounded bg-zinc-800">
              <img
                :src="getTrailerSeriesPosterUrl(currentMovie.poster_url || currentMovie.backdrop_url)"
                :alt="currentMovie.title"
                class="aspect-[2/3] h-full w-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">{{ t('watchPage.movieLabel') }}</p>
              <h2 class="mt-1 text-2xl font-bold text-white">{{ currentMovie.title }}</h2>
              <p class="mt-2 line-clamp-3 text-sm leading-6 text-gray-300">{{ currentMovie.synopsis || video?.description }}</p>
              <NuxtLink
                :to="localePath(`/category/movies?movie_id=${currentMovie.id}`)"
                class="mt-4 inline-flex rounded bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {{ t('watchPage.viewMovie') }}
              </NuxtLink>
            </div>
          </div>
        </section>
      </div>

        <section v-if="clipsOfThisVideo.length" class="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-bold">{{ t('video.clip.clips') }}</h2>
            <span class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ clipsOfThisVideo.length }} clips</span>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <NuxtLink v-for="clip in clipsOfThisVideo" :key="clip.id" :to="clipVideoLink(clip.id)" class="group min-w-0">
              <div class="relative aspect-video overflow-hidden rounded-lg bg-zinc-800">
                <img v-if="clip.thumbnail_url" :src="resolveMediaUrl(clip.thumbnail_url)" :alt="clip.title" class="h-full w-full object-cover transition group-hover:opacity-80" />
                <div v-else class="flex h-full w-full items-center justify-center text-xs text-zinc-500">{{ t('video.clip.noThumbnail') }}</div>
                <span class="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-white">{{ formatClipDuration(clip) }}</span>
              </div>
              <p class="mt-2 line-clamp-2 text-sm font-semibold text-zinc-200 group-hover:text-red-300">{{ clip.title }}</p>
              <p class="mt-1 text-xs text-zinc-500">Clipped by {{ clip.clip?.clipped_by_channel || clip.clip?.clipped_by_username || "User" }}</p>
            </NuxtLink>
          </div>
        </section>

      <div
        v-if="showIntroSuggestionDialog"
        class="fixed inset-x-0 bottom-0 top-16 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        @click.self="closeIntroSuggestionDialog"
      >
        <div class="w-full max-w-4xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl shadow-black/70">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{{ t('video.introSuggestion.kicker') }}</p>
              <h2 class="mt-1 text-xl font-bold text-white">{{ t('video.introSuggestion.title') }}</h2>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('video.introSuggestion.body') }}</p>
            </div>
            <button type="button" class="rounded-lg px-3 py-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white" @click="closeIntroSuggestionDialog">
              ×
            </button>
          </div>

          <VideoPlayer
            ref="introSuggestionPlayerRef"
            :key="introSuggestionPlayerKey"
            :src="videoSrc"
            status="ready"
            :autoplay="false"
            :start-time-seconds="introSuggestionInitialTime"
            :exact-start-time="true"
            :progress-emit-interval-ms="100"
            :disable-fullscreen-toggle="true"
            :disable-picture-in-picture-toggle="true"
            class="intro-suggestion-player mt-5"
            @progress="handleIntroSuggestionProgress"
            @seeked="handleIntroSuggestionSeeked"
          />

          <div class="mt-5 rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <p class="text-sm text-zinc-300">{{ t('video.introSuggestion.instructions') }}</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <p class="text-xs font-bold uppercase tracking-wide text-zinc-500">{{ t('video.introSuggestion.currentTime') }}</p>
                <p class="mt-1 font-mono text-2xl font-semibold text-white">{{ formatClipTime(introSuggestionCurrentTime) }}</p>
              </div>
              <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <p class="text-xs font-bold uppercase tracking-wide text-zinc-500">{{ t('video.introSuggestion.start') }}</p>
                <p class="mt-1 font-mono text-2xl font-semibold text-white">{{ formatClipTime(introSuggestionStart) }}</p>
              </div>
              <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <p class="text-xs font-bold uppercase tracking-wide text-zinc-500">{{ t('video.introSuggestion.end') }}</p>
                <p class="mt-1 font-mono text-2xl font-semibold text-white">{{ formatClipTime(introSuggestionEnd) }}</p>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500" @click="setIntroSuggestionPoint('start')">
                {{ t('video.introSuggestion.setStart') }}
              </button>
              <button type="button" class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500" @click="setIntroSuggestionPoint('end')">
                {{ t('video.introSuggestion.setEnd') }}
              </button>
              <button type="button" :disabled="!canPreviewIntroSuggestion" class="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50" @click="previewIntroSuggestionRange">
                {{ t('video.introSuggestion.previewRange') }}
              </button>
            </div>
          </div>

          <p class="mt-2 text-xs text-zinc-500">
            {{ t('video.introSuggestion.currentTiming', { start: formatClipTime(currentSeriesEpisode?.intro_start_seconds || 0), end: formatClipTime(currentSeriesEpisode?.intro_end_seconds || 0) }) }}
          </p>

          <label class="mt-4 block text-sm font-semibold text-zinc-300">
            {{ t('video.introSuggestion.note') }}
            <textarea
              v-model="introSuggestionNote"
              rows="3"
              maxlength="500"
              class="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-red-400"
              :placeholder="t('video.introSuggestion.notePlaceholder')"
            />
          </label>

          <p v-if="introSuggestionError" class="mt-3 text-sm text-red-300">{{ introSuggestionError }}</p>
          <p v-if="introSuggestionSuccess" class="mt-3 text-sm text-green-300">{{ introSuggestionSuccess }}</p>

          <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" class="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700" @click="closeIntroSuggestionDialog">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="introSuggestionSubmitting"
              @click="submitIntroSuggestion"
            >
              {{ introSuggestionSubmitting ? t('video.introSuggestion.submitting') : t('video.introSuggestion.submit') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Playlist Queue -->
      <div v-if="isQueuePlayback && playlistVideos.length > 0" class="mt-8 lg:hidden">
        <div class="bg-zinc-900 rounded-lg p-4 mb-3">
          <div class="flex items-center justify-between gap-3 mb-2">
            <div>
              <h2 class="text-lg font-bold">{{ queueHeading }}</h2>
              <NuxtLink :to="queueSourceLink" class="text-red-400 hover:text-red-300 text-sm truncate block">
                {{ currentPlaylistName }}
              </NuxtLink>
            </div>
            <button
              v-if="playlistVideos.length > 3"
              @click="isPlaylistQueueExpanded = !isPlaylistQueueExpanded"
              class="shrink-0 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-semibold transition"
            >
              {{ isPlaylistQueueExpanded ? 'Show less' : 'Show all' }}
            </button>
          </div>
          <p class="text-xs text-gray-500">
            {{ isPlaylistQueueExpanded ? playlistVideos.length : Math.min(3, playlistVideos.length) }} / {{ playlistVideos.length }}
          </p>
        </div>

        <div class="space-y-2">
          <NuxtLink
            v-for="item in playlistQueueVideos"
            :key="`${item.video.id}-${item.index}`"
            :to="queueVideoLink(item.video.id, item.index)"
            :class="{
              'bg-red-900 border-red-500 border': item.index === currentVideoIndex,
              'bg-zinc-800 hover:bg-zinc-700': item.index !== currentVideoIndex
            }"
            class="block p-3 rounded-lg transition group"
          >
            <div class="flex gap-3 min-w-0">
              <div class="w-16 h-12 flex-shrink-0 bg-zinc-700 rounded overflow-hidden relative">
                <img
                  v-if="item.video.thumbnail_url"
                  :src="item.video.thumbnail_url"
                  :alt="item.video.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  {{ t('playlists.noThumbnail') }}
                </div>
                <div class="absolute top-0.5 left-0.5 bg-black bg-opacity-70 px-1 py-0.5 rounded text-xs font-bold text-white">
                  {{ isPlayingFromSeries ? `S${item.video.season_number} E${item.video.episode_number}` : item.index + 1 }}
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold line-clamp-2 group-hover:text-red-300 transition">
                  {{ item.video.title }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ item.video.channel?.name || t('playlists.unknownChannel') }}
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Comments Section -->
      <div v-if="video" class="mt-8 border-t border-zinc-700 pt-6">
        <h2 class="text-xl font-bold mb-6">{{ t('video.comments') }}</h2>

        <!-- Comment Form -->
        <div v-if="isLoggedIn && (userChannels.length > 0 || (activeAccount !== userId && activeAccount !== 'personal'))" class="comment-composer mb-6 bg-zinc-900 p-4 rounded">
          <!-- Channel Selector (if on personal account and have channels) -->
          <div v-if="(activeAccount === userId || activeAccount === 'personal') && userChannels.length > 0" class="mb-3">
            <label class="text-xs text-gray-400 block mb-2">{{ t('video.commentAs') }}</label>
            <select
              v-model="personalAccountSelectedChannel"
              class="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option v-for="channel in userChannels" :key="channel.id" :value="channel.id">
                {{ channel.name }}
              </option>
            </select>
          </div>

          <div class="flex gap-3 mb-4">
            <AvatarFallback
              :src="getChannelAvatarUrl((activeAccount === userId || activeAccount === 'personal') ? personalAccountSelectedChannel : activeAccount)"
              :name="selectedChannelName"
              class="h-9 w-9 flex-shrink-0 text-xs"
            />
            <textarea
              v-model="newCommentText"
              :placeholder="t('video.addComment')"
              maxlength="500"
              rows="3"
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div class="flex gap-2 justify-between">
            <button
              type="button"
              @click="showGiphyPicker = true"
              class="comment-secondary-action px-3 py-2 text-gray-400 hover:text-white transition text-sm flex items-center gap-1"
              :title="t('video.addGif')"
            >
              <span>GIF</span>
            </button>
            <div class="flex gap-2">
              <button
                @click="newCommentText = ''"
                class="comment-secondary-action px-4 py-2 text-gray-400 hover:text-white transition text-sm"
              >
                {{ t('video.cancel') }}
              </button>
              <button
                @click="postComment"
                :disabled="!newCommentText.trim() || isPostingComment"
                class="comment-submit-action px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {{ isPostingComment ? t('video.posting') : t('video.comment') }}
              </button>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ newCommentText.length }}/500</p>
        </div>

        <!-- Login prompt for non-logged-in users -->
        <div v-else-if="!isLoggedIn" class="mb-6 bg-zinc-900 p-4 rounded text-center">
          <p class="text-gray-400 mb-3 text-sm">{{ t('video.signInToComment') }}</p>
          <NuxtLink :to="localePath('/login')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm">
            {{ t('app.login') }}
          </NuxtLink>
        </div>

        <!-- Personal account - clickable area to show dialog (only if no channels) -->
        <div v-else-if="(activeAccount === 'personal' || activeAccount === userId) && userChannels.length === 0" class="mb-6 bg-blue-900 border border-blue-700 p-4 rounded text-center">
          <p class="text-blue-300 text-sm mb-3">{{ t('video.createChannelToComment') }}</p>
          <NuxtLink
            :to="localePath('/create-channel')"
            class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm font-semibold"
            @click="showCreateChannelDialog = false"
          >
            {{ t('video.createChannel') }}
          </NuxtLink>
        </div>

        <!-- Comments List -->
        <div class="w-full min-w-0 space-y-4">
          <div v-if="comments.length === 0" class="text-center text-gray-500 py-6 text-sm">
            {{ t('video.noComments') }}
          </div>

          <CommentNode
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            :is-logged-in="isLoggedIn"
            :failed-comment-avatars="failedCommentAvatars"
            :posting-reply-map="postingReplyForCommentId"
            :toggling-comment-like-map="togglingCommentLikeMap"
            :comments-by-id="commentsById"
            :highlighted-comment-id="highlightedCommentId"
            :target-comment-id="targetCommentId"
            :is-comment-owner="isCommentOwner"
            :get-comment-avatar-url="getCommentAvatarUrl"
            :get-time-ago="getTimeAgo"
            :on-post-reply="postReply"
            :on-delete-comment="deleteUserComment"
            :on-toggle-comment-like="toggleCommentLike"
            :on-navigate-to-channel="navigateToChannel"
            :on-jump-to-comment="jumpToComment"
          />
        </div>
      </div>

    </div>

    <!-- Mobile Related Videos -->
    <div v-if="relatedVideos.length > 0" class="lg:hidden mt-8 px-4">
      <GilAdsBanner
        :placement="GILADS_PLACEMENTS.videoSidebarSquare"
        type="banner"
        size="600x600"
        variant="square"
        :context="{ page: 'watch', videoId: id, channelId: video?.channel?.id }"
        :fallback-title="t('video.sponsorFallback')"
        class="mb-5"
      />
      <h2 class="text-lg font-bold mb-4">{{ t('video.relatedVideos') }}</h2>

      <div class="relative">
        <button
          @click="scrollCarousel('left')"
          class="absolute left-0 top-1/3 -translate-y-1/2 z-10 bg-black bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div ref="carouselContainer" class="overflow-x-auto pb-2 px-8" style="scrollbar-width: none; -ms-overflow-style: none;">
          <div class="flex gap-3 whitespace-nowrap" style="-webkit-overflow-scrolling: touch;">
            <NuxtLink
              v-for="relatedVideo in relatedVideos"
              :key="relatedVideo.id"
              :to="localePath(`/video/${relatedVideo.id}`)"
              class="inline-block hover:opacity-80 transition flex-shrink-0"
            >
              <div class="bg-zinc-800 rounded overflow-hidden w-40 aspect-video mb-1.5 relative">
                <img
                  class="w-full h-full object-cover"
                  :src="resolveMediaUrl(relatedVideo.thumbnail_url)"
                  :alt="relatedVideo.title"
                />
                <div v-if="isVideo8K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                <div v-if="isVideo4K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
                <div v-if="videoProgressPercent(relatedVideo.id) > 0" class="absolute inset-x-0 bottom-0 h-1 bg-black/55">
                  <div class="h-full bg-red-600" :style="{ width: `${videoProgressPercent(relatedVideo.id)}%` }" />
                </div>
              </div>
              <p class="text-xs font-semibold line-clamp-2 w-40">{{ relatedVideo.title }}</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="localePath(`/channel/${relatedVideo.channel?.id}`)" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
                <VerifiedBadge :verified="relatedVideo.channel?.verified || false" size="sm" />
              </div>
              <p class="text-xs text-gray-500">{{ formatViews(relatedVideo.views) }} views</p>
            </NuxtLink>
          </div>
        </div>

        <button
          @click="scrollCarousel('right')"
          class="absolute right-0 top-1/3 -translate-y-1/2 z-10 bg-black bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Right: Sidebar (full width on mobile as carousel, wider on tablet, sidebar on lg) -->
    <div class="hidden lg:block w-full md:w-full lg:w-64 lg:flex-shrink-0">
      <div class="md:sticky md:top-6">
        <GilAdsBanner
          :placement="GILADS_PLACEMENTS.videoSidebarSquare"
          type="banner"
          size="600x600"
          variant="square"
          :context="{ page: 'watch', videoId: id, channelId: video?.channel?.id }"
          :fallback-title="t('video.sponsorFallback')"
          class="mb-4"
        />

        <!-- Playlist Queue (when playing from playlist) -->
        <div v-if="isQueuePlayback && playlistVideos.length > 0" class="px-4 md:px-0">
          <div
            class="relative bg-zinc-900 rounded-lg p-4 mb-4 cursor-pointer border border-transparent hover:border-zinc-700 transition"
            role="button"
            tabindex="0"
            @click="isPlaylistQueueExpanded = !isPlaylistQueueExpanded"
            @keydown.enter.prevent="isPlaylistQueueExpanded = !isPlaylistQueueExpanded"
            @keydown.space.prevent="isPlaylistQueueExpanded = !isPlaylistQueueExpanded"
          >
            <div class="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-lg ring-1 ring-white/10 transition group-hover:bg-zinc-700">
              <svg v-if="isPlaylistQueueExpanded" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>

            <div class="min-w-0 pr-12">
              <h2 class="text-lg font-bold">{{ queueHeading }}</h2>
              <NuxtLink :to="queueSourceLink" class="text-red-400 hover:text-red-300 text-sm truncate block">
                {{ currentPlaylistName }}
              </NuxtLink>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>
                  {{ currentVideoIndex + 1 }} / {{ playlistVideos.length }}
                </span>
              </div>
            </div>
          </div>

          <h3 class="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{{ t('playlists.upNext') }}</h3>
          
          <div class="space-y-2">
            <NuxtLink
              v-for="item in playlistQueueVideos"
              :key="`${item.video.id}-${item.index}`"
              :to="queueVideoLink(item.video.id, item.index)"
              :class="{
                'bg-red-900 border-red-500 border': item.index === currentVideoIndex,
                'bg-zinc-800 hover:bg-zinc-700': item.index !== currentVideoIndex
              }"
              class="block p-3 rounded-lg transition group"
            >
              <div class="flex gap-3 min-w-0">
                <!-- Thumbnail -->
                <div class="w-16 h-12 flex-shrink-0 bg-zinc-700 rounded overflow-hidden relative">
                  <img
                    v-if="item.video.thumbnail_url"
                    :src="item.video.thumbnail_url"
                    :alt="item.video.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {{ t('playlists.noThumbnail') }}
                  </div>
                  <!-- Video index badge -->
                  <div class="absolute top-0.5 left-0.5 bg-black bg-opacity-70 px-1 py-0.5 rounded text-xs font-bold text-white">
                    {{ isPlayingFromSeries ? `S${item.video.season_number} E${item.video.episode_number}` : item.index + 1 }}
                  </div>
                </div>

                <!-- Video Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold line-clamp-2 group-hover:text-red-300 transition">
                    {{ item.video.title }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ item.video.channel?.name || (!isPlayingFromSeries ? t('playlists.unknownChannel') : '') }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Related Videos -->
        <div v-else class="px-4 md:px-0">
          <h2 class="text-lg font-bold mb-4">{{ t('video.relatedVideos') }}</h2>
          
          <!-- Mobile: Horizontal Carousel (hidden on md and above) -->
          <div class="md:hidden relative">
            <!-- Left Arrow -->
            <button
              @click="scrollCarousel('left')"
              class="absolute left-0 top-1/3 -translate-y-1/2 z-10 bg-black bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div ref="carouselContainer" class="overflow-x-auto pb-2 px-8" style="scrollbar-width: none; -ms-overflow-style: none;">
              <div class="flex gap-3 whitespace-nowrap" style="-webkit-overflow-scrolling: touch;">
                <NuxtLink
                  v-for="relatedVideo in relatedVideos"
                  :key="relatedVideo.id"
                  :to="localePath(`/video/${relatedVideo.id}`)"
                  class="inline-block hover:opacity-80 transition flex-shrink-0"
                >
                  <div class="bg-zinc-800 rounded overflow-hidden w-40 aspect-video mb-1.5 relative">
                    <img
                      class="w-full h-full object-cover"
                      :src="resolveMediaUrl(relatedVideo.thumbnail_url)"
                      :alt="relatedVideo.title"
                    />
                    <div v-if="isVideo8K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                    <div v-if="isVideo4K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
                    <div v-if="videoProgressPercent(relatedVideo.id) > 0" class="absolute inset-x-0 bottom-0 h-1 bg-black/55">
                      <div class="h-full bg-red-600" :style="{ width: `${videoProgressPercent(relatedVideo.id)}%` }" />
                    </div>
                  </div>
                  <p class="text-xs font-semibold line-clamp-2 w-40">{{ relatedVideo.title }}</p>
                  <div class="flex items-center gap-1">
                    <NuxtLink :to="localePath(`/channel/${relatedVideo.channel?.id}`)" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
                    <VerifiedBadge :verified="relatedVideo.channel?.verified || false" size="sm" />
                  </div>
                  <p class="text-xs text-gray-500">{{ formatViews(relatedVideo.views) }} views</p>
                </NuxtLink>
              </div>
            </div>
            <!-- Right Arrow -->
            <button
              @click="scrollCarousel('right')"
              class="absolute right-0 top-1/3 -translate-y-1/2 z-10 bg-black bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 transition"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <!-- Tablet: 2x2 Grid (shown on md to lg) -->
          <div class="hidden md:grid lg:hidden grid-cols-2 gap-2">
            <NuxtLink
              v-for="relatedVideo in relatedVideos"
              :key="relatedVideo.id"
              :to="localePath(`/video/${relatedVideo.id}`)"
              class="block hover:opacity-80 transition"
            >
              <div class="bg-zinc-800 rounded overflow-hidden w-full aspect-video mb-2 relative">
                <img
                  class="w-full h-full object-cover"
                  :src="resolveMediaUrl(relatedVideo.thumbnail_url)"
                  :alt="relatedVideo.title"
                />
                <div v-if="isVideo8K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                <div v-if="isVideo4K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
                <div v-if="videoProgressPercent(relatedVideo.id) > 0" class="absolute inset-x-0 bottom-0 h-1 bg-black/55">
                  <div class="h-full bg-red-600" :style="{ width: `${videoProgressPercent(relatedVideo.id)}%` }" />
                </div>
              </div>
              <p class="text-sm font-semibold line-clamp-2">{{ relatedVideo.title }}</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="localePath(`/channel/${relatedVideo.channel?.id}`)" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
                <VerifiedBadge :verified="relatedVideo.channel?.verified || false" size="sm" />
              </div>
              <p class="text-xs text-gray-500">{{ formatViews(relatedVideo.views) }} views</p>
            </NuxtLink>
          </div>
          
          <!-- Desktop: Vertical List (shown on lg and above) -->
          <div class="hidden lg:block space-y-3">
            <NuxtLink
              v-for="relatedVideo in relatedVideos"
              :key="relatedVideo.id"
              :to="localePath(`/video/${relatedVideo.id}`)"
              class="block hover:opacity-80 transition"
            >
              <div class="bg-zinc-800 rounded overflow-hidden aspect-video mb-1.5 relative">
                <img
                  class="w-full h-full object-cover"
                  :src="resolveMediaUrl(relatedVideo.thumbnail_url)"
                  :alt="relatedVideo.title"
                />
                <div v-if="isVideo8K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                <div v-if="isVideo4K(relatedVideo.width)" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
                <div v-if="videoProgressPercent(relatedVideo.id) > 0" class="absolute inset-x-0 bottom-0 h-1 bg-black/55">
                  <div class="h-full bg-red-600" :style="{ width: `${videoProgressPercent(relatedVideo.id)}%` }" />
                </div>
              </div>
              <p class="text-xs font-semibold line-clamp-2">{{ relatedVideo.title }}</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="localePath(`/channel/${relatedVideo.channel?.id}`)" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
                <VerifiedBadge :verified="relatedVideo.channel?.verified || false" size="sm" />
              </div>
              <p class="text-xs text-gray-500">{{ formatViews(relatedVideo.views) }} views</p>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Channel Dialog -->
    <div v-if="showCreateChannelDialog" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-zinc-900 rounded-lg p-8 max-w-md w-full border border-zinc-700">
        <h3 class="text-2xl font-bold mb-4">{{ t('video.createChannelComment') }}</h3>
        
        <p class="text-gray-300 mb-6">
          {{ t('video.createChannelToComment') }}
        </p>

        <div class="space-y-3">
          <NuxtLink
            :to="localePath('/create-channel')"
            class="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded transition text-center font-semibold"
            @click="showCreateChannelDialog = false"
          >
            {{ t('video.createChannel') }}
          </NuxtLink>
          
          <button
            @click="showCreateChannelDialog = false"
            class="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded transition text-center"
          >
            {{ t('app.later') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Dialog -->
    <div v-if="showErrorDialog" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-zinc-900 rounded-lg p-8 max-w-md w-full border border-zinc-700">
        <h3 class="text-2xl font-bold mb-4">{{ t('video.error') }}</h3>
        
        <p class="text-gray-300 mb-6">
          {{ errorMessage }}
        </p>

        <button
          @click="showErrorDialog = false"
          class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded transition text-center font-semibold"
        >
          {{ t('video.close') }}
        </button>
      </div>
    </div>

    <!-- Explicit Content Warning Modal -->
    <div v-if="showExplicitWarning" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div class="bg-zinc-900 rounded-lg p-8 max-w-md w-full border-2 border-red-700">
        <!-- Warning Icon -->
        <div class="flex justify-center mb-4">
          <div class="bg-red-900 rounded-full p-4">
            <svg class="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-center mb-3 text-red-400">{{ t('video.eighteen') }}</h2>
        
        <p class="text-gray-300 text-center mb-6">
          {{ t('video.matureContentWarning') }}
        </p>

        <!-- Never Show Again Checkbox -->
        <div class="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded p-3 mb-6">
          <input
            v-model="neverShowExplicitWarningAgain"
            type="checkbox"
            id="never-show-explicit"
            class="w-4 h-4 rounded cursor-pointer accent-red-500"
          />
          <label for="never-show-explicit" class="text-sm text-gray-300 cursor-pointer">
            {{ t('video.dontShowWarning') }}
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            @click="continueToVideo"
            class="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded transition text-center font-semibold text-white"
          >
            {{ t('video.iUnderstand') }}
          </button>
          
          <button
            @click="goBackHome"
            class="w-full px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded transition text-center font-semibold text-white"
          >
            {{ t('video.goBackHome') }}
          </button>
        </div>
      </div>
    </div>

  </div>

  <!-- Giphy Picker Modal -->
  <GiphyPicker 
    :is-open="showGiphyPicker"
    @close="showGiphyPicker = false"
    @select="handleGiphySelect"
  />

  <!-- Add to Playlist Modal (client-only to avoid SSR teleport/hydration issues) -->
  <client-only>
    <AddToPlaylistModal
      :is-open="showAddToPlaylist"
      :video-id="id"
      @close="showAddToPlaylist = false"
      @select="handlePlaylistSelect"
      @create-new="handleCreateNewPlaylist"
    />
  </client-only>

  <div
    v-if="showWatchPartyDialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    @click.self="showWatchPartyDialog = false"
  >
    <div class="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
      <h2 class="text-xl font-bold">{{ t('watchParty.dialog.title') }}</h2>
      <p class="mt-2 text-sm leading-6 text-zinc-400">
        {{ t('watchParty.dialog.body') }}
      </p>

      <label class="mt-5 block text-sm font-semibold text-zinc-300">{{ t('watchParty.visibility') }}</label>
      <select
        v-model="watchPartyVisibility"
        class="mt-2 w-full rounded bg-zinc-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-zinc-700 focus:ring-red-500"
      >
        <option value="private">{{ t('playlists.private') }}</option>
        <option value="public">{{ t('playlists.public') }}</option>
      </select>

      <label class="mt-5 block text-sm font-semibold text-zinc-300">{{ t('watchParty.dialog.partyType') }}</label>
      <select
        v-model="watchPartyType"
        class="mt-2 w-full rounded bg-zinc-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-zinc-700 focus:ring-red-500"
      >
        <option value="queue">{{ t('watchParty.dialog.partyTypes.queue') }}</option>
        <option value="single">{{ t('watchParty.dialog.partyTypes.single') }}</option>
      </select>
      <p class="mt-2 text-xs text-zinc-500">
        {{ t('watchParty.dialog.partyTypeHelp') }}
      </p>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600"
          @click="showWatchPartyDialog = false"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="rounded bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
          :disabled="creatingWatchParty"
          @click="startWatchParty"
        >
          {{ creatingWatchParty ? t('watchParty.starting') : t('watchParty.startParty') }}
        </button>
      </div>

      <p v-if="watchPartyError" class="mt-3 text-sm text-red-300">{{ watchPartyError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import GilAdsVideoPlayer from '~/app/components/ads/GilAdsVideoPlayer.vue'
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import GilAdsBanner from '~/app/components/ads/GilAdsBanner.vue'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import CommentNode from '~/app/components/comments/CommentNode.vue'
import GiphyPicker from '~/app/components/GiphyPicker.vue'
import AddToPlaylistModal from '~/app/components/AddToPlaylistModal.vue'
import { GILADS_PLACEMENTS } from '~/app/service/gilads'
import { getVideo, getRelatedVideos, incrementViews, likeVideo, unlikeVideo, checkIfLiked, getWatchProgress, getWatchProgressMap, saveWatchProgress, createVideoClip, getVideoClips, downloadVideo as downloadVideoService } from '~/app/service/videos'
import { getSeries, getSeriesEpisodeContext, getSeriesTrailerContext, suggestSeriesEpisodeIntro } from '~/app/service/series'
import { getMovieVideoContext, getMovieTrailerContext } from '~/app/service/movies'
import { getMusicVideoContext, type MusicTrack } from '~/app/service/music'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import { createWatchParty } from '~/app/service/watchParties'
import { getVideoComments, postComment as apiPostComment, deleteComment, likeComment, unlikeComment } from '~/app/service/comments'
import { insertGiphyIntoComment, type GiphyGif } from '~/app/utils/giphy'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { imageVariantSrcset, imageVariantUrl, isVideo4K, isVideo8K, resolveAvatarUrl, resolveMediaUrl } from '~/app/utils/media'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRequestHeaders, navigateTo, setResponseStatus } from '#app'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const localePath = useLocalePath()
const { t } = useI18n()
const { pause: pauseMusicPlayback } = useMusicPlayer()
const hasCountedView = ref(false)
const requestHeaders = import.meta.server ? useRequestHeaders(['user-agent']) : {}
const isMobileUserAgent = (userAgent = '', maxTouchPoints = 0) => {
  const ua = String(userAgent || '')
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ||
    (/Macintosh/i.test(ua) && maxTouchPoints > 1)
}
const isMobileWatchDevice = ref(isMobileUserAgent(import.meta.server ? requestHeaders['user-agent'] : ''))

const isLoggedIn = ref(false)
const userId = ref('')
const activeAccount = ref('personal')
const activeChannelName = ref('')
const userChannels = ref<any[]>([])
const personalAccountSelectedChannel = ref('')
const selectedChannelName = ref('')
const failedCommentAvatars = ref({})
type DescriptionPart = {
  text: string
  href?: string
}

const comments = ref<any[]>([])
const newCommentText = ref('')
const isPostingComment = ref(false)
const postingReplyForCommentId = ref<Record<string, boolean>>({})
const togglingCommentLikeMap = ref<Record<string, boolean>>({})
const showCreateChannelDialog = ref(false)
const showErrorDialog = ref(false)
const errorMessage = ref('')

const likes = ref(0)
const isLiked = ref(false)
const isToggglingLike = ref(false)
const isDownloadingVideo = ref(false)
const downloadStatus = ref('')

const showExplicitWarning = ref(false)
const explicitWarningAccepted = ref(false)
const neverShowExplicitWarningAgain = ref(false)
const highlightedCommentId = ref('')
const pendingJumpCommentID = ref('')
const showGiphyPicker = ref(false)
const showAddToPlaylist = ref(false)
const showWatchPartyDialog = ref(false)
const showVideoActionMenu = ref(false)
const showIntroSuggestionDialog = ref(false)
const introSuggestionStart = ref(0)
const introSuggestionEnd = ref(0)
const introSuggestionNote = ref('')
const introSuggestionSubmitting = ref(false)
const introSuggestionError = ref('')
const introSuggestionSuccess = ref('')
const introSuggestionPreviewing = ref(false)
const introSuggestionPlayerRef = ref<any>(null)
const introSuggestionCurrentTime = ref(0)
const introSuggestionDuration = ref(0)
const introSuggestionInitialTime = ref(0)
const introSuggestionPlayerKey = ref('')
const watchPartyVisibility = ref<'public' | 'private'>('private')
const watchPartyType = ref<'single' | 'queue'>('queue')
const creatingWatchParty = ref(false)
const watchPartyError = ref('')
const trailerSeries = ref<any | null>(null)
const currentSeries = ref<any | null>(null)
const trailerMovie = ref<any | null>(null)
const currentMovie = ref<any | null>(null)
const currentMusicTrack = ref<MusicTrack | null>(null)

const showSidebar = ref(true)

const relatedVideos = ref<any[]>([])
const watchProgressByVideoId = ref<Record<string, any>>({})
const carouselContainer = ref<HTMLElement | null>(null)

// Playlist playback mode
const isPlayingFromPlaylist = ref(false)
const isPlayingFromSeries = ref(false)
const currentPlaylistId = ref('')
const currentPlaylistName = ref('')
const playlistVideos = ref<any[]>([])
const currentVideoIndex = ref(0)
const isPlaylistQueueExpanded = ref(false)
const resumeStartSeconds = ref(0)
const isDescriptionExpanded = ref(false)
let lastWatchProgressSaveAt = 0

const videoPlayerRef = ref<any>(null)
const clipEditorRef = ref<HTMLElement | null>(null)
const clipTrackRef = ref<HTMLElement | null>(null)
const clipsOfThisVideo = ref<any[]>([])
const isClipMode = ref(false)
const isPublishingClip = ref(false)
const clipError = ref('')
const clipTitle = ref('')
const clipStart = ref(0)
const clipEnd = ref(0)
const clipZoom = ref(4)
const playerCurrentTime = ref(0)
const playerDuration = ref(0)
const clipPlayerPaused = ref(true)
const activeClipDrag = ref<'start' | 'end' | 'playhead' | null>(null)
const clipDragViewportStart = ref<number | null>(null)
const clipDragViewportEnd = ref<number | null>(null)
const MAX_CLIP_SECONDS = 30
const MIN_CLIP_SOURCE_SECONDS = 120

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const clipAttributionName = computed(() => video.value?.clip?.clipped_by_channel || video.value?.clip?.clipped_by_username || 'User')
const originalVideoLink = computed(() => localePath(`/video/${video.value?.clip?.original_video_id || ''}`))
const clipVideoLink = (clipId: string) => localePath(`/video/${clipId}`)
const isClipVideo = computed(() => Boolean(video.value?.clip?.original_video_id))
const isMovieOrSeriesContext = computed(() => Boolean(
  route.query.series_id ||
  route.query.movie_id ||
  currentSeries.value ||
  trailerSeries.value ||
  currentMovie.value ||
  trailerMovie.value ||
  video.value?.categories?.some((category: any) => ['movies', 'series'].includes(String(category.slug || '').toLowerCase()))
))
const canCreateClip = computed(() => isLoggedIn.value && !isClipVideo.value && !isMovieOrSeriesContext.value && Number(playerDuration.value || 0) >= MIN_CLIP_SOURCE_SECONDS)
const canPreviewIntroSuggestion = computed(() => Number(introSuggestionEnd.value || 0) > Number(introSuggestionStart.value || 0))
const clipTitlePlaceholder = computed(() => `Clip: ${watchDisplayTitle.value || ''}`)
const clipPlaybackStart = computed(() => isClipVideo.value ? Number(video.value?.clip?.start_seconds || 0) : (isClipMode.value ? clipStart.value : 0))
const clipPlaybackEnd = computed(() => isClipVideo.value ? Number(video.value?.clip?.end_seconds || 0) : (isClipMode.value ? clipEnd.value : 0))
const clipViewportSpan = computed(() => {
  const duration = Number(playerDuration.value || 0)
  if (duration <= 0) return 1
  const zoom = clampNumber(Number(clipZoom.value || 1), 1, 12)
  return Math.max(MAX_CLIP_SECONDS, duration / zoom)
})
const clipViewportCenter = computed(() => {
  const selectionCenter = clipStart.value + Math.max(0, clipEnd.value - clipStart.value) / 2
  return Number.isFinite(selectionCenter) ? selectionCenter : playerCurrentTime.value
})
const clipViewportStart = computed(() => {
  const duration = Number(playerDuration.value || 0)
  const span = Math.min(duration || 1, clipViewportSpan.value)
  return clampNumber(clipViewportCenter.value - span / 2, 0, Math.max(0, duration - span))
})
const clipViewportEnd = computed(() => Math.min(Number(playerDuration.value || 0), clipViewportStart.value + clipViewportSpan.value))
const clipPercent = (seconds: number) => {
  const span = Math.max(1, clipViewportEnd.value - clipViewportStart.value)
  return clampNumber(((seconds - clipViewportStart.value) / span) * 100, 0, 100)
}
const clipSelectionStyle = computed(() => ({ left: `${clipPercent(clipStart.value)}%`, width: `${Math.max(0, clipPercent(clipEnd.value) - clipPercent(clipStart.value))}%` }))
const clipStartHandleStyle = computed(() => ({ left: `${clipPercent(clipStart.value)}%` }))
const clipEndHandleStyle = computed(() => ({ left: `${clipPercent(clipEnd.value)}%` }))
const clipPlayheadStyle = computed(() => ({ left: `${clipPercent(playerCurrentTime.value)}%` }))
const formatClipTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(Number(seconds || 0)))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}
const formatClipDuration = (clip: any) => formatClipTime(Number(clip?.clip?.end_seconds || 0) - Number(clip?.clip?.start_seconds || 0))


const normalizeVideoDescription = (value: unknown) => String(value || '')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n')
  .trim()

const linkifyDescriptionText = (text: string): DescriptionPart[] => {
  const parts: DescriptionPart[] = []
  const urlPattern = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) })
    }

    let urlText = match[0]
    let trailingText = ''
    while (/[.,!?;:)\]}]$/.test(urlText)) {
      trailingText = urlText.slice(-1) + trailingText
      urlText = urlText.slice(0, -1)
    }

    if (urlText) {
      parts.push({
        text: urlText,
        href: /^https?:\/\//i.test(urlText) ? urlText : `https://${urlText}`
      })
    }
    if (trailingText) {
      parts.push({ text: trailingText })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) })
  }

  return parts.length ? parts : [{ text }]
}

const playlistQueueVideos = computed(() => {
  if (!playlistVideos.value.length) return []

  if (isPlaylistQueueExpanded.value || playlistVideos.value.length <= 3) {
    return playlistVideos.value.map((video: any, index: number) => ({ video, index }))
  }

  const start = Math.max(0, currentVideoIndex.value - 1)
  const end = Math.min(playlistVideos.value.length, currentVideoIndex.value + 2)

  return playlistVideos.value.slice(start, end).map((video: any, offset: number) => ({
    video,
    index: start + offset
  }))
})

const isQueuePlayback = computed(() => isPlayingFromPlaylist.value || isPlayingFromSeries.value)
const hasNextQueueVideo = computed(() => isQueuePlayback.value && currentVideoIndex.value < playlistVideos.value.length - 1)
const queueHeading = computed(() => isPlayingFromSeries.value ? 'Playing series' : t('playlists.playingFrom'))
const queueSourceLink = computed(() => {
  if (isPlayingFromSeries.value) return localePath('/category/series')
  return localePath(`/playlists/${currentPlaylistId.value}`)
})
const currentSeriesEpisode = computed(() => {
  if (!isPlayingFromSeries.value) return null
  return playlistVideos.value[currentVideoIndex.value] || null
})
const canSuggestIntro = computed(() => Boolean(isLoggedIn.value && !isClipVideo.value && currentSeriesEpisode.value?.series_episode_id))
const hasOverflowActions = computed(() => canSuggestIntro.value)
const currentEpisodeLabel = computed(() => {
  const episode = currentSeriesEpisode.value
  if (!episode) return ''
  return `Season ${episode.season_number} | Episode ${episode.episode_number}`
})
const getTrailerSeriesPosterUrl = (posterUrl: string) => {
  return resolveMediaUrl(posterUrl, '/videos/placeholder-thumbnail.jpg')
}

const watchProgressPercent = (progress: any) => {
  const position = Number(progress?.position_seconds || 0)
  const duration = Number(progress?.duration_seconds || 0)
  if (progress?.completed || !Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return 0
  if (position <= 5 || position / duration >= 0.9) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

const videoProgressPercent = (videoId: string) => watchProgressPercent(watchProgressByVideoId.value[videoId])

const loadProgressForVideos = async (videoIds: string[]) => {
  if (!isLoggedIn.value) return
  const missingIds = [...new Set((videoIds || []).filter((videoId) => videoId && !watchProgressByVideoId.value[videoId]))]
  if (!missingIds.length) return
  try {
    const data = await getWatchProgressMap(missingIds)
    watchProgressByVideoId.value = {
      ...watchProgressByVideoId.value,
      ...(data?.progress || {}),
    }
  } catch (err) {
    console.error('Failed to load watch progress:', err)
  }
}
const getClipTimeFromPointer = (event: PointerEvent) => {
  const track = clipTrackRef.value
  const duration = Number(playerDuration.value || 0)
  if (!track || duration <= 0) return 0
  const rect = track.getBoundingClientRect()
  const percent = clampNumber((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
  const viewportStart = clipDragViewportStart.value ?? clipViewportStart.value
  const viewportEnd = clipDragViewportEnd.value ?? clipViewportEnd.value
  return clampNumber(viewportStart + percent * Math.max(1, viewportEnd - viewportStart), 0, duration)
}

const seekClipPreview = (seconds: number) => {
  const next = clampNumber(seconds, 0, Number(playerDuration.value || 0))
  playerCurrentTime.value = next
  videoPlayerRef.value?.setPlaybackTime?.(next)
}

const updateClipDrag = (event: PointerEvent) => {
  if (!activeClipDrag.value) return
  const nextTime = getClipTimeFromPointer(event)
  const duration = Number(playerDuration.value || 0)

  if (activeClipDrag.value === 'start') {
    clipStart.value = clampNumber(nextTime, 0, Math.max(0, clipEnd.value - 1))
    if (clipEnd.value - clipStart.value > MAX_CLIP_SECONDS) {
      clipEnd.value = Math.min(duration, clipStart.value + MAX_CLIP_SECONDS)
    }
    seekClipPreview(clipStart.value)
  } else if (activeClipDrag.value === 'end') {
    clipEnd.value = clampNumber(nextTime, Math.min(duration, clipStart.value + 1), duration)
    if (clipEnd.value - clipStart.value > MAX_CLIP_SECONDS) {
      clipStart.value = Math.max(0, clipEnd.value - MAX_CLIP_SECONDS)
    }
    seekClipPreview(clampNumber(playerCurrentTime.value, clipStart.value, Math.max(clipStart.value, clipEnd.value - 0.1)))
  } else {
    seekClipPreview(clampNumber(nextTime, clipStart.value, clipEnd.value))
  }
}

const stopClipDrag = () => {
  activeClipDrag.value = null
  clipDragViewportStart.value = null
  clipDragViewportEnd.value = null
  window.removeEventListener('pointermove', updateClipDrag)
  window.removeEventListener('pointerup', stopClipDrag)
}

const startClipDrag = (type: 'start' | 'end' | 'playhead', event: PointerEvent) => {
  clipDragViewportStart.value = clipViewportStart.value
  clipDragViewportEnd.value = clipViewportEnd.value
  activeClipDrag.value = type
  updateClipDrag(event)
  window.addEventListener('pointermove', updateClipDrag)
  window.addEventListener('pointerup', stopClipDrag)
}

const handleClipTrackPointerDown = (event: PointerEvent) => {
  startClipDrag('playhead', event)
}

const startClipMode = async () => {
  if (!canCreateClip.value) return
  const state = videoPlayerRef.value?.getPlaybackState?.()
  const current = Number(state?.currentTime || playerCurrentTime.value || 0)
  const duration = Number(state?.duration || playerDuration.value || 0)
  playerDuration.value = duration
  clipStart.value = clampNumber(current, 0, Math.max(0, duration - 1))
  clipEnd.value = clampNumber(Math.min(clipStart.value + Math.min(15, MAX_CLIP_SECONDS), duration), clipStart.value + 1, duration)
  clipZoom.value = duration > 900 ? 8 : duration > 240 ? 6 : 4
  clipTitle.value = watchDisplayTitle.value ? `Clip: ${watchDisplayTitle.value}` : ''
  clipError.value = ''
  isClipMode.value = true
  seekClipPreview(clipStart.value)
  videoPlayerRef.value?.pauseAt?.(clipStart.value)
  clipPlayerPaused.value = true
  await nextTick()
  clipEditorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const cancelClipMode = () => {
  isClipMode.value = false
  clipError.value = ''
  stopClipDrag()
}

const toggleClipPlayback = () => {
  if (!isClipMode.value) return
  const state = videoPlayerRef.value?.getPlaybackState?.()
  const paused = Boolean(state?.paused ?? clipPlayerPaused.value)
  if (paused) {
    const startAt = playerCurrentTime.value < clipStart.value || playerCurrentTime.value >= clipEnd.value ? clipStart.value : playerCurrentTime.value
    videoPlayerRef.value?.playFrom?.(startAt)
    clipPlayerPaused.value = false
  } else {
    videoPlayerRef.value?.pauseAt?.(playerCurrentTime.value)
    clipPlayerPaused.value = true
  }
}

const publishClip = async () => {
  if (!isLoggedIn.value || !canCreateClip.value) return
  clipError.value = ''
  isPublishingClip.value = true
  try {
    const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
    const channelId = isPersonalAccount ? personalAccountSelectedChannel.value : activeAccount.value
    const res = await createVideoClip(id, {
      startSeconds: clipStart.value,
      endSeconds: clipEnd.value,
      title: clipTitle.value,
      channelId,
    })
    isClipMode.value = false
    if (res?.id) {
      await navigateTo(localePath(`/video/${res.id}`))
    }
  } catch (err: any) {
    clipError.value = err?.response?.data?.error || err?.message || 'Failed to publish clip'
  } finally {
    isPublishingClip.value = false
  }
}

const loadClipsOfThisVideo = async () => {
  if (isClipVideo.value) return
  try {
    clipsOfThisVideo.value = await getVideoClips(id)
  } catch (err) {
    console.error('Failed to load video clips:', err)
    clipsOfThisVideo.value = []
  }
}

const queueVideoLink = (videoId: string, index: number) => {
  if (isPlayingFromSeries.value) {
    return localePath(`/video/${videoId}?series_id=${currentPlaylistId.value}&index=${index}`)
  }
  return localePath(`/video/${videoId}?playlist_id=${currentPlaylistId.value}&index=${index}`)
}

const commentsById = computed(() => {
  const map: Record<string, any> = {}

  const visit = (items: any[]) => {
    for (const item of items || []) {
      map[item.id] = item
      if (item.replies?.length) visit(item.replies)
    }
  }

  visit(comments.value || [])
  return map
})

const targetCommentId = computed(() => {
  const raw = route.query.comment
  if (Array.isArray(raw)) {
    return (raw[0] || '').trim()
  }
  return typeof raw === 'string' ? raw.trim() : ''
})

const desktopCarouselContainer = ref<HTMLElement | null>(null)

const scrollCarousel = (direction: 'left' | 'right', containerRef: typeof carouselContainer = carouselContainer) => {
  if (!containerRef.value) return
  const scrollAmount = 300
  const newScroll = containerRef.value.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
  containerRef.value.scrollTo({ left: newScroll, behavior: 'smooth' })
}

const loadChannelsForAccount = () => {
  const storedChannels = localStorage.getItem('user_channels')
  if (storedChannels) {
    try {
      userChannels.value = JSON.parse(storedChannels)
      console.log('Loaded channels:', userChannels.value.map(c => c.id))
      
      if (!personalAccountSelectedChannel.value && userChannels.value.length > 0) {
        personalAccountSelectedChannel.value = userChannels.value[0].id
      } else if (personalAccountSelectedChannel.value && !userChannels.value.find(ch => ch.id === personalAccountSelectedChannel.value)) {
        personalAccountSelectedChannel.value = userChannels.value.length > 0 ? userChannels.value[0].id : ''
      }
    } catch (e) {
      console.error('Failed to parse channels:', e)
      userChannels.value = []
      personalAccountSelectedChannel.value = ''
    }
  } else {
    userChannels.value = []
    personalAccountSelectedChannel.value = ''
  }
}

const syncActiveAccountFromStorage = async () => {
  const storedActiveAccount = localStorage.getItem('active_account') || 'personal'
  const storedAccountName = localStorage.getItem('active_account_name')
  
  if (storedActiveAccount !== activeAccount.value) {
    console.log('Account changed from', activeAccount.value, 'to', storedActiveAccount)
    activeAccount.value = storedActiveAccount
    activeChannelName.value = storedAccountName || 'Channel'
    
    loadChannelsForAccount()
    
    if (isLoggedIn.value) {
      try {
        const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
        const likeChannelId = isPersonalAccount ? userId.value : activeAccount.value
        if (likeChannelId) {
          const likeData = await checkIfLiked(id, likeChannelId)
          isLiked.value = likeData.liked
          console.log('Re-checked like status after account sync:', { isPersonalAccount, likeChannelId, isLiked: isLiked.value })
        }
      } catch (err) {
        console.error('Failed to re-check like status:', err)
      }
    }
  }
}

watch([() => activeAccount.value, () => personalAccountSelectedChannel.value], () => {
  const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
  const channelId = isPersonalAccount ? personalAccountSelectedChannel.value : activeAccount.value
  const channel = userChannels.value.find(ch => ch.id === channelId)
  if (channel) {
    selectedChannelName.value = channel.name
  } else {
    selectedChannelName.value = activeChannelName.value
  }
})

console.log('Loading video ID:', id)
const { data: video, error: videoLoadError } = await useAsyncData(`video-${id}`, () =>
  getVideo(id)
)
const videoNotFound = computed(() => {
  const loadError = videoLoadError.value as any
  const status = Number(loadError?.statusCode || loadError?.response?.status || 0)
  return status === 404 || (!video.value && Boolean(videoLoadError.value))
})
const canAutoplayWatchVideo = computed(() => !video.value?.explicit || explicitWarningAccepted.value)

if (import.meta.server && videoNotFound.value) {
  setResponseStatus(404)
}

const videoDescriptionText = computed(() => normalizeVideoDescription(video.value?.description))
const descriptionBlocks = computed(() => videoDescriptionText.value
  .split(/\n{2,}/)
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => linkifyDescriptionText(block))
)
const descriptionIsLong = computed(() => {
  const description = videoDescriptionText.value
  return description.length > 320 || description.split('\n').length > 5
})
const mediaRegistryTitle = computed(() => {
  const episode = isPlayingFromSeries.value ? playlistVideos.value[currentVideoIndex.value] : null
  const episodeTitle = String(episode?.title || '').trim()
  if (episodeTitle) return episodeTitle

  const movieTitle = String(currentMovie.value?.title || '').trim()
  if (movieTitle) return movieTitle

  return ''
})
const watchDisplayTitle = computed(() => mediaRegistryTitle.value || video.value?.title || '')

if (video.value) {
  const siteUrl = import.meta.server
    ? (() => { const headers = useRequestHeaders(['host', 'x-forwarded-proto']); return `${headers['x-forwarded-proto'] || 'http'}://${headers.host || 'localhost:3000'}`; })()
    : typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  
  useMetaTags({
    title: watchDisplayTitle.value,
    description: video.value.description,
    image: video.value.thumbnail_url ? `${siteUrl}${video.value.thumbnail_url}` : undefined,
    url: `${siteUrl}/video/${id}`
  })
}

watch(() => video.value?.id, () => {
  isDescriptionExpanded.value = false
})

watch(() => video.value, (newVideo) => {
  if (newVideo && newVideo.likes !== undefined) {
    likes.value = newVideo.likes
  }
}, { deep: true, immediate: true })

watch([() => activeAccount.value], async () => {
  if (!isLoggedIn.value) return
  
  try {
    const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
    const likeChannelId = isPersonalAccount ? userId.value : activeAccount.value
    
    console.log('Checking like status:', { isPersonalAccount, likeChannelId, activeAccount: activeAccount.value })
    
    if (likeChannelId) {
      const likeData = await checkIfLiked(id, likeChannelId)
      isLiked.value = likeData.liked
      console.log('Like status updated:', isLiked.value)
    }

    const commentActorId = getCurrentCommentActorID()
    comments.value = await getVideoComments(id, commentActorId || undefined)
    comments.value.reverse()
  } catch (err) {
    console.error('Failed to check like status:', err)
  }
})

const onVideoPlay = async () => {
  if (showExplicitWarning.value) {
    pauseWatchPlayerForExplicitWarning()
    return
  }

  pauseMusicPlayback()

  if (hasCountedView.value) return
  hasCountedView.value = true
  
  try {
    await incrementViews(id)
  } catch (err) {
    console.error('Failed to increment views:', err)
  }
}

const loadWatchResume = async () => {
  resumeStartSeconds.value = 0
  if (!isLoggedIn.value) return
  const startOverQuery = route.query.start_over
  if (startOverQuery === '1' || startOverQuery === 'true') return

  try {
    const data = await getWatchProgress(id)
    const progress = data?.progress
    if (!progress || progress.completed) return

    const position = Number(progress.position_seconds || 0)
    const durationSeconds = Number(progress.duration_seconds || 0)
    if (durationSeconds > 0 && position > 5 && position / durationSeconds < 0.9) {
      resumeStartSeconds.value = position
    }
  } catch (err) {
    console.error('Failed to load watch progress:', err)
  }
}

const handleWatchProgress = async (payload: { currentTime: number, duration: number }) => {
  playerCurrentTime.value = Number(payload.currentTime || 0)
  playerDuration.value = Number(payload.duration || 0)
  const state = videoPlayerRef.value?.getPlaybackState?.()
  clipPlayerPaused.value = Boolean(state?.paused ?? clipPlayerPaused.value)
  if (!isLoggedIn.value) return
  const now = Date.now()
  if (now - lastWatchProgressSaveAt < 10000) return
  if (!payload.duration || payload.duration <= 0) return

  lastWatchProgressSaveAt = now
  try {
    await saveWatchProgress(id, {
      positionSeconds: payload.currentTime,
      durationSeconds: payload.duration,
    })
  } catch (err) {
    console.error('Failed to save watch progress:', err)
  }
}

const handleWatchSeeked = (payload: { currentTime: number }) => {
  playerCurrentTime.value = Number(payload.currentTime || 0)
}

const handleIntroSuggestionProgress = (payload: { currentTime: number, duration: number }) => {
  introSuggestionCurrentTime.value = Number(payload.currentTime || 0)
  introSuggestionDuration.value = Number(payload.duration || 0)
  if (introSuggestionPreviewing.value && introSuggestionCurrentTime.value >= Number(introSuggestionEnd.value || 0)) {
    introSuggestionPlayerRef.value?.pauseAt?.(Number(introSuggestionEnd.value || 0))
    introSuggestionPreviewing.value = false
  }
}

const handleIntroSuggestionSeeked = (payload: { currentTime: number }) => {
  introSuggestionCurrentTime.value = Number(payload.currentTime || 0)
}

const videoSrc = computed(() => {
  const path = video.value?.hls_path
  return resolveMediaUrl(path)
})

const is4K = computed(() => isVideo4K(video.value?.width))
const is8K = computed(() => isVideo8K(video.value?.width))

const pauseWatchPlayerForExplicitWarning = () => {
  videoPlayerRef.value?.pauseAt?.()
}

const updateSidebarVisibility = () => {
  showSidebar.value = typeof window !== 'undefined' && window.innerWidth >= 1024
}

onMounted(async () => {
  isMobileWatchDevice.value = isMobileUserAgent(navigator.userAgent, navigator.maxTouchPoints)
  updateSidebarVisibility()
  window.addEventListener('resize', updateSidebarVisibility)
  
  const hideExplicitWarnings = localStorage.getItem('hide_explicit_warnings') === 'true'
  
  if (video.value?.explicit && !hideExplicitWarnings) {
    showExplicitWarning.value = true
    explicitWarningAccepted.value = false
    await nextTick()
    pauseWatchPlayerForExplicitWarning()
  } else {
    explicitWarningAccepted.value = true
  }
  
  const storedUserId = localStorage.getItem('user_id')
  userId.value = storedUserId || ''
  isLoggedIn.value = !!storedUserId
  
  if (isLoggedIn.value && !localStorage.getItem('active_account')) {
    localStorage.setItem('active_account', userId.value)
    localStorage.setItem('active_account_name', 'Personal')
  }
  
  syncActiveAccountFromStorage()
  await loadWatchResume()

  // Check if playing from playlist
  const seriesId = route.query.series_id
  const playlistId = route.query.playlist_id
  const playlistIndex = route.query.index
  if (seriesId && typeof seriesId === 'string') {
    isPlayingFromSeries.value = true
    currentPlaylistId.value = seriesId
    await loadSeries(seriesId)
    if (playlistIndex && typeof playlistIndex === 'string') {
      const indexNum = parseInt(playlistIndex, 10)
      if (!isNaN(indexNum) && indexNum >= 0 && indexNum < playlistVideos.value.length) {
        currentVideoIndex.value = indexNum
      }
    }
  } else if (playlistId && typeof playlistId === 'string') {
    isPlayingFromPlaylist.value = true
    currentPlaylistId.value = playlistId
    await loadPlaylist(playlistId)
    // Use the index from URL if provided, otherwise search for current video
    if (playlistIndex && typeof playlistIndex === 'string') {
      const indexNum = parseInt(playlistIndex, 10)
      if (!isNaN(indexNum) && indexNum >= 0 && indexNum < playlistVideos.value.length) {
        currentVideoIndex.value = indexNum
      }
    }
  } else {
    await loadSeriesContextForVideo()
    if (!isPlayingFromSeries.value) {
      await loadMovieContextForVideo()
    }
  }

  if (!isPlayingFromSeries.value) {
    await loadTrailerContextForVideo()
  }
  await loadMusicContextForVideo()

  try {
    const commentActorId = getCurrentCommentActorID()
    comments.value = await getVideoComments(id, commentActorId || undefined)
    comments.value.reverse()
  } catch (err) {
    console.error('Failed to load comments:', err)
  }

  // Check like status if logged in
  if (isLoggedIn.value) {
    try {
      const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
      const likeChannelId = isPersonalAccount ? userId.value : activeAccount.value
      if (likeChannelId) {
        const likeData = await checkIfLiked(id, likeChannelId)
        isLiked.value = likeData.liked
      }
    } catch (err) {
      console.error('Failed to check like status:', err)
    }
  }

  // Always load related videos so mobile can still surface recommendations during playlist playback
  try {
    relatedVideos.value = await getRelatedVideos(id, 10)
    void loadProgressForVideos(relatedVideos.value.map((relatedVideo: any) => relatedVideo.id))
  } catch (err) {
    console.error('Failed to load related videos:', err)
  }

  await loadClipsOfThisVideo()

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'active_account' || e.key === 'active_account_name' || e.key === 'user_channels') {
      syncActiveAccountFromStorage()
    }
  }
  
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      syncActiveAccountFromStorage()
    }
  }
  
  const accountCheckInterval = setInterval(() => {
    syncActiveAccountFromStorage()
  }, 300)
  
  window.addEventListener('storage', handleStorageChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // Cleanup listeners on unmount
  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('resize', updateSidebarVisibility)
    clearInterval(accountCheckInterval)
    stopClipDrag()
  })
})

// Get channel avatar URL with proper path construction
const getChannelAvatarUrl = (channelId: string): string => {
  const channel = userChannels.value.find(ch => ch.id === channelId)
  if (!channel?.avatar_url || !channel.avatar_url.trim()) return ''
  return resolveAvatarUrl(channel.avatar_url)
}

// Get comment avatar URL
const getCommentAvatarUrl = (avatarUrl: string): string => {
  if (!avatarUrl || !avatarUrl.trim()) return ''
  return resolveAvatarUrl(avatarUrl)
}

function navigateToChannel(channelId: string) {
  navigateTo(`/channel/${channelId}`)
}

// Clear when user logs out
watch(() => isLoggedIn.value, (loggedIn) => {
  if (!loggedIn) {
    console.log('User logged out')
    userId.value = ''
    personalAccountSelectedChannel.value = ''
    selectedChannelName.value = ''
    isLiked.value = false
  }
})

const toggleLike = async () => {
  if (!isLoggedIn.value) {
    console.log('Must be logged in to like')
    return
  }

  const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
  // For personal account, use userId directly. For channel accounts, use the channel ID
  const likeChannelId = isPersonalAccount ? userId.value : activeAccount.value
  
  if (!likeChannelId) {
    console.log('No user/channel ID for liking')
    return
  }

  isToggglingLike.value = true
  try {
    if (isLiked.value) {
      // Unlike
      await unlikeVideo(id, likeChannelId)
      isLiked.value = false
      likes.value = Math.max(0, likes.value - 1)
      console.log('Video unliked')
    } else {
      // Like
      await likeVideo(id, likeChannelId)
      isLiked.value = true
      likes.value += 1
      console.log('Video liked')
    }
  } catch (err) {
    console.error('Failed to toggle like:', err)
  } finally {
    isToggglingLike.value = false
  }
}

const shareCopied = ref(false)

const shareButtonText = computed(() => shareCopied.value ? t('video.shareCopied') : t('video.share'))

const shareVideo = async () => {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://giltube.gilservers.com'
    const sharePath = localePath(`/video/${id}`)
    const url = `${origin}${sharePath}`
    if (import.meta.client && navigator.share) {
      await navigator.share({ title: watchDisplayTitle.value || 'GilTube', url })
    } else if (import.meta.client && navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      shareCopied.value = true
      setTimeout(() => (shareCopied.value = false), 2000)
    }
  } catch (err) {
    console.error('Share failed:', err)
  }
}

const openIntroSuggestionDialog = () => {
  if (!canSuggestIntro.value) return
  const existingStart = Number(currentSeriesEpisode.value?.intro_start_seconds || 0)
  const existingEnd = Number(currentSeriesEpisode.value?.intro_end_seconds || 0)
  const playbackState = videoPlayerRef.value?.getPlaybackState?.()
  const current = Number(playbackState?.currentTime || playerCurrentTime.value || 0)

  introSuggestionStart.value = existingEnd > existingStart ? existingStart : Math.max(0, Number(current.toFixed(1)))
  introSuggestionEnd.value = existingEnd > existingStart ? existingEnd : Math.max(introSuggestionStart.value + 1, Number((introSuggestionStart.value + 90).toFixed(1)))
  introSuggestionInitialTime.value = introSuggestionStart.value || Math.max(0, Number(current.toFixed(1)))
  introSuggestionCurrentTime.value = introSuggestionInitialTime.value
  introSuggestionDuration.value = Number(playbackState?.duration || playerDuration.value || 0)
  introSuggestionPlayerKey.value = `${id}-${Date.now()}`
  introSuggestionNote.value = ''
  introSuggestionError.value = ''
  introSuggestionSuccess.value = ''
  introSuggestionPreviewing.value = false
  showVideoActionMenu.value = false
  videoPlayerRef.value?.pauseAt?.(current)
  showIntroSuggestionDialog.value = true
}

const closeIntroSuggestionDialog = () => {
  showIntroSuggestionDialog.value = false
  introSuggestionSubmitting.value = false
  introSuggestionPreviewing.value = false
  introSuggestionPlayerRef.value?.pauseAt?.()
}

const setIntroSuggestionPoint = (point: 'start' | 'end') => {
  const playbackState = introSuggestionPlayerRef.value?.getPlaybackState?.()
  const value = Math.max(0, Number((Number(playbackState?.currentTime || introSuggestionCurrentTime.value || 0)).toFixed(2)))

  if (point === 'start') {
    introSuggestionStart.value = value
    if (introSuggestionEnd.value < value) {
      introSuggestionEnd.value = value
    }
    return
  }

  introSuggestionEnd.value = value
  if (introSuggestionStart.value > value) {
    introSuggestionStart.value = value
  }
}

const previewIntroSuggestionRange = async () => {
  if (!canPreviewIntroSuggestion.value) {
    introSuggestionError.value = t('video.introSuggestion.invalidTiming')
    return
  }
  introSuggestionError.value = ''
  introSuggestionPreviewing.value = true
  try {
    await introSuggestionPlayerRef.value?.playFrom?.(Number(introSuggestionStart.value || 0))
  } catch {
    introSuggestionPreviewing.value = false
  }
}

const submitIntroSuggestion = async () => {
  if (!canSuggestIntro.value || introSuggestionSubmitting.value) return
  introSuggestionError.value = ''
  introSuggestionSuccess.value = ''

  const start = Number(introSuggestionStart.value)
  const end = Number(introSuggestionEnd.value)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
    introSuggestionError.value = t('video.introSuggestion.invalidTiming')
    return
  }

  introSuggestionSubmitting.value = true
  try {
    await suggestSeriesEpisodeIntro(id, {
      introStartSeconds: start,
      introEndSeconds: end,
      note: introSuggestionNote.value,
    })
    introSuggestionSuccess.value = t('video.introSuggestion.saved')
    setTimeout(() => {
      if (introSuggestionSuccess.value) closeIntroSuggestionDialog()
    }, 900)
  } catch (err: any) {
    introSuggestionError.value = err?.response?.data?.error || err?.message || t('video.introSuggestion.saveError')
  } finally {
    introSuggestionSubmitting.value = false
  }
}

const safeDownloadName = (name: string) => {
  const cleaned = String(name || 'giltube-video')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || 'giltube-video'
}

const downloadCurrentVideo = async () => {
  if (!video.value || isDownloadingVideo.value) return

  isDownloadingVideo.value = true
  downloadStatus.value = 'Preparing download...'
  try {
    const blob = await downloadVideoService(id, 'best', (status) => {
      downloadStatus.value = status
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeDownloadName(watchDisplayTitle.value || 'giltube-video')}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    downloadStatus.value = ''
  } catch (err: any) {
    console.error('Failed to download video:', err)
    downloadStatus.value = err?.message || 'Download failed'
    setTimeout(() => {
      if (!isDownloadingVideo.value) downloadStatus.value = ''
    }, 4000)
  } finally {
    isDownloadingVideo.value = false
  }
}

const activeWatchPartyChannelId = () => {
  const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
  return isPersonalAccount ? personalAccountSelectedChannel.value : activeAccount.value
}

const startWatchParty = async () => {
  if (isClipVideo.value) return

  if (!isLoggedIn.value) {
    await router.push(localePath('/login'))
    return
  }

  creatingWatchParty.value = true
  watchPartyError.value = ''

  try {
    const party = await createWatchParty({
      videoId: id,
      visibility: watchPartyVisibility.value,
      title: watchDisplayTitle.value || '',
      channelId: activeWatchPartyChannelId(),
      partyType: watchPartyType.value,
    })

    showWatchPartyDialog.value = false

    if (typeof window !== 'undefined') {
      localStorage.setItem('giltube:active-watch-party', JSON.stringify({
        id: party.id,
        title: watchDisplayTitle.value || t('watchParty.titleFallback'),
      }))
      window.dispatchEvent(new Event('giltube:watch-party-updated'))
    }

    await router.push(localePath(`/watch-party/${party.id}?room=1`))
  } catch (err: any) {
    watchPartyError.value = err?.response?.data?.error || err?.message || t('watchParty.errors.startFailed')
  } finally {
    creatingWatchParty.value = false
  }
}

const handleGiphySelect = (gif: GiphyGif) => {
  newCommentText.value = insertGiphyIntoComment(newCommentText.value, gif.images.downsized.url, gif.title)
}

const postComment = async () => {
  // Determine which channel to comment as
  const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
  const commentChannelId = isPersonalAccount ? personalAccountSelectedChannel.value : activeAccount.value
  
  if (!newCommentText.value.trim() || !isLoggedIn.value || !commentChannelId) {
    return
  }

  isPostingComment.value = true
  try {
    await apiPostComment(id, commentChannelId, newCommentText.value)
    newCommentText.value = ''
    
    // Reload comments
    comments.value = await getVideoComments(id, commentChannelId)
    comments.value.reverse()
  } catch (err) {
    console.error('Failed to post comment:', err)
  } finally {
    isPostingComment.value = false
  }
}

const postReply = async (parentCommentId: string, text: string) => {
  const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
  const commentChannelId = isPersonalAccount ? personalAccountSelectedChannel.value : activeAccount.value

  if (!isLoggedIn.value || !commentChannelId || !text) {
    return
  }

  postingReplyForCommentId.value[parentCommentId] = true
  try {
    await apiPostComment(id, commentChannelId, text, parentCommentId)
    comments.value = await getVideoComments(id, commentChannelId)
    comments.value.reverse()
  } catch (err) {
    console.error('Failed to post reply:', err)
  } finally {
    postingReplyForCommentId.value[parentCommentId] = false
  }
}

const getCurrentCommentActorID = () => {
  if (!isLoggedIn.value) return ''
  const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
  return isPersonalAccount ? personalAccountSelectedChannel.value : activeAccount.value
}

// Check if logged-in user owns a comment
const isCommentOwner = (comment: any) => {
  if (!isLoggedIn.value) return false

  const currentAccountId = getCurrentCommentActorID()

  return comment.channel.id === currentAccountId
}

// Delete a comment
const deleteUserComment = async (commentId: string) => {
  const findInThread = (items: any[], idToFind: string): any => {
    for (const item of items) {
      if (item.id === idToFind) return item
      if (item.replies?.length) {
        const found = findInThread(item.replies, idToFind)
        if (found) return found
      }
    }
    return null
  }

  const targetComment = findInThread(comments.value, commentId)
  if (!targetComment || !isCommentOwner(targetComment)) {
    return
  }
  
  if (!confirm('Are you sure you want to delete this comment?')) {
    return
  }
  
  try {
    await deleteComment(commentId)
    const commentActorId = getCurrentCommentActorID()
    comments.value = await getVideoComments(id, commentActorId || undefined)
    comments.value.reverse()
  } catch (err) {
    console.error('Failed to delete comment:', err)
    errorMessage.value = 'Failed to delete comment'
    showErrorDialog.value = true
  }
}

const updateCommentLikeInTree = (items: any[], commentId: string, nextLiked: boolean, nextLikes: number): boolean => {
  for (const item of items) {
    if (item.id === commentId) {
      item.liked_by_actor = nextLiked
      item.likes_count = nextLikes
      return true
    }
    if (Array.isArray(item.replies) && updateCommentLikeInTree(item.replies, commentId, nextLiked, nextLikes)) {
      return true
    }
  }
  return false
}

const toggleCommentLike = async (commentId: string, nextLiked: boolean) => {
  const actorId = getCurrentCommentActorID()
  if (!isLoggedIn.value || !actorId) return

  togglingCommentLikeMap.value[commentId] = true
  try {
    const res = nextLiked ? await likeComment(commentId, actorId) : await unlikeComment(commentId, actorId)
    const nextLikes = typeof res?.likes === 'number' ? res.likes : 0
    updateCommentLikeInTree(comments.value, commentId, !!res?.liked, nextLikes)
  } catch (err) {
    console.error('Failed to toggle comment like:', err)
  } finally {
    togglingCommentLikeMap.value[commentId] = false
  }
}

const jumpToComment = async (commentId: string) => {
  if (!import.meta.client || !commentId) return
  highlightedCommentId.value = commentId

  for (let attempt = 0; attempt < 10; attempt++) {
    await nextTick()
    const el = document.getElementById(`comment-${commentId}`) as HTMLElement | null
    if (el && (el.offsetParent !== null || el.getClientRects().length > 0)) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      break
    }
    await new Promise(resolve => setTimeout(resolve, 120))
  }

  window.setTimeout(() => {
    if (highlightedCommentId.value === commentId) {
      highlightedCommentId.value = ''
    }
  }, 1800)
}

watch(targetCommentId, async (newID) => {
  pendingJumpCommentID.value = newID
  if (!import.meta.client) return
  if (newID) {
    await jumpToComment(newID)
  }
}, { immediate: true })

watch(() => commentsById.value[pendingJumpCommentID.value], async (found) => {
  if (!import.meta.client) return
  if (!pendingJumpCommentID.value || !found) return
  const targetID = pendingJumpCommentID.value
  pendingJumpCommentID.value = ''
  await jumpToComment(targetID)
}, { immediate: true })

watch(showExplicitWarning, async (visible) => {
  if (!visible) return
  explicitWarningAccepted.value = false
  await nextTick()
  pauseWatchPlayerForExplicitWarning()
})

// Handle explicit warning
const continueToVideo = async () => {
  if (neverShowExplicitWarningAgain.value) {
    localStorage.setItem('hide_explicit_warnings', 'true')
  }
  explicitWarningAccepted.value = true
  showExplicitWarning.value = false
  await nextTick()
  await videoPlayerRef.value?.playFrom?.()
}

const goBackHome = async () => {
  await navigateTo(localePath('/'))
}

// Playlist methods
const handlePlaylistSelect = async (playlistId: string) => {
  const userID = localStorage.getItem('user_id')
  if (!userID) return

  try {
    const response = await fetch(`/api/v1/playlists/${playlistId}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userID
      },
      body: JSON.stringify({ video_id: id })
    })

    if (response.ok) {
      // Show success message
      errorMessage.value = t('playlists.addedToPlaylist') || 'Added to playlist'
      showErrorDialog.value = false
      showAddToPlaylist.value = false
      // Could show a toast notification here
    }
  } catch (error) {
    console.error('Failed to add video to playlist:', error)
    errorMessage.value = t('playlists.failedToAddToPlaylist') || 'Failed to add to playlist'
    showErrorDialog.value = true
  }
}

const handleCreateNewPlaylist = () => {
  // Close the add to playlist modal
  showAddToPlaylist.value = false
  // Optionally navigate to create playlist page
  navigateTo(localePath('/playlists'))
}

// Load playlist for playback mode
const loadPlaylist = async (playlistId: string) => {
  try {
    const response = await fetch(`/api/v1/playlists/${playlistId}`)
    if (response.ok) {
      const data = await response.json()
      const playlist = data.playlist || data
      currentPlaylistName.value = playlist.title
      playlistVideos.value = playlist.videos || data.videos || []
      
      // Find the current video index in the playlist
      const index = playlistVideos.value.findIndex(v => v.id === id)
      if (index !== -1) {
        currentVideoIndex.value = index
      }
      console.log('Loaded playlist:', { playlistId, videoCount: playlistVideos.value.length, currentIndex: currentVideoIndex.value })
    }
  } catch (err) {
    console.error('Failed to load playlist:', err)
  }
}

const normalizeSeriesEpisode = (episode: any) => ({
  ...(episode.video || {}),
  id: episode.video_id,
  title: episode.title || episode.video?.title,
  description: episode.synopsis || episode.video?.description,
  thumbnail_url: episode.video?.thumbnail_url,
  season_number: episode.season_number,
  episode_number: episode.episode_number,
  intro_start_seconds: episode.intro_start_seconds,
  intro_end_seconds: episode.intro_end_seconds,
  series_episode_id: episode.id,
})

const loadSeries = async (seriesId: string) => {
  try {
    const data = await getSeries(seriesId)
    currentSeries.value = data.series || null
    currentPlaylistName.value = data.series?.title || 'Series'
    playlistVideos.value = (data.episodes || []).map(normalizeSeriesEpisode)

    const index = playlistVideos.value.findIndex(v => v.id === id)
    if (index !== -1) {
      currentVideoIndex.value = index
    }
  } catch (err) {
    console.error('Failed to load series:', err)
  }
}

const loadSeriesContextForVideo = async () => {
  try {
    const data = await getSeriesEpisodeContext(id)
    isPlayingFromSeries.value = true
    currentSeries.value = data.series || null
    currentPlaylistId.value = data.series?.id || ''
    currentPlaylistName.value = data.series?.title || 'Series'
    playlistVideos.value = (data.episodes || []).map(normalizeSeriesEpisode)
    if (typeof data.current_index === 'number' && data.current_index >= 0) {
      currentVideoIndex.value = data.current_index
    }
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.error('Failed to load series context:', err)
    }
  }
}

const loadMovieContextForVideo = async () => {
  try {
    const data = await getMovieVideoContext(id)
    currentMovie.value = data.movie || null
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.error('Failed to load movie context:', err)
    }
  }
}

const loadMusicContextForVideo = async () => {
  try {
    const data = await getMusicVideoContext(id)
    currentMusicTrack.value = data.track || null
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.error('Failed to load music video context:', err)
    }
    currentMusicTrack.value = null
  }
}

const loadTrailerContextForVideo = async () => {
  try {
    const data = await getSeriesTrailerContext(id)
    trailerSeries.value = data.series || null
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.error('Failed to load series trailer context:', err)
    }
  }

  try {
    const data = await getMovieTrailerContext(id)
    trailerMovie.value = data.movie || null
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.error('Failed to load movie trailer context:', err)
    }
  }
}

// Skip to next video in playlist
const skipToNextVideo = async () => {
  if (!isQueuePlayback.value || !currentPlaylistId.value) {
    console.log('Cannot skip: not in queue mode or missing source id')
    return
  }
  
  if (currentVideoIndex.value >= playlistVideos.value.length - 1) {
    console.log('Already at last video')
    return
  }
  
  const nextVideo = playlistVideos.value[currentVideoIndex.value + 1]
  if (nextVideo) {
    console.log('Skipping to next video:', nextVideo.id)
    await navigateTo(queueVideoLink(nextVideo.id, currentVideoIndex.value + 1))
  }
}

// Autoplay next video when current ends
const handleVideoEnded = async () => {
  console.log('Video ended. isQueuePlayback:', isQueuePlayback.value, 'currentIndex:', currentVideoIndex.value, 'total:', playlistVideos.value.length)
  if (!isQueuePlayback.value) return
  
  if (currentVideoIndex.value < playlistVideos.value.length - 1) {
    await skipToNextVideo()
  }
}
</script>

<style scoped>
.music-attribution {
  overflow: hidden;
  border: 1px solid rgb(39 39 42);
  border-radius: 8px;
  background: rgb(24 24 27 / 72%);
}

.music-attribution-heading {
  padding: 14px 16px 10px;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.music-attribution-track {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 0 16px 14px;
}

.music-attribution-cover {
  display: grid;
  width: 88px;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: rgb(39 39 42);
}

.music-attribution-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-attribution-cover svg {
  width: 34px;
  fill: rgb(161 161 170);
}

.music-attribution-details {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.45;
}

.music-attribution-title,
.music-attribution-link {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-attribution-title {
  font-size: 1rem;
  font-weight: 650;
  color: white;
}

.music-attribution-link {
  font-size: 0.875rem;
  color: rgb(161 161 170);
}

.music-attribution-title:hover,
.music-attribution-link:hover {
  color: rgb(252 165 165);
}

.music-attribution-listen {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgb(82 82 91);
  border-radius: 999px;
  padding: 8px 13px;
  font-size: 0.875rem;
  font-weight: 650;
  color: rgb(228 228 231);
  transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
}

.music-attribution-listen:hover {
  border-color: rgb(239 68 68);
  background: rgb(127 29 29 / 24%);
  color: white;
}

.music-attribution-listen svg {
  width: 16px;
  fill: currentColor;
}

.music-attribution-copyright {
  border-top: 1px solid rgb(39 39 42);
  padding: 10px 16px 12px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: rgb(113 113 122);
}

.watch-player-shell :deep(.video-player-container),
.watch-player-shell :deep(.gilads-preroll-container) {
  height: 230px;
}

.mobile-watch-layout {
  --watch-mobile-gutter: 0.75rem;
}

.mobile-watch-layout .watch-player-shell {
  width: calc(100% + (var(--watch-mobile-gutter) * 2));
  margin-top: calc(var(--watch-mobile-gutter) * -1);
  margin-inline: calc(var(--watch-mobile-gutter) * -1);
}

.mobile-watch-layout .watch-player-shell :deep(.video-player-container),
.mobile-watch-layout .watch-player-shell :deep(.gilads-preroll-container) {
  border-radius: 0;
}

.intro-suggestion-player :deep(.video-player-container) {
  height: min(52vw, 360px);
  min-height: 220px;
}

@media (max-width: 520px) {
  .music-attribution-heading {
    padding-inline: 12px;
  }

  .music-attribution-track {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 12px;
    padding-inline: 12px;
  }

  .music-attribution-cover {
    width: 72px;
  }

  .music-attribution-listen {
    grid-column: 1 / -1;
    justify-content: center;
  }

  .music-attribution-copyright {
    padding-inline: 12px;
  }
}

@media (min-width: 640px) {
  .mobile-watch-layout {
    --watch-mobile-gutter: 1rem;
  }
}

@media (min-width: 768px) {
  .watch-player-shell :deep(.video-player-container),
  .watch-player-shell :deep(.gilads-preroll-container) {
    height: clamp(420px, 58vh, 650px);
  }

  .intro-suggestion-player :deep(.video-player-container) {
    height: clamp(320px, 46vh, 520px);
  }
}
</style>
