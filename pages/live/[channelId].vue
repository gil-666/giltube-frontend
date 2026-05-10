<template>
    <div class="min-h-screen bg-black text-white p-6">
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 max-w-7xl mx-auto">
            <section class="space-y-5 min-w-0">
                <div class="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                    <VideoPlayer v-if="playbackUrl" :src="playbackUrl" :status="isLive ? 'ready' : 'processing'" />
                    
                </div>

                <div class="space-y-3">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span
                            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                            :class="isLive ? 'bg-red-900 text-red-200 border-red-700' : 'bg-zinc-800 text-zinc-300 border-zinc-700'">
                            <span class="w-2 h-2 rounded-full"
                                :class="isLive ? 'bg-red-400 animate-pulse' : 'bg-zinc-500'" />
                            {{ isLive ? t('live.live') : t('live.offline') }}
                        </span>
                        <h1 class="text-2xl font-bold break-words">{{ liveTitle }}</h1>
                    </div>

                    <div v-if="isLive" class="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                        <div class="flex items-center justify-between gap-3 flex-wrap">
                            <p class="text-sm text-zinc-200 font-medium">
                                {{ t('live.watching') }} {{ viewers.length + anonymousCount }}
                            </p>
                            <p v-if="anonymousCount > 0" class="text-xs text-zinc-400">
                                {{ anonymousCount }} {{ anonymousCount === 1 ? t('live.anonymousUser') : t('live.anonymousUsers') }}
                            </p>
                        </div>

                        <div v-if="viewers.length > 0" class="mt-3 flex flex-wrap gap-2">
                            <div v-for="viewer in viewers" :key="viewer.id"
                                class="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-100">
                                <img v-if="viewer.avatarUrl" :src="viewer.avatarUrl" :alt="viewer.name || t('live.viewerFallback')"
                                    class="h-5 w-5 rounded-full object-cover" />
                                <div v-else
                                    class="h-5 w-5 rounded-full bg-zinc-600 text-[10px] font-bold flex items-center justify-center">
                                    {{ (viewer.name || '?').charAt(0).toUpperCase() }}
                                </div>
                                <span>{{ viewer.name || t('live.viewerFallback') }}</span>
                            </div>
                        </div>
                    </div>

                    <p class="text-sm text-gray-400 break-words">{{ liveDescription }}</p>

                    <div class="flex items-center gap-3 flex-wrap">
                        <NuxtLink :to="localePath(`/channel/${channelId}`)"
                            class="inline-flex items-center gap-3 p-2 rounded hover:bg-zinc-900 transition">
                            <div
                                class="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden text-xs font-bold">
                                <img v-if="channelAvatar && !channelAvatarFailed" :src="channelAvatar" :alt="channelName"
                                    class="w-full h-full object-cover" @error="channelAvatarFailed = true" />
                                <span v-else>{{ channelName.charAt(0).toUpperCase() }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <p class="font-semibold">{{ channelName }}</p>
                                <VerifiedBadge :verified="channelVerified" size="sm" />
                            </div>
                        </NuxtLink>

                        <button
                            @click="shareStream"
                            class="flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium bg-zinc-700 hover:bg-zinc-600"
                            title="Share"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 6l-4-4-4 4"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v13"/>
                            </svg>
                            <span>{{ t('live.share') }}</span>
                        </button>
                    </div>
                </div>
            </section>

            <aside class="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col min-h-[520px] max-h-[80vh]">
                <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <p class="font-semibold">{{ t('live.liveChat') }}</p>
                        <p class="text-xs text-gray-400">{{ t('live.chatDisabled') }}</p>
                    </div>
                    <button @click="refreshChat"
                        class="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition">
                        {{ t('live.refresh') }}
                    </button>
                </div>

                <div ref="chatListRef" class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div v-if="chatMessages.length === 0" class="text-sm text-gray-400">
                        {{ t('live.noMessages') }}
                    </div>

                    <div v-for="msg in chatMessages" :key="msg.id" class="flex gap-2 items-start">
                        <div
                            class="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden text-[10px] font-bold flex-shrink-0">
                            <img v-if="msg.channel.avatar_url" :src="msg.channel.avatar_url" :alt="msg.channel.name"
                                class="w-full h-full object-cover" />
                            <span v-else>{{ msg.channel.name.charAt(0).toUpperCase() }}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-1 text-xs">
                                <span class="font-semibold text-gray-200 truncate">{{ msg.channel.name }}</span>
                                <VerifiedBadge :verified="msg.channel.verified" size="sm" />
                                <span class="text-gray-500">{{ formatRelativeTime(msg.created_at) }}</span>
                            </div>
                            <p class="text-sm text-gray-100 break-words">{{ msg.message }}</p>
                        </div>
                    </div>
                </div>

                <div class="p-3 border-t border-zinc-800 space-y-2">
                    <div v-if="isLoggedIn && availableChannels.length > 0" class="space-y-1">
                        <label class="text-xs text-gray-400">{{ t('live.chatAs') }}</label>
                        <select v-model="selectedChatChannelId"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm">
                            <option v-for="ch in availableChannels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
                        </select>
                    </div>

                    <div v-if="!isLive"
                        class="text-xs text-yellow-300 bg-yellow-900/30 border border-yellow-700 rounded p-2">
                        {{ t('live.streamOffline') }}
                    </div>

                    <div v-if="!isLoggedIn" class="text-xs text-gray-300 bg-zinc-800 rounded p-2">
                        {{ t('live.signInChat') }}
                    </div>

                    <div v-else-if="availableChannels.length === 0"
                        class="text-xs text-gray-300 bg-zinc-800 rounded p-2">
                        {{ t('live.createChannelChat') }}
                    </div>

                    <div class="flex gap-2">
                        <input v-model="chatInput" type="text" maxlength="500" :placeholder="t('live.saySomething')"
                            @keydown.enter="sendChatMessage"
                            class="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        <button @click="sendChatMessage" :disabled="chatSending || !canSendChat"
                            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm transition">
                            {{ chatSending ? t('live.sending') : t('live.send') }}
                        </button>
                    </div>

                    <p v-if="chatError" class="text-xs text-red-400">{{ chatError }}</p>
                </div>
            </aside>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import VideoPlayer from '~/app/components/videoplayer/VideoPlayer.vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import {
    getChannelLiveStatus,
    getLiveChatMessages,
    postLiveChatMessage,
    type LiveChatMessage,
    type LiveStreamState
} from '~/app/service/live'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { useFetch } from '#app'

