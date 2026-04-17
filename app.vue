<template>
  <div class="min-h-screen bg-zinc-950 text-white flex flex-col">

    <!-- Header -->
    <header class="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
      <div class="flex items-center gap-3">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="md:hidden p-2 hover:bg-zinc-800 rounded transition"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img
          @click="router.push('/')"
          src="./assets/logowhsmall.png"
          class="h-8 object-contain cursor-pointer md:h-14"
        />
      </div>

      <input
        type="text"
        placeholder="Search"
        class="bg-zinc-900 px-4 py-2 rounded-full w-1/3 focus:outline-none text-white placeholder-gray-500"
      />

      <div class="flex items-center gap-2">
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
                v-if="activeChannelAvatar && activeChannelAvatar.trim()"
                :src="activeChannelAvatar"
                :alt="displayName"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
            </div>
            <span class="text-sm text-gray-300">{{ displayName }}</span>
            <!-- <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="dropdownOpen ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M19 14l-7-7m0 0L5 14m7-7v11'" />
            </svg> -->
          </button>

          <!-- Overlay for click outside -->
          <div
            v-if="dropdownOpen"
            class="fixed inset-0 z-40"
            @click="dropdownOpen = false"
          />

          <!-- Dropdown Menu -->
          <div
            v-if="dropdownOpen"
            class="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-700 rounded shadow-lg z-50 max-h-96 overflow-y-auto"
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
              <img
                v-if="channel.avatar_url && channel.avatar_url.trim()"
                :src="channel.avatar_url"
                :alt="channel.name"
                class="w-6 h-6 rounded-full object-cover"
              />
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

    <!-- CONTENT AREA -->
    <div class="flex flex-1 min-h-0">

      <!-- Sidebar -->
      <aside 
        class="w-60 border-r border-zinc-800 transition-transform duration-200"
        :class="{ 'hidden md:block': !isSidebarOpen }"
      >
        <nav class="p-4 space-y-3">
          <NuxtLink
            to="/"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Home</NuxtLink>
          <NuxtLink
            to="/channels"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Channels</NuxtLink>
          <NuxtLink
            to="/subscriptions"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Subscriptions</NuxtLink>
        </nav>
      </aside>

      <!-- Page content -->
      <div class="flex-1 overflow-auto">
        <NuxtPage />
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { fetchUserChannels } from '~/app/service/upload'

const router = useRouter()
const isLoggedIn = ref(false)
const username = ref('')
const userId = ref('')
const isSidebarOpen = ref(true)
const dropdownOpen = ref(false)
const channels = ref([])
const activeAccount = ref('personal')

// Computed property to show active account name
const displayName = computed(() => {
  const activeAccountName = localStorage.getItem('active_account_name')
  return activeAccountName || username.value || 'User'
})

// Computed property to get active channel's avatar
const activeChannelAvatar = computed(() => {
  if (activeAccount.value === 'personal') return ''
  const activeChannel = channels.value.find(ch => ch.id === activeAccount.value)
  return activeChannel?.avatar_url && activeChannel.avatar_url.trim() ? activeChannel.avatar_url : ''
})

onMounted(() => {
  checkAuthStatus()
  if (isLoggedIn.value) {
    loadChannels()
  }
})

// Watch for login/logout changes
watch(isLoggedIn, (newValue) => {
  if (newValue) {
    loadChannels()
  } else {
    channels.value = []
  }
})

const checkAuthStatus = () => {
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
  if (!userId.value) return
  
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

const switchAccount = (accountId, accountName) => {
  activeAccount.value = accountId
  localStorage.setItem('active_account', accountId)
  localStorage.setItem('active_account_name', accountName)
  dropdownOpen.value = false
  window.location.reload()
}

const handleLogout = () => {
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
