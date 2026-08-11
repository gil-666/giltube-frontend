<template>
  <div>
    <audio
      ref="audioElement"
      :src="selectedAudioURL ? resolveMediaUrl(selectedAudioURL) : ''"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @loadstart="onAudioLoadStart"
      @waiting="onAudioWaiting"
      @stalled="onAudioWaiting"
      @canplay="onAudioReady"
      @playing="onAudioReady"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @error="onAudioError"
    />

    <Transition name="music-player-rise">
      <aside
        v-if="currentTrack"
        class="global-music-player"
        :aria-label="t('music.player.nowPlaying')"
        @click.capture="suppressClickAfterSwipe"
        @touchstart.passive="startMiniPlayerSwipe"
        @touchend.passive="finishMiniPlayerSwipe"
      >
        <button type="button" class="mini-track" :title="t('music.player.open')" @click="openDefaultPlayer">
          <img v-if="currentTrack.cover_url" :src="imageVariantUrl(currentTrack.cover_url, 'sm')" alt="">
          <div v-else class="mini-cover-empty" />
          <span class="track-copy">
            <strong>{{ currentTrack.title }}</strong>
            <small>{{ currentTrack.artist_name }}</small>
          </span>
        </button>
        <div class="mini-controls">
          <button type="button" :title="t('music.player.previous')" :aria-label="t('music.player.previous')" @click="playPrevious">
            <svg viewBox="0 0 24 24"><path d="M6 5v14M18 6l-9 6 9 6V6Z" /></svg>
          </button>
          <button type="button" class="play" :title="state.playing ? t('music.player.pause') : t('music.player.play')" :aria-label="state.playing ? t('music.player.pause') : t('music.player.play')" @click="togglePlayback">
            <svg v-if="state.playing" viewBox="0 0 24 24"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" /></svg>
            <svg v-else viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z" /></svg>
          </button>
          <button type="button" :title="t('music.player.next')" :aria-label="t('music.player.next')" @click="playNext">
            <svg viewBox="0 0 24 24"><path d="M18 5v14M6 6l9 6-9 6V6Z" /></svg>
          </button>
          <button type="button" :title="t('music.player.openQueue')" :aria-label="t('music.player.openQueue')" @click="openPlayer('queue')">
            <svg viewBox="0 0 24 24"><path d="M4 6h12M4 11h12M4 16h8M18 14v6m-3-3h6" /></svg>
          </button>
          <button type="button" :title="t('music.player.close')" :aria-label="t('music.player.close')" @click="clearQueue">
            <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div class="mini-timeline">
          <input :value="state.currentTime" type="range" min="0" :max="state.duration || 0" step="0.1" :aria-label="t('music.player.trackPosition')" @input="seekFromInput">
        </div>
      </aside>
    </Transition>

    <Teleport to="body">
      <Transition name="music-panel-fade">
        <div v-if="currentTrack && state.panelOpen" class="music-panel-backdrop" @click.self="closePanel">
          <section
            class="music-panel"
            :class="{ 'panel-gesture-active': panelGestureActive }"
            :style="panelGestureStyle"
            role="dialog"
            aria-modal="true"
            :aria-label="t('music.player.player')"
            @click.capture="suppressClickAfterSwipe"
          >
            <button type="button" class="panel-close" :title="t('common.close')" :aria-label="t('music.player.closeWindow')" @click="closePanel">
              <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>

            <div
              class="panel-layout"
              :class="[`panel-${state.panelView}`, { 'panel-swipe-active': panelHorizontalGesture }]"
              :style="panelTrackStyle"
              @touchstart.passive="startPanelSwipe"
              @touchmove.passive="movePanelSwipe"
              @touchend.passive="finishPanelSwipe"
              @touchcancel.passive="cancelPanelSwipe"
            >
              <section class="now-playing">
                <img
                  v-if="currentTrack.cover_url"
                  ref="coverArtElement"
                  :src="imageVariantUrl(currentTrack.cover_url, 'lg')"
                  :srcset="imageVariantSrcset(currentTrack.cover_url)"
                  sizes="(max-width: 700px) 78vw, 360px"
                  class="interactive-cover"
                  :style="coverArtStyle"
                  alt=""
                  @load="updateCoverGlow"
                  @pointermove="tiltCover"
                  @pointerleave="resetCoverTilt"
                >
                <div v-else class="panel-cover-empty">
                  <svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" /></svg>
                </div>

                <div class="panel-track-row">
                  <div class="panel-track-copy">
                    <NuxtLink :to="localePath(`/music/tracks/${currentTrack.slug}`)" @click="closePanel">{{ currentTrack.title }}</NuxtLink>
                    <NuxtLink class="panel-artist-link" :to="localePath(`/music/artists/${currentTrack.artist_slug}`)" @click="closePanel">{{ currentTrack.artist_name }}</NuxtLink>
                    <NuxtLink
                      v-if="currentTrack.official_video_id"
                      class="watch-video-link"
                      :to="localePath(`/video/${currentTrack.official_video_id}`)"
                      @click="closePanel"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 8 5-8 5V7Z" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>
                      {{ t('music.player.watchVideo') }}
                    </NuxtLink>
                  </div>
                  <div v-if="audioLoading" class="panel-track-loading" role="status" :aria-label="t('music.player.loadingTrack')">
                    <span />
                    <span />
                    <span />
                  </div>
                  <img
                    v-if="isPlayingLossless"
                    :src="hiResAudioLogo"
                    class="panel-hi-res"
                    :alt="t('music.release.hiResAudio')"
                    :title="t('music.player.playingLossless')"
                  >
                </div>

                <div class="panel-timeline">
                  <input :value="state.currentTime" type="range" min="0" :max="state.duration || 0" step="0.1" :aria-label="t('music.player.trackPosition')" @input="seekFromInput">
                  <span>{{ formatTime(state.currentTime) }}</span>
                  <span>{{ formatTime(state.duration) }}</span>
                </div>

                <div class="panel-transport">
                  <button type="button" :class="{ active: state.shuffle }" :title="state.shuffle ? t('music.player.shuffleOff') : t('music.player.shuffleOn')" :aria-label="t('music.player.toggleShuffle')" @click="toggleShuffle">
                    <svg viewBox="0 0 24 24"><path d="M4 7h3c4 0 6 10 10 10h3M17 4l3 3-3 3M4 17h3c1.7 0 3-1.8 4.2-4M15 7h5M17 14l3 3-3 3" /></svg>
                  </button>
                  <button type="button" :title="t('music.player.previous')" :aria-label="t('music.player.previous')" @click="playPrevious">
                    <svg viewBox="0 0 24 24"><path d="M6 5v14M18 6l-9 6 9 6V6Z" /></svg>
                  </button>
                  <button type="button" class="panel-play" :title="state.playing ? t('music.player.pause') : t('music.player.play')" :aria-label="state.playing ? t('music.player.pause') : t('music.player.play')" @click="togglePlayback">
                    <svg v-if="state.playing" viewBox="0 0 24 24"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" /></svg>
                    <svg v-else viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z" /></svg>
                  </button>
                  <button type="button" :title="t('music.player.next')" :aria-label="t('music.player.next')" @click="playNext">
                    <svg viewBox="0 0 24 24"><path d="M18 5v14M6 6l9 6-9 6V6Z" /></svg>
                  </button>
                  <button type="button" :class="{ active: state.repeat !== 'off' }" :title="repeatTitle" :aria-label="t('music.player.changeRepeat')" @click="cycleRepeat">
                    <svg viewBox="0 0 24 24"><path d="m17 2 3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3m13-3v2a4 4 0 0 1-4 4H4" /></svg>
                    <span v-if="state.repeat === 'one'">1</span>
                  </button>
                </div>

                <label class="panel-volume">
                  <svg viewBox="0 0 24 24"><path d="M5 9v6h4l5 4V5L9 9H5Zm12.5.5a4 4 0 0 1 0 5M19.5 7a7 7 0 0 1 0 10" /></svg>
                  <input :value="state.volume" type="range" min="0" max="1" step="0.05" :aria-label="t('music.player.volume')" @input="setVolumeFromInput">
                </label>
              </section>

              <section v-if="hasLyrics" class="lyrics-panel" :aria-label="t('music.player.lyrics')">
                <div v-if="currentTrack.cover_url" class="lyrics-art-backdrop" aria-hidden="true">
                  <img :src="imageVariantUrl(currentTrack.cover_url, 'lg')" alt="">
                </div>
                <div class="lyrics-current-track">
                  <img v-if="currentTrack.cover_url" :src="imageVariantUrl(currentTrack.cover_url, 'sm')" alt="">
                  <div v-else class="lyrics-current-cover-empty" />
                  <div>
                    <NuxtLink :to="localePath(`/music/tracks/${currentTrack.slug}`)" @click="closePanel">{{ currentTrack.title }}</NuxtLink>
                    <NuxtLink :to="localePath(`/music/artists/${currentTrack.artist_slug}`)" @click="closePanel">{{ currentTrack.artist_name }}</NuxtLink>
                  </div>
                </div>
                <div ref="lyricsScrollElement" class="lyrics-scroll">
                  <template v-if="timedLyrics.length">
                    <button
                      v-for="(line, index) in timedLyrics"
                      :key="`${line.time}-${index}`"
                      :class="{
                        active: index === activeLyricIndex,
                        passed: index < activeLyricIndex,
                        upcoming: index > activeLyricIndex,
                      }"
                      class="lyrics-line karaoke-line"
                      type="button"
                      @click="seekTo(line.time)"
                    >
                      {{ line.text }}
                    </button>
                  </template>
                  <template v-else-if="plainLyricsLines.length">
                    <p v-for="(line, index) in plainLyricsLines" :key="`${line}-${index}`" class="lyrics-line">
                      {{ line }}
                    </p>
                  </template>
                  <div v-else class="lyrics-empty">
                    <strong>{{ t('music.player.noLyrics') }}</strong>
                    <span>{{ t('music.player.noLyricsBody') }}</span>
                  </div>
                </div>
              </section>

              <section class="queue-panel" :aria-label="t('music.player.playbackQueue')">
                <div class="queue-heading">
                  <div><strong>{{ t('music.player.upNext') }}</strong><span>{{ t('music.player.trackCount', state.queue.length, { count: state.queue.length }) }}</span></div>
                  <button type="button" @click="clearQueue">{{ t('music.player.clear') }}</button>
                </div>
                <ol>
                  <li v-for="(track, index) in state.queue" :key="`${track.id}-${index}`" :class="{ active: index === state.currentIndex }">
                    <button type="button" class="queue-select" @click="selectTrack(index, true)">
                      <img v-if="track.cover_url" :src="imageVariantUrl(track.cover_url, 'sm')" alt="">
                      <span>
                        <strong>{{ track.title }}</strong>
                        <small>{{ track.artist_name }}</small>
                      </span>
                    </button>
                    <div class="queue-actions">
                      <button type="button" :title="t('music.player.moveUp')" :aria-label="t('music.player.moveTrackUp')" :disabled="index === 0" @click="moveQueueItem(index, index - 1)">
                        <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" /></svg>
                      </button>
                      <button type="button" :title="t('music.player.moveDown')" :aria-label="t('music.player.moveTrackDown')" :disabled="index === state.queue.length - 1" @click="moveQueueItem(index, index + 1)">
                        <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                      <button type="button" :title="t('music.player.removeQueue')" :aria-label="t('music.player.removeTrackQueue')" @click="removeFromQueue(index)">
                        <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
                      </button>
                    </div>
                  </li>
                </ol>
              </section>
            </div>

            <nav class="panel-tabs" :aria-label="t('music.player.playerView')">
              <button type="button" class="mobile-player-tab" :class="{ active: state.panelView === 'player' }" :aria-pressed="state.panelView === 'player'" @click="setPanelView('player')">{{ t('music.player.nowPlaying') }}</button>
              <button v-if="hasLyrics" type="button" :class="{ active: state.panelView === 'lyrics' }" :aria-pressed="state.panelView === 'lyrics'" @click="setPanelView('lyrics')">{{ t('music.player.lyrics') }}</button>
              <button type="button" :class="{ active: state.panelView === 'queue' }" :aria-pressed="state.panelView === 'queue'" @click="setPanelView('queue')">{{ t('music.player.queue') }}</button>
            </nav>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocalePath } from '#i18n'