const { t } = useI18n()
const localePath = useLocalePath()


type LocalChannel = {
    id: string
    name: string
    avatar_url?: string
}

const route = useRoute()
const channelId = computed(() => {
    const raw = route.params.channelId
    if (Array.isArray(raw)) {
        return raw[0] ?? ''
    }
    return typeof raw === 'string' ? raw : ''
})

const isLoggedIn = ref(false)
const availableChannels = ref<LocalChannel[]>([])
const selectedChatChannelId = ref('')
const live = ref<LiveStreamState | null>(null)
const chatMessages = ref<LiveChatMessage[]>([])
const chatInput = ref('')
const chatSending = ref(false)
const chatError = ref('')
const channelAvatarFailed = ref(false)
const chatListRef = ref<HTMLElement | null>(null)
const shareCopied = ref(false)

// Fetch live stream data during SSR
const { data: fetchedLive } = useFetch(
    () => `/api/v1/live/channels/${encodeURIComponent(channelId.value)}`,
    {
        watch: [channelId],
        transform: (res: any) => res as LiveStreamState
    }
)

// Sync fetched data to live ref
watch(fetchedLive, (newData) => {
    if (newData) {
        live.value = newData
    }
})

// Update meta tags whenever live data is available
watch(
    live,
    (newLive) => {
        const title = (newLive?.title || 'GilTube Live') + ' - GilTube'
        const description = newLive?.description || 'Watch live streams on GilTube.'
        const image = newLive?.thumbnail_url || undefined
        
        useMetaTags({
            title,
            description,
            image
        })
    },
    { immediate: true }
)

