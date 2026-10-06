<template>
  <section id="themes" class="bg-zinc-900 rounded-lg p-6 border border-white/[0.07] space-y-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold">{{ t('themes.title') }}</h2>
        <p class="mt-1 text-sm text-gray-400">{{ t('themes.subtitle') }}</p>
      </div>
      <div class="flex shrink-0 gap-2">
        <button
          type="button"
          class="rounded border border-white/10 px-4 py-2 text-sm transition hover:bg-white/[0.06] disabled:opacity-60"
          :disabled="!!editor || busy"
          @click="fileInput?.click()"
        >
          {{ t('themes.import') }}
        </button>
        <button
          type="button"
          class="rounded bg-zinc-100 px-4 py-2 text-sm text-zinc-950 transition hover:bg-white disabled:opacity-60"
          :disabled="!!editor || busy"
          @click="startNew()"
        >
          {{ t('themes.newTheme') }}
        </button>
        <input ref="fileInput" type="file" accept=".json,application/json" class="hidden" @change="handleImportFile" />
      </div>
    </div>

    <p v-if="message" class="text-sm" :class="messageIsError ? 'text-red-400' : 'text-green-400'" role="status">{{ message }}</p>

    <!-- Import that points at a shared theme: offer the live original or a copy. -->
    <div v-if="pendingImport" class="rounded-lg border border-white/10 bg-zinc-950/60 p-4 space-y-3">
      <div class="flex items-start gap-4">
        <ThemePreview :colors="pendingImport.look" compact class="w-36 shrink-0" />
        <div class="min-w-0 space-y-1">
          <p class="font-medium">{{ pendingImport.name }}</p>
          <p class="text-sm text-gray-400">{{ t('themes.importLinkedBody', { owner: pendingImport.shared.owner_username }) }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded bg-zinc-100 px-4 py-2 text-sm text-zinc-950 transition hover:bg-white disabled:opacity-60" :disabled="busy" @click="installPendingImport">
          {{ t('themes.importInstallOriginal') }}
        </button>
        <button type="button" class="rounded border border-white/10 px-4 py-2 text-sm transition hover:bg-white/[0.06]" :disabled="busy" @click="copyPendingImport">
          {{ t('themes.importAsCopy') }}
        </button>
        <button type="button" class="rounded px-4 py-2 text-sm text-gray-400 transition hover:text-white" @click="pendingImport = null">
          {{ t('themes.cancel') }}
        </button>
      </div>
    </div>

    <!-- Editor: every change previews live across the whole site. -->
    <form v-if="editor" class="rounded-lg border border-white/10 bg-zinc-950/60 p-4 space-y-6" @submit.prevent="saveEditor">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-semibold">{{ editor.id ? t('themes.editTheme') : t('themes.createTheme') }}</h3>
        <span class="text-xs text-gray-400">{{ t('themes.livePreviewHint') }}</span>
      </div>

      <div>
        <label class="mb-2 block text-sm text-gray-300" for="theme-name">{{ t('themes.name') }}</label>
        <input
          id="theme-name"
          v-model="editor.name"
          :maxlength="THEME_NAME_MAX_LENGTH"
          required
          class="w-full rounded bg-zinc-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/20"
          :placeholder="t('themes.namePlaceholder')"
        />
      </div>

      <!-- Colors -->
      <fieldset class="space-y-3">
        <legend class="theme-section-title">{{ t('themes.sections.colors') }}</legend>
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="key in colorKeys" :key="key" class="space-y-1.5">
            <label class="block text-sm text-gray-300" :for="`theme-${key}-hex`">{{ t(`themes.colors.${key}`) }}</label>
            <div class="theme-color-field">
              <input
                type="color"
                class="h-8 w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                :value="editor.look[key]"
                :aria-label="t(`themes.colors.${key}`)"
                @input="setColor(key, ($event.target as HTMLInputElement).value)"
              />
              <input
                :id="`theme-${key}-hex`"
                class="w-full min-w-0 bg-transparent font-mono text-sm uppercase focus:outline-none"
                :value="hexDrafts[key]"
                spellcheck="false"
                maxlength="7"
                @input="onHexInput(key, ($event.target as HTMLInputElement).value)"
                @blur="hexDrafts[key] = editor.look[key]"
              />
            </div>
            <p class="text-xs text-gray-500">{{ t(`themes.colorHelp.${key}`) }}</p>
          </div>
        </div>
        <p v-for="warning in editorWarnings" :key="warning" class="text-sm text-yellow-300">
          {{ t('themes.lowContrast', { color: t(`themes.colors.${warning}`) }) }}
        </p>
      </fieldset>

      <!-- Background -->
      <fieldset class="space-y-3">
        <legend class="theme-section-title">{{ t('themes.sections.background') }}</legend>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="theme-action" :disabled="busy" @click="imageInput?.click()">
            {{ editor.look.backgroundImage ? t('themes.background.replaceImage') : t('themes.background.uploadImage') }}
          </button>
          <button v-if="editor.look.backgroundImage" type="button" class="theme-action" :disabled="busy" @click="removeImage">
            {{ t('themes.background.removeImage') }}
          </button>
          <input ref="imageInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleImageFile" />
          <span class="text-xs text-gray-500">{{ t('themes.background.imageHelp') }}</span>
        </div>

        <div v-if="editor.look.backgroundImage" class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1.5">
            <span class="block text-sm text-gray-300">{{ t('themes.background.fit') }}</span>
            <div class="theme-segmented" role="radiogroup" :aria-label="t('themes.background.fit')">
              <button
                v-for="fit in THEME_BACKGROUND_FITS"
                :key="fit"
                type="button"
                role="radio"
                :aria-checked="editor.look.style.background_fit === fit"
                :class="{ 'is-selected': editor.look.style.background_fit === fit }"
                @click="setStyle('background_fit', fit)"
              >
                {{ t(`themes.background.fits.${fit}`) }}
              </button>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="flex justify-between text-sm text-gray-300" for="theme-blur">
              <span>{{ t('themes.background.blur') }}</span>
              <span class="text-gray-500">{{ editor.look.style.background_blur }}px</span>
            </label>
            <input
              id="theme-blur"
              type="range"
              min="0"
              :max="THEME_BACKGROUND_MAX_BLUR"
              class="w-full accent-blue-500"
              :value="editor.look.style.background_blur"
              @input="setStyle('background_blur', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" class="h-4 w-4 accent-blue-500" :checked="!!editor.look.style.gradient_color" @change="toggleGradient(($event.target as HTMLInputElement).checked)" />
          {{ t('themes.background.gradient') }}
        </label>
        <div v-if="editor.look.style.gradient_color" class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label class="block text-sm text-gray-300" for="theme-gradient-hex">{{ t('themes.background.gradientColor') }}</label>
            <div class="theme-color-field">
              <input
                type="color"
                class="h-8 w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                :value="editor.look.style.gradient_color"
                :aria-label="t('themes.background.gradientColor')"
                @input="setGradientColor(($event.target as HTMLInputElement).value)"
              />
              <input
                id="theme-gradient-hex"
                class="w-full min-w-0 bg-transparent font-mono text-sm uppercase focus:outline-none"
                :value="gradientDraft"
                spellcheck="false"
                maxlength="7"
                @input="onGradientHexInput(($event.target as HTMLInputElement).value)"
                @blur="gradientDraft = editor.look.style.gradient_color"
              />
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="flex justify-between text-sm text-gray-300" for="theme-angle">
              <span>{{ t('themes.background.angle') }}</span>
              <span class="text-gray-500">{{ editor.look.style.gradient_angle }}°</span>
            </label>
            <input
              id="theme-angle"
              type="range"
              min="0"
              max="359"
              class="w-full accent-blue-500"
              :value="editor.look.style.gradient_angle"
              @input="setStyle('gradient_angle', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </fieldset>

      <!-- Shape and type -->
      <fieldset class="space-y-3">
        <legend class="theme-section-title">{{ t('themes.sections.shape') }}</legend>
        <div class="space-y-1.5">
          <span class="block text-sm text-gray-300">{{ t('themes.corners.label') }}</span>
          <div class="theme-segmented" role="radiogroup" :aria-label="t('themes.corners.label')">
            <button
              v-for="corner in cornerKeys"
              :key="corner"
              type="button"
              role="radio"
              :aria-checked="editor.look.style.corners === corner"
              :class="{ 'is-selected': editor.look.style.corners === corner }"
              @click="setStyle('corners', corner)"
            >
              <span class="theme-corner-sample" :style="{ borderTopLeftRadius: `${THEME_CORNERS[corner] * 6}px` }" />
              {{ t(`themes.corners.${corner}`) }}
            </button>
          </div>
        </div>
        <div class="space-y-1.5">
          <span class="block text-sm text-gray-300">{{ t('themes.fonts.label') }}</span>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" :aria-label="t('themes.fonts.label')">
            <button
              v-for="font in fontKeys"
              :key="font"
              type="button"
              role="radio"
              class="theme-option"
              :aria-checked="editor.look.style.font === font"
              :class="{ 'is-selected': editor.look.style.font === font }"
              :style="{ fontFamily: `${THEME_FONTS[font].family}, Inter, sans-serif` }"
              @click="setStyle('font', font)"
            >
              <span class="block text-lg leading-6">Aa</span>
              <span class="block text-xs">{{ t(`themes.fonts.${font}`) }}</span>
            </button>
          </div>
        </div>
      </fieldset>

      <!-- Effects -->
      <fieldset class="space-y-3">
        <legend class="theme-section-title">{{ t('themes.sections.effects') }}</legend>
        <div v-for="group in effectGroups" :key="group.key" class="space-y-1.5">
          <span class="block text-sm text-gray-300">{{ t(`themes.effectGroups.${group.key}`) }}</span>
          <div class="flex flex-wrap gap-2" role="radiogroup" :aria-label="t(`themes.effectGroups.${group.key}`)">
            <button
              v-for="effect in group.effects"
              :key="effect"
              type="button"
              role="radio"
              class="theme-option px-3"
              :aria-checked="editor.look.style.effect === effect"
              :class="{ 'is-selected': editor.look.style.effect === effect }"
              @click="setStyle('effect', effect)"
            >
              {{ t(`themes.effects.${effect}`) }}
            </button>
          </div>
        </div>
        <div v-if="editor.look.style.effect !== 'none'" class="space-y-1.5 sm:w-1/2">
          <label class="flex justify-between text-sm text-gray-300" for="theme-effect-strength">
            <span>{{ t('themes.effectStrength') }}</span>
            <span class="text-gray-500">{{ editor.look.style.effect_strength }}%</span>
          </label>
          <input
            id="theme-effect-strength"
            type="range"
            min="10"
            max="100"
            step="5"
            class="w-full accent-blue-500"
            :value="editor.look.style.effect_strength"
            @input="setStyle('effect_strength', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <p class="text-xs text-gray-500">{{ t('themes.effectsHelp') }}</p>
        <p class="text-xs text-gray-500">
          {{ t('themes.vueBitsCredit') }}
          <a href="https://vue-bits.dev" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">Vue Bits</a>
        </p>
      </fieldset>

      <p v-if="editor.id && editorRecord && editorRecord.install_count > 0" class="text-sm text-gray-400">
        {{ t('themes.editSharedNotice', { count: editorRecord.install_count }, editorRecord.install_count) }}
      </p>

      <div class="flex flex-wrap gap-2">
        <button type="submit" class="rounded bg-zinc-100 px-5 py-2 text-sm text-zinc-950 transition hover:bg-white disabled:opacity-60" :disabled="busy || !editor.name.trim()">
          {{ busy ? t('themes.saving') : editor.id ? t('themes.save') : t('themes.saveAndApply') }}
        </button>
        <button type="button" class="rounded border border-white/10 px-4 py-2 text-sm transition hover:bg-white/[0.06]" :disabled="busy" @click="resetEditor">
          {{ t('themes.resetChanges') }}
        </button>
        <button type="button" class="rounded px-4 py-2 text-sm text-gray-400 transition hover:text-white" :disabled="busy" @click="closeEditor">
          {{ t('themes.cancel') }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="text-sm text-gray-400">{{ t('themes.loading') }}</div>

    <template v-else>
    <div v-for="group in cardGroups" :key="group.key" class="space-y-2">
      <h3 class="theme-section-title">{{ t(`themes.groups.${group.key}`) }}</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <article
          v-for="card in group.cards"
          :key="card.key"
          class="flex flex-col gap-3 rounded-lg border p-3 transition"
          :class="card.active ? 'border-white/30 bg-white/[0.04]' : 'border-white/[0.08]'"
        >
          <ThemePreview :colors="card.look" />
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ card.name }}</p>
              <p class="truncate text-xs text-gray-400">{{ card.subtitle }}</p>
            </div>
            <span v-if="card.active" class="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium">{{ t('themes.active') }}</span>
          </div>
          <p v-if="card.record?.is_retired" class="text-xs text-yellow-300">{{ t('themes.retiredNotice') }}</p>

          <div class="mt-auto flex flex-wrap gap-1.5">
            <button
              v-if="!card.active"
              type="button"
              class="rounded bg-zinc-100 px-3 py-1.5 text-sm text-zinc-950 transition hover:bg-white disabled:opacity-60"
              :disabled="busy || !!editor"
              @click="applyCard(card.record)"
            >
              {{ t('themes.apply') }}
            </button>
            <template v-if="card.record?.is_owner">
              <button type="button" class="theme-action" :disabled="busy || !!editor" @click="startEdit(card.record)">{{ t('themes.edit') }}</button>
              <button type="button" class="theme-action" :disabled="busy" @click="copyShareLink(card.record)">
                {{ copiedId === card.record.id ? t('themes.linkCopied') : t('themes.copyLink') }}
              </button>
            </template>
            <button
              v-else
              type="button"
              class="theme-action"
              :disabled="busy || !!editor"
              @click="startNew(card.look, card.record ? t('themes.copyName', { name: card.name }) : '')"
            >
              {{ card.record ? t('themes.duplicate') : t('themes.customize') }}
            </button>
            <button v-if="card.record" type="button" class="theme-action" :disabled="exportingId === card.record.id" @click="exportCard(card.record)">
              {{ t('themes.export') }}
            </button>
            <button
              v-if="card.record && !card.record.is_builtin"
              type="button"
              class="rounded px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
              :disabled="busy || editor?.id === card.record.id"
              @click="removeCard(card.record)"
            >
              {{ card.record.is_owner ? t('themes.delete') : t('themes.remove') }}
            </button>
          </div>
        </article>
      </div>
    </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import ThemePreview from '~/app/components/themes/ThemePreview.vue'