import { useMusicPlayer } from '~/app/composables/useMusicPlayer'
import type { MusicPanelView } from '~/app/composables/useMusicPlayer'
import { getMyAccount } from '~/app/service/auth'
import type { MusicQuality } from '~/app/service/auth'
import type { MusicTrack } from '~/app/service/music'
import { imageVariantSrcset, imageVariantUrl, resolveMediaUrl } from '~/app/utils/media'
import hiResAudioLogo from '~/assets/hi-res-audio.png'

const localePath = useLocalePath()
const { t } = useI18n()
const audioElement = ref<HTMLAudioElement | null>(null)
const coverArtElement = ref<HTMLImageElement | null>(null)
const lyricsScrollElement = ref<HTMLElement | null>(null)
const coverGlow = ref('rgba(239, 68, 68, 0.28)')
const coverTiltX = ref(0)
const coverTiltY = ref(0)
const coverIsTilting = ref(false)
const pendingRestoreTime = ref(0)
const lastPersistedAt = ref(0)
const musicQuality = ref<MusicQuality>('auto')
const musicQualityReady = ref(false)
const networkRevision = ref(0)
const sourceFallback = ref(false)
const audioLoading = ref(false)
const panelSwipeStartX = ref(0)
const panelSwipeStartY = ref(0)
const panelDragY = ref(0)
const panelGestureActive = ref(false)
const panelCanDismiss = ref(true)
const panelSwipeDeltaX = ref(0)
const panelHorizontalGesture = ref(false)
const miniPlayerSwipeStartX = ref(0)
const miniPlayerSwipeStartY = ref(0)
const suppressGestureClick = ref(false)
const {
  state,
  currentTrack,
  loadQueue,
  selectTrack,
  removeFromQueue,
  moveQueueItem,
  clearQueue,
  restore,
  persist,
  toggleShuffle,
  cycleRepeat,
  openPlayer,
  closePanel,
} = useMusicPlayer()
const validMusicQuality = (value: unknown): value is MusicQuality =>
  ['auto', 'low', 'medium', 'high', 'maximum'].includes(String(value))

