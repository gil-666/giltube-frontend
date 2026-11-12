<template>
  <div v-if="hasDesktopDownloads" ref="rootRef" class="relative">
    <button
      type="button"
      class="watch-action-button watch-pill save-offline"
      :class="{ 'is-active': saved && !active, 'is-busy': Boolean(active) && active?.status !== 'error' }"
      :style="active?.status === 'downloading' ? { '--save-progress': `${percent}%` } : undefined"
      :title="buttonTitle"
      :aria-expanded="menu !== null"
      aria-haspopup="menu"
      @click="handleClick"
    >
      <!-- Saving: a ring that fills as it downloads -->
      <svg v-if="active && active.status !== 'error'" class="h-5 w-5 -rotate-90" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-opacity="0.2" stroke-width="2.5" />
        <circle
          cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" pathLength="100"
          :stroke-dasharray="active.status === 'downloading' ? `${percent} 100` : '25 100'"
          :class="{ 'save-offline__spin': active.status !== 'downloading' }"
          class="save-offline__ring"
        />
      </svg>
      <svg v-else-if="saved && !active" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
      <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      <span class="tabular-nums">{{ label }}</span>
    </button>

    <Transition name="save-menu">
      <div
        v-if="menu"
        class="save-menu absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
        role="menu"
      >
        <!-- Choose a quality -->
        <template v-if="menu === 'quality'">
          <p class="px-3 pb-1.5 pt-2 text-xs font-medium text-zinc-400">{{ t('desktop.chooseQuality') }}</p>
          <div v-if="loadingQualities" class="space-y-1 px-1.5 py-1" aria-hidden="true">
            <div v-for="row in 3" :key="row" class="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
          </div>
          <button
            v-for="(quality, index) in qualityOptions"
            v-else
            :key="quality"
            type="button"
            role="menuitem"
            class="save-menu__item"
            @click="save(quality)"
          >
            <span class="flex min-w-0 flex-col">
              <span class="truncate">{{ quality === 'best' ? t('desktop.bestQuality') : quality }}</span>
              <span v-if="quality === 'best' && qualityOptions[1]" class="text-xs text-zinc-500">{{ qualityOptions[1] }}</span>
            </span>
            <span v-if="qualityBadge(quality)" class="save-menu__badge">{{ qualityBadge(quality) }}</span>
            <span v-else-if="index === 0" class="save-menu__badge save-menu__badge--brand">{{ t('desktop.recommended') }}</span>
          </button>
          <p class="mx-1.5 mt-1 border-t border-white/[0.06] px-1.5 pb-1.5 pt-2.5 text-[11px] leading-snug text-zinc-500">{{ t('desktop.saveHint') }}</p>
        </template>

        <!-- Saving -->
        <template v-else-if="menu === 'active' && active">
          <div class="px-3 pb-2 pt-2">
            <p class="text-sm font-medium text-zinc-100">{{ active.status === 'downloading' ? t('desktop.saving', { percent }) : t('desktop.preparing') }}</p>
            <p class="mt-0.5 truncate text-xs text-zinc-400">{{ activeDetail }}</p>
            <div class="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-500"
                :class="{ 'save-menu__indeterminate': active.status !== 'downloading' }"
                :style="{ width: active.status === 'downloading' ? `${percent}%` : '30%' }"
              />
            </div>
          </div>
          <button type="button" role="menuitem" class="save-menu__item" @click="showDownloads()">
            <span>{{ t('desktop.openDownloads') }}</span>
          </button>
          <button type="button" role="menuitem" class="save-menu__item save-menu__item--danger" @click="cancel()">
            <span>{{ t('desktop.cancelDownload') }}</span>
          </button>
        </template>

        <!-- Saved -->
        <template v-else-if="menu === 'saved'">
          <p class="px-3 pb-1.5 pt-2 text-xs font-medium text-zinc-400">
            {{ t('desktop.savedDetail', { quality: savedInfo?.quality || '', size: formatSize(savedInfo?.size || 0) }) }}
          </p>
          <button type="button" role="menuitem" class="save-menu__item" @click="showDownloads(props.videoId)">
            <span class="flex items-center gap-2.5">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
              {{ t('desktop.playOffline') }}
            </span>
          </button>
          <button type="button" role="menuitem" class="save-menu__item save-menu__item--danger" @click="remove()">
            <span class="flex items-center gap-2.5">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" /><path d="M9 7V4h6v3" /></svg>
              {{ t('desktop.deleteDownload') }}
            </span>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDesktopApp } from '~/app/composables/useDesktopApp'

const props = defineProps<{ videoId: string, title?: string }>()
const { t } = useI18n()
const { bridge, hasDesktopDownloads, activeDownloads, libraryVersion, openDownloads } = useDesktopApp()

