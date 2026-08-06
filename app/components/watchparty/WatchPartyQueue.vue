<template>
  <section class="mt-6">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-white">Party queue</h2>
        <p class="text-sm text-zinc-500">{{ queueItems.length }} item{{ queueItems.length === 1 ? '' : 's' }}</p>
      </div>
      <button
        type="button"
        class="rounded bg-zinc-800 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-700"
        @click="openQueuePicker"
      >
        Add video to queue
      </button>
    </div>

    <p v-if="queueError" class="mb-3 text-sm text-red-300">{{ queueError }}</p>

    <div class="hidden lg:block">
      <div v-if="queueItems.length" class="flex max-w-full gap-3 overflow-x-auto pb-2 watch-party-queue-scroll">
        <article
          v-for="(item, index) in queueItems"
          :key="item.id"
          class="flex w-[26rem] max-w-[80vw] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5"
        >
          <div class="relative h-24 w-40 shrink-0 bg-black">
            <img :src="thumbnailUrl(item.thumbnail_url)" :alt="item.title" class="h-full w-full object-cover" />
          </div>
          <div class="min-w-0 flex-1 p-3">
            <p class="line-clamp-2 text-sm font-semibold text-white">{{ item.title }}</p>
            <p class="mt-1 text-xs text-zinc-500">Added by {{ item.added_by }}</p>
            <div v-if="isHost" class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[11px] hover:bg-zinc-600" :disabled="index === 0" @click="$emit('move', index, -1)">Up</button>
              <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[11px] hover:bg-zinc-600" :disabled="index === queueItems.length - 1" @click="$emit('move', index, 1)">Down</button>
              <button type="button" class="rounded bg-red-600 px-2 py-1 text-[11px] hover:bg-red-700" @click="$emit('play', item.id)">Play</button>
              <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[11px] hover:bg-zinc-600" @click="$emit('remove', item.id)">Remove</button>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-zinc-500">
        No videos in the queue yet.
      </div>
    </div>

    <div class="lg:hidden">
      <button
        type="button"
        class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
        @click="showMobileQueue = true"
      >
        <span class="block text-sm font-semibold text-white">Open queue</span>
        <span class="block text-xs text-zinc-500">{{ queueItems.length }} item{{ queueItems.length === 1 ? '' : 's' }}</span>
      </button>
    </div>

    <div
      v-if="showMobileQueue"
      class="fixed inset-0 z-[95] flex items-end bg-black/80 p-0 lg:hidden"
      @click.self="showMobileQueue = false"
    >
      <section class="flex max-h-[82vh] w-full flex-col rounded-t-2xl border border-white/10 bg-zinc-950">
        <div class="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div>
            <h3 class="text-lg font-semibold text-white">Party queue</h3>
            <p class="text-xs text-zinc-500">{{ queueItems.length }} item{{ queueItems.length === 1 ? '' : 's' }}</p>
          </div>
          <button type="button" class="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/15" @click="showMobileQueue = false">
            X
          </button>
        </div>
        <div class="overflow-y-auto p-4">
          <button
            type="button"
            class="mb-4 w-full rounded bg-zinc-800 px-4 py-3 text-sm font-semibold transition hover:bg-zinc-700"
            @click="openQueuePicker"
          >
            Add video to queue
          </button>
          <div v-if="queueItems.length" class="space-y-3">
            <article
              v-for="(item, index) in queueItems"
              :key="item.id"
              class="overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              <div class="flex gap-3 p-3">
                <img :src="thumbnailUrl(item.thumbnail_url)" :alt="item.title" class="h-16 w-28 rounded object-cover" />
                <div class="min-w-0 flex-1">
                  <p class="line-clamp-2 text-sm font-semibold text-white">{{ item.title }}</p>
                  <p class="mt-1 text-xs text-zinc-500">Added by {{ item.added_by }}</p>
                  <div v-if="isHost" class="mt-3 flex flex-wrap gap-2">
                    <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[11px] hover:bg-zinc-600" :disabled="index === 0" @click="$emit('move', index, -1)">Up</button>
                    <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[11px] hover:bg-zinc-600" :disabled="index === queueItems.length - 1" @click="$emit('move', index, 1)">Down</button>
                    <button type="button" class="rounded bg-red-600 px-2 py-1 text-[11px] hover:bg-red-700" @click="$emit('play', item.id)">Play</button>
                    <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[11px] hover:bg-zinc-600" @click="$emit('remove', item.id)">Remove</button>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-zinc-500">
            No videos in the queue yet.
          </div>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <div
        v-if="showQueuePicker"
        class="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.22),_rgba(0,0,0,0.92)_45%,_rgba(0,0,0,0.98))] p-3 text-white sm:items-center sm:p-6"
        :style="{ zIndex: 2147483647 }"
        @click.self="showQueuePicker = false"
      >
        <section class="flex h-full w-full max-w-6xl flex-col overflow-hidden border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl sm:h-[min(88dvh,760px)] sm:rounded-2xl">
          <div class="border-b border-white/10 p-4 sm:p-5">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-xl font-bold">Add video to queue</h2>
              <button type="button" class="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/15" @click="showQueuePicker = false">
                X
              </button>
            </div>
            <input
              v-model="queueSearch"
              type="search"
              class="mt-4 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-red-500"
              placeholder="Search videos..."
              @input="handleQueueSearchInput"
            />
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div v-if="queuePickerLoading" class="py-12 text-center text-sm text-zinc-400">Loading videos...</div>
            <div v-else-if="queuePickerVideos.length === 0" class="py-12 text-center text-sm text-zinc-400">No videos found.</div>
            <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <button
                v-for="video in queuePickerVideos"
                :key="video.id"
                type="button"
                class="group overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:border-red-500/50 hover:bg-white/10"
                @click="selectQueueVideo(video.id)"
              >
                <div class="relative aspect-video bg-black">
                  <img :src="thumbnailUrl(video.thumbnail_url || video.thumbnail)" :alt="video.title" class="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                  <div class="absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />
                  <span class="absolute inset-x-3 bottom-3 rounded bg-red-600 px-3 py-2 text-center text-xs font-bold opacity-0 transition group-hover:opacity-100">
                    Add to queue
                  </span>
                </div>
                <div class="p-3">
                  <p class="line-clamp-2 text-sm font-semibold">{{ video.title }}</p>
                  <p class="mt-1 line-clamp-1 text-xs text-zinc-500">{{ video.channel || video.channel?.name }}</p>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { getVideos } from '~/app/service/videos'
