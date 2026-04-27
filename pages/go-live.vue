<template>
  <div class="min-h-screen bg-zinc-950 text-white p-6">
    <div class="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 class="text-4xl font-bold">Go Live (BETA, MAY HAVE BUGS)</h1>
        <p class="text-gray-400 mt-2">Manage your stream key and mark your channel as live.</p>
      </div>

      <div v-if="!isLoggedIn" class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p class="text-gray-300">Please sign in first.</p>
        <NuxtLink to="/login" class="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
          Sign in
        </NuxtLink>
      </div>

      <div v-else class="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <label class="block text-sm text-gray-300">Channel</label>
        <select
          v-model="selectedChannelId"
          class="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option disabled value="">Select channel</option>
          <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
        </select>

        <div v-if="selectedChannelId" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-300 mb-2">Live Title</label>
            <input
              v-model="title"
              type="text"
              maxlength="120"
              class="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-300 mb-2">Description</label>
            <textarea
              v-model="description"
              rows="3"
              maxlength="400"
              class="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div class="bg-zinc-800 rounded p-3 border border-zinc-700">
              <p class="text-xs text-gray-400 uppercase tracking-wide">Status</p>
              <p class="mt-1 font-semibold" :class="live?.status === 'live' ? 'text-green-400' : 'text-gray-300'">
                {{ live?.status === 'live' ? 'Live' : 'Offline' }}
              </p>
            </div>
            <div class="bg-zinc-800 rounded p-3 border border-zinc-700">
              <p class="text-xs text-gray-400 uppercase tracking-wide">Started</p>
              <p class="mt-1 text-sm text-gray-200">{{ live?.started_at ? formatDate(live.started_at) : 'Not live' }}</p>
            </div>
          </div>

          <div class="bg-zinc-800 rounded p-3 border border-zinc-700 space-y-3">
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wide">Public Ingest URL</p>
              <p class="text-sm break-all">{{ live?.ingest_url || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wide">Stream Key</p>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <input
                  :type="showStreamKey ? 'text' : 'password'"
                  :value="live?.stream_key || ''"
                  readonly
                  class="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-sm"
                />
                <button @click="showStreamKey = !showStreamKey" class="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition">
                  {{ showStreamKey ? 'Hide' : 'Show' }}
                </button>
                <button @click="copyValue(live?.stream_key || '')" class="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition">
                  Copy
                </button>
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wide">Playback URL (for external players (VLC))</p>
              <div class="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  :value="live?.playback_url || ''"
                  readonly
                  class="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-sm"
                />
                <button @click="copyValue(live?.playback_url || '')" class="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition">
                  Copy
                </button>
              </div>
            </div>
            <div v-if="live?.ingest_url_local" class="pt-2 border-t border-zinc-700">
              <p class="text-xs text-gray-400 uppercase tracking-wide">Local Ingest URL (FORADMIN)</p>
              <div class="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  :value="live?.ingest_url_local || ''"
                  readonly
                  class="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-sm"
                />
                <button @click="copyValue(live?.ingest_url_local || '')" class="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition">
                  Copy
                </button>
              </div>
            </div>
            <div v-if="live?.ingest_url_lan" class="pt-2 border-t border-zinc-700">
              <p class="text-xs text-gray-400 uppercase tracking-wide">LAN Ingest URL</p>
              <div class="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  :value="live?.ingest_url_lan || ''"
                  readonly
                  class="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-sm"
                />
                <button @click="copyValue(live?.ingest_url_lan || '')" class="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition">
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div class="bg-zinc-800 rounded p-3 border border-zinc-700 space-y-3">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Real Publisher Presence</p>
                <p class="text-sm text-gray-300">When enabled, live status comes from MediaMTX ingest presence.</p>
              </div>
              <label class="inline-flex items-center gap-2">
                <input
                  v-model="publisherPresenceEnabled"
                  type="checkbox"
                  :disabled="savingPublisherPresence"
                  @change="updatePublisherPresence"
                  class="h-4 w-4 accent-red-600"
                />
                <span class="text-sm">Enabled</span>
              </label>
            </div>
            <p class="text-xs" :class="live?.publisher_detected_live ? 'text-green-400' : 'text-gray-400'">
              Detected by publisher presence: {{ live?.publisher_detected_live ? 'Live' : 'Offline' }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              @click="saveSettings"
              :disabled="savingSettings || !selectedChannelId"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
            >
              {{ savingSettings ? 'Saving...' : 'Save Settings' }}
            </button>
            <button
              @click="startStream"
              :disabled="saving || !selectedChannelId"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition disabled:opacity-50"
            >
              {{ saving && pendingAction === 'start' ? 'Starting...' : 'Go Live' }}
            </button>
            <button
              @click="stopStream"
              :disabled="saving || !selectedChannelId"
              class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition disabled:opacity-50"
            >
              {{ saving && pendingAction === 'stop' ? 'Stopping...' : 'End Stream' }}
            </button>
            <button
              @click="rotateKey"
              :disabled="saving || !selectedChannelId"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50"
            >
              {{ saving && pendingAction === 'rotate' ? 'Rotating...' : 'Rotate Stream Key' }}
            </button>
            <NuxtLink
              v-if="selectedChannelId"
              :to="`/live/${selectedChannelId}`"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              Open Live Watch Page
            </NuxtLink>
            <button
              v-if="selectedChannelId"
              @click="openChatPopup"
              class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
            >
              Pop Out Live Chat
            </button>
            <NuxtLink
              v-if="selectedChannelId"
              :to="chatOnlyPath"
              target="_blank"
              rel="noopener"
              class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
            >
              Open Live Chat Tab
            </NuxtLink>
          </div>
        </div>
      </div>

      <p v-if="message" :class="error ? 'text-red-400' : 'text-green-400'">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  getMyLiveStream,
  rotateMyLiveStreamKey,
  setMyPublisherPresence,
  saveMyLiveStreamSettings,
  startMyLiveStream,
  stopMyLiveStream,
  type LiveStreamState
} from '~/app/service/live'
import { useMetaTags } from '~/app/composables/useMetaTags'

useMetaTags({
  title: 'Go Live - GilTube',
  description: 'Manage live stream settings for your channel.'
})

type LocalChannel = {
  id: string
  name: string
}

const isLoggedIn = ref(false)
const channels = ref<LocalChannel[]>([])
const selectedChannelId = ref('')
const live = ref<LiveStreamState | null>(null)
const title = ref('Live Stream')
const description = ref('')
const showStreamKey = ref(false)
const saving = ref(false)
const pendingAction = ref<'start' | 'stop' | 'rotate' | ''>('')
const message = ref('')
const error = ref(false)
const publisherPresenceEnabled = ref(false)
const savingPublisherPresence = ref(false)
const savingSettings = ref(false)

const chatOnlyPath = computed(() => {
  if (!selectedChannelId.value) {
    return '/live-chat'
  }
  return `/live-chat/${encodeURIComponent(selectedChannelId.value)}`
})

const loadChannels = () => {
  isLoggedIn.value = !!localStorage.getItem('user_id')
  if (!isLoggedIn.value) return

  const stored = localStorage.getItem('user_channels')
  if (!stored) return

  try {
    const parsed = JSON.parse(stored)
    channels.value = Array.isArray(parsed) ? parsed : []
  } catch {
    channels.value = []
  }

  if (channels.value.length > 0 && !selectedChannelId.value) {
    const firstChannel = channels.value[0]
    if (firstChannel) {
      selectedChannelId.value = firstChannel.id
    }
  }
}

const loadLiveState = async () => {
  if (!selectedChannelId.value) return
  message.value = ''

  try {
    live.value = await getMyLiveStream(selectedChannelId.value)
    title.value = live.value.title || 'Live Stream'
    description.value = live.value.description || ''
    publisherPresenceEnabled.value = !!live.value.use_publisher_presence
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || 'Failed to load live stream settings'
  }
}

const withAction = async (action: 'start' | 'stop' | 'rotate', fn: () => Promise<void>) => {
  saving.value = true
  pendingAction.value = action
  error.value = false
  message.value = ''
  try {
    await fn()
    await loadLiveState()
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || 'Request failed'
  } finally {
    saving.value = false
    pendingAction.value = ''
  }
}

const startStream = async () => {
  await withAction('start', async () => {
    await startMyLiveStream(selectedChannelId.value, title.value, description.value)
    message.value = 'Stream is marked live.'
  })
}

const stopStream = async () => {
  await withAction('stop', async () => {
    await stopMyLiveStream(selectedChannelId.value)
    message.value = 'Stream is marked offline.'
  })
}

const rotateKey = async () => {
  await withAction('rotate', async () => {
    await rotateMyLiveStreamKey(selectedChannelId.value)
    message.value = 'Stream key rotated successfully.'
  })
}

const saveSettings = async () => {
  if (!selectedChannelId.value) return
  savingSettings.value = true
  error.value = false
  message.value = ''
  try {
    await saveMyLiveStreamSettings(selectedChannelId.value, title.value, description.value)
    await loadLiveState()
    message.value = 'Live stream settings saved.'
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || 'Failed to save live settings'
  } finally {
    savingSettings.value = false
  }
}

const updatePublisherPresence = async () => {
  if (!selectedChannelId.value) return
  savingPublisherPresence.value = true
  try {
    await setMyPublisherPresence(selectedChannelId.value, publisherPresenceEnabled.value)
    await loadLiveState()
    error.value = false
    message.value = publisherPresenceEnabled.value
      ? 'Publisher presence enabled. Live status now follows real ingest presence.'
      : 'Publisher presence disabled. Manual live status controls are active.'
  } catch (err: any) {
    error.value = true
    message.value = err?.response?.data?.error || 'Failed to update publisher presence setting'
  } finally {
    savingPublisherPresence.value = false
  }
}

const copyValue = async (value: string) => {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    error.value = false
    message.value = 'Copied to clipboard.'
  } catch {
    error.value = true
    message.value = 'Failed to copy to clipboard.'
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString()
}

const openChatPopup = () => {
  if (!selectedChannelId.value) {
    return
  }

  const popup = window.open(
    chatOnlyPath.value,
    'giltube-live-chat',
    'popup=yes,width=420,height=760,resizable=yes,scrollbars=yes'
  )

  if (!popup) {
    window.open(chatOnlyPath.value, '_blank', 'noopener')
  }
}

watch(selectedChannelId, async (channelID) => {
  if (!channelID) return
  await loadLiveState()
})

onMounted(async () => {
  loadChannels()
  if (selectedChannelId.value) {
    await loadLiveState()
  }
})
</script>
