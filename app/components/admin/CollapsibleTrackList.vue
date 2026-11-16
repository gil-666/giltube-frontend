<template>
  <div>
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded bg-white/[0.04] px-3 py-2 text-left text-xs font-semibold text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="inline-block text-gray-500 transition-transform" :class="open ? 'rotate-90' : ''" aria-hidden="true">▸</span>
      <span>{{ t('videoEditor.trackList.count', { count }, count) }}</span>
      <span class="ml-auto font-normal text-gray-500">{{ open ? t('videoEditor.trackList.hide') : t('videoEditor.trackList.show') }}</span>
    </button>
    <div v-if="open" class="mt-2 space-y-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Lists longer than this start collapsed so they don't bury the upload form
// below them; shorter ones stay open. Once toggled, the admin's choice sticks.
const AUTO_COLLAPSE_ABOVE = 4

const props = defineProps<{ count: number }>()
const { t } = useI18n()

const userChoice = ref<boolean | null>(null)
const open = computed(() => userChoice.value ?? props.count <= AUTO_COLLAPSE_ABOVE)
const toggle = () => {
  userChoice.value = !open.value
}
</script>
