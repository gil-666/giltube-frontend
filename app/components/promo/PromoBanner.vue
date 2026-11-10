<template>
  <component
    :is="preview ? 'div' : 'a'"
    ref="root"
    class="promo"
    :class="{ 'is-offscreen': offscreen, 'promo--flutter': flutter, 'promo--scene': promo.scene === 'lighthouse' }"
    :style="themeStyle"
    :href="preview ? undefined : promo.url"
    :target="preview ? undefined : '_blank'"
    :rel="preview ? undefined : 'noopener'"
    :aria-label="ariaLabel"
    @click="onClick"
  >
    <div class="promo__sky" aria-hidden="true" />

    <svg v-if="promo.scene === 'lighthouse'" class="promo__scene" viewBox="0 0 420 170" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-beam`" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stop-color="#fff3c4" stop-opacity="0.75" />
          <stop offset="0.35" stop-color="#ffe9a8" stop-opacity="0.22" />
          <stop offset="1" stop-color="#ffe9a8" stop-opacity="0" />
        </linearGradient>
        <radialGradient :id="`${uid}-lamp`">
          <stop offset="0" stop-color="#fffbe6" />
          <stop offset="0.45" stop-color="#ffd978" stop-opacity="0.7" />
          <stop offset="1" stop-color="#ffd978" stop-opacity="0" />
        </radialGradient>
      </defs>
      <g class="promo__beam">
        <polygon points="371,27 -620,-150 -620,30" :fill="`url(#${uid}-beam)`" />
      </g>
      <path class="promo__cliff" d="M0 170 L0 150 C46 146 88 151 128 142 C176 131 214 136 254 122 C292 109 318 112 340 100 C356 92 392 93 420 90 L420 170 Z" />
      <path class="promo__cliff promo__cliff--near" d="M150 170 C196 160 236 162 276 150 C316 138 352 141 420 128 L420 170 Z" />
      <g class="promo__tower">
        <path d="M361 96 L363.5 40 L378.5 40 L381 96 Z" />
        <rect x="358" y="36" width="26" height="4.5" rx="1" />
        <rect x="364" y="22" width="14" height="14" rx="1.5" class="promo__lantern" />
        <path d="M361 22 L371 11 L381 22 Z" />
        <rect x="370" y="6" width="2" height="6" />
        <path d="M352 100 L390 100 L386 96 L356 96 Z" />
      </g>
      <circle cx="371" cy="29" r="14" :fill="`url(#${uid}-lamp)`" class="promo__lamp" />
    </svg>

    <div class="promo__grain" aria-hidden="true" />

    <div class="promo__body">
      <div class="promo__lead">
        <img
          v-if="promo.logo_url"
          :src="resolveMediaUrl(promo.logo_url)"
          :alt="promo.title"
          class="promo__logo"
          :class="{ 'promo__logo--white': promo.logo_style === 'white' }"
          draggable="false"
        >
        <p v-else class="promo__title">{{ promo.title }}</p>
        <p v-if="promo.tagline" class="promo__tagline">{{ promo.tagline }}</p>
        <div class="promo__actions">
          <span class="promo__cta">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            {{ promo.cta_label || t('promo.play') }}
          </span>
          <span v-if="promo.badge" class="promo__badge">{{ promo.badge }}</span>
          <span v-if="host" class="promo__host">{{ host }}</span>
        </div>
      </div>

      <div v-if="promo.partner_url" class="promo__partner" :class="`promo__partner--${promo.partner_style}`">
        <figure v-if="promo.partner_style === 'card'" class="promo__polaroid">
          <span class="promo__tape" aria-hidden="true" />
          <div class="promo__photo">
            <img :src="resolveMediaUrl(promo.partner_url)" alt="" draggable="false">
          </div>
          <figcaption v-if="promo.partner_caption">{{ promo.partner_caption }}</figcaption>
          <span v-if="flutter" class="promo__rester" aria-hidden="true">
            <span class="promo__wing promo__wing--rest" :style="spriteStyle" />
          </span>
        </figure>
        <img v-else :src="resolveMediaUrl(promo.partner_url)" alt="" class="promo__partner-logo" draggable="false">
      </div>
    </div>

    <div v-if="flutter" class="promo__sprites" aria-hidden="true">
      <span v-for="(flyer, index) in flyers" :key="index" class="promo__flyer" :class="{ 'promo__flyer--rtl': flyer.dir < 0 }" :style="flyer.style">
        <span class="promo__bob" :style="flyer.bobStyle">
          <span class="promo__wing" :style="[spriteStyle, flyer.wingStyle]" />
        </span>
      </span>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { recordPromotionEvent, type Promotion } from '~/app/service/promotions'
import { resolveMediaUrl } from '~/app/utils/media'

const props = withDefaults(defineProps<{
  promo: Promotion
  // Previews (the admin editor) are not links and are not counted.
  preview?: boolean
}>(), { preview: false })

const { t } = useI18n()
const uid = `promo-${useId()}`
const root = ref<HTMLElement | null>(null)
const offscreen = ref(false)

const flutter = computed(() => props.promo.effect === 'flutter' && !!props.promo.sprite_url)

const themeStyle = computed(() => ({
  '--promo-from': props.promo.theme?.from || '#0b1026',
  '--promo-via': props.promo.theme?.via || '#2a1b4d',
  '--promo-to': props.promo.theme?.to || '#c8643b',
  '--promo-accent': props.promo.theme?.accent || '#7cc4ff',
}))

const spriteStyle = computed(() => ({ backgroundImage: `url("${resolveMediaUrl(props.promo.sprite_url)}")` }))

const host = computed(() => {
  try {
    return new URL(props.promo.url).host
  } catch {
    return ''
  }
})

const ariaLabel = computed(() => [props.promo.cta_label || t('promo.play'), props.promo.title, props.promo.badge, host.value].filter(Boolean).join(' · '))

// Butterflies with fixed, varied flight paths, so every viewer sees the same
// calm pattern rather than random clumps.
const flyers = [
  { size: 26, top: 16, dur: 26, delay: -4, dir: 1, bob: 3.3, flap: 0.32, tilt: 18 },
  { size: 17, top: 64, dur: 33, delay: -15, dir: 1, bob: 4.2, flap: 0.27, tilt: 24 },
  { size: 31, top: 40, dur: 29, delay: -22, dir: -1, bob: 3.8, flap: 0.36, tilt: 14 },
  { size: 14, top: 8, dur: 38, delay: -9, dir: -1, bob: 2.9, flap: 0.25, tilt: 28 },
  { size: 21, top: 76, dur: 24, delay: -18, dir: 1, bob: 3.5, flap: 0.3, tilt: 20 },
  { size: 15, top: 50, dur: 35, delay: -29, dir: 1, bob: 4.5, flap: 0.26, tilt: 26 },
].map((flyer, index) => ({
  ...flyer,
  style: {
    top: `${flyer.top}%`,
    width: `${flyer.size}px`,
    height: `${flyer.size}px`,
    animationDuration: `${flyer.dur}s`,
    animationDelay: `${flyer.delay}s`,
    // Where a butterfly rests when motion is reduced.
    '--rest-left': `${[14, 46, 62, 30, 78, 88][index]}%`,
  },
  bobStyle: { animationDuration: `${flyer.bob}s`, animationDelay: `${-flyer.bob * index * 0.37}s` },
  wingStyle: { animationDuration: `${flyer.flap}s`, '--tilt': `${flyer.tilt}deg` },
}))

if (props.promo.partner_style === 'card' && props.promo.partner_caption) {
  useHead({ link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap', key: 'promo-caveat' }] })
}

let observer: IntersectionObserver | null = null
let counted = false

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !root.value) return
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      offscreen.value = !entry.isIntersecting
      // An impression is the row being at least half visible once.
      if (!props.preview && !counted && entry.intersectionRatio >= 0.5) {
        counted = true
        recordPromotionEvent(props.promo.id, 'impression')
      }
    }
  }, { threshold: [0, 0.5] })
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())

