<template>
  <div class="geels-page">
    <GeelFeed :key="id" :start-id="id" :channel="channel" :sound="sound" sync-url />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMetaTags } from '~/app/composables/useMetaTags'
import GeelFeed from '~/app/components/geels/GeelFeed.vue'
import { getGeel } from '~/app/service/geels'

const route = useRoute()
const { t } = useI18n()
const id = route.params.id as string
// Opened from a channel or sound page: keep scrolling within it.
const channel = typeof route.query.channel === 'string' ? route.query.channel : undefined
const sound = typeof route.query.sound === 'string' ? route.query.sound : undefined

const { data: geel } = await useAsyncData(`geel-${id}`, () => getGeel(id).catch(() => null))
useMetaTags({
  title: geel.value ? `${geel.value.title} · ${t('geels.title')}` : `${t('geels.title')} · GilTube`,
  description: geel.value?.description || t('geels.metaDescription'),
  image: geel.value?.thumbnail_url || undefined,
  imageWidth: 1080,
  imageHeight: 1920,
  url: `/geels/${id}`,
  type: 'video.other',
  twitterCard: 'summary',
})
</script>

<style scoped>
.geels-page {
  height: calc(100dvh - var(--gt-shell-top, 4rem) - var(--gt-shell-bottom, 0px));
  min-height: 420px;
}
@media (max-width: 767px) {
  .geels-page { background: #000; }
}
</style>
