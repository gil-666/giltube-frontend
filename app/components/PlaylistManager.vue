<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center" style="z-index: 2147483647 !important; pointer-events: auto; overflow: visible;" @click.self="closeModal">
      <div class="bg-zinc-800 rounded-lg max-w-md w-full mx-4" style="z-index: 2147483647 !important; position: relative; overflow: visible;">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 class="text-lg font-semibold text-white">
            {{ isEditing ? t('playlists.editPlaylist') : t('playlists.createPlaylist') }}
          </h2>
          <button @click="closeModal" class="text-gray-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">{{ t('playlists.title') }}</label>
            <input v-model="form.title" type="text" class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500" :placeholder="t('playlists.titlePlaceholder')" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">{{ t('playlists.description') }}</label>
            <textarea v-model="form.description" rows="3" class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500" :placeholder="t('playlists.descriptionPlaceholder')" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">{{ t('playlists.visibility') }}</label>
            <select v-model="form.visibility" class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white focus:outline-none focus:border-red-500">
              <option value="private">{{ t('playlists.private') }}</option>
              <option value="unlisted">{{ t('playlists.unlisted') }}</option>
              <option value="public">{{ t('playlists.public') }}</option>
            </select>
          </div>

          <div v-if="channels.length > 0">
            <label class="block text-sm font-medium text-gray-300 mb-2">{{ t('playlists.channel') }}</label>
            <select v-model="form.channelId" class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white focus:outline-none focus:border-red-500">
              <option value="">{{ t('playlists.personal') }}</option>
              <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                {{ channel.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-2 px-6 py-4 border-t border-zinc-700">
          <button @click="closeModal" class="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition">
            {{ t('common.cancel') }}
          </button>
          <button @click="handleSave" :disabled="!form.title || isSaving" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition">
            {{ isSaving ? t('common.saving') : (isEditing ? t('common.update') : t('common.create')) }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Playlist {
  id?: string
  title: string
  description: string
  visibility: 'public' | 'private' | 'unlisted'
  channelId: string
}

interface Channel {
  id: string
  name: string
}

const props = defineProps<{
  isOpen: boolean
  channels: Channel[]
  editingPlaylist?: Playlist | null
}>()

const emit = defineEmits<{
  close: []
  save: [playlist: Playlist]
}>()

const { t } = useI18n()
const isSaving = ref(false)

const form = ref<Playlist>({
  title: '',
  description: '',
  visibility: 'private',
  channelId: ''
})

const isEditing = computed(() => !!props.editingPlaylist)

const getActivePlaylistScope = () => {
  if (typeof window === 'undefined') return { mode: 'personal', value: '' }

  const activeAccount = localStorage.getItem('active_account') || 'personal'
  const userID = localStorage.getItem('user_id') || ''

  if (!activeAccount || activeAccount === 'personal' || activeAccount === userID) {
    return { mode: 'personal', value: userID }
  }

  return { mode: 'channel', value: activeAccount }
}

const syncFormFromProps = () => {
  if (props.isOpen && props.editingPlaylist) {
    form.value = {
      title: props.editingPlaylist.title || '',
      description: props.editingPlaylist.description || '',
      visibility: props.editingPlaylist.visibility || 'private',
      channelId: props.editingPlaylist.channelId || ''
    }
    return
  }

  if (props.isOpen) {
    const scope = getActivePlaylistScope()
    form.value = {
      title: '',
      description: '',
      visibility: 'private',
      channelId: scope.mode === 'channel' ? scope.value : ''
    }
  }
}

watch([() => props.isOpen, () => props.editingPlaylist], syncFormFromProps, { immediate: true, deep: true })

const handleSave = async () => {
  isSaving.value = true
  try {
    await emit('save', {
      ...form.value,
      id: props.editingPlaylist?.id
    })
    closeModal()
  } finally {
    isSaving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>
