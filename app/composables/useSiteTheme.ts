import { computed } from 'vue'
import {
  DEFAULT_SITE_THEME,
  buildThemeCss,
  normalizeHex,
  normalizeThemeStyle,
  safeBackgroundImage,
  themeAppearanceOf,
  themeFontStylesheet,
  themeHasBackdrop,
  themeScheme,
  type SiteTheme,
  type ThemeAppearance,
} from '~/app/utils/theme'
import {
  createTheme,
  deleteTheme,
  deleteThemeBackground,
  getMyActiveTheme,
  installSharedTheme,
  listMyThemes,
  setMyActiveTheme,
  uninstallTheme,
  updateTheme,
  uploadThemeBackground,
  type ThemeInput,
  type ThemeLibrary,
  type ThemeRecord,
} from '~/app/service/themes'

// The active theme is cached in a cookie so the server renders the page in
// the right colors (no flash of the default theme). The account is the source
// of truth: the cache is re-checked on load, when the signed-in user changes,
// and when the tab regains focus, which is how a creator's edits reach
// everyone using their theme.

const THEME_COOKIE = 'gilTube_theme'
const RESYNC_INTERVAL_MS = 2 * 60 * 1000

interface StoredTheme {
  id: string | null
  n: string
  v: number
  p: string
  a: string
  b: string
  s?: unknown
  i?: string
}

const toStored = (theme: SiteTheme): StoredTheme => ({
  id: theme.id,
  n: theme.name,
  v: theme.version,
  p: theme.primary,
  a: theme.accent,
  b: theme.background,
  s: theme.style,
  i: theme.backgroundImage || undefined,
})

const fromStored = (stored: StoredTheme | null | undefined): SiteTheme => {
  if (!stored || typeof stored !== 'object' || !stored.id) return DEFAULT_SITE_THEME
  const primary = normalizeHex(stored.p)
  const accent = normalizeHex(stored.a)
  const background = normalizeHex(stored.b)
  if (!primary || !accent || !background) return DEFAULT_SITE_THEME
  return {
    id: String(stored.id),
    name: typeof stored.n === 'string' ? stored.n : '',
    version: Number(stored.v) || 0,
    primary,
    accent,
    background,
    // The cookie is client-writable, so style and image are re-validated too.
    style: normalizeThemeStyle(stored.s),
    backgroundImage: safeBackgroundImage(stored.i),
  }
}

export const recordToSiteTheme = (record: ThemeRecord | null): SiteTheme => {
  if (!record) return DEFAULT_SITE_THEME
  return { id: record.id, name: record.name, version: record.version, ...themeAppearanceOf(record) }
}

const signedInUserId = (): string => (process.client ? localStorage.getItem('user_id') || '' : '')

