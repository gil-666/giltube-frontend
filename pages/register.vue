<template>
  <div class="fixed inset-0 bg-zinc-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-red-500 mb-2">giltube</h1>
        <p class="text-gray-400">{{ t('register.title') }}</p>
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="bg-zinc-900 rounded-lg shadow-xl p-8 space-y-6">
        <!-- Username Input -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
            {{ t('register.usernameLabel') }}
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            :placeholder="t('register.usernamePlaceholder')"
            autocomplete="username"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
        </div>

        <!-- Email Input -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            {{ t('register.emailLabel') }}
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :placeholder="t('register.emailPlaceholder')"
            autocomplete="email"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
        </div>

        <!-- Password Input -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            {{ t('register.passwordLabel') }}
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :placeholder="t('register.passwordPlaceholder')"
            autocomplete="new-password"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
          <p class="text-gray-500 text-xs mt-1">{{ t('register.passwordHint') }}</p>
        </div>

        <!-- Confirm Password Input -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
            {{ t('register.confirmPasswordLabel') }}
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            :placeholder="t('register.passwordPlaceholder')"
            autocomplete="new-password"
            style="color: white; background-color: rgb(39, 39, 42); border: 1px solid rgb(63, 63, 70); border-radius: 0.5rem; padding: 0.5rem 1rem; width: 100%;"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg text-sm">
          {{ t('register.successMessage') }}
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center text-gray-400 text-sm">
          {{ t('register.creatingAccount') }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ loading ? t('register.creatingAccount') : t('register.signUp') }}
        </button>
      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center">
        <p class="text-gray-400">
          {{ t('register.alreadyHaveAccount') }}
          <NuxtLink :to="localePath('/login')" class="text-red-500 hover:text-red-400 font-medium">
            {{ t('register.signIn') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { register } from '~/app/service/auth'
import { useMetaTags } from '~/app/composables/useMetaTags'

const { t } = useI18n()
const localePath = useLocalePath()

definePageMeta({
  layout: false
})

useMetaTags({
  title: 'Sign Up - GilTube',
  description: 'Create a new GilTube account'
})

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = false

  // Validation
  if (password.value !== confirmPassword.value) {
    error.value = t('register.passwordMismatch')
    return
  }

  if (password.value.length < 6) {
    error.value = t('register.passwordTooShort')
    return
  }

  loading.value = true

  try {
    const response = await register({
      username: username.value,
      email: email.value,
      password: password.value
    })

    success.value = true

    // Store user info & auto-login
    if (response.id && response.username) {
      localStorage.setItem('user_id', response.id)
      localStorage.setItem('email', response.email)
      localStorage.setItem('username', response.username)
      
      // Store auth token if provided
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
      }

      // Redirect to home/dashboard immediately (auto-logged in)
      setTimeout(() => {
        router.push(localePath('/'))
      }, 800)
    } else {
      error.value = 'Registration failed: Invalid response'
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || 'Failed to create account. Please try again.'
    error.value = errorMsg
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
