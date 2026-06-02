<template>
  <div class="min-h-screen bg-black text-white flex flex-col lg:flex-row p-6 gap-6">
    
    <!-- Left: Video Player and Info -->
    <div class="flex-1 min-w-0">
      <!-- Video Player -->
      <div class="w-full">
        <GilAdsVideoPlayer
          :src="videoSrc"
          :status="video?.status"
          :video-id="id"
          :channel-id="video?.channel?.id"
          @play="onVideoPlay"
          @ended="handleVideoEnded"
        />
      </div>

      <!-- Video Info -->
      <div v-if="video" class="mt-6">
        <!-- Processing Message -->
        <div v-if="video.status === 'processing'" class="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg mb-4">
          <p class="font-semibold">{{ t('video.videoProcessing') }}</p>
          <p class="text-sm mt-1">{{ t('video.processingMessage') }}</p>
        </div>

        <h1 class="text-2xl font-bold">{{ video.title }}</h1>
        <p class="text-gray-400 mt-2">{{ video.description }}</p>
        
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

        <NuxtLink :to="localePath(`/channel/${video.channel?.id}`)" class="flex items-center mt-4 gap-4 hover:bg-zinc-800 p-2 rounded-lg cursor-pointer">
          <div class="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center">
            <img
              v-if="video.channel?.avatar_url && typeof video.channel.avatar_url === 'string' && video.channel.avatar_url.trim()"
              class="rounded-full w-9 h-9 object-cover"
              :src="getVideoChannelAvatarUrl(video.channel.avatar_url)"
              :alt="video.channel.name"
            />
            <span v-else class="text-xs font-bold text-white">
              {{ video.channel?.name?.charAt(0).toUpperCase() ?? 'C' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-100">{{ video.channel.name }}</p>
            <VerifiedBadge :verified="video.channel?.verified || false" size="md" />
          </div>
        </NuxtLink>

        <!-- Action Buttons (Like, Share, Add to Playlist) -->
        <div class="flex gap-4 mt-4 flex-wrap">
          <button
            @click="toggleLike"
            :disabled="!isLoggedIn || isToggglingLike"
            :class="{
              'bg-red-600 hover:bg-red-700': isLiked,
              'bg-zinc-700 hover:bg-zinc-600': !isLiked,
              'opacity-50 cursor-not-allowed': !isLoggedIn || isToggglingLike
            }"
            class="flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium"
          >
            <span>{{ isLiked ? '❤️' : '🤍' }}</span>
            <span>{{ likes }}</span>
          </button>

          <button
            v-if="isLoggedIn"
            @click="showAddToPlaylist = true"
            class="flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-zinc-700 hover:bg-zinc-600"
            title="Add to Playlist"
          >
            <span class="text-lg font-bold">+</span>
            <span>{{ t('playlists.addVideoButton') }}</span>
          </button>

          <button
            @click="shareVideo"
            class="flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-zinc-700 hover:bg-zinc-600"
            title="Share"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 6l-4-4-4 4"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v13"/>
            </svg>
            <span>{{ t('video.share') }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Playlist Queue -->
      <div v-if="isPlayingFromPlaylist && playlistVideos.length > 0" class="mt-8 lg:hidden">
        <div class="bg-zinc-900 rounded-lg p-4 mb-3">
          <div class="flex items-center justify-between gap-3 mb-2">
            <div>
              <h2 class="text-lg font-bold">{{ t('playlists.playingFrom') }}</h2>
              <NuxtLink :to="localePath(`/playlists/${currentPlaylistId}`)" class="text-red-400 hover:text-red-300 text-sm truncate block">
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
            :to="localePath(`/video/${item.video.id}?playlist_id=${currentPlaylistId}&index=${item.index}`)"
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
                  {{ item.index + 1 }}
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
        <div v-if="isLoggedIn && (userChannels.length > 0 || (activeAccount !== userId && activeAccount !== 'personal'))" class="mb-6 bg-zinc-900 p-4 rounded">
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
            <div class="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
              <img
                v-if="getChannelAvatarUrl((activeAccount === userId || activeAccount === 'personal') ? personalAccountSelectedChannel : activeAccount)"
                :src="getChannelAvatarUrl((activeAccount === userId || activeAccount === 'personal') ? personalAccountSelectedChannel : activeAccount)"
                :alt="selectedChannelName"
                class="w-full h-full object-cover"
                @error="(e) => { const target = e.target as HTMLImageElement | null; if (target) target.style.display = 'none' }"
              />
              <span v-show="!getChannelAvatarUrl((activeAccount === userId || activeAccount === 'personal') ? personalAccountSelectedChannel : activeAccount)">{{ selectedChannelName.charAt(0).toUpperCase() }}</span>
            </div>
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
              class="px-3 py-2 text-gray-400 hover:text-white transition text-sm flex items-center gap-1"
              title="Add GIF"
            >
              <span>GIF</span>
            </button>
            <div class="flex gap-2">
              <button
                @click="newCommentText = ''"
                class="px-4 py-2 text-gray-400 hover:text-white transition text-sm"
              >
                {{ t('video.cancel') }}
              </button>
              <button
                @click="postComment"
                :disabled="!newCommentText.trim() || isPostingComment"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
        fallback-title="Watch page sponsor"
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
                  :src="baseUrl + relatedVideo.thumbnail_url"
                  :alt="relatedVideo.title"
                />
                <div v-if="relatedVideo.width == 7680" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                <div v-if="relatedVideo.width == 3840" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
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
          fallback-title="Watch page sponsor"
          class="mb-4"
        />

        <!-- Playlist Queue (when playing from playlist) -->
        <div v-if="isPlayingFromPlaylist && playlistVideos.length > 0" class="px-4 md:px-0">
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
              <h2 class="text-lg font-bold">{{ t('playlists.playingFrom') }}</h2>
              <NuxtLink :to="localePath(`/playlists/${currentPlaylistId}`)" class="text-red-400 hover:text-red-300 text-sm truncate block">
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
              :to="localePath(`/video/${item.video.id}?playlist_id=${currentPlaylistId}&index=${item.index}`)"
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
                    {{ item.index + 1 }}
                  </div>
                </div>

                <!-- Video Info -->
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
                      :src="baseUrl + relatedVideo.thumbnail_url"
                      :alt="relatedVideo.title"
                    />
                    <div v-if="relatedVideo.width == 7680" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                    <div v-if="relatedVideo.width == 3840" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
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
                  :src="baseUrl + relatedVideo.thumbnail_url"
                  :alt="relatedVideo.title"
                />
                <div v-if="relatedVideo.width == 7680" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                <div v-if="relatedVideo.width == 3840" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
              </div>
              <p class="text-sm font-semibold line-clamp-2">{{ relatedVideo.title }}</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="localePath(`/channel/${relatedVideo.channel?.id}`)" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
                <VerifiedBadge :verified="relatedVideo.channel?.verified || false" size="sm" />
              </div>
              <p class="text-xs text-gray-500">{{ relatedVideo.views }} views</p>
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
                  :src="baseUrl + relatedVideo.thumbnail_url"
                  :alt="relatedVideo.title"
                />
                <div v-if="relatedVideo.width == 7680" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.eightKBadge') }}</div>
                <div v-if="relatedVideo.width == 3840" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">{{ t('video.fourKBadge') }}</div>
              </div>
              <p class="text-xs font-semibold line-clamp-2">{{ relatedVideo.title }}</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="localePath(`/channel/${relatedVideo.channel?.id}`)" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
                <VerifiedBadge :verified="relatedVideo.channel?.verified || false" size="sm" />
              </div>
              <p class="text-xs text-gray-500">{{ relatedVideo.views }} views</p>
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
</template>

<script setup lang="ts">
import GilAdsVideoPlayer from '~/app/components/ads/GilAdsVideoPlayer.vue'
import GilAdsBanner from '~/app/components/ads/GilAdsBanner.vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import CommentNode from '~/app/components/comments/CommentNode.vue'
import GiphyPicker from '~/app/components/GiphyPicker.vue'
import AddToPlaylistModal from '~/app/components/AddToPlaylistModal.vue'
import { GILADS_PLACEMENTS } from '~/app/service/gilads'
import { getVideo, incrementViews, getVideos, likeVideo, unlikeVideo, checkIfLiked } from '~/app/service/videos'
import { getVideoComments, postComment as apiPostComment, deleteComment, likeComment, unlikeComment } from '~/app/service/comments'
import { insertGiphyIntoComment, type GiphyGif } from '~/app/utils/giphy'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRequestHeaders, navigateTo } from '#app'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const id = route.params.id as string
const localePath = useLocalePath()
const { t } = useI18n()
const hasCountedView = ref(false)

const isLoggedIn = ref(false)
const userId = ref('')
const activeAccount = ref('personal')
const activeChannelName = ref('')
const userChannels = ref<any[]>([])
const personalAccountSelectedChannel = ref('')
const selectedChannelName = ref('')
const failedCommentAvatars = ref({})

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

const showExplicitWarning = ref(false)
const neverShowExplicitWarningAgain = ref(false)
const highlightedCommentId = ref('')
const pendingJumpCommentID = ref('')
const showGiphyPicker = ref(false)
const showAddToPlaylist = ref(false)

const showSidebar = ref(true)

const relatedVideos = ref<any[]>([])
const carouselContainer = ref<HTMLElement | null>(null)

// Playlist playback mode
const isPlayingFromPlaylist = ref(false)
const currentPlaylistId = ref('')
const currentPlaylistName = ref('')
const playlistVideos = ref<any[]>([])
const currentVideoIndex = ref(0)
const isPlaylistQueueExpanded = ref(false)

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
const { data: video } = await useAsyncData(`video-${id}`, () =>
  getVideo(id)
)

if (video.value) {
  const siteUrl = import.meta.server
    ? (() => { const headers = useRequestHeaders(['host', 'x-forwarded-proto']); return `${headers['x-forwarded-proto'] || 'http'}://${headers.host || 'localhost:3000'}`; })()
    : typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  
  useMetaTags({
    title: video.value.title,
    description: video.value.description,
    image: video.value.thumbnail_url ? `${siteUrl}${video.value.thumbnail_url}` : undefined,
    url: `${siteUrl}/video/${id}`
  })
}

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
  if (hasCountedView.value) return
  hasCountedView.value = true
  
  try {
    await incrementViews(id)
  } catch (err) {
    console.error('Failed to increment views:', err)
  }
}

