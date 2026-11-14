<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 sm:items-center" @click.self="close">
      <div class="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-900 sm:rounded-2xl">
        <header class="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <h2 class="text-base font-bold text-white">{{ t('geels.addSound') }}</h2>
          <button type="button" class="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white" :aria-label="t('geels.close')" @click="close">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div class="space-y-3 p-4">
          <input
            v-model="query"
            type="search"
            class="w-full rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/25"
            :placeholder="t('geels.searchMusic')"
          >
          <button v-if="selected" type="button" class="text-sm font-semibold text-zinc-400 hover:text-white" @click="choose(null)">{{ t('geels.removeSound') }}</button>
        </div>
        <div class="flex-1 overflow-y-auto px-2 pb-3">
          <p v-if="loading" class="py-10 text-center text-sm text-zinc-500">{{ t('geels.loading') }}</p>
          <p v-else-if="!sounds.length" class="py-10 text-center text-sm text-zinc-500">{{ t('geels.noSounds') }}</p>
          <div v-for="sound in sounds" :key="sound.track_id" class="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]">
            <button type="button" class="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800" :aria-label="previewID === sound.track_id ? t('geels.stopPreview') : t('geels.preview')" @click="togglePreview(sound)">
              <img v-if="sound.cover_url" :src="resolveAvatarUrl(sound.cover_url)" alt="" class="h-full w-full object-cover">
              <span class="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                <svg v-if="previewID === sound.track_id" viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" /></svg>
              </span>
            </button>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-white">{{ sound.title }}</p>
              <p class="truncate text-xs text-zinc-400">{{ sound.artist_name }} · {{ clock(sound.duration_seconds) }}</p>
            </div>
            <button
              type="button"
              class="rounded-full px-4 py-1.5 text-xs font-bold"
              :class="selected?.track_id === sound.track_id ? 'bg-white/10 text-white' : 'bg-accent-600 text-white hover:bg-accent-500'"
              @click="choose(sound)"
            >{{ selected?.track_id === sound.track_id ? t('geels.selected') : t('geels.use') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchGeelSounds, type GeelSound } from '~/app/service/geels'
import { resolveAvatarUrl } from '~/app/utils/media'

const props = defineProps<{ open: boolean; selected: GeelSound | null }>()
const emit = defineEmits<{ (event: 'close'): void; (event: 'select', sound: GeelSound | null): void }>()
const { t } = useI18n()

const query = ref('')
const sounds = ref<GeelSound[]>([])
const loading = ref(false)
const previewID = ref('')
let audio: HTMLAudioElement | null = null
let timer: ReturnType<typeof setTimeout> | null = null

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

const search = async () => {
  loading.value = true
  try { sounds.value = await searchGeelSounds(query.value.trim(), 40) } catch { sounds.value = [] } finally { loading.value = false }
}

watch(() => props.open, (open) => { if (open) void search(); else stopPreview() })
watch(query, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void search(), 300)
})

const stopPreview = () => {
  audio?.pause()
  previewID.value = ''
}
const togglePreview = (sound: GeelSound) => {
  if (previewID.value === sound.track_id) { stopPreview(); return }
  audio?.pause()
  audio = new Audio(resolveAvatarUrl(sound.audio_url))
  audio.loop = true
  void audio.play()
  previewID.value = sound.track_id
}
const close = () => { stopPreview(); emit('close') }
const choose = (sound: GeelSound | null) => { emit('select', sound); close() }

onBeforeUnmount(() => { stopPreview(); if (timer) clearTimeout(timer) })
</script>
