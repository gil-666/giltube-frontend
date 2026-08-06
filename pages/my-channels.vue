<template>
  <div class="min-h-full bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[96rem]">
      <header class="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{{ t('app.currentAccount') }}</p>
          <h1 class="mt-2 text-4xl font-black tracking-tight">{{ t('channels.title') }}</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{{ t('channels.manageSubtitle') }}</p>
        </div>
        <NuxtLink
          :to="localePath('/create-channel')"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 5v14M5 12h14" />
          </svg>
          {{ t('channels.createFirst') }}
        </NuxtLink>
      </header>

      <div v-if="error" class="mb-6 rounded-lg border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-100">
        {{ error }}
      </div>

      <div v-if="isLoading" class="rounded-xl border border-zinc-800 bg-zinc-950 p-12 text-center shadow-2xl shadow-black/20">
        <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-zinc-700 border-b-blue-500"></div>
        <p class="text-sm font-semibold text-zinc-300">{{ t('channels.loading') }}</p>
      </div>

      <div v-else-if="channels.length === 0" class="rounded-xl border border-zinc-800 bg-zinc-950 p-10 text-center shadow-2xl shadow-black/20">
        <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-zinc-400">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m8 0v2a4 4 0 0 1-8 0v-2m12 9a8 8 0 1 0-16 0" />
          </svg>
        </div>
        <h2 class="text-2xl font-black">{{ t('channels.noChannels') }}</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">{{ t('channels.emptyBody') }}</p>
        <NuxtLink
          :to="localePath('/create-channel')"
          class="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
        >
          {{ t('channels.createFirst') }}
        </NuxtLink>
      </div>

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="channel in channels"
          :key="channel.id"
          class="motion-card group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20 transition hover:border-zinc-700"
        >
          <div class="relative h-36 bg-zinc-900">
            <img
              v-if="channel.background_url && channel.background_url.trim()"
              :src="getBackgroundUrl(channel.background_url)"
              :alt="`${channel.name} background`"
              class="h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-[1.02]"
            />
            <div v-else class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.20),transparent_32%),linear-gradient(135deg,rgba(39,39,42,0.95),rgba(9,9,11,1))]" />
            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/45 to-black/10" />
            <div class="absolute bottom-4 left-4 flex items-end gap-3">
              <div class="h-20 w-20 overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 shadow-xl">
                <img
                  v-if="channel.avatar_url && channel.avatar_url.trim() && !failedAvatars[channel.id]"
                  :src="getAvatarUrl(channel.avatar_url)"
                  :alt="channel.name"
                  class="h-full w-full object-cover"
                  @error="failedAvatars[channel.id] = true"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-200">
                  {{ channel.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="min-w-0 pb-1">
                <div class="flex items-center gap-2">
                  <h2 class="truncate text-xl font-black text-white">{{ channel.name }}</h2>
                  <span
                    v-if="channel.status && channel.status !== 'active'"
                    class="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                    :class="channel.status === 'banned' ? 'border-red-800 bg-red-950/70 text-red-200' : 'border-yellow-800 bg-yellow-950/70 text-yellow-200'"
                  >
                    {{ channel.status }}
                  </span>
                </div>
                <p class="text-xs text-zinc-500">{{ t('channels.created', { date: formatDate(channel.created_at) }) }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4 p-4">
            <p class="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-zinc-400">
              {{ channel.description || t('channels.noDescription') }}
            </p>

            <div class="grid grid-cols-2 gap-2 text-xs text-zinc-500">
              <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <p class="font-semibold uppercase">{{ t('channels.identity') }}</p>
                <p class="mt-1 truncate text-zinc-300">{{ shortChannelId(channel.id) }}</p>
              </div>
              <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <p class="font-semibold uppercase">{{ t('channels.status') }}</p>
                <p class="mt-1 text-zinc-300">{{ channel.status || 'active' }}</p>
              </div>
            </div>

            <div class="flex flex-col gap-2 border-t border-zinc-800 pt-4 sm:flex-row">
              <NuxtLink
                :to="localePath(`/channel/${channel.id}`)"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 3h7v7m0-7L10 14m-7 7h12a2 2 0 0 0 2-2v-5" />
                </svg>
                {{ t('channels.viewPage') }}
              </NuxtLink>
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700"
                @click="initEditChannel(channel)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16.86 4.49 2.65 2.65M5 19l3.5-.67 10-10a1.87 1.87 0 0 0-2.64-2.64l-10 10L5 19Z" />
                </svg>
                {{ t('channels.edit') }}
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-red-900/70 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-950/50"
                :title="t('channels.delete')"
                @click="deleteChannelConfirm(channel.id, channel.name)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12m-9 0V5h6v2m-7 4v7m4-7v7m4-7v7M8 7l1 14h6l1-14" />
                </svg>
                <span class="sr-only">{{ t('channels.delete') }}</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="editingId"
        class="fixed inset-0 z-[2147483647] flex bg-zinc-950 text-white sm:items-center sm:justify-center sm:bg-black/75 sm:p-6 sm:backdrop-blur-sm"
        @click.self="closeEditPanel"
      >
      <div class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 sm:h-auto sm:max-h-[min(90dvh,56rem)] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-zinc-800 sm:shadow-2xl">
        <div
          class="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-5 pb-4 pt-4 backdrop-blur sm:pt-4"
          style="padding-top: max(env(safe-area-inset-top), 1rem);"
        >
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{{ t('channels.edit') }}</p>
            <h3 class="text-2xl font-black">{{ t('channels.editModal') }}</h3>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            :title="t('channels.cancel')"
            @click="closeEditPanel"
          >
            X
          </button>
        </div>

        <form @submit.prevent="saveEdit" class="flex min-h-0 flex-1 flex-col">
          <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div class="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section class="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                <div class="relative h-40 bg-zinc-900 sm:h-48">
                  <img
                    v-if="editPreviewBackground"
                    :src="editPreviewBackground"
                    alt=""
                    class="h-full w-full object-cover"
                  />
                  <div v-else class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.20),transparent_34%),linear-gradient(135deg,rgba(39,39,42,0.95),rgba(9,9,11,1))]" />
                  <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/45 to-black/10" />
                  <div class="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                    <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 shadow-xl">
                      <img
                        v-if="editPreviewAvatar"
                        :src="editPreviewAvatar"
                        :alt="editPreviewName"
                        class="h-full w-full object-cover"
                      />
                      <div v-else class="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-200">
                        {{ editPreviewName.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div class="min-w-0 pb-1">
                      <h4 class="truncate text-xl font-black">{{ editPreviewName }}</h4>
                      <p class="line-clamp-2 text-xs leading-5 text-zinc-300">{{ editPreviewDescription }}</p>
                    </div>
                  </div>
                </div>
                <div class="border-t border-zinc-800 p-4">
                  <p class="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{{ t('channels.preview') }}</p>
                  <p class="mt-2 text-sm leading-5 text-zinc-300">{{ editPreviewDescription }}</p>
                </div>
              </section>

            <div class="space-y-5">
              <!-- Channel Name -->
              <div>
                <label class="mb-2 block text-sm font-semibold">{{ t('channels.channelName') }}</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="mb-2 block text-sm font-semibold">{{ t('channels.description') }}</label>
                <textarea
                  v-model="editForm.description"
                  rows="3"
                  class="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold">{{ t('channels.avatar') }}</p>
                      <p class="mt-1 text-xs text-zinc-500">{{ t('channels.avatarHelper') }}</p>
                    </div>
                    <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                      <img v-if="editPreviewAvatar" :src="editPreviewAvatar" alt="" class="h-full w-full object-cover" />
                      <div v-else class="flex h-full w-full items-center justify-center text-sm font-black text-zinc-200">
                        {{ editPreviewName.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <label class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-100 transition hover:bg-zinc-700">
                      {{ t('channels.chooseAvatar') }}
                      <input type="file" accept="image/*" class="sr-only" @change="onEditAvatarSelected" />
                    </label>
                    <button
                      v-if="editAvatarPreview"
                      type="button"
                      class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
                      @click="clearEditAvatarSelection"
                    >
                      {{ t('channels.remove') }}
                    </button>
                    <button
                      v-if="editingChannelHasAvatar && !editRemoveAvatar"
                      type="button"
                      class="rounded-lg border border-red-900/70 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-950/50"
                      @click="markEditAvatarForRemoval"
                    >
                      {{ t('channels.removeAvatar') }}
                    </button>
                  </div>
                </div>

                <div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <div>
                    <p class="text-sm font-semibold">{{ t('channels.backgroundImage') }}</p>
                    <p class="mt-1 text-xs text-zinc-500">{{ t('channels.backgroundHelper') }}</p>
                  </div>
                  <div class="mt-3 h-16 overflow-hidden rounded-lg bg-zinc-800">
                    <img v-if="editPreviewBackground" :src="editPreviewBackground" alt="" class="h-full w-full object-cover" />
                    <div v-else class="h-full w-full bg-[linear-gradient(135deg,rgba(39,39,42,1),rgba(9,9,11,1))]" />
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <label class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-100 transition hover:bg-zinc-700">
                      {{ t('channels.chooseBackground') }}
                      <input type="file" accept="image/*" class="sr-only" @change="onEditBackgroundSelected" />
                    </label>
                    <button
                      v-if="editBackgroundPreview"
                      type="button"
                      class="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
                      @click="clearEditBackgroundSelection"
                    >
                      {{ t('channels.remove') }}
                    </button>
                    <button
                      v-if="editingChannelHasBackground && !editRemoveBackground"
                      type="button"
                      class="rounded-lg border border-red-900/70 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-950/50"
                      @click="markEditBackgroundForRemoval"
                    >
                      {{ t('channels.removeBackground') }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="editRemoveAvatar || editRemoveBackground" class="rounded-lg border border-red-900/60 bg-red-950/60 p-3 text-sm text-red-100">
                <p v-if="editRemoveAvatar">{{ t('channels.avatarWillBeRemoved') }}</p>
                <p v-if="editRemoveBackground">{{ t('channels.backgroundWillBeRemoved') }}</p>
              </div>

              <!-- Error -->
              <div v-if="editError" class="rounded-lg border border-red-900/70 bg-red-950/60 p-3 text-sm text-red-100">
                {{ editError }}
              </div>
            </div>
          </div>
          </div>

          <!-- Buttons -->
          <div
            class="flex shrink-0 flex-col-reverse gap-3 border-t border-zinc-800 bg-zinc-950/95 px-4 py-4 backdrop-blur sm:flex-row sm:px-5"
            style="padding-bottom: max(env(safe-area-inset-bottom), 1rem);"
          >
            <button
              type="button"
              @click="closeEditPanel"
              class="flex-1 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700"
            >
              {{ t('channels.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isSaving ? t('channels.saving') : t('channels.save') }}
            </button>
          </div>
        </form>
      </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirmId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      @click.self="deleteConfirmId = null"
    >
      <div class="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950/70 text-red-200">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12m-9 0V5h6v2m-7 4v7m4-7v7m4-7v7M8 7l1 14h6l1-14" />
          </svg>
        </div>
        <h3 class="text-2xl font-black">{{ t('channels.deleteModal') }}</h3>
        <p class="mt-3 text-sm leading-6 text-zinc-300">
          {{ t('channels.deleteConfirm', { name: deleteConfirmName }) }}
        </p>

        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            @click="deleteConfirmId = null"
            class="flex-1 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:bg-zinc-700"
          >
            {{ t('channels.cancel') }}
          </button>
          <button
            @click="confirmDelete"
            :disabled="isDeleting"
            class="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isDeleting ? t('channels.deleting') : t('channels.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { fetchUserChannels, updateChannel, deleteChannel } from '~/app/service/upload'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { resolveMediaUrl } from '~/app/utils/media'

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

interface ManagedChannel {
  id: string
  name: string
  description?: string
  avatar_url?: string
  background_url?: string
  status?: string
  created_at?: string
}

const isLoading = ref(false)
const channels = ref<ManagedChannel[]>([])
const error = ref('')
const userId = ref('')
const failedAvatars = ref<Record<string, boolean>>({}) // Track failed avatar loads

// Edit state
const editingId = ref<string | null>(null)
const editingChannel = ref<ManagedChannel | null>(null)
const editForm = ref({ name: '', description: '', avatar: null as File | null, background: null as File | null })
const editAvatarPreview = ref('')
const editBackgroundPreview = ref('')
const editRemoveAvatar = ref(false)
const editRemoveBackground = ref(false)
const editingChannelHasAvatar = ref(false)
const editingChannelHasBackground = ref(false)
const isSaving = ref(false)
const editError = ref('')

const editPreviewName = computed(() => editForm.value.name.trim() || editingChannel.value?.name || 'Channel')
const editPreviewDescription = computed(() => editForm.value.description.trim() || t('channels.noDescription'))
const editPreviewAvatar = computed(() => {
  if (editRemoveAvatar.value) return ''
  if (editAvatarPreview.value) return editAvatarPreview.value
  if (editingChannel.value?.avatar_url) return getAvatarUrl(editingChannel.value.avatar_url)
  return ''
})
const editPreviewBackground = computed(() => {
  if (editRemoveBackground.value) return ''
  if (editBackgroundPreview.value) return editBackgroundPreview.value
  if (editingChannel.value?.background_url) return getBackgroundUrl(editingChannel.value.background_url)
  return ''
})

// Delete state
const deleteConfirmId = ref<string | null>(null)
const deleteConfirmName = ref('')
const isDeleting = ref(false)

onMounted(async () => {
  await loadChannels()
})

const loadChannels = async () => {
  const storedUserId = localStorage.getItem('user_id')
  if (!storedUserId) {
    await router.push(localePath('/login'))
    return
  }

  userId.value = storedUserId
  isLoading.value = true
  error.value = ''
  failedAvatars.value = {} // Reset failed avatars

  try {
    channels.value = (await fetchUserChannels(userId.value)).channels
  } catch (err) {
    error.value = typeof err === 'string' ? err : t('channels.loadError')
    console.error('Channel loading error:', err)
  } finally {
    isLoading.value = false
  }
}

// Helper function to format avatar URL
const getAvatarUrl = (avatarUrl: string) => {
  if (!avatarUrl || !avatarUrl.trim()) return ''
  // If it's a full URL, return as-is
  if (avatarUrl.startsWith('http')) return avatarUrl
  // If it already starts with /avatars/, return as-is (root-relative path)
  if (avatarUrl.startsWith('/avatars/')) return avatarUrl
  // Otherwise, prepend /avatars/ (don't use baseUrl - avatars are at root level)
  return `/avatars/${avatarUrl}`
}

const getBackgroundUrl = (backgroundUrl: string) => {
  if (!backgroundUrl || !backgroundUrl.trim()) return ''
  return resolveMediaUrl(backgroundUrl)
}

const shortChannelId = (channelId: string) => {
  if (!channelId) return '-'
  return channelId.length > 12 ? `${channelId.slice(0, 8)}...${channelId.slice(-4)}` : channelId
}

const initEditChannel = (channel: ManagedChannel) => {
  editingChannel.value = channel
  editingId.value = channel.id
  editForm.value.name = channel.name
  editForm.value.description = channel.description || ''
  editForm.value.avatar = null
  editForm.value.background = null
  editAvatarPreview.value = ''
  editBackgroundPreview.value = ''
  editRemoveAvatar.value = false
  editRemoveBackground.value = false
  editingChannelHasAvatar.value = Boolean(channel.avatar_url)
  editingChannelHasBackground.value = Boolean(channel.background_url)
}

const closeEditPanel = () => {
  editingId.value = null
  editingChannel.value = null
  editError.value = ''
}

const onEditAvatarSelected = (event: any) => {
  const file = event.target.files?.[0]
  if (file) {
    editForm.value.avatar = file
    editRemoveAvatar.value = false
    const reader = new FileReader()
    reader.onload = (e) => {
      editAvatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const onEditBackgroundSelected = (event: any) => {
  const file = event.target.files?.[0]
  if (file) {
    editForm.value.background = file
    editRemoveBackground.value = false
    const reader = new FileReader()
    reader.onload = (e) => {
      editBackgroundPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const clearEditAvatarSelection = () => {
  editAvatarPreview.value = ''
  editForm.value.avatar = null
}

const clearEditBackgroundSelection = () => {
  editBackgroundPreview.value = ''
  editForm.value.background = null
}

const markEditAvatarForRemoval = () => {
  clearEditAvatarSelection()
  editRemoveAvatar.value = true
}

const markEditBackgroundForRemoval = () => {
  clearEditBackgroundSelection()
  editRemoveBackground.value = true
}

const saveEdit = async () => {
  if (!editForm.value.name.trim()) {
    editError.value = t('channels.nameRequired')
    return
  }

  isSaving.value = true
  editError.value = ''

  try {
    if (!editingId.value) return

    await updateChannel(editingId.value, {
      name: editForm.value.name,
      description: editForm.value.description,
      avatar: editForm.value.avatar,
      background: editForm.value.background,
      removeAvatar: editRemoveAvatar.value,
      removeBackground: editRemoveBackground.value,
    })

    // Update local state
    const channelIndex = channels.value.findIndex(ch => ch.id === editingId.value)
    if (channelIndex !== -1) {
      channels.value[channelIndex].name = editForm.value.name
      channels.value[channelIndex].description = editForm.value.description
      // If media was changed, reload the channel data to get fresh public paths.
      if (editForm.value.avatar || editForm.value.background || editRemoveAvatar.value || editRemoveBackground.value) {
        failedAvatars.value[editingId.value] = false // Reset avatar load failure
        await loadChannels()
      }
    }

    // Update localStorage if this is the active channel
    const activeAccount = localStorage.getItem('active_account')
    if (activeAccount === editingId.value) {
      localStorage.setItem('active_account_name', editForm.value.name)
    }

    editingId.value = null
    editingChannel.value = null
  } catch (err) {
    editError.value = typeof err === 'string' ? err : t('channels.updateError')
    console.error('Channel update error:', err)
  } finally {
    isSaving.value = false
  }
}

const deleteChannelConfirm = (channelId: string, channelName: string) => {
  deleteConfirmId.value = channelId
  deleteConfirmName.value = channelName
}

const confirmDelete = async () => {
  if (!deleteConfirmId.value) return
  isDeleting.value = true

  try {
    await deleteChannel(deleteConfirmId.value)

    // Remove from local state
    channels.value = channels.value.filter(ch => ch.id !== deleteConfirmId.value)
    delete failedAvatars.value[deleteConfirmId.value]

    // If this was the active channel, switch to personal
    const activeAccount = localStorage.getItem('active_account')
    if (activeAccount === deleteConfirmId.value) {
      localStorage.setItem('active_account', 'personal')
      localStorage.removeItem('active_account_name')
      window.location.reload()
    }

    deleteConfirmId.value = null
  } catch (err) {
    error.value = typeof err === 'string' ? err : t('channels.deleteError')
    console.error('Channel delete error:', err)
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
input,
textarea {
  color: white;
}

input::placeholder,
textarea::placeholder {
  color: #6b7280;
}

input:autofill,
input:autofill:hover,
input:autofill:focus,
input:autofill:active {
  -webkit-text-fill-color: white !important;
  -webkit-box-shadow: 0 0 0 30px rgb(24, 24, 27) inset !important;
}
</style>
