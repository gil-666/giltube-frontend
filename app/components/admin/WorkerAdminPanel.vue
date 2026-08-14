<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">{{ t('admin.workers.title') }}</h2>
        <p class="mt-1 text-sm text-zinc-400">{{ t('admin.workers.subtitle') }}</p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
          :disabled="loading"
          @click="loadWorkers"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7" /></svg>
          {{ t('common.refresh') }}
        </button>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
          :disabled="creatingCode"
          @click="createCode"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14" /></svg>
          {{ t('admin.workers.add') }}
        </button>
      </div>
    </header>

    <div class="grid grid-cols-3 divide-x divide-zinc-800 border-y border-zinc-800 py-3">
      <div class="px-3 first:pl-0">
        <p class="text-xs font-semibold uppercase text-zinc-500">{{ t('admin.workers.online') }}</p>
        <p class="mt-1 text-2xl font-bold text-emerald-400">{{ onlineCount }}</p>
      </div>
      <div class="px-3">
        <p class="text-xs font-semibold uppercase text-zinc-500">{{ t('admin.workers.gpu') }}</p>
        <p class="mt-1 text-2xl font-bold text-blue-400">{{ gpuCount }}</p>
      </div>
      <div class="px-3">
        <p class="text-xs font-semibold uppercase text-zinc-500">{{ t('admin.workers.activeJobs') }}</p>
        <p class="mt-1 text-2xl font-bold text-amber-300">{{ activeJobCount }}</p>
      </div>
    </div>

    <p v-if="error" class="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{{ error }}</p>
    <div v-if="loading && workers.length === 0" class="grid gap-3 lg:grid-cols-2">
      <div v-for="index in 4" :key="index" class="h-44 animate-pulse rounded-md border border-zinc-800 bg-zinc-900/60" />
    </div>
    <div v-else-if="workers.length === 0" class="border-y border-zinc-800 py-12 text-center text-sm text-zinc-400">
      {{ t('admin.workers.empty') }}
    </div>

    <div v-else class="grid gap-3 lg:grid-cols-2">
      <article v-for="worker in workers" :key="worker.id" class="rounded-md border border-zinc-800 bg-zinc-950 p-4">
        <div class="flex items-start gap-3">
          <span class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2" stroke-width="2"/><path stroke-width="2" d="M8 21h8M12 18v3M7 9h2m2 0h6M7 13h5" /></svg>
            <span :class="statusDotClass(worker.status)" class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-zinc-950" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate text-base font-bold text-white">{{ worker.name }}</h3>
              <span :class="statusBadgeClass(worker.status)" class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase">{{ t(`admin.workers.statuses.${worker.status}`) }}</span>
              <span v-if="!worker.managed" class="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">{{ t('admin.workers.local') }}</span>
              <span v-if="worker.is_primary" class="rounded bg-blue-950 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-300">{{ t('admin.workers.primary') }}</span>
              <span v-if="worker.fallback_active" class="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">{{ t('admin.workers.fallbackActive') }}</span>
            </div>
            <p class="mt-0.5 truncate text-xs text-zinc-500">{{ worker.id }}</p>
          </div>
          <button
            v-if="worker.managed && !worker.disabled"
            type="button"
            class="rounded-md p-2 text-zinc-400 transition hover:bg-red-950 hover:text-red-300"
            :title="t('admin.workers.revoke')"
            @click="confirmRevoke(worker)"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M5.6 20h12.8a2 2 0 0 0 1.73-3L13.73 6a2 2 0 0 0-3.46 0L3.87 17a2 2 0 0 0 1.73 3Z" /></svg>
          </button>
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt class="text-xs text-zinc-500">{{ t('admin.workers.system') }}</dt><dd class="mt-0.5 capitalize text-zinc-200">{{ worker.platform }} · {{ worker.arch }}</dd></div>
          <div><dt class="text-xs text-zinc-500">{{ t('admin.workers.encoder') }}</dt><dd class="mt-0.5 flex items-center gap-1.5 text-zinc-200"><span v-if="worker.is_gpu" class="rounded bg-blue-950 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">GPU</span>{{ worker.encoder }}</dd></div>
          <div><dt class="text-xs text-zinc-500">{{ t('admin.workers.roles') }}</dt><dd class="mt-0.5 text-zinc-200">{{ worker.roles.join(', ') }}</dd></div>
          <div><dt class="text-xs text-zinc-500">{{ t('admin.workers.lastSeen') }}</dt><dd class="mt-0.5 text-zinc-200">{{ formatRelative(worker.last_seen) }}</dd></div>
        </dl>

        <div v-if="!worker.disabled" class="mt-4 flex items-center justify-between gap-4 border-t border-zinc-800 pt-3">
          <div>
            <p class="text-sm font-semibold text-zinc-200">{{ t('admin.workers.acceptJobs') }}</p>
            <p class="mt-0.5 text-xs text-zinc-500">{{ worker.fallback_active ? t('admin.workers.fallbackHelp') : t('admin.workers.acceptJobsHelp') }}</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="!worker.scheduling_disabled"
            :aria-label="t('admin.workers.acceptJobs')"
            :disabled="updatingWorker === worker.id"
            :class="!worker.scheduling_disabled ? 'bg-emerald-500' : 'bg-zinc-700'"
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
            @click="toggleScheduling(worker)"
          >
            <span :class="!worker.scheduling_disabled ? 'translate-x-5' : 'translate-x-1'" class="absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform" />
          </button>
        </div>

        <div v-if="worker.current_job" class="mt-4 border-t border-zinc-800 pt-3">
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="truncate font-semibold text-zinc-200">{{ worker.current_job.video_title || worker.current_job.video_id }}</span>
            <span class="shrink-0 tabular-nums text-zinc-400">{{ worker.current_job.progress }}%</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div class="h-full rounded-full bg-red-500 transition-all" :style="{ width: `${worker.current_job.progress}%` }" /></div>
        </div>

        <div v-if="worker.disabled" class="mt-4 flex gap-2 border-t border-zinc-800 pt-3">
          <button type="button" class="rounded-md bg-zinc-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-zinc-700" @click="enable(worker)">{{ t('admin.workers.enable') }}</button>
          <button type="button" class="rounded-md px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-950" @click="remove(worker)">{{ t('common.delete') }}</button>
        </div>
      </article>
    </div>

    <div v-if="codeModalOpen" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" @click.self="closeCodeModal">
      <div class="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header class="flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
          <div><h3 class="text-xl font-bold text-white">{{ t('admin.workers.enrollTitle') }}</h3><p class="mt-1 text-sm text-zinc-400">{{ t('admin.workers.enrollSubtitle') }}</p></div>
          <button type="button" class="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" :aria-label="t('common.close')" @click="closeCodeModal">X</button>
        </header>
        <div class="space-y-5 p-5">
          <div>
            <p class="text-xs font-bold uppercase text-zinc-500">{{ t('admin.workers.download') }}</p>
            <div v-if="releasesLoading" class="mt-2 h-16 animate-pulse rounded-md border border-zinc-800 bg-zinc-900" />
            <div v-else-if="recommendedRelease" class="mt-2 flex items-center gap-3 rounded-md border border-zinc-700 bg-zinc-900 p-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></svg>
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-bold capitalize text-white">{{ osLabel(recommendedRelease.os) }} · {{ archLabel(recommendedRelease.arch) }}</p>
                <p class="text-xs text-zinc-500">{{ formatBytes(recommendedRelease.size) }} · {{ recommendedRelease.version }}</p>
              </div>
              <button type="button" class="rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50" :disabled="downloadingFilename === recommendedRelease.filename" @click="downloadRelease(recommendedRelease)">{{ t('admin.workers.downloadButton') }}</button>
            </div>
            <details v-if="otherReleases.length" class="mt-2">
              <summary class="cursor-pointer text-xs font-semibold text-zinc-400 hover:text-white">{{ t('admin.workers.otherPlatforms') }}</summary>
              <div class="mt-2 divide-y divide-zinc-800 rounded-md border border-zinc-800">
                <div v-for="release in otherReleases" :key="release.filename" class="flex items-center gap-3 px-3 py-2.5">
                  <div class="min-w-0 flex-1"><p class="text-sm font-semibold capitalize text-zinc-200">{{ osLabel(release.os) }} · {{ archLabel(release.arch) }}</p><p class="truncate text-[11px] text-zinc-500">{{ formatBytes(release.size) }} · SHA-256 {{ release.sha256.slice(0, 12) }}…</p></div>
                  <button type="button" class="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50" :disabled="downloadingFilename === release.filename" :title="t('admin.workers.downloadButton')" @click="downloadRelease(release)"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></svg></button>
                </div>
              </div>
            </details>
            <div v-if="recommendedRelease" class="mt-3 rounded-md border border-zinc-800 bg-black p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-bold uppercase text-zinc-500">{{ t('admin.workers.headlessDownload') }}</p>
                <button type="button" class="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white" @click="copyWgetCommand">
                  {{ wgetCopied ? t('admin.workers.copied') : t('admin.workers.copy') }}
                </button>
              </div>
              <code class="mt-2 block select-all break-all text-xs leading-5 text-emerald-300">{{ wgetCommand }}</code>
            </div>
            <p v-if="releaseError" class="mt-2 text-xs text-red-300">{{ releaseError }}</p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase text-zinc-500">{{ t('admin.workers.oneTimeCode') }}</p>
            <div class="mt-2 flex items-center gap-2 rounded-md border border-zinc-700 bg-black p-3">
              <code class="min-w-0 flex-1 break-all text-base font-bold text-white">{{ enrollmentCode }}</code>
              <button type="button" class="shrink-0 rounded-md bg-zinc-800 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-700" @click="copyCode">{{ copied ? t('admin.workers.copied') : t('admin.workers.copy') }}</button>
            </div>
            <p class="mt-2 text-xs text-amber-300">{{ t('admin.workers.expires', { time: formatExpiry(enrollmentExpiresAt) }) }}</p>
          </div>
          <ol class="space-y-3 text-sm text-zinc-300">
            <li class="flex gap-3"><span class="font-bold text-red-400">1</span><span>{{ t('admin.workers.stepDownload') }}</span></li>
            <li class="flex gap-3"><span class="font-bold text-red-400">2</span><span>{{ t('admin.workers.stepRun') }}</span></li>
            <li class="flex gap-3"><span class="font-bold text-red-400">3</span><span>{{ t('admin.workers.stepEnter') }}</span></li>
          </ol>
          <p class="border-t border-zinc-800 pt-4 text-xs text-zinc-500">{{ t('admin.workers.networkNote') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createWorkerEnrollmentCode, deleteWorker, downloadWorkerRelease, enableWorker, listWorkerReleases, listWorkers, revokeWorker, setWorkerScheduling, type WorkerNode, type WorkerRelease } from '~/app/service/workers'

const { t } = useI18n()
const workers = ref<WorkerNode[]>([])
const loading = ref(false)
const creatingCode = ref(false)
const error = ref('')
const codeModalOpen = ref(false)
const enrollmentCode = ref('')
const enrollmentExpiresAt = ref('')
const copied = ref(false)
const wgetCopied = ref(false)
const releases = ref<WorkerRelease[]>([])
const releasesLoading = ref(false)
const releaseError = ref('')
const downloadingFilename = ref('')
const updatingWorker = ref('')
let refreshTimer: ReturnType<typeof setInterval> | null = null

const onlineCount = computed(() => workers.value.filter(worker => worker.status === 'online' && worker.effective_enabled).length)
const gpuCount = computed(() => workers.value.filter(worker => worker.is_gpu && !worker.disabled && worker.effective_enabled).length)
const activeJobCount = computed(() => workers.value.filter(worker => worker.current_job).length)
const detectedPlatform = computed(() => {
  if (!import.meta.client) return { os: 'linux', arch: 'amd64' }
  const ua = navigator.userAgent.toLowerCase()
  const platform = (navigator as any).userAgentData?.platform?.toLowerCase?.() || navigator.platform?.toLowerCase?.() || ''
  const os = ua.includes('windows') ? 'windows' : ua.includes('mac') || platform.includes('mac') ? 'darwin' : 'linux'
  const arch = ua.includes('arm64') || ua.includes('aarch64') || platform.includes('arm') ? 'arm64' : 'amd64'
  return { os, arch }
})
const recommendedRelease = computed(() => releases.value.find(release => release.os === detectedPlatform.value.os && release.arch === detectedPlatform.value.arch) || releases.value[0])
const otherReleases = computed(() => releases.value.filter(release => release.filename !== recommendedRelease.value?.filename))
const wgetCommand = computed(() => {
  const release = recommendedRelease.value
  if (!release) return ''
  const path = `/api/v1/worker-releases/latest/${release.os}/${release.arch}/download`
  const origin = import.meta.client ? window.location.origin : ''
  return `wget --content-disposition "${origin}${path}"`
})

const loadWorkers = async () => {
  loading.value = true
  error.value = ''
  try { workers.value = await listWorkers() } catch (err: any) { error.value = err?.response?.data?.error || t('admin.workers.loadError') } finally { loading.value = false }
}

const createCode = async () => {
  creatingCode.value = true
  error.value = ''
  try {
    const result = await createWorkerEnrollmentCode()
    enrollmentCode.value = result.code
    enrollmentExpiresAt.value = result.expires_at
    copied.value = false
    codeModalOpen.value = true
    await loadReleases()
  } catch (err: any) { error.value = err?.response?.data?.error || t('admin.workers.codeError') } finally { creatingCode.value = false }
}

const loadReleases = async () => {
  releasesLoading.value = true
  releaseError.value = ''
  try { releases.value = await listWorkerReleases() } catch (err: any) { releaseError.value = err?.response?.data?.error || t('admin.workers.releaseError') } finally { releasesLoading.value = false }
}
const downloadRelease = async (release: WorkerRelease) => { downloadingFilename.value = release.filename; releaseError.value = ''; try { await downloadWorkerRelease(release) } catch (err: any) { releaseError.value = err?.response?.data?.error || t('admin.workers.downloadError') } finally { downloadingFilename.value = '' } }
const osLabel = (os: string) => os === 'darwin' ? 'macOS' : os
const archLabel = (arch: string) => arch === 'amd64' ? 'x64' : 'ARM64'
const formatBytes = (bytes: number) => `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} MB`

const closeCodeModal = () => { codeModalOpen.value = false; enrollmentCode.value = ''; enrollmentExpiresAt.value = ''; wgetCopied.value = false }
const copyCode = async () => { await navigator.clipboard.writeText(enrollmentCode.value); copied.value = true }
const copyWgetCommand = async () => { await navigator.clipboard.writeText(wgetCommand.value); wgetCopied.value = true }
const confirmRevoke = async (worker: WorkerNode) => { if (!confirm(t('admin.workers.confirmRevoke', { name: worker.name }))) return; await runAction(() => revokeWorker(worker.id)) }
const enable = async (worker: WorkerNode) => { await runAction(() => enableWorker(worker.id)) }
const remove = async (worker: WorkerNode) => { if (!confirm(t('admin.workers.confirmDelete', { name: worker.name }))) return; await runAction(() => deleteWorker(worker.id)) }
const toggleScheduling = async (worker: WorkerNode) => {
  const enabled = worker.scheduling_disabled
  if (!enabled && worker.current_job && !confirm(t('admin.workers.confirmDisable', { name: worker.name }))) return
  updatingWorker.value = worker.id
  await runAction(() => setWorkerScheduling(worker.id, enabled))
  updatingWorker.value = ''
}
const runAction = async (action: () => Promise<any>) => { error.value = ''; try { await action(); await loadWorkers() } catch (err: any) { error.value = err?.response?.data?.error || t('admin.workers.actionError') } }
const statusDotClass = (status: string) => status === 'online' ? 'bg-emerald-400' : status === 'revoked' ? 'bg-red-500' : 'bg-zinc-500'
const statusBadgeClass = (status: string) => status === 'online' ? 'bg-emerald-950 text-emerald-300' : status === 'revoked' ? 'bg-red-950 text-red-300' : 'bg-zinc-800 text-zinc-300'
const formatRelative = (value: string) => { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return t('admin.workers.secondsAgo', { count: seconds }); const minutes = Math.floor(seconds / 60); if (minutes < 60) return t('admin.workers.minutesAgo', { count: minutes }); return new Date(value).toLocaleString() }
const formatExpiry = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

onMounted(() => { loadWorkers(); refreshTimer = setInterval(loadWorkers, 20000) })
onBeforeUnmount(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>
