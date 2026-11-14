<template>
  <div class="geels-page">
    <GeelFeed sync-url />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMetaTags } from '~/app/composables/useMetaTags'
import GeelFeed from '~/app/components/geels/GeelFeed.vue'

const { t } = useI18n()
useMetaTags({ title: `${t('geels.title')} · GilTube`, description: t('geels.metaDescription'), url: '/geels' })
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
