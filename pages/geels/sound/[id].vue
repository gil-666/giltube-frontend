<template>
  <div class="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
    <div v-if="sound" class="flex flex-col gap-5 sm:flex-row sm:items-end">
      <div class="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-xl">
        <img v-if="cover" :src="cover" alt="" class="h-full w-full object-cover">
        <button
          type="button"
          class="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-90 transition hover:bg-black/45"
          :aria-label="previewing ? t('geels.stopPreview') : t('geels.preview')"
          @click="togglePreview"
        >
          <svg v-if="previewing" viewBox="0 0 24 24" class="h-12 w-12" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
          <svg v-else viewBox="0 0 24 24" class="h-12 w-12" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" /></svg>
        </button>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wider text-zinc-400">{{ t('geels.sound') }}</p>
        <h1 class="mt-1 truncate text-2xl font-extrabold text-white md:text-3xl">{{ sound.title }}</h1>
        <NuxtLink :to="localePath(`/music/artists/${sound.artist_slug}`)" class="mt-1 inline-block text-zinc-300 hover:text-white">{{ sound.artist_name }}</NuxtLink>
        <p class="mt-2 text-sm text-zinc-400">{{ t('geels.soundUsage', sound.usage_count || 0) }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <NuxtLink
            v-if="usable && creatorReady"
            :to="localePath(`/geels/create?sound=${sound.track_id}`)"
            class="inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-500"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" d="M12 5v14M5 12h14" /></svg>
            {{ t('geels.useSound') }}
          </NuxtLink>
          <NuxtLink :to="localePath(`/music/tracks/${sound.slug}`)" class="rounded-full bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.14]">
            {{ t('geels.openInMusic') }}
          </NuxtLink>
        </div>
      </div>
    </div>
    <p v-else-if="notFound" class="py-20 text-center text-zinc-400">{{ t('geels.soundNotFound') }}</p>

    <div class="mt-8 grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
      <NuxtLink
        v-for="geel in geels"
        :key="geel.id"
        :to="localePath(`/geels/${geel.id}?sound=${id}`)"
        class="group relative aspect-[9/16] overflow-hidden rounded-lg bg-zinc-900"
      >
        <img :src="geelPoster(geel)" alt="" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
        <span class="absolute bottom-1.5 left-2 flex items-center gap-1 text-xs font-bold text-white drop-shadow">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" /></svg>
          {{ formatGeelCount(geel.views, locale) }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { formatGeelCount, geelPoster, getGeelSound, getGeelsFeed, type Geel } from '~/app/service/geels'
import { resolveAvatarUrl } from '~/app/utils/media'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const id = route.params.id as string

const { data } = await useAsyncData(`geel-sound-${id}`, () => getGeelSound(id).catch(() => null))
const sound = computed(() => data.value?.sound || null)
const usable = computed(() => !!data.value?.usable)
const notFound = computed(() => !data.value)
const cover = computed(() => sound.value?.cover_url ? resolveAvatarUrl(sound.value.cover_url) : '')
const geels = ref<Geel[]>([])
const previewing = ref(false)
const creatorReady = true
let audio: HTMLAudioElement | null = null

useMetaTags({ title: sound.value ? `${sound.value.title} · ${t('geels.title')}` : t('geels.title'), url: `/geels/sound/${id}` })

const togglePreview = () => {
  if (!sound.value) return
  if (!audio) {
    audio = new Audio(resolveAvatarUrl(sound.value.audio_url))
    audio.addEventListener('ended', () => { previewing.value = false })
  }
  if (previewing.value) audio.pause()
  else void audio.play()
  previewing.value = !previewing.value
}

onMounted(async () => {
  try {
    geels.value = (await getGeelsFeed({ sound: id, limit: 30 })).items
  } catch { /* none */ }
})
onBeforeUnmount(() => audio?.pause())
</script>
