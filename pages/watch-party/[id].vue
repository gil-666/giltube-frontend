<template>
  <main class="min-h-full bg-black text-white">
    <div v-if="inviteMode" class="flex min-h-full items-center justify-center p-4">
      <section class="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center shadow-2xl">
        <div class="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-2xl font-bold">
          <img v-if="hostAvatar" :src="hostAvatar" :alt="hostName" class="h-full w-full object-cover" />
          <span v-else>{{ hostName.charAt(0).toUpperCase() }}</span>
        </div>
        <p class="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-red-300">Watch party invite</p>
        <h1 class="mt-3 text-3xl font-bold">You were invited to {{ hostName }}'s watch party</h1>
        <p class="mt-4 text-base text-zinc-300">
          Currently watching <span class="font-semibold text-white">{{ currentWatchingTitle }}</span>
        </p>
        <p v-if="partyEnded" class="mt-5 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-300">
          This watch party has ended.
        </p>
        <div v-else-if="!isLoggedIn" class="mt-6">
          <p class="mb-4 text-sm text-zinc-400">You need to be signed in to join watch parties.</p>
          <NuxtLink :to="localePath('/login')" class="inline-flex rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700">
            Sign in
          </NuxtLink>
        </div>
        <button
          v-else
          type="button"
          class="mt-6 w-full rounded-lg bg-red-600 px-6 py-4 text-base font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          :disabled="joiningParty"
          @click="joinPartyFromInvite"
        >
          {{ joiningParty ? 'Joining...' : 'Join watch party' }}
        </button>
      </section>
    </div>

    <div v-else class="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-6">
      <section class="flex min-w-0 flex-col">
        <div class="relative">
          <VideoPlayer
            ref="videoPlayerRef"
            :src="videoSrc"
            :status="partyData?.video?.status || 'ready'"
            :start-time-seconds="playbackStartTimeSeconds"
            :controls-locked="!canControlPlayback"
            @play="sendPlayback('play')"
            @pause="sendPlayback('pause')"
            @seeked="sendPlayback('seek', $event.currentTime)"
            @progress="sendPlaybackProgress"
            @ended="playNextQueueItem"
          />
          <div v-if="playbackOverlay" class="absolute right-4 top-4 z-20 rounded bg-black/80 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {{ playbackOverlay }}
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Watch party</p>
            <h1 class="mt-2 text-2xl font-bold">{{ currentWatchingTitle }}</h1>
            <p class="mt-2 text-sm text-zinc-400">{{ partyData?.video?.description }}</p>
            <p v-if="isHost" class="mt-2 text-xs font-semibold uppercase tracking-wide text-red-300">You are the host</p>
            <div v-if="isHost" class="mt-4 inline-flex rounded-lg border border-white/10 bg-zinc-900 p-1">
              <button
                type="button"
                class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
                :class="syncMode === 'host-only' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'"
                @click="changeSyncMode('host-only')"
              >
                Host-only
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
                :class="syncMode === 'open' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'"
                @click="changeSyncMode('open')"
              >
                Open
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="rounded bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700" @click="copyPartyLink">
              {{ linkCopied ? 'Copied' : 'Copy link' }}
            </button>
            <button class="rounded bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700" @click="leaveParty">
              Leave
            </button>
          </div>
        </div>

        <div v-if="showShareLinkPreview" class="mt-3 rounded-lg border border-white/10 bg-zinc-950/80 p-3">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Share link</p>
          <input
            :value="partyShareUrl"
            readonly
            class="w-full rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none ring-1 ring-white/10"
            @focus="$event.target.select()"
          />
        </div>

        <WatchPartyQueue
          v-if="partyData?.party?.party_type !== 'single'"
          :queue-items="queueItems"
          :queue-error="queueError"
          :is-host="isHost"
          :thumbnail-url="thumbnailUrl"
          @add="addQueueVideo"
          @play="playQueueItem"
          @remove="removeQueueItem"
          @move="moveQueueItem"
        />
      </section>

      <aside class="flex min-h-[32rem] flex-col rounded border border-white/10 bg-zinc-950">
        <div class="border-b border-white/10 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold">Party chat</h2>
              <p class="text-xs text-zinc-500">{{ participants.length }} participant{{ participants.length === 1 ? '' : 's' }}</p>
            </div>
            <button class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15" @click="showParticipants = !showParticipants">
              Participants
            </button>
          </div>
          <div v-if="showParticipants" class="mt-3 space-y-2">
            <component
              :is="person.channel_id ? 'NuxtLink' : 'div'"
              v-for="person in participants"
              :key="person.user_id"
              :to="person.channel_id ? `/channel/${person.channel_id}` : undefined"
              class="flex items-center gap-2 rounded bg-white/5 px-2 py-2 transition"
              :class="person.channel_id ? 'hover:bg-white/10' : ''"
            >
              <img v-if="person.avatar_url" :src="avatarUrl(person.avatar_url)" :alt="person.name" class="h-7 w-7 rounded-full object-cover" />
              <div v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">{{ person.name?.charAt(0)?.toUpperCase() || 'U' }}</div>
              <span class="text-sm">{{ person.name }}</span>
              <span v-if="person.is_host" class="ml-auto rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase">Host</span>
              <div v-if="isHost && !person.is_host" class="ml-auto flex gap-1">
                <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[10px] font-semibold hover:bg-zinc-600" @click.prevent="makeHost(person.user_id)">
                  Make host
                </button>
                <button type="button" class="rounded bg-zinc-700 px-2 py-1 text-[10px] font-semibold hover:bg-zinc-600" @click.prevent="toggleSuggest(person)">
                  {{ person.can_suggest ? 'Mute queue' : 'Allow queue' }}
                </button>
              </div>
            </component>
          </div>
        </div>

        <div ref="chatListRef" class="flex-1 space-y-3 p-4">
          <div v-for="item in timeline" :key="item.id || `${item.type}-${item.at}`">
            <div v-if="item.type === 'system'" class="text-center text-xs text-zinc-500">{{ item.text }}</div>
            <div v-else class="rounded bg-white/5 p-3">
              <div class="mb-1 flex items-center gap-2 text-xs text-zinc-400">
                <span class="font-semibold text-zinc-200">{{ item.actor?.name || 'User' }}</span>
                <span>{{ formatMessageTime(item.created_at) }}</span>
              </div>
              <p v-if="item.message" class="text-sm text-zinc-100">{{ item.message }}</p>
              <p v-if="item.reaction" class="text-xl">{{ item.reaction }}</p>
              <img v-if="item.gif_url" :src="item.gif_url" alt="GIF" class="mt-2 max-h-40 rounded object-contain" />
            </div>
          </div>
        </div>

        <div class="border-t border-white/10 p-3">
          <div class="mb-2 flex gap-2">
            <button v-for="reaction in quickReactions" :key="reaction" class="rounded bg-white/10 px-2 py-1 text-lg hover:bg-white/15" @click="sendReaction(reaction)">
              {{ reaction }}
            </button>
            <button type="button" class="rounded bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/15" @click="showGiphyPicker = true">
              GIF
            </button>
          </div>
          <form class="flex gap-2" @submit.prevent="sendMessage">
            <input v-model="chatInput" class="min-w-0 flex-1 rounded bg-zinc-900 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-red-500" placeholder="Say something..." maxlength="500" />
            <button class="rounded bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700" :disabled="!chatInput.trim()">Send</button>
          </form>
        </div>
      </aside>
    </div>

    <GiphyPicker
      :is-open="showGiphyPicker"
      @close="showGiphyPicker = false"
      @select="handleGiphySelect"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GiphyPicker from '~/app/components/GiphyPicker.vue'
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import WatchPartyQueue from '~/app/components/watchparty/WatchPartyQueue.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import {
  addWatchPartyQueueItem,
  getWatchParty,
  joinWatchParty,
  leaveWatchParty,
  playWatchPartyQueueItem,
  postWatchPartyChat,
  postWatchPartyPlayback,
  removeWatchPartyQueueItem,
  reorderWatchPartyQueue,
  saveWatchPartyProgress,
  setWatchPartySuggestPermission,
  setWatchPartySyncMode,
  transferWatchPartyHost,
  watchPartyEventURL,
} from '~/app/service/watchParties'
import type { GiphyGif } from '~/app/utils/giphy'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
const partyId = String(route.params.id || '')
const partyData = ref<any>(null)
const participants = ref<any[]>([])
const queueItems = ref<any[]>([])
const timeline = ref<any[]>([])
const chatInput = ref('')
const queueError = ref('')
const showGiphyPicker = ref(false)
const showParticipants = ref(false)
const playbackOverlay = ref('')
const linkCopied = ref(false)
const showShareLinkPreview = ref(false)
const isLoggedIn = ref(false)
const hasJoined = ref(false)
const joiningParty = ref(false)
const chatListRef = ref<HTMLElement | null>(null)
const videoPlayerRef = ref<any>(null)
const quickReactions = ['❤️', '😂', '😮', '👏']
let events: EventSource | null = null
let overlayTimer: ReturnType<typeof setTimeout> | null = null
let playbackRestoreTimer: ReturnType<typeof setTimeout> | null = null
let lastPlaybackProgressSyncAt = 0
let applyingRemotePlayback = false

