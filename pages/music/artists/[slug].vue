<template>
  <main v-if="data" class="min-h-screen">
    <header class="artist-header" :style="bannerStyle">
      <div class="artist-header-shade" />
      <div class="artist-header-content">
        <AvatarFallback :src="resolveAvatarUrl(data.artist.avatar_url)" :name="data.artist.name" class="artist-avatar" />
        <div>
          <p>Artist</p>
          <h1>{{ data.artist.name }}</h1>
          <NuxtLink v-if="data.artist.primary_channel_id" :to="localePath(`/channel/${data.artist.primary_channel_id}`)">View primary channel</NuxtLink>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p v-if="data.artist.bio" class="mb-8 max-w-3xl text-zinc-300">{{ data.artist.bio }}</p>
      <h2 class="mb-4 text-xl font-bold text-white">Releases</h2>
      <div class="release-grid">
        <NuxtLink v-for="release in data.releases" :key="release.id" :to="localePath(`/music/releases/${release.slug}`)">
          <img v-if="release.cover_url" :src="imageVariantUrl(release.cover_url, 'md')" :srcset="imageVariantSrcset(release.cover_url)" sizes="220px" :alt="`${release.title} cover`">
          <div v-else class="cover-placeholder" />
          <strong>{{ release.title }}</strong>
          <span>{{ release.release_type }} · {{ release.track_count }} {{ release.track_count === 1 ? 'track' : 'tracks' }}</span>
        </NuxtLink>
      </div>
    </div>
  </main>
  <div v-else-if="pending" class="p-12 text-center text-zinc-400">Loading artist...</div>
  <div v-else class="p-12 text-center text-red-300">Artist not found.</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocalePath } from '#i18n'
import AvatarFallback from '~/app/components/AvatarFallback.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { getMusicArtist } from '~/app/service/music'
import { imageVariantSrcset, imageVariantUrl, resolveAvatarUrl, resolveMediaUrl } from '~/app/utils/media'

const route = useRoute()
const localePath = useLocalePath()
const { data, pending } = await useAsyncData(
  `music-artist-${route.params.slug}`,
  () => getMusicArtist(String(route.params.slug)),
)
const bannerStyle = computed(() => data.value?.artist.banner_url
  ? { backgroundImage: `url("${resolveMediaUrl(data.value.artist.banner_url)}")` }
  : {})

if (data.value) {
  const artist = data.value.artist
  const previewImage = artist.banner_url || artist.avatar_url
  useMetaTags({
    title: `${artist.name} - GilTube Music`,
    description: artist.bio || `Listen to music and releases by ${artist.name} on GilTube Music.`,
    image: previewImage ? imageVariantUrl(previewImage, 'lg') : undefined,
    imageAlt: `${artist.name} artist image`,
    url: localePath(`/music/artists/${artist.slug}`),
    type: 'profile',
  })
} else {
  useHead({ title: 'Artist - GilTube Music' })
}
</script>

<style scoped>
.artist-header {
  position: relative;
  min-height: 20rem;
  background-color: rgb(24 24 27);
  background-position: center;
  background-size: cover;
}

.artist-header-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(9 9 11) 0%, rgb(9 9 11 / 0.25) 70%);
}

.artist-header-content {
  position: relative;
  display: flex;
  align-items: end;
  gap: 20px;
  max-width: 80rem;
  min-height: 20rem;
  margin: auto;
  padding: 3rem 1.5rem;
}

.artist-avatar {
  width: 9rem;
  height: 9rem;
  flex: none;
  overflow: hidden;
  border: 3px solid white;
  border-radius: 50%;
}

.artist-header p {
  color: rgb(212 212 216);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.artist-header h1 {
  color: white;
  font-size: clamp(2.5rem, 7vw, 5rem);
  font-weight: 800;
  line-height: 1;
}

.artist-header a {
  display: inline-block;
  margin-top: 12px;
  color: rgb(212 212 216);
  font-size: 0.875rem;
}

.release-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(10rem, 42vw), 1fr));
  gap: 22px 16px;
}

.release-grid img,
.cover-placeholder {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  object-fit: cover;
  background: rgb(39 39 42);
}

.release-grid strong,
.release-grid span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.release-grid strong {
  margin-top: 10px;
  color: white;
}

.release-grid span {
  margin-top: 3px;
  color: rgb(113 113 122);
  font-size: 0.8rem;
  text-transform: capitalize;
}

@media (max-width: 640px) {
  .artist-header,
  .artist-header-content {
    min-height: 15rem;
  }

  .artist-header-content {
    align-items: center;
    padding: 2rem 1rem;
  }

  .artist-avatar {
    width: 6rem;
    height: 6rem;
  }
}
</style>
