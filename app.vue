<template>
  <div class="min-h-screen bg-zinc-950 text-white flex flex-col overflow-x-hidden">

    <!-- Offline Indicator -->
    <div ref="offlineRef" v-if="offlineMode" class="w-full bg-yellow-600 text-white px-4 py-2 fixed text-center text-sm font-semibold"
      :style="{ zIndex: 80 }">
      {{ t('app.offline') }}
    </div>

    <!-- Account Status Banner -->
    <div ref="statusRef" v-if="userStatus === 'suspended'"
      class="w-full bg-yellow-600 text-white px-4 py-3 fixed flex items-center justify-between" :style="{ zIndex: 70 }">
      <span class="text-sm font-semibold">{{ t('app.suspended') }}</span>
      <button @click="dismissAccountStatus"
        class="px-3 py-1 bg-yellow-700 hover:bg-yellow-800 rounded text-sm transition">
        {{ t('app.dismiss') }}
      </button>
    </div>

    <!-- Banned Account Banner -->
    <div ref="statusRef" v-if="userStatus === 'banned'"
      class="w-full bg-red-600 text-white px-4 py-3 fixed flex items-center justify-between" :style="{ zIndex: 70 }">
      <span class="text-sm font-semibold">{{ t('app.banned') }}</span>
      <button @click="handleBannedLogout" class="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm transition">
        {{ t('app.logout') }}
      </button>
    </div>

    <!-- App Update Notification -->
    <div ref="updateRef" v-if="showUpdatePrompt" class="w-full bg-blue-600 text-white px-4 py-3 fixed flex items-center justify-between"
      :style="{ zIndex: 70 }">
      <span class="text-sm font-semibold">{{ t('app.updateAvailable') }}</span>
      <div class="flex gap-2">
        <button @click="dismissUpdate" class="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm transition">
          {{ t('app.later') }}
        </button>
        <button @click="handleUpdateApp"
          class="px-3 py-1 bg-white text-blue-600 hover:bg-gray-200 rounded text-sm font-semibold transition">
          {{ t('app.updateNow') }}
        </button>
      </div>
    </div>

    <!-- Passkey Prompt Banner -->
    <div
      ref="passkeyRef"
      v-if="showPasskeyPrompt && isLoggedIn && route.path !== '/account-settings'"
      class="w-full bg-cyan-700 text-white px-4 py-3 fixed flex items-center justify-between"
      :style="{ zIndex: 70 }"
    >
      <div class="flex items-center gap-3 text-sm font-semibold">
        <span>{{ t('app.securePasskey') }}</span>
        <NuxtLink
          to="/account-settings#passkeys"
          class="underline underline-offset-2 hover:text-cyan-100"
          @click="showPasskeyPrompt = false"
        >
          {{ t('app.addPasskey') }}
        </NuxtLink>
      </div>
      <button
        @click="dismissPasskeyPrompt"
        class="px-2 py-1 bg-cyan-800 hover:bg-cyan-900 rounded text-sm transition"
        aria-label="Dismiss passkey banner"
      >
        X
      </button>
    </div>

    <!-- Header -->
    <header v-if="!shouldHideHeaderSidebar"
      class="h-16 flex items-center justify-between px-4 border-b fixed left-0 right-0 transition-all duration-300"
      :class="headerScrolled ? 'bg-zinc-950/50 backdrop-blur-md border-zinc-700 shadow-[0_8px_24px_rgba(0,0,0,0.35)]' : 'bg-zinc-950 border-zinc-800'"
      :style="{ top: notificationBarHeight + 'px', zIndex: 60 }">
      <div class="flex items-center gap-3">
        <button @click="isSidebarOpen = !isSidebarOpen" class="md:hidden p-2 hover:bg-zinc-800 rounded transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="relative inline-flex">
          <button
            type="button"
            @click="handleLogoClick"
            class="inline-flex cursor-pointer items-center justify-center"
            :aria-label="t('app.home')"
          >
            <img src="./assets/logowhsmall.png" class="h-8 object-contain md:h-14" />
          </button>
          <!-- <span
            class="absolute -top-1.5 -right-1 md:top-0 md:-right-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-0.5 md:px-1.5 py-0 rounded">BETA</span> -->
        </div>
      </div>

      <input v-model="searchQuery" type="text" :placeholder="t('app.searchPlaceholder')"
        @keydown.enter="$router.push(`/search?q=${encodeURIComponent(searchQuery)}`)"
        class="hidden md:block bg-zinc-900 px-4 py-2 rounded-full w-1/3 focus:outline-none text-white placeholder-gray-500" />

      <div class="flex items-center gap-2">
        <!-- Mobile Search Button -->
        <button @click="showSearchBar = !showSearchBar" class="md:hidden p-2 hover:bg-zinc-800 rounded transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <!-- Upload Button (when logged in) -->
        <NuxtLink v-if="isLoggedIn && userStatus === 'active'" :to="localePath('/upload')"
          class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded-full transition text-md">
          {{ t('app.upload') }}
        </NuxtLink>

        <!-- Upload Button Disabled (suspended/banned) -->
        <button v-if="isLoggedIn && userStatus !== 'active'" disabled
          :title="userStatus === 'suspended' ? 'Your account is suspended - you cannot upload' : 'Your account is banned - you cannot upload'"
          class="px-2 py-1 bg-gray-700 cursor-not-allowed rounded-full transition text-md opacity-50">
          {{ t('app.upload') }}
        </button>

        <div v-if="isLoggedIn" class="relative" ref="notificationDropdownRef">
          <button
            @click="toggleNotificationsDropdown"
            class="relative p-2 hover:bg-zinc-800 rounded transition"
            :aria-label="t('app.notifications')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.42L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span
              v-if="unreadNotificationCount > 0"
              class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center font-bold"
            >
              {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
            </span>
          </button>

          <div
            v-if="notificationsDropdownOpen"
            class="fixed top-14 right-2 left-2 sm:absolute sm:left-auto sm:right-0 sm:w-96 w-auto max-w-none bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
            :style="{ zIndex: 9999 }"
          >
            <div class="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
              <p class="text-sm font-semibold">{{ t('app.notifications') }}</p>
              <button
                @click="markAllPreviewNotificationsRead"
                class="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                {{ t('app.markAllRead') }}
              </button>
            </div>

            <div v-if="notificationPreviewLoading" class="px-4 py-8 text-center text-sm text-gray-400">
              {{ t('app.loading') }}
            </div>
            <div v-else-if="notificationPreview.length === 0" class="px-4 py-8 text-center text-sm text-gray-500">
              {{ t('app.noNotifications') }}
            </div>
            <div v-else class="max-h-80 overflow-y-auto">
              <NuxtLink
                v-for="item in notificationPreview"
                :key="item.id"
                :to="localizedNotificationUrl(item.url)"
                class="block px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800 transition"
                @click="handleNotificationClick(item.id)"
              >
                <p class="text-sm" :class="item.is_read ? 'text-gray-300' : 'text-white font-semibold'">
                  {{ notificationSummary(item) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">{{ formatNotificationTime(item.created_at) }}</p>
              </NuxtLink>
            </div>

            <div class="px-4 py-3 bg-zinc-950 border-t border-zinc-700">
              <NuxtLink :to="localePath('/notifications')" class="text-sm text-blue-400 hover:text-blue-300" @click="notificationsDropdownOpen = false">
                {{ t('app.viewAllNotifications') }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Install App Button -->
        <!-- <button
          v-if="canInstall"
          @click="promptInstall"
          class="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-full transition text-sm font-semibold flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Install
        </button> -->

        <!-- User Menu -->
        <div v-if="isLoggedIn" class="relative">
          <button @click="dropdownOpen = !dropdownOpen"
            class="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 rounded transition">
            <!-- Profile Picture Circle -->
            <div
              class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-gray-300 font-bold border border-zinc-600 overflow-hidden">
              <img v-if="activeChannelAvatar && !avatarLoadFailed" :src="activeChannelAvatar" :alt="displayName"
                class="w-full h-full object-cover" @error="avatarLoadFailed = true" />
              <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
            </div>
            <span class="hidden md:inline text-sm text-gray-300">{{ displayName }}</span>
            <!-- <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="dropdownOpen ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M19 14l-7-7m0 0L5 14m7-7v11'" />
            </svg> -->
          </button>
        </div>

        <!-- Login Link (when not logged in) -->
        <NuxtLink v-else :to="localePath('/login')" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition">
          {{ t('app.login') }}
        </NuxtLink>
      </div>
    </header>

    <!-- Mobile Expanded Search Bar -->
    <div v-if="!shouldHideHeaderSidebar" v-show="showSearchBar"
      class="md:hidden bg-zinc-900 border-b border-zinc-800 fixed top-16 left-0 right-0" :style="{ zIndex: 61 }">
      <input v-model="searchQuery" type="text" :placeholder="t('app.searchPlaceholder')"
        @keydown.enter="$router.push(`/search?q=${encodeURIComponent(searchQuery)}`); showSearchBar = false" autofocus
        class="w-full px-4 py-3 bg-zinc-900 focus:outline-none text-white placeholder-gray-500" />
    </div>

    <!-- Main Content Wrapper with padding for fixed header -->
    <div ref="mainScrollRef" class="flex-1 min-w-0 overflow-auto overflow-x-hidden"
      @scroll.passive="handleMainContentScroll"
      :style="shouldHideHeaderSidebar ? {} : { paddingTop: (notificationBarHeight + 64) + 'px' }">
      <!-- CONTENT AREA -->
      <div class="flex flex-1 min-h-0 min-w-0 relative">
        <!-- Mobile Overlay Backdrop -->
        <div v-if="isSidebarOpen" class="fixed inset-0 bg-black bg-opacity-50 md:hidden" :style="{ zIndex: 40 }"
          @click="isSidebarOpen = false" />

        <!-- Sidebar -->
        <aside v-if="!shouldHideHeaderSidebar"
          class="w-60 border-r transition-transform duration-300 fixed left-0 bottom-0 md:bottom-auto md:transform-none md:transition-none overflow-y-auto h-full"
          :class="{
            '-translate-x-full': !isSidebarOpen,
            'translate-x-0': isSidebarOpen,
            'md:translate-x-0': true,
            'bg-zinc-950/50 backdrop-blur-md border-zinc-700 shadow-[0_8px_24px_rgba(0,0,0,0.35)]': headerScrolled,
            'bg-zinc-950 border-zinc-800': !headerScrolled
          }"
          :style="{ top: (notificationBarHeight + 64) + 'px', maxHeight: `calc(100vh - ${notificationBarHeight + 64}px)`, zIndex: 50 }">
          <nav class="p-4 space-y-3">
            <NuxtLink :to="localePath('/')" class="hover:bg-zinc-800 p-2 rounded cursor-pointer block">{{ t('app.home') }}</NuxtLink>
            <!-- Dashboard (only when logged in) -->
            <NuxtLink v-if="isLoggedIn" :to="localePath('/dashboard')"
              class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-blue-400 font-semibold">{{ t('app.dashboard') }}
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" :to="localePath('/notifications')"
              class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-indigo-300 font-semibold">{{ t('app.notifications') }}
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" :to="localePath('/go-live')"
              class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-red-400 font-semibold">{{ t('app.goLive') }}
            </NuxtLink>
            <!-- <NuxtLink to="/subscriptions" class="hover:bg-zinc-800 p-2 rounded cursor-pointer block">Subscriptions
            </NuxtLink> -->
            <!-- My Channel (only when signed into a channel, not personal) -->
            <NuxtLink v-if="activeAccount !== 'personal' && activeAccount !== userId && isLoggedIn"
              :to="localePath(`/channel/${activeAccount}`)"
              class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-yellow-400 font-semibold">{{ t('app.myChannel') }}
            </NuxtLink>

            <!-- Categories Divider -->
            <div class="border-t border-zinc-700 pt-3 mt-3">
              <p class="text-xs text-gray-500 font-semibold px-2 mb-2">{{ t('app.categories') }}</p>
              <div class="space-y-1">
                <NuxtLink :to="localePath('/')"
                  class="w-full text-left px-2 py-1.5 rounded text-sm transition hover:bg-zinc-800 text-gray-300 block"
                  :class="{ 'bg-blue-600 text-white': route.path === '/' && !route.params.slug }">
                  {{ t('app.allVideos') }}
                </NuxtLink>
                <NuxtLink v-for="category in categoriesWithVideos" :key="category.id" :to="localePath(`/category/${category.slug}`)"
                  class="w-full text-left px-2 py-1.5 rounded text-sm transition hover:bg-zinc-800 text-gray-300 block"
                  :class="{ 'bg-blue-600 text-white': route.params.slug === category.slug }">
                  {{ category.name }}
                </NuxtLink>
              </div>
            </div>

            <!-- Language Selector at Bottom -->
            <div class="border-t border-zinc-700 pt-3 mt-3">
              <p class="text-xs text-gray-500 font-semibold px-2 mb-2">{{ t('app.language') }}</p>
              <select
                :value="locale"
                @change="onLocaleChange"
                class="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                :aria-label="t('app.language')"
              >
                <option v-for="item in locales" :key="item.code" :value="item.code">
                  {{ item.code === 'en' ? '🇺🇸 English (US)' : '🇲🇽 Español (México)' }}
                </option>
              </select>
            </div>
          </nav>
        </aside>

        <!-- Page content -->
        <div ref="contentScrollRef" class="flex-1 min-w-0" :class="!shouldHideHeaderSidebar ? 'md:ml-60' : ''">
          <NuxtPage />
        </div>

      </div>
    </div>

  </div>

  <!-- Locale Picker Modal (shown only on first visit) -->
  <LocalePickerModal />
  <!-- Profile Dropdown Portal (outside header for z-index independence) -->
  <!-- Overlay for click outside -->
  <div v-if="dropdownOpen" class="fixed inset-0 pointer-events-auto" :style="{ zIndex: 9998 }"
    @click="dropdownOpen = false" />

  <!-- Dropdown Menu -->
  <div v-if="dropdownOpen"
    class="fixed bg-zinc-900 border border-zinc-700 rounded shadow-lg max-h-96 overflow-y-auto pointer-events-auto"
    :style="{ zIndex: 9999, top: notificationBarHeight + 70 + 'px', right: '20px', width: '224px' }">
    <!-- Current Account -->
    <div class="px-4 py-2 text-xs text-gray-500 border-b border-zinc-700 font-semibold">
      {{ t('app.currentAccount') }}
    </div>

    <!-- Personal Account -->
    <button @click="switchAccount(userId, username)"
      :class="['w-full text-left px-4 py-2 hover:bg-zinc-800', activeAccount === 'personal' ? 'bg-zinc-800 text-blue-400' : 'text-gray-300']">
      👤 {{ username }} {{ t('app.personal') }}
    </button>

    <!-- Channels Divider -->
    <div v-if="channels.length > 0" class="px-4 py-2 text-xs text-gray-500 border-t border-zinc-700 font-semibold">
      {{ t('app.yourChannels') }}
    </div>

    <!-- User Channels -->
    <button v-for="channel in channels" :key="channel.id" @click="switchAccount(channel.id, channel.name)"
      :disabled="channel.status === 'banned'"
      :title="channel.status === 'banned' ? 'This channel has been banned' : channel.status === 'suspended' ? 'This channel is suspended' : ''"
      :class="['w-full text-left px-4 py-2 hover:bg-zinc-800 flex items-center gap-3 transition', activeAccount === channel.id ? 'bg-zinc-800 text-blue-400' : channel.status === 'banned' ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-300']">
      <!-- Channel Avatar -->
      <div v-if="getChannelAvatarUrl(channel) && !failedChannelAvatars[channel.id]"
        class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold overflow-hidden">
        <img :src="getChannelAvatarUrl(channel)" :alt="channel.name" class="w-full h-full object-cover"
          @error="failedChannelAvatars[channel.id] = true" />
      </div>
      <span v-else class="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
        {{ channel.name.charAt(0).toUpperCase() }}
      </span>
      <span class="flex-1">{{ channel.name }}</span>
      <span v-if="channel.status === 'suspended'"
        class="text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded">Suspended</span>
      <span v-if="channel.status === 'banned'" class="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">Banned</span>
    </button>

    <!-- Actions -->
    <div class="border-t border-zinc-700 mt-2 pt-2">
        <div class="px-4 py-2 text-xs text-gray-500 border-zinc-700 font-semibold">
        {{ t('app.settings') }}
      </div>
      <!-- Admin Panel -->
      <NuxtLink v-if="userType === 'admin'" to="/admin"
        class="block px-4 py-2 hover:bg-zinc-800 text-purple-400 font-semibold" @click="dropdownOpen = false">
        {{ t('app.adminPanel') }}
      </NuxtLink>
        <NuxtLink :to="localePath('/my-channels')" class="block px-4 py-2 hover:bg-zinc-800 text-yellow-400"
        @click="dropdownOpen = false">
        {{ t('app.manageChannels') }}
      </NuxtLink>
      <NuxtLink :to="localePath('/account-settings')" class="block px-4 py-2 hover:bg-zinc-800 text-cyan-400"
        @click="dropdownOpen = false">
        {{ t('app.accountSettings') }}
      </NuxtLink>
      <NuxtLink :to="localePath('/create-channel')" class="block px-4 py-2 hover:bg-zinc-800 text-green-400"
        @click="dropdownOpen = false">
        {{ t('app.createChannel') }}
      </NuxtLink>
      <button @click="handleLogout"
        class="w-full text-left mt-2 px-4 py-2 hover:bg-zinc-800 text-red-400 rounded-b border-t border-zinc-700">
        {{ t('app.logout') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { fetchUserChannels } from '~/app/service/upload'
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getPushConfig,
  subscribePush,
} from '~/app/service/notifications'

const router = useRouter()
const route = useRoute()
const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const isLoggedIn = ref(false)
const username = ref('')
const userId = ref('')
const userType = ref('user')
const userStatus = ref('active')
const isSidebarOpen = ref(false)
const showSearchBar = ref(false)
const searchQuery = ref('')
const dropdownOpen = ref(false)
const channels = ref([])
const activeAccount = ref('personal')
const avatarLoadFailed = ref(false)
const failedChannelAvatars = ref({})
const showUpdatePrompt = ref(false)
const needRefresh = ref(false)
const offlineMode = ref(false)
const offlineReady = ref(false)
const swNeedRefresh = ref(false)
const updateServiceWorker = ref(null)
const deferredPrompt = ref(null)
const statusRefreshInterval = ref(null)
const offlineRef = ref(null)
const statusRef = ref(null)
const updateRef = ref(null)
const passkeyRef = ref(null)
const categories = ref([])
const showPasskeyPrompt = ref(false)
const unreadNotificationCount = ref(0)
const notificationsDropdownOpen = ref(false)
const notificationPreview = ref([])
const notificationPreviewLoading = ref(false)
const notificationDropdownRef = ref(null)
const notificationsPollTimer = ref(null)
const notificationsPollInterval = ref(15000)
const mainScrollRef = ref(null)
const contentScrollRef = ref(null)
const headerScrolled = ref(false)

const PASSKEY_PROMPT_DISMISS_KEY = 'passkey_prompt_dismissed_session'
const AUTH_STATE_CHANGED_EVENT = 'giltube-auth-changed'

const emitAuthStateChanged = () => {
  if (!process.client) return
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT, {
    detail: {
      isLoggedIn: isLoggedIn.value,
      userId: userId.value,
    },
  }))
}

const onLocaleChange = (event) => {
  const target = event?.target
  if (!target?.value) return
  setLocale(target.value)
}

const hideHeaderSidebarRoutes = ['/login', '/register', '/upload', '/create-channel']

const normalizedRoutePath = computed(() => {
  const path = route.path || '/'
  return path.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
})

const notificationBarHeight = computed(() => {
  let height = 0
  if (offlineRef.value) height += offlineRef.value.offsetHeight
  if (statusRef.value) height += statusRef.value.offsetHeight
  if (updateRef.value) height += updateRef.value.offsetHeight
  if (passkeyRef.value) height += passkeyRef.value.offsetHeight
  return height
})

const shouldHideHeaderSidebar = computed(() => {
  return hideHeaderSidebarRoutes.some(route_path => normalizedRoutePath.value.startsWith(route_path))
})

const displayName = computed(() => {
  if (!process.client) return username.value || 'User'
  const activeAccountName = localStorage.getItem('active_account_name')
  return activeAccountName || username.value || 'User'
})

const activeChannelAvatar = computed(() => {
  if (activeAccount.value === 'personal') return ''
  const activeChannel = channels.value.find(ch => ch.id === activeAccount.value)
  if (!activeChannel?.avatar_url || !activeChannel.avatar_url.trim()) return ''
  if (activeChannel.avatar_url.startsWith('http')) return activeChannel.avatar_url
  if (activeChannel.avatar_url.startsWith('/avatars/')) return activeChannel.avatar_url
  return `/avatars/${activeChannel.avatar_url}`
})

const getChannelAvatarUrl = (channel) => {
  if (!channel?.avatar_url || !channel.avatar_url.trim()) return ''
  if (channel.avatar_url.startsWith('http')) return channel.avatar_url
  if (channel.avatar_url.startsWith('/avatars/')) return channel.avatar_url
  return `/avatars/${channel.avatar_url}`
}

const categoriesWithVideos = computed(() => {
  return categories.value.filter(cat => (cat.video_count || 0) > 0)
})

const syncCategoriesFromStorage = () => {
  if (!process.client) return
  const stored = localStorage.getItem('categories')
  if (!stored) {
    categories.value = []
    return
  }
  try {
    categories.value = JSON.parse(stored)
  } catch (e) {
    console.error('Failed to parse categories:', e)
    categories.value = []
  }
}

const handleSidebarResize = () => {
  if (!process.client) return
  if (window.innerWidth >= 768) return
  isSidebarOpen.value = false
}

const handleOnline = () => {
  offlineMode.value = false
  console.log('[PWA] Back online')
}

const handleOffline = () => {
  offlineMode.value = true
  console.log('[PWA] Went offline')
}

const formatNotificationTime = (value) => {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const localizedNotificationUrl = (rawUrl) => {
  if (!rawUrl) return localePath('/notifications')
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl
  return localePath(rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`)
}

const notificationSummary = (item) => {
  if (!item?.actor_channel?.name) return t('app.newActivity')
  if (item.type === 'comment_video') return t('notifications.commentedOnVideo', { name: item.actor_channel.name })
  if (item.type === 'reply_comment') return t('notifications.repliedToComment', { name: item.actor_channel.name })
  if (item.type === 'like_video') return t('notifications.likedYourVideo', { name: item.actor_channel.name })
  if (item.type === 'like_comment') return t('notifications.likedYourComment', { name: item.actor_channel.name })
  if (item.type === 'live_started') return t('notifications.startedLive', { name: item.actor_channel.name })
  return t('notifications.sentNotification', { name: item.actor_channel.name })
}

const stopNotificationPolling = () => {
  if (notificationsPollTimer.value) {
    clearInterval(notificationsPollTimer.value)
    notificationsPollTimer.value = null
  }
}

const startNotificationPolling = () => {
  stopNotificationPolling()
  if (!isLoggedIn.value) return

  notificationsPollTimer.value = setInterval(async () => {
    await refreshNotificationCount()
    if (notificationsDropdownOpen.value) {
      await loadNotificationPreview()
    }
  }, notificationsPollInterval.value)
}

const refreshNotificationCount = async () => {
  if (!isLoggedIn.value) {
    unreadNotificationCount.value = 0
    return
  }

  try {
    const res = await getUnreadNotificationCount()
    unreadNotificationCount.value = res.unread_count || 0
  } catch (err) {
    console.error('Failed to get unread notification count:', err)
  }
}

const loadNotificationPreview = async () => {
  if (!isLoggedIn.value) {
    notificationPreview.value = []
    return
  }

  notificationPreviewLoading.value = true
  try {
    const res = await listNotifications({ limit: 8, offset: 0 })
    notificationPreview.value = res.items || []
  } catch (err) {
    console.error('Failed to load notifications preview:', err)
  } finally {
    notificationPreviewLoading.value = false
  }
}

const toggleNotificationsDropdown = async () => {
  notificationsDropdownOpen.value = !notificationsDropdownOpen.value
  if (notificationsDropdownOpen.value) {
    await Promise.all([refreshNotificationCount(), loadNotificationPreview()])
  }
}

const handleNotificationClick = async (id) => {
  notificationsDropdownOpen.value = false
  try {
    await markNotificationRead(id, true)
  } catch (err) {
    console.error('Failed to mark notification as read:', err)
  }
  await Promise.all([refreshNotificationCount(), loadNotificationPreview()])
}

const markAllPreviewNotificationsRead = async () => {
  try {
    await markAllNotificationsRead()
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err)
  }
  await Promise.all([refreshNotificationCount(), loadNotificationPreview()])
}

const handleNotificationVisibilityChange = () => {
  notificationsPollInterval.value = document.hidden ? 60000 : 15000
  startNotificationPolling()
}

const handleNotificationClickOutside = (event) => {
  if (!notificationsDropdownOpen.value || !notificationDropdownRef.value) return
  if (!notificationDropdownRef.value.contains(event.target)) {
    notificationsDropdownOpen.value = false
  }
}

const getCurrentPushSubscription = async () => {
  if (!process.client || !('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.ready
    return registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

const syncPushSubscriptionForCurrentUser = async () => {
  if (!process.client || !isLoggedIn.value || !userId.value) return
  try {
    const cfg = await getPushConfig()
    if (!cfg?.enabled || !cfg?.send_enabled) return

    const existing = await getCurrentPushSubscription()
    if (!existing) return

    const json = existing.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return

    await subscribePush({
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth
      }
    })
  } catch (err) {
    console.error('Failed to sync push subscription for current user:', err)
  }
}

const detachPushSubscriptionForUser = async (userID) => {
  if (!process.client || !userID) return
  try {
    const existing = await getCurrentPushSubscription()
    if (!existing) return

    await fetch('/api/v1/notifications/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userID
      },
      body: JSON.stringify({ endpoint: existing.endpoint })
    })

    await existing.unsubscribe()
  } catch (err) {
    console.error('Failed to detach push subscription for previous user:', err)
  }
}

const handleMainContentScroll = (event) => {
  const fromEvent = event?.target?.scrollTop || 0
  const fromMain = mainScrollRef.value?.scrollTop || 0
  const fromContent = contentScrollRef.value?.scrollTop || 0
  const fromWindow = typeof window !== 'undefined' ? (window.scrollY || 0) : 0
  const scrollTop = Math.max(fromEvent, fromMain, fromContent, fromWindow)
  headerScrolled.value = scrollTop > 4
}

const scrollToTop = async () => {
  await nextTick()
  if (mainScrollRef.value) mainScrollRef.value.scrollTop = 0
  if (contentScrollRef.value) contentScrollRef.value.scrollTop = 0
  if (process.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  handleMainContentScroll()
}

const handleLogoClick = async () => {
  if (route.path !== localePath('/')) {
    await router.push(localePath('/'))
  }
  await scrollToTop()
}

onMounted(async () => {
  checkAuthStatus()
  await loadCategories()
  if (isLoggedIn.value) {
    loadChannels()
    checkPasskeyPrompt()
    await Promise.all([refreshNotificationCount(), loadNotificationPreview()])
    startNotificationPolling()
    await syncPushSubscriptionForCurrentUser()
  }

  // Refresh user status every 10 seconds to catch suspend/ban updates
  if (isLoggedIn.value && userId.value) {
    statusRefreshInterval.value = setInterval(() => {
      fetchUserType()
    }, 10000)
  }

  window.addEventListener('resize', handleSidebarResize)
  document.addEventListener('click', handleNotificationClickOutside)
  document.addEventListener('visibilitychange', handleNotificationVisibilityChange)
  offlineMode.value = !navigator.onLine

  if (process.client) {
    console.log('[PWA] Initializing PWA...')
    console.log('[PWA] Navigator SW:', !!navigator.serviceWorker)
    console.log('[PWA] Protocol:', window.location.protocol)
    console.log('[PWA] Hostname:', window.location.hostname)

    const { useRegisterSW } = await import('virtual:pwa-register/vue')
    const { offlineReady: swOfflineReady, needRefresh: swNeedRefreshVal, updateServiceWorker: updateSW } = useRegisterSW()

    offlineReady.value = swOfflineReady.value
    swNeedRefresh.value = swNeedRefreshVal.value
    updateServiceWorker.value = updateSW

    console.log('[PWA] Service Worker registered')

    watch(swNeedRefreshVal, (newVal) => {
      if (newVal) {
        needRefresh.value = true
        showUpdatePrompt.value = true
        console.log('[PWA] Update available')
      }
    })

    watch(swOfflineReady, (newVal) => {
      if (newVal) {
        offlineReady.value = true
        console.log('[PWA] App ready for offline use')
      }
    })

    // Capture beforeinstallprompt and trigger manually on real devices
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] beforeinstallprompt event fired!')
      e.preventDefault()
      deferredPrompt.value = e

      // Auto-trigger on real mobile (after SW is ready)
      navigator.serviceWorker.ready.then(() => {
        console.log('[PWA] Service Worker ready - triggering install prompt')
        if (deferredPrompt.value) {
          deferredPrompt.value.prompt()
          deferredPrompt.value.userChoice.then((choiceResult) => {
            console.log('[PWA] User response:', choiceResult.outcome)
            deferredPrompt.value = null
          })
        }
      }).catch(err => {
        console.error('[PWA] Error triggering prompt:', err)
      })
    })

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully')
      deferredPrompt.value = null
    })

    // Check manifest and service worker status
    navigator.serviceWorker.ready.then(() => {
      console.log('[PWA]  Service Worker is ready')

      // Check if SW is active
      if (navigator.serviceWorker.controller) {
        console.log('[PWA]  Service Worker is controlling the page')
      } else {
        console.warn('[PWA]  Service Worker NOT controlling page yet - may need reload')
      }
    }).catch(err => {
      console.error('[PWA]  Service Worker registration failed:', err)
    })

    // Verify manifest loads
    fetch('/manifest.webmanifest')
      .then(r => {
        console.log('[PWA] Manifest fetch status:', r.status)
        if (r.ok) return r.json()
        throw new Error(`HTTP ${r.status}`)
      })
      .then(manifest => {
        console.log('[PWA] Manifest loaded successfully')
        console.log('[PWA] Manifest name:', manifest.name)
        console.log('[PWA] Manifest icons:', manifest.icons?.length)
        console.log('[PWA] Manifest display:', manifest.display)
      })
      .catch(err => {
        console.error('[PWA]  Manifest error:', err)
      })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('scroll', handleMainContentScroll, { passive: true })
    handleMainContentScroll()
}})

onUnmounted(() => {
  window.removeEventListener('resize', handleSidebarResize)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('scroll', handleMainContentScroll)
  document.removeEventListener('click', handleNotificationClickOutside)
  document.removeEventListener('visibilitychange', handleNotificationVisibilityChange)
  stopNotificationPolling()
  if (statusRefreshInterval.value) {
    clearInterval(statusRefreshInterval.value)
  }
})

watch(isLoggedIn, (newValue) => {
  if (newValue) {
    loadChannels()
    checkPasskeyPrompt()
    refreshNotificationCount()
    loadNotificationPreview()
    startNotificationPolling()
    syncPushSubscriptionForCurrentUser()
    // Start status refresh when user logs in
    if (userId.value) {
      statusRefreshInterval.value = setInterval(() => {
        fetchUserType()
      }, 10000)
    }
  } else {
    channels.value = []
    showPasskeyPrompt.value = false
    notificationsDropdownOpen.value = false
    notificationPreview.value = []
    unreadNotificationCount.value = 0
    stopNotificationPolling()
    // Stop status refresh when user logs out
    if (statusRefreshInterval.value) {
      clearInterval(statusRefreshInterval.value)
      statusRefreshInterval.value = null
    }
  }

  emitAuthStateChanged()
})

watch(activeChannelAvatar, () => {
  avatarLoadFailed.value = false
})

watch(() => route.fullPath, async () => {
  await nextTick()
  handleMainContentScroll()
})

const checkAuthStatus = () => {
  if (!process.client) return
  const storedUserId = localStorage.getItem('user_id')
  const storedUsername = localStorage.getItem('username')

  isLoggedIn.value = !!storedUserId
  username.value = storedUsername || 'User'
  userId.value = storedUserId || ''
  const activeId = localStorage.getItem('active_account')
  activeAccount.value = activeId || 'personal'

  // Fetch user type from backend if logged in
  if (isLoggedIn.value && userId.value) {
    fetchUserType()
  }

  emitAuthStateChanged()
}

const fetchUserType = async () => {
  if (!userId.value) return
  try {
    const res = await fetch(`/api/v1/user/${userId.value}`, {
      headers: {
        'X-User-ID': userId.value
      }
    })
    if (res.ok) {
      const user = await res.json()
      userType.value = user.user_type || 'user'
      userStatus.value = user.status || 'active'
    }
  } catch (err) {
    console.error('Failed to fetch user type:', err)
    userType.value = 'user'
    userStatus.value = 'active'
  }
}

const loadChannels = async () => {
  if (!process.client || !userId.value) return
  failedChannelAvatars.value = {}
  const storedChannels = localStorage.getItem('user_channels')
  if (storedChannels) {
    try {
      channels.value = JSON.parse(storedChannels)
    } catch (e) {
      console.error('Failed to parse channels:', e)
    }
  }
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

  syncCategoriesFromStorage()

  try {
    const response = await fetch('/api/v1/categories')
    if (response.ok) {
      const categories = await response.json()
      localStorage.setItem('categories', JSON.stringify(categories || []))
      syncCategoriesFromStorage()
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const dismissPasskeyPrompt = () => {
  showPasskeyPrompt.value = false
  if (!process.client) return
  sessionStorage.setItem(PASSKEY_PROMPT_DISMISS_KEY, '1')
}

const checkPasskeyPrompt = async () => {
  if (!process.client || !isLoggedIn.value || !userId.value) {
    showPasskeyPrompt.value = false
    return
  }

  if (sessionStorage.getItem(PASSKEY_PROMPT_DISMISS_KEY) === '1') {
    showPasskeyPrompt.value = false
    return
  }

  try {
    const res = await fetch('/api/v1/passkeys', {
      headers: {
        'X-User-ID': userId.value
      }
    })

    if (!res.ok) {
      showPasskeyPrompt.value = false
      return
    }

    const passkeys = await res.json()
    showPasskeyPrompt.value = Array.isArray(passkeys) && passkeys.length === 0
  } catch (err) {
    console.error('Failed to check passkeys:', err)
    showPasskeyPrompt.value = false
  }
}

const handleUpdateApp = async () => {
  showUpdatePrompt.value = false
  if (updateServiceWorker.value) {
    await updateServiceWorker.value()
  }
}

const dismissUpdate = () => {
  showUpdatePrompt.value = false
}

const switchAccount = (accountId, accountName) => {
  if (!process.client) return

  // If switching to a channel (not personal), check if it's banned
  if (accountId !== userId.value) {
    const targetChannel = channels.value.find(ch => ch.id === accountId)
    if (targetChannel && targetChannel.status === 'banned') {
      alert('This channel has been banned and cannot be accessed.')
      return
    }
  }

  activeAccount.value = accountId
  avatarLoadFailed.value = false
  failedChannelAvatars.value = {}
  localStorage.setItem('active_account', accountId)
  localStorage.setItem('active_account_name', accountName)
  dropdownOpen.value = false
  window.location.reload()
}

const handleLogout = async () => {
  if (!process.client) return
  const previousUserID = userId.value
  await detachPushSubscriptionForUser(previousUserID)
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

const dismissAccountStatus = () => {
  // Just dismiss the banner, user can continue using the site
  // Status will persist and show again on page reload
}

const handleBannedLogout = () => {
  handleLogout()
}

router.afterEach(() => {
  checkAuthStatus()
  if (isLoggedIn.value) {
    checkPasskeyPrompt()
  }
})
</script>
