<template>
  <div class="fixed inset-0 flex items-center justify-center overflow-y-auto bg-zinc-950 p-4">
    <div class="w-full max-w-sm py-10">
      <!-- Logo/Header -->
      <div class="mb-8">
        <NuxtLink :to="localePath('/')" aria-label="GilTube"><img src="../assets/logowhsmall.png" alt="GilTube" class="h-8 w-auto" /></NuxtLink>
        <h1 class="mt-8 text-2xl font-semibold tracking-tight">{{ t('register.title') }}</h1>
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="space-y-4">
        <!-- Username Input -->
        <div>
          <label for="username" class="gt-label">
            {{ t('register.usernameLabel') }}
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            :placeholder="t('register.usernamePlaceholder')"
            autocomplete="username"
            class="gt-input"
          />
        </div>

        <!-- Email Input -->
        <div>
          <label for="email" class="gt-label">
            {{ t('register.emailLabel') }}
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :placeholder="t('register.emailPlaceholder')"
            autocomplete="email"
            class="gt-input"
          />
        </div>

        <!-- Password Input -->
        <div>
          <label for="password" class="gt-label">
            {{ t('register.passwordLabel') }}
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :placeholder="t('register.passwordPlaceholder')"
            autocomplete="new-password"
            class="gt-input"
          />
          <p class="mt-1.5 text-xs text-zinc-500">{{ t('register.passwordHint') }}</p>
        </div>

        <!-- Confirm Password Input -->
        <div>
          <label for="confirmPassword" class="gt-label">
            {{ t('register.confirmPasswordLabel') }}
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            :placeholder="t('register.passwordPlaceholder')"
            autocomplete="new-password"
            class="gt-input"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="gt-alert">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="gt-alert gt-alert--success">
          {{ t('register.successMessage') }}
        </div>

        <!-- Loading State -->

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="gt-button gt-button--primary w-full"
        >
          {{ loading ? t('register.creatingAccount') : t('register.signUp') }}
        </button>
      </form>

      <!-- Login Link -->
      <div class="mt-6">
        <p class="text-sm text-zinc-400">
          {{ t('register.alreadyHaveAccount') }}
          <NuxtLink :to="localePath('/login')" class="font-medium text-white underline-offset-4 hover:underline">
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
