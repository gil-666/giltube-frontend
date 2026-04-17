<template>
  <div class="fixed inset-0 bg-zinc-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Back Button -->
      <div class="mb-6">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </NuxtLink>
      </div>

      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-red-500 mb-2">giltube</h1>
        <p class="text-gray-400">Sign in to your account</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="bg-zinc-900 rounded-lg shadow-xl p-8 space-y-6">
        <!-- Email Input -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            autocomplete="email"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
        </div>

        <!-- Password Input -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="current-password"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center text-gray-400 text-sm">
          Signing in...
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Register Link -->
      <div class="mt-6 text-center">
        <p class="text-gray-400">
          Don't have an account?
          <NuxtLink to="/register" class="text-red-500 hover:text-red-400 font-medium">
            Sign up
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '~/app/service/auth'
import { fetchUserChannels } from '~/app/service/upload'
import { useMetaTags } from '~/app/composables/useMetaTags'

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

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const response = await login({
      email: email.value,
      password: password.value
    })

    // Store user_id in localStorage
    if (response.user_id) {
      localStorage.setItem('user_id', response.user_id)
      localStorage.setItem('email', email.value || '')
      const username = (email.value || '').split('@')[0] || ''
      localStorage.setItem('username', username)

      // Fetch channels immediately
      try {
        await fetchUserChannels(response.user_id)
      } catch (err) {
        console.error('Failed to fetch channels:', err)
      }

      // Redirect to home page
      router.push('/')
    } else {
      error.value = 'Login failed: No user ID returned'
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to sign in. Please try again.'
  } finally {
    loading.value = false
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
