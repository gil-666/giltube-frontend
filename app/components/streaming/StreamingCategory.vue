<template>
  <main class="min-h-screen bg-zinc-950 text-white">
    <div v-if="loading" class="px-6 py-8">
      <div class="h-[56vh] animate-pulse rounded-2xl bg-white/[0.04]" />
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="n in 8" :key="n" class="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    </div>

    <div v-else-if="error" class="mx-auto max-w-3xl px-6 py-16">
      <div class="rounded-xl bg-white/[0.04] p-6 text-zinc-300">
        {{ error }}
      </div>
    </div>

    <div v-else-if="!groups.length" class="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 class="text-3xl font-semibold">{{ title }}</h1>
      <p class="mt-3 text-zinc-400">{{ emptyMessage }}</p>
    </div>

    <div v-else>
      <section v-if="featuredItem" class="streaming-hero">
        <Transition name="streaming-hero-image" mode="out-in">
          <img
            :key="featuredItem.id"
            v-bind="responsiveImage(featuredItem.backdropUrl || featuredItem.posterUrl, '100vw')"
            :alt="featuredItem.title"
            class="streaming-hero-image"
            decoding="async"
            fetchpriority="high"
          />
        </Transition>
        <div class="streaming-hero-side-fade" />
        <div class="streaming-hero-bottom-fade" />

        <Transition name="streaming-hero-copy" mode="out-in">
          <div :key="featuredItem.id" class="streaming-hero-copy">
            <h1 class="streaming-hero-title">{{ featuredItem.title }}</h1>
            <button
              v-if="featuredItem.synopsis"
              type="button"
              class="streaming-hero-synopsis"
              :aria-label="`${detailsLabel}: ${featuredItem.title}`"
              @click="$emit('open', featuredItem)"
            >
              {{ featuredItem.synopsis }}
            </button>
            <p class="streaming-hero-meta">
              {{ [featuredItem.genre, ...(featuredItem.meta || [])].filter(Boolean).join(' · ') }}
            </p>
            <div class="streaming-hero-actions">
              <NuxtLink
                v-if="featuredItem.primaryLink"
                :to="featuredItem.primaryLink"
                class="streaming-primary-button"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" /></svg>
                {{ featuredItem.primaryLabel || t('home.play') }}
              </NuxtLink>
              <button
                type="button"
                class="streaming-secondary-button"
                @click="$emit('open', featuredItem)"
              >
                {{ detailsLabel }}
              </button>
            </div>
            <div v-if="featuredItems.length > 1" class="mt-8 flex gap-1.5">
              <button
                v-for="(item, index) in featuredItems"
                :key="item.id"
                type="button"
                :aria-label="t('home.showSlide', { index: index + 1 })"
                :aria-current="index === activeFeaturedIndex"
                :class="index === activeFeaturedIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'"
                class="h-1.5 rounded-full transition-all"
                @click="$emit('feature', index)"
              />
            </div>
          </div>
        </Transition>
      </section>

      <div class="streaming-content">
        <section v-for="group in groups" :key="group.genre" class="streaming-section">
          <div class="mb-3 flex items-center justify-between gap-4">
            <h2 class="text-lg font-semibold tracking-tight">{{ group.genre }}</h2>
            <div v-if="rowScrollState[group.genre]?.scrollable" class="flex items-center gap-2">
              <button
                type="button"
                class="streaming-row-button"
                :aria-label="t('streaming.scrollRowLeft', { genre: group.genre })"
                :disabled="!rowScrollState[group.genre]?.prev"
                @click="scrollRow(group.genre, -1)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6" /></svg>
              </button>
              <button
                type="button"
                class="streaming-row-button"
                :aria-label="t('streaming.scrollRowRight', { genre: group.genre })"
                :disabled="!rowScrollState[group.genre]?.next"
                @click="scrollRow(group.genre, 1)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
          <div
            :ref="setRowRef(group.genre)"
            class="streaming-row"
            @scroll.passive="updateRowScrollState(group.genre)"
          >
            <article
              v-for="item in group.items"
              :key="item.id"
              class="streaming-card"
            >
              <button type="button" class="group block w-full text-left" @click="$emit('open', item)">
                <div class="streaming-poster">
                  <img
                    v-bind="responsiveImage(item.posterUrl || item.backdropUrl, '(min-width: 640px) 14rem, 11rem')"
                    :alt="item.title"
                    class="streaming-poster-image"
                    loading="lazy"
                    decoding="async"
                  />
                  <div v-if="progressPercent(item) > 0" class="streaming-poster-progress">
                    <div :style="{ width: `${progressPercent(item)}%` }" />
                  </div>
                  <div class="streaming-poster-play">
                    <span>
                      <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" />
                      </svg>
                    </span>
                  </div>
                </div>
                <h3 class="mt-2.5 line-clamp-1 text-sm font-medium text-zinc-100">{{ item.title }}</h3>
                <p v-if="item.cardMeta" class="mt-0.5 line-clamp-1 text-xs text-zinc-500">{{ item.cardMeta }}</p>
              </button>
            </article>
          </div>
        </section>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="streaming-modal">
        <div
          v-if="selectedItem"
          class="streaming-modal-backdrop"
          role="dialog"
          aria-modal="true"
          :aria-label="selectedItem.title"
          @click.self="$emit('close')"
        >
          <section class="streaming-modal-panel">
            <div class="streaming-modal-hero">
              <img v-bind="responsiveImage(selectedItem.backdropUrl || selectedItem.posterUrl, 'min(100vw, 64rem)')" :alt="selectedItem.title" class="streaming-modal-image" decoding="async" fetchpriority="high" />
              <div class="streaming-modal-fade" />
              <button
                type="button"
                class="streaming-modal-close"
                :aria-label="t('common.close')"
                @click.stop="$emit('close')"
              >
                &times;
              </button>
              <div class="streaming-modal-copy">
                <p class="streaming-modal-eyebrow">{{ selectedItem.genre }}</p>
                <h2 class="streaming-modal-title">{{ selectedItem.title }}</h2>
                <div
                  v-if="selectedItem.explicit || selectedItem.rating || selectedItem.maxQuality || selectedItem.hdr || selectedItem.surround"
                  class="streaming-media-badges"
                >
                  <span
                    v-if="selectedItem.explicit"
                    class="streaming-quality-badge is-explicit"
                    :title="t('video.explicitBadge')"
                  >
                    18+
                  </span>
                  <span
                    v-if="selectedItem.rating"
                    class="streaming-quality-badge is-rating"
                    :aria-label="t('contentRating.rated', { rating: selectedItem.rating })"
                  >
                    {{ selectedItem.rating }}
                  </span>
                  <span
                    v-if="selectedItem.maxQuality"
                    :class="qualityBadgeClass(selectedItem.maxQuality)"
                    :aria-label="`${t('streaming.media.maxQuality')}: ${selectedItem.maxQuality}`"
                  >
                    {{ selectedItem.maxQuality }}
                  </span>
                  <span
                    v-if="selectedItem.hdr"
                    class="streaming-quality-badge is-hdr"
                    :title="t('streaming.media.hdr')"
                    :aria-label="t('streaming.media.hdr')"
                  >
                    HDR
                  </span>
                  <span
                    v-if="selectedItem.surround"
                    class="streaming-quality-badge is-surround"
                    :title="t('streaming.media.surround')"
                    :aria-label="t('streaming.media.surround')"
                  >
                    5.1
                  </span>
                  <span v-if="selectedItem.rating && selectedItem.ratingDescriptors?.length" class="streaming-rating-descriptors">
                    {{ selectedItem.ratingDescriptors.map((key) => t(`contentRating.descriptors.${key}`)).join(', ') }}
                  </span>
                </div>
                <div class="streaming-modal-actions">
                  <NuxtLink
                    v-if="selectedItem.resumeLink"
                    :to="selectedItem.resumeLink"
                    class="streaming-modal-primary-action"
                  >
                    <span class="streaming-modal-action-icon streaming-modal-action-icon-dark">
                      <svg class="streaming-play-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" />
                      </svg>
                    </span>
                    <span>{{ t('streaming.actions.resume') }}</span>
                  </NuxtLink>
                  <NuxtLink
                    v-if="selectedItem.primaryLink"
                    :to="selectedItem.resumeLink ? (selectedItem.startOverLink || selectedItem.primaryLink) : selectedItem.primaryLink"
                    :class="selectedItem.resumeLink ? 'streaming-modal-secondary-action' : 'streaming-modal-primary-action'"
                  >
                    <span :class="selectedItem.resumeLink ? 'streaming-modal-action-icon streaming-modal-action-icon-light' : 'streaming-modal-action-icon streaming-modal-action-icon-dark'">
                      <svg class="streaming-play-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z" />
                      </svg>
                    </span>
                    <span>{{ selectedItem.resumeLink ? t('streaming.actions.startOver') : (selectedItem.primaryLabel || t('streaming.actions.playNow')) }}</span>
                  </NuxtLink>
                  <slot name="modal-actions" :item="selectedItem" />
                </div>
              </div>
            </div>

            <div class="streaming-modal-body">
              <slot name="details" :item="selectedItem" />
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<script setup>
import { responsiveImage } from '~/app/utils/media'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  title: { type: String, required: true },
  eyebrow: { type: String, required: true },
  itemLabel: { type: String, default: 'item' },
  detailsLabel: { type: String, default: 'Details' },
  emptyMessage: { type: String, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  groups: { type: Array, default: () => [] },
  featuredItem: { type: Object, default: null },
  featuredItems: { type: Array, default: () => [] },
  activeFeaturedIndex: { type: Number, default: 0 },
  selectedItem: { type: Object, default: null },
})

