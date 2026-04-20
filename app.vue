<template>
  <div class="min-h-screen bg-zinc-950 text-white flex flex-col">

    <!-- Header -->
    <header v-if="!shouldHideHeaderSidebar" class="h-16 flex items-center justify-between px-4 border-b border-zinc-800 fixed top-0 left-0 right-0 bg-zinc-950" :style="{ zIndex: 60 }">
      <div class="flex items-center gap-3">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="md:hidden p-2 hover:bg-zinc-800 rounded transition"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="relative inline-flex">
          <img
            @click="router.push('/')"
            src="./assets/logowhsmall.png"
            class="h-8 object-contain cursor-pointer md:h-14"
          />
          <span class="absolute -top-1.5 -right-1 md:top-0 md:-right-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-0.5 md:px-1.5 py-0 rounded">BETA</span>
        </div>
      </div>

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search videos and channels..."
        @keydown.enter="$router.push(`/search?q=${encodeURIComponent(searchQuery)}`)"
        class="hidden md:block bg-zinc-900 px-4 py-2 rounded-full w-1/3 focus:outline-none text-white placeholder-gray-500"
      />

      <div class="flex items-center gap-2">
        <!-- Mobile Search Button -->
        <button
          @click="showSearchBar = !showSearchBar"
          class="md:hidden p-2 hover:bg-zinc-800 rounded transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <!-- Upload Button (when logged in) -->
        <NuxtLink
          v-if="isLoggedIn"
          to="/upload"
          class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded-full transition text-md"
        >
          Upload
        </NuxtLink>

        <!-- User Menu -->
        <div v-if="isLoggedIn" class="relative">
          <button
            @click="dropdownOpen = !dropdownOpen"
            class="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 rounded transition"
          >
            <!-- Profile Picture Circle -->
            <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-gray-300 font-bold border border-zinc-600 overflow-hidden">
              <img
                v-if="activeChannelAvatar && !avatarLoadFailed"
                :src="activeChannelAvatar"
                :alt="displayName"
                class="w-full h-full object-cover"
                @error="avatarLoadFailed = true"
              />
              <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
            </div>
            <span class="text-sm text-gray-300">{{ displayName }}</span>
            <!-- <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="dropdownOpen ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M19 14l-7-7m0 0L5 14m7-7v11'" />
            </svg> -->
          </button>
        </div>

        <!-- Login Link (when not logged in) -->
        <NuxtLink
          v-else
          to="/login"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
        >
          Login
        </NuxtLink>
      </div>
    </header>

    <!-- Mobile Expanded Search Bar -->
    <div v-if="!shouldHideHeaderSidebar" v-show="showSearchBar" class="md:hidden bg-zinc-900 border-b border-zinc-800 fixed top-16 left-0 right-0" :style="{ zIndex: 61 }">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search videos and channels..."
        @keydown.enter="$router.push(`/search?q=${encodeURIComponent(searchQuery)}`); showSearchBar = false"
        autofocus
        class="w-full px-4 py-3 bg-zinc-900 focus:outline-none text-white placeholder-gray-500"
      />
    </div>

    <!-- Main Content Wrapper with padding for fixed header -->
    <div :class="['flex-1 overflow-auto', shouldHideHeaderSidebar ? '' : 'pt-16']">
    <!-- CONTENT AREA -->
    <div class="flex flex-1 min-h-0 relative">
      <!-- Mobile Overlay Backdrop -->
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-black bg-opacity-50 md:hidden"
        :style="{ zIndex: 40 }"
        @click="isSidebarOpen = false"
      />

      <!-- Sidebar -->
      <aside v-if="!shouldHideHeaderSidebar"
        class="w-60 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 fixed left-0 top-16 bottom-0 md:static md:top-auto md:bottom-auto overflow-y-auto"
        :class="{ '-translate-x-full': !isSidebarOpen, 'translate-x-0': isSidebarOpen, 'md:translate-x-0': true }"
        :style="{ zIndex: 50 }"
      >
        <nav class="p-4 space-y-3">
          <NuxtLink
            to="/"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Home</NuxtLink>
          <!-- Dashboard (only when logged in) -->
          <NuxtLink
            v-if="isLoggedIn"
            to="/dashboard"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-blue-400 font-semibold"
          >Dashboard</NuxtLink>
          <NuxtLink
            to="/subscriptions"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Subscriptions</NuxtLink>
          <!-- My Channel (only when signed into a channel, not personal) -->
          <NuxtLink
            v-if="activeAccount !== 'personal' && activeAccount !== userId && isLoggedIn"
            :to="`/channel/${activeAccount}`"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-yellow-400 font-semibold"
          >My Channel</NuxtLink>

          <!-- Categories Divider -->
          <div class="border-t border-zinc-700 pt-3 mt-3">
            <p class="text-xs text-gray-500 font-semibold px-2 mb-2">CATEGORIES</p>
            <div class="space-y-1">
              <NuxtLink
                to="/"
                class="w-full text-left px-2 py-1.5 rounded text-sm transition hover:bg-zinc-800 text-gray-300 block"
                :class="{ 'bg-blue-600 text-white': route.path === '/' && !route.params.slug }"
              >
                All Videos
              </NuxtLink>
              <NuxtLink
                v-for="category in categoriesWithVideos"
                :key="category.id"
                :to="`/category/${category.slug}`"
                class="w-full text-left px-2 py-1.5 rounded text-sm transition hover:bg-zinc-800 text-gray-300 block"
                :class="{ 'bg-blue-600 text-white': route.params.slug === category.slug }"
              >
                {{ category.name }}
              </NuxtLink>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Page content -->
      <div class="flex-1 overflow-auto">
        <NuxtPage />
      </div>

    </div>
    </div>

  </div>
  <!-- Profile Dropdown Portal (outside header for z-index independence) -->
  <!-- Overlay for click outside -->
  <div
    v-if="dropdownOpen"
    class="fixed inset-0 pointer-events-none"
    :style="{ zIndex: 9998 }"
    @click="dropdownOpen = false"
  />

  <!-- Dropdown Menu -->
  <div
    v-if="dropdownOpen"
    class="fixed bg-zinc-900 border border-zinc-700 rounded shadow-lg max-h-96 overflow-y-auto pointer-events-auto"
    :style="{ zIndex: 9999, top: '70px', right: '20px', width: '224px' }"
  >
    <!-- Current Account -->
    <div class="px-4 py-2 text-xs text-gray-500 border-b border-zinc-700 font-semibold">
      CURRENT ACCOUNT
    </div>
    
    <!-- Personal Account -->
    <button
      @click="switchAccount(userId, username)"
      :class="['w-full text-left px-4 py-2 hover:bg-zinc-800', activeAccount === 'personal' ? 'bg-zinc-800 text-blue-400' : 'text-gray-300']"
    >
      👤 {{ username }} (Personal)
    </button>

    <!-- Channels Divider -->
    <div v-if="channels.length > 0" class="px-4 py-2 text-xs text-gray-500 border-t border-zinc-700 font-semibold">
      YOUR CHANNELS
    </div>

    <!-- User Channels -->
    <button
      v-for="channel in channels"
      :key="channel.id"
      @click="switchAccount(channel.id, channel.name)"
      :class="['w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center gap-3', activeAccount === channel.id ? 'bg-zinc-800 text-blue-400' : 'text-gray-300']"
    >
      <!-- Channel Avatar -->
      <div v-if="getChannelAvatarUrl(channel) && !failedChannelAvatars[channel.id]" class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold overflow-hidden">
        <img
          :src="getChannelAvatarUrl(channel)"
          :alt="channel.name"
          class="w-full h-full object-cover"
          @error="failedChannelAvatars[channel.id] = true"
        />
      </div>
      <span v-else class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
        {{ channel.name.charAt(0).toUpperCase() }}
      </span>
      {{ channel.name }}
    </button>

    <!-- Actions -->
    <div class="border-t border-zinc-700 mt-2 pt-2">
      <div class="px-4 py-2 text-xs text-gray-500 border-zinc-700 font-semibold">
      SETTINGS
    </div>
      <!-- Go to Channel Page (only when signed into a channel) -->
      <!-- <NuxtLink
        v-if="activeAccount !== 'personal'"
        :to="`/channel/${activeAccount}`"
        class="block px-4 py-2 hover:bg-zinc-800 text-blue-400"
        @click="dropdownOpen = false"
      >
        📺 View Channel Page
      </NuxtLink> -->
      <NuxtLink
        to="/my-channels"
        class="block px-4 py-2 hover:bg-zinc-800 text-yellow-400"
        @click="dropdownOpen = false"
      >
        Manage Channels
      </NuxtLink>
      <NuxtLink
        to="/create-channel"
        class="block px-4 py-2 hover:bg-zinc-800 text-green-400"
        @click="dropdownOpen = false"
      >
        Create Channel
      </NuxtLink>
      <button
        @click="handleLogout"
        class="w-full text-left mt-2 px-4 py-2 hover:bg-zinc-800 text-red-400 rounded-b border-t border-zinc-700"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { fetchUserChannels } from '~/app/service/upload'

