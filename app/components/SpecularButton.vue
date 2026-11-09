<!--
  Specular button from Vue Bits (https://vue-bits.dev), commit 07c0f76.
  Copyright (c) 2025 David Haz. MIT + Commons Clause, see
  app/components/themes/backgrounds/vendor/LICENSE-vue-bits.md.

  GilTube changes: the edge shine only appears while the pointer is over the
  button (not by proximity) and the loop sleeps once it has faded out; colors
  come from theme variables ("R G B" triplets such as --gt-accent-500) so it
  follows the site theme; styling is plain CSS instead of Tailwind v4 classes.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { Mesh, Program, Renderer, Triangle } from 'ogl'

interface SpecularButtonProps {
  /** Theme variable for the shine and text, e.g. '--gt-accent-400'. */
  colorVar?: string
  /** Theme variable for the glass tint. */
  tintVar?: string
  tintOpacity?: number
  radius?: number
  intensity?: number
  shineSize?: number
  shineFade?: number
  thickness?: number
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const PAD = 20

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = sdRoundedRect(p, uHalfSize, uRadius);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`

const props = withDefaults(defineProps<SpecularButtonProps>(), {
  colorVar: '--gt-zinc-50',
  tintVar: '--gt-white',
  tintOpacity: 0.08,
  radius: 999,
  intensity: 1.15,
  shineSize: 10,
  shineFade: 40,
  thickness: 1,
  disabled: false,
  type: 'button',
})

const btnRef = ref<HTMLButtonElement | null>(null)
const fxRef = ref<HTMLSpanElement | null>(null)

const buttonStyle = computed<CSSProperties>(() => ({
  '--sb-radius': `${props.radius}px`,
  '--sb-color': `rgb(var(${props.colorVar}))`,
  '--sb-tint': `rgb(var(${props.tintVar}) / ${props.tintOpacity})`,
}) as CSSProperties)

// Reads a theme variable ("R G B") as 0..1 channels.
const themeRGB = (name: string, fallback: [number, number, number]): [number, number, number] => {
  if (typeof window === 'undefined') return fallback
  const parts = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/[\s,]+/).map(Number)
  if (parts.length < 3 || parts.slice(0, 3).some((value) => !Number.isFinite(value))) return fallback
  return [parts[0]! / 255, parts[1]! / 255, parts[2]! / 255]
}

let wake: (() => void) | null = null
let refreshColors: (() => void) | null = null
let teardown: (() => void) | null = null

watch(() => [props.colorVar, props.intensity], () => { refreshColors?.(); wake?.() })

onMounted(() => {
  const btn = btnRef.value
  const fx = fxRef.value
  if (!btn || !fx) return

  const dpr = window.devicePixelRatio || 1
  let renderer: Renderer
  try {
    renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr })
  } catch {
    return // No WebGL: the button still works, just without the shine.
  }
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const geometry = new Triangle(gl)
  if (geometry.attributes.uv) delete geometry.attributes.uv

  const program = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    uniforms: {
      uCenter: { value: [0, 0] },
      uHalfSize: { value: [1, 1] },
      uRadius: { value: 0 },
      uAngle: { value: 2.4 },
      uPx: { value: dpr },
      uLineColor: { value: [1, 1, 1] },
      uBaseColor: { value: [0.32, 0.32, 0.32] },
      uIntensity: { value: 0 },
      uShineSize: { value: (props.shineSize * Math.PI) / 180 },
      uShineFade: { value: (props.shineFade * Math.PI) / 180 },
      uThickness: { value: props.thickness * dpr },
      uBaseWidth: { value: dpr },
    },
  })
  const mesh = new Mesh(gl, { geometry, program })
  fx.appendChild(gl.canvas)

  refreshColors = () => {
    program.uniforms.uLineColor.value = themeRGB(props.colorVar, [1, 1, 1])
    program.uniforms.uBaseColor.value = themeRGB('--gt-zinc-600', [0.32, 0.32, 0.32])
  }
  refreshColors()

  const sizeRef = { w: 1, h: 1 }
  const resize = () => {
    const rect = btn.getBoundingClientRect()
    sizeRef.w = rect.width
    sizeRef.h = rect.height
    renderer.setSize(rect.width + PAD * 2, rect.height + PAD * 2)
    program.uniforms.uCenter.value = [(PAD + rect.width / 2) * dpr, (PAD + rect.height / 2) * dpr]
    program.uniforms.uHalfSize.value = [(rect.width / 2) * dpr, (rect.height / 2) * dpr]
    program.uniforms.uRadius.value = Math.min(props.radius, Math.min(rect.width, rect.height) / 2) * dpr
    render()
  }

  // The shine shows only while hovered: it eases in on enter, sways with the
  // pointer over the button, and fades out on leave.
  let hovered = false
  let pointerAngle = 2.4
  let angle = 2.4
  let bright = 0
  let last = 0
  let raf = 0

  const render = () => renderer.render({ scene: mesh })

  const update = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016
    last = now
    const diff = ((pointerAngle - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    angle += diff * (1 - Math.exp(-dt * 7))
    const target = hovered && !props.disabled ? 1 : 0
    bright += (target - bright) * (1 - Math.exp(-dt * 8))
    program.uniforms.uAngle.value = angle
    program.uniforms.uIntensity.value = props.intensity * bright
    render()
    // Sleep once faded out; a new hover wakes the loop.
    if (!hovered && bright < 0.005) {
      bright = 0
      program.uniforms.uIntensity.value = 0
      render()
      raf = 0
      last = 0
      return
    }
    raf = requestAnimationFrame(update)
  }
  wake = () => { if (!raf) raf = requestAnimationFrame(update) }

  const onMove = (event: PointerEvent) => {
    const rect = btn.getBoundingClientRect()
    const nx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const ny = ((rect.top + rect.height / 2) - event.clientY) / (rect.height / 2)
    pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15
  }
  const onEnter = (event: PointerEvent) => {
    hovered = true
    refreshColors?.()
    onMove(event)
    wake?.()
  }
  const onLeave = () => {
    hovered = false
    wake?.()
  }
  btn.addEventListener('pointerenter', onEnter)
  btn.addEventListener('pointermove', onMove)
  btn.addEventListener('pointerleave', onLeave)

  const ro = new ResizeObserver(resize)
  ro.observe(btn)
  resize()

  teardown = () => {
    if (raf) cancelAnimationFrame(raf)
    ro.disconnect()
    btn.removeEventListener('pointerenter', onEnter)
    btn.removeEventListener('pointermove', onMove)
    btn.removeEventListener('pointerleave', onLeave)
    if (gl.canvas.parentNode === fx) fx.removeChild(gl.canvas)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
})

onBeforeUnmount(() => {
  teardown?.()
  teardown = null
  wake = null
  refreshColors = null
})
</script>

<template>
  <button
    ref="btnRef"
    :type="type"
    :disabled="disabled"
    class="specular-button"
    :style="buttonStyle"
  >
    <span ref="fxRef" aria-hidden="true" class="specular-button__fx" />
    <span class="specular-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.specular-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  border: none;
  border-radius: var(--sb-radius);
  background: var(--sb-tint);
  color: var(--sb-color);
  cursor: pointer;
  line-height: 1;
  letter-spacing: 0.01em;
  outline: none;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04), 0 8px 24px rgb(0 0 0 / 0.25);
  transition: transform 150ms ease, background-color 200ms ease, color 200ms ease;
}

.specular-button:active:not(:disabled) {
  transform: scale(0.97);
}

.specular-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.specular-button:focus-visible {
  outline: 2px solid var(--sb-color);
  outline-offset: 3px;
}

.specular-button__fx {
  position: absolute;
  inset: -20px;
  z-index: 1;
  pointer-events: none;
}

.specular-button__fx :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.specular-button__label {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
</style>
