<template>
  <div class="min-h-screen bg-zinc-950 text-white p-6">
    <div class="mx-auto max-w-2xl space-y-6">
      <div v-if="pending && !theme" class="rounded-lg bg-zinc-900 p-6 text-gray-300">{{ t('themes.loading') }}</div>

      <div v-else-if="!theme" class="rounded-lg border border-white/[0.07] bg-zinc-900 p-8 text-center space-y-3">
        <h1 class="text-xl font-semibold">{{ t('themes.share.notFoundTitle') }}</h1>
        <p class="text-sm text-gray-400">{{ t('themes.share.notFoundBody') }}</p>
        <NuxtLink :to="localePath('/')" class="inline-block rounded bg-zinc-100 px-4 py-2 text-sm text-zinc-950 transition hover:bg-white">
          {{ t('themes.share.goHome') }}
        </NuxtLink>
      </div>

      <template v-else>
        <div>
          <p class="text-sm text-gray-400">{{ t('themes.share.eyebrow') }}</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight">{{ theme.name }}</h1>
          <p class="mt-1 text-sm text-gray-400">
            {{ t('themes.byOwner', { owner: theme.owner_username || t('themes.unknownOwner') }) }}
            <span v-if="theme.install_count > 0"> · {{ t('themes.share.installCount', { count: theme.install_count }) }}</span>
          </p>
        </div>

        <ThemePreview :colors="colors" />

        <div class="flex flex-wrap gap-2 text-xs text-gray-400">
          <span v-for="key in colorKeys" :key="key" class="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 py-1">
            <span class="h-3 w-3 rounded-full ring-1 ring-white/20" :style="{ background: colors[key] }" />
            {{ t(`themes.colors.${key}`) }} <span class="font-mono uppercase">{{ colors[key] }}</span>
          </span>
          <span v-for="extra in extras" :key="extra" class="inline-flex items-center rounded-full border border-white/[0.08] px-2.5 py-1">
            {{ extra }}
          </span>
        </div>

        <div class="rounded-lg border border-white/[0.07] bg-zinc-900 p-5 space-y-4">
          <label class="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span class="block font-medium">{{ t('themes.share.previewToggle') }}</span>
              <span class="block text-sm text-gray-400">{{ t('themes.share.previewToggleBody') }}</span>
            </span>
            <input v-model="previewOnSite" type="checkbox" class="h-5 w-5 shrink-0 accent-blue-500" />
          </label>

          <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-400' : 'text-green-400'" role="status">{{ message }}</p>

          <div class="flex flex-wrap gap-2">
            <template v-if="!signedIn">
              <NuxtLink
                :to="localePath(`/login?redirect=${encodeURIComponent(`/themes/${code}`)}`)"
                class="rounded bg-zinc-100 px-5 py-2 text-sm text-zinc-950 transition hover:bg-white"
              >
                {{ t('themes.share.signInToInstall') }}
              </NuxtLink>
            </template>
            <template v-else-if="isActive">
              <span class="rounded bg-white/10 px-4 py-2 text-sm">{{ t('themes.share.applied') }}</span>
            </template>
            <template v-else-if="installed">
              <button type="button" class="rounded bg-zinc-100 px-5 py-2 text-sm text-zinc-950 transition hover:bg-white disabled:opacity-60" :disabled="busy" @click="install(true)">
                {{ t('themes.apply') }}
              </button>
            </template>
            <template v-else>
              <button type="button" class="rounded bg-zinc-100 px-5 py-2 text-sm text-zinc-950 transition hover:bg-white disabled:opacity-60" :disabled="busy" @click="install(true)">
                {{ t('themes.share.installAndApply') }}
              </button>
              <button type="button" class="rounded border border-white/10 px-4 py-2 text-sm transition hover:bg-white/[0.06] disabled:opacity-60" :disabled="busy" @click="install(false)">
                {{ t('themes.share.installOnly') }}
              </button>
            </template>
            <NuxtLink v-if="signedIn" :to="localePath('/account-settings#themes')" class="rounded px-4 py-2 text-sm text-gray-400 transition hover:text-white">
              {{ theme.is_owner ? t('themes.share.manageYours') : t('themes.share.manageThemes') }}
            </NuxtLink>
          </div>
          <p v-if="signedIn && !theme.is_owner" class="text-xs text-gray-500">{{ t('themes.share.updatesNote') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import ThemePreview from '~/app/components/themes/ThemePreview.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { useSiteTheme } from '~/app/composables/useSiteTheme'
import { getSharedTheme, type ThemeRecord } from '~/app/service/themes'
import { DEFAULT_APPEARANCE, themeAppearanceOf, themeFontStylesheet, type ThemeAppearance, type ThemeColors } from '~/app/utils/theme'

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const siteTheme = useSiteTheme()

const code = computed(() => String(route.params.code || ''))
const colorKeys: Array<keyof ThemeColors> = ['primary', 'accent', 'background']

const { data, pending } = await useAsyncData(
  `shared-theme-${code.value}`,
  async () => {
    try {
      return await getSharedTheme(code.value)
    } catch {
      return null
    }
  },
)

const theme = ref<ThemeRecord | null>(data.value?.theme || null)
const installed = ref(!!data.value?.installed)
const signedIn = ref(false)
const busy = ref(false)
const message = ref('')
const messageIsError = ref(false)
const previewOnSite = ref(false)

const colors = computed<ThemeAppearance>(() => (theme.value ? themeAppearanceOf(theme.value) : DEFAULT_APPEARANCE))

// Extras beyond the three colors, listed so visitors know what they'd get.
const extras = computed(() => {
  const style = colors.value.style
  const items: string[] = []
  if (colors.value.backgroundImage) items.push(t('themes.share.extras.image'))
  if (style.gradient_color) items.push(t('themes.share.extras.gradient'))
  if (style.font !== 'inter') items.push(t('themes.share.extras.font', { font: t(`themes.fonts.${style.font}`) }))
  if (style.corners !== 'default') items.push(t('themes.share.extras.corners', { corners: t(`themes.corners.${style.corners}`) }))
  if (style.effect !== 'none') items.push(t('themes.share.extras.effect', { effect: t(`themes.effects.${style.effect}`) }))
  return items
})

useHead({
  link: computed(() => {
    const href = themeFontStylesheet(colors.value.style)
    return href ? [{ key: 'shared-theme-font', rel: 'stylesheet', href }] : []
  }),
})
const isActive = computed(() => !!theme.value && siteTheme.active.value.id === theme.value.id)

useMetaTags({
  title: theme.value ? `${theme.value.name} - GilTube theme` : 'Theme - GilTube',
  description: theme.value
    ? `A GilTube theme by ${theme.value.owner_username || 'a GilTube user'}. Preview it and add it to your account.`
    : 'Preview and install GilTube themes.',
})

watch(previewOnSite, (enabled) => {
  siteTheme.setPreview(enabled && !isActive.value ? colors.value : null)
})

const install = async (activate: boolean) => {
  if (!theme.value) return
  busy.value = true
  message.value = ''
  try {
    if (installed.value) {
      await siteTheme.apply(theme.value)
    } else {
      await siteTheme.install(theme.value.share_code, activate)
      installed.value = true
      theme.value = { ...theme.value, install_count: theme.value.install_count + (theme.value.is_owner ? 0 : 1) }
    }
    previewOnSite.value = false
    message.value = activate ? t('themes.share.appliedMessage') : t('themes.installed', { name: theme.value.name })
    messageIsError.value = false
  } catch (error: any) {
    messageIsError.value = true
    message.value = error?.response?.data?.error === 'theme limit reached' ? t('themes.errors.limit') : t('themes.errors.install')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  signedIn.value = !!localStorage.getItem('user_id')
  if (!signedIn.value || !theme.value) return
  // The server render was anonymous; refresh to learn whether this account
  // already has the theme.
  try {
    const result = await getSharedTheme(code.value)
    theme.value = result.theme
    installed.value = result.installed
  } catch {
    // Keep the anonymous view.
  }
})

onBeforeUnmount(() => {
  siteTheme.setPreview(null)
})
</script>