const shareButtonText = computed(() => shareCopied.value ? t('live.shareCopied') : t('live.share'))

type PresenceViewer = {
    id: string
    name?: string
    avatarUrl?: string
    anonymous?: boolean
}

const viewers = ref<PresenceViewer[]>([])
const anonymousCount = ref(0)
const presenceViewerId = ref('')
const anonymousViewerIds = new Set<string>()
let presenceSSE: EventSource | null = null
let presenceHeartbeatTimer: ReturnType<typeof setInterval> | null = null
let presenceReconnectTimer: ReturnType<typeof setTimeout> | null = null

let chatPollTimer: ReturnType<typeof setInterval> | null = null

const isLive = computed(() => !!live.value?.is_live || live.value?.status === 'live')
const playbackUrl = computed(() => live.value?.playback_url || '')
const liveTitle = computed(() => live.value?.title || t('goLive.defaultTitle'))
const liveDescription = computed(() => live.value?.description || t('channelPage.noDescription'))
const channelName = computed(() => live.value?.channel?.name || t('app.myChannel'))
const channelAvatar = computed(() => live.value?.channel?.avatar_url || '')
const channelVerified = computed(() => !!live.value?.channel?.verified)
const liveVideoId = computed(() => live.value?.id || channelId.value || '')

// Watch for live stream data and update meta tags with actual values
watch(
    live,
    (newLive) => {
        const title = (newLive?.title || 'GilTube Live') + ' - GilTube'
        const description = newLive?.description || 'Watch live streams on GilTube.'
        const image = newLive?.thumbnail_url || undefined
        
        useMetaTags({
            title,
            description,
            image
        })
    },
    { immediate: true }
)
const canSendChat = computed(() => {
    return (
        isLoggedIn.value &&
        isLive.value &&
        selectedChatChannelId.value !== '' &&
        chatInput.value.trim().length > 0
    )
})

const syncLocalAuthState = () => {
    isLoggedIn.value = !!localStorage.getItem('user_id')
    const storedChannels = localStorage.getItem('user_channels')
    if (!storedChannels) {
        availableChannels.value = []
        selectedChatChannelId.value = ''
        return
    }

    try {
        const parsed = JSON.parse(storedChannels)
        availableChannels.value = Array.isArray(parsed) ? parsed : []
    } catch {
        availableChannels.value = []
    }

    if (!selectedChatChannelId.value && availableChannels.value.length > 0) {
        const firstChannel = availableChannels.value[0]
        if (firstChannel) {
            selectedChatChannelId.value = firstChannel.id
        }
    }
}

const makePresenceViewerId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`
}

const currentPresencePayload = () => {
    const activeChannel = availableChannels.value.find(ch => ch.id === selectedChatChannelId.value)
    const isAnonymous = !isLoggedIn.value || !activeChannel
    return {
        viewer_id: presenceViewerId.value,
        name: activeChannel?.name || '',
        avatar_url: activeChannel?.avatar_url || '',
        anonymous: isAnonymous,
    }
}

const clearPresenceState = () => {
    viewers.value = []
    anonymousCount.value = 0
    anonymousViewerIds.clear()
}

const disconnectPresenceStream = () => {
    if (presenceReconnectTimer) {
        clearTimeout(presenceReconnectTimer)
        presenceReconnectTimer = null
    }
    if (presenceSSE) {
        try {
            presenceSSE.close()
        } catch {
            // ignore
        }
        presenceSSE = null
    }
}

const leavePresenceBestEffort = () => {
    if (!liveVideoId.value || !presenceViewerId.value) return

    const url = `/api/v1/live/${encodeURIComponent(liveVideoId.value)}/presence?viewer_id=${encodeURIComponent(presenceViewerId.value)}`

    try {
        void fetch(url, {
            method: 'DELETE',
            keepalive: true,
        })
    } catch {
        // ignore
    }
}

const joinPresence = async () => {
    if (!isLive.value || !liveVideoId.value || !presenceViewerId.value) return

    try {
        const res = await fetch(`/api/v1/live/${encodeURIComponent(liveVideoId.value)}/presence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentPresencePayload()),
        })
        if (!res.ok) {
            console.warn('Presence join failed:', res.status)
        }
    } catch {
        // ignore network errors
    }
}

