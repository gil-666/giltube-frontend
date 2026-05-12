<template>
  <div class="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
    <div class="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{{ t('login.gilidNetworkBadge') }}</p>
      <h1 class="mt-3 text-3xl font-bold text-white">{{ t('login.callbackTitle') }}</h1>
      <p class="mt-3 text-sm text-zinc-300">{{ message }}</p>

      <div v-if="error" class="mt-5 rounded-lg border border-red-700 bg-red-950/50 px-4 py-3 text-sm text-red-200">
        {{ error }}
      </div>

      <div v-if="error" class="mt-5">
        <NuxtLink :to="localePath('/login')" class="inline-flex rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400">
          {{ t('login.backToLogin') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { completeGilIDAuth } from '~/app/service/auth'
import { fetchUserChannels } from '~/app/service/upload'

definePageMeta({
  layout: 'blank'
})

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()

const error = ref('')
const currentStep = ref<'processing' | 'redirecting' | 'error'>('processing')

const message = computed(() => {
  if (error.value) return error.value
  if (currentStep.value === 'redirecting') return t('login.callbackRedirecting')
  return t('login.callbackProcessing')
})

const persistLogin = async (response: any) => {
  localStorage.setItem('user_id', response.user_id)
  localStorage.setItem('email', response.email || '')
  localStorage.setItem('username', response.username || ((response.email || '').split('@')[0] || ''))

  try {
    await fetchUserChannels(response.user_id)
  } catch (err) {
    console.error('Failed to fetch channels:', err)
  }
}

onMounted(async () => {
  const code = String(route.query.code || '').trim()
  const state = String(route.query.state || '').trim()
  const providerError = String(route.query.error || '').trim()

  if (providerError) {
    error.value = providerError
    currentStep.value = 'error'
    return
  }

  if (!code || !state) {
    error.value = t('login.callbackMissingCode')
    currentStep.value = 'error'
    return
  }

  try {
    const response = await completeGilIDAuth(code, state)
    await persistLogin(response)

    currentStep.value = 'redirecting'
    const destination = response.return_to?.startsWith('/') ? response.return_to : '/'
    await router.replace(localePath(destination))
  } catch (err: any) {
    error.value = err?.response?.data?.error || t('login.callbackError')
    currentStep.value = 'error'
  }
})
</script>
