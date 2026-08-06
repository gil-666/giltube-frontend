<template>
  <div class="fixed inset-0 overflow-y-auto bg-zinc-950 p-6 text-white">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-4xl font-bold mb-8">{{ t('createChannelPage.title') }}</h1>

      <div v-if="!isLoggedIn" class="bg-red-900 text-white p-4 rounded mb-6">
        <p>{{ t('createChannelPage.loginRequired') }}</p>
        <NuxtLink :to="localePath('/login')" class="text-blue-400 hover:underline">{{ t('createChannelPage.goToLogin') }}</NuxtLink>
      </div>

      <form v-else @submit.prevent="handleCreateChannel" class="space-y-6">
        <!-- Channel Name -->
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('createChannelPage.channelName') }}</label>
          <input
            v-model="form.name"
            type="text"
            :placeholder="t('createChannelPage.channelNamePlaceholder')"
            required
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('createChannelPage.description') }}</label>
          <textarea
            v-model="form.description"
            :placeholder="t('createChannelPage.descriptionPlaceholder')"
            rows="5"
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Avatar File Upload -->
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('createChannelPage.avatar') }}</label>
          <input
            type="file"
            accept="image/*"
            @change="onAvatarSelected"
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white"
          />
          <p class="text-xs text-gray-400 mt-1">{{ t('createChannelPage.avatarHelper') }}</p>
          <!-- Avatar Preview -->
          <div v-if="avatarPreview" class="mt-3 flex items-center gap-3">
            <img :src="avatarPreview" alt="Avatar preview" class="w-12 h-12 rounded-full object-cover border border-zinc-700" />
            <button
              type="button"
              @click="clearAvatar"
              class="text-sm text-red-400 hover:text-red-300"
            >
              {{ t('createChannelPage.removeAvatar') }}
            </button>
          </div>
        </div>

        <!-- Background File Upload -->
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('createChannelPage.backgroundImage') }}</label>
          <input
            type="file"
            accept="image/*"
            @change="onBackgroundSelected"
            class="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-2 text-white"
          />
          <p class="text-xs text-gray-400 mt-1">{{ t('createChannelPage.backgroundHelper') }}</p>
          <div v-if="backgroundPreview" class="mt-3 space-y-2">
            <div class="relative h-32 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
              <img :src="backgroundPreview" alt="Background preview" class="h-full w-full object-cover" />
              <div class="absolute inset-0 bg-black/55" />
            </div>
            <button
              type="button"
              @click="clearBackground"
              class="text-sm text-red-400 hover:text-red-300"
            >
              {{ t('createChannelPage.removeBackground') }}
            </button>
          </div>
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
            :disabled="isCreating"
            class="px-6 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isCreating ? t('createChannelPage.creating') : t('createChannelPage.submit') }}
          </button>
          <NuxtLink
            :to="localePath('/')"
            class="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition"
          >
            {{ t('createChannelPage.cancel') }}
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createChannel, setDefaultChannel } from '~/app/service/upload'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const isLoggedIn = ref(false)
const userId = ref('')
const form = ref({
  name: '',
  description: '',
  avatar: null as File | null,
  background: null as File | null,
})
const avatarPreview = ref('')
const backgroundPreview = ref('')
const isCreating = ref(false)
const error = ref('')
const successMessage = ref('')

onMounted(() => {
  checkAuthStatus()
})

const checkAuthStatus = () => {
  const storedUserId = localStorage.getItem('user_id')
  if (!storedUserId) {
    isLoggedIn.value = false
  } else {
    isLoggedIn.value = true
    userId.value = storedUserId
  }
}

const onAvatarSelected = (event: any) => {
  const file = event.target.files?.[0]
  if (file) {
    form.value.avatar = file
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const onBackgroundSelected = (event: any) => {
  const file = event.target.files?.[0]
  if (file) {
    form.value.background = file
    const reader = new FileReader()
    reader.onload = (e) => {
      backgroundPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const clearAvatar = () => {
  form.value.avatar = null
  avatarPreview.value = ''
  // Reset file input
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

const clearBackground = () => {
  form.value.background = null
  backgroundPreview.value = ''
}

const handleCreateChannel = async () => {
  error.value = ''
  successMessage.value = ''

  if (!form.value.name.trim()) {
    error.value = t('createChannelPage.nameRequired')
    return
  }

  isCreating.value = true

  try {
    const newChannel = await createChannel({
      userId: userId.value,
      name: form.value.name,
      description: form.value.description,
      avatar: form.value.avatar,
      background: form.value.background,
    })

    // Store the new channel in localStorage
    const existingChannels = JSON.parse(localStorage.getItem('user_channels') || '[]')
    existingChannels.push({
      id: newChannel.id,
      name: newChannel.name,
      description: newChannel.description,
      avatar_url: newChannel.avatar_url,
      background_url: newChannel.background_url,
    })
    localStorage.setItem('user_channels', JSON.stringify(existingChannels))

    // Set the new channel as active
    localStorage.setItem('active_account', newChannel.id)
    localStorage.setItem('active_account_name', newChannel.name)
    try {
      await setDefaultChannel(newChannel.id)
    } catch (err) {
      console.error('Failed to set new channel as default:', err)
    }

    successMessage.value = t('createChannelPage.success')
    
    // Redirect to upload after 1.5 seconds
    setTimeout(() => {
      router.push(localePath('/upload'))
    }, 1500)
  } catch (err) {
    error.value = typeof err === 'string' ? err : t('createChannelPage.createError')
    console.error('Channel creation error:', err)
  } finally {
    isCreating.value = false
  }
}

definePageMeta({
  layout: 'blank',
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
