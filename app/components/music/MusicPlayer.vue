<template>
  <section class="music-player" :aria-label="t('music.player.player')">
    <div class="player-main">
      <img
        v-if="currentTrack?.cover_url"
        :src="imageVariantUrl(currentTrack.cover_url, 'sm')"
        :srcset="imageVariantSrcset(currentTrack.cover_url)"
        sizes="72px"
        class="player-cover"
        alt=""
      >
      <div v-else class="player-cover player-cover-empty" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" /></svg>
      </div>

      <div class="track-copy">
        <strong>{{ currentTrack?.title || t('music.player.selectTrack') }}</strong>
        <span>{{ currentTrack?.artist_name || '' }}</span>
      </div>

      <div class="transport">
        <button type="button" :title="t('music.player.previous')" :aria-label="t('music.player.previous')" :disabled="tracks.length < 2" @click="playPrevious">
          <svg viewBox="0 0 24 24"><path d="M6 5v14M18 6l-9 6 9 6V6Z" /></svg>
        </button>
        <button type="button" class="play-button" :title="playing ? t('music.player.pause') : t('music.player.play')" :aria-label="playing ? t('music.player.pause') : t('music.player.play')" :disabled="!currentTrack" @click="togglePlayback">
          <svg v-if="playing" viewBox="0 0 24 24"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" /></svg>
          <svg v-else viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z" /></svg>
        </button>
        <button type="button" :title="t('music.player.next')" :aria-label="t('music.player.next')" :disabled="tracks.length < 2" @click="playNext">
          <svg viewBox="0 0 24 24"><path d="M18 5v14M6 6l9 6-9 6V6Z" /></svg>
        </button>
      </div>

      <div class="modes">
        <button type="button" :class="{ active: state.shuffle }" :title="state.shuffle ? t('music.player.shuffleOff') : t('music.player.shuffleOn')" :aria-label="t('music.player.toggleShuffle')" @click="toggleShuffle">
          <svg viewBox="0 0 24 24"><path d="M4 7h3c4 0 6 10 10 10h3M17 4l3 3-3 3M4 17h3c1.7 0 3-1.8 4.2-4M15 7h5M17 14l3 3-3 3" /></svg>
        </button>
        <button type="button" :class="{ active: state.repeat !== 'off' }" :title="repeatTitle" :aria-label="t('music.player.changeRepeat')" @click="cycleRepeat">
          <svg viewBox="0 0 24 24"><path d="m17 2 3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3m13-3v2a4 4 0 0 1-4 4H4" /></svg>
          <span v-if="state.repeat === 'one'">1</span>
        </button>
        <button type="button" :title="t('music.player.openQueue')" :aria-label="t('music.player.openPlaybackQueue')" @click="openPlayer('queue')">
          <svg viewBox="0 0 24 24"><path d="M4 6h12M4 11h12M4 16h8M18 14v6m-3-3h6" /></svg>
        </button>
      </div>

      <div class="timeline">
        <span>{{ formatTime(currentTime) }}</span>
        <input
          :value="currentTime"
          type="range"
          min="0"
          :max="duration || 0"
          step="0.1"
          :aria-label="t('music.player.trackPosition')"
          :disabled="!duration"
          @input="seekFromInput"
        >
        <span>{{ formatTime(duration) }}</span>
      </div>

      <div class="volume">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm12.5.5a4 4 0 0 1 0 5M19.5 7a7 7 0 0 1 0 10" /></svg>
        <input :value="volume" type="range" min="0" max="1" step="0.05" :aria-label="t('music.player.volume')" @input="setVolumeFromInput">
      </div>
    </div>

    <p v-if="queueNotice" class="queue-notice" role="status">{{ queueNotice }}</p>
    <ol v-if="tracks.length" class="queue">
      <li v-for="(track, index) in tracks" :key="track.id">
        <button
          type="button"
          class="queue-track"
          :class="{ active: index === currentIndex }"
          @click="selectTrack(index, true)"
        >
          <span class="queue-number">{{ index === currentIndex && playing ? t('music.player.current') : track.track_number }}</span>
          <span class="queue-title">{{ track.title }}</span>
          <span v-if="track.explicit" class="explicit">E</span>
          <span class="queue-duration">{{ formatTime(track.duration_seconds) }}</span>
        </button>
        <div class="queue-actions">
          <button type="button" :title="t('music.player.playNext')" :aria-label="t('music.player.playTrackNext')" @click="queueTrackNext(track)">
            <svg viewBox="0 0 24 24"><path d="M5 6v12l9-6-9-6Zm13 0v12M15 8h6M18 5v6" /></svg>
          </button>
          <button type="button" :title="t('music.player.addQueue')" :aria-label="t('music.player.addTrackQueue')" @click="appendTrack(track)">
            <svg viewBox="0 0 24 24"><path d="M4 6h10M4 11h10M4 16h7M18 13v7m-3.5-3.5h7" /></svg>
          </button>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import type { MusicTrack } from '~/app/service/music'
import { imageVariantSrcset, imageVariantUrl } from '~/app/utils/media'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  tracks: MusicTrack[]
  initialTrackId?: string
}>(), {
  initialTrackId: '',
})

const {
  state,
  currentTrack: globalTrack,
  loadQueue,
  addToQueue,
  playNext: queueNext,
  toggle,
  next,
  previous,
  seek,
  setVolume,
  toggleShuffle,
  cycleRepeat,
  openPlayer,
} = useMusicPlayer()
const queueNotice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const initialIndex = computed(() => Math.max(0, props.tracks.findIndex(track => track.id === props.initialTrackId)))
const currentIndex = computed(() => {
  const index = props.tracks.findIndex(track => track.id === globalTrack.value?.id)
  return index >= 0 ? index : initialIndex.value
})
const queueIsActive = computed(() => props.tracks.some(track => track.id === globalTrack.value?.id))
const currentTrack = computed(() => queueIsActive.value ? globalTrack.value : props.tracks[initialIndex.value] || null)
const currentTime = computed(() => queueIsActive.value ? state.value.currentTime : 0)
const duration = computed(() => queueIsActive.value
  ? state.value.duration
  : Number(currentTrack.value?.duration_seconds || 0))
