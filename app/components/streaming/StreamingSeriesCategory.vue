<template>
  <StreamingCategory
    title="Series"
    eyebrow="Featured Series"
    item-label="series"
    details-label="Episodes"
    empty-message="No series have been published yet."
    :loading="loading"
    :error="error"
    :groups="displayGroups"
    :featured-item="featuredItem"
    :featured-items="featuredItems"
    :active-featured-index="activeFeaturedIndex"
    :selected-item="selectedDisplaySeries"
    @open="openSeriesModal"
    @close="closeSeriesModal"
    @feature="setFeaturedIndex"
  >
    <template #details>
      <div v-if="selectedSeries" class="series-details-layout">
        <div class="series-poster-column">
          <div class="series-poster-frame">
            <img :src="getSeriesImage(selectedSeries, 'poster')" :alt="selectedSeries.title" class="series-poster-image" />
          </div>
        </div>
        <div class="series-details-main">
          <p class="series-synopsis">{{ selectedSeries.synopsis }}</p>
          <dl class="series-meta-grid">
            <div v-if="selectedSeries.directors?.length">
              <dt>Directors</dt>
              <dd>{{ selectedSeries.directors.join(', ') }}</dd>
            </div>
            <div v-if="selectedSeries.cast?.length">
              <dt>Cast</dt>
              <dd>{{ selectedSeries.cast.join(', ') }}</dd>
            </div>
          </dl>

          <div class="series-season-tabs">
            <button
              v-for="season in selectedSeriesSeasons"
              :key="season"
              type="button"
              :class="season === activeSeason ? 'series-season-tab is-active' : 'series-season-tab'"
              @click="activeSeason = season"
            >
              Season {{ season }}
            </button>
          </div>

          <div class="series-mobile-episodes-header">
            <p>Episodes</p>
            <div>
              <button type="button" aria-label="Scroll episodes left" @click="scrollEpisodes('left')">&#8249;</button>
              <button type="button" aria-label="Scroll episodes right" @click="scrollEpisodes('right')">&#8250;</button>
            </div>
          </div>

          <div ref="episodeRailElement" class="episode-grid">
            <NuxtLink
              v-for="episode in visibleSelectedEpisodes"
              :key="episode.id"
              :to="seriesWatchLink(selectedSeries, episode._index)"
              class="series-mobile-episode-card group"
            >
              <EpisodeThumb :episode="episode" :progress="episodeProgressPercent(episode)" :src="getEpisodeThumbnail(episode)" />
              <p class="series-episode-kicker">
                Season {{ episode.season_number }} | Episode {{ episode.episode_number }}
              </p>
              <h3 class="series-mobile-episode-title">{{ episode.title }}</h3>
            </NuxtLink>
          </div>

          <div class="series-desktop-episodes">
            <div class="series-episodes-heading">
              <h3>Episodes</h3>
              <p>
                Season {{ activeSeason }} / {{ visibleSelectedEpisodes.length }} episode{{ visibleSelectedEpisodes.length === 1 ? '' : 's' }}
              </p>
            </div>
            <div>
              <NuxtLink
                v-for="episode in visibleSelectedEpisodes"
                :key="episode.id"
                :to="seriesWatchLink(selectedSeries, episode._index)"
                class="series-episode-row group"
              >
                <div class="series-episode-number">{{ episode.episode_number }}</div>
                <EpisodeThumb :episode="episode" :progress="episodeProgressPercent(episode)" :src="getEpisodeThumbnail(episode)" compact />
                <div class="series-episode-copy">
                  <h4>{{ episode.title }}</h4>
                  <p>{{ episode.synopsis || '' }}</p>
                </div>
                <div class="series-episode-duration">{{ episodeDurationLabel(episode) }}</div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </StreamingCategory>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import StreamingCategory from './StreamingCategory.vue'
