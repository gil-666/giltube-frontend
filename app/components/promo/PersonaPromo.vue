<template>
  <!-- Persona 3 Reload soundtrack promotion (scene "persona3"): a custom
       banner in the game's style with two real controls, so it is a section,
       not one big link. -->
  <section
    ref="root"
    class="p3"
    :class="{ 'is-offscreen': offscreen, 'is-preview': preview }"
    :aria-label="promo.title"
  >
    <div class="p3__water" aria-hidden="true">
      <span class="p3__caustics" />
      <span class="p3__caustics p3__caustics--slow" />
    </div>
    <div class="p3__slash" aria-hidden="true" />
    <span class="p3__watermark" aria-hidden="true">PERSONA3</span>
    <div class="p3__shards" aria-hidden="true">
      <span v-for="shard in shards" :key="shard.id" class="p3__shard" :style="shard.style" />
    </div>

    <div class="p3__body">
      <div class="p3__lead">
        <p v-if="promo.badge" class="p3__kicker"><span>{{ promo.badge }}</span></p>
        <h3 class="p3__title">{{ promo.title }}</h3>
        <p v-if="promo.tagline" class="p3__tagline">{{ promo.tagline }}</p>
        <div class="p3__actions">
          <component
            :is="listenPath ? NuxtLinkComponent : 'a'"
            v-bind="listenPath ? { to: listenPath } : { href: promo.url, target: '_blank', rel: 'noopener' }"
            class="p3__btn p3__btn--listen"
            :tabindex="preview ? -1 : undefined"
            @click="onListen"
          >
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
              {{ promo.cta_label || t('promo.persona.listen') }}
            </span>
          </component>
          <button
            type="button"
            class="p3__btn p3__btn--theme"
            :class="{ 'is-on': themeOn }"
            :disabled="applying || themeOn"
            :tabindex="preview ? -1 : undefined"
            :title="signedIn ? undefined : t('promo.persona.signInForTheme')"
            @click="applyTheme"
          >
            <span>
              <svg v-if="themeOn" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="currentColor" /></svg>
              {{ themeOn ? t('promo.persona.themeApplied') : applying ? t('promo.persona.applying') : t('promo.persona.applyTheme') }}
            </span>
          </button>
        </div>
        <p v-if="themeError" class="p3__error" role="status">{{ themeError }}</p>
      </div>

      <div class="p3__art" aria-hidden="true">
        <span class="p3__record"><span class="p3__record-label" /></span>
        <img v-if="promo.partner_url" :src="resolveMediaUrl(promo.partner_url)" alt="" class="p3__cover" draggable="false">
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, resolveComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { useSiteTheme } from '~/app/composables/useSiteTheme'
import { recordPromotionEvent, type Promotion } from '~/app/service/promotions'
import { getSharedTheme, type ThemeRecord } from '~/app/service/themes'
import { resolveMediaUrl } from '~/app/utils/media'

// The built-in theme this banner applies (internal/api/builtin_themes.json).
const THEME_SHARE_CODE = 'GilTubePersona3Reload'

const props = withDefaults(defineProps<{ promo: Promotion, preview?: boolean }>(), { preview: false })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const requestURL = useRequestURL()
const siteTheme = useSiteTheme()
const NuxtLinkComponent = resolveComponent('NuxtLink')

const root = ref<HTMLElement | null>(null)
const offscreen = ref(false)
const applying = ref(false)
const themeError = ref('')
const themeRecord = ref<ThemeRecord | null>(null)
const signedIn = ref(false)

// GilTube links open in place; anything else in a new tab.
const listenPath = computed(() => {
  try {
    const target = new URL(props.promo.url)
    return target.host === requestURL.host ? `${target.pathname}${target.search}` : ''
  } catch {
    return ''
  }
})

const themeOn = computed(() => !!themeRecord.value && siteTheme.active.value.id === themeRecord.value.id)

// Glass fragments drifting through the water, at fixed spots so everyone
// sees the same picture.
const shards = [
  { left: 44, top: 12, size: 26, rot: 18, dur: 9, delay: -2, tone: 0.8 },
  { left: 56, top: 66, size: 18, rot: -24, dur: 11, delay: -6, tone: 0.55 },
  { left: 63, top: 20, size: 12, rot: 40, dur: 8, delay: -4, tone: 0.7 },
  { left: 90, top: 72, size: 22, rot: -10, dur: 12, delay: -8, tone: 0.6 },
  { left: 94, top: 14, size: 14, rot: 28, dur: 10, delay: -1, tone: 0.75 },
  { left: 37, top: 78, size: 10, rot: -36, dur: 7, delay: -3, tone: 0.5 },
].map((shard, id) => ({
  id,
  style: {
    left: `${shard.left}%`,
    top: `${shard.top}%`,
    width: `${shard.size}px`,
    height: `${shard.size * 1.35}px`,
    opacity: shard.tone,
    '--rot': `${shard.rot}deg`,
    animationDuration: `${shard.dur}s`,
    animationDelay: `${shard.delay}s`,
  },
}))

