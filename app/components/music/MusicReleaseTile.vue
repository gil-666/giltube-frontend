<template>
  <article class="release-tile">
    <div class="artwork-wrap">
      <NuxtLink :to="localePath(`/music/releases/${release.slug}`)" :aria-label="release.title">
        <img
          v-if="release.cover_url"
          :src="imageVariantUrl(release.cover_url, 'md')"
          :srcset="imageVariantSrcset(release.cover_url)"
          sizes="(max-width: 640px) 44vw, 190px"
          :alt="t('music.common.coverAlt', { title: release.title })"
        >
        <span v-else class="cover-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3v3Zm10-2a3 3 0 1 1-3-3h3v3Z" /></svg>
        </span>
      </NuxtLink>
      <button
        type="button"
        class="play-release"
        :class="{ busy }"
        :disabled="busy"
        :title="t('music.common.playRelease', { title: release.title })"
        :aria-label="t('music.common.playRelease', { title: release.title })"
        @click="$emit('play', release)"
      >
        <svg v-if="!busy" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z" /></svg>
        <span v-else class="spinner" />
      </button>
    </div>
    <NuxtLink :to="localePath(`/music/releases/${release.slug}`)" class="release-title">{{ release.title }}</NuxtLink>
    <NuxtLink :to="localePath(`/music/artists/${release.artist_slug}`)" class="artist-name">{{ release.artist_name }}</NuxtLink>
    <span class="release-meta">{{ release.release_type }} · {{ release.track_count }} {{ t(release.track_count === 1 ? 'music.common.track' : 'music.common.tracks') }}</span>
  </article>
</template>

<script setup lang="ts">
import { useLocalePath } from '#i18n'
import type { MusicRelease } from '~/app/service/music'
import { imageVariantSrcset, imageVariantUrl } from '~/app/utils/media'

defineProps<{
  release: MusicRelease
  busy?: boolean
}>()

defineEmits<{
  play: [release: MusicRelease]
}>()

const localePath = useLocalePath()
const { t } = useI18n()
</script>

<style scoped>
.release-tile {
  width: clamp(9.5rem, 15vw, 12rem);
  min-width: clamp(9.5rem, 15vw, 12rem);
  scroll-snap-align: start;
}

.artwork-wrap {
  position: relative;
}

.artwork-wrap > a,
.artwork-wrap img,
.cover-placeholder {
  display: block;
  width: 100%;
  aspect-ratio: 1;
}

.artwork-wrap img,
.cover-placeholder {
  border-radius: 6px;
  background: rgb(39 39 42);
  object-fit: cover;
}

.cover-placeholder {
  display: grid;
  place-items: center;
}

.cover-placeholder svg {
  width: 25%;
  fill: none;
  stroke: rgb(113 113 122);
  stroke-width: 1.5;
}

.play-release {
  position: absolute;
  right: 9px;
  bottom: 9px;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 50%;
  background: rgb(239 68 68);
  color: white;
  opacity: 0;
  box-shadow: 0 8px 22px rgb(0 0 0 / 0.55);
  transform: translateY(5px);
  transition: opacity 150ms ease, transform 150ms ease, background 150ms ease;
}

.release-tile:hover .play-release,
.play-release:focus-visible,
.play-release.busy {
  opacity: 1;
  transform: translateY(0);
}

.play-release:hover {
  background: rgb(220 38 38);
}

.play-release svg {
  width: 20px;
  fill: currentColor;
}

.spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgb(255 255 255 / 0.45);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.release-title,
.artist-name,
.release-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.release-title {
  margin-top: 9px;
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
}

.artist-name {
  margin-top: 2px;
  color: rgb(161 161 170);
  font-size: 0.8rem;
}

.artist-name:hover {
  color: white;
}

.release-meta {
  margin-top: 2px;
  color: rgb(113 113 122);
  font-size: 0.72rem;
  text-transform: capitalize;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (hover: none) {
  .play-release {
    width: 38px;
    height: 38px;
    opacity: 1;
    transform: none;
  }
}
</style>
