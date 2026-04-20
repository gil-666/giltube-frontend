<template>
  <div class="max-w-7xl mx-auto">
    <div v-if="!isLoading && analytics" class="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800">
      <!-- Header -->
      <h2 class="text-2xl font-bold mb-6">Channel Metrics</h2>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-zinc-800 rounded-lg p-6">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-gray-400 text-sm mb-2">Total Views</p>
              <p class="text-4xl font-bold">{{ formatNumber(analytics.total_views) }}</p>
            </div>
            <svg class="w-12 h-12 text-blue-500/30" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div class="bg-zinc-800 rounded-lg p-6">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-gray-400 text-sm mb-2">Total Likes</p>
              <p class="text-4xl font-bold">{{ formatNumber(analytics.total_likes) }}</p>
            </div>
            <svg class="w-12 h-12 text-red-500/30" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
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
        <p class="text-gray-400 text-sm">Loading metrics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-lg mb-8">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { getChannelAnalytics } from '~/app/service/videos'
import Chart from 'chart.js/auto'

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

const generateChartData = () => {
  if (!analytics.value) return null

  return {
    labels: ['Views', 'Likes'],
    datasets: [
      {
        label: 'Engagement',
        data: [analytics.value.total_views, analytics.value.total_likes],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['#3b82f6', '#ef4444'],
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
    const data = await getChannelAnalytics(props.channelId)
    console.log('[Analytics] Data loaded:', data)
    
    analytics.value = data
    isLoading.value = false
  } catch (err) {
    console.error('[Analytics] Error loading analytics:', err)
    error.value = 'Failed to load analytics'
    isLoading.value = false
  }
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
