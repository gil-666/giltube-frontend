<template>
  <main class="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[100rem]">
      <header class="mb-8">
        <h1 class="text-3xl font-black sm:text-4xl">{{ t('subscriptions.title') }}</h1>
        <p class="mt-2 text-sm text-zinc-400">{{ t('subscriptions.subtitle') }}</p>
      </header>

      <div v-if="loading" class="space-y-10" aria-hidden="true">
        <section v-for="row in 3" :key="row">
          <div class="mb-4 flex items-center gap-3">
            <div class="h-11 w-11 animate-pulse rounded-full bg-zinc-800" />
            <div class="h-5 w-40 animate-pulse rounded bg-zinc-800" />
          </div>
          <div class="flex gap-5 overflow-hidden">
            <div v-for="card in 5" :key="card" class="w-[min(76vw,20rem)] shrink-0 sm:w-64 lg:w-72">
              <div class="aspect-video animate-pulse rounded-lg bg-zinc-800" />
              <div class="mt-3 h-4 w-4/5 animate-pulse rounded bg-zinc-800" />
              <div class="mt-2 h-3 w-2/5 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        </section>
      </div>

      <div v-else-if="error" class="rounded-lg border border-red-900 bg-red-950/40 p-5 text-red-100">{{ error }}</div>

      <div v-else-if="!channels.length" class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-6 py-12 text-center">
        <h2 class="text-xl font-bold">{{ t('subscriptions.emptyTitle') }}</h2>
        <p class="mt-2 text-sm text-zinc-400">{{ t('subscriptions.emptyBody') }}</p>
        <NuxtLink :to="localePath('/search')" class="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-zinc-200">{{ t('subscriptions.findChannels') }}</NuxtLink>
      </div>

      <div v-else class="space-y-10">
        <section v-for="row in channelRows" :key="row.channel.id" class="subscription-row">
          <div class="mb-4 flex items-center justify-between gap-4">
            <NuxtLink :to="localePath(`/channel/${row.channel.id}`)" class="group flex min-w-0 items-center gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-base font-black">
                <img v-if="row.channel.avatar_url" :src="resolveAvatarUrl(row.channel.avatar_url)" :alt="row.channel.name" class="h-full w-full object-cover" loading="lazy">
                <span v-else>{{ row.channel.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="flex min-w-0 items-center gap-1.5">
                <h2 class="truncate text-lg font-bold group-hover:text-red-300">{{ row.channel.name }}</h2>
                <VerifiedBadge :verified="row.channel.verified" size="sm" />
              </div>
            </NuxtLink>

            <div v-if="row.videos.length > 1" class="hidden shrink-0 items-center gap-2 xl:flex">
              <button type="button" :aria-label="t('subscriptions.scrollLeft', { channel: row.channel.name })" class="subscription-arrow" @click="scrollRow(row.channel.id, -1)">‹</button>
              <button type="button" :aria-label="t('subscriptions.scrollRight', { channel: row.channel.name })" class="subscription-arrow" @click="scrollRow(row.channel.id, 1)">›</button>
            </div>
          </div>

          <div v-if="row.videos.length" class="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div :ref="setRowRef(row.channel.id)" class="subscription-rail flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2 sm:gap-5">
              <NuxtLink v-for="video in row.videos" :key="video.id" :to="localePath(`/video/${video.id}`)" class="subscription-card group min-w-0 shrink-0 snap-start">
                <div class="aspect-video overflow-hidden rounded-lg bg-zinc-900">
                  <img v-if="video.thumbnail_url" :src="resolveMediaUrl(video.thumbnail_url)" :srcset="imageVariantSrcset(video.thumbnail_url) || undefined" sizes="(min-width:1280px) 18rem, (min-width:640px) 16rem, 76vw" :alt="video.title" class="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" decoding="async">
                </div>
                <h3 class="mt-3 line-clamp-2 text-sm font-bold group-hover:text-red-300">{{ video.title }}</h3>
                <p class="mt-1 text-xs text-zinc-500">{{ t('home.videoStats', { views: formatViews(video.views), time: getTimeAgo(video.created_at) }) }}</p>
              </NuxtLink>
            </div>
          </div>
          <p v-else class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-7 text-sm text-zinc-400">{{ t('subscriptions.channelNoUploads', { channel: row.channel.name }) }}</p>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import { activeSubscriptionChannelID, getSubscriptionsFeed, listSubscribedChannels } from '~/app/service/subscriptions'
import { formatViews } from '~/app/utils/format'
import { imageVariantSrcset, resolveAvatarUrl, resolveMediaUrl } from '~/app/utils/media'
import { getTimeAgo } from '~/app/utils/time'

const { t } = useI18n()
const localePath = useLocalePath()
const channels = ref<any[]>([])
const videos = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const rowElements: Record<string, HTMLElement> = {}

const channelRows = computed(() => channels.value.map((channel) => ({
  channel,
  videos: videos.value.filter((video) => video.channel_id === channel.id),
})))

const setRowRef = (channelID: string) => (element: any) => {
  if (element instanceof HTMLElement) {
    rowElements[channelID] = element
  } else {
    delete rowElements[channelID]
  }
}

const scrollRow = (channelID: string, direction: number) => {
  const element = rowElements[channelID]
  if (!element) return
  element.scrollBy({ left: direction * element.clientWidth, behavior: 'smooth' })
}

onMounted(async () => {
  if (!localStorage.getItem('user_id')) {
    await navigateTo(localePath('/login'))
    return
  }
  const actorChannelID = activeSubscriptionChannelID()
  try {
    const [channelData, feed] = await Promise.all([
      listSubscribedChannels(actorChannelID),
      getSubscriptionsFeed(actorChannelID, 12),
    ])
    channels.value = channelData.channels || []
    videos.value = feed.videos || []
  } catch (err: any) {
    error.value = err?.response?.data?.error || t('subscriptions.loadError')
  } finally {
    loading.value = false
  }
})

useHead({ title: () => `${t('subscriptions.title')} - GilTube` })
</script>

<style scoped>
.subscription-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 17rem;
}

.subscription-rail {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.subscription-rail::-webkit-scrollbar {
  display: none;
}

.subscription-card {
  width: clamp(15rem, 19vw, 19rem);
}

.subscription-arrow {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 9999px;
  background: rgb(255 255 255 / 5%);
  color: white;
  font-size: 1.125rem;
  transition: background-color 150ms ease;
}

.subscription-arrow:hover {
  background: rgb(255 255 255 / 10%);
}

@media (max-width: 640px) {
  .subscription-card {
    width: min(76vw, 20rem);
  }
}
</style>
