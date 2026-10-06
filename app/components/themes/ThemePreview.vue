<template>
  <!-- Scoping the theme variables on this element makes every Tailwind color
       (and corner radius / font) inside render in that theme, independent of
       the theme the site uses. -->
  <div
    class="theme-preview relative overflow-hidden rounded-lg border border-white/[0.08] text-white"
    :style="scopedStyle"
    aria-hidden="true"
  >
    <div v-if="image" class="theme-preview__image" :style="imageStyle" />
    <div class="relative flex items-center gap-1.5 border-b border-white/[0.06] bg-zinc-950/70 px-2.5 py-2">
      <span class="h-2.5 w-5 rounded-sm bg-primary-600" />
      <span class="h-2 flex-1 rounded-full bg-zinc-900 ring-1 ring-white/[0.08]" />
      <span class="h-2.5 w-2.5 rounded-full bg-zinc-700" />
    </div>
    <div class="relative flex gap-2 p-2.5" :class="compact ? 'h-[4.5rem]' : 'h-32'">
      <div class="hidden w-1/5 shrink-0 flex-col gap-1.5 sm:flex">
        <span class="text-[9px] font-semibold leading-3">Aa</span>
        <span class="h-1.5 w-4/5 rounded bg-zinc-700" />
        <span class="h-1.5 w-3/5 rounded bg-zinc-700" />
        <span class="h-1.5 w-2/3 rounded bg-zinc-800" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="grid flex-1 grid-cols-3 gap-1.5">
          <span class="rounded-md bg-zinc-800" />
          <span class="relative rounded-md bg-zinc-800">
            <span class="absolute inset-x-0 bottom-0 h-0.5 w-2/3 rounded-full bg-primary-600" />
          </span>
          <span class="rounded-md bg-zinc-800" />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="rounded-full bg-primary-600 px-2 py-0.5 text-[9px] font-semibold leading-3 text-on-primary">Aa</span>
          <span class="rounded-full bg-accent-600 px-2 py-0.5 text-[9px] font-semibold leading-3 text-on-accent">Aa</span>
          <span class="h-1.5 flex-1 rounded bg-zinc-700" />
        </div>
      </div>
    </div>
    <span v-if="look.style.effect !== 'none'" class="absolute bottom-1 right-1.5 text-[9px] leading-3 opacity-70">✦</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DEFAULT_THEME_STYLE,
  backgroundThumbnail,
  buildStyleVariables,
  buildThemeVariables,
  safeBackgroundImage,
  themeScheme,
  type ThemeAppearance,
  type ThemeColors,
} from '~/app/utils/theme'

const props = withDefaults(defineProps<{ colors: ThemeColors | ThemeAppearance, compact?: boolean }>(), { compact: false })

const look = computed<ThemeAppearance>(() => ({
  style: DEFAULT_THEME_STYLE,
  backgroundImage: '',
  ...props.colors,
}))

const image = computed(() => {
  const url = safeBackgroundImage(look.value.backgroundImage, true)
  return url ? backgroundThumbnail(url) : ''
})

const scopedStyle = computed(() => {
  const styleVars = buildStyleVariables(look.value)
  return {
    ...buildThemeVariables(look.value),
    ...(styleVars['--gt-radius-scale'] ? { '--gt-radius-scale': styleVars['--gt-radius-scale'] } : {}),
    fontFamily: `${styleVars['--gt-font'] || "'Inter'"}, Inter, ui-sans-serif, system-ui, sans-serif`,
    background: styleVars['--gt-backdrop'] || look.value.background,
    colorScheme: themeScheme(look.value.background),
  }
})

// Same 40% strength as the site; blur scaled down to the card's size.
const imageStyle = computed(() => ({
  backgroundImage: `url("${image.value}")`,
  backgroundSize: look.value.style.background_fit === 'tile' ? '64px auto' : 'cover',
  backgroundRepeat: look.value.style.background_fit === 'tile' ? 'repeat' : 'no-repeat',
  filter: `blur(${(look.value.style.background_blur / 4).toFixed(1)}px)`,
}))
</script>

<style scoped>
.theme-preview__image {
  position: absolute;
  inset: -8px;
  background-position: center;
  opacity: 0.4;
}
</style>
