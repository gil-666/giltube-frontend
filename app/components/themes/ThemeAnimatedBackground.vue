<template>
  <!-- Behind page content like the backdrop image. Opacity is the theme's
       effect strength, so the theme's own background always shows through. -->
  <div
    v-if="component"
    class="theme-animated-background"
    :class="{ 'is-inverted': inverted }"
    :style="{ opacity: look.style.effect_strength / 100 }"
    aria-hidden="true"
  >
    <component :is="component" :key="renderKey" v-bind="componentProps" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch, type Component } from 'vue'
import {
  hexToUnitRgb,
  isAnimatedBackground,
  mixHex,
  themeScheme,
  type ThemeAnimatedBackground,
  type ThemeAppearance,
} from '~/app/utils/theme'

const props = defineProps<{ look: ThemeAppearance }>()

// Loaded on demand, so the WebGL code only downloads for themes that use it.
const loaders: Record<ThemeAnimatedBackground, () => Promise<Component>> = {
  'aurora': () => import('./backgrounds/vendor/Aurora.vue'),
  'silk': () => import('./backgrounds/vendor/Silk.vue'),
  'iridescence': () => import('./backgrounds/vendor/Iridescence.vue'),
  'threads': () => import('./backgrounds/vendor/Threads.vue'),
  'waves': () => import('./backgrounds/vendor/Waves.vue'),
  'particles': () => import('./backgrounds/vendor/Particles.vue'),
  'light-rays': () => import('./backgrounds/vendor/LightRays.vue'),
  'plasma': () => import('./backgrounds/vendor/Plasma.vue'),
  'ripple-grid': () => import('./backgrounds/vendor/RippleGrid.vue'),
  'plasma-wave': () => import('./backgrounds/vendor/PlasmaWave.vue'),
  'balatro': () => import('./backgrounds/vendor/Balatro.vue'),
  'gradient-waves': () => import('./backgrounds/vendor/GradientWaves.vue'),
}
const asyncComponents = new Map<ThemeAnimatedBackground, Component>()
const CANVAS_2D: ThemeAnimatedBackground[] = ['waves']

const reducedMotion = ref(true)
const webglAvailable = ref(false)
const failed = ref(false)
let motionQuery: MediaQueryList | null = null
const onMotionChange = () => { reducedMotion.value = !!motionQuery?.matches }

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  onMotionChange()
  motionQuery.addEventListener('change', onMotionChange)
  try {
    const canvas = document.createElement('canvas')
    webglAvailable.value = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    webglAvailable.value = false
  }
})

onBeforeUnmount(() => motionQuery?.removeEventListener('change', onMotionChange))

// A broken shader or lost GPU context should never break the page.
onErrorCaptured((error) => {
  console.warn('Theme background disabled:', error)
  failed.value = true
  return false
})

const effect = computed(() => props.look.style.effect)

const component = computed<Component | null>(() => {
  const value = effect.value
  if (!isAnimatedBackground(value) || reducedMotion.value || failed.value) return null
  if (!CANVAS_2D.includes(value) && !webglAvailable.value) return null
  if (!asyncComponents.has(value)) asyncComponents.set(value, defineAsyncComponent(loaders[value]))
  return asyncComponents.get(value)!
})

// Silk shades toward black, which reads as grime on a light page. There it is
// drawn with the lightness flipped and inverted back by CSS, so its folds
// turn into highlights while keeping the theme's hue.
const INVERT_ON_LIGHT: ThemeAnimatedBackground[] = ['silk']
const inverted = computed(() => INVERT_ON_LIGHT.includes(effect.value as ThemeAnimatedBackground) && themeScheme(props.look.background) === 'light')

// What invert(1) hue-rotate(180deg) turns back into the original color: same
// hue and saturation, mirrored lightness.
const flipLightness = (hex: string): string => {
  const [r, g, b] = hexToUnitRgb(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const shift = 1 - max - min
  return `#${[r, g, b].map(c => Math.round(Math.min(1, Math.max(0, c + shift)) * 255).toString(16).padStart(2, '0')).join('')}`
}

// Theme colors, plus the text ink, which reads as a highlight on both dark
// and light pages.
const palette = computed(() => {
  const { primary, accent, background } = props.look
  const ink = themeScheme(background) === 'light' ? '#0c0c0e' : '#f2f2f4'
  return { primary, accent, background, ink }
})

const componentProps = computed<Record<string, unknown>>(() => {
  const { primary, accent, background, ink } = palette.value
  switch (effect.value) {
    case 'aurora': return { colorStops: [accent, primary, accent], amplitude: 1, blend: 0.6, speed: 0.6 }
    case 'silk': {
      const color = mixHex(primary, background, 0.3)
      return { color: inverted.value ? flipLightness(color) : color, speed: 3, scale: 1, noiseIntensity: 1.2 }
    }
    case 'iridescence': return { color: hexToUnitRgb(accent), speed: 0.6, amplitude: 0.1, mouseReact: false }
    case 'threads': return { color: hexToUnitRgb(accent), amplitude: 1, distance: 0, enableMouseInteraction: false }
    case 'waves': return { lineColor: mixHex(accent, background, 0.35), backgroundColor: 'transparent' }
    case 'particles': return { particleColors: [primary, accent, ink], particleCount: 320, particleBaseSize: 220, speed: 0.08, alphaParticles: true, moveParticlesOnHover: false, pixelRatio: 1 }
    case 'light-rays': return { raysOrigin: 'top-center', raysColor: accent, raysSpeed: 1, lightSpread: 0.9, rayLength: 1.6, followMouse: false }
    case 'plasma': return { color: primary, speed: 0.5, scale: 1.1, opacity: 1, mouseInteractive: false, maxDpr: 1, targetFps: 30 }
    case 'ripple-grid': return { gridColor: accent, enableRainbow: false, mouseInteraction: false, opacity: 1 }
    case 'plasma-wave': return { colors: [primary, accent] }
    case 'balatro': return { color1: primary, color2: accent, color3: background, mouseInteraction: false, isRotate: false }
    case 'gradient-waves': return { horizonColor: primary, waveColor: accent, crestColor: ink, mouseInteraction: false, grain: false }
    default: return {}
  }
})

// Not every component reacts to color changes after mounting, so remount on
// edits - debounced, so dragging a color picker doesn't rebuild the GPU
// pipeline on every input event.
const renderKey = ref(0)
let remountTimer: ReturnType<typeof setTimeout> | null = null
watch(() => JSON.stringify(componentProps.value), () => {
  if (remountTimer) clearTimeout(remountTimer)
  remountTimer = setTimeout(() => { renderKey.value++ }, 250)
})
watch(effect, () => { failed.value = false })
onBeforeUnmount(() => { if (remountTimer) clearTimeout(remountTimer) })
</script>

<style scoped>
.theme-animated-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.theme-animated-background :deep(canvas) {
  display: block;
}

.theme-animated-background.is-inverted {
  filter: invert(1) hue-rotate(180deg);
}
</style>
