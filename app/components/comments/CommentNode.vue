<template>
    <div
        :id="`comment-${comment.id}`"
        :class="[
            'w-full min-w-0 bg-zinc-900 p-3 rounded text-sm transition-all duration-300 scroll-mt-24',
            isHighlighted ? 'comment-highlight' : ''
        ]"
    >

        <div class="flex gap-2">
            <div @click="onNavigateToChannel(comment.channel.id)"
                class="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden cursor-pointer">
                <img v-if="comment.channel.avatar_url && !failedCommentAvatars[comment.id]"
                    :src="getCommentAvatarUrl(comment.channel.avatar_url)" :alt="comment.channel.name"
                    class="w-full h-full object-cover" @error="markAvatarFailed(comment.id)" />
                <span v-else class="text-xs font-bold">{{ comment.channel.name.charAt(0).toUpperCase() }}</span>
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                    <div @click="onNavigateToChannel(comment.channel.id)"
                        class="flex items-center gap-1 cursor-pointer hover:text-yellow-400 transition">
                        <p class="font-semibold text-xs">{{ comment.channel.name }}</p>
                        <VerifiedBadge :verified="comment.channel.verified" size="sm" />
                    </div>

                    <div class="flex items-center gap-2 flex-shrink-0">
                        <p class="text-xs text-gray-500">{{ getTimeAgo(comment.created_at) }}</p>
                        <button v-if="isCommentOwner(comment)" @click="onDeleteComment(comment.id)"
                            class="text-gray-400 hover:text-red-500 transition text-xs p-1"
                            :title="comment.parent_comment_id ? t('commentNode.deleteReply') : t('commentNode.deleteComment')">
                            X
                        </button>
                    </div>
                </div>

                <div v-if="parentComment" class="mt-1">
                    <button @click="onJumpToComment(comment.parent_comment_id || '')"
                        class="text-xs text-blue-400 hover:text-blue-300 transition">
                        @{{ parentComment.channel.name }}
                    </button>
                </div>

                <p class="comment-text text-gray-300 mt-1 text-xs break-words" v-html="renderCommentText(comment.text)"></p>

                <div class="mt-2 flex items-center gap-3">
                    <button
                        v-if="isLoggedIn"
                        @click="onToggleCommentLike(comment.id, !comment.liked_by_actor)"
                        :disabled="!!togglingCommentLikeMap[comment.id]"
                        class="text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="comment.liked_by_actor ? 'text-pink-400 hover:text-pink-300' : 'text-gray-400 hover:text-gray-200'"
                    >
                        {{ comment.liked_by_actor ? '♥' : '♡' }} {{ comment.likes_count || 0 }}
                    </button>
                    <button v-if="isLoggedIn" @click="isReplying = !isReplying"
                        class="text-xs text-blue-400 hover:text-blue-300 transition">
                        {{ isReplying ? t('video.cancel') : t('commentNode.reply') }}
                    </button>
                </div>

                <div v-if="isReplying" class="mt-2 bg-zinc-800 rounded p-2">
                    <textarea v-model="replyText" :placeholder="t('commentNode.writeReply')" maxlength="500" rows="2"
                        class="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500 resize-none" />
                    <div class="flex justify-end gap-2 mt-2">
                        <button @click="cancelReply"
                            class="px-2 py-1 text-xs text-gray-300 hover:text-white transition">
                            {{ t('video.cancel') }}
                        </button>
                        <button @click="submitReply" :disabled="!replyText.trim() || postingReplyMap[comment.id]"
                            class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ postingReplyMap[comment.id] ? t('video.posting') : t('commentNode.reply') }}
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <div v-if="hasReplies" class="mt-3 w-full min-w-0">
            <button
                @click="isRepliesExpanded = !isRepliesExpanded"
                class="text-xs text-gray-400 hover:text-gray-200 transition flex items-center gap-1"
            >
                <span>{{ isRepliesExpanded ? t('commentNode.hideReplies') : t('commentNode.showReplies') }}</span>
                <span class="text-gray-500">({{ repliesCount }})</span>
            </button>

            <Transition name="reply-thread">
                <div
                    v-show="isRepliesExpanded"
                    :class="[
                        'mt-3 w-full min-w-0 space-y-2 border-l border-zinc-700',
                        depth === 0 ? 'pl-3' : 'pl-0'
                    ]"
                >
                    <CommentNode
                        v-for="reply in comment.replies"
                        :key="reply.id"
                        class="block w-full min-w-0"
                        :comment="reply"
                        :depth="depth + 1"
                        :is-logged-in="isLoggedIn"
                        :failed-comment-avatars="failedCommentAvatars"
                        :posting-reply-map="postingReplyMap"
                        :comments-by-id="commentsById"
                        :highlighted-comment-id="highlightedCommentId"
                        :target-comment-id="targetCommentId"
                        :is-comment-owner="isCommentOwner"
                        :get-comment-avatar-url="getCommentAvatarUrl"
                        :get-time-ago="getTimeAgo"
                        :on-post-reply="onPostReply"
                        :on-delete-comment="onDeleteComment"
                        :on-toggle-comment-like="onToggleCommentLike"
                        :toggling-comment-like-map="togglingCommentLikeMap"
                        :on-navigate-to-channel="onNavigateToChannel"
                        :on-jump-to-comment="onJumpToComment"
                    />
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'CommentNode' })
const { t } = useI18n()