const onClick = () => {
  if (!props.preview) recordPromotionEvent(props.promo.id, 'click')
}
</script>

<style scoped>
.promo {
  /* Same height as a poster row: a 2:3 poster plus its two-line caption. */
  --promo-height: calc(clamp(8.5rem, 10.5vw, 11rem) * 1.5 + 3rem);
  position: relative;
  display: block;
  height: var(--promo-height);
  overflow: hidden;
  border-radius: 0.9rem;
  isolation: isolate;
  color: #fff;
  container-type: inline-size;
  background: var(--promo-from);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.06), 0 18px 40px -24px color-mix(in srgb, var(--promo-accent) 55%, transparent);
  text-decoration: none;
  outline: none;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

a.promo:hover {
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.12), 0 22px 48px -22px color-mix(in srgb, var(--promo-accent) 75%, transparent);
}

a.promo:focus-visible {
  box-shadow: 0 0 0 2px #fff, 0 0 0 5px var(--promo-accent);
}

.promo__sky {
  position: absolute;
  inset: 0;
  z-index: -3;
  background:
    radial-gradient(120% 95% at 100% 105%, color-mix(in srgb, var(--promo-to) 80%, transparent) 0%, transparent 58%),
    radial-gradient(55% 75% at 74% 12%, color-mix(in srgb, var(--promo-accent) 20%, transparent) 0%, transparent 62%),
    linear-gradient(112deg, var(--promo-from) 0%, var(--promo-via) 56%, color-mix(in srgb, var(--promo-to) 62%, var(--promo-via)) 100%);
}

