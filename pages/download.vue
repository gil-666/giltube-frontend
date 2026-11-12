<template>
  <div class="dl-page">
    <!-- Hero -->
    <section class="dl-hero">
      <div class="dl-hero__glow" aria-hidden="true" />
      <div class="dl-hero__text">
        <span class="dl-eyebrow">{{ t('getApp.eyebrow') }}</span>
        <h1 class="dl-title">{{ t('getApp.title') }}</h1>
        <p class="dl-lead">{{ t('getApp.lead') }}</p>
        <div class="dl-hero__ctas">
          <a href="#windows" class="dl-btn dl-btn--light" @click.prevent="scrollTo('windows')">
            <WindowsIcon class="h-4 w-4" />
            {{ t('getApp.windows') }}
          </a>
          <a href="#android" class="dl-btn" @click.prevent="scrollTo('android')">
            <AndroidIcon class="h-4 w-4" />
            {{ t('getApp.android') }}
          </a>
        </div>
      </div>

      <!-- Devices -->
      <div class="dl-devices" aria-hidden="true">
        <div class="dl-window">
          <div class="dl-window__bar">
            <img src="/icon-192.png" alt="" class="h-3.5 w-3.5 rounded-[4px]">
            <span class="dl-window__nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="opacity-40"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
            <span class="dl-window__title">GilTube</span>
            <span class="dl-window__controls"><i /><i /><i /></span>
          </div>
          <img src="/giltube-desktop.png" alt="" class="dl-window__shot" loading="eager">
        </div>
        <div class="dl-phone">
          <div class="dl-phone__notch" />
          <img src="/giltube-mobile.png" alt="" class="dl-phone__shot">
        </div>
      </div>
    </section>

    <!-- Platforms -->
    <section class="dl-grid">
      <!-- Windows -->
      <article id="windows" class="dl-card">
        <div class="dl-card__head">
          <span class="dl-card__icon dl-card__icon--windows"><WindowsIcon class="h-6 w-6" /></span>
          <div>
            <h2 class="dl-card__title">{{ t('getApp.windowsTitle') }}</h2>
            <p class="dl-card__meta">
              <template v-if="desktop">{{ t('getApp.version', { version: desktop.version }) }}<template v-if="desktop.size"> · {{ formatSize(desktop.size) }}</template> · Windows 10/11</template>
              <template v-else>Windows 10/11 · 64-bit</template>
            </p>
          </div>
        </div>

        <ul class="dl-features">
          <li v-for="feature in windowsFeatures" :key="feature.key">
            <span class="dl-features__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="feature.icon" /></svg></span>
            <span>
              <strong>{{ t(`getApp.windowsFeatures.${feature.key}.title`) }}</strong>
              <span>{{ t(`getApp.windowsFeatures.${feature.key}.text`) }}</span>
            </span>
          </li>
        </ul>

        <div class="dl-card__foot">
          <div v-if="inDesktopApp" class="dl-note dl-note--ok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
            {{ t('getApp.usingDesktop') }}
          </div>
          <template v-else>
            <a
              :href="desktop?.url || '#'"
              class="dl-btn dl-btn--primary dl-btn--lg"
              :class="{ 'pointer-events-none opacity-50': !desktop }"
              :aria-disabled="!desktop"
              download
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              {{ t('getApp.downloadWindows') }}
            </a>
            <p class="dl-fineprint">{{ t('getApp.smartScreen') }}</p>
          </template>
        </div>
      </article>

      <!-- Android -->
      <article id="android" class="dl-card">
        <div class="dl-card__head">
          <span class="dl-card__icon dl-card__icon--android"><AndroidIcon class="h-6 w-6" /></span>
          <div class="min-w-0 flex-1">
            <h2 class="dl-card__title">
              {{ t('getApp.androidTitle') }}
              <span class="dl-pill">{{ t('getApp.earlyAccess') }}</span>
            </h2>
            <p class="dl-card__meta">{{ t('getApp.androidMeta') }}</p>
          </div>
        </div>

        <!-- Progress through early access -->
        <ol class="dl-steps" :aria-label="t('getApp.stepsLabel')">
          <li v-for="(step, index) in steps" :key="step" :class="stepClass(index)">
            <span class="dl-steps__dot">
              <svg v-if="index < currentStep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12 4 4 8-8" /></svg>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span class="dl-steps__label">{{ t(`getApp.steps.${step}`) }}</span>
          </li>
        </ol>

        <div class="dl-card__body">
          <Transition name="dl-swap" mode="out-in">
            <!-- Loading -->
            <div v-if="loading" key="loading" class="space-y-3" aria-hidden="true">
              <div class="h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
              <div class="h-12 animate-pulse rounded-full bg-white/[0.05]" />
            </div>

            <!-- 1. Join -->
            <form v-else-if="state === 'none' || state === 'failed'" key="join" class="dl-join" @submit.prevent="join">
              <p class="dl-body">{{ t('getApp.joinText') }}</p>
              <p v-if="state === 'failed'" class="dl-error">{{ t('getApp.failed') }}</p>
              <div class="dl-field" :class="{ 'is-invalid': formError }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 shrink-0 text-zinc-500"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                <input
                  v-model="email"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  required
                  :placeholder="t('getApp.emailPlaceholder')"
                  :aria-label="t('getApp.emailLabel')"
                  :disabled="submitting"
                >
                <button type="submit" class="dl-btn dl-btn--primary" :disabled="submitting || !email.trim()">
                  <span v-if="submitting" class="dl-spinner" aria-hidden="true" />
                  {{ t('getApp.join') }}
                </button>
              </div>
              <p v-if="formError" class="dl-error">{{ formError }}</p>
              <p class="dl-fineprint">{{ t('getApp.joinFineprint') }}</p>
            </form>

            <!-- 2. Being added -->
            <div v-else-if="state === 'pending'" key="pending" class="dl-status">
              <span class="dl-status__icon dl-status__icon--busy"><span class="dl-spinner dl-spinner--lg" /></span>
              <div>
                <p class="dl-status__title">{{ t('getApp.pendingTitle') }}</p>
                <p class="dl-body">{{ t('getApp.pendingText', { email: access?.email || '' }) }}</p>
              </div>
            </div>

            <!-- 3. Accept the invite -->
            <div v-else-if="state === 'added'" key="added" class="dl-status dl-status--stack">
              <div class="flex items-start gap-4">
                <span class="dl-status__icon dl-status__icon--brand">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v8H4v-8" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" /></svg>
                </span>
                <div>
                  <p class="dl-status__title">{{ t('getApp.addedTitle') }}</p>
                  <p class="dl-body">{{ t('getApp.addedText', { email: access?.email || '' }) }}</p>
                </div>
              </div>
              <a :href="access?.accept_url" target="_blank" rel="noopener" class="dl-btn dl-btn--primary dl-btn--lg" @click="watchAcceptance">
                {{ t('getApp.acceptInvite') }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
              </a>
              <p class="dl-fineprint">{{ t('getApp.acceptFineprint') }}</p>
            </div>

            <!-- 4. Install -->
            <div v-else key="install" class="dl-status dl-status--stack">
              <div class="flex items-start gap-4">
                <span class="dl-status__icon dl-status__icon--ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12 4 4 8-8" /></svg>
                </span>
                <div>
                  <p class="dl-status__title">{{ state === 'installed' ? t('getApp.installedTitle') : t('getApp.acceptedTitle') }}</p>
                  <p class="dl-body">{{ state === 'installed' ? t('getApp.installedText') : t('getApp.acceptedText') }}</p>
                </div>
              </div>
              <a :href="storeURL" target="_blank" rel="noopener" class="dl-play">
                <svg viewBox="0 0 24 24" class="h-7 w-7" aria-hidden="true">
                  <path fill="#00d7fe" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.7-.6-1.2V3.5c0-.5.2-1 .6-1.2z" />
                  <path fill="#ffce00" d="m16.8 8.6-3.4 3.4 3.4 3.4 3.8-2.2c.9-.5.9-1.9 0-2.4z" />
                  <path fill="#ff3a44" d="M13.4 12 3.6 21.7c.4.2.9.2 1.4-.1l11.8-6.2z" />
                  <path fill="#00f076" d="M13.4 12 16.8 8.6 5 2.4c-.5-.3-1-.3-1.4-.1z" />
                </svg>
                <span class="flex flex-col leading-tight">
                  <span class="text-[11px] font-medium uppercase tracking-wider opacity-70">{{ t('getApp.getItOn') }}</span>
                  <span class="text-lg font-semibold">Google Play</span>
                </span>
              </a>
            </div>
          </Transition>
        </div>
      </article>
    </section>

    <!-- Questions -->
    <section class="dl-faq">
      <h2 class="dl-faq__title">{{ t('getApp.faqTitle') }}</h2>
      <details v-for="item in faq" :key="item" class="dl-faq__item">
        <summary>
          {{ t(`getApp.faq.${item}.q`) }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0"><path d="m6 9 6 6 6-6" /></svg>
        </summary>
        <p>{{ t(`getApp.faq.${item}.a`) }}</p>
      </details>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getDesktopRelease, type DesktopRelease } from '~/app/service/apps'
import { useAndroidAccess } from '~/app/composables/useAndroidAccess'
import { useDesktopApp } from '~/app/composables/useDesktopApp'

const { t } = useI18n()
useHead({ title: () => `${t('getApp.metaTitle')} - GilTube` })

const WindowsIcon = defineComponent({
  setup: () => () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }, [
    h('path', { d: 'M3 5.1 10.4 4v7.1H3zM11.4 3.9 21 2.5v8.6h-9.6zM3 12.1h7.4v7.1L3 18.1zM11.4 12.1H21v8.6l-9.6-1.4z' }),
  ]),
})
const AndroidIcon = defineComponent({
  setup: () => () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }, [
    h('path', { d: 'M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.5 11.5 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25A1.25 1.25 0 1 1 8.25 14 1.25 1.25 0 0 1 7 15.25zm10 0A1.25 1.25 0 1 1 18.25 14 1.25 1.25 0 0 1 17 15.25z' }),
  ]),
})