import { useSiteTheme } from '~/app/composables/useSiteTheme'
import { getSharedTheme, type ThemeRecord } from '~/app/service/themes'
import {
  DEFAULT_APPEARANCE,
  DEFAULT_THEME_COLORS,
  THEME_BACKGROUND_FITS,
  THEME_BACKGROUND_MAX_BLUR,
  THEME_CORNERS,
  THEME_ANIMATED_BACKGROUNDS,
  THEME_FONTS,
  THEME_PARTICLE_EFFECTS,
  THEME_NAME_MAX_LENGTH,
  blobToDataUrl,
  clampThemeName,
  lowContrastWarnings,
  normalizeHex,
  parseThemeFile,
  serializeThemeFile,
  themeAppearanceOf,
  themeFileName,
  themeFontStylesheet,
  type ThemeAppearance,
  type ThemeColors,
  type ThemeCorners,
  type ThemeFont,
  type ThemeStyle,
} from '~/app/utils/theme'

type ColorKey = keyof ThemeColors

const MAX_IMAGE_BYTES = 16 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// What should happen to the background image when the editor saves.
type ImageChange =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'upload', blob: Blob }
  | { kind: 'copy', url: string }

interface EditorState {
  id: string | null
  name: string
  look: ThemeAppearance
  initial: ThemeAppearance
  image: ImageChange
  initialImage: ImageChange
}

