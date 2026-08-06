<template>
  <main class="music-library-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">GilTube Music</p>
        <h1>Library</h1>
      </div>
      <button v-if="queue.length" type="button" class="clear-button" @click="clearQueue">Clear queue</button>
    </header>

    <section class="library-section">
      <div class="section-heading">
        <h2>Listening queue</h2>
        <button v-if="currentTrack" type="button" @click="openPlayer('queue')">Open player</button>
      </div>

      <div v-if="!queue.length" class="empty-queue">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" /></svg>
        <p>Play an album to start a queue.</p>
        <NuxtLink :to="localePath('/music')">Browse music</NuxtLink>
      </div>

      <div v-else class="queue-list">
        <button
          v-for="(track, index) in queue"
          :key="`${track.id}-${index}`"
          type="button"
          class="queue-row"
          :class="{ current: index === state.currentIndex }"
          @click="playTrack(index)"
        >
          <span class="track-number">{{ index === state.currentIndex && state.playing ? '▶' : index + 1 }}</span>
          <img v-if="track.cover_url" :src="imageVariantUrl(track.cover_url, 'sm')" :alt="`${track.release_title} cover`">
          <span v-else class="cover-fallback" aria-hidden="true">♪</span>
          <span class="track-copy">
            <strong>{{ track.title }}</strong>
            <small>{{ track.artist_name }} · {{ track.release_title }}</small>
          </span>
          <span v-if="track.explicit" class="explicit">E</span>
          <span class="duration">{{ formatDuration(track.duration_seconds) }}</span>
        </button>
      </div>
    </section>

    <section v-if="queueReleases.length" class="library-section">
      <h2>Albums in your queue</h2>
      <div class="release-grid">
        <MusicReleaseTile
          v-for="release in queueReleases"
          :key="release.id"
          :release="release"
          :busy="loadingReleaseID === release.id"
          @play="playRelease"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocalePath } from '#i18n'
import MusicReleaseTile from '~/app/components/music/MusicReleaseTile.vue'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import { getMusicHome, getMusicRelease, type MusicRelease } from '~/app/service/music'
import { imageVariantUrl } from '~/app/utils/media'

const localePath = useLocalePath()
const { state, currentTrack, selectTrack, clearQueue, openPlayer, loadQueue } = useMusicPlayer()
const loadingReleaseID = ref('')
const { data } = await useAsyncData('music-library-catalog', getMusicHome)
const queue = computed(() => state.value.queue)
const queueReleaseIDs = computed(() => new Set(queue.value.map(track => track.release_id)))
const queueReleases = computed(() => (data.value?.releases || []).filter(release => queueReleaseIDs.value.has(release.id)))

const playTrack = (index: number) => {
  selectTrack(index, true)
  openPlayer('player')
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

const formatDuration = (seconds: number) => {
  const value = Math.max(0, Math.round(Number(seconds) || 0))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}

useHead({ title: 'Library - GilTube Music' })
</script>

<style scoped>
.music-library-page { width: 100%; max-width: 86rem; min-height: 100%; margin: 0 auto; padding: 26px 24px 100px; }
.page-header { display: flex; align-items: end; justify-content: space-between; gap: 18px; padding-bottom: 24px; border-bottom: 1px solid rgb(39 39 42); }
.eyebrow { margin-bottom: 3px; color: rgb(248 113 113); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
h1 { font-size: 2rem; font-weight: 850; }
h2 { font-size: 1.2rem; font-weight: 800; }
.clear-button, .section-heading button { border: 1px solid rgb(63 63 70); border-radius: 6px; padding: 8px 12px; color: rgb(212 212 216); font-size: 0.8rem; font-weight: 700; }
.clear-button:hover, .section-heading button:hover { background: rgb(39 39 42); color: white; }
.library-section { padding-top: 28px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.empty-queue { display: flex; min-height: 12rem; flex-direction: column; align-items: center; justify-content: center; gap: 9px; border: 1px solid rgb(39 39 42); border-radius: 8px; color: rgb(161 161 170); }
.empty-queue svg { width: 34px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.empty-queue a { color: rgb(248 113 113); font-size: 0.85rem; font-weight: 750; }
.queue-list { overflow: hidden; border: 1px solid rgb(39 39 42); border-radius: 8px; }
.queue-row { display: grid; width: 100%; min-width: 0; grid-template-columns: 2rem 48px minmax(0, 1fr) auto 3.2rem; align-items: center; gap: 12px; padding: 9px 14px; text-align: left; transition: background 140ms ease; }
.queue-row + .queue-row { border-top: 1px solid rgb(39 39 42); }
.queue-row:hover, .queue-row.current { background: rgb(24 24 27); }
.queue-row.current .track-number, .queue-row.current strong { color: rgb(248 113 113); }
.queue-row img, .cover-fallback { width: 48px; height: 48px; border-radius: 4px; object-fit: cover; }
.cover-fallback { display: grid; place-items: center; background: rgb(39 39 42); color: rgb(113 113 122); }
.track-number { color: rgb(113 113 122); text-align: center; font-size: 0.75rem; }
.track-copy { min-width: 0; }
.track-copy strong, .track-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.track-copy strong { font-size: 0.9rem; }
.track-copy small { margin-top: 3px; color: rgb(161 161 170); font-size: 0.76rem; }
.explicit { border-radius: 3px; background: rgb(82 82 91); padding: 1px 4px; color: rgb(228 228 231); font-size: 0.62rem; font-weight: 800; }
.duration { color: rgb(161 161 170); font-size: 0.78rem; font-variant-numeric: tabular-nums; }
.release-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr)); gap: 24px 16px; margin-top: 16px; }
.release-grid :deep(.release-tile) { width: 100%; min-width: 0; }

@media (max-width: 700px) {
  .music-library-page { padding: 18px 16px 86px; }
  h1 { font-size: 1.65rem; }
  .queue-row { grid-template-columns: 1.3rem 44px minmax(0, 1fr) auto; gap: 9px; padding: 8px 10px; }
  .queue-row img, .cover-fallback { width: 44px; height: 44px; }
  .duration { display: none; }
  .release-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 14px; }
}
</style>