const leavePresence = async () => {
    if (!liveVideoId.value || !presenceViewerId.value) return
    try {
        await fetch(`/api/v1/live/${encodeURIComponent(liveVideoId.value)}/presence?viewer_id=${encodeURIComponent(presenceViewerId.value)}`, {
            method: 'DELETE',
            keepalive: true,
        })
    } catch {
        // ignore network errors
    }
}

const startPresenceHeartbeat = () => {
    if (presenceHeartbeatTimer) {
        clearInterval(presenceHeartbeatTimer)
        presenceHeartbeatTimer = null
    }

    joinPresence()
    presenceHeartbeatTimer = setInterval(() => {
        joinPresence()
    }, 30000)
}

const stopPresenceHeartbeat = () => {
    if (presenceHeartbeatTimer) {
        clearInterval(presenceHeartbeatTimer)
        presenceHeartbeatTimer = null
    }
}

const normalizeViewer = (raw: any): PresenceViewer | null => {
    if (!raw) return null
    const id = raw.id || raw.ID || raw.viewer_id
    if (!id) return null
    return {
        id,
        name: raw.name || raw.Name || '',
        avatarUrl: raw.avatar_url || raw.avatarUrl || raw.AvatarURL || '',
        anonymous: !!(raw.anonymous || raw.Anonymous),
    }
}

const connectPresenceStream = () => {
    if (!isLive.value || !liveVideoId.value) return
    disconnectPresenceStream()

    presenceSSE = new EventSource(`/api/v1/live/${encodeURIComponent(liveVideoId.value)}/presence/stream`)
    presenceSSE.onmessage = (evt) => {
        try {
            const data = JSON.parse(evt.data)
            if (data.type === 'init') {
                const rawViewers = Array.isArray(data.viewers) ? data.viewers : []
                viewers.value = rawViewers.map((v: any) => normalizeViewer(v)).filter(Boolean) as PresenceViewer[]
                anonymousCount.value = data.anonymous_count || data.anonymousCount || 0
                anonymousViewerIds.clear()
                return
            }

            const maybeViewer = normalizeViewer(data.viewer || data.Viewer)
            if (!maybeViewer) return

            if (data.type === 'join') {
                if (maybeViewer.anonymous) {
                    if (!anonymousViewerIds.has(maybeViewer.id)) {
                        anonymousViewerIds.add(maybeViewer.id)
                        anonymousCount.value += 1
                    }
                } else {
                    viewers.value = [maybeViewer, ...viewers.value.filter(v => v.id !== maybeViewer.id)]
                }
                return
            }

            if (data.type === 'leave') {
                const idx = viewers.value.findIndex(v => v.id === maybeViewer.id)
                if (idx !== -1) {
                    viewers.value.splice(idx, 1)
                } else {
                    if (anonymousViewerIds.has(maybeViewer.id)) {
                        anonymousViewerIds.delete(maybeViewer.id)
                        anonymousCount.value = Math.max(0, anonymousCount.value - 1)
                    } else if (anonymousCount.value > 0) {
                        anonymousCount.value = Math.max(0, anonymousCount.value - 1)
                    }
                }
            }
        } catch {
            // ignore bad events
        }
    }

    presenceSSE.onerror = () => {
        disconnectPresenceStream()
        if (!isLive.value || !liveVideoId.value) return
        presenceReconnectTimer = setTimeout(() => {
            connectPresenceStream()
        }, 3000)
    }
}

const startPresence = () => {
    if (!presenceViewerId.value) {
        presenceViewerId.value = makePresenceViewerId()
    }
    startPresenceHeartbeat()
    connectPresenceStream()
}

