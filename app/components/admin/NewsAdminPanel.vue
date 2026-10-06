<template>
  <section class="space-y-5">
    <div>
      <h2 class="text-2xl font-bold text-white">{{ t('admin.news.title') }}</h2>
      <p class="mt-1 text-sm text-zinc-400">{{ t('admin.news.subtitle') }}</p>
    </div>

    <p v-if="error" class="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200" role="alert">{{ error }}</p>
    <p v-if="message" class="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200" role="status">{{ message }}</p>

    <form ref="formRef" class="grid gap-5 rounded-2xl border border-white/[0.07] bg-zinc-950 p-5" @submit.prevent="save">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-bold text-white">{{ editingId ? t('admin.news.editHeading') : t('admin.news.createHeading') }}</h3>
        <span v-if="editingItem?.notified_at" class="text-xs text-zinc-500">{{ t('admin.news.alreadyNotified', { time: formatTime(editingItem.notified_at) }) }}</span>
      </div>

      <label class="grid gap-2 text-sm font-semibold text-zinc-300">
        {{ t('admin.news.fields.title') }}
        <input v-model="form.title" required maxlength="120" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-white" :placeholder="t('admin.news.fields.titlePlaceholder')" />
      </label>

      <div class="grid gap-4 lg:grid-cols-2">
        <label class="grid content-start gap-2 text-sm font-semibold text-zinc-300">
          <span class="flex items-center justify-between gap-2">
            {{ t('admin.news.fields.body') }}
            <span class="text-xs font-normal text-zinc-500">{{ form.body.length }} / 10000</span>
          </span>
          <textarea v-model="form.body" rows="12" maxlength="10000" class="min-h-[14rem] rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 font-mono text-sm leading-6 text-white" :placeholder="t('admin.news.fields.bodyPlaceholder')" />
          <details class="rounded-xl border border-white/[0.07] bg-zinc-900/60 px-3 py-2 text-xs font-normal text-zinc-400">
            <summary class="cursor-pointer select-none font-semibold text-zinc-300">{{ t('admin.news.cheatSheet.title') }}</summary>
            <ul class="mt-2 grid gap-1">
              <li v-for="row in cheatSheet" :key="row.syntax" class="flex flex-wrap gap-x-2">
                <code class="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-200">{{ row.syntax }}</code>
                <span>{{ row.label }}</span>
              </li>
            </ul>
            <p class="mt-2">{{ t('admin.news.cheatSheet.linksNote') }}</p>
          </details>
        </label>
        <div class="grid content-start gap-2 text-sm font-semibold text-zinc-300">
          {{ t('admin.news.preview') }}
          <div class="min-h-[14rem] rounded-xl border border-white/[0.07] bg-zinc-900 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-accent-400">{{ t('news.eyebrow') }}</p>
            <p class="mt-1 text-lg font-bold text-white">{{ form.title || t('admin.news.previewUntitled') }}</p>
            <div class="mt-3 font-normal">
              <NewsMarkdown v-if="form.body.trim()" :source="form.body" compact />
              <p v-else class="text-sm text-zinc-500">{{ t('admin.news.previewEmpty') }}</p>
            </div>
            <span v-if="previewCta" class="mt-4 inline-flex rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-on-primary">{{ previewCta }}</span>
          </div>
        </div>
      </div>

      <fieldset class="grid gap-3 rounded-xl border border-white/[0.07] p-4">
        <legend class="px-1 text-sm font-semibold text-zinc-300">{{ t('admin.news.delivery.title') }}</legend>
        <label class="flex items-start gap-3 text-sm text-zinc-200">
          <input v-model="form.show_panel" type="checkbox" class="mt-0.5 h-4 w-4 accent-primary-600" />
          <span>
            {{ t('admin.news.delivery.panel') }}
            <span class="block text-xs text-zinc-500">{{ t('admin.news.delivery.panelHint') }}</span>
          </span>
        </label>
        <label class="flex items-start gap-3 text-sm text-zinc-200">
          <input v-model="form.notify" type="checkbox" class="mt-0.5 h-4 w-4 accent-primary-600" />
          <span>{{ t('admin.news.delivery.notify') }}</span>
        </label>
        <div v-if="form.notify" class="grid gap-2 pl-7 sm:grid-cols-2">
          <label
            v-for="mode in (['silent', 'loud'] as const)"
            :key="mode"
            class="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition"
            :class="form.notify_mode === mode ? 'border-primary-500/60 bg-primary-500/10 text-white' : 'border-white/10 text-zinc-300 hover:bg-white/[0.03]'"
          >
            <input v-model="form.notify_mode" type="radio" :value="mode" class="mt-0.5 h-4 w-4 accent-primary-600" />
            <span>
              <span class="font-semibold">{{ t(`admin.news.delivery.${mode}`) }}</span>
              <span class="block text-xs text-zinc-500">{{ t(`admin.news.delivery.${mode}Hint`) }}</span>
            </span>
          </label>
        </div>
        <p v-if="editingItem?.notified_at && form.notify" class="pl-7 text-xs text-zinc-500">{{ t('admin.news.delivery.notResent') }}</p>
      </fieldset>

      <fieldset class="grid gap-3 rounded-xl border border-white/[0.07] p-4 lg:grid-cols-3">
        <legend class="px-1 text-sm font-semibold text-zinc-300">{{ t('admin.news.cta.title') }}</legend>
        <label class="grid gap-2 text-sm font-semibold text-zinc-300">
          {{ t('admin.news.cta.kind') }}
          <select v-model="form.cta_kind" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-white">
            <option value="none">{{ t('admin.news.cta.none') }}</option>
            <option value="internal">{{ t('admin.news.cta.internal') }}</option>
            <option value="external">{{ t('admin.news.cta.external') }}</option>
          </select>
        </label>
        <template v-if="form.cta_kind !== 'none'">
          <label class="grid gap-2 text-sm font-semibold text-zinc-300">
            {{ t('admin.news.cta.label') }}
            <input v-model="form.cta_label" maxlength="40" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-white" :placeholder="t('news.learnMore')" />
          </label>
          <label class="grid gap-2 text-sm font-semibold text-zinc-300">
            {{ form.cta_kind === 'internal' ? t('admin.news.cta.internalTarget') : t('admin.news.cta.externalTarget') }}
            <input
              v-model="form.cta_target"
              required
              maxlength="500"
              class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-white"
              :placeholder="form.cta_kind === 'internal' ? '/video/…, /account-settings#themes' : 'https://…'"
            />
          </label>
        </template>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="grid gap-2 text-sm font-semibold text-zinc-300">
          {{ t('admin.news.schedule.starts') }}
          <input v-model="form.starts_at" type="datetime-local" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-white" />
          <span class="text-xs font-normal text-zinc-500">{{ t('admin.news.schedule.startsHint') }}</span>
        </label>
        <label class="grid gap-2 text-sm font-semibold text-zinc-300">
          {{ t('admin.news.schedule.ends') }}
          <input v-model="form.ends_at" type="datetime-local" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-white" />
          <span class="text-xs font-normal text-zinc-500">{{ t('admin.news.schedule.endsHint') }}</span>
        </label>
      </div>

      <label class="flex items-center gap-3 text-sm text-zinc-200">
        <input v-model="form.enabled" type="checkbox" class="h-4 w-4 accent-primary-600" /> {{ t('admin.news.fields.enabled') }}
      </label>

      <p v-if="willSendLoud" class="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-200">{{ t('admin.news.loudWarning') }}</p>

      <div class="flex flex-wrap gap-2">
        <button :disabled="saving" class="rounded-xl bg-primary-600 px-5 py-2.5 font-bold text-on-primary hover:bg-primary-500 disabled:opacity-50">
          {{ saving ? t('admin.news.saving') : editingId ? t('admin.news.save') : t('admin.news.create') }}
        </button>
        <button v-if="editingId" type="button" class="rounded-xl bg-zinc-800 px-5 py-2.5 font-bold text-white" @click="resetForm">{{ t('admin.news.cancel') }}</button>
      </div>
    </form>

    <div class="grid gap-3">
      <article v-for="item in items" :key="item.id" class="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-zinc-950 p-4 sm:flex-row sm:items-center">
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-bold text-white">{{ item.title }}</h3>
          <div class="mt-2 flex flex-wrap gap-1.5 text-xs font-medium">
            <span v-for="chip in chipsOf(item)" :key="chip.label" class="rounded-full px-2 py-0.5" :class="chip.class">{{ chip.label }}</span>
          </div>
          <p class="mt-2 text-xs text-zinc-500">
            {{ t('admin.news.list.starts', { time: formatTime(item.starts_at) }) }}
            <template v-if="item.ends_at"> · {{ t('admin.news.list.ends', { time: formatTime(item.ends_at) }) }}</template>
            · {{ t('admin.news.list.dismissals', { count: item.dismiss_count || 0 }) }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="mr-1 flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" class="h-4 w-4 accent-primary-600" :checked="item.enabled" :disabled="togglingId === item.id" @change="toggleEnabled(item, $event)" />
            {{ t('admin.news.list.enabled') }}
          </label>
          <NuxtLink :to="localePath(`/news/${item.id}`)" target="_blank" class="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold text-white">{{ t('admin.news.list.view') }}</NuxtLink>
          <button class="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold text-white" @click="edit(item)">{{ t('admin.news.list.edit') }}</button>
          <button class="rounded-lg bg-red-950 px-3 py-2 text-sm font-semibold text-red-200" @click="remove(item)">{{ t('admin.news.list.delete') }}</button>
        </div>
      </article>
      <p v-if="loading && !items.length" class="p-8 text-center text-zinc-500">{{ t('admin.news.loading') }}</p>
      <p v-else-if="!items.length" class="rounded-2xl border border-dashed border-white/[0.07] p-8 text-center text-zinc-500">{{ t('admin.news.empty') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import NewsMarkdown from '~/app/components/news/NewsMarkdown.vue'
import {
  createNewsItem,
  deleteNewsItem,
  listAdminNews,
  newsPayloadOf,
  updateNewsItem,
  type NewsCTAKind,
  type NewsItem,
  type NewsPayload,
} from '~/app/service/news'

const { t } = useI18n()
const localePath = useLocalePath()

const items = ref<NewsItem[]>([])
const editingId = ref('')
const loading = ref(false)
const saving = ref(false)
const togglingId = ref('')
const error = ref('')
const message = ref('')
const formRef = ref<HTMLFormElement | null>(null)

const blank = () => ({
  title: '',
  body: '',
  show_panel: true,
  notify: false,
  notify_mode: 'silent' as 'silent' | 'loud',
  cta_kind: 'none' as NewsCTAKind,
  cta_label: '',
  cta_target: '',
  enabled: true,
  starts_at: '',
  ends_at: '',
})
const form = reactive(blank())

const editingItem = computed(() => items.value.find(item => item.id === editingId.value) || null)
const previewCta = computed(() => (form.cta_kind === 'none' ? '' : form.cta_label.trim() || t('news.learnMore')))
// A loud notification goes out on save unless this item already notified.
const willSendLoud = computed(() => form.notify && form.notify_mode === 'loud' && form.enabled && !editingItem.value?.notified_at)

const cheatSheet = computed(() => [
  { syntax: '# Heading', label: t('admin.news.cheatSheet.heading') },
  { syntax: '**bold**', label: t('admin.news.cheatSheet.bold') },
  { syntax: '*italic*', label: t('admin.news.cheatSheet.italic') },
  { syntax: '~~strike~~', label: t('admin.news.cheatSheet.strike') },
  { syntax: '`code`', label: t('admin.news.cheatSheet.code') },
  { syntax: '[text](/video/ID)', label: t('admin.news.cheatSheet.link') },
  { syntax: '- item / 1. item', label: t('admin.news.cheatSheet.list') },
  { syntax: '> quote', label: t('admin.news.cheatSheet.quote') },
  { syntax: '---', label: t('admin.news.cheatSheet.divider') },
  { syntax: '```', label: t('admin.news.cheatSheet.codeBlock') },
])

const errorMessage = (e: any, fallback: string) => e?.response?.data?.error || fallback

const formatTime = (value: string | null) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

// datetime-local inputs work in local time without a zone.
const toLocalInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : undefined)

const chipsOf = (item: NewsItem) => {
  const now = Date.now()
  const chips: Array<{ label: string, class: string }> = []
  const neutral = 'bg-white/[0.06] text-zinc-300'
  if (!item.enabled) chips.push({ label: t('admin.news.chips.disabled'), class: 'bg-red-950/60 text-red-200' })
  if (item.show_panel) chips.push({ label: t('admin.news.chips.panel'), class: neutral })
  if (item.notify_mode === 'silent') chips.push({ label: t('admin.news.chips.silent'), class: neutral })
  if (item.notify_mode === 'loud') chips.push({ label: t('admin.news.chips.loud'), class: 'bg-amber-950/50 text-amber-200' })
  if (new Date(item.starts_at).getTime() > now) chips.push({ label: t('admin.news.chips.scheduled'), class: 'bg-cyan-950/50 text-cyan-200' })
  if (item.ends_at && new Date(item.ends_at).getTime() <= now) chips.push({ label: t('admin.news.chips.ended'), class: neutral })
  if (item.notified_at) chips.push({ label: t('admin.news.chips.notified', { time: formatTime(item.notified_at) }), class: 'bg-emerald-950/50 text-emerald-200' })
  return chips
}

const load = async () => {
  loading.value = true
  try {
    items.value = await listAdminNews()
  } catch (e: any) {
    error.value = errorMessage(e, t('admin.news.errors.load'))
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, blank())
  editingId.value = ''
}

const edit = (item: NewsItem) => {
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    body: item.body,
    show_panel: item.show_panel,
    notify: item.notify_mode !== 'none',
    notify_mode: item.notify_mode === 'loud' ? 'loud' : 'silent',
    cta_kind: item.cta_kind,
    cta_label: item.cta_label,
    cta_target: item.cta_target,
    enabled: item.enabled,
    starts_at: toLocalInput(item.starts_at),
    ends_at: toLocalInput(item.ends_at),
  })
  error.value = ''
  message.value = ''
  formRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const save = async () => {
  error.value = ''
  message.value = ''
  if (!form.show_panel && !form.notify) {
    error.value = t('admin.news.errors.noDelivery')
    return
  }
  if (willSendLoud.value && !confirm(t('admin.news.loudConfirm'))) return
  const payload: NewsPayload = {
    title: form.title,
    body: form.body,
    show_panel: form.show_panel,
    notify_mode: form.notify ? form.notify_mode : 'none',
    cta_kind: form.cta_kind,
    cta_label: form.cta_kind === 'none' ? '' : form.cta_label,
    cta_target: form.cta_kind === 'none' ? '' : form.cta_target,
    enabled: form.enabled,
    starts_at: fromLocalInput(form.starts_at),
    ends_at: fromLocalInput(form.ends_at) ?? null,
  }
  saving.value = true
  try {
    if (editingId.value) await updateNewsItem(editingId.value, payload)
    else await createNewsItem(payload)
    message.value = t('admin.news.saved')
    resetForm()
    await load()
  } catch (e: any) {
    error.value = errorMessage(e, t('admin.news.errors.save'))
  } finally {
    saving.value = false
  }
}

const toggleEnabled = async (item: NewsItem, event: Event) => {
  const checkbox = event.target as HTMLInputElement
  const enabling = !item.enabled
  if (enabling && item.notify_mode === 'loud' && !item.notified_at && !confirm(t('admin.news.loudConfirm'))) {
    checkbox.checked = item.enabled
    return
  }
  togglingId.value = item.id
  error.value = ''
  try {
    const updated = await updateNewsItem(item.id, { ...newsPayloadOf(item), enabled: enabling })
    items.value = items.value.map(existing => (existing.id === item.id ? { ...updated, dismiss_count: existing.dismiss_count } : existing))
  } catch (e: any) {
    error.value = errorMessage(e, t('admin.news.errors.save'))
    checkbox.checked = item.enabled
  } finally {
    togglingId.value = ''
  }
}

const remove = async (item: NewsItem) => {
  if (!confirm(t('admin.news.deleteConfirm', { title: item.title }))) return
  error.value = ''
  try {
    await deleteNewsItem(item.id)
    if (editingId.value === item.id) resetForm()
    await load()
  } catch (e: any) {
    error.value = errorMessage(e, t('admin.news.errors.delete'))
  }
}

onMounted(load)
</script>
