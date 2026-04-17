<template>
  <div class="fixed inset-0 bg-zinc-950 text-white p-6 flex items-center justify-center">
    <!-- Loading State -->
    <div v-if="!isReady" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p>Checking your channels...</p>
    </div>

    <!-- Upload Form -->
    <div v-else class="max-w-2xl mx-auto w-full">
      <h1 class="text-4xl font-bold mb-8">Upload Video</h1>

      <form @submit.prevent="handleUpload" class="space-y-6">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium mb-2">Title *</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Enter video title"
            required
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <textarea
            v-model="form.description"
            placeholder="Enter video description"
            rows="5"
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Channel ID -->
        <div>
          <label class="block text-sm font-medium mb-2">Channel *</label>
          <select
            v-model="form.channelId"
            required
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option v-for="channel in channels" :key="channel.id" :value="channel.id">
              {{ channel.name }}
            </option>
          </select>
        </div>

        <!-- Video File -->
        <div>
          <label class="block text-sm font-medium mb-2">Video File *</label>
          <input
            type="file"
            accept="video/*"
            required
            @change="handleFileChange"
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <p v-if="selectedFileName" class="text-sm text-blue-400 mt-2">
            Selected: {{ selectedFileName }}
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-900 text-white p-4 rounded">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-900 text-white p-4 rounded">
          {{ successMessage }}
        </div>

        <!-- Buttons -->
        <div class="flex gap-4">
          <button
            type="submit"
            :disabled="isUploading"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isUploading ? 'Uploading...' : 'Upload Video' }}
          </button>
          <NuxtLink
            to="/"
            class="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition"
          >
            Cancel
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { uploadVideo, fetchUserChannels } from '~/app/service/upload'

const router = useRouter()
const isReady = ref(false)
const userId = ref('')
const form = ref({
  title: '',
  description: '',
  channelId: '',
})
const selectedFileName = ref('')
const isUploading = ref(false)
const isLoadingChannels = ref(false)
const channels = ref([])
const error = ref('')
const successMessage = ref('')
let selectedFile = null

onMounted(async () => {
  await checkAuthStatus()
})

const checkAuthStatus = async () => {
  const storedUserId = localStorage.getItem('user_id')
  if (!storedUserId) {
    await router.push('/login')
    return
  }

  userId.value = storedUserId
  await loadChannels()
}

const loadChannels = async () => {
  if (!userId.value) return
  
  isLoadingChannels.value = true
  try {
    channels.value = await fetchUserChannels(userId.value)
    if (channels.value.length === 0) {
      // Redirect to create channel if user has no channels
      await router.push('/create-channel')
      return
    }
    
    // Check if user is on personal account
    const activeAccount = localStorage.getItem('active_account')
    if (!activeAccount || activeAccount === 'personal') {
      // Redirect to create-channel for first time users
      await router.push('/create-channel')
      return
    }

    // Set active account's channel as default
    const activeChannelId = channels.value.find(ch => ch.id === activeAccount)?.id
    
    if (activeChannelId) {
      form.value.channelId = activeChannelId
    } else {
      form.value.channelId = channels.value[0].id
    }
    
    isReady.value = true
  } catch (err) {
    error.value = 'Failed to load channels'
    console.error('Channel loading error:', err)
  } finally {
    isLoadingChannels.value = false
  }
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    selectedFile = file
    selectedFileName.value = file.name
  }
}

const handleUpload = async () => {
  error.value = ''
  successMessage.value = ''

  if (!form.value.title.trim()) {
    error.value = 'Title is required'
    return
  }

  if (!form.value.channelId) {
    error.value = 'Please select a channel'
    return
  }

  if (!selectedFile) {
    error.value = 'Please select a video file'
    return
  }

  isUploading.value = true

  try {
    const response = await uploadVideo({
      title: form.value.title,
      description: form.value.description,
      channelId: form.value.channelId,
      videoFile: selectedFile,
    })

    successMessage.value = 'Video uploaded successfully! Processing has started.'
    
    // Reset form
    form.value = {
      title: '',
      description: '',
      channelId: channels.value.length > 0 ? channels.value[0].id : '',
    }
    selectedFile = null
    selectedFileName.value = ''

    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Upload failed. Please try again.'
    console.error('Upload error:', err)
  } finally {
    isUploading.value = false
  }
}

definePageMeta({
  layout: false,
})
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
  -webkit-box-shadow: 0 0 0 30px #27272a inset !important;
  box-shadow: 0 0 0 30px #27272a inset !important;
  -webkit-text-fill-color: white !important;
}
</style>
