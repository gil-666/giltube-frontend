<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold text-white">{{ t('admin.promotions.title') }}</h2>
          <p class="mt-1 max-w-2xl text-sm text-gray-400">{{ t('admin.promotions.body') }}</p>
        </div>
        <button type="button" class="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-700" @click="startNew">
          {{ t('admin.promotions.new') }}
        </button>
      </div>
      <p v-if="error" class="mt-3 rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">{{ error }}</p>
      <p v-if="message" class="mt-3 text-sm text-emerald-300">{{ message }}</p>
    </section>

    <section v-if="editing" class="space-y-5 rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <h3 class="text-lg font-semibold text-white">{{ editing.id ? t('admin.promotions.edit') : t('admin.promotions.new') }}</h3>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('admin.promotions.preview') }}</p>
          <div class="flex rounded-full border border-white/10 p-0.5 text-xs font-semibold" role="group" :aria-label="t('admin.promotions.previewLanguage')">
            <button v-for="lang in ['en', 'es']" :key="lang" type="button" :class="['rounded-full px-3 py-1 transition', previewLang === lang ? 'bg-zinc-700 text-white' : 'text-gray-400 hover:text-white']" @click="previewLang = lang">
              {{ lang.toUpperCase() }}
            </button>
          </div>
        </div>
        <PromoBanner :key="previewLang" :promo="previewPromo" preview />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="field">
          <span>{{ t('admin.promotions.fields.title') }} *</span>
          <input v-model="form.title" maxlength="80" required>
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.url') }} *</span>
          <input v-model="form.url" type="url" placeholder="https://" required>
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.label') }}</span>
          <input v-model="form.label" maxlength="40" :placeholder="t('admin.promotions.placeholders.label')">
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.placement') }}</span>
          <select v-model="form.placement">
            <option v-for="placement in placements" :key="placement" :value="placement">{{ placementName(placement) }}</option>
          </select>
        </label>
        <label class="field md:col-span-2">
          <span>{{ t('admin.promotions.fields.tagline') }}</span>
          <input v-model="form.tagline" maxlength="140">
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.cta') }}</span>
          <input v-model="form.cta_label" maxlength="30" :placeholder="t('promo.play')">
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.badge') }}</span>
          <input v-model="form.badge" maxlength="20" :placeholder="t('admin.promotions.placeholders.badge')">
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.logoStyle') }}</span>
          <select v-model="form.logo_style">
            <option value="white">{{ t('admin.promotions.logoStyles.white') }}</option>
            <option value="original">{{ t('admin.promotions.logoStyles.original') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.partnerStyle') }}</span>
          <select v-model="form.partner_style">
            <option value="card">{{ t('admin.promotions.partnerStyles.card') }}</option>
            <option value="original">{{ t('admin.promotions.partnerStyles.original') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.partnerCaption') }}</span>
          <input v-model="form.partner_caption" maxlength="60">
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.effect') }}</span>
          <select v-model="form.effect">
            <option value="none">{{ t('admin.promotions.effects.none') }}</option>
            <option value="flutter">{{ t('admin.promotions.effects.flutter') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.scene') }}</span>
          <select v-model="form.scene">
            <option value="none">{{ t('admin.promotions.scenes.none') }}</option>
            <option value="lighthouse">{{ t('admin.promotions.scenes.lighthouse') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.sortOrder') }}</span>
          <input v-model.number="form.sort_order" type="number">
        </label>
      </div>

      <div class="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <p class="text-sm font-medium text-gray-300">{{ t('admin.promotions.spanish.title') }}</p>
        <p class="mt-1 text-xs text-gray-500">{{ t('admin.promotions.spanish.body') }}</p>
        <div class="mt-3 grid gap-4 md:grid-cols-2">
          <label v-for="field in spanishFields" :key="field.key" class="field" :class="{ 'md:col-span-2': field.key === 'tagline' }">
            <span>{{ t(`admin.promotions.fields.${field.label}`) }}</span>
            <input v-model="form.translations.es[field.key]" :maxlength="field.max" :placeholder="form[field.key] || ''">
          </label>
        </div>
      </div>

      <div>
        <p class="mb-2 text-sm font-medium text-gray-300">{{ t('admin.promotions.fields.colors') }}</p>
        <div class="flex flex-wrap gap-4">
          <label v-for="key in colorKeys" :key="key" class="flex items-center gap-2 text-sm text-gray-400">
            <input v-model="form.theme[key]" type="color" class="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent">
            {{ t(`admin.promotions.colors.${key}`) }}
          </label>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <label class="field">
          <span>{{ t('admin.promotions.fields.startsAt') }}</span>
          <input v-model="startsAtLocal" type="datetime-local">
        </label>
        <label class="field">
          <span>{{ t('admin.promotions.fields.endsAt') }}</span>
          <input v-model="endsAtLocal" type="datetime-local">
        </label>
        <label class="flex items-center gap-2 self-end pb-2 text-sm text-gray-300">
          <input v-model="form.enabled" type="checkbox" class="h-4 w-4 accent-primary-600">
          {{ t('admin.promotions.fields.enabled') }}
        </label>
      </div>

      <div class="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <p class="text-sm font-medium text-gray-300">{{ t('admin.promotions.assets.title') }}</p>
        <p v-if="!editing.id" class="mt-1 text-xs text-amber-300/90">{{ t('admin.promotions.assets.saveFirst') }}</p>
        <div v-else class="mt-3 grid gap-4 md:grid-cols-3">
          <div v-for="slot in assetSlots" :key="slot.key" class="space-y-2">
            <p class="text-xs font-medium text-gray-400">{{ t(`admin.promotions.assets.${slot.key}`) }}</p>
            <div class="flex h-20 items-center justify-center rounded border border-white/10 bg-[repeating-conic-gradient(#27272a_0_25%,#18181b_0_50%)] bg-[length:16px_16px] p-2">
              <img v-if="editing[slot.url]" :src="resolveMediaUrl(editing[slot.url])" alt="" class="max-h-full max-w-full object-contain">
              <span v-else class="text-xs text-gray-500">{{ t('admin.promotions.assets.none') }}</span>
            </div>
            <div class="flex gap-2">
              <label class="cursor-pointer rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-600">
                {{ uploading === slot.key ? t('admin.promotions.assets.uploading') : t('admin.promotions.assets.upload') }}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg" class="hidden" :disabled="!!uploading" @change="upload(slot.key, $event)">
              </label>
              <button v-if="editing[slot.url]" type="button" class="rounded bg-red-900 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-800" :disabled="!!uploading" @click="removeAsset(slot.key)">
                {{ t('common.delete') }}
              </button>
            </div>
            <p class="text-xs text-gray-500">{{ t(`admin.promotions.assets.${slot.key}Help`) }}</p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" :disabled="saving" class="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-700 disabled:opacity-50" @click="save">
          {{ saving ? t('common.saving') : t('common.save') }}
        </button>
        <button type="button" class="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600" @click="editing = null">
          {{ t('common.cancel') }}
        </button>
      </div>
    </section>

    <section v-if="!loading && !promotions.length && !editing" class="rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center text-sm text-gray-400">
      {{ t('admin.promotions.empty') }}
    </section>

    <section v-for="promo in promotions" :key="promo.id" class="space-y-3 rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-semibold text-white">{{ promo.title }}</h3>
          <span :class="['rounded px-2 py-0.5 text-xs font-semibold', status(promo).class]">{{ status(promo).text }}</span>
          <span class="rounded bg-zinc-800 px-2 py-0.5 text-xs text-gray-300">{{ placementName(promo.placement) }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span>{{ t('admin.promotions.stats', { impressions: (promo.impressions || 0).toLocaleString(), clicks: (promo.clicks || 0).toLocaleString(), rate: clickRate(promo) }) }}</span>
          <button type="button" class="rounded bg-zinc-700 px-3 py-1.5 font-semibold text-white transition hover:bg-zinc-600" @click="startEdit(promo)">{{ t('admin.promotions.edit') }}</button>
          <button type="button" class="rounded bg-red-900 px-3 py-1.5 font-semibold text-red-100 transition hover:bg-red-800" @click="remove(promo)">{{ t('common.delete') }}</button>
        </div>
      </div>
      <PromoBanner :promo="promo" preview />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PromoBanner from '~/app/components/promo/PromoBanner.vue'
import { deletePromotion, deletePromotionAsset, listAdminPromotions, localizePromotion, savePromotion, uploadPromotionAsset, type Promotion, type PromotionAssetSlot, type PromotionInput } from '~/app/service/promotions'
import { resolveMediaUrl } from '~/app/utils/media'

const { t } = useI18n()

const promotions = ref<Promotion[]>([])
const placements = ref<string[]>(['home:top', 'home:after-continue', 'home:after-movies', 'home:after-series', 'home:after-live', 'home:before-videos'])
const loading = ref(true)
const saving = ref(false)
const uploading = ref('')
const error = ref('')
const message = ref('')
const editing = ref<Promotion | { id: '' } | null>(null)

const colorKeys = ['from', 'via', 'to', 'accent'] as const
const previewLang = ref<'en' | 'es'>('en')
const spanishFields = [
  { key: 'label', label: 'label', max: 40 },
  { key: 'title', label: 'title', max: 80 },
  { key: 'tagline', label: 'tagline', max: 140 },
  { key: 'cta_label', label: 'cta', max: 30 },
  { key: 'badge', label: 'badge', max: 20 },
  { key: 'partner_caption', label: 'partnerCaption', max: 60 },
] as const
const assetSlots: { key: PromotionAssetSlot, url: 'logo_url' | 'partner_url' | 'sprite_url' }[] = [
  { key: 'logo', url: 'logo_url' },
  { key: 'partner', url: 'partner_url' },
  { key: 'sprite', url: 'sprite_url' },
]

const blankForm = (): PromotionInput => ({
  placement: 'home:after-movies',
  label: '',
  title: '',
  tagline: '',
  badge: '',
  cta_label: '',
  url: '',
  partner_caption: '',
  logo_style: 'white',
  partner_style: 'card',
  effect: 'none',
  scene: 'none',
  theme: { from: '#0b1026', via: '#2a1b4d', to: '#c8643b', accent: '#7cc4ff' },
  translations: { es: {} },
  sort_order: 0,
  enabled: false,
  starts_at: null,
  ends_at: null,
})

const form = reactive<PromotionInput>(blankForm())

// datetime-local inputs work in local time; the API stores UTC.
const toLocal = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const startsAtLocal = ref('')
const endsAtLocal = ref('')
watch(startsAtLocal, (value) => { form.starts_at = value ? new Date(value).toISOString() : null })
watch(endsAtLocal, (value) => { form.ends_at = value ? new Date(value).toISOString() : null })

const previewPromo = computed<Promotion>(() => {
  const current = editing.value && 'logo_url' in editing.value ? editing.value : null
  const promo: Promotion = {
    ...form,
    theme: { ...form.theme },
    translations: { es: { ...form.translations.es } },
    id: current?.id || 'preview',
    title: form.title || t('admin.promotions.placeholders.title'),
    url: form.url || 'https://example.com',
    logo_url: current?.logo_url || '',
    partner_url: current?.partner_url || '',
    sprite_url: current?.sprite_url || '',
  }
  return previewLang.value === 'es' ? localizePromotion(promo, 'es') : promo
})

const placementName = (placement: string) => t(`admin.promotions.placements.${placement.replace('home:', '')}`)

const status = (promo: Promotion) => {
  const now = Date.now()
  if (!promo.enabled) return { text: t('admin.promotions.status.disabled'), class: 'bg-zinc-800 text-gray-400' }
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return { text: t('admin.promotions.status.scheduled'), class: 'bg-sky-900/60 text-sky-200' }
  if (promo.ends_at && new Date(promo.ends_at).getTime() <= now) return { text: t('admin.promotions.status.ended'), class: 'bg-zinc-800 text-gray-400' }
  return { text: t('admin.promotions.status.live'), class: 'bg-emerald-900/60 text-emerald-200' }
}

const clickRate = (promo: Promotion) => {
  if (!promo.impressions) return '0%'
  return `${((100 * (promo.clicks || 0)) / promo.impressions).toFixed(1)}%`
}

const errorText = (err: any, fallback: string) => err?.response?.data?.error || err?.message || fallback

const load = async () => {
  loading.value = true
  try {
    const data = await listAdminPromotions()
    promotions.value = data.promotions || []
    if (data.placements?.length) placements.value = data.placements
  } catch (err: any) {
    error.value = errorText(err, t('admin.promotions.errors.load'))
  } finally {
    loading.value = false
  }
}

const fillForm = (source: PromotionInput) => {
  Object.assign(form, blankForm(), source, {
    theme: { ...blankForm().theme, ...source.theme },
    translations: { es: { ...(source.translations?.es || {}) } },
  })
  startsAtLocal.value = toLocal(source.starts_at)
  endsAtLocal.value = toLocal(source.ends_at)
}

const startNew = () => {
  message.value = ''
  editing.value = { id: '' }
  fillForm(blankForm())
}

const startEdit = (promo: Promotion) => {
  message.value = ''
  editing.value = { ...promo }
  fillForm(promo)
}

const replaceInList = (promo: Promotion) => {
  const index = promotions.value.findIndex((item) => item.id === promo.id)
  if (index >= 0) promotions.value.splice(index, 1, promo)
  else promotions.value.push(promo)
}

const save = async () => {
  if (!editing.value) return
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    const saved = await savePromotion({ ...form, theme: { ...form.theme }, translations: { es: { ...form.translations.es } } }, editing.value.id || undefined)
    replaceInList(saved)
    editing.value = { ...saved }
    message.value = t('admin.promotions.saved')
  } catch (err: any) {
    error.value = errorText(err, t('admin.promotions.errors.save'))
  } finally {
    saving.value = false
  }
}

const upload = async (slot: PromotionAssetSlot, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !editing.value?.id) return
  uploading.value = slot
  error.value = ''
  try {
    const saved = await uploadPromotionAsset(editing.value.id, slot, file)
    replaceInList(saved)
    editing.value = { ...saved }
  } catch (err: any) {
    error.value = errorText(err, t('admin.promotions.errors.upload'))
  } finally {
    uploading.value = ''
  }
}

const removeAsset = async (slot: PromotionAssetSlot) => {
  if (!editing.value?.id) return
  uploading.value = slot
  try {
    const saved = await deletePromotionAsset(editing.value.id, slot)
    replaceInList(saved)
    editing.value = { ...saved }
  } catch (err: any) {
    error.value = errorText(err, t('admin.promotions.errors.upload'))
  } finally {
    uploading.value = ''
  }
}

const remove = async (promo: Promotion) => {
  if (!window.confirm(t('admin.promotions.confirmDelete', { title: promo.title }))) return
  try {
    await deletePromotion(promo.id)
    promotions.value = promotions.value.filter((item) => item.id !== promo.id)
    if (editing.value?.id === promo.id) editing.value = null
  } catch (err: any) {
    error.value = errorText(err, t('admin.promotions.errors.delete'))
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(161 161 170);
}

.field input,
.field select {
  border-radius: 0.375rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(39 39 42);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #fff;
}
</style>
