<template>
  <main v-if="data" class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <NuxtLink :to="localePath(`/music/releases/${data.track.release_slug}`)" class="mb-5 inline-block text-sm text-zinc-400 hover:text-white">
      Back to {{ data.track.release_title }}
    </NuxtLink>
    <header class="mb-8 flex items-center gap-5">
      <img v-if="data.track.cover_url" :src="imageVariantUrl(data.track.cover_url, 'md')" :srcset="imageVariantSrcset(data.track.cover_url)" sizes="160px" class="h-32 w-32 rounded-md object-cover sm:h-40 sm:w-40" alt="">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase text-red-400">Track</p>
        <h1 class="overflow-wrap-anywhere text-3xl font-bold text-white sm:text-5xl">{{ data.track.title }}</h1>
        <NuxtLink :to="localePath(`/music/artists/${data.track.artist_slug}`)" class="mt-2 inline-block font-semibold text-zinc-200">{{ data.track.artist_name }}</NuxtLink>
      </div>
    </header>
    <MusicPlayer :tracks="[data.track]" :initial-track-id="data.track.id" />
    <dl class="mt-8 grid gap-x-8 gap-y-4 border-t border-zinc-800 pt-6 text-sm sm:grid-cols-2">
      <div v-if="data.track.isrc"><dt>ISRC</dt><dd>{{ data.track.isrc }}</dd></div>
      <div v-if="data.track.language"><dt>Language</dt><dd>{{ data.track.language }}</dd></div>
      <div v-if="data.track.release_label"><dt>Label</dt><dd>{{ data.track.release_label }}</dd></div>
      <div v-if="data.track.release_territories"><dt>Available territories</dt><dd>{{ data.track.release_territories }}</dd></div>
      <div v-if="data.track.release_copyright_text"><dt>Copyright</dt><dd>{{ data.track.release_copyright_text }}</dd></div>
      <div v-if="data.track.release_phonogram_text"><dt>Recording copyright</dt><dd>{{ data.track.release_phonogram_text }}</dd></div>
    </dl>
  </main>
  <div v-else-if="pending" class="p-12 text-center text-zinc-400">Loading track...</div>
  <div v-else class="p-12 text-center text-red-300">Track not found.</div>
</template>

<script setup lang="ts">
import { useLocalePath } from '#i18n'
import MusicPlayer from '~/app/components/music/MusicPlayer.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { getMusicTrack } from '~/app/service/music'
import { imageVariantSrcset, imageVariantUrl } from '~/app/utils/media'

const route = useRoute()
const localePath = useLocalePath()
const { data, pending } = await useAsyncData(
  `music-track-${route.params.slug}`,
  () => getMusicTrack(String(route.params.slug)),
)

if (data.value) {
  const track = data.value.track
  useMetaTags({
    title: `${track.title} by ${track.artist_name} - GilTube Music`,
    description: `${track.title} by ${track.artist_name}, from ${track.release_title}. Listen on GilTube Music.`,
    image: imageVariantUrl(track.cover_url, 'lg'),
    imageAlt: `${track.release_title} by ${track.artist_name} cover art`,
    imageWidth: track.cover_url ? 1280 : undefined,
    imageHeight: track.cover_url ? 1280 : undefined,
    url: localePath(`/music/tracks/${track.slug}`),
    type: 'music.song',
  })
} else {
  useHead({ title: 'Track - GilTube Music' })
}
</script>

<style scoped>
dt {
  color: rgb(113 113 122);
}

dd {
  margin-top: 3px;
  color: rgb(212 212 216);
}

.overflow-wrap-anywhere {
  overflow-wrap: anywhere;
}
</style>