import { listSeries, getSeries, getSeriesWatchProgress } from '~/app/service/series'
import { getWatchProgressMap } from '~/app/service/videos'
import { useMetaTags } from '~/app/composables/useMetaTags'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

const loading = ref(false)
const error = ref('')
const allSeries = ref([])
const groups = ref([])
const featuredItems = ref([])
const activeFeaturedIndex = ref(0)
const selectedSeries = ref(null)
const selectedEpisodes = ref([])
const activeSeason = ref(1)
const selectedSeriesProgress = ref(null)
const selectedEpisodeProgressByVideoId = ref({})
const episodeRailElement = ref(null)
let featuredHeroTimer = null

const withBaseUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const getThumbnailUrl = (video) => withBaseUrl(video?.thumbnail_url || '/videos/placeholder-thumbnail.jpg')
const getEpisodeThumbnail = (episode) => getThumbnailUrl(episode?.video)

const normalizeSeriesDetail = (data) => {
  if (!data) return null
  if (!data.series) return data
  return { ...data.series, episodes: data.episodes || data.series.episodes || [] }
}

const getSeriesImage = (series, type) => {
  const preferred = type === 'backdrop' ? series?.backdrop_url : series?.poster_url
  if (preferred) return withBaseUrl(preferred)
  return getThumbnailUrl((series?.first_episode || series?.episodes?.[0])?.video)
}

const seriesWatchLink = (series, index = 0) => {
  const episode = series?.episodes?.[index] || series?.first_episode
  if (!episode) return localePath('/category/series')
  return localePath(`/video/${episode.video_id}?series_id=${series.id}&index=${index}`)
}

const selectedSeriesSeasons = computed(() => [...new Set(selectedEpisodes.value.map((episode) => episode.season_number))].sort((a, b) => a - b))
const visibleSelectedEpisodes = computed(() => selectedEpisodes.value.filter((episode) => episode.season_number === activeSeason.value))
const selectedSeriesPrimaryEpisode = computed(() => visibleSelectedEpisodes.value[0] || selectedEpisodes.value[0] || null)
const selectedSeriesResumeLink = computed(() => {
  const progress = selectedSeriesProgress.value
  if (!progress?.episode || !progress?.progress || !selectedSeries.value) return ''
  const index = selectedEpisodes.value.findIndex((episode) => episode.video_id === progress.episode.video_id)
  return localePath(`/video/${progress.episode.video_id}?series_id=${selectedSeries.value.id}&index=${index >= 0 ? index : 0}`)
})

const toDisplaySeries = (series) => {
  if (!series) return null
  const primaryEpisode = series === selectedSeries.value ? selectedSeriesPrimaryEpisode.value : (series.first_episode || series.episodes?.[0])
  const primaryIndex = series === selectedSeries.value ? (primaryEpisode?._index || 0) : 0
  return {
    ...series,
    posterUrl: getSeriesImage(series, 'poster'),
    backdropUrl: getSeriesImage(series, 'backdrop'),
    synopsis: series.synopsis || 'Watch full series on GilTube.',
    meta: [
      `${series.seasons || 1} season${series.seasons === 1 ? '' : 's'}`,
      `${series.episode_count || series.episodes?.length || 0} episode${(series.episode_count || series.episodes?.length || 0) === 1 ? '' : 's'}`,
    ],
    cardMeta: `${series.episode_count || series.episodes?.length || 0} episodes`,
    primaryLink: primaryEpisode ? seriesWatchLink(series, primaryIndex) : '',
    primaryLabel: 'Play',
    resumeLink: series === selectedSeries.value ? selectedSeriesResumeLink.value : '',
  }
}

const displayGroups = computed(() => groups.value.map((group) => ({ genre: group.genre, items: group.series.map(toDisplaySeries) })))
const featuredItem = computed(() => toDisplaySeries(featuredItems.value[activeFeaturedIndex.value] || null))
const selectedDisplaySeries = computed(() => toDisplaySeries(selectedSeries.value))