const router = useRouter()
const route = useRoute()
const isLoggedIn = ref(false)
const username = ref('')
const userId = ref('')
const isSidebarOpen = ref(false)
const showSearchBar = ref(false)
const searchQuery = ref('')
const dropdownOpen = ref(false)
const channels = ref([])
const activeAccount = ref('personal')
const avatarLoadFailed = ref(false)
const failedChannelAvatars = ref({})

// Routes that should not show header/sidebar
const hideHeaderSidebarRoutes = ['/login', '/register', '/upload', '/create-channel']

// Computed property to check if header/sidebar should be hidden
const shouldHideHeaderSidebar = computed(() => {
  return hideHeaderSidebarRoutes.some(route_path => route.path.startsWith(route_path))
})

// Computed property to show active account name
const displayName = computed(() => {
  if (!process.client) return username.value || 'User'
  const activeAccountName = localStorage.getItem('active_account_name')
  return activeAccountName || username.value || 'User'
})

// Computed property to get active channel's avatar
const activeChannelAvatar = computed(() => {
  if (activeAccount.value === 'personal') return ''
  const activeChannel = channels.value.find(ch => ch.id === activeAccount.value)
  if (!activeChannel?.avatar_url || !activeChannel.avatar_url.trim()) return ''
  // If it's a full URL, return as-is
  if (activeChannel.avatar_url.startsWith('http')) return activeChannel.avatar_url
  // If it already starts with /avatars/, return as-is (root-relative path)
  if (activeChannel.avatar_url.startsWith('/avatars/')) return activeChannel.avatar_url
  // Otherwise, prepend /avatars/ (don't use baseUrl - avatars are at root level)
  return `/avatars/${activeChannel.avatar_url}`
})