const automaticQuality = (): MusicQuality => {
  if (!import.meta.client) return 'high'
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string; downlink?: number }
  }).connection
  if (!connection) return 'high'
  if (connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType || '')) return 'low'
  const downlink = Number(connection.downlink || 0)
  if (connection.effectiveType === '3g' || (downlink > 0 && downlink < 4)) return 'medium'
  if (downlink > 0 && downlink >= 12) return 'maximum'
  return 'high'
}

const losslessStreamUrl = (track: MusicTrack) => `/api/v1/music/audio/${track.id}/master`

const trackSourceForQuality = (track: MusicTrack, quality: MusicQuality) => {
  const selected = quality === 'auto' ? automaticQuality() : quality
  if (sourceFallback.value) {
    return track.audio_high_url || track.audio_medium_url || track.audio_low_url || track.audio_url
  }
  if (selected === 'low') {
    return track.audio_low_url || track.audio_medium_url || track.audio_high_url || track.audio_url
  }
  if (selected === 'medium') {
    return track.audio_medium_url || track.audio_low_url || track.audio_high_url || track.audio_url
  }
  if (selected === 'high') {
    return track.audio_high_url || track.audio_medium_url || track.audio_low_url || track.audio_url
  }
  return track.audio_url ? losslessStreamUrl(track) : track.audio_high_url || track.audio_medium_url || track.audio_low_url
}

const selectedAudioURL = computed(() => {
  networkRevision.value
  return currentTrack.value ? trackSourceForQuality(currentTrack.value, musicQuality.value) : ''
})
const isPlayingLossless = computed(() => Boolean(
  musicQualityReady.value
  &&
  currentTrack.value?.audio_lossless
  && currentTrack.value.audio_url
  && selectedAudioURL.value === losslessStreamUrl(currentTrack.value)
  && !sourceFallback.value,
))
const coverArtStyle = computed(() => ({
  '--cover-glow': coverGlow.value,
  '--cover-scale': state.value.playing ? '1.06' : '0.94',
  '--cover-tilt-x': `${coverTiltX.value}deg`,
  '--cover-tilt-y': `${coverTiltY.value}deg`,
  transition: coverIsTilting.value ? 'none' : undefined,
}))
const panelGestureStyle = computed(() => panelDragY.value > 0
  ? { '--panel-drag-y': `${panelDragY.value}px` }
  : undefined)