let observer: IntersectionObserver | null = null
let counted = false

onMounted(() => {
  signedIn.value = !!localStorage.getItem('user_id')
  getSharedTheme(THEME_SHARE_CODE).then(({ theme }) => { themeRecord.value = theme }).catch(() => {})
  if (typeof IntersectionObserver === 'undefined' || !root.value) return
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      offscreen.value = !entry.isIntersecting
      if (!props.preview && !counted && entry.intersectionRatio >= 0.5) {
        counted = true
        recordPromotionEvent(props.promo.id, 'impression')
      }
    }
  }, { threshold: [0, 0.5] })
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())

const onListen = (event: MouseEvent) => {
  if (props.preview) {
    event.preventDefault()
    return
  }
  recordPromotionEvent(props.promo.id, 'click')
}

const applyTheme = async () => {
  if (props.preview || themeOn.value) return
  themeError.value = ''
  if (!signedIn.value) {
    router.push(localePath(`/login?redirect=${encodeURIComponent(route.fullPath)}`))
    return
  }
  applying.value = true
  try {
    const record = themeRecord.value || (await getSharedTheme(THEME_SHARE_CODE)).theme
    themeRecord.value = record
    await siteTheme.apply(record)
    recordPromotionEvent(props.promo.id, 'click')
  } catch {
    themeError.value = t('promo.persona.themeFailed')
  } finally {
    applying.value = false
  }
}
</script>

