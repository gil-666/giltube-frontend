<template>
  <div v-if="hasDesktopDownloads" ref="rootRef" class="relative">
    <button
      type="button"
      class="watch-action-button watch-pill save-offline"
      :class="{ 'is-active': saved && !active, 'is-busy': Boolean(active) && active?.status !== 'error' }"
      :style="active?.status === 'downloading' ? { '--save-progress': `${percent}%` } : undefined"
      :title="buttonTitle"
      :aria-expanded="menu !== null"
      :aria-haspopup="saved || active ? 'menu' : 'dialog'"
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
        v-if="menu && menu !== 'quality'"
        class="save-menu absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
        role="menu"
      >
        <!-- Saving -->
        <template v-if="menu === 'active' && active">
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
          <button v-if="active.playable" type="button" role="menuitem" class="save-menu__item" @click="showDownloads(props.videoId)">
            <span class="flex items-center gap-2.5">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
              {{ t('desktop.watchNow') }}
            </span>
          </button>
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

    <!-- Save offline: quality and audio languages -->
    <Teleport to="body">
      <Transition name="save-panel">
        <div v-if="menu === 'quality'" class="save-panel" @click.self="menu = null">
          <div class="save-panel__card" role="dialog" aria-modal="true" :aria-label="t('desktop.saveOffline')">
            <header class="save-panel__head">
              <span class="save-panel__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              </span>
              <div class="min-w-0 flex-1">
                <h2 class="save-panel__title">{{ t('desktop.saveOffline') }}</h2>
                <p class="save-panel__video">{{ props.title }}</p>
              </div>
              <button type="button" class="save-panel__close" :aria-label="t('desktop.close')" @click="menu = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </header>

            <div class="save-panel__body">
              <section>
                <h3 class="save-panel__label">{{ t('desktop.chooseQuality') }}</h3>
                <div v-if="loadingQualities" class="save-panel__tiles" aria-hidden="true">
                  <div v-for="tile in 4" :key="tile" class="save-tile animate-pulse" />
                </div>
                <div v-else class="save-panel__tiles" role="radiogroup" :aria-label="t('desktop.chooseQuality')">
                  <button
                    v-for="quality in qualityOptions"
                    :key="quality"
                    type="button"
                    role="radio"
                    class="save-tile"
                    :class="{ 'is-on': selectedQuality === quality }"
                    :aria-checked="selectedQuality === quality"
                    @click="selectedQuality = quality"
                  >
                    <span class="save-tile__main">{{ quality === 'best' ? t('desktop.bestQuality') : quality }}</span>
                    <span v-if="qualityBadge(quality)" class="save-tile__badge">{{ qualityBadge(quality) }}</span>
                  </button>
                </div>
              </section>

              <section v-if="audioOptions.length > 1">
                <div class="flex items-baseline justify-between gap-3">
                  <h3 class="save-panel__label">{{ t('desktop.chooseAudio') }}</h3>
                  <span class="text-xs tabular-nums text-zinc-500">{{ selectedAudio.length }}/{{ audioOptions.length }}</span>
                </div>
                <div class="save-panel__chips">
                  <button
                    v-for="option in sortedAudioOptions"
                    :key="option.id"
                    type="button"
                    role="checkbox"
                    class="save-chip"
                    :class="{ 'is-on': selectedAudio.includes(option.id) }"
                    :aria-checked="selectedAudio.includes(option.id)"
                    @click="toggleAudio(option.id)"
                  >
                    <svg v-if="selectedAudio.includes(option.id)" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                    {{ localizeTrackLabel(option.label, locale) }}
                    <span v-if="option.default" class="save-chip__tag">{{ t('desktop.defaultAudio') }}</span>
                  </button>
                </div>
              </section>

              <p class="save-panel__hint">
                <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 10.5a2 2 0 1 0 0 3M16 10.5a2 2 0 1 0 0 3" /></svg>
                {{ t('desktop.subtitlesIncluded') }}
              </p>
            </div>

            <footer class="save-panel__foot">
              <p class="save-panel__summary">{{ summary }}</p>
              <div class="flex gap-2">
                <button type="button" class="save-panel__button" @click="menu = null">{{ t('desktop.cancel') }}</button>
                <button type="button" class="save-panel__button save-panel__button--primary" :disabled="!canSave" @click="saveSelected">
                  {{ t('desktop.save') }}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDesktopApp } from '~/app/composables/useDesktopApp'
import { localizeTrackLabel } from '~/app/utils/trackLabels'

const props = defineProps<{ videoId: string, title?: string }>()
const { t, locale } = useI18n()
const { bridge, hasDesktopDownloads, activeDownloads, libraryVersion, openDownloads } = useDesktopApp()

