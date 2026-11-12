<template>
  <section class="rounded-lg border border-white/10 bg-zinc-900 p-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-white">{{ t('youtubeImportAdmin.title') }}</h3>
          <AdminHelpButton :title="t('youtubeImportAdmin.helpTitle')" :body="t('youtubeImportAdmin.helpBody')" :close-label="t('common.close')" />
        </div>
        <p class="mt-1 text-sm text-gray-400">{{ t('youtubeImportAdmin.body') }}</p>
      </div>
      <button type="button" class="self-start rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="load">
        {{ t('common.refresh') }}
      </button>
    </div>

    <div v-if="error" class="mt-4 rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">{{ error }}</div>

    <!-- Who can use it -->
    <div class="mt-5 grid gap-2 sm:grid-cols-3">
      <button
        v-for="option in modeOptions"
        :key="option.value"
        type="button"
        :disabled="saving"
        :class="[
          'rounded-lg border p-3 text-left transition disabled:opacity-60',
          settings.mode === option.value
            ? option.value === 'off' ? 'border-red-500/60 bg-red-950/40' : 'border-blue-500/60 bg-blue-950/30'
            : 'border-white/10 bg-zinc-800 hover:border-white/25',
        ]"
        @click="setMode(option.value)"
      >
        <span class="block text-sm font-semibold text-white">{{ option.label }}</span>
        <span class="mt-1 block text-xs text-gray-400">{{ option.body }}</span>
      </button>
    </div>

    <!-- Limits -->
    <div class="mt-4 grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end">
      <label class="block text-sm text-gray-300">
        <span class="mb-1 block text-xs font-semibold text-gray-400">{{ t('youtubeImportAdmin.dailyLimit') }}</span>
        <input v-model.number="settings.daily_limit" type="number" min="0" max="1000" class="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 text-white" />
      </label>
      <label class="block text-sm text-gray-300">
        <span class="mb-1 block text-xs font-semibold text-gray-400">{{ t('youtubeImportAdmin.maxLength') }}</span>
        <input v-model.number="settings.max_duration_minutes" type="number" min="0" max="1440" class="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 text-white" />
      </label>
      <label class="block text-sm text-gray-300">
        <span class="mb-1 block text-xs font-semibold text-gray-400">{{ t('youtubeImportAdmin.maxQuality') }}</span>
        <select v-model.number="settings.max_height" class="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 text-white">
          <option v-for="height in [480, 720, 1080, 1440, 2160]" :key="height" :value="height">{{ height === 2160 ? '4K' : `${height}p` }}</option>
        </select>
      </label>
      <button
        type="button"
        :disabled="saving"
        class="rounded bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50"
        @click="saveSettings"
      >
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </div>
    <p class="mt-2 text-xs text-gray-500">{{ t('youtubeImportAdmin.zeroUnlimited') }}</p>

    <!-- Per-user access -->
    <div class="mt-6">
      <h4 class="text-sm font-semibold text-white">{{ t('youtubeImportAdmin.users.title') }}</h4>
      <p class="mt-1 text-xs text-gray-400">{{ t('youtubeImportAdmin.users.body') }}</p>
      <form class="mt-3 flex flex-col gap-2 sm:flex-row" @submit.prevent>
        <input
          v-model="userLookup"
          :placeholder="t('youtubeImportAdmin.users.placeholder')"
          class="min-w-0 flex-1 rounded border border-white/10 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500"
        />
        <button type="button" :disabled="!userLookup.trim() || saving" class="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50" @click="setAccess(userLookup, 'allowed')">
          {{ t('youtubeImportAdmin.users.allow') }}
        </button>
        <button type="button" :disabled="!userLookup.trim() || saving" class="rounded bg-red-900 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-800 disabled:opacity-50" @click="setAccess(userLookup, 'revoked')">
          {{ t('youtubeImportAdmin.users.revoke') }}
        </button>
      </form>

      <div class="mt-3 overflow-hidden rounded border border-white/[0.07]">
        <div v-if="!users.length" class="bg-black/30 px-4 py-5 text-center text-sm text-gray-500">{{ t('youtubeImportAdmin.users.empty') }}</div>
        <div v-else class="divide-y divide-white/[0.07]">
          <div v-for="user in users" :key="user.user_id" class="flex flex-wrap items-center gap-3 bg-black/20 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-white">@{{ user.username }}</p>
              <p class="truncate text-xs text-gray-500">{{ user.email }} · {{ t('youtubeImportAdmin.users.imports', { count: user.import_count }) }}</p>
            </div>
            <span :class="['rounded-full px-2 py-0.5 text-xs font-semibold', user.access === 'revoked' ? 'bg-red-950 text-red-300' : 'bg-blue-950 text-blue-300']">
              {{ user.access === 'revoked' ? t('youtubeImportAdmin.users.revoked') : t('youtubeImportAdmin.users.allowed') }}
            </span>
            <button
              v-if="user.access === 'revoked'"
              type="button"
              class="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-600"
              @click="setAccess(user.user_id, settings.mode === 'allowlist' ? 'allowed' : '')"
            >
              {{ t('youtubeImportAdmin.users.restore') }}
            </button>
            <button
              v-else
              type="button"
              class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-800"
              @click="setAccess(user.user_id, 'revoked')"
            >
              {{ t('youtubeImportAdmin.users.revoke') }}
            </button>
            <button type="button" class="rounded px-2 py-1.5 text-xs text-gray-400 hover:text-white" :title="t('youtubeImportAdmin.users.clearHint')" @click="setAccess(user.user_id, '')">
              {{ t('youtubeImportAdmin.users.clear') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent imports -->
    <div class="mt-6">
      <h4 class="text-sm font-semibold text-white">{{ t('youtubeImportAdmin.recent.title') }}</h4>
      <div class="mt-3 overflow-hidden rounded border border-white/[0.07]">
        <div v-if="loading" class="bg-black/30 px-4 py-5 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>
        <div v-else-if="!recent.length" class="bg-black/30 px-4 py-5 text-center text-sm text-gray-500">{{ t('youtubeImportAdmin.recent.empty') }}</div>
        <div v-else class="max-h-[28rem] divide-y divide-white/[0.07] overflow-y-auto">
          <div v-for="item in recent" :key="item.id" class="flex flex-wrap items-center gap-3 bg-black/20 px-4 py-3">
            <div class="min-w-0 flex-1">
              <NuxtLink :to="localePath(`/video/${item.video_id}`)" class="block truncate text-sm font-semibold text-white hover:underline">{{ item.title }}</NuxtLink>
              <p class="truncate text-xs text-gray-500">
                @{{ item.username }} → {{ item.channel_name }} ·
                <a :href="`https://www.youtube.com/watch?v=${item.youtube_video_id}`" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ item.youtube_video_id }}</a>
                · {{ new Date(item.created_at).toLocaleString() }}
              </p>
              <p v-if="item.status === 'failed' && item.error" class="truncate text-xs text-red-300">{{ item.error }}</p>
            </div>
            <span :class="['rounded-full px-2 py-0.5 text-xs font-semibold', statusClass(item.status)]">{{ t(`youtubeImport.status.${item.status}`) }}</span>
            <button
              v-if="item.access !== 'revoked'"
              type="button"
              class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-800"
              @click="setAccess(item.user_id, 'revoked')"
            >
              {{ t('youtubeImportAdmin.users.revoke') }}
            </button>
            <span v-else class="text-xs text-red-300">{{ t('youtubeImportAdmin.users.revoked') }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import AdminHelpButton from './AdminHelpButton.vue'
import {
  getAdminYouTubeImportSettings,
  saveAdminYouTubeImportSettings,
  setAdminYouTubeImportUserAccess,
  type YouTubeImportAdminRecent,
  type YouTubeImportSettings,
  type YouTubeImportUserAccess,
} from '~/app/service/youtubeImport'

const { t } = useI18n()
const localePath = useLocalePath()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const userLookup = ref('')
const settings = ref<YouTubeImportSettings>({ mode: 'everyone', daily_limit: 10, max_duration_minutes: 180, max_height: 1080 })
const users = ref<YouTubeImportUserAccess[]>([])
const recent = ref<YouTubeImportAdminRecent[]>([])

const modeOptions = computed(() => [
  { value: 'everyone' as const, label: t('youtubeImportAdmin.modes.everyone'), body: t('youtubeImportAdmin.modes.everyoneBody') },
  { value: 'allowlist' as const, label: t('youtubeImportAdmin.modes.allowlist'), body: t('youtubeImportAdmin.modes.allowlistBody') },
  { value: 'off' as const, label: t('youtubeImportAdmin.modes.off'), body: t('youtubeImportAdmin.modes.offBody') },
])

const messageOf = (err: any, fallback: string) => err?.response?.data?.error || err?.message || fallback

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await getAdminYouTubeImportSettings()
    settings.value = data.settings
    users.value = data.users || []
    recent.value = data.recent || []
  } catch (err: any) {
    error.value = messageOf(err, t('youtubeImportAdmin.errors.load'))
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  error.value = ''
  try {
    await saveAdminYouTubeImportSettings({
      mode: settings.value.mode,
      daily_limit: Number(settings.value.daily_limit) || 0,
      max_duration_minutes: Number(settings.value.max_duration_minutes) || 0,
      max_height: Number(settings.value.max_height) || 1080,
    })
  } catch (err: any) {
    error.value = messageOf(err, t('youtubeImportAdmin.errors.save'))
  } finally {
    saving.value = false
  }
}

const setMode = async (mode: YouTubeImportSettings['mode']) => {
  const previous = settings.value.mode
  settings.value.mode = mode
  await saveSettings()
  if (error.value) settings.value.mode = previous
}

const setAccess = async (user: string, access: '' | 'allowed' | 'revoked') => {
  saving.value = true
  error.value = ''
  try {
    await setAdminYouTubeImportUserAccess(user.trim(), access)
    if (user === userLookup.value) userLookup.value = ''
    await load()
  } catch (err: any) {
    error.value = messageOf(err, t('youtubeImportAdmin.errors.save'))
  } finally {
    saving.value = false
  }
}

const statusClass = (status: string) => {
  switch (status) {
    case 'ready': return 'bg-green-950 text-green-300'
    case 'failed': return 'bg-red-950 text-red-300'
    default: return 'bg-zinc-800 text-zinc-300'
  }
}

onMounted(load)
</script>