const watchProgressPercent = (progress) => {
  const position = Number(progress?.position_seconds || 0)
  const duration = Number(progress?.duration_seconds || 0)
  if (progress?.completed || !Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return 0
  if (position <= 5 || position / duration >= 0.9) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

const episodeVideoId = (episode) => episode?.video_id || episode?.video?.id || ''
const episodeProgressPercent = (episode) => watchProgressPercent(selectedEpisodeProgressByVideoId.value[episodeVideoId(episode)])

const mergeEpisodeProgress = (progressMap) => {
  selectedEpisodeProgressByVideoId.value = {
    ...selectedEpisodeProgressByVideoId.value,
    ...(progressMap || {}),
  }
}

const loadEpisodeProgress = async () => {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
  if (!userId || !selectedEpisodes.value.length) return
  try {
    const data = await getWatchProgressMap(selectedEpisodes.value.map(episodeVideoId))
    mergeEpisodeProgress(data?.progress)
  } catch (err) {
    console.error('Failed to load episode progress:', err)
  }
}

const episodeDurationLabel = (episode) => {
  const seconds = Number(episode?.duration_seconds ?? episode?.duration ?? episode?.video?.duration_seconds ?? episode?.video?.duration ?? 0)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  return `${Math.max(1, Math.round(seconds / 60))}m`
}

const scrollEpisodes = (direction) => {
  const rail = episodeRailElement.value
  if (!rail) return
  rail.scrollBy({ left: (direction === 'right' ? 1 : -1) * Math.max(rail.clientWidth * 0.85, 220), behavior: 'smooth' })
}

const findLoadedSeries = (id) => allSeries.value.find((series) => series.id === id || series.slug === id) || null

const openSeriesModal = async (series, updateRoute = true) => {
  if (!series) return
  let detail = series
  if (!series.episodes) {
    try {
      detail = normalizeSeriesDetail(await getSeries(series.id || series.slug)) || series
    } catch {
      detail = series
    }
  }
  selectedSeries.value = detail
  if (updateRoute && route.query.series_id !== detail.id) {
    await router.push({ query: { ...route.query, series_id: detail.id } })
  }
}

const closeSeriesModal = async () => {
  selectedSeries.value = null
  const { series_id: _seriesId, ...query } = route.query
  await router.push({ query })
}

const setFeaturedIndex = (index) => {
  activeFeaturedIndex.value = Math.max(0, Math.min(index, featuredItems.value.length - 1))
  startFeaturedHeroTimer()
}

const stopFeaturedHeroTimer = () => {
  if (featuredHeroTimer) clearInterval(featuredHeroTimer)
  featuredHeroTimer = null
}

const startFeaturedHeroTimer = () => {
  stopFeaturedHeroTimer()
  if (featuredItems.value.length <= 1) return
  featuredHeroTimer = setInterval(() => {
    activeFeaturedIndex.value = (activeFeaturedIndex.value + 1) % featuredItems.value.length
  }, 7000)
}

const updateMetaTags = () => {
  const series = selectedSeries.value || featuredItems.value[0]
  useMetaTags({
    title: series?.title ? `${series.title} - GilTube Series` : 'Series - GilTube',
    description: series?.synopsis || 'Episodic GilTube series organized by genre.',
    image: series ? getSeriesImage(series, 'backdrop') || getSeriesImage(series, 'poster') : undefined,
    url: route.fullPath,
    type: series ? 'video.tv_show' : undefined,
  })
}

const loadSeriesCategory = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await listSeries()
    const details = await Promise.all((data.series || []).map(async (item) => {
      try {
        const detail = normalizeSeriesDetail(await getSeries(item.id))
        return { ...item, ...detail, episodes: detail?.episodes || [] }
      } catch {
        return { ...item, episodes: [] }
      }
    }))
    allSeries.value = details
    const byId = new Map(details.map((item) => [item.id, item]))
    groups.value = (data.genres || []).map((group) => ({
      ...group,
      series: (group.series || []).map((item) => byId.get(item.id) || item),
    }))
    const featured = details.filter((item) => item.is_featured).slice(0, 5)
    if (!featured.length && data.featured) featured.push(byId.get(data.featured.id) || data.featured)
    if (!featured.length && details[0]) featured.push(details[0])
    featuredItems.value = featured.slice(0, 5)
    activeFeaturedIndex.value = 0
    startFeaturedHeroTimer()

    const requestedSeriesId = typeof route.query.series_id === 'string' ? route.query.series_id : ''
    if (requestedSeriesId) {
      await openSeriesModal(findLoadedSeries(requestedSeriesId) || normalizeSeriesDetail(await getSeries(requestedSeriesId)), false)
    }
    updateMetaTags()
  } catch (err) {
    console.error('Failed to load series:', err)
    error.value = 'Failed to load series.'
    stopFeaturedHeroTimer()
  } finally {
    loading.value = false
  }
}

