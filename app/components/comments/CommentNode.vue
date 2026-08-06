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

                <div class="mt-1 space-y-1.5">
                    <p class="comment-text text-gray-300 text-xs break-words" v-html="renderCommentText(comment.text)"></p>

                    <div v-if="videoPreviewList.length > 0" class="space-y-1.5">
                        <NuxtLink
                            v-for="preview in videoPreviewList"
                            :key="preview.id"
                            :to="localePath(`/video/${preview.id}`)"
                            class="group flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/80 p-2 transition hover:bg-zinc-700/80"
                        >
                            <img
                                v-if="getVideoThumbnailUrl(preview.thumbnail_url)"
                                :src="getVideoThumbnailUrl(preview.thumbnail_url)"
                                :alt="preview.title"
                                class="h-10 w-16 rounded object-cover flex-shrink-0"
                            />
                            <div
                                v-else
                                class="h-10 w-16 rounded bg-zinc-700 text-[10px] font-semibold text-zinc-300 flex items-center justify-center flex-shrink-0"
                            >
                                VIDEO
                            </div>

                            <div class="min-w-0 flex-1">
                                <p class="text-[11px] font-semibold text-zinc-100 truncate group-hover:text-yellow-300 transition">
                                    {{ preview.title }}
                                </p>
                                <p class="text-[10px] text-zinc-400 truncate">
                                    {{ preview.channel_name || t('app.myChannel') }}
                                </p>
                            </div>
                        </NuxtLink>

                        <p v-if="moreVideoPreviewCount > 0" class="text-[10px] text-zinc-500">
                            +{{ moreVideoPreviewCount }} more linked {{ moreVideoPreviewCount === 1 ? 'video' : 'videos' }}
                        </p>
                    </div>
                </div>

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
import { useLocalePath } from '#i18n'
import { apiBaseURL } from '~/app/service/client'
import { getVideo } from '~/app/service/videos'

defineOptions({ name: 'CommentNode' })
const { t } = useI18n()
const localePath = useLocalePath()

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

type CommentVideoPreview = {
    id: string
    title: string
    thumbnail_url?: string
    channel_name?: string
}

const videoPreviewCache = useState<Record<string, CommentVideoPreview | null>>('comment-video-preview-cache', () => ({}))
const videoPreviewLoading = useState<Record<string, boolean>>('comment-video-preview-loading', () => ({}))

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

const extractVideoIdFromLink = (rawUrl: string) => {
    const href = rawUrl.startsWith('http')
        ? rawUrl
        : rawUrl.startsWith('/')
            ? `${siteOrigin}${rawUrl}`
            : `https://${rawUrl}`

    try {
        const parsed = new URL(href)
        const segments = parsed.pathname.split('/').filter(Boolean)
        if (segments.length >= 2 && segments[0] === 'video') {
            return segments[1] || ''
        }

        if (segments.length >= 3 && segments[1] === 'video') {
            return segments[2] || ''
        }

        return ''
    } catch {
        return ''
    }
}

const escapeHTML = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

const siteOrigin = (() => {
    try {
        const siteUrl = useRuntimeConfig().public.siteUrl || 'https://giltube.gilservers.com'
        return new URL(siteUrl).origin
    } catch {
        return 'https://giltube.gilservers.com'
    }
})()

const resolveCommentLink = (rawUrl: string) => {
    const href = rawUrl.startsWith('http')
        ? rawUrl
        : rawUrl.startsWith('/')
            ? `${siteOrigin}${rawUrl}`
            : `https://${rawUrl}`

    try {
        const parsed = new URL(href)
        const isGiltubeHost = /(^|\.)giltube\.gilservers\.com$/i.test(parsed.hostname)
        const isInternalVideoLink = isGiltubeHost && /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(video|live)\/[A-Za-z0-9-]+/i.test(parsed.pathname)

        if (isInternalVideoLink) {
            return {
                href: localePath(parsed.pathname) + parsed.search + parsed.hash,
                internal: true,
            }
        }

        return { href, internal: false }
    } catch {
        return { href, internal: false }
    }
}

const renderCommentText = (value: string) => {
    const escaped = escapeHTML(value || '')
    const withLinks = escaped.replace(
        /\b((https?:\/\/|www\.)[^\s<]+|\/(?:video|live)\/[A-Za-z0-9-]+(?:\?[^\s<]*)?)/gi,
        (rawUrl) => {
            const { href, internal } = resolveCommentLink(rawUrl)
            // Render direct .gif links inline in comments
            if (/\.gif(\?|$)/i.test(href)) {
                return `<div class="comment-gif-wrap"><img src="${href}" loading="lazy" alt="gif" class="comment-gif" /></div>`
            }
            return internal
                ? `<span class="comment-link-hidden" aria-hidden="true"></span>`
                : `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="comment-link">${rawUrl}</a>`
        }
    )

    return withLinks.replace(/\n/g, '<br>')
}

const internalVideoIds = computed(() => {
    const ids = new Set<string>()
    const text = props.comment.text || ''
    const matches = text.match(/\b((https?:\/\/|www\.)[^\s<]+|\/(?:[a-z]{2}(?:-[a-z]{2})\/)?video\/[A-Za-z0-9-]+(?:\?[^\s<]*)?)/gi) || []

    for (const rawUrl of matches) {
        const videoID = extractVideoIdFromLink(rawUrl)
        if (videoID) {
            ids.add(videoID)
        }
    }

    return Array.from(ids)
})

const videoPreviewList = computed(() => {
    return internalVideoIds.value
        .map((id) => videoPreviewCache.value[id])
        .filter((preview): preview is CommentVideoPreview => !!preview)
        .slice(0, 2)
})

const moreVideoPreviewCount = computed(() => {
    const totalResolved = internalVideoIds.value.length
    return Math.max(0, totalResolved - videoPreviewList.value.length)
})

const getVideoThumbnailUrl = (thumbnailUrl?: string) => {
    if (!thumbnailUrl) return ''
    if (/^https?:\/\//i.test(thumbnailUrl)) {
        return thumbnailUrl
    }

    if (thumbnailUrl.startsWith('/api/v1/')) {
        return thumbnailUrl.replace(/^\/api\/v1/, '')
    }

    if (thumbnailUrl.startsWith('/videos/')) {
        return thumbnailUrl
    }

    if (thumbnailUrl.startsWith('videos/')) {
        return `/${thumbnailUrl}`
    }

    return thumbnailUrl.startsWith('/') ? thumbnailUrl : `/${thumbnailUrl}`
}

watch(
    internalVideoIds,
    async (ids) => {
        const missingIds = ids.filter((id) => !videoPreviewCache.value[id] && !videoPreviewLoading.value[id])
        if (missingIds.length === 0) return

        await Promise.all(missingIds.map(async (id) => {
            videoPreviewLoading.value[id] = true
            try {
                const video = await getVideo(id)
                videoPreviewCache.value[id] = {
                    id: video.id,
                    title: video.title || 'Untitled video',
                    thumbnail_url: video.thumbnail_url || '',
                    channel_name: video.channel?.name || '',
                }
            } catch {
                videoPreviewCache.value[id] = null
            } finally {
                videoPreviewLoading.value[id] = false
            }
        }))
    },
    { immediate: true }
)

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

.comment-text :deep(.comment-link-internal) {
    font-weight: 600;
}

.comment-link-hidden {
    display: none;
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