const windowsFeatures = [
  { key: 'offline', icon: 'M12 3.75v11.25m0 0 4.5-4.5M12 15l-4.5-4.5M4.5 19.5h15' },
  { key: 'updates', icon: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6' },
  { key: 'native', icon: 'M3 5h18v12H3zM8 21h8M12 17v4' },
  { key: 'theme', icon: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8zM7.5 12.5h.01M9.5 8.5h.01M14.5 8.5h.01' },
]
const steps = ['join', 'added', 'accept', 'install'] as const
const faq = ['why', 'email', 'accept', 'windows'] as const

// Windows
const desktop = ref<DesktopRelease | null>(null)
const { hasDesktopDownloads } = useDesktopApp()
const inDesktopApp = computed(() => hasDesktopDownloads.value)

const formatSize = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`

// Android
const { access, loading, state, storeURL, refresh, signup } = useAndroidAccess()
const email = ref('')
const submitting = ref(false)
const formError = ref('')

const currentStep = computed(() => {
  switch (state.value) {
    case 'pending': return 1
    case 'added': return 2
    case 'accepted': return 3
    case 'installed': return 4
    default: return 0
  }
})
const stepClass = (index: number) => ({
  'is-done': index < currentStep.value,
  'is-current': index === currentStep.value,
})

const join = async () => {
  formError.value = ''
  submitting.value = true
  try {
    await signup(email.value.trim())
  } catch (error: any) {
    const code = error?.response?.data?.error
    formError.value = code === 'invalid_email'
      ? t('getApp.invalidEmail')
      : code === 'too_many_requests' ? t('getApp.tooMany') : t('getApp.genericError')
  } finally {
    submitting.value = false
  }
}

// While waiting on the server (being added) or on the person (accepting in
// another tab), check back now and then, and when they return to this tab.
let timer: ReturnType<typeof setInterval> | undefined
const poll = () => {
  clearInterval(timer)
  if (state.value === 'pending' || state.value === 'added') {
    timer = setInterval(() => void refresh(), state.value === 'pending' ? 4000 : 6000)
  }
}
const watchAcceptance = () => setTimeout(() => void refresh(), 1500)
const onVisible = () => {
  if (document.visibilityState === 'visible') void refresh()
}
watch(state, poll)

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisible)
  void getDesktopRelease().then((release) => { desktop.value = release })
  await refresh()
  poll()
  if (location.hash === '#android' || location.hash === '#windows') setTimeout(() => scrollTo(location.hash.slice(1)), 150)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<style scoped>
.dl-page {
  min-height: 100vh;
  overflow-x: hidden;
  padding: 0 1rem 5rem;
  color: rgb(var(--gt-zinc-100));
}

@media (min-width: 768px) {
  .dl-page { padding: 0 2rem 6rem; }
}

/* Hero */
.dl-hero {
  position: relative;
  display: grid;
  max-width: 76rem;
  margin: 0 auto;
  padding: 3rem 0 2rem;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 1100px) {
  .dl-hero { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); padding: 4.5rem 0 3rem; }
}

.dl-hero__glow {
  position: absolute;
  inset: -6rem -20% auto;
  height: 32rem;
  z-index: -1;
  background:
    radial-gradient(40% 50% at 70% 40%, rgb(var(--gt-primary) / 0.22), transparent 70%),
    radial-gradient(30% 40% at 20% 20%, rgb(var(--gt-accent) / 0.12), transparent 70%);
  filter: blur(10px);
  pointer-events: none;
}

.dl-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  background: rgb(var(--gt-primary) / 0.12);
  padding: 0.25rem 0.75rem;
  color: rgb(var(--gt-primary-300));
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dl-title {
  margin: 1rem 0 0;
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg, rgb(var(--gt-white)), rgb(var(--gt-zinc-300)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.dl-lead {
  max-width: 32rem;
  margin: 1.25rem 0 0;
  color: rgb(var(--gt-zinc-400));
  font-size: 1.125rem;
  line-height: 1.6;
}

.dl-hero__ctas { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }

/* Devices */
.dl-devices { position: relative; padding: 0 2.5rem 2rem 0; animation: dl-rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }

.dl-window {
  overflow: hidden;
  border: 1px solid rgb(var(--gt-white) / 0.1);
  border-radius: 0.875rem;
  background: rgb(var(--gt-zinc-950));
  box-shadow: 0 40px 100px -30px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(0 0 0 / 0.4);
  transform: perspective(1800px) rotateY(-6deg) rotateX(2deg);
  transform-origin: left center;
}

.dl-window__bar {
  display: flex;
  height: 1.75rem;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.6rem;
  border-bottom: 1px solid rgb(var(--gt-white) / 0.05);
  color: rgb(var(--gt-zinc-400));
}

.dl-window__nav { display: flex; gap: 0.35rem; }
.dl-window__nav svg { height: 0.7rem; width: 0.7rem; }
.dl-window__title { flex: 1; text-align: center; font-size: 0.6rem; font-weight: 500; }
.dl-window__controls { display: flex; gap: 0.9rem; padding-right: 0.25rem; }
.dl-window__controls i { display: block; width: 0.5rem; height: 1px; background: currentColor; }
.dl-window__controls i:nth-child(2) { height: 0.45rem; border: 1px solid currentColor; background: none; }
.dl-window__controls i:nth-child(3) { height: 0.5rem; background: linear-gradient(45deg, transparent 45%, currentColor 45% 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, currentColor 45% 55%, transparent 55%); }
.dl-window__shot { display: block; width: 100%; aspect-ratio: 2049 / 1101; object-fit: cover; }

.dl-phone {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 26%;
  min-width: 7rem;
  overflow: hidden;
  border: 0.35rem solid rgb(var(--gt-zinc-800));
  border-radius: 1.6rem;
  background: rgb(var(--gt-zinc-950));
  box-shadow: 0 30px 60px -20px rgb(0 0 0 / 0.9), 0 0 0 1px rgb(var(--gt-white) / 0.08);
  animation: dl-float 6s ease-in-out infinite;
}

.dl-phone__notch {
  position: absolute;
  top: 0.4rem;
  left: 50%;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #000;
  transform: translateX(-50%);
}

.dl-phone__shot { display: block; width: 100%; aspect-ratio: 760 / 1500; object-fit: cover; object-position: top; }

@keyframes dl-float { 50% { transform: translateY(-8px); } }
@keyframes dl-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }

/* Buttons */
.dl-btn {
  display: inline-flex;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 999px;
  background: rgb(var(--gt-white) / 0.08);
  padding: 0 1.25rem;
  color: rgb(var(--gt-zinc-100));
  font-size: 0.9375rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 150ms ease, transform 150ms ease, box-shadow 200ms ease;
}

.dl-btn:hover { background: rgb(var(--gt-white) / 0.14); }
.dl-btn:active { transform: scale(0.97); }
.dl-btn:disabled { cursor: not-allowed; opacity: 0.5; }
.dl-btn--light { background: rgb(var(--gt-zinc-100)); color: rgb(var(--gt-zinc-950)); }
.dl-btn--light:hover { background: rgb(var(--gt-white)); }
.dl-btn--primary { background: rgb(var(--gt-primary-600)); color: rgb(var(--gt-on-primary)); box-shadow: 0 10px 30px -10px rgb(var(--gt-primary) / 0.6); }
.dl-btn--primary:hover:not(:disabled) { background: rgb(var(--gt-primary-500)); box-shadow: 0 14px 34px -10px rgb(var(--gt-primary) / 0.75); }
.dl-btn--lg { height: 3.25rem; width: 100%; font-size: 1rem; }

/* Cards */
.dl-grid {
  display: grid;
  max-width: 76rem;
  margin: 1rem auto 0;
  gap: 1.25rem;
}

@media (min-width: 900px) {
  .dl-grid { grid-template-columns: 1fr 1fr; }
}

.dl-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scroll-margin-top: 6rem;
  border: 1px solid rgb(var(--gt-white) / 0.07);
  border-radius: 1.5rem;
  background: linear-gradient(180deg, rgb(var(--gt-zinc-900) / 0.9), rgb(var(--gt-zinc-900) / 0.5));
  padding: 1.75rem;
  animation: dl-rise 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.dl-card + .dl-card { animation-delay: 80ms; }

.dl-card__head { display: flex; align-items: center; gap: 1rem; }

.dl-card__icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 0.875rem;
}

.dl-card__icon--windows { background: linear-gradient(135deg, rgb(56 189 248 / 0.25), rgb(37 99 235 / 0.25)); color: #7dd3fc; }
.dl-card__icon--android { background: linear-gradient(135deg, rgb(74 222 128 / 0.22), rgb(22 163 74 / 0.22)); color: #86efac; }

.dl-card__title { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; }
.dl-card__meta { margin: 0.125rem 0 0; color: rgb(var(--gt-zinc-400)); font-size: 0.875rem; }
.dl-card__foot { margin-top: auto; display: flex; flex-direction: column; gap: 0.75rem; }
.dl-card__body { margin-top: auto; min-height: 9.5rem; }

.dl-pill {
  border-radius: 999px;
  background: rgb(74 222 128 / 0.12);
  padding: 0.125rem 0.6rem;
  color: #86efac;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dl-features { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }

@media (min-width: 640px) {
  .dl-features { grid-template-columns: 1fr 1fr; }
}

.dl-features li { display: flex; gap: 0.75rem; font-size: 0.875rem; }
.dl-features li > span:last-child { display: flex; flex-direction: column; color: rgb(var(--gt-zinc-400)); line-height: 1.45; }
.dl-features strong { color: rgb(var(--gt-zinc-100)); font-weight: 600; }
.dl-features__icon { display: grid; width: 2rem; height: 2rem; flex-shrink: 0; place-items: center; border-radius: 0.625rem; background: rgb(var(--gt-white) / 0.05); color: rgb(var(--gt-zinc-200)); }
.dl-features__icon svg { width: 1.1rem; height: 1.1rem; }

.dl-fineprint { margin: 0; color: rgb(var(--gt-zinc-500)); font-size: 0.75rem; line-height: 1.5; }
.dl-body { margin: 0; color: rgb(var(--gt-zinc-400)); font-size: 0.9375rem; line-height: 1.55; }
.dl-error { margin: 0; color: rgb(var(--gt-red-300)); font-size: 0.875rem; }

.dl-note { display: flex; align-items: center; gap: 0.5rem; border-radius: 0.875rem; background: rgb(var(--gt-white) / 0.05); padding: 0.875rem 1rem; color: rgb(var(--gt-zinc-200)); font-size: 0.875rem; }
.dl-note--ok { background: rgb(74 222 128 / 0.08); color: #bbf7d0; }

/* Steps */
.dl-steps { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0; padding: 0; list-style: none; counter-reset: step; }
.dl-steps li { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; text-align: center; }
.dl-steps li + li::before {
  content: '';
  position: absolute;
  top: 0.8rem;
  right: 50%;
  width: 100%;
  height: 2px;
  margin-right: 0.95rem;
  background: rgb(var(--gt-white) / 0.08);
  z-index: 0;
  transition: background-color 400ms ease;
}
.dl-steps li.is-done + li::before, .dl-steps li.is-done + li.is-current::before { background: rgb(var(--gt-primary) / 0.7); }
.dl-steps__dot {
  position: relative;
  z-index: 1;
  display: grid;
  width: 1.65rem;
  height: 1.65rem;
  place-items: center;
  border-radius: 50%;
  background: rgb(var(--gt-zinc-800));
  color: rgb(var(--gt-zinc-400));
  font-size: 0.75rem;
  font-weight: 700;
  transition: background-color 300ms ease, color 300ms ease, box-shadow 300ms ease;
}
.dl-steps__dot svg { width: 0.85rem; height: 0.85rem; }
.dl-steps li.is-done .dl-steps__dot { background: rgb(var(--gt-primary-600)); color: rgb(var(--gt-on-primary)); }
.dl-steps li.is-current .dl-steps__dot { background: rgb(var(--gt-zinc-100)); color: rgb(var(--gt-zinc-950)); box-shadow: 0 0 0 4px rgb(var(--gt-white) / 0.1); }
.dl-steps__label { color: rgb(var(--gt-zinc-500)); font-size: 0.75rem; font-weight: 500; }
.dl-steps li.is-current .dl-steps__label, .dl-steps li.is-done .dl-steps__label { color: rgb(var(--gt-zinc-200)); }

/* Join form */
.dl-join { display: flex; flex-direction: column; gap: 0.875rem; }
.dl-field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid rgb(var(--gt-white) / 0.1);
  border-radius: 999px;
  background: rgb(var(--gt-zinc-950) / 0.6);
  padding: 0.3rem 0.3rem 0.3rem 1rem;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.dl-field:focus-within { border-color: rgb(var(--gt-primary) / 0.6); box-shadow: 0 0 0 4px rgb(var(--gt-primary) / 0.15); }
.dl-field.is-invalid { border-color: rgb(var(--gt-red-400) / 0.6); }
.dl-field input { min-width: 0; flex: 1; border: 0; background: transparent; color: rgb(var(--gt-zinc-100)); font-size: 0.9375rem; outline: none; }
.dl-field input::placeholder { color: rgb(var(--gt-zinc-500)); }

@media (max-width: 480px) {
  .dl-field { flex-wrap: wrap; border-radius: 1.25rem; padding: 0.5rem; }
  .dl-field input { padding: 0.5rem; }
  .dl-field .dl-btn { width: 100%; }
}

/* Statuses */
.dl-status { display: flex; align-items: flex-start; gap: 1rem; }
.dl-status--stack { flex-direction: column; align-items: stretch; gap: 1.1rem; }
.dl-status__title { margin: 0 0 0.25rem; font-size: 1.0625rem; font-weight: 700; }
.dl-status__icon { display: grid; width: 2.75rem; height: 2.75rem; flex-shrink: 0; place-items: center; border-radius: 50%; }
.dl-status__icon svg { width: 1.3rem; height: 1.3rem; }
.dl-status__icon--busy { background: rgb(var(--gt-white) / 0.06); }
.dl-status__icon--brand { background: rgb(var(--gt-primary) / 0.15); color: rgb(var(--gt-primary-300)); animation: dl-pulse 2.4s ease-out infinite; }
.dl-status__icon--ok { background: rgb(74 222 128 / 0.14); color: #86efac; }
@keyframes dl-pulse { 0% { box-shadow: 0 0 0 0 rgb(var(--gt-primary) / 0.45); } 100% { box-shadow: 0 0 0 14px rgb(var(--gt-primary) / 0); } }

.dl-spinner { width: 1rem; height: 1rem; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: dl-spin 0.8s linear infinite; }
.dl-spinner--lg { width: 1.3rem; height: 1.3rem; color: rgb(var(--gt-zinc-300)); }
@keyframes dl-spin { to { transform: rotate(360deg); } }

.dl-play {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid rgb(var(--gt-white) / 0.2);
  border-radius: 0.875rem;
  background: #000;
  padding: 0.6rem 1.4rem 0.6rem 1rem;
  color: #fff;
  transition: transform 150ms ease, border-color 150ms ease, box-shadow 200ms ease;
}
.dl-play:hover { border-color: rgb(var(--gt-white) / 0.4); box-shadow: 0 12px 30px -12px rgb(0 0 0 / 0.9); transform: translateY(-1px); }

.dl-swap-enter-active, .dl-swap-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.dl-swap-enter-from { opacity: 0; transform: translateY(6px); }
.dl-swap-leave-to { opacity: 0; transform: translateY(-6px); }

/* FAQ */
.dl-faq { max-width: 48rem; margin: 4rem auto 0; }
.dl-faq__title { margin: 0 0 1rem; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; text-align: center; }
.dl-faq__item { border-bottom: 1px solid rgb(var(--gt-white) / 0.07); }
.dl-faq__item summary {
  display: flex;
  cursor: pointer;
  list-style: none;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 0.25rem;
  font-weight: 600;
}
.dl-faq__item summary::-webkit-details-marker { display: none; }
.dl-faq__item summary svg { color: rgb(var(--gt-zinc-500)); transition: transform 200ms ease; }
.dl-faq__item[open] summary svg { transform: rotate(180deg); }
.dl-faq__item p { margin: 0; padding: 0 0.25rem 1.2rem; color: rgb(var(--gt-zinc-400)); line-height: 1.6; }

@media (prefers-reduced-motion: reduce) {
  .dl-phone, .dl-devices, .dl-card, .dl-status__icon--brand { animation: none; }
}
</style>