watch(selectedSeries, async (series) => {
  selectedEpisodes.value = (series?.episodes || []).map((episode, index) => ({ ...episode, _index: index }))
  activeSeason.value = selectedEpisodes.value[0]?.season_number || 1
  selectedSeriesProgress.value = null
  selectedEpisodeProgressByVideoId.value = {}
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
  if (series?.id && userId) {
    try {
      const data = await getSeriesWatchProgress(series.id)
      selectedSeriesProgress.value = data?.progress && data?.episode ? data : null
      if (data?.progress?.video_id) {
        mergeEpisodeProgress({ [data.progress.video_id]: data.progress })
      }
    } catch (err) {
      console.error('Failed to load series watch progress:', err)
    }
    await loadEpisodeProgress()
  }
  updateMetaTags()
})

watch(() => route.query.series_id, async (seriesId) => {
  const id = typeof seriesId === 'string' ? seriesId : ''
  if (!id) {
    selectedSeries.value = null
    updateMetaTags()
    return
  }
  if (selectedSeries.value?.id === id) return
  await openSeriesModal(findLoadedSeries(id) || normalizeSeriesDetail(await getSeries(id)), false)
})

onMounted(async () => {
  await loadSeriesCategory()
  await nextTick()
})

onUnmounted(stopFeaturedHeroTimer)

const EpisodeThumb = defineComponent({
  props: {
    episode: { type: Object, required: true },
    src: { type: String, required: true },
    progress: { type: Number, default: 0 },
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('div', { class: 'series-episode-thumb' }, [
      h('img', { src: props.src, alt: props.episode.title, class: 'series-episode-thumb-image' }),
      props.progress > 0 ? h('div', { class: 'series-episode-progress' }, [
        h('div', { style: { width: `${props.progress}%` } }),
      ]) : null,
      h('div', { class: props.compact ? 'series-episode-play-overlay is-compact' : 'series-episode-play-overlay' }, [
        h('span', {}, [
          h('svg', { fill: 'currentColor', viewBox: '0 0 20 20', 'aria-hidden': 'true' }, [
            h('path', { d: 'M6 4.75v10.5a.75.75 0 0 0 1.16.63l8-5.25a.75.75 0 0 0 0-1.26l-8-5.25A.75.75 0 0 0 6 4.75Z' }),
          ]),
        ]),
      ]),
    ])
  },
})
</script>

<style scoped>
.series-details-layout {
  display: grid;
  gap: 1.5rem;
}

.series-poster-column {
  display: none;
}

.series-poster-frame {
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 0.25rem;
  background: rgb(24 24 27);
}

.series-poster-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.series-details-main {
  min-width: 0;
}

.series-synopsis {
  display: none;
  max-width: 48rem;
  color: rgb(212 212 216);
  font-size: 0.875rem;
  line-height: 1.65;
}

.series-meta-grid {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.25rem;
  color: rgb(161 161 170);
  font-size: 0.875rem;
}