const rootRef = ref<HTMLElement | null>(null)
const menu = ref<'quality' | 'active' | 'saved' | null>(null)
const loadingQualities = ref(false)
const qualityOptions = ref<string[]>([])
const savedInfo = ref<{ quality: string, size: number } | null>(null)
const saved = computed(() => Boolean(savedInfo.value))

const active = computed(() => activeDownloads.value.find((item) => item.id === props.videoId) || null)
const percent = computed(() => {
  const item = active.value
  return item?.total ? Math.min(100, Math.round((item.received / item.total) * 100)) : 0
})

const formatSize = (bytes: number) => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit >= 3 ? 1 : 0)} ${units[unit]}`
}

const label = computed(() => {
  const item = active.value
  if (item?.status === 'error') return t('desktop.retrySave')
  if (item?.status === 'downloading') return t('desktop.saving', { percent: percent.value })
  if (item) return t('desktop.preparing')
  return saved.value ? t('desktop.savedOffline') : t('desktop.saveOffline')
})

const activeDetail = computed(() => {
  const item = active.value
  if (!item) return ''
  if (item.status === 'downloading' && item.total) return `${formatSize(item.received)} / ${formatSize(item.total)} · ${item.quality}`
  return item.message || ''
})

const buttonTitle = computed(() => active.value?.message || label.value)

// 2160p → 4K, 1440p → 2K, ≥720p → HD.
const qualityBadge = (quality: string) => {
  const height = Number.parseInt(quality, 10)
  if (!height) return ''
  if (height >= 2160) return '4K'
  if (height >= 1440) return '2K'
  if (height >= 720) return 'HD'
  return ''
}

const checkSaved = async () => {
  if (!bridge.value || !props.videoId) return
  savedInfo.value = await bridge.value.downloads.get(props.videoId).catch(() => null)
}

const openQualityMenu = async () => {
  if (!bridge.value) return
  menu.value = 'quality'
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
  menu.value = null
  await bridge.value?.downloads.start(props.videoId, quality, props.title || '')
}

const cancel = async () => {
  menu.value = null
  await bridge.value?.downloads.cancel(props.videoId)
}

const remove = async () => {
  menu.value = null
  await bridge.value?.downloads.remove(props.videoId)
  savedInfo.value = null
  libraryVersion.value += 1
}

const showDownloads = (videoId?: string) => {
  menu.value = null
  void openDownloads(videoId)
}

const handleClick = () => {
  const item = active.value
  if (menu.value) {
    menu.value = null
  } else if (item?.status === 'error') {
    void save(item.quality)
  } else if (item) {
    menu.value = 'active'
  } else if (saved.value) {
    menu.value = 'saved'
  } else {
    void openQualityMenu()
  }
}

const closeOnOutsideClick = (event: MouseEvent) => {
  if (menu.value && rootRef.value && !rootRef.value.contains(event.target as Node)) menu.value = null
}
const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') menu.value = null
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
  document.addEventListener('keydown', closeOnEscape)
  void checkSaved()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeOnOutsideClick)
  document.removeEventListener('keydown', closeOnEscape)
})
watch([bridge, libraryVersion, () => props.videoId], () => void checkSaved())
// The download finished or was cancelled: its menu no longer applies.
watch(active, (item) => {
  if (!item && menu.value === 'active') menu.value = null
})
</script>

<style scoped>
.save-offline {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

/* While saving, the pill fills from the left. */
.save-offline.is-busy::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  z-index: -1;
  width: var(--save-progress, 0%);
  background: rgb(var(--gt-primary) / 0.18);
  transition: width 500ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.save-offline__ring {
  transition: stroke-dasharray 500ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.save-offline__spin {
  transform-origin: 12px 12px;
  animation: save-spin 1s linear infinite;
}

@keyframes save-spin {
  to { transform: rotate(360deg); }
}

.save-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 2.5rem;
  border-radius: 0.625rem;
  padding: 0.375rem 0.75rem;
  color: rgb(var(--gt-zinc-100));
  font-size: 0.875rem;
  text-align: left;
  transition: background-color 150ms ease;
}

.save-menu__item:hover,
.save-menu__item:focus-visible {
  background: rgb(var(--gt-white) / 0.07);
  outline: none;
}

.save-menu__item--danger {
  color: rgb(var(--gt-red-300));
}

.save-menu__badge {
  flex-shrink: 0;
  border-radius: 0.375rem;
  background: rgb(var(--gt-white) / 0.08);
  padding: 0.0625rem 0.375rem;
  color: rgb(var(--gt-zinc-300));
  font-size: 0.6875rem;
  font-weight: 700;
}

.save-menu__badge--brand {
  background: rgb(var(--gt-primary) / 0.16);
  color: rgb(var(--gt-primary-300));
}

.save-menu__indeterminate {
  animation: save-slide 1.2s ease-in-out infinite;
}

@keyframes save-slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(340%); }
}

.save-menu-enter-active,
.save-menu-leave-active {
  transition: opacity 150ms ease, transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: top right;
}

.save-menu-enter-from,
.save-menu-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
</style>
