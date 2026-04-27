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
                            {{ isLive ? 'LIVE' : 'OFFLINE' }}
                        </span>
                        <h1 class="text-2xl font-bold break-words">{{ liveTitle }}</h1>
                    </div>

                    <p class="text-sm text-gray-400 break-words">{{ liveDescription }}</p>

                    <NuxtLink :to="`/channel/${channelId}`"
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
                </div>
            </section>

            <aside class="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col min-h-[520px] max-h-[80vh]">
                <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <p class="font-semibold">Live Chat</p>
                        <p class="text-xs text-gray-400">Comments are disabled on live pages.</p>
                    </div>
                    <button @click="refreshChat"
                        class="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition">
                        Refresh
                    </button>
                </div>

                <div ref="chatListRef" class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div v-if="chatMessages.length === 0" class="text-sm text-gray-400">
                        No messages yet.
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
                        <label class="text-xs text-gray-400">Chat as</label>
                        <select v-model="selectedChatChannelId"
                            class="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm">
                            <option v-for="ch in availableChannels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
                        </select>
                    </div>

                    <div v-if="!isLive"
                        class="text-xs text-yellow-300 bg-yellow-900/30 border border-yellow-700 rounded p-2">
                        Stream is offline. Chat posting is disabled until live.
                    </div>

                    <div v-if="!isLoggedIn" class="text-xs text-gray-300 bg-zinc-800 rounded p-2">
                        Sign in to join live chat.
                    </div>

                    <div v-else-if="availableChannels.length === 0"
                        class="text-xs text-gray-300 bg-zinc-800 rounded p-2">
                        Create a channel to send chat messages.
                    </div>

                    <div class="flex gap-2">
                        <input v-model="chatInput" type="text" maxlength="500" placeholder="Say something..."
                            @keydown.enter="sendChatMessage"
                            class="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        <button @click="sendChatMessage" :disabled="chatSending || !canSendChat"
                            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm transition">
                            {{ chatSending ? '...' : 'Send' }}
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



type LocalChannel = {
    id: string
    name: string
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

let chatPollTimer: ReturnType<typeof setInterval> | null = null

const isLive = computed(() => !!live.value?.is_live || live.value?.status === 'live')
const playbackUrl = computed(() => live.value?.playback_url || '')
const liveTitle = computed(() => live.value?.title || 'Live Stream')
const liveDescription = computed(() => live.value?.description || 'No description')
const channelName = computed(() => live.value?.channel?.name || 'Channel')
const channelAvatar = computed(() => live.value?.channel?.avatar_url || '')
const channelVerified = computed(() => !!live.value?.channel?.verified)
useMetaTags({
    title: liveTitle.value+' - GilTube',
    description: 'Watch live streams on GilTube.'
})
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
        chatError.value = err?.response?.data?.error || 'Failed to send message'
    } finally {
        chatSending.value = false
    }
}

const formatRelativeTime = (value: string) => {
    const now = Date.now()
    const ts = new Date(value).getTime()
    const diffSec = Math.max(0, Math.floor((now - ts) / 1000))
    if (diffSec < 10) return 'now'
    if (diffSec < 60) return `${diffSec}s`
    const mins = Math.floor(diffSec / 60)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

onMounted(async () => {
    syncLocalAuthState()

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
            }, 4000)
        },
        { immediate: true }
    )
})

onUnmounted(() => {
    if (chatPollTimer) {
        clearInterval(chatPollTimer)
    }
})
</script>
