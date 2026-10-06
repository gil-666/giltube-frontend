<template>
  <fieldset class="rounded border border-white/10 p-4">
    <legend class="px-1 text-sm font-medium text-gray-300">{{ t('contentRatingAdmin.title') }}</legend>
    <div class="flex flex-wrap items-center gap-4">
      <label class="flex items-center gap-2 text-sm text-gray-300">
        <input type="radio" value="auto" :checked="modelValue.mode === 'auto'" @change="update({ mode: 'auto' })" />
        {{ t('contentRatingAdmin.auto') }}
      </label>
      <label class="flex items-center gap-2 text-sm text-gray-300">
        <input type="radio" value="manual" :checked="modelValue.mode === 'manual'" @change="update({ mode: 'manual' })" />
        {{ t('contentRatingAdmin.manual') }}
      </label>
      <span v-if="modelValue.mode === 'auto'" class="text-sm text-gray-400">
        {{ autoSummary }}
      </span>
    </div>
    <div v-if="modelValue.mode === 'manual'" class="mt-4 grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-300">{{ t('contentRatingAdmin.rating') }}</label>
        <input
          :value="modelValue.rating"
          maxlength="32"
          placeholder="TV-MA"
          class="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 uppercase text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
          @input="update({ rating: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <div>
        <span class="mb-2 block text-sm font-medium text-gray-300">{{ t('contentRatingAdmin.descriptors') }}</span>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <label v-for="key in CONTENT_DESCRIPTOR_KEYS" :key="key" class="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" :checked="modelValue.descriptors.includes(key)" @change="toggle(key)" />
            {{ t(`contentRating.descriptors.${key}`) }}
          </label>
        </div>
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CONTENT_DESCRIPTOR_KEYS, type ContentRatingInput } from '~/app/utils/contentRating'

const props = defineProps<{ modelValue: ContentRatingInput }>()
const emit = defineEmits<{ 'update:modelValue': [value: ContentRatingInput] }>()
const { t } = useI18n()

const update = (patch: Partial<ContentRatingInput>) => {
  emit('update:modelValue', { ...props.modelValue, ...patch, dirty: true })
}

const toggle = (key: string) => {
  const current = props.modelValue.descriptors
  const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
  update({ descriptors: CONTENT_DESCRIPTOR_KEYS.filter((item) => next.includes(item)) })
}

const autoSummary = computed(() => {
  const { rating, descriptors } = props.modelValue
  if (!rating) return t('contentRatingAdmin.autoPending')
  const details = descriptors.map((key) => t(`contentRating.descriptors.${key}`)).join(', ')
  return details ? `${rating} · ${details}` : rating
})
</script>
