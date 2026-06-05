<template>
  <main class="min-h-screen bg-black text-white">
    <div v-if="loading" class="px-6 py-8">
      <div class="h-[56vh] animate-pulse rounded bg-zinc-900" />
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="n in 8" :key="n" class="aspect-[2/3] animate-pulse rounded bg-zinc-900" />
      </div>
    </div>

    <div v-else-if="error" class="mx-auto max-w-3xl px-6 py-16">
      <div class="rounded border border-red-500/30 bg-red-950/40 p-6 text-red-100">
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
            :src="featuredItem.backdropUrl || featuredItem.posterUrl"
            :alt="featuredItem.title"
            class="streaming-hero-image"
          />
        </Transition>
        <div class="streaming-hero-side-fade" />
        <div class="streaming-hero-bottom-fade" />

        <Transition name="streaming-hero-copy" mode="out-in">
          <div :key="featuredItem.id" class="streaming-hero-copy">
            <p class="streaming-eyebrow">{{ eyebrow }}</p>
            <h1 class="streaming-hero-title">{{ featuredItem.title }}</h1>
            <p class="streaming-hero-synopsis">{{ featuredItem.synopsis }}</p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span v-if="featuredItem.genre" class="rounded bg-white/10 px-2 py-1">{{ featuredItem.genre }}</span>
              <span v-for="meta in featuredItem.meta || []" :key="meta" class="rounded bg-white/10 px-2 py-1">{{ meta }}</span>
            </div>
            <div class="streaming-hero-actions">
              <NuxtLink
                v-if="featuredItem.primaryLink"
                :to="featuredItem.primaryLink"
                class="streaming-primary-button"
              >
                {{ featuredItem.primaryLabel || 'Play' }}
              </NuxtLink>
              <button
                type="button"
                class="streaming-secondary-button"
                @click="$emit('open', featuredItem)"
              >
                {{ detailsLabel }}
              </button>
            </div>
            <div v-if="featuredItems.length > 1" class="mt-8 flex gap-2">
              <button
                v-for="(item, index) in featuredItems"
                :key="item.id"
                type="button"
                :aria-label="`Show featured ${itemLabel} ${index + 1}`"
                :class="index === activeFeaturedIndex ? 'w-8 bg-white' : 'w-3 bg-white/35 hover:bg-white/60'"
                class="h-3 rounded-full transition-all"
                @click="$emit('feature', index)"
              />
            </div>
          </div>
        </Transition>
      </section>

      <div class="streaming-content">
        <section v-for="group in groups" :key="group.genre" class="streaming-section">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-xl font-semibold">{{ group.genre }}</h2>
          </div>
          <div class="streaming-row">
            <article
              v-for="item in group.items"
              :key="item.id"
              class="streaming-card"
            >
              <button type="button" class="group block w-full text-left" @click="$emit('open', item)">
                <div class="streaming-poster">
                  <img
                    :src="item.posterUrl || item.backdropUrl"
                    :alt="item.title"
                    class="streaming-poster-image"
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
                <h3 class="mt-3 line-clamp-2 text-sm font-semibold">{{ item.title }}</h3>
                <p v-if="item.cardMeta" class="mt-1 text-xs text-zinc-500">{{ item.cardMeta }}</p>
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
              <img :src="selectedItem.backdropUrl || selectedItem.posterUrl" :alt="selectedItem.title" class="streaming-modal-image" />
              <div class="streaming-modal-fade" />
              <button
                type="button"
                class="streaming-modal-close"
                :aria-label="`Close ${itemLabel} details`"
                @click.stop="$emit('close')"
              >
                &times;
              </button>
              <div class="streaming-modal-copy">
                <p class="streaming-modal-eyebrow">{{ selectedItem.genre }}</p>
                <h2 class="streaming-modal-title">{{ selectedItem.title }}</h2>
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
import { onBeforeUnmount, watch } from 'vue'
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
  lockPageScroll(false)
})
</script>

<style scoped>
.streaming-row {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.75rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.streaming-row::-webkit-scrollbar {
  display: none;
}

.streaming-hero {
  position: relative;
  display: flex;
  min-height: 68vh;
  align-items: flex-end;
  overflow: hidden;
  padding: 7rem 1.5rem 3rem;
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
    linear-gradient(90deg, rgba(0, 0, 0, 0.94) 0%, rgba(0, 0, 0, 0.78) 34%, rgba(0, 0, 0, 0.34) 68%, rgba(0, 0, 0, 0.12) 100%),
    linear-gradient(0deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.28));
}

.streaming-hero-bottom-fade {
  left: 0;
  right: 0;
  bottom: 0;
  height: 14rem;
  background: linear-gradient(0deg, #000 0%, rgba(0, 0, 0, 0) 100%);
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
  margin-top: 0.75rem;
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  font-weight: 800;
  line-height: 1;
}

.streaming-hero-synopsis {
  margin-top: 1rem;
  max-width: 42rem;
  color: rgb(228 228 231);
  font-size: 1rem;
  line-height: 1.6;
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
  min-width: 4.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25rem;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.streaming-primary-button {
  background: #fff;
  color: #000 !important;
}

.streaming-primary-button:hover {
  background: rgb(228 228 231);
}

.streaming-secondary-button {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.streaming-secondary-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.streaming-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 0 1.5rem 3rem;
}

.streaming-card {
  width: 11rem;
  flex: 0 0 11rem;
}

.streaming-poster {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 0.25rem;
  background: rgb(24 24 27);
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
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  padding: 0.75rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
}

.streaming-modal-panel {
  display: flex;
  width: 100%;
  max-width: 64rem;
  max-height: calc(100vh - 1.5rem);
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.25rem;
  background: rgb(9 9 11);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
  outline: 1px solid rgba(255, 255, 255, 0.1);
}

.streaming-modal-hero {
  position: relative;
  height: 13rem;
  flex: 0 0 auto;
  overflow: hidden;
  background: rgb(24 24 27);
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
  min-height: 4rem;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.25rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 800;
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
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
  color: #fff !important;
}

.streaming-modal-action-icon {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 2.5rem;
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
  color: rgb(252 165 165);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.streaming-modal-title {
  margin-top: 0.5rem;
  font-size: clamp(1.875rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.05;
}

.streaming-modal-body {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1rem;
  scrollbar-color: rgba(113, 113, 122, 0.75) rgba(24, 24, 27, 0.25);
  scrollbar-width: thin;
}

.streaming-modal-body::-webkit-scrollbar {
  width: 10px;
}

.streaming-modal-body::-webkit-scrollbar-track {
  background: rgba(24, 24, 27, 0.35);
  border-left: 1px solid rgba(63, 63, 70, 0.25);
}

.streaming-modal-body::-webkit-scrollbar-thumb {
  min-height: 48px;
  background: linear-gradient(180deg, rgba(161, 161, 170, 0.72), rgba(82, 82, 91, 0.78));
  border: 2px solid rgba(24, 24, 27, 0.9);
  border-radius: 999px;
}

.streaming-modal-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(212, 212, 216, 0.86), rgba(113, 113, 122, 0.9));
}

@media (max-width: 639px) {
  .streaming-modal-hero {
    min-height: 16.5rem;
    height: auto;
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
  .streaming-hero {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
  }

  .streaming-card {
    width: 14rem;
    flex-basis: 14rem;
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
  }

  .streaming-modal-hero {
    height: 18rem;
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
