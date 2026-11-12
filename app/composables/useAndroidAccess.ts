import { computed, ref } from 'vue'
import { getAndroidAccess, signupAndroidTester, type AndroidAccess } from '~/app/service/apps'

// Android closed-testing status, shared by the Download app page and the
// sidebar's "Get the app" link. The sign-up token is kept in this browser so
// people who aren't signed in can follow their request too.

const TOKEN_KEY = 'giltube-android-tester'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gilservers.giltube'

const access = ref<AndroidAccess | null>(null)
const loading = ref(false)
let pending: Promise<void> | null = null

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

const keep = (value: AndroidAccess) => {
  access.value = value
  if (value.token) {
    try {
      localStorage.setItem(TOKEN_KEY, value.token)
    } catch {
      // Only this visit then.
    }
  }
}

export const useAndroidAccess = () => {
  const refresh = () => {
    if (!import.meta.client) return Promise.resolve()
    if (pending) return pending
    loading.value = !access.value
    pending = getAndroidAccess(readToken() || undefined)
      .then(keep)
      .catch(() => {})
      .finally(() => {
        loading.value = false
        pending = null
      })
    return pending
  }

  const signup = async (email: string) => {
    const value = await signupAndroidTester(email)
    keep(value)
    return value
  }

  const state = computed(() => access.value?.state || 'none')
  // Accepted testers (and people who already have the app) go straight to Google Play.
  const canInstall = computed(() => state.value === 'accepted' || state.value === 'installed')
  const storeURL = computed(() => access.value?.store_url || PLAY_STORE_URL)

  return { access, loading, state, canInstall, storeURL, refresh, signup }
}
