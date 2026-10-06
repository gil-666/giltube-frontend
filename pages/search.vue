<template>
    <div class="mx-auto min-h-screen w-full max-w-[110rem] bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
        <!-- Search Header -->
        <div class="mb-8">
            <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ searchQuery }}</h1>
            <p v-if="totalResults > 0" class="mt-1 text-sm text-zinc-500">{{ t('searchPage.resultsCount', { count: totalResults }) }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="rounded-xl bg-white/[0.04] px-4 py-3 text-zinc-300">
            <p class="font-semibold">{{ t('searchPage.loadErrorTitle') }}</p>
            <p class="text-sm mt-1">{{ error }}</p>
        </div>

        <!-- No Results -->
        <div v-else-if="results.length === 0" class="py-16 text-center">
            <div class="mb-4 text-zinc-600">
                <svg class="mx-auto h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <p class="text-base text-zinc-200">{{ t('searchPage.noResults', { query: searchQuery }) }}</p>
            <p class="mt-1 text-sm text-zinc-500">{{ t('searchPage.tryDifferent') }}</p>
        </div>

        <!-- Results Grid/List -->
        <div v-else>
            <!-- Videos Section -->
            <div v-if="videos.length > 0" class="mb-12">
                <h2 class="mb-4 text-lg font-semibold tracking-tight">{{ t('searchPage.videos') }}</h2>
                <div class="motion-grid grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    <NuxtLink v-for="video in videos" :key="`video-${video.id}`" :to="localePath(`/video/${video.id}`)"
                        class="motion-card group block">
                        <div class="search-thumb relative mb-3 aspect-video overflow-hidden rounded-xl bg-zinc-900">
                            <img class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                v-bind="responsiveImage(video.thumbnail, '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw')" alt="" />
                        </div>
                        <p class="line-clamp-2 text-sm font-medium leading-5 text-zinc-100">{{ video.title }}</p>
                        <p class="mt-1 flex items-center gap-1 text-[13px] text-zinc-400">
                            <span class="truncate">{{ video.channel }}</span>
                            <VerifiedBadge v-if="video.verified" :verified="true" size="sm" />
                        </p>
                        <p class="text-[13px] text-zinc-500">{{ t('searchPage.views', { count: formatViews(video.views || 0) }) }}</p>
                    </NuxtLink>
                </div>
            </div>

            <!-- Movies Section -->
            <div v-if="movies.length > 0" class="mb-12">
                <h2 class="mb-4 text-lg font-semibold tracking-tight">{{ t('searchPage.movies') }}</h2>
                <div class="motion-grid grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    <NuxtLink
                        v-for="movie in movies"
                        :key="`movie-${movie.id}`"
                        :to="localePath(`/category/movies?movie_id=${movie.id}`)"
                        class="motion-card group block"
                    >
                        <div class="search-thumb relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
                            <img
                                v-if="mediaImage(movie)"
                                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                v-bind="responsiveImage(mediaImage(movie), '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw')"
                                :alt="movie.title"
                            />
                            <div v-else class="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                                {{ t('searchPage.movie') }}
                            </div>
                            
                            <span class="gt-media absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-100 backdrop-blur">
                                {{ t('searchPage.movie') }}
                            </span>
                            <span v-if="movie.year" class="gt-media absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-100">
                                {{ movie.year }}
                            </span>
                        </div>
                        <p class="mt-3 line-clamp-1 text-sm font-medium text-zinc-100">{{ movie.title }}</p>
                        <p class="mt-0.5 line-clamp-2 text-[13px] leading-5 text-zinc-500">{{ movie.description }}</p>
                    </NuxtLink>
                </div>
            </div>

            <!-- Series Section -->
            <div v-if="seriesResults.length > 0" class="mb-12">
                <h2 class="mb-4 text-lg font-semibold tracking-tight">{{ t('searchPage.series') }}</h2>
                <div class="motion-grid grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    <NuxtLink
                        v-for="series in seriesResults"
                        :key="`series-${series.id}`"
                        :to="localePath(`/category/series?series_id=${series.id}`)"
                        class="motion-card group block"
                    >
                        <div class="search-thumb relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
                            <img
                                v-if="mediaImage(series)"
                                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                v-bind="responsiveImage(mediaImage(series), '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw')"
                                :alt="series.title"
                            />
                            <div v-else class="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                                {{ t('searchPage.seriesOne') }}
                            </div>
                            
                            <span class="gt-media absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-100 backdrop-blur">
                                {{ t('searchPage.seriesOne') }}
                            </span>
                            <span class="gt-media absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-100">
                                {{ t('searchPage.seriesMeta', { seasons: series.seasons || 1, episodes: series.episodes || 0 }) }}
                            </span>
                        </div>
                        <p class="mt-3 line-clamp-1 text-sm font-medium text-zinc-100">{{ series.title }}</p>
                        <p class="mt-0.5 line-clamp-2 text-[13px] leading-5 text-zinc-500">{{ series.description }}</p>
                    </NuxtLink>
                </div>
            </div>

            <!-- Channels Section -->
            <div v-if="channels.length > 0">
                <h2 class="mb-4 text-lg font-semibold tracking-tight">{{ t('searchPage.channels') }}</h2>
                <div class="motion-grid space-y-1">
                    <NuxtLink v-for="channel in channels" :key="`channel-${channel.id}`" :to="localePath(`/channel/${channel.id}`)"
                        class="motion-card group -mx-2 flex items-center gap-4 rounded-xl p-2 transition hover:bg-white/[0.04]">
                        <!-- Channel Avatar -->
                        <AvatarFallback
                            :src="channel.avatar"
                            :name="channel.name"
                            class="h-14 w-14 flex-shrink-0 text-lg"
                        />

                        <!-- Channel Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1 flex-wrap">
                                <p class="whitespace-nowrap text-[15px] font-semibold text-zinc-100">{{
                                    channel.name }}</p>
                                <VerifiedBadge v-if="channel.verified" :verified="true" size="sm" class="flex-shrink-0" />
                            </div>
                            <p class="truncate text-sm text-zinc-500">{{ channel.description }}</p>
                        </div>
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="results.length > 0 && totalPages > 1" class="flex justify-center items-center gap-2 mt-12">
            <button @click="previousPage" :disabled="currentPage === 1"
                class="h-9 rounded-full bg-white/[0.07] px-4 text-sm font-medium transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40">
                {{ t('searchPage.previous') }}
            </button>

            <div class="flex gap-1">
                <button v-for="p in pageNumbers" :key="p" @click="goToPage(p)"
                    :class="['h-9 min-w-9 rounded-full px-3 text-sm font-medium transition', p === currentPage ? 'bg-white text-zinc-950' : 'text-zinc-300 hover:bg-white/[0.07]']" :aria-current="p === currentPage ? 'page' : undefined">
                    {{ p }}
                </button>
            </div>

            <button @click="nextPage" :disabled="currentPage === totalPages"
                class="h-9 rounded-full bg-white/[0.07] px-4 text-sm font-medium transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40">
                {{ t('searchPage.next') }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { responsiveImage } from '~/app/utils/media'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'

interface SearchResult {
    type: 'video' | 'channel' | 'movie' | 'series'
    id: string
    title: string
    name?: string
    description?: string
    channel?: string
    channel_id?: string
    avatar?: string
    thumbnail?: string
    poster_url?: string
    backdrop_url?: string
    year?: number
    seasons?: number
    episodes?: number
    views?: number
    verified?: boolean
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()

const searchQuery = ref('')
const results = ref<SearchResult[]>([])
const isLoading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalResults = ref(0)
const pageSize = 20

const videos = computed(() =>
    results.value.filter(r => r.type === 'video')
)

const channels = computed(() =>
    results.value.filter(r => r.type === 'channel')
)

const movies = computed(() =>
    results.value.filter(r => r.type === 'movie')
)

const seriesResults = computed(() =>
    results.value.filter(r => r.type === 'series')
)

const totalPages = computed(() =>
    Math.ceil(totalResults.value / pageSize)
)

const pageNumbers = computed(() => {
    const pages: number[] = []
    const maxPages = Math.min(5, totalPages.value)
    let startPage = Math.max(1, currentPage.value - Math.floor(maxPages / 2))
    let endPage = Math.min(totalPages.value, startPage + maxPages - 1)

    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
    }
    return pages
})

const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M'
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K'
    return views.toString()
}

const mediaImage = (item: SearchResult) => {
    return item.backdrop_url || item.poster_url || item.thumbnail || ''
}

const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    isLoading.value = true
    error.value = ''
    results.value = [] // Clear previous results

    try {
        const response = await fetch(
            `/api/v1/search?q=${encodeURIComponent(searchQuery.value)}&page=${currentPage.value}`
        )

        if (!response.ok) {
            throw new Error(t('searchPage.searchFailed'))
        }

        const data = await response.json()
        results.value = data.results || []
        totalResults.value = data.total || 0
    } catch (err) {
        error.value = err instanceof Error ? err.message : t('searchPage.genericError')
        results.value = []
    } finally {
        isLoading.value = false
    }
}

const goToPage = (page: number) => {
    currentPage.value = page
    performSearch()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const previousPage = () => {
    if (currentPage.value > 1) {
        goToPage(currentPage.value - 1)
    }
}

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        goToPage(currentPage.value + 1)
    }
}

onMounted(() => {
    searchQuery.value = route.query.q as string || ''
    currentPage.value = parseInt(route.query.page as string) || 1
    if (searchQuery.value) {
        performSearch()
    }
})

// Watch for query changes - trigger search when q or page params change
watch(
    () => route.query,
    (newQuery) => {
        const newSearchQuery = newQuery.q as string || ''
        const newPage = parseInt(newQuery.page as string) || 1
        
        searchQuery.value = newSearchQuery
        currentPage.value = newPage
        
        if (newSearchQuery) {
            performSearch()
        }
    },
    { deep: true }
)
</script>

<style scoped></style>
