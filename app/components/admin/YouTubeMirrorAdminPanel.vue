<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-white">{{ t('youtubeMirrorAdmin.title') }}</h2>
        <AdminHelpButton
          :title="t('youtubeMirrorAdmin.help.title')"
          :body="t('youtubeMirrorAdmin.help.body')"
          :close-label="t('common.close')"
        />
      </div>
      <p class="mt-1 text-sm text-gray-400">
        {{ t('youtubeMirrorAdmin.subtitle') }}
      </p>
    </div>

    <section class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-white">{{ t('youtubeMirrorAdmin.import.title') }}</h3>
        <AdminHelpButton
          :title="t('youtubeMirrorAdmin.import.helpTitle')"
          :body="t('youtubeMirrorAdmin.import.helpBody')"
          :close-label="t('common.close')"
        />
      </div>
      <p class="mt-1 text-sm text-gray-400">
        {{ t('youtubeMirrorAdmin.import.body') }}
      </p>

      <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <input
          v-model="importForm.url"
          placeholder="https://www.youtube.com/watch?v=..."
          class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <select
          v-model="importForm.giltubeChannelId"
          :disabled="importForm.createNewChannel"
          class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">{{ t('youtubeMirrorAdmin.import.useMappedChannel') }}</option>
          <option v-for="channel in channels" :key="channel.id" :value="channel.id">
            {{ channel.name }}
          </option>
        </select>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <label class="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-gray-300">
          <input v-model="importForm.explicit" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('youtubeMirrorAdmin.import.explicit') }}
        </label>
        <label class="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-gray-300">
          <input v-model="importForm.hidden" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('youtubeMirrorAdmin.import.hidden') }}
        </label>
        <label class="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-gray-300">
          <input v-model="importForm.createNewChannel" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('youtubeMirrorAdmin.import.createNewChannel') }}
        </label>
        <button
          type="button"
          :disabled="importing || !importForm.url.trim()"
          class="rounded bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="startImport"
        >
          {{ importing ? t('youtubeMirrorAdmin.import.starting') : t('youtubeMirrorAdmin.import.submit') }}
        </button>
      </div>

      <div
        v-if="importNeedsMapping"
        class="mt-4 rounded border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100"
      >
        <p class="font-semibold">{{ t('youtubeMirrorAdmin.import.mappingRequired') }}</p>
        <p class="mt-1 break-all text-amber-200/90">{{ t('youtubeMirrorAdmin.import.youtubeChannelId') }}: {{ detectedYouTubeChannelId }}</p>
        <p v-if="detectedYouTubeChannelTitle" class="mt-1">{{ t('youtubeMirrorAdmin.import.channel') }}: {{ detectedYouTubeChannelTitle }}</p>
        <p class="mt-2 text-amber-200/80">
          {{ t('youtubeMirrorAdmin.import.mappingRequiredBody') }}
        </p>
      </div>

      <div v-if="importMessage" class="mt-4 rounded border border-blue-500/30 bg-blue-950/40 p-3 text-sm text-blue-100">
        {{ importMessage }}
      </div>
      <div v-if="importError" class="mt-4 rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">
        {{ importError }}
      </div>
    </section>

    <section class="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-white">{{ t('youtubeMirrorAdmin.mappings.title') }}</h3>
            <AdminHelpButton
              :title="t('youtubeMirrorAdmin.mappings.helpTitle')"
              :body="t('youtubeMirrorAdmin.mappings.helpBody')"
              :close-label="t('common.close')"
            />
          </div>
          <p class="mt-1 text-sm text-gray-400">
            {{ t('youtubeMirrorAdmin.mappings.body') }}
          </p>
        </div>
        <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="loadMappings">
          {{ t('common.refresh') }}
        </button>
      </div>

      <div class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_18rem_10rem_8rem]">
        <input
          v-model="mappingForm.youtubeChannelId"
          :placeholder="t('youtubeMirrorAdmin.mappings.youtubeChannelId')"
          class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <input
          v-model="mappingForm.youtubeChannelTitle"
          :placeholder="t('youtubeMirrorAdmin.mappings.youtubeChannelName')"
          class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <select
          v-model="mappingForm.giltubeChannelId"
          :disabled="mappingForm.createNewChannel"
          class="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">{{ t('youtubeMirrorAdmin.mappings.selectGilTubeChannel') }}</option>
          <option v-for="channel in channels" :key="channel.id" :value="channel.id">
            {{ channel.name }}
          </option>
        </select>
        <label class="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-gray-300">
          <input v-model="mappingForm.createNewChannel" type="checkbox" class="h-4 w-4 accent-red-600" />
          {{ t('youtubeMirrorAdmin.mappings.createNew') }}
        </label>
        <button
          type="button"
          :disabled="savingMapping || !canSaveMapping"
          class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="saveMapping"
        >
          {{ savingMapping ? t('common.saving') : t('common.save') }}
        </button>
      </div>

      <div v-if="mappingError" class="mt-4 rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">
        {{ mappingError }}
      </div>

      <div class="mt-5 overflow-hidden rounded border border-zinc-800">
        <div v-if="loadingMappings" class="bg-black/30 px-4 py-8 text-center text-sm text-gray-400">
          {{ t('youtubeMirrorAdmin.mappings.loading') }}
        </div>
        <div v-else-if="!mappings.length" class="bg-black/30 px-4 py-8 text-center text-sm text-gray-500">
          {{ t('youtubeMirrorAdmin.mappings.empty') }}
        </div>
        <div v-else class="divide-y divide-zinc-800">
          <article
            v-for="mapping in mappings"
            :key="mapping.youtube_channel_id"
            class="grid gap-3 bg-black/20 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
          >
            <div class="min-w-0">
              <p class="font-semibold text-white">{{ mapping.youtube_channel_title || t('youtubeMirrorAdmin.mappings.untitled') }}</p>
              <code class="mt-1 block select-all break-all text-xs text-gray-400">{{ mapping.youtube_channel_id }}</code>
            </div>
            <div class="min-w-0">
              <p class="text-sm text-gray-400">{{ t('youtubeMirrorAdmin.mappings.mirrorsTo') }}</p>
              <p class="truncate font-semibold text-blue-300">{{ mapping.giltube_channel_name || mapping.giltube_channel_id }}</p>
              <code class="mt-1 block select-all break-all text-xs text-gray-500">{{ mapping.giltube_channel_id }}</code>
            </div>
            <div class="flex gap-2 md:justify-end">
              <button
                type="button"
                class="rounded bg-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-600"
                @click="editMapping(mapping)"
              >
                {{ t('common.edit') }}
              </button>
              <button
                type="button"
                class="rounded bg-red-900 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-800"
                @click="removeMapping(mapping)"
              >
                {{ t('common.delete') }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminHelpButton from './AdminHelpButton.vue'
import {
  deleteYouTubeMirrorChannel,
  importYouTubeMirrorVideo,
  listYouTubeMirrorChannels,
  saveYouTubeMirrorChannel,
  type YouTubeMirrorChannel,
} from '~/app/service/youtubeMirrors'

defineProps<{
  channels: Array<{ id: string; name: string }>
}>()

const { t } = useI18n()
const mappings = ref<YouTubeMirrorChannel[]>([])
const loadingMappings = ref(false)
const savingMapping = ref(false)
const mappingError = ref('')
const importing = ref(false)
const importMessage = ref('')
const importError = ref('')
const detectedYouTubeChannelId = ref('')
const detectedYouTubeChannelTitle = ref('')

const importForm = ref({
  url: '',
  giltubeChannelId: '',
  explicit: false,
  hidden: false,
  createNewChannel: false,
})

const mappingForm = ref({
  youtubeChannelId: '',
  youtubeChannelTitle: '',
  youtubeChannelUrl: '',
  giltubeChannelId: '',
  createNewChannel: false,
})

const canSaveMapping = computed(() =>
  mappingForm.value.youtubeChannelId.trim() &&
  (mappingForm.value.createNewChannel || mappingForm.value.giltubeChannelId.trim())
)

const importNeedsMapping = computed(() => detectedYouTubeChannelId.value && importError.value.includes('not linked'))

const loadMappings = async () => {
  loadingMappings.value = true
  mappingError.value = ''
  try {
    const data = await listYouTubeMirrorChannels()
    mappings.value = data.mappings || []
  } catch (err: any) {
    mappingError.value = err?.response?.data?.error || err?.message || t('youtubeMirrorAdmin.errors.loadMappings')
  } finally {
    loadingMappings.value = false
  }
}

const resetDetectedMapping = () => {
  detectedYouTubeChannelId.value = ''
  detectedYouTubeChannelTitle.value = ''
}

const startImport = async () => {
  importing.value = true
  importMessage.value = ''
  importError.value = ''
  resetDetectedMapping()
  try {
    const data = await importYouTubeMirrorVideo({
      url: importForm.value.url,
      giltubeChannelId: importForm.value.giltubeChannelId,
      explicit: importForm.value.explicit,
      hidden: importForm.value.hidden,
      createNewChannel: importForm.value.createNewChannel,
    })
    importMessage.value = data.retried
      ? t('youtubeMirrorAdmin.messages.retryStarted', { id: data.video_id })
      : data.existing
        ? t('youtubeMirrorAdmin.messages.alreadyMirrored', { id: data.video_id })
        : t('youtubeMirrorAdmin.messages.importStarted', { id: data.video_id })
    importForm.value.url = ''
    importForm.value.createNewChannel = false
    await loadMappings()
  } catch (err: any) {
    const data = err?.response?.data || {}
    detectedYouTubeChannelId.value = data.youtube_channel_id || ''
    detectedYouTubeChannelTitle.value = data.youtube_channel_title || ''
    importError.value = data.error || err?.message || t('youtubeMirrorAdmin.errors.import')
  } finally {
    importing.value = false
  }
}

const saveMapping = async () => {
  savingMapping.value = true
  mappingError.value = ''
  try {
    await saveYouTubeMirrorChannel({
      youtubeChannelId: mappingForm.value.youtubeChannelId,
      youtubeChannelTitle: mappingForm.value.youtubeChannelTitle,
      youtubeChannelUrl: mappingForm.value.youtubeChannelUrl,
      giltubeChannelId: mappingForm.value.giltubeChannelId,
      createNewChannel: mappingForm.value.createNewChannel,
    })
    mappingForm.value = {
      youtubeChannelId: '',
      youtubeChannelTitle: '',
      youtubeChannelUrl: '',
      giltubeChannelId: '',
      createNewChannel: false,
    }
    await loadMappings()
  } catch (err: any) {
    mappingError.value = err?.response?.data?.error || err?.message || t('youtubeMirrorAdmin.errors.saveMapping')
  } finally {
    savingMapping.value = false
  }
}

const editMapping = (mapping: YouTubeMirrorChannel) => {
  mappingForm.value = {
    youtubeChannelId: mapping.youtube_channel_id,
    youtubeChannelTitle: mapping.youtube_channel_title || '',
    youtubeChannelUrl: mapping.youtube_channel_url || '',
    giltubeChannelId: mapping.giltube_channel_id,
    createNewChannel: false,
  }
}

const removeMapping = async (mapping: YouTubeMirrorChannel) => {
  if (!confirm(t('youtubeMirrorAdmin.confirmDelete', { title: mapping.youtube_channel_title || mapping.youtube_channel_id }))) return
  mappingError.value = ''
  try {
    await deleteYouTubeMirrorChannel(mapping.youtube_channel_id)
    await loadMappings()
  } catch (err: any) {
    mappingError.value = err?.response?.data?.error || err?.message || t('youtubeMirrorAdmin.errors.deleteMapping')
  }
}

onMounted(loadMappings)
</script>