const videoSrc = computed(() => {
  const path = partyData.value?.video?.hls_path || ''
  if (!path) return ''
  return /^https?:\/\//i.test(path) ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
})

const hostName = computed(() => partyData.value?.host?.name || 'Someone')
const hostAvatar = computed(() => avatarUrl(partyData.value?.host?.avatar_url || ''))
const currentWatchingTitle = computed(() => partyData.value?.video?.display_title || partyData.value?.video?.title || 'a video')
const partyEnded = computed(() => partyData.value?.party?.status === 'ended')
const currentUserId = computed(() => typeof window !== 'undefined' ? (localStorage.getItem('user_id') || '') : '')
const isHost = computed(() => !!currentUserId.value && partyData.value?.party?.host_user_id === currentUserId.value)
const syncMode = computed(() => partyData.value?.party?.sync_mode || 'host-only')
const canControlPlayback = computed(() => isHost.value || syncMode.value === 'open')
const inviteMode = computed(() => !hasJoined.value || partyEnded.value)
const playbackStartTimeSeconds = computed(() => {
  if (!hasJoined.value || !partyData.value?.party) return 0
  const seconds = Number(partyData.value.party.current_time || 0)
  const updatedAt = new Date(partyData.value.party.playback_updated_at || Date.now()).getTime()
  const drift = partyData.value.party.playback_state === 'playing'
    ? Math.max(0, (Date.now() - updatedAt) / 1000)
    : 0
  return Math.max(0, seconds + drift)
})

const partyShareUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return window.location.href
})

const avatarUrl = (url: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const normalized = url.startsWith('/avatars/') ? url : `/avatars/${url.replace(/^\/+/, '')}`
  return `${baseUrl}${normalized}`
}

const thumbnailUrl = (url: string) => {
  if (!url) return `${baseUrl}/videos/placeholder-thumbnail.jpg`
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const formatMessageTime = (value: string) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollChat = async () => {
  await nextTick()
  if (chatListRef.value) chatListRef.value.scrollTop = chatListRef.value.scrollHeight
}

const showPlaybackOverlay = (text: string) => {
  playbackOverlay.value = text
  if (overlayTimer) clearTimeout(overlayTimer)
  overlayTimer = setTimeout(() => {
    playbackOverlay.value = ''
  }, 3200)
}

const activeChannelId = () => {
  if (typeof window === 'undefined') return ''
  const active = localStorage.getItem('active_account') || ''
  const userId = localStorage.getItem('user_id') || ''
  return active && active !== 'personal' && active !== userId ? active : ''
}

const connectEvents = (userId: string) => {
  events?.close()
  events = new EventSource(watchPartyEventURL(partyId, userId))
  events.onmessage = async (event) => {
    const payload = JSON.parse(event.data)
    if (payload.type === 'chat') {
      timeline.value.push({ ...payload.message, type: 'chat' })
      await scrollChat()
    } else if (payload.type === 'join') {
      timeline.value.push({ type: 'system', text: `${payload.actor?.name || 'Someone'} joined`, at: payload.at })
      await refreshParty(false)
      await scrollChat()
    } else if (payload.type === 'leave') {
      timeline.value.push({ type: 'system', text: `${payload.actor?.name || 'Someone'} left`, at: payload.at })
      await refreshParty(false)
      await scrollChat()
    } else if (payload.type === 'ended') {
      timeline.value.push({ type: 'system', text: 'The host ended the watch party', at: payload.at })
      await refreshParty(false)
      hasJoined.value = false
      if (typeof window !== 'undefined') {
        localStorage.removeItem('giltube:active-watch-party')
        window.dispatchEvent(new Event('giltube:watch-party-updated'))
      }
    } else if (payload.type === 'host_changed' || payload.type === 'permissions' || payload.type === 'queue') {
      await refreshParty(false)
      if (payload.type === 'queue' && payload.action === 'play') {
        applyRemotePlayback('play', 0)
      }
    } else if (payload.type === 'sync_mode') {
      await refreshParty(false)
    } else if (payload.type === 'playback') {
      const verb = payload.action === 'seek' ? 'skipped' : payload.action === 'pause' ? 'paused' : 'played'
      if (payload.actor?.user_id !== currentUserId.value) {
        if (payload.action !== 'progress') {
          showPlaybackOverlay(`${payload.actor?.name || 'Someone'} ${verb}`)
        }
        applyRemotePlayback(payload.action, Number(payload.current_time || 0), payload.playback_state)
      }
    }
  }
}

const refreshParty = async (replaceMessages = true) => {
  partyData.value = await getWatchParty(partyId)
  participants.value = partyData.value.participants || []
  queueItems.value = partyData.value.queue || []
  if (replaceMessages) {
    timeline.value = (partyData.value.messages || []).map((item: any) => ({ ...item, type: 'chat' }))
    await scrollChat()
  }
  useMetaTags({
    title: `${partyData.value.video?.title || 'Watch party'} - Watch Party`,
    description: `Join this GilTube watch party.`,
    image: partyData.value.video?.thumbnail_url || undefined,
    url: route.fullPath,
  })
}

const joinPartyFromInvite = async () => {
  if (!isLoggedIn.value) {
    await router.push(localePath('/login'))
    return
  }
  joiningParty.value = true
  try {
    await joinWatchParty(partyId, activeChannelId())
    hasJoined.value = true
    await refreshParty(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('giltube:active-watch-party', JSON.stringify({ id: partyId, title: currentWatchingTitle.value }))
      window.dispatchEvent(new Event('giltube:watch-party-updated'))
    }
    connectEvents(currentUserId.value)
    await nextTick()
    schedulePlaybackRestore()
  } finally {
    joiningParty.value = false
  }
}

const clearPlaybackRestoreTimer = () => {
  if (playbackRestoreTimer) {
    clearTimeout(playbackRestoreTimer)
    playbackRestoreTimer = null
  }
}

const schedulePlaybackRestore = (attempt = 0) => {
  clearPlaybackRestoreTimer()
  if (!hasJoined.value || !partyData.value?.party || !videoSrc.value) return

  playbackRestoreTimer = setTimeout(async () => {
    const controls = videoPlayerRef.value
    const state = partyData.value?.party?.playback_state || 'paused'
    const seconds = playbackStartTimeSeconds.value
    const playerState = controls?.getPlaybackState?.()
    const playerDuration = Number(playerState?.duration || 0)

    if (!controls || playerDuration <= 0) {
      if (attempt < 12) {
        schedulePlaybackRestore(attempt + 1)
      }
      return
    }

    await applyRemotePlayback(state === 'playing' ? 'play' : 'pause', seconds, state)
  }, attempt === 0 ? 0 : 250)
}

const applyRemotePlayback = async (action: string, seconds: number, state = '') => {
  const controls = videoPlayerRef.value
  if (!controls) return
  applyingRemotePlayback = true
  try {
    if (action === 'pause' || state === 'paused') {
      controls.pauseAt?.(seconds)
    } else if (action === 'seek') {
      controls.setPlaybackTime?.(seconds)
    } else if (action === 'play' || action === 'progress' || state === 'playing') {
      await controls.playFrom?.(seconds)
    }
  } finally {
    setTimeout(() => {
      applyingRemotePlayback = false
    }, 700)
  }
}

const sendMessage = async () => {
  const message = chatInput.value.trim()
  if (!message) return
  chatInput.value = ''
  await postWatchPartyChat(partyId, { message, channelId: activeChannelId() })
}

const sendReaction = async (reaction: string) => {
  await postWatchPartyChat(partyId, { reaction, channelId: activeChannelId() })
}

const handleGiphySelect = async (gif: GiphyGif) => {
  showGiphyPicker.value = false
  await postWatchPartyChat(partyId, { gifUrl: gif.images.downsized.url, channelId: activeChannelId() })
}

const sendPlayback = async (action: string, currentTime = 0) => {
  if (applyingRemotePlayback || !canControlPlayback.value) return
  const state = videoPlayerRef.value?.getPlaybackState?.()
  const resolvedTime = action === 'seek' ? currentTime : Number(state?.currentTime || currentTime || 0)
  await postWatchPartyPlayback(partyId, { action, currentTime: resolvedTime, channelId: activeChannelId() })
}

const sendPlaybackProgress = async (payload: { currentTime: number, duration: number }) => {
  if (applyingRemotePlayback || !canControlPlayback.value) return
  const now = Date.now()
  if (now - lastPlaybackProgressSyncAt < 5000) return
  lastPlaybackProgressSyncAt = now
  await postWatchPartyPlayback(partyId, { action: 'progress', currentTime: payload.currentTime, channelId: activeChannelId() })
}

const addQueueVideo = async (videoId: string) => {
  if (!videoId) return
  queueError.value = ''
  try {
    await addWatchPartyQueueItem(partyId, videoId)
    await refreshParty(false)
  } catch (err: any) {
    queueError.value = err?.response?.data?.error || err?.message || 'Failed to add video'
  }
}

const changeSyncMode = async (mode: 'host-only' | 'open') => {
  await setWatchPartySyncMode(partyId, mode)
  await refreshParty(false)
}

const playQueueItem = async (itemId: string) => {
  lastPlaybackProgressSyncAt = Date.now()
  await playWatchPartyQueueItem(partyId, itemId)
  await refreshParty(false)
  await nextTick()
  applyRemotePlayback('play', 0)
}

const playNextQueueItem = async () => {
  if (!isHost.value || queueItems.value.length === 0) return
  await playQueueItem(queueItems.value[0].id)
}

const removeQueueItem = async (itemId: string) => {
  await removeWatchPartyQueueItem(partyId, itemId)
  await refreshParty(false)
}

const moveQueueItem = async (index: number, direction: number) => {
  const next = [...queueItems.value]
  const target = index + direction
  if (target < 0 || target >= next.length) return
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  queueItems.value = next
  await reorderWatchPartyQueue(partyId, next.map((entry) => entry.id))
  await refreshParty(false)
}

const makeHost = async (userId: string) => {
  await transferWatchPartyHost(partyId, userId)
  await refreshParty(false)
}

const toggleSuggest = async (person: any) => {
  await setWatchPartySuggestPermission(partyId, person.user_id, !person.can_suggest)
  await refreshParty(false)
}

const copyPartyLink = async () => {
  const url = partyShareUrl.value
  await navigator.clipboard?.writeText(url)
  linkCopied.value = true
  showShareLinkPreview.value = true
  setTimeout(() => {
    linkCopied.value = false
  }, 1800)
  setTimeout(() => {
    showShareLinkPreview.value = false
  }, 5000)
}

const leaveParty = async () => {
  if (isHost.value && partyData.value?.party?.media_type && partyData.value?.party?.media_id) {
    const shouldSave = typeof window !== 'undefined'
      ? window.confirm('Save watch party progress for another time?')
      : false
    if (shouldSave) {
      try {
        const state = videoPlayerRef.value?.getPlaybackState?.()
        if (state) {
          await postWatchPartyPlayback(partyId, {
            action: state.paused ? 'pause' : 'progress',
            currentTime: Number(state.currentTime || 0),
            channelId: activeChannelId(),
          })
        }
        await saveWatchPartyProgress(partyId)
      } catch (err) {
        console.error('Failed to save watch party progress:', err)
      }
    }
  }
  await leaveWatchParty(partyId)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('giltube:active-watch-party')
    window.dispatchEvent(new Event('giltube:watch-party-updated'))
  }
  router.push('/')
}

onMounted(async () => {
  isLoggedIn.value = !!currentUserId.value
  await refreshParty()
  if (typeof window !== 'undefined') {
    hasJoined.value = isLoggedIn.value && route.query.room === '1'
  }
  if (hasJoined.value && isLoggedIn.value && !partyEnded.value) {
    await joinPartyFromInvite()
  }
})

watch(
  () => [videoSrc.value, hasJoined.value, partyData.value?.video?.id],
  ([src, joined]) => {
    if (!src || !joined || inviteMode.value) return
    schedulePlaybackRestore()
  }
)

onBeforeUnmount(() => {
  events?.close()
  if (overlayTimer) clearTimeout(overlayTimer)
  clearPlaybackRestoreTimer()
})
</script>