const { t } = useI18n()
const localePath = useLocalePath()
const siteTheme = useSiteTheme()

const loading = ref(true)
const busy = ref(false)
const message = ref('')
const messageIsError = ref(false)
const copiedId = ref('')
const exportingId = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const editor = ref<EditorState | null>(null)
const hexDrafts = reactive<ThemeColors>({ ...DEFAULT_THEME_COLORS })
const gradientDraft = ref('')
const pendingImport = ref<{ name: string, look: ThemeAppearance, image: Blob | null, shared: ThemeRecord } | null>(null)
const objectUrls: string[] = []

const colorKeys: ColorKey[] = ['primary', 'accent', 'background']
const cornerKeys = Object.keys(THEME_CORNERS) as ThemeCorners[]
const fontKeys = Object.keys(THEME_FONTS) as ThemeFont[]
const effectGroups = [
  { key: 'particles', effects: ['none', ...THEME_PARTICLE_EFFECTS] },
  { key: 'animated', effects: THEME_ANIMATED_BACKGROUNDS },
] as const

const themes = computed(() => siteTheme.library.value?.themes || [])
const activeId = computed(() => siteTheme.library.value?.active_theme_id ?? null)
const editorRecord = computed(() => themes.value.find(theme => theme.id === editor.value?.id) || null)
const editorWarnings = computed(() => (editor.value ? lowContrastWarnings(editor.value.look) : []))