const videoSrc = computed(() => {
  const path = video.value?.hls_path
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
})

const is4K = computed(() => video.value?.width == 3840)
const is8K = computed(() => video.value?.width == 7680)

const updateSidebarVisibility = () => {
  showSidebar.value = typeof window !== 'undefined' && window.innerWidth >= 1024
}

onMounted(async () => {
  updateSidebarVisibility()
  window.addEventListener('resize', updateSidebarVisibility)
  
  const hideExplicitWarnings = localStorage.getItem('hide_explicit_warnings') === 'true'
  
  if (video.value?.explicit && !hideExplicitWarnings) {
    showExplicitWarning.value = true
  }
  
  const storedUserId = localStorage.getItem('user_id')
  userId.value = storedUserId || ''
  isLoggedIn.value = !!storedUserId
  
  if (isLoggedIn.value && !localStorage.getItem('active_account')) {
    localStorage.setItem('active_account', userId.value)
    localStorage.setItem('active_account_name', 'Personal')
  }
  
  syncActiveAccountFromStorage()

  // Check if playing from playlist
  const playlistId = route.query.playlist_id
  const playlistIndex = route.query.index
  if (playlistId && typeof playlistId === 'string') {
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
  }

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
    const allVideos = await getVideos()
    relatedVideos.value = allVideos.filter((v: any) => v.id !== id).slice(0, 10)
  } catch (err) {
    console.error('Failed to load related videos:', err)
  }

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
  })
})

