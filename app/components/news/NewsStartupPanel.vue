<template>
  <Transition name="news-panel">
    <div
      v-if="current"
      class="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      @click.self="dismissCurrent"
    >
      <section
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`news-panel-title-${current.id}`"
        tabindex="-1"
        class="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/60 outline-none sm:max-h-[80vh] sm:max-w-lg sm:rounded-2xl"
        @keydown.esc="dismissCurrent"
      >
        <header class="flex items-start gap-3 border-b border-white/[0.07] px-5 pb-4 pt-5 sm:px-6">
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-400">
              {{ t('news.eyebrow') }}
              <span v-if="queue.length > 1" class="rounded-full bg-white/[0.06] px-2 py-0.5 font-medium normal-case tracking-normal text-zinc-400">
                {{ t('news.panel.counter', { current: position, total: total }) }}
              </span>
            </p>
            <h2 :id="`news-panel-title-${current.id}`" class="mt-1.5 text-xl font-bold leading-snug text-white">{{ current.title }}</h2>
          </div>
          <button
            type="button"
            class="-mr-2 -mt-1 shrink-0 rounded-full p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            :aria-label="t('news.panel.close')"
            @click="dismissCurrent"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <NewsMarkdown :source="current.body" @internal-link="closeForNow" />
        </div>

        <footer class="flex flex-col-reverse gap-2 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <NuxtLink :to="localePath(`/news/${current.id}`)" class="mr-auto hidden text-sm text-zinc-400 transition hover:text-white sm:inline" @click="closeForNow">
            {{ t('news.panel.openPage') }}
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            @click="dismissCurrent"
          >
            {{ queue.length > 1 ? t('news.panel.next') : t('news.panel.dismiss') }}
          </button>
          <button
            v-if="cta"
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-500"
            @click="followCta"
          >
            {{ cta.label }}
            <svg v-if="cta.external" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5h5v5m0-5l-8 8M10 5H5v14h14v-5" />
            </svg>
          </button>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
// The startup news panel. app.vue mounts it once; it fetches the pending
// panels when auth state is known (and again when it changes), shows them one
// at a time, and never shows the same item twice in one page load.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import NewsMarkdown from '~/app/components/news/NewsMarkdown.vue'
import { useNewsCta } from '~/app/composables/useNewsCta'
import { dismissNewsItem, listNewsPanels, readLocallyDismissedNews, rememberNewsDismissedLocally, type NewsItem } from '~/app/service/news'

const props = defineProps<{
  /** Auth state has been read from storage. */
  ready: boolean
  loggedIn: boolean
  /** Another blocking modal is open; wait for it to close. */
  blocked?: boolean
}>()

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { ctaOf, follow } = useNewsCta()

const SHOW_DELAY_MS = 1200
const queue = ref<NewsItem[]>([])
const total = ref(0)
const settled = ref(false)
const dialogRef = ref<HTMLElement | null>(null)
const shownThisLaunch = new Set<string>()
let delayTimer: ReturnType<typeof setTimeout> | null = null
let fetchToken = 0

const normalizedPath = computed(() => (route.path || '/').replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/')
const routeAllowsPanel = computed(() => !/^\/(login|register|auth)(\/|$)/.test(normalizedPath.value))
const viewingNewsId = computed(() => normalizedPath.value.match(/^\/news\/([^/]+)/)?.[1] || '')

const current = computed(() => {
  if (!settled.value || props.blocked || !routeAllowsPanel.value) return null
  return queue.value[0] || null
})
const position = computed(() => total.value - queue.value.length + 1)
const cta = computed(() => ctaOf(current.value))

const load = async () => {
  if (!props.ready || !import.meta.client) return
  const token = ++fetchToken
  try {
    let items = await listNewsPanels()
    if (token !== fetchToken) return
    if (!props.loggedIn) {
      const dismissed = new Set(readLocallyDismissedNews())
      items = items.filter(item => !dismissed.has(item.id))
    }
    items = items.filter(item => !shownThisLaunch.has(item.id))
    queue.value = items
    total.value = items.length
  } catch (error) {
    // News is optional; a failed fetch just means no panel this time.
    console.warn('Failed to load news panels:', error)
  }
}

const advance = () => {
  queue.value = queue.value.slice(1)
  if (!queue.value.length) total.value = 0
}

const dismiss = (item: NewsItem) => {
  shownThisLaunch.add(item.id)
  if (props.loggedIn) {
    dismissNewsItem(item.id).catch((error) => console.warn('Failed to dismiss news item:', error))
  } else {
    rememberNewsDismissedLocally(item.id)
  }
}

const dismissCurrent = () => {
  const item = current.value
  if (!item) return
  dismiss(item)
  advance()
}

/** Hides the current item for this page load without dismissing it. */
const closeForNow = () => {
  const item = current.value
  if (!item) return
  shownThisLaunch.add(item.id)
  advance()
}

const followCta = async () => {
  const item = current.value
  const link = cta.value
  if (!item || !link) return
  dismiss(item)
  advance()
  await follow(link)
}

// Mark items as shown the moment they appear, so a failed dismissal (offline)
// can't make them pop up again during this launch; skip the item whose page
// the visitor is already reading.
watch(current, async (item) => {
  if (!item) return
  if (item.id === viewingNewsId.value) {
    closeForNow()
    return
  }
  shownThisLaunch.add(item.id)
  await nextTick()
  dialogRef.value?.focus()
})

watch(() => [props.ready, props.loggedIn] as const, ([ready]) => {
  if (!ready) return
  load()
  if (!settled.value && !delayTimer) {
    delayTimer = setTimeout(() => {
      settled.value = true
      delayTimer = null
    }, SHOW_DELAY_MS)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (delayTimer) clearTimeout(delayTimer)
})
</script>

<style scoped>
.news-panel-enter-active,
.news-panel-leave-active {
  transition: opacity 0.18s ease;
}
.news-panel-enter-active section,
.news-panel-leave-active section {
  transition: transform 0.22s ease;
}
.news-panel-enter-from,
.news-panel-leave-to {
  opacity: 0;
}
.news-panel-enter-from section,
.news-panel-leave-to section {
  transform: translateY(16px) scale(0.98);
}
</style>