const cards = computed(() => [
  {
    key: 'default',
    name: t('themes.defaultName'),
    subtitle: t('themes.defaultSubtitle'),
    look: DEFAULT_APPEARANCE,
    record: null as ThemeRecord | null,
    active: !activeId.value,
  },
  ...themes.value.map(record => ({
    key: record.id,
    name: record.name,
    subtitle: record.is_builtin
      ? t('themes.builtinSubtitle')
      : record.is_owner
        ? (record.install_count > 0 ? t('themes.usedBy', { count: record.install_count }) : t('themes.yourTheme'))
        : t('themes.byOwner', { owner: record.owner_username || t('themes.unknownOwner') }),
    look: themeAppearanceOf(record),
    record,
    active: record.id === activeId.value,
  })),
])

// GilTube's own looks first (the default and the built-ins), then the
// user's themes and the ones they installed.
const cardGroups = computed(() => {
  const builtin = cards.value.filter(card => !card.record || card.record.is_builtin)
  const library = cards.value.filter(card => card.record && !card.record.is_builtin)
  return [
    { key: 'giltube', cards: builtin },
    ...(library.length ? [{ key: 'library', cards: library }] : []),
  ]
})

// Fonts used by the cards, or every font while the editor shows its picker.
useHead({
  link: computed(() => {
    const styles = editor.value
      ? fontKeys.map(font => ({ ...DEFAULT_APPEARANCE.style, font }))
      : cards.value.map(card => card.look.style)
    const hrefs = new Set(styles.map(themeFontStylesheet).filter((href): href is string => !!href))
    return [...hrefs].map(href => ({ key: `theme-font-${href}`, rel: 'stylesheet', href }))
  }),
})