defineEmits(['open', 'close', 'feature'])

const { t } = useI18n()

const progressPercent = (item) => {
  const value = Number(item?.progressPercent || 0)
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(100, Math.max(0, value))
}

const qualityBadgeClass = (quality) => {
  const modifier = String(quality || '').toLowerCase().replace(/\s+/g, '-')
  return ['streaming-quality-badge', modifier ? `is-${modifier}` : '']
}

const rowElements = {}
const rowScrollState = ref({})
// Rows below the fold skip layout (content-visibility), so re-measure when
// they actually get laid out or resized.
const rowResizeObserver = typeof ResizeObserver !== 'undefined'
  ? new ResizeObserver((entries) => {
    for (const entry of entries) {
      const key = entry.target.dataset.rowKey
      if (key) updateRowScrollState(key)
    }
  })
  : null

const updateRowScrollState = (key) => {
  const element = rowElements[key]
  if (!element) return
  const maxScroll = element.scrollWidth - element.clientWidth
  const next = {
    scrollable: maxScroll > 4,
    prev: element.scrollLeft > 4,
    next: element.scrollLeft < maxScroll - 4,
  }
  const current = rowScrollState.value[key]
  if (current && current.scrollable === next.scrollable && current.prev === next.prev && current.next === next.next) return
  rowScrollState.value = { ...rowScrollState.value, [key]: next }
}

