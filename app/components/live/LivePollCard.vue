<template>
  <div v-if="visiblePoll || canManage" class="space-y-2 border-b border-zinc-800 p-3">
    <div v-if="canManage" class="flex justify-end">
      <button type="button" class="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-700" @click="composerOpen = !composerOpen">
        {{ t('live.poll.create') }}
      </button>
    </div>

    <form v-if="composerOpen" class="space-y-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-3" @submit.prevent="submitPoll">
      <p class="text-sm font-black text-white">{{ t('live.poll.createTitle') }}</p>
      <input v-model="question" maxlength="120" required :placeholder="t('live.poll.questionPlaceholder')" class="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-red-500" />
      <div v-for="(_, index) in options" :key="index" class="flex gap-2">
        <input v-model="options[index]" maxlength="80" required :placeholder="t('live.poll.optionPlaceholder', { number: index + 1 })" class="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-red-500" />
        <button v-if="options.length > 2" type="button" class="h-9 w-9 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white" :aria-label="t('live.poll.removeOption')" @click="options.splice(index, 1)">×</button>
      </div>
      <div class="flex items-center justify-between gap-2">
        <button v-if="options.length < 4" type="button" class="rounded-full px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800" @click="options.push('')">+ {{ t('live.poll.addOption') }}</button>
        <button type="submit" :disabled="busy || !validPoll" class="ml-auto rounded-full bg-white px-4 py-2 text-xs font-black text-black disabled:opacity-40">{{ t('live.poll.askCommunity') }}</button>
      </div>
    </form>

    <Transition name="live-poll" mode="out-in">
    <article v-if="visiblePoll" :key="visiblePoll.id" class="rounded-2xl bg-zinc-100 p-4 text-zinc-950 shadow-lg">
      <div class="flex items-center gap-2 text-xs text-zinc-500">
        <AvatarFallback :src="visiblePoll.creator.avatar_url" :name="visiblePoll.creator.name" class="h-7 w-7 flex-none text-[10px]" />
        <span class="min-w-0 flex-1 truncate font-bold text-zinc-600">{{ visiblePoll.creator.name }}</span>
        <span class="text-zinc-500">{{ t('live.poll.votes', { count: visiblePoll.total_votes }) }}</span>
      </div>
      <p class="mt-3 text-base font-bold leading-snug text-zinc-950">{{ visiblePoll.question }}</p>
      <div class="mt-3 space-y-2">
        <button v-for="option in visiblePoll.options" :key="option.id" type="button" :disabled="busy || visiblePoll.status !== 'active' || !actorChannelId || !!visiblePoll.selected_option_id" class="relative flex min-h-10 w-full items-center overflow-hidden rounded-xl border border-zinc-300 bg-white px-3 text-left text-zinc-950 disabled:cursor-default" :class="{ 'border-red-500': visiblePoll.selected_option_id === option.id }" @click="vote(option.id)">
          <span v-if="showResults" class="absolute inset-y-0 left-0 bg-red-100 transition-all" :style="{ width: `${option.percentage}%` }" />
          <span class="relative h-4 w-4 flex-none rounded-full border border-zinc-500" :class="{ 'border-[5px] border-red-600': visiblePoll.selected_option_id === option.id }" />
          <span class="relative ml-2 min-w-0 flex-1 text-sm font-semibold text-zinc-950">{{ option.text }}</span>
          <span v-if="showResults" class="relative ml-2 text-xs font-black text-zinc-800">{{ option.percentage }}%</span>
        </button>
      </div>
      <p v-if="!actorChannelId && visiblePoll.status === 'active'" class="mt-3 text-xs text-zinc-500">{{ t('live.poll.signInVote') }}</p>
      <div class="mt-3 flex min-h-8 items-center justify-between">
        <span class="text-xs font-semibold text-zinc-500">{{ visiblePoll.status === 'active' ? t('live.poll.active') : t('live.poll.finalResults') }}</span>
        <button v-if="canManage && visiblePoll.status === 'active'" type="button" :disabled="busy" class="rounded-full px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50" @click="finishPoll">{{ t('live.poll.end') }}</button>
        <button v-else-if="visiblePoll.status === 'ended'" type="button" class="rounded-full px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50" @click="dismissPoll">{{ t('live.poll.dismiss') }}</button>
      </div>
    </article>
    </Transition>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import { createLivePoll, endLivePoll, getLivePoll, voteLivePoll, type LivePoll } from '~/app/service/live'

const props = defineProps<{ channelId: string; actorChannelId?: string; live: boolean; canManage?: boolean }>()
const { t } = useI18n()
const poll = ref<LivePoll | null>(null)
const dismissedPollId = ref('')
const composerOpen = ref(false)
const question = ref('')
const options = ref(['', ''])
const busy = ref(false)
const error = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const validPoll = computed(() => question.value.trim() && options.value.filter(option => option.trim()).length >= 2)
const showResults = computed(() => poll.value?.status === 'ended' || !!poll.value?.selected_option_id)
const visiblePoll = computed(() => poll.value?.id === dismissedPollId.value ? null : poll.value)

const dismissPoll = () => {
  if (!poll.value || poll.value.status !== 'ended') return
  dismissedPollId.value = poll.value.id
  if (import.meta.client) localStorage.setItem(`giltube.live-poll.dismissed.${props.channelId}`, poll.value.id)
}

const refresh = async () => {
  if (!props.channelId) return
  try {
    poll.value = await getLivePoll(props.channelId, props.actorChannelId || '')
  } catch (cause: any) {
    console.error('Failed to refresh live poll:', cause)
  }
}

const submitPoll = async () => {
  if (!validPoll.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await createLivePoll(props.channelId, question.value.trim(), options.value.map(option => option.trim()).filter(Boolean))
    question.value = ''
    options.value = ['', '']
    composerOpen.value = false
    await refresh()
  } catch (cause: any) {
    error.value = cause?.response?.data?.error || t('live.poll.createError')
  } finally {
    busy.value = false
  }
}

const vote = async (optionId: string) => {
  if (!poll.value || !props.actorChannelId || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await voteLivePoll(props.channelId, poll.value.id, props.actorChannelId, optionId)
    await refresh()
  } catch (cause: any) {
    error.value = cause?.response?.data?.error || t('live.poll.voteError')
  } finally {
    busy.value = false
  }
}

const finishPoll = async () => {
  if (!poll.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await endLivePoll(props.channelId, poll.value.id)
    await refresh()
  } catch (cause: any) {
    error.value = cause?.response?.data?.error || t('live.poll.endError')
  } finally {
    busy.value = false
  }
}

const restartTimer = () => {
  if (timer) clearInterval(timer)
  timer = props.channelId ? setInterval(refresh, props.live ? 2500 : 5000) : null
}

watch(() => [props.channelId, props.actorChannelId, props.live], async () => {
  await refresh()
  restartTimer()
})
onMounted(async () => {
  dismissedPollId.value = localStorage.getItem(`giltube.live-poll.dismissed.${props.channelId}`) || ''
  await refresh()
  restartTimer()
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.live-poll-enter-active,
.live-poll-leave-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(.2,.8,.2,1);
  transform-origin: top center;
}

.live-poll-enter-from,
.live-poll-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(.96);
}
</style>