const flash = (text: string, isError = false) => {
  message.value = text
  messageIsError.value = isError
}

const errorText = (error: any, fallback: string) => {
  const code = error?.response?.data?.error
  if (code === 'theme limit reached') return t('themes.errors.limit')
  if (code === 'image is too large' || code === 'image dimensions are too large') return t('themes.errors.imageTooLarge')
  if (code === 'unsupported or invalid image' || code === 'file must be an image') return t('themes.errors.imageInvalid')
  return fallback
}

const previewUrl = (blob: Blob) => {
  const url = URL.createObjectURL(blob)
  objectUrls.push(url)
  return url
}

const releasePreviewUrls = () => {
  objectUrls.splice(0).forEach(url => URL.revokeObjectURL(url))
}

const cloneLook = (look: ThemeAppearance): ThemeAppearance => ({ ...look, style: { ...look.style } })

const updatePreview = () => {
  if (editor.value) siteTheme.setPreview(editor.value.look)
}

const openEditor = (state: EditorState) => {
  pendingImport.value = null
  editor.value = state
  Object.assign(hexDrafts, { primary: state.look.primary, accent: state.look.accent, background: state.look.background })
  gradientDraft.value = state.look.style.gradient_color
  updatePreview()
  message.value = ''
}

// New themes start from the given look (another theme, an import) or from
// whatever the site currently shows. A background from a source theme is
// copied into the new theme on save; an imported image is uploaded.
const startNew = (look?: ThemeAppearance, name = '', image: Blob | null = null) => {
  const base = cloneLook(look || siteTheme.active.value)
  let change: ImageChange = { kind: 'keep' }
  if (image) {
    base.backgroundImage = previewUrl(image)
    change = { kind: 'upload', blob: image }
  } else if (base.backgroundImage) {
    change = { kind: 'copy', url: base.backgroundImage }
  }
  openEditor({ id: null, name: clampThemeName(name), look: base, initial: cloneLook(base), image: change, initialImage: change })
}

const startEdit = (record: ThemeRecord) => {
  const look = themeAppearanceOf(record)
  openEditor({ id: record.id, name: record.name, look: cloneLook(look), initial: cloneLook(look), image: { kind: 'keep' }, initialImage: { kind: 'keep' } })
}

const closeEditor = () => {
  editor.value = null
  siteTheme.setPreview(null)
  releasePreviewUrls()
}

const resetEditor = () => {
  if (!editor.value) return
  editor.value.look = cloneLook(editor.value.initial)
  editor.value.image = editor.value.initialImage
  Object.assign(hexDrafts, { primary: editor.value.look.primary, accent: editor.value.look.accent, background: editor.value.look.background })
  gradientDraft.value = editor.value.look.style.gradient_color
  updatePreview()
}