// Helper function to get channel avatar URL
const getChannelAvatarUrl = (channel) => {
  if (!channel?.avatar_url || !channel.avatar_url.trim()) return ''
  // If it's a full URL, return as-is
  if (channel.avatar_url.startsWith('http')) return channel.avatar_url
  // If it already starts with /avatars/, return as-is (root-relative path)
  if (channel.avatar_url.startsWith('/avatars/')) return channel.avatar_url
  // Otherwise, prepend /avatars/ (don't use baseUrl - avatars are at root level)
  return `/avatars/${channel.avatar_url}`
}

// Computed property to get categories that have videos
const categoriesWithVideos = computed(() => {
  if (!process.client) return []
  const categories = localStorage.getItem('categories')
  if (!categories) return []
  try {
    const parsed = JSON.parse(categories)
    // Filter to only categories that have videos
    return parsed.filter(cat => (cat.video_count || 0) > 0)
  } catch (e) {
    console.error('Failed to parse categories:', e)
    return []
  }
})

// Close sidebar when window is resized to mobile size
const handleSidebarResize = () => {
  if (!process.client) return
  if (window.innerWidth >= 768) {
    // md breakpoint - don't close on desktop
    return
  }
  isSidebarOpen.value = false
}

onMounted(() => {
  checkAuthStatus()
  loadCategories()
  if (isLoggedIn.value) {
    loadChannels()
  }
  
  window.addEventListener('resize', handleSidebarResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleSidebarResize)
})

// Watch for login/logout changes
watch(isLoggedIn, (newValue) => {
  if (newValue) {
    loadChannels()
  } else {
    channels.value = []
  }
})

// Reset avatar load failure when avatar changes
watch(activeChannelAvatar, () => {
  avatarLoadFailed.value = false
})

const checkAuthStatus = () => {
  if (!process.client) return
  const storedUserId = localStorage.getItem('user_id')
  const storedUsername = localStorage.getItem('username')
  
  isLoggedIn.value = !!storedUserId
  username.value = storedUsername || 'User'
  userId.value = storedUserId || ''
  
  // Load active account
  const activeId = localStorage.getItem('active_account')
  activeAccount.value = activeId || 'personal'
}

const loadChannels = async () => {
  if (!process.client || !userId.value) return
  
  // Reset failed avatars when loading channels
  failedChannelAvatars.value = {}
  
  // Try to get channels from localStorage first
  const storedChannels = localStorage.getItem('user_channels')
  if (storedChannels) {
    try {
      channels.value = JSON.parse(storedChannels)
    } catch (e) {
      console.error('Failed to parse channels:', e)
    }
  }
  
  // Fetch fresh channels from API
  try {
    await fetchUserChannels(userId.value)
    const updatedChannels = localStorage.getItem('user_channels')
    if (updatedChannels) {
      channels.value = JSON.parse(updatedChannels)
    }
  } catch (err) {
    console.error('Failed to fetch channels:', err)
  }
}

const loadCategories = async () => {
  if (!process.client) return
  
  try {
    // Fetch categories directly from API
    const response = await fetch('/api/v1/categories')
    if (response.ok) {
      const categories = await response.json()
      // Store in localStorage for access in composables and other pages
      localStorage.setItem('categories', JSON.stringify(categories || []))
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const switchAccount = (accountId, accountName) => {
  if (!process.client) return
  activeAccount.value = accountId
  avatarLoadFailed.value = false
  failedChannelAvatars.value = {}
  localStorage.setItem('active_account', accountId)
  localStorage.setItem('active_account_name', accountName)
  dropdownOpen.value = false
  window.location.reload()
}

const handleLogout = () => {
  if (!process.client) return
  localStorage.removeItem('user_id')
  localStorage.removeItem('email')
  localStorage.removeItem('username')
  localStorage.removeItem('user_channels')
  localStorage.removeItem('active_account')
  localStorage.removeItem('active_account_name')
  isLoggedIn.value = false
  dropdownOpen.value = false
  router.push('/')
  window.location.reload()
}

// Watch for route changes to update auth status
router.afterEach(() => {
  checkAuthStatus()
})
</script>