const updateAllRowScrollStates = () => {
  for (const key of Object.keys(rowElements)) updateRowScrollState(key)
}

const setRowRef = (key) => (element) => {
  if (!element) {
    if (rowElements[key]) rowResizeObserver?.unobserve(rowElements[key])
    delete rowElements[key]
    return
  }
  if (rowElements[key] === element) return
  element.dataset.rowKey = key
  rowElements[key] = element
  rowResizeObserver?.observe(element)
  updateRowScrollState(key)
}

const scrollRow = (key, direction) => {
  const element = rowElements[key]
  if (!element) return
  element.scrollBy({
    left: direction * Math.max(element.clientWidth * 0.85, 200),
    behavior: 'smooth',
  })
}

watch(() => props.groups, () => nextTick(updateAllRowScrollStates))

onMounted(() => {
  nextTick(updateAllRowScrollStates)
})

const lockPageScroll = (locked) => {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  const body = document.body
  if (locked) {
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return
  }
  html.style.overflow = ''
  body.style.overflow = ''
}

watch(() => props.selectedItem, (item) => {
  lockPageScroll(Boolean(item))
}, { immediate: true })

onBeforeUnmount(() => {
  rowResizeObserver?.disconnect()
  lockPageScroll(false)
})
</script>

<style scoped>
.streaming-row {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  padding-bottom: 0.75rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.streaming-row::-webkit-scrollbar {
  display: none;
}

.streaming-row-button {
  display: flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: transparent;
  color: #9b9ba5;
  font-size: 1.125rem;
  line-height: 1;
  transition: background-color 160ms ease, opacity 160ms ease;
}

.streaming-row-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.streaming-row-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.streaming-hero {
  position: relative;
  display: flex;
  min-height: 68vh;
  align-items: flex-end;
  overflow: hidden;
  padding: 7rem clamp(1rem, 3vw, 2rem) 3.5rem;
}

.streaming-hero-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.streaming-hero-side-fade,
.streaming-hero-bottom-fade {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

.streaming-hero-side-fade {
  inset: 0;
  background:
    linear-gradient(90deg, rgba(12, 12, 14, 0.94) 0%, rgba(12, 12, 14, 0.7) 34%, rgba(12, 12, 14, 0.2) 68%, rgba(12, 12, 14, 0) 100%);
}

.streaming-hero-bottom-fade {
  left: 0;
  right: 0;
  bottom: 0;
  height: 14rem;
  background: linear-gradient(0deg, #0c0c0e 0%, rgba(12, 12, 14, 0) 100%);
}

.streaming-hero-copy {
  position: relative;
  z-index: 2;
  max-width: 48rem;
}

.streaming-eyebrow {
  color: rgb(252 165 165);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.streaming-hero-title {
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.02;
}

.streaming-hero-meta {
  margin-top: 0.875rem;
  color: #c8c8cf;
  font-size: 0.875rem;
}

.streaming-hero-synopsis {
  display: -webkit-box;
  overflow: hidden;
  width: fit-content;
  margin-top: 1rem;
  max-width: 42rem;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: #c8c8cf;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.6;
  text-align: left;
  text-overflow: ellipsis;
  transition: color 160ms ease;
}

.streaming-hero-synopsis:hover {
  color: #fff;
}

.streaming-hero-synopsis:focus-visible {
  border-radius: 0.25rem;
  outline: 2px solid rgba(255, 255, 255, 0.9);
  outline-offset: 0.25rem;
}

.streaming-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.streaming-primary-button,
.streaming-secondary-button {
  display: inline-flex;
  height: 2.75rem;
  min-width: 4.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 999px;
  padding: 0 1.375rem;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: background-color 160ms ease;
}

.streaming-primary-button {
  background: #fff;
  color: #000 !important;
}

.streaming-primary-button:hover {
  background: #e2e2e6;
}

.streaming-secondary-button {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  backdrop-filter: blur(8px);
}

.streaming-secondary-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.streaming-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 0 clamp(1rem, 3vw, 2rem) 3rem;
}

.streaming-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 24rem;
}

.streaming-card {
  width: 10.5rem;
  flex: 0 0 10.5rem;
  scroll-snap-align: start;
}

.streaming-poster {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #16161a;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.streaming-poster-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 180ms ease;
}

.streaming-card:hover .streaming-poster-image {
  transform: scale(1.03);
}

.streaming-poster-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  height: 0.25rem;
  background: rgba(0, 0, 0, 0.6);
}

.streaming-poster-progress > div {
  height: 100%;
  background: rgb(220 38 38);
}

.streaming-poster-play {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0);
  opacity: 0;
  transition: opacity 160ms ease, background-color 160ms ease;
}