const setColor = (key: ColorKey, value: string) => {
  const hex = normalizeHex(value)
  if (!hex || !editor.value) return
  editor.value.look[key] = hex
  hexDrafts[key] = hex
  updatePreview()
}

const onHexInput = (key: ColorKey, value: string) => {
  hexDrafts[key] = value
  const hex = normalizeHex(value)
  if (hex && value.replace('#', '').length === 6 && editor.value) {
    editor.value.look[key] = hex
    updatePreview()
  }
}

const setStyle = <K extends keyof ThemeStyle>(key: K, value: ThemeStyle[K]) => {
  if (!editor.value) return
  editor.value.look.style[key] = value
  updatePreview()
}

const toggleGradient = (enabled: boolean) => {
  if (!editor.value) return
  // Start from the accent so turning it on is immediately visible.
  const color = enabled ? (editor.value.look.style.gradient_color || editor.value.look.accent) : ''
  gradientDraft.value = color
  setStyle('gradient_color', color)
}

const setGradientColor = (value: string) => {
  const hex = normalizeHex(value)
  if (!hex) return
  gradientDraft.value = hex
  setStyle('gradient_color', hex)
}

const onGradientHexInput = (value: string) => {
  gradientDraft.value = value
  const hex = normalizeHex(value)
  if (hex && value.replace('#', '').length === 6) setStyle('gradient_color', hex)
}

const handleImageFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !editor.value) return
  if (!IMAGE_TYPES.includes(file.type)) {
    flash(t('themes.errors.imageInvalid'), true)
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    flash(t('themes.errors.imageTooLarge'), true)
    return
  }
  message.value = ''
  editor.value.image = { kind: 'upload', blob: file }
  editor.value.look.backgroundImage = previewUrl(file)
  updatePreview()
}

const removeImage = () => {
  if (!editor.value) return
  editor.value.image = editor.value.id ? { kind: 'remove' } : { kind: 'keep' }
  editor.value.look.backgroundImage = ''
  updatePreview()
}

const fetchImage = async (url: string): Promise<Blob> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`image fetch failed: ${response.status}`)
  return response.blob()
}

const saveEditor = async () => {
  if (!editor.value) return
  const state = editor.value
  const payload = {
    name: clampThemeName(state.name),
    primary_color: state.look.primary,
    accent_color: state.look.accent,
    background_color: state.look.background,
    style: { ...state.look.style },
  }
  busy.value = true
  try {
    const record = state.id ? await siteTheme.save(state.id, payload) : await siteTheme.create(payload, true)
    try {
      if (state.image.kind === 'upload') await siteTheme.setBackground(record.id, state.image.blob)
      else if (state.image.kind === 'copy') await siteTheme.setBackground(record.id, await fetchImage(state.image.url))
      else if (state.image.kind === 'remove' && record.background_image) await siteTheme.setBackground(record.id, null)
    } catch (error) {
      // The theme itself is saved; keep going but say the image didn't make it.
      closeEditor()
      flash(errorText(error, t('themes.errors.imageSave')), true)
      return
    }
    flash(state.id ? t('themes.saved') : t('themes.created'))
    closeEditor()
  } catch (error) {
    flash(errorText(error, t('themes.errors.save')), true)
  } finally {
    busy.value = false
  }
}

const applyCard = async (record: ThemeRecord | null) => {
  busy.value = true
  try {
    await siteTheme.apply(record)
    message.value = ''
  } catch (error) {
    flash(errorText(error, t('themes.errors.apply')), true)
  } finally {
    busy.value = false
  }
}

const removeCard = async (record: ThemeRecord) => {
  const prompt = record.is_owner
    ? (record.install_count > 0 ? t('themes.confirmDeleteShared', { name: record.name, count: record.install_count }, record.install_count) : t('themes.confirmDelete', { name: record.name }))
    : t('themes.confirmRemove', { name: record.name })
  if (!window.confirm(prompt)) return
  busy.value = true
  try {
    await siteTheme.remove(record)
    flash(t('themes.removed', { name: record.name }))
  } catch (error) {
    flash(errorText(error, t('themes.errors.remove')), true)
  } finally {
    busy.value = false
  }
}

const shareUrl = (record: ThemeRecord) => `${window.location.origin}${localePath(`/themes/${record.share_code}`)}`

