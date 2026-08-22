import { computed, nextTick, readonly, ref } from 'vue'

export type EasterEggID = 'sabrina-tube'

type EasterEggConfig = {
  id: EasterEggID
  enabled: boolean
  triggerPhrases: string[]
  themeClass: string
  label: string
}

const STORAGE_KEY = 'giltube:active-easter-egg'

const easterEggs: EasterEggConfig[] = [
  {
    id: 'sabrina-tube',
    enabled: true,
    triggerPhrases: ['sabrina sabrina sabrina'],
    themeClass: 'theme-sabrina-tube',
    label: 'SabrinaTube',
  },
]

const activeEasterEggID = ref<EasterEggID | ''>('')
const transitionEasterEggID = ref<EasterEggID | ''>('')
const easterEggTransitionPhase = ref<'idle' | 'preparing' | 'covering' | 'revealing'>('idle')
let hasHydrated = false
let transitionRunID = 0

const normalizeTrigger = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

const getEnabledEggByTrigger = (query: string) => {
  const normalizedQuery = normalizeTrigger(query)
  return easterEggs.find((egg) =>
    egg.enabled && egg.triggerPhrases.some((phrase) => normalizeTrigger(phrase) === normalizedQuery)
  )
}

export const useEasterEggs = () => {
  const wait = (duration: number) => new Promise(resolve => window.setTimeout(resolve, duration))

  const runEasterEggTransition = async (egg: EasterEggConfig, applyChange: () => void) => {
    if (!process.client || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyChange()
      return
    }

    const runID = ++transitionRunID
    transitionEasterEggID.value = egg.id
    easterEggTransitionPhase.value = 'preparing'
    await nextTick()
    await new Promise<void>(resolve => window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve())
    }))
    if (runID !== transitionRunID) return

    easterEggTransitionPhase.value = 'covering'
    await wait(420)
    if (runID !== transitionRunID) return

    applyChange()
    easterEggTransitionPhase.value = 'revealing'
    await wait(520)
    if (runID !== transitionRunID) return

    easterEggTransitionPhase.value = 'idle'
    transitionEasterEggID.value = ''
  }

  const hydrateEasterEggs = () => {
    if (hasHydrated || !process.client) return
    hasHydrated = true

    const storedID = window.localStorage.getItem(STORAGE_KEY) as EasterEggID | null
    const storedEgg = easterEggs.find((egg) => egg.enabled && egg.id === storedID)
    activeEasterEggID.value = storedEgg?.id || ''
  }

  const activateEasterEgg = async (id: EasterEggID) => {
    const egg = easterEggs.find((item) => item.enabled && item.id === id)
    if (!egg) return false

    await runEasterEggTransition(egg, () => {
      activeEasterEggID.value = egg.id
      window.localStorage.setItem(STORAGE_KEY, egg.id)
    })
    return true
  }

  const activateFromSearchQuery = async (query: string) => {
    const egg = getEnabledEggByTrigger(query)
    if (!egg) return false
    return activateEasterEgg(egg.id)
  }

  const clearEasterEgg = async () => {
    const egg = easterEggs.find(item => item.id === activeEasterEggID.value)
    if (!egg) return

    await runEasterEggTransition(egg, () => {
      activeEasterEggID.value = ''
      window.localStorage.removeItem(STORAGE_KEY)
    })
  }

  const activeEasterEgg = computed(() =>
    easterEggs.find((egg) => egg.id === activeEasterEggID.value && egg.enabled) || null
  )

  const activeThemeClass = computed(() => activeEasterEgg.value?.themeClass || '')
  const transitionEasterEgg = computed(() =>
    easterEggs.find(egg => egg.id === transitionEasterEggID.value) || null
  )

  return {
    easterEggs: readonly(easterEggs),
    activeEasterEgg,
    activeThemeClass,
    easterEggTransitionPhase: readonly(easterEggTransitionPhase),
    transitionEasterEgg,
    activateFromSearchQuery,
    clearEasterEgg,
    hydrateEasterEggs,
  }
}
