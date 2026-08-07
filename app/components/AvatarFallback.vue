<template>
  <div class="flex items-center justify-center overflow-hidden rounded-full bg-zinc-700 font-bold text-white">
    <img
      v-if="resolvedSrc && !failed"
      :src="resolvedSrc"
      :srcset="resolvedSrcset || undefined"
      sizes="48px"
      :alt="name || t('common.avatar')"
      :class="imageClass"
      @error="failed = true"
    />
    <span v-else>{{ initial }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { imageVariantSrcset, imageVariantUrl, resolveAvatarUrl } from '~/app/utils/media'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  src?: string | null
  name?: string | null
  imageClass?: string
}>(), {
  src: '',
  name: '',
  imageClass: 'h-full w-full object-cover'
})

const failed = ref(false)

const resolvedSrc = computed(() => {
  const value = String(props.src || '').trim()
  const avatarUrl = resolveAvatarUrl(value)
  return avatarUrl ? imageVariantUrl(avatarUrl, 'sm') || avatarUrl : ''
})

const resolvedSrcset = computed(() => {
  return imageVariantSrcset(resolveAvatarUrl(props.src))
})

const initial = computed(() => {
  return String(props.name || 'U').trim().charAt(0).toUpperCase() || 'U'
})

watch(resolvedSrc, () => {
  failed.value = false
})
</script>
