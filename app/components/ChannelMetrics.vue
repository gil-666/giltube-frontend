<template>
  <div class="mx-auto max-w-[96rem]">
    <div v-if="!isLoading && analytics" class="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800">
      <!-- Header -->
      <h2 class="text-2xl font-bold mb-6">{{ t('channelMetrics.title') }}</h2>

      <!-- Stats Grid -->
      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="metric in metricCards" :key="metric.label" class="bg-zinc-800 rounded-lg p-6">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-gray-400 text-sm mb-2">{{ metric.label }}</p>
              <p class="text-4xl font-bold">{{ metric.value }}</p>
              <p v-if="metric.detail" class="mt-2 text-xs text-zinc-500">{{ metric.detail }}</p>
            </div>
            <svg class="w-12 h-12" :class="metric.iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="metric.icon" />
            </svg>
          </div>
        </div>
      </div>

      <div class="mb-6 grid gap-4 lg:grid-cols-3">
        <div class="rounded-lg bg-zinc-800 p-5">
          <p class="text-sm font-semibold text-zinc-300">{{ t('channelMetrics.watchPerformance') }}</p>
          <div class="mt-4 space-y-4">
            <div>
              <div class="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{{ t('channelMetrics.averageCompletion') }}</span>
                <span>{{ formatPercent(analytics.average_completion_rate) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-zinc-700">
                <div class="h-full rounded-full bg-blue-500" :style="{ width: formatPercent(analytics.average_completion_rate) }" />
              </div>
            </div>
            <div>
              <div class="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{{ t('channelMetrics.completedWatchRate') }}</span>
                <span>{{ formatPercent(analytics.completed_to_watch_rate) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-zinc-700">
                <div class="h-full rounded-full bg-emerald-500" :style="{ width: formatPercent(analytics.completed_to_watch_rate) }" />
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-zinc-800 p-5">
          <p class="text-sm font-semibold text-zinc-300">{{ t('channelMetrics.engagementRates') }}</p>
          <div class="mt-4 space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-zinc-400">{{ t('channelMetrics.likeRate') }}</span>
              <span class="font-semibold text-white">{{ formatPercent(analytics.like_to_view_rate) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-zinc-400">{{ t('channelMetrics.commentRate') }}</span>
              <span class="font-semibold text-white">{{ formatPercent(analytics.comment_to_view_rate) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-zinc-400">{{ t('channelMetrics.engagementRate') }}</span>
              <span class="font-semibold text-white">{{ formatPercent(analytics.engagement_to_view_rate) }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-zinc-800 p-5">
          <p class="text-sm font-semibold text-zinc-300">{{ t('channelMetrics.contentInventory') }}</p>
          <div class="mt-4 space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-zinc-400">{{ t('channelMetrics.publicVideos') }}</span>
              <span class="font-semibold text-white">{{ formatNumber(analytics.public_videos || 0) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-zinc-400">{{ t('channelMetrics.unlistedVideos') }}</span>
              <span class="font-semibold text-white">{{ formatNumber(analytics.unlisted_videos || 0) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-zinc-400">{{ t('channelMetrics.averageWatch') }}</span>
              <span class="font-semibold text-white">{{ formatDuration(analytics.average_watch_seconds || 0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-zinc-800 rounded-lg p-4 md:p-6 w-full">
        <div class="relative w-full" style="height: 250px;">
          <canvas ref="chartRef" style="display: block;"></canvas>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800 text-center">
      <div class="inline-block">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
        <p class="text-gray-400 text-sm">{{ t('channelMetrics.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-lg mb-8">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { getChannelAnalytics, getMyVideos } from '~/app/service/videos'
import Chart from 'chart.js/auto'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  channelId: string
}>()

const isLoading = ref(true)
const error = ref('')
const analytics = ref<any>(null)
const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDuration = (seconds: number) => {
  const total = Math.max(0, seconds || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const formatPercent = (value: number) => `${Math.round(Math.max(0, Math.min(value || 0, 1)) * 100)}%`

const metricCards = computed(() => {
  const data = analytics.value || {}
  return [
    {
      label: t('channelMetrics.totalViews'),
      value: formatNumber(data.total_views || 0),
      detail: t('channelMetrics.totalVideosDetail', { count: formatNumber(data.total_videos || 0) }),
      iconClass: 'text-blue-500/40',
      icon: 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    },
    {
      label: t('channelMetrics.watchTime'),
      value: formatDuration(data.total_watch_seconds || 0),
      detail: t('channelMetrics.watchSessionsDetail', { count: formatNumber(data.watch_sessions || 0) }),
      iconClass: 'text-cyan-500/40',
      icon: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    },
    {
      label: t('channelMetrics.totalLikes'),
      value: formatNumber(data.total_likes || 0),
      detail: t('channelMetrics.likeRateDetail', { rate: formatPercent(data.like_to_view_rate || 0) }),
      iconClass: 'text-red-500/40',
      icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z',
    },
    {
      label: t('channelMetrics.totalComments'),
      value: formatNumber(data.total_comments || 0),
      detail: t('channelMetrics.commentRateDetail', { rate: formatPercent(data.comment_to_view_rate || 0) }),
      iconClass: 'text-amber-500/40',
      icon: 'M7.5 8.25h9m-9 3h5.25M21 12c0 4.556-4.03 8.25-9 8.25a9.77 9.77 0 0 1-2.555-.337L3 21l1.335-4.01A7.895 7.895 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z',
    },
    {
      label: t('channelMetrics.completedWatches'),
      value: formatNumber(data.completed_watches || 0),
      detail: t('channelMetrics.completedRateDetail', { rate: formatPercent(data.completed_to_watch_rate || 0) }),
      iconClass: 'text-emerald-500/40',
      icon: 'm4.5 12.75 6 6 9-13.5',
    },
    {
      label: t('channelMetrics.averageCompletion'),
      value: formatPercent(data.average_completion_rate || 0),
      detail: t('channelMetrics.averageWatchDetail', { duration: formatDuration(data.average_watch_seconds || 0) }),
      iconClass: 'text-violet-500/40',
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125C16.5 3.504 17.004 3 17.625 3h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
    },
  ]
})

const generateChartData = () => {
  if (!analytics.value) return null

  return {
    labels: [
      t('channelMetrics.views'),
      t('channelMetrics.likes'),
      t('channelMetrics.comments'),
      t('channelMetrics.watchSessions'),
      t('channelMetrics.completedWatches'),
    ],
    datasets: [
      {
        label: t('channelMetrics.engagement'),
        data: [
          analytics.value.total_views,
          analytics.value.total_likes,
          analytics.value.total_comments,
          analytics.value.watch_sessions,
          analytics.value.completed_watches,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: ['#3b82f6', '#ef4444', '#f59e0b', '#06b6d4', '#10b981'],
        borderWidth: 2,
      }
    ]
  }
}

const createChart = () => {
  if (!chartRef.value) {
    console.error('[Chart] No canvas ref found')
    return
  }

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) {
    console.error('[Chart] Could not get 2D context')
    return
  }

  try {
    const chartData = generateChartData()
    if (!chartData) {
      console.error('[Chart] No chart data generated')
      return
    }

    console.log('[Chart] Creating chart with data:', chartData.labels.length, 'data points')
    
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#9ca3af',
              boxWidth: 12,
              padding: 15,
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                return context.label + ': ' + formatNumber(context.parsed)
              }
            }
          }
        }
      }
    })
    
    console.log('[Chart] Chart created successfully')
  } catch (err) {
    console.error('[Chart] Failed to create chart:', err)
  }
}

const loadAnalytics = async () => {
  if (!props.channelId) {
    console.log('[Analytics] No channelId provided')
    return
  }

  try {
    isLoading.value = true
    error.value = ''
    analytics.value = null

    console.log('[Analytics] Loading for channel:', props.channelId)
    const [data, videos] = await Promise.all([
      getChannelAnalytics(props.channelId),
      getMyVideos(props.channelId).catch(() => []),
    ])
    console.log('[Analytics] Data loaded:', data)
    
    analytics.value = mergeVideoListMetrics(data, Array.isArray(videos) ? videos : [])
    isLoading.value = false
  } catch (err) {
    console.error('[Analytics] Error loading analytics:', err)
    error.value = t('channelMetrics.loadError')
    isLoading.value = false
  }
}

const mergeVideoListMetrics = (data: any, videos: any[]) => {
  const totalVideos = videos.length
  const publicVideos = videos.filter(video => !video.hidden).length
  const unlistedVideos = videos.filter(video => video.hidden).length
  const totalComments = videos.reduce((sum, video) => sum + Number(video.comments_count || 0), 0)
  const totalLikes = videos.reduce((sum, video) => sum + Number(video.likes || 0), 0)
  const totalViews = videos.reduce((sum, video) => sum + Number(video.views || 0), 0)

  const next = {
    ...data,
    total_videos: totalVideos || data?.total_videos || 0,
    public_videos: totalVideos ? publicVideos : data?.public_videos || 0,
    unlisted_videos: totalVideos ? unlistedVideos : data?.unlisted_videos || 0,
    total_comments: totalVideos ? totalComments : data?.total_comments || 0,
    total_likes: totalVideos ? totalLikes : data?.total_likes || 0,
    total_views: totalVideos ? totalViews : data?.total_views || 0,
  }

  next.engagement_actions = Number(next.total_likes || 0) + Number(next.total_comments || 0)
  next.like_to_view_rate = ratio(next.total_likes, next.total_views)
  next.comment_to_view_rate = ratio(next.total_comments, next.total_views)
  next.engagement_to_view_rate = ratio(next.engagement_actions, next.total_views)
  return next
}

const ratio = (numerator: number, denominator: number) => {
  const bottom = Number(denominator || 0)
  if (bottom <= 0) return 0
  return Number(numerator || 0) / bottom
}

// Watch for analytics changes and create chart when available
watch(analytics, async () => {
  if (!analytics.value) return
  
  console.log('[Analytics] Analytics changed, waiting for canvas...')
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  
  console.log('[Analytics] Canvas ref exists?', !!chartRef.value)
  
  if (chartRef.value) {
    console.log('[Analytics] Creating chart with canvas...')
    createChart()
  } else {
    console.error('[Analytics] Canvas ref is null!')
  }
})

onMounted(() => {
  loadAnalytics()
})
</script>