const repeatTitle = computed(() => {
  if (state.value.repeat === 'one') return t('music.player.repeatTrack')
  if (state.value.repeat === 'all') return t('music.player.repeatQueue')
  return t('music.player.repeatOff')
})
const lyricsText = computed(() => String(currentTrack.value?.synced_lyrics || currentTrack.value?.lyrics || '').trim())
const hasLyrics = computed(() => Boolean(lyricsText.value))
const mobilePanelViews = computed<MusicPanelView[]>(() => {
  const views: MusicPanelView[] = ['player']
  if (hasLyrics.value) views.push('lyrics')
  views.push('queue')
  return views
})
const panelTrackStyle = computed(() => {
  const views = mobilePanelViews.value
  const index = Math.max(0, views.indexOf(state.value.panelView))
  return {
    '--panel-count': views.length,
    '--panel-index': index,
    '--panel-track-width': `${views.length * 100}%`,
    '--panel-offset': `${-(index / views.length) * 100}%`,
    '--panel-swipe-x': `${panelSwipeDeltaX.value}px`,
  }
})
const timedLyrics = computed(() => {
  const timestampPattern = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g
  return lyricsText.value
    .split(/\r?\n/)
    .flatMap(line => {
      const timestamps = [...line.matchAll(timestampPattern)]
      const text = line.replace(timestampPattern, '').trim()
      if (!timestamps.length || !text) return []
      return timestamps.map(match => {
        const minutes = Number(match[1] || 0)
        const seconds = Number(match[2] || 0)
        const fraction = match[3] ? Number(`0.${match[3].padEnd(3, '0').slice(0, 3)}`) : 0
        return { time: minutes * 60 + seconds + fraction, text }
      })
    })
    .sort((left, right) => left.time - right.time)
})
const plainLyricsLines = computed(() => {
  if (!lyricsText.value || timedLyrics.value.length) return []
  return lyricsText.value.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
})
const activeLyricIndex = computed(() => {
  if (!timedLyrics.value.length) return -1
  const currentTime = Number(state.value.currentTime || 0)
  let active = 0
  for (let index = 0; index < timedLyrics.value.length; index += 1) {
    if (timedLyrics.value[index]?.time <= currentTime + 0.15) active = index
    else break
  }
  return active
})
const setPanelView = (view: MusicPanelView) => {
  state.value.panelView = view === 'lyrics' && !hasLyrics.value ? 'queue' : view
}
const openDefaultPlayer = () => {
  openPlayer('player')
}
const markGestureHandled = () => {
  suppressGestureClick.value = true
  window.setTimeout(() => {
    suppressGestureClick.value = false
  }, 0)
}
const suppressClickAfterSwipe = (event: MouseEvent) => {
  if (!suppressGestureClick.value) return
  event.preventDefault()
  event.stopPropagation()
}
const startMiniPlayerSwipe = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch || (event.target as HTMLElement | null)?.closest('input')) return
  miniPlayerSwipeStartX.value = touch.clientX
  miniPlayerSwipeStartY.value = touch.clientY
}
const finishMiniPlayerSwipe = (event: TouchEvent) => {
  const touch = event.changedTouches[0]
  if (!touch || !miniPlayerSwipeStartY.value) return
  const deltaX = touch.clientX - miniPlayerSwipeStartX.value
  const deltaY = touch.clientY - miniPlayerSwipeStartY.value
  miniPlayerSwipeStartX.value = 0
  miniPlayerSwipeStartY.value = 0
  if (deltaY > -54 || Math.abs(deltaY) < Math.abs(deltaX) * 1.2) return
  markGestureHandled()
  openDefaultPlayer()
}
const goToAdjacentPanel = (direction: 1 | -1) => {
  const views = mobilePanelViews.value
  const current = Math.max(0, views.indexOf(state.value.panelView))
  const target = views[current + direction]
  if (!target) return
  setPanelView(target)
}
const settleHorizontalPanel = (direction?: 1 | -1) => {
  panelHorizontalGesture.value = false
  window.requestAnimationFrame(() => {
    if (direction) goToAdjacentPanel(direction)
    panelSwipeDeltaX.value = 0
  })
}
const startPanelSwipe = (event: TouchEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, select, textarea, [data-no-panel-swipe]')) {
    panelSwipeStartX.value = 0
    panelSwipeStartY.value = 0
    return
  }
  const touch = event.touches[0]
  if (!touch) return
  panelSwipeStartX.value = touch.clientX
  panelSwipeStartY.value = touch.clientY
  panelDragY.value = 0
  panelGestureActive.value = true
  panelSwipeDeltaX.value = 0
  panelHorizontalGesture.value = false
  const scrollContainer = target?.closest('.lyrics-scroll, .queue-panel ol') as HTMLElement | null
  panelCanDismiss.value = !scrollContainer || scrollContainer.scrollTop <= 1
}
const movePanelSwipe = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch || !panelSwipeStartY.value) return
  const deltaX = touch.clientX - panelSwipeStartX.value
  const deltaY = touch.clientY - panelSwipeStartY.value
  if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 1.08) {
    const views = mobilePanelViews.value
    const current = Math.max(0, views.indexOf(state.value.panelView))
    const pullingPastStart = current === 0 && deltaX > 0
    const pullingPastEnd = current === views.length - 1 && deltaX < 0
    panelHorizontalGesture.value = true
    panelSwipeDeltaX.value = (pullingPastStart || pullingPastEnd) ? deltaX * 0.24 : deltaX
    panelDragY.value = 0
  } else if (!panelHorizontalGesture.value && panelCanDismiss.value && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
    panelDragY.value = Math.min(deltaY, window.innerHeight)
  } else if (!panelHorizontalGesture.value) {
    panelDragY.value = 0
  }
}
const finishPanelSwipe = (event: TouchEvent) => {
  const touch = event.changedTouches[0]
  if (!touch || !panelSwipeStartY.value) {
    cancelPanelSwipe()
    return
  }
  const deltaX = touch.clientX - panelSwipeStartX.value
  const deltaY = touch.clientY - panelSwipeStartY.value
  panelSwipeStartX.value = 0
  panelSwipeStartY.value = 0
  panelGestureActive.value = false
  if (panelHorizontalGesture.value) {
    let direction: 1 | -1 | undefined
    if (Math.abs(deltaX) >= 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      markGestureHandled()
      direction = deltaX < 0 ? 1 : -1
    } else if (Math.abs(deltaX) > 8) {
      markGestureHandled()
    }
    settleHorizontalPanel(direction)
    return
  }
  if (panelCanDismiss.value && deltaY > 96 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
    markGestureHandled()
    closePanel()
    window.setTimeout(() => {
      panelDragY.value = 0
    }, 280)
    return
  }
  panelDragY.value = 0
  if (Math.abs(deltaX) < 64 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return
  markGestureHandled()
  goToAdjacentPanel(deltaX < 0 ? 1 : -1)
}
const cancelPanelSwipe = () => {
  const wasHorizontal = panelHorizontalGesture.value
  panelSwipeStartX.value = 0
  panelSwipeStartY.value = 0
  panelDragY.value = 0
  panelGestureActive.value = false
  panelCanDismiss.value = true
  if (wasHorizontal) settleHorizontalPanel()
  else {
    panelSwipeDeltaX.value = 0
    panelHorizontalGesture.value = false
  }
}

const loadCurrentAudio = async (autoplay: boolean) => {
  await nextTick()
  if (!audioElement.value) return
  audioLoading.value = true
  audioElement.value.load()
  audioElement.value.volume = state.value.volume
  if (autoplay) {
    try {
      await audioElement.value.play()
    } catch {
      state.value.playing = false
    }
  }
}

const reloadCurrentSource = async () => {
  if (!audioElement.value || !currentTrack.value) return
  const resumeAt = Number(audioElement.value.currentTime || state.value.currentTime || 0)
  const autoplay = !audioElement.value.paused || state.value.playing
  pendingRestoreTime.value = resumeAt
  await loadCurrentAudio(autoplay)
}

const onAudioError = async () => {
  if (!currentTrack.value || sourceFallback.value) {
    audioLoading.value = false
    return
  }
  if (selectedAudioURL.value !== losslessStreamUrl(currentTrack.value) || !currentTrack.value.audio_high_url) {
    audioLoading.value = false
    return
  }
  sourceFallback.value = true
  await reloadCurrentSource()
}

const onAudioLoadStart = () => {
  audioLoading.value = Boolean(currentTrack.value)
}

const onAudioWaiting = () => {
  audioLoading.value = Boolean(currentTrack.value)
}

const onAudioReady = () => {
  audioLoading.value = false
}

const getAdjacentIndex = (direction: 1 | -1) => {
  const length = state.value.queue.length
  if (!length) return -1
  if (state.value.shuffle && length > 1) {
    let index = state.value.currentIndex
    while (index === state.value.currentIndex) index = Math.floor(Math.random() * length)
    return index
  }
  const target = state.value.currentIndex + direction
  if (target >= 0 && target < length) return target
  return state.value.repeat === 'all' ? (direction > 0 ? 0 : length - 1) : -1
}

const playNext = () => {
  const index = getAdjacentIndex(1)
  if (index < 0) {
    audioElement.value?.pause()
    state.value.currentTime = state.value.duration
    persist()
    return
  }
  selectTrack(index, true)
}

const playPrevious = () => {
  if (Number(audioElement.value?.currentTime || 0) > 3) {
    seekTo(0)
    return
  }
  const index = getAdjacentIndex(-1)
  if (index >= 0) selectTrack(index, true)
  else seekTo(0)
}

const onEnded = () => {
  if (state.value.repeat === 'one') {
    seekTo(0)
    audioElement.value?.play()
    return
  }
  playNext()
}

const togglePlayback = async () => {
  if (!audioElement.value) return
  if (audioElement.value.paused) {
    try {
      await audioElement.value.play()
    } catch {
      state.value.playing = false
    }
  } else {
    audioElement.value.pause()
  }
}

const tiltCover = (event: PointerEvent) => {
  const element = coverArtElement.value
  if (!element || event.pointerType === 'touch') return
  const bounds = element.getBoundingClientRect()
  const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
  const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
  coverIsTilting.value = true
  coverTiltX.value = vertical * -22
  coverTiltY.value = horizontal * 22
}

const resetCoverTilt = () => {
  coverIsTilting.value = false
  coverTiltX.value = 0
  coverTiltY.value = 0
}

const updateCoverGlow = () => {
  const image = coverArtElement.value
  if (!image || !image.naturalWidth) return
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 48
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const colors = new Map<string, { score: number; samples: number; red: number; green: number; blue: number }>()
    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index] || 0
      const green = pixels[index + 1] || 0
      const blue = pixels[index + 2] || 0
      const alpha = pixels[index + 3] || 0
      const brightest = Math.max(red, green, blue)
      const darkest = Math.min(red, green, blue)
      if (alpha < 180 || brightest < 28 || darkest > 235) continue
      const key = `${Math.round(red / 24)},${Math.round(green / 24)},${Math.round(blue / 24)}`
      const color = colors.get(key) || { score: 0, samples: 0, red: 0, green: 0, blue: 0 }
      color.score += 1 + (brightest - darkest) / 80
      color.samples += 1
      color.red += red
      color.green += green
      color.blue += blue
      colors.set(key, color)
    }
    const dominant = [...colors.values()].sort((left, right) => right.score - left.score)[0]
    if (!dominant) return
    coverGlow.value = `rgba(${Math.round(dominant.red / dominant.samples)}, ${Math.round(dominant.green / dominant.samples)}, ${Math.round(dominant.blue / dominant.samples)}, 0.52)`
  } catch {
    coverGlow.value = 'rgba(239, 68, 68, 0.28)'
  }
}