.series-meta-grid dt {
  color: rgb(113 113 122);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.series-meta-grid dd {
  margin-top: 0.25rem;
  color: rgb(228 228 231);
}

.series-season-tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.series-season-tab {
  flex: 0 0 auto;
  border: 0;
  border-radius: 0.25rem;
  background: rgb(24 24 27);
  color: #fff;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 800;
}

.series-season-tab.is-active {
  background: #fff;
  color: #000;
}

.series-mobile-episodes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
}

.series-mobile-episodes-header p,
.series-episode-kicker {
  color: rgb(113 113 122);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.series-mobile-episodes-header button {
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1.125rem;
}

.episode-grid {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.75rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  touch-action: pan-x pan-y;
}

.episode-grid::-webkit-scrollbar {
  display: none;
}

.series-mobile-episode-card {
  width: 18rem;
  flex: 0 0 18rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.75rem;
  text-decoration: none;
  color: #fff;
}

.series-mobile-episode-title {
  display: -webkit-box;
  margin-top: 0.25rem;
  overflow: hidden;
  color: #fff;
  font-weight: 700;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.series-desktop-episodes {
  display: none;
  margin-top: 1.25rem;
}

.series-episodes-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.series-episodes-heading h3 {
  font-size: 1.5rem;
  font-weight: 800;
}

.series-episodes-heading p {
  color: rgb(113 113 122);
  font-size: 0.875rem;
}

.series-episode-row {
  display: grid;
  grid-template-columns: 3rem 11rem minmax(0, 1fr) 3.5rem;
  align-items: center;
  gap: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 0.75rem;
  color: #fff;
  text-decoration: none;
  transition: background-color 160ms ease;
}

.series-episode-row:first-child {
  border-top-color: transparent;
}

.series-episode-row:hover {
  background: rgba(255, 255, 255, 0.1);
}

.series-episode-number {
  color: rgb(161 161 170);
  text-align: center;
  font-size: 1.5rem;
  font-weight: 300;
}

.series-episode-copy {
  min-width: 0;
}

.series-episode-copy h4 {
  overflow: hidden;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.series-episode-copy p {
  display: -webkit-box;
  margin-top: 0.25rem;
  overflow: hidden;
  color: rgb(161 161 170);
  font-size: 0.875rem;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.series-episode-duration {
  color: rgb(212 212 216);
  text-align: right;
  font-size: 0.875rem;
  font-weight: 700;
}

:global(.series-episode-thumb) {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.125rem;
  background: rgb(24 24 27);
}

:global(.series-episode-thumb-image) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 180ms ease;
}

:global(.series-episode-row:hover .series-episode-thumb-image),
:global(.series-mobile-episode-card:hover .series-episode-thumb-image) {
  transform: scale(1.03);
}

:global(.series-episode-progress) {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  height: 0.35rem;
  background: rgba(0, 0, 0, 0.55);
}

:global(.series-episode-progress > div) {
  min-width: 0.75rem;
  height: 100%;
  background: rgb(220 38 38);
}

:global(.series-episode-play-overlay) {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
}

:global(.series-episode-play-overlay.is-compact) {
  display: none;
}

:global(.series-episode-play-overlay span) {
  display: flex;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
}

:global(.series-episode-play-overlay svg) {
  width: 1rem;
  height: 1rem;
  margin-left: 0.125rem;
}

@media (min-width: 768px) {
  .series-synopsis {
    display: block;
  }

  .series-mobile-episodes-header,
  .episode-grid {
    display: none;
  }

  .series-desktop-episodes {
    display: block;
  }

  :global(.series-episode-row:hover .series-episode-play-overlay.is-compact) {
    display: flex;
  }
}

@media (min-width: 640px) {
  .series-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .series-details-layout {
    grid-template-columns: 12rem minmax(0, 1fr);
  }

  .series-poster-column {
    display: block;
  }
}
</style>
