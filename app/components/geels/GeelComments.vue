<template>
  <Teleport to="body">
    <Transition name="geel-sheet-backdrop">
      <div v-if="geel" class="fixed inset-0 z-[90] bg-black/50 md:bg-black/20" @click="emit('close')" />
    </Transition>
    <Transition name="geel-sheet">
      <aside v-if="geel" class="geel-comments" role="dialog" :aria-label="t('geels.comments')">
        <header class="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <h2 class="text-[15px] font-bold text-white">
            {{ t('geels.commentsCount', { count: formatGeelCount(geel.comments_count, locale) }) }}
          </h2>
          <button type="button" class="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white" :aria-label="t('geels.close')" @click="emit('close')">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>

        <div class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div v-if="loading" class="py-10 text-center text-sm text-zinc-500">{{ t('geels.loading') }}</div>
          <p v-else-if="!comments.length" class="py-10 text-center text-sm text-zinc-500">{{ t('geels.noComments') }}</p>
          <template v-for="comment in comments" :key="comment.id">
            <div class="flex gap-3">
              <img v-if="avatar(comment)" :src="avatar(comment)" alt="" class="h-8 w-8 shrink-0 rounded-full object-cover">
              <span v-else class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">{{ (comment.channel?.name || '?').slice(0, 1) }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-xs text-zinc-400">
                  <span class="font-semibold text-zinc-200">{{ comment.channel?.name }}</span>
                  · {{ getTimeAgo(comment.created_at, locale) }}
                </p>
                <p class="mt-0.5 whitespace-pre-line break-words text-sm text-zinc-100">{{ comment.text }}</p>
                <div class="mt-1 flex items-center gap-4 text-xs text-zinc-400">
                  <button type="button" class="hover:text-white" @click="replyTo = replyTo?.id === comment.id ? null : comment">{{ t('geels.reply') }}</button>
                </div>
                <div v-if="comment.replies?.length" class="mt-3 space-y-3">
                  <div v-for="reply in comment.replies" :key="reply.id" class="flex gap-2.5">
                    <img v-if="avatar(reply)" :src="avatar(reply)" alt="" class="h-6 w-6 shrink-0 rounded-full object-cover">
                    <span v-else class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold">{{ (reply.channel?.name || '?').slice(0, 1) }}</span>
                    <div class="min-w-0">
                      <p class="text-xs text-zinc-400"><span class="font-semibold text-zinc-200">{{ reply.channel?.name }}</span> · {{ getTimeAgo(reply.created_at, locale) }}</p>
                      <p class="whitespace-pre-line break-words text-sm text-zinc-100">{{ reply.text }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="flex shrink-0 flex-col items-center gap-0.5 self-start pt-1 text-xs"
                :class="comment.liked_by_actor ? 'text-accent-500' : 'text-zinc-500 hover:text-zinc-300'"
                :aria-pressed="comment.liked_by_actor"
                @click="toggleCommentLike(comment)"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" :fill="comment.liked_by_actor ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path stroke-linejoin="round" d="M12 20.25s-7.5-4.6-9.17-9.4C1.6 7.3 3.86 4 7.13 4c2.03 0 3.48 1.1 4.87 2.9C13.39 5.1 14.84 4 16.87 4c3.27 0 5.53 3.3 4.3 6.85C19.5 15.65 12 20.25 12 20.25Z" /></svg>
                <span v-if="comment.likes_count">{{ comment.likes_count }}</span>
              </button>
            </div>
          </template>
        </div>

        <form class="border-t border-white/[0.07] p-3" style="padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);" @submit.prevent="submit">
          <p v-if="replyTo" class="mb-2 flex items-center justify-between text-xs text-zinc-400">
            {{ t('geels.replyingTo', { name: replyTo.channel?.name }) }}
            <button type="button" class="text-zinc-300 hover:text-white" @click="replyTo = null">{{ t('geels.cancel') }}</button>
          </p>
          <p v-if="!loggedIn" class="text-center text-sm text-zinc-400">
            <NuxtLink :to="localePath('/login')" class="font-semibold text-white underline">{{ t('geels.signInToComment') }}</NuxtLink>
          </p>
          <p v-else-if="!commentChannelID" class="text-center text-sm text-zinc-400">
            <NuxtLink :to="localePath('/create-channel')" class="font-semibold text-white underline">{{ t('geels.createChannelToComment') }}</NuxtLink>
          </p>
          <div v-else class="flex items-center gap-2">
            <input
              ref="inputRef"
              v-model="text"
              type="text"
              maxlength="2000"
              class="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/25"
              :placeholder="t('geels.addComment')"
            >
            <button type="submit" class="rounded-full bg-accent-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40" :disabled="!text.trim() || posting">
              {{ t('geels.post') }}
            </button>
          </div>
        </form>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVideoComments, likeComment, postComment, unlikeComment } from '~/app/service/comments'