.streaming-card:hover .streaming-poster-play {
  opacity: 1;
  background: rgba(0, 0, 0, 0.35);
}

.streaming-poster-play span {
  display: flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.streaming-poster-play svg {
  width: 1.125rem;
  height: 1.125rem;
  margin-left: 0.125rem;
}

.streaming-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: clamp(0.5rem, 2vw, 1rem);
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
}

.streaming-modal-panel {
  display: flex;
  width: 100%;
  max-width: 64rem;
  max-height: calc(100vh - clamp(1rem, 4vw, 2rem));
  max-height: calc(100dvh - clamp(1rem, 4vw, 2rem));
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  border-radius: 1rem;
  background: #131316;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8);
  outline: 1px solid rgba(255, 255, 255, 0.08);
  scrollbar-color: rgba(113, 113, 122, 0.75) rgba(24, 24, 27, 0.25);
  scrollbar-width: thin;
}

.streaming-modal-hero {
  position: sticky;
  top: 0;
  z-index: 20;
  height: clamp(12.5rem, 28dvh, 18rem);
  flex: 0 0 auto;
  overflow: hidden;
  background: rgb(24 24 27);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08), 0 14px 30px rgba(0, 0, 0, 0.3);
}

.streaming-modal-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.streaming-modal-fade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, rgb(9 9 11) 0%, rgba(9, 9, 11, 0.72) 34%, rgba(0, 0, 0, 0.18) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.58), transparent 68%);
}

