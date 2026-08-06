<template>
  <main class="music-home">
    <header class="music-header">
      <h1>Music</h1>
    </header>

    <div v-if="pending" class="loading-shelves" aria-label="Loading music">
      <section v-for="row in 3" :key="row">
        <span class="loading-heading" />
        <div>
          <span v-for="tile in 6" :key="tile" />
        </div>
      </section>
    </div>

    <div v-else-if="error" class="page-message">Unable to load music.</div>

    <div v-else-if="!releases.length && !artists.length" class="page-message">No music yet.</div>

    <template v-else>
      <section v-if="releases.length" class="music-shelf">
        <div class="shelf-header">
          <h2>New releases</h2>
          <div class="shelf-controls">
            <button type="button" title="Scroll left" aria-label="Scroll new releases left" @click="scrollShelf($event, -1)">
              <svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>
            </button>
            <button type="button" title="Scroll right" aria-label="Scroll new releases right" @click="scrollShelf($event, 1)">
              <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div class="shelf-scroll release-row">
          <MusicReleaseTile
            v-for="release in newReleases"
            :key="release.id"
            :release="release"
            :busy="loadingReleaseID === release.id"
            @play="playRelease"
          />
        </div>
      </section>

      <section v-if="artists.length" class="music-shelf">
        <div class="shelf-header">
          <h2>Artists</h2>
          <div class="shelf-controls">
            <button type="button" title="Scroll left" aria-label="Scroll artists left" @click="scrollShelf($event, -1)">
              <svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>
            </button>
            <button type="button" title="Scroll right" aria-label="Scroll artists right" @click="scrollShelf($event, 1)">
              <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div class="shelf-scroll artist-row">
          <NuxtLink
            v-for="artist in artists"
            :key="artist.id"
            :to="localePath(`/music/artists/${artist.slug}`)"
            class="artist-tile"
          >
            <AvatarFallback :src="resolveAvatarUrl(artist.avatar_url)" :name="artist.name" class="artist-avatar" />
            <strong>{{ artist.name }}</strong>
            <span v-if="artist.channel_name">{{ artist.channel_name }}</span>
            <span v-else>Artist</span>
          </NuxtLink>
        </div>
      </section>

      <section v-for="shelf in artistShelves" :key="shelf.artist.id" class="music-shelf">
        <div class="shelf-header">
          <NuxtLink :to="localePath(`/music/artists/${shelf.artist.slug}`)" class="shelf-title">
            <AvatarFallback :src="resolveAvatarUrl(shelf.artist.avatar_url)" :name="shelf.artist.name" class="shelf-artist-avatar" />
            <h2>{{ shelf.artist.name }}</h2>
            <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
          </NuxtLink>
          <div class="shelf-controls">
            <button type="button" :title="`Scroll ${shelf.artist.name} left`" :aria-label="`Scroll ${shelf.artist.name} releases left`" @click="scrollShelf($event, -1)">
              <svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>
            </button>
            <button type="button" :title="`Scroll ${shelf.artist.name} right`" :aria-label="`Scroll ${shelf.artist.name} releases right`" @click="scrollShelf($event, 1)">
              <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div class="shelf-scroll release-row">
          <MusicReleaseTile
            v-for="release in shelf.releases"
            :key="release.id"
            :release="release"
            :busy="loadingReleaseID === release.id"
            @play="playRelease"
          />
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocalePath } from '#i18n'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import MusicReleaseTile from '~/app/components/music/MusicReleaseTile.vue'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import { getMusicHome, getMusicRelease, type MusicArtist, type MusicRelease } from '~/app/service/music'
import { resolveAvatarUrl } from '~/app/utils/media'