const seekTo = (value: number) => {
  const safeValue = Math.min(Math.max(0, value), state.value.duration || value)
  if (audioElement.value) audioElement.value.currentTime = safeValue
  state.value.currentTime = safeValue
  updateMediaPosition()
}

const seekFromInput = (event: Event) => seekTo(Number((event.target as HTMLInputElement).value))

const setVolumeFromInput = (event: Event) => {
  const volume = Math.min(1, Math.max(0, Number((event.target as HTMLInputElement).value)))
  if (audioElement.value) audioElement.value.volume = volume
  state.value.volume = volume
  persist()
}

const onLoadedMetadata = () => {
  state.value.duration = Number(audioElement.value?.duration || currentTrack.value?.duration_seconds || 0)
  if (pendingRestoreTime.value > 0 && audioElement.value) {
    audioElement.value.currentTime = Math.min(pendingRestoreTime.value, state.value.duration || pendingRestoreTime.value)
    state.value.currentTime = audioElement.value.currentTime
    pendingRestoreTime.value = 0
  }
  updateMediaPosition()
}

const onTimeUpdate = () => {
  state.value.currentTime = Number(audioElement.value?.currentTime || 0)
  updateMediaPosition()
  const now = Date.now()
  if (now - lastPersistedAt.value > 2000) {
    lastPersistedAt.value = now
    persist()
  }
}

const onPlay = () => {
  state.value.playing = true
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
}

const onPause = () => {
  state.value.playing = false
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  persist()
}

const updateMediaMetadata = () => {
  if (!('mediaSession' in navigator) || !currentTrack.value || typeof MediaMetadata === 'undefined') return
  const artwork = currentTrack.value.cover_url
    ? [
        { src: resolveMediaUrl(imageVariantUrl(currentTrack.value.cover_url, 'sm')), sizes: '160x160' },
        { src: resolveMediaUrl(imageVariantUrl(currentTrack.value.cover_url, 'md')), sizes: '320x320' },
        { src: resolveMediaUrl(imageVariantUrl(currentTrack.value.cover_url, 'lg')), sizes: '640x640' },
      ]
    : []
  navigator.mediaSession.metadata = new MediaMetadata({
    title: currentTrack.value.title,
    artist: currentTrack.value.artist_name,
    album: currentTrack.value.release_title,
    artwork,
  })
}

const updateMediaPosition = () => {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return
  const duration = Number(state.value.duration)
  if (!Number.isFinite(duration) || duration <= 0) return
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: audioElement.value?.playbackRate || 1,
      position: Math.min(Math.max(0, state.value.currentTime), duration),
    })
  } catch {
    // Some browsers reject position updates while metadata is loading.
  }
}

const setMediaAction = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {
    // Unsupported Media Session actions vary between browsers.
  }
}

const installMediaSession = () => {
  setMediaAction('play', () => audioElement.value?.play())
  setMediaAction('pause', () => audioElement.value?.pause())
  setMediaAction('nexttrack', playNext)
  setMediaAction('previoustrack', playPrevious)
  setMediaAction('seekto', details => seekTo(Number(details.seekTime || 0)))
  setMediaAction('seekforward', details => seekTo(state.value.currentTime + Number(details.seekOffset || 10)))
  setMediaAction('seekbackward', details => seekTo(state.value.currentTime - Number(details.seekOffset || 10)))
}

