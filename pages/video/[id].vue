<template>
  <div class="min-h-screen bg-black text-white flex flex-col lg:flex-row p-6 gap-6">
    
    <!-- Left: Video Player and Info -->
    <div class="flex-1 min-w-0">
      <!-- Video Player -->
      <div class="w-full">
        <VideoPlayer 
          :src="videoSrc" 
          :status="video?.status"
          @play="onVideoPlay"
        />
      </div>

      <!-- Video Info -->
      <div v-if="video" class="mt-6">
        <!-- Processing Message -->
        <div v-if="video.status === 'processing'" class="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg mb-4">
          <p class="font-semibold">Video Processing</p>
          <p class="text-sm mt-1">This video is still being processed. It will be available to watch shortly.</p>
        </div>

        <h1 class="text-2xl font-bold">{{ video.title }}</h1>
        <p class="text-gray-400 mt-2">{{ video.description }}</p>
        
        <!-- Badges Container - Horizontally Scrollable -->
        <div v-if="video.explicit || is4K || (video.categories && video.categories.length > 0)" class="mt-3 flex gap-2 overflow-x-auto pb-2">
          <!-- Explicit Content Warning Badge -->
          <div v-if="video.explicit" class="inline-flex flex-shrink-0 items-center gap-2 bg-red-900 text-red-200 px-3 py-1.5 rounded-full border border-red-700">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs font-semibold whitespace-nowrap">18+ Explicit</span>
          </div>

          <!-- 4K Badge -->
          <div v-if="is4K" class="inline-flex flex-shrink-0 items-center gap-2 bg-green-900 text-green-200 px-3 py-1.5 rounded-full border border-green-700">
            <span class="text-xs font-semibold whitespace-nowrap">4K</span>
          </div>

          <!-- Category Badges -->
          <NuxtLink
            v-for="category in video.categories"
            :key="category.id"
            :to="`/category/${category.slug}`"
            class="inline-flex flex-shrink-0 items-center px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded-full text-xs font-semibold transition border border-blue-700 whitespace-nowrap"
          >
            {{ category.name }}
          </NuxtLink>
        </div>
        
        <!-- Views and Date -->
        <div class="flex gap-4 text-sm text-gray-400 mt-3">
          <span>{{ formatViews(video.views) }} views</span>
          <span>{{ getTimeAgo(video.created_at) }}</span>
        </div>

        <NuxtLink :to="`/channel/${video.channel?.id}`" class="flex items-center mt-4 gap-4 hover:bg-zinc-800 p-2 rounded-lg cursor-pointer">
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

        <!-- Action Buttons (Like, Share) -->
        <div class="flex gap-4 mt-4">
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
        </div>
      </div>

      <!-- Comments Section -->
      <div v-if="video" class="mt-8 border-t border-zinc-700 pt-6">
        <h2 class="text-xl font-bold mb-6">Comments</h2>

        <!-- Comment Form -->
        <div v-if="isLoggedIn && (userChannels.length > 0 || (activeAccount !== userId && activeAccount !== 'personal'))" class="mb-6 bg-zinc-900 p-4 rounded">
          <!-- Channel Selector (if on personal account and have channels) -->
          <div v-if="(activeAccount === userId || activeAccount === 'personal') && userChannels.length > 0" class="mb-3">
            <label class="text-xs text-gray-400 block mb-2">Comment as:</label>
            <select
              v-model="personalAccountSelectedChannel"
              class="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
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
                @error="(e) => e.target.style.display = 'none'"
              />
              <span v-show="!getChannelAvatarUrl((activeAccount === userId || activeAccount === 'personal') ? personalAccountSelectedChannel : activeAccount) || ($event?.target?.style?.display === 'none')">{{ selectedChannelName.charAt(0).toUpperCase() }}</span>
            </div>
            <textarea
              v-model="newCommentText"
              placeholder="Add a comment..."
              maxlength="500"
              rows="3"
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div class="flex gap-2 justify-end">
            <button
              @click="newCommentText = ''"
              class="px-4 py-2 text-gray-400 hover:text-white transition text-sm"
            >
              Cancel
            </button>
            <button
              @click="postComment"
              :disabled="!newCommentText.trim() || isPostingComment"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {{ isPostingComment ? 'Posting...' : 'Comment' }}
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ newCommentText.length }}/500</p>
        </div>

        <!-- Login prompt for non-logged-in users -->
        <div v-else-if="!isLoggedIn" class="mb-6 bg-zinc-900 p-4 rounded text-center">
          <p class="text-gray-400 mb-3 text-sm">Sign in to comment</p>
          <NuxtLink to="/login" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm">
            Sign In
          </NuxtLink>
        </div>

        <!-- Personal account - clickable area to show dialog (only if no channels) -->
        <div v-else-if="(activeAccount === 'personal' || activeAccount === userId) && userChannels.length === 0" class="mb-6 bg-blue-900 border border-blue-700 p-4 rounded text-center">
          <p class="text-blue-300 text-sm mb-3">To comment, you need to create a channel first</p>
          <NuxtLink
            to="/create-channel"
            class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm font-semibold"
            @click="showCreateChannelDialog = false"
          >
            Create Channel
          </NuxtLink>
        </div>

        <!-- Comments List -->
        <div class="w-full min-w-0 space-y-4">
          <div v-if="comments.length === 0" class="text-center text-gray-500 py-6 text-sm">
            No comments yet
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

    <!-- Right: Sidebar (full width on mobile as carousel, wider on tablet, sidebar on lg) -->
    <div class="w-full md:w-full lg:w-64 lg:flex-shrink-0">
      <div class="md:sticky md:top-6">
        <!-- Related Videos -->
        <div class="px-4 md:px-0">
          <h2 class="text-lg font-bold mb-4">Related Videos</h2>
          
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
                  :to="`/video/${relatedVideo.id}`"
                  class="inline-block hover:opacity-80 transition flex-shrink-0"
                >
                  <div class="bg-zinc-800 rounded overflow-hidden w-40 aspect-video mb-1.5 relative">
                    <img
                      class="w-full h-full object-cover"
                      :src="baseUrl + relatedVideo.thumbnail_url"
                      :alt="relatedVideo.title"
                    />
                    <div v-if="relatedVideo.width >= 3840" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">4K</div>
                  </div>
                  <p class="text-xs font-semibold line-clamp-2 w-40">{{ relatedVideo.title }}</p>
                  <div class="flex items-center gap-1">
                    <NuxtLink :to="`/channel/${relatedVideo.channel?.id}`" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
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
              :to="`/video/${relatedVideo.id}`"
              class="block hover:opacity-80 transition"
            >
              <div class="bg-zinc-800 rounded overflow-hidden w-full aspect-video mb-2 relative">
                <img
                  class="w-full h-full object-cover"
                  :src="baseUrl + relatedVideo.thumbnail_url"
                  :alt="relatedVideo.title"
                />
                <div v-if="relatedVideo.width >= 3840" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">4K</div>
              </div>
              <p class="text-sm font-semibold line-clamp-2">{{ relatedVideo.title }}</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="`/channel/${relatedVideo.channel?.id}`" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
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
              :to="`/video/${relatedVideo.id}`"
              class="block hover:opacity-80 transition"
            >
              <div class="bg-zinc-800 rounded overflow-hidden aspect-video mb-1.5 relative">
                <img
                  class="w-full h-full object-cover"
                  :src="baseUrl + relatedVideo.thumbnail_url"
                  :alt="relatedVideo.title"
                />
                <div v-if="relatedVideo.width >= 3840" class="absolute top-1 right-1 bg-green-900 text-green-200 px-1.5 py-0.5 rounded text-xs font-semibold border border-green-700">4K</div>
              </div>
              <p class="text-xs font-semibold line-clamp-2">{{ relatedVideo.title }}</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="`/channel/${relatedVideo.channel?.id}`" class="text-xs text-gray-400 hover:text-yellow-400 transition">{{ relatedVideo.channel?.name }}</NuxtLink>
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
        <h3 class="text-2xl font-bold mb-4">Create a Channel to Comment</h3>
        
        <p class="text-gray-300 mb-6">
          To comment on videos, you need to create a channel. It only takes a moment and you'll be able to start engaging with the community right away.
        </p>

        <div class="space-y-3">
          <NuxtLink
            to="/create-channel"
            class="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded transition text-center font-semibold"
            @click="showCreateChannelDialog = false"
          >
            Create Channel
          </NuxtLink>
          
          <button
            @click="showCreateChannelDialog = false"
            class="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded transition text-center"
          >
            Later
          </button>
        </div>
      </div>
    </div>

    <!-- Error Dialog -->
    <div v-if="showErrorDialog" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-zinc-900 rounded-lg p-8 max-w-md w-full border border-zinc-700">
        <h3 class="text-2xl font-bold mb-4">Error</h3>
        
        <p class="text-gray-300 mb-6">
          {{ errorMessage }}
        </p>

        <button
          @click="showErrorDialog = false"
          class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded transition text-center font-semibold"
        >
          Close
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

        <h2 class="text-2xl font-bold text-center mb-3 text-red-400">18+ Explicit Content</h2>
        
        <p class="text-gray-300 text-center mb-6">
          This video contains mature content and is intended for viewers 18 years and older. Viewer discretion is advised.
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
            Don't show this warning again
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            @click="continueToVideo"
            class="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded transition text-center font-semibold text-white"
          >
            I Understand, Continue
          </button>
          
          <button
            @click="goBackHome"
            class="w-full px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded transition text-center font-semibold text-white"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import CommentNode from '~/app/components/comments/CommentNode.vue'