import { formatGeelCount, type Geel } from '~/app/service/geels'
import { activeSubscriptionChannelID } from '~/app/service/subscriptions'
import { resolveAvatarUrl } from '~/app/utils/media'
import { getTimeAgo } from '~/app/utils/time'

const props = defineProps<{ geel: Geel | null; loggedIn: boolean }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const comments = ref<any[]>([])
const loading = ref(false)
const text = ref('')
const posting = ref(false)
const replyTo = ref<any | null>(null)
const commentChannelID = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const avatar = (comment: any) => resolveAvatarUrl(comment.channel?.avatar_url)

const load = async () => {
  if (!props.geel) return
  loading.value = true
  try {
    const data = await getVideoComments(props.geel.id, commentChannelID.value || undefined)
    comments.value = Array.isArray(data) ? [...data].reverse() : []
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.geel?.id, (id) => {
  replyTo.value = null
  text.value = ''
  comments.value = []
  if (id) {
    commentChannelID.value = activeSubscriptionChannelID()
    void load()
  }
}, { immediate: true })

const submit = async () => {
  const body = text.value.trim()
  if (!props.geel || !body || !commentChannelID.value) return
  posting.value = true
  try {
    await postComment(props.geel.id, commentChannelID.value, body, replyTo.value?.id)
    text.value = ''
    replyTo.value = null
    props.geel.comments_count += 1
    await load()
  } catch { /* keep the text */ } finally {
    posting.value = false
  }
}

const toggleCommentLike = async (comment: any) => {
  if (!commentChannelID.value) return
  const on = !comment.liked_by_actor
  comment.liked_by_actor = on
  comment.likes_count = Math.max(0, (comment.likes_count || 0) + (on ? 1 : -1))
  try {
    if (on) await likeComment(comment.id, commentChannelID.value)
    else await unlikeComment(comment.id, commentChannelID.value)
  } catch {
    comment.liked_by_actor = !on
    comment.likes_count = Math.max(0, comment.likes_count + (on ? -1 : 1))
  }
}
</script>

<style scoped>
.geel-comments {
  position: fixed;
  z-index: 91;
  display: flex;
  flex-direction: column;
  background: rgb(var(--gt-zinc-900, 24 24 27));
  color: #fff;
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.5);
}

@media (max-width: 767px) {
  .geel-comments {
    inset: auto 0 0 0;
    height: 72vh;
    border-radius: 18px 18px 0 0;
  }
}

@media (min-width: 768px) {
  .geel-comments {
    top: 0;
    right: 0;
    bottom: 0;
    width: min(420px, 100vw);
    border-left: 1px solid rgba(255, 255, 255, 0.07);
  }
}

.geel-sheet-enter-active, .geel-sheet-leave-active { transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1); }
@media (max-width: 767px) { .geel-sheet-enter-from, .geel-sheet-leave-to { transform: translateY(100%); } }
@media (min-width: 768px) { .geel-sheet-enter-from, .geel-sheet-leave-to { transform: translateX(100%); } }
.geel-sheet-backdrop-enter-active, .geel-sheet-backdrop-leave-active { transition: opacity 0.2s ease; }
.geel-sheet-backdrop-enter-from, .geel-sheet-backdrop-leave-to { opacity: 0; }
</style>