const handleCommand = async (event: Event) => {
  const command = (event as CustomEvent).detail
  if (!command) return
  if (command.type === 'close') {
    audioElement.value?.pause()
    localStorage.removeItem('giltube_music_player_v2')
    closePanel()
    return
  }
  if (!audioElement.value) return
  if (command.type === 'load') await loadCurrentAudio(Boolean(command.autoplay))
  if (command.type === 'play') await audioElement.value.play()
  if (command.type === 'pause') audioElement.value.pause()
  if (command.type === 'toggle') await togglePlayback()
  if (command.type === 'next') playNext()
  if (command.type === 'previous') playPrevious()
  if (command.type === 'seek') seekTo(Number(command.value || 0))
  if (command.type === 'volume') {
    audioElement.value.volume = Math.min(1, Math.max(0, Number(command.value)))
    state.value.volume = audioElement.value.volume
  }
  persist()
}

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

watch(currentTrack, () => {
  sourceFallback.value = false
  if (!hasLyrics.value && state.value.panelView === 'lyrics') state.value.panelView = 'queue'
  resetCoverTilt()
  updateMediaMetadata()
  persist()
})

watch(hasLyrics, value => {
  if (!value && state.value.panelView === 'lyrics') state.value.panelView = 'queue'
})

watch(musicQuality, async () => {
  sourceFallback.value = false
  await reloadCurrentSource()
})

const handleMusicQualityChanged = (event: Event) => {
  const quality = (event as CustomEvent).detail
  if (validMusicQuality(quality)) musicQuality.value = quality
}

const handleConnectionChanged = () => {
  if (musicQuality.value !== 'auto') return
  networkRevision.value += 1
  reloadCurrentSource()
}

watch(() => state.value.panelOpen, isOpen => {
  document.documentElement.style.overflow = isOpen ? 'hidden' : ''
})

const scrollToActiveLyric = async (behavior: ScrollBehavior) => {
  if (activeLyricIndex.value < 0 || state.value.panelView !== 'lyrics' || !state.value.panelOpen) return
  await nextTick()
  const container = lyricsScrollElement.value
  const activeLine = container?.querySelector('.karaoke-line.active') as HTMLElement | null
  if (!container || !activeLine) return
  const targetTop = activeLine.offsetTop - ((container.clientHeight - activeLine.offsetHeight) / 2)
  container.scrollTo({
    top: Math.max(0, targetTop),
    left: 0,
    behavior,
  })
}

watch(activeLyricIndex, async index => {
  if (index < 0) return
  await scrollToActiveLyric('smooth')
})

watch(
  [() => state.value.panelView, () => state.value.panelOpen],
  ([view, isOpen], [previousView, wasOpen]) => {
    if (view !== 'lyrics' || !isOpen || (view === previousView && wasOpen)) return
    void scrollToActiveLyric('auto')
  },
)

onMounted(async () => {
  const cachedQuality = localStorage.getItem('giltube_music_quality')
  if (validMusicQuality(cachedQuality)) musicQuality.value = cachedQuality
  window.addEventListener('giltube-music-command', handleCommand)
  window.addEventListener('giltube-music-quality-changed', handleMusicQualityChanged)
  window.addEventListener('beforeunload', persist)
  const connection = (navigator as Navigator & { connection?: EventTarget }).connection
  connection?.addEventListener('change', handleConnectionChanged)
  installMediaSession()
  if (restore()) {
    pendingRestoreTime.value = state.value.currentTime
    await loadCurrentAudio(false)
    updateMediaMetadata()
  }
  if (localStorage.getItem('user_id')) {
    try {
      const account = await getMyAccount()
      if (validMusicQuality(account.music_quality)) {
        localStorage.setItem('giltube_music_quality', account.music_quality)
        musicQuality.value = account.music_quality
      }
    } catch {
      // Playback continues with the cached/default quality when account sync is unavailable.
    } finally {
      musicQualityReady.value = true
    }
  } else {
    musicQualityReady.value = true
  }
})

onBeforeUnmount(() => {
  persist()
  window.removeEventListener('giltube-music-command', handleCommand)
  window.removeEventListener('giltube-music-quality-changed', handleMusicQualityChanged)
  window.removeEventListener('beforeunload', persist)
  const connection = (navigator as Navigator & { connection?: EventTarget }).connection
  connection?.removeEventListener('change', handleConnectionChanged)
  document.documentElement.style.overflow = ''
  audioElement.value?.pause()
})
</script>

<style scoped>
.global-music-player {
  position: fixed;
  z-index: 68;
  right: 16px;
  bottom: 16px;
  display: grid;
  width: min(38rem, calc(100vw - 32px));
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  border: 1px solid rgb(63 63 70);
  border-radius: 8px;
  background: rgb(9 9 11 / 0.97);
  padding: 8px;
  box-shadow: 0 14px 50px rgb(0 0 0 / 0.6);
  backdrop-filter: blur(16px);
}

.mini-track {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 10px;
  text-align: left;
}

.mini-track img,
.mini-cover-empty {
  width: 48px;
  height: 48px;
  flex: none;
  border-radius: 5px;
  background: rgb(39 39 42);
  object-fit: cover;
}

.track-copy {
  flex: 1;
  min-width: 0;
}

.track-copy strong,
.track-copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-copy strong {
  color: white;
  font-size: 0.875rem;
}

.track-copy small {
  margin-top: 2px;
  color: rgb(161 161 170);
  font-size: 0.75rem;
}

.mini-controls,
.panel-transport,
.queue-actions {
  display: flex;
  align-items: center;
}

.mini-controls {
  gap: 2px;
}

.mini-controls button,
.panel-close,
.panel-transport button,
.queue-actions button {
  display: grid;
  place-items: center;
  color: white;
}

.mini-controls button {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.mini-controls button:hover,
.panel-close:hover,
.panel-transport button:hover,
.queue-actions button:hover:not(:disabled) {
  background: rgb(39 39 42);
}

.mini-controls .play,
.panel-transport .panel-play {
  background: white;
  color: black;
}

svg {
  width: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.play svg,
.panel-play svg {
  fill: currentColor;
  stroke: none;
}

.mini-timeline {
  position: absolute;
  right: 0;
  bottom: -3px;
  left: 0;
  height: 6px;
}

.mini-timeline input {
  width: 100%;
  height: 6px;
  accent-color: rgb(239 68 68);
}

.music-panel-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 0.72);
  backdrop-filter: blur(8px);
}