/* A few stars over the dusk sky of the lighthouse scene. */
.promo--scene .promo__sky::after {
  content: '';
  position: absolute;
  inset: 0 0 45% 0;
  background:
    radial-gradient(1.2px 1.2px at 12% 22%, #fff 99%, transparent),
    radial-gradient(1px 1px at 27% 64%, #fff 99%, transparent),
    radial-gradient(1.4px 1.4px at 39% 14%, #fff 99%, transparent),
    radial-gradient(1px 1px at 53% 38%, #fff 99%, transparent),
    radial-gradient(1.2px 1.2px at 66% 10%, #fff 99%, transparent),
    radial-gradient(1px 1px at 81% 30%, #fff 99%, transparent),
    radial-gradient(1.3px 1.3px at 92% 16%, #fff 99%, transparent);
  opacity: 0.55;
  animation: promo-twinkle 5.5s ease-in-out infinite alternate;
}

.promo__scene {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: -2;
  width: min(62%, 46rem);
  height: 78%;
  /* The beam reaches across the sky, past the scene's own box. */
  overflow: visible;
}

.promo__cliff {
  fill: color-mix(in srgb, var(--promo-from) 82%, #000);
  opacity: 0.9;
}

.promo__cliff--near {
  fill: color-mix(in srgb, var(--promo-from) 60%, #000);
  opacity: 1;
}

.promo__tower {
  fill: color-mix(in srgb, var(--promo-from) 70%, #000);
}

.promo__tower .promo__lantern {
  fill: #ffe9a8;
}

.promo__lamp {
  animation: promo-lamp 3.2s ease-in-out infinite alternate;
}

.promo__beam {
  transform-box: view-box;
  transform-origin: 371px 27px;
  mix-blend-mode: screen;
  animation: promo-sweep 11s ease-in-out infinite alternate;
}

.promo__grain {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.08;
  mix-blend-mode: overlay;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.promo,
.promo * {
  box-sizing: border-box;
}

.promo__body {
  position: relative;
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  /* Vertical sizes follow the row height, so the content always fits. */
  padding: calc(var(--promo-height) * 0.1) clamp(1.1rem, 4cqi, 2.75rem);
}

.promo__lead {
  display: flex;
  min-width: 0;
  max-width: 52%;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--promo-height) * 0.05);
}

.promo__logo {
  display: block;
  width: auto;
  max-width: 100%;
  height: calc(var(--promo-height) * 0.27);
  object-fit: contain;
  object-position: left center;
  user-select: none;
}

.promo__logo--white {
  filter: brightness(0) invert(1) drop-shadow(0 0 18px color-mix(in srgb, var(--promo-accent) 55%, transparent));
}

.promo__title {
  font-size: clamp(1.5rem, 4.5cqi, 3rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.promo__tagline {
  display: -webkit-box;
  max-width: 34rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: rgb(244 244 245 / 0.86);
  font-size: clamp(0.85rem, calc(var(--promo-height) * 0.058), 1.05rem);
  line-height: 1.4;
  text-shadow: 0 1px 12px rgb(0 0 0 / 0.45);
}

.promo__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.promo__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  background: #fff;
  padding: 0.5rem 1.05rem 0.5rem 0.8rem;
  color: #0b0b10;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 8px 24px -10px color-mix(in srgb, var(--promo-accent) 80%, transparent);
  transition: transform 0.2s ease, background 0.2s ease;
}

.promo__cta svg {
  width: 1.05rem;
  height: 1.05rem;
}

a.promo:hover .promo__cta {
  transform: translateY(-1px);
  background: color-mix(in srgb, #fff 88%, var(--promo-accent));
}

.promo__badge {
  border: 1px solid color-mix(in srgb, var(--promo-accent) 70%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--promo-accent) 14%, transparent);
  padding: 0.22rem 0.6rem;
  color: color-mix(in srgb, var(--promo-accent) 70%, #fff);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.promo__host {
  color: rgb(228 228 231 / 0.62);
  font-size: 0.75rem;
}

.promo__partner {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  margin-right: clamp(0rem, 9cqi, 9rem);
}

.promo__polaroid {
  --photo-height: calc(var(--promo-height) * 0.34);
  position: relative;
  width: min(calc(var(--photo-height) * 2.8 + 1.4rem), 40cqi);
  margin: 0;
  border-radius: 3px;
  background: linear-gradient(180deg, #fdfcf8, #f3f0e7);
  padding: 0.7rem 0.7rem 0;
  box-shadow: 0 22px 40px -14px rgb(0 0 0 / 0.65), 0 2px 6px rgb(0 0 0 / 0.25);
  transform: rotate(-4deg);
  transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

a.promo:hover .promo__polaroid {
  transform: rotate(-1.5deg) translateY(-4px);
}

.promo__tape {
  position: absolute;
  top: -0.7rem;
  left: 50%;
  width: 5.5rem;
  height: 1.45rem;
  transform: translateX(-50%) rotate(3deg);
  background: rgb(255 255 255 / 0.5);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
  backdrop-filter: blur(2px);
}

.promo__photo {
  display: flex;
  aspect-ratio: 2.8 / 1;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(120% 140% at 30% 0%, #ffffff 0%, #eef0f6 70%),
    #f4f5f9;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06);
  padding: 0.75rem 1rem;
}

.promo__photo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.promo__polaroid figcaption {
  padding: 0.35rem 0.25rem 0.45rem;
  color: #2c2a35;
  overflow: hidden;
  font-family: 'Caveat', 'Segoe Print', 'Bradley Hand', cursive;
  font-size: calc(var(--promo-height) * 0.078);
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.promo__polaroid:not(:has(figcaption)) {
  padding-bottom: 1.6rem;
}

.promo__partner-logo {
  width: clamp(10rem, 28cqi, 22rem);
  max-height: calc(var(--promo-height) * 0.45);
  object-fit: contain;
}

/* Butterflies */
.promo__sprites {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.promo__flyer {
  position: absolute;
  left: 0;
  animation: promo-fly-ltr linear infinite;
  will-change: left;
}

.promo__flyer--rtl {
  animation-name: promo-fly-rtl;
}

.promo__bob {
  display: block;
  width: 100%;
  height: 100%;
  animation: promo-bob ease-in-out infinite alternate;
}

.promo__flyer--rtl .promo__bob {
  scale: -1 1;
}

.promo__wing {
  display: block;
  width: 100%;
  height: 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  rotate: var(--tilt, 18deg);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--promo-accent) 70%, transparent));
  animation: promo-flap ease-in-out infinite alternate;
}

.promo__rester {
  position: absolute;
  top: -1.05rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  rotate: 16deg;
}

.promo__wing--rest {
  rotate: 0deg;
  animation: promo-rest 4.6s ease-in-out infinite;
}

.promo.is-offscreen *,
.promo.is-offscreen *::after {
  animation-play-state: paused !important;
}

@keyframes promo-fly-ltr {
  from { left: -8%; }
  to { left: 106%; }
}

@keyframes promo-fly-rtl {
  from { left: 106%; }
  to { left: -8%; }
}

@keyframes promo-bob {
  from { transform: translateY(-14px) rotate(-7deg); }
  to { transform: translateY(14px) rotate(6deg); }
}

@keyframes promo-flap {
  from { transform: scaleX(1); }
  to { transform: scaleX(0.28); }
}

@keyframes promo-rest {
  0%, 62%, 100% { transform: scaleX(1); }
  70% { transform: scaleX(0.38); }
  78% { transform: scaleX(1); }
  86% { transform: scaleX(0.55); }
  92% { transform: scaleX(1); }
}

@keyframes promo-sweep {
  from { transform: rotate(-16deg); opacity: 0.55; }
  50% { opacity: 0.95; }
  to { transform: rotate(9deg); opacity: 0.6; }
}

@keyframes promo-lamp {
  from { opacity: 0.65; }
  to { opacity: 1; }
}

@keyframes promo-twinkle {
  from { opacity: 0.35; }
  to { opacity: 0.7; }
}

/* Phones and narrow columns: the card tucks into the lower right corner. */
@container (max-width: 640px) {
  .promo__body {
    align-items: flex-start;
  }

  .promo__lead {
    max-width: 100%;
  }

  .promo__logo {
    height: calc(var(--promo-height) * 0.17);
  }

  .promo__tagline {
    display: none;
  }

  .promo__host {
    display: none;
  }

  .promo__partner {
    position: absolute;
    right: 0.9rem;
    bottom: 0.9rem;
    margin: 0;
  }

  .promo__polaroid {
    --photo-height: calc(var(--promo-height) * 0.2);
    width: min(calc(var(--photo-height) * 2.8 + 0.9rem), 56cqi);
    padding: 0.45rem 0.45rem 0;
    transform: rotate(-6deg);
  }

  .promo__polaroid figcaption {
    padding: 0.2rem 0.2rem 0.3rem;
    font-size: calc(var(--promo-height) * 0.052);
  }

  .promo__photo {
    padding: 0.45rem 0.6rem;
  }

  .promo__tape {
    width: 3.6rem;
    height: 1rem;
    top: -0.5rem;
  }

  .promo__scene {
    width: 100%;
    height: 62%;
    opacity: 0.75;
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo *,
  .promo *::after {
    animation: none !important;
  }

  .promo__flyer {
    left: var(--rest-left);
  }

  .promo__flyer:nth-child(n + 4) {
    display: none;
  }

  .promo__beam {
    transform: rotate(-6deg);
  }
}
</style>