import { getVideo, incrementViews, getVideos, likeVideo, unlikeVideo, checkIfLiked } from '~/app/service/videos'
import { getVideoComments, postComment as apiPostComment, deleteComment, likeComment, unlikeComment } from '~/app/service/comments'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRequestHeaders, navigateTo } from '#app'
import { useRouter } from 'vue-router'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const id = route.params.id as string
const hasCountedView = ref(false)

const isLoggedIn = ref(false)
const userId = ref('')
const activeAccount = ref('personal')
const activeChannelName = ref('')
const userChannels = ref([])
const personalAccountSelectedChannel = ref('')
const selectedChannelName = ref('')
const failedCommentAvatars = ref({})

const comments = ref([])
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

const showSidebar = ref(true)

const relatedVideos = ref([])
const carouselContainer = ref<HTMLElement | null>(null)

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

const scrollCarousel = (direction: 'left' | 'right') => {
  if (!carouselContainer.value) return
  const scrollAmount = 300
  const newScroll = carouselContainer.value.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
  carouselContainer.value.scrollTo({ left: newScroll, behavior: 'smooth' })
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
  const siteUrl = process.server 
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

const videoSrc = computed(() =>
  video.value
    ? `${baseUrl}/api/v1/videos/${id}/stream/master.m3u8`
    : ''
)

const is4K = computed(() => video.value?.width >= 3840)

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

  try {
    const commentActorId = getCurrentCommentActorID()
    comments.value = await getVideoComments(id, commentActorId || undefined)
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

  try {
    const allVideos = await getVideos()
    relatedVideos.value = allVideos.filter(v => v.id !== id).slice(0, 10)
  } catch (err) {
    console.error('Failed to load related videos:', err)
  }

  const handleStorageChange = (e) => {
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
const isCommentOwner = (comment) => {
  if (!isLoggedIn.value) return false

  const currentAccountId = getCurrentCommentActorID()

  return comment.channel.id === currentAccountId
}

// Delete a comment
const deleteUserComment = async (commentId: string) => {
  const findInThread = (items, idToFind) => {
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
  if (newID) {
    await jumpToComment(newID)
  }
}, { immediate: true })

watch(() => commentsById.value[pendingJumpCommentID.value], async (found) => {
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
  await navigateTo('/')
}
</script>

