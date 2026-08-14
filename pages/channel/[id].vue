<template>
  <div class="min-h-screen bg-zinc-950 text-white">
    <!-- Channel Header -->
    <div v-if="channel" class="relative overflow-hidden border-b border-zinc-800 bg-zinc-900">
      <div v-if="channelBackgroundUrl" class="absolute inset-0">
        <img :src="channelBackgroundUrl" :srcset="channelBackgroundSrcset || undefined" sizes="100vw" :alt="`${channel.name} background`" class="channel-fade-bg h-full w-full object-cover" :style="channelBackgroundStyle" />
        <div class="absolute inset-0 bg-black/70" />
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/45 to-black/25" />
      </div>
      <div v-else class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_34%),linear-gradient(135deg,rgba(39,39,42,0.95),rgba(9,9,11,1))]" />
      <iframe
        v-if="headerThemeSrcdoc"
        class="channel-fade-bg pointer-events-none absolute inset-0 h-full w-full border-0"
        sandbox=""
        referrerpolicy="no-referrer"
        :srcdoc="headerThemeSrcdoc"
        :title="t('channelPage.customHeader')"
      />
      <div class="relative min-h-[20rem] max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button
          v-if="canEditChannel"
          type="button"
          class="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-white hover:text-black sm:right-6 sm:top-6"
          :title="t('channels.edit')"
          @click="openChannelEditor"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" />
            <path d="M11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <span class="sr-only">{{ t('channels.edit') }}</span>
        </button>
        <button
          type="button"
          :class="[
            'absolute top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-white hover:text-black sm:top-6',
            canEditChannel ? 'right-16 sm:right-[4.75rem]' : 'right-4 sm:right-6'
          ]"
          :title="t('channelPage.details')"
          @click="showChannelDetails = true"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 8a1 1 0 102 0 1 1 0 00-2 0zm.25 2.75A.75.75 0 0110 10h.25a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V11.5A.75.75 0 019.25 10.75z" clip-rule="evenodd" />
          </svg>
          <span class="sr-only">{{ t('channelPage.details') }}</span>
        </button>
        <div class="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <!-- Channel Avatar -->
          <div class="flex-shrink-0">
            <img
              v-if="channel.avatar_url && channel.avatar_url.trim() && !failedChannelAvatar"
              :src="channelAvatarUrl"
              :srcset="channelAvatarSrcset || undefined"
              sizes="128px"
              :alt="channel.name"
              class="w-24 sm:w-32 h-24 sm:h-32 rounded-full object-cover border-2 border-zinc-700"
              @error="failedChannelAvatar = true"
            />
            <div v-else
              class="w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-zinc-700 flex items-center justify-center text-3xl sm:text-5xl font-bold border-2 border-zinc-700">
              {{ channel.name.charAt(0).toUpperCase() }}
            </div>
          </div>

          <!-- Channel Info -->
          <div class="channel-header-copy flex-1 min-w-0 pr-14 sm:pr-24">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl sm:text-4xl font-bold break-words">{{ channel.name }}</h1>
              <VerifiedBadge class="channel-verified-badge" :verified="channel.verified" size="lg"
                tooltip="This account is verified by GilTube. It belongs to the channel owner and is not a fan account or impersonator." />
              <span
                v-if="liveStatus?.is_live"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-red-200 border border-red-700"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {{ t('live.live') }}
              </span>
            </div>
            <p class="mt-2 text-sm font-semibold text-white sm:text-base break-words">{{ channel.description || t('channelPage.noDescription') }}</p>

            <div class="mt-4 flex flex-wrap items-center gap-3">
              <button
                v-if="!canEditChannel && subscriptionActorChannelId !== channelId"
                type="button"
                :disabled="subscriptionBusy"
                class="inline-flex min-w-28 items-center justify-center rounded-full px-5 py-2 text-sm font-bold shadow-lg transition disabled:cursor-wait disabled:opacity-60"
                :class="isSubscribed ? 'border border-white/20 bg-black/55 text-white backdrop-blur hover:bg-white/15' : 'bg-white text-black hover:bg-zinc-200'"
                @click="toggleSubscription"
              >
                {{ subscriptionBusy ? t('channelPage.subscriptionWorking') : isSubscribed ? t('channelPage.subscribed') : t('channelPage.subscribe') }}
              </button>
              <span class="rounded-full bg-black/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                {{ t(subscriberCount === 1 ? 'channelPage.subscriberCountOne' : 'channelPage.subscriberCount', { count: formatViews(subscriberCount) }) }}
              </span>
            </div>
            <p v-if="subscriptionError" class="mt-2 text-sm font-semibold text-red-200">{{ subscriptionError }}</p>

            <NuxtLink
              v-if="liveStatus?.is_live"
              :to="localePath(`/live/${channelId}`)"
              class="inline-flex mt-3 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 transition text-sm font-semibold"
            >
              {{ t('channelPage.watchLive') }}
            </NuxtLink>

            <!-- Channel Metrics -->
            <div class="channel-header-metrics mt-4">
              <ChannelMetricsCompact :channel-id="channelId" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Channel Details Modal -->
    <div
      v-if="showChannelDetails && channel"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      @click.self="showChannelDetails = false"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{{ channel.name }}</p>
            <h2 class="text-2xl font-black">{{ t('channelPage.details') }}</h2>
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
            :title="t('channels.cancel')"
            @click="showChannelDetails = false"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            <span class="sr-only">{{ t('channels.cancel') }}</span>
          </button>
        </div>
        <div class="space-y-3 p-5">
          <div class="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span class="text-sm font-semibold text-zinc-400">{{ t('channelPage.owner') }}</span>
              <span class="font-bold text-white break-words">{{ ownerUsername }}</span>
            </div>
          </div>
          <div class="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span class="text-sm font-semibold text-zinc-400">{{ t('channelPage.created') }}</span>
              <span class="font-bold text-white">{{ formatDate(channel.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Owner Channel Editor -->
    <div
      v-if="showChannelEditor"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="showChannelEditor = false"
    >
      <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-6">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{{ t('channels.edit') }}</p>
            <h2 class="text-2xl font-black">{{ t('channels.editModal') }}</h2>
          </div>
          <button type="button" class="rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-bold text-zinc-200 transition hover:bg-zinc-700" @click="showChannelEditor = false">
            {{ t('channels.cancel') }}
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="saveChannelEditor">
          <div>
            <label class="mb-2 block text-sm font-semibold">{{ t('channels.channelName') }}</label>
            <input v-model="editForm.name" required type="text" class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white outline-none transition focus:border-red-400" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">{{ t('channels.description') }}</label>
            <textarea v-model="editForm.description" rows="4" class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white outline-none transition focus:border-red-400" />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">{{ t('channels.avatar') }}</label>
            <input type="file" accept="image/*" class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white" @change="onEditorAvatarSelected" />
            <p class="mt-1 text-xs text-zinc-400">{{ t('channels.avatarHelper') }}</p>
            <button
              v-if="channel.avatar_url && !editRemoveAvatar"
              type="button"
              class="mt-2 text-sm font-semibold text-red-300 hover:text-red-200"
              @click="markAvatarForRemoval"
            >
              {{ t('channels.removeAvatar') }}
            </button>
            <p v-if="editRemoveAvatar" class="mt-2 rounded-lg bg-red-950/60 p-2 text-sm text-red-100">{{ t('channels.avatarWillBeRemoved') }}</p>
            <div v-if="editAvatarPreview" class="mt-3 flex items-center gap-3">
              <img :src="editAvatarPreview" :alt="t('channelPage.avatarPreview')" class="h-14 w-14 rounded-full border border-zinc-700 object-cover" />
              <button type="button" class="text-sm font-semibold text-red-300 hover:text-red-200" @click="clearSelectedAvatar">{{ t('channels.remove') }}</button>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold">{{ t('channels.backgroundImage') }}</label>
            <input type="file" accept="image/*" class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white" @change="onEditorBackgroundSelected" />
            <p class="mt-1 text-xs text-zinc-400">{{ t('channels.backgroundHelper') }}</p>
            <button
              v-if="channel.background_url && !editRemoveBackground"
              type="button"
              class="mt-2 text-sm font-semibold text-red-300 hover:text-red-200"
              @click="markBackgroundForRemoval"
            >
              {{ t('channels.removeBackground') }}
            </button>
            <p v-if="editRemoveBackground" class="mt-2 rounded-lg bg-red-950/60 p-2 text-sm text-red-100">{{ t('channels.backgroundWillBeRemoved') }}</p>
            <div v-if="editorBackgroundPreviewUrl" class="mt-3 space-y-3">
              <div class="relative h-36 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
                <img :src="editorBackgroundPreviewUrl" :alt="t('channelPage.backgroundPreview')" class="h-full w-full object-cover" :style="editBackgroundStyle" />
                <div class="absolute inset-0 bg-black/60" />
              </div>
              <div class="grid gap-3 rounded-xl border border-zinc-800 bg-black/30 p-3 sm:grid-cols-3">
                <label class="text-xs font-semibold text-zinc-300">
                  {{ t('channels.backgroundPositionX') }}
                  <input v-model.number="editForm.backgroundPositionX" type="range" min="0" max="100" class="mt-2 w-full accent-red-500" />
                </label>
                <label class="text-xs font-semibold text-zinc-300">
                  {{ t('channels.backgroundPositionY') }}
                  <input v-model.number="editForm.backgroundPositionY" type="range" min="0" max="100" class="mt-2 w-full accent-red-500" />
                </label>
                <label class="text-xs font-semibold text-zinc-300">
                  {{ t('channels.backgroundZoom') }}
                  <input v-model.number="editForm.backgroundScale" type="range" min="100" max="250" class="mt-2 w-full accent-red-500" />
                </label>
              </div>
              <div class="flex flex-wrap gap-3">
                <button type="button" class="text-sm font-semibold text-zinc-300 hover:text-white" @click="resetBackgroundCrop">{{ t('channels.resetBackgroundCrop') }}</button>
                <button v-if="editBackgroundPreview" type="button" class="text-sm font-semibold text-red-300 hover:text-red-200" @click="clearSelectedBackground">{{ t('channels.remove') }}</button>
              </div>
            </div>
          </div>

          <div v-if="editError" class="rounded-lg bg-red-950 p-3 text-sm text-red-100">
            {{ editError }}
          </div>

          <details class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <summary class="cursor-pointer text-sm font-bold text-zinc-100">{{ t('channels.customTheme') }}</summary>
            <p class="mt-2 text-xs leading-5 text-zinc-400">{{ t('channels.customThemeHelper') }}</p>

            <div class="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-semibold">{{ t('channels.headerHtml') }}</label>
                <textarea v-model="editForm.customHeaderHtml" rows="7" class="w-full rounded-lg border border-zinc-700 bg-black/50 px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-red-400" />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold">{{ t('channels.headerCss') }}</label>
                <textarea v-model="editForm.customHeaderCss" rows="7" class="w-full rounded-lg border border-zinc-700 bg-black/50 px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-red-400" />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold">{{ t('channels.contentHtml') }}</label>
                <textarea v-model="editForm.customContentHtml" rows="7" class="w-full rounded-lg border border-zinc-700 bg-black/50 px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-red-400" />
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold">{{ t('channels.contentCss') }}</label>
                <textarea v-model="editForm.customContentCss" rows="7" class="w-full rounded-lg border border-zinc-700 bg-black/50 px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-red-400" />
              </div>
            </div>
          </details>

          <button type="submit" :disabled="isSavingChannel" class="w-full rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
            {{ isSavingChannel ? t('channels.saving') : t('channels.save') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Loading/Error State -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-if="error" class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div class="bg-red-900 text-white p-4 rounded">
        {{ error }}
      </div>
    </div>

    <!-- Videos Section -->
    <div v-if="!isLoading && channel" class="channel-content-section relative overflow-hidden">
      <iframe
        v-if="contentThemeSrcdoc"
        class="channel-fade-bg pointer-events-none absolute inset-0 h-full w-full border-0"
        sandbox=""
        referrerpolicy="no-referrer"
        :srcdoc="contentThemeSrcdoc"
        :title="t('channelPage.customContent')"
      />
      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div class="channel-tabs mb-4 flex gap-2 border-b border-white/10">
          <button type="button" class="channel-tab-button px-3 py-2 text-sm font-bold transition" :class="activeTab === 'videos' ? 'is-active text-white' : 'text-zinc-400 hover:text-white'" @click="activeTab = 'videos'">{{ t('channelPage.videos') }}</button>
          <button type="button" class="channel-tab-button px-3 py-2 text-sm font-bold transition" :class="activeTab === 'clips' ? 'is-active text-white' : 'text-zinc-400 hover:text-white'" @click="activeTab = 'clips'">{{ t('channelPage.clips') }}</button>
          <button v-if="musicArtist" type="button" class="channel-tab-button px-3 py-2 text-sm font-bold transition" :class="activeTab === 'music' ? 'is-active text-white' : 'text-zinc-400 hover:text-white'" @click="activeTab = 'music'">{{ t('channelPage.music') }}</button>
        </div>

        <section v-if="activeTab === 'music'" class="channel-music-panel">
          <div class="music-panel-heading">
            <div>
              <h2>{{ musicArtist?.name }}</h2>
              <p>{{ musicReleases.length }} {{ musicReleases.length === 1 ? 'release' : 'releases' }}</p>
            </div>
            <NuxtLink :to="localePath(`/music/artists/${musicArtist?.slug}`)" class="artist-page-link">
              Artist page
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
            </NuxtLink>
          </div>
          <div v-if="musicReleases.length" class="music-release-grid">
            <NuxtLink v-for="release in musicReleases" :key="release.id" :to="localePath(`/music/releases/${release.slug}`)" class="channel-release-tile">
              <img v-if="release.cover_url" :src="imageVariantUrl(release.cover_url, 'md')" :srcset="imageVariantSrcset(release.cover_url) || undefined" sizes="(min-width: 1024px) 20vw, 50vw" :alt="`${release.title} cover`">
              <div v-else class="release-cover-placeholder" />
              <h3>{{ release.title }}</h3>
              <p>{{ release.release_type }} · {{ release.track_count }} {{ release.track_count === 1 ? 'track' : 'tracks' }}</p>
            </NuxtLink>
          </div>
          <div v-else class="music-empty">{{ t('channelPage.noReleases') }}</div>
        </section>

        <template v-else>
          <div v-if="displayedItems.length === 0" class="text-gray-400 text-center py-8">
            {{ activeTab === 'clips' ? 'No clips yet' : t('channelPage.noVideos') }}
          </div>

          <div v-else class="motion-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <NuxtLink v-for="video in displayedItems" :key="video.id" :to="localePath(`/video/${video.id}`)"
              class="channel-video-card group min-w-0 cursor-pointer">
              <div class="relative mb-2 aspect-video overflow-hidden rounded-lg bg-zinc-800">
                <img v-if="video.thumbnail_url" :src="video.thumbnail_url" :alt="video.title"
                  :srcset="imageVariantSrcset(video.thumbnail_url) || undefined"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  class="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                <div v-else class="w-full h-full bg-zinc-700 flex items-center justify-center">
                  <span class="text-zinc-500 text-xs">{{ t('channelPage.noThumbnail') }}</span>
                </div>
              </div>
              <h3
                class="text-zinc-100 font-semibold text-xs sm:text-sm line-clamp-2 group-hover:text-red-300 transition-colors break-words">
                {{ video.title }}
              </h3>
              <span v-if="isVideo8K(video.width)"
                class="p-0.5 bg-gray-900 text-gray-200 text-xs font-semibold flex-shrink-0 whitespace-nowrap border border-gray-500">8K</span>
              <span v-if="isVideo4K(video.width)"
                class="p-0.5 bg-gray-900 text-gray-200 text-xs font-semibold flex-shrink-0 whitespace-nowrap border border-gray-500">4K</span>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-xs text-zinc-300 line-clamp-1">{{ video.channel?.name || channel?.name }}</p>
                <VerifiedBadge v-if="video.channel?.verified || channel?.verified" :verified="true" size="sm" />
              </div>
              <p class="text-xs text-zinc-300 line-clamp-1">{{ t('channelPage.videoStats', { views: formatViews(video.views), time: getTimeAgo(video.created_at) }) }}</p>
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getChannelInfo, getChannelVideos, getChannelClips } from '~/app/service/channels'
import { updateChannel } from '~/app/service/upload'
import { getChannelMusic, type MusicArtist, type MusicRelease } from '~/app/service/music'
import { getChannelLiveStatus } from '~/app/service/live'
import { activeSubscriptionChannelID, getChannelSubscription, subscribeToChannel, unsubscribeFromChannel } from '~/app/service/subscriptions'
import { getTimeAgo } from '~/app/utils/time'
import { formatViews } from '~/app/utils/format'
import { imageVariantSrcset, imageVariantUrl, isVideo4K, isVideo8K, resolveMediaUrl } from '~/app/utils/media'
import { useMetaTags } from '~/app/composables/useMetaTags'
import ChannelMetricsCompact from '~/app/components/ChannelMetricsCompact.vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const channelId = route.params.id as string

const channel = ref<any | null>(null)
const videos = ref([])
const clips = ref([])
const musicArtist = ref<MusicArtist | null>(null)
const musicReleases = ref<MusicRelease[]>([])
const activeTab = ref<'videos' | 'clips' | 'music'>('videos')
const ownerUsername = ref('')
const isLoading = ref(true)
const error = ref('')
const failedChannelAvatar = ref(false)
const liveStatus = ref<any>(null)
const currentUserId = ref('')
const subscriptionActorChannelId = ref('')
const isSubscribed = ref(false)
const subscriberCount = ref(0)
const subscriptionBusy = ref(false)
const subscriptionError = ref('')
const showChannelDetails = ref(false)
const showChannelEditor = ref(false)
const isSavingChannel = ref(false)
const editError = ref('')
const editAvatarPreview = ref('')
const editBackgroundPreview = ref('')
const editRemoveAvatar = ref(false)
const editRemoveBackground = ref(false)
const editForm = ref({
  name: '',
  description: '',
  avatar: null as File | null,
  background: null as File | null,
  backgroundPositionX: 50,
  backgroundPositionY: 50,
  backgroundScale: 100,
  customHeaderHtml: '',
  customHeaderCss: '',
  customContentHtml: '',
  customContentCss: '',
})

const displayedItems = computed(() => activeTab.value === 'clips' ? clips.value : videos.value)
const channelBackgroundUrl = computed(() => channel.value?.background_url ? imageVariantUrl(channel.value.background_url, 'md') || resolveMediaUrl(channel.value.background_url) : '')
const channelBackgroundSrcset = computed(() => imageVariantSrcset(channel.value?.background_url))
const channelAvatarUrl = computed(() => channel.value?.avatar_url ? imageVariantUrl(channel.value.avatar_url, 'sm') || resolveMediaUrl(channel.value.avatar_url) : '')
const channelAvatarSrcset = computed(() => imageVariantSrcset(channel.value?.avatar_url))
const canEditChannel = computed(() => Boolean(channel.value?.user_id && currentUserId.value && channel.value.user_id === currentUserId.value))
const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, Math.round(numeric)))
}
const channelBackgroundStyle = computed(() => ({
  objectPosition: `${clampNumber(channel.value?.background_position_x, 50, 0, 100)}% ${clampNumber(channel.value?.background_position_y, 50, 0, 100)}%`,
  transformOrigin: `${clampNumber(channel.value?.background_position_x, 50, 0, 100)}% ${clampNumber(channel.value?.background_position_y, 50, 0, 100)}%`,
  transform: `scale(${clampNumber(channel.value?.background_scale, 100, 100, 250) / 100})`,
}))
const editBackgroundStyle = computed(() => ({
  objectPosition: `${clampNumber(editForm.value.backgroundPositionX, 50, 0, 100)}% ${clampNumber(editForm.value.backgroundPositionY, 50, 0, 100)}%`,
  transformOrigin: `${clampNumber(editForm.value.backgroundPositionX, 50, 0, 100)}% ${clampNumber(editForm.value.backgroundPositionY, 50, 0, 100)}%`,
  transform: `scale(${clampNumber(editForm.value.backgroundScale, 100, 100, 250) / 100})`,
}))
const editorBackgroundPreviewUrl = computed(() => editBackgroundPreview.value || (!editRemoveBackground.value && channelBackgroundUrl.value) || '')
const buildThemeSrcdoc = (html = '', css = '', label = 'channel theme') => {
  const body = String(html || '').trim()
  const styles = String(css || '').trim()
  if (!body && !styles) return ''
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:;">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${label}</title>
  <style>
    html, body { min-height: 100%; margin: 0; overflow: hidden; background: transparent; }
    *, *::before, *::after { box-sizing: border-box; }
    ${styles}
  </style>
</head>
<body>${body}</body>
</html>`
}
const headerThemeSrcdoc = computed(() => buildThemeSrcdoc(channel.value?.custom_header_html, channel.value?.custom_header_css, 'custom channel header'))
const contentThemeSrcdoc = computed(() => buildThemeSrcdoc(channel.value?.custom_content_html, channel.value?.custom_content_css, 'custom channel content'))

onMounted(async () => {
  try {
    currentUserId.value = localStorage.getItem('user_id') || ''
    subscriptionActorChannelId.value = activeSubscriptionChannelID()
    failedChannelAvatar.value = false
    const [channelData, videosData] = await Promise.all([
      getChannelInfo(channelId),
      getChannelVideos(channelId)
    ])
    channel.value = channelData.channel
    ownerUsername.value = channelData.owner_username
    getChannelSubscription(channelId, subscriptionActorChannelId.value).then((state) => {
      isSubscribed.value = Boolean(state.subscribed)
      subscriberCount.value = Number(state.subscriber_count || 0)
    }).catch((subscriptionErr) => {
      console.error('Channel subscription status failed:', subscriptionErr)
    })
    videos.value = videosData.map((video: any) => ({
      ...video,
      thumbnail_url: video.thumbnail_url ? resolveMediaUrl(video.thumbnail_url) : null
    }))
    try {
      const clipsData = await getChannelClips(channelId)
      clips.value = clipsData.map((clip: any) => ({
        ...clip,
        thumbnail_url: clip.thumbnail_url ? resolveMediaUrl(clip.thumbnail_url) : null
      }))
    } catch (clipErr) {
      console.error('Channel clips failed:', clipErr)
      clips.value = []
    }
    try {
      const musicData = await getChannelMusic(channelId)
      musicArtist.value = musicData.artist
      musicReleases.value = musicData.releases || []
    } catch (musicErr: any) {
      if (musicErr?.response?.status !== 404) {
        console.error('Channel music failed:', musicErr)
      }
      musicArtist.value = null
      musicReleases.value = []
    }

    getChannelLiveStatus(channelId).then(res => {
      liveStatus.value = res
    }).catch(err => {
      console.error('Live status failed:', err)
    })

  } catch (err) {
    error.value = typeof err === 'string' ? err : t('channelPage.loadError')
    console.error('Channel load error:', err)
  } finally {
    isLoading.value = false
  }
})

const toggleSubscription = async () => {
  if (!currentUserId.value) {
    await navigateTo(localePath('/login'))
    return
  }
  if (subscriptionBusy.value) return
  subscriptionBusy.value = true
  subscriptionError.value = ''
  try {
    const state = isSubscribed.value
      ? await unsubscribeFromChannel(channelId, subscriptionActorChannelId.value)
      : await subscribeToChannel(channelId, subscriptionActorChannelId.value)
    isSubscribed.value = Boolean(state.subscribed)
    subscriberCount.value = Number(state.subscriber_count || 0)
  } catch (err: any) {
    subscriptionError.value = err?.response?.data?.error || t('channelPage.subscriptionError')
  } finally {
    subscriptionBusy.value = false
  }
}

const openChannelEditor = () => {
  if (!channel.value) return
  editForm.value = {
    name: channel.value.name || '',
    description: channel.value.description || '',
    avatar: null,
    background: null,
    backgroundPositionX: clampNumber(channel.value.background_position_x, 50, 0, 100),
    backgroundPositionY: clampNumber(channel.value.background_position_y, 50, 0, 100),
    backgroundScale: clampNumber(channel.value.background_scale, 100, 100, 250),
    customHeaderHtml: channel.value.custom_header_html || '',
    customHeaderCss: channel.value.custom_header_css || '',
    customContentHtml: channel.value.custom_content_html || '',
    customContentCss: channel.value.custom_content_css || '',
  }
  editAvatarPreview.value = ''
  editBackgroundPreview.value = ''
  editRemoveAvatar.value = false
  editRemoveBackground.value = false
  editError.value = ''
  showChannelEditor.value = true
}

const previewSelectedFile = (file: File, target: typeof editAvatarPreview) => {
  const reader = new FileReader()
  reader.onload = (event) => {
    target.value = event.target?.result as string
  }
  reader.readAsDataURL(file)
}

const onEditorAvatarSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  editForm.value.avatar = file
  editRemoveAvatar.value = false
  previewSelectedFile(file, editAvatarPreview)
}

const onEditorBackgroundSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  editForm.value.background = file
  editRemoveBackground.value = false
  previewSelectedFile(file, editBackgroundPreview)
}

const clearSelectedAvatar = () => {
  editAvatarPreview.value = ''
  editForm.value.avatar = null
}

const clearSelectedBackground = () => {
  editBackgroundPreview.value = ''
  editForm.value.background = null
}

const resetBackgroundCrop = () => {
  editForm.value.backgroundPositionX = 50
  editForm.value.backgroundPositionY = 50
  editForm.value.backgroundScale = 100
}

const markAvatarForRemoval = () => {
  clearSelectedAvatar()
  editRemoveAvatar.value = true
}

const markBackgroundForRemoval = () => {
  clearSelectedBackground()
  editRemoveBackground.value = true
}

const refreshStoredChannels = (updatedChannel: any) => {
  if (!updatedChannel?.id) return
  try {
    const stored = JSON.parse(localStorage.getItem('user_channels') || '[]')
    if (!Array.isArray(stored)) return
    const next = stored.map((entry: any) => entry?.id === updatedChannel.id ? { ...entry, ...updatedChannel } : entry)
    localStorage.setItem('user_channels', JSON.stringify(next))
  } catch (err) {
    console.error('Failed to refresh stored channels:', err)
  }
}

const saveChannelEditor = async () => {
  if (!channel.value || !editForm.value.name.trim()) {
    editError.value = t('channels.nameRequired')
    return
  }
  isSavingChannel.value = true
  editError.value = ''
  try {
    const updated = await updateChannel(channelId, {
      name: editForm.value.name,
      description: editForm.value.description,
      avatar: editForm.value.avatar,
      background: editForm.value.background,
      removeAvatar: editRemoveAvatar.value,
      removeBackground: editRemoveBackground.value,
      backgroundPositionX: editForm.value.backgroundPositionX,
      backgroundPositionY: editForm.value.backgroundPositionY,
      backgroundScale: editForm.value.backgroundScale,
      customHeaderHtml: editForm.value.customHeaderHtml,
      customHeaderCss: editForm.value.customHeaderCss,
      customContentHtml: editForm.value.customContentHtml,
      customContentCss: editForm.value.customContentCss,
    })
    channel.value = { ...channel.value, ...updated }
    failedChannelAvatar.value = false
    refreshStoredChannels(updated)

    if (localStorage.getItem('active_account') === channelId) {
      localStorage.setItem('active_account_name', updated.name || editForm.value.name)
    }
    showChannelEditor.value = false
  } catch (err: any) {
    editError.value = err?.response?.data?.error || (typeof err === 'string' ? err : t('channels.updateError'))
  } finally {
    isSavingChannel.value = false
  }
}



watch(channel, (newChannel) => {
  if (newChannel) {
    const siteUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:3000'
    useMetaTags({
      title: `${newChannel.name} - GilTube`,
      description: newChannel.description || t('channelPage.metaDescription', { name: newChannel.name }),
      image: newChannel.avatar_url ? resolveMediaUrl(newChannel.avatar_url) : undefined,
      url: `${siteUrl}/channel/${channelId}`
    })
  }
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.channel-fade-bg {
  animation: channelBackgroundFade 520ms ease-out both;
}

.channel-content-section {
  min-height: max(34rem, calc(100vh - 5rem));
}

.channel-header-copy {
  color: #fff;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 1),
    0 3px 10px rgba(0, 0, 0, 0.98),
    0 12px 30px rgba(0, 0, 0, 0.82);
}

.channel-header-copy :deep(.channel-verified-badge svg) {
  color: #fff;
  filter:
    drop-shadow(0 1px 1px rgba(0, 0, 0, 1))
    drop-shadow(0 3px 8px rgba(0, 0, 0, 0.9));
}

.channel-header-metrics :deep(.flex.items-center.gap-6) {
  display: inline-flex;
  gap: 1rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
  padding: 0.35rem 0.65rem;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(6px);
}

.channel-header-metrics :deep(svg),
.channel-header-metrics :deep(span),
.channel-header-metrics :deep(div) {
  color: #fff;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 1),
    0 3px 10px rgba(0, 0, 0, 0.95);
}

.channel-tabs {
  display: inline-flex;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.34);
  padding: 0.15rem 0.35rem 0;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(8px);
}

.channel-tabs button {
  color: rgba(255, 255, 255, 0.72);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 1),
    0 3px 10px rgba(0, 0, 0, 0.9);
}

.channel-tabs button:hover,
.channel-tabs button.is-active {
  color: #fff;
}

.channel-tab-button {
  position: relative;
}

.channel-tab-button::after {
  content: "";
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.08rem;
  height: 2px;
  border-radius: 999px;
  background: transparent;
}

.channel-tab-button.is-active::after {
  background: #ef4444;
}

.channel-music-panel {
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.875rem;
  background:
    linear-gradient(180deg, rgba(39, 39, 42, 0.7), rgba(24, 24, 27, 0.58)),
    rgba(9, 9, 11, 0.46);
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.22);
  color: #f4f4f5;
  backdrop-filter: blur(12px);
}

.music-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.music-panel-heading h2 {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 800;
}

.music-panel-heading p {
  margin-top: 0.2rem;
  color: #a1a1aa;
  font-size: 0.82rem;
}

.artist-page-link {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.35rem;
  flex: none;
  padding: 0.55rem 0.75rem;
  border: 1px solid #52525b;
  border-radius: 6px;
  background: #18181b;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  transition: border-color 150ms ease, background 150ms ease;
}

.artist-page-link:hover {
  border-color: #71717a;
  background: #27272a;
}

.artist-page-link svg {
  width: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.music-release-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.channel-release-tile {
  display: block;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.7);
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
}

.channel-release-tile:hover {
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(39, 39, 42, 0.82);
  transform: translateY(-2px);
}

.channel-release-tile img,
.release-cover-placeholder {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 5px;
  background: #27272a;
  object-fit: cover;
}

.channel-release-tile h3 {
  margin-top: 0.65rem;
  overflow: hidden;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-release-tile:hover h3 {
  color: #fca5a5;
}

.channel-release-tile p {
  margin-top: 0.22rem;
  overflow: hidden;
  color: #a1a1aa;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  text-transform: capitalize;
  white-space: nowrap;
}

.music-empty {
  padding: 2rem 0;
  color: #a1a1aa;
  text-align: center;
}

@media (min-width: 640px) {
  .channel-music-panel {
    padding-inline: 1.25rem;
  }

  .music-release-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .music-release-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.channel-video-card {
  display: block;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.875rem;
  background:
    linear-gradient(180deg, rgba(39, 39, 42, 0.72), rgba(24, 24, 27, 0.58)),
    rgba(9, 9, 11, 0.44);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
  padding: 0.45rem;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
  backdrop-filter: blur(10px);
}

.channel-video-card:hover {
  border-color: rgba(248, 113, 113, 0.5);
  background:
    linear-gradient(180deg, rgba(63, 63, 70, 0.8), rgba(24, 24, 27, 0.66)),
    rgba(9, 9, 11, 0.56);
  transform: translateY(-1px);
}

@supports not (backdrop-filter: blur(10px)) {
  .channel-video-card {
    background: rgba(24, 24, 27, 0.86);
  }
}

@keyframes channelBackgroundFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .channel-fade-bg {
    animation: none;
  }
}
</style>