const rootRef = ref<HTMLElement | null>(null)
const menu = ref<'quality' | 'active' | 'saved' | null>(null)
const loadingQualities = ref(false)
const qualityOptions = ref<string[]>([])
const selectedQuality = ref('best')
// Audio languages the download can carry; the default one starts checked.
const audioOptions = ref<{ id: string, label: string, language: string, default: boolean }[]>([])
const selectedAudio = ref<string[]>([])
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
  if (item?.status === 'downloading' && item.playable) return t('desktop.readyToWatch', { percent: percent.value })
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
  const audio = bridge.value.features?.includes('audio') && bridge.value.downloads.audioOptions
    ? bridge.value.downloads.audioOptions(props.videoId).catch(() => [])
    : Promise.resolve([])
  try {
    const qualities = await bridge.value.downloads.qualities(props.videoId)
    // The highest quality is what "best" means, so it is preselected rather
    // than listed twice.
    qualityOptions.value = qualities.filter((quality) => quality !== 'best')
    if (!qualityOptions.value.length) qualityOptions.value = ['best']
  } catch {
    qualityOptions.value = ['best']
  }
  selectedQuality.value = qualityOptions.value[0] || 'best'
  try {
    audioOptions.value = await audio
    selectedAudio.value = audioOptions.value.filter((option) => option.default).map((option) => option.id)
  } finally {
    loadingQualities.value = false
  }
}

// The default audio first, then the site's language, then the rest.
const sortedAudioOptions = computed(() => {
  const siteLanguage = String(locale.value || '').slice(0, 2).toLowerCase()
  const speaks = (language: string) => language.toLowerCase().startsWith(siteLanguage) || (siteLanguage === 'es' && language.toLowerCase() === 'spa') || (siteLanguage === 'en' && language.toLowerCase() === 'eng')
  const rank = (option: { default: boolean, language: string }) => (option.default ? 0 : speaks(option.language) ? 1 : 2)
  return audioOptions.value.map((option, index) => ({ option, index }))
    .sort((a, b) => rank(a.option) - rank(b.option) || a.index - b.index)
    .map(({ option }) => option)
})

const toggleAudio = (id: string) => {
  selectedAudio.value = selectedAudio.value.includes(id)
    ? selectedAudio.value.filter((value) => value !== id)
    : [...selectedAudio.value, id]
}

// Chosen audio in the panel's order (the first plays by default); with one
// option, the default audio.
const chosenAudio = () => (audioOptions.value.length > 1
  ? sortedAudioOptions.value.filter((option) => selectedAudio.value.includes(option.id)).map((option) => option.id)
  : [])

const canSave = computed(() => !loadingQualities.value && (audioOptions.value.length < 2 || selectedAudio.value.length > 0))

const summary = computed(() => {
  const parts = [selectedQuality.value === 'best' ? t('desktop.bestQuality') : selectedQuality.value]
  if (audioOptions.value.length > 1) {
    const names = sortedAudioOptions.value.filter((option) => selectedAudio.value.includes(option.id)).map((option) => localizeTrackLabel(option.label, locale.value))
    parts.push(names.length ? names.join(', ') : t('desktop.noAudioChosen'))
  }
  parts.push(t('desktop.allSubtitles'))
  return parts.join(' · ')
})

const saveSelected = () => {
  if (canSave.value) void save(selectedQuality.value)
}

const save = async (quality: string, audio = chosenAudio()) => {
  menu.value = null
  await bridge.value?.downloads.start(props.videoId, quality, props.title || '', audio)
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
    void save(item.quality, item.audio || [])
  } else if (item) {
    menu.value = 'active'
  } else if (saved.value) {
    menu.value = 'saved'
  } else {
    void openQualityMenu()
  }
}

const closeOnOutsideClick = (event: MouseEvent) => {
  // The panel is in <body> and closes from its own backdrop.
  if (menu.value === 'quality') return
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

.save-menu__item:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}


.save-menu__item--danger {
  color: rgb(var(--gt-red-300));
}



.save-menu__indeterminate {
  animation: save-slide 1.2s ease-in-out infinite;
}

@keyframes save-slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(340%); }
}

.save-panel {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(6px);
}

.save-panel__card {
  display: flex;
  width: min(34rem, 100%);
  max-height: min(44rem, calc(100dvh - 2rem));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(var(--gt-white) / 0.08);
  border-radius: 1.5rem;
  background: rgb(var(--gt-zinc-900));
  box-shadow: 0 40px 100px -20px rgb(0 0 0 / 0.8);
}

