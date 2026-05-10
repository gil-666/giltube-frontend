<template>
  <Teleport v-if="show" to="body">
    <div class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-75">
      <div class="mx-4 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-8 shadow-2xl">
        <div class="mb-8 text-center">
          <h1 class="mb-2 text-3xl font-bold text-white">{{ t('modal.welcomeTitle') }}</h1>
          <p class="text-gray-400">{{ t('modal.selectLanguage') }}</p>
        </div>

        <div class="space-y-4">
          <button
            class="group flex w-full items-center justify-center gap-3 rounded-lg bg-red-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
            @click="selectLocale('en')"
          >
            <span class="text-3xl transition-transform group-hover:scale-110">🇺🇸</span>
            <span>English (US)</span>
          </button>

          <button
            class="group flex w-full items-center justify-center gap-3 rounded-lg bg-red-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700"
            @click="selectLocale('es')"
          >
            <span class="text-3xl transition-transform group-hover:scale-110">🇲🇽</span>
            <span>Español (México)</span>
          </button>
        </div>

        <p class="mt-6 text-center text-xs text-gray-500">{{ t('modal.canChangeAnytime') }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const { t, setLocale } = useI18n()
const emit = defineEmits(['close'])
const show = ref(false)

const LOCALE_SELECTION_KEY = 'gilTube_locale_selected'

const selectLocale = async (locale) => {
  const localeCookie = useCookie('gilTube_locale')
  localeCookie.value = locale

  await setLocale(locale)

  if (process.client) {
    localStorage.setItem(LOCALE_SELECTION_KEY, locale)
  }

  show.value = false
  emit('close')
}

const checkAndShow = () => {
  if (!process.client) return

  const hasExplicitSelection = !!localStorage.getItem(LOCALE_SELECTION_KEY)

  // Browser-language detection may set the locale cookie before the user chooses.
  // We only suppress the modal after an explicit user selection.
  if (!hasExplicitSelection) {
    show.value = true
  }
}

onMounted(() => {
  checkAndShow()
})
</script>