const localePath = useLocalePath()
const { loadQueue } = useMusicPlayer()
const loadingReleaseID = ref('')
const { data, pending, error } = await useAsyncData('music-home', getMusicHome)
const releases = computed(() => data.value?.releases || [])
const artists = computed(() => data.value?.artists || [])
const newReleases = computed(() => releases.value.slice(0, 14))
const artistShelves = computed(() => {
  const artistsByID = new Map<string, MusicArtist>(artists.value.map(artist => [artist.id, artist]))
  const grouped = new Map<string, MusicRelease[]>()
  for (const release of releases.value) {
    const current = grouped.get(release.artist_id) || []
    current.push(release)
    grouped.set(release.artist_id, current)
  }
  return [...grouped.entries()]
    .map(([artistID, artistReleases]) => ({
      artist: artistsByID.get(artistID),
      releases: artistReleases,
    }))
    .filter((shelf): shelf is { artist: MusicArtist; releases: MusicRelease[] } => Boolean(shelf.artist))
})

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

const scrollShelf = (event: Event, direction: -1 | 1) => {
  const section = (event.currentTarget as HTMLElement).closest('.music-shelf')
  const row = section?.querySelector<HTMLElement>('.shelf-scroll')
  row?.scrollBy({ left: direction * Math.max(280, row.clientWidth * 0.78), behavior: 'smooth' })
}

useHead({ title: 'Music - GilTube' })
</script>

<style scoped>
.music-home {
  width: 100%;
  max-width: 96rem;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.music-header {
  padding: 4px 0 22px;
  border-bottom: 1px solid rgb(39 39 42);
}

.music-header h1 {
  color: white;
  font-size: 2rem;
  font-weight: 800;
}

.music-shelf {
  padding-top: 30px;
}

.shelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.shelf-header h2 {
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
}

.shelf-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.shelf-artist-avatar {
  width: 32px;
  height: 32px;
  flex: none;
  overflow: hidden;
  border-radius: 50%;
}

.shelf-title h2 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shelf-title > svg {
  width: 17px;
  color: rgb(113 113 122);
}

.shelf-controls {
  display: flex;
  flex: none;
  gap: 6px;
}

.shelf-controls button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid rgb(63 63 70);
  border-radius: 50%;
  color: rgb(212 212 216);
}

.shelf-controls button:hover {
  border-color: rgb(113 113 122);
  background: rgb(39 39 42);
  color: white;
}

.shelf-controls svg,
.shelf-title > svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.shelf-controls svg {
  width: 17px;
}

.shelf-scroll {
  display: flex;
  gap: 16px;
  margin: 0 -20px;
  padding: 0 20px 6px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.shelf-scroll::-webkit-scrollbar {
  display: none;
}

.artist-row {
  gap: 22px;
}

.artist-tile {
  width: clamp(7.5rem, 12vw, 9.5rem);
  min-width: clamp(7.5rem, 12vw, 9.5rem);
  scroll-snap-align: start;
  text-align: center;
}

.artist-avatar {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  background: rgb(39 39 42);
  box-shadow: inset 0 0 0 1px rgb(63 63 70);
}

.artist-tile strong,
.artist-tile span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-tile strong {
  margin-top: 10px;
  color: white;
  font-size: 0.9rem;
}

.artist-tile span {
  margin-top: 2px;
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.page-message {
  padding: 72px 0;
  color: rgb(161 161 170);
  text-align: center;
}

.loading-shelves section {
  padding-top: 32px;
}

.loading-heading,
.loading-shelves section > div > span {
  display: block;
  border-radius: 5px;
  background: rgb(39 39 42);
  animation: pulse 1.4s ease-in-out infinite;
}

.loading-heading {
  width: 9rem;
  height: 1.35rem;
  margin-bottom: 15px;
}

.loading-shelves section > div {
  display: flex;
  gap: 16px;
  overflow: hidden;
}

.loading-shelves section > div > span {
  width: 11rem;
  min-width: 11rem;
  aspect-ratio: 1;
}

@keyframes pulse {
  50% { opacity: 0.45; }
}

@media (max-width: 640px) {
  .music-home {
    padding: 18px 14px 110px;
  }

  .music-header {
    padding-bottom: 16px;
  }

  .music-header h1 {
    font-size: 1.75rem;
  }

  .music-shelf {
    padding-top: 25px;
  }

  .shelf-scroll {
    margin: 0 -14px;
    padding-right: 14px;
    padding-left: 14px;
  }

  .shelf-controls {
    display: none;
  }
}
</style>