// Get channel avatar URL with proper path construction
const getChannelAvatarUrl = (channelId: string): string => {
  const channel = userChannels.value.find(ch => ch.id === channelId)
  if (!channel?.avatar_url || !channel.avatar_url.trim()) return ''
  if (channel.avatar_url.startsWith('http')) return channel.avatar_url
  if (channel.avatar_url.startsWith('/avatars/')) return channel.avatar_url
  return `/avatars/${channel.avatar_url}`
}

// Get comment avatar URL
const getCommentAvatarUrl = (avatarUrl: string): string => {
  if (!avatarUrl || !avatarUrl.trim()) return ''
  if (avatarUrl.startsWith('http')) return avatarUrl
  if (avatarUrl.startsWith('/avatars/')) return avatarUrl
  return `/avatars/${avatarUrl}`
}

// Get video channel avatar URL
const getVideoChannelAvatarUrl = (avatarUrl: string): string => {
  if (!avatarUrl || !avatarUrl.trim()) return ''
  if (avatarUrl.startsWith('http')) return avatarUrl
  if (avatarUrl.startsWith('/avatars/')) return avatarUrl
  return `/avatars/${avatarUrl}`
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
      await navigator.share({ title: video.value?.title || 'GilTube', url })
    } else if (import.meta.client && navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      shareCopied.value = true
      setTimeout(() => (shareCopied.value = false), 2000)
    }
  } catch (err) {
    console.error('Share failed:', err)
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

// Handle explicit warning
const continueToVideo = () => {
  if (neverShowExplicitWarningAgain.value) {
    localStorage.setItem('hide_explicit_warnings', 'true')
  }
  showExplicitWarning.value = false
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

// Skip to next video in playlist
const skipToNextVideo = async () => {
  if (!isPlayingFromPlaylist.value || !currentPlaylistId.value) {
    console.log('Cannot skip: not in playlist mode or missing playlistId')
    return
  }
  
  if (currentVideoIndex.value >= playlistVideos.value.length - 1) {
    console.log('Already at last video')
    return
  }
  
  const nextVideo = playlistVideos.value[currentVideoIndex.value + 1]
  if (nextVideo) {
    console.log('Skipping to next video:', nextVideo.id)
    await navigateTo(localePath(`/video/${nextVideo.id}?playlist_id=${currentPlaylistId.value}&index=${currentVideoIndex.value + 1}`))
  }
}

// Autoplay next video when current ends
const handleVideoEnded = async () => {
  console.log('Video ended. isPlayingFromPlaylist:', isPlayingFromPlaylist.value, 'currentIndex:', currentVideoIndex.value, 'total:', playlistVideos.value.length)
  if (!isPlayingFromPlaylist.value) return
  
  if (currentVideoIndex.value < playlistVideos.value.length - 1) {
    await skipToNextVideo()
  }
}
</script>




