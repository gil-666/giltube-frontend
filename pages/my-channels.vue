<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold mb-8">Manage Your Channels</h1>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p>Loading your channels...</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-900 text-white p-4 rounded mb-6">
      {{ error }}
    </div>

    <!-- No Channels -->
    <div v-if="!isLoading && channels.length === 0" class="bg-zinc-800 p-6 rounded text-center">
      <p class="text-gray-300 mb-4">You don't have any channels yet.</p>
      <NuxtLink
        to="/create-channel"
        class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
      >
        Create Your First Channel
      </NuxtLink>
    </div>

    <!-- Channels List -->
    <div v-else class="space-y-4">
      <div
        v-for="channel in channels"
        :key="channel.id"
        class="bg-zinc-800 rounded p-6 flex items-center justify-between md:flex-row flex-col"
      >
        <!-- Channel Avatar and Info -->
        <div class="flex items-start gap-4 flex-1">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <div v-if="channel.avatar_url && channel.avatar_url.trim() && !failedAvatars[channel.id]" class="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold border-2 border-zinc-700 overflow-hidden">
              <img
                :src="getAvatarUrl(channel.avatar_url)"
                :alt="channel.name"
                class="w-full h-full object-cover"
                @error="failedAvatars[channel.id] = true"
              />
            </div>
            <div
              v-else
              class="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold border-2 border-zinc-700"
            >
              {{ channel.name.charAt(0).toUpperCase() }}
            </div>
          </div>

          <!-- Channel Details -->
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-white">{{ channel.name }}</h2>
            <p class="text-gray-400 mt-2">{{ channel.description || 'No description' }}</p>
            <p class="text-xs text-gray-500 mt-2">Created: {{ formatDate(channel.created_at) }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 flex-shrink-0 mt-4 md:mt-0 ml-4">
          <NuxtLink
            :to="`/channel/${channel.id}`"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            View Page
          </NuxtLink>
          <button
            @click="initEditChannel(channel)"
            class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition"
          >
            Edit
          </button>
          <button
            @click="deleteChannelConfirm(channel.id, channel.name)"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="editingId"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="editingId = null"
    >
      <div class="bg-zinc-900 rounded p-8 max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold mb-6">Edit Channel</h3>

        <form @submit.prevent="saveEdit" class="space-y-4">
          <!-- Channel Name -->
          <div>
            <label class="block text-sm font-medium mb-2">Channel Name *</label>
            <input
              v-model="editForm.name"
              type="text"
              required
              class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium mb-2">Description</label>
            <textarea
              v-model="editForm.description"
              rows="4"
              class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Avatar URL -->
          <div>
            <label class="block text-sm font-medium mb-2">Avatar File (optional)</label>
            <input
              type="file"
              accept="image/*"
              @change="onEditAvatarSelected"
              class="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
            />
            <p class="text-xs text-gray-400 mt-1">Upload a new avatar image or leave blank to keep current</p>
            <!-- Avatar Preview -->
            <div v-if="editAvatarPreview" class="mt-3 flex items-center gap-3">
              <img :src="editAvatarPreview" alt="Avatar preview" class="w-12 h-12 rounded-full object-cover border border-zinc-700" />
              <button
                type="button"
                @click="editAvatarPreview = ''; editForm.avatar = null"
                class="text-sm text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="editError" class="bg-red-900 text-white p-3 rounded text-sm">
            {{ editError }}
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              :disabled="isSaving"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
            <button
              type="button"
              @click="editingId = null"
              class="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirmId"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="deleteConfirmId = null"
    >
      <div class="bg-zinc-900 rounded p-8 max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold mb-4">Delete Channel?</h3>
        <p class="text-gray-300 mb-6">
          Are you sure you want to delete <strong>{{ deleteConfirmName }}</strong>? This action cannot be undone.
        </p>

        <div class="flex gap-3">
          <button
            @click="confirmDelete"
            :disabled="isDeleting"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
          <button
            @click="deleteConfirmId = null"
            class="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchUserChannels, updateChannel, deleteChannel } from '~/app/service/upload'

const router = useRouter()
const isLoading = ref(false)
const channels = ref([])
const error = ref('')
const userId = ref('')
const failedAvatars = ref({}) // Track failed avatar loads

// Edit state
const editingId = ref(null)
const editForm = ref({ name: '', description: '', avatar: null as File | null })
const editAvatarPreview = ref('')
const isSaving = ref(false)
const editError = ref('')

// Delete state
const deleteConfirmId = ref(null)
const deleteConfirmName = ref('')
const isDeleting = ref(false)

onMounted(async () => {
  await loadChannels()
})

const loadChannels = async () => {
  const storedUserId = localStorage.getItem('user_id')
  if (!storedUserId) {
    await router.push('/login')
    return
  }

  userId.value = storedUserId
  isLoading.value = true
  error.value = ''
  failedAvatars.value = {} // Reset failed avatars

  try {
    channels.value = await fetchUserChannels(userId.value)
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Failed to load channels'
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

const initEditChannel = (channel: any) => {
  editingId.value = channel.id
  editForm.value.name = channel.name
  editForm.value.description = channel.description
  editForm.value.avatar = null
  editAvatarPreview.value = ''
}

const onEditAvatarSelected = (event: any) => {
  const file = event.target.files?.[0]
  if (file) {
    editForm.value.avatar = file
    const reader = new FileReader()
    reader.onload = (e) => {
      editAvatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const saveEdit = async () => {
  if (!editForm.value.name.trim()) {
    editError.value = 'Channel name is required'
    return
  }

  isSaving.value = true
  editError.value = ''

  try {
    await updateChannel(editingId.value, {
      name: editForm.value.name,
      description: editForm.value.description,
      avatar: editForm.value.avatar,
    })

    // Update local state
    const channelIndex = channels.value.findIndex(ch => ch.id === editingId.value)
    if (channelIndex !== -1) {
      channels.value[channelIndex].name = editForm.value.name
      channels.value[channelIndex].description = editForm.value.description
      // If avatar was uploaded, reload the channel data to get new avatar_url path
      if (editForm.value.avatar) {
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
  } catch (err) {
    editError.value = typeof err === 'string' ? err : 'Failed to update channel'
    console.error('Channel update error:', err)
  } finally {
    isSaving.value = false
  }
}

const deleteChannelConfirm = (channelId, channelName) => {
  deleteConfirmId.value = channelId
  deleteConfirmName.value = channelName
}

const confirmDelete = async () => {
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
    error.value = typeof err === 'string' ? err : 'Failed to delete channel'
    console.error('Channel delete error:', err)
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
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