.save-panel__head { display: flex; align-items: center; gap: 0.875rem; padding: 1.25rem 1.25rem 1rem; }
.save-panel__icon { display: grid; width: 2.75rem; height: 2.75rem; flex-shrink: 0; place-items: center; border-radius: 0.875rem; background: rgb(var(--gt-primary) / 0.15); color: rgb(var(--gt-primary-300)); }
.save-panel__icon svg { width: 1.3rem; height: 1.3rem; }
.save-panel__title { margin: 0; font-size: 1.125rem; font-weight: 700; letter-spacing: -0.01em; }
.save-panel__video { margin: 0.125rem 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgb(var(--gt-zinc-400)); font-size: 0.875rem; }
.save-panel__close { display: grid; width: 2.25rem; height: 2.25rem; flex-shrink: 0; place-items: center; border-radius: 999px; color: rgb(var(--gt-zinc-400)); transition: background-color 150ms ease, color 150ms ease; }
.save-panel__close:hover { background: rgb(var(--gt-white) / 0.08); color: rgb(var(--gt-white)); }
.save-panel__close svg { width: 1.1rem; height: 1.1rem; }

.save-panel__body { display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; padding: 0.5rem 1.25rem 1.25rem; }
.save-panel__label { margin: 0 0 0.625rem; color: rgb(var(--gt-zinc-300)); font-size: 0.8125rem; font-weight: 600; }

.save-panel__tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr)); gap: 0.5rem; }
.save-tile {
  position: relative;
  display: flex;
  min-height: 3.25rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.125rem;
  border: 1px solid rgb(var(--gt-white) / 0.08);
  border-radius: 0.875rem;
  background: rgb(var(--gt-white) / 0.03);
  padding: 0.5rem 0.75rem;
  text-align: left;
  transition: border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
}
.save-tile:hover { border-color: rgb(var(--gt-white) / 0.18); }
.save-tile.is-on { border-color: rgb(var(--gt-primary)); background: rgb(var(--gt-primary) / 0.1); box-shadow: 0 0 0 1px rgb(var(--gt-primary)); }
.save-tile__main { font-size: 0.9375rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.save-tile__badge { color: rgb(var(--gt-zinc-400)); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.04em; }
.save-tile.is-on .save-tile__badge { color: rgb(var(--gt-primary-300)); }

.save-panel__chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.save-chip {
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  gap: 0.375rem;
  border: 1px solid rgb(var(--gt-white) / 0.1);
  border-radius: 999px;
  padding: 0 0.875rem;
  color: rgb(var(--gt-zinc-200));
  font-size: 0.875rem;
  font-weight: 500;
  transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
}
.save-chip:hover { border-color: rgb(var(--gt-white) / 0.22); }
.save-chip.is-on { border-color: transparent; background: rgb(var(--gt-zinc-100)); color: rgb(var(--gt-zinc-950)); }
.save-chip__tag { border-radius: 999px; background: rgb(var(--gt-white) / 0.08); padding: 0.0625rem 0.4rem; font-size: 0.6875rem; font-weight: 600; }
.save-chip.is-on .save-chip__tag { background: rgb(var(--gt-zinc-950) / 0.1); }

.save-panel__hint { display: flex; align-items: center; gap: 0.5rem; margin: 0; color: rgb(var(--gt-zinc-400)); font-size: 0.8125rem; }

.save-panel__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid rgb(var(--gt-white) / 0.06);
  padding: 1rem 1.25rem;
}
.save-panel__summary { min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgb(var(--gt-zinc-400)); font-size: 0.8125rem; }
.save-panel__button {
  height: 2.5rem;
  border-radius: 999px;
  background: rgb(var(--gt-white) / 0.08);
  padding: 0 1.125rem;
  color: rgb(var(--gt-zinc-100));
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 150ms ease;
}
.save-panel__button:hover { background: rgb(var(--gt-white) / 0.14); }
.save-panel__button--primary { background: rgb(var(--gt-primary-600)); color: rgb(var(--gt-on-primary)); }
.save-panel__button--primary:hover:not(:disabled) { background: rgb(var(--gt-primary-500)); }
.save-panel__button:disabled { cursor: not-allowed; opacity: 0.45; }

.save-panel-enter-active, .save-panel-leave-active { transition: opacity 200ms ease; }
.save-panel-enter-active .save-panel__card, .save-panel-leave-active .save-panel__card { transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.save-panel-enter-from, .save-panel-leave-to { opacity: 0; }
.save-panel-enter-from .save-panel__card, .save-panel-leave-to .save-panel__card { transform: translateY(12px) scale(0.98); }

/* Phones: a sheet from the bottom. */
@media (max-width: 640px) {
  .save-panel { place-items: end stretch; padding: 0; }
  .save-panel__card { width: 100%; max-height: 85dvh; border-radius: 1.5rem 1.5rem 0 0; }
  .save-panel__foot { flex-direction: column; align-items: stretch; }
  .save-panel__foot > div { justify-content: flex-end; }
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
