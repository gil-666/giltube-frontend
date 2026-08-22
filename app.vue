<template>
  <div
    class="min-h-screen bg-zinc-950 text-white flex flex-col overflow-x-hidden"
    :class="[activeShellThemeClass, { 'easter-egg-active': !!activeEasterEgg && canApplyEasterEggTheme }]"
  >
    <div
      v-if="transitionEasterEgg && easterEggTransitionPhase !== 'idle' && canApplyEasterEggTheme"
      class="easter-egg-wipe"
      :class="[
        `easter-egg-wipe--${transitionEasterEgg.id}`,
        `easter-egg-wipe--${easterEggTransitionPhase}`,
      ]"
      aria-hidden="true"
    >
      <span class="easter-egg-wipe__sparkle easter-egg-wipe__sparkle--one">✦</span>
      <span class="easter-egg-wipe__sparkle easter-egg-wipe__sparkle--two">✦</span>
      <span class="easter-egg-wipe__wordmark">{{ transitionEasterEgg.label }}</span>
    </div>

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
    <header v-if="!shouldHideTopBar"
      class="flex items-center justify-between border-b fixed left-0 right-0 transition-all duration-300"
      :class="[
        headerScrolled ? 'bg-zinc-950/50 backdrop-blur-md border-zinc-700 shadow-[0_8px_24px_rgba(0,0,0,0.35)]' : 'bg-zinc-950 border-zinc-800',
        isCompactMobileWatchTopBar ? 'h-10 px-3' : 'h-16 px-4'
      ]"
      :style="{ top: notificationBarHeight + 'px', zIndex: 60 }">
      <div class="flex items-center gap-3">
        <NuxtLink
          v-if="isMusicRoute"
          :to="localePath('/')"
          class="music-return-link flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
          :class="{ 'music-return-link-desktop': !isMobileDevice }"
          aria-label="Return to GilTube"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6" />
          </svg>
          <span v-if="!isMobileDevice" class="music-return-label">GilTube</span>
        </NuxtLink>
        <button v-else-if="!isMobileDevice" @click="isSidebarOpen = !isSidebarOpen" class="p-2 hover:bg-zinc-800 rounded transition" :class="{ 'md:hidden': !useCollapsibleDesktopSidebar }">
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
            <img
              v-if="isMusicRoute"
              :src="isMobileDevice ? musicLogoSymbol : musicLogoFull"
              alt="GilTube Music"
              class="music-brand-logo"
              :class="isMobileDevice ? 'music-brand-logo-symbol' : 'music-brand-logo-full'"
            />
            <img
              v-else-if="activeEasterEgg?.id === 'sabrina-tube' && canApplyEasterEggTheme && !sabrinaLogoFailed"
              :src="sabrinaLogoSrc"
              alt="SabrinaTube"
              class="sabrina-brand-logo"
              @error="handleSabrinaLogoError"
            />
            <span v-else-if="activeEasterEgg?.id === 'sabrina-tube' && canApplyEasterEggTheme" class="sabrina-brand-text">SabrinaTube</span>
            <img v-else src="./assets/logowhsmall.png" alt="GilTube" :class="isCompactMobileWatchTopBar ? 'h-6 object-contain' : 'h-8 object-contain md:h-14'" />
          </button>
          <!-- <span
            class="absolute -top-1.5 -right-1 md:top-0 md:-right-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-0.5 md:px-1.5 py-0 rounded">BETA</span> -->
        </div>
      </div>

      <div v-if="!isMobileDevice" ref="desktopSearchRef" class="relative hidden w-1/3 md:block">
        <input v-model="searchQuery" type="text" :placeholder="isMusicRoute ? 'Search music' : t('app.searchPlaceholder')"
          @focus="openSearchSuggestions"
          @keydown.enter="handleDesktopSearch()"
          class="w-full bg-zinc-900 px-4 py-2 rounded-full focus:outline-none text-white placeholder-gray-500" />
        <div
          v-if="!isMusicRoute && shouldShowSearchSuggestions"
          class="search-suggestions-scrollbar absolute left-0 right-0 top-11 max-h-[28rem] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/60"
          :style="{ zIndex: 9999 }"
        >
          <button
            v-for="item in searchSuggestions"
            :key="`${item.type}-${item.id}`"
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-800"
            @mousedown.prevent="goToSearchSuggestion(item)"
          >
            <div class="h-10 w-14 shrink-0 overflow-hidden rounded bg-zinc-800">
              <img v-if="suggestionImage(item)" :src="suggestionImage(item)" :alt="suggestionTitle(item)" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-xs text-zinc-500">{{ suggestionIcon(item) }}</div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-white">{{ suggestionTitle(item) }}</p>
              <p class="truncate text-xs text-zinc-400">{{ suggestionMeta(item) }}</p>
            </div>
            <span class="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
              {{ suggestionTypeLabel(item.type) }}
            </span>
          </button>
          <button
            v-if="searchQuery.trim()"
            type="button"
            class="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-3 text-left text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
            @mousedown.prevent="handleDesktopSearch()"
          >
            <span>⌕</span>
            <span>{{ t('app.searchAllFor', { query: searchQuery.trim() }) }}</span>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <nav v-if="!isMobileDevice && isMusicRoute" class="mr-2 flex items-center gap-1" aria-label="Music navigation">
          <NuxtLink
            :to="localePath('/music')"
            class="rounded-md px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            :class="{ 'bg-zinc-800 text-white': normalizedRoutePath === '/music' }"
          >
            {{ t('app.musicHome') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/music/library')"
            class="rounded-md px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            :class="{ 'bg-zinc-800 text-white': normalizedRoutePath.startsWith('/music/library') }"
          >
            {{ t('app.library') }}
          </NuxtLink>
        </nav>

        <button
          v-if="activeEasterEgg && canApplyEasterEggTheme && !isMobileDevice"
          type="button"
          class="sabrina-exit-button"
          aria-label="Exit SabrinaTube"
          @click="exitActiveEasterEgg"
        >
          <span aria-hidden="true">x</span>
          <span>Exit {{ activeEasterEgg.label }}</span>
        </button>

        <!-- Mobile Search Button -->
        <button
          v-if="isMobileDevice"
          type="button"
          class="flex items-center justify-center rounded-full text-zinc-200 transition hover:bg-zinc-800 hover:text-white"
          :class="isCompactMobileWatchTopBar ? 'h-8 w-8' : 'h-10 w-10'"
          :aria-label="t('app.search')"
          @click="openMobileSearch"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
        </button>

        <button v-else @click="showSearchBar = !showSearchBar" class="md:hidden p-2 hover:bg-zinc-800 rounded transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <!-- Create Menu (when logged in) -->
        <div v-if="isLoggedIn && userStatus === 'active' && !isMobileDevice && !isMusicRoute" ref="uploadDropdownRef" class="relative">
          <button
            type="button"
            @click="toggleUploadDropdown"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
            :aria-label="t('app.create')"
            :aria-expanded="uploadDropdownOpen"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <Transition name="menu-pop">
            <div
              v-if="uploadDropdownOpen"
              class="absolute right-0 top-11 w-56 origin-top-right overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/50"
              :style="{ zIndex: 9999 }"
            >
              <NuxtLink
                :to="localePath('/upload')"
                class="flex items-center gap-3 px-4 py-3 text-sm text-gray-100 transition hover:bg-zinc-800"
                @click="uploadDropdownOpen = false"
              >
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4h7l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 4v5h5M12 17V11m0 0-2.5 2.5M12 11l2.5 2.5" />
                  </svg>
                </span>
                <span class="font-semibold">{{ t('app.uploadVideo') }}</span>
              </NuxtLink>

              <NuxtLink
                :to="localePath('/go-live')"
                class="flex items-center gap-3 border-t border-zinc-800 px-4 py-3 text-sm text-gray-100 transition hover:bg-zinc-800"
                @click="uploadDropdownOpen = false"
              >
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.5-2.5A1 1 0 0 1 21 8.38v7.24a1 1 0 0 1-1.5.88L15 14" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12h.01M10 12h.01" />
                  </svg>
                </span>
                <span class="font-semibold">{{ t('app.goLive') }}</span>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- Upload Button Disabled (suspended/banned) -->
        <button v-if="isLoggedIn && userStatus !== 'active' && !isMobileDevice && !isMusicRoute" disabled
          :title="userStatus === 'suspended' ? 'Your account is suspended - you cannot upload' : 'Your account is banned - you cannot upload'"
          class="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full bg-gray-700 opacity-50 transition">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <div v-if="isLoggedIn && !isMobileDevice" class="relative" ref="notificationDropdownRef">
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

          <Transition name="menu-pop">
            <div
              v-if="notificationsDropdownOpen"
              class="fixed top-14 right-2 left-2 w-auto max-w-none origin-top-right overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:w-96"
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
          </Transition>
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
        <div v-if="isLoggedIn && !isMobileDevice" class="relative">
          <button @click="toggleAccountDropdown"
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

        <button
          v-else-if="isLoggedIn && isMobileDevice && !isCompactMobileWatchTopBar"
          type="button"
          class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-700"
          :aria-label="t('app.currentAccount')"
          @click="toggleAccountDropdown"
        >
          <img
            v-if="activeChannelAvatar && !avatarLoadFailed"
            :src="activeChannelAvatar"
            :alt="displayName"
            class="h-full w-full object-cover"
            @error="avatarLoadFailed = true"
          />
          <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
        </button>

        <!-- Login Link (when not logged in) -->
        <NuxtLink v-else-if="!isMobileDevice" :to="localePath('/login')" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition">
          {{ t('app.login') }}
        </NuxtLink>
      </div>
    </header>

    <button
      v-if="activeEasterEgg && canApplyEasterEggTheme && isMobileDevice && !shouldHideHeader"
      type="button"
      class="sabrina-mobile-exit-button"
      aria-label="Exit SabrinaTube"
      @click="exitActiveEasterEgg"
    >
      Exit {{ activeEasterEgg.label }}
    </button>

    <!-- Mobile Expanded Search Bar -->
    <div v-if="!shouldHideHeader && isMobileDevice" v-show="showSearchBar"
      class="fixed left-0 right-0 border-b border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl" :style="{ zIndex: 61, top: `${mobileSearchTopOffset}px` }">
      <div ref="mobileSearchRef" class="px-3 py-3">
        <div class="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/90 px-3 py-2.5 shadow-inner shadow-black/30">
          <svg class="h-5 w-5 shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" type="text" :placeholder="t('app.searchPlaceholder')"
            @focus="openSearchSuggestions"
            @keydown.enter="handleMobileSearch()" @keyup.enter="handleMobileSearch()" @keydown.esc="closeMobileSearch" autofocus
            class="min-w-0 flex-1 bg-transparent text-base text-white placeholder-zinc-500 focus:outline-none" />
          <button
            v-if="searchQuery"
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Clear search"
            @click="searchQuery = ''"
          >
            &times;
          </button>
          <button @click="handleMobileSearch()" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-500">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Close search"
            @click="closeMobileSearch"
          >
            &times;
          </button>
        </div>
        <div
          v-if="shouldShowSearchSuggestions"
          class="search-suggestions-scrollbar mt-2 max-h-[min(62vh,28rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-black/90 p-1 shadow-2xl shadow-black/70"
          :style="{ zIndex: 9999 }"
        >
          <button
            v-for="item in searchSuggestions"
            :key="`mobile-${item.type}-${item.id}`"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-zinc-900"
            @mousedown.prevent="goToSearchSuggestion(item)"
          >
            <div class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/5">
              <img v-if="suggestionImage(item)" :src="suggestionImage(item)" :alt="suggestionTitle(item)" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center text-xs text-zinc-500">{{ suggestionIcon(item) }}</div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-white">{{ suggestionTitle(item) }}</p>
              <p class="truncate text-xs text-zinc-400">{{ suggestionMeta(item) }}</p>
            </div>
            <span class="shrink-0 rounded-full bg-zinc-800/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-zinc-300">
              {{ suggestionTypeLabel(item.type) }}
            </span>
          </button>
          <button
            v-if="searchQuery.trim()"
            type="button"
            class="mt-1 flex w-full items-center gap-3 border-t border-zinc-800 px-3 py-3 text-left text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            @mousedown.prevent="handleMobileSearch()"
          >
            <span>⌕</span>
            <span>{{ t('app.searchAllFor', { query: searchQuery.trim() }) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Wrapper with padding for fixed header -->
    <div ref="mainScrollRef" class="flex-1 min-w-0 overflow-auto overflow-x-hidden"
      @scroll.passive="handleMainContentScroll"
      :style="mainScrollStyle">
      <!-- CONTENT AREA -->
      <div class="flex flex-1 min-h-0 min-w-0 relative">
        <!-- Mobile Overlay Backdrop -->
        <div
          v-if="isSidebarOpen && !shouldHideSidebar"
          class="fixed inset-0 bg-black bg-opacity-50"
          :class="{ 'md:hidden': !useCollapsibleDesktopSidebar }"
          :style="{ zIndex: 40 }"
          @click="isSidebarOpen = false" />

        <!-- Sidebar -->
        <aside v-if="!shouldHideSidebar"
          class="w-60 border-r transition-transform duration-300 fixed left-0 overflow-hidden"
          :class="{
            '-translate-x-full': !isSidebarOpen,
            'translate-x-0': isSidebarOpen,
            'md:-translate-x-full': useCollapsibleDesktopSidebar && !isSidebarOpen,
            'md:translate-x-0': !useCollapsibleDesktopSidebar || isSidebarOpen,
            'md:transition-none': !useCollapsibleDesktopSidebar,
            'bg-zinc-950/50 backdrop-blur-md border-zinc-700 shadow-[0_8px_24px_rgba(0,0,0,0.35)]': headerScrolled,
            'bg-zinc-950 border-zinc-800': !headerScrolled
          }"
          :style="{ top: (notificationBarHeight + 64) + 'px', bottom: 0, height: `calc(100dvh - ${notificationBarHeight + 64}px)`, zIndex: 50 }">
          <nav class="flex h-full min-h-0 flex-col p-4">
            <div class="shrink-0 space-y-3">
              <NuxtLink :to="localePath('/')" class="hover:bg-zinc-800 p-2 rounded cursor-pointer block">{{ t('app.home') }}</NuxtLink>
              <NuxtLink
                :to="localePath('/music')"
                class="flex items-center gap-2 rounded p-2 font-semibold text-rose-300 transition hover:bg-zinc-800 hover:text-white"
                :class="{ 'bg-zinc-800 text-white': normalizedRoutePath.startsWith('/music') }"
              >
                <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" />
                </svg>
                <span class="min-w-0 flex-1 truncate">{{ t('app.giltubeMusic') }}</span>
                <span class="shrink-0 rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-black leading-none text-white">NEW</span>
              </NuxtLink>
              <NuxtLink v-if="isLoggedIn" :to="localePath('/subscriptions')"
                class="flex items-center gap-2 rounded p-2 font-semibold text-red-300 transition hover:bg-zinc-800 hover:text-white"
                :class="{ 'bg-zinc-800 text-white': normalizedRoutePath.startsWith('/subscriptions') }">
                <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20v-2a5 5 0 0 1 10 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7v4m2-2h-4" />
                </svg>
                <span>{{ t('app.subscriptions') }}</span>
              </NuxtLink>
              <!-- Dashboard (only when logged in) -->
              <NuxtLink v-if="isLoggedIn" :to="localePath('/dashboard')"
                class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-blue-400 font-semibold">{{ t('app.dashboard') }}
              </NuxtLink>
              <NuxtLink v-if="isLoggedIn" :to="localePath('/notifications')"
                class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-indigo-300 font-semibold">{{ t('app.notifications') }}
              </NuxtLink>
              <NuxtLink v-if="isLoggedIn" :to="localePath('/playlists')"
                class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-purple-400 font-semibold">{{ t('playlists.myPlaylists') }}
              </NuxtLink>
              <!-- My Channel (only when signed into a channel, not personal) -->
              <NuxtLink v-if="activeAccount !== 'personal' && activeAccount !== userId && isLoggedIn"
                :to="localePath(`/channel/${activeAccount}`)"
                class="hover:bg-zinc-800 p-2 rounded cursor-pointer block text-yellow-400 font-semibold">{{ t('app.myChannel') }}
              </NuxtLink>
            </div>

            <!-- Categories Divider -->
            <div class="mt-3 flex min-h-0 flex-1 flex-col border-t border-zinc-700 pt-3">
              <p class="text-xs text-gray-500 font-semibold px-2 mb-2">{{ t('app.categories') }}</p>
              <div class="giltube-sidebar-category-scroll min-h-0 flex-1 space-y-1 overflow-y-auto">
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
            <div class="mt-3 shrink-0 border-t border-zinc-700 pt-3">
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
        <div ref="contentScrollRef" class="route-page-shell flex-1 min-w-0" :class="!shouldHideSidebar && !useCollapsibleDesktopSidebar ? 'md:ml-60' : ''">
          <NuxtPage :page-key="pageTransitionKey" />
        </div>

      </div>
    </div>

    <GlobalMusicPlayer />

    <nav
      v-if="isMobileDevice && !shouldHideHeader"
      class="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[70] border-t border-zinc-800 bg-zinc-950/95 px-2 pt-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style="padding-bottom: max(env(safe-area-inset-bottom), 0.4rem);"
      aria-label="Mobile navigation"
    >
      <div class="grid grid-cols-5 gap-1">
        <template v-if="isMusicRoute">
          <NuxtLink :to="localePath('/music')" class="mobile-bottom-nav-item" :class="{ 'text-white': normalizedRoutePath === '/music' }">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10.75 12 4l9 6.75V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.25Z" />
            </svg>
            <span>{{ t('app.home') }}</span>
          </NuxtLink>

          <NuxtLink :to="localePath('/music/search')" class="mobile-bottom-nav-item" :class="{ 'text-white': normalizedRoutePath.startsWith('/music/search') }">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
            <span>{{ t('app.search') }}</span>
          </NuxtLink>

          <button type="button" class="mobile-bottom-nav-item music-now-playing-nav" :class="{ 'text-white': shellMusicTrack }" :disabled="!shellMusicTrack" @click="openShellMusicPlayer">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" />
            </svg>
            <span>{{ t('app.nowPlaying') }}</span>
          </button>

          <NuxtLink :to="localePath('/music/library')" class="mobile-bottom-nav-item" :class="{ 'text-white': normalizedRoutePath.startsWith('/music/library') }">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4h14a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1Zm3 0v16m4-16v16" />
            </svg>
            <span>{{ t('app.library') }}</span>
          </NuxtLink>

          <button type="button" class="mobile-bottom-nav-item" :class="{ 'text-white': mobileMoreOpen }" @click="openMobileMore">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <span>{{ t('app.menu') }}</span>
          </button>
        </template>

        <template v-else>
        <NuxtLink :to="localePath('/')" class="mobile-bottom-nav-item" :class="{ 'text-white': normalizedRoutePath === '/' }">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10.75 12 4l9 6.75V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.25Z" />
          </svg>
          <span>{{ t('app.home') }}</span>
        </NuxtLink>

        <NuxtLink
          :to="localePath(isLoggedIn ? '/dashboard' : '/login')"
          class="mobile-bottom-nav-item"
          :class="{ 'text-white': normalizedRoutePath.startsWith('/dashboard') }"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm9 0a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V5ZM4 15a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Zm9-3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-7Z" />
          </svg>
          <span>{{ t('app.dashboard') }}</span>
        </NuxtLink>

        <button
          type="button"
          class="mobile-bottom-nav-item mobile-bottom-nav-create"
          :class="{ 'text-white': mobileCreateOpen }"
          @click="toggleMobileCreate"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 5v14M5 12h14" />
          </svg>
          <span>{{ t('app.create') }}</span>
        </button>

        <NuxtLink
          :to="localePath(mobileMyChannelPath)"
          class="mobile-bottom-nav-item"
          :class="{ 'text-white': normalizedRoutePath.startsWith('/channel/') || normalizedRoutePath.startsWith('/my-channels') }"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21h6M12 18v3" />
          </svg>
          <span>{{ t('app.myChannel') }}</span>
        </NuxtLink>

        <button type="button" class="mobile-bottom-nav-item" :class="{ 'text-white': mobileMoreOpen }" @click="openMobileMore">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span>{{ t('app.menu') }}</span>
        </button>
        </template>
      </div>
    </nav>

    <Transition name="fade-soft">
      <div
        v-if="isMobileDevice && mobileCreateOpen && !shouldHideHeader"
        class="fixed inset-0 z-[68]"
        @click="mobileCreateOpen = false"
      />
    </Transition>

    <Transition name="menu-pop">
      <div
        v-if="isMobileDevice && mobileCreateOpen && !shouldHideHeader"
        class="mobile-create-menu fixed inset-x-3 z-[72] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60"
        style="bottom: calc(5.1rem + env(safe-area-inset-bottom, 0px));"
      >
        <NuxtLink
          :to="localePath('/upload')"
          class="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-900"
          @click="mobileCreateOpen = false"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4h7l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 4v5h5M12 17V11m0 0-2.5 2.5M12 11l2.5 2.5" />
            </svg>
          </span>
          {{ t('app.uploadVideo') }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('/go-live')"
          class="flex items-center gap-3 border-t border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-900"
          @click="mobileCreateOpen = false"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.5-2.5A1 1 0 0 1 21 8.38v7.24a1 1 0 0 1-1.5.88L15 14" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
            </svg>
          </span>
          {{ t('app.goLive') }}
        </NuxtLink>
      </div>
    </Transition>

    <Transition name="fade-soft">
      <div
        v-if="isMobileDevice && mobileMoreOpen && !shouldHideHeader"
        class="mobile-menu-backdrop fixed inset-0 z-[94] bg-black/60 backdrop-blur-[2px]"
        @click="mobileMoreOpen = false"
      />
    </Transition>

    <Transition name="mobile-sheet">
      <section
        v-if="isMobileDevice && mobileMoreOpen && !shouldHideHeader"
        class="mobile-more-sheet fixed inset-x-0 bottom-0 z-[95] flex max-h-[84dvh] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl"
        style="padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);"
        aria-label="Mobile menu"
      >
        <div class="shrink-0 px-4 pt-3">
          <div class="mobile-sheet-grabber mx-auto h-1 w-11 rounded-full bg-zinc-700" />
          <div class="mt-3 flex items-center justify-between">
            <button
              type="button"
              class="flex min-w-0 items-center gap-3 rounded-2xl p-1.5 text-left transition hover:bg-zinc-900"
              :disabled="!isLoggedIn"
              :aria-label="t('app.switchProfile')"
              @click="openMobileAccountPanel"
            >
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-zinc-200"
              >
                <img
                  v-if="isLoggedIn && activeChannelAvatar && !avatarLoadFailed"
                  :src="activeChannelAvatar"
                  :alt="displayName"
                  class="h-full w-full object-cover"
                  @error="avatarLoadFailed = true"
                />
                <span v-else>{{ (isLoggedIn ? displayName : t('app.menu')).charAt(0).toUpperCase() }}</span>
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-white">{{ isLoggedIn ? displayName : t('app.menu') }}</p>
                <p class="truncate text-xs text-zinc-500">{{ isLoggedIn ? username : t('app.login') }}</p>
              </div>
            </button>
            <button
              type="button"
              class="mobile-menu-close flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Close menu"
              @click="mobileMoreOpen = false"
            >
              X
            </button>
          </div>
        </div>

        <div class="mt-4 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <template v-if="isMusicRoute">
            <NuxtLink
              :to="localePath('/')"
              class="mobile-sheet-action mobile-sheet-action-wide mb-2 text-rose-300"
              @click="mobileMoreOpen = false"
            >
              <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m11 5-7 7 7 7M4 12h16" />
              </svg>
              <span>{{ t('app.returnToGilTube') }}</span>
            </NuxtLink>

            <div class="grid grid-cols-3 gap-2">
              <NuxtLink :to="localePath('/music')" class="mobile-sheet-action text-red-300" @click="mobileMoreOpen = false">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10.75 12 4l9 6.75V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.25Z" /></svg>
                <span>{{ t('app.musicHome') }}</span>
              </NuxtLink>
              <NuxtLink :to="localePath('/music/search')" class="mobile-sheet-action text-blue-300" @click="mobileMoreOpen = false">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" /></svg>
                <span>{{ t('app.search') }}</span>
              </NuxtLink>
              <NuxtLink :to="localePath('/music/library')" class="mobile-sheet-action text-purple-300" @click="mobileMoreOpen = false">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4h14a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1Zm3 0v16m4-16v16" /></svg>
                <span>{{ t('app.library') }}</span>
              </NuxtLink>
              <button type="button" class="mobile-sheet-action text-green-300" :disabled="!shellMusicTrack" @click="openShellMusicPlayer">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" /></svg>
                <span>{{ t('app.nowPlaying') }}</span>
              </button>
              <NuxtLink v-if="isLoggedIn" :to="localePath('/account-settings')" class="mobile-sheet-action text-cyan-300" @click="mobileMoreOpen = false">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.3 4.3h3.4l.6 2.2c.5.2 1 .5 1.4.8l2.2-.6 1.7 3-1.6 1.6a6 6 0 0 1 0 1.4l1.6 1.6-1.7 3-2.2-.6c-.4.3-.9.6-1.4.8l-.6 2.2h-3.4l-.6-2.2c-.5-.2-1-.5-1.4-.8l-2.2.6-1.7-3L6 12.7a6 6 0 0 1 0-1.4L4.4 9.7l1.7-3 2.2.6c.4-.3.9-.6 1.4-.8l.6-2.2Z" /></svg>
                <span>{{ t('app.accountSettings') }}</span>
              </NuxtLink>
              <NuxtLink v-if="userType === 'admin'" to="/admin/music" class="mobile-sheet-action text-yellow-300" @click="mobileMoreOpen = false">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg>
                <span>{{ t('app.musicAdmin') }}</span>
              </NuxtLink>
            </div>
          </template>

          <template v-else>
          <NuxtLink
            :to="localePath('/music')"
            class="mobile-sheet-action mobile-sheet-action-wide mb-2 text-rose-300"
            :class="{ 'bg-zinc-800 text-white': normalizedRoutePath.startsWith('/music') }"
            @click="mobileMoreOpen = false"
          >
            <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" />
            </svg>
            <span>{{ t('app.giltubeMusic') }}</span>
            <span class="rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-black leading-none text-white">NEW</span>
          </NuxtLink>

          <div class="grid grid-cols-3 gap-2">
            <NuxtLink v-if="isLoggedIn" :to="localePath('/dashboard')" class="mobile-sheet-action text-blue-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm9 0a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V5ZM4 15a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Zm9-3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-7Z" />
              </svg>
              <span>{{ t('app.dashboard') }}</span>
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" :to="localePath('/subscriptions')" class="mobile-sheet-action text-red-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20v-2a5 5 0 0 1 10 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7v4m2-2h-4" />
              </svg>
              <span>{{ t('app.subscriptions') }}</span>
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" :to="localePath('/notifications')" class="mobile-sheet-action text-indigo-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.04-.59 1.42L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
              </svg>
              <span>{{ t('app.notifications') }}</span>
              <span v-if="unreadNotificationCount > 0" class="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
              </span>
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" :to="localePath('/playlists')" class="mobile-sheet-action text-purple-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <span>{{ t('playlists.myPlaylists') }}</span>
            </NuxtLink>
            <NuxtLink v-if="activeAccount !== 'personal' && activeAccount !== userId && isLoggedIn" :to="localePath(`/channel/${activeAccount}`)" class="mobile-sheet-action text-yellow-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21h6M12 18v3" />
              </svg>
              <span>{{ t('app.myChannel') }}</span>
            </NuxtLink>
            <NuxtLink v-if="userType === 'admin'" to="/admin" class="mobile-sheet-action text-purple-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3 4 6v6c0 5 3.4 7.5 8 9 4.6-1.5 8-4 8-9V6l-8-3Z" />
              </svg>
              <span>{{ t('app.adminPanel') }}</span>
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" :to="localePath('/account-settings')" class="mobile-sheet-action text-cyan-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.3 4.3h3.4l.6 2.2c.5.2 1 .5 1.4.8l2.2-.6 1.7 3-1.6 1.6a6 6 0 0 1 0 1.4l1.6 1.6-1.7 3-2.2-.6c-.4.3-.9.6-1.4.8l-.6 2.2h-3.4l-.6-2.2c-.5-.2-1-.5-1.4-.8l-2.2.6-1.7-3L6 12.7a6 6 0 0 1 0-1.4L4.4 9.7l1.7-3 2.2.6c.4-.3.9-.6 1.4-.8l.6-2.2Z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              </svg>
              <span>{{ t('app.accountSettings') }}</span>
            </NuxtLink>
            <NuxtLink v-if="isLoggedIn" :to="localePath('/my-channels')" class="mobile-sheet-action text-yellow-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20v-2a5 5 0 0 1 10 0v2" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 8v4m2-2h-4" />
              </svg>
              <span>{{ t('app.manageChannels') }}</span>
            </NuxtLink>
            <NuxtLink v-if="!isLoggedIn" :to="localePath('/login')" class="mobile-sheet-action text-red-300" @click="mobileMoreOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span>{{ t('app.login') }}</span>
            </NuxtLink>
            <button type="button" class="mobile-sheet-action mobile-sheet-action-wide text-blue-300" @click="openMobileCategories">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5h7v7H4V5Zm9 0h7v7h-7V5ZM4 14h7v5H4v-5Zm9 0h7v5h-7v-5Z" />
              </svg>
              <span>{{ t('app.browseByCategory') }}</span>
            </button>
          </div>
          </template>

          <div class="mt-5 border-t border-zinc-800 pt-4">
            <p class="px-1 text-xs font-semibold uppercase text-zinc-500">{{ t('app.language') }}</p>
            <select
              :value="locale"
              @change="onLocaleChange"
              class="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              :aria-label="t('app.language')"
            >
              <option v-for="item in locales" :key="item.code" :value="item.code">
                {{ item.code === 'en' ? '🇺🇸 English (US)' : '🇲🇽 Español (México)' }}
              </option>
            </select>
          </div>

          <button
            v-if="isLoggedIn"
            type="button"
            class="mobile-menu-logout mt-5 w-full rounded-lg border border-red-900/70 px-3 py-2.5 text-left text-sm font-semibold text-red-300 transition hover:bg-red-950/40"
            @click="handleMobileLogout"
          >
            {{ t('app.logout') }}
          </button>
        </div>
      </section>
    </Transition>

    <Transition name="mobile-sheet">
      <section
        v-if="isMobileDevice && mobileCategoriesOpen && !shouldHideHeader"
        class="mobile-categories-menu fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white"
        aria-label="Browse by category"
      >
        <div
          class="shrink-0 border-b border-zinc-800 bg-zinc-950/95 px-4 pb-3 pt-4 backdrop-blur-xl"
          :style="{ paddingTop: `calc(${notificationBarHeight}px + env(safe-area-inset-top, 0px) + 0.75rem)` }"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase text-zinc-500">{{ t('app.categories') }}</p>
              <h2 class="text-xl font-bold">{{ t('app.browseByCategory') }}</h2>
            </div>
            <button
              type="button"
              class="mobile-menu-close flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Close categories"
              @click="mobileCategoriesOpen = false"
            >
              X
            </button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3" style="padding-bottom: max(env(safe-area-inset-bottom), 1rem);">
          <NuxtLink
            :to="localePath('/')"
            class="mb-1 block rounded-xl px-4 py-3 text-base font-semibold text-zinc-200 transition hover:bg-zinc-900"
            :class="{ 'bg-blue-600 text-white': route.path === '/' && !route.params.slug }"
            @click="mobileCategoriesOpen = false"
          >
            {{ t('app.allVideos') }}
          </NuxtLink>
          <NuxtLink
            v-for="category in categoriesWithVideos"
            :key="category.id"
            :to="localePath(`/category/${category.slug}`)"
            class="mb-1 block rounded-xl px-4 py-3 text-base font-semibold text-zinc-200 transition hover:bg-zinc-900"
            :class="{ 'bg-blue-600 text-white': route.params.slug === category.slug }"
            @click="mobileCategoriesOpen = false"
          >
            {{ category.name }}
          </NuxtLink>
        </div>
      </section>
    </Transition>

  </div>

  <!-- Locale Picker Modal (shown only on first visit) -->
  <LocalePickerModal />
  <div
    v-if="activeWatchParty && !isInsideWatchPartyRoute && !isWatchPartyWidgetDismissed"
    class="fixed bottom-4 right-4 z-[90] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-red-500/40 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Watch party running</p>
        <p class="mt-1 truncate text-sm font-semibold">{{ activeWatchParty.title || 'Watch party' }}</p>
      </div>
      <button
        type="button"
        class="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        aria-label="Dismiss watch party widget"
        @click="dismissWatchPartyWidget"
      >
        X
      </button>
    </div>
    <div class="mt-3 flex gap-2">
      <NuxtLink
        :to="localePath(`/watch-party/${activeWatchParty.id}?room=1`)"
        class="flex-1 rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-semibold transition hover:bg-red-700"
      >
        Open
      </NuxtLink>
      <button
        type="button"
        class="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-700"
        @click="leaveActiveWatchParty"
      >
        Leave
      </button>
    </div>
  </div>
  <button
    v-else-if="activeWatchParty && !isInsideWatchPartyRoute && isWatchPartyWidgetDismissed"
    type="button"
    class="fixed bottom-4 right-4 z-[90] inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-zinc-950/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur transition hover:bg-zinc-900"
    @click="restoreWatchPartyWidget"
  >
    <span class="h-2.5 w-2.5 rounded-full bg-red-500" />
    <span class="truncate">{{ activeWatchParty.title || 'Watch party' }}</span>
  </button>
  <div
    v-if="showGilIDLinkModal"
    class="giltube-modal-overlay bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div class="w-full max-w-lg rounded-2xl border border-cyan-800 bg-zinc-950 shadow-2xl">
      <div class="border-b border-zinc-800 px-6 py-5">
        <div class="flex items-center gap-3">
          <img src="./assets/gilservices-logo.png" alt="GilServices" class="h-10 w-10 rounded-lg object-contain bg-white/5 p-1" />
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{{ t('login.gilidNetworkBadge') }}</p>
        </div>
        <h2 class="mt-3 text-2xl font-bold text-white">{{ t('app.gilidLinkTitle') }}</h2>
        <p class="mt-3 text-sm leading-6 text-zinc-300">{{ t('app.gilidLinkBody') }}</p>
        <p class="mt-3 text-sm text-cyan-200">{{ t('app.gilidLinkPasskeyNote') }}</p>
      </div>

      <div class="px-6 py-5">
        <label class="flex items-start gap-3 text-sm text-zinc-300">
          <input
            v-model="hideGilIDPromptPermanently"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-cyan-500 focus:ring-cyan-500"
          />
          <span>{{ t('app.gilidDontShowAgain') }}</span>
        </label>
      </div>

      <div class="flex flex-col-reverse gap-3 border-t border-zinc-800 px-6 py-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          @click="dismissGilIDLinkModal"
        >
          {{ t('app.gilidDismiss') }}
        </button>
        <button
          type="button"
          :disabled="gilidLinking"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-300"
          @click="startGilIDLink"
        >
          <img src="./assets/gilservices-logo.png" alt="" class="h-4 w-4 object-contain" />
          {{ gilidLinking ? t('accountSettings.gilidRedirecting') : t('app.gilidLinkButton') }}
        </button>
      </div>
    </div>
  </div>
  <!-- Profile Dropdown Portal (outside header for z-index independence) -->
  <Transition name="fade-soft">
    <div
      v-if="dropdownOpen"
      class="fixed inset-0 pointer-events-auto bg-black/60 backdrop-blur-[2px]"
      :class="{ 'bg-black/35': !isMobileDevice }"
      :style="{ zIndex: 9998 }"
      @click="dropdownOpen = false"
    />
  </Transition>

  <Transition name="menu-pop">
    <div
      v-if="dropdownOpen"
      class="fixed pointer-events-auto"
      :class="isMobileDevice ? 'inset-0 flex items-center justify-center px-4' : 'origin-top-right'"
      :style="accountDropdownStyle"
    >
      <section
        class="flex min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl shadow-black/70"
        :class="isMobileDevice ? 'max-h-[min(82dvh,42rem)]' : 'max-h-[min(34rem,calc(100dvh-5rem))]'"
        @click.stop
      >
        <div class="shrink-0 border-b border-zinc-800 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-lg font-black text-zinc-200">
                <img
                  v-if="activeChannelAvatar && !avatarLoadFailed"
                  :src="activeChannelAvatar"
                  :alt="displayName"
                  class="h-full w-full object-cover"
                  @error="avatarLoadFailed = true"
                />
                <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="min-w-0">
                <h2 class="mt-1 truncate text-xl font-black">{{ displayName }}</h2>
                <p v-if="displayName !== username" class="mt-1 truncate text-xs text-zinc-500">{{ username }}</p>
              </div>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Close account menu"
              @click="dropdownOpen = false"
            >
              X
            </button>
          </div>
        </div>

        <div class="giltube-account-panel-scroll min-h-0 flex-1 overflow-y-auto p-2">
          <button
            type="button"
            class="account-panel-row"
            :class="activeAccount === 'personal' || activeAccount === userId ? 'account-panel-row-active' : ''"
            @click="switchAccount(userId, username)"
          >
            <span class="account-panel-avatar bg-zinc-800 text-zinc-200">{{ username.charAt(0).toUpperCase() }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-bold">{{ username }}</span>
              <span class="block text-xs text-zinc-500">{{ t('app.personal') }}</span>
            </span>
            <span v-if="activeAccount === 'personal' || activeAccount === userId" class="account-panel-check">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m5 13 4 4L19 7" />
              </svg>
            </span>
          </button>

          <template v-if="channels.length > 0">
            <p class="mt-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{{ t('app.yourChannels') }}</p>
            <button
              v-for="channel in channels"
              :key="channel.id"
              type="button"
              class="account-panel-row"
              :disabled="channel.status === 'banned'"
              :title="channel.status === 'banned' ? 'This channel has been banned' : channel.status === 'suspended' ? 'This channel is suspended' : ''"
              :class="[
                activeAccount === channel.id ? 'account-panel-row-active' : '',
                channel.status === 'banned' ? 'cursor-not-allowed opacity-45' : ''
              ]"
              @click="switchAccount(channel.id, channel.name)"
            >
              <span class="account-panel-avatar">
                <img
                  v-if="getChannelAvatarUrl(channel) && !failedChannelAvatars[channel.id]"
                  :src="getChannelAvatarUrl(channel)"
                  :alt="channel.name"
                  class="h-full w-full object-cover"
                  @error="failedChannelAvatars[channel.id] = true"
                />
                <span v-else>{{ channel.name.charAt(0).toUpperCase() }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-bold">{{ channel.name }}</span>
                <span class="block text-xs text-zinc-500">{{ channel.is_default ? 'Default channel' : 'Channel' }}</span>
              </span>
              <span v-if="channel.status === 'suspended'" class="rounded-full border border-yellow-900 bg-yellow-950/70 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-200">Suspended</span>
              <span v-else-if="channel.status === 'banned'" class="rounded-full border border-red-900 bg-red-950/70 px-2 py-0.5 text-[10px] font-bold uppercase text-red-200">Banned</span>
              <span v-else-if="activeAccount === channel.id" class="account-panel-check">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m5 13 4 4L19 7" />
                </svg>
              </span>
            </button>
          </template>
        </div>

        <div v-if="!isMobileDevice" class="grid shrink-0 gap-2 border-t border-zinc-800 p-3">
          <NuxtLink
            v-if="userType === 'admin'"
            to="/admin"
            class="account-panel-action text-purple-300"
            @click="dropdownOpen = false"
          >
            {{ t('app.adminPanel') }}
          </NuxtLink>
          <div class="grid gap-2 sm:grid-cols-2">
            <NuxtLink :to="localePath('/my-channels')" class="account-panel-action text-yellow-300" @click="dropdownOpen = false">
              {{ t('app.manageChannels') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/account-settings')" class="account-panel-action text-cyan-300" @click="dropdownOpen = false">
              {{ t('app.accountSettings') }}
            </NuxtLink>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <NuxtLink :to="localePath('/create-channel')" class="account-panel-action text-green-300" @click="dropdownOpen = false">
              {{ t('app.createChannel') }}
            </NuxtLink>
            <button type="button" class="account-panel-action text-red-300" @click="handleLogout">
              {{ t('app.logout') }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import GlobalMusicPlayer from '~/app/components/music/GlobalMusicPlayer.vue'
import { useEasterEggs } from '~/app/composables/useEasterEggs'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import musicLogoFull from '~/assets/giltube-music-logo-full.png'
import musicLogoSymbol from '~/assets/giltube-music-logo-symbol.png'
import { beginGilIDAuth, getMyAccount } from '~/app/service/auth'
import { fetchUserChannels, setDefaultChannel } from '~/app/service/upload'
import { clearAuthSession } from '~/app/utils/authSession'
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getPushConfig,
  subscribePush,
} from '~/app/service/notifications'
import { getWatchParty, leaveWatchParty } from '~/app/service/watchParties'

const router = useRouter()
const route = useRoute()
const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const requestHeaders = process.server ? useRequestHeaders(['user-agent']) : {}
const pageTransitionKey = (routeLocation) => routeLocation.fullPath
const isLikelyMobileUserAgent = (userAgent = '', maxTouchPoints = 0) => {
  const ua = String(userAgent || '')
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ||
    (/Macintosh/i.test(ua) && maxTouchPoints > 1)
}
const isLoggedIn = ref(false)
const username = ref('')
const userId = ref('')
const userType = ref('user')
const userStatus = ref('active')
const isMobileDevice = ref(isLikelyMobileUserAgent(process.server ? requestHeaders['user-agent'] : ''))
const isSidebarOpen = ref(false)
const showSearchBar = ref(false)
const mobileMoreOpen = ref(false)
const mobileCreateOpen = ref(false)
const mobileCategoriesOpen = ref(false)
const searchQuery = ref('')
const sabrinaLogoFailed = ref(false)
const sabrinaLogoSourceIndex = ref(0)
const searchSuggestions = ref([])
const searchSuggestionsOpen = ref(false)
const searchSuggestionsLoading = ref(false)
const desktopSearchRef = ref(null)
const mobileSearchRef = ref(null)
const { currentTrack: shellMusicTrack, openPlayer: openMusicPlayerPanel } = useMusicPlayer()
const {
  activeEasterEgg,
  activeThemeClass,
  activateFromSearchQuery,
  clearEasterEgg,
  easterEggTransitionPhase,
  hydrateEasterEggs,
  transitionEasterEgg,
} = useEasterEggs()
const activeWatchParty = ref(null)
const watchPartyWidgetDismissed = ref(false)
const isInsideWatchPartyRoute = computed(() => route.path.includes('/watch-party/'))
const isVideoWatchRoute = computed(() => normalizedRoutePath.value.startsWith('/video/'))
const useCollapsibleDesktopSidebar = computed(() => isInsideWatchPartyRoute.value || isVideoWatchRoute.value)
let watchPartyStatusInterval = null
let searchSuggestTimer = null
let searchSuggestRequestID = 0

const shouldShowSearchSuggestions = computed(() =>
  !isMusicRoute.value &&
  searchSuggestionsOpen.value &&
  searchQuery.value.trim().length >= 2 &&
  searchSuggestions.value.length > 0
)

const sabrinaLogoSources = ['/sabrina-tube-logo.png', '/sabrina-tube-logo.svg']
const sabrinaLogoSrc = computed(() => sabrinaLogoSources[sabrinaLogoSourceIndex.value] || '')

const exitActiveEasterEgg = async () => {
  await clearEasterEgg()
  sabrinaLogoFailed.value = false
  sabrinaLogoSourceIndex.value = 0
}

const handleSabrinaLogoError = () => {
  if (sabrinaLogoSourceIndex.value < sabrinaLogoSources.length - 1) {
    sabrinaLogoSourceIndex.value += 1
    return
  }
  sabrinaLogoFailed.value = true
}

const tryActivateEasterEggFromSearch = async () => {
  if (!canApplyEasterEggTheme.value) return false
  if (!searchQuery.value.trim()) return false
  const didActivate = await activateFromSearchQuery(searchQuery.value)
  if (!didActivate) return false

  searchQuery.value = ''
  searchSuggestionsOpen.value = false
  showSearchBar.value = false
  mobileMoreOpen.value = false
  mobileCreateOpen.value = false
  mobileCategoriesOpen.value = false
  return true
}

const handleDesktopSearch = async () => {
  if (await tryActivateEasterEggFromSearch()) return
  if (searchQuery.value.trim()) {
    const base = isMusicRoute.value ? '/music/search' : '/search'
    const path = localePath(`${base}?q=${encodeURIComponent(searchQuery.value)}`)
    searchSuggestionsOpen.value = false
    await router.push(path)
  }
}

const handleMobileSearch = async () => {
  if (await tryActivateEasterEggFromSearch()) return
  if (searchQuery.value.trim()) {
    const base = isMusicRoute.value ? '/music/search' : '/search'
    const path = localePath(`${base}?q=${encodeURIComponent(searchQuery.value)}`)
    searchSuggestionsOpen.value = false
    await router.push(path)
    showSearchBar.value = false
  }
}

const openMobileSearch = async () => {
  mobileMoreOpen.value = false
  mobileCreateOpen.value = false
  mobileCategoriesOpen.value = false
  showSearchBar.value = true
  searchSuggestionsOpen.value = true
  await nextTick()
  mobileSearchRef.value?.querySelector?.('input')?.focus?.()
}

const closeMobileSearch = () => {
  showSearchBar.value = false
  searchSuggestionsOpen.value = false
}

const toggleMobileCreate = async () => {
  mobileMoreOpen.value = false
  mobileCategoriesOpen.value = false
  showSearchBar.value = false
  if (!isLoggedIn.value || userStatus.value !== 'active') {
    await router.push(localePath('/login'))
    return
  }
  mobileCreateOpen.value = !mobileCreateOpen.value
}

const openMobileCategories = () => {
  mobileMoreOpen.value = false
  mobileCreateOpen.value = false
  showSearchBar.value = false
  mobileCategoriesOpen.value = true
}

const openMobileMore = () => {
  mobileCreateOpen.value = false
  mobileCategoriesOpen.value = false
  showSearchBar.value = false
  mobileMoreOpen.value = true
}

const openSearchSuggestions = () => {
  if (isMusicRoute.value) {
    searchSuggestionsOpen.value = false
    return
  }
  searchSuggestionsOpen.value = true
  fetchSearchSuggestionsDebounced()
}

const fetchSearchSuggestionsDebounced = () => {
  if (searchSuggestTimer) clearTimeout(searchSuggestTimer)
  const query = searchQuery.value.trim()
  if (query.length < 2) {
    searchSuggestions.value = []
    searchSuggestionsLoading.value = false
    return
  }
  searchSuggestTimer = setTimeout(fetchSearchSuggestions, 180)
}

const fetchSearchSuggestions = async () => {
  const query = searchQuery.value.trim()
  if (query.length < 2) return
  const requestID = ++searchSuggestRequestID
  searchSuggestionsLoading.value = true
  try {
    const response = await fetch(`/api/v1/search/suggest?q=${encodeURIComponent(query)}&limit=8`)
    if (!response.ok) throw new Error('suggest failed')
    const data = await response.json()
    if (requestID === searchSuggestRequestID) {
      searchSuggestions.value = data.suggestions || []
    }
  } catch (err) {
    if (requestID === searchSuggestRequestID) {
      searchSuggestions.value = []
    }
  } finally {
    if (requestID === searchSuggestRequestID) {
      searchSuggestionsLoading.value = false
    }
  }
}

const suggestionTitle = (item) => item?.type === 'channel' ? item?.name || item?.title : item?.title || item?.name || ''
const suggestionImage = (item) => item?.thumbnail || item?.backdrop_url || item?.poster_url || item?.avatar || ''
const suggestionIcon = (item) => {
  if (item?.type === 'term') return '⌕'
  if (item?.type === 'movie') return 'MOV'
  if (item?.type === 'series') return 'SER'
  if (item?.type === 'channel') return 'CH'
  return 'VID'
}
const suggestionTypeLabel = (type) => {
  if (type === 'term') return t('app.searchSuggestion')
  if (type === 'movie') return t('searchPage.movie')
  if (type === 'series') return t('searchPage.seriesOne')
  if (type === 'channel') return t('searchPage.channels')
  return t('searchPage.videos')
}
const suggestionMeta = (item) => {
  if (item?.type === 'term') return t('app.peopleSearchFor')
  if (item?.type === 'movie') return [t('searchPage.movie'), item?.year || ''].filter(Boolean).join(' · ')
  if (item?.type === 'series') return t('searchPage.seriesMeta', { seasons: item?.seasons || 1, episodes: item?.episodes || 0 })
  if (item?.type === 'channel') return item?.description || t('searchPage.channels')
  return item?.channel || t('searchPage.videos')
}
const suggestionPath = (item) => {
  if (item?.type === 'term') return `/search?q=${encodeURIComponent(item.title || item.id || searchQuery.value.trim())}`
  if (item?.type === 'movie') return `/category/movies?movie_id=${encodeURIComponent(item.id)}`
  if (item?.type === 'series') return `/category/series?series_id=${encodeURIComponent(item.id)}`
  if (item?.type === 'channel') return `/channel/${item.id}`
  return `/video/${item.id}`
}
const goToSearchSuggestion = async (item) => {
  if (!item?.id) return
  searchSuggestionsOpen.value = false
  showSearchBar.value = false
  await router.push(localePath(suggestionPath(item)))
}
const handleSearchSuggestionClickOutside = (event) => {
  const target = event.target
  if (desktopSearchRef.value?.contains?.(target) || mobileSearchRef.value?.contains?.(target)) return
  searchSuggestionsOpen.value = false
}
const uploadDropdownOpen = ref(false)
const uploadDropdownRef = ref(null)
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
const showGilIDLinkModal = ref(false)
const hideGilIDPromptPermanently = ref(false)
const gilidLinking = ref(false)

const PASSKEY_PROMPT_DISMISS_KEY = 'passkey_prompt_dismissed_session'
const AUTH_STATE_CHANGED_EVENT = 'giltube-auth-changed'
const GILID_LINK_PROMPT_KEY_PREFIX = 'gilid_link_prompt_dismissed'

const gilidPromptStorageKey = computed(() => {
  if (!userId.value) return `${GILID_LINK_PROMPT_KEY_PREFIX}:guest`
  return `${GILID_LINK_PROMPT_KEY_PREFIX}:${userId.value}`
})

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

const isAdminRoute = computed(() => normalizedRoutePath.value === '/admin' || normalizedRoutePath.value.startsWith('/admin/'))

const isMusicRoute = computed(() =>
  normalizedRoutePath.value === '/music' || normalizedRoutePath.value.startsWith('/music/')
)

const canApplyEasterEggTheme = computed(() => !isAdminRoute.value && !isMusicRoute.value)

const activeShellThemeClass = computed(() => canApplyEasterEggTheme.value ? activeThemeClass.value : '')

const notificationBarHeight = computed(() => {
  let height = 0
  if (offlineRef.value) height += offlineRef.value.offsetHeight
  if (statusRef.value) height += statusRef.value.offsetHeight
  if (updateRef.value) height += updateRef.value.offsetHeight
  if (passkeyRef.value) height += passkeyRef.value.offsetHeight
  return height
})

const shouldHideHeader = computed(() => {
  return hideHeaderSidebarRoutes.some(route_path => normalizedRoutePath.value.startsWith(route_path))
})

const isCompactMobileWatchTopBar = computed(() => isMobileDevice.value && isVideoWatchRoute.value)

const shouldHideTopBar = computed(() => shouldHideHeader.value)

const shouldHideSidebar = computed(() => {
  return shouldHideHeader.value || isMobileDevice.value || isMusicRoute.value
})

const mobileMyChannelPath = computed(() => {
  if (!isLoggedIn.value) return '/login'
  if (activeAccount.value !== 'personal' && activeAccount.value !== userId.value) {
    return `/channel/${activeAccount.value}`
  }
  return '/my-channels'
})

const accountDropdownStyle = computed(() => {
  const top = notificationBarHeight.value + 70
  if (isMobileDevice.value) {
    return {
      zIndex: 9999,
      paddingTop: `calc(${notificationBarHeight.value}px + env(safe-area-inset-top, 0px))`,
      paddingBottom: 'calc(5.4rem + env(safe-area-inset-bottom, 0px))'
    }
  }
  return {
    zIndex: 9999,
    top: `${top}px`,
    right: '20px',
    width: '24rem'
  }
})

const mainScrollStyle = computed(() => {
  if (shouldHideHeader.value) return {}
  const headerOffset = notificationBarHeight.value + (isCompactMobileWatchTopBar.value ? 40 : 64)
  const mobileBottomOffset = isMobileDevice.value ? 76 : 0
  return {
    paddingTop: `${headerOffset}px`,
    paddingBottom: mobileBottomOffset ? `calc(${mobileBottomOffset}px + env(safe-area-inset-bottom, 0px))` : '0px'
  }
})

const mobileSearchTopOffset = computed(() => notificationBarHeight.value + (isCompactMobileWatchTopBar.value ? 40 : 64))

const displayName = computed(() => {
  if (!process.client || typeof window === 'undefined') return username.value || 'User'
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

const saveActiveAccount = (accountId, accountName) => {
  activeAccount.value = accountId
  avatarLoadFailed.value = false
  failedChannelAvatars.value = {}
  localStorage.setItem('active_account', accountId)
  localStorage.setItem('active_account_name', accountName)
}

const applyDefaultChannelSelection = (channelList = [], defaultChannelID = '') => {
  if (!process.client || !isLoggedIn.value || !userId.value) return
  if (!Array.isArray(channelList) || channelList.length === 0) {
    saveActiveAccount('personal', username.value || 'Personal')
    localStorage.removeItem('default_channel_id')
    return
  }

  const selectableChannels = channelList.filter(channel => channel.status !== 'banned')
  if (selectableChannels.length === 0) {
    saveActiveAccount('personal', username.value || 'Personal')
    localStorage.removeItem('default_channel_id')
    return
  }

  const defaultChannel = selectableChannels.find(channel => channel.id === defaultChannelID) ||
    selectableChannels.find(channel => channel.is_default) ||
    selectableChannels[0]
  if (!defaultChannel?.id) return

  localStorage.setItem('default_channel_id', defaultChannel.id)
  saveActiveAccount(defaultChannel.id, defaultChannel.name)
}

const categoriesWithVideos = computed(() => {
  return categories.value.filter(cat => ['series', 'movies'].includes(cat.slug) || (cat.video_count || 0) > 0)
})

const syncCategoriesFromStorage = () => {
  if (!process.client || typeof window === 'undefined') return
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
  if (isMobileDevice.value) {
    isSidebarOpen.value = false
    return
  }
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
    uploadDropdownOpen.value = false
    await Promise.all([refreshNotificationCount(), loadNotificationPreview()])
  }
}

const toggleUploadDropdown = () => {
  uploadDropdownOpen.value = !uploadDropdownOpen.value
  if (uploadDropdownOpen.value) {
    notificationsDropdownOpen.value = false
    dropdownOpen.value = false
  }
}

const toggleAccountDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    uploadDropdownOpen.value = false
    notificationsDropdownOpen.value = false
    mobileMoreOpen.value = false
    mobileCreateOpen.value = false
    mobileCategoriesOpen.value = false
    showSearchBar.value = false
  }
}

const openMobileAccountPanel = () => {
  if (!isLoggedIn.value) return
  mobileMoreOpen.value = false
  mobileCreateOpen.value = false
  mobileCategoriesOpen.value = false
  showSearchBar.value = false
  uploadDropdownOpen.value = false
  notificationsDropdownOpen.value = false
  dropdownOpen.value = true
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

const handleUploadDropdownClickOutside = (event) => {
  if (!uploadDropdownOpen.value || !uploadDropdownRef.value) return
  if (!uploadDropdownRef.value.contains(event.target)) {
    uploadDropdownOpen.value = false
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
  const destination = isMusicRoute.value ? '/music' : '/'
  if (route.path !== localePath(destination)) {
    await router.push(localePath(destination))
  }
  await scrollToTop()
}

const openShellMusicPlayer = () => {
  if (!shellMusicTrack.value) return
  mobileMoreOpen.value = false
  openMusicPlayerPanel('player')
}

const verifyActiveWatchParty = async () => {
  const partyId = activeWatchParty.value?.id
  if (!process.client || !partyId) return
  try {
    const snapshot = await getWatchParty(partyId)
    if (!snapshot?.party || snapshot.party.status === 'ended') {
      clearActiveWatchParty()
    }
  } catch (err) {
    clearActiveWatchParty()
  }
}

const syncWatchPartyStatusPolling = () => {
  if (watchPartyStatusInterval) {
    clearInterval(watchPartyStatusInterval)
    watchPartyStatusInterval = null
  }
  if (!process.client || !activeWatchParty.value?.id || isInsideWatchPartyRoute.value) return
  watchPartyStatusInterval = setInterval(() => {
    verifyActiveWatchParty()
  }, 10000)
}

const loadActiveWatchParty = async () => {
  if (!process.client) return
  try {
    const raw = localStorage.getItem('giltube:active-watch-party')
    activeWatchParty.value = raw ? JSON.parse(raw) : null
    if (activeWatchParty.value?.id) {
      watchPartyWidgetDismissed.value = localStorage.getItem(`giltube:watch-party-widget-dismissed:${activeWatchParty.value.id}`) === '1'
    } else {
      watchPartyWidgetDismissed.value = false
    }
  } catch (err) {
    activeWatchParty.value = null
    watchPartyWidgetDismissed.value = false
  }
  syncWatchPartyStatusPolling()
  await verifyActiveWatchParty()
}

const clearActiveWatchParty = () => {
  if (watchPartyStatusInterval) {
    clearInterval(watchPartyStatusInterval)
    watchPartyStatusInterval = null
  }
  if (process.client) {
    if (activeWatchParty.value?.id) {
      localStorage.removeItem(`giltube:watch-party-widget-dismissed:${activeWatchParty.value.id}`)
    }
    localStorage.removeItem('giltube:active-watch-party')
  }
  activeWatchParty.value = null
  watchPartyWidgetDismissed.value = false
}

const dismissWatchPartyWidget = () => {
  if (process.client && activeWatchParty.value?.id) {
    localStorage.setItem(`giltube:watch-party-widget-dismissed:${activeWatchParty.value.id}`, '1')
  }
  watchPartyWidgetDismissed.value = true
}

const restoreWatchPartyWidget = () => {
  if (process.client && activeWatchParty.value?.id) {
    localStorage.removeItem(`giltube:watch-party-widget-dismissed:${activeWatchParty.value.id}`)
  }
  watchPartyWidgetDismissed.value = false
}

const leaveActiveWatchParty = async () => {
  const partyId = activeWatchParty.value?.id
  clearActiveWatchParty()
  if (!partyId) return
  try {
    await leaveWatchParty(partyId)
  } catch (err) {
    console.error('Failed to leave watch party:', err)
  }
}

const isWatchPartyWidgetDismissed = computed(() => watchPartyWidgetDismissed.value)

watch(isInsideWatchPartyRoute, (insideWatchParty) => {
  syncWatchPartyStatusPolling()
  if (insideWatchParty) {
    isSidebarOpen.value = false
  }
})

watch(useCollapsibleDesktopSidebar, (isCollapsible) => {
  if (isCollapsible) {
    isSidebarOpen.value = false
  }
})

watch(isMobileDevice, (isMobile) => {
  if (!isMobile) return
  isSidebarOpen.value = false
  uploadDropdownOpen.value = false
  notificationsDropdownOpen.value = false
  dropdownOpen.value = false
})

watch(searchQuery, () => {
  searchSuggestionsOpen.value = true
  fetchSearchSuggestionsDebounced()
})

watch(() => route.fullPath, () => {
  searchSuggestionsOpen.value = false
  mobileMoreOpen.value = false
  mobileCreateOpen.value = false
  mobileCategoriesOpen.value = false
  if (isMobileDevice.value) {
    showSearchBar.value = false
  }
})

onMounted(async () => {
  hydrateEasterEggs()
  isMobileDevice.value = isLikelyMobileUserAgent(navigator.userAgent, navigator.maxTouchPoints || 0)
  if (isMobileDevice.value) {
    isSidebarOpen.value = false
  }
  loadActiveWatchParty()
  checkAuthStatus()
  await loadCategories()
  if (isLoggedIn.value) {
    loadChannels()
    checkPasskeyPrompt()
    await checkGilIDLinkPrompt()
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
  window.addEventListener('storage', loadActiveWatchParty)
  window.addEventListener('giltube:watch-party-updated', loadActiveWatchParty)
  document.addEventListener('click', handleNotificationClickOutside)
  document.addEventListener('click', handleUploadDropdownClickOutside)
  document.addEventListener('click', handleSearchSuggestionClickOutside)
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
  if (watchPartyStatusInterval) {
    clearInterval(watchPartyStatusInterval)
    watchPartyStatusInterval = null
  }
  window.removeEventListener('resize', handleSidebarResize)
  window.removeEventListener('storage', loadActiveWatchParty)
  window.removeEventListener('giltube:watch-party-updated', loadActiveWatchParty)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('scroll', handleMainContentScroll)
  document.removeEventListener('click', handleNotificationClickOutside)
  document.removeEventListener('click', handleUploadDropdownClickOutside)
  document.removeEventListener('click', handleSearchSuggestionClickOutside)
  document.removeEventListener('visibilitychange', handleNotificationVisibilityChange)
  if (searchSuggestTimer) {
    clearTimeout(searchSuggestTimer)
    searchSuggestTimer = null
  }
  stopNotificationPolling()
  if (statusRefreshInterval.value) {
    clearInterval(statusRefreshInterval.value)
  }
})

watch(isLoggedIn, (newValue) => {
  if (newValue) {
    loadChannels()
    checkPasskeyPrompt()
    checkGilIDLinkPrompt()
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
    showGilIDLinkModal.value = false
    hideGilIDPromptPermanently.value = false
    uploadDropdownOpen.value = false
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
  uploadDropdownOpen.value = false
  await nextTick()
  handleMainContentScroll()
  if (isLoggedIn.value) {
    checkGilIDLinkPrompt()
  }
})

const checkAuthStatus = () => {
  if (!process.client || typeof window === 'undefined') return
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
    const result = await fetchUserChannels(userId.value)
    channels.value = result.channels || []
    applyDefaultChannelSelection(channels.value, result.default_channel_id || '')
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

const dismissGilIDLinkModal = () => {
  showGilIDLinkModal.value = false
  if (!process.client) return
  if (hideGilIDPromptPermanently.value) {
    localStorage.setItem(gilidPromptStorageKey.value, '1')
  } else {
    localStorage.removeItem(gilidPromptStorageKey.value)
  }
}

const startGilIDLink = async () => {
  gilidLinking.value = true
  try {
    const response = await beginGilIDAuth('link', route.fullPath || '/')
    window.location.href = response.authorize_url
  } catch (err) {
    console.error('Failed to start GILid linking:', err)
    gilidLinking.value = false
  }
}

const checkGilIDLinkPrompt = async () => {
  if (!process.client || !isLoggedIn.value || !userId.value) {
    showGilIDLinkModal.value = false
    hideGilIDPromptPermanently.value = false
    return
  }

  if (normalizedRoutePath.value.startsWith('/login') || normalizedRoutePath.value.startsWith('/register') || normalizedRoutePath.value.startsWith('/auth/callback')) {
    showGilIDLinkModal.value = false
    return
  }

  if (localStorage.getItem(gilidPromptStorageKey.value) === '1') {
    showGilIDLinkModal.value = false
    hideGilIDPromptPermanently.value = true
    return
  }

  try {
    const account = await getMyAccount()
    showGilIDLinkModal.value = !account.gilid_linked
    hideGilIDPromptPermanently.value = false
  } catch (err) {
    console.error('Failed to check GILid link status:', err)
    showGilIDLinkModal.value = false
  }
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

const switchAccount = async (accountId, accountName) => {
  if (!process.client) return

  // If switching to a channel (not personal), check if it's banned
  if (accountId !== userId.value && accountId !== 'personal') {
    const targetChannel = channels.value.find(ch => ch.id === accountId)
    if (targetChannel && targetChannel.status === 'banned') {
      alert('This channel has been banned and cannot be accessed.')
      return
    }
  }

  saveActiveAccount(accountId, accountName)
  dropdownOpen.value = false
  mobileMoreOpen.value = false
  mobileCreateOpen.value = false
  mobileCategoriesOpen.value = false
  showSearchBar.value = false

  if (accountId !== userId.value && accountId !== 'personal') {
    try {
      await setDefaultChannel(accountId)
    } catch (err) {
      console.error('Failed to save default channel:', err)
    }
  }

  window.location.reload()
}

const handleLogout = async () => {
  if (!process.client) return
  const previousUserID = userId.value
  await detachPushSubscriptionForUser(previousUserID)
  clearAuthSession()
  isLoggedIn.value = false
  dropdownOpen.value = false
  router.push('/')
  window.location.reload()
}

const handleMobileLogout = async () => {
  mobileMoreOpen.value = false
  mobileCreateOpen.value = false
  mobileCategoriesOpen.value = false
  await handleLogout()
}

const dismissAccountStatus = () => {
  // Just dismiss the banner, user can continue using the site
  // Status will persist and show again on page reload
}

const handleBannedLogout = () => {
  handleLogout()
}

if (process.client) {
  router.afterEach(() => {
    checkAuthStatus()
    if (isLoggedIn.value) {
      checkPasskeyPrompt()
      checkGilIDLinkPrompt()
    }
  })
}
</script>

<style global>
.search-suggestions-scrollbar {
  scrollbar-color: rgba(113, 113, 122, 0.85) transparent;
  scrollbar-width: thin;
}

.search-suggestions-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.search-suggestions-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.search-suggestions-scrollbar::-webkit-scrollbar-thumb {
  border: 2px solid rgba(9, 9, 11, 0.9);
  border-radius: 999px;
  background: rgba(113, 113, 122, 0.85);
}

.search-suggestions-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(161, 161, 170, 0.95);
}

.theme-sabrina-tube {
  --sabrina-bg: #fff0f6;
  --sabrina-bg-strong: #ffd7e8;
  --sabrina-panel: rgba(255, 247, 251, 0.94);
  --sabrina-panel-strong: rgba(255, 228, 240, 0.96);
  --sabrina-border: rgba(219, 39, 119, 0.26);
  --sabrina-text: #3f1729;
  --sabrina-muted: #8a4a65;
  --sabrina-hot: #db2777;
  --sabrina-soft: #f9a8d4;
  background:
    radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.95) 0 8%, transparent 28%),
    linear-gradient(135deg, #fff7fb 0%, #ffe4f0 42%, #ffd0e5 100%) !important;
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(circle at 16px 16px, rgba(219, 39, 119, 0.13) 0 1.5px, transparent 2px),
    radial-gradient(circle at 54px 42px, rgba(255, 255, 255, 0.75) 0 1.5px, transparent 2px);
  background-size: 72px 72px;
  mask-image: linear-gradient(to bottom, black, transparent 82%);
}

.theme-sabrina-tube > * {
  position: relative;
}

.theme-sabrina-tube > header {
  position: fixed;
}

.theme-sabrina-tube > .fixed {
  position: fixed;
}

.easter-egg-wipe {
  position: fixed !important;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 420ms cubic-bezier(0.76, 0, 0.24, 1);
}

.easter-egg-wipe--sabrina-tube {
  background:
    radial-gradient(circle at 18% 30%, rgba(255, 255, 255, 0.95) 0 2px, transparent 3px),
    radial-gradient(circle at 76% 68%, rgba(255, 255, 255, 0.8) 0 3px, transparent 4px),
    linear-gradient(115deg, #ffdaea 0%, #f472b6 48%, #db2777 100%);
  color: white;
}

.easter-egg-wipe--covering {
  transform: scaleX(1);
}

.easter-egg-wipe--revealing {
  transform: scaleX(0);
  transform-origin: right center;
  transition-duration: 520ms;
}

.easter-egg-wipe__wordmark {
  font-family: "Brush Script MT", "Segoe Script", cursive;
  font-size: clamp(2.5rem, 8vw, 7rem);
  font-weight: 700;
  line-height: 1;
  opacity: 0;
  text-shadow: 0 4px 18px rgba(131, 24, 67, 0.32);
  transform: translateY(0.5rem) scale(0.96);
  transition: opacity 180ms ease 160ms, transform 240ms ease 140ms;
}

.easter-egg-wipe--covering .easter-egg-wipe__wordmark {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.easter-egg-wipe__sparkle {
  position: absolute;
  font-size: clamp(2rem, 6vw, 5rem);
  opacity: 0.8;
  text-shadow: 0 3px 18px rgba(131, 24, 67, 0.22);
}

.easter-egg-wipe__sparkle--one {
  left: 13%;
  top: 22%;
}

.easter-egg-wipe__sparkle--two {
  right: 12%;
  bottom: 19%;
  font-size: clamp(1.5rem, 4vw, 3.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .easter-egg-wipe {
    display: none;
  }
}

.sabrina-brand-logo {
  display: block;
  height: 3.35rem;
  width: auto;
  max-width: min(15.5rem, 42vw);
  object-fit: contain;
}

.sabrina-brand-text {
  display: inline-flex;
  align-items: center;
  color: #be185d;
  font-family: "Brush Script MT", "Segoe Script", cursive;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 1px 0 #fff, 0 4px 12px rgba(190, 24, 93, 0.24);
}

.sabrina-exit-button,
.sabrina-mobile-exit-button {
  border: 1px solid rgba(219, 39, 119, 0.32);
  background: linear-gradient(180deg, #fff7fb, #ffd7e8);
  color: #9d174d;
  box-shadow: 0 10px 24px rgba(219, 39, 119, 0.18);
  font-weight: 900;
  transition:
    transform 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.sabrina-exit-button {
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0 0.75rem 0 0.55rem;
  font-size: 0.78rem;
}

.sabrina-exit-button span:first-child {
  display: inline-flex;
  height: 1.25rem;
  width: 1.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #db2777;
  color: white;
  line-height: 1;
}

.sabrina-mobile-exit-button {
  position: fixed;
  right: 0.85rem;
  bottom: calc(5.3rem + env(safe-area-inset-bottom, 0px));
  z-index: 78;
  border-radius: 999px;
  padding: 0.65rem 0.9rem;
  font-size: 0.78rem;
}

.sabrina-exit-button:hover,
.sabrina-mobile-exit-button:hover {
  border-color: rgba(190, 24, 93, 0.5);
  box-shadow: 0 14px 30px rgba(219, 39, 119, 0.26);
  transform: translateY(-1px);
}

.theme-sabrina-tube header,
.theme-sabrina-tube aside,
.theme-sabrina-tube nav.fixed,
.theme-sabrina-tube .mobile-sheet-enter-active + section,
.theme-sabrina-tube [class*="bg-zinc-950"],
.theme-sabrina-tube [class*="bg-black"] {
  background-color: var(--sabrina-panel) !important;
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube header,
.theme-sabrina-tube aside,
.theme-sabrina-tube [class*="border-zinc-"],
.theme-sabrina-tube [class*="border-white/10"] {
  border-color: var(--sabrina-border) !important;
}

.theme-sabrina-tube .route-page-shell main,
.theme-sabrina-tube .route-page-shell > div,
.theme-sabrina-tube [class*="bg-zinc-900"],
.theme-sabrina-tube [class*="bg-zinc-800"],
.theme-sabrina-tube [class*="bg-zinc-700"],
.theme-sabrina-tube [class*="bg-zinc-600"],
.theme-sabrina-tube [class*="bg-gray-900"],
.theme-sabrina-tube [class*="bg-gray-800"],
.theme-sabrina-tube [class*="bg-gray-700"],
.theme-sabrina-tube [class*="bg-gray-600"] {
  background-color: var(--sabrina-panel-strong) !important;
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube input,
.theme-sabrina-tube textarea,
.theme-sabrina-tube select {
  border-color: rgba(219, 39, 119, 0.28) !important;
  background: rgba(255, 255, 255, 0.82) !important;
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube input::placeholder,
.theme-sabrina-tube textarea::placeholder {
  color: rgba(138, 74, 101, 0.72) !important;
}

.theme-sabrina-tube [class*="text-white"],
.theme-sabrina-tube [class*="text-zinc-100"],
.theme-sabrina-tube [class*="text-zinc-200"],
.theme-sabrina-tube [class*="text-gray-100"],
.theme-sabrina-tube [class*="text-gray-200"] {
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube [class*="text-zinc-300"],
.theme-sabrina-tube [class*="text-zinc-400"],
.theme-sabrina-tube [class*="text-gray-300"],
.theme-sabrina-tube [class*="text-gray-400"],
.theme-sabrina-tube [class*="text-gray-500"] {
  color: var(--sabrina-muted) !important;
}

.theme-sabrina-tube [class*="bg-red-600"],
.theme-sabrina-tube [class*="bg-blue-600"],
.theme-sabrina-tube [class*="bg-rose-500"],
.theme-sabrina-tube .account-panel-check,
.theme-sabrina-tube .mobile-bottom-nav-create svg,
.theme-sabrina-tube .music-now-playing-nav:not(:disabled) svg {
  background: linear-gradient(135deg, #f472b6, #db2777) !important;
  color: white !important;
}

.theme-sabrina-tube [class*="hover:bg-red-"]:hover,
.theme-sabrina-tube [class*="hover:bg-blue-"]:hover,
.theme-sabrina-tube [class*="hover:bg-zinc-"]:hover,
.theme-sabrina-tube .account-panel-row:hover,
.theme-sabrina-tube .account-panel-action:hover,
.theme-sabrina-tube .mobile-bottom-nav-item:hover,
.theme-sabrina-tube .mobile-sheet-action:hover {
  background-color: rgba(249, 168, 212, 0.28) !important;
  color: #831843 !important;
}

.theme-sabrina-tube .account-panel-row-active,
.theme-sabrina-tube [class*="bg-blue-600"][class*="text-white"] {
  background: rgba(219, 39, 119, 0.2) !important;
  color: #831843 !important;
}

.theme-sabrina-tube .mobile-bottom-nav {
  border-color: rgba(219, 39, 119, 0.3) !important;
  background: rgba(255, 247, 251, 0.96) !important;
  box-shadow: 0 -8px 24px rgba(190, 24, 93, 0.14) !important;
}

.theme-sabrina-tube .mobile-bottom-nav-item {
  color: #9d4b70 !important;
}

.theme-sabrina-tube .mobile-bottom-nav-item.text-white {
  background: rgba(249, 168, 212, 0.34) !important;
  color: #831843 !important;
}

.theme-sabrina-tube .mobile-menu-backdrop {
  background: rgba(63, 23, 41, 0.42) !important;
}

.theme-sabrina-tube .mobile-create-menu,
.theme-sabrina-tube .mobile-more-sheet,
.theme-sabrina-tube .mobile-categories-menu {
  border-color: rgba(219, 39, 119, 0.34) !important;
  background: #fff7fb !important;
  color: var(--sabrina-text) !important;
  box-shadow: 0 -14px 40px rgba(131, 24, 67, 0.2) !important;
}

.theme-sabrina-tube .mobile-create-menu > a {
  color: #701a3d !important;
}

.theme-sabrina-tube .mobile-create-menu > a + a {
  border-color: rgba(219, 39, 119, 0.2) !important;
}

.theme-sabrina-tube .mobile-create-menu > a > span,
.theme-sabrina-tube .mobile-menu-close {
  border: 1px solid rgba(219, 39, 119, 0.2);
  background: #ffe4f0 !important;
  color: #831843 !important;
}

.theme-sabrina-tube .mobile-sheet-grabber {
  background: #f9a8d4 !important;
}

.theme-sabrina-tube .mobile-more-sheet [class*="border-zinc-"],
.theme-sabrina-tube .mobile-categories-menu [class*="border-zinc-"] {
  border-color: rgba(219, 39, 119, 0.2) !important;
}

.theme-sabrina-tube .mobile-sheet-action {
  border: 1px solid rgba(219, 39, 119, 0.24);
  background: rgba(255, 255, 255, 0.94) !important;
  color: #701a3d !important;
  box-shadow: 0 4px 12px rgba(190, 24, 93, 0.08);
}

.theme-sabrina-tube .mobile-sheet-action:hover,
.theme-sabrina-tube .mobile-sheet-action:focus-visible {
  border-color: rgba(190, 24, 93, 0.46);
  background: #ffd7e8 !important;
  color: #701a3d !important;
}

.theme-sabrina-tube .mobile-sheet-action.router-link-active {
  border-color: rgba(190, 24, 93, 0.46);
  background: #ffe4f0 !important;
  color: #831843 !important;
}

.theme-sabrina-tube .mobile-more-sheet .mobile-menu-logout {
  border-color: rgba(190, 24, 93, 0.52) !important;
  background: #fff1f5 !important;
  color: #881337 !important;
}

.theme-sabrina-tube .mobile-more-sheet .mobile-menu-logout:hover {
  background: #ffe4e6 !important;
  color: #881337 !important;
}

.theme-sabrina-tube .mobile-categories-menu > div:first-child {
  border-color: rgba(219, 39, 119, 0.28) !important;
  background: rgba(255, 247, 251, 0.96) !important;
}

.theme-sabrina-tube .mobile-categories-menu a {
  border: 1px solid transparent;
  color: #701a3d !important;
}

.theme-sabrina-tube .mobile-categories-menu a:hover {
  border-color: rgba(219, 39, 119, 0.22);
  background: #ffe4f0 !important;
}

.theme-sabrina-tube .mobile-categories-menu a[class*="bg-blue-600"] {
  border-color: rgba(190, 24, 93, 0.38);
  background: #f9a8d4 !important;
  color: #701a3d !important;
}

/* Keep copy legible when it is intentionally layered over photography. */
.theme-sabrina-tube [class*="relative"]:has(> img) [class*="text-white"],
.theme-sabrina-tube [class*="relative"]:has(> img) [class*="text-zinc-100"],
.theme-sabrina-tube [class*="relative"]:has(> img) [class*="text-zinc-200"] {
  color: #fff !important;
}

.theme-sabrina-tube [class*="relative"]:has(> img) [class*="text-zinc-300"],
.theme-sabrina-tube [class*="relative"]:has(> img) [class*="text-zinc-400"],
.theme-sabrina-tube [class*="relative"]:has(> img) [class*="text-gray-300"],
.theme-sabrina-tube [class*="relative"]:has(> img) [class*="text-gray-400"] {
  color: #fce7f3 !important;
}

/* Saturated controls and status surfaces need light foregrounds. */
.theme-sabrina-tube [class*="bg-red-600"],
.theme-sabrina-tube [class*="bg-red-700"],
.theme-sabrina-tube [class*="bg-red-800"],
.theme-sabrina-tube [class*="bg-red-900"],
.theme-sabrina-tube [class*="bg-red-950"],
.theme-sabrina-tube [class*="bg-rose-600"],
.theme-sabrina-tube [class*="bg-pink-600"],
.theme-sabrina-tube [class*="bg-pink-700"],
.theme-sabrina-tube [class*="bg-blue-700"],
.theme-sabrina-tube [class*="bg-blue-800"],
.theme-sabrina-tube [class*="bg-blue-900"],
.theme-sabrina-tube [class*="bg-purple-700"],
.theme-sabrina-tube [class*="bg-purple-800"],
.theme-sabrina-tube [class*="bg-purple-900"] {
  color: #fff !important;
}

.theme-sabrina-tube [class*="bg-red-600"] [class*="text-"],
.theme-sabrina-tube [class*="bg-red-700"] [class*="text-"],
.theme-sabrina-tube [class*="bg-red-800"] [class*="text-"],
.theme-sabrina-tube [class*="bg-red-900"] [class*="text-"],
.theme-sabrina-tube [class*="bg-red-950"] [class*="text-"],
.theme-sabrina-tube [class*="bg-rose-600"] [class*="text-"],
.theme-sabrina-tube [class*="bg-pink-600"] [class*="text-"],
.theme-sabrina-tube [class*="bg-pink-700"] [class*="text-"],
.theme-sabrina-tube [class*="bg-blue-700"] [class*="text-"],
.theme-sabrina-tube [class*="bg-blue-800"] [class*="text-"],
.theme-sabrina-tube [class*="bg-blue-900"] [class*="text-"],
.theme-sabrina-tube [class*="bg-purple-700"] [class*="text-"],
.theme-sabrina-tube [class*="bg-purple-800"] [class*="text-"],
.theme-sabrina-tube [class*="bg-purple-900"] [class*="text-"] {
  color: #fff !important;
}

.theme-sabrina-tube .continue-watching-card > div [class*="text-white"] {
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube .continue-watching-card > div [class*="text-zinc-"],
.theme-sabrina-tube .continue-watching-card > div [class*="text-gray-"] {
  color: var(--sabrina-muted) !important;
}

.theme-sabrina-tube .watch-description {
  background: rgba(255, 247, 251, 0.92) !important;
}

.theme-sabrina-tube .watch-description [class*="bg-gradient-to-"] {
  background-image: linear-gradient(to top, rgba(255, 247, 251, 0.98), transparent) !important;
}

.theme-sabrina-tube .watch-action-button[class*="bg-zinc-"] {
  border: 1px solid rgba(219, 39, 119, 0.3);
  background: rgba(255, 255, 255, 0.92) !important;
  color: #701a3d !important;
  box-shadow: 0 4px 12px rgba(190, 24, 93, 0.12);
}

.theme-sabrina-tube .watch-action-button[class*="bg-zinc-"]:hover {
  border-color: rgba(190, 24, 93, 0.5);
  background: #ffd7e8 !important;
  box-shadow: 0 6px 16px rgba(190, 24, 93, 0.18);
}

.theme-sabrina-tube .comment-composer,
.theme-sabrina-tube .comment-thread-card {
  border: 1px solid rgba(219, 39, 119, 0.28);
  background: rgba(255, 255, 255, 0.88) !important;
  box-shadow: 0 6px 18px rgba(190, 24, 93, 0.1);
}

.theme-sabrina-tube .comment-composer textarea,
.theme-sabrina-tube .comment-composer select,
.theme-sabrina-tube .comment-reply-composer textarea {
  border-color: rgba(219, 39, 119, 0.38) !important;
  background: #fff !important;
  box-shadow: inset 0 1px 3px rgba(190, 24, 93, 0.07);
}

.theme-sabrina-tube .comment-reply-composer {
  border: 1px solid rgba(219, 39, 119, 0.22);
  background: rgba(255, 215, 232, 0.48) !important;
}

.theme-sabrina-tube .comment-secondary-action {
  border: 1px solid rgba(219, 39, 119, 0.24);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.82);
  color: #8a3157 !important;
}

.theme-sabrina-tube .comment-secondary-action:hover {
  border-color: rgba(190, 24, 93, 0.46);
  background: #ffd7e8 !important;
  color: #701a3d !important;
}

.theme-sabrina-tube .comment-submit-action {
  border: 1px solid rgba(190, 24, 93, 0.42);
  box-shadow: 0 4px 12px rgba(190, 24, 93, 0.16);
}

.theme-sabrina-tube .music-attribution {
  border-color: var(--sabrina-border) !important;
  background: rgba(255, 247, 251, 0.9) !important;
}

.theme-sabrina-tube .music-attribution-heading,
.theme-sabrina-tube .music-attribution-title {
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube .music-attribution-link,
.theme-sabrina-tube .music-attribution-copyright {
  color: var(--sabrina-muted) !important;
}

.theme-sabrina-tube .music-attribution-cover,
.theme-sabrina-tube .music-attribution-listen {
  border-color: var(--sabrina-border) !important;
  background: var(--sabrina-panel-strong) !important;
  color: #831843 !important;
}

.theme-sabrina-tube .music-attribution-copyright {
  border-color: var(--sabrina-border) !important;
  background: rgba(255, 228, 240, 0.42) !important;
}

.theme-sabrina-tube .channel-music-panel,
.theme-sabrina-tube .artist-page-link,
.theme-sabrina-tube .channel-release-tile {
  border-color: var(--sabrina-border) !important;
  background: var(--sabrina-panel) !important;
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube .channel-release-tile h3,
.theme-sabrina-tube .music-panel-heading h2 {
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube .channel-release-tile p,
.theme-sabrina-tube .music-panel-heading p {
  color: var(--sabrina-muted) !important;
}

.theme-sabrina-tube .channel-page {
  background: #fff7fb !important;
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube .channel-hero {
  border-color: rgba(219, 39, 119, 0.34) !important;
}

.theme-sabrina-tube .channel-hero .channel-header-copy,
.theme-sabrina-tube .channel-hero .channel-header-copy h1,
.theme-sabrina-tube .channel-hero .channel-header-copy p,
.theme-sabrina-tube .channel-hero .channel-header-copy [class*="text-white"],
.theme-sabrina-tube .channel-hero .channel-header-metrics,
.theme-sabrina-tube .channel-hero .channel-header-metrics * {
  color: #fff !important;
}

.theme-sabrina-tube .channel-hero .channel-header-copy {
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.86) !important;
}

.theme-sabrina-tube .channel-hero .channel-header-metrics > * {
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(45, 12, 29, 0.54) !important;
}

.theme-sabrina-tube .channel-hero .channel-subscribe-button {
  border: 1px solid rgba(255, 255, 255, 0.58) !important;
  background: linear-gradient(135deg, #f472b6, #db2777) !important;
  color: #fff !important;
  text-shadow: none !important;
}

.theme-sabrina-tube .channel-hero .channel-subscribe-button:hover {
  background: linear-gradient(135deg, #ec4899, #be185d) !important;
}

.theme-sabrina-tube .channel-hero .channel-subscribe-button.is-subscribed {
  border-color: rgba(249, 168, 212, 0.72) !important;
  background: #ffe4f0 !important;
  color: #831843 !important;
}

.theme-sabrina-tube .channel-hero .channel-subscribe-button.is-subscribed:hover {
  background: #fbcfe8 !important;
}

.theme-sabrina-tube .channel-hero .channel-header-copy .channel-subscriber-count {
  border: 1px solid rgba(249, 168, 212, 0.72);
  background: rgba(255, 247, 251, 0.94) !important;
  color: #701a3d !important;
  text-shadow: none !important;
  box-shadow: 0 5px 14px rgba(45, 12, 29, 0.18);
}

.theme-sabrina-tube .channel-tabs {
  border: 1px solid rgba(219, 39, 119, 0.24) !important;
  background: rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 7px 18px rgba(190, 24, 93, 0.1) !important;
  backdrop-filter: blur(8px);
}

.theme-sabrina-tube .channel-tabs button {
  color: var(--sabrina-muted) !important;
  text-shadow: none !important;
}

.theme-sabrina-tube .channel-tabs button:hover,
.theme-sabrina-tube .channel-tabs button.is-active {
  color: #831843 !important;
}

.theme-sabrina-tube .channel-tab-button.is-active::after {
  background: #db2777 !important;
}

.theme-sabrina-tube .channel-video-card {
  border-color: rgba(219, 39, 119, 0.24) !important;
  background: rgba(255, 255, 255, 0.92) !important;
  box-shadow: 0 8px 20px rgba(190, 24, 93, 0.1) !important;
  color: var(--sabrina-text) !important;
}

.theme-sabrina-tube .channel-video-card:hover {
  border-color: rgba(190, 24, 93, 0.48) !important;
  background: #fff0f6 !important;
  box-shadow: 0 12px 28px rgba(190, 24, 93, 0.16) !important;
}

.theme-sabrina-tube .channel-video-card h3 {
  color: #58152f !important;
}

.theme-sabrina-tube .channel-video-card p {
  color: var(--sabrina-muted) !important;
}

.theme-sabrina-tube .channel-video-card [class*="bg-gray-900"] {
  border-color: rgba(190, 24, 93, 0.34) !important;
  background: #ffe4f0 !important;
  color: #831843 !important;
}

.theme-sabrina-tube .streaming-hero-copy,
.theme-sabrina-tube .streaming-hero-title,
.theme-sabrina-tube .streaming-hero-synopsis {
  color: #fff !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.72);
}

.theme-sabrina-tube .streaming-eyebrow {
  color: #fbcfe8 !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.82);
}

.theme-sabrina-tube .streaming-hero-copy [class*="bg-white/10"] {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.5) !important;
  color: #fff !important;
  text-shadow: none;
}

.theme-sabrina-tube .streaming-secondary-button {
  border-color: rgba(255, 255, 255, 0.62) !important;
  background: rgba(0, 0, 0, 0.52) !important;
  color: #fff !important;
}

.theme-sabrina-tube .streaming-card {
  overflow: hidden;
  border: 1px solid rgba(219, 39, 119, 0.25);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.88) !important;
  box-shadow: 0 7px 18px rgba(190, 24, 93, 0.1);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.theme-sabrina-tube .streaming-card:hover {
  border-color: rgba(190, 24, 93, 0.46);
  box-shadow: 0 12px 26px rgba(190, 24, 93, 0.16);
  transform: translateY(-2px);
}

.theme-sabrina-tube .streaming-card > button > h3,
.theme-sabrina-tube .streaming-card > button > p {
  margin-left: 0.75rem;
  margin-right: 0.75rem;
}

.theme-sabrina-tube .streaming-card > button > p {
  margin-bottom: 0.75rem;
  color: var(--sabrina-muted) !important;
}

.theme-sabrina-tube .motion-card,
.theme-sabrina-tube .homepage-carousel-item > *,
.theme-sabrina-tube article,
.theme-sabrina-tube [class*="rounded-2xl"],
.theme-sabrina-tube [class*="rounded-lg"] {
  box-shadow: 0 14px 36px rgba(219, 39, 119, 0.11);
}

.theme-sabrina-tube .motion-card:hover {
  box-shadow: 0 18px 42px rgba(219, 39, 119, 0.19);
}

.theme-sabrina-tube .search-suggestions-scrollbar {
  scrollbar-color: rgba(219, 39, 119, 0.55) transparent;
}

.theme-sabrina-tube .search-suggestions-scrollbar::-webkit-scrollbar-thumb {
  border-color: rgba(255, 240, 246, 0.9);
  background: rgba(219, 39, 119, 0.55);
}

.theme-sabrina-tube .route-page-shell::before {
  content: "";
  position: fixed;
  right: clamp(1rem, 5vw, 4rem);
  top: clamp(5rem, 12vh, 9rem);
  z-index: -1;
  width: 9rem;
  height: 9rem;
  opacity: 0.2;
  background:
    linear-gradient(45deg, transparent 43%, #db2777 44% 56%, transparent 57%),
    linear-gradient(-45deg, transparent 43%, #db2777 44% 56%, transparent 57%);
  clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 35%);
}

@media (max-width: 767px) {
  .sabrina-brand-logo {
    height: 2.35rem;
    max-width: min(10.5rem, 45vw);
  }

  .sabrina-brand-text {
    font-size: 1.45rem;
  }
}

.giltube-account-panel-scroll {
  scrollbar-color: rgba(113, 113, 122, 0.75) transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

.giltube-account-panel-scroll::-webkit-scrollbar {
  width: 6px;
}

.giltube-account-panel-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.giltube-account-panel-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(113, 113, 122, 0.72);
}

.account-panel-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: left;
  color: rgb(212 212 216);
  transition:
    background-color 150ms ease,
    color 150ms ease,
    border-color 150ms ease;
}

.account-panel-row:hover {
  background: rgb(24 24 27);
  color: white;
}

.account-panel-row-active {
  background: rgba(37, 99, 235, 0.18);
  color: white;
}

.account-panel-avatar {
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgb(63 63 70);
  background: rgb(39 39 42);
  font-size: 0.875rem;
  font-weight: 900;
  color: rgb(228 228 231);
}

.account-panel-check {
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(37 99 235);
  color: white;
}

.account-panel-action {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  border: 1px solid rgb(39 39 42);
  background: rgb(24 24 27);
  padding: 0.65rem 0.85rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 800;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease;
}

.account-panel-action:hover {
  border-color: rgb(82 82 91);
  background: rgb(39 39 42);
}

.page-shift-enter-active,
.page-shift-leave-active,
.layout-shift-enter-active,
.layout-shift-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 220ms ease;
}

.page-shift-enter-from,
.layout-shift-enter-from {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(10px) scale(0.992);
}

.page-shift-leave-to,
.layout-shift-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(-6px) scale(0.996);
}

.route-page-shell {
  isolation: isolate;
}

.fade-soft-enter-active,
.fade-soft-leave-active {
  transition: opacity 140ms ease;
}

.fade-soft-enter-from,
.fade-soft-leave-to {
  opacity: 0;
}

.menu-pop-enter-active,
.menu-pop-leave-active {
  transition:
    opacity 150ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.mobile-sheet-enter-active,
.mobile-sheet-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-sheet-enter-from,
.mobile-sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.mobile-bottom-nav-item {
  display: flex;
  min-width: 0;
  height: 3.45rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  border-radius: 0.75rem;
  color: rgb(161 161 170);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  transition:
    background-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.mobile-bottom-nav-item:active {
  transform: scale(0.96);
}

.mobile-bottom-nav-item:hover,
.mobile-bottom-nav-item:focus-visible {
  background: rgb(39 39 42 / 0.82);
  color: white;
  outline: none;
}

.mobile-bottom-nav-item span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-now-playing-nav:not(:disabled) svg {
  box-sizing: content-box;
  border-radius: 999px;
  background: rgb(220 38 38);
  padding: 0.32rem;
  color: white;
}

.music-now-playing-nav:disabled {
  opacity: 0.45;
}

.music-brand-logo {
  display: block;
  width: auto;
  object-fit: contain;
}

.music-brand-logo-full {
  height: 3rem;
  max-width: 13rem;
}

.music-brand-logo-symbol {
  height: 2.55rem;
  max-width: 3.5rem;
}

.music-return-link {
  transition: width 220ms cubic-bezier(0.22, 1, 0.36, 1), background-color 150ms ease, color 150ms ease;
}

.music-return-link-desktop {
  width: 2.25rem;
  overflow: hidden;
}

.music-return-link-desktop:hover,
.music-return-link-desktop:focus-visible {
  width: 6.15rem;
}

.music-return-label {
  flex: none;
  opacity: 0;
  transform: translateX(-0.25rem);
  transition: opacity 140ms ease 35ms, transform 180ms ease 20ms;
  white-space: nowrap;
}

.music-return-link-desktop:hover .music-return-label,
.music-return-link-desktop:focus-visible .music-return-label {
  opacity: 1;
  transform: translateX(0);
}

.mobile-bottom-nav-create {
  color: white;
}

.mobile-bottom-nav-create svg {
  border-radius: 999px;
  background: rgb(220 38 38);
  padding: 0.35rem;
  box-sizing: content-box;
}

.mobile-sheet-action {
  position: relative;
  display: flex;
  min-height: 4.65rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border-radius: 0.75rem;
  background: rgb(24 24 27);
  padding: 0.65rem 0.45rem;
  text-align: center;
  font-size: 0.72rem;
  line-height: 1.05rem;
  font-weight: 800;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.mobile-sheet-action > span:not(.ml-2) {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mobile-sheet-action .ml-2 {
  position: absolute;
  right: 0.45rem;
  top: 0.45rem;
  margin-left: 0;
}

.mobile-sheet-action-wide {
  grid-column: 1 / -1;
  min-height: 3.25rem;
  flex-direction: row;
  gap: 0.6rem;
  padding-inline: 0.9rem;
  font-size: 0.86rem;
}

.mobile-sheet-action:hover,
.mobile-sheet-action:focus-visible {
  background: rgb(39 39 42);
  color: white;
  outline: none;
}

.motion-card {
  animation: motionCardIn 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: center bottom;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    background-color 180ms ease,
    opacity 180ms ease;
}

.motion-card:hover {
  transform: translateY(-2px);
}

.motion-row {
  animation: motionRowIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.motion-grid > .motion-card:nth-child(1),
.motion-row:nth-child(1) {
  animation-delay: 0ms;
}

.motion-grid > .motion-card:nth-child(2),
.motion-row:nth-child(2) {
  animation-delay: 35ms;
}

.motion-grid > .motion-card:nth-child(3),
.motion-row:nth-child(3) {
  animation-delay: 70ms;
}

.motion-grid > .motion-card:nth-child(4),
.motion-row:nth-child(4) {
  animation-delay: 105ms;
}

.motion-grid > .motion-card:nth-child(n+5),
.motion-row:nth-child(n+5) {
  animation-delay: 130ms;
}

@keyframes motionCardIn {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes motionRowIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.giltube-modal-overlay {
  position: fixed !important;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2147483647 !important;
}

.giltube-sidebar-scrollbar {
  scrollbar-color: rgba(113, 113, 122, 0.75) rgba(24, 24, 27, 0.25);
  scrollbar-width: thin;
}

.giltube-sidebar-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.giltube-sidebar-scrollbar::-webkit-scrollbar-track {
  background: rgba(24, 24, 27, 0.35);
  border-left: 1px solid rgba(63, 63, 70, 0.25);
}

.giltube-sidebar-scrollbar::-webkit-scrollbar-thumb {
  min-height: 48px;
  background: linear-gradient(180deg, rgba(161, 161, 170, 0.72), rgba(82, 82, 91, 0.78));
  border: 2px solid rgba(24, 24, 27, 0.9);
  border-radius: 999px;
}

.giltube-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(212, 212, 216, 0.86), rgba(113, 113, 122, 0.9));
}

.giltube-sidebar-category-scroll {
  -webkit-overflow-scrolling: touch;
  scrollbar-color: transparent transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  transition: scrollbar-color 160ms ease;
}

.giltube-sidebar-category-scroll::-webkit-scrollbar {
  width: 4px;
}

.giltube-sidebar-category-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.giltube-sidebar-category-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: transparent;
}

.giltube-sidebar-category-scroll:hover,
.giltube-sidebar-category-scroll:focus,
.giltube-sidebar-category-scroll:focus-within {
  scrollbar-color: rgba(161, 161, 170, 0.55) transparent;
}

.giltube-sidebar-category-scroll:hover::-webkit-scrollbar-thumb,
.giltube-sidebar-category-scroll:focus::-webkit-scrollbar-thumb,
.giltube-sidebar-category-scroll:focus-within::-webkit-scrollbar-thumb {
  background: rgba(161, 161, 170, 0.55);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }

  .page-shift-enter-active,
  .page-shift-leave-active,
  .layout-shift-enter-active,
  .layout-shift-leave-active,
  .fade-soft-enter-active,
  .fade-soft-leave-active,
  .menu-pop-enter-active,
  .menu-pop-leave-active,
  .mobile-sheet-enter-active,
  .mobile-sheet-leave-active {
    transition: opacity 1ms linear !important;
  }

  .page-shift-enter-from,
  .page-shift-leave-to,
  .layout-shift-enter-from,
  .layout-shift-leave-to,
  .menu-pop-enter-from,
  .menu-pop-leave-to,
  .mobile-sheet-enter-from,
  .mobile-sheet-leave-to {
    filter: none !important;
    transform: none !important;
  }

  .motion-card,
  .motion-row {
    animation: none !important;
  }

  .motion-card:hover {
    transform: none !important;
  }
}
</style>
