<template>
  <section
    v-if="ad?.creative"
    ref="rootElement"
    :class="containerClass"
    :style="containerStyle"
  >
    <a :href="ad.creative.destinationUrl || '#'" target="_blank" rel="noopener noreferrer" class="block" :style="linkStyle" @click="handleClick">
      <div :class="mediaWrapperClass" :style="mediaWrapperStyle">
        <div :class="viewportClass" :style="viewportStyle">
          <img
            v-if="ad.creative.assetUrl"
            :src="ad.creative.assetUrl"
            :alt="ad.creative.headline || fallbackTitle"
            :class="imageClass"
            :style="imageStyle"
            loading="lazy"
          />
          <div v-else class="flex h-full w-full items-center justify-center bg-white/5 px-4 text-center text-sm text-zinc-400">
            {{ ad.creative.headline || fallbackTitle }}
          </div>
        </div>
      </div>
      <div :class="copyClass">
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Sponsored</p>
          <h3 class="truncate text-xs font-semibold text-white">{{ ad.creative.headline || fallbackTitle }}</h3>
          <p v-if="ad.creative.body" class="truncate text-xs text-zinc-400">{{ ad.creative.body }}</p>
        </div>
        <button
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
          aria-label="About this sponsor"
          title="About this sponsor"
          @click.prevent.stop="showSponsorInfo = true"
        >
          i
        </button>
      </div>
    </a>

    <Teleport to="body">
      <div
        v-if="showSponsorInfo"
        class="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
        style="z-index: 2147483647 !important; pointer-events: auto; overflow: visible;"
        @click.self="showSponsorInfo = false"
      >
        <div class="w-full max-w-md rounded-lg bg-zinc-800" style="z-index: 2147483647 !important; position: relative; overflow: visible;">
          <div class="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
            <h2 class="text-lg font-semibold text-white">About this sponsor</h2>
            <button type="button" class="text-gray-400 hover:text-white" @click="showSponsorInfo = false">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4 px-6 py-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Sponsored ad</p>
              <h3 class="mt-1 text-base font-semibold text-white">{{ ad.creative.headline || fallbackTitle }}</h3>
              <p v-if="ad.creative.body" class="mt-2 text-sm text-zinc-300">{{ ad.creative.body }}</p>
            </div>

            <div v-if="ad.creative.destinationUrl" class="rounded border border-zinc-700 bg-zinc-900 p-3">
              <p class="text-xs uppercase tracking-[0.18em] text-zinc-500">Sponsor link</p>
              <p class="mt-1 break-all text-sm text-zinc-200">{{ ad.creative.destinationUrl }}</p>
            </div>

            <div class="flex justify-end">
              <a
                v-if="ad.creative.destinationUrl"
                :href="ad.creative.destinationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                @click="handleClick"
              >
                Visit sponsor
              </a>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { serveGilAd, trackGilAdEvent, type GilAdsServeResponse } from '~/app/service/gilads'

interface Props {
  placement: string
  type?: string
  size?: string
  variant?: 'banner' | 'square'
  context?: Record<string, any>
  fallbackTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'banner',
  size: '',
  variant: 'banner',
  context: () => ({}),
  fallbackTitle: 'Sponsored',
})

const ad = ref<GilAdsServeResponse | null>(null)
const impressionTracked = ref(false)
const rootElement = ref<HTMLElement | null>(null)
const showSponsorInfo = ref(false)
let observer: IntersectionObserver | null = null

const containerClass = computed(() => (
  props.variant === 'square'
    ? 'overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 via-zinc-950 to-zinc-900 shadow-[0_20px_80px_rgba(6,182,212,0.12)]'
    : 'mx-auto overflow-hidden rounded-[18px] border border-cyan-400/20 bg-gradient-to-r from-cyan-950/60 via-zinc-950 to-zinc-900 shadow-[0_12px_36px_rgba(6,182,212,0.10)]'
))

const mediaWrapperClass = computed(() => (
  props.variant === 'square'
    ? 'aspect-square overflow-hidden bg-black/40'
    : 'flex items-center justify-center overflow-hidden bg-black/40'
))

const viewportClass = computed(() => (
  props.variant === 'square'
    ? 'h-full w-full'
    : 'flex items-center justify-center overflow-hidden rounded-lg bg-black/20'
))

const imageClass = computed(() => (
  props.variant === 'square'
    ? 'h-full w-full object-cover'
    : 'block h-full w-full object-contain'
))

const copyClass = computed(() => (
  props.variant === 'square'
    ? 'space-y-1 p-4'
    : 'flex items-center gap-3 px-3 py-2'
))

const containerStyle = computed(() => (
  props.variant === 'square'
    ? undefined
    : {
        width: 'min(100%, 760px)',
        maxWidth: '760px',
      }
))

const linkStyle = computed(() => (
  props.variant === 'square'
    ? undefined
    : {
        display: 'block',
        width: '100%',
      }
))

const mediaWrapperStyle = computed(() => (
  props.variant === 'square'
    ? undefined
    : {
        width: '100%',
        height: '200px',
        maxHeight: '200px',
        padding: '8px 12px',
        boxSizing: 'border-box',
      }
))

const viewportStyle = computed(() => (
  props.variant === 'square'
    ? undefined
    : {
        width: '100%',
        maxWidth: '728px',
        height: '184px',
        maxHeight: '184px',
      }
))

const imageStyle = computed(() => (
  props.variant === 'square'
    ? undefined
    : {
        display: 'block',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '184px',
        objectFit: 'contain',
      }
))

const isDisplayableBannerAd = (candidate: GilAdsServeResponse | null) => {
  return Boolean(candidate?.creative && candidate.creative.type !== 'video')
}

const loadBannerAd = async () => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidate = await serveGilAd({
      placement: props.placement,
      type: props.type,
      size: props.size,
      context: props.context,
    })

    if (!candidate?.creative) {
      return null
    }

    if (isDisplayableBannerAd(candidate)) {
      return candidate
    }
  }

  return null
}

const trackOnce = async (eventType: 'impression' | 'click') => {
  if (!ad.value?.creative?.id) return
  try {
    await trackGilAdEvent({
      creativeId: ad.value.creative.id,
      eventType,
      placement: props.placement,
      context: props.context,
    })
  } catch (error) {
    console.error(`Failed to track gilADS ${eventType}:`, error)
  }
}

const handleClick = () => {
  trackOnce('click')
}

const maybeTrackImpression = async () => {
  if (impressionTracked.value || !ad.value?.creative?.id) return
  impressionTracked.value = true
  await trackOnce('impression')
}

onMounted(async () => {
  ad.value = await loadBannerAd()

  if (!ad.value?.creative || !rootElement.value || typeof window === 'undefined') {
    return
  }

  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        maybeTrackImpression()
        observer?.disconnect()
        observer = null
        break
      }
    }
  }, { threshold: 0.45 })

  observer.observe(rootElement.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>