.music-panel {
  position: relative;
  display: grid;
  width: min(64rem, 100%);
  max-height: min(48rem, calc(100dvh - 40px));
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid rgb(63 63 70);
  border-radius: 8px;
  background: rgb(9 9 11);
  box-shadow: 0 28px 90px rgb(0 0 0 / 0.75);
  transform: translateY(var(--panel-drag-y, 0));
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.panel-tabs {
  position: absolute;
  z-index: 8;
  bottom: 14px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100% - 32px);
  border: 1px solid rgb(39 39 42);
  border-radius: 999px;
  background: rgb(24 24 27 / 0.88);
  padding: 3px;
  box-shadow: 0 8px 28px rgb(0 0 0 / 0.36);
  transform: translateX(-50%);
  backdrop-filter: blur(18px);
}

.panel-tabs button {
  flex: none;
  border-radius: 999px;
  color: rgb(161 161 170);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 7px 10px;
  white-space: nowrap;
}

.panel-tabs button.active {
  background: rgb(63 63 70);
  color: white;
}

@media (hover: hover) {
  .panel-tabs button:hover {
    background: rgb(63 63 70);
    color: white;
  }
}

.mobile-player-tab {
  display: none;
}

.panel-close {
  position: absolute;
  z-index: 10;
  top: 14px;
  right: 14px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex: none;
  background: rgb(9 9 11 / 0.62);
  backdrop-filter: blur(14px);
}

.panel-layout {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(18rem, 0.9fr) minmax(22rem, 1.1fr);
  touch-action: pan-y;
}

.panel-layout.panel-lyrics .queue-panel,
.panel-layout:not(.panel-lyrics) .lyrics-panel {
  display: none;
}

.now-playing {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid rgb(39 39 42);
  padding: 24px;
}

.now-playing > img,
.panel-cover-empty {
  width: min(100%, 22rem);
  aspect-ratio: 1;
  align-self: center;
  border-radius: 7px;
  background: rgb(39 39 42);
  object-fit: cover;
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.45);
}

.now-playing > img.interactive-cover {
  transform:
    perspective(1000px)
    rotateX(var(--cover-tilt-x))
    rotateY(var(--cover-tilt-y))
    scale(var(--cover-scale));
  transform-style: preserve-3d;
  box-shadow:
    0 24px 55px rgb(0 0 0 / 0.5),
    0 0 72px 12px var(--cover-glow);
  transition: transform 300ms ease, box-shadow 350ms ease;
  will-change: transform;
}

.panel-cover-empty {
  display: grid;
  place-items: center;
}

.panel-cover-empty svg {
  width: 25%;
  color: rgb(113 113 122);
}

.panel-track-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 1rem;
  margin-top: 26px;
}

.panel-track-copy {
  flex: 1;
  min-width: 0;
}

.panel-track-copy a {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-track-copy a:first-child {
  color: white;
  font-size: 1.15rem;
  font-weight: 800;
}

.panel-track-copy .panel-artist-link {
  margin-top: 3px;
  color: rgb(161 161 170);
  font-size: 0.875rem;
}

.panel-track-copy .watch-video-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  margin-top: 9px;
  color: rgb(244 244 245);
  font-size: 0.76rem;
  font-weight: 750;
}

.watch-video-link svg {
  width: 17px;
}

.panel-hi-res {
  width: 42px;
  height: 42px;
  flex: none;
  margin-left: auto;
  border-radius: 2px;
  object-fit: contain;
}

.panel-track-loading {
  display: flex;
  width: 28px;
  height: 28px;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 50%;
  background: rgb(39 39 42 / 0.78);
  color: rgb(248 113 113);
}

.panel-track-loading span {
  width: 3px;
  height: 11px;
  border-radius: 999px;
  background: currentColor;
  animation: track-loading-wave 780ms ease-in-out infinite;
  transform-origin: center;
}

.panel-track-loading span:nth-child(2) {
  animation-delay: 130ms;
}

.panel-track-loading span:nth-child(3) {
  animation-delay: 260ms;
}

