<template>
  <div class="geel-create">
    <div v-if="!loggedIn" class="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p class="text-lg font-bold text-white">{{ t('geels.signInToCreate') }}</p>
      <NuxtLink :to="localePath('/login')" class="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white">{{ t('app.login') }}</NuxtLink>
    </div>
    <div v-else-if="posted" class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-accent-600/20 text-accent-400">
        <svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      </div>
      <p class="text-xl font-extrabold text-white">{{ t('geels.postedTitle') }}</p>
      <p class="max-w-sm text-sm text-zinc-400">{{ t('geels.postedBody') }}</p>
      <div class="mt-2 flex gap-2">
        <NuxtLink :to="localePath(`/channel/${posted.channelID}`)" class="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20">{{ t('geels.goToChannel') }}</NuxtLink>
        <button type="button" class="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-500" @click="reset">{{ t('geels.createAnother') }}</button>
      </div>
    </div>
    <template v-else>
      <GeelWebRecorder
        v-if="step === 'record'"
        v-model:clips="clips"
        v-model:maxSeconds="maxSeconds"
        :sound="sound"
        :soundStartMS="soundStartMS"
        @pick-sound="pickerOpen = true"
        @next="step = 'review'"
        @close="leave"
      />
      <GeelWebReview
        v-else
        v-model:soundStartMS="soundStartMS"
        v-model:soundVolume="soundVolume"
        v-model:originalVolume="originalVolume"
        v-model:caption="caption"
        :clips="clips"
        :sound="sound"
        @pick-sound="pickerOpen = true"
        @back="step = 'record'"
        @posted="onPosted"
      />
    </template>
    <GeelSoundPicker :open="pickerOpen" :selected="sound" @close="pickerOpen = false" @select="selectSound" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GeelSoundPicker from '~/app/components/geels/create/GeelSoundPicker.vue'
import GeelWebRecorder from '~/app/components/geels/create/GeelWebRecorder.vue'
import GeelWebReview from '~/app/components/geels/create/GeelWebReview.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { getGeelSound, type GeelSound, type GeelWebClip } from '~/app/service/geels'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
useMetaTags({ title: `${t('app.createGeel')} · GilTube`, url: '/geels/create' })

const loggedIn = ref(true)
const step = ref<'record' | 'review'>('record')
const clips = ref<GeelWebClip[]>([])
const maxSeconds = ref(60)
const sound = ref<GeelSound | null>(null)
const soundStartMS = ref(0)
const soundVolume = ref(1)
const originalVolume = ref(1)
const caption = ref('')
const pickerOpen = ref(false)
const posted = ref<{ videoID: string; channelID: string } | null>(null)

const selectSound = (next: GeelSound | null) => {
  sound.value = next
  soundStartMS.value = 0
}

const releaseClips = () => clips.value.forEach((clip) => URL.revokeObjectURL(clip.url))

const leave = () => {
  if (clips.value.length && !window.confirm(t('geels.discardConfirm'))) return
  releaseClips()
  clips.value = []
  if (window.history.length > 1) router.back()
  else void router.push(localePath('/geels'))
}

const onPosted = (videoID: string, channelID: string) => {
  releaseClips()
  posted.value = { videoID, channelID }
}

const reset = () => {
  posted.value = null
  clips.value = []
  caption.value = ''
  step.value = 'record'
}

// Recordings live only in this tab: warn before closing it.
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (clips.value.length && !posted.value) event.preventDefault()
}

onMounted(async () => {
  loggedIn.value = !!localStorage.getItem('user_id')
  window.addEventListener('beforeunload', beforeUnload)
  const soundID = typeof route.query.sound === 'string' ? route.query.sound : ''
  if (soundID) {
    try {
      const data = await getGeelSound(soundID)
      if (data.usable) sound.value = data.sound
    } catch { /* ignore */ }
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  releaseClips()
})
</script>

<style scoped>
.geel-create {
  display: flex;
  height: 100dvh;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #050505;
}
@media (max-width: 767px) {
  .geel-create { padding: 0; align-items: stretch; height: auto; min-height: 100dvh; }
}
</style>