.streaming-modal-copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 1.25rem;
  padding-right: 4.5rem;
}

.streaming-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 30;
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-size: 1.5rem;
  line-height: 1;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

.streaming-modal-primary-action,
.streaming-modal-secondary-action {
  display: inline-flex;
  min-height: 3rem;
  min-width: 0;
  align-items: center;
  gap: 0.625rem;
  border-radius: 999px;
  padding: 0.375rem 1.25rem 0.375rem 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
}

.streaming-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.streaming-modal-primary-action {
  background: #fff;
  color: #000 !important;
}

.streaming-modal-secondary-action {
  background: rgba(255, 255, 255, 0.1);
  color: #fff !important;
}

.streaming-modal-action-icon {
  display: flex;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.streaming-modal-action-icon-dark {
  background: #000;
  color: #fff;
}

.streaming-modal-action-icon-light {
  background: #fff;
  color: #000;
}

.streaming-play-icon {
  display: block;
  width: 1rem;
  height: 1rem;
  margin-left: 0.125rem;
}

.streaming-modal-eyebrow {
  color: #c8c8cf;
  font-size: 0.8125rem;
  font-weight: 500;
}

.streaming-modal-title {
  margin-top: 0.5rem;
  font-size: clamp(1.875rem, 5vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.05;
}

.streaming-quality-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  margin-top: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 0.25rem;
  background: rgba(24, 24, 27, 0.8);
  padding: 0.2rem 0.5rem;
  color: rgb(244 244 245);
  font-size: 0.7rem;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}

.streaming-quality-badge.is-hd {
  border-color: rgba(96, 165, 250, 0.65);
  background: rgba(30, 64, 175, 0.72);
  color: rgb(219 234 254);
}

.streaming-quality-badge.is-full-hd {
  border-color: rgba(34, 211, 238, 0.65);
  background: rgba(21, 94, 117, 0.76);
  color: rgb(207 250 254);
}

.streaming-quality-badge.is-4k,
.streaming-quality-badge.is-8k {
  border-color: rgba(74, 222, 128, 0.65);
  background: rgba(20, 83, 45, 0.78);
  color: rgb(220 252 231);
}

.streaming-media-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.streaming-media-badges .streaming-quality-badge {
  margin-top: 0;
}

.streaming-quality-badge.is-explicit {
  border-color: rgba(248, 113, 113, 0.7);
  background: rgba(127, 29, 29, 0.8);
  color: rgb(254 226 226);
}

.streaming-quality-badge.is-rating {
  border-color: rgba(255, 255, 255, 0.55);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
}

.streaming-rating-descriptors {
  align-self: center;
  font-size: 0.8125rem;
  color: rgb(212 212 216);
}

.streaming-quality-badge.is-hdr {
  border-color: rgba(250, 204, 21, 0.7);
  background: rgba(113, 63, 18, 0.8);
  color: rgb(254 249 195);
}

.streaming-quality-badge.is-surround {
  border-color: rgba(167, 139, 250, 0.65);
  background: rgba(76, 29, 149, 0.76);
  color: rgb(237 233 254);
}

.streaming-modal-body {
  flex: 0 0 auto;
  padding: 1rem;
}

.streaming-modal-panel::-webkit-scrollbar {
  width: 6px;
}

.streaming-modal-panel::-webkit-scrollbar-track {
  background: transparent;
}

.streaming-modal-panel::-webkit-scrollbar-thumb {
  min-height: 48px;
  background: linear-gradient(180deg, rgba(161, 161, 170, 0.72), rgba(82, 82, 91, 0.78));
  border: 1px solid rgba(24, 24, 27, 0.75);
  border-radius: 999px;
}

.streaming-modal-panel::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(212, 212, 216, 0.86), rgba(113, 113, 122, 0.9));
}