import { searchWatchPartyVideos } from '~/app/service/watchParties'

const props = defineProps<{
  queueItems: any[]
  queueError: string
  isHost: boolean
  thumbnailUrl: (url: string) => string
}>()

const emit = defineEmits<{
  add: [videoId: string]
  play: [itemId: string]
  remove: [itemId: string]
  move: [index: number, direction: number]
}>()

const queueSearch = ref('')
const queuePickerVideos = ref<any[]>([])
const queuePickerLoading = ref(false)
const showQueuePicker = ref(false)
const showMobileQueue = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const loadRecommendedQueueVideos = async () => {
  queuePickerLoading.value = true
  try {
    queuePickerVideos.value = await getVideos({ limit: 24, offset: 0 })
  } catch (err) {
    queuePickerVideos.value = []
  } finally {
    queuePickerLoading.value = false
  }
}

const performQueueSearch = async () => {
  const query = queueSearch.value.trim()
  if (!query) {
    await loadRecommendedQueueVideos()
    return
  }
  queuePickerLoading.value = true
  try {
    const data = await searchWatchPartyVideos(query)
    queuePickerVideos.value = data.results || []
  } catch (err) {
    queuePickerVideos.value = []
  } finally {
    queuePickerLoading.value = false
  }
}

const handleQueueSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(performQueueSearch, 250)
}

const openQueuePicker = async () => {
  showQueuePicker.value = true
  queueSearch.value = ''
  await loadRecommendedQueueVideos()
}

const selectQueueVideo = (videoId: string) => {
  showQueuePicker.value = false
  emit('add', videoId)
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  document.body.style.overflow = ''
})

watch(showQueuePicker, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})
</script>

<style scoped>
.watch-party-queue-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(239, 68, 68, 0.45) rgba(24, 24, 27, 0.55);
}

.watch-party-queue-scroll::-webkit-scrollbar {
  height: 8px;
}

.watch-party-queue-scroll::-webkit-scrollbar-track {
  background: rgba(24, 24, 27, 0.55);
  border-radius: 9999px;
}

.watch-party-queue-scroll::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.45);
  border-radius: 9999px;
}
</style>
