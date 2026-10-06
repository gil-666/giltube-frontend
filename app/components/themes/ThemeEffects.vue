<template>
  <!-- Sits behind page content (like the backdrop image), so particles show in
       the page's open space and never cover text or video. -->
  <div v-if="count" class="theme-effects" :class="`theme-effects--${effect}`" :style="{ opacity: strength / 100 }" aria-hidden="true">
    <span v-for="particle in particles" :key="particle.id" class="theme-particle" :style="particle.style" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeEffect } from '~/app/utils/theme'

const props = withDefaults(defineProps<{ effect: ThemeEffect, strength?: number }>(), { strength: 100 })

// Only the CSS particle effects live here; animated backgrounds are drawn by
// ThemeAnimatedBackground.
const COUNTS: Partial<Record<ThemeEffect, number>> = { snow: 36, sparkles: 22, bubbles: 18, stars: 48 }
const count = computed(() => COUNTS[props.effect] || 0)

// Deterministic "randomness" so server and client render the same markup.
const seeded = (index: number, salt: number) => {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const particles = computed(() => Array.from({ length: count.value }, (_, id) => {
  const r = (salt: number) => seeded(id + 1, salt)
  const size = props.effect === 'bubbles' ? 10 + r(1) * 34 : props.effect === 'sparkles' ? 8 + r(1) * 10 : 2 + r(1) * 4
  return {
    id,
    style: {
      left: `${(r(2) * 100).toFixed(2)}%`,
      top: props.effect === 'stars' || props.effect === 'sparkles' ? `${(r(3) * 100).toFixed(2)}%` : undefined,
      width: `${size.toFixed(1)}px`,
      height: `${size.toFixed(1)}px`,
      animationDuration: `${(props.effect === 'snow' ? 9 + r(4) * 12 : props.effect === 'bubbles' ? 12 + r(4) * 14 : 2.5 + r(4) * 4).toFixed(2)}s`,
      animationDelay: `${(-r(5) * 20).toFixed(2)}s`,
      '--drift': `${((r(6) - 0.5) * 120).toFixed(0)}px`,
    },
  }
}))
</script>

<style scoped>
.theme-effects {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.theme-particle {
  position: absolute;
  display: block;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.theme-effects--snow .theme-particle {
  top: -12px;
  border-radius: 9999px;
  background: rgb(var(--gt-zinc-100) / 0.7);
  animation-name: theme-fall;
}

.theme-effects--bubbles .theme-particle {
  bottom: -60px;
  border-radius: 9999px;
  border: 1.5px solid rgb(var(--gt-accent-400) / 0.45);
  background: radial-gradient(circle at 30% 30%, rgb(var(--gt-accent-200) / 0.25), transparent 60%);
  animation-name: theme-rise;
}

.theme-effects--sparkles .theme-particle {
  background: rgb(var(--gt-primary-400));
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation-name: theme-twinkle;
  animation-timing-function: ease-in-out;
}

.theme-effects--stars .theme-particle {
  border-radius: 9999px;
  background: rgb(var(--gt-zinc-100));
  animation-name: theme-glimmer;
  animation-timing-function: ease-in-out;
}

@keyframes theme-fall {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(var(--drift), 105vh, 0); }
}

@keyframes theme-rise {
  0% { transform: translate3d(0, 0, 0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translate3d(var(--drift), -110vh, 0); opacity: 0; }
}

@keyframes theme-twinkle {
  0%, 100% { transform: scale(0.2) rotate(0deg); opacity: 0; }
  50% { transform: scale(1) rotate(45deg); opacity: 0.85; }
}

@keyframes theme-glimmer {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.8; }
}

@media (prefers-reduced-motion: reduce) {
  .theme-effects {
    display: none;
  }
}
</style>
