<template>
  <div class="fixed inset-0 flex items-center justify-center overflow-y-auto bg-zinc-950 p-4">
    <div class="w-full max-w-sm py-10">
      <div class="mb-6">
        <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-white">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ t('login.backToHome') }}
        </NuxtLink>
      </div>

      <div class="mb-8">
        <img src="../assets/logowhsmall.png" alt="GilTube" class="h-8 w-auto" />
        <h1 class="mt-8 text-2xl font-semibold tracking-tight">{{ t('login.title') }}</h1>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <button
          type="button"
          :disabled="loading || passkeyLoading || gilidLoading"
          @click="handleGilIDLogin"
          class="gt-button gt-button--secondary w-full"
        >
          <img src="../assets/gilservices-logo.png" alt="" class="h-5 w-5 object-contain" />
          <span v-if="gilidSessionProfile" class="flex flex-col items-start leading-tight text-left">
            <span>{{ gilidLoading ? t('login.redirectingGilid') : t('login.continueAs', { username: gilidSessionProfile.username }) }}</span>
            <span class="text-xs font-medium text-zinc-400">{{ gilidSessionProfile.email }}</span>
          </span>
          <span v-else>
            {{ gilidLoading ? t('login.redirectingGilid') : t('login.signInWithGilid') }}
          </span>
        </button>

        <button
          v-if="gilidSessionProfile"
          type="button"
          :disabled="loading || passkeyLoading || gilidLoading || gilidSwitching"
          class="w-full text-center text-sm text-zinc-400 transition hover:text-white"
          @click="handleGilIDSwitchAccount"
        >
          {{ gilidSwitching ? t('login.switchingGilid') : t('login.switchAccountGilid') }}
        </button>

        <div class="flex items-center gap-3 py-1 text-xs text-zinc-600">
          <div class="h-px flex-1 bg-white/[0.08]" />
          <span>{{ t('login.or') }}</span>
          <div class="h-px flex-1 bg-white/[0.08]" />
        </div>

        <div>
          <label for="email" class="gt-label">
            {{ t('login.emailLabel') }}
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :placeholder="t('login.emailPlaceholder')"
            autocomplete="email"
            class="gt-input"
          />
        </div>

        <div>
          <label for="password" class="gt-label">
            {{ t('login.passwordLabel') }}
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :placeholder="t('login.passwordPlaceholder')"
            autocomplete="current-password"
            class="gt-input"
          />
        </div>

        <div v-if="error" class="gt-alert">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="gt-button gt-button--primary w-full"
        >
          {{ loading ? t('login.signingIn') : t('login.signIn') }}
        </button>

        <button
          type="button"
          :disabled="loading || passkeyLoading || gilidLoading"
          @click="handlePasskeyLogin"
          class="gt-button gt-button--secondary w-full"
        >
          {{ passkeyLoading ? t('login.waitingForPasskey') : t('login.usePasskey') }}
        </button>
      </form>

      <div class="mt-6">
        <p class="text-sm text-zinc-400">
          {{ t('login.dontHaveAccount') }}
          <NuxtLink :to="localePath('/register')" class="font-medium text-white underline-offset-4 hover:underline">
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
import { useMetaTags } from '~/app/composables/useMetaTags'
import { prepareCredentialRequestOptions, serializeAuthenticationCredential, supportsWebAuthn } from '~/app/service/webauthn'
import { persistAuthSession } from '~/app/utils/authSession'

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

const completeLogin = async (response: Parameters<typeof persistAuthSession>[0], fallbackEmail: string) => {
  await persistAuthSession(response, fallbackEmail)
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
      await completeLogin(response, email.value)
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
      await completeLogin(response, response.email || email.value)
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