const volume = computed(() => state.value.volume)
const playing = computed(() => queueIsActive.value && state.value.playing)
const repeatTitle = computed(() => {
  if (state.value.repeat === 'one') return t('music.player.repeatTrack')
  if (state.value.repeat === 'all') return t('music.player.repeatQueue')
  return t('music.player.repeatOff')
})

const showQueueNotice = (message: string) => {
  queueNotice.value = message
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { queueNotice.value = '' }, 1800)
}

const selectTrack = (index: number, autoplay = false) => {
  if (props.tracks[index]) loadQueue(props.tracks, index, autoplay)
}

const togglePlayback = () => {
  if (queueIsActive.value) toggle()
  else loadQueue(props.tracks, currentIndex.value, true)
}

const playPrevious = () => {
  if (queueIsActive.value) previous()
  else selectTrack((currentIndex.value - 1 + props.tracks.length) % props.tracks.length, true)
}

const playNext = () => {
  if (queueIsActive.value) next()
  else selectTrack((currentIndex.value + 1) % props.tracks.length, true)
}

const seekFromInput = (event: Event) => {
  if (!queueIsActive.value) return
  seek(Number((event.target as HTMLInputElement).value))
}

const setVolumeFromInput = (event: Event) => {
  setVolume(Number((event.target as HTMLInputElement).value))
}

const queueTrackNext = (track: MusicTrack) => {
  queueNext(track)
  showQueueNotice(t('music.player.willPlayNext', { title: track.title }))
}

const appendTrack = (track: MusicTrack) => {
  showQueueNotice(addToQueue(track)
    ? t('music.player.addedQueue', { title: track.title })
    : t('music.player.alreadyQueued', { title: track.title }))
}

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
</script>

<style scoped>
.music-player {
  overflow: hidden;
  border: 1px solid rgb(63 63 70);
  border-radius: 8px;
  background: rgb(9 9 11);
}

.player-main {
  display: grid;
  grid-template-columns: 72px minmax(10rem, 1fr) auto auto minmax(14rem, 2fr) minmax(8rem, 0.7fr);
  align-items: center;
  gap: 16px;
  padding: 14px;
}

.player-cover {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 6px;
  background: rgb(39 39 42);
}

.player-cover-empty {
  display: grid;
  place-items: center;
}

.player-cover-empty svg {
  width: 28px;
  stroke: rgb(161 161 170);
  fill: none;
  stroke-width: 1.6;
}

.track-copy {
  min-width: 0;
}

.track-copy strong,
.track-copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-copy strong {
  color: white;
}

.track-copy span {
  margin-top: 4px;
  color: rgb(161 161 170);
  font-size: 0.875rem;
}

.transport,
.modes,
.timeline,
.volume {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transport button,
.modes button,
.queue-actions button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 50%;
  color: white;
}

.transport button:hover:not(:disabled),
.modes button:hover,
.queue-actions button:hover {
  background: rgb(39 39 42);
}

.transport button:disabled {
  opacity: 0.35;
}

.transport .play-button {
  width: 44px;
  height: 44px;
  background: white;
  color: black;
}

.transport svg,
.modes svg,
.queue-actions svg,
.volume svg {
  width: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.transport .play-button svg {
  fill: currentColor;
  stroke: none;
}

.modes {
  justify-content: center;
  gap: 2px;
}

.modes button {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: rgb(161 161 170);
}

.modes button.active {
  color: rgb(248 113 113);
}

.modes button span {
  position: absolute;
  font-size: 0.55rem;
  font-weight: 900;
}

.timeline span {
  width: 2.6rem;
  flex: none;
  color: rgb(161 161 170);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.timeline input,
.volume input {
  min-width: 0;
  flex: 1;
  accent-color: rgb(239 68 68);
}

.volume svg {
  flex: none;
}

.queue {
  max-height: 19rem;
  overflow-y: auto;
  border-top: 1px solid rgb(39 39 42);
}

.queue li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.queue-track {
  display: grid;
  width: 100%;
  grid-template-columns: 3rem minmax(0, 1fr) auto 3rem;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  color: rgb(212 212 216);
  text-align: left;
}

.queue-track:hover,
.queue-track.active {
  background: rgb(24 24 27);
  color: white;
}

.queue-actions {
  display: flex;
  gap: 2px;
  padding-right: 10px;
}

.queue-actions button {
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  color: rgb(161 161 170);
}

.queue-actions svg {
  width: 17px;
}

.queue-notice {
  border-top: 1px solid rgb(39 39 42);
  background: rgb(24 24 27);
  padding: 8px 14px;
  color: rgb(212 212 216);
  font-size: 0.75rem;
}

.queue-number,
.queue-duration {
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.queue-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explicit {
  border-radius: 2px;
  background: rgb(82 82 91);
  padding: 1px 4px;
  font-size: 0.65rem;
  font-weight: 800;
}

@media (max-width: 900px) {
  .player-main {
    grid-template-columns: 56px minmax(0, 1fr) auto;
  }

  .player-cover {
    width: 56px;
    height: 56px;
  }

  .timeline {
    grid-column: 1 / -1;
  }

  .modes {
    grid-column: 1 / -1;
  }

  .volume {
    display: none;
  }
}
</style>
