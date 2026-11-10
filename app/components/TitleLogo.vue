<template>
  <span class="title-logo-wrap">
    <img
      v-if="src && !failed"
      v-show="loaded"
      :src="src"
      :alt="alt"
      class="title-logo"
      decoding="async"
      draggable="false"
      @load="loaded = true"
      @error="failed = true"
    >
    <!-- The text title shows until the logo has loaded, and if it fails. -->
    <span v-if="!src || failed || !loaded" class="title-logo-fallback"><slot>{{ alt }}</slot></span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// A title logo in place of a text title. Size it with --title-logo-max-width
// and --title-logo-max-height.
const props = defineProps<{ src: string, alt: string }>()

const loaded = ref(false)
const failed = ref(false)
watch(() => props.src, () => {
  loaded.value = false
  failed.value = false
})
</script>

<style scoped>
.title-logo-wrap {
  display: block;
}

.title-logo {
  display: block;
  width: auto;
  height: auto;
  max-width: var(--title-logo-max-width, min(100%, 24rem));
  max-height: var(--title-logo-max-height, 4.5rem);
  object-fit: contain;
  object-position: left center;
  /* Most logos are light; a soft shadow keeps them legible on light themes. */
  filter: drop-shadow(0 2px 10px rgb(0 0 0 / 0.45));
  user-select: none;
  animation: title-logo-in 0.35s ease-out;
}

@keyframes title-logo-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .title-logo {
    animation: none;
  }
}
</style>