export const useSiteTheme = () => {
  const cookie = useCookie<StoredTheme | null>(THEME_COOKIE, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })
  const preview = useState<ThemeAppearance | null>('gt-theme-preview', () => null)
  const library = useState<ThemeLibrary | null>('gt-theme-library', () => null)
  const syncState = useState('gt-theme-sync', () => ({ userId: '', at: 0, inFlight: false }))

  const active = computed<SiteTheme>(() => fromStored(cookie.value))
  // What the site renders right now: a live preview while editing or
  // trying a shared theme, otherwise the active theme.
  const appearance = computed<ThemeAppearance>(() => preview.value || {
    primary: active.value.primary,
    accent: active.value.accent,
    background: active.value.background,
    style: active.value.style,
    backgroundImage: active.value.backgroundImage,
  })

  const setLocal = (theme: SiteTheme) => {
    cookie.value = theme.id ? toStored(theme) : null
  }

  const resetLocal = () => {
    preview.value = null
    library.value = null
    setLocal(DEFAULT_SITE_THEME)
    syncState.value = { userId: '', at: 0, inFlight: false }
  }

  const sync = async (force = false) => {
    if (!process.client) return
    const userId = signedInUserId()
    if (!userId) {
      if (active.value.id) setLocal(DEFAULT_SITE_THEME)
      syncState.value.userId = ''
      return
    }
    const state = syncState.value
    const fresh = state.userId === userId && Date.now() - state.at < RESYNC_INTERVAL_MS
    if (state.inFlight || (!force && fresh)) return
    state.inFlight = true
    try {
      const record = await getMyActiveTheme()
      if (signedInUserId() === userId) {
        setLocal(recordToSiteTheme(record))
        state.userId = userId
        state.at = Date.now()
      }
    } catch {
      // Keep the cached theme when offline or the API is unreachable.
    } finally {
      state.inFlight = false
    }
  }

  const loadLibrary = async (): Promise<ThemeLibrary> => {
    const result = await listMyThemes()
    library.value = result
    const current = result.themes.find(theme => theme.id === result.active_theme_id) || null
    setLocal(recordToSiteTheme(current))
    syncState.value = { userId: signedInUserId(), at: Date.now(), inFlight: false }
    return result
  }

  const upsertInLibrary = (record: ThemeRecord) => {
    if (!library.value) return
    const index = library.value.themes.findIndex(theme => theme.id === record.id)
    if (index >= 0) library.value.themes.splice(index, 1, record)
    else library.value.themes.unshift(record)
  }

  const removeFromLibrary = (id: string) => {
    if (!library.value) return
    library.value.themes = library.value.themes.filter(theme => theme.id !== id)
    if (library.value.active_theme_id === id) library.value.active_theme_id = null
  }

  // Applies immediately and rolls back if the account could not be updated.
  const apply = async (record: ThemeRecord | null) => {
    const previous = active.value
    const previousActiveId = library.value?.active_theme_id ?? null
    setLocal(recordToSiteTheme(record))
    if (library.value) library.value.active_theme_id = record?.id ?? null
    try {
      const saved = await setMyActiveTheme(record?.id ?? null)
      setLocal(recordToSiteTheme(saved))
    } catch (error) {
      setLocal(previous)
      if (library.value) library.value.active_theme_id = previousActiveId
      throw error
    }
  }

  const create = async (input: ThemeInput, activate = false) => {
    const record = await createTheme(input)
    upsertInLibrary(record)
    if (activate) await apply(record)
    return record
  }

  const save = async (id: string, input: ThemeInput) => {
    const record = await updateTheme(id, input)
    upsertInLibrary(record)
    if (active.value.id === record.id) setLocal(recordToSiteTheme(record))
    return record
  }

  const remove = async (record: ThemeRecord) => {
    const result = record.is_owner ? await deleteTheme(record.id) : (await uninstallTheme(record.id), { retired: false })
    removeFromLibrary(record.id)
    if (active.value.id === record.id) setLocal(DEFAULT_SITE_THEME)
    return result
  }

  // image: a new picture to upload, or null to remove the current one.
  const setBackground = async (id: string, image: Blob | null) => {
    const record = image ? await uploadThemeBackground(id, image) : await deleteThemeBackground(id)
    upsertInLibrary(record)
    if (active.value.id === record.id) setLocal(recordToSiteTheme(record))
    return record
  }

  const install = async (shareCode: string, activate: boolean) => {
    const record = await installSharedTheme(shareCode, activate)
    upsertInLibrary(record)
    if (activate) {
      setLocal(recordToSiteTheme(record))
      if (library.value) library.value.active_theme_id = record.id
    }
    return record
  }

  const setPreview = (value: ThemeAppearance | null) => {
    preview.value = value ? { ...value, style: { ...value.style } } : null
  }

  return {
    active,
    appearance,
    library,
    preview,
    sync,
    resetLocal,
    loadLibrary,
    apply,
    create,
    save,
    setBackground,
    remove,
    install,
    setPreview,
  }
}

// Called once from app.vue: renders the theme into <head> on the server and
// keeps it in sync on the client, including live previews.
export const useSiteThemeHead = () => {
  const { appearance } = useSiteTheme()
  const fontStylesheet = computed(() => themeFontStylesheet(appearance.value.style))
  useHead({
    htmlAttrs: {
      'data-theme-scheme': computed(() => themeScheme(appearance.value.background)),
      'data-theme-backdrop': computed(() => (themeHasBackdrop(appearance.value) ? 'on' : null)),
    },
    link: computed(() => (fontStylesheet.value
      ? [{ key: 'gt-theme-font', rel: 'stylesheet', href: fontStylesheet.value }]
      : [])),
    style: [{
      key: 'gt-site-theme',
      id: 'gt-site-theme',
      // Never empty: the head manager keeps a style tag's previous content
      // when it is updated to an empty string, which would leave the last
      // custom theme applied after switching back to the default.
      textContent: computed(() => buildThemeCss(appearance.value) || '/* default theme */'),
    }],
    meta: [{
      key: 'theme-color',
      name: 'theme-color',
      content: computed(() => appearance.value.background),
    }],
  })
}