const copyShareLink = async (record: ThemeRecord) => {
  const url = shareUrl(record)
  try {
    await navigator.clipboard.writeText(url)
    copiedId.value = record.id
    setTimeout(() => {
      if (copiedId.value === record.id) copiedId.value = ''
    }, 2000)
  } catch {
    window.prompt(t('themes.copyLinkPrompt'), url)
  }
}

const exportCard = async (record: ThemeRecord) => {
  exportingId.value = record.id
  try {
    const look = themeAppearanceOf(record)
    let backgroundDataUrl: string | undefined
    if (look.backgroundImage) {
      try {
        backgroundDataUrl = await blobToDataUrl(await fetchImage(look.backgroundImage))
      } catch {
        flash(t('themes.errors.exportImage'), true)
      }
    }
    const sourceUrl = record.is_retired ? undefined : shareUrl(record)
    const blob = new Blob([serializeThemeFile(record.name, look, { sourceUrl, backgroundDataUrl })], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = themeFileName(record.name)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } finally {
    exportingId.value = ''
  }
}

const handleImportFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  // Room for an embedded background image (base64 grows it by a third).
  if (file.size > 24 * 1024 * 1024) {
    flash(t('themes.errors.importInvalid'), true)
    return
  }
  const parsed = parseThemeFile(await file.text())
  if (!parsed) {
    flash(t('themes.errors.importInvalid'), true)
    return
  }
  message.value = ''
  const look: ThemeAppearance = { ...parsed.colors, style: parsed.style, backgroundImage: '' }

  // A file exported from a shared theme can link back to the live original.
  if (parsed.sourceCode) {
    try {
      const { theme: shared, installed } = await getSharedTheme(parsed.sourceCode)
      if (shared.is_owner || installed) {
        flash(t('themes.importAlreadyHave', { name: shared.name }))
        return
      }
      pendingImport.value = {
        name: parsed.name,
        look: parsed.backgroundImage ? { ...look, backgroundImage: previewUrl(parsed.backgroundImage) } : look,
        image: parsed.backgroundImage,
        shared,
      }
      return
    } catch {
      // The original is gone or unreachable; fall back to a plain copy.
    }
  }
  startNew(look, parsed.name, parsed.backgroundImage)
}

const installPendingImport = async () => {
  if (!pendingImport.value) return
  busy.value = true
  try {
    await siteTheme.install(pendingImport.value.shared.share_code, true)
    flash(t('themes.installed', { name: pendingImport.value.shared.name }))
    pendingImport.value = null
  } catch (error) {
    flash(errorText(error, t('themes.errors.install')), true)
  } finally {
    busy.value = false
  }
}

const copyPendingImport = () => {
  if (!pendingImport.value) return
  const { look, name, image } = pendingImport.value
  startNew({ ...look, backgroundImage: '' }, name, image)
}

onMounted(async () => {
  try {
    await siteTheme.loadLibrary()
  } catch (error) {
    console.error('Failed to load themes:', error)
    flash(t('themes.errors.load'), true)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  siteTheme.setPreview(null)
  releasePreviewUrls()
})
</script>

<style scoped>
.theme-section-title {
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--gt-zinc-400));
}

.theme-color-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: calc(0.25rem * var(--gt-radius-scale));
  border: 1px solid rgb(var(--gt-white) / 0.1);
  background: rgb(var(--gt-zinc-800));
  padding: 0.375rem 0.5rem;
}

.theme-color-field:focus-within {
  box-shadow: 0 0 0 2px rgb(var(--gt-white) / 0.2);
}

.theme-action,
.theme-option,
.theme-segmented button {
  border-radius: calc(0.25rem * var(--gt-radius-scale));
  border: 1px solid rgb(var(--gt-white) / 0.1);
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.theme-action:hover:not(:disabled),
.theme-option:hover,
.theme-segmented button:hover {
  background: rgb(var(--gt-white) / 0.06);
}

.theme-action:disabled {
  opacity: 0.6;
}

.theme-option {
  text-align: left;
}

.theme-option.is-selected,
.theme-segmented button.is-selected {
  border-color: rgb(var(--gt-accent-500));
  background: rgb(var(--gt-accent-500) / 0.15);
}

.theme-segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.theme-segmented button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-corner-sample {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border-top: 2px solid currentColor;
  border-left: 2px solid currentColor;
}
</style>
