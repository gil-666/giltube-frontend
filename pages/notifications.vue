<template>
  <div class="min-h-screen bg-zinc-950 text-white px-4 md:px-8 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold">{{ t('notifications.title') }}</h1>
          <p class="text-sm text-gray-400 mt-1">{{ t('notifications.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="refresh"
            class="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition"
          >
            {{ t('notifications.refresh') }}
          </button>
          <button
            @click="markAllRead"
            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
          >
            {{ t('notifications.markAllRead') }}
          </button>
        </div>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p class="font-semibold text-sm">{{ t('notifications.pushTitle') }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ t('notifications.pushSubtitle') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!isPushEnabled"
              @click="enablePush"
              :disabled="pushBusy || !pushConfig.enabled || !pushConfig.send_enabled"
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm transition"
            >
              {{ pushBusy ? t('notifications.working') : t('notifications.enablePush') }}
            </button>
            <button
              v-else
              @click="disablePush"
              :disabled="pushBusy"
              class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm transition"
            >
              {{ pushBusy ? t('notifications.working') : t('notifications.disablePush') }}
            </button>
          </div>
        </div>
        <p v-if="!pushConfig.enabled" class="text-xs text-amber-300 mt-3">{{ t('notifications.pushDisabledByConfig') }}</p>
        <p v-else-if="!pushConfig.send_enabled" class="text-xs text-amber-300 mt-3">{{ t('notifications.pushPaused') }}</p>
        <p v-if="pushMessage" class="text-xs text-gray-300 mt-3">{{ pushMessage }}</p>
      </div>

      <div class="flex items-center gap-2 mb-4">
        <button
          @click="unreadOnly = false; reloadFromStart()"
          :class="[
            'px-3 py-1.5 rounded text-sm transition',
            !unreadOnly ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
          ]"
        >
          {{ t('notifications.all') }}
        </button>
        <button
          @click="unreadOnly = true; reloadFromStart()"
          :class="[
            'px-3 py-1.5 rounded text-sm transition',
            unreadOnly ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
          ]"
        >
          {{ t('notifications.unreadOnly') }}
        </button>
      </div>

      <div v-if="loading" class="py-12 text-center text-gray-400">{{ t('notifications.loading') }}</div>
      <div v-else-if="items.length === 0" class="py-12 text-center text-gray-500 border border-zinc-800 rounded-lg">
        {{ t('notifications.empty') }}
      </div>
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="localizedItemUrl(item.url)"
          class="block border rounded-lg transition"
          :class="item.is_read ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-900 border-blue-700 hover:border-blue-500'"
          @click="markRead(item)"
        >
          <div class="p-4 flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 min-w-0">
              <img
                v-if="item.actor_channel?.avatar_url"
                :src="item.actor_channel.avatar_url"
                :alt="item.actor_channel?.name || t('notifications.channelAvatar')"
                class="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
              />
              <div
                v-else
                class="w-10 h-10 rounded-full bg-zinc-700 text-gray-200 border border-zinc-600 shrink-0 flex items-center justify-center text-sm font-semibold"
              >
                {{ actorInitial(item) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm" :class="item.is_read ? 'text-gray-300' : 'text-white font-semibold'">
                  {{ notificationSummary(item) }}
                </p>
                <p v-if="item.target_video?.title" class="text-xs text-gray-400 mt-1">{{ t('notifications.videoLabel') }} {{ item.target_video.title }}</p>
                <p v-if="item.target_comment?.snippet" class="text-xs text-gray-500 mt-1">{{ item.target_comment.snippet }}</p>
                <p class="text-xs text-gray-500 mt-2">{{ formatTime(item.created_at) }}</p>
              </div>
            </div>
            <button
              @click.prevent="toggleRead(item)"
              class="px-2 py-1 text-xs rounded border border-zinc-700 hover:bg-zinc-800"
            >
              {{ item.is_read ? t('notifications.markUnread') : t('notifications.markRead') }}
            </button>
          </div>
        </NuxtLink>
      </div>

      <div class="mt-6 flex justify-center">
        <button
          v-if="hasMore && !loadingMore"
          @click="loadMore"
          class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
        >
          {{ t('notifications.loadMore') }}
        </button>
        <p v-if="loadingMore" class="text-sm text-gray-400">{{ t('notifications.loadingMore') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPushConfig,
  subscribePush,
  unsubscribePush,
  type NotificationItem,
} from '~/app/service/notifications'

const items = ref<NotificationItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const limit = 20
const offset = ref(0)
const unreadOnly = ref(false)

const pushBusy = ref(false)
const isPushEnabled = ref(false)
const pushMessage = ref('')
const pushConfig = ref({ enabled: false, send_enabled: false, vapid_public_key: '' })
const { t, locale } = useI18n()
const localePrefix = computed(() => (locale.value && locale.value !== 'en' ? `/${locale.value}` : ''))
const AUTH_STATE_CHANGED_EVENT = 'giltube-auth-changed'

const notificationSummary = (item: NotificationItem) => {
  if (item.type === 'comment_video') return t('notifications.commentedOnVideo', { name: item.actor_channel.name })
  if (item.type === 'reply_comment') return t('notifications.repliedToComment', { name: item.actor_channel.name })
  if (item.type === 'like_video') return t('notifications.likedYourVideo', { name: item.actor_channel.name })
  if (item.type === 'like_comment') return t('notifications.likedYourComment', { name: item.actor_channel.name })
  if (item.type === 'live_started') return t('notifications.startedLive', { name: item.actor_channel.name })
  return t('notifications.sentNotification', { name: item.actor_channel.name })
}

const actorInitial = (item: NotificationItem) => {
  const name = item?.actor_channel?.name?.trim()
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const localizedItemUrl = (value: string) => {
  if (!value) return localePrefix.value || '/'
  if (value.startsWith('http')) return value
  if (value.startsWith('/')) return `${localePrefix.value}${value}` || value
  return value
}

const formatTime = (value: string) => {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const load = async (append = false) => {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const res = await listNotifications({
      limit,
      offset: offset.value,
      unread_only: unreadOnly.value,
    })

    const batch = res.items || []
    if (append) {
      items.value = [...items.value, ...batch]
    } else {
      items.value = batch
    }

    hasMore.value = batch.length === limit
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const reloadFromStart = async () => {
  offset.value = 0
  hasMore.value = true
  await load(false)
}

const loadMore = async () => {
  offset.value += limit
  await load(true)
}

const markRead = async (item: NotificationItem) => {
  if (item.is_read) return
  await markNotificationRead(item.id, true)
  item.is_read = true
}

const toggleRead = async (item: NotificationItem) => {
  const next = !item.is_read
  await markNotificationRead(item.id, next)
  item.is_read = next
}

const markAllRead = async () => {
  await markAllNotificationsRead()
  for (const item of items.value) {
    item.is_read = true
  }
}

const getCurrentSubscription = async () => {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const refreshPushState = async () => {
  try {
    pushConfig.value = await getPushConfig()
    const existing = await getCurrentSubscription()
    isPushEnabled.value = !!existing
  } catch {
    pushConfig.value = { enabled: false, send_enabled: false, vapid_public_key: '' }
    isPushEnabled.value = false
  }
}

const handleAuthStateChanged = async () => {
  await refreshPushState()
}

const enablePush = async () => {
  pushMessage.value = ''
  if (!pushConfig.value.enabled) {
    pushMessage.value = t('notifications.pushDisabledByConfig')
    return
  }
  if (!pushConfig.value.send_enabled) {
    pushMessage.value = t('notifications.pushPaused')
    return
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    pushMessage.value = t('notifications.pushUnsupported')
    return
  }
  if (!pushConfig.value.vapid_public_key) {
    pushMessage.value = t('notifications.pushKeyMissing')
    return
  }

  pushBusy.value = true
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      pushMessage.value = t('notifications.permissionDenied')
      return
    }

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      await existing.unsubscribe()
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pushConfig.value.vapid_public_key),
    })

    const json = subscription.toJSON()
    await subscribePush({
      endpoint: json.endpoint || '',
      keys: {
        p256dh: json.keys?.p256dh || '',
        auth: json.keys?.auth || '',
      },
    })

    isPushEnabled.value = true
    pushMessage.value = t('notifications.pushEnabled')
  } catch (err: any) {
    pushMessage.value = err?.message || t('notifications.enableFailed')
  } finally {
    pushBusy.value = false
  }
}

const disablePush = async () => {
  pushMessage.value = ''
  pushBusy.value = true
  try {
    const existing = await getCurrentSubscription()
    if (existing) {
      await unsubscribePush({ endpoint: existing.endpoint })
      await existing.unsubscribe()
    }
    isPushEnabled.value = false
    pushMessage.value = t('notifications.pushDisabled')
  } catch (err: any) {
    pushMessage.value = err?.message || t('notifications.disableFailed')
  } finally {
    pushBusy.value = false
  }
}

const refresh = async () => {
  await reloadFromStart()
  await refreshPushState()
}

onMounted(async () => {
  await refresh()
  window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged)
})

onUnmounted(() => {
  window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged)
})
</script>
