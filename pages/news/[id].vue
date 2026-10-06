<template>
  <div class="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
    <div class="mx-auto max-w-2xl">
      <div v-if="pending && !item" class="rounded-2xl border border-white/[0.07] bg-zinc-900 p-6 text-zinc-400">{{ t('news.page.loading') }}</div>

      <div v-else-if="!item" class="space-y-3 rounded-2xl border border-white/[0.07] bg-zinc-900 p-8 text-center">
        <h1 class="text-xl font-semibold">{{ t('news.page.notFoundTitle') }}</h1>
        <p class="text-sm text-zinc-400">{{ t('news.page.notFoundBody') }}</p>
        <NuxtLink :to="localePath('/')" class="inline-block rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white">
          {{ t('news.page.goHome') }}
        </NuxtLink>
      </div>

      <article v-else>
        <p class="text-xs font-semibold uppercase tracking-wide text-accent-400">{{ t('news.eyebrow') }}</p>
        <h1 class="mt-2 text-3xl font-bold leading-tight tracking-tight text-white">{{ item.title }}</h1>
        <p class="mt-2 text-sm text-zinc-500">
          <time :datetime="item.starts_at">{{ publishedLabel }}</time>
        </p>

        <div class="mt-6 rounded-2xl border border-white/[0.07] bg-zinc-900 p-5 sm:p-7">
          <NewsMarkdown :source="item.body" />

          <div v-if="cta" class="mt-6 border-t border-white/[0.07] pt-5">
            <a
              v-if="cta.external"
              :href="cta.to"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-500"
            >
              {{ cta.label }}
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5h5v5m0-5l-8 8M10 5H5v14h14v-5" />
              </svg>
            </a>
            <NuxtLink
              v-else
              :to="cta.to"
              class="inline-flex items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-500"
            >
              {{ cta.label }}
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import NewsMarkdown from '~/app/components/news/NewsMarkdown.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { useNewsCta } from '~/app/composables/useNewsCta'
import { getNewsItem } from '~/app/service/news'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { ctaOf } = useNewsCta()
const id = computed(() => String(route.params.id || ''))

const { data, pending } = await useAsyncData(
  `news-${id.value}`,
  async () => {
    try {
      return await getNewsItem(id.value)
    } catch {
      return null
    }
  },
)

const item = computed(() => data.value || null)
const cta = computed(() => ctaOf(item.value))

const publishedLabel = computed(() => {
  if (!item.value) return ''
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(item.value.starts_at))
  } catch {
    return item.value.starts_at
  }
})

// A plain-text summary of the body for link previews.
const description = (() => {
  const body = data.value?.body || ''
  const text = body
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~>#|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text
})()

useMetaTags({
  title: data.value ? `${data.value.title} - GilTube` : 'News - GilTube',
  description: description || 'News and announcements from GilTube.',
  url: `/news/${id.value}`,
  type: 'article',
})
</script>