const stopPresence = async () => {
    stopPresenceHeartbeat()
    disconnectPresenceStream()
    await leavePresence()
    clearPresenceState()
}

const loadLiveState = async () => {
    if (!channelId.value) {
        live.value = null
        return
    }

    try {
        live.value = await getChannelLiveStatus(channelId.value)
    } catch (err: any) {
        console.error('Failed to load live state:', err)
    }
}

const scrollChatToBottom = async () => {
    await nextTick()
    if (chatListRef.value) {
        chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    }
}

const refreshChat = async () => {
    if (!channelId.value) {
        chatMessages.value = []
        return
    }

    try {
        const messages = await getLiveChatMessages(channelId.value, 100)
        const prevCount = chatMessages.value.length
        chatMessages.value = messages
        if (messages.length > prevCount) {
            await scrollChatToBottom()
        }
    } catch (err: any) {
        console.error('Failed to refresh chat:', err)
    }
}

const sendChatMessage = async () => {
    chatError.value = ''
    if (!canSendChat.value) return

    chatSending.value = true
    try {
        await postLiveChatMessage(channelId.value, selectedChatChannelId.value, chatInput.value.trim())
        chatInput.value = ''
        await refreshChat()
        await scrollChatToBottom()
    } catch (err: any) {
        chatError.value = err?.response?.data?.error || t('live.sendError')
    } finally {
        chatSending.value = false
    }
}

const formatRelativeTime = (value: string) => {
    const now = Date.now()
    const ts = new Date(value).getTime()
    const diffSec = Math.max(0, Math.floor((now - ts) / 1000))
    if (diffSec < 10) return t('live.now')
    if (diffSec < 60) return `${diffSec}s`
    const mins = Math.floor(diffSec / 60)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

const shareStream = async () => {
    try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://giltube.gilservers.com'
        const sharePath = localePath(`/live/${channelId.value}`)
        const url = `${origin}${sharePath}`
        if (process.client && navigator.share) {
            await navigator.share({ title: liveTitle.value || 'GilTube Live', url })
        } else if (process.client && navigator.clipboard) {
            await navigator.clipboard.writeText(url)
            shareCopied.value = true
            setTimeout(() => (shareCopied.value = false), 2000)
        }
    } catch (err) {
        console.error('Share failed:', err)
    }
}

onMounted(async () => {
    syncLocalAuthState()

    window.addEventListener('pagehide', leavePresenceBestEffort)
    window.addEventListener('beforeunload', leavePresenceBestEffort)

    watch(
        channelId,
        async (newChannelId) => {
            if (!newChannelId) {
                live.value = null
                chatMessages.value = []
                if (chatPollTimer) {
                    clearInterval(chatPollTimer)
                    chatPollTimer = null
                }
                return
            }

            channelAvatarFailed.value = false
            await loadLiveState()
            await refreshChat()
            await scrollChatToBottom()

            if (chatPollTimer) {
                clearInterval(chatPollTimer)
            }
            chatPollTimer = setInterval(async () => {
                await loadLiveState()
                await refreshChat()
            }, 2000)
        },
        { immediate: true }
    )
})

watch(
    [isLive, liveVideoId, selectedChatChannelId],
    async ([liveNow, videoIdNow], oldValue) => {
        const prevLive = oldValue?.[0]
        const prevVideoId = oldValue?.[1]
        if (!videoIdNow || !liveNow) {
            if (prevLive || prevVideoId) {
                await stopPresence()
            }
            return
        }

        if (!prevVideoId || prevVideoId !== videoIdNow || !prevLive) {
            await stopPresence()
            startPresence()
            return
        }

        joinPresence()
    },
    { immediate: true }
)

onUnmounted(() => {
    window.removeEventListener('pagehide', leavePresenceBestEffort)
    window.removeEventListener('beforeunload', leavePresenceBestEffort)
    if (chatPollTimer) {
        clearInterval(chatPollTimer)
    }
    stopPresence()
})
</script>
