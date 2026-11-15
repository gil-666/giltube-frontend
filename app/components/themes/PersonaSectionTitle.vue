<template>
  <!-- Persona menus: the section's name in huge slanted letters behind the
       page, cut off at the top-left like ITEM / EQUIP / PERSONA in P3R. -->
  <div class="persona-section-title" :class="{ 'with-sidebar': withSidebar }" :style="{ top: `${top}px` }" aria-hidden="true">
    <Transition name="persona-section">
      <span v-if="label" :key="label">{{ label }}</span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  // Below the header (and the notification bar when shown).
  top: number
  withSidebar: boolean
}>()
</script>

<style scoped>
.persona-section-title {
  position: fixed;
  left: 0;
  right: 0;
  z-index: -1;
  height: 0;
  overflow: visible;
  pointer-events: none;
  user-select: none;
}

@media (min-width: 768px) {
  .persona-section-title.with-sidebar {
    left: 15rem;
  }
}

.persona-section-title span {
  position: absolute;
  top: -0.32em;
  left: -0.06em;
  display: block;
  white-space: nowrap;
  /* Outlined so headings drawn over it stay readable. */
  color: rgb(var(--gt-white) / 0.035);
  -webkit-text-stroke: 2px rgb(var(--gt-white) / 0.16);
  font-size: clamp(5rem, 14vw, 11rem);
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1;
  text-transform: uppercase;
  transform: skewX(-8deg);
  transform-origin: left top;
}

.persona-section-enter-active {
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
}

.persona-section-leave-active {
  transition: transform 160ms ease-in, opacity 140ms ease-in;
}

.persona-section-enter-from {
  opacity: 0;
  transform: translateX(-12%) skewX(-22deg);
}

.persona-section-leave-to {
  opacity: 0;
  transform: translateX(8%) skewX(4deg);
}

@media (prefers-reduced-motion: reduce) {
  .persona-section-enter-active,
  .persona-section-leave-active {
    transition: opacity 120ms ease;
  }

  .persona-section-enter-from,
  .persona-section-leave-to {
    transform: skewX(-8deg);
  }
}
</style>
