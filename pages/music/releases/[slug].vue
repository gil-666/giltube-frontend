<template>
  <main v-if="data" class="release-page">
    <section class="release-hero">
      <div class="release-hero-inner">
        <img
          v-if="data.release.cover_url"
          class="release-cover"
          :src="imageVariantUrl(data.release.cover_url, 'lg')"
          :srcset="imageVariantSrcset(data.release.cover_url)"
          sizes="(max-width: 640px) 72vw, 320px"
          :alt="t('music.common.coverAlt', { title: data.release.title })"
        >
        <div v-else class="release-cover cover-placeholder">
          <svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" /></svg>
        </div>

        <div class="release-heading">
          <span class="release-kind">{{ data.release.release_type }}</span>
          <h1>{{ data.release.title }}</h1>
          <div class="release-byline">
            <AvatarFallback
              :src="resolveAvatarUrl(data.release.artist_avatar_url)"
              :name="data.release.artist_name"
              class="artist-avatar"
            />
            <NuxtLink :to="localePath(`/music/artists/${data.release.artist_slug}`)">
              {{ data.release.artist_name }}
            </NuxtLink>
            <span aria-hidden="true">·</span>
            <span>{{ releaseMeta }}</span>
          </div>
          <div v-if="releaseHasLosslessAudio" class="lossless-details">
            <img
              :src="hiResAudioLogo"
              class="hi-res-badge"
              :alt="t('music.release.hiResAudio')"
              :title="t('music.release.losslessAvailable')"
            >
            <div>
              <strong>{{ t('music.release.lossless') }}</strong>
              <span>{{ losslessSpecs }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="release-content">
      <div class="release-actions">
        <button
          type="button"
          class="primary-play"
          :title="isCurrentRelease && state.playing ? t('music.release.pause') : t('music.release.play')"
          :aria-label="isCurrentRelease && state.playing ? t('music.release.pause') : t('music.release.play')"
          :disabled="!data.tracks.length"
          @click="playRelease"
        >
          <svg v-if="isCurrentRelease && state.playing" viewBox="0 0 24 24"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" /></svg>
          <svg v-else viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z" /></svg>
        </button>
        <button
          type="button"
          class="icon-action"
          :class="{ active: state.shuffle }"
          :title="state.shuffle ? t('music.release.shuffleOff') : t('music.release.shuffleOn')"
          :aria-label="t('music.release.toggleShuffle')"
          @click="toggleShuffle"
        >
          <svg viewBox="0 0 24 24"><path d="M4 7h3c4 0 6 10 10 10h3M17 4l3 3-3 3M4 17h3c1.7 0 3-1.8 4.2-4M15 7h5M17 14l3 3-3 3" /></svg>
        </button>
        <button type="button" class="icon-action" :title="t('music.player.openQueue')" :aria-label="t('music.player.openPlaybackQueue')" @click="openPlayer('queue')">
          <svg viewBox="0 0 24 24"><path d="M4 6h12M4 11h12M4 16h8M18 14v6m-3-3h6" /></svg>
        </button>
      </div>

      <div class="track-heading" aria-hidden="true">
        <span>#</span>
        <span>{{ t('music.release.titleColumn') }}</span>
        <svg viewBox="0 0 24 24"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
      </div>

      <ol class="track-list">
        <li
          v-for="(track, index) in data.tracks"
          :key="track.id"
          :class="{ current: currentTrack?.id === track.id }"
        >
          <button type="button" class="track-main" @click="playTrack(index)">
            <span class="track-index">
              <svg v-if="currentTrack?.id === track.id && state.playing" viewBox="0 0 24 24"><path d="M5 9h2v6H5V9Zm4-4h2v14H9V5Zm4 3h2v8h-2V8Zm4-5h2v18h-2V3Z" /></svg>
              <span v-else>{{ track.track_number }}</span>
            </span>
            <span class="track-copy">
              <strong>{{ track.title }}</strong>
              <small>
                <span v-if="track.explicit" class="explicit-badge">E</span>
                {{ track.artist_name }}
              </small>
            </span>
          </button>
          <span class="video-slot">
            <NuxtLink
              v-if="track.official_video_id"
              :to="localePath(`/video/${track.official_video_id}`)"
              class="video-link"
              :title="t('music.release.watchVideo')"
            >
              <svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>
              <span>{{ t('music.common.video') }}</span>
            </NuxtLink>
          </span>
          <span class="track-duration">{{ formatDuration(track.duration_seconds) }}</span>
        </li>
      </ol>

      <footer class="release-rights">
        <p v-if="data.release.release_date">{{ formattedReleaseDate }}</p>
        <p v-if="data.release.label">{{ data.release.label }}</p>
        <p v-if="data.release.copyright_text">{{ data.release.copyright_text }}</p>
        <p v-if="data.release.phonogram_text">{{ data.release.phonogram_text }}</p>
        <p v-if="data.release.territories">{{ data.release.territories }}</p>
      </footer>
    </section>
  </main>

  <div v-else-if="pending" class="page-state">{{ t('music.release.loading') }}</div>
  <div v-else class="page-state error">{{ t('music.release.notFound') }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocalePath } from '#i18n'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import { getMusicRelease } from '~/app/service/music'
import { imageVariantSrcset, imageVariantUrl, resolveAvatarUrl } from '~/app/utils/media'
import hiResAudioLogo from '~/assets/hi-res-audio.png'

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()
const { state, currentTrack, loadQueue, selectTrack, toggle, toggleShuffle, openPlayer } = useMusicPlayer()
const { data, pending } = await useAsyncData(
  `music-release-${route.params.slug}`,
  () => getMusicRelease(String(route.params.slug)),
)

if (data.value) {
  const release = data.value.release
  const kind = release.release_type.charAt(0).toUpperCase() + release.release_type.slice(1)
  useMetaTags({
    title: `${release.title} by ${release.artist_name} - GilTube Music`,
    description: t('music.release.metaDescription', { title: release.title, artist: release.artist_name, kind }),
    image: imageVariantUrl(release.cover_url, 'lg'),
    imageAlt: t('music.release.imageAlt', { title: release.title, artist: release.artist_name }),
    imageWidth: release.cover_url ? 1280 : undefined,
    imageHeight: release.cover_url ? 1280 : undefined,
    url: localePath(`/music/releases/${release.slug}`),
    type: 'music.album',
  })
} else {
  useHead({ title: () => `${t('music.common.releases')} - GilTube Music` })
}

const totalDuration = computed(() =>
  (data.value?.tracks || []).reduce((total, track) => total + Number(track.duration_seconds || 0), 0),
)
const releaseMeta = computed(() => {
  if (!data.value) return ''
  const year = data.value.release.release_date ? new Date(data.value.release.release_date).getFullYear() : ''
  const count = data.value.tracks.length
  return [
    year,
    `${count} ${t(count === 1 ? 'music.common.track' : 'music.common.tracks')}`,
    formatLongDuration(totalDuration.value),
  ].filter(Boolean).join(' · ')
})
const formattedReleaseDate = computed(() => {
  const value = data.value?.release.release_date
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
})
const isCurrentRelease = computed(() =>
  Boolean(currentTrack.value && currentTrack.value.release_id === data.value?.release.id),
)
const releaseHasLosslessAudio = computed(() =>
  Boolean(
    data.value?.release.has_lossless_audio
    || data.value?.release.max_audio_bit_depth
    || data.value?.release.max_audio_sample_rate
    || data.value?.tracks.some(track => track.audio_lossless),
  ),
)
const losslessSpecs = computed(() => {
  if (!data.value) return ''
  const losslessTracks = data.value.tracks.filter(track => track.audio_lossless)
  const bitDepth = Number(data.value.release.max_audio_bit_depth || Math.max(
    0,
    ...losslessTracks.map(track => Number(track.audio_bit_depth || 0)),
  ))
  const sampleRate = Number(data.value.release.max_audio_sample_rate || Math.max(
    0,
    ...losslessTracks.map(track => Number(track.audio_sample_rate || 0)),
  ))
  const specs = []
  if (bitDepth) specs.push(`${bitDepth}-bit`)
  if (sampleRate) {
    const kilohertz = sampleRate / 1000
    specs.push(`${Number.isInteger(kilohertz) ? kilohertz : kilohertz.toFixed(1)} kHz`)
  }
  return specs.join(' · ') || t('music.release.losslessAvailable')
})

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(Number(seconds || 0)))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function formatLongDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  return minutes
    ? `${t('music.release.minutes', { count: minutes })} ${t('music.release.seconds', { count: remainder })}`
    : t('music.release.seconds', { count: remainder })
}

