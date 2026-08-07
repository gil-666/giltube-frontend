<template>
  <main class="music-search-page">
    <header class="page-header">
      <h1>{{ t('music.search.title') }}</h1>
      <form class="search-box" role="search" @submit.prevent="submitSearch">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
        </svg>
        <input v-model="searchText" type="search" :placeholder="t('music.search.placeholder')" autocomplete="off">
        <button v-if="searchText" type="button" :aria-label="t('music.search.clear')" @click="clearSearch">X</button>
      </form>
    </header>

    <div v-if="pending" class="page-state">{{ t('music.common.loading') }}</div>
    <div v-else-if="error" class="page-state">{{ t('music.common.loadError') }}</div>

    <template v-else>
      <section v-if="matchingArtists.length" class="result-section">
        <h2>{{ query ? t('music.common.artists') : t('music.search.browseArtists') }}</h2>
        <div class="artist-grid">
          <NuxtLink v-for="artist in matchingArtists" :key="artist.id" :to="localePath(`/music/artists/${artist.slug}`)" class="artist-result">
            <AvatarFallback :src="resolveAvatarUrl(artist.avatar_url)" :name="artist.name" class="artist-avatar" />
            <span>
              <strong>{{ artist.name }}</strong>
              <small>{{ artist.channel_name || t('music.common.artist') }}</small>
            </span>
          </NuxtLink>
        </div>
      </section>

      <section v-if="matchingReleases.length" class="result-section">
        <h2>{{ query ? t('music.common.releases') : t('music.search.browseReleases') }}</h2>
        <div class="release-grid">
          <MusicReleaseTile
            v-for="release in matchingReleases"
            :key="release.id"
            :release="release"
            :busy="loadingReleaseID === release.id"
            @play="playRelease"
          />
        </div>
      </section>

      <div v-if="query && !matchingArtists.length && !matchingReleases.length" class="page-state">
        {{ t('music.search.noResults', { query: searchText.trim() }) }}
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocalePath } from '#i18n'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import MusicReleaseTile from '~/app/components/music/MusicReleaseTile.vue'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import { getMusicHome, getMusicRelease, type MusicRelease } from '~/app/service/music'
import { resolveAvatarUrl } from '~/app/utils/media'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()
const { loadQueue } = useMusicPlayer()
const searchText = ref(String(route.query.q || ''))
const loadingReleaseID = ref('')
const { data, pending, error } = await useAsyncData('music-search-catalog', getMusicHome)

const query = computed(() => searchText.value.trim().toLocaleLowerCase())
const artists = computed(() => data.value?.artists || [])
const releases = computed(() => data.value?.releases || [])
const matchingArtists = computed(() => {
  if (!query.value) return artists.value
  return artists.value.filter(artist => `${artist.name} ${artist.channel_name}`.toLocaleLowerCase().includes(query.value))
})
const matchingReleases = computed(() => {
  if (!query.value) return releases.value
  return releases.value.filter(release => `${release.title} ${release.artist_name} ${release.release_type}`.toLocaleLowerCase().includes(query.value))
})

watch(() => route.query.q, value => {
  const next = String(value || '')
  if (next !== searchText.value) searchText.value = next
})

const submitSearch = () => {
  const q = searchText.value.trim()
  router.replace(q ? localePath(`/music/search?q=${encodeURIComponent(q)}`) : localePath('/music/search'))
}

const clearSearch = () => {
  searchText.value = ''
  router.replace(localePath('/music/search'))
}

const playRelease = async (release: MusicRelease) => {
  if (loadingReleaseID.value) return
  loadingReleaseID.value = release.id
  try {
    const result = await getMusicRelease(release.slug)
    if (result.tracks.length) loadQueue(result.tracks, 0, true)
  } finally {
    loadingReleaseID.value = ''
  }
}

useHead({ title: () => t('music.search.pageTitle') })
</script>

<style scoped>
.music-search-page {
  width: 100%;
  max-width: 96rem;
  min-height: 100%;
  margin: 0 auto;
  padding: 26px 24px 100px;
}

.page-header {
  display: grid;
  grid-template-columns: minmax(10rem, 0.55fr) minmax(18rem, 1.45fr);
  align-items: center;
  gap: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgb(39 39 42);
}

h1 { font-size: 2rem; font-weight: 850; }
h2 { margin-bottom: 16px; font-size: 1.2rem; font-weight: 800; }

.search-box {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  border: 1px solid rgb(63 63 70);
  border-radius: 8px;
  background: rgb(24 24 27);
  padding: 0 14px;
}

.search-box:focus-within { border-color: rgb(239 68 68); }
.search-box svg { width: 20px; flex: none; fill: none; stroke: rgb(161 161 170); stroke-width: 2; stroke-linecap: round; }
.search-box input { width: 100%; min-width: 0; height: 48px; background: transparent; color: white; outline: none; }
.search-box input::-webkit-search-cancel-button { display: none; }
.search-box button { width: 30px; height: 30px; flex: none; border-radius: 50%; color: rgb(161 161 170); }
.search-box button:hover { background: rgb(63 63 70); color: white; }

.result-section { padding-top: 28px; }
.artist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: 10px; }
.artist-result { display: flex; min-width: 0; align-items: center; gap: 12px; border-radius: 6px; padding: 10px; transition: background 150ms ease; }
.artist-result:hover { background: rgb(24 24 27); }
.artist-avatar { width: 58px; height: 58px; flex: none; overflow: hidden; border-radius: 50%; }
.artist-result span { min-width: 0; }
.artist-result strong, .artist-result small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.artist-result strong { font-size: 0.95rem; }
.artist-result small { margin-top: 3px; color: rgb(161 161 170); font-size: 0.78rem; }
.release-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr)); gap: 24px 16px; }
.release-grid :deep(.release-tile) { width: 100%; min-width: 0; }
.page-state { padding: 56px 0; color: rgb(161 161 170); text-align: center; }

@media (max-width: 700px) {
  .music-search-page { padding: 18px 16px 86px; }
  .page-header { grid-template-columns: 1fr; gap: 14px; padding-bottom: 18px; }
  h1 { font-size: 1.65rem; }
  .artist-grid { grid-template-columns: 1fr 1fr; }
  .artist-avatar { width: 48px; height: 48px; }
  .release-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 14px; }
}
</style>