@media (max-width: 639px) {
  .streaming-hero-synopsis {
    -webkit-line-clamp: 2;
  }

  .streaming-modal-hero {
    height: clamp(15rem, 37dvh, 18rem);
  }

  .streaming-modal-title {
    font-size: clamp(1.9rem, 9vw, 2.7rem);
  }

  .streaming-modal-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .streaming-modal-primary-action,
  .streaming-modal-secondary-action,
  :deep(.streaming-watch-party-button) {
    width: 100%;
    min-height: 3.5rem;
    justify-content: center;
    padding: 0.75rem 1rem;
  }

  :deep(.streaming-watch-party-button) {
    grid-column: 1 / -1;
  }

  .streaming-modal-action-icon {
    width: 2.25rem;
    height: 2.25rem;
    flex-basis: 2.25rem;
  }
}

@media (min-width: 640px) {
  .streaming-card {
    width: 14rem;
    flex-basis: 14rem;
  }

  .streaming-hero {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
  }

  .streaming-content {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
  }

  .streaming-modal-backdrop {
    padding: 1rem;
  }

  .streaming-modal-panel {
    max-height: calc(100vh - 2rem);
    max-height: calc(100dvh - 2rem);
  }

  .streaming-modal-copy,
  .streaming-modal-body {
    padding: 1.75rem;
  }
}

@media (min-width: 1024px) {
  .streaming-hero {
    padding-left: 3.5rem;
    padding-right: 3.5rem;
  }

  .streaming-content {
    padding-left: 3.5rem;
    padding-right: 3.5rem;
  }
}

.streaming-hero-image-enter-active,
.streaming-hero-image-leave-active,
.streaming-hero-copy-enter-active,
.streaming-hero-copy-leave-active {
  transition: opacity 520ms ease, transform 520ms ease;
}

.streaming-hero-image-enter-from,
.streaming-hero-image-leave-to {
  opacity: 0;
  transform: scale(1.015);
}

.streaming-hero-copy-enter-from,
.streaming-hero-copy-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.streaming-modal-enter-active,
.streaming-modal-leave-active {
  transition: opacity 220ms ease;
}

.streaming-modal-enter-active .streaming-modal-panel,
.streaming-modal-leave-active .streaming-modal-panel {
  transition: transform 220ms ease, opacity 220ms ease;
}

.streaming-modal-enter-from,
.streaming-modal-leave-to {
  opacity: 0;
}

.streaming-modal-enter-from .streaming-modal-panel,
.streaming-modal-leave-to .streaming-modal-panel {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
</style>
