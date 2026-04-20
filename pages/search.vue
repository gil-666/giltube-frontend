<template>
    <div class="min-h-screen bg-black text-white p-6">
        <!-- Search Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold mb-4">Search Results</h1>
            <div class="flex items-center gap-2 text-gray-400">
                <span>Showing results for: <span class="text-white font-semibold">{{ searchQuery }}</span></span>
                <span v-if="totalResults > 0">({{ totalResults }} results)</span>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            <p class="font-semibold">Error loading results</p>
            <p class="text-sm mt-1">{{ error }}</p>
        </div>

        <!-- No Results -->
        <div v-else-if="results.length === 0" class="text-center py-12">
            <div class="text-gray-400 mb-4">
                <svg class="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <p class="text-lg">No results found for "<span class="font-semibold">{{ searchQuery }}</span>"</p>
            <p class="text-sm text-gray-500 mt-2">Try a different search term</p>
        </div>

        <!-- Results Grid/List -->
        <div v-else>
            <!-- Videos Section -->
            <div v-if="videos.length > 0" class="mb-12">
                <h2 class="text-2xl font-bold mb-6">Videos</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <NuxtLink v-for="video in videos" :key="`video-${video.id}`" :to="`/video/${video.id}`"
                        class="group cursor-pointer">
                        <div class="bg-zinc-800 rounded-lg overflow-hidden h-40 mb-3 relative">
                            <img class="w-full h-full object-cover group-hover:opacity-75 transition"
                                :src="video.thumbnail" :alt="video.title" />
                        </div>
                        <p class="font-semibold line-clamp-2 group-hover:text-red-500 transition">{{ video.title }}</p>
                        <div class="flex items-center text-zinc-400 gap-1 mt-1">
                            <NuxtLink :to="`/channel/${video.channel_id}`" class="text-sm text-gray-400 hover:text-yellow-400 transition">{{ video.channel }}</NuxtLink>
                            <VerifiedBadge v-if="video.verified" :verified="true" size="sm" />
                        </div>

                        <div class="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{{ formatViews(video.views) }} views</span>
                        </div>
                    </NuxtLink>
                </div>
            </div>

            <!-- Channels Section -->
            <div v-if="channels.length > 0">
                <h2 class="text-2xl font-bold mb-6">Channels</h2>
                <div class="space-y-4">
                    <NuxtLink v-for="channel in channels" :key="`channel-${channel.id}`" :to="`/channel/${channel.id}`"
                        class="flex items-center gap-4 p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition group">
                        <!-- Channel Avatar -->
                        <div
                            class="w-16 h-16 bg-zinc-700 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold overflow-hidden">
                            <img v-if="channel.avatar" :src="channel.avatar" :alt="channel.name"
                                class="w-full h-full object-cover" />
                            <span v-else class="text-white">{{ channel.name}}</span>
                        </div>

                        <!-- Channel Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1 flex-wrap">
                                <p class="text-lg font-semibold group-hover:text-red-500 transition whitespace-nowrap">{{
                                    channel.name }}</p>
                                <VerifiedBadge v-if="channel.verified" :verified="true" size="sm" class="flex-shrink-0" />
                            </div>
                            <p class="text-sm text-gray-400 line-clamp-1">Channel</p>
                        </div>
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="results.length > 0 && totalPages > 1" class="flex justify-center items-center gap-2 mt-12">
            <button @click="previousPage" :disabled="currentPage === 1"
                class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition">
                Previous
            </button>

            <div class="flex gap-1">
                <button v-for="p in pageNumbers" :key="p" @click="goToPage(p)"
                    :class="['px-3 py-2 rounded transition', p === currentPage ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 hover:bg-zinc-700']">
                    {{ p }}
                </button>
            </div>

            <button @click="nextPage" :disabled="currentPage === totalPages"
                class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition">
                Next
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VerifiedBadge from '~/app/components/VerifiedBadge.vue'

interface SearchResult {
    type: 'video' | 'channel'
    id: string
    title: string
    name?: string
    channel?: string
    channel_id?: string
    avatar?: string
    thumbnail?: string
    views?: number
    verified?: boolean
}

const route = useRoute()
const router = useRouter()
const baseUrl = '/api/'

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

const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    isLoading.value = true
    error.value = ''

    try {
        const response = await fetch(
            `/api/v1/search?q=${encodeURIComponent(searchQuery.value)}&page=${currentPage.value}`
        )

        if (!response.ok) {
            throw new Error('Search failed')
        }

        const data = await response.json()
        results.value = data.results || []
        totalResults.value = data.total || 0
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'An error occurred'
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

// Watch for query changes
watch(() => route.query, () => {
    searchQuery.value = route.query.q as string || ''
    currentPage.value = parseInt(route.query.page as string) || 1
    if (searchQuery.value) {
        performSearch()
    }
})

import { watch } from 'vue'
</script>

<style scoped></style>
