<template>
  <div class="fixed inset-0 bg-zinc-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="mb-6">
        <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ t('login.backToHome') }}
        </NuxtLink>
      </div>

      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-red-500 mb-2">giltube</h1>
        <p class="text-gray-400">{{ t('login.title') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="bg-zinc-900 rounded-lg shadow-xl p-8 space-y-6">
        <button
          type="button"
          :disabled="loading || passkeyLoading || gilidLoading"
          @click="handleGilIDLogin"
          class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 text-slate-950 disabled:text-white font-semibold py-3 px-4 transition duration-200"
        >
          <img src="../assets/gilservices-logo.png" alt="" class="h-5 w-5 object-contain" />
          <span v-if="gilidSessionProfile" class="flex flex-col items-start leading-tight text-left">
            <span>{{ gilidLoading ? t('login.redirectingGilid') : t('login.continueAs', { username: gilidSessionProfile.username }) }}</span>
            <span class="text-xs font-medium text-slate-800/80">{{ gilidSessionProfile.email }}</span>
          </span>
          <span v-else>
            {{ gilidLoading ? t('login.redirectingGilid') : t('login.signInWithGilid') }}
          </span>
        </button>

        <button
          v-if="gilidSessionProfile"
          type="button"
          :disabled="loading || passkeyLoading || gilidLoading || gilidSwitching"
          class="w-full text-center text-sm text-cyan-300 hover:text-cyan-200 transition"
          @click="handleGilIDSwitchAccount"
        >
          {{ gilidSwitching ? t('login.switchingGilid') : t('login.switchAccountGilid') }}
        </button>

        <div class="flex items-center gap-3 text-xs text-gray-500">
          <div class="h-px flex-1 bg-zinc-700" />
          <span>{{ t('login.or') }}</span>
          <div class="h-px flex-1 bg-zinc-700" />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            {{ t('login.emailLabel') }}
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :placeholder="t('login.emailPlaceholder')"
            autocomplete="email"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            {{ t('login.passwordLabel') }}
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :placeholder="t('login.passwordPlaceholder')"
            autocomplete="current-password"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
        </div>

        <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div v-if="loading" class="text-center text-gray-400 text-sm">
          {{ t('login.signingIn') }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ loading ? t('login.signingIn') : t('login.signIn') }}
        </button>

        <button
          type="button"
          :disabled="loading || passkeyLoading || gilidLoading"
          @click="handlePasskeyLogin"
          class="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ passkeyLoading ? t('login.waitingForPasskey') : t('login.usePasskey') }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-400">
          {{ t('login.dontHaveAccount') }}
          <NuxtLink :to="localePath('/register')" class="text-red-500 hover:text-red-400 font-medium">
            {{ t('login.signUp') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { beginGilIDAuth, beginPasskeyLogin, finishPasskeyLogin, getGilIDSessionProfile, login, logoutGilIDSession } from '~/app/service/auth'
import { fetchUserChannels } from '~/app/service/upload'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { prepareCredentialRequestOptions, serializeAuthenticationCredential, supportsWebAuthn } from '~/app/service/webauthn'

const { t } = useI18n()
const localePath = useLocalePath()

definePageMeta({
  layout: false
})

useMetaTags({
  title: 'Sign In - GilTube',
  description: 'Sign in to your GilTube account'
})

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const passkeyLoading = ref(false)
const gilidLoading = ref(false)
const gilidSwitching = ref(false)
const gilidSessionProfile = ref<Awaited<ReturnType<typeof getGilIDSessionProfile>>>(null)

onMounted(async () => {
  gilidSessionProfile.value = await getGilIDSessionProfile()
})

const persistLogin = async (response: any, fallbackEmail: string) => {
  localStorage.setItem('user_id', response.user_id)
  localStorage.setItem('email', response.email || fallbackEmail || '')
  const username = response.username || ((response.email || fallbackEmail || '').split('@')[0] || '')
  localStorage.setItem('username', username)

  try {
    await fetchUserChannels(response.user_id)
  } catch (err) {
    console.error('Failed to fetch channels:', err)
  }

  router.push(localePath('/'))
}

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const response = await login({
      email: email.value,
      password: password.value
    })

    if (response.user_id) {
      await persistLogin(response, email.value)
    } else {
      error.value = 'Login failed: No user ID returned'
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}

const handlePasskeyLogin = async () => {
  error.value = ''

  if (!supportsWebAuthn()) {
    error.value = 'Passkeys are not supported in this browser.'
    return
  }

  passkeyLoading.value = true
  try {
    const begin = await beginPasskeyLogin()
    const publicKey = prepareCredentialRequestOptions(begin.options.publicKey)

    const credential = await navigator.credentials.get({
      publicKey,
      mediation: 'optional'
    })

    if (!credential) {
      throw new Error('No credential returned by authenticator')
    }

    const payload = serializeAuthenticationCredential(credential as PublicKeyCredential)
    const response = await finishPasskeyLogin(begin.session_token, payload)

    if (response.user_id) {
      await persistLogin(response, response.email || email.value)
      return
    }

    error.value = 'Passkey login failed: No user ID returned'
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Passkey login failed'
  } finally {
    passkeyLoading.value = false
  }
}

const handleGilIDLogin = async () => {
  error.value = ''
  gilidLoading.value = true

  try {
    const response = await beginGilIDAuth('login', '/')
    window.location.href = response.authorize_url
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Failed to redirect to GILid.'
    gilidLoading.value = false
  }
}

const handleGilIDSwitchAccount = async () => {
  error.value = ''
  gilidSwitching.value = true

  try {
    await logoutGilIDSession()
    gilidSessionProfile.value = null
    const response = await beginGilIDAuth('login', '/')
    window.location.href = response.authorize_url
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to switch GILid account.'
    gilidSwitching.value = false
  }
}
</script>

<style scoped>
input {
  color: white;
}

input::placeholder {
  color: #a0aec0;
}

input:autofill,
input:autofill:hover,
input:autofill:focus,
input:autofill:active {
  -webkit-box-shadow: 0 0 0 30px #374151 inset !important;
  box-shadow: 0 0 0 30px #374151 inset !important;
  -webkit-text-fill-color: white !important;
}
</style>
