<template>
  <section
    v-if="ad?.creative"
    ref="rootElement"
    :class="containerClass"
  >
    <a
      :href="ad.creative.destinationUrl || '#'"
      target="_blank"
      rel="noopener noreferrer"
      class="block"
      @click="handleClick"
    >
      <div :class="mediaWrapperClass">
        <div :class="viewportClass">
          <img
            v-if="ad.creative.assetUrl"
            :src="ad.creative.assetUrl"
            :alt="ad.creative.headline || fallbackTitle"
            :class="imageClass"
            loading="lazy"
          />
          <div v-else class="flex h-full w-full items-center justify-center bg-white/5 px-4 text-center text-sm text-zinc-400">
            {{ ad.creative.headline || fallbackTitle }}
          </div>
        </div>
      </div>
      <div :class="copyClass">
        <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Sponsored</p>
        <h3 class="text-sm font-semibold text-white">{{ ad.creative.headline || fallbackTitle }}</h3>
        <p v-if="ad.creative.body" class="text-sm text-zinc-300">{{ ad.creative.body }}</p>
      </div>
    </a>
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
let observer: IntersectionObserver | null = null

const containerClass = computed(() => (
  props.variant === 'square'
    ? 'overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 via-zinc-950 to-zinc-900 shadow-[0_20px_80px_rgba(6,182,212,0.12)]'
    : 'mx-auto w-full max-w-[760px] overflow-hidden rounded-[18px] border border-cyan-400/20 bg-gradient-to-r from-cyan-950/60 via-zinc-950 to-zinc-900 shadow-[0_12px_36px_rgba(6,182,212,0.10)]'
))

const mediaWrapperClass = computed(() => (
  props.variant === 'square'
    ? 'aspect-square overflow-hidden bg-black/40'
    : 'flex w-full items-center justify-center overflow-hidden bg-black/40 px-3 py-3'
))

const viewportClass = computed(() => (
  props.variant === 'square'
    ? 'h-full w-full'
    : 'flex aspect-[728/90] w-full max-w-[728px] items-center justify-center overflow-hidden rounded-lg bg-black/20'
))

const imageClass = computed(() => (
  props.variant === 'square'
    ? 'h-full w-full object-cover'
    : 'block h-full w-full object-contain'
))

const copyClass = computed(() => (
  props.variant === 'square'
    ? 'space-y-1 p-4'
    : 'space-y-1 px-4 py-3'
))

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
  ad.value = await serveGilAd({
    placement: props.placement,
    type: props.type,
    size: props.size,
    context: props.context,
  })

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
