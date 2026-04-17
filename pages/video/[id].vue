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
        
        <!-- Views and Date -->
        <div class="flex gap-4 text-sm text-gray-400 mt-3">
          <span>{{ video.views }} views</span>
          <span>{{ getTimeAgo(video.created_at) }}</span>
        </div>

        <NuxtLink :to="`/channel/${video.channel?.id}`" class="flex items-center mt-4 gap-4 hover:bg-zinc-800 p-2 rounded-lg cursor-pointer">
          <div class="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center">
            <img
              v-if="video.channel?.avatar_url && typeof video.channel.avatar_url === 'string' && video.channel.avatar_url.trim()"
              class="rounded-full w-9 h-9 object-cover"
              :src="video.channel.avatar_url"
              :alt="video.channel.name"
            />
            <span v-else class="text-xs font-bold text-white">
              {{ video.channel?.name?.charAt(0).toUpperCase() ?? 'C' }}
            </span>
          </div>
          <p class="text-sm font-medium text-gray-100">{{ video.channel.name }}</p>
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

          <div class="flex gap-3 mb-3">
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
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
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
        <div class="space-y-4">
          <div v-if="comments.length === 0" class="text-center text-gray-500 py-6 text-sm">
            No comments yet
          </div>

          <div v-for="comment in comments" :key="comment.id" class="bg-zinc-900 p-3 rounded text-sm">
            <div class="flex gap-2">
              <div class="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                <img
                  v-if="comment.channel.avatar_url && !failedCommentAvatars[comment.id]"
                  :src="getCommentAvatarUrl(comment.channel.avatar_url)"
                  :alt="comment.channel.name"
                  class="w-full h-full object-cover"
                  @error="() => failedCommentAvatars[comment.id] = true"
                />
                <span v-else class="text-xs font-bold">{{ comment.channel.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-semibold text-xs">{{ comment.channel.name }}</p>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <p class="text-xs text-gray-500">{{ getTimeAgo(comment.created_at) }}</p>
                    <button
                      v-if="isCommentOwner(comment)"
                      @click="deleteUserComment(comment.id)"
                      class="text-gray-400 hover:text-red-500 transition text-xs p-1"
                      title="Delete comment"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p class="text-gray-300 mt-1 text-xs break-words">{{ comment.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Sidebar (only show on lg screens) -->
    <div v-if="showSidebar" class="lg:w-80 lg:flex-shrink-0">
      <div class="lg:sticky lg:top-6">
        <!-- Related Videos -->
        <div>
          <h2 class="text-xl font-bold mb-6">Related Videos</h2>
        <div class="space-y-4">
          <NuxtLink
            v-for="relatedVideo in relatedVideos"
            :key="relatedVideo.id"
            :to="`/video/${relatedVideo.id}`"
            class="block hover:opacity-80 transition"
          >
            <div class="bg-zinc-800 rounded overflow-hidden aspect-video mb-2">
              <img
                class="w-full h-full object-cover"
                :src="baseUrl + relatedVideo.thumbnail_url"
                :alt="relatedVideo.title"
              />
            </div>
            <p class="text-sm font-semibold line-clamp-2">{{ relatedVideo.title }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ relatedVideo.channel?.name }}</p>
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

  </div>
</template>

<script setup lang="ts">
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import { getVideo, incrementViews, getVideos, likeVideo, unlikeVideo, checkIfLiked } from '~/app/service/videos'
import { getVideoComments, postComment as apiPostComment, deleteComment } from '~/app/service/comments'
import { getTimeAgo } from '~/app/utils/time'
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

const baseUrl = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const id = route.params.id as string
const hasCountedView = ref(false)

// Auth state
const isLoggedIn = ref(false)
const userId = ref('')
const activeAccount = ref('personal')
const activeChannelName = ref('')
const userChannels = ref([])
const personalAccountSelectedChannel = ref('') // For when on personal account, which channel to comment as
const selectedChannelName = ref('')
const failedCommentAvatars = ref({})

// Comments state
const comments = ref([])
const newCommentText = ref('')
const isPostingComment = ref(false)
const showCreateChannelDialog = ref(false)
const showErrorDialog = ref(false)
const errorMessage = ref('')

// Likes state
const likes = ref(0)
const isLiked = ref(false)
const isToggglingLike = ref(false)

// Responsive state
const showSidebar = ref(true)

// Related videos state
const relatedVideos = ref([])

// Helper function to load channels for current account
const loadChannelsForAccount = () => {
  const storedChannels = localStorage.getItem('user_channels')
  if (storedChannels) {
    try {
      userChannels.value = JSON.parse(storedChannels)
      console.log('Loaded channels:', userChannels.value.map(c => c.id))
      
      // Only set default channel if not already selected or if selected channel no longer exists
      if (!personalAccountSelectedChannel.value && userChannels.value.length > 0) {
        personalAccountSelectedChannel.value = userChannels.value[0].id
      } else if (personalAccountSelectedChannel.value && !userChannels.value.find(ch => ch.id === personalAccountSelectedChannel.value)) {
        // Selected channel no longer exists, pick the first one
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

// Helper function to sync active account from localStorage
const syncActiveAccountFromStorage = async () => {
  const storedActiveAccount = localStorage.getItem('active_account') || 'personal'
  
  // Only process if account actually changed
  if (storedActiveAccount !== activeAccount.value) {
    console.log('Account changed from', activeAccount.value, 'to', storedActiveAccount)
    activeAccount.value = storedActiveAccount
  }
  
  const storedAccountName = localStorage.getItem('active_account_name')
  activeChannelName.value = storedAccountName || 'Channel'
  
  // Always load channels (they're needed for the dropdown on personal account)
  loadChannelsForAccount()
  
  // Re-check like status after account sync
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

// Update selectedChannelName whenever activeAccount or personalAccountSelectedChannel changes
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

// Update likes count when video data loads
watch(() => video.value, (newVideo) => {
  if (newVideo && newVideo.likes !== undefined) {
    likes.value = newVideo.likes
  }
}, { deep: true, immediate: true })

// Check like status when account changes
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
  } catch (err) {
    console.error('Failed to check like status:', err)
  }
})

// Increment views only when video actually plays
const onVideoPlay = async () => {
  // Only count once per page load
  if (hasCountedView.value) return
  hasCountedView.value = true
  
  try {
    await incrementViews(id)
  } catch (err) {
    console.error('Failed to increment views:', err)
  }
}

// HLS stream URL
const videoSrc = computed(() =>
  video.value
    ? `${baseUrl}/api/v1/videos/${id}/stream/master.m3u8`
    : ''
)

// Update sidebar visibility based on screen size
const updateSidebarVisibility = () => {
  showSidebar.value = typeof window !== 'undefined' && window.innerWidth >= 1024
}

onMounted(async () => {
  // Check screen size and update sidebar visibility
  updateSidebarVisibility()
  window.addEventListener('resize', updateSidebarVisibility)
  
  // Check auth status and get user ID
  const storedUserId = localStorage.getItem('user_id')
  userId.value = storedUserId || ''
  isLoggedIn.value = !!storedUserId
  
  // If logged in and no active account is set, mark as personal (user_id)
  if (isLoggedIn.value && !localStorage.getItem('active_account')) {
    localStorage.setItem('active_account', userId.value)
    localStorage.setItem('active_account_name', 'Personal')
  }
  
  // Initial sync of active account
  syncActiveAccountFromStorage()

  // Load comments
  try {
    comments.value = await getVideoComments(id)
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

  // Load related videos (all ready videos except current one)
  try {
    const allVideos = await getVideos()
    relatedVideos.value = allVideos.filter(v => v.id !== id).slice(0, 10)
  } catch (err) {
    console.error('Failed to load related videos:', err)
  }

  // Listen for storage changes (from other tabs)
  const handleStorageChange = (e) => {
    if (e.key === 'active_account' || e.key === 'active_account_name' || e.key === 'user_channels') {
      syncActiveAccountFromStorage()
    }
  }
  
  // Listen for visibility changes to re-sync when tab becomes visible
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      syncActiveAccountFromStorage()
    }
  }
  
  // Periodic check for account changes (catches same-tab switches)
  const accountCheckInterval = setInterval(() => {
    syncActiveAccountFromStorage()
  }, 300) // Check every 300ms for account changes
  
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
  return `${baseUrl}/avatars/${channel.avatar_url}`
}

// Get comment avatar URL
const getCommentAvatarUrl = (avatarUrl: string): string => {
  if (!avatarUrl || !avatarUrl.trim()) return ''
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `${baseUrl}/avatars/${avatarUrl}`
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
    comments.value = await getVideoComments(id)
  } catch (err) {
    console.error('Failed to post comment:', err)
  } finally {
    isPostingComment.value = false
  }
}

// Check if logged-in user owns a comment
const isCommentOwner = (comment) => {
  if (!isLoggedIn.value) return false
  
  const isPersonalAccount = activeAccount.value === 'personal' || activeAccount.value === userId.value
  const currentAccountId = isPersonalAccount ? userId.value : activeAccount.value
  
  return comment.channel.id === currentAccountId
}

// Delete a comment
const deleteUserComment = async (commentId: string) => {
  if (!isCommentOwner(comments.value.find(c => c.id === commentId))) {
    return
  }
  
  if (!confirm('Are you sure you want to delete this comment?')) {
    return
  }
  
  try {
    await deleteComment(commentId)
    // Remove from local state
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) {
    console.error('Failed to delete comment:', err)
    errorMessage.value = 'Failed to delete comment'
    showErrorDialog.value = true
  }
}
</script>

