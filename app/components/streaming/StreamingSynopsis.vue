<template>
  <div class="streaming-synopsis-disclosure">
    <p
      ref="synopsisElement"
      class="streaming-synopsis-text"
      :class="{ 'is-expanded': expanded }"
      :style="{ '--synopsis-lines': String(lines) }"
    >
      {{ text }}
    </p>
    <button
      v-if="canExpand"
      type="button"
      class="streaming-synopsis-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? t('streaming.actions.showLess') : t('streaming.actions.readMore') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  text?: string
  lines?: number
}>(), {
  text: '',
  lines: 4,
})

const { t } = useI18n()
const synopsisElement = ref<HTMLElement | null>(null)
const expanded = ref(false)
const canExpand = ref(false)
let resizeObserver: ResizeObserver | null = null

const measureOverflow = async () => {
  await nextTick()
  const element = synopsisElement.value
  if (!element || expanded.value) return
  canExpand.value = element.scrollHeight > element.clientHeight + 1
}

watch(() => props.text, () => {
  expanded.value = false
  canExpand.value = false
  void measureOverflow()
})

onMounted(() => {
  void measureOverflow()
  if (typeof ResizeObserver !== 'undefined' && synopsisElement.value) {
    resizeObserver = new ResizeObserver(() => void measureOverflow())
    resizeObserver.observe(synopsisElement.value)
  }
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style scoped>
.streaming-synopsis-disclosure {
  max-width: 48rem;
}

.streaming-synopsis-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--synopsis-lines);
  color: rgb(212 212 216);
  font-size: 0.875rem;
  line-height: 1.65;
  white-space: pre-line;
}

.streaming-synopsis-text.is-expanded {
  display: block;
  overflow: visible;
  -webkit-line-clamp: initial;
}

.streaming-synopsis-toggle {
  margin-top: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(244 244 245);
  font-size: 0.8125rem;
  font-weight: 800;
  text-decoration: underline;
  text-decoration-color: rgb(113 113 122);
  text-underline-offset: 0.2rem;
}

.streaming-synopsis-toggle:hover {
  text-decoration-color: rgb(244 244 245);
}

.streaming-synopsis-toggle:focus-visible {
  border-radius: 0.2rem;
  outline: 2px solid white;
  outline-offset: 0.25rem;
}
</style>
