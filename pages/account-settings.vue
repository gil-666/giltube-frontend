<template>
  <div class="min-h-screen bg-zinc-950 text-white p-6">
    <div class="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 class="text-4xl font-bold mb-2">{{ t('accountSettings.title') }}</h1>
        <p class="text-gray-400">{{ t('accountSettings.subtitle') }}</p>
      </div>

      <div v-if="isLoading" class="bg-zinc-900 rounded-lg p-6 text-gray-300">
        {{ t('accountSettings.loading') }}
      </div>

      <div v-else class="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <h2 class="text-xl font-semibold mb-4">{{ t('accountSettings.profile') }}</h2>
        <div class="space-y-2 text-sm">
          <p><span class="text-gray-500">{{ t('accountSettings.username') }}</span> {{ profile.username }}</p>
          <p><span class="text-gray-500">{{ t('accountSettings.currentEmail') }}</span> {{ profile.email }}</p>
          <p><span class="text-gray-500">{{ t('accountSettings.status') }}</span> {{ profile.status }}</p>
        </div>
      </div>

      <form @submit.prevent="submitEmailChange" class="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-4">
        <h2 class="text-xl font-semibold">{{ t('accountSettings.changeEmail') }}</h2>

        <div>
          <label class="block text-sm text-gray-300 mb-2" for="newEmail">{{ t('accountSettings.newEmail') }}</label>
          <input
            id="newEmail"
            v-model="newEmail"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded bg-zinc-800 border border-zinc-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2" for="emailPassword">{{ t('accountSettings.currentPassword') }}</label>
          <input
            id="emailPassword"
            v-model="emailPassword"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded bg-zinc-800 border border-zinc-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <p v-if="emailMessage" class="text-sm" :class="emailError ? 'text-red-400' : 'text-green-400'">{{ emailMessage }}</p>

        <button
          type="submit"
          :disabled="emailSaving"
          class="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 transition"
        >
          {{ emailSaving ? t('accountSettings.updatingEmail') : t('accountSettings.updateEmail') }}
        </button>
      </form>

      <form @submit.prevent="submitPasswordChange" class="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-4">
        <h2 class="text-xl font-semibold">{{ t('accountSettings.changePassword') }}</h2>

        <div>
          <label class="block text-sm text-gray-300 mb-2" for="currentPassword">{{ t('accountSettings.currentPassword') }}</label>
          <input
            id="currentPassword"
            v-model="currentPassword"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded bg-zinc-800 border border-zinc-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2" for="newPassword">{{ t('accountSettings.newPassword') }}</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            class="w-full rounded bg-zinc-800 border border-zinc-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2" for="confirmPassword">{{ t('accountSettings.confirmNewPassword') }}</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            autocomplete="new-password"
            class="w-full rounded bg-zinc-800 border border-zinc-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <p v-if="passwordMessage" class="text-sm" :class="passwordError ? 'text-red-400' : 'text-green-400'">{{ passwordMessage }}</p>

        <button
          type="submit"
          :disabled="passwordSaving"
          class="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 transition"
        >
          {{ passwordSaving ? t('accountSettings.updatingPassword') : t('accountSettings.updatePassword') }}
        </button>
      </form>

      <div id="passkeys" class="bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">{{ t('accountSettings.passkeys') }}</h2>
            <p class="text-sm text-gray-400">{{ t('accountSettings.passkeysHelper') }}</p>
          </div>
          <button
            @click="registerPasskey"
            :disabled="passkeySaving"
            class="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 transition"
          >
            {{ passkeySaving ? t('accountSettings.waiting') : t('accountSettings.addPasskey') }}
          </button>
        </div>

        <p v-if="passkeyMessage" class="text-sm" :class="passkeyError ? 'text-red-400' : 'text-green-400'">{{ passkeyMessage }}</p>

        <div v-if="!supportsPasskeys" class="text-sm text-yellow-300 bg-yellow-900/40 border border-yellow-700 rounded p-3">
          {{ t('accountSettings.passkeyUnsupported') }}
        </div>

        <div v-if="passkeys.length === 0" class="text-sm text-gray-400">
          {{ t('accountSettings.noPasskeys') }}
        </div>

        <div v-else class="space-y-3">
          <div v-for="item in passkeys" :key="item.id" class="flex items-center justify-between rounded border border-zinc-700 px-4 py-3">
            <div>
              <p class="font-medium">{{ item.name }}</p>
              <p class="text-xs text-gray-400">{{ t('accountSettings.addedDate', { date: formatDate(item.created_at) }) }}</p>
              <p v-if="item.last_used_at" class="text-xs text-gray-500">{{ t('accountSettings.lastUsed', { date: formatDate(item.last_used_at) }) }}</p>
            </div>
            <button
              @click="removePasskey(item.id)"
              :disabled="passkeyDeletingId === item.id"
              class="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60 transition text-sm"
            >
              {{ passkeyDeletingId === item.id ? t('accountSettings.removingPasskey') : t('accountSettings.removePasskey') }}
            </button>
          </div>
        </div>
      </div>

      <div class="bg-zinc-900 rounded-lg p-6 border border-red-800 space-y-4">
        <h2 class="text-xl font-semibold text-red-300">{{ t('accountSettings.deleteAccount') }}</h2>
        <p class="text-sm text-red-200">
          {{ t('accountSettings.deleteMessage') }}
        </p>

        <div>
          <label class="block text-sm text-gray-300 mb-2" for="deletePassword">{{ t('accountSettings.currentPassword') }}</label>
          <input
            id="deletePassword"
            v-model="deletePassword"
            type="password"
            autocomplete="current-password"
            class="w-full rounded bg-zinc-800 border border-zinc-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-300 mb-2" for="deleteConfirm">{{ t('accountSettings.typeDelete') }}</label>
          <input
            id="deleteConfirm"
            v-model="deleteConfirmText"
            type="text"
            class="w-full rounded bg-zinc-800 border border-zinc-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <p v-if="deleteMessage" class="text-sm" :class="deleteError ? 'text-red-400' : 'text-green-400'">{{ deleteMessage }}</p>

        <button
          @click="submitDeleteAccount"
          :disabled="deleteSaving"
          class="px-5 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60 transition"
        >
          {{ deleteSaving ? t('accountSettings.deleting') : t('accountSettings.deleteButton') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import {
  beginPasskeyRegistration,
  deleteMyAccount,
  deleteMyPasskey,
  finishPasskeyRegistration,
  getMyAccount,
  listMyPasskeys,
  updateMyEmail,
  updateMyPassword
} from '~/app/service/auth'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { prepareCredentialCreationOptions, serializeRegistrationCredential, supportsWebAuthn } from '~/app/service/webauthn'

useMetaTags({
  title: 'Account Settings - GilTube',
  description: 'Manage your GilTube account settings'
})

const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()

const isLoading = ref(true)
const profile = ref({
  id: '',
  username: '',
  email: '',
  status: ''
})

const newEmail = ref('')
const emailPassword = ref('')
const emailSaving = ref(false)
const emailMessage = ref('')
const emailError = ref(false)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSaving = ref(false)
const passwordMessage = ref('')
const passwordError = ref(false)

const deletePassword = ref('')
const deleteConfirmText = ref('')
const deleteSaving = ref(false)
const deleteMessage = ref('')
const deleteError = ref(false)

const supportsPasskeys = supportsWebAuthn()
const passkeys = ref<Array<{ id: string; name: string; created_at: string; last_used_at: string | null }>>([])
const passkeySaving = ref(false)
const passkeyDeletingId = ref('')
const passkeyMessage = ref('')
const passkeyError = ref(false)

onMounted(async () => {
  const userId = localStorage.getItem('user_id')
  if (!userId) {
    router.push(localePath('/login'))
    return
  }

  await loadProfile()
  if (supportsPasskeys) {
    await loadPasskeys()
  }
})

const formatDate = (value: string) => {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

const loadProfile = async () => {
  isLoading.value = true
  try {
    const data = await getMyAccount()
    profile.value = {
      id: data.id,
      username: data.username,
      email: data.email,
      status: data.status
    }
    newEmail.value = data.email
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 401) {
      router.push(localePath('/login'))
      return
    }
    emailMessage.value = error?.response?.data?.error || t('accountSettings.loadError')
    emailError.value = true
  } finally {
    isLoading.value = false
  }
}

const submitEmailChange = async () => {
  emailMessage.value = ''
  emailError.value = false

  if (!newEmail.value.trim()) {
    emailMessage.value = t('accountSettings.emailRequired')
    emailError.value = true
    return
  }

  if (!emailPassword.value) {
    emailMessage.value = t('accountSettings.currentPasswordRequired')
    emailError.value = true
    return
  }

  emailSaving.value = true
  try {
    const response = await updateMyEmail({
      email: newEmail.value,
      current_password: emailPassword.value
    })

    localStorage.setItem('email', response.email)
    profile.value.email = response.email
    emailPassword.value = ''
    emailMessage.value = t('accountSettings.emailSuccess')
  } catch (error: any) {
    emailMessage.value = error?.response?.data?.error || t('accountSettings.emailError')
    emailError.value = true
  } finally {
    emailSaving.value = false
  }
}

const submitPasswordChange = async () => {
  passwordMessage.value = ''
  passwordError.value = false

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordMessage.value = t('accountSettings.passwordRequired')
    passwordError.value = true
    return
  }

  if (newPassword.value.length < 6) {
    passwordMessage.value = t('accountSettings.passwordTooShort')
    passwordError.value = true
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordMessage.value = t('accountSettings.passwordMismatch')
    passwordError.value = true
    return
  }

  passwordSaving.value = true
  try {
    await updateMyPassword({
      current_password: currentPassword.value,
      new_password: newPassword.value
    })

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordMessage.value = t('accountSettings.passwordSuccess')
  } catch (error: any) {
    passwordMessage.value = error?.response?.data?.error || t('accountSettings.passwordUpdateError')
    passwordError.value = true
  } finally {
    passwordSaving.value = false
  }
}

const loadPasskeys = async () => {
  try {
    passkeys.value = await listMyPasskeys()
  } catch (error: any) {
    passkeyMessage.value = error?.response?.data?.error || t('accountSettings.passkeysLoadError')
    passkeyError.value = true
  }
}

const registerPasskey = async () => {
  passkeyMessage.value = ''
  passkeyError.value = false

  if (!supportsPasskeys) {
    passkeyMessage.value = t('accountSettings.passkeyUnsupported')
    passkeyError.value = true
    return
  }

  passkeySaving.value = true
  try {
    const label = `Passkey (${new Date().toLocaleDateString()})`
    const begin = await beginPasskeyRegistration(label)
    const publicKey = prepareCredentialCreationOptions(begin.options.publicKey)

    const credential = await navigator.credentials.create({ publicKey })
    if (!credential) {
      throw new Error(t('accountSettings.passkeyCredentialMissing'))
    }

    const payload = serializeRegistrationCredential(credential as PublicKeyCredential)
    await finishPasskeyRegistration(begin.session_token, payload)

    passkeyMessage.value = t('accountSettings.passkeyRegistered')
    await loadPasskeys()
  } catch (error: any) {
    passkeyMessage.value = error?.response?.data?.error || error?.message || t('accountSettings.passkeyRegisterError')
    passkeyError.value = true
  } finally {
    passkeySaving.value = false
  }
}

const removePasskey = async (id: string) => {
  passkeyMessage.value = ''
  passkeyError.value = false
  passkeyDeletingId.value = id

  try {
    await deleteMyPasskey(id)
    passkeys.value = passkeys.value.filter(item => item.id !== id)
    passkeyMessage.value = t('accountSettings.passkeyRemoved')
  } catch (error: any) {
    passkeyMessage.value = error?.response?.data?.error || t('accountSettings.passkeyRemoveError')
    passkeyError.value = true
  } finally {
    passkeyDeletingId.value = ''
  }
}

const submitDeleteAccount = async () => {
  deleteMessage.value = ''
  deleteError.value = false

  if (!deletePassword.value) {
    deleteMessage.value = t('accountSettings.currentPasswordRequired')
    deleteError.value = true
    return
  }

  if (deleteConfirmText.value.trim().toUpperCase() !== 'DELETE') {
    deleteMessage.value = t('accountSettings.deleteTypeError')
    deleteError.value = true
    return
  }

  const ok = window.confirm(t('accountSettings.deleteConfirmPrompt'))
  if (!ok) {
    return
  }

  deleteSaving.value = true
  try {
    await deleteMyAccount({ current_password: deletePassword.value })

    localStorage.removeItem('user_id')
    localStorage.removeItem('email')
    localStorage.removeItem('username')
    localStorage.removeItem('user_channels')
    localStorage.removeItem('active_account')
    localStorage.removeItem('active_account_name')

    router.push(localePath('/'))
    window.location.reload()
  } catch (error: any) {
    deleteMessage.value = error?.response?.data?.error || t('accountSettings.deleteError')
    deleteError.value = true
  } finally {
    deleteSaving.value = false
  }
}
</script>