type ThreadComment = {
    id: string
    text: string
    created_at: string
    likes_count?: number
    liked_by_actor?: boolean
    parent_comment_id?: string | null
    channel: {
        id: string
        name: string
        avatar_url: string
        verified: boolean
    }
    replies?: ThreadComment[]
}

const props = defineProps<{
    comment: ThreadComment
    depth?: number
    isLoggedIn: boolean
    failedCommentAvatars: Record<string, boolean>
    postingReplyMap: Record<string, boolean>
    togglingCommentLikeMap: Record<string, boolean>
    commentsById: Record<string, ThreadComment>
    highlightedCommentId: string
    targetCommentId?: string
    isCommentOwner: (comment: ThreadComment) => boolean
    getCommentAvatarUrl: (avatarUrl: string) => string
    getTimeAgo: (value: string) => string
    onPostReply: (parentCommentId: string, text: string) => Promise<void>
    onDeleteComment: (commentId: string) => Promise<void>
    onToggleCommentLike: (commentId: string, nextLiked: boolean) => Promise<void>
    onNavigateToChannel: (channelId: string) => void
    onJumpToComment: (commentId: string) => void
}>()

const isReplying = ref(false)
const replyText = ref('')
const isRepliesExpanded = ref(false)
const depth = computed(() => props.depth ?? 0)

const hasReplies = computed(() => Array.isArray(props.comment.replies) && props.comment.replies.length > 0)
const repliesCount = computed(() => props.comment.replies?.length || 0)
const isHighlighted = computed(() => props.highlightedCommentId === props.comment.id)
const parentComment = computed(() => {
    if (!props.comment.parent_comment_id) return null
    return props.commentsById[props.comment.parent_comment_id] || null
})

const subtreeContainsTarget = (items: ThreadComment[], targetID: string): boolean => {
    for (const item of items || []) {
        if (item.id === targetID) return true
        if (Array.isArray(item.replies) && subtreeContainsTarget(item.replies, targetID)) {
            return true
        }
    }
    return false
}

const hasTargetInDescendants = computed(() => {
    if (!props.targetCommentId) return false
    return subtreeContainsTarget(props.comment.replies || [], props.targetCommentId)
})

watch(hasTargetInDescendants, (shouldExpand) => {
    if (shouldExpand) {
        isRepliesExpanded.value = true
    }
}, { immediate: true })

const markAvatarFailed = (commentID: string) => {
    props.failedCommentAvatars[commentID] = true
}

const escapeHTML = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

const renderCommentText = (value: string) => {
    const escaped = escapeHTML(value || '')
    const withLinks = escaped.replace(
        /\b((https?:\/\/|www\.)[^\s<]+)/gi,
        (rawUrl) => {
            const href = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
            // Render direct .gif links inline in comments
            if (/\.gif(\?|$)/i.test(href)) {
                return `<div class="comment-gif-wrap"><img src="${href}" loading="lazy" alt="gif" class="comment-gif" /></div>`
            }
            return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="comment-link">${rawUrl}</a>`
        }
    )

    return withLinks.replace(/\n/g, '<br>')
}

const cancelReply = () => {
    isReplying.value = false
    replyText.value = ''
}

const submitReply = async () => {
    const text = replyText.value.trim()
    if (!text) return

    await props.onPostReply(props.comment.id, text)
    cancelReply()
}
</script>

<style scoped>
.comment-highlight {
    animation: comment-pulse 1.8s ease-in-out 0s 1;
    box-shadow: 0 0 0 1px rgba(255, 0, 0, 0.644), 0 0 0 10px rgba(250, 204, 21, 0.08);
}

.reply-thread-enter-active,
.reply-thread-leave-active {
    transition: all 220ms ease;
    overflow: hidden;
}

.reply-thread-enter-from,
.reply-thread-leave-to {
    opacity: 0;
    transform: translateY(-4px);
    max-height: 0;
}

.reply-thread-enter-to,
.reply-thread-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 2000px;
}

.comment-text :deep(.comment-link) {
    color: rgb(96 165 250);
    text-decoration: underline;
    text-underline-offset: 2px;
    word-break: break-all;
}

.comment-text :deep(.comment-link:hover) {
    color: rgb(147 197 253);
}

.comment-gif-wrap {
    margin-top: 6px;
}

.comment-gif {
    display: block;
    max-width: min(100%, 320px);
    max-height: 300px;
    border-radius: 6px;
}

@keyframes comment-pulse {
    0% {
        transform: scale(1);
        background-color: rgb(24 24 27);
    }
    30% {
        transform: scale(1.01);
        background-color: rgb(39 39 42);
    }
    100% {
        transform: scale(1);
        background-color: rgb(24 24 27);
    }
}
</style>