const playRelease = () => {
  if (!data.value?.tracks.length) return
  if (isCurrentRelease.value) {
    toggle()
    return
  }
  loadQueue(data.value.tracks, 0, true)
}

const playTrack = (index: number) => {
  if (!data.value) return
  if (currentTrack.value?.id === data.value.tracks[index]?.id) {
    toggle()
    return
  }
  if (isCurrentRelease.value) selectTrack(index, true)
  else loadQueue(data.value.tracks, index, true)
}

</script>

<style scoped>
.release-page {
  min-height: 100%;
  padding-bottom: 8rem;
  color: #f4f4f5;
  background: #09090b;
}

.release-hero {
  border-bottom: 1px solid #303036;
  background: #24252d;
}

.release-hero-inner,
.release-content {
  width: min(100%, 1440px);
  margin: 0 auto;
  padding-inline: clamp(1rem, 3vw, 3rem);
}

.release-hero-inner {
  display: grid;
  grid-template-columns: minmax(13rem, 20rem) minmax(0, 1fr);
  align-items: end;
  gap: clamp(1.5rem, 3vw, 3rem);
  padding-block: clamp(2rem, 5vw, 4rem);
}

.release-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  object-fit: cover;
  box-shadow: 0 22px 60px rgb(0 0 0 / 0.42);
}