@keyframes track-loading-wave {
  0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
  50% { transform: scaleY(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .panel-track-loading span {
    animation: none;
  }
}

.panel-timeline {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 12px;
  margin-top: 16px;
}

.panel-timeline input {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: rgb(239 68 68);
}

.panel-timeline span {
  color: rgb(113 113 122);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.panel-timeline span:last-child {
  text-align: right;
}

.panel-transport {
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.panel-transport button {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: rgb(161 161 170);
}

.panel-transport button.active {
  color: rgb(248 113 113);
}

.panel-transport .panel-play {
  width: 54px;
  height: 54px;
  color: black;
}

.panel-transport button span {
  position: absolute;
  font-size: 0.58rem;
  font-weight: 900;
}

.panel-volume {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px auto 0;
  width: min(14rem, 100%);
  color: rgb(161 161 170);
}

.panel-volume input {
  min-width: 0;
  flex: 1;
  accent-color: rgb(239 68 68);
}

.queue-panel {
  display: grid;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}

.queue-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(39 39 42);
  padding: 16px;
}

.queue-heading strong,
.queue-heading span {
  display: block;
}

.queue-heading strong {
  color: white;
}

.queue-heading span {
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.queue-heading button {
  color: rgb(248 113 113);
  font-size: 0.8rem;
  font-weight: 700;
}

.queue-panel ol {
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 68px;
}

.queue-panel li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border-bottom: 1px solid rgb(39 39 42 / 0.7);
}

.queue-panel li.active {
  background: rgb(24 24 27);
}

.queue-select {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
  padding: 10px 8px 10px 14px;
  text-align: left;
}

.queue-select img {
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 4px;
  object-fit: cover;
}

.queue-select span {
  min-width: 0;
}

.queue-select strong,
.queue-select small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-select strong {
  color: white;
  font-size: 0.875rem;
}

.queue-select small {
  color: rgb(113 113 122);
  font-size: 0.75rem;
}

.queue-actions {
  gap: 1px;
  padding-right: 8px;
}

.queue-actions button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: rgb(161 161 170);
}

.queue-actions button:disabled {
  opacity: 0.2;
}

.queue-actions svg {
  width: 15px;
}

.lyrics-panel {
  position: relative;
  display: grid;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
  background: rgb(9 9 11);
}

.lyrics-art-backdrop {
  position: absolute;
  z-index: 0;
  inset: -64px;
  overflow: hidden;
  background: rgb(9 9 11);
  pointer-events: none;
}

.lyrics-art-backdrop::after {
  position: absolute;
  content: '';
  inset: 0;
  background: rgb(9 9 11 / 0.48);
}

.lyrics-art-backdrop img {
  width: 100%;
  height: 100%;
  opacity: 0.62;
  object-fit: cover;
  filter: blur(52px) saturate(1.3);
  transform: scale(1.16);
}

.lyrics-current-track {
  position: absolute;
  z-index: 3;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 18px 68px 44px 22px;
  background: linear-gradient(to bottom, rgb(9 9 11 / 0.42), rgb(9 9 11 / 0.16) 58%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black 64%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 0%, black 64%, transparent 100%);
  backdrop-filter: blur(12px) saturate(1.15);
}

.lyrics-current-track img,
.lyrics-current-cover-empty {
  width: 48px;
  height: 48px;
  flex: none;
  border-radius: 5px;
  background: rgb(39 39 42 / 0.78);
  object-fit: cover;
  box-shadow: 0 8px 22px rgb(0 0 0 / 0.24);
}

.lyrics-current-track > div:last-child {
  min-width: 0;
}

.lyrics-current-track a {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lyrics-current-track a:first-child {
  color: white;
  font-size: 0.9rem;
  font-weight: 800;
}

.lyrics-current-track a:last-child {
  margin-top: 3px;
  color: rgb(228 228 231 / 0.76);
  font-size: 0.78rem;
}

.lyrics-scroll {
  position: relative;
  z-index: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 112px 28px 88px;
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
}

.lyrics-line {
  display: block;
  width: 100%;
  color: rgb(161 161 170);
  font-size: clamp(1.55rem, 3.2vw, 2.7rem);
  font-weight: 800;
  line-height: 1.2;
  text-align: left;
}

.lyrics-line + .lyrics-line {
  margin-top: 24px;
}

.karaoke-line {
  opacity: 0.52;
  transform: translateX(0) scale(1);
  transform-origin: left center;
  filter: blur(0);
  transition:
    color 420ms ease,
    opacity 420ms ease,
    transform 520ms cubic-bezier(0.18, 1.35, 0.34, 1),
    filter 420ms ease;
}

.karaoke-line.passed {
  opacity: 0.3;
  transform: translateX(-3px) scale(0.985);
}

.karaoke-line.upcoming {
  opacity: 0.5;
}

.karaoke-line:hover,
.karaoke-line:focus-visible {
  color: white;
  opacity: 0.82;
}

.karaoke-line:focus-visible {
  outline: 2px solid rgb(248 113 113);
  outline-offset: 4px;
}

.karaoke-line.active {
  color: white;
  opacity: 1;
  transform: translateX(10px) scale(1.035);
  text-shadow: 0 0 22px var(--cover-glow);
}

.lyrics-empty {
  display: grid;
  min-height: 100%;
  place-content: center;
  gap: 8px;
  color: rgb(161 161 170);
  text-align: center;
}

.lyrics-empty strong {
  color: white;
  font-size: 1.2rem;
}

.music-player-rise-enter-active,
.music-player-rise-leave-active,
.music-panel-fade-enter-active,
.music-panel-fade-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}

.music-player-rise-enter-from,
.music-player-rise-leave-to {
  transform: translateY(16px);
  opacity: 0;
}

.music-panel-fade-enter-from,
.music-panel-fade-leave-to {
  opacity: 0;
}

.music-panel-fade-enter-active .music-panel,
.music-panel-fade-leave-active .music-panel {
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.music-panel-fade-enter-from .music-panel,
.music-panel-fade-leave-to .music-panel {
  transform: translateY(36px);
}

.music-panel.panel-gesture-active {
  transition: none;
}

@media (max-width: 700px) {
  .global-music-player {
    right: 8px;
    bottom: calc(5.2rem + env(safe-area-inset-bottom, 0px));
    width: calc(100vw - 16px);
  }

  .mini-controls button:first-child,
  .mini-controls button:nth-child(3),
  .mini-controls button:nth-child(4) {
    display: none;
  }

  .music-panel-backdrop {
    display: block;
    padding: 0;
    background: rgb(9 9 11);
  }

  .music-panel {
    width: 100%;
    height: 100dvh;
    max-height: none;
    border: 0;
    border-radius: 0;
  }

  .panel-close {
    top: max(14px, env(safe-area-inset-top));
  }

  .mobile-player-tab {
    display: block;
  }

  .panel-tabs {
    bottom: max(16px, env(safe-area-inset-bottom));
    width: max-content;
    max-width: calc(100vw - 16px);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .panel-tabs::-webkit-scrollbar {
    display: none;
  }

  .panel-layout {
    display: grid;
    width: var(--panel-track-width);
    grid-template-columns: repeat(var(--panel-count), minmax(0, 1fr));
    grid-template-rows: minmax(0, 1fr);
    overflow: visible;
    transform: translateX(calc(var(--panel-offset) + var(--panel-swipe-x)));
    transition: transform 300ms cubic-bezier(0.2, 0.9, 0.25, 1);
    will-change: transform;
  }

  .panel-layout.panel-swipe-active {
    transition: none;
  }

  .now-playing {
    width: 100%;
    min-height: 100%;
    align-items: center;
    border-right: 0;
    border-bottom: 0;
    padding: 22px;
  }

  .now-playing > img,
  .panel-cover-empty {
    width: min(78vw, 24rem);
  }

  .queue-panel,
  .lyrics-panel {
    display: grid;
    width: 100%;
    min-height: 0;
  }

  .panel-layout.panel-lyrics .queue-panel,
  .panel-layout:not(.panel-lyrics) .lyrics-panel {
    display: grid;
  }

  .panel-track-row,
  .panel-timeline,
  .panel-volume {
    width: min(78vw, 24rem);
  }

  .panel-layout .now-playing,
  .panel-layout .lyrics-panel,
  .panel-layout .queue-panel {
    min-height: 100%;
  }

  .lyrics-scroll {
    padding: max(124px, calc(104px + env(safe-area-inset-top))) 22px max(92px, calc(76px + env(safe-area-inset-bottom)));
  }

  .lyrics-current-track {
    padding-top: max(18px, env(safe-area-inset-top));
    padding-bottom: 46px;
  }

  .lyrics-line {
    font-size: clamp(1.65rem, 7vw, 2.35rem);
  }

  .queue-heading {
    padding-top: max(66px, calc(48px + env(safe-area-inset-top)));
  }

  .music-panel-fade-enter-from .music-panel,
  .music-panel-fade-leave-to .music-panel {
    transform: translateY(100%);
  }
}
</style>
