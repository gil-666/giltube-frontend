<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">{{ t('admin.transcodeJobs.title') }}</h2>
        <p class="mt-1 text-sm text-gray-400">{{ t('admin.transcodeJobs.subtitle') }}</p>
        <p class="mt-1 text-xs text-yellow-300/80">{{ t('admin.transcodeJobs.softCancelNote') }}</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label class="text-xs font-bold uppercase tracking-wide text-gray-500">
          {{ t('admin.transcodeJobs.statusFilter') }}
          <select
            v-model="statusFilter"
            class="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 sm:w-44"
          >
            <option v-for="status in statuses" :key="status" :value="status">
              {{ t(`admin.transcodeJobs.statuses.${status}`) }}
            </option>
          </select>
        </label>
        <button
          class="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-blue-500 hover:text-white"
          :disabled="loading"
          @click="loadJobs"
        >
          {{ loading ? t('common.loading') : t('common.refresh') }}
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
      {{ error }}
    </div>

    <div class="rounded-xl border border-zinc-800 bg-zinc-950/70">
      <div v-if="!jobs.length && !loading" class="p-8 text-center text-gray-500">
        {{ t('admin.transcodeJobs.empty') }}
      </div>
      <div v-else class="divide-y divide-zinc-800">
        <article
          v-for="job in jobs"
          :key="job.video_id"
          class="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_11rem_minmax(0,1fr)_18rem]"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate text-base font-bold text-white">{{ job.title || job.video_id }}</h3>
              <span :class="statusClass(job.status)" class="rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
                {{ labelStatus(job.status) }}
              </span>
            </div>
            <p class="mt-1 break-all text-xs text-gray-500">{{ job.video_id }}</p>
            <p class="mt-3 line-clamp-2 break-all rounded bg-black/40 p-2 font-mono text-xs text-gray-400">
              {{ job.file_path }}
            </p>
            <p v-if="job.error_message" class="mt-2 rounded border border-red-900/70 bg-red-950/30 p-2 text-xs text-red-200">
              {{ job.error_message }}
            </p>
          </div>

          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-500">{{ t('admin.transcodeJobs.progress') }}</p>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div class="h-full rounded-full bg-red-500 transition-all" :style="{ width: `${safeProgress(job.progress)}%` }" />
            </div>
            <p class="mt-2 text-sm text-gray-300">{{ safeProgress(job.progress) }}%</p>
            <p class="mt-1 text-xs text-gray-500">{{ t('admin.transcodeJobs.videoStatus', { status: job.video_status || 'unknown', progress: job.video_progress || 0 }) }}</p>
          </div>

          <div class="space-y-1 text-xs text-gray-400">
            <p>{{ t('admin.transcodeJobs.attempts', { count: job.attempts || 0 }) }}</p>
            <p v-if="job.worker_id" class="break-all">{{ t('admin.transcodeJobs.worker', { id: job.worker_id }) }}</p>
            <p>{{ t('admin.transcodeJobs.updated', { date: formatDate(job.updated_at) }) }}</p>
            <p v-if="job.started_at">{{ t('admin.transcodeJobs.started', { date: formatDate(job.started_at) }) }}</p>
            <p v-if="job.finished_at">{{ t('admin.transcodeJobs.finished', { date: formatDate(job.finished_at) }) }}</p>
          </div>

          <div class="flex flex-wrap content-start gap-2 lg:justify-end">
            <button
              v-if="canStart(job.status)"
              class="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
              :disabled="busyId === job.video_id"
              @click="runAction(job, 'start')"
            >
              {{ t('admin.transcodeJobs.actions.start') }}
            </button>
            <button
              class="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-zinc-700 disabled:opacity-60"
              :disabled="busyId === job.video_id"
              @click="runAction(job, 'restart')"
            >
              {{ t('admin.transcodeJobs.actions.restart') }}
            </button>
            <button
              v-if="canPause(job.status)"
              class="rounded-lg bg-yellow-800 px-3 py-2 text-sm font-semibold text-yellow-50 transition hover:bg-yellow-700 disabled:opacity-60"
              :disabled="busyId === job.video_id"
              @click="runAction(job, 'pause')"
            >
              {{ t('admin.transcodeJobs.actions.pause') }}
            </button>
            <button
              v-if="canCancel(job.status)"
              class="rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-red-50 transition hover:bg-red-700 disabled:opacity-60"
              :disabled="busyId === job.video_id"
              @click="runAction(job, 'cancel')"
            >
              {{ t('admin.transcodeJobs.actions.cancel') }}
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
  cancelTranscodeJob,
  listTranscodeJobs,
  pauseTranscodeJob,
  restartTranscodeJob,
  startTranscodeJob,
  type TranscodeJob,
} from '~/app/service/transcodeJobs'

const { t } = useI18n()
const statuses = ['all', 'queued', 'running', 'paused', 'failed', 'cancelled', 'completed']
const jobs = ref<TranscodeJob[]>([])
const statusFilter = ref('all')
const loading = ref(false)
const error = ref('')
const busyId = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const loadJobs = async () => {
  loading.value = true
  error.value = ''
  try {
    jobs.value = await listTranscodeJobs(statusFilter.value)
  } catch (err) {
    console.error(err)
    error.value = t('admin.transcodeJobs.loadError')
  } finally {
    loading.value = false
  }
}

const runAction = async (job: TranscodeJob, action: 'start' | 'restart' | 'pause' | 'cancel') => {
  if (action === 'cancel' && !window.confirm(t('admin.transcodeJobs.confirmCancel', { title: job.title || job.video_id }))) {
    return
  }
  busyId.value = job.video_id
  error.value = ''
  try {
    if (action === 'start') await startTranscodeJob(job.video_id)
    if (action === 'restart') await restartTranscodeJob(job.video_id)
    if (action === 'pause') await pauseTranscodeJob(job.video_id)
    if (action === 'cancel') await cancelTranscodeJob(job.video_id)
    await loadJobs()
  } catch (err) {
    console.error(err)
    error.value = t('admin.transcodeJobs.actionError')
  } finally {
    busyId.value = ''
  }
}

const safeProgress = (progress: number) => Math.max(0, Math.min(100, Math.round(progress || 0)))
const canStart = (status: string) => ['paused', 'failed', 'cancelled'].includes(status)
const canPause = (status: string) => ['queued', 'running', 'failed'].includes(status)
const canCancel = (status: string) => ['queued', 'running', 'paused', 'failed'].includes(status)
const labelStatus = (status: string) => statuses.includes(status) ? t(`admin.transcodeJobs.statuses.${status}`) : status

const statusClass = (status: string) => {
  if (status === 'running') return 'bg-green-900 text-green-200'
  if (status === 'queued') return 'bg-blue-900 text-blue-200'
  if (status === 'paused') return 'bg-yellow-900 text-yellow-200'
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
