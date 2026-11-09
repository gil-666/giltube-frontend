<template>
  <div v-if="available" class="space-y-3 rounded-xl border border-white/10 bg-zinc-950 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h4 class="text-sm font-semibold text-white">{{ t('videoEditor.subtitleFinder.title') }}</h4>
        <p class="mt-1 text-xs text-gray-400">{{ t('videoEditor.subtitleFinder.body') }}</p>
      </div>
      <button
        v-if="configured"
        type="button"
        :disabled="searching"
        class="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="search()"
      >
        {{ searching ? t('videoEditor.subtitleFinder.searching') : response ? t('videoEditor.subtitleFinder.searchAgain') : t('videoEditor.subtitleFinder.search') }}
      </button>
    </div>

    <p v-if="!configured" class="text-xs text-amber-300/90">{{ t('videoEditor.subtitleFinder.notConfigured') }}</p>

    <template v-if="response">
      <div class="flex flex-wrap items-end gap-2 text-xs text-gray-400">
        <p class="min-w-0 flex-1">
          {{ t('videoEditor.subtitleFinder.matched', { title: mediaLabel }) }}
          <span v-if="response.media.tmdb_id"> · TMDB {{ response.media.tmdb_id }}</span>
          <span v-else> · {{ t('videoEditor.subtitleFinder.byTitle') }}</span>
          <span v-if="response.media.fps"> · {{ response.media.fps.toFixed(3) }} fps</span>
        </p>
        <label class="flex items-end gap-2">
          <span class="pb-2">{{ t('videoEditor.subtitleFinder.tmdbOverride') }}</span>
          <input v-model.number="tmdbOverride" type="number" min="1" inputmode="numeric" class="w-28 rounded border border-white/10 bg-zinc-800 px-2 py-1.5 text-white" @keydown.enter.prevent="search(tmdbOverride || undefined)" />
        </label>
      </div>

      <p v-for="(message, provider) in response.errors" :key="provider" class="text-xs text-amber-300/90">
        {{ t('videoEditor.subtitleFinder.providerError', { provider: providerName(String(provider)), message }) }}
      </p>

      <p v-if="!groups.length" class="rounded border border-white/[0.07] bg-black/30 px-4 py-6 text-sm text-gray-500">{{ t('videoEditor.subtitleFinder.empty') }}</p>

      <div v-for="group in groups" :key="group.language" class="space-y-2">
        <div class="flex items-center gap-2">
          <h5 class="text-sm font-semibold text-white">{{ group.name }}</h5>
          <span class="text-xs text-gray-500">{{ group.results.length }}</span>
          <span v-if="response.present_languages.includes(group.language)" class="rounded bg-emerald-900/60 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-200">{{ t('videoEditor.subtitleFinder.alreadyAdded') }}</span>
        </div>
        <div
          v-for="result in visibleResults(group)"
          :key="result.provider + result.id"
          class="flex flex-col gap-2 rounded bg-zinc-900 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="break-all text-sm text-white">{{ result.release || result.file_name || t('videoEditor.subtitleFinder.untitled') }}</p>
            <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
              <span>{{ providerName(result.provider) }}</span>
              <span v-if="result.downloads">· {{ t('videoEditor.subtitleFinder.downloads', { count: result.downloads.toLocaleString() }) }}</span>
              <span v-if="result.fps" :class="fpsMismatch(result) ? 'text-amber-300' : ''">· {{ result.fps }} fps</span>
              <span v-if="result.trusted" class="rounded bg-sky-900/60 px-1.5 text-sky-200">{{ t('videoEditor.subtitleFinder.trusted') }}</span>
              <span v-if="result.hearing_impaired" class="rounded bg-zinc-700 px-1.5 text-gray-200">SDH</span>
              <span v-if="result.machine_translated" class="rounded bg-red-900/60 px-1.5 text-red-200">{{ t('videoEditor.subtitleFinder.machine') }}</span>
            </p>
          </div>
          <button
            type="button"
            :disabled="!!adding || added.has(key(result))"
            class="shrink-0 rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            @click="add(result)"
          >
            {{ added.has(key(result)) ? t('videoEditor.subtitleFinder.added') : adding === key(result) ? t('videoEditor.subtitleFinder.adding') : t('videoEditor.subtitleFinder.add') }}
          </button>
        </div>
        <button
          v-if="group.results.length > collapsedCount && !expanded.has(group.language)"
          type="button"
          class="text-xs font-semibold text-primary-400 hover:text-primary-300"
          @click="expanded.add(group.language)"
        >
          {{ t('videoEditor.subtitleFinder.showAll', { count: group.results.length }) }}
        </button>
      </div>
    </template>

    <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchVideoSubtitleOnline, listSubtitleProviders, searchVideoSubtitlesOnline, type SubtitleResult, type SubtitleSearchResponse } from '~/app/service/subtitleFetch'

