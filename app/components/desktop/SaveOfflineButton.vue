<template>
  <div v-if="hasDesktopDownloads" ref="rootRef" class="relative">
    <button
      type="button"
      class="watch-action-button watch-pill"
      :title="buttonTitle"
      @click="handleClick"
    >
      <svg v-if="saved" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
      <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      <span>{{ label }}</span>
    </button>

    <div
      v-if="menuOpen"
      class="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 p-1 shadow-2xl shadow-black/60"
      role="menu"
    >
      <p class="px-3 pb-1 pt-2 text-xs text-zinc-400">{{ t('desktop.chooseQuality') }}</p>
      <p v-if="loadingQualities" class="px-3 py-2 text-sm text-zinc-400">{{ t('desktop.loading') }}</p>
      <button
        v-for="quality in qualityOptions"
        :key="quality"
        type="button"
        role="menuitem"
        class="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 transition hover:bg-white/[0.06]"
        @click="save(quality)"
      >
        {{ quality === 'best' ? t('desktop.bestQuality') : quality }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDesktopApp } from '~/app/composables/useDesktopApp'

const props = defineProps<{ videoId: string, title?: string }>()
const { t } = useI18n()
const { bridge, hasDesktopDownloads, activeDownloads, libraryVersion, openDownloads } = useDesktopApp()

const rootRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const loadingQualities = ref(false)
const qualityOptions = ref<string[]>([])
const saved = ref(false)

const active = computed(() => activeDownloads.value.find((item) => item.id === props.videoId) || null)
const percent = computed(() => {
  const item = active.value
  return item?.total ? Math.min(100, Math.round((item.received / item.total) * 100)) : 0
})

const label = computed(() => {
  const item = active.value
  if (item?.status === 'error') return t('desktop.retrySave')
  if (item?.status === 'downloading') return t('desktop.saving', { percent: percent.value })
  if (item) return t('desktop.preparing')
  return saved.value ? t('desktop.savedOffline') : t('desktop.saveOffline')
})

const buttonTitle = computed(() => active.value?.message || label.value)

const checkSaved = async () => {
  if (!bridge.value || !props.videoId) return
  saved.value = Boolean(await bridge.value.downloads.get(props.videoId).catch(() => null))
}

const openMenu = async () => {
  if (!bridge.value) return
  menuOpen.value = true
  loadingQualities.value = true
  try {
    const qualities = await bridge.value.downloads.qualities(props.videoId)
    qualityOptions.value = ['best', ...qualities.filter((quality) => quality !== 'best')]
  } catch {
    qualityOptions.value = ['best']
  } finally {
    loadingQualities.value = false
  }
}

const save = async (quality: string) => {
  menuOpen.value = false
  await bridge.value?.downloads.start(props.videoId, quality, props.title || '')
}

const handleClick = () => {
  const item = active.value
  if (item?.status === 'error') {
    void save(item.quality)
  } else if (item || saved.value) {
    // In progress or saved: the app's Downloads page shows (and plays) it.
    void openDownloads(saved.value && !item ? props.videoId : undefined)
  } else if (menuOpen.value) {
    menuOpen.value = false
  } else {
    void openMenu()
  }
}

const closeOnOutsideClick = (event: MouseEvent) => {
  if (menuOpen.value && rootRef.value && !rootRef.value.contains(event.target as Node)) menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
  void checkSaved()
})
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))
watch([bridge, libraryVersion, () => props.videoId], () => void checkSaved())
</script>