<style scoped>
.p3 {
  --p3-sky: #10b1f5;
  --p3-red: #e2182d;
  --p3-ink: #04103a;
  --promo-height: calc(clamp(8.5rem, 10.5vw, 11rem) * 1.5 + 3rem);
  position: relative;
  height: var(--promo-height);
  overflow: hidden;
  isolation: isolate;
  border-radius: 0.9rem;
  color: #fff;
  container-type: inline-size;
  background: linear-gradient(160deg, #020414 0%, #011762 46%, #0a3fbf 100%);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.07), 0 18px 40px -22px rgb(16 177 245 / 0.6);
  text-shadow: none;
}

/* Light playing on water, drifting slowly. */
.p3__water {
  position: absolute;
  inset: 0;
  z-index: -4;
  overflow: hidden;
}

.p3__caustics {
  position: absolute;
  inset: -40%;
  background:
    radial-gradient(18% 9% at 20% 30%, rgb(120 220 255 / 0.32), transparent 70%),
    radial-gradient(14% 7% at 46% 18%, rgb(120 220 255 / 0.26), transparent 70%),
    radial-gradient(20% 8% at 70% 40%, rgb(120 220 255 / 0.22), transparent 70%),
    radial-gradient(12% 6% at 34% 62%, rgb(120 220 255 / 0.2), transparent 70%),
    radial-gradient(16% 7% at 82% 70%, rgb(120 220 255 / 0.24), transparent 70%);
  mix-blend-mode: screen;
  animation: p3-drift 14s ease-in-out infinite alternate;
}

.p3__caustics--slow {
  opacity: 0.7;
  transform: scaleX(-1);
  animation-duration: 21s;
  animation-direction: alternate-reverse;
}

/* The key art's sky blue, cut as a slanted band behind the album. */
.p3__slash {
  position: absolute;
  top: -10%;
  bottom: -10%;
  right: 6%;
  z-index: -3;
  width: 46%;
  background:
    linear-gradient(90deg, transparent 0 3%, rgb(255 255 255 / 0.85) 3% 4.2%, transparent 4.2%),
    linear-gradient(180deg, #4fd0ff 0%, var(--p3-sky) 55%, #0a7fd1 100%);
  clip-path: polygon(22% 0, 100% 0, 78% 100%, 0 100%);
  opacity: 0.92;
}

.p3__watermark {
  position: absolute;
  left: -0.04em;
  bottom: -0.28em;
  z-index: -2;
  color: transparent;
  font-size: clamp(5rem, 15cqw, 10rem);
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  -webkit-text-stroke: 2px rgb(255 255 255 / 0.12);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

.p3__shards {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.p3__shard {
  position: absolute;
  background: linear-gradient(135deg, #ffffff, #9fe6ff 60%, rgb(16 177 245 / 0.4));
  clip-path: polygon(50% 0, 100% 38%, 70% 100%, 0 70%);
  transform: rotate(var(--rot));
  animation: p3-shard ease-in-out infinite alternate;
}

.p3__body {
  position: relative;
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.4rem clamp(1.25rem, 3.5cqw, 2.75rem);
}

.p3__lead {
  display: flex;
  min-width: 0;
  max-width: 34rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
}

/* A red slanted tag, like the selected entry of the game's menu. */
.p3__kicker {
  margin: 0;
  padding: 0.22rem 0.85rem 0.2rem 0.7rem;
  background: var(--p3-red);
  box-shadow: 3px 3px 0 #000;
  transform: skewX(-14deg) rotate(-2deg);
}

.p3__kicker span {
  display: block;
  transform: skewX(14deg);
  font-size: 0.72rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.p3__title {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: clamp(1.45rem, 3.6cqw, 2.6rem);
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 0.98;
  text-transform: uppercase;
  text-shadow: 3px 3px 0 rgb(0 0 0 / 0.7);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  /* Italic glyphs lean past the clamp box. */
  padding-right: 0.15em;
}

.p3__tagline {
  display: -webkit-box;
  max-width: 30rem;
  margin: 0;
  overflow: hidden;
  color: #d6f2ff;
  font-size: clamp(0.8rem, 1.4cqw, 0.95rem);
  line-height: 1.4;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.8);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.p3__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 0.35rem;
}

/* Slanted buttons; the label is skewed back so the text stays upright. */
.p3__btn {
  display: inline-flex;
  min-height: 2.6rem;
  align-items: center;
  padding: 0 1.25rem;
  border: 0;
  cursor: pointer;
  font: inherit;
  text-decoration: none;
  transform: skewX(-14deg);
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1), filter 140ms ease, box-shadow 140ms ease;
}

.p3__btn > span {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transform: skewX(14deg);
  font-size: 0.86rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.p3__btn svg {
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
}

.p3__btn--listen {
  background: var(--p3-red);
  color: #fff;
  box-shadow: 4px 4px 0 #000;
  text-shadow: 2px 2px 0 rgb(0 0 0 / 0.7);
}

.p3__btn--theme {
  background: #fff;
  color: var(--p3-ink);
  box-shadow: inset 0 -0.22rem 0 var(--p3-red), 4px 4px 0 rgb(0 0 0 / 0.65);
}

.p3__btn:hover:not(:disabled) {
  transform: skewX(-14deg) translate(3px, -2px);
  filter: brightness(1.08);
}

.p3__btn:active:not(:disabled) {
  transform: skewX(-14deg) translate(1px, 1px);
  box-shadow: 1px 1px 0 #000;
}

.p3__btn:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.p3__btn--theme.is-on {
  background: var(--p3-sky);
  color: var(--p3-ink);
  cursor: default;
}

.p3__btn--theme:disabled:not(.is-on) {
  cursor: progress;
  opacity: 0.8;
}

.p3__error {
  margin: 0;
  color: #ffd2d6;
  font-size: 0.8rem;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
}

/* The album cover, tilted over a spinning record, with an armband-red block shadow. */
.p3__art {
  position: relative;
  flex-shrink: 0;
  width: min(15rem, 30cqw);
  aspect-ratio: 1;
  margin-right: min(5rem, 7cqw);
}

.p3__record {
  position: absolute;
  inset: 4% -34% 4% 30%;
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 0 18%, rgb(255 255 255 / 0.05) 18.5% 19%, transparent 19.5% 30%, rgb(255 255 255 / 0.05) 30.5% 31%, transparent 31.5% 44%, rgb(255 255 255 / 0.06) 44.5% 45%, transparent 45.5%),
    radial-gradient(circle, #1a1f2e 0%, #05060c 70%);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.55);
  animation: p3-spin 6s linear infinite;
}

.p3__record-label {
  position: absolute;
  inset: 34%;
  border-radius: 50%;
  background:
    radial-gradient(circle, #05060c 0 9%, transparent 10%),
    conic-gradient(from 20deg, var(--p3-red) 0 50%, #ffffff 50% 52%, var(--p3-red) 52%);
}

.p3__cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 12px 12px 0 var(--p3-red), 0 22px 40px rgb(0 0 0 / 0.55);
  transform: rotate(-6deg);
}

/* Narrow banners: smaller art in the corner, text takes the width. */
@container (max-width: 560px) {
  .p3__body {
    padding: 1.1rem 1rem;
  }

  .p3__lead {
    max-width: 72%;
  }

  .p3__tagline {
    -webkit-line-clamp: 3;
  }

  .p3__art {
    position: absolute;
    right: 1.6rem;
    bottom: 0.9rem;
    width: 26%;
    margin: 0;
  }

  .p3__slash {
    width: 58%;
    right: -6%;
  }

  .p3__btn {
    min-height: 2.35rem;
    padding: 0 0.9rem;
  }

  .p3__btn > span {
    font-size: 0.74rem;
  }

  .p3__actions {
    gap: 0.6rem;
  }
}

.is-offscreen .p3__caustics,
.is-offscreen .p3__shard,
.is-offscreen .p3__record {
  animation-play-state: paused;
}

@keyframes p3-drift {
  from { transform: translate3d(-4%, -2%, 0) rotate(-2deg); }
  to { transform: translate3d(4%, 3%, 0) rotate(2deg); }
}

@keyframes p3-shard {
  from { transform: translateY(-6px) rotate(var(--rot)); }
  to { transform: translateY(8px) rotate(calc(var(--rot) + 24deg)); }
}

@keyframes p3-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .p3__caustics,
  .p3__shard,
  .p3__record {
    animation: none;
  }

  .p3__btn {
    transition: none;
  }
}
</style>