const props = defineProps<{ videoId: string }>()
const emit = defineEmits<{ added: [subtitles: unknown[]] }>()
const { t } = useI18n()

// Only administrators can search (the providers' download allowances are
// shared), so the panel stays hidden until the provider list loads.
const available = ref(false)
const configured = ref(false)
const searching = ref(false)
const adding = ref('')
const error = ref('')
const response = ref<SubtitleSearchResponse | null>(null)
const tmdbOverride = ref<number | null>(null)
const added = reactive(new Set<string>())
const expanded = reactive(new Set<string>())
const collapsedCount = 5

const providerNames: Record<string, string> = { opensubtitles: 'OpenSubtitles', subdl: 'SubDL' }
const providerName = (name: string) => providerNames[name] || name
const key = (result: SubtitleResult) => `${result.provider}:${result.id}`

const mediaLabel = computed(() => {
  const media = response.value?.media
  if (!media) return ''
  if (media.kind === 'episode') {
    const pad = (value?: number) => String(value || 0).padStart(2, '0')
    return `${media.title} S${pad(media.season)}E${pad(media.episode)}`
  }
  return media.year ? `${media.title} (${media.year})` : media.title
})

type Group = { language: string, name: string, results: SubtitleResult[] }

// Results arrive ranked: English, Latin American Spanish, other Spanish,
// then every other language; grouping keeps that order.
const groups = computed<Group[]>(() => {
  const list: Group[] = []
  const byLanguage = new Map<string, Group>()
  for (const result of response.value?.results || []) {
    let group = byLanguage.get(result.language)
    if (!group) {
      group = { language: result.language, name: result.language_name || result.language || t('videoEditor.subtitleFinder.unknownLanguage'), results: [] }
      byLanguage.set(result.language, group)
      list.push(group)
    }
    group.results.push(result)
  }
  return list
})

const visibleResults = (group: Group) => expanded.has(group.language) ? group.results : group.results.slice(0, collapsedCount)

const fpsMismatch = (result: SubtitleResult) => {
  const fps = response.value?.media.fps
  return !!fps && !!result.fps && Math.abs(fps - result.fps) >= 0.05
}

const errorText = (err: any, fallback: string) => err?.response?.data?.error || err?.message || fallback

const loadProviders = async () => {
  available.value = false
  try {
    const data = await listSubtitleProviders()
    configured.value = data.providers.some(provider => provider.configured)
    available.value = true
  } catch {
    available.value = false
  }
}

const search = async (tmdbId?: number) => {
  searching.value = true
  error.value = ''
  try {
    response.value = await searchVideoSubtitlesOnline(props.videoId, { tmdbId })
    expanded.clear()
    if (!tmdbOverride.value && response.value.media.tmdb_id) tmdbOverride.value = response.value.media.tmdb_id
  } catch (err: any) {
    error.value = errorText(err, t('videoEditor.subtitleFinder.searchFailed'))
  } finally {
    searching.value = false
  }
}

const add = async (result: SubtitleResult) => {
  adding.value = key(result)
  error.value = ''
  try {
    const data = await fetchVideoSubtitleOnline(props.videoId, result)
    added.add(key(result))
    if (response.value && !response.value.present_languages.includes(result.language)) {
      response.value.present_languages.push(result.language)
    }
    emit('added', data.subtitles || [])
  } catch (err: any) {
    error.value = errorText(err, t('videoEditor.subtitleFinder.addFailed'))
  } finally {
    adding.value = ''
  }
}

watch(() => props.videoId, () => {
  response.value = null
  tmdbOverride.value = null
  added.clear()
  void loadProviders()
})

onMounted(loadProviders)
</script>
