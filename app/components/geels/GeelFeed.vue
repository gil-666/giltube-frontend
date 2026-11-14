<template>
  <div class="geel-feed-wrap">
    <div
      ref="scrollerRef"
      class="geel-feed"
      tabindex="-1"
      @scroll.passive="onScroll"
      @wheel="onWheel"
    >
      <div v-for="(geel, index) in items" :key="geel.id" class="geel-feed-item" :data-index="index">
        <GeelSlide
          v-if="Math.abs(index - activeIndex) <= 2"
          :ref="(el) => setSlideRef(index, el)"
          :geel="geel"
          :active="index === activeIndex && pageVisible && !commentsGeel"
          :preload="index === activeIndex + 1 || (index === activeIndex && !!commentsGeel)"
          :muted="muted"
          :logged-in="loggedIn"
          @toggle-mute="toggleMute"
          @unmute="setMuted(false)"
          @open-comments="commentsGeel = $event"
          @need-login="goToLogin"
        />
        <div v-else class="geel-feed-placeholder" />
      </div>

      <div v-if="loading && !items.length" class="geel-feed-item">
        <div class="geel-feed-skeleton" />
      </div>
      <div v-else-if="!loading && !items.length" class="geel-feed-item flex-col gap-3 text-center text-zinc-400">
        <svg viewBox="0 0 24 24" class="h-12 w-12 text-zinc-600" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="2.75" width="12" height="18.5" rx="2.5" /><path d="m10.5 9.5 4 2.5-4 2.5v-5Z" stroke-linejoin="round" /></svg>
        <p class="text-base font-semibold text-zinc-200">{{ emptyTitle || t('geels.emptyTitle') }}</p>
        <p class="max-w-xs text-sm">{{ t('geels.emptyBody') }}</p>
      </div>
      <div v-else-if="!hasMore && items.length" class="geel-feed-end">
        {{ t('geels.caughtUp') }}
      </div>
    </div>

    <!-- Desktop up/down -->
    <div class="geel-nav">
      <button type="button" class="geel-nav-button" :disabled="activeIndex <= 0" :aria-label="t('geels.previous')" @click="goTo(activeIndex - 1)">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="m6 15 6-6 6 6" /></svg>
      </button>
      <button type="button" class="geel-nav-button" :disabled="activeIndex >= items.length - 1" :aria-label="t('geels.next')" @click="goTo(activeIndex + 1)">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" /></svg>
      </button>
    </div>

    <GeelComments :geel="commentsGeel" :logged-in="loggedIn" @close="commentsGeel = null" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GeelComments from './GeelComments.vue'
import GeelSlide from './GeelSlide.vue'
import { getGeelsFeed, type Geel } from '~/app/service/geels'