.cover-placeholder {
  display: grid;
  place-items: center;
  background: #35363f;
}

.cover-placeholder svg {
  width: 34%;
  fill: none;
  stroke: #a1a1aa;
  stroke-width: 1.4;
}

.release-heading {
  min-width: 0;
}

.release-kind {
  display: block;
  margin-bottom: 0.65rem;
  color: #d4d4d8;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.release-heading h1 {
  max-width: 100%;
  overflow-wrap: anywhere;
  font-size: clamp(2.4rem, 6vw, 6rem);
  font-weight: 850;
  line-height: 0.98;
  letter-spacing: 0;
}

.release-byline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 1.5rem;
  color: #d4d4d8;
  font-size: 0.94rem;
}

.release-byline a {
  color: #fff;
  font-weight: 750;
}

.artist-avatar {
  width: 2rem;
  height: 2rem;
  flex: 0 0 2rem;
  border-radius: 50%;
}

.lossless-details {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1rem;
}

.lossless-details > div {
  display: grid;
  gap: 0.1rem;
}

.lossless-details strong {
  color: #f4f4f5;
  font-size: 0.78rem;
}

.lossless-details span {
  color: #a1a1aa;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.hi-res-badge {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 2px;
  object-fit: contain;
}

.release-content {
  padding-top: 2rem;
}

.release-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 4.5rem;
  margin-bottom: 1.4rem;
}

.primary-play,
.icon-action {
  display: grid;
  place-items: center;
  border: 0;
  color: #fff;
}

.primary-play {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: #dc3429;
}

.primary-play:disabled {
  opacity: 0.45;
}

.primary-play svg {
  width: 1.75rem;
  fill: currentColor;
}

.icon-action {
  width: 2.75rem;
  height: 2.75rem;
  background: transparent;
  color: #a1a1aa;
}

.icon-action:hover,
.icon-action.active {
  color: #fff;
}

.icon-action.active {
  color: #f87171;
}

.icon-action svg {
  width: 1.7rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.track-heading {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) 4.5rem;
  align-items: center;
  min-height: 2.6rem;
  padding-inline: 0.75rem;
  border-bottom: 1px solid #313136;
  color: #a1a1aa;
  font-size: 0.82rem;
}

.track-heading svg {
  width: 1.15rem;
  justify-self: end;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.track-list {
  margin: 0;
  padding: 0.55rem 0;
  list-style: none;
}

.track-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 4.5rem;
  align-items: center;
  min-height: 4.25rem;
  padding-inline: 0.75rem;
  border-radius: 6px;
}

.track-list li:hover,
.track-list li.current {
  background: #1b1b1f;
}

.track-main {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  align-items: center;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}

.track-index {
  display: grid;
  place-items: center;
  color: #a1a1aa;
}

.track-index svg {
  width: 1rem;
  fill: #f87171;
}

.track-copy {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.track-copy strong,
.track-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-copy strong {
  font-size: 1rem;
  font-weight: 650;
}

.track-copy small {
  color: #a1a1aa;
  font-size: 0.84rem;
}

.explicit-badge {
  display: inline-grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  margin-right: 0.3rem;
  border-radius: 2px;
  background: #a1a1aa;
  color: #18181b;
  font-size: 0.68rem;
  font-weight: 800;
}

.video-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-right: 1rem;
  color: #a1a1aa;
  font-size: 0.8rem;
}

.video-slot {
  display: flex;
  min-width: 0;
  justify-content: flex-end;
}

.video-link:hover {
  color: #fff;
}

.video-link svg {
  width: 1.2rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.track-duration {
  justify-self: end;
  color: #a1a1aa;
  font-variant-numeric: tabular-nums;
  font-size: 0.86rem;
}

.release-rights {
  padding: 2rem 0.75rem 0;
  border-top: 1px solid #242429;
  color: #71717a;
  font-size: 0.75rem;
  line-height: 1.55;
}

.page-state {
  min-height: 50vh;
  display: grid;
  place-items: center;
  color: #a1a1aa;
}

.page-state.error {
  color: #fca5a5;
}

@media (max-width: 640px) {
  .release-hero-inner {
    grid-template-columns: 1fr;
    align-items: start;
    padding-top: 1.5rem;
  }

  .release-cover {
    width: min(72vw, 18rem);
    justify-self: center;
  }

  .release-heading h1 {
    font-size: clamp(2.25rem, 13vw, 4rem);
  }

  .release-byline {
    margin-top: 1rem;
  }

  .release-actions {
    margin-bottom: 0.8rem;
  }

  .primary-play {
    width: 3.6rem;
    height: 3.6rem;
  }

  .track-list li {
    grid-template-columns: minmax(0, 1fr) 2.5rem 3.4rem;
  }

  .video-link {
    width: 2.5rem;
    margin: 0;
    justify-content: center;
  }

  .video-link span {
    display: none;
  }

  .track-heading {
    grid-template-columns: 2.5rem minmax(0, 1fr) 3.4rem;
  }
}
</style>
