<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">{{ t('admin.captionJobs.title') }}</h2>
        <p class="mt-1 text-sm text-gray-400">{{ t('admin.captionJobs.subtitle') }}</p>
        <p v-if="workersOnline > 0" class="mt-1 text-xs text-emerald-300/90">{{ t('admin.captionJobs.workersOnline', { count: workersOnline }) }}</p>
        <p v-else class="mt-1 text-xs text-yellow-300/80">{{ t('admin.captionJobs.noWorkers') }}</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label class="text-xs font-medium text-gray-500">
          {{ t('admin.captionJobs.statusFilter') }}
          <select
            v-model="statusFilter"
            class="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30 sm:w-44"
          >
            <option v-for="status in statuses" :key="status" :value="status">
              {{ t(`admin.captionJobs.statuses.${status}`) }}{{ status !== 'all' && counts[status] ? ` (${counts[status]})` : '' }}
            </option>
          </select>
        </label>
        <button
          class="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-blue-500 hover:text-white disabled:opacity-60"
          :disabled="backfilling"
          @click="backfill"
        >
          {{ backfilling ? t('admin.captionJobs.backfilling') : t('admin.captionJobs.backfill') }}
        </button>
        <button
          class="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-blue-500 hover:text-white"
          :disabled="loading"
          @click="loadJobs"
        >
          {{ loading ? t('common.loading') : t('common.refresh') }}
        </button>
      </div>
    </div>

    <div v-if="notice" class="rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">
      {{ notice }}
    </div>
    <div v-if="error" class="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
      {{ error }}
    </div>

    <div class="rounded-xl border border-white/[0.07] bg-zinc-950/70">
      <div v-if="!jobs.length && !loading" class="p-8 text-center text-gray-500">
        {{ t('admin.captionJobs.empty') }}
      </div>
      <div v-else class="divide-y divide-white/[0.07]">
        <article
          v-for="job in jobs"
          :key="job.video_id"
          class="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_11rem_minmax(0,1fr)_12rem]"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate text-base font-bold text-white">{{ job.title || job.video_id }}</h3>
              <span :class="statusClass(job.status)" class="rounded-full px-2 py-0.5 text-xs font-medium">
                {{ labelStatus(job.status) }}
              </span>
              <span class="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-gray-300">
                {{ job.mode === 'manual' ? t('admin.captionJobs.mode.manual') : t('admin.captionJobs.mode.auto') }}
              </span>
            </div>
            <p class="mt-1 break-all text-xs text-gray-500">{{ job.video_id }}</p>
            <p v-if="job.error_message" :class="job.status === 'skipped' ? 'border-yellow-900/70 bg-yellow-950/30 text-yellow-100' : 'border-red-900/70 bg-red-950/30 text-red-200'" class="mt-2 rounded border p-2 text-xs">
              {{ job.error_message }}
            </p>
          </div>

          <div>
            <div class="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div class="h-full rounded-full bg-primary-500 transition-all" :style="{ width: `${safeProgress(job.progress)}%` }" />
            </div>
            <p class="mt-2 text-sm text-gray-300">{{ safeProgress(job.progress) }}%</p>
          </div>

          <div class="space-y-1 text-xs text-gray-400">
            <p>{{ t('admin.captionJobs.requested', { language: languageName(job.requested_language) }) }}</p>
            <p v-if="job.detected_language">{{ t('admin.captionJobs.detected', { language: languageName(job.detected_language) }) }}</p>
            <p>{{ t('admin.captionJobs.attempts', { count: job.attempts || 0 }) }}</p>
            <p v-if="job.worker_id" class="break-all">{{ t('admin.captionJobs.worker', { name: job.worker_name || job.worker_id }) }}</p>
            <p>{{ t('admin.captionJobs.updated', { date: formatDate(job.updated_at) }) }}</p>
          </div>

          <div class="flex flex-wrap content-start gap-2 lg:justify-end">
            <button
              v-if="job.status !== 'running'"
              class="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-on-accent transition hover:bg-blue-600 disabled:opacity-60"
              :disabled="busyId === job.video_id"
              @click="runAction(job, 'retry')"
            >
              {{ t('admin.captionJobs.actions.retry') }}
            </button>
            <button
              v-if="['queued', 'running', 'failed'].includes(job.status)"
              class="rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-red-50 transition hover:bg-red-700 disabled:opacity-60"
              :disabled="busyId === job.video_id"
              @click="runAction(job, 'cancel')"
            >
              {{ t('admin.captionJobs.actions.cancel') }}
            </button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  backfillCaptionJobs,
  cancelCaptionJob,
  listCaptionJobs,
  retryCaptionJob,
  type CaptionJob,
} from '~/app/service/captionJobs'

const { t } = useI18n()
const statuses = ['all', 'queued', 'running', 'completed', 'skipped', 'failed', 'cancelled']
const jobs = ref<CaptionJob[]>([])
const counts = ref<Record<string, number>>({})
const workersOnline = ref(0)
const statusFilter = ref('all')
const loading = ref(false)
const backfilling = ref(false)
const error = ref('')
const notice = ref('')
const busyId = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const loadJobs = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await listCaptionJobs(statusFilter.value)
    jobs.value = data.items
    counts.value = data.counts
    workersOnline.value = data.workers_online
  } catch (err) {
    console.error(err)
    error.value = t('admin.captionJobs.loadError')
  } finally {
    loading.value = false
  }
}

const runAction = async (job: CaptionJob, action: 'retry' | 'cancel') => {
  busyId.value = job.video_id
  error.value = ''
  try {
    if (action === 'retry') await retryCaptionJob(job.video_id)
    if (action === 'cancel') await cancelCaptionJob(job.video_id)
    await loadJobs()
  } catch (err) {
    console.error(err)
    error.value = t('admin.captionJobs.actionError')
  } finally {
    busyId.value = ''
  }
}

const backfill = async () => {
  if (!window.confirm(t('admin.captionJobs.confirmBackfill'))) return
  backfilling.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await backfillCaptionJobs()
    notice.value = t('admin.captionJobs.backfillResult', { count: result.queued || 0 })
    await loadJobs()
  } catch (err) {
    console.error(err)
    error.value = t('admin.captionJobs.actionError')
  } finally {
    backfilling.value = false
  }
}

const languageName = (code: string) =>
  ['auto', 'en', 'es'].includes(code) ? t(`videoEditor.autoCaptions.languages.${code}`) : code

const safeProgress = (progress: number) => Math.max(0, Math.min(100, Math.round(progress || 0)))
const labelStatus = (status: string) => statuses.includes(status) ? t(`admin.captionJobs.statuses.${status}`) : status

const statusClass = (status: string) => {
  if (status === 'running') return 'bg-green-900 text-green-200'
  if (status === 'queued') return 'bg-blue-900 text-blue-200'
  if (status === 'skipped') return 'bg-yellow-900 text-yellow-200'
  if (status === 'failed' || status === 'cancelled') return 'bg-red-900 text-red-200'
  return 'bg-zinc-800 text-gray-200'
}

const formatDate = (value?: string) => {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

watch(statusFilter, loadJobs)

onMounted(() => {
  loadJobs()
  pollTimer = setInterval(loadJobs, 5000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