const props = defineProps<{
  startId?: string
  channel?: string
  sound?: string
  emptyTitle?: string
  /** Keep the address bar on the Geel being watched (/geels/<id>). */
  syncUrl?: boolean
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

const scrollerRef = ref<HTMLElement | null>(null)
const items = ref<Geel[]>([])
const activeIndex = ref(0)
const loading = ref(false)
const hasMore = ref(true)
const loggedIn = ref(false)
const pageVisible = ref(true)
const commentsGeel = ref<Geel | null>(null)
const muted = ref(false)
const slideRefs = new Map<number, InstanceType<typeof GeelSlide>>()

const MUTE_KEY = 'giltube_geels_muted'

const setSlideRef = (index: number, el: unknown) => {
  if (el) slideRefs.set(index, el as InstanceType<typeof GeelSlide>)
  else slideRefs.delete(index)
}

const setMuted = (value: boolean) => {
  muted.value = value
  try { sessionStorage.setItem(MUTE_KEY, value ? '1' : '0') } catch { /* private mode */ }
}
const toggleMute = () => setMuted(!muted.value)

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  try {
    const page = await getGeelsFeed({
      limit: 8,
      exclude: items.value.map((geel) => geel.id),
      start: items.value.length ? undefined : props.startId,
      channel: props.channel,
      sound: props.sound,
    })
    const known = new Set(items.value.map((geel) => geel.id))
    items.value.push(...page.items.filter((geel) => !known.has(geel.id)))
    hasMore.value = page.has_more && page.items.length > 0
  } catch {
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

const itemHeight = () => scrollerRef.value?.clientHeight || 1

const onScroll = () => {
  const scroller = scrollerRef.value
  if (!scroller) return
  const index = Math.round(scroller.scrollTop / itemHeight())
  if (index !== activeIndex.value && index >= 0 && index < items.value.length) activeIndex.value = index
}

// One wheel gesture = one Geel (trackpads send many small events).
let wheelLockUntil = 0
const onWheel = (event: WheelEvent) => {
  if (commentsGeel.value) return
  event.preventDefault()
  const now = Date.now()
  if (now < wheelLockUntil || Math.abs(event.deltaY) < 12) return
  wheelLockUntil = now + 550
  goTo(activeIndex.value + (event.deltaY > 0 ? 1 : -1))
}

const goTo = (index: number) => {
  if (index < 0 || index >= items.value.length) return
  scrollerRef.value?.scrollTo({ top: index * itemHeight(), behavior: 'smooth' })
  activeIndex.value = index
}

const onKey = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  if (commentsGeel.value) {
    if (event.key === 'Escape') commentsGeel.value = null
    return
  }
  const slide = slideRefs.get(activeIndex.value)
  switch (event.key) {
    case 'ArrowDown': case 'PageDown': case 'j':
      event.preventDefault(); goTo(activeIndex.value + 1); break
    case 'ArrowUp': case 'PageUp': case 'k':
      event.preventDefault(); goTo(activeIndex.value - 1); break
    case ' ':
      event.preventDefault(); slide?.togglePlay(); break
    case 'm': case 'M':
      toggleMute(); break
    case 'l': case 'L':
      void slide?.toggleLike(); break
    case 'ArrowRight':
      slide?.seekBy(5); break
    case 'ArrowLeft':
      slide?.seekBy(-5); break
  }
}

const onVisibility = () => { pageVisible.value = document.visibilityState === 'visible' }

const goToLogin = () => { void router.push(localePath('/login')) }

watch(activeIndex, (index) => {
  if (index >= items.value.length - 3) void loadMore()
  const geel = items.value[index]
  if (props.syncUrl && geel) {
    const path = localePath(`/geels/${geel.id}`)
    if (window.location.pathname !== path) window.history.replaceState(window.history.state, '', path)
  }
})

onMounted(async () => {
  loggedIn.value = !!localStorage.getItem('user_id')
  try { muted.value = sessionStorage.getItem(MUTE_KEY) === '1' } catch { /* private mode */ }
  document.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
  await loadMore()
  scrollerRef.value?.focus({ preventScroll: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.geel-feed-wrap {
  position: relative;
  height: 100%;
  width: 100%;
}

.geel-feed {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  outline: none;
}
.geel-feed::-webkit-scrollbar { display: none; }

.geel-feed-item {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.geel-feed-placeholder,
.geel-feed-skeleton {
  height: 100%;
  aspect-ratio: 9 / 16;
  border-radius: calc(18px * var(--gt-radius-scale, 1));
  background: rgba(255, 255, 255, 0.04);
}
.geel-feed-skeleton { animation: geel-skeleton 1.4s ease-in-out infinite; }

.geel-feed-end {
  padding: 24px 0 40px;
  text-align: center;
  font-size: 13px;
  color: rgb(var(--gt-zinc-500, 113 113 122));
  scroll-snap-align: end;
}

.geel-nav {
  position: absolute;
  right: 24px;
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transform: translateY(-50%);
}

.geel-nav-button {
  display: flex;
  height: 52px;
  width: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  transition: background 0.15s ease, opacity 0.15s ease;
}
.geel-nav-button:hover:not(:disabled) { background: rgba(255, 255, 255, 0.16); }
.geel-nav-button:disabled { opacity: 0.3; cursor: default; }

@keyframes geel-skeleton { 50% { opacity: 0.5; } }

@media (max-width: 767px) {
  .geel-feed-item { padding: 0; }
  .geel-nav { display: none; }
  .geel-feed-placeholder, .geel-feed-skeleton { width: 100%; aspect-ratio: auto; border-radius: 0; }
}
@media (max-width: 1100px) and (min-width: 768px) {
  .geel-nav { right: 12px; }
}
</style>
